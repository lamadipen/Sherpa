import '@babylonjs/loaders/glTF';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  ParticleSystem,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  TransformNode,
  VertexBuffer,
  VertexData,
  Vector3
} from '@babylonjs/core';
import { HimalayanProps } from '../entities/HimalayanProps.js';
import { KarmaPlayer } from '../entities/KarmaPlayer.js';
import { GameAudio } from '../audio/GameAudio.js';

const ASSET_ROOT = '/assets/vendor/kenney/nature-kit/Models/GLTF%20format/';
const BASE_FOG_DENSITY = 0.0011;
const BASE_SNOW_RATE = 440;
const SNOW_PARTICLE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAQAAACFSYyZAAAAEElEQVR42mP8z8AARLJAhQIAHhMD/WSW4hsAAAAASUVORK5CYII=';

export class GameScene {
  constructor(canvas, uiRoot, levels) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.levels = levels;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.input = {
      forward: false,
      back: false,
      left: false,
      right: false,
      rest: false,
      crouch: false,
      jumpPressed: false,
      dodgePressed: false,
      toolPressed: false
    };
    this.state = 'menu';
    this.levelIndex = 0;
    this.metrics = this.defaultMetrics();
    this.hazards = [];
    this.props = [];
    this.tools = [];
    this.toolLine = null;
    this.toolLineTimer = 0;
    this.loadedAssets = new Map();
    this.cameraBob = 0;
    this.cameraDanger = 0;
    this.cameraShake = 0;
    this.summitTimer = 0;
    this.blizzardPressure = 0;
    this.comboTimer = 0;
    this.flowBoostTimer = 0;
    this.fallTimer = 0;
    this.fallTarget = null;
    this.tutorialSeen = new Set();
    this.currentTutorialPrompt = null;
    this.audio = new GameAudio();
    this.lang = localStorage.getItem('sherpa.lang') || 'en';
    this.records = JSON.parse(localStorage.getItem('sherpa.records') || '{}');
  }

  async start() {
    this.setupScene();
    this.bindInput();
    this.renderMenu();
    await this.preloadAssets();
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
    window.addEventListener('resize', () => this.engine.resize());
  }

  setupScene() {
    this.scene.clearColor = Color4.FromHexString('#b9ddf4ff');
    this.camera = new ArcRotateCamera('camera', Math.PI / 2, 1.1, 30, new Vector3(0, 3, -70), this.scene);
    this.camera.lowerRadiusLimit = 16;
    this.camera.upperRadiusLimit = 58;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.maxZ = 1200;
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = BASE_FOG_DENSITY;
    this.scene.fogColor = Color3.FromHexString('#b9ddf4');

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.92;
    hemi.groundColor = Color3.FromHexString('#536372');

    const sun = new DirectionalLight('sun', new Vector3(-0.45, -0.85, 0.35), this.scene);
    sun.intensity = 1.6;
    sun.diffuse = Color3.FromHexString('#fff0cf');

    this.player = new KarmaPlayer(this.scene);
    this.himalayanProps = new HimalayanProps(this.scene);
    this.createMaterials();
    this.createSnow();
  }

  createMaterials() {
    this.materials = {
      snow: this.mat('snow', '#e7eef2'),
      pathSnow: this.mat('pathSnow', '#f8fbff'),
      ridge: this.mat('ridge', '#8fa1ad'),
      farRidge: this.mat('farRidge', '#647987'),
      farSnow: this.mat('farSnow', '#f4fbff'),
      rock: this.mat('rock', '#4c5a61'),
      shadowRock: this.mat('shadowRock', '#334149'),
      horizonRock: this.mat('horizonRock', '#2f4654'),
      rope: this.mat('routeRope', '#ffcf5a'),
      anchor: this.mat('routeAnchor', '#29343c'),
      routeFlag: this.mat('routeFlag', '#d62839'),
      routeGlow: this.mat('routeGlow', '#ffef9f', 0.46),
      ice: this.mat('ice', '#73c7df', 0.58),
      hazard: this.mat('hazard', '#101927'),
      crevasseEdge: this.mat('crevasseEdge', '#07111c'),
      crevasseIce: this.mat('crevasseIce', '#5bbfd4', 0.68),
      avalanche: this.mat('avalanche', '#ffffff'),
      avalancheShadow: this.mat('avalancheShadow', '#cad9df', 0.78),
      hazardMarker: this.mat('hazardMarker', '#ff4056'),
      blizzardWind: this.mat('blizzardWind', '#dff4ff', 0.34),
      spirit: this.mat('spirit', '#80ffe0', 0.45),
      checkpoint: this.mat('checkpoint', '#ffcf5a'),
      tool: this.mat('toolPickup', '#2f6f73'),
      toolMetal: this.mat('toolMetal', '#d7e6ec'),
      toolGlow: this.mat('toolGlow', '#35f0c7', 0.5),
      oxygenTank: this.mat('oxygenTank', '#4aa8ff'),
      soup: this.mat('soup', '#b85c38'),
      cookPot: this.mat('cookPot', '#1f2833'),
      steam: this.mat('steam', '#e8f5ff', 0.36),
      roundedTent: this.mat('roundedTent', '#f2c94c'),
      roundedTentDoor: this.mat('roundedTentDoor', '#17202a')
    };
  }

  mat(name, hex, alpha = 1) {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(hex);
    material.specularColor = Color3.FromHexString('#18202a');
    material.emissiveColor = Color3.FromHexString(hex).scale(0.06);
    material.backFaceCulling = false;
    material.alpha = alpha;
    return material;
  }

  createSnow() {
    const system = new ParticleSystem('snow', 1600, this.scene);
    system.particleTexture = new Texture(SNOW_PARTICLE, this.scene);
    system.emitter = new Vector3(0, 28, 0);
    system.minEmitBox = new Vector3(-80, 0, -120);
    system.maxEmitBox = new Vector3(80, 0, 280);
    system.color1 = new Color4(1, 1, 1, 0.9);
    system.color2 = new Color4(0.82, 0.93, 1, 0.65);
    system.minSize = 0.05;
    system.maxSize = 0.18;
    system.minLifeTime = 4;
    system.maxLifeTime = 9;
    system.emitRate = BASE_SNOW_RATE;
    system.gravity = new Vector3(-0.25, -1.2, -0.2);
    system.direction1 = new Vector3(-0.8, -1, -0.4);
    system.direction2 = new Vector3(0.4, -1, 0.2);
    system.start();
    this.snow = system;
  }

  async preloadAssets() {
    const environmentFiles = this.levels.flatMap((level) => level.environment?.propSet || []);
    const files = [
      'tent_detailedOpen.glb',
      'tent_detailedClosed.glb',
      'campfire_stones.glb',
      'tree_pineRoundC.glb',
      'stone_tallB.glb',
      'rock_tallH.glb',
      'bridge_wood.glb',
      ...environmentFiles
    ];
    await Promise.all(files.map((file) => this.loadAsset(file).catch(() => null)));
  }

  async loadAsset(file) {
    if (this.loadedAssets.has(file)) return this.loadedAssets.get(file);
    const result = await SceneLoader.ImportMeshAsync('', ASSET_ROOT, file, this.scene);
    const root = result.meshes[0];
    root.setEnabled(false);
    this.loadedAssets.set(file, root);
    return root;
  }

  cloneAsset(file, name, position, scale = 1, rotationY = 0) {
    const source = this.loadedAssets.get(file);
    if (!source) return null;
    const clone = source.clone(name, null, true);
    clone.setEnabled(true);
    clone.position = position;
    clone.scaling.setAll(scale);
    clone.rotation.y = rotationY;
    this.props.push(clone);
    return clone;
  }

  routeHeightAt(z, x = 0) {
    return this.terrainHeightAt(x, z);
  }

  routePosition(x, z, lift = 0) {
    return new Vector3(x, this.routeHeightAt(z, x) + lift, z);
  }

  cloneAssetOnRoute(file, name, x, z, scale = 1, rotationY = 0, lift = 0) {
    return this.cloneAsset(file, name, this.routePosition(x, z, lift), scale, rotationY);
  }

  routeProgressAt(z) {
    const level = this.level || { routeLength: 180 };
    return Math.max(0, Math.min(1, (z + 88) / level.routeLength));
  }

  routeCenterAt(z) {
    const progress = this.routeProgressAt(z);
    return Math.sin(progress * Math.PI * 2.15) * 7 + Math.sin(progress * Math.PI * 5.4) * 2.4;
  }

  terrainHeightAt(x, z) {
    const level = this.level || { routeLength: 180, difficulty: 1 };
    const progress = this.routeProgressAt(z);
    const center = this.routeCenterAt(z);
    const cross = x - center;
    const shoulder = Math.max(0, Math.abs(cross) - 7);
    const climb = progress ** 1.16 * (30 + level.difficulty * 10);
    const ridgeRise = shoulder * 0.58 + shoulder ** 1.22 * 0.13;
    const routeRoll = Math.sin(progress * Math.PI * 3.1) * 0.85;
    const roughness = Math.min(1, Math.abs(cross) / 26);
    const rockNoise =
      Math.sin(x * 0.17 + z * 0.083) * 0.9 +
      Math.sin(x * 0.41 - z * 0.047) * 0.55 +
      Math.sin(z * 0.19) * 0.35;
    return climb + ridgeRise + routeRoll + rockNoise * (0.18 + roughness * 1.05);
  }

  movementContextAt(position) {
    const sample = 1.8;
    const here = this.terrainHeightAt(position.x, position.z);
    const ahead = this.terrainHeightAt(position.x, position.z + sample);
    const behind = this.terrainHeightAt(position.x, position.z - sample);
    const left = this.terrainHeightAt(position.x - sample, position.z);
    const right = this.terrainHeightAt(position.x + sample, position.z);
    const progress = this.routeProgressAt(position.z);
    const routeCenter = this.routeCenterAt(position.z);
    const cross = position.x - routeCenter;
    const forwardSlope = (ahead - behind) / (sample * 2);
    const sideSlope = (right - left) / (sample * 2);
    const icy = Math.max(0, Math.sin(progress * Math.PI * 5.6 + this.level.difficulty) - 0.24);
    return {
      forwardSlope,
      sideSlope,
      steepness: Math.min(1, Math.abs(forwardSlope) / 0.36),
      icy,
      routeCenter,
      cross,
      height: here
    };
  }

  bindInput() {
    const set = (key, value) => {
      if (value) this.audio.unlock();
      const code = key.toLowerCase();
      if (code === 'w' || key === 'ArrowUp') this.input.forward = value;
      if (code === 's' || key === 'ArrowDown') this.input.back = value;
      if (code === 'a' || key === 'ArrowLeft') this.input.left = value;
      if (code === 'd' || key === 'ArrowRight') this.input.right = value;
      if (code === 'r') this.input.rest = value;
      if (code === 'c') this.input.crouch = value;
      if (code === 'e' && value) this.useCheckpoint();
    };
    window.addEventListener('keydown', (event) => {
      if ([' ', 'Shift'].includes(event.key)) event.preventDefault();
      if (!event.repeat && event.key === ' ') this.input.jumpPressed = true;
      if (!event.repeat && event.key === 'Shift') this.input.dodgePressed = true;
      if (!event.repeat && event.key.toLowerCase() === 'f') this.input.toolPressed = true;
      set(event.key, true);
    });
    window.addEventListener('keyup', (event) => set(event.key, false));
  }

  defaultMetrics() {
    return {
      oxygen: 100,
      stamina: 100,
      morale: 100,
      climbers: 3,
      time: 0,
      campIndex: 0,
      campReady: false,
      campsUsed: 0,
      hazardHits: 0,
      toolsCollected: 0,
      skillScore: 0,
      combo: 0,
      bestCombo: 0,
      climberRisk: 0,
      message: '',
      messageTimer: 0
    };
  }

  setMessage(message, duration = 5) {
    this.metrics.message = message;
    this.metrics.messageTimer = duration;
  }

  awardAction(label, points = 18, boost = 1.35) {
    this.metrics.combo = Math.min(12, this.metrics.combo + 1);
    this.metrics.bestCombo = Math.max(this.metrics.bestCombo, this.metrics.combo);
    this.metrics.skillScore += Math.round(points * (1 + (this.metrics.combo - 1) * 0.28));
    this.comboTimer = 4.2;
    this.flowBoostTimer = Math.max(this.flowBoostTimer, boost);
    this.metrics.morale = Math.min(100, this.metrics.morale + 1.2);
    this.setMessage(`${label} · x${this.metrics.combo} flow`, 2.6);
  }

  impactFeedback(hazard, pressure = 1) {
    const data = hazard.metadata || {};
    const strength = Math.min(1.25, 0.45 + pressure);
    this.cameraShake = Math.max(this.cameraShake, strength);
    this.comboTimer = 0;
    this.metrics.combo = 0;

    if (data.type === 'avalanche') {
      this.player.velocity.x += (data.side || 1) * 7.5 * strength;
      this.player.velocity.z -= 3.2 * strength;
      this.player.verticalVelocity = Math.max(this.player.verticalVelocity, 2.4 * strength);
      this.setMessage('Hit by avalanche. Regain the rope line.', 2.8);
      return;
    }

    if (data.type === 'crevasse') {
      const away = Math.sign(this.player.root.position.z - hazard.position.z || -1);
      this.player.velocity.z += away * 3.8 * strength;
      this.player.velocity.x += Math.sign(this.player.root.position.x - hazard.position.x || 1) * 2.4 * strength;
      this.setMessage('Stumble at the crevasse edge.', 2.4);
      return;
    }

    if (data.type === 'blizzard') {
      this.player.velocity.x += Math.sin(this.metrics.time * 4) * 3.8 * strength;
      this.setMessage('Whiteout blast. Hold C to stay low.', 2.6);
      return;
    }

    this.player.velocity.z -= 2.2 * strength;
  }

  campDefinitions() {
    return [
      { id: 'base', name: 'Base Camp', progress: 0, used: true },
      { id: 'camp1', name: 'Camp I', progress: 0.24, oxygen: 22, stamina: 34, morale: 10, used: false },
      { id: 'camp2', name: 'Camp II', progress: 0.52, oxygen: 30, stamina: 40, morale: 14, used: false },
      { id: 'summit-push', name: 'Summit Push', progress: 0.76, oxygen: 24, stamina: 34, morale: 18, used: false }
    ];
  }

  async beginLevel(index) {
    this.audio.unlock();
    this.levelIndex = index;
    this.level = this.levels[index];
    this.camps = this.campDefinitions();
    this.applyLevelEnvironment();
    this.state = 'playing';
    this.metrics = this.defaultMetrics();
    this.player.reset();
    this.player.root.position.x = this.routeCenterAt(this.player.root.position.z);
    this.scene.clearColor = Color4.FromHexString(`${this.level.sky}dd`);
    this.scene.fogDensity = BASE_FOG_DENSITY;
    this.blizzardPressure = 0;
    this.comboTimer = 0;
    this.flowBoostTimer = 0;
    this.tutorialSeen = new Set();
    this.currentTutorialPrompt = null;
    if (this.snow) this.snow.emitRate = BASE_SNOW_RATE;
    this.clearLevel();
    this.buildMountain();
    this.player.root.position.y = this.terrainHeightAt(this.player.root.position.x, this.player.root.position.z) + 0.7;
    this.spawnHazards();
    this.renderHud();
  }

  applyLevelEnvironment() {
    const env = this.level.environment || {};
    const accent = env.accent || this.level.color || '#ffcf5a';
    if (this.materials?.routeFlag) {
      this.materials.routeFlag.diffuseColor = Color3.FromHexString(accent);
      this.materials.routeFlag.emissiveColor = Color3.FromHexString(accent).scale(0.35);
    }
    if (this.materials?.checkpoint) this.materials.checkpoint.diffuseColor = Color3.FromHexString(accent);
    if (this.materials?.ice) this.materials.ice.diffuseColor = Color3.FromHexString(this.level.id === 'annapurna' ? '#90d8ef' : '#73c7df');
  }

  clearLevel() {
    [...this.hazards, ...this.props, ...this.tools].forEach((item) => item.dispose?.());
    this.toolLine?.dispose();
    this.toolLine = null;
    this.toolLineTimer = 0;
    this.hazards = [];
    this.props = [];
    this.tools = [];
    this.scene.meshes.filter((mesh) => mesh.name.startsWith('route-') || mesh.name.startsWith('summit')).forEach((mesh) => mesh.dispose());
  }

  buildMountain() {
    const level = this.level;
    this.createMountainTerrain();
    this.createClimbingRoute();
    this.createRouteMarkers();

    for (let i = 0; i < 42; i += 1) {
      const z = -82 + i * (level.routeLength / 42);
      const center = this.routeCenterAt(z);
      const width = 17 + Math.sin(i * 0.77) * 3;
      const ridgeL = MeshBuilder.CreateBox(`route-ridge-l-${i}`, { width: 7, height: 2.8 + i * 0.02, depth: 9 }, this.scene);
      ridgeL.position.set(center - width - 7, this.terrainHeightAt(center - width - 7, z) + 0.6, z);
      ridgeL.rotation.z = 0.22;
      ridgeL.material = this.materials.ridge;
      const ridgeR = ridgeL.clone(`route-ridge-r-${i}`);
      ridgeR.position.x = center + width + 7;
      ridgeR.position.y = this.terrainHeightAt(center + width + 7, z) + 0.6;
      ridgeR.rotation.z = -0.22;
    }

    const summit = MeshBuilder.CreateCylinder('summit-marker', { height: 8, diameterTop: 0, diameterBottom: 18, tessellation: 4 }, this.scene);
    const summitZ = level.routeLength - 82;
    const summitX = this.routeCenterAt(summitZ);
    summit.position.set(summitX, this.terrainHeightAt(summitX, summitZ) + 3.4, summitZ);
    summit.rotation.y = Math.PI / 4;
    summit.material = this.materials.ridge;
    this.createSummitCeremony(summitX, summitZ);
    this.buildHorizonPeaks();
    this.buildSurroundingMountains();

    this.cloneAssetOnRoute('campfire_stones.glb', 'basecamp-fire', this.routeCenterAt(-83) + 5, -83, 1.2, 0, 0.08);
    this.props.push(this.himalayanProps.createLodge('basecamp-lodge', this.routePosition(this.routeCenterAt(-88) - 14, -88, 0.2), { rotationY: -0.36 }));
    this.createExpeditionCamps();
    this.createEnvironmentIdentity();
    this.createToolPickups();
    this.props.push(this.himalayanProps.createPrayerFlags('route-prayer-flags', this.routePosition(this.routeCenterAt(-65) - 11, -65, 2.4), this.routePosition(this.routeCenterAt(-58) + 10, -58, 2.9)));
    for (let i = 0; i < 24; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -70 + i * (level.routeLength / 24);
      const x = this.routeCenterAt(z) + side * (18 + Math.random() * 10);
      this.cloneAssetOnRoute(i % 3 === 0 ? 'tree_pineRoundC.glb' : 'rock_tallH.glb', `route-prop-${i}`, x, z, 0.9 + Math.random() * 0.9, Math.random() * Math.PI, 0.15);
    }
  }

  createEnvironmentIdentity() {
    const env = this.level.environment || {};
    const props = env.propSet || [];
    if (!props.length) return;

    for (let i = 0; i < 16; i += 1) {
      const z = -78 + i * (this.level.routeLength / 15);
      const side = i % 2 === 0 ? -1 : 1;
      const x = this.routeCenterAt(z) + side * (10 + (i % 4) * 3);
      const file = props[i % props.length];
      const scale = env.theme === 'annapurna' || env.theme === 'langtang' ? 0.75 + (i % 3) * 0.18 : 0.9 + (i % 4) * 0.16;
      this.cloneAssetOnRoute(file, `route-${env.theme}-identity-${i}`, x, z, scale, Math.random() * Math.PI, 0.1);
    }

    if (env.motif === 'mani-stones') this.createManiStoneLine();
    if (env.motif === 'harvest-offerings') this.createOfferingBaskets();
    if (env.motif === 'sacred-valley') this.createValleyLanterns();
    if (env.motif === 'whiteout-ridge') this.createWindPoles();
    if (env.motif === 'eastern-shrine') this.createShrineMarkers();
  }

  createAccentBox(name, x, z, width, height, depth, material, lift = 0) {
    const box = MeshBuilder.CreateBox(name, { width, height, depth }, this.scene);
    box.position.set(x, this.terrainHeightAt(x, z) + height / 2 + lift, z);
    box.material = material;
    return box;
  }

  createManiStoneLine() {
    for (let i = 0; i < 10; i += 1) {
      const z = -72 + i * 17;
      const x = this.routeCenterAt(z) - 7;
      const stone = this.createAccentBox(`route-mani-stone-${i}`, x, z, 1.2, 0.42, 0.62, this.materials.rock, 0.02);
      stone.rotation.y = 0.4 + i * 0.13;
    }
  }

  createOfferingBaskets() {
    for (let i = 0; i < 8; i += 1) {
      const z = -76 + i * 20;
      const x = this.routeCenterAt(z) + (i % 2 === 0 ? 7 : -7);
      const basket = MeshBuilder.CreateCylinder(`route-offering-basket-${i}`, { height: 0.42, diameterTop: 0.9, diameterBottom: 0.62, tessellation: 8 }, this.scene);
      basket.position.set(x, this.terrainHeightAt(x, z) + 0.22, z);
      basket.material = this.materials.checkpoint;
    }
  }

  createValleyLanterns() {
    for (let i = 0; i < 10; i += 1) {
      const z = -74 + i * 16;
      const x = this.routeCenterAt(z) + (i % 2 === 0 ? 8 : -8);
      const pole = this.createAccentBox(`route-lantern-pole-${i}`, x, z, 0.08, 1.7, 0.08, this.materials.anchor);
      const lantern = MeshBuilder.CreateBox(`route-lantern-${i}`, { width: 0.42, height: 0.38, depth: 0.42 }, this.scene);
      lantern.position.set(pole.position.x, pole.position.y + 1.02, z);
      lantern.material = this.materials.routeFlag;
    }
  }

  createWindPoles() {
    for (let i = 0; i < 12; i += 1) {
      const z = -78 + i * 17;
      const x = this.routeCenterAt(z) + (i % 2 === 0 ? 9 : -9);
      const pole = this.createAccentBox(`route-wind-pole-${i}`, x, z, 0.1, 2.2, 0.1, this.materials.anchor);
      pole.rotation.z = (i % 2 === 0 ? -1 : 1) * 0.22;
      const ribbon = MeshBuilder.CreateBox(`route-wind-ribbon-${i}`, { width: 1.2, height: 0.16, depth: 0.04 }, this.scene);
      ribbon.position.set(x + (i % 2 === 0 ? 0.62 : -0.62), pole.position.y + 1.05, z);
      ribbon.material = this.materials.routeFlag;
    }
  }

  createShrineMarkers() {
    for (let i = 0; i < 7; i += 1) {
      const z = -68 + i * 25;
      const x = this.routeCenterAt(z) + (i % 2 === 0 ? -8 : 8);
      const base = this.createAccentBox(`route-shrine-base-${i}`, x, z, 1.2, 0.45, 1.2, this.materials.rock);
      const top = MeshBuilder.CreateCylinder(`route-shrine-top-${i}`, { height: 0.9, diameterTop: 0, diameterBottom: 1.1, tessellation: 4 }, this.scene);
      top.position.set(x, base.position.y + 0.72, z);
      top.rotation.y = Math.PI / 4;
      top.material = this.materials.checkpoint;
    }
  }

  createExpeditionCamps() {
    this.camps.slice(1).forEach((camp, index) => {
      const z = -88 + this.level.routeLength * camp.progress;
      const center = this.routeCenterAt(z);
      const side = index % 2 === 0 ? -1 : 1;
      const campX = center + side * 9;
      this.cloneAssetOnRoute('tent_detailedOpen.glb', `route-${camp.id}-tent`, campX, z, 1.18, side * 0.45, 0.35);
      this.cloneAssetOnRoute('tent_detailedClosed.glb', `route-${camp.id}-camp-tent`, campX - side * 3.2, z + 1.8, 1.55, side * -0.72, 0.38);
      this.cloneAssetOnRoute('campfire_stones.glb', `route-${camp.id}-stove`, campX + side * 1.9, z - 1.6, 0.7, 0, 0.08);
      this.cloneAssetOnRoute('bridge_wood.glb', `route-${camp.id}-supply-cache`, center, z - 2.4, 0.62, Math.PI / 2, 0.18);
      this.createCampDetails(`route-${camp.id}`, campX, z, side, 0.9);

      const marker = MeshBuilder.CreateCylinder(`route-${camp.id}-marker`, { height: 2.4, diameter: 0.14, tessellation: 8 }, this.scene);
      marker.position.set(campX - side * 1.4, this.terrainHeightAt(campX - side * 1.4, z) + 1.2, z);
      marker.material = this.materials.anchor;

      const flag = MeshBuilder.CreateBox(`route-${camp.id}-flag`, { width: 0.88, height: 0.45, depth: 0.06 }, this.scene);
      flag.position.set(marker.position.x + side * 0.45, marker.position.y + 0.78, z);
      flag.rotation.y = side * 0.28;
      flag.material = this.materials.checkpoint;

      const halo = MeshBuilder.CreateTorus(`route-${camp.id}-halo`, { diameter: 5.2, thickness: 0.045, tessellation: 32 }, this.scene);
      halo.position.set(center, this.terrainHeightAt(center, z) + 0.18, z);
      halo.rotation.x = Math.PI / 2;
      halo.material = this.materials.routeGlow;
    });
  }

  createCampDetails(name, x, z, side = 1, scale = 1) {
    const root = new TransformNode(`${name}-camp-details`, this.scene);
    const baseY = this.terrainHeightAt(x, z);
    root.position.set(x, baseY, z);
    this.props.push(root);

    this.cloneAssetOnRoute('tent_detailedOpen.glb', `${name}-side-tent`, x - side * 2.6, z + 2.2, 0.82 * scale, side * -0.85, 0.28);
    this.createRoundedCampTent(root, name, side * -3.55 * scale, 2.65 * scale, side, scale);

    const place = (mesh, lx, lz, lift = 0) => {
      mesh.parent = root;
      mesh.position.set(lx, this.terrainHeightAt(x + lx, z + lz) - baseY + lift, lz);
      return mesh;
    };

    [-0.35, 0.05, 0.45].forEach((offset, index) => {
      const tank = MeshBuilder.CreateCylinder(`${name}-oxygen-tank-${index}`, {
        height: 0.95 * scale,
        diameter: 0.22 * scale,
        tessellation: 14
      }, this.scene);
      tank.rotation.z = index === 1 ? 0.1 : -0.08;
      tank.material = this.materials.oxygenTank;
      place(tank, side * (1.45 + index * 0.26) * scale, (1.15 + offset) * scale, 0.48 * scale);

      const valve = MeshBuilder.CreateCylinder(`${name}-oxygen-valve-${index}`, {
        height: 0.08 * scale,
        diameter: 0.16 * scale,
        tessellation: 10
      }, this.scene);
      valve.material = this.materials.toolMetal;
      place(valve, side * (1.45 + index * 0.26) * scale, (1.15 + offset) * scale, 0.99 * scale);
    });

    const stove = MeshBuilder.CreateCylinder(`${name}-soup-stove`, {
      height: 0.28 * scale,
      diameter: 0.76 * scale,
      tessellation: 12
    }, this.scene);
    stove.material = this.materials.rock;
    place(stove, side * -0.45 * scale, -1.4 * scale, 0.14 * scale);

    const pot = MeshBuilder.CreateCylinder(`${name}-soup-pot`, {
      height: 0.42 * scale,
      diameterTop: 0.62 * scale,
      diameterBottom: 0.52 * scale,
      tessellation: 18
    }, this.scene);
    pot.material = this.materials.cookPot;
    place(pot, side * -0.45 * scale, -1.4 * scale, 0.54 * scale);

    const soup = MeshBuilder.CreateCylinder(`${name}-soup-surface`, {
      height: 0.035 * scale,
      diameter: 0.55 * scale,
      tessellation: 18
    }, this.scene);
    soup.material = this.materials.soup;
    place(soup, side * -0.45 * scale, -1.4 * scale, 0.77 * scale);

    for (let i = 0; i < 3; i += 1) {
      const steam = MeshBuilder.CreateTorus(`${name}-soup-steam-${i}`, {
        diameter: (0.28 + i * 0.1) * scale,
        thickness: 0.018 * scale,
        tessellation: 16
      }, this.scene);
      steam.rotation.x = Math.PI / 2;
      steam.material = this.materials.steam;
      place(steam, side * (-0.45 + i * 0.12) * scale, -1.4 * scale, (1.05 + i * 0.24) * scale);
    }
  }

  createRoundedCampTent(parent, name, lx, lz, side = 1, scale = 1) {
    const tent = new TransformNode(`${name}-rounded-tent`, this.scene);
    tent.parent = parent;
    tent.position.set(lx, 0.54 * scale, lz);
    tent.rotation.y = side * 0.48;

    const dome = MeshBuilder.CreateSphere(`${name}-rounded-tent-dome`, {
      diameter: 2.25 * scale,
      segments: 18
    }, this.scene);
    dome.parent = tent;
    dome.scaling.set(1.35, 0.58, 0.95);
    dome.material = this.materials.roundedTent;

    const skirt = MeshBuilder.CreateCylinder(`${name}-rounded-tent-skirt`, {
      height: 0.18 * scale,
      diameter: 2.7 * scale,
      tessellation: 18
    }, this.scene);
    skirt.parent = tent;
    skirt.position.y = -0.45 * scale;
    skirt.scaling.z = 0.72;
    skirt.material = this.materials.roundedTentDoor;

    const door = MeshBuilder.CreateBox(`${name}-rounded-tent-door`, {
      width: 0.52 * scale,
      height: 0.8 * scale,
      depth: 0.08 * scale
    }, this.scene);
    door.parent = tent;
    door.position.set(-1.55 * scale, -0.02 * scale, 0);
    door.rotation.z = -0.08;
    door.material = this.materials.roundedTentDoor;

    const seam = MeshBuilder.CreateTorus(`${name}-rounded-tent-seam`, {
      diameter: 2.15 * scale,
      thickness: 0.025 * scale,
      tessellation: 24
    }, this.scene);
    seam.parent = tent;
    seam.position.y = 0.08 * scale;
    seam.rotation.x = Math.PI / 2;
    seam.scaling.x = 1.35;
    seam.scaling.y = 0.75;
    seam.material = this.materials.roundedTentDoor;

    return tent;
  }

  createToolPickups() {
    const count = 7 + Math.min(3, this.level.difficulty);
    for (let i = 0; i < count; i += 1) {
      const progress = 0.14 + (i / count) * 0.72;
      const z = -88 + this.level.routeLength * progress;
      const side = i % 2 === 0 ? -1 : 1;
      const x = this.routeCenterAt(z) + side * (11 + (i % 3) * 2.3);
      const root = new TransformNode(`route-tool-cache-${i}`, this.scene);
      root.position.set(x, this.terrainHeightAt(x, z) + 1.05, z);
      root.metadata = {
        type: i % 3 === 0 ? 'oxygen' : i % 3 === 1 ? 'tea' : 'hardware',
        collected: false,
        phase: i * 0.75
      };

      const ring = MeshBuilder.CreateTorus(`route-tool-cache-ring-${i}`, { diameter: 2.3, thickness: 0.045, tessellation: 28 }, this.scene);
      ring.parent = root;
      ring.position.y = -0.86;
      ring.rotation.x = Math.PI / 2;
      ring.material = this.materials.toolGlow;

      const pack = MeshBuilder.CreateBox(`route-tool-cache-pack-${i}`, { width: 0.72, height: 0.5, depth: 0.54 }, this.scene);
      pack.parent = root;
      pack.material = this.materials.tool;

      const handle = MeshBuilder.CreateCylinder(`route-tool-cache-handle-${i}`, { height: 0.92, diameter: 0.07, tessellation: 8 }, this.scene);
      handle.parent = root;
      handle.position.set(0.52, 0.18, 0);
      handle.rotation.z = 0.7;
      handle.material = this.materials.toolMetal;

      const head = MeshBuilder.CreateBox(`route-tool-cache-head-${i}`, { width: 0.58, height: 0.14, depth: 0.16 }, this.scene);
      head.parent = handle;
      head.position.y = 0.44;
      head.material = this.materials.toolMetal;

      this.tools.push(root);
    }
  }

  nearestToolInfo(maxDistance = 24) {
    return this.tools.reduce((closest, tool) => {
      if (tool.metadata?.collected) return closest;
      const dz = tool.position.z - this.player.root.position.z;
      const distance = Vector3.Distance(tool.position, this.player.root.position);
      if (dz < -6 || distance > maxDistance || distance >= closest.distance) return closest;
      return { tool, distance };
    }, { tool: null, distance: Infinity });
  }

  updateTools(delta) {
    this.tools.forEach((tool) => {
      if (tool.metadata?.collected) return;
      tool.rotation.y += delta * 1.2;
      tool.position.y = this.terrainHeightAt(tool.position.x, tool.position.z) + 1.05 + Math.sin(this.metrics.time * 2 + tool.metadata.phase) * 0.16;
      tool.getChildMeshes().forEach((mesh) => {
        if (mesh.name.includes('ring')) mesh.scaling.setAll(1 + Math.sin(this.metrics.time * 3 + tool.metadata.phase) * 0.08);
      });
    });

    if (this.toolLineTimer > 0) {
      this.toolLineTimer = Math.max(0, this.toolLineTimer - delta);
      if (this.toolLineTimer === 0) {
        this.toolLine?.dispose();
        this.toolLine = null;
      }
    }
  }

  throwToolLine() {
    if (this.state !== 'playing') return;
    const { tool, distance } = this.nearestToolInfo();
    if (!tool) {
      this.setMessage('No cache in rope range. Move closer, then throw.', 3);
      return;
    }

    this.toolLine?.dispose();
    const start = this.player.root.position.add(new Vector3(0, 1.25, 0));
    const end = tool.position.add(new Vector3(0, 0.35, 0));
    const mid = Vector3.Lerp(start, end, 0.5).add(new Vector3(0, 1.4, 0));
    this.toolLine = MeshBuilder.CreateTube('route-tool-rope-line', {
      path: [start, mid, end],
      radius: 0.045,
      tessellation: 8
    }, this.scene);
    this.toolLine.material = this.materials.rope;
    this.toolLineTimer = 0.42;

    tool.metadata.collected = true;
    tool.setEnabled(false);
    this.metrics.toolsCollected += 1;
    this.metrics.oxygen = Math.min(100, this.metrics.oxygen + 7);
    this.metrics.stamina = Math.min(100, this.metrics.stamina + 10);
    this.metrics.morale = Math.min(100, this.metrics.morale + 4);
    this.audio.camp();
    this.awardAction(`Rope catch ${Math.round(distance)}m`, 24, 1.25);
  }

  createSummitCeremony(x, z) {
    const y = this.terrainHeightAt(x, z);
    const platform = MeshBuilder.CreateCylinder('summit-ceremony-platform', { height: 0.24, diameter: 8.4, tessellation: 24 }, this.scene);
    platform.position.set(x, y + 0.12, z - 2.2);
    platform.material = this.materials.pathSnow;

    const halo = MeshBuilder.CreateTorus('summit-ceremony-halo', { diameter: 10.2, thickness: 0.07, tessellation: 40 }, this.scene);
    halo.position.set(x, y + 0.28, z - 2.2);
    halo.rotation.x = Math.PI / 2;
    halo.material = this.materials.routeGlow;

    const cairn = MeshBuilder.CreateCylinder('summit-cairn', { height: 1.1, diameterTop: 0.65, diameterBottom: 1.35, tessellation: 7 }, this.scene);
    cairn.position.set(x - 1.25, y + 0.72, z - 2.2);
    cairn.material = this.materials.rock;

    const pole = MeshBuilder.CreateCylinder('summit-prayer-pole', { height: 4.6, diameter: 0.12, tessellation: 8 }, this.scene);
    pole.position.set(x + 1.5, y + 2.3, z - 2.1);
    pole.material = this.materials.anchor;

    const flag = MeshBuilder.CreateBox('summit-main-flag', { width: 1.4, height: 0.62, depth: 0.05 }, this.scene);
    flag.position.set(x + 2.15, y + 4.1, z - 2.1);
    flag.rotation.y = 0.22;
    flag.material = this.materials.checkpoint;

    this.props.push(this.himalayanProps.createPrayerFlags(
      'summit-prayer-flags',
      new Vector3(x - 4.2, y + 2.25, z - 3.8),
      new Vector3(x + 4.2, y + 3.15, z - 1.2)
    ));
  }

  createMountainTerrain() {
    const level = this.level;
    const width = 150;
    const depth = level.routeLength + 150;
    const centerZ = level.routeLength / 2 - 50;
    const terrain = MeshBuilder.CreateGround('route-mountain-terrain', {
      width,
      height: depth,
      subdivisions: 120,
      updatable: true
    }, this.scene);
    terrain.position.z = centerZ;

    const positions = terrain.getVerticesData(VertexBuffer.PositionKind);
    const indices = terrain.getIndices();
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2] + centerZ;
      positions[i + 1] = this.terrainHeightAt(x, z);
    }
    const normals = [];
    VertexData.ComputeNormals(positions, indices, normals);
    terrain.setVerticesData(VertexBuffer.PositionKind, positions);
    terrain.setVerticesData(VertexBuffer.NormalKind, normals);
    terrain.refreshBoundingInfo();
    terrain.material = this.materials.snow;
  }

  createClimbingRoute() {
    const level = this.level;
    const samples = 56;
    const path = [];
    for (let i = 0; i <= samples; i += 1) {
      const z = -86 + (level.routeLength / samples) * i;
      const x = this.routeCenterAt(z);
      path.push(new Vector3(x, this.terrainHeightAt(x, z) + 0.28, z));
    }

    const rope = MeshBuilder.CreateTube('route-fixed-rope', {
      path,
      radius: 0.12,
      tessellation: 8,
      cap: MeshBuilder.CAP_ALL
    }, this.scene);
    rope.material = this.materials.rope;

    const ropeGlow = MeshBuilder.CreateTube('route-fixed-rope-glow', {
      path: path.map((point) => point.add(new Vector3(0, 0.03, 0))),
      radius: 0.22,
      tessellation: 8,
      cap: MeshBuilder.CAP_ALL
    }, this.scene);
    ropeGlow.material = this.materials.routeGlow;

    for (let i = 0; i <= samples; i += 4) {
      const point = path[i];
      const anchor = MeshBuilder.CreateCylinder(`route-anchor-${i}`, { height: 1.15, diameter: 0.12, tessellation: 8 }, this.scene);
      anchor.position.set(point.x, point.y + 0.45, point.z);
      anchor.rotation.x = 0.28;
      anchor.material = this.materials.anchor;

      const flag = MeshBuilder.CreateBox(`route-red-flag-${i}`, { width: 0.72, height: 0.36, depth: 0.04 }, this.scene);
      flag.position.set(point.x + 0.33, point.y + 0.9, point.z);
      flag.rotation.y = 0.25;
      flag.material = this.materials.routeFlag;
    }
  }

  createRouteMarkers() {
    const level = this.level;
    for (let i = 0; i <= 26; i += 1) {
      const z = -84 + (level.routeLength / 26) * i;
      const center = this.routeCenterAt(z);
      const marker = MeshBuilder.CreateCylinder(`route-track-marker-${i}`, { height: 0.08, diameter: 1.3, tessellation: 8 }, this.scene);
      marker.position.set(center, this.terrainHeightAt(center, z) + 0.05, z);
      marker.scaling.x = 1.7;
      marker.rotation.y = Math.sin(this.routeProgressAt(z) * Math.PI * 5.4) * 0.7;
      marker.material = i % 3 === 0 ? this.materials.ice : this.materials.pathSnow;
    }
  }

  buildHorizonPeaks() {
    const level = this.level;
    const summitZ = level.routeLength - 82;
    const farZ = summitZ + 68;
    const sky = MeshBuilder.CreatePlane('route-sky-horizon', { width: 360, height: 130 }, this.scene);
    sky.position.set(0, 58, farZ + 42);
    const skyMat = new StandardMaterial('skyHorizon', this.scene);
    skyMat.diffuseColor = Color3.FromHexString('#9ed0ef');
    skyMat.emissiveColor = Color3.FromHexString('#9ed0ef');
    skyMat.specularColor = Color3.Black();
    skyMat.disableLighting = true;
    skyMat.backFaceCulling = false;
    sky.material = skyMat;

    const silhouetteSpecs = [
      { x: -44, z: 46, y: 32, size: 34, tilt: -0.18 },
      { x: 36, z: 58, y: 36, size: 40, tilt: 0.14 },
      { x: -58, z: 102, y: 45, size: 46, tilt: 0.08 },
      { x: 54, z: 118, y: 48, size: 50, tilt: -0.1 },
      { x: 0, z: farZ - 22, y: 66, size: 64, tilt: 0.03 }
    ];

    silhouetteSpecs.forEach((spec, index) => {
      const peak = MeshBuilder.CreateDisc(`route-horizon-silhouette-${index}`, { radius: spec.size, tessellation: 3 }, this.scene);
      peak.position.set(spec.x, spec.y, spec.z);
      peak.rotation.z = Math.PI / 6 + spec.tilt;
      peak.material = this.materials.horizonRock;

      const cap = MeshBuilder.CreateDisc(`route-horizon-silhouette-cap-${index}`, { radius: spec.size * 0.34, tessellation: 3 }, this.scene);
      cap.position.set(spec.x, spec.y + spec.size * 0.42, spec.z - 0.12);
      cap.rotation.z = peak.rotation.z;
      cap.material = this.materials.farSnow;
    });

    const peakSpecs = [
      { x: 0, z: farZ, height: 76, width: 54, rotation: 0.18, main: true },
      { x: -42, z: farZ - 18, height: 48, width: 40, rotation: -0.28 },
      { x: 45, z: farZ - 10, height: 54, width: 42, rotation: 0.34 },
      { x: -86, z: farZ - 38, height: 38, width: 46, rotation: 0.08 },
      { x: 86, z: farZ - 32, height: 40, width: 48, rotation: -0.14 },
      { x: -58, z: 20, height: 28, width: 36, rotation: 0.36 },
      { x: 62, z: 54, height: 31, width: 38, rotation: -0.3 }
    ];

    peakSpecs.forEach((spec, index) => {
      const baseY = this.routeHeightAt(Math.min(spec.z, summitZ), spec.x) - 2;
      const peak = MeshBuilder.CreateCylinder(`route-horizon-peak-${index}`, {
        height: spec.height,
        diameterTop: 0,
        diameterBottom: spec.width,
        tessellation: 4
      }, this.scene);
      peak.position.set(spec.x, baseY + spec.height / 2, spec.z);
      peak.rotation.y = Math.PI / 4 + spec.rotation;
      peak.material = spec.main ? this.materials.rock : this.materials.farRidge;

      const cap = MeshBuilder.CreateCylinder(`route-horizon-snowcap-${index}`, {
        height: spec.height * 0.36,
        diameterTop: 0,
        diameterBottom: spec.width * 0.42,
        tessellation: 4
      }, this.scene);
      cap.position.set(spec.x, baseY + spec.height * 0.82, spec.z);
      cap.rotation.y = peak.rotation.y;
      cap.material = this.materials.farSnow;
    });
  }

  buildSurroundingMountains() {
    const level = this.level;
    const sideSpecs = [];
    for (let i = 0; i < 9; i += 1) {
      const z = -64 + i * (level.routeLength / 7.5);
      sideSpecs.push(
        { x: -38 - Math.sin(i) * 9, z, height: 40 + (i % 3) * 10, width: 34 + (i % 4) * 8, side: -1 },
        { x: 38 + Math.cos(i * 0.7) * 9, z: z + 10, height: 42 + (i % 4) * 9, width: 36 + (i % 3) * 9, side: 1 }
      );
    }

    sideSpecs.forEach((spec, index) => {
      const baseY = this.terrainHeightAt(spec.x, spec.z) - 1.5;
      const ridge = MeshBuilder.CreateCylinder(`route-side-mountain-${index}`, {
        height: spec.height,
        diameterTop: 0,
        diameterBottom: spec.width,
        tessellation: 4
      }, this.scene);
      ridge.position.set(spec.x, baseY + spec.height / 2, spec.z);
      ridge.rotation.y = Math.PI / 4 + spec.side * 0.28;
      ridge.scaling.z = 1.45;
      ridge.material = index % 2 === 0 ? this.materials.rock : this.materials.shadowRock;

      const cap = MeshBuilder.CreateCylinder(`route-side-snowcap-${index}`, {
        height: spec.height * 0.3,
        diameterTop: 0,
        diameterBottom: spec.width * 0.35,
        tessellation: 4
      }, this.scene);
      cap.position.set(spec.x, baseY + spec.height * 0.86, spec.z);
      cap.rotation.y = ridge.rotation.y;
      cap.scaling.z = 1.25;
      cap.material = this.materials.farSnow;
    });
  }

  spawnHazards() {
    const level = this.level;
    level.hazards.forEach((type, index) => {
      const count = type === 'avalanche' ? 5 : type === 'crevasse' ? 4 : 3;
      for (let i = 0; i < count; i += 1) {
        const lane = (i + 0.65 + index * 0.32) / (count + 0.8);
        const z = -70 + level.routeLength * lane;
        const x = ((i + index) % 2 === 0 ? -1 : 1) * (type === 'blizzard' ? 3 + Math.random() * 5 : 1.4 + Math.random() * 3.2);
        const hazard = this.createHazard(type, x, z);
        this.hazards.push(hazard);
      }
    });
  }

  createHazard(type, x, z) {
    const routeX = this.routeCenterAt(z) + x;
    if (type === 'crevasse') return this.createCrevasse(routeX, z, x);
    if (type === 'avalanche') return this.createAvalanche(routeX, z, x);
    if (type === 'blizzard') return this.createBlizzard(routeX, z, x);
    return this.createSpirit(routeX, z, x);
  }

  createCrevasse(x, z, routeOffset) {
    const root = new TransformNode('hazard-crevasse', this.scene);
    root.position.set(x, this.terrainHeightAt(x, z) + 0.08, z);
    root.rotation.y = 0.45 + Math.sin(z * 0.17) * 0.22;
    root.metadata = { type: 'crevasse', routeOffset, speed: 0, phase: Math.random() * 6, warned: false };

    const voidFloor = MeshBuilder.CreateBox('hazard-crevasse-black-depth', { width: 13.4, height: 0.18, depth: 1.05 }, this.scene);
    voidFloor.parent = root;
    voidFloor.position.y = -1.62;
    voidFloor.material = this.materials.hazard;

    [-1, 1].forEach((side) => {
      const iceWall = MeshBuilder.CreateBox(`hazard-crevasse-ice-wall-${side}`, { width: 13.1, height: 2.65, depth: 0.22 }, this.scene);
      iceWall.parent = root;
      iceWall.position.set(0, -0.72, side * 0.56);
      iceWall.rotation.x = side * 0.08;
      iceWall.material = this.materials.crevasseIce;

      const shadowEdge = MeshBuilder.CreateBox(`hazard-crevasse-shadow-edge-${side}`, { width: 13.2, height: 0.08, depth: 0.16 }, this.scene);
      shadowEdge.parent = root;
      shadowEdge.position.set(0, 0.03, side * 0.38);
      shadowEdge.material = this.materials.crevasseEdge;

      const snowLip = MeshBuilder.CreateBox(`hazard-crevasse-snow-lip-${side}`, { width: 13.4, height: 0.2, depth: 0.48 }, this.scene);
      snowLip.parent = root;
      snowLip.position.set(0, 0.1, side * 0.88);
      snowLip.rotation.x = side * -0.12;
      snowLip.material = this.materials.pathSnow;

      for (let i = 0; i < 5; i += 1) {
        const stripe = MeshBuilder.CreateBox(`hazard-crevasse-ice-stripe-${side}-${i}`, {
          width: 12.5 - i * 0.35,
          height: 0.035,
          depth: 0.025
        }, this.scene);
        stripe.parent = root;
        stripe.position.set(Math.sin(i * 1.6) * 0.26, -0.05 - i * 0.38, side * 0.43);
        stripe.rotation.y = Math.sin(i) * 0.08;
        stripe.material = i % 2 === 0 ? this.materials.pathSnow : this.materials.crevasseEdge;
      }
    });

    const blackMouth = MeshBuilder.CreateBox('hazard-crevasse-open-mouth', { width: 12.9, height: 0.06, depth: 0.78 }, this.scene);
    blackMouth.parent = root;
    blackMouth.position.y = 0.045;
    blackMouth.material = this.materials.hazard;

    const warning = MeshBuilder.CreateTorus('hazard-crevasse-warning', { diameter: 12.6, thickness: 0.08, tessellation: 34 }, this.scene);
    warning.parent = root;
    warning.position.y = 0.16;
    warning.scaling.z = 0.32;
    warning.rotation.x = Math.PI / 2;
    warning.material = this.materials.hazardMarker;

    [-5.2, -3.4, -1.7, 1.3, 3.1, 5.0].forEach((offset, index) => {
      const crack = MeshBuilder.CreateBox(`hazard-crevasse-finger-${index}`, { width: 2.4, height: 0.055, depth: 0.12 }, this.scene);
      crack.parent = root;
      crack.position.set(offset, 0.13, index % 2 === 0 ? -1.18 : 1.14);
      crack.rotation.y = index % 2 === 0 ? -0.55 : 0.5;
      crack.material = this.materials.crevasseEdge;
    });

    [-3.8, -1.6, 1.4, 3.7].forEach((offset, index) => {
      const approach = MeshBuilder.CreateBox(`hazard-crevasse-approach-crack-${index}`, { width: 2.8, height: 0.045, depth: 0.1 }, this.scene);
      approach.parent = root;
      approach.position.set(offset, 0.17, index % 2 === 0 ? -3.1 : 3.0);
      approach.rotation.y = index % 2 === 0 ? 0.58 : -0.52;
      approach.material = this.materials.crevasseEdge;
    });

    [-5.4, -3.7, -2.1, 2.0, 3.8, 5.3].forEach((offset, index) => {
      const tooth = MeshBuilder.CreateCylinder(`hazard-crevasse-tooth-${index}`, {
        height: 0.55,
        diameterTop: 0,
        diameterBottom: 0.52,
        tessellation: 4
      }, this.scene);
      tooth.parent = root;
      tooth.position.set(offset, 0.2, index % 2 === 0 ? -0.98 : 0.98);
      tooth.rotation.y = Math.PI / 4;
      tooth.material = this.materials.rock;
    });

    return root;
  }

  createAvalanche(x, z, routeOffset) {
    const side = routeOffset < 0 ? -1 : 1;
    const root = new TransformNode('hazard-avalanche', this.scene);
    const startX = this.routeCenterAt(z) + side * (13 + Math.random() * 4);
    root.position.set(startX, this.terrainHeightAt(startX, z) + 1.25, z + 18);
    root.metadata = { type: 'avalanche', side, speed: 7.2 + Math.random() * 2.4, phase: Math.random() * 6, warned: false, warningPulse: 0 };

    const boulder = MeshBuilder.CreateSphere('hazard-avalanche-core', { diameter: 3.2, segments: 12 }, this.scene);
    boulder.parent = root;
    boulder.material = this.materials.avalanche;

    const warning = MeshBuilder.CreateTorus('hazard-avalanche-warning', { diameter: 8.2, thickness: 0.08, tessellation: 32 }, this.scene);
    warning.parent = root;
    warning.rotation.x = Math.PI / 2;
    warning.material = this.materials.hazardMarker;

    for (let i = 0; i < 8; i += 1) {
      const plume = MeshBuilder.CreateSphere(`hazard-avalanche-plume-${i}`, { diameter: 1.45 + i * 0.2, segments: 8 }, this.scene);
      plume.parent = root;
      plume.position.set(side * (1.0 + i * 0.34), -0.2 + i * 0.04, 0.9 + i * 0.48);
      plume.material = this.materials.avalancheShadow;
    }

    const rumble = MeshBuilder.CreateTorus('hazard-avalanche-rumble-ring', { diameter: 10.4, thickness: 0.05, tessellation: 36 }, this.scene);
    rumble.parent = root;
    rumble.position.z = -1.2;
    rumble.rotation.x = Math.PI / 2;
    rumble.material = this.materials.hazardMarker;

    return root;
  }

  createBlizzard(x, z, routeOffset) {
    const root = new TransformNode('hazard-blizzard', this.scene);
    root.position.set(x, this.terrainHeightAt(x, z) + 2.2, z);
    root.metadata = { type: 'blizzard', routeOffset, speed: 1.2 + Math.random() * 0.7, phase: Math.random() * 6 };

    for (let i = 0; i < 6; i += 1) {
      const gust = MeshBuilder.CreateTorus(`hazard-blizzard-gust-${i}`, { diameter: 3.4 + i * 0.38, thickness: 0.035, tessellation: 24 }, this.scene);
      gust.parent = root;
      gust.position.set(Math.sin(i) * 1.5, -0.55 + i * 0.18, Math.cos(i * 0.7) * 1.1);
      gust.rotation.x = Math.PI / 2;
      gust.rotation.z = i * 0.52;
      gust.material = this.materials.blizzardWind;
    }

    const warning = MeshBuilder.CreateTorus('hazard-blizzard-warning', { diameter: 7.8, thickness: 0.045, tessellation: 32 }, this.scene);
    warning.parent = root;
    warning.rotation.x = Math.PI / 2;
    warning.material = this.materials.hazardMarker;

    return root;
  }

  createSpirit(x, z, routeOffset) {
    const mesh = MeshBuilder.CreateTorus('hazard-spirit', { diameter: 3.2, thickness: 0.08 }, this.scene);
    mesh.material = this.materials.spirit;
    mesh.position.set(x, this.terrainHeightAt(x, z) + 1.3, z);
    mesh.scaling.setAll(1.25);
    mesh.metadata = { type: 'spirit', routeOffset, speed: 0.7 + Math.random() * 0.8, phase: Math.random() * 6 };
    return mesh;
  }

  update() {
    const delta = this.engine.getDeltaTime() / 1000;
    if (this.state === 'summit') {
      this.updateSummitMoment(delta);
      return;
    }
    if (this.state === 'falling') {
      this.updateCrevasseFall(delta);
      return;
    }
    if (this.state !== 'playing') return;
    if (this.metrics.messageTimer > 0) {
      this.metrics.messageTimer = Math.max(0, this.metrics.messageTimer - delta);
      if (this.metrics.messageTimer === 0) this.metrics.message = '';
    }
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - delta);
      if (this.comboTimer === 0) this.metrics.combo = 0;
    }
    this.flowBoostTimer = Math.max(0, this.flowBoostTimer - delta);
    const level = this.level;
    const movementContext = this.movementContextAt(this.player.root.position);
    movementContext.groundY = movementContext.height + 0.7;
    movementContext.actionBoost = this.flowBoostTimer > 0 ? 0.14 + Math.min(0.14, this.metrics.combo * 0.018) : 0;
    const jumped = this.input.jumpPressed;
    const dodged = this.input.dodgePressed;
    const toolThrown = this.input.toolPressed;
    const crouching = this.input.crouch;
    const movingForward = this.input.forward;
    this.player.update(this.input, delta, level, movementContext);
    if (jumped) this.metrics.stamina -= 4.5;
    if (dodged) this.metrics.stamina -= 3.5;
    if (toolThrown) {
      this.metrics.stamina -= 5;
      this.throwToolLine();
    }
    const routeCenter = this.routeCenterAt(this.player.root.position.z);
    this.player.root.position.x = Math.max(routeCenter - 12, Math.min(routeCenter + 12, this.player.root.position.x));
    const groundY = this.routeHeightAt(this.player.root.position.z, this.player.root.position.x) + 0.7;
    if (this.player.root.position.y <= groundY) {
      this.player.root.position.y = groundY;
      this.player.verticalVelocity = 0;
      this.player.grounded = true;
    } else {
      this.player.grounded = false;
    }
    this.player.actionHeight = Math.max(0, this.player.root.position.y - groundY);
    this.metrics.time += delta;
    const isMoving = this.input.forward || this.input.left || this.input.right || this.input.back;
    const altitudeFactor = Math.max(0.25, (this.player.root.position.z + 88) / level.routeLength);
    this.updateTutorial(altitudeFactor, { jumped, dodged, toolThrown, crouching, movingForward });
    const summitPressure = Math.max(0, altitudeFactor - 0.72) * 0.55;
    this.metrics.oxygen -= delta * level.oxygenDrain * (0.2 + altitudeFactor * 0.72 + summitPressure);
    const slopeCost = 1 + movementContext.steepness * 0.85 + movementContext.icy * 0.28;
    this.metrics.stamina += delta * (this.input.rest ? 15 : isMoving ? -6.6 * level.staminaDrain * slopeCost : 3.1);
    this.metrics.stamina = Math.max(0, Math.min(100, this.metrics.stamina));
    this.metrics.morale -= delta * (this.metrics.oxygen < 35 ? 1.2 : 0.12);
    if (isMoving && movementContext.steepness > 0.62 && !this.metrics.message) {
      this.setMessage('Steep grade. Short steps save stamina.', 4);
    } else if (isMoving && movementContext.icy > 0.52 && !this.metrics.message) {
      this.setMessage('Blue ice. Hold the rope against the side drift.', 4);
    }

    this.updateHazards(delta);
    this.updateTools(delta);
    const hazardDistance = this.nearestHazardDistance();
    this.audio.update({
      isMoving,
      hazardPressure: Math.max(0, 1 - hazardDistance / 16),
      blizzardPressure: this.blizzardPressure,
      progress: altitudeFactor
    });
    this.updateCamera(delta, isMoving);
    this.checkProgress();
    this.paintHud();
  }

  updateHazards(delta) {
    let blizzardPressure = 0;
    const hazardDamage = {
      crevasse: { radius: 4.8, stamina: 28, oxygen: 6, morale: 12 },
      avalanche: { radius: 5.2, stamina: 32, oxygen: 9, morale: 15 },
      blizzard: { radius: 5.1, stamina: 13, oxygen: 6.5, morale: 8 },
      spirit: { radius: 3.5, stamina: 9, oxygen: 3.2, morale: 10 }
    };
    this.hazards.forEach((hazard) => {
      const data = hazard.metadata;
      if (data.type === 'avalanche') {
        data.warningPulse += delta * 5.5;
        hazard.position.z -= delta * (data.speed + this.level.difficulty * 1.2);
        const routeX = this.routeCenterAt(hazard.position.z);
        hazard.position.x += (routeX - hazard.position.x) * Math.min(1, delta * 0.7);
        hazard.position.x += Math.sin(this.metrics.time * 3 + data.phase) * delta * 0.85;
        if (hazard.position.z < this.player.root.position.z - 34) {
          hazard.position.z = this.player.root.position.z + 64;
          hazard.position.x = this.routeCenterAt(hazard.position.z) + data.side * (12 + Math.random() * 4);
          data.rewarded = false;
          data.warned = false;
        }
        hazard.position.y = this.routeHeightAt(hazard.position.z, hazard.position.x) + 1.15;
        hazard.rotation.y += delta * 2.5 * data.side;
        hazard.getChildMeshes().forEach((mesh) => {
          if (mesh.name.includes('rumble-ring') || mesh.name.includes('warning')) {
            mesh.scaling.setAll(1 + Math.sin(data.warningPulse) * 0.12);
          }
          if (mesh.name.includes('plume')) {
            mesh.scaling.setAll(1 + Math.max(0, 1 - Math.abs(hazard.position.z - this.player.root.position.z) / 38) * 0.45);
          }
        });
      } else if (data.type === 'spirit') {
        hazard.rotation.y += delta * 1.8;
        hazard.position.x = this.routeCenterAt(hazard.position.z) + data.routeOffset;
        hazard.position.y = this.routeHeightAt(hazard.position.z, hazard.position.x) + 1.3 + Math.sin(this.metrics.time * 2 + data.phase) * 0.3;
      } else if (data.type === 'blizzard') {
        hazard.position.x = this.routeCenterAt(hazard.position.z) + data.routeOffset + Math.sin(this.metrics.time * data.speed + data.phase) * 1.8;
        hazard.position.y = this.routeHeightAt(hazard.position.z, hazard.position.x) + 2.2 + Math.sin(this.metrics.time * 2.2 + data.phase) * 0.35;
        hazard.getChildMeshes().forEach((gust, index) => {
          gust.rotation.z += delta * (1.4 + index * 0.22);
          gust.scaling.setAll(1 + Math.sin(this.metrics.time * 2 + index) * 0.08);
        });
      }

      const crevasseRisk = data.type === 'crevasse' ? this.crevasseRisk(hazard) : null;
      const distance = crevasseRisk ? crevasseRisk.distance : Vector3.Distance(hazard.position, this.player.root.position);
      this.updateHazardTelegraph(hazard, distance, crevasseRisk);
      if (data.type === 'blizzard') {
        blizzardPressure = Math.max(blizzardPressure, Math.max(0, 1 - distance / 18));
      }
      const damage = hazardDamage[data.type] || hazardDamage.spirit;
      if (distance < damage.radius) {
        let pressure = 1 - distance / damage.radius;
        const actions = this.player.actions;
        const avoided =
          (data.type === 'crevasse' && actions.jumping && this.player.actionHeight > 0.85) ||
          (data.type === 'avalanche' && actions.dodging && distance > 1.35);
        if (data.type === 'blizzard' && actions.crouching) pressure *= 0.28;

        if (avoided) {
          data.touching = false;
          if (!data.rewarded) {
            data.rewarded = true;
            const clean = data.type === 'crevasse'
              ? this.player.actionHeight > 1.45 && (crevasseRisk?.fallPressure || 0) < 0.62
              : distance > 2.8;
            this.awardAction(data.type === 'crevasse'
              ? clean ? 'Clean crevasse jump' : 'Late crevasse save'
              : clean ? 'Clean avalanche dodge' : 'Late avalanche dodge', clean ? 28 : 16);
          }
          return;
        }

        if (data.type === 'crevasse' && crevasseRisk?.fallPressure > 0.38 && this.player.actionHeight < 0.75) {
          this.startCrevasseFall(hazard);
          return;
        }

        if (data.type === 'blizzard' && actions.crouching && !data.rewarded && pressure > 0.16) {
          data.rewarded = true;
          this.awardAction('Low crouch through whiteout', 18, 1.15);
        }

        if (data.type === 'spirit' && this.input.rest && !data.rewarded && pressure > 0.3) {
          data.rewarded = true;
          pressure *= 0.35;
          this.awardAction('Patient breath', 16, 1);
        }

        if (!data.touching) {
          data.touching = true;
          this.metrics.hazardHits += 1;
          this.impactFeedback(hazard, pressure);
        }
        this.metrics.stamina -= damage.stamina * pressure * delta;
        this.metrics.oxygen -= damage.oxygen * pressure * delta;
        this.metrics.morale -= damage.morale * pressure * delta;
        this.metrics.climberRisk += pressure * delta * (data.type === 'avalanche' ? 1.7 : data.type === 'crevasse' ? 1.4 : 0.85);
        if (this.metrics.climberRisk > 8 && this.metrics.climbers > 1) {
          this.metrics.climbers -= 1;
          this.metrics.climberRisk = 0;
          this.setMessage('A climber turns back. Karma keeps the remaining team moving.', 6);
        } else {
          this.setMessage(data.type === 'spirit'
          ? 'The mountain spirit demands patience.'
          : data.type === 'blizzard'
            ? actions.crouching ? 'Crouch low. The whiteout passes over the rope team.' : 'Whiteout. Crouch or follow the rope and slow down.'
            : data.type === 'avalanche'
              ? 'Avalanche crossing. Dodge out of the slide path.'
              : 'Crevasse underfoot. Jump the crack or keep weight on the rope.', 4);
        }
      } else {
        data.touching = false;
      }
    });

    const fogTarget = BASE_FOG_DENSITY + blizzardPressure * 0.014;
    this.scene.fogDensity += (fogTarget - this.scene.fogDensity) * Math.min(1, delta * 3.5);
    if (this.snow) {
      const snowTarget = BASE_SNOW_RATE + blizzardPressure * 1800;
      this.snow.emitRate += (snowTarget - this.snow.emitRate) * Math.min(1, delta * 3);
    }
    if (blizzardPressure > 0.25) {
      const crouchShield = this.player.actions.crouching ? 0.38 : 1;
      this.metrics.stamina -= delta * blizzardPressure * 2.6 * crouchShield;
      this.metrics.morale -= delta * blizzardPressure * 1.2 * crouchShield;
    }
    this.blizzardPressure = blizzardPressure;
  }

  updateHazardTelegraph(hazard, distance, crevasseRisk = null) {
    const data = hazard.metadata || {};
    if (data.type === 'crevasse') {
      const dz = hazard.position.z - this.player.root.position.z;
      const approaching = dz > 1.5 && dz < 22 && (crevasseRisk?.distance || distance) < 4.8;
      const pulse = 1 + Math.max(0, 1 - Math.abs(dz) / 22) * (0.18 + Math.sin(this.metrics.time * 8) * 0.06);
      hazard.getChildMeshes().forEach((mesh) => {
        if (mesh.name.includes('approach-crack')) mesh.scaling.setAll(pulse);
        if (mesh.name.includes('warning')) {
          mesh.scaling.x = pulse;
          mesh.scaling.y = pulse;
          mesh.scaling.z = 0.32;
        }
      });
      if (approaching && !data.warned) {
        data.warned = true;
        this.audio.warning();
        this.setMessage('Crevasse ahead. Jump at the dark slit, not before it.', 3.2);
      }
      if (dz < -8) data.warned = false;
    }

    if (data.type === 'avalanche') {
      const dz = hazard.position.z - this.player.root.position.z;
      const incoming = dz > 8 && dz < 42;
      if (incoming && !data.warned) {
        data.warned = true;
        this.audio.warning();
        this.setMessage('Avalanche rumble. Watch the side slope, then dodge.', 3.2);
      }
    }
  }

  updateTutorial(progress, actions) {
    if (this.level?.id !== 'everest') {
      this.currentTutorialPrompt = null;
      return;
    }

    const completions = [
      ['move', actions.movingForward || progress > 0.035],
      ['jump', actions.jumped],
      ['crouch', actions.crouching],
      ['dodge', actions.dodged],
      ['rope', actions.toolThrown || this.metrics.toolsCollected > 0],
      ['camp', this.metrics.campsUsed > 0 || progress > 0.31]
    ];
    completions.forEach(([id, done]) => {
      if (done) this.tutorialSeen.add(id);
    });

    const steps = [
      { id: 'move', min: 0, max: 0.08, title: 'Find The Rope', body: 'Hold W to climb. Use A/D to stay near the fixed rope.' },
      { id: 'jump', min: 0.04, max: 0.2, title: 'Crevasse Timing', body: 'Press Space at the dark slit. Jumping too early can still drop you short.' },
      { id: 'crouch', min: 0.1, max: 0.28, title: 'Whiteout Posture', body: 'Hold C when snow closes in. Crouching saves stamina and morale.' },
      { id: 'dodge', min: 0.16, max: 0.34, title: 'Side Step', body: 'Tap Shift to dodge sideways. Later peaks use this for avalanches.' },
      { id: 'rope', min: 0.12, max: 0.38, title: 'Recover Supplies', body: 'When a glowing cache is near, press F to throw the rope.' },
      { id: 'camp', min: 0.2, max: 0.34, title: 'Use Camp', body: 'At Camp I, press E once to restore oxygen, stamina, and morale.' }
    ];

    this.currentTutorialPrompt = steps.find((step) => progress >= step.min && progress <= step.max && !this.tutorialSeen.has(step.id)) || null;
  }

  crevasseRisk(hazard) {
    const dx = this.player.root.position.x - hazard.position.x;
    const dz = this.player.root.position.z - hazard.position.z;
    const angle = -(hazard.rotation.y || 0);
    const localX = dx * Math.cos(angle) - dz * Math.sin(angle);
    const localZ = dx * Math.sin(angle) + dz * Math.cos(angle);
    const along = Math.abs(localX);
    const across = Math.abs(localZ);
    const lengthPressure = Math.max(0, 1 - along / 6.8);
    const edgePressure = Math.max(0, 1 - across / 2.25) * lengthPressure;
    const fallPressure = Math.max(0, 1 - across / 0.72) * lengthPressure;
    return {
      distance: 4.8 * (1 - edgePressure),
      fallPressure
    };
  }

  startCrevasseFall(hazard) {
    if (this.state !== 'playing') return;
    const data = hazard.metadata || {};
    data.touching = true;
    this.metrics.hazardHits += 1;
    this.metrics.morale = Math.max(0, this.metrics.morale - 18);
    this.metrics.stamina = Math.max(0, this.metrics.stamina - 22);
    this.metrics.climbers = Math.max(1, this.metrics.climbers - 1);
    this.fallTimer = 0;
    this.fallTarget = hazard.position.clone();
    this.player.velocity.set(0, 0, 0);
    this.player.verticalVelocity = -3.5;
    this.player.grounded = false;
    this.cameraShake = Math.max(this.cameraShake, 1.4);
    this.state = 'falling';
    this.audio.fail();
    this.setMessage('Crevasse fall. The rope team turns back.', 4);
  }

  updateCrevasseFall(delta) {
    this.fallTimer += delta;
    const target = this.fallTarget || this.player.root.position;
    const progress = Math.min(1, this.fallTimer / 1.45);
    const sink = progress * progress * 5.2;
    this.player.root.position.x += (target.x - this.player.root.position.x) * Math.min(1, delta * 6);
    this.player.root.position.z += (target.z - this.player.root.position.z) * Math.min(1, delta * 6);
    this.player.root.position.y = this.terrainHeightAt(target.x, target.z) + 0.7 - sink;
    this.player.root.rotation.x += (0.65 - this.player.root.rotation.x) * Math.min(1, delta * 5);
    this.player.root.scaling.y += (0.72 - this.player.root.scaling.y) * Math.min(1, delta * 5);

    const cameraTarget = new Vector3(target.x, this.terrainHeightAt(target.x, target.z) + 0.6 - sink * 0.35, target.z);
    this.camera.target = Vector3.Lerp(this.camera.target, cameraTarget, Math.min(1, delta * 4));
    this.camera.radius += (17 - this.camera.radius) * Math.min(1, delta * 3);
    this.camera.beta += (1.22 - this.camera.beta) * Math.min(1, delta * 3);
    this.paintHud();

    if (this.fallTimer > 1.55) {
      this.state = 'failed';
      this.renderResult(false);
    }
  }

  nearestHazardInfo() {
    if (!this.hazards.length) return { distance: Infinity, type: '' };
    return this.hazards.reduce((closest, hazard) => {
      const distance = Vector3.Distance(hazard.position, this.player.root.position);
      return distance < closest.distance ? { distance, type: hazard.metadata?.type || '' } : closest;
    }, { distance: Infinity, type: '' });
  }

  nearestHazardDistance() {
    return this.nearestHazardInfo().distance;
  }

  campCameraBoost(progress) {
    if (!this.camps) return 0;
    return this.camps.reduce((boost, camp) => {
      const distance = Math.abs(progress - camp.progress);
      return Math.max(boost, Math.max(0, 1 - distance / 0.055));
    }, 0);
  }

  updateCamera(delta, isMoving = false) {
    const progress = Math.max(0, Math.min(1, (this.player.root.position.z + 88) / this.level.routeLength));
    const hazardDistance = this.nearestHazardDistance();
    const hazardBoost = Math.max(0, 1 - hazardDistance / 18);
    const campBoost = this.campCameraBoost(progress);
    const summitBoost = Math.max(0, (progress - 0.84) / 0.16);
    this.cameraDanger += (hazardBoost - this.cameraDanger) * Math.min(1, delta * 4);
    this.cameraBob += delta * (isMoving ? 7.5 : 2.2);
    this.cameraShake = Math.max(0, this.cameraShake - delta * 2.8);

    const bobY = Math.sin(this.cameraBob) * (isMoving ? 0.22 : 0.06);
    const bobX = Math.sin(this.cameraBob * 0.5) * (isMoving ? 0.16 : 0.04);
    const shakeX = Math.sin(this.metrics.time * 43) * this.cameraShake * 0.55;
    const shakeY = Math.sin(this.metrics.time * 37 + 1.2) * this.cameraShake * 0.36;
    const lookAhead = 7 + progress * 7 + this.cameraDanger * 4 + summitBoost * 8;
    const height = 2.15 + progress * 1.55 + campBoost * 1.35 + summitBoost * 2.6 + bobY + shakeY;
    const sideLook = bobX + shakeX + this.cameraDanger * Math.sin(this.metrics.time * 1.8) * 1.2;
    const target = this.player.root.position.add(new Vector3(sideLook, height, lookAhead));
    this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, delta * (this.cameraDanger > 0.2 ? 4.8 : 3.5)));
    this.camera.radius = 22 + progress * 7 + this.cameraDanger * 7 + campBoost * 4 + summitBoost * 8;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 1.31 - campBoost * 0.04 - summitBoost * 0.07 + this.cameraDanger * 0.03 + this.cameraShake * 0.025;
  }

  updateSummitMoment(delta) {
    this.summitTimer += delta;
    this.metrics.message = 'Summit reached. Breathe, look, remember.';
    const summitZ = this.level.routeLength - 82;
    const summitX = this.routeCenterAt(summitZ);
    const summitY = this.terrainHeightAt(summitX, summitZ);
    const orbit = this.summitTimer * 0.28;
    const target = new Vector3(summitX + Math.sin(orbit) * 1.2, summitY + 5.2, summitZ - 2 + Math.cos(orbit) * 1.2);
    this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, delta * 2.4));
    this.camera.radius += (42 - this.camera.radius) * Math.min(1, delta * 1.8);
    this.camera.alpha = -Math.PI / 2 + Math.sin(orbit) * 0.18;
    this.camera.beta = 0.98;
    this.paintHud();
    if (this.summitTimer > 7) {
      this.state = 'summit-result';
      this.renderResult(true);
    }
  }

  checkProgress() {
    const progress = (this.player.root.position.z + 88) / this.level.routeLength;
    this.checkCampProgress(progress);
    if (this.metrics.oxygen <= 0 || this.metrics.morale <= 0 || this.metrics.stamina <= -8) {
      this.finish(false);
    }
    if (progress >= 0.98) {
      this.finish(true);
    }
  }

  checkCampProgress(progress) {
    for (let i = 1; i < this.camps.length; i += 1) {
      const camp = this.camps[i];
      if (progress >= camp.progress && this.metrics.campIndex < i) {
        this.metrics.campIndex = i;
        this.metrics.campReady = !camp.used;
        this.setMessage(camp.used
          ? `${camp.name} reached. Supplies already used.`
          : `${camp.name} reached. Press E to resupply.`, 6);
      }
    }
  }

  useCheckpoint() {
    if (this.state !== 'playing' || !this.metrics.campReady) return;
    const camp = this.camps[this.metrics.campIndex];
    if (!camp || camp.used) return;
    this.metrics.oxygen = Math.min(100, this.metrics.oxygen + camp.oxygen);
    this.metrics.stamina = Math.min(100, this.metrics.stamina + camp.stamina);
    this.metrics.morale = Math.min(100, this.metrics.morale + camp.morale);
    this.metrics.campReady = false;
    camp.used = true;
    this.metrics.campsUsed += 1;
    this.audio.camp();
    this.setMessage(`${camp.name}: oxygen, tea, and a slower heartbeat.`, 6);
  }

  finish(success) {
    if (this.state !== 'playing') return;
    this.state = success ? 'summit' : 'failed';
    if (success) {
      this.summitTimer = 0;
      this.audio.summit();
      const best = this.records[this.level.id];
      if (!best || this.metrics.time < best) {
        this.records[this.level.id] = this.metrics.time;
        localStorage.setItem('sherpa.records', JSON.stringify(this.records));
      }
      this.setMessage('Summit reached. Breathe, look, remember.', 8);
      return;
    }
    this.audio.fail();
    this.renderResult(success);
  }

  t(dialogue) {
    return dialogue[this.lang] || dialogue.en;
  }

  formatTime(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  hudPrompt() {
    if (this.state === 'summit') {
      return { kind: 'camp', title: 'Summit Reached', body: 'Breathe, look, remember.' };
    }
    if (this.metrics.campReady) {
      const camp = this.camps[this.metrics.campIndex];
      return { kind: 'camp', title: camp?.name || 'Camp Reached', body: 'Press E to resupply oxygen, stamina, and morale.' };
    }
    if (this.currentTutorialPrompt) return { kind: 'tutorial', ...this.currentTutorialPrompt };
    if (this.metrics.oxygen < 24) return { kind: 'danger', title: 'Low Oxygen', body: 'Slow down and look for the next camp.' };
    if (this.metrics.stamina < 20) return { kind: 'warning', title: 'Low Stamina', body: 'Hold R to rest before pushing higher.' };
    if (this.metrics.morale < 26) return { kind: 'warning', title: 'Morale Falling', body: 'Avoid hazards and conserve the team.' };

    const cache = this.nearestToolInfo(18);
    if (cache.tool) return { kind: 'camp', title: 'Cache In Range', body: 'Press F to throw the rope and recover supplies.' };

    const hazard = this.nearestHazardInfo();
    if (hazard.distance < 9.5) {
      const labels = {
        avalanche: ['Avalanche Path', 'Time Shift to dodge the slide path.'],
        blizzard: ['Whiteout Zone', 'Crouch with C and follow the rope.'],
        crevasse: ['Crevasse Ahead', 'Press Space at the edge. Late jumps are safer.'],
        spirit: ['Mountain Spirit', 'Patience matters here. Ease your pace.']
      };
      const [title, body] = labels[hazard.type] || ['Hazard Ahead', 'Stay alert and keep moving.'];
      return { kind: 'danger', title, body };
    }

    return null;
  }

  renderMenu() {
    const bestRows = this.levels.map((level) => `<li><span>${level.name}</span><b>${this.records[level.id] ? this.formatTime(this.records[level.id]) : '--:--'}</b></li>`).join('');
    this.uiRoot.innerHTML = `
      <section class="menu">
        <div class="brand">
          <p class="eyebrow">Solukhumbu guiding simulator</p>
          <h1>Sherpa: Karma of the Peaks</h1>
          <p class="story">Karma is a veteran Sherpa asked to guide ambitious foreign climbers across Nepal's great peaks. The leaderboard remembers speed, but the mountains respect restraint.</p>
          <div class="actions">
            <button id="startGame">Start Everest</button>
            <button id="toggleLang">${this.lang === 'en' ? 'नेपाली' : 'English'}</button>
          </div>
        </div>
        <aside class="panel">
          <h2>Five Mountains</h2>
          ${this.levels.map((level, index) => `<button class="levelPick" data-level="${index}"><span>${level.name}</span><small>${level.festival}</small></button>`).join('')}
        </aside>
        <aside class="leaderboard">
          <h2>Fastest Summit Times</h2>
          <ol>${bestRows}</ol>
        </aside>
      </section>`;
    this.uiRoot.querySelector('#startGame').addEventListener('click', () => this.beginLevel(0));
    this.uiRoot.querySelector('#toggleLang').addEventListener('click', () => {
      this.lang = this.lang === 'en' ? 'ne' : 'en';
      localStorage.setItem('sherpa.lang', this.lang);
      this.renderMenu();
    });
    this.uiRoot.querySelectorAll('.levelPick').forEach((button) => button.addEventListener('click', () => this.beginLevel(Number(button.dataset.level))));
  }

  renderHud() {
    this.uiRoot.innerHTML = `
      <section class="hud">
        <div class="topbar">
          <div><p class="eyebrow">${this.level.region} · ${this.level.elevation}m</p><h2>${this.level.name}</h2></div>
          <button id="menuButton">Menu</button>
        </div>
        <div class="meters">
          <label>Oxygen <span id="oxygenLabel"></span><i id="oxygenBar"></i></label>
          <label>Stamina <span id="staminaLabel"></span><i id="staminaBar"></i></label>
          <label>Morale <span id="moraleLabel"></span><i id="moraleBar"></i></label>
        </div>
        <div id="promptPanel" class="prompt hidden">
          <b id="promptTitle"></b>
          <span id="promptBody"></span>
        </div>
        <div class="actionHud">
          <span>Flow <b id="comboLabel">x0</b></span>
          <span>Skill <b id="skillLabel">0</b></span>
          <span id="boostLabel">steady</span>
        </div>
        <div class="status"><span id="timeLabel">00:00</span><span id="progressLabel">0%</span><span id="climberLabel">3/3</span><span id="messageLabel">Space jump · C crouch · Shift dodge · F rope</span></div>
      </section>`;
    this.uiRoot.querySelector('#menuButton').addEventListener('click', () => {
      this.state = 'menu';
      this.renderMenu();
    });
  }

  paintHud() {
    const set = (id, value) => {
      this.uiRoot.querySelector(`#${id}Label`).textContent = `${Math.max(0, Math.round(value))}%`;
      this.uiRoot.querySelector(`#${id}Bar`).style.setProperty('--value', `${Math.max(0, Math.min(100, value))}%`);
    };
    if (!this.uiRoot.querySelector('#oxygenLabel')) return;
    set('oxygen', this.metrics.oxygen);
    set('stamina', this.metrics.stamina);
    set('morale', this.metrics.morale);
    const progress = Math.max(0, Math.min(100, ((this.player.root.position.z + 88) / this.level.routeLength) * 100));
    this.uiRoot.querySelector('#timeLabel').textContent = this.formatTime(this.metrics.time);
    this.uiRoot.querySelector('#progressLabel').textContent = `${Math.round(progress)}%`;
    this.uiRoot.querySelector('#climberLabel').textContent = `${this.metrics.climbers}/3`;
    this.uiRoot.querySelector('#messageLabel').textContent = this.metrics.message || 'Space jump · C crouch · Shift dodge · F rope';
    const comboLabel = this.uiRoot.querySelector('#comboLabel');
    if (comboLabel) {
      comboLabel.textContent = `x${this.metrics.combo}`;
      this.uiRoot.querySelector('#skillLabel').textContent = this.metrics.skillScore;
      this.uiRoot.querySelector('#boostLabel').textContent = this.flowBoostTimer > 0 ? 'boost' : 'steady';
    }
    const prompt = this.hudPrompt();
    const promptPanel = this.uiRoot.querySelector('#promptPanel');
    if (promptPanel) {
      promptPanel.className = prompt ? `prompt ${prompt.kind}` : 'prompt hidden';
      this.uiRoot.querySelector('#promptTitle').textContent = prompt?.title || '';
      this.uiRoot.querySelector('#promptBody').textContent = prompt?.body || '';
    }
  }

  karmaScore(success) {
    const survival = this.metrics.climbers * 120;
    const reserves = Math.round(this.metrics.oxygen + this.metrics.stamina + this.metrics.morale);
    const restraint = Math.max(0, 160 - this.metrics.hazardHits * 22);
    const campWisdom = this.metrics.campsUsed * 24;
    const resourcefulness = this.metrics.toolsCollected * 18;
    const style = Math.min(180, this.metrics.skillScore * 0.18);
    const speedPressure = success ? Math.max(0, 120 - Math.floor(this.metrics.time * 0.45)) : 0;
    return Math.max(0, Math.round((success ? 180 : 40) + survival + reserves + restraint + campWisdom + resourcefulness + style + speedPressure));
  }

  resultRows(success) {
    return [
      ['Time', this.formatTime(this.metrics.time)],
      ['Karma score', this.karmaScore(success)],
      ['Climbers', `${this.metrics.climbers}/3`],
      ['Oxygen', `${Math.max(0, Math.round(this.metrics.oxygen))}%`],
      ['Stamina', `${Math.max(0, Math.round(this.metrics.stamina))}%`],
      ['Morale', `${Math.max(0, Math.round(this.metrics.morale))}%`],
      ['Skill score', this.metrics.skillScore],
      ['Best flow', `x${this.metrics.bestCombo}`],
      ['Hazard contacts', this.metrics.hazardHits],
      ['Caches recovered', this.metrics.toolsCollected],
      ['Camps used', `${this.metrics.campsUsed}/3`]
    ];
  }

  renderResult(success) {
    const next = Math.min(this.levelIndex + 1, this.levels.length - 1);
    const title = success ? 'Summit Reached' : 'Expedition Turned Back';
    const copy = success
      ? `${this.level.name} allowed Karma's team to stand on the summit. The mountain remembers more than speed.`
      : 'Karma chose survival over glory. The mountain will still be there tomorrow.';
    const rows = this.resultRows(success).map(([label, value]) => `<li><span>${label}</span><b>${value}</b></li>`).join('');
    const isFinalPeak = success && this.levelIndex === this.levels.length - 1;
    this.uiRoot.innerHTML = `
      <section class="result">
        <div>
          <p class="eyebrow">${this.level.mood}</p>
          <h1>${title}</h1>
          <p>${copy}</p>
          <ul class="runStats">${rows}</ul>
          <div class="actions">
            <button id="retryButton">${success ? 'Climb Again' : 'Retry'}</button>
            <button id="nextButton">${isFinalPeak ? 'Five Summits' : this.levelIndex === this.levels.length - 1 ? 'Leaderboard' : 'Next Mountain'}</button>
          </div>
        </div>
      </section>`;
    this.uiRoot.querySelector('#retryButton').addEventListener('click', () => this.beginLevel(this.levelIndex));
    this.uiRoot.querySelector('#nextButton').addEventListener('click', () => {
      if (isFinalPeak) {
        this.renderFiveSummits();
      } else if (this.levelIndex === this.levels.length - 1) {
        this.state = 'menu';
        this.renderMenu();
      } else {
        this.beginLevel(next);
      }
    });
  }

  renderFiveSummits() {
    const bestRows = this.levels.map((level) => `<li><span>${level.name}</span><b>${this.records[level.id] ? this.formatTime(this.records[level.id]) : '--:--'}</b></li>`).join('');
    this.uiRoot.innerHTML = `
      <section class="result finale">
        <div>
          <p class="eyebrow">Five mountains, one rope</p>
          <h1>Five Summits</h1>
          <p>Karma has guided teams across Nepal's great peaks. The leaderboard keeps time; the mountains keep the lesson.</p>
          <ul class="runStats">${bestRows}</ul>
          <div class="actions">
            <button id="menuButton">Return to Menu</button>
          </div>
        </div>
      </section>`;
    this.uiRoot.querySelector('#menuButton').addEventListener('click', () => {
      this.state = 'menu';
      this.renderMenu();
    });
  }
}
