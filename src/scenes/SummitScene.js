import {
  Scene, ArcRotateCamera, Vector3, Color3, Color4,
  HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial,
  ParticleSystem, Animation
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture, Rectangle, TextBlock, Button, Control, StackPanel
} from '@babylonjs/gui';
import { LEVEL_CONFIGS, LEADERBOARD_SAMPLE } from '../levels/levelConfigs.js';
import { GameState } from '../Game.js';

export class SummitScene {
  constructor(game, payload = {}) {
    this.game = game;
    this.payload = payload;
    this.scene = null;
    this.gui = null;
  }

  async create() {
    const cfg = LEVEL_CONFIGS[this.payload.levelIndex ?? 0];
    this.scene = new Scene(this.game.engine);
    this.scene.clearColor = new Color4(
      cfg.skyColor.r * 0.6,
      cfg.skyColor.g * 0.7,
      cfg.skyColor.b,
      1
    );

    this._setupScene(cfg);
    this._buildGoldenHourParticles();
    this._buildGUI(cfg);
    this._playFanfare();

    this.game.engine.runRenderLoop(() => this.scene?.render());
  }

  _setupScene(cfg) {
    const cam = new ArcRotateCamera('summitCam', -Math.PI / 2, Math.PI / 2.8, 20, new Vector3(0, 2, 0), this.scene);
    cam.lowerRadiusLimit = 18;
    cam.upperRadiusLimit = 25;

    const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), this.scene);
    amb.intensity = 1.2;
    amb.diffuse = new Color3(1, 0.95, 0.85);

    const sun = new DirectionalLight('sun', new Vector3(1, -1, 0.5), this.scene);
    sun.intensity = 1.0;
    sun.diffuse = new Color3(1, 0.9, 0.7);

    // Summit platform
    const snowMat = new StandardMaterial('summit_snow', this.scene);
    snowMat.diffuseColor = new Color3(0.95, 0.97, 1.0);
    snowMat.specularColor = new Color3(0.5, 0.5, 0.55);
    snowMat.specularPower = 80;

    const summit = MeshBuilder.CreateCylinder('summit', {
      height: 3, diameterTop: 4, diameterBottom: 10, tessellation: 8
    }, this.scene);
    summit.material = snowMat;
    summit.position.y = -0.5;

    // Nepal flag at summit
    this._buildSummitFlag(snowMat);

    // Karma character (simple) at summit
    this._buildKarmaAtSummit();

    // Golden hour sky gradient effect
    this.scene.registerBeforeRender(() => {
      cam.alpha += 0.0005;
    });
  }

  _buildSummitFlag(snowMat) {
    const poleMat = new StandardMaterial('pole', this.scene);
    poleMat.diffuseColor = new Color3(0.85, 0.8, 0.7);
    const pole = MeshBuilder.CreateCylinder('summit_pole', { height: 4, diameter: 0.08 }, this.scene);
    pole.material = poleMat;
    pole.position.set(0, 3, 0);

    const flagMat = new StandardMaterial('nepal_flag', this.scene);
    flagMat.diffuseColor = new Color3(0.8, 0.05, 0.15);
    flagMat.backFaceCulling = false;
    const flag = MeshBuilder.CreateCylinder('flag', {
      height: 1.5, diameterTop: 0, diameterBottom: 1.5, tessellation: 3
    }, this.scene);
    flag.material = flagMat;
    flag.rotation.z = -Math.PI / 2;
    flag.position.set(0.75, 4.7, 0);

    // Wave animation
    this.scene.registerBeforeRender(() => {
      flag.rotation.x = Math.sin(Date.now() / 500) * 0.1;
    });
  }

  _buildKarmaAtSummit() {
    const bodyMat = new StandardMaterial('karma_summit', this.scene);
    bodyMat.diffuseColor = new Color3(0.2, 0.15, 0.1);
    const body = MeshBuilder.CreateCapsule('karma_body', { height: 1.8, radius: 0.35 }, this.scene);
    body.material = bodyMat;
    body.position.set(-1.5, 2, 0);
    body.rotation.y = 0.5;

    const headMat = new StandardMaterial('karma_head', this.scene);
    headMat.diffuseColor = new Color3(0.75, 0.6, 0.45);
    const head = MeshBuilder.CreateSphere('karma_head', { diameter: 0.5 }, this.scene);
    head.material = headMat;
    head.position.set(-1.5, 3.0, 0);

    // Arms raised in victory
    const armMat = new StandardMaterial('karma_arms', this.scene);
    armMat.diffuseColor = new Color3(0.2, 0.15, 0.1);
    const armL = MeshBuilder.CreateCylinder('armL', { height: 0.9, diameter: 0.2 }, this.scene);
    armL.material = armMat;
    armL.position.set(-2.1, 2.8, 0);
    armL.rotation.z = -Math.PI / 3;
    const armR = MeshBuilder.CreateCylinder('armR', { height: 0.9, diameter: 0.2 }, this.scene);
    armR.material = armMat;
    armR.position.set(-0.9, 2.8, 0);
    armR.rotation.z = Math.PI / 3;

    // Gentle bob animation
    this.scene.registerBeforeRender(() => {
      const bob = Math.sin(Date.now() / 1000) * 0.03;
      body.position.y = 2 + bob;
      head.position.y = 3.0 + bob;
      armL.position.y = 2.8 + bob;
      armR.position.y = 2.8 + bob;
    });
  }

  _buildGoldenHourParticles() {
    const sparks = new ParticleSystem('sparks', 500, this.scene);
    sparks.emitter = new Vector3(0, 5, 0);
    sparks.minEmitBox = new Vector3(-3, 0, -3);
    sparks.maxEmitBox = new Vector3(3, 0, 3);
    sparks.color1 = new Color4(1, 0.9, 0.3, 0.9);
    sparks.color2 = new Color4(1, 0.7, 0.1, 0.7);
    sparks.colorDead = new Color4(1, 0.5, 0, 0);
    sparks.minSize = 0.05;
    sparks.maxSize = 0.15;
    sparks.minLifeTime = 2;
    sparks.maxLifeTime = 4;
    sparks.emitRate = 100;
    sparks.gravity = new Vector3(0, 0.5, 0);
    sparks.direction1 = new Vector3(-0.5, 1, -0.5);
    sparks.direction2 = new Vector3(0.5, 2, 0.5);
    sparks.start();
  }

  _buildGUI(cfg) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('SummitUI', true, this.scene);

    // Victory title
    const victoryTitle = new TextBlock('victoryTitle');
    victoryTitle.text = 'SUMMIT!';
    victoryTitle.color = '#f0a500';
    victoryTitle.fontSize = 96;
    victoryTitle.fontFamily = 'Teko, sans-serif';
    victoryTitle.fontWeight = '700';
    victoryTitle.letterSpacing = 8;
    victoryTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    victoryTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    victoryTitle.top = '40px';
    victoryTitle.shadowColor = 'rgba(240, 165, 0, 0.4)';
    victoryTitle.shadowBlur = 30;
    this.gui.addControl(victoryTitle);

    // Mountain name
    const mtName = new TextBlock('mtName');
    mtName.text = `${cfg.name.toUpperCase()} – ${cfg.nepaliName}  ·  ${cfg.elevation.toLocaleString()} m`;
    mtName.color = '#ffffff';
    mtName.fontSize = 20;
    mtName.fontFamily = 'Teko, sans-serif';
    mtName.letterSpacing = 3;
    mtName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    mtName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    mtName.top = '140px';
    this.gui.addControl(mtName);

    // Quote
    const quote = new TextBlock('quote');
    quote.text = `"${cfg.summaryQuote}"`;
    quote.color = 'rgba(200, 215, 240, 0.7)';
    quote.fontSize = 13;
    quote.fontFamily = 'Rajdhani, sans-serif';
    quote.fontStyle = 'italic';
    quote.textWrapping = true;
    quote.width = '600px';
    quote.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    quote.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    quote.top = '175px';
    this.gui.addControl(quote);

    // Stats panel
    this._buildStatsPanel(cfg);

    // Action buttons
    this._buildActionButtons(cfg);
  }

  _buildStatsPanel(cfg) {
    const stats = this.payload;
    const panel = new Rectangle('statsPanel');
    panel.width = '500px';
    panel.height = '200px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.top = '40px';
    panel.background = 'rgba(6, 12, 30, 0.85)';
    panel.color = 'rgba(100, 140, 200, 0.4)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    this.gui.addControl(panel);

    const statsData = [
      { label: 'Summit Time', value: this._formatTime(stats.timeMs) },
      { label: 'Climbers Saved', value: `${stats.climbersSaved ?? 3} / ${stats.totalClimbers ?? 3}` },
      { label: 'Score', value: (stats.score ?? 0).toLocaleString() },
      { label: 'Best Time', value: this._getBestTime(cfg.id) }
    ];

    const grid = new Grid('statsGrid');
    grid.width = '460px';
    grid.height = '160px';
    grid.addColumnDefinition(0.5);
    grid.addColumnDefinition(0.5);
    grid.addRowDefinition(0.5);
    grid.addRowDefinition(0.5);
    panel.addControl(grid);

    statsData.forEach((s, i) => {
      const cell = new StackPanel(`stat_${i}`);
      cell.isVertical = true;
      cell.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      cell.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

      const label = new TextBlock(`sLabel_${i}`);
      label.text = s.label.toUpperCase();
      label.color = 'rgba(150, 180, 220, 0.6)';
      label.fontSize = 10;
      label.fontFamily = 'Rajdhani, sans-serif';
      label.letterSpacing = 2;
      label.height = '18px';
      cell.addControl(label);

      const value = new TextBlock(`sValue_${i}`);
      value.text = s.value;
      value.color = i === 2 ? '#f0a500' : '#ffffff';
      value.fontSize = 22;
      value.fontFamily = 'Teko, sans-serif';
      value.height = '32px';
      cell.addControl(value);

      grid.addControl(cell, Math.floor(i / 2), i % 2);
    });
  }

  _buildActionButtons(cfg) {
    const isLastLevel = cfg.id === 4;
    const nextLevelIndex = cfg.id + 1;

    const btnContainer = new StackPanel('btnContainer');
    btnContainer.width = '100%';
    btnContainer.height = '80px';
    btnContainer.isVertical = false;
    btnContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    btnContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    btnContainer.top = '-30px';
    this.gui.addControl(btnContainer);

    if (!isLastLevel) {
      const nextBtn = this._makeButton('NEXT MOUNTAIN', '#c0392b', () => {
        this.game.transitionTo(GameState.PLAYING, { levelIndex: nextLevelIndex });
      });
      btnContainer.addControl(nextBtn);
    } else {
      const endBtn = this._makeButton('VIEW ENDING', '#f0a500', () => {
        this._showEnding();
      });
      btnContainer.addControl(endBtn);
    }

    const menuBtn = this._makeButton('MAIN MENU', 'rgba(50, 70, 110, 0.8)', () => {
      this.game.transitionTo(GameState.MAIN_MENU);
    });
    btnContainer.addControl(menuBtn);

    const retryBtn = this._makeButton('RETRY', 'rgba(50, 70, 110, 0.8)', () => {
      this.game.transitionTo(GameState.PLAYING, { levelIndex: cfg.id });
    });
    btnContainer.addControl(retryBtn);
  }

  _makeButton(text, bg, action) {
    const btn = new Rectangle(`btn_${text}`);
    btn.width = '180px';
    btn.height = '48px';
    btn.cornerRadius = 6;
    btn.background = bg;
    btn.color = 'rgba(255,255,255,0.3)';
    btn.thickness = 1;
    btn.marginLeft = '8px';
    btn.marginRight = '8px';
    btn.isPointerBlocker = true;

    const txt = new TextBlock(`btxt_${text}`);
    txt.text = text;
    txt.color = '#fff';
    txt.fontSize = 15;
    txt.fontFamily = 'Teko, sans-serif';
    txt.letterSpacing = 2;
    btn.addControl(txt);

    btn.onPointerClickObservable.add(action);
    btn.onPointerEnterObservable.add(() => { btn.color = 'rgba(255,255,255,0.7)'; });
    btn.onPointerOutObservable.add(() => { btn.color = 'rgba(255,255,255,0.3)'; });

    return btn;
  }

  _showEnding() {
    const ending = new Rectangle('ending');
    ending.width = '100%';
    ending.height = '100%';
    ending.background = 'rgba(0, 0, 0, 0.9)';
    ending.color = 'transparent';
    ending.thickness = 0;
    this.gui.addControl(ending);

    const lines = [
      { text: 'The spirit storms are still.', delay: 500 },
      { text: 'Pasang Sherpa is at peace.', delay: 2000 },
      { text: 'The Sky Road is open.', delay: 3500 },
      { text: 'Nepal\'s mountains breathe again.', delay: 5000 },
      { text: 'And Karma — the veteran Sherpa —', delay: 6500 },
      { text: 'returns to Solukhumbu.', delay: 8000 },
      { text: 'A hero. Not of conquest.', delay: 9500 },
      { text: 'But of love.', delay: 11000 },
      { text: 'धन्यवाद — Thank you for playing SHERPA', delay: 13000 }
    ];

    lines.forEach(({ text, delay }) => {
      setTimeout(() => {
        const t = new TextBlock('ending_' + delay);
        t.text = text;
        t.color = delay === 13000 ? '#f0a500' : 'rgba(220, 235, 255, 0.9)';
        t.fontSize = delay === 13000 ? 22 : 18;
        t.fontFamily = delay === 13000 ? 'Teko, Noto Sans Devanagari, sans-serif' : 'Rajdhani, sans-serif';
        t.fontStyle = 'italic';
        t.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        t.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        t.top = `${-150 + lines.findIndex(l => l.delay === delay) * 38}px`;
        ending.addControl(t);
      }, delay);
    });

    setTimeout(() => {
      this.game.transitionTo(GameState.MAIN_MENU);
    }, 16000);
  }

  _formatTime(ms) {
    if (!ms) return '--:--';
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    return `${String(mins).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  }

  _getBestTime(levelId) {
    const data = this.game.saveData.summitTimes[`level_${levelId}`];
    return data ? this._formatTime(data.time) : 'None yet';
  }

  _playFanfare() {
    // Placeholder: would play audio file if available
  }

  dispose() {
    this.gui?.dispose();
    this.scene?.dispose();
    this.scene = null;
  }
}
