# 元朗街區 · Urban Studio

An interactive Three.js study model traced from the two user-provided map screenshots. The street-aligned perimeter has continuous asphalt, concrete curbs and white road-edge markings. There is no blue outline. Eight named buildings plus contextual blocks, two playgrounds, roads, vegetation and a western channel are included. Heights, appearance and horizontal units are illustrative, not surveyed.

## Use

Rotate with a drag, zoom with the wheel, pan with right-drag. Select a building to inspect it, change camera or shading mode, toggle layers, and export the visible model as a named, material-bearing GLB file for Blender. The website is a viewer and does not run Blender itself.

## Development

- npm install
- npm run dev
- npm run build
- npx tsc --noEmit

## Validation

Production build and TypeScript checks passed. Model checks verify all building footprints are inside the road-aligned study boundary, finite geometry, binary glTF 2.0 serialization, preserved object names and height scale, omitted hidden layers, and compatibility without GPU-instancing extensions. The export keeps the live scene unchanged.

Optional WebMCP tools inspect and configure the same visible scene state. Registration, invalid inputs, state changes and lifecycle cleanup have unit contract coverage. No supported browser WebMCP validation context was available; live WebMCP integration and browser interaction/visual QA were not performed.

## Concept models

The /concepts page reconstructs three supplied design images as independent 3D scenes: Living Community (riverside timber pavilions, civic buildings and sports grounds), Skybridge Community (covered pedestrian network and octagonal hub), and Vertical City (dense towers, multilevel connections and an arched transit station). Each model retains its source image and can export the visible scene as GLB. These are interpretive reconstructions, not photogrammetric replicas.

All three model factories and binary exports were validated for finite geometry, bounds within the base, named objects, model-specific landmarks, source-image byte equality and the omission of hidden bridge layers. The existing street perimeter and GLB checks also pass after the shared viewer extension. Browser interaction and visual QA were not requested or performed.
