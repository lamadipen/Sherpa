import { Rectangle, TextBlock, Control, StackPanel, Grid } from '@babylonjs/gui';
import { LEVEL_CONFIGS, LEADERBOARD_SAMPLE } from '../levels/levelConfigs.js';

export class LeaderboardUI {
  constructor(gui, saveData) {
    this.gui = gui;
    this.saveData = saveData;
    this.overlay = null;
  }

  show() {
    this.overlay = new Rectangle('lbOverlay');
    this.overlay.width = '100%';
    this.overlay.height = '100%';
    this.overlay.background = 'rgba(4, 8, 20, 0.95)';
    this.overlay.color = 'transparent';
    this.overlay.thickness = 0;
    this.overlay.isPointerBlocker = true;
    this.gui.addControl(this.overlay);

    const panel = new Rectangle('lbPanel');
    panel.width = '700px';
    panel.height = '580px';
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.background = 'rgba(8, 15, 35, 0.97)';
    panel.color = 'rgba(100, 140, 200, 0.4)';
    panel.thickness = 1;
    panel.cornerRadius = 12;
    this.overlay.addControl(panel);

    const title = new TextBlock('lbTitle');
    title.text = 'LEADERBOARD';
    title.color = '#f0a500';
    title.fontSize = 36;
    title.fontFamily = 'Teko, sans-serif';
    title.letterSpacing = 6;
    title.top = '-250px';
    panel.addControl(title);

    const subtitle = new TextBlock('lbSub');
    subtitle.text = 'Fastest Summit Times';
    subtitle.color = 'rgba(180, 200, 240, 0.5)';
    subtitle.fontSize = 12;
    subtitle.fontFamily = 'Rajdhani, sans-serif';
    subtitle.letterSpacing = 3;
    subtitle.top = '-218px';
    panel.addControl(subtitle);

    // Headers
    this._addRow(panel, -185, ['RANK', 'NAME', 'TIME', 'SCORE', 'SUMMITS'], true);

    // Sample leaderboard entries
    const allEntries = [...LEADERBOARD_SAMPLE];

    // Add player's times if they have them
    const playerBest = LEVEL_CONFIGS.reduce((best, cfg, i) => {
      const data = this.saveData.summitTimes[`level_${i}`];
      if (data && data.time < (best?.time ?? Infinity)) return { ...data, name: 'You', summits: i + 1 };
      return best;
    }, null);

    if (playerBest) {
      allEntries.push({ ...playerBest, isPlayer: true });
    }

    allEntries.sort((a, b) => (a.time ?? 99999999) - (b.time ?? 99999999));

    allEntries.slice(0, 8).forEach((entry, rank) => {
      const color = entry.isPlayer ? '#4ade80' : rank === 0 ? '#f0a500' : rank === 1 ? '#d1d5db' : rank === 2 ? '#b45309' : undefined;
      const mins = Math.floor((entry.time ?? 0) / 60000);
      const secs = Math.floor(((entry.time ?? 0) % 60000) / 1000);
      this._addRow(panel, -130 + rank * 42, [
        rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`,
        entry.name,
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
        (entry.score ?? 0).toLocaleString(),
        String(entry.summits ?? 1)
      ], false, color, entry.isPlayer);
    });

    // Your stats
    const yourPanel = new Rectangle('yourStats');
    yourPanel.width = '640px';
    yourPanel.height = '50px';
    yourPanel.background = 'rgba(20, 40, 80, 0.5)';
    yourPanel.color = 'rgba(100, 140, 200, 0.3)';
    yourPanel.thickness = 1;
    yourPanel.cornerRadius = 6;
    yourPanel.top = '210px';
    panel.addControl(yourPanel);

    const yourText = new TextBlock('yourStatsText');
    yourText.text = `Your Progress: ${this.saveData.unlockedLevels.filter(Boolean).length}/5 Mountains  ·  ${this.saveData.totalSummits} Total Summits`;
    yourText.color = 'rgba(180, 200, 240, 0.7)';
    yourText.fontSize = 14;
    yourText.fontFamily = 'Rajdhani, sans-serif';
    yourText.letterSpacing = 2;
    yourPanel.addControl(yourText);

    // Close button
    const closeBtn = new Rectangle('lbClose');
    closeBtn.width = '140px';
    closeBtn.height = '44px';
    closeBtn.cornerRadius = 6;
    closeBtn.background = 'rgba(40, 55, 90, 0.7)';
    closeBtn.color = 'rgba(100, 140, 200, 0.4)';
    closeBtn.thickness = 1;
    closeBtn.top = '255px';
    closeBtn.isPointerBlocker = true;
    const closeTxt = new TextBlock('lbCloseTxt');
    closeTxt.text = 'CLOSE';
    closeTxt.color = '#fff';
    closeTxt.fontSize = 16;
    closeTxt.fontFamily = 'Teko, sans-serif';
    closeTxt.letterSpacing = 3;
    closeBtn.addControl(closeTxt);
    closeBtn.onPointerClickObservable.add(() => this.overlay.dispose());
    panel.addControl(closeBtn);
  }

  _addRow(parent, top, cells, isHeader, color, isPlayer) {
    const row = new Rectangle(`row_${top}`);
    row.width = '640px';
    row.height = isHeader ? '28px' : '36px';
    row.top = `${top}px`;
    row.background = isPlayer ? 'rgba(34, 90, 50, 0.3)' : isHeader ? 'transparent' : 'rgba(255, 255, 255, 0.02)';
    row.color = isHeader ? 'rgba(100, 140, 200, 0.3)' : 'transparent';
    row.thickness = isHeader ? 0 : 1;
    row.cornerRadius = 4;
    parent.addControl(row);

    const widths = ['10%', '35%', '20%', '20%', '15%'];
    const aligns = ['center', 'left', 'center', 'center', 'center'];
    const offsets = [-270, -150, 30, 145, 245];

    cells.forEach((cell, ci) => {
      const t = new TextBlock(`cell_${top}_${ci}`);
      t.text = cell;
      t.color = isHeader ? 'rgba(150, 180, 220, 0.6)' :
                (color || (isPlayer ? '#4ade80' : 'rgba(200, 215, 240, 0.85)'));
      t.fontSize = isHeader ? 10 : 14;
      t.fontFamily = 'Teko, sans-serif';
      t.letterSpacing = isHeader ? 2 : 1;
      t.left = `${offsets[ci]}px`;
      t.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      row.addControl(t);
    });
  }
}
