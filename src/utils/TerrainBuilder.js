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
    this._buildExpeditionRoute(platforms, section, isHigh, isVeryHigh);

    // Foreground ground clutter
    this._buildGroundClutter(section, isHigh, isVeryHigh);

    return platforms;
  }

  _buildExpeditionRoute(platforms, section, isHigh, isVeryHigh) {
    if (platforms.length < 2) return;

    const routeMat = new StandardMaterial(`fixed_rope_${section.id}`, this.scene);
    routeMat.diffuseColor = isVeryHigh ? new Color3(0.95, 0.35, 0.2) : new Color3(0.95, 0.75, 0.25);
    routeMat.emissiveColor = routeMat.diffuseColor.scale(0.15);

    const points = platforms
      .slice(1)
      .map(p => p.position.add(new Vector3(0, 1.0, 2.15)));

    const rope = MeshBuilder.CreateTube(`route_rope_${section.id}`, {
      path: points,
      radius: 0.035,
      tessellation: 6
    }, this.scene);
    rope.material = routeMat;
    rope.isPickable = false;
    this.meshes.push(rope);

    points.forEach((pt, i) => {
      if (i % 2 !== 0) return;
      this._addRouteStake(pt.x, pt.y - 0.65, pt.z, routeMat);
    });

    const routeFeatures = section.routeFeatures ?? [];
    if (routeFeatures.includes('prayer_flags')) {
      this._addPrayerFlagLine(points[Math.floor(points.length * 0.25)] ?? points[0]);
    }
    if (routeFeatures.includes('ladder_crossing')) {
      this._addLadderCrossing(points[Math.floor(points.length * 0.45)] ?? points[0]);
    }
    if (routeFeatures.includes('serac_wall')) {
      this._addSeracWall(points[Math.floor(points.length * 0.55)] ?? points[0]);
    }
    if (routeFeatures.includes('summit_ridge')) {
      this._addSummitRidgeMarkers(points.slice(-3));
    }
  }

  _addRouteStake(x, y, z, mat) {
    const stake = MeshBuilder.CreateCylinder('route_stake', { height: 1.45, diameter: 0.06, tessellation: 6 }, this.scene);
    stake.material = mat;
    stake.position.set(x, y, z);
    stake.isPickable = false;
    this.meshes.push(stake);
  }

  _addPrayerFlagLine(anchor) {
    const colors = [
      new Color3(0.05, 0.25, 0.9),
      new Color3(0.95, 0.95, 0.9),
      new Color3(0.85, 0.05, 0.08),
      new Color3(0.1, 0.55, 0.15),
      new Color3(0.95, 0.72, 0.05)
    ];

    for (let i = 0; i < 10; i++) {
      const mat = new StandardMaterial(`route_prayer_flag_${i}`, this.scene);
      mat.diffuseColor = colors[i % colors.length];
      mat.backFaceCulling = false;

      const flag = MeshBuilder.CreatePlane('route_prayer_flag', { width: 0.75, height: 0.5 }, this.scene);
      flag.material = mat;
      flag.position.set(anchor.x - 3.5 + i * 0.8, anchor.y + Math.sin(i * 0.7) * 0.2 + 0.8, anchor.z + 0.15);
      flag.rotation.y = Math.PI / 8;
      flag.isPickable = false;
      this.meshes.push(flag);
    }
  }

  _addLadderCrossing(anchor) {
    const woodMat = new StandardMaterial('ladder_wood', this.scene);
    woodMat.diffuseColor = new Color3(0.55, 0.34, 0.18);
    const railA = MeshBuilder.CreateBox('crevasse_ladder_rail_a', { width: 5.5, height: 0.08, depth: 0.08 }, this.scene);
    const railB = MeshBuilder.CreateBox('crevasse_ladder_rail_b', { width: 5.5, height: 0.08, depth: 0.08 }, this.scene);
    [railA, railB].forEach((rail, i) => {
      rail.material = woodMat;
      rail.position.set(anchor.x, anchor.y - 0.8, anchor.z + (i === 0 ? -0.45 : 0.45));
      rail.isPickable = false;
      this.meshes.push(rail);
    });

    for (let i = 0; i < 7; i++) {
      const rung = MeshBuilder.CreateBox('crevasse_ladder_rung', { width: 0.1, height: 0.08, depth: 1.1 }, this.scene);
      rung.material = woodMat;
      rung.position.set(anchor.x - 2.4 + i * 0.8, anchor.y - 0.78, anchor.z);
      rung.isPickable = false;
      this.meshes.push(rung);
    }
  }

  _addSeracWall(anchor) {
    const iceMat = this.assetManager.createIceMaterial('serac_ice');
    for (let i = 0; i < 6; i++) {
      const shard = MeshBuilder.CreateBox('serac_shard', {
        width: 1.2 + Math.random(),
        height: 4 + Math.random() * 3,
        depth: 1.2 + Math.random()
      }, this.scene);
      shard.material = iceMat;
      shard.position.set(anchor.x - 4 + i * 1.6, anchor.y + 1.2 + Math.random(), anchor.z - 2.6);
      shard.rotation.z = (Math.random() - 0.5) * 0.35;
      shard.isPickable = false;
      this.meshes.push(shard);
    }
  }

  _addSummitRidgeMarkers(points) {
    const markerMat = new StandardMaterial('summit_wand_mat', this.scene);
    markerMat.diffuseColor = new Color3(0.95, 0.2, 0.12);
    points.forEach((pt, i) => {
      const wand = MeshBuilder.CreateCylinder('summit_wand', { height: 1.8, diameter: 0.05, tessellation: 6 }, this.scene);
      wand.material = markerMat;
      wand.position.set(pt.x, pt.y - 0.4, pt.z + (i % 2 === 0 ? 0.35 : -0.35));
      wand.rotation.z = 0.15;
      wand.isPickable = false;
      this.meshes.push(wand);
    });
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

    const ropeMat = new StandardMaterial('base_rope_mat', this.scene);
    ropeMat.diffuseColor = new Color3(0.95, 0.72, 0.28);
    const rope = MeshBuilder.CreateTorus('base_rope_coil', { diameter: 1.2, thickness: 0.08, tessellation: 18 }, this.scene);
    rope.material = ropeMat;
    rope.position.set(-15.5, 0.25, 1.4);
    rope.rotation.x = Math.PI / 2;
    rope.isPickable = false;
    this.meshes.push(rope);

    const tableMat = new StandardMaterial('base_route_table_mat', this.scene);
    tableMat.diffuseColor = new Color3(0.45, 0.26, 0.12);
    const routeTable = MeshBuilder.CreateBox('base_route_table', { width: 2.3, height: 0.18, depth: 1.2 }, this.scene);
    routeTable.material = tableMat;
    routeTable.position.set(-20, 0.75, 1.5);
    routeTable.isPickable = false;
    this.meshes.push(routeTable);
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
