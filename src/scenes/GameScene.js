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
    this.camera.lowerRadiusLimit = 18;
    this.camera.upperRadiusLimit = 52;
    this.camera.wheelDeltaPercentage = 0.02;

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
    system.minEmitBox = new Vector3(-42, 0, -120);
    system.maxEmitBox = new Vector3(42, 0, 160);
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
    this.scene.clearColor = Color4.FromHexString(`${this.level.sky}dd`);
    this.clearLevel();
    this.buildMountain();
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
    const ground = MeshBuilder.CreateGround('route-snowfield', { width: 38, height: level.routeLength + 42, subdivisions: 72 }, this.scene);
    ground.position.z = level.routeLength / 2 - 74;
    ground.material = this.materials.snow;

    for (let i = 0; i < 30; i += 1) {
      const z = -82 + i * 9.2;
      const width = 14 + Math.sin(i * 0.77) * 3;
      const ridgeL = MeshBuilder.CreateBox(`route-ridge-l-${i}`, { width: 7, height: 2.8 + i * 0.02, depth: 9 }, this.scene);
      ridgeL.position.set(-width - 7, 0.6, z);
      ridgeL.rotation.z = 0.22;
      ridgeL.material = this.materials.ridge;
      const ridgeR = ridgeL.clone(`route-ridge-r-${i}`);
      ridgeR.position.x = width + 7;
      ridgeR.rotation.z = -0.22;
    }

    const summit = MeshBuilder.CreateCylinder('summit-marker', { height: 8, diameterTop: 0, diameterBottom: 18, tessellation: 4 }, this.scene);
    summit.position.set(0, 3.4, level.routeLength - 82);
    summit.rotation.y = Math.PI / 4;
    summit.material = this.materials.ridge;

    this.cloneAsset('tent_detailedOpen.glb', 'basecamp-tent', new Vector3(-8, 0.4, -84), 1.5, 0.5);
    this.cloneAsset('campfire_stones.glb', 'basecamp-fire', new Vector3(5, 0.08, -83), 1.2, 0);
    this.cloneAsset('bridge_wood.glb', 'checkpoint-bridge', new Vector3(0, 0.2, -82 + level.routeLength * 0.48), 1.2, Math.PI / 2);
    this.props.push(this.himalayanProps.createLodge('basecamp-lodge', new Vector3(-14, 0.2, -88), { rotationY: -0.36 }));
    this.props.push(this.himalayanProps.createLodge('checkpoint-teahouse', new Vector3(13, 0.2, -86 + level.routeLength * 0.48), { rotationY: 0.52, roofColor: '#7f2c25' }));
    this.props.push(this.himalayanProps.createPrayerFlags('route-prayer-flags', new Vector3(-11, 2.4, -65), new Vector3(10, 2.9, -58)));
    for (let i = 0; i < 18; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      this.cloneAsset(i % 3 === 0 ? 'tree_pineRoundC.glb' : 'rock_tallH.glb', `route-prop-${i}`, new Vector3(side * (15 + Math.random() * 8), 0.15, -70 + i * 12), 0.9 + Math.random() * 0.9, Math.random() * Math.PI);
    }
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
    mesh.position.set(x, type === 'crevasse' ? 0.06 : 1.3, z);
    mesh.metadata = { type, baseX: x, speed: 0.7 + Math.random() * 0.8, phase: Math.random() * 6 };
    return mesh;
  }

  update() {
    const delta = this.engine.getDeltaTime() / 1000;
    if (this.state !== 'playing') return;
    const level = this.level;
    this.player.update(this.input, delta, level);
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
        hazard.position.x = data.baseX + Math.sin(this.metrics.time * data.speed + data.phase) * 6;
        hazard.position.z -= delta * (1.2 + this.level.difficulty);
        if (hazard.position.z < this.player.root.position.z - 28) hazard.position.z += 92;
      } else if (data.type === 'spirit') {
        hazard.rotation.y += delta * 1.8;
        hazard.position.y = 1.3 + Math.sin(this.metrics.time * 2 + data.phase) * 0.3;
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
    const target = this.player.root.position.add(new Vector3(0, 4, 8));
    this.camera.target = Vector3.Lerp(this.camera.target, target, Math.min(1, delta * 3.5));
    this.camera.radius = 32;
    this.camera.alpha = Math.PI / 2;
    this.camera.beta = 1.05;
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
