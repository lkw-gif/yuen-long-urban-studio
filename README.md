# 元朗街區 · Urban Studio

An interactive Three.js study model traced from the two user-provided map screenshots. The blue polygon controls the study area. Eight named buildings plus contextual blocks, two playgrounds, roads, vegetation and a western channel are included. Heights, appearance and horizontal units are illustrative, not surveyed.

## Use

Rotate with a drag, zoom with the wheel, pan with right-drag. Select a building to inspect it, change camera or shading mode, toggle layers, and export the visible model as a named, material-bearing GLB file for Blender. The website is a viewer and does not run Blender itself.

## Development

- npm install
- npm run dev
- npm run build
- npx tsc --noEmit

## Validation

Production build and TypeScript checks passed. Model checks verify all building footprints are inside the blue polygon, finite geometry, binary glTF 2.0 serialization, preserved object names and height scale, omitted hidden layers, and compatibility without GPU-instancing extensions. The export keeps the live scene unchanged.

Optional WebMCP tools inspect and configure the same visible scene state. Registration, invalid inputs, state changes and lifecycle cleanup have unit contract coverage. No supported browser WebMCP validation context was available; live WebMCP integration and browser interaction/visual QA were not performed.
