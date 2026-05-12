# Asset Credits

This prototype keeps third-party art in `public/assets/vendor`.

| Asset | Source | License | Use |
| --- | --- | --- | --- |
| Kenney Nature Kit | https://kenney.nl/assets/nature-kit | Creative Commons CC0 | Terrain blocks, rocks, trees, tents, bridges, campfire props |
| Kenney Blocky Characters | https://kenney.nl/assets/blocky-characters | Creative Commons CC0 | Optional GLB character models and PNG previews for future playable character work |

## Included Formats

The project keeps only web-ready runtime assets and previews:

- Nature Kit: `Models/GLTF format`
- Blocky Characters: `Models/GLB format`
- PNG previews/textures used by the retained asset folders

Source-model formats such as DAE, FBX, OBJ, and STL were removed to keep the repository smaller and avoid maintaining unused asset variants.

Kenney's downloaded pack includes `License.txt` in `public/assets/vendor/kenney/nature-kit/License.txt`.
Kenney's character pack includes `License.txt` in `public/assets/vendor/kenney/blocky-characters/License.txt`.

The current playable Karma character is a Babylon.js procedural Sherpa placeholder. Replace it later with a rigged Sherpa `.glb` by updating `src/entities/KarmaPlayer.js`; the rest of the gameplay reads only from `player.root`.
