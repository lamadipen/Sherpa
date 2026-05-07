import { Engine } from '@babylonjs/core';
import { Game } from './Game.js';

const canvas = document.getElementById('renderCanvas');
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
  adaptToDeviceRatio: true
});

window.setBootProgress?.(10, 'Engine ready...');

const game = new Game(engine, canvas);

window.addEventListener('resize', () => engine.resize());

game.start().catch(console.error);
