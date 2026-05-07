import {
  Scene, FollowCamera, ArcRotateCamera, Vector3, Color3, Color4,
  HemisphericLight, DirectionalLight, ShadowGenerator, MeshBuilder,
  StandardMaterial, KeyboardEventTypes, Mesh
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from '@babylonjs/gui';
import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { KarmaPlayer } from '../entities/KarmaPlayer.js';
import { ClimberNPC } from '../entities/ClimberNPC.js';
import { AltitudeSystem } from '../systems/AltitudeSystem.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { HazardSystem } from '../systems/HazardSystem.js';
import { TerrainBuilder } from '../utils/TerrainBuilder.js';
import { AssetManager } from '../utils/AssetManager.js';
import { HUD } from '../ui/HUD.js';
import { GameState } from '../Game.js';

const Phase = {
  INTRO: 'INTRO',
  PLAYING: 'PLAYING',
  CHECKPOINT: 'CHECKPOINT',
  PAUSED: 'PAUSED',
  SUMMIT: 'SUMMIT',
  GAME_OVER: 'GAME_OVER'
};

export class GameScene {
  constructor(game, levelIndex) {
    this.game = game;
    this.levelIndex = levelIndex;
    this.config = LEVEL_CONFIGS[levelIndex];
    this.scene = null;

    this.player = null;
    this.climbers = [];
    this.platforms = [];
    this.checkpoints = [];

    this.altitudeSystem = null;
    this.weatherSystem = null;
    this.hazardSystem = null;
    this.terrainBuilder = null;
    this.assetManager = null;
    this.hud = null;

    this.phase = Phase.INTRO;
    this.currentSectionIndex = 0;
    this.sectionTransitioning = false;

    this.camera = null;
    this.shadowGenerator = null;

    this._lastTime = 0;
    this._isPaused = false;
  }

  async create() {
    const engine = this.game.engine;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(
      this.config.skyColor.r * 0.8,
      this.config.skyColor.g * 0.85,
      this.config.skyColor.b,
      1
    );

    this.assetManager = new AssetManager(this.scene);
    this.terrainBuilder = new TerrainBuilder(this.scene, this.assetManager);
    this.altitudeSystem = new AltitudeSystem(this.config);
    this.weatherSystem = new WeatherSystem(this.scene);
    this.hazardSystem = new HazardSystem(this.scene, this.weatherSystem);

    await this._setupLights();
    this._setupCamera();
    this.weatherSystem.applyWeatherProfile(this.config);

    await this._loadSection(0);
    await this._spawnPlayer();
    await this._spawnClimbers(2);

    this.hud = new HUD(this.scene);
    this._setupPauseMenu();
    this._setupKeyboardShortcuts();

    this._showIntroCard();

    engine.runRenderLoop(() => {
      if (!this._isPaused) {
        const now = performance.now();
        const dt = Math.min((now - (this._lastTime || now)) / 1000, 0.05);
        this._lastTime = now;
        this._update(dt);
      }
      this.scene?.render();
    });
  }

  async _setupLights() {
    const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), this.scene);
    amb.intensity = 0.7;
    amb.diffuse = new Color3(0.85, 0.9, 1.0);
    amb.groundColor = new Color3(0.3, 0.35, 0.45);

    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1).normalize(), this.scene);
    sun.intensity = 1.2;
    sun.diffuse = new Color3(1.0, 0.95, 0.85);
    sun.position = new Vector3(30, 50, 10);

    this.shadowGenerator = new ShadowGenerator(1024, sun);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;
  }

  _setupCamera() {
    // 2.5D follow camera - follows player but locked to side view
    this.camera = new ArcRotateCamera('gameCam', -Math.PI / 2, Math.PI / 2.4, 28, new Vector3(0, 4, 0), this.scene);
    this.camera.lowerRadiusLimit = 28;
    this.camera.upperRadiusLimit = 28;
    this.camera.lowerBetaLimit = Math.PI / 2.4;
    this.camera.upperBetaLimit = Math.PI / 2.4;
    this.camera.lowerAlphaLimit = -Math.PI / 2 - 0.05;
    this.camera.upperAlphaLimit = -Math.PI / 2 + 0.05;
  }

  async _loadSection(sectionIndex) {
    this.terrainBuilder.dispose();
    this.hazardSystem.dispose();

    const section = this.config.sections[sectionIndex];
    this.platforms = this.terrainBuilder.buildLevelTerrain(this.config, sectionIndex);

    this.hazardSystem.spawnHazardsForSection(section, this.platforms);

    // Build checkpoint at end of platforms
    const lastPlatform = this.platforms[this.platforms.length - 1];
    if (lastPlatform && sectionIndex < this.config.sections.length - 1) {
      const cpPos = lastPlatform.position.clone();
      cpPos.x += 4;
      cpPos.y += 1;
      const cp = this.terrainBuilder.buildCheckpointMarker(cpPos);
      cp.metadata = { type: 'checkpoint', sectionIndex, reached: false };
      this.checkpoints.push(cp);
    }

    // Summit zone at final section
    if (sectionIndex === this.config.sections.length - 1) {
      const summitZone = this.terrainBuilder.buildSummitZone(this.config);
      if (lastPlatform) {
        summitZone.position.set(lastPlatform.position.x + 6, lastPlatform.position.y + 3, 0);
      }
      summitZone.metadata = { type: 'summit_zone' };
    }

    this.currentSectionIndex = sectionIndex;

    if (this.player) {
      this.player.setPlatforms(this.platforms);
      this.player.mesh.position.set(-35, 5, 0);
    }

    // Intensify weather at higher sections
    if (sectionIndex >= this.config.sections.length - 2) {
      this.weatherSystem.intensify(1.5);
    }
  }

  async _spawnPlayer() {
    this.player = new KarmaPlayer(this.scene, this.assetManager);
    const startPos = this.platforms[0]?.position.clone() ?? new Vector3(-35, 3, 0);
    startPos.y += 2;
    await this.player.create(startPos);
    this.player.setPlatforms(this.platforms);
    this.player.onFallDeath = () => this._onPlayerDeath('You fell!');

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(this.player.mesh, true);
    }
  }

  async _spawnClimbers(count) {
    const startPos = this.player.mesh.position.clone();
    for (let i = 0; i < count; i++) {
      const climber = new ClimberNPC(this.scene, this.assetManager, i);
      await climber.create(new Vector3(startPos.x - 4 - i * 2, startPos.y, 0));
      this.climbers.push(climber);
    }
  }

  _update(dt) {
    if (!this.player?.mesh || this.phase === Phase.GAME_OVER) return;

    // Get altitude state
    const altState = this.altitudeSystem.update(dt, this.player.mesh.position.y, this.player.isGrounded);

    // Update weather
    const weatherState = this.weatherSystem.update(dt);

    // Update player
    const playerState = this.player.update(dt, altState);

    // Camera follows player
    this.camera.target.x = this.player.mesh.position.x;
    this.camera.target.y = Math.max(this.player.mesh.position.y - 2, 0);

    // Update climbers
    const climberStatuses = this.climbers.map(c => {
      c.update(dt, this.player.mesh.position, this.platforms, altState);
      return c.getStatus();
    });

    // Check hazard collisions
    const hazardHits = this.hazardSystem.checkCollisions(this.player.mesh.position);
    hazardHits.forEach(h => this._handleHazardHit(h));

    // Update hazards
    this.hazardSystem.update(dt, this.player.mesh.position, weatherState);

    // Interact with climbers
    if (playerState.wantsInteract) {
      this.climbers.forEach(c => {
        const dist = Vector3.Distance(this.player.mesh.position, c.mesh.position);
        if (dist < 4 && c.getStatus().needsHelp) {
          c.heal(30);
          this.altitudeSystem.useSupplementalOxygen(0.2);
          this.player.score += 500;
          this.hud.showMessage('Climber helped! +500 pts', 2000, '#4ade80');
        }
      });
    }

    // Altitude death
    if (altState.isDeadly && this.phase === Phase.PLAYING) {
      this._onPlayerDeath('Altitude sickness! No oxygen left.');
      return;
    }

    // Section progress
    this._checkSectionProgress();

    // Update HUD
    this.hud.update({
      altitude: altState.altitude,
      oxygen: altState.oxygen,
      stamina: playerState.stamina,
      climbers: climberStatuses,
      weather: weatherState,
      elapsedMs: this.player.getElapsedTime(),
      sectionLabel: this.config.sections[this.currentSectionIndex]?.label ?? ''
    });

    // Altitude danger warning
    if (altState.altitude > 8000 && altState.oxygen < 0.4) {
      this.hud.showMessage('⚠ Entering Death Zone — Oxygen critical', 4000, '#ef4444');
    }
  }

  _handleHazardHit(hazard) {
    if (!hazard || this.phase !== Phase.PLAYING) return;
    switch (hazard.type) {
      case 'crevasse':
        this._onPlayerDeath('You fell into a crevasse!');
        break;
      case 'avalanche':
        if (hazard.triggered) this._onPlayerDeath('Swept away by avalanche!');
        break;
      case 'wind_zone':
        if (this.player?.velocity) {
          this.player.velocity.x += hazard.force * 0.1;
        }
        break;
      case 'spirit_portal':
        if (hazard.active) this._triggerSpiritEncounter();
        break;
    }
  }

  _triggerSpiritEncounter() {
    if (this._spiritTriggered) return;
    this._spiritTriggered = true;

    const spirit = this.config.spirits.find(s =>
      s.triggerAltitude <= this.altitudeSystem.currentAltitude
    );
    if (!spirit) return;

    this.phase = Phase.PAUSED;
    this._showDialogueOverlay(spirit.name, spirit.dialogue, () => {
      this.phase = Phase.PLAYING;
      this._spiritTriggered = false;
      this.player.score += 1000;
      this.hud.showMessage('Spirit encountered! +1000 pts', 3000, '#a855f7');
    });
  }

  _checkSectionProgress() {
    if (this.sectionTransitioning || !this.player?.mesh) return;

    const playerX = this.player.mesh.position.x;
    const SECTION_END_X = 50;

    if (playerX > SECTION_END_X) {
      const nextSection = this.currentSectionIndex + 1;

      if (nextSection >= this.config.sections.length) {
        this._triggerSummit();
      } else {
        this._transitionToNextSection(nextSection);
      }
    }
  }

  async _transitionToNextSection(nextIndex) {
    this.sectionTransitioning = true;
    this.phase = Phase.CHECKPOINT;

    // Show checkpoint panel
    this._showCheckpointPanel(nextIndex, async () => {
      await this._loadSection(nextIndex);
      this.climbers.forEach((c, i) => {
        if (c.mesh) {
          c.mesh.position.set(-35 + (i - 1) * 3, 3, 0);
        }
      });
      this.player.score += 2000;
      this.hud.showMessage(`Checkpoint reached! Section ${nextIndex + 1}/${this.config.sections.length}`, 3000, '#4ade80');
      this.phase = Phase.PLAYING;
      this.sectionTransitioning = false;
      this._spiritTriggered = false;
    });
  }

  _triggerSummit() {
    if (this.phase === Phase.SUMMIT) return;
    this.phase = Phase.SUMMIT;

    const timeMs = this.player.getElapsedTime();
    const climbersSaved = this.climbers.filter(c => c.getStatus().isAlive).length;
    const score = Math.floor(this.player.score + climbersSaved * 5000);

    this.game.recordSummit(this.levelIndex, timeMs, score);

    setTimeout(() => {
      this.game.transitionTo(GameState.SUMMIT, {
        levelIndex: this.levelIndex,
        timeMs,
        score,
        climbersSaved,
        totalClimbers: this.climbers.length
      });
    }, 2000);

    this.hud.showMessage('SUMMIT REACHED! 🏔', 5000, '#f0a500');
  }

  _onPlayerDeath(reason) {
    if (this.phase === Phase.GAME_OVER) return;
    this.phase = Phase.GAME_OVER;
    this._showGameOverPanel(reason);
  }

  _showIntroCard() {
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('intro', true, this.scene);
    const card = new Rectangle('introCard');
    card.width = '600px';
    card.height = '300px';
    card.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    card.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    card.background = 'rgba(6, 12, 30, 0.95)';
    card.color = 'rgba(100, 140, 200, 0.5)';
    card.thickness = 1;
    card.cornerRadius = 12;
    gui.addControl(card);

    const mtn = new TextBlock('introMtn');
    mtn.text = `${this.config.name.toUpperCase()} — ${this.config.nepaliName}`;
    mtn.color = '#f0a500';
    mtn.fontSize = 30;
    mtn.fontFamily = 'Teko, sans-serif';
    mtn.letterSpacing = 3;
    mtn.top = '-80px';
    card.addControl(mtn);

    const elev = new TextBlock('introElev');
    elev.text = `${this.config.elevation.toLocaleString()} metres  ·  ${this.config.difficultyLabel}`;
    elev.color = 'rgba(180, 200, 240, 0.8)';
    elev.fontSize = 14;
    elev.fontFamily = 'Rajdhani, sans-serif';
    elev.letterSpacing = 2;
    elev.top = '-45px';
    card.addControl(elev);

    const story = new TextBlock('introStory');
    story.text = this.config.storyIntro;
    story.color = 'rgba(200, 215, 240, 0.7)';
    story.fontSize = 12;
    story.fontFamily = 'Rajdhani, sans-serif';
    story.fontStyle = 'italic';
    story.textWrapping = true;
    story.width = '540px';
    story.top = '10px';
    card.addControl(story);

    const hint = new TextBlock('introHint');
    hint.text = 'WASD / Arrow Keys to move  ·  Space to jump  ·  E to help climbers  ·  ESC to pause';
    hint.color = 'rgba(120, 150, 200, 0.5)';
    hint.fontSize = 11;
    hint.fontFamily = 'Rajdhani, sans-serif';
    hint.letterSpacing = 1;
    hint.top = '80px';
    card.addControl(hint);

    setTimeout(() => {
      gui.dispose();
      this.phase = Phase.PLAYING;
    }, 4500);
  }

  _showCheckpointPanel(nextSection, onContinue) {
    const sectionData = this.config.sections[nextSection];
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('cpUI', true, this.scene);

    const panel = new Rectangle('cpPanel');
    panel.width = '500px';
    panel.height = '320px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(6, 12, 30, 0.95)';
    panel.color = 'rgba(100, 140, 200, 0.5)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    gui.addControl(panel);

    const cpTitle = new TextBlock('cpTitle');
    cpTitle.text = 'CHECKPOINT REACHED';
    cpTitle.color = '#4ade80';
    cpTitle.fontSize = 22;
    cpTitle.fontFamily = 'Teko, sans-serif';
    cpTitle.letterSpacing = 4;
    cpTitle.top = '-110px';
    panel.addControl(cpTitle);

    const sectionTitle = new TextBlock('sectionTitle');
    sectionTitle.text = sectionData.label.toUpperCase();
    sectionTitle.color = '#ffffff';
    sectionTitle.fontSize = 28;
    sectionTitle.fontFamily = 'Teko, sans-serif';
    sectionTitle.top = '-72px';
    panel.addControl(sectionTitle);

    const altText = new TextBlock('altText');
    altText.text = `Altitude: ${sectionData.altitude.toLocaleString()} m`;
    altText.color = 'rgba(56, 189, 248, 0.9)';
    altText.fontSize = 18;
    altText.fontFamily = 'Teko, sans-serif';
    altText.top = '-35px';
    panel.addControl(altText);

    const stats = new TextBlock('cpStats');
    const avgHealth = this.climbers.length
      ? Math.floor(this.climbers.reduce((s, c) => s + c.health, 0) / this.climbers.length)
      : 100;
    stats.text = `Climber health: ${avgHealth}%  ·  Oxygen: ${Math.floor(this.altitudeSystem.oxygen * 100)}%`;
    stats.color = 'rgba(180, 200, 230, 0.7)';
    stats.fontSize = 13;
    stats.fontFamily = 'Rajdhani, sans-serif';
    stats.top = '5px';
    panel.addControl(stats);

    const restoreText = new TextBlock('restoreText');
    restoreText.text = 'Resupplied at camp — oxygen restored to 70%';
    restoreText.color = '#4ade80';
    restoreText.fontSize = 12;
    restoreText.fontFamily = 'Rajdhani, sans-serif';
    restoreText.fontStyle = 'italic';
    restoreText.top = '35px';
    panel.addControl(restoreText);

    // Restore oxygen at checkpoint
    this.altitudeSystem.useSupplementalOxygen(0.7 - this.altitudeSystem.oxygen);
    this.climbers.forEach(c => c.heal(20));

    const continueBtn = new Rectangle('cpContinue');
    continueBtn.width = '200px';
    continueBtn.height = '44px';
    continueBtn.cornerRadius = 6;
    continueBtn.background = 'rgba(192, 57, 43, 0.7)';
    continueBtn.color = 'rgba(255, 100, 80, 0.8)';
    continueBtn.thickness = 1;
    continueBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    continueBtn.top = '-20px';
    continueBtn.isPointerBlocker = true;
    const contText = new TextBlock('contText');
    contText.text = 'CONTINUE CLIMB';
    contText.color = '#fff';
    contText.fontSize = 16;
    contText.fontFamily = 'Teko, sans-serif';
    contText.letterSpacing = 2;
    continueBtn.addControl(contText);
    continueBtn.onPointerClickObservable.add(() => {
      gui.dispose();
      onContinue();
    });
    panel.addControl(continueBtn);
  }

  _showGameOverPanel(reason) {
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('goUI', true, this.scene);
    const overlay = new Rectangle('goOverlay');
    overlay.width = '100%';
    overlay.height = '100%';
    overlay.background = 'rgba(5, 5, 15, 0.85)';
    overlay.color = 'transparent';
    overlay.thickness = 0;
    gui.addControl(overlay);

    const panel = new Rectangle('goPanel');
    panel.width = '480px';
    panel.height = '280px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(20, 8, 8, 0.97)';
    panel.color = 'rgba(192, 57, 43, 0.6)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    overlay.addControl(panel);

    const title = new TextBlock('goTitle');
    title.text = 'EXPEDITION FAILED';
    title.color = '#ef4444';
    title.fontSize = 32;
    title.fontFamily = 'Teko, sans-serif';
    title.letterSpacing = 4;
    title.top = '-90px';
    panel.addControl(title);

    const reasonText = new TextBlock('goReason');
    reasonText.text = reason;
    reasonText.color = 'rgba(220, 200, 200, 0.8)';
    reasonText.fontSize = 15;
    reasonText.fontFamily = 'Rajdhani, sans-serif';
    reasonText.fontStyle = 'italic';
    reasonText.top = '-45px';
    panel.addControl(reasonText);

    const quote = new TextBlock('goQuote');
    quote.text = '"The mountain will wait. Return wiser." — Karma Sherpa';
    quote.color = 'rgba(180, 160, 140, 0.6)';
    quote.fontSize = 11;
    quote.fontFamily = 'Rajdhani, sans-serif';
    quote.fontStyle = 'italic';
    quote.textWrapping = true;
    quote.width = '420px';
    quote.top = '-5px';
    panel.addControl(quote);

    const btns = [
      { text: 'TRY AGAIN', action: () => { gui.dispose(); this.game.transitionTo(GameState.PLAYING, { levelIndex: this.levelIndex }); } },
      { text: 'MAIN MENU', action: () => { gui.dispose(); this.game.transitionTo(GameState.MAIN_MENU); } }
    ];
    btns.forEach((b, i) => {
      const btn = new Rectangle(`gobtn_${i}`);
      btn.width = '170px';
      btn.height = '42px';
      btn.cornerRadius = 6;
      btn.background = i === 0 ? 'rgba(192, 57, 43, 0.7)' : 'rgba(40, 55, 90, 0.7)';
      btn.color = 'rgba(255,255,255,0.3)';
      btn.thickness = 1;
      btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      btn.horizontalAlignment = i === 0 ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
      btn.top = '-20px';
      btn.left = i === 0 ? '30px' : '-30px';
      btn.isPointerBlocker = true;
      const txt = new TextBlock(`gobtn_txt_${i}`);
      txt.text = b.text;
      txt.color = '#fff';
      txt.fontSize = 15;
      txt.fontFamily = 'Teko, sans-serif';
      txt.letterSpacing = 2;
      btn.addControl(txt);
      btn.onPointerClickObservable.add(b.action);
      btn.onPointerEnterObservable.add(() => { btn.color = 'rgba(255,255,255,0.6)'; });
      btn.onPointerOutObservable.add(() => { btn.color = 'rgba(255,255,255,0.3)'; });
      panel.addControl(btn);
    });
  }

  _showDialogueOverlay(speakerName, dialogueText, onClose) {
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('dialogUI', true, this.scene);

    const panel = new Rectangle('dialogPanel');
    panel.width = '600px';
    panel.height = '160px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.top = '-80px';
    panel.background = 'rgba(10, 8, 25, 0.92)';
    panel.color = 'rgba(150, 100, 220, 0.5)';
    panel.thickness = 1;
    panel.cornerRadius = 8;
    gui.addControl(panel);

    const speaker = new TextBlock('speaker');
    speaker.text = speakerName.toUpperCase();
    speaker.color = '#a855f7';
    speaker.fontSize = 13;
    speaker.fontFamily = 'Teko, sans-serif';
    speaker.letterSpacing = 3;
    speaker.top = '-50px';
    speaker.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    speaker.left = '20px';
    panel.addControl(speaker);

    const dialogue = new TextBlock('dialogue');
    dialogue.text = dialogueText;
    dialogue.color = '#e2e8f0';
    dialogue.fontSize = 15;
    dialogue.fontFamily = 'Noto Sans Devanagari, Rajdhani, sans-serif';
    dialogue.textWrapping = true;
    dialogue.width = '550px';
    dialogue.top = '0px';
    panel.addControl(dialogue);

    const hint = new TextBlock('dialogHint');
    hint.text = 'Press E to respond';
    hint.color = 'rgba(150, 180, 220, 0.4)';
    hint.fontSize = 10;
    hint.fontFamily = 'Rajdhani, sans-serif';
    hint.top = '55px';
    hint.right = '16px';
    hint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.addControl(hint);

    const handler = this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.code === 'KeyE') {
        this.scene.onKeyboardObservable.remove(handler);
        gui.dispose();
        onClose?.();
      }
    });

    setTimeout(() => {
      this.scene?.onKeyboardObservable?.remove(handler);
      gui?.dispose();
      onClose?.();
    }, 8000);
  }

  _setupPauseMenu() {
    this.pauseGUI = null;

    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.code === 'Escape') {
        if (this._isPaused) {
          this._resumeGame();
        } else {
          this._pauseGame();
        }
      }
    });
  }

  _pauseGame() {
    if (this.phase === Phase.GAME_OVER || this.phase === Phase.SUMMIT) return;
    this._isPaused = true;
    this.phase = Phase.PAUSED;

    this.pauseGUI = AdvancedDynamicTexture.CreateFullscreenUI('pauseUI', true, this.scene);
    const overlay = new Rectangle('pauseOverlay');
    overlay.width = '100%';
    overlay.height = '100%';
    overlay.background = 'rgba(5, 8, 20, 0.8)';
    overlay.color = 'transparent';
    overlay.thickness = 0;
    this.pauseGUI.addControl(overlay);

    const panel = new Rectangle('pausePanel');
    panel.width = '320px';
    panel.height = '280px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(8, 15, 35, 0.97)';
    panel.color = 'rgba(100, 140, 200, 0.5)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    overlay.addControl(panel);

    const pauseTitle = new TextBlock('pauseTitle');
    pauseTitle.text = 'PAUSED';
    pauseTitle.color = '#ffffff';
    pauseTitle.fontSize = 36;
    pauseTitle.fontFamily = 'Teko, sans-serif';
    pauseTitle.letterSpacing = 8;
    pauseTitle.top = '-90px';
    panel.addControl(pauseTitle);

    const pauseBtns = [
      { text: 'RESUME', action: () => this._resumeGame() },
      { text: 'RESTART', action: () => { this.pauseGUI?.dispose(); this.game.transitionTo(GameState.PLAYING, { levelIndex: this.levelIndex }); } },
      { text: 'MAIN MENU', action: () => { this.pauseGUI?.dispose(); this.game.transitionTo(GameState.MAIN_MENU); } }
    ];

    pauseBtns.forEach((b, i) => {
      const btn = new Rectangle(`pbtn_${i}`);
      btn.width = '240px';
      btn.height = '46px';
      btn.cornerRadius = 6;
      btn.background = i === 0 ? 'rgba(192, 57, 43, 0.5)' : 'rgba(30, 45, 80, 0.5)';
      btn.color = 'rgba(100, 140, 200, 0.4)';
      btn.thickness = 1;
      btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      btn.top = `${-30 + i * 60}px`;
      btn.isPointerBlocker = true;
      const txt = new TextBlock(`pbtxt_${i}`);
      txt.text = b.text;
      txt.color = '#ffffff';
      txt.fontSize = 16;
      txt.fontFamily = 'Teko, sans-serif';
      txt.letterSpacing = 3;
      btn.addControl(txt);
      btn.onPointerClickObservable.add(b.action);
      btn.onPointerEnterObservable.add(() => { btn.background = 'rgba(100, 140, 200, 0.3)'; });
      btn.onPointerOutObservable.add(() => { btn.background = i === 0 ? 'rgba(192, 57, 43, 0.5)' : 'rgba(30, 45, 80, 0.5)'; });
      panel.addControl(btn);
    });
  }

  _resumeGame() {
    this._isPaused = false;
    this.phase = Phase.PLAYING;
    this.pauseGUI?.dispose();
    this.pauseGUI = null;
  }

  _setupKeyboardShortcuts() {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type !== KeyboardEventTypes.KEYDOWN) return;
      // R = use oxygen (if checkpoint was visited)
      if (kbInfo.event.code === 'KeyR' && this.phase === Phase.PLAYING) {
        this.altitudeSystem.useSupplementalOxygen(0.15);
        this.hud.showMessage('Used oxygen bottle', 1500, '#38bdf8');
      }
    });
  }

  dispose() {
    this.hud?.dispose();
    this.terrainBuilder?.dispose();
    this.weatherSystem?.dispose();
    this.hazardSystem?.dispose();
    this.player?.dispose();
    this.climbers.forEach(c => c.dispose());
    this.climbers = [];
    this.scene?.dispose();
    this.scene = null;
  }
}
