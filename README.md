# Sherpa: Karma of the Peaks

Sherpa: Karma of the Peaks is a browser-based 3D guiding simulator built with Vite and Babylon.js. You play as Karma, a veteran Sherpa leading climbers across five Himalayan routes while balancing speed, oxygen, stamina, morale, and respect for the mountain.

## Features

- Playable 3D mountain routes rendered with Babylon.js
- Five selectable mountains: Everest, Annapurna I, Langtang Lirung, Manaslu, and Kanchenjunga
- Route hazards including crevasses, avalanches, blizzards, and mountain spirits
- Oxygen, stamina, morale, time, progress, checkpoint, and summit result tracking
- English and Nepali dialogue toggle
- Local best summit times saved in the browser
- Kenney CC0 environment assets bundled under `public/assets/vendor`

## Tech Stack

- Vite
- Babylon.js
- JavaScript modules
- CSS

## Getting Started

### Prerequisites

Install Node.js and npm.

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Controls

| Action | Key |
| --- | --- |
| Move forward | `W` or `ArrowUp` |
| Move backward | `S` or `ArrowDown` |
| Move left | `A` or `ArrowLeft` |
| Move right | `D` or `ArrowRight` |
| Jump crevasses | `Space` |
| Crouch through blizzards | `C` |
| Dodge avalanches | `Shift` |
| Throw rope to recover caches | `F` |
| Rest / conserve energy | `R` |
| Use checkpoint resupply | `E` |

## Project Structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── ASSETS.md
├── public/
│   └── assets/vendor/kenney/
└── src/
    ├── main.js
    ├── styles.css
    ├── entities/
    │   └── KarmaPlayer.js
    ├── levels/
    │   └── levelConfigs.js
    └── scenes/
        └── GameScene.js
```

## Gameplay Notes

The goal is to guide Karma's team to the summit without exhausting oxygen, stamina, or morale. Moving quickly can improve summit times, but hazards and altitude make restraint important. Jump crevasses, crouch through whiteouts, dodge avalanche paths, and throw the rope toward side caches for extra supplies. Clean moves build flow combos, add skill score, and give a short pace boost. Reaching the checkpoint unlocks one resupply with `E`.

## Assets

Third-party art is stored in `public/assets/vendor`. The repo keeps GLTF/GLB runtime models plus PNG previews/textures only. See `ASSETS.md` for source links and license details.

## License

This repository does not currently include a project license. Bundled third-party assets keep their original licenses as documented in `ASSETS.md`.
