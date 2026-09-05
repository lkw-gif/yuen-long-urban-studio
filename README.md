# 元朗街區 · Urban Studio

[GitHub Pages 網站](https://lkw-gif.github.io/yuen-long-urban-studio/)

An interactive Three.js study model traced from the two user-provided map screenshots. The street-aligned perimeter has continuous asphalt, concrete curbs and white road-edge markings. There is no blue outline. Eight named buildings plus contextual blocks, two playgrounds, roads, vegetation and a western channel are included. Heights, appearance and horizontal units are illustrative, not surveyed.

## Use

Rotate with a drag, zoom with the wheel, pan with right-drag. Select a building to inspect it, change camera or shading mode, toggle layers, and export the visible model as a named, material-bearing GLB file for Blender. The website is a viewer and does not run Blender itself.

## Development

- npm install
- npm run dev
- npm run build
- npx tsc --noEmit
- node --experimental-strip-types scripts/check-bridge.mjs

## Validation

Production build and TypeScript checks passed. Model checks verify all building footprints are inside the road-aligned study boundary, finite geometry, binary glTF 2.0 serialization, preserved object names and height scale, omitted hidden layers, and compatibility without GPU-instancing extensions. The export keeps the live scene unchanged.

Optional WebMCP tools inspect and configure the same visible scene state. Registration, invalid inputs, state changes and lifecycle cleanup have unit contract coverage. Live WebMCP integration has not been validated.

## Concept models

The /concepts page reconstructs three supplied design images as independent 3D scenes: Living Community (riverside timber pavilions, civic buildings and sports grounds), Skybridge Community (covered pedestrian network and octagonal hub), and Vertical City (dense towers, multilevel connections and an arched transit station). Each model retains its source image and can export the visible scene as GLB. These are interpretive reconstructions, not photogrammetric replicas.

All three model factories and binary exports were validated for finite geometry, bounds within the base, named objects, model-specific landmarks, source-image byte equality and the omission of hidden bridge layers.

## Skybridge workshop

[/bridge-workshop/](https://lkw-gif.github.io/yuen-long-urban-studio/bridge-workshop/) provides eight Traditional Chinese lessons for a 200 × 60 mm school display model using card piers, plywood, timber strips, toothpick bracing and a precut acrylic/PET roof. Each lesson has a progressive interactive model, exploded view, highlighted parts, dimensions, assembly guidance and a completion check. The material/cutting list and all lessons can be printed. Each stage exports an assembled GLB with millimetres converted to metres for Blender.

The bridge check validates stage visibility, finite geometry, physical dimensions, highlighted-material restoration, exploded/assembled transitions, binary glTF units and cleanup of instanced buffers and shadow targets. Browser checks cover eight lesson switches, exploded view, stage download, and desktop/mobile layouts. Mobile scene settings are now accessible on the home and concept pages. Static models render on demand and release GPU resources when switching scenes.

GitHub Actions builds the static site and `scripts/prepare-pages.mjs` prepares directory indexes for all three routes. Sites uses the regular Worker build without the GitHub Pages base path.
