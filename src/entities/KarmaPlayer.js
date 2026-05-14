import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';

export class KarmaPlayer {
  constructor(scene) {
    this.scene = scene;
    this.root = new TransformNode('karmaRoot', scene);
    this.root.position = new Vector3(0, 0.7, -82);
    this.speed = 12;
    this.lateralLimit = 13;
    this._stepTime = 0;
    this.velocity = new Vector3(0, 0, 0);
    this.verticalVelocity = 0;
    this.grounded = true;
    this.jumpTimer = 0;
    this.dodgeTimer = 0;
    this.toolTimer = 0;
    this.actionHeight = 0;
    this.actions = { jumping: false, crouching: false, dodging: false, usingTool: false };
    this.meshes = this.createStylizedSherpa();
  }

  createStylizedSherpa() {
    const skin = this.material('karmaSkin', '#a96943');
    const jacket = this.material('karmaJacket', '#d62839');
    const pants = this.material('karmaPants', '#203047');
    const pack = this.material('karmaPack', '#2f6f73');
    const accent = this.material('karmaAccent', '#ffd166');
    const scarf = this.material('karmaScarf', '#1f5fbf');
    const wool = this.material('karmaWool', '#f0e6d2');
    const boot = this.material('karmaBoot', '#201713');
    const rope = this.material('karmaRope', '#d9b978');
    const marker = this.material('karmaMarker', '#ffcf5a');

    const body = MeshBuilder.CreateCapsule('karmaBody', { height: 1.45, radius: 0.34 }, this.scene);
    body.material = jacket;
    body.parent = this.root;
    body.position.y = 0.52;

    const head = MeshBuilder.CreateSphere('karmaHead', { diameter: 0.45, segments: 16 }, this.scene);
    head.material = skin;
    head.parent = this.root;
    head.position.y = 1.45;

    const hat = MeshBuilder.CreateCylinder('karmaTopi', { height: 0.22, diameterTop: 0.34, diameterBottom: 0.46, tessellation: 6 }, this.scene);
    hat.material = accent;
    hat.parent = this.root;
    hat.position.y = 1.76;
    hat.rotation.z = 0.08;

    const hatBand = MeshBuilder.CreateCylinder('karmaTopiBand', { height: 0.06, diameterTop: 0.37, diameterBottom: 0.47, tessellation: 6 }, this.scene);
    hatBand.material = scarf;
    hatBand.parent = this.root;
    hatBand.position.y = 1.67;
    hatBand.rotation.z = 0.08;

    const scarfWrap = MeshBuilder.CreateTorus('karmaScarfWrap', { diameter: 0.66, thickness: 0.055, tessellation: 18 }, this.scene);
    scarfWrap.material = scarf;
    scarfWrap.parent = this.root;
    scarfWrap.position.y = 1.17;
    scarfWrap.rotation.x = Math.PI / 2;

    const scarfTail = MeshBuilder.CreateBox('karmaScarfTail', { width: 0.14, height: 0.52, depth: 0.07 }, this.scene);
    scarfTail.material = scarf;
    scarfTail.parent = this.root;
    scarfTail.position.set(0.27, 0.92, -0.28);
    scarfTail.rotation.z = -0.16;

    const backpack = MeshBuilder.CreateBox('karmaBackpack', { width: 0.68, height: 1.02, depth: 0.32 }, this.scene);
    backpack.material = pack;
    backpack.parent = this.root;
    backpack.position.set(0, 0.67, -0.35);

    const bedroll = MeshBuilder.CreateCylinder('karmaBedroll', { height: 0.78, diameter: 0.22, tessellation: 12 }, this.scene);
    bedroll.material = wool;
    bedroll.parent = this.root;
    bedroll.position.set(0, 1.22, -0.48);
    bedroll.rotation.z = Math.PI / 2;

    const ropeCoil = MeshBuilder.CreateTorus('karmaRopeCoil', { diameter: 0.48, thickness: 0.045, tessellation: 20 }, this.scene);
    ropeCoil.material = rope;
    ropeCoil.parent = this.root;
    ropeCoil.position.set(-0.39, 0.74, -0.39);
    ropeCoil.rotation.y = Math.PI / 2;

    const leftLeg = MeshBuilder.CreateCapsule('karmaLeftLeg', { height: 0.9, radius: 0.12 }, this.scene);
    leftLeg.material = pants;
    leftLeg.parent = this.root;
    leftLeg.position.set(-0.16, -0.35, 0);

    const rightLeg = leftLeg.clone('karmaRightLeg');
    rightLeg.position.x = 0.16;

    const leftBoot = MeshBuilder.CreateBox('karmaLeftBoot', { width: 0.22, height: 0.16, depth: 0.36 }, this.scene);
    leftBoot.material = boot;
    leftBoot.parent = this.root;
    leftBoot.position.set(-0.16, -0.82, 0.06);

    const rightBoot = leftBoot.clone('karmaRightBoot');
    rightBoot.position.x = 0.16;

    const leftArm = MeshBuilder.CreateCapsule('karmaLeftArm', { height: 0.82, radius: 0.08 }, this.scene);
    leftArm.material = jacket;
    leftArm.parent = this.root;
    leftArm.position.set(-0.42, 0.63, 0);
    leftArm.rotation.z = -0.24;

    const rightArm = leftArm.clone('karmaRightArm');
    rightArm.position.x = 0.42;
    rightArm.rotation.z = 0.24;

    const chestStrap = MeshBuilder.CreateBox('karmaChestStrap', { width: 0.12, height: 1.05, depth: 0.05 }, this.scene);
    chestStrap.material = rope;
    chestStrap.parent = this.root;
    chestStrap.position.set(-0.08, 0.66, 0.34);
    chestStrap.rotation.z = -0.42;

    const pole = MeshBuilder.CreateCylinder('karmaIceAxe', { height: 1.35, diameter: 0.035 }, this.scene);
    pole.material = accent;
    pole.parent = this.root;
    pole.position.set(0.48, 0.35, 0.1);
    pole.rotation.z = 0.28;

    const overheadMarker = MeshBuilder.CreateTorus('karmaOverheadMarker', { diameter: 0.9, thickness: 0.035, tessellation: 24 }, this.scene);
    overheadMarker.material = marker;
    overheadMarker.parent = this.root;
    overheadMarker.position.y = 2.18;
    overheadMarker.rotation.x = Math.PI / 2;

    return { body, leftLeg, rightLeg, leftBoot, rightBoot, leftArm, rightArm, pole, overheadMarker };
  }

