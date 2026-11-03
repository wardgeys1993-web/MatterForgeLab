# MatterForge visual system

Updated 2026-11-03. The Observatory collection uses deep ink, desaturated teal, champagne gold and warm white. Original glass assembly and crystalline lattice artwork gives the application a cinematic identity. Particle colors remain distinct so type and bond information stays readable. See [the artwork and motion specification](design/OBSERVATORY.md) for assets, generation prompts and implementation details.

## Tokens

The current presentation layer is `src/cinematic.css`, loaded after `src/theme.css` and `src/App.css`. Core tokens include ink `#080f13`, surface `#101b20`, raised surface `#17262c`, champagne `#e7c58d`, jade `#9ddbd2`, primary text `#edf2ee`, secondary text `#b5c6c8`, and muted text `#91a6ab`. Existing component-specific colors have not all been migrated to tokens. Scientific states retain their established text, shapes and colors.

## Typography and components

Manrope Variable is used for controls and body text; Newsreader Variable is used for prominent headings and numbers. Both are bundled locally from Fontsource and use the SIL Open Font License. Their license texts are included under `public/licenses` and in the production build. The app does not need a font server.

Primary actions use champagne fills with dark text. Secondary actions use fine warm outlines. Active navigation uses a narrow gold edge, a subtle jade surface and `aria-current`. Disabled controls reduce emphasis; keyboard focus has an explicit jade outline. Panels use quiet teal surfaces with fine borders. The assembly monogram is a folded M inside a hexagonal frame, with a jade core. Seven native SVG glyphs replace the earlier text symbols in the progression cards.

Page transitions, slow artwork drift, staggered hero text, card hover states and dialog entrances share a restrained motion language. The header includes a persistent Motion control. System reduced-motion preference takes priority and disables decorative motion. Browser view transitions are progressive enhancement; unsupported browsers retain ordinary navigation.

The desktop lab keeps the chamber and observations together and makes the longer control panel independently scrollable. At narrower widths, the panels stack and the controls use the page scroll. Keyboard focus should bring individual controls into view. These patterns have targeted browser checks, not a full accessibility audit.

The triangle target uses the existing outlined example action and a compact amber-edged contextual note. The note changes from an action prompt to an explanation once a same-type bond rule is enabled. It does not rely on color alone.

The controlled study presents sampled rates in matching cards, with uncertainty and the paired difference stated in text as well as shown in color. An expandable explanation describes the assumptions. Seed and arrangement controls stack at narrow widths to keep their selected values readable.

Controlled-study imports use an outlined secondary action, a dark preview with the recorded settings, and a separate primary replay action. A bordered result panel reports whether recorded outcomes matched; warnings and sampling provenance appear as text, not color alone.

Directional site types use both color and shape: a light circle for type 1 and a violet diamond for type 2, with a gold outline for occupied sites. The site-rule card uses the existing rule-button states and text labels, while controlled studies use named choices for these categorical settings.
