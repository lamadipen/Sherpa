import {
  AdvancedDynamicTexture, Rectangle, TextBlock, Control,
  StackPanel, Grid, Image, Slider
} from '@babylonjs/gui';
import { Color3 } from '@babylonjs/core';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('HUD', true, scene);
    this._buildLayout();
  }

  _buildLayout() {
    // Main HUD panel - bottom left
    this.hudPanel = this._createPanel('hudPanel', '280px', '180px', Control.HORIZONTAL_ALIGNMENT_LEFT, Control.VERTICAL_ALIGNMENT_BOTTOM, 16, -16);
    this.gui.addControl(this.hudPanel);

    // Altitude display (top center)
    this.altitudeDisplay = this._createAltitudeDisplay();
    this.gui.addControl(this.altitudeDisplay);

    // Oxygen meter
    this.oxygenBar = this._createMeter('OXYGEN', '64px', new Color3(0.2, 0.7, 0.95));
    this.hudPanel.addControl(this.oxygenBar.container);

    // Stamina meter
    this.staminaBar = this._createMeter('STAMINA', '94px', new Color3(0.2, 0.9, 0.4));
    this.hudPanel.addControl(this.staminaBar.container);

    // Climber health (right side)
    this.climberPanel = this._createClimberPanel();
    this.gui.addControl(this.climberPanel);

    // Weather warning (top left)
    this.weatherWarning = this._createWeatherWarning();
    this.gui.addControl(this.weatherWarning);

    // Timer (top right)
    this.timerDisplay = this._createTimerDisplay();
    this.gui.addControl(this.timerDisplay);

    // Interaction hint
    this.interactHint = this._createInteractHint();
    this.gui.addControl(this.interactHint);
    this.interactHint.isVisible = false;

    // Section label
    this.sectionLabel = this._createSectionLabel();
    this.gui.addControl(this.sectionLabel);
  }

  _createPanel(name, width, height, hAlign, vAlign, left = 0, top = 0) {
    const panel = new Rectangle(name);
    panel.width = width;
    panel.height = height;
    panel.horizontalAlignment = hAlign;
    panel.verticalAlignment = vAlign;
    panel.left = left + 'px';
    panel.top = top + 'px';
    panel.background = 'rgba(8, 15, 30, 0.75)';
    panel.color = 'rgba(100, 140, 200, 0.4)';
    panel.thickness = 1;
    panel.cornerRadius = 8;
    return panel;
  }

  _createAltitudeDisplay() {
    const container = new Rectangle('altContainer');
    container.width = '220px';
    container.height = '70px';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.top = '12px';
    container.background = 'rgba(8, 15, 30, 0.8)';
    container.color = 'rgba(100, 140, 200, 0.5)';
    container.thickness = 1;
    container.cornerRadius = 8;

    const label = new TextBlock('altLabel');
    label.text = 'ALTITUDE';
    label.color = 'rgba(150, 180, 220, 0.7)';
    label.fontSize = 11;
    label.fontFamily = 'Rajdhani, sans-serif';
    label.top = '-16px';
    label.letterSpacing = 3;
    container.addControl(label);

    this.altitudeText = new TextBlock('altValue');
    this.altitudeText.text = '3,430 m';
    this.altitudeText.color = '#ffffff';
    this.altitudeText.fontSize = 28;
    this.altitudeText.fontFamily = 'Teko, sans-serif';
    this.altitudeText.fontWeight = '600';
    this.altitudeText.top = '8px';
    container.addControl(this.altitudeText);

    return container;
  }

  _createMeter(label, top, color) {
    const container = new Rectangle(`${label}_container`);
    container.width = '250px';
    container.height = '36px';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.top = top;
    container.left = '14px';
    container.background = 'transparent';
    container.thickness = 0;

    const labelText = new TextBlock(`${label}_label`);
    labelText.text = label;
    labelText.color = 'rgba(180, 200, 230, 0.7)';
    labelText.fontSize = 10;
    labelText.fontFamily = 'Rajdhani, sans-serif';
    labelText.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    labelText.top = '-8px';
    labelText.letterSpacing = 2;
    container.addControl(labelText);

    const track = new Rectangle(`${label}_track`);
    track.width = '220px';
    track.height = '8px';
    track.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    track.top = '6px';
    track.background = 'rgba(255,255,255,0.1)';
    track.color = 'transparent';
    track.cornerRadius = 4;
    container.addControl(track);

    const fill = new Rectangle(`${label}_fill`);
    fill.width = '220px';
    fill.height = '8px';
    fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    fill.top = '6px';
    fill.left = '0px';
    fill.background = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
    fill.color = 'transparent';
    fill.cornerRadius = 4;
    container.addControl(fill);

    return { container, fill, track };
  }

  _createClimberPanel() {
    const panel = new Rectangle('climberPanel');
    panel.width = '180px';
    panel.height = '120px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    panel.left = '-16px';
    panel.top = '-16px';
    panel.background = 'rgba(8, 15, 30, 0.75)';
    panel.color = 'rgba(100, 140, 200, 0.4)';
    panel.thickness = 1;
    panel.cornerRadius = 8;

    const title = new TextBlock('climberTitle');
    title.text = 'CLIMBERS';
    title.color = 'rgba(150, 180, 220, 0.7)';
    title.fontSize = 10;
    title.fontFamily = 'Rajdhani, sans-serif';
    title.letterSpacing = 2;
    title.top = '-42px';
    panel.addControl(title);

    this.climberStatusText = new TextBlock('climberStatus');
    this.climberStatusText.text = '● ● ● All safe';
    this.climberStatusText.color = '#4ade80';
    this.climberStatusText.fontSize = 13;
    this.climberStatusText.fontFamily = 'Rajdhani, sans-serif';
    this.climberStatusText.top = '-16px';
    panel.addControl(this.climberStatusText);

    this.climberHealthBar = this._createMeter('HEALTH', '16px', new Color3(0.9, 0.2, 0.2));
    panel.addControl(this.climberHealthBar.container);

    return panel;
  }

  _createWeatherWarning() {
    const warn = new Rectangle('weatherWarn');
    warn.width = '300px';
    warn.height = '48px';
    warn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    warn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    warn.top = '90px';
    warn.background = 'rgba(180, 40, 30, 0.85)';
    warn.color = 'rgba(255, 100, 80, 0.8)';
    warn.thickness = 1;
    warn.cornerRadius = 6;
    warn.isVisible = false;

    this.weatherWarningText = new TextBlock('weatherText');
    this.weatherWarningText.text = '⚠ AVALANCHE WARNING';
    this.weatherWarningText.color = '#fff';
    this.weatherWarningText.fontSize = 15;
    this.weatherWarningText.fontFamily = 'Teko, sans-serif';
    this.weatherWarningText.letterSpacing = 2;
    warn.addControl(this.weatherWarningText);

    return warn;
  }

  _createTimerDisplay() {
    const container = new Rectangle('timerContainer');
    container.width = '140px';
    container.height = '44px';
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    container.left = '-16px';
    container.top = '12px';
    container.background = 'rgba(8, 15, 30, 0.75)';
    container.color = 'rgba(100, 140, 200, 0.4)';
    container.thickness = 1;
    container.cornerRadius = 6;

    this.timerText = new TextBlock('timerText');
    this.timerText.text = '00:00';
    this.timerText.color = '#f0a500';
    this.timerText.fontSize = 20;
    this.timerText.fontFamily = 'Teko, sans-serif';
    container.addControl(this.timerText);

    return container;
  }

  _createInteractHint() {
    const hint = new Rectangle('interactHint');
    hint.width = '200px';
    hint.height = '40px';
    hint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    hint.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    hint.top = '-120px';
    hint.background = 'rgba(240, 165, 0, 0.85)';
    hint.color = 'transparent';
    hint.cornerRadius = 20;

    const hintText = new TextBlock('hintText');
    hintText.text = 'Press [E] to help';
    hintText.color = '#1a1a2e';
    hintText.fontSize = 14;
    hintText.fontFamily = 'Rajdhani, sans-serif';
    hintText.fontWeight = '600';
    hint.addControl(hintText);

    return hint;
  }

  _createSectionLabel() {
    const label = new TextBlock('sectionLabel');
    label.text = '';
    label.color = 'rgba(255, 255, 255, 0.8)';
    label.fontSize = 16;
    label.fontFamily = 'Rajdhani, sans-serif';
    label.letterSpacing = 3;
    label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    label.left = '16px';
    label.top = '16px';
    return label;
  }

  update(state) {
    const { altitude, oxygen, stamina, climbers, weather, elapsedMs, sectionLabel } = state;

    // Altitude
    this.altitudeText.text = altitude.toLocaleString() + ' m';

    // Color altitude red in danger zones
    if (altitude > 8000) {
      this.altitudeText.color = '#ff6b6b';
    } else if (altitude > 6000) {
      this.altitudeText.color = '#f0a500';
    } else {
      this.altitudeText.color = '#ffffff';
    }

    // Oxygen meter
    this._setMeterFill(this.oxygenBar.fill, oxygen, 220);
    if (oxygen < 0.3) {
      this.oxygenBar.fill.background = '#ef4444';
    } else if (oxygen < 0.6) {
      this.oxygenBar.fill.background = '#f0a500';
    } else {
      this.oxygenBar.fill.background = '#38bdf8';
    }

    // Stamina
    this._setMeterFill(this.staminaBar.fill, stamina, 220);

    // Climbers
    if (climbers && climbers.length > 0) {
      const avgHealth = climbers.reduce((s, c) => s + c.health, 0) / climbers.length;
      this._setMeterFill(this.climberHealthBar.fill, avgHealth / 100, 150);

      const needsHelp = climbers.some(c => c.needsHelp);
      this.climberStatusText.text = needsHelp ? '⚠ Climber needs help!' : '● All climbers safe';
      this.climberStatusText.color = needsHelp ? '#f0a500' : '#4ade80';
      this.interactHint.isVisible = needsHelp;
    }

    // Weather
    this.weatherWarning.isVisible = weather?.avalancheWarning || weather?.avalancheActive;
    if (weather?.avalancheActive) {
      this.weatherWarningText.text = '🏔 AVALANCHE! RUN!';
      this.weatherWarning.background = 'rgba(200, 20, 10, 0.95)';
    } else if (weather?.avalancheWarning) {
      this.weatherWarningText.text = '⚠ AVALANCHE WARNING';
      this.weatherWarning.background = 'rgba(180, 40, 30, 0.85)';
    }

    // Timer
    if (elapsedMs !== undefined) {
      const secs = Math.floor(elapsedMs / 1000);
      const mins = Math.floor(secs / 60);
      this.timerText.text = `${String(mins).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    }

    // Section label
    if (sectionLabel) {
      this.sectionLabel.text = sectionLabel.toUpperCase();
    }
  }

  _setMeterFill(fill, value, maxWidth) {
    const pct = Math.max(0, Math.min(1, value));
    fill.width = `${Math.floor(pct * maxWidth)}px`;
  }

  showMessage(text, duration = 3000, color = '#f0a500') {
    const msg = new TextBlock('msg_' + Date.now());
    msg.text = text;
    msg.color = color;
    msg.fontSize = 18;
    msg.fontFamily = 'Rajdhani, sans-serif';
    msg.fontWeight = '600';
    msg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    msg.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    msg.top = '-160px';
    msg.shadowColor = 'rgba(0,0,0,0.8)';
    msg.shadowOffsetX = 1;
    msg.shadowOffsetY = 1;
    this.gui.addControl(msg);
    setTimeout(() => msg.dispose(), duration);
  }

  dispose() {
    this.gui.dispose();
  }
}
