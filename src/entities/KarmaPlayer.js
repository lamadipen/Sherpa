import { Vector3, KeyboardEventTypes } from '@babylonjs/core';

export class KarmaPlayer {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.assetManager = assetManager;

    this.mesh = null;
    this.velocity = new Vector3(0, 0, 0);
    this.isGrounded = false;
    this.isFacingRight = true;

    this.speed = 7;
    this.jumpForce = 14;
    this.gravity = -25;
    this.stamina = 1.0;

    this.keys = {
      left: false, right: false, up: false, down: false,
      jump: false, interact: false, sprint: false
    };

    this.platforms = [];
    this.currentSectionIndex = 0;
    this.sectionProgress = 0;
    this.checkpointReached = false;
    this.atSummit = false;

    this.score = 0;
    this.summitStartTime = 0;

    this._jumpBuffer = 0;
    this._coyoteTime = 0;
  }

  async create(startPosition) {
    this.mesh = await this.assetManager.loadModel('karma');
    this.mesh.position.copyFrom(startPosition);
    this.mesh.scaling.setAll(0.9);

    this._setupInput();
    this.summitStartTime = Date.now();

    return this.mesh;
  }

  _setupInput() {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const isDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;
      const key = kbInfo.event.code;

      if (key === 'ArrowLeft' || key === 'KeyA') this.keys.left = isDown;
      if (key === 'ArrowRight' || key === 'KeyD') this.keys.right = isDown;
      if (key === 'Space' || key === 'ArrowUp' || key === 'KeyW') this.keys.jump = isDown;
      if (key === 'KeyE') this.keys.interact = isDown;
      if (key === 'ShiftLeft' || key === 'ShiftRight') this.keys.sprint = isDown;
    });

    // Touch controls (mobile)
    if ('ontouchstart' in window) {
      this._setupTouchControls();
    }
  }

  _setupTouchControls() {
    let touchStartX = 0;
    this.scene.getEngine().getRenderingCanvas().addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      const w = window.innerWidth;
      const x = e.touches[0].clientX;
      if (x < w * 0.35) this.keys.left = true;
      else if (x > w * 0.65) this.keys.right = true;
      else this.keys.jump = true;
    });
    this.scene.getEngine().getRenderingCanvas().addEventListener('touchend', () => {
      this.keys.left = false;
      this.keys.right = false;
      this.keys.jump = false;
    });
  }

  update(dt, altitudeState) {
    if (!this.mesh) return;

    const speedMult = altitudeState?.speedMultiplier ?? 1;
    const isSprinting = this.keys.sprint && this.stamina > 0.1;
    const moveSpeed = this.speed * speedMult * (isSprinting ? 1.5 : 1);

    // Horizontal movement
    let moveX = 0;
    if (this.keys.left) { moveX = -1; this.isFacingRight = false; }
    if (this.keys.right) { moveX = 1; this.isFacingRight = true; }

    this.mesh.rotation.y = this.isFacingRight ? 0 : Math.PI;

    // Stamina
    if (isSprinting && moveX !== 0) {
      this.stamina = Math.max(0, this.stamina - 0.15 * dt);
    } else {
      this.stamina = Math.min(1, this.stamina + 0.08 * dt);
    }

    // Apply horizontal velocity
    this.velocity.x = moveX * moveSpeed;

    // Jump input buffering
    if (this.keys.jump) {
      this._jumpBuffer = 0.12;
    }
    this._jumpBuffer = Math.max(0, this._jumpBuffer - dt);

    // Coyote time
    if (this.isGrounded) {
      this._coyoteTime = 0.1;
    }
    this._coyoteTime = Math.max(0, this._coyoteTime - dt);

    // Jump
    if (this._jumpBuffer > 0 && this._coyoteTime > 0 && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this._jumpBuffer = 0;
      this._coyoteTime = 0;
    }

    // Variable jump height (let go early = shorter jump)
    if (!this.keys.jump && this.velocity.y > 5) {
      this.velocity.y = Math.max(5, this.velocity.y - 40 * dt);
    }

    // Gravity
    this.velocity.y += this.gravity * dt;
    this.velocity.y = Math.max(this.velocity.y, -40);

    // Apply movement
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.y += this.velocity.y * dt;
    this.mesh.position.z = 0; // Lock Z for 2.5D

    // Platform collision
    this.isGrounded = false;
    this._resolvePlatformCollisions();

    // Don't fall below world
    if (this.mesh.position.y < -10) {
      this.mesh.position.y = -10;
      this.velocity.y = 0;
      this.onFallDeath?.();
    }

    // Track progress (x position as section progress proxy)
    this.sectionProgress = (this.mesh.position.x + 40) / 80;

    // Score accumulates over time based on climber health (updated in GameScene)
    this.score += 1 * dt;

    return {
      position: this.mesh.position.clone(),
      isGrounded: this.isGrounded,
      velocity: this.velocity.clone(),
      stamina: this.stamina,
      progress: this.sectionProgress,
      wantsInteract: this.keys.interact
    };
  }

  _resolvePlatformCollisions() {
    const pos = this.mesh.position;
    const halfW = 0.35, halfH = 0.9;

    for (const platform of this.platforms) {
      if (!platform || !platform.position) continue;

      // Get platform bounds
      const bounds = platform.getBoundingInfo().boundingBox;
      const pMin = bounds.minimumWorld;
      const pMax = bounds.maximumWorld;

      // Broad check
      if (pos.x + halfW < pMin.x || pos.x - halfW > pMax.x) continue;
      if (pos.y + halfH < pMin.y || pos.y - halfH > pMax.y + 2) continue;

      // Landing on top of platform
      if (this.velocity.y <= 0) {
        const playerBottom = pos.y - halfH;
        const prevBottom = playerBottom - this.velocity.y * 0.016;

        if (prevBottom >= pMax.y - 0.15 && playerBottom <= pMax.y + 0.1) {
          if (pos.x + halfW > pMin.x + 0.1 && pos.x - halfW < pMax.x - 0.1) {
            pos.y = pMax.y + halfH;
            this.velocity.y = 0;
            this.isGrounded = true;

            // Icy platforms reduce friction
            if (platform.metadata?.icy) {
              this.velocity.x *= 0.98;
            }
          }
        }
      }

      // Head bump
      if (this.velocity.y > 0) {
        const playerTop = pos.y + halfH;
        if (playerTop >= pMin.y && playerTop - this.velocity.y * 0.016 < pMin.y) {
          if (pos.x + halfW > pMin.x + 0.1 && pos.x - halfW < pMax.x - 0.1) {
            this.velocity.y = 0;
          }
        }
      }

      // Wall collisions
      if (pos.y - halfH < pMax.y - 0.2 && pos.y + halfH > pMin.y + 0.2) {
        if (pos.x - halfW < pMax.x && pos.x - halfW > pMax.x - 0.5 && this.velocity.x < 0) {
          pos.x = pMax.x + halfW;
          this.velocity.x = 0;
        }
        if (pos.x + halfW > pMin.x && pos.x + halfW < pMin.x + 0.5 && this.velocity.x > 0) {
          pos.x = pMin.x - halfW;
          this.velocity.x = 0;
        }
      }
    }
  }

  setPlatforms(platforms) {
    this.platforms = platforms;
  }

  getElapsedTime() {
    return Date.now() - this.summitStartTime;
  }

  dispose() {
    this.mesh?.dispose();
  }
}
