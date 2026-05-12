import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';

const FLAG_COLORS = ['#1f5fbf', '#f3f7fb', '#d62839', '#33a852', '#f2c94c'];

export class HimalayanProps {
  constructor(scene) {
    this.scene = scene;
    this.materials = new Map();
  }

  material(name, hex) {
    if (this.materials.has(name)) return this.materials.get(name);
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = Color3.FromHexString(hex);
    material.specularColor = Color3.FromHexString('#1b1f24');
    this.materials.set(name, material);
    return material;
  }

  createLodge(name, position, options = {}) {
    const root = new TransformNode(name, this.scene);
    root.position = position;
    root.rotation.y = options.rotationY || 0;

    const stone = this.material('lodgeStone', '#8f9aa3');
    const plaster = this.material('lodgePlaster', '#e8dfc8');
    const wood = this.material('lodgeWood', '#5b3b2a');
    const roofMat = this.material('lodgeRoofRed', options.roofColor || '#9f2d27');
    const dark = this.material('lodgeDarkTrim', '#1f2833');
    const brass = this.material('lodgeBrass', '#d6a84f');

    const base = MeshBuilder.CreateBox(`${name}-stone-base`, { width: 5.6, height: 0.7, depth: 4.8 }, this.scene);
    base.parent = root;
    base.position.y = 0.35;
    base.material = stone;

    const body = MeshBuilder.CreateBox(`${name}-whitewashed-body`, { width: 5, height: 2.15, depth: 4.2 }, this.scene);
    body.parent = root;
    body.position.y = 1.72;
    body.material = plaster;

    const leftRoof = MeshBuilder.CreateBox(`${name}-roof-left`, { width: 5.9, height: 0.32, depth: 2.9 }, this.scene);
    leftRoof.parent = root;
    leftRoof.position.set(0, 3.05, -0.95);
    leftRoof.rotation.x = -0.46;
    leftRoof.material = roofMat;

    const rightRoof = leftRoof.clone(`${name}-roof-right`);
    rightRoof.parent = root;
    rightRoof.position.z = 0.95;
    rightRoof.rotation.x = 0.46;

    const ridge = MeshBuilder.CreateBox(`${name}-roof-ridge`, { width: 6.1, height: 0.22, depth: 0.28 }, this.scene);
    ridge.parent = root;
    ridge.position.y = 3.72;
    ridge.material = dark;

    const door = MeshBuilder.CreateBox(`${name}-door`, { width: 0.9, height: 1.4, depth: 0.08 }, this.scene);
    door.parent = root;
    door.position.set(-1.25, 1.16, -2.14);
    door.material = wood;

    const doorKnob = MeshBuilder.CreateSphere(`${name}-door-knob`, { diameter: 0.12, segments: 8 }, this.scene);
    doorKnob.parent = root;
    doorKnob.position.set(-0.93, 1.1, -2.2);
    doorKnob.material = brass;

    [-0.75, 1.35].forEach((x, index) => {
      const window = MeshBuilder.CreateBox(`${name}-window-${index}`, { width: 0.72, height: 0.58, depth: 0.08 }, this.scene);
      window.parent = root;
      window.position.set(x, 2.05, -2.14);
      window.material = dark;

      const sill = MeshBuilder.CreateBox(`${name}-window-sill-${index}`, { width: 0.95, height: 0.12, depth: 0.18 }, this.scene);
      sill.parent = root;
      sill.position.set(x, 1.68, -2.22);
      sill.material = wood;
    });

    for (let i = 0; i < 7; i += 1) {
      const step = MeshBuilder.CreateBox(`${name}-stone-step-${i}`, { width: 0.8 + i * 0.18, height: 0.12, depth: 0.42 }, this.scene);
      step.parent = root;
      step.position.set(-1.25, 0.08 + i * 0.015, -2.72 - i * 0.34);
      step.material = stone;
    }

    this.createPrayerFlags(`${name}-flags`, new Vector3(-3.25, 2.85, -2.45), new Vector3(3.25, 3.25, -2.45), root);
    return root;
  }

  createPrayerFlags(name, start, end, parent = null) {
    const root = new TransformNode(name, this.scene);
    root.parent = parent;

    const wood = this.material('flagPoleWood', '#65432f');
    const cordMat = this.material('flagCord', '#28241e');
    const direction = end.subtract(start);
    const center = start.add(direction.scale(0.5));
    const length = direction.length();

    [start, end].forEach((position, index) => {
      const pole = MeshBuilder.CreateCylinder(`${name}-pole-${index}`, { height: 2.3, diameter: 0.1, tessellation: 8 }, this.scene);
      pole.parent = root;
      pole.position = new Vector3(position.x, position.y - 0.85, position.z);
      pole.material = wood;
    });

    const cord = MeshBuilder.CreateCylinder(`${name}-cord`, { height: length, diameter: 0.035, tessellation: 6 }, this.scene);
    cord.parent = root;
    cord.position = center;
    cord.rotation.z = Math.PI / 2;
    cord.material = cordMat;

    for (let i = 0; i < 12; i += 1) {
      const t = (i + 0.5) / 12;
      const flag = MeshBuilder.CreateBox(`${name}-flag-${i}`, { width: 0.34, height: 0.42, depth: 0.035 }, this.scene);
      flag.parent = root;
      flag.position = start.add(direction.scale(t));
      flag.position.y -= 0.2 + Math.sin(t * Math.PI) * 0.16;
      flag.rotation.z = Math.sin(i * 1.7) * 0.08;
      flag.material = this.material(`flagColor-${i % FLAG_COLORS.length}`, FLAG_COLORS[i % FLAG_COLORS.length]);
    }

    return root;
  }
}
