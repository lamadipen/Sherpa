import { Vector3, Mesh, MeshBuilder, StandardMaterial, Color3, Color4 } from '@babylonjs/core';

const ClimberState = {
  FOLLOWING: 'FOLLOWING',
  RESTING: 'RESTING',
  STUCK: 'STUCK',
  SICK: 'SICK',
  INJURED: 'INJURED',
  RESCUED: 'RESCUED'
};

export class ClimberNPC {
  constructor(scene, assetManager, index = 0) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.index = index;
    this.state = ClimberState.FOLLOWING;

    this.health = 100;
    this.stress = 0;
    this.followDistance = 3 + index * 1.5;
    this.speed = 4;

    this.mesh = null;
    this.velocity = Vector3.Zero();
    this.isGrounded = false;

    this.stuckTimer = 0;
    this.dialogueCooldown = 0;

    this.dialogs = [
      "Karma bhai, wait!",
      "I can't breathe...",
      "How much further?",
      "My legs are giving out.",
      "This is incredible.",
      "I trust you, Karma."
    ];
  }

  async create(startPosition) {
    this.mesh = this.assetManager._buildCharacterFallback(
      new Mesh(`climber_${this.index}_root`, this.scene), 'climber'
    );
    this.mesh.position.copyFrom(startPosition);
    this.mesh.position.x -= this.followDistance;

    const nameMat = new StandardMaterial(`climber_${this.index}_indicator`, this.scene);
    nameMat.emissiveColor = new Color3(0.2, 0.8, 0.3);
    const indicator = MeshBuilder.CreateSphere(`climber_ind_${this.index}`, { diameter: 0.2 }, this.scene);
    indicator.material = nameMat;
    indicator.parent = this.mesh;
    indicator.position.y = 2.5;
    this.healthIndicator = indicator;

    return this.mesh;
  }

  update(dt, karmaPosition, platforms, altitudeState) {
    if (!this.mesh) return;

    this.dialogueCooldown = Math.max(0, this.dialogueCooldown - dt);

    // Update health from altitude
    if (altitudeState) {
      if (altitudeState.altitude > 7000) {
        this.health -= 0.5 * dt;
        this.stress += 0.3 * dt;
      } else if (altitudeState.altitude > 5000) {
        this.health -= 0.1 * dt;
        this.stress += 0.1 * dt;
      }

      if (altitudeState.altitudeSickness > 0.5) {
        this.state = ClimberState.SICK;
        this.health -= 1.5 * dt;
      }
    }

    this.health = Math.max(0, Math.min(100, this.health));
    this.stress = Math.max(0, Math.min(100, this.stress));

    this._updateHealthIndicator();

    if (this.state === ClimberState.SICK || this.state === ClimberState.INJURED) {
      // Slow movement when sick
      this._moveTowardKarma(dt, karmaPosition, this.speed * 0.3);
      return;
    }

    // Check if too far from Karma
    const dist = Vector3.Distance(this.mesh.position, karmaPosition);
    if (dist > this.followDistance + 8) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 3) {
        this.state = ClimberState.STUCK;
        this._triggerHelpDialogue();
      }
    } else {
      this.stuckTimer = 0;
      if (this.state === ClimberState.STUCK) this.state = ClimberState.FOLLOWING;
    }

    if (this.state === ClimberState.FOLLOWING) {
      this._moveTowardKarma(dt, karmaPosition, this.speed);
    }
  }

  _moveTowardKarma(dt, karmaPosition, speed) {
    const targetX = karmaPosition.x - this.followDistance;
    const dx = targetX - this.mesh.position.x;

    if (Math.abs(dx) > 0.5) {
      const dir = Math.sign(dx);
      this.mesh.position.x += dir * speed * dt;
      this.mesh.rotation.y = dir > 0 ? 0 : Math.PI;
    }

    // Simple gravity
    this.velocity.y -= 20 * dt;
    this.mesh.position.y += this.velocity.y * dt;

    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
  }

  _updateHealthIndicator() {
    if (!this.healthIndicator) return;
    const mat = this.healthIndicator.material;
    if (this.health > 60) {
      mat.emissiveColor = new Color3(0.2, 0.8, 0.3);
    } else if (this.health > 30) {
      mat.emissiveColor = new Color3(0.9, 0.7, 0.1);
    } else {
      mat.emissiveColor = new Color3(0.9, 0.1, 0.1);
    }
  }

  heal(amount = 30) {
    this.health = Math.min(100, this.health + amount);
    this.stress = Math.max(0, this.stress - 20);
    if (this.state === ClimberState.SICK || this.state === ClimberState.STUCK) {
      this.state = ClimberState.FOLLOWING;
    }
  }

  _triggerHelpDialogue() {
    if (this.dialogueCooldown > 0) return;
    this.dialogueCooldown = 8;
    return this.dialogs[Math.floor(Math.random() * this.dialogs.length)];
  }

  getStatus() {
    return {
      health: this.health,
      stress: this.stress,
      state: this.state,
      needsHelp: this.state === ClimberState.STUCK || this.state === ClimberState.SICK,
      isAlive: this.health > 0
    };
  }

  dispose() {
    this.mesh?.dispose();
  }
}
