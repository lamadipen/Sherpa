import { GameScene } from './scenes/GameScene.js';
import { levels } from './levels/levelConfigs.js';
import './styles.css';

const canvas = document.querySelector('#gameCanvas');
const uiRoot = document.querySelector('#ui');

const game = new GameScene(canvas, uiRoot, levels);
game.start();
