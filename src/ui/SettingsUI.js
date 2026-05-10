import { Rectangle, TextBlock, Control, Slider, StackPanel } from '@babylonjs/gui';

export class SettingsUI {
  constructor(gui, game) {
    this.gui = gui;
    this.game = game;
    this.overlay = null;
  }

  show() {
    this.overlay = new Rectangle('settingsOverlay');
    this.overlay.width = '100%';
    this.overlay.height = '100%';
    this.overlay.background = 'rgba(4, 8, 20, 0.92)';
    this.overlay.color = 'transparent';
    this.overlay.thickness = 0;
    this.overlay.isPointerBlocker = true;
    this.gui.addControl(this.overlay);

    const panel = new Rectangle('settingsPanel');
    panel.width = '480px';
    panel.height = '400px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(8, 15, 35, 0.97)';
    panel.color = 'rgba(100, 140, 200, 0.4)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    this.overlay.addControl(panel);

    const title = new TextBlock('settingsTitle');
    title.text = 'SETTINGS';
    title.color = '#ffffff';
    title.fontSize = 32;
    title.fontFamily = 'Teko, sans-serif';
    title.letterSpacing = 6;
    title.top = '-160px';
    title.isHitTestVisible = false;
    panel.addControl(title);

    // Language toggle
    this._addToggle(panel, -100, 'LANGUAGE', ['English', 'नेपाली'], this.game.saveData.settings.lang === 'np' ? 1 : 0, (v) => {
      this.game.saveData.settings.lang = v === 1 ? 'np' : 'en';
      this.game.save();
    });

    // Music volume label
    const musicLabel = new TextBlock('musicLabel');
    musicLabel.text = 'MUSIC VOLUME';
    musicLabel.color = 'rgba(150, 180, 220, 0.6)';
    musicLabel.fontSize = 11;
    musicLabel.fontFamily = 'Rajdhani, sans-serif';
    musicLabel.letterSpacing = 2;
    musicLabel.top = '-30px';
    musicLabel.isHitTestVisible = false;
    panel.addControl(musicLabel);

    const sfxLabel = new TextBlock('sfxLabel');
    sfxLabel.text = 'SFX VOLUME';
    sfxLabel.color = 'rgba(150, 180, 220, 0.6)';
    sfxLabel.fontSize = 11;
    sfxLabel.fontFamily = 'Rajdhani, sans-serif';
    sfxLabel.letterSpacing = 2;
    sfxLabel.top = '30px';
    sfxLabel.isHitTestVisible = false;
    panel.addControl(sfxLabel);

    const volumeNote = new TextBlock('volumeNote');
    volumeNote.text = '(Audio support coming soon)';
    volumeNote.color = 'rgba(100, 130, 170, 0.4)';
    volumeNote.fontSize = 10;
    volumeNote.fontFamily = 'Rajdhani, sans-serif';
    volumeNote.top = '75px';
    volumeNote.isHitTestVisible = false;
    panel.addControl(volumeNote);

    // Close button
    const closeBtn = new Rectangle('settingsClose');
    closeBtn.width = '140px';
    closeBtn.height = '44px';
    closeBtn.cornerRadius = 6;
    closeBtn.background = 'rgba(192, 57, 43, 0.5)';
    closeBtn.color = 'rgba(255, 100, 80, 0.5)';
    closeBtn.thickness = 1;
    closeBtn.top = '155px';
    closeBtn.isPointerBlocker = true;
    const closeTxt = new TextBlock('settingsCloseTxt');
    closeTxt.text = 'CLOSE';
    closeTxt.color = '#fff';
    closeTxt.fontSize = 16;
    closeTxt.fontFamily = 'Teko, sans-serif';
    closeTxt.letterSpacing = 3;
    closeTxt.isHitTestVisible = false;
    closeBtn.addControl(closeTxt);
    closeBtn.onPointerClickObservable.add(() => this.overlay.dispose());
    panel.addControl(closeBtn);
  }

  _addToggle(parent, top, label, options, initialIndex, onChange) {
    const labelText = new TextBlock(`${label}_lbl`);
    labelText.text = label;
    labelText.color = 'rgba(150, 180, 220, 0.6)';
    labelText.fontSize = 11;
    labelText.fontFamily = 'Rajdhani, sans-serif';
    labelText.letterSpacing = 2;
    labelText.top = `${top - 20}px`;
    labelText.isHitTestVisible = false;
    parent.addControl(labelText);

    options.forEach((opt, i) => {
      const btn = new Rectangle(`${label}_opt_${i}`);
      btn.width = '120px';
      btn.height = '36px';
      btn.cornerRadius = 6;
      btn.background = i === initialIndex ? 'rgba(192, 57, 43, 0.6)' : 'rgba(30, 45, 80, 0.4)';
      btn.color = 'rgba(100, 140, 200, 0.3)';
      btn.thickness = 1;
      btn.top = `${top + 8}px`;
      btn.left = `${-65 + i * 135}px`;
      btn.isPointerBlocker = true;

      const txt = new TextBlock(`${label}_opt_txt_${i}`);
      txt.text = opt;
      txt.color = '#fff';
      txt.fontSize = 14;
      txt.fontFamily = 'Noto Sans Devanagari, Teko, sans-serif';
      txt.isHitTestVisible = false;
      btn.addControl(txt);

      btn.onPointerClickObservable.add(() => {
        onChange(i);
        options.forEach((_, j) => {
          const ob = parent.getControlByName(`${label}_opt_${j}`);
          if (ob) ob.background = j === i ? 'rgba(192, 57, 43, 0.6)' : 'rgba(30, 45, 80, 0.4)';
        });
      });
      parent.addControl(btn);
    });
  }
}
