# 3D chamber

The chamber presents the existing planar teaching model in 3D. Model coordinates `(x, y)` map to world coordinates `(x, 0, y)`. Distances, particle orientations, recorded binding sites and bond endpoints are preserved. The view does not advance the model or consume its random generator.

Satin teal and aged-brass finishes, surface grain, studio reflections, warm key lighting, a cool rim and shadows are display conventions. They do not represent measured atom radii or material properties. The grain affects lighting normals only, with no vertex displacement. The simulation remains an uncalibrated two-dimensional teaching model.

## Controls

- Drag to orbit. Shift-drag or right-drag pans. Scroll zooms.
- Arrow keys orbit; Shift with arrows pans. Plus/minus zoom, 0 resets, T selects top view and F frames the selected assembly or all particles.
- One finger orbits on touch screens; two fingers zoom and pan.
- The toolbar provides framing, zoom, top/perspective views and reset. Expand opens fullscreen.
- Select a particle in the view or use the keyboard-accessible inspector. Escape clears selection.
- Reduced motion disables camera easing and damping. Direct input interrupts a camera transition.

Round and diamond-shaped ports identify the two site types. Gold outlines indicate occupied sites. Solid brass links are compatible under the current rules; broken coral links are unintended. Forces use the model's stored vectors, while trails sample actual model positions and remain still when paused. PNG export includes the current scene, labels and model caption.

## Compatibility

This view preserves the desktop app's engine, save format, local recovery, research implementation, protocol origin and signed updater. It adds no telemetry or remote image dependency. Three.js is loaded locally only when entering the lab. Missing WebGL or context loss falls back to the retained 2D view without resetting the experiment. The 3D view can be retried.

Three.js is distributed under its [bundled MIT license](../public/licenses/three-MIT.txt). GPU resources are disposed when leaving the view. Rendering skips hidden views and unchanged paused scenes, and pixel density is capped at 2.
