import { Scene, FreeCamera, Vector3, Color4, HemisphericLight } from '@babylonjs/core';

export class LoadingScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.onComplete = null;
  }

  async create() {
    this.scene = new Scene(this.game.engine);
    this.scene.clearColor = new Color4(0.05, 0.07, 0.13, 1);

    const camera = new FreeCamera('loadCam', new Vector3(0, 0, -10), this.scene);
    camera.setTarget(Vector3.Zero());
    new HemisphericLight('loadLight', new Vector3(0, 1, 0), this.scene);

    const steps = [
      { pct: 20, label: 'Loading BabylonJS engine...' },
      { pct: 40, label: 'Building mountain terrain...' },
      { pct: 60, label: 'Placing prayer flags...' },
      { pct: 80, label: 'Summoning ancient spirits...' },
      { pct: 95, label: 'Preparing base camps...' },
      { pct: 100, label: 'Ready to climb!' }
    ];

    for (const step of steps) {
      window.setBootProgress?.(step.pct, step.label);
      await new Promise(r => setTimeout(r, 350));
    }

    await new Promise(r => setTimeout(r, 400));
    window.hideBootScreen?.();
    await new Promise(r => setTimeout(r, 900));

    this.onComplete?.();
  }

  dispose() {
    this.scene?.dispose();
    this.scene = null;
  }
}
