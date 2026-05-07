import { MeshBuilder, StandardMaterial, Color3, Vector3, Mesh } from '@babylonjs/core';

function noise(x, y, seed = 0) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = noise(ix, iy, seed);
  const b = noise(ix + 1, iy, seed);
  const c = noise(ix, iy + 1, seed);
  const d = noise(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (d - b - c + a) * ux * uy;
}

function fbm(x, y, octaves, seed) {
  let value = 0, amplitude = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * freq, y * freq, seed + i) * amplitude;
    amplitude *= 0.5;
    freq *= 2;
  }
  return value;
}

export class TerrainBuilder {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.meshes = [];
  }

  buildLevelTerrain(levelConfig, sectionIndex = 0) {
    const section = levelConfig.sections[sectionIndex];
    const platforms = [];

    const altitudeFraction = section.altitude / levelConfig.elevation;
    const isHigh = altitudeFraction > 0.7;
    const isVeryHigh = altitudeFraction > 0.9;

    const snowMat = this.assetManager.createSnowMaterial(`snow_${sectionIndex}`);
    const iceMat = this.assetManager.createIceMaterial(`ice_${sectionIndex}`);
    const rockMat = this.assetManager.createRockMaterial(`rock_${sectionIndex}`);

    const groundMat = isVeryHigh ? iceMat : (isHigh ? snowMat : rockMat);

    // Ground platform
    const ground = MeshBuilder.CreateGround(`ground_${sectionIndex}`, {
      width: 120, height: 40, subdivisions: 32
    }, this.scene);
    ground.material = groundMat;
    ground.position.y = -1;
    ground.receiveShadows = true;
    platforms.push(ground);
    this.meshes.push(ground);

    // Generate section platforms
    const platformCount = section.platforms;
    let x = -40, y = 0;

    for (let i = 0; i < platformCount; i++) {
      const t = i / platformCount;
      const pWidth = 4 + Math.random() * 6;
      const pHeight = 0.6;
      const pDepth = 6 + Math.random() * 4;

      x += 6 + Math.random() * 4;
      y = Math.sin(t * Math.PI * 2) * 2 + t * 8 + (Math.random() - 0.5) * 1.5;

      const platform = MeshBuilder.CreateBox(`platform_${sectionIndex}_${i}`, {
        width: pWidth, height: pHeight, depth: pDepth
      }, this.scene);

      const pMat = isVeryHigh ? iceMat.clone(`pmat_ice_${i}`) :
                   isHigh ? snowMat.clone(`pmat_snow_${i}`) :
                   rockMat.clone(`pmat_rock_${i}`);
      platform.material = pMat;
      platform.position.set(x, y, 0);
      platform.receiveShadows = true;
      platform.metadata = { type: 'platform', icy: isVeryHigh, surface: section.id };

      platforms.push(platform);
      this.meshes.push(platform);

      // Add rocky detail props
      if (Math.random() > 0.6 && !isVeryHigh) {
        this._addRockCluster(x + (Math.random() - 0.5) * pWidth, y + 0.5, 0);
      }

      // Add snow pile on top of platform
      if (isHigh && Math.random() > 0.5) {
        this._addSnowPile(x, y + 0.5, 0, pWidth * 0.6);
      }
    }

    // Background mountain silhouettes
    this._buildBackgroundMountains(levelConfig, sectionIndex);

    // Foreground ground clutter
    this._buildGroundClutter(section, isHigh, isVeryHigh);

    return platforms;
  }

  _buildBackgroundMountains(levelConfig, sectionIndex) {
    const layers = [
      { z: -30, scale: 1.6, opacity: 0.3, color: new Color3(0.4, 0.5, 0.7) },
      { z: -20, scale: 1.2, opacity: 0.5, color: new Color3(0.6, 0.65, 0.75) },
      { z: -10, scale: 0.9, opacity: 0.7, color: new Color3(0.8, 0.85, 0.9) }
    ];

    layers.forEach((layer, li) => {
      for (let i = 0; i < 5; i++) {
        const w = 20 + Math.random() * 30;
        const h = 10 + Math.random() * 20;
        const mt = MeshBuilder.CreateCylinder(`bg_mt_${sectionIndex}_${li}_${i}`, {
          height: h, diameterTop: 0, diameterBottom: w, tessellation: 6
        }, this.scene);
        const mat = new StandardMaterial(`bg_mt_mat_${li}_${i}`, this.scene);
        mat.diffuseColor = layer.color;
        mat.alpha = layer.opacity;
        mat.backFaceCulling = false;
        mt.material = mat;
        mt.position.set(-60 + i * 30 + Math.random() * 15, h / 2 - 5, layer.z);
        mt.isPickable = false;
        this.meshes.push(mt);
      }
    });
  }

  _addRockCluster(x, y, z) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const rock = this.assetManager.randomRock(`rock_${i}_${x | 0}`);
      const s = 0.4 + Math.random() * 0.7;
      rock.scaling.setAll(s);
      rock.position.set(x + (Math.random() - 0.5) * 2, y, z + (Math.random() - 0.5) * 2);
      rock.rotation.y = Math.random() * Math.PI * 2;
      rock.isPickable = false;
      this.meshes.push(rock);
    }
  }

  _addSnowPile(x, y, z, width) {
    const mat = this.assetManager.createSnowMaterial('snow_pile');
    const pile = MeshBuilder.CreateSphere('snow_pile', { diameter: width * 0.4, segments: 6 }, this.scene);
    pile.material = mat;
    pile.scaling.y = 0.3;
    pile.position.set(x, y, z);
    pile.isPickable = false;
    this.meshes.push(pile);
  }

  _buildGroundClutter(section, isHigh, isVeryHigh) {
    if (isVeryHigh) return;
    const isBaseCamp = section.id === 'base_camp';
    for (let i = 0; i < 8; i++) {
      const x = -50 + i * 15 + (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 4;
      if (!isHigh) {
        const tree = this.assetManager.randomTree(false, `tree_${i}`);
        tree.position.set(x, 0, z);
        tree.scaling.setAll(0.25 + Math.random() * 0.15);
        tree.rotation.y = Math.random() * Math.PI * 2;
        tree.isPickable = false;
        this.meshes.push(tree);
      } else {
        this._addRockCluster(x, 0, z);
      }
    }
    if (isBaseCamp) this._addBaseCampProps();
  }

  _addBaseCampProps() {
    // Tent cluster on the left side of base camp
    const tent = this.assetManager.spawnClone('tent', 'base_tent');
    tent.position.set(-28, 0, 2);
    tent.rotation.y = Math.PI / 6;
    tent.scaling.setAll(1.5);
    tent.isPickable = false;
    this.meshes.push(tent);

    const tentSmall = this.assetManager.spawnClone('tent_small', 'base_tent_small');
    tentSmall.position.set(-22, 0, -2);
    tentSmall.rotation.y = -Math.PI / 4;
    tentSmall.scaling.setAll(1.4);
    tentSmall.isPickable = false;
    this.meshes.push(tentSmall);

    // Campfire between tents
    const fire = this.assetManager.spawnClone('campfire', 'base_fire');
    fire.position.set(-25, 0, 0);
    fire.scaling.setAll(1.2);
    fire.isPickable = false;
    this.meshes.push(fire);

    // Oxygen/supply chest near checkpoint
    const chest = this.assetManager.spawnClone('supply_chest', 'base_chest');
    chest.position.set(-18, 0, 1);
    chest.rotation.y = Math.PI / 3;
    chest.scaling.setAll(1.3);
    chest.isPickable = false;
    this.meshes.push(chest);
  }

  buildCheckpointMarker(position) {
    const flag = this.assetManager.spawnClone('goal_flag', 'checkpoint_flag');
    flag.scaling.setAll(1.8);
    flag.position.copyFrom(position);
    flag.isPickable = false;
    this.meshes.push(flag);
    return flag;
  }

  buildSummitZone(levelConfig) {
    const summit = new Mesh('summit_zone', this.scene);

    const snowMat = this.assetManager.createSnowMaterial('summit_snow');
    const peak = MeshBuilder.CreateCylinder('summit_peak', {
      height: 4, diameterTop: 2, diameterBottom: 8, tessellation: 8
    }, this.scene);
    peak.material = snowMat;
    peak.parent = summit;
    peak.position.y = 2;

    // Nepal flag at summit
    this._buildSummitFlag(summit);

    this.meshes.push(summit);
    return summit;
  }

  _buildSummitFlag(parent) {
    const poleMat = new StandardMaterial('summit_pole', this.scene);
    poleMat.diffuseColor = new Color3(0.9, 0.85, 0.7);
    const pole = MeshBuilder.CreateCylinder('summit_pole', { height: 3, diameter: 0.06 }, this.scene);
    pole.material = poleMat;
    pole.parent = parent;
    pole.position.y = 5.5;

    // Nepal flag (simplified triangular approximation)
    const flagMat = new StandardMaterial('nepal_flag', this.scene);
    flagMat.diffuseColor = new Color3(0.8, 0.05, 0.15);
    flagMat.backFaceCulling = false;
    const flag = MeshBuilder.CreateCylinder('nepal_flag_mesh', {
      height: 1.2, diameterTop: 0, diameterBottom: 1.2, tessellation: 3
    }, this.scene);
    flag.material = flagMat;
    flag.parent = parent;
    flag.rotation.z = -Math.PI / 2;
    flag.position.set(0.6, 7, 0);
  }

  dispose() {
    this.meshes.forEach(m => m.dispose());
    this.meshes = [];
  }
}
