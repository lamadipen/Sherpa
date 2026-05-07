import { Scene } from '@babylonjs/core';
import { LoadingScene } from './scenes/LoadingScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene } from './scenes/GameScene.js';
import { SummitScene } from './scenes/SummitScene.js';

export const GameState = {
  LOADING: 'LOADING',
  MAIN_MENU: 'MAIN_MENU',
  LEVEL_SELECT: 'LEVEL_SELECT',
  PLAYING: 'PLAYING',
  SUMMIT: 'SUMMIT'
};

export class Game {
  constructor(engine, canvas) {
    this.engine = engine;
    this.canvas = canvas;
    this.currentScene = null;
    this.state = GameState.LOADING;

    this.saveData = this._loadSave();
    this.activeLevel = 0;
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem('sherpa_save');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
      unlockedLevels: [true, false, false, false, false],
      summitTimes: {},
      totalSummits: 0,
      highScores: {},
      settings: { music: 0.7, sfx: 0.8, lang: 'en' }
    };
  }

  save() {
    try {
      localStorage.setItem('sherpa_save', JSON.stringify(this.saveData));
    } catch (_) {}
  }

  unlockLevel(index) {
    if (index < 5) {
      this.saveData.unlockedLevels[index] = true;
      this.save();
    }
  }

  recordSummit(levelIndex, timeMs, score) {
    const key = `level_${levelIndex}`;
    const prev = this.saveData.summitTimes[key];
    if (!prev || timeMs < prev.time) {
      this.saveData.summitTimes[key] = { time: timeMs, score, date: Date.now() };
    }
    if (!this.saveData.highScores[key] || score > this.saveData.highScores[key]) {
      this.saveData.highScores[key] = score;
    }
    this.saveData.totalSummits++;
    this.unlockLevel(levelIndex + 1);
    this.save();
  }

  async start() {
    await this.transitionTo(GameState.LOADING);
  }

  async transitionTo(newState, payload = {}) {
    if (this.currentScene) {
      await this.currentScene.dispose?.();
      this.currentScene = null;
    }

    this.engine.stopRenderLoop();
    this.state = newState;

    switch (newState) {
      case GameState.LOADING:
        this.currentScene = new LoadingScene(this);
        this.currentScene.onComplete = () => this.transitionTo(GameState.MAIN_MENU);
        await this.currentScene.create();
        break;

      case GameState.MAIN_MENU:
        this.currentScene = new MainMenuScene(this);
        await this.currentScene.create();
        break;

      case GameState.LEVEL_SELECT:
        this.currentScene = new LevelSelectScene(this);
        await this.currentScene.create();
        break;

      case GameState.PLAYING:
        this.activeLevel = payload.levelIndex ?? 0;
        this.currentScene = new GameScene(this, this.activeLevel);
        await this.currentScene.create();
        break;

      case GameState.SUMMIT:
        this.currentScene = new SummitScene(this, payload);
        await this.currentScene.create();
        break;
    }

    if (this.currentScene?.scene) {
      this.engine.runRenderLoop(() => {
        this.currentScene?.scene?.render();
      });
    }
  }
}
