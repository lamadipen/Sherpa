import { SceneLoader, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export class AssetManager {
  constructor(scene) {
    this.scene = scene;
    this.cache = new Map();
  }

  async loadModel(path, name) {
    if (this.cache.has(path)) {
      return this.cache.get(path).instantiateModelsToScene?.(n => `${name}_${n}`);
    }
    try {
      const result = await SceneLoader.ImportMeshAsync('', path, '', this.scene);
      const root = new Mesh(`${name}_root`, this.scene);
      result.meshes.forEach(m => {
        if (!m.parent) m.parent = root;
      });
      return root;
    } catch (_) {
      return this._buildFallback(name);
    }
  }

  _buildFallback(name) {
    const root = new Mesh(`${name}_root`, this.scene);
    if (name.includes('karma') || name.includes('climber') || name.includes('character')) {
      return this._buildCharacterFallback(root, name);
    }
    if (name.includes('rock')) {
      return this._buildRockFallback(root);
    }
    if (name.includes('tree')) {
      return this._buildTreeFallback(root);
    }
    return root;
  }

  _buildCharacterFallback(root, name) {
    const isKarma = name.includes('karma');
    const mat = new StandardMaterial(`${name}_mat`, this.scene);
    mat.diffuseColor = isKarma ? new Color3(0.2, 0.15, 0.1) : new Color3(0.5, 0.3, 0.2);

    const body = MeshBuilder.CreateCapsule(`${name}_body`, { height: 1.8, radius: 0.35 }, this.scene);
    body.material = mat;
    body.parent = root;
    body.position.y = 0.9;

    const headMat = new StandardMaterial(`${name}_head_mat`, this.scene);
    headMat.diffuseColor = new Color3(0.8, 0.65, 0.5);
    const head = MeshBuilder.CreateSphere(`${name}_head`, { diameter: 0.5 }, this.scene);
    head.material = headMat;
    head.parent = root;
    head.position.y = 1.95;

    if (isKarma) {
      const hatMat = new StandardMaterial(`${name}_hat`, this.scene);
      hatMat.diffuseColor = new Color3(0.7, 0.1, 0.1);
      const hat = MeshBuilder.CreateCylinder(`${name}_hat_mesh`, { height: 0.15, diameterTop: 0.5, diameterBottom: 0.7 }, this.scene);
      hat.material = hatMat;
      hat.parent = root;
      hat.position.y = 2.2;
    }

    const packMat = new StandardMaterial(`${name}_pack`, this.scene);
    packMat.diffuseColor = new Color3(0.3, 0.5, 0.3);
    const pack = MeshBuilder.CreateBox(`${name}_pack_mesh`, { width: 0.4, height: 0.6, depth: 0.2 }, this.scene);
    pack.material = packMat;
    pack.parent = root;
    pack.position.set(0, 1.2, -0.3);

    return root;
  }

  _buildRockFallback(root) {
    const mat = new StandardMaterial('rock_mat', this.scene);
    mat.diffuseColor = new Color3(0.5, 0.48, 0.45);
    const rock = MeshBuilder.CreatePolyhedron('rock', { type: 1, size: 0.8 }, this.scene);
    rock.material = mat;
    rock.parent = root;
    rock.rotation.y = Math.random() * Math.PI;
    return root;
  }

  _buildTreeFallback(root) {
    const trunkMat = new StandardMaterial('trunk_mat', this.scene);
    trunkMat.diffuseColor = new Color3(0.4, 0.25, 0.1);
    const trunk = MeshBuilder.CreateCylinder('trunk', { height: 2, diameter: 0.3 }, this.scene);
    trunk.material = trunkMat;
    trunk.parent = root;
    trunk.position.y = 1;

    const foliageMat = new StandardMaterial('foliage_mat', this.scene);
    foliageMat.diffuseColor = new Color3(0.2, 0.55, 0.2);
    const foliage = MeshBuilder.CreateCylinder('foliage', { height: 2.5, diameterTop: 0, diameterBottom: 2.5 }, this.scene);
    foliage.material = foliageMat;
    foliage.parent = root;
    foliage.position.y = 2.8;

    return root;
  }

  createSnowMaterial(name = 'snow') {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = new Color3(0.95, 0.97, 1.0);
    mat.specularColor = new Color3(0.3, 0.3, 0.35);
    mat.specularPower = 64;
    return mat;
  }

  createIceMaterial(name = 'ice') {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = new Color3(0.7, 0.85, 0.95);
    mat.specularColor = new Color3(0.6, 0.7, 0.8);
    mat.specularPower = 128;
    mat.alpha = 0.85;
    return mat;
  }

  createRockMaterial(name = 'rock') {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = new Color3(0.45, 0.42, 0.38);
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    return mat;
  }
}
