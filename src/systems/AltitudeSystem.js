export class AltitudeSystem {
  constructor(levelConfig) {
    this.levelConfig = levelConfig;
    this.baseAltitude = levelConfig.sections[0].altitude;
    this.maxAltitude = levelConfig.elevation;

    this.oxygen = 1.0;
    this.altitudeSickness = 0.0;
    this.acclimatizationBonus = 0.0;
    this.currentAltitude = this.baseAltitude;

    // Altitude thresholds
    this.DEATH_ZONE = 8000;
    this.HIGH_ALTITUDE = 6000;
    this.MID_ALTITUDE = 4000;
  }

  getAltitudeFromHeight(worldY) {
    const t = Math.max(0, Math.min(1, (worldY + 5) / 50));
    return Math.round(this.baseAltitude + t * (this.maxAltitude - this.baseAltitude));
  }

  update(dt, worldY, isResting) {
    this.currentAltitude = this.getAltitudeFromHeight(worldY);

    const drainRate = this._getOxygenDrainRate();
    const regenRate = isResting ? 0.05 : 0.0;

    this.oxygen = Math.max(0, Math.min(1, this.oxygen - drainRate * dt + regenRate * dt));

    if (this.currentAltitude >= this.HIGH_ALTITUDE && this.oxygen < 0.3) {
      this.altitudeSickness = Math.min(1, this.altitudeSickness + 0.02 * dt);
    } else {
      this.altitudeSickness = Math.max(0, this.altitudeSickness - 0.01 * dt);
    }

    if (isResting) {
      this.acclimatizationBonus = Math.min(0.2, this.acclimatizationBonus + 0.001 * dt);
    }

    return {
      oxygen: this.oxygen,
      altitude: this.currentAltitude,
      altitudeSickness: this.altitudeSickness,
      isDangerous: this.oxygen < 0.2 || this.altitudeSickness > 0.7,
      isDeadly: this.oxygen <= 0,
      speedMultiplier: this._getSpeedMultiplier()
    };
  }

  useSupplementalOxygen(amount = 0.3) {
    this.oxygen = Math.min(1, this.oxygen + amount);
  }

  _getOxygenDrainRate() {
    const alt = this.currentAltitude;
    if (alt >= this.DEATH_ZONE) return 0.04;
    if (alt >= this.HIGH_ALTITUDE) return 0.015 + (alt - this.HIGH_ALTITUDE) / (this.DEATH_ZONE - this.HIGH_ALTITUDE) * 0.025;
    if (alt >= this.MID_ALTITUDE) return 0.005;
    return 0.001;
  }

  _getSpeedMultiplier() {
    const altPenalty = this.currentAltitude >= this.DEATH_ZONE ? 0.5 :
                       this.currentAltitude >= this.HIGH_ALTITUDE ? 0.7 : 1.0;
    const sicknessPenalty = 1 - this.altitudeSickness * 0.4;
    const oxygenPenalty = this.oxygen < 0.3 ? 0.5 + this.oxygen * (1 / 0.3) * 0.5 : 1.0;
    return altPenalty * sicknessPenalty * oxygenPenalty;
  }

  reset() {
    this.oxygen = 1.0;
    this.altitudeSickness = 0.0;
    this.currentAltitude = this.baseAltitude;
  }
}
