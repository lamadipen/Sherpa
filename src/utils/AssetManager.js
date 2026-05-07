import { SceneLoader, Mesh, MeshBuilder, StandardMaterial, Texture, Color3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

const MODEL_PATHS = {
  // Characters
  karma:           '/assets/models/characters/karma.gltf',
  climber:         '/assets/models/characters/climber.gltf',

  // Platforms
  cliff_block:     '/assets/models/platforms/cliff_block_rock.glb',
  cliff_slope:     '/assets/models/platforms/cliff_blockSlope_rock.glb',
  cliff_steps:     '/assets/models/platforms/cliff_steps_rock.glb',
  cliff_top:       '/assets/models/platforms/cliff_top_rock.glb',
  cliff_large:     '/assets/models/platforms/cliff_large_rock.glb',
  platform_stone:  '/assets/models/platforms/platform_stone.glb',

  // Nature
  rock_large_a:    '/assets/models/nature/rock_largeA.glb',
  rock_large_b:    '/assets/models/nature/rock_largeB.glb',
  rock_large_c:    '/assets/models/nature/rock_largeC.glb',
  rock_small_a:    '/assets/models/nature/rock_smallA.glb',
  rock_small_b:    '/assets/models/nature/rock_smallB.glb',
  rock_tall_a:     '/assets/models/nature/rock_tallA.glb',
  rock_tall_b:     '/assets/models/nature/rock_tallB.glb',
  stone_large:     '/assets/models/nature/stone_largeA.glb',
  tree_cone:       '/assets/models/nature/tree_cone.glb',
  tree_cone_dark:  '/assets/models/nature/tree_cone_dark.glb',
  tree_pine_a:     '/assets/models/nature/tree_pineTallA.glb',
  tree_pine_b:     '/assets/models/nature/tree_pineTallB.glb',
  tree_pine_round: '/assets/models/nature/tree_pineRoundA.glb',
  grass:           '/assets/models/nature/grass.glb',

  // Props
  tent:            '/assets/models/props/tent_detailedClosed.glb',
  tent_small:      '/assets/models/props/tent_smallClosed.glb',
  campfire:        '/assets/models/props/campfire_stones.glb',
  campfire_logs:   '/assets/models/props/campfire_logs.glb',
  goal_flag:       '/assets/models/props/Goal_Flag.gltf',
  oxygen_bottle:   '/assets/models/props/bottle-large.glb',
  supply_chest:    '/assets/models/props/chest.glb',
};

const ROCK_KEYS    = ['rock_large_a', 'rock_large_b', 'rock_large_c', 'rock_small_a', 'rock_tall_a', 'stone_large'];
const TREE_LO_KEYS = ['tree_cone', 'tree_pine_a', 'tree_pine_b'];
const TREE_HI_KEYS = ['tree_cone', 'tree_cone_dark', 'tree_pine_round'];

export const PRELOAD_BASE    = [...ROCK_KEYS, 'grass'];
export const PRELOAD_NATURE  = [...TREE_LO_KEYS, 'tree_pine_round', 'tree_cone_dark'];
export const PRELOAD_PROPS   = ['goal_flag', 'tent', 'tent_small', 'campfire', 'campfire_logs', 'oxygen_bottle', 'supply_chest'];
export const PRELOAD_CHARS   = ['karma', 'climber'];

export class AssetManager {
  constructor(scene) {
    this.scene = scene;
    this._containers = new Map();
  }

  async preloadBatch(keys) {
    await Promise.all(keys.map(k => this._loadContainer(k)));
  }

  async _loadContainer(key) {
    if (this._containers.has(key)) return this._containers.get(key);
    const path = MODEL_PATHS[key];
    if (!path) { this._containers.set(key, null); return null; }
    try {
      const container = await SceneLoader.LoadAssetContainerAsync(path, '', this.scene);
      this._containers.set(key, container);
      return container;
    } catch (e) {
      console.warn(`[AssetManager] Failed to load "${key}":`, e.message);
      this._containers.set(key, null);
      return null;
    }
  }

  spawnClone(key, name) {
    const container = this._containers.get(key);
    if (!container) return this._buildFallback(name || key);

    const uid = `${name || key}_${Math.random().toString(36).slice(2, 7)}`;
    const instances = container.instantiateModelsToScene(n => `${uid}_${n}`);
    const root = new Mesh(uid, this.scene);
    instances.rootNodes.forEach(n => { n.parent = root; });
    return root;
  }

  async loadModel(key) {
    await this._loadContainer(key);
    return this.spawnClone(key, key);
  }

  randomRock(name) {
    const key = ROCK_KEYS[Math.floor(Math.random() * ROCK_KEYS.length)];
    return this.spawnClone(key, name || key);
  }

  randomTree(isHighAlt, name) {
    const keys = isHighAlt ? TREE_HI_KEYS : TREE_LO_KEYS;
    const key = keys[Math.floor(Math.random() * keys.length)];
    return this.spawnClone(key, name || key);
  }

  // ── Materials with PBR textures ──────────────────────────────────────────

  createSnowMaterial(name = 'snow') {
    const mat = new StandardMaterial(name, this.scene);
    const diff = new Texture('/assets/textures/snow_diffuse.jpg', this.scene);
    diff.uScale = 4; diff.vScale = 4;
    mat.diffuseTexture = diff;
    mat.specularColor = new Color3(0.2, 0.22, 0.25);
    mat.specularPower = 64;
    return mat;
  }

  createRockMaterial(name = 'rock') {
    const mat = new StandardMaterial(name, this.scene);
    const diff = new Texture('/assets/textures/rock_diffuse.jpg', this.scene);
    diff.uScale = 3; diff.vScale = 3;
    mat.diffuseTexture = diff;
    mat.specularColor = new Color3(0.06, 0.06, 0.06);
    mat.specularPower = 32;
    return mat;
  }

  createIceMaterial(name = 'ice') {
    const mat = new StandardMaterial(name, this.scene);
    const diff = new Texture('/assets/textures/snow_diffuse.jpg', this.scene);
    diff.uScale = 2; diff.vScale = 2;
    mat.diffuseTexture = diff;
    mat.diffuseColor = new Color3(0.7, 0.85, 0.95);
    mat.specularColor = new Color3(0.5, 0.6, 0.7);
    mat.specularPower = 128;
    mat.alpha = 0.9;
    return mat;
  }

  // ── Fallbacks ─────────────────────────────────────────────────────────────

  _buildFallback(name) {
    const root = new Mesh(`${name}_root`, this.scene);
    if (name.includes('karma') || name.includes('climber')) return this._buildCharacterFallback(root, name);
    if (name.includes('rock') || name.includes('stone'))     return this._buildRockFallback(root);
    if (name.includes('tree') || name.includes('pine') || name.includes('cone')) return this._buildTreeFallback(root);
    return root;
  }

  _buildCharacterFallback(root, name) {
    const isKarma = name.includes('karma');
    const bodyMat = new StandardMaterial(`${name}_mat`, this.scene);
    bodyMat.diffuseColor = isKarma ? new Color3(0.2, 0.15, 0.1) : new Color3(0.5, 0.3, 0.2);
    const body = MeshBuilder.CreateCapsule(`${name}_body`, { height: 1.8, radius: 0.35 }, this.scene);
    body.material = bodyMat; body.parent = root; body.position.y = 0.9;

    const headMat = new StandardMaterial(`${name}_head_mat`, this.scene);
    headMat.diffuseColor = new Color3(0.8, 0.65, 0.5);
    const head = MeshBuilder.CreateSphere(`${name}_head`, { diameter: 0.5 }, this.scene);
    head.material = headMat; head.parent = root; head.position.y = 1.95;

    if (isKarma) {
      const hatMat = new StandardMaterial(`${name}_hat`, this.scene);
      hatMat.diffuseColor = new Color3(0.7, 0.1, 0.1);
      const hat = MeshBuilder.CreateCylinder(`${name}_hat_mesh`, { height: 0.15, diameterTop: 0.5, diameterBottom: 0.7 }, this.scene);
      hat.material = hatMat; hat.parent = root; hat.position.y = 2.2;
    }

    const packMat = new StandardMaterial(`${name}_pack`, this.scene);
    packMat.diffuseColor = new Color3(0.3, 0.5, 0.3);
    const pack = MeshBuilder.CreateBox(`${name}_pack_mesh`, { width: 0.4, height: 0.6, depth: 0.2 }, this.scene);
    pack.material = packMat; pack.parent = root; pack.position.set(0, 1.2, -0.3);

    return root;
  }

  _buildRockFallback(root) {
    const mat = new StandardMaterial(`${root.name}_mat`, this.scene);
    mat.diffuseColor = new Color3(0.5, 0.48, 0.45);
    const rock = MeshBuilder.CreatePolyhedron(`${root.name}_geo`, { type: 1, size: 0.8 }, this.scene);
    rock.material = mat; rock.parent = root; rock.rotation.y = Math.random() * Math.PI;
    return root;
  }

  _buildTreeFallback(root) {
    const trunkMat = new StandardMaterial(`${root.name}_trunk`, this.scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.25, 0.1);
    const trunk = MeshBuilder.CreateCylinder(`${root.name}_trunk_geo`, { height: 2, diameter: 0.3 }, this.scene);
    trunk.material = trunkMat; trunk.parent = root; trunk.position.y = 1;

    const foliageMat = new StandardMaterial(`${root.name}_foliage`, this.scene);
    foliageMat.diffuseColor = new Color3(0.2, 0.55, 0.2);
    const foliage = MeshBuilder.CreateCylinder(`${root.name}_foliage_geo`, { height: 2.5, diameterTop: 0, diameterBottom: 2.5 }, this.scene);
    foliage.material = foliageMat; foliage.parent = root; foliage.position.y = 2.8;

    return root;
  }
}
