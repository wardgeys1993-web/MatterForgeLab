# MatterForge Lab 0.8.1

This update brings the 3D chamber and cinematic materials to the Windows desktop app.

- Orbit, pan and zoom around the existing planar simulation, with smooth framing and top/perspective views.
- Inspect shaded particles, actual binding sites and recorded bonds, with satin teal and aged-brass finishes and directional studio lighting.
- Use fullscreen, keyboard selection, optional IDs, sampled trails and composite PNG export.
- Fall back to 2D if 3D graphics are unavailable, without resetting the experiment.

The physics engine, research implementation, saved-experiment format, desktop recovery and signed updater are preserved. The scientific limits of the teaching model are unchanged. See [3D chamber controls and interpretation](CHAMBER_3D.md).

Verification: 81 model, research and rendering tests, seven desktop permission/signature/updater tests, lint, production build and Windows packaging passed. The packaged app completed real research and preserved experiment A, the chamber and research across reopening. Native 3D checks covered camera controls, fullscreen, PNG export, reduced motion, a 900-pixel window, manual 2D fallback and actual WebGL context loss/retry, without changing saved state or making external requests.

The desktop permission policy now permits fullscreen only for the trusted app's main frame. Other permissions remain denied. The installer payload, source allowlist, signing public key, update feed and protected engine/research files were checked. Source-history and packaged-content secret scans passed.

Publication and the installed public 0.8.0 to 0.8.1 transition are pending. This build has no Windows Authenticode certificate. Wider GPU coverage and full accessibility testing remain open. The runtime dependency audit is clean; 15 moderate build-toolchain advisories remain.
