import {
  Scene, ArcRotateCamera, Vector3, Color3, Color4,
  HemisphericLight, DirectionalLight, MeshBuilder, StandardMaterial,
  ParticleSystem
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture, Rectangle, TextBlock, Button, Control,
  StackPanel, Grid, Ellipse
} from '@babylonjs/gui';
import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { GameState } from '../Game.js';

export class LevelSelectScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.gui = null;
    this.selectedLevel = null;
  }

  async create() {
    this.scene = new Scene(this.game.engine);
    this.scene.clearColor = new Color4(0.04, 0.06, 0.12, 1);

    const cam = new ArcRotateCamera('lsCam', -Math.PI / 2, Math.PI / 2.2, 30, Vector3.Zero(), this.scene);
    const amb = new HemisphericLight('amb', new Vector3(0, 1, 0), this.scene);
    amb.intensity = 0.5;

    this._buildMiniMountains();
    this._buildGUI();
  }

  _buildMiniMountains() {
    LEVEL_CONFIGS.forEach((cfg, i) => {
      const mt = MeshBuilder.CreateCylinder(`mt_${i}`, {
        height: 8 + i * 1.5,
        diameterTop: 0,
        diameterBottom: 5 + i,
        tessellation: 8
      }, this.scene);
      const mat = new StandardMaterial(`mt_mat_${i}`, this.scene);
      const sky = cfg.skyColor;
      mat.diffuseColor = new Color3(sky.r * 0.6, sky.g * 0.6, sky.b * 0.8);
      mt.material = mat;
      mt.position.set(-20 + i * 10, 0, -8);
    });
  }

  _buildGUI() {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('LevelSelectUI', true, this.scene);

    // Header
    const header = new Rectangle('lsHeader');
    header.width = '100%';
    header.height = '80px';
    header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    header.background = 'rgba(5, 10, 25, 0.9)';
    header.color = 'rgba(100, 140, 200, 0.3)';
    header.thickness = 0;
    header.isHitTestVisible = false;
    this.gui.addControl(header);

    const headerTitle = new TextBlock('lsHeaderTitle');
    headerTitle.text = 'SELECT YOUR MOUNTAIN';
    headerTitle.color = '#ffffff';
    headerTitle.fontSize = 28;
    headerTitle.fontFamily = 'Teko, sans-serif';
    headerTitle.letterSpacing = 6;
    headerTitle.top = '4px';
    headerTitle.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    headerTitle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    headerTitle.isHitTestVisible = false;
    this.gui.addControl(headerTitle);

    const headerSub = new TextBlock('lsHeaderSub');
    headerSub.text = 'पाँचवटा हिमालहरू — पाँचवटा परीक्षाहरू';
    headerSub.color = 'rgba(240, 165, 0, 0.7)';
    headerSub.fontSize = 13;
    headerSub.fontFamily = 'Noto Sans Devanagari, Rajdhani, sans-serif';
    headerSub.top = '50px';
    headerSub.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    headerSub.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    headerSub.isHitTestVisible = false;
    this.gui.addControl(headerSub);

    // Cards container
    const cardsGrid = new Grid('cardsGrid');
    cardsGrid.width = '96%';
    cardsGrid.height = '520px';
    cardsGrid.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    cardsGrid.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    cardsGrid.top = '10px';

    for (let i = 0; i < 5; i++) {
      cardsGrid.addColumnDefinition(1, false);
    }
    cardsGrid.addRowDefinition(1, false);

    LEVEL_CONFIGS.forEach((cfg, i) => {
      const card = this._buildLevelCard(cfg, i);
      cardsGrid.addControl(card, 0, i);
    });

    this.gui.addControl(cardsGrid);

    // Detail panel (shows when card selected)
    this.detailPanel = this._buildDetailPanel();
    this.gui.addControl(this.detailPanel);
    this.detailPanel.isVisible = false;

    // Back button
    const backBtn = this._createBackButton();
    this.gui.addControl(backBtn);
  }

  _buildLevelCard(cfg, index) {
    const isUnlocked = this.game.saveData.unlockedLevels[index];
    const hasSummit = !!this.game.saveData.summitTimes[`level_${index}`];

    const card = new Rectangle(`card_${index}`);
    card.width = '95%';
    card.height = '460px';
    card.cornerRadius = 12;
    card.thickness = isUnlocked ? 1 : 0;
    card.color = hasSummit ? 'rgba(240, 165, 0, 0.8)' : 'rgba(100, 140, 200, 0.4)';
    card.background = isUnlocked
      ? `rgba(${Math.floor(cfg.skyColor.r * 30)}, ${Math.floor(cfg.skyColor.g * 40)}, ${Math.floor(cfg.skyColor.b * 80)}, 0.7)`
      : 'rgba(15, 20, 35, 0.6)';
    card.isPointerBlocker = true;

    // Mountain name
    const name = new TextBlock(`card_name_${index}`);
    name.text = cfg.name.toUpperCase();
    name.color = isUnlocked ? '#ffffff' : 'rgba(120, 140, 180, 0.5)';
    name.fontSize = 22;
    name.fontFamily = 'Teko, sans-serif';
    name.letterSpacing = 2;
    name.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    name.top = '18px';
    name.isHitTestVisible = false;
    card.addControl(name);

    // Nepali name
    const nepaliName = new TextBlock(`card_np_${index}`);
    nepaliName.text = cfg.nepaliName;
    nepaliName.color = isUnlocked ? 'rgba(240, 165, 0, 0.8)' : 'rgba(120, 140, 180, 0.3)';
    nepaliName.fontSize = 14;
    nepaliName.fontFamily = 'Noto Sans Devanagari, sans-serif';
    nepaliName.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    nepaliName.top = '50px';
    nepaliName.isHitTestVisible = false;
    card.addControl(nepaliName);

    // Elevation
    const elev = new TextBlock(`card_elev_${index}`);
    elev.text = `${cfg.elevation.toLocaleString()} m`;
    elev.color = isUnlocked ? '#38bdf8' : 'rgba(80, 100, 140, 0.5)';
    elev.fontSize = 28;
    elev.fontFamily = 'Teko, sans-serif';
    elev.fontWeight = '600';
    elev.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    elev.top = '80px';
    elev.isHitTestVisible = false;
    card.addControl(elev);

    // Difficulty stars
    const stars = new TextBlock(`card_stars_${index}`);
    stars.text = '★'.repeat(cfg.difficulty) + '☆'.repeat(4 - cfg.difficulty);
    stars.color = isUnlocked ? '#f0a500' : 'rgba(120, 140, 180, 0.3)';
    stars.fontSize = 18;
    stars.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    stars.top = '118px';
    stars.isHitTestVisible = false;
    card.addControl(stars);

    // Difficulty label
    const diffLabel = new TextBlock(`card_diff_${index}`);
    diffLabel.text = cfg.difficultyLabel.toUpperCase();
    diffLabel.color = isUnlocked ? 'rgba(180, 200, 230, 0.7)' : 'rgba(80, 100, 140, 0.4)';
    diffLabel.fontSize = 11;
    diffLabel.fontFamily = 'Rajdhani, sans-serif';
    diffLabel.letterSpacing = 2;
    diffLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    diffLabel.top = '145px';
    diffLabel.isHitTestVisible = false;
    card.addControl(diffLabel);

    // Season / cultural event
    const event = new TextBlock(`card_event_${index}`);
    event.text = `${cfg.season}  ·  ${cfg.culturalEvent}`;
    event.color = isUnlocked ? 'rgba(180, 210, 200, 0.6)' : 'rgba(80, 100, 140, 0.3)';
    event.fontSize = 10;
    event.fontFamily = 'Rajdhani, sans-serif';
    event.letterSpacing = 1;
    event.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    event.top = '168px';
    event.isHitTestVisible = false;
    card.addControl(event);

    // Summit time (if completed)
    if (hasSummit) {
      const summitData = this.game.saveData.summitTimes[`level_${index}`];
      const mins = Math.floor(summitData.time / 60000);
      const secs = Math.floor((summitData.time % 60000) / 1000);
      const timeText = new TextBlock(`card_time_${index}`);
      timeText.text = `BEST: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      timeText.color = '#f0a500';
      timeText.fontSize = 13;
      timeText.fontFamily = 'Teko, sans-serif';
      timeText.letterSpacing = 1;
      timeText.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      timeText.top = '195px';
      timeText.isHitTestVisible = false;
      card.addControl(timeText);
    }

    // Lock icon
    if (!isUnlocked) {
      const lock = new TextBlock(`lock_${index}`);
      lock.text = '🔒';
      lock.fontSize = 36;
      lock.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      lock.top = '-60px';
      lock.isHitTestVisible = false;
      card.addControl(lock);
    }

    // Climb button (only if unlocked)
    if (isUnlocked) {
      const climbBtn = new Rectangle(`climb_${index}`);
      climbBtn.width = '85%';
      climbBtn.height = '44px';
      climbBtn.cornerRadius = 6;
      climbBtn.background = 'rgba(192, 57, 43, 0.7)';
      climbBtn.color = 'rgba(255, 100, 80, 0.8)';
      climbBtn.thickness = 1;
      climbBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      climbBtn.top = '-24px';
      climbBtn.isPointerBlocker = true;

      const climbText = new TextBlock(`climb_text_${index}`);
      climbText.text = hasSummit ? 'RETRY SUMMIT' : 'BEGIN CLIMB';
      climbText.color = '#ffffff';
      climbText.fontSize = 15;
      climbText.fontFamily = 'Teko, sans-serif';
      climbText.letterSpacing = 2;
      climbText.isHitTestVisible = false;
      climbBtn.addControl(climbText);

      climbBtn.onPointerEnterObservable.add(() => { climbBtn.background = 'rgba(192, 57, 43, 1)'; });
      climbBtn.onPointerOutObservable.add(() => { climbBtn.background = 'rgba(192, 57, 43, 0.7)'; });
      climbBtn.onPointerUpObservable.add(() => {
        this.game.transitionTo(GameState.PLAYING, { levelIndex: index });
      });
      card.addControl(climbBtn);

      // Info button
      card.onPointerUpObservable.add(() => this._showDetail(cfg, index));

      // Hover effects
      card.onPointerEnterObservable.add(() => {
        card.background = `rgba(${Math.floor(cfg.skyColor.r * 60)}, ${Math.floor(cfg.skyColor.g * 70)}, ${Math.floor(cfg.skyColor.b * 120)}, 0.85)`;
        card.scaleX = 1.02;
        card.scaleY = 1.02;
      });
      card.onPointerOutObservable.add(() => {
        card.background = `rgba(${Math.floor(cfg.skyColor.r * 30)}, ${Math.floor(cfg.skyColor.g * 40)}, ${Math.floor(cfg.skyColor.b * 80)}, 0.7)`;
        card.scaleX = 1;
        card.scaleY = 1;
      });
    }

    return card;
  }

  _buildDetailPanel() {
    const panel = new Rectangle('detailPanel');
    panel.width = '500px';
    panel.height = '420px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(6, 12, 28, 0.97)';
    panel.color = 'rgba(100, 140, 200, 0.5)';
    panel.thickness = 1;
    panel.cornerRadius = 12;

    this.detailTitle = new TextBlock('detailTitle');
    this.detailTitle.color = '#fff';
    this.detailTitle.fontSize = 32;
    this.detailTitle.fontFamily = 'Teko, sans-serif';
    this.detailTitle.top = '-150px';
    panel.addControl(this.detailTitle);

    this.detailDesc = new TextBlock('detailDesc');
    this.detailDesc.color = 'rgba(200, 220, 240, 0.8)';
    this.detailDesc.fontSize = 13;
    this.detailDesc.fontFamily = 'Rajdhani, sans-serif';
    this.detailDesc.textWrapping = true;
    this.detailDesc.width = '440px';
    this.detailDesc.top = '-50px';
    panel.addControl(this.detailDesc);

    this.detailStory = new TextBlock('detailStory');
    this.detailStory.color = 'rgba(240, 165, 0, 0.7)';
    this.detailStory.fontSize = 12;
    this.detailStory.fontFamily = 'Rajdhani, sans-serif';
    this.detailStory.fontStyle = 'italic';
    this.detailStory.textWrapping = true;
    this.detailStory.width = '440px';
    this.detailStory.top = '60px';
    panel.addControl(this.detailStory);

    const closeBtn = new Rectangle('detailClose');
    closeBtn.width = '120px';
    closeBtn.height = '38px';
    closeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    closeBtn.top = '-16px';
    closeBtn.background = 'rgba(100, 100, 140, 0.3)';
    closeBtn.color = 'rgba(100, 140, 200, 0.5)';
    closeBtn.cornerRadius = 6;
    closeBtn.isPointerBlocker = true;
    const closeText = new TextBlock('closeText');
    closeText.text = 'CLOSE';
    closeText.color = '#fff';
    closeText.fontSize = 14;
    closeText.fontFamily = 'Teko, sans-serif';
    closeText.letterSpacing = 2;
    closeText.isHitTestVisible = false;
    closeBtn.addControl(closeText);
    closeBtn.onPointerUpObservable.add(() => { panel.isVisible = false; });
    panel.addControl(closeBtn);

    return panel;
  }

  _showDetail(cfg, index) {
    this.detailTitle.text = `${cfg.name.toUpperCase()} – ${cfg.nepaliName}`;
    this.detailDesc.text = cfg.description;
    this.detailStory.text = `"${cfg.storyIntro}"`;
    this.detailPanel.isVisible = true;
  }

  _createBackButton() {
    const btn = new Rectangle('backBtn');
    btn.width = '120px';
    btn.height = '42px';
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    btn.left = '16px';
    btn.top = '16px';
    btn.background = 'rgba(30, 40, 70, 0.7)';
    btn.color = 'rgba(100, 140, 200, 0.5)';
    btn.cornerRadius = 6;
    btn.thickness = 1;
    btn.isPointerBlocker = true;

    const txt = new TextBlock('backTxt');
    txt.text = '← BACK';
    txt.color = '#aabbcc';
    txt.fontSize = 14;
    txt.fontFamily = 'Teko, sans-serif';
    txt.letterSpacing = 2;
    txt.isHitTestVisible = false;
    btn.addControl(txt);

    btn.onPointerUpObservable.add(() => this.game.transitionTo(GameState.MAIN_MENU));
    btn.onPointerEnterObservable.add(() => { btn.background = 'rgba(50, 60, 100, 0.8)'; });
    btn.onPointerOutObservable.add(() => { btn.background = 'rgba(30, 40, 70, 0.7)'; });

    return btn;
  }

  dispose() {
    this.gui?.dispose();
    this.scene?.dispose();
    this.scene = null;
  }
}
