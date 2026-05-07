import {
  ParticleSystem, Texture, Color4, Vector3, Color3
} from '@babylonjs/core';

export class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.currentWeather = 'clear';
    this.intensity = 0;
    this.windX = 0;
    this.avalancheTimer = 0;
    this.avalancheWarning = false;
    this.avalancheActive = false;
  }

  applyWeatherProfile(levelConfig) {
    const sky = levelConfig.skyColor;
    const fog = levelConfig.fogColor;

    this.scene.clearColor = new Color4(sky.r, sky.g, sky.b, 1);
    this.scene.fogMode = 3; // FOGMODE_EXP2
    this.scene.fogColor = new Color3(fog.r, fog.g, fog.b);
    this.scene.fogDensity = levelConfig.fogDensity;

    this.windX = (Math.random() - 0.5) * levelConfig.windStrength;
    this._buildSnowParticles(levelConfig.snowIntensity);
  }

  _buildSnowParticles(intensity) {
    if (intensity <= 0) return;

    const snow = new ParticleSystem('snow', Math.floor(3000 * intensity), this.scene);
    snow.particleTexture = this._createFlakeTexture();

    snow.emitter = new Vector3(0, 30, 0);
    snow.minEmitBox = new Vector3(-60, -2, -8);
    snow.maxEmitBox = new Vector3(60, 2, 8);

    snow.color1 = new Color4(0.95, 0.97, 1, 0.8);
    snow.color2 = new Color4(0.85, 0.9, 1, 0.6);
    snow.colorDead = new Color4(1, 1, 1, 0);

    snow.minSize = 0.05;
    snow.maxSize = 0.2;
    snow.minLifeTime = 4;
    snow.maxLifeTime = 8;

    snow.emitRate = Math.floor(400 * intensity);
    snow.blendMode = ParticleSystem.BLENDMODE_STANDARD;

    snow.gravity = new Vector3(this.windX * 0.5, -2, 0);
    snow.direction1 = new Vector3(-0.3, -1, 0);
    snow.direction2 = new Vector3(0.3, -1, 0);

    snow.minAngularSpeed = 0;
    snow.maxAngularSpeed = Math.PI * 0.5;

    snow.start();
    this.particles.push(snow);
    this.snowSystem = snow;
    this.currentIntensity = intensity;
  }

  _createFlakeTexture() {
    return new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABklEQVQIW2NkYGD4DwABBAEASMhguAAAAABJRU5ErkJggg==', this.scene);
  }

  triggerAvalancheWarning() {
    this.avalancheWarning = true;
    setTimeout(() => {
      this.avalancheActive = true;
      this.avalancheWarning = false;
      setTimeout(() => { this.avalancheActive = false; }, 8000);
    }, 3000);
    return this.avalancheWarning;
  }

  update(dt) {
    if (this.snowSystem) {
      const wobble = Math.sin(Date.now() / 2000) * 0.3;
      this.snowSystem.gravity.x = this.windX + wobble;
    }

    this.avalancheTimer += dt;
    if (this.avalancheTimer > 45 + Math.random() * 30 && !this.avalancheActive) {
      this.avalancheTimer = 0;
      if (Math.random() < 0.4) this.triggerAvalancheWarning();
    }

    return {
      avalancheWarning: this.avalancheWarning,
      avalancheActive: this.avalancheActive,
      windX: this.windX
    };
  }

  intensify(factor = 1.5) {
    if (this.snowSystem) {
      this.snowSystem.emitRate = Math.floor(this.snowSystem.emitRate * factor);
      this.scene.fogDensity = Math.min(0.08, this.scene.fogDensity * 1.5);
    }
  }

  dispose() {
    this.particles.forEach(p => p.dispose());
    this.particles = [];
  }
}
