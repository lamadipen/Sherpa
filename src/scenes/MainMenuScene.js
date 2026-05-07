import {
  Scene, ArcRotateCamera, Vector3, Color3, Color4,
  HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial,
  ParticleSystem, Texture, Animation, Mesh
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture, Rectangle, TextBlock, Button, Control,
  StackPanel, Image, Grid
} from '@babylonjs/gui';
import { GameState } from '../Game.js';

export class MainMenuScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.gui = null;
  }

  async create() {
    const engine = this.game.engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.05, 0.07, 0.15, 1);

    this._setupCamera();
    this._setupLights();
    this._buildMountainBackdrop();
    this._buildSnowParticles();
    this._buildPrayerFlags();
    this._buildGUI();
  }

  _setupCamera() {
    const cam = new ArcRotateCamera('menuCam', -Math.PI / 2, Math.PI / 2.6, 45, Vector3.Zero(), this.scene);
    cam.lowerRadiusLimit = 45;
    cam.upperRadiusLimit = 45;
    cam.lowerBetaLimit = Math.PI / 2.8;
    cam.upperBetaLimit = Math.PI / 2.3;

    // Gentle auto-rotate
    this.scene.registerBeforeRender(() => {
      cam.alpha += 0.0003;
    });
  }

  _setupLights() {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene);
    ambient.intensity = 0.6;
    ambient.diffuse = new Color3(0.7, 0.8, 1.0);
    ambient.groundColor = new Color3(0.3, 0.4, 0.6);

    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1), this.scene);
    sun.intensity = 0.8;
    sun.diffuse = new Color3(1.0, 0.95, 0.85);
  }

  _buildMountainBackdrop() {
    const snowMat = new StandardMaterial('menu_snow', this.scene);
    snowMat.diffuseColor = new Color3(0.92, 0.95, 1.0);
    snowMat.specularColor = new Color3(0.4, 0.45, 0.5);
    snowMat.specularPower = 64;

    const rockMat = new StandardMaterial('menu_rock', this.scene);
    rockMat.diffuseColor = new Color3(0.38, 0.35, 0.32);

    // Ground plane
    const ground = MeshBuilder.CreateGround('menu_ground', { width: 200, height: 80 }, this.scene);
    ground.material = snowMat;
    ground.position.y = -8;

    // Background peaks
    const peaks = [
      { x: 0, z: -25, h: 40, r: 18, tess: 8 },
      { x: -22, z: -20, h: 28, r: 12, tess: 6 },
      { x: 22, z: -22, h: 32, r: 14, tess: 7 },
      { x: -40, z: -15, h: 22, r: 10, tess: 6 },
      { x: 40, z: -18, h: 25, r: 11, tess: 6 },
    ];

    peaks.forEach((p, i) => {
      const mt = MeshBuilder.CreateCylinder(`bg_peak_${i}`, {
        height: p.h, diameterTop: 0, diameterBottom: p.r, tessellation: p.tess
      }, this.scene);
      mt.material = i === 0 ? snowMat : (i % 2 === 0 ? snowMat : rockMat);
      mt.position.set(p.x, p.h / 2 - 8 - 3, p.z);

      // Snow cap
      if (i > 0) {
        const cap = MeshBuilder.CreateCylinder(`cap_${i}`, {
          height: p.h * 0.4, diameterTop: 0, diameterBottom: p.r * 0.5, tessellation: p.tess
        }, this.scene);
        cap.material = snowMat;
        cap.position.set(p.x, p.h * 0.8 - 8, p.z);
      }
    });

    // Foreground snow field with drifts
    for (let i = 0; i < 12; i++) {
      const drift = MeshBuilder.CreateSphere(`drift_${i}`, {
        diameter: 3 + Math.random() * 5, segments: 6
      }, this.scene);
      drift.material = snowMat;
      drift.scaling.y = 0.2;
      drift.position.set(-50 + i * 10 + (Math.random() - 0.5) * 6, -7.5, 5 + (Math.random() - 0.5) * 8);
    }

    // Foreground tent
    this._buildBaseCampTent();
  }

  _buildBaseCampTent() {
    const tentMat = new StandardMaterial('tent', this.scene);
    tentMat.diffuseColor = new Color3(0.8, 0.15, 0.15);

    const tent = MeshBuilder.CreateCylinder('tent_mesh', {
      height: 2, diameterTop: 0, diameterBottom: 4, tessellation: 4
    }, this.scene);
    tent.material = tentMat;
    tent.position.set(-15, -7.2, 8);
    tent.rotation.y = Math.PI / 4;

    // Yak silhouette
    const yakMat = new StandardMaterial('yak', this.scene);
    yakMat.diffuseColor = new Color3(0.15, 0.1, 0.08);
    const yakBody = MeshBuilder.CreateBox('yak_body', { width: 2.5, height: 1.2, depth: 1 }, this.scene);
    yakBody.material = yakMat;
    yakBody.position.set(10, -7.2, 10);

    const yakHead = MeshBuilder.CreateBox('yak_head', { width: 0.8, height: 0.9, depth: 0.9 }, this.scene);
    yakHead.material = yakMat;
    yakHead.position.set(11.6, -6.8, 10);

    // Animate yak gentle bob
    this.scene.registerBeforeRender(() => {
      yakBody.position.y = -7.2 + Math.sin(Date.now() / 1200) * 0.05;
      yakHead.position.y = -6.8 + Math.sin(Date.now() / 1200) * 0.05;
    });
  }

  _buildSnowParticles() {
    const snow = new ParticleSystem('menu_snow', 2000, this.scene);
    snow.emitter = new Vector3(0, 20, 0);
    snow.minEmitBox = new Vector3(-60, -2, -10);
    snow.maxEmitBox = new Vector3(60, 2, 10);
    snow.color1 = new Color4(0.95, 0.97, 1, 0.7);
    snow.color2 = new Color4(0.85, 0.9, 1, 0.5);
    snow.colorDead = new Color4(1, 1, 1, 0);
    snow.minSize = 0.06;
    snow.maxSize = 0.18;
    snow.minLifeTime = 5;
    snow.maxLifeTime = 10;
    snow.emitRate = 300;
    snow.gravity = new Vector3(-0.5, -2.5, 0);
    snow.direction1 = new Vector3(-0.4, -1, 0);
    snow.direction2 = new Vector3(0.1, -1, 0);
    snow.minAngularSpeed = 0;
    snow.maxAngularSpeed = Math.PI * 0.3;
    snow.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    snow.start();
  }

  _buildPrayerFlags() {
    const flagColors = [
      new Color3(0.1, 0.4, 0.9),
      new Color3(0.95, 0.95, 0.95),
      new Color3(0.85, 0.1, 0.15),
      new Color3(0.1, 0.55, 0.15),
      new Color3(0.92, 0.7, 0.1)
    ];

    for (let i = 0; i < 15; i++) {
      const c = flagColors[i % 5];
      const fMat = new StandardMaterial(`pflag_${i}`, this.scene);
      fMat.diffuseColor = c;
      fMat.backFaceCulling = false;
      const flag = MeshBuilder.CreatePlane(`pflag_mesh_${i}`, { width: 1.0, height: 0.7 }, this.scene);
      flag.material = fMat;
      const t = i / 14;
      flag.position.set(-21 + t * 42, 3 + Math.sin(t * Math.PI) * 2 - 4, 6);
      flag.rotation.y = Math.PI / 8;

      // Wave animation
      const startAngle = i * 0.4;
      this.scene.registerBeforeRender(() => {
        flag.rotation.z = Math.sin(Date.now() / 600 + startAngle) * 0.15;
      });
    }

    // Rope connecting flags
    const rope = MeshBuilder.CreateTube('flag_rope', {
      path: Array.from({ length: 16 }, (_, i) => {
        const t = i / 15;
        return new Vector3(-21 + t * 42, 3.5 + Math.sin(t * Math.PI) * 2 - 4 - Math.sin(t * Math.PI) * 0.5, 6);
      }),
      radius: 0.03,
      tessellation: 4
    }, this.scene);
    const ropeMat = new StandardMaterial('rope_mat', this.scene);
    ropeMat.diffuseColor = new Color3(0.5, 0.4, 0.3);
    rope.material = ropeMat;
  }

  _buildGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('MainMenuUI', true, this.scene);

    // Dark overlay gradient at bottom for readability
    const overlay = new Rectangle('overlay');
    overlay.width = '100%';
    overlay.height = '55%';
    overlay.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    overlay.background = 'linear-gradient(transparent, rgba(5, 8, 20, 0.95))';
    overlay.color = 'transparent';
    overlay.thickness = 0;
    this.gui.addControl(overlay);

    // Mountain name (top) - Everest in the background
    const mountainName = new TextBlock('mountainName');
    mountainName.text = 'सगरमाथा  ·  Sagarmatha';
    mountainName.color = 'rgba(180, 200, 240, 0.5)';
    mountainName.fontSize = 14;
    mountainName.fontFamily = 'Noto Sans Devanagari, Rajdhani, sans-serif';
    mountainName.letterSpacing = 3;
    mountainName.top = '16px';
    mountainName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    mountainName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.gui.addControl(mountainName);

    // Main title
    const title = new TextBlock('title');
    title.text = 'SHERPA';
    title.color = '#ffffff';
    title.fontSize = 88;
    title.fontFamily = 'Teko, sans-serif';
    title.fontWeight = '700';
    title.letterSpacing = 12;
    title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    title.top = '-120px';
    title.shadowColor = 'rgba(192, 57, 43, 0.6)';
    title.shadowBlur = 40;
    this.gui.addControl(title);

    // Nepali subtitle
    const nepaliTitle = new TextBlock('nepaliTitle');
    nepaliTitle.text = 'शेर्पा';
    nepaliTitle.color = '#f0a500';
    nepaliTitle.fontSize = 28;
    nepaliTitle.fontFamily = 'Noto Sans Devanagari, sans-serif';
    nepaliTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    nepaliTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    nepaliTitle.top = '-60px';
    this.gui.addControl(nepaliTitle);

    // Tagline
    const tagline = new TextBlock('tagline');
    tagline.text = 'CLIMB THE SACRED PEAKS OF NEPAL';
    tagline.color = 'rgba(180, 200, 230, 0.7)';
    tagline.fontSize = 13;
    tagline.fontFamily = 'Rajdhani, sans-serif';
    tagline.letterSpacing = 4;
    tagline.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tagline.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    tagline.top = '-20px';
    this.gui.addControl(tagline);

    // Menu buttons
    const btnData = [
      { text: 'START EXPEDITION', nepali: 'अभियान सुरू', action: () => this.game.transitionTo(GameState.LEVEL_SELECT) },
      { text: 'LEADERBOARD', nepali: 'लीडरबोर्ड', action: () => this._showLeaderboard() },
      { text: 'SETTINGS', nepali: 'सेटिङ', action: () => this._showSettings() }
    ];

    btnData.forEach((btn, i) => {
      const button = this._createMenuButton(btn.text, btn.nepali);
      button.top = `${60 + i * 70}px`;
      button.onPointerClickObservable.add(btn.action);
      this.gui.addControl(button);
    });

    // Version / credits
    const credits = new TextBlock('credits');
    credits.text = 'v1.0  ·  Made with ♥ for Nepal  ·  CC0 Assets: kenney.nl · quaternius.com';
    credits.color = 'rgba(100, 130, 170, 0.5)';
    credits.fontSize = 10;
    credits.fontFamily = 'Rajdhani, sans-serif';
    credits.letterSpacing = 1;
    credits.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    credits.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    credits.top = '-12px';
    this.gui.addControl(credits);
  }

  _createMenuButton(text, nepali) {
    const btn = new Rectangle(`btn_${text}`);
    btn.width = '320px';
    btn.height = '52px';
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    btn.background = 'rgba(192, 57, 43, 0.15)';
    btn.color = 'rgba(192, 57, 43, 0.6)';
    btn.thickness = 1;
    btn.cornerRadius = 4;

    const label = new TextBlock(`btn_label_${text}`);
    label.text = text;
    label.color = '#ffffff';
    label.fontSize = 18;
    label.fontFamily = 'Teko, sans-serif';
    label.letterSpacing = 3;
    label.left = '0px';
    label.top = '-4px';
    btn.addControl(label);

    const nepaliLabel = new TextBlock(`btn_np_${text}`);
    nepaliLabel.text = nepali;
    nepaliLabel.color = 'rgba(240, 165, 0, 0.6)';
    nepaliLabel.fontSize = 10;
    nepaliLabel.fontFamily = 'Noto Sans Devanagari, sans-serif';
    nepaliLabel.top = '14px';
    btn.addControl(nepaliLabel);

    btn.isPointerBlocker = true;

    btn.onPointerEnterObservable.add(() => {
      btn.background = 'rgba(192, 57, 43, 0.4)';
      btn.color = 'rgba(255, 100, 80, 0.9)';
      label.color = '#fff';
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = 'rgba(192, 57, 43, 0.15)';
      btn.color = 'rgba(192, 57, 43, 0.6)';
    });

    return btn;
  }

  _showLeaderboard() {
    import('../ui/LeaderboardUI.js').then(({ LeaderboardUI }) => {
      new LeaderboardUI(this.gui, this.game.saveData).show();
    });
  }

  _showSettings() {
    import('../ui/SettingsUI.js').then(({ SettingsUI }) => {
      new SettingsUI(this.gui, this.game).show();
    }).catch(() => {
      // Settings UI not yet implemented
    });
  }

  dispose() {
    this.gui?.dispose();
    this.scene?.dispose();
    this.scene = null;
  }
}
