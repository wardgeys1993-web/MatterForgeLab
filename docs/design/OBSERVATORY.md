# Observatory visual collection

Created 2026-11-03 for MatterForge Lab. Original backgrounds were generated with the built-in image generation tool. The mark, app icon, wordmark, and seven progression glyphs were drawn as native SVG. Artwork is conceptual decoration, not simulation output or scientific evidence.

## Direction

Deep ink and desaturated teal create a quiet laboratory setting. Clear glass and brushed champagne metal connect the artwork to the app's abstract assembly model. Newsreader gives headings an editorial character; locally bundled Manrope keeps controls precise. Thin borders, restrained highlights, and generous spacing carry the hierarchy.

The hero combines the assembly artwork with a CSS vignette and real selectable HTML text. On narrow screens, the artwork sits above the copy. Chapter headers, the sidebar note, the simulation heading, and discovery cards reuse the lattice artwork with different crops. No text is baked into the backgrounds.

## Assets

| File | Use |
| --- | --- |
| public/visuals/assembly-hero.webp | Desktop discovery artwork, 1536 by 1024 |
| public/visuals/assembly-hero-960.webp | Responsive discovery artwork, 960 by 640 |
| public/visuals/lattice-atmosphere.webp | Chapter headers, workbench heading, sidebar, cards, 1536 by 732 |
| public/visuals/matterforge-mark.svg | Transparent assembly monogram |
| public/visuals/matterforge-icon.svg | App tile and browser favicon |
| public/visuals/matterforge-wordmark.svg | Horizontal identity lockup |
| docs/design/originals/assembly-hero.png | Original generated master |
| docs/design/originals/lattice-atmosphere.png | Original generated master |

The two full-size WebP images total 184,218 bytes. Delivery copies were resized where necessary and encoded with Pillow; their visual content was not altered. Original PNGs are retained outside public so they do not inflate the application build.

## Motion

Native browser view transitions crossfade and gently move the page content over 520 ms. Navigation and toolbar remain visually anchored. Without that browser API, navigation remains immediate and usable. The hero has staggered entrance timing and a slow, subtle 24-second artwork drift; chapter artwork uses 30 seconds. Cards, actions, lesson changes, and dialogs have short transitions.

The header's Motion control persists independently from experiment settings. Turning it off disables decorative animations and transitions. System reduced-motion preference always takes priority, including live preference changes. Simulation playback remains an explicit scientific control and is independent of decorative motion. Guided scrolling respects the selected motion preference. The route content opts out of browser scroll anchoring to prevent new pages opening partway down after a view transition.

## Implementation ownership

Visual components live in src/Cinematic.tsx, motion behavior in src/useCinematicMotion.ts, and the final presentation layer in src/cinematic.css. The latter follows existing App.css and theme.css so ongoing feature development remains intact. App.tsx was patched in place. ResearchLab remains mounted in its existing hidden wrapper so navigating away does not discard ongoing research. Simulation rules, serialized experiment data, study logic, and research implementation were not edited by this visual task.

## Generation prompts

### Assembly study

Use case: stylized-concept. Create an exceptionally polished cinematic background for MatterForge Lab, a premium scientific learning application exploring self-assembly. Wide landscape 1536x1024 composition. A spectacular sculptural cluster of about 18 optically clear smoky glass spheres and brushed pale champagne metal spheres, joined by delicate gold connection rods, floats in a dark teal-black void. The assembly forms an elegant open arch or almost circular branching structure, intricate but restrained, asymmetric and physically tactile, on the RIGHT 58 percent of the frame. Strong depth, macro product photography, one or two larger glass orbs in foreground, small sharp nodes behind, realistic caustics and refraction, fine metallic details. A soft turquoise rim light on one side, warm champagne highlights on the other, subtle volumetric mist and extremely sparse dust motes. LEFT 42 percent is very dark quiet negative space for overlay typography, seamless dark #080f13 background. Art-directed luxury science museum installation, refined cinematic lighting, sophisticated visual balance, excellent spatial depth. No text, no letters, no logos, no interface, no borders, no people, no generic atom icon, no neon rainbow, no big lens flares. Beautiful ultra detailed original artwork, restrained understated premium finish.

### Lattice atmosphere

Use case: stylized-concept. Original cinematic materials study for the dark background of MatterForge Lab, a premium scientific app. Ultra wide composition visually like a 21:9 movie still, delivered in landscape. Macro photograph of a sculptural flowing lattice made of fine champagne metallic filaments and translucent teal mineral glass membranes, like abstract self-assembled matter. A single elegant sweeping wave of cellular crystalline structure grows out of darkness across the RIGHT HALF, into the upper right corner. LEFT HALF almost pure deep ink #080f13 with very subtle teal atmospheric haze and generous negative space for headings. The structure is delicate, luxurious, scientifically inspired but explicitly conceptual, not a diagram. Cool jade and desaturated teal reflections, very restrained pale gold edges, dramatic chiaroscuro, tactile micro texture, soft cinematic depth of field. Wide low horizontal sweep, calm composition, museum installation quality, exquisite realism. No spheres, no text, no letters, no logos, no interface, no planets, no landscapes, no rainbow neon, no clutter. Intended as a cropped panoramic chapter header and subdued app background. Dark shadows should dominate, with a beautifully lit sculptural detail on the right.