  material(name, hex) {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = Color3.FromHexString(hex);
    mat.specularColor = new Color3(0.08, 0.08, 0.08);
    mat.emissiveColor = name === 'karmaMarker' ? Color3.FromHexString(hex).scale(0.45) : Color3.Black();
    return mat;
  }

  reset() {
    this.root.position.set(0, 0.7, -82);
    this.root.rotation.set(0, 0, 0);
    this.root.scaling.setAll(1);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.grounded = true;
    this.jumpTimer = 0;
    this.dodgeTimer = 0;
    this.toolTimer = 0;
    this.actionHeight = 0;
    this.actions = { jumping: false, crouching: false, dodging: false, usingTool: false };
  }

  update(input, delta, level, movementContext = {}) {
    if (input.jumpPressed && this.grounded && !input.rest) {
      this.verticalVelocity = 8.4;
      this.grounded = false;
    }
    if (input.dodgePressed && this.dodgeTimer <= 0 && !input.rest) {
      this.dodgeTimer = 0.22;
      const direction = input.left ? -1 : input.right ? 1 : Math.sign(movementContext.cross || 1);
      this.velocity.x += direction * 8.5;
    }
    if (input.toolPressed) this.toolTimer = 0.35;
    input.jumpPressed = false;
    input.dodgePressed = false;
    input.toolPressed = false;

    const move = new Vector3(0, 0, 0);
    if (input.forward) move.z += 1;
    if (input.back) move.z -= 0.45;
    if (input.left) move.x -= 1;
    if (input.right) move.x += 1;

    const pace = input.rest ? 0.28 : input.crouch ? 0.56 : 1;
    const altitudePenalty = 1 - Math.min(0.22, Math.max(0, this.root.position.z + 70) / level.routeLength * 0.22);
    const uphillPenalty = move.z > 0 ? 1 - Math.min(0.48, Math.max(0, movementContext.forwardSlope || 0) * 1.28) : 1;
    const traversePenalty = 1 - Math.min(0.18, Math.abs(movementContext.sideSlope || 0) * 0.34);
    const icePenalty = 1 - Math.min(0.18, movementContext.icy || 0);
    const airbornePenalty = this.grounded ? 1 : 0.78;
    const actionBoost = 1 + Math.min(0.28, movementContext.actionBoost || 0);
    const speedScale = altitudePenalty * uphillPenalty * traversePenalty * icePenalty * airbornePenalty * actionBoost;
    const targetSpeed = this.speed * pace * speedScale;

    if (move.lengthSquared() > 0) {
      move.normalize();
      const acceleration = this.grounded ? 34 : 15;
      this.velocity.x += move.x * acceleration * delta;
      this.velocity.z += move.z * acceleration * delta;
      const flatSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      const maxSpeed = targetSpeed * (this.dodgeTimer > 0 ? 1.35 : 1);
      if (flatSpeed > maxSpeed) {
        const scale = maxSpeed / flatSpeed;
        this.velocity.x *= scale;
        this.velocity.z *= scale;
      }
    }

    if (this.dodgeTimer > 0) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - delta);
    }

    if (!input.rest && movementContext.icy > 0.15) {
      const slideForce = Math.sign(movementContext.sideSlope || Math.sin(this.root.position.z * 0.13)) * movementContext.icy * (1.4 + Math.abs(movementContext.sideSlope || 0));
      this.velocity.x += slideForce * delta;
    }

    const friction = this.grounded ? (input.rest ? 10 : input.crouch ? 8 : 6.2) : 1.2;
    const drag = Math.max(0, 1 - friction * delta);
    this.velocity.x *= drag;
    this.velocity.z *= drag;

    this.root.position.x += this.velocity.x * delta;
    this.root.position.z += this.velocity.z * delta;
    this.root.position.x = Math.max(-this.lateralLimit, Math.min(this.lateralLimit, this.root.position.x));
    this.root.position.z = Math.max(-88, Math.min(level.routeLength - 88, this.root.position.z));

    this.verticalVelocity -= 23 * delta;
    this.root.position.y += this.verticalVelocity * delta;
    const groundY = movementContext.groundY ?? (Number.isFinite(movementContext.height) ? movementContext.height + 0.7 : this.root.position.y);
    if (this.root.position.y <= groundY) {
      this.root.position.y = groundY;
      this.verticalVelocity = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    this.actionHeight = Math.max(0, this.root.position.y - groundY);

    this.toolTimer = Math.max(0, this.toolTimer - delta);
    this.actions = {
      jumping: this.actionHeight > 0.25 || !this.grounded,
      crouching: input.crouch,
      dodging: this.dodgeTimer > 0,
      usingTool: this.toolTimer > 0
    };
    this.root.scaling.y += ((input.crouch ? 0.68 : 1) - this.root.scaling.y) * Math.min(1, delta * 12);

    this._stepTime += delta * (move.lengthSquared() > 0 ? 8 : 2);
    this.meshes.leftLeg.rotation.x = Math.sin(this._stepTime) * 0.3;
    this.meshes.rightLeg.rotation.x = Math.sin(this._stepTime + Math.PI) * 0.3;
    this.meshes.leftBoot.rotation.x = Math.sin(this._stepTime) * 0.18;
    this.meshes.rightBoot.rotation.x = Math.sin(this._stepTime + Math.PI) * 0.18;
    this.meshes.leftArm.rotation.x = Math.sin(this._stepTime + Math.PI) * 0.14;
    this.meshes.rightArm.rotation.x = Math.sin(this._stepTime) * 0.14;
    this.meshes.pole.rotation.x = this.actions.usingTool ? -0.9 : Math.sin(this._stepTime) * 0.12;
    this.meshes.pole.rotation.z = this.actions.usingTool ? 1.1 : 0.28;
    this.meshes.overheadMarker.rotation.z += delta * 1.8;
    this.root.rotation.y = move.z > 0 ? -move.x * 0.22 : -move.x * 0.12;
    this.root.rotation.z += (((movementContext.sideSlope || 0) * -0.18 + this.velocity.x * -0.015) - this.root.rotation.z) * Math.min(1, delta * 6);
  }
}
