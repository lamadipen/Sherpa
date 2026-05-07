---
name: Sherpa Game – Development Roadmap
description: Prioritized next steps for the SHERPA BabylonJS platformer game, as of 2026-05-07
type: project
---

Sherpa is a 2.5D BabylonJS platformer where you play Karma, a veteran Sherpa guiding climbers up 5 Nepal peaks. Scaffolding is complete; core gameplay loop exists but needs assets, audio, and polish.

**Why:** Building toward an itch.io PWYW release targeting Nepali youth and mountaineering fans worldwide.

**How to apply:** Use this roadmap to pick up where we left off in any future session.

---

## Status: Scaffolding complete, assets + bosses + audio missing

### Done
- Boot screen, state machine (Loading → Menu → Level Select → Playing → Summit)
- All 5 level configs (Langtang, Manaslu, Annapurna, Everest, Kanchenjunga) with sections, spirits, cultural events
- 2.5D physics (WASD, sprint, coyote time, jump buffer, touch input)
- Procedural terrain (fbm noise, snow/ice/rock materials — fallback until real assets added)
- Altitude, weather, hazard systems
- HUD, leaderboard, settings, summit, level-select scene files exist
- localStorage save (unlocked levels, summit times, high scores)

---

## Remaining Work (ordered by priority)

1. **Verify game runs** — `npm run dev`, walk all scenes, fix runtime errors/broken imports
2. **Download CC0 assets** (no code needed) — per `public/assets/ASSETS_README.md`:
   - Quaternius character GLBs → `public/assets/models/characters/karma.glb`
   - Kenney Nature Kit → `public/assets/models/nature/`
   - Polyhaven snow/rock/ice textures (1K) → `public/assets/textures/`
3. **Audio** — wire Freesound/OpenGameArt CC0 files into WeatherSystem + scene transitions; zero audio exists yet
4. **Spirit encounter bosses** — `bossType` fields exist in level configs but `_triggerSpiritEncounter()` in `src/scenes/GameScene.js` only shows dialogue; need real mechanics for: storm (Annapurna), wind wall (Everest), final boss (Kanchenjunga)
5. **Mobile on-screen D-pad** — touch swipe detection exists in KarmaPlayer but no visible HUD buttons
6. **Cultural event triggers** — Yak Festival, Dashain, Losar, Mani Rimdu events in configs but not fired in-game
7. **Outfit/badge reward screen** — SummitScene needs to display earned cosmetics per level
8. **Nepali language toggle** — `lang` setting exists in save data but no string table wired up
9. **itch.io build** — add `base: './'` to `vite.config.js`, verify `npm run build` produces correct `dist/`
