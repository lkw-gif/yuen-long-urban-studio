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
- node --experimental-strip-types scripts/check-tower.mjs

## Validation

Production build and TypeScript checks passed. Model checks verify all building footprints are inside the road-aligned study boundary, finite geometry, binary glTF 2.0 serialization, preserved object names and height scale, omitted hidden layers, and compatibility without GPU-instancing extensions. The export keeps the live scene unchanged.

Optional WebMCP tools inspect and configure the same visible scene state. Registration, invalid inputs, state changes and lifecycle cleanup have unit contract coverage. Live WebMCP integration has not been validated.

## Concept models

The /concepts page reconstructs three supplied design images as independent 3D scenes: Living Community (riverside timber pavilions, civic buildings and sports grounds), Skybridge Community (covered pedestrian network and octagonal hub), and Vertical City (dense towers, multilevel connections and an arched transit station). Each model retains its source image and can export the visible scene as GLB. These are interpretive reconstructions, not photogrammetric replicas.

All three model factories and binary exports were validated for finite geometry, bounds within the base, named objects, model-specific landmarks, source-image byte equality and the omission of hidden bridge layers.

## Skybridge workshop

[/bridge-workshop/](https://lkw-gif.github.io/yuen-long-urban-studio/bridge-workshop/) is a model-only, eight-step reconstruction of a Hong Kong skybridge network connecting three buildings. Bamboo skewers form the columns, bearers and knee braces; transparent acrylic forms the main deck, branch deck, entrance landings and both side guards. The compact page contains step navigation and interactive 3D controls, with no written lessons, material tables or print handouts. Each stage exports an assembled GLB with millimetres converted to metres for Blender.

Checks cover progressive geometry, transparent highlights, assembled/exploded transitions, continuous routes at bends and junctions, unobstructed entrances, support heights and GLB visibility/units. Desktop and mobile layouts retain rotation, zoom, top view and stage selection. The shared urban viewer renders on demand and releases GPU resources when switching scenes.

## Tinkercad 3D design

[/3d-design/](https://lkw-gif.github.io/yuen-long-urban-studio/3d-design/) teaches a blue residential tower through eight chapters and 36 small steps. Each step pairs a real Tinkercad screenshot from the 2026-09-06 modelling session with a progressive, interactive 3D result. Screenshots open in an accessible enlargement dialog. The supplied editor tool locator and clearly labelled operation diagrams remain available through the alternative view. Every step includes a location, action, expected result and troubleshooting guidance, including temporarily hiding the tower to select window holes reliably.

The basic tower leads into duplicate/repeat window arrays, Hole subtraction, Union grouping and Tinkercad STL export. The tower was built through the actual browser editor and exported there; the final step downloads that original binary STL (5,132 triangles), rather than a generated viewer export. Its envelope is 48 × 48 × 114.3 mm, with Z-up orientation and closed mesh edges. The interactive viewer remains a separate geometric illustration. Tests cover its stages, bounds, connectivity and 312 recesses, plus all 36 captured JPEG assets and the actual downloaded STL. No physical print has been performed; printing settings and detail resolution remain for the teacher to check in the slicer.

GitHub Actions builds the static site and `scripts/prepare-pages.mjs` prepares directory indexes for all four routes. Sites uses the regular Worker build without the GitHub Pages base path.
