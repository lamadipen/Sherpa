# SHERPA Game – Asset Download Guide

All assets below are **CC0 (Public Domain)** — free to use, no attribution required.

---

## Characters

### Quaternius – Universal LPC Base Characters
- **URL:** https://quaternius.com/packs/universalbasecharacters.html
- **Download:** Click "Download Pack" (free)
- **Files needed:** `CharacterMale_A.glb`, `CharacterFemale_A.glb`
- **Place in:** `public/assets/models/characters/`
- Rename to: `karma.glb` (male), `climber.glb` (female or alternate male)

### Quaternius – Ultimate Platformer Pack (characters + environment)
- **URL:** https://quaternius.itch.io/ultimate-platformer-pack
- **Download:** Free on itch.io
- **Files needed:** Any character GLB files
- **Place in:** `public/assets/models/characters/`

---

## Environment & Terrain

### Kenney – Nature Kit
- **URL:** https://kenney.nl/assets/nature-kit
- **Download:** Free ZIP
- **Files needed:** All `.glb` files in the `Models/` folder
- **Place in:** `public/assets/models/nature/`
- Key props: `rock_largeA.glb`, `tree_tall.glb`, `bush.glb`

### Kenney – Pirate Kit (for wooden platforms/structures)
- **URL:** https://kenney.nl/assets/pirate-kit
- Wooden crates, barrels — useful for base camp props

### Kenney – Survival Kit
- **URL:** https://kenney.nl/assets/survival-kit
- Tent, campfire, backpack props

---

## Textures

### Polyhaven (CC0 PBR Textures)
- **URL:** https://polyhaven.com/textures
- Search: "snow", "rock", "ice"
- Download at **1K** resolution for web performance
- **Place in:** `public/assets/textures/`

Recommended textures:
- `snow_field_aerial` – snow ground
- `rock_wall` – cliff faces
- `ice` – glacier/ice sections
- `rocky_terrain` – base camp area

---

## Audio

### Freesound (CC0 sounds)
- **URL:** https://freesound.org
- Search and filter by CC0 license
- **Place in:** `public/assets/sounds/`

Recommended sounds:
- Wind: search "mountain wind ambient"
- Steps: search "snow footsteps"
- Avalanche: search "avalanche rumble"
- Summit bell: search "tibetan bowl"
- Background music: search "himalayan ambient"

### OpenGameArt (CC0 music)
- **URL:** https://opengameart.org
- Filter by CC0, search "ambient mountain" or "adventure"
- **Place in:** `public/assets/sounds/music/`

---

## Fallback Behavior

The game will run with procedurally generated geometry if assets are missing.
Character models fall back to capsule + box geometry.
Terrain falls back to procedural noise-based meshes.
No audio plays if sound files are absent.

---

## Quick Start Without Assets

```bash
npm install
npm run dev
```

The game runs immediately with built-in procedural graphics.
Download assets above to replace placeholder geometry.
