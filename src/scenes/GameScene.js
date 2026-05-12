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
  VertexBuffer,
  VertexData,
  Vector3
} from '@babylonjs/core';
import { HimalayanProps } from '../entities/HimalayanProps.js';
import { KarmaPlayer } from '../entities/KarmaPlayer.js';

const ASSET_ROOT = '/assets/vendor/kenney/nature-kit/Models/GLTF%20format/';
const SNOW_PARTICLE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAQAAACFSYyZAAAAEElEQVR42mP8z8AARLJAhQIAHhMD/WSW4hsAAAAASUVORK5CYII=';

export class GameScene {
  constructor(canvas, uiRoot, levels) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.levels = levels;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.input = { forward: false, back: false, left: false, right: false, rest: false };
    this.state = 'menu';
    this.levelIndex = 0;
    this.metrics = this.defaultMetrics();
    this.hazards = [];
    this.props = [];
    this.loadedAssets = new Map();
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
    this.scene.clearColor = Color4.FromHexString('#dff2ffcc');
    this.camera = new ArcRotateCamera('camera', Math.PI / 2, 1.1, 30, new Vector3(0, 3, -70), this.scene);
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 16;
    this.camera.upperRadiusLimit = 58;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.maxZ = 1200;
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.0018;
    this.scene.fogColor = Color3.FromHexString('#dcecf7');

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
      snow: this.mat('snow', '#f6fbff'),
      ridge: this.mat('ridge', '#bed0de'),
      farRidge: this.mat('farRidge', '#9cafbc'),
      farSnow: this.mat('farSnow', '#edf6fb'),
      ice: this.mat('ice', '#73c7df', 0.58),
      hazard: this.mat('hazard', '#101927'),
      avalanche: this.mat('avalanche', '#ffffff'),
      spirit: this.mat('spirit', '#80ffe0', 0.45),
      checkpoint: this.mat('checkpoint', '#ffcf5a')
    };
  }

  mat(name, hex, alpha = 1) {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(hex);
    material.specularColor = Color3.FromHexString('#18202a');
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
    system.emitRate = 440;
    system.gravity = new Vector3(-0.25, -1.2, -0.2);
    system.direction1 = new Vector3(-0.8, -1, -0.4);
    system.direction2 = new Vector3(0.4, -1, 0.2);
    system.start();
    this.snow = system;
  }

  async preloadAssets() {
    const files = ['tent_detailedOpen.glb', 'campfire_stones.glb', 'tree_pineRoundC.glb', 'stone_tallB.glb', 'rock_tallH.glb', 'bridge_wood.glb'];
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

  bindInput() {
    const set = (key, value) => {
      const code = key.toLowerCase();
      if (code === 'w' || key === 'ArrowUp') this.input.forward = value;
      if (code === 's' || key === 'ArrowDown') this.input.back = value;
      if (code === 'a' || key === 'ArrowLeft') this.input.left = value;
      if (code === 'd' || key === 'ArrowRight') this.input.right = value;
      if (key === ' ') this.input.rest = value;
      if (code === 'e' && value) this.useCheckpoint();
    };
    window.addEventListener('keydown', (event) => set(event.key, true));
    window.addEventListener('keyup', (event) => set(event.key, false));
  }

  defaultMetrics() {
    return { oxygen: 100, stamina: 100, morale: 82, climbers: 3, time: 0, checkpoint: 0, message: '' };
  }

  async beginLevel(index) {
    this.levelIndex = index;
    this.level = this.levels[index];
    this.state = 'playing';
    this.metrics = this.defaultMetrics();
    this.player.reset();
    this.player.root.position.x = this.routeCenterAt(this.player.root.position.z);
    this.scene.clearColor = Color4.FromHexString(`${this.level.sky}dd`);
    this.clearLevel();
    this.buildMountain();
    this.player.root.position.y = this.terrainHeightAt(this.player.root.position.x, this.player.root.position.z) + 0.7;
    this.spawnHazards();
    this.renderHud();
  }

  clearLevel() {
    [...this.hazards, ...this.props].forEach((item) => item.dispose?.());
    this.hazards = [];
    this.props = [];
    this.scene.meshes.filter((mesh) => mesh.name.startsWith('route-') || mesh.name.startsWith('summit')).forEach((mesh) => mesh.dispose());
  }

  buildMountain() {
    const level = this.level;
    this.createMountainTerrain();
    this.createRouteMarkers();

    for (let i = 0; i < 30; i += 1) {
      const z = -82 + i * 9.2;
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
    this.buildHorizonPeaks();

    const checkpointZ = -82 + level.routeLength * 0.48;
    this.cloneAssetOnRoute('tent_detailedOpen.glb', 'basecamp-tent', this.routeCenterAt(-84) - 8, -84, 1.5, 0.5, 0.4);
    this.cloneAssetOnRoute('campfire_stones.glb', 'basecamp-fire', this.routeCenterAt(-83) + 5, -83, 1.2, 0, 0.08);
    this.cloneAssetOnRoute('bridge_wood.glb', 'checkpoint-bridge', this.routeCenterAt(checkpointZ), checkpointZ, 1.2, Math.PI / 2, 0.2);
    this.props.push(this.himalayanProps.createLodge('basecamp-lodge', this.routePosition(this.routeCenterAt(-88) - 14, -88, 0.2), { rotationY: -0.36 }));
    this.props.push(this.himalayanProps.createLodge('checkpoint-teahouse', this.routePosition(this.routeCenterAt(checkpointZ - 4) + 13, checkpointZ - 4, 0.2), { rotationY: 0.52, roofColor: '#7f2c25' }));
    this.props.push(this.himalayanProps.createPrayerFlags('route-prayer-flags', this.routePosition(this.routeCenterAt(-65) - 11, -65, 2.4), this.routePosition(this.routeCenterAt(-58) + 10, -58, 2.9)));
    for (let i = 0; i < 18; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -70 + i * 12;
      const x = this.routeCenterAt(z) + side * (18 + Math.random() * 10);
      this.cloneAssetOnRoute(i % 3 === 0 ? 'tree_pineRoundC.glb' : 'rock_tallH.glb', `route-prop-${i}`, x, z, 0.9 + Math.random() * 0.9, Math.random() * Math.PI, 0.15);
    }
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

  createRouteMarkers() {
    const level = this.level;
    for (let i = 0; i <= 26; i += 1) {
      const z = -84 + (level.routeLength / 26) * i;
      const center = this.routeCenterAt(z);
      const marker = MeshBuilder.CreateCylinder(`route-track-marker-${i}`, { height: 0.08, diameter: 1.3, tessellation: 8 }, this.scene);
      marker.position.set(center, this.terrainHeightAt(center, z) + 0.05, z);
      marker.scaling.x = 1.7;
      marker.rotation.y = Math.sin(this.routeProgressAt(z) * Math.PI * 5.4) * 0.7;
      marker.material = i % 3 === 0 ? this.materials.ice : this.materials.snow;
    }
  }

  buildHorizonPeaks() {
    const level = this.level;
    const summitZ = level.routeLength - 82;
    const farZ = summitZ + 68;
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
      peak.material = spec.main ? this.materials.ridge : this.materials.farRidge;

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

  spawnHazards() {
    const level = this.level;
    level.hazards.forEach((type, index) => {
      for (let i = 0; i < 3; i += 1) {
        const z = -48 + index * 34 + i * 26;
        const x = ((i + index) % 2 === 0 ? -1 : 1) * (3 + Math.random() * 6);
        const hazard = this.createHazard(type, x, z);
        this.hazards.push(hazard);
      }
    });
  }

  createHazard(type, x, z) {
    let mesh;
    if (type === 'crevasse') {
      mesh = MeshBuilder.CreateBox(`hazard-${type}`, { width: 7, height: 0.14, depth: 2.4 }, this.scene);
      mesh.material = this.materials.hazard;
    } else if (type === 'avalanche') {
      mesh = MeshBuilder.CreateSphere(`hazard-${type}`, { diameter: 2.8, segments: 12 }, this.scene);
      mesh.material = this.materials.avalanche;
    } else {
      mesh = MeshBuilder.CreateTorus(`hazard-${type}`, { diameter: 3.2, thickness: 0.08 }, this.scene);
      mesh.material = this.materials.spirit;
    }
    const lift = type === 'crevasse' ? 0.08 : 1.3;
    const routeX = this.routeCenterAt(z) + x;
    mesh.position.set(routeX, this.terrainHeightAt(routeX, z) + lift, z);
    mesh.metadata = { type, routeOffset: x, speed: 0.7 + Math.random() * 0.8, phase: Math.random() * 6 };
    return mesh;
  }

  update() {
    const delta = this.engine.getDeltaTime() / 1000;
    if (this.state !== 'playing') return;
    const level = this.level;
    this.player.update(this.input, delta, level);
    const routeCenter = this.routeCenterAt(this.player.root.position.z);
    this.player.root.position.x = Math.max(routeCenter - 12, Math.min(routeCenter + 12, this.player.root.position.x));
    this.player.root.position.y = this.routeHeightAt(this.player.root.position.z, this.player.root.position.x) + 0.7;
    this.metrics.time += delta;
    const isMoving = this.input.forward || this.input.left || this.input.right || this.input.back;
    const altitudeFactor = Math.max(0.25, (this.player.root.position.z + 88) / level.routeLength);
    this.metrics.oxygen -= delta * level.oxygenDrain * (0.28 + altitudeFactor);
    this.metrics.stamina += delta * (this.input.rest ? 12 : isMoving ? -8 * level.staminaDrain : 2.4);
    this.metrics.stamina = Math.max(0, Math.min(100, this.metrics.stamina));
    this.metrics.morale -= delta * (this.metrics.oxygen < 35 ? 1.2 : 0.12);

    this.updateHazards(delta);
    this.updateCamera(delta);
    this.checkProgress();
    this.paintHud();
  }

  updateHazards(delta) {
    this.hazards.forEach((hazard) => {
      const data = hazard.metadata;
      if (data.type === 'avalanche') {
        hazard.position.z -= delta * (1.2 + this.level.difficulty);
        if (hazard.position.z < this.player.root.position.z - 28) hazard.position.z += 92;
        hazard.position.x = this.routeCenterAt(hazard.position.z) + data.routeOffset + Math.sin(this.metrics.time * data.speed + data.phase) * 6;
        hazard.position.y = this.routeHeightAt(hazard.position.z, hazard.position.x) + 1.3;
      } else if (data.type === 'spirit') {
        hazard.rotation.y += delta * 1.8;
        hazard.position.x = this.routeCenterAt(hazard.position.z) + data.routeOffset;
        hazard.position.y = this.routeHeightAt(hazard.position.z, hazard.position.x) + 1.3 + Math.sin(this.metrics.time * 2 + data.phase) * 0.3;
      }

      const distance = Vector3.Distance(hazard.position, this.player.root.position);
      if (distance < (data.type === 'crevasse' ? 3.6 : 2.8)) {
        this.metrics.stamina -= 22 * delta;
        this.metrics.oxygen -= 8 * delta;
        this.metrics.morale -= 10 * delta;
        this.metrics.message = data.type === 'spirit' ? 'The mountain spirit demands patience.' : 'Hold the rope. Stabilize the team.';
      }
    });
  }

  updateCamera(delta) {
    const progress = Math.max(0, Math.min(1, (this.player.root.position.z + 88) / this.level.routeLength));
    const lookAhead = 7 + progress * 7;
    const target = this.player.root.position.add(new Vector3(0, 3.2 + progress * 2.2, lookAhead));
    this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, delta * 3.5));
    this.camera.radius = 24 + progress * 8;
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 1.16;
  }

  checkProgress() {
    const progress = (this.player.root.position.z + 88) / this.level.routeLength;
    if (progress > 0.48 && this.metrics.checkpoint === 0) {
      this.metrics.checkpoint = 1;
      this.metrics.message = 'Checkpoint reached. Press E to resupply.';
    }
    if (this.metrics.oxygen <= 0 || this.metrics.morale <= 0 || this.metrics.stamina <= -8) {
      this.finish(false);
    }
    if (progress >= 0.98) {
      this.finish(true);
    }
  }

  useCheckpoint() {
    if (this.state !== 'playing' || this.metrics.checkpoint !== 1) return;
    this.metrics.oxygen = Math.min(100, this.metrics.oxygen + 30);
    this.metrics.stamina = Math.min(100, this.metrics.stamina + 36);
    this.metrics.morale = Math.min(100, this.metrics.morale + 18);
    this.metrics.checkpoint = 2;
    this.metrics.message = 'Tea, oxygen, and a quiet word with the mountain.';
  }

  finish(success) {
    if (this.state !== 'playing') return;
    this.state = success ? 'summit' : 'failed';
    if (success) {
      const best = this.records[this.level.id];
      if (!best || this.metrics.time < best) {
        this.records[this.level.id] = this.metrics.time;
        localStorage.setItem('sherpa.records', JSON.stringify(this.records));
      }
    }
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
    const dialogue = this.level.dialogue[0];
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
        <div class="brief">
          <b>${dialogue.speaker}</b>
          <p>${this.t(dialogue)}</p>
          <small>${this.level.festival}</small>
        </div>
        <div class="status"><span id="timeLabel">00:00</span><span id="progressLabel">0%</span><span id="messageLabel">WASD to guide · Space to rest</span></div>
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
    this.uiRoot.querySelector('#messageLabel').textContent = this.metrics.message || 'Guide the climbers, conserve oxygen, reach the summit.';
  }

  renderResult(success) {
    const next = Math.min(this.levelIndex + 1, this.levels.length - 1);
    const title = success ? 'Summit Reached' : 'Expedition Turned Back';
    const copy = success
      ? `${this.level.name} allowed Karma's team to stand on the summit. Respect earned in ${this.formatTime(this.metrics.time)}.`
      : 'Karma chose survival over glory. The mountain will still be there tomorrow.';
    this.uiRoot.innerHTML = `
      <section class="result">
        <div>
          <p class="eyebrow">${this.level.mood}</p>
          <h1>${title}</h1>
          <p>${copy}</p>
          <div class="actions">
            <button id="retryButton">${success ? 'Climb Again' : 'Retry'}</button>
            <button id="nextButton">${this.levelIndex === this.levels.length - 1 ? 'Leaderboard' : 'Next Mountain'}</button>
          </div>
        </div>
      </section>`;
    this.uiRoot.querySelector('#retryButton').addEventListener('click', () => this.beginLevel(this.levelIndex));
    this.uiRoot.querySelector('#nextButton').addEventListener('click', () => {
      if (this.levelIndex === this.levels.length - 1) {
        this.state = 'menu';
        this.renderMenu();
      } else {
        this.beginLevel(next);
      }
    });
  }
}
