import { MeshBuilder, StandardMaterial, Color3, Vector3, Mesh, Color4, ParticleSystem, Texture } from '@babylonjs/core';

export class HazardSystem {
  constructor(scene, weatherSystem) {
    this.scene = scene;
    this.weatherSystem = weatherSystem;
    this.hazards = [];
    this.activeAvalanche = null;
  }

  spawnHazardsForSection(section, platforms) {
    section.hazards.forEach(hazardType => {
      switch (hazardType) {
        case 'crevasse': this._spawnCrevasses(platforms); break;
        case 'rockfall': this._spawnRockfallZone(platforms); break;
        case 'avalanche': this._prepareAvalancheZone(platforms); break;
        case 'high_wind': this._spawnWindZone(platforms); break;
        case 'altitude_sickness': break;
        case 'spirit_encounter': this._spawnSpiritPortal(platforms); break;
        case 'ice_collapse': this._spawnIceFragments(platforms); break;
      }
    });
  }

  _spawnCrevasses(platforms) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      if (!p) continue;

      const creMat = new StandardMaterial('crevasse_mat', this.scene);
      creMat.diffuseColor = new Color3(0.05, 0.08, 0.15);
      creMat.emissiveColor = new Color3(0.02, 0.04, 0.08);

      const crevasse = MeshBuilder.CreateBox('crevasse', {
        width: 0.8 + Math.random() * 0.6,
        height: 0.1,
        depth: 3 + Math.random() * 2
      }, this.scene);
      crevasse.material = creMat;
      crevasse.position.set(
        p.position.x + (Math.random() - 0.5) * 2,
        p.position.y + 0.35,
        0
      );
      crevasse.metadata = { type: 'crevasse', damage: 30 };
      this.hazards.push(crevasse);

      // Snow cover (hidden crevasse)
      if (Math.random() > 0.5) {
        const coverMat = new StandardMaterial('crevasse_cover', this.scene);
        coverMat.diffuseColor = new Color3(0.9, 0.92, 0.95);
        coverMat.alpha = 0.7;
        const cover = MeshBuilder.CreateBox('crevasse_cover', {
          width: crevasse.scaling.x * 1.2, height: 0.05, depth: crevasse.scaling.z * 1.2
        }, this.scene);
        cover.material = coverMat;
        cover.position.copyFrom(crevasse.position);
        cover.position.y += 0.06;
        cover.metadata = { type: 'crevasse_cover', underMesh: crevasse };
        this.hazards.push(cover);
      }
    }
  }

  _spawnRockfallZone(platforms) {
    const zone = new Mesh('rockfall_zone', this.scene);
    zone.metadata = { type: 'rockfall_trigger', active: false, timer: 0 };
    const p = platforms[Math.floor(platforms.length * 0.5)];
    if (p) zone.position.copyFrom(p.position);
    this.hazards.push(zone);
  }

  _prepareAvalancheZone(platforms) {
    const lastPlatform = platforms[platforms.length - 1];
    const avalancheMat = new StandardMaterial('avalanche_mat', this.scene);
    avalancheMat.diffuseColor = new Color3(0.95, 0.97, 1);
    avalancheMat.alpha = 0.8;

    const snowBlock = MeshBuilder.CreateBox('avalanche_snow', {
      width: 20, height: 8, depth: 6
    }, this.scene);
    snowBlock.material = avalancheMat;
    if (lastPlatform) {
      snowBlock.position.set(lastPlatform.position.x + 15, lastPlatform.position.y + 10, 0);
    }
    snowBlock.isVisible = false;
    snowBlock.metadata = { type: 'avalanche', triggered: false };
    this.hazards.push(snowBlock);
  }

  _spawnWindZone(platforms) {
    const midPlatform = platforms[Math.floor(platforms.length / 2)];
    const windMat = new StandardMaterial('wind_mat', this.scene);
    windMat.diffuseColor = new Color3(0.7, 0.8, 0.95);
    windMat.alpha = 0.15;

    const windZone = MeshBuilder.CreateBox('wind_zone', { width: 12, height: 8, depth: 8 }, this.scene);
    windZone.material = windMat;
    if (midPlatform) windZone.position.copyFrom(midPlatform.position);
    windZone.metadata = { type: 'wind_zone', force: 8 + Math.random() * 4 };
    this.hazards.push(windZone);
  }

  _spawnSpiritPortal(platforms) {
    const lastPlatform = platforms[platforms.length - 2] || platforms[0];

    const portalMat = new StandardMaterial('spirit_portal', this.scene);
    portalMat.diffuseColor = new Color3(0.6, 0.3, 0.9);
    portalMat.emissiveColor = new Color3(0.4, 0.1, 0.7);
    portalMat.alpha = 0.8;

    const portal = MeshBuilder.CreateTorus('spirit_portal', {
      diameter: 3, thickness: 0.3, tessellation: 32
    }, this.scene);
    portal.material = portalMat;
    portal.rotation.x = Math.PI / 2;
    if (lastPlatform) {
      portal.position.set(lastPlatform.position.x, lastPlatform.position.y + 3, 0);
    }
    portal.metadata = { type: 'spirit_portal', active: true };

    // Animate portal rotation
    let angle = 0;
    this.scene.registerBeforeRender(() => {
      angle += 0.02;
      portal.rotation.z = angle;
      const pulse = 0.8 + Math.sin(angle * 2) * 0.2;
      portal.scaling.setAll(pulse);
    });

    this.hazards.push(portal);
  }

  _spawnIceFragments(platforms) {
    platforms.forEach((p, i) => {
      if (i % 3 === 0) {
        p.metadata = { ...p.metadata, collapseTimer: 20 + Math.random() * 10, isCollapsing: false };
      }
    });
  }

  checkCollisions(playerPosition, playerRadius = 0.5) {
    const results = [];
    for (const hazard of this.hazards) {
      if (!hazard.metadata) continue;
      const dist = Vector3.Distance(playerPosition, hazard.getAbsolutePosition());
      if (dist < playerRadius + 1.5) {
        results.push(hazard.metadata);
      }
    }
    return results;
  }

  update(dt, playerPosition, weatherState) {
    if (weatherState.avalancheActive) {
      this.hazards.forEach(h => {
        if (h.metadata?.type === 'avalanche' && !h.metadata.triggered) {
          h.isVisible = true;
          h.metadata.triggered = true;
          h.metadata.velocity = new Vector3(-8, -4, 0);
        }
        if (h.metadata?.type === 'avalanche' && h.metadata.triggered && h.metadata.velocity) {
          h.position.addInPlace(h.metadata.velocity.scale(dt));
        }
      });
    }

    // Collapse icy platforms
    this.hazards.forEach(h => {
      if (h.metadata?.collapseTimer !== undefined) {
        h.metadata.collapseTimer -= dt;
        if (h.metadata.collapseTimer <= 0 && !h.metadata.isCollapsing) {
          h.metadata.isCollapsing = true;
          h.metadata.fallVelocity = 0;
        }
        if (h.metadata.isCollapsing) {
          h.metadata.fallVelocity += 9.81 * dt;
          h.position.y -= h.metadata.fallVelocity * dt;
        }
      }
    });
  }

  dispose() {
    this.hazards.forEach(h => h.dispose());
    this.hazards = [];
  }
}
