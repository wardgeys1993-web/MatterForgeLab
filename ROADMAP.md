# MatterForge Lab roadmap

## 2026-11-03, desktop release 0.8.0

Created a separate desktop release workspace from the existing simulation and research source while other development continues. Added a sandboxed Electron shell, Windows NSIS installer, local chamber recovery, native update controls, a public GitHub release feed and mandatory Ed25519 release verification. Updates are manual and preserve local app data.

Added a public-source allowlist and privacy scan. Local development reports, private paths, generated experiments and signing keys are excluded. The private signing key is stored separately from the repository and builds. The app embeds only its public verification key.

Verification: 72 model/research tests, six desktop signature/update tests, lint, the production build and Windows installer build passed. The packaged executable completed real research trials, ran the chamber, saved and restored experiment A, rendered the learning views, and preserved the chamber and research across a second native launch. The checked lab flows made no external requests and reported no renderer errors. The app archive contained only runtime dependencies, desktop code, frontend assets and package metadata, with no detected personal path or private key. The public-source privacy scan and Gitleaks staged-content scan passed; bundled images contained no EXIF, XMP or IPTC metadata.

Publication and a live GitHub installation test are the remaining release steps. Windows Authenticode signing, wider hardware coverage and a full accessibility review remain open. The runtime dependency audit reported no known vulnerabilities; the build-only toolchain reported 15 moderate advisories, principally transitive glob/minimatch dependencies. A forced downgrade of the build toolchain was not applied.

## 2026-11-03, directional site types, local version 0.6.0

Added two directional site types and selectable allowed site-type pairs. All particles currently share one two-site template. A bond is intended only when both the particle-type and site-type rules allow it. The model prefers an allowed aligned site pair when more than one is available; lower selectivity can permit unintended site pairs. Changing site types or pair rules reclassifies existing bonds and resets target timing and history. The chamber distinguishes site types by shape and color, with gold outlines for occupied sites. Any-direction mode ignores site rules.

The controlled study can compare either site type or the allowed site-pair rules as its single changed setting; study exports, imports and summaries record those rules. Chamber save format 5 migrates versions 1 through 4 with unrestricted site pairs, preserving the earlier behavior. Earlier controlled-study model 3 and 4 archives migrate with unrestricted site pairs and retain a model-version warning. Site types and strengths remain illustrative, and individual particles cannot yet have different templates.

Verification: 56 simulation, study and archive tests, 15 isolated Chrome browser tests, lint and a production build passed. Tests covered intended and unintended site pairs, alternate aligned sites, rule reclassification, old-state continuation, legacy study migration, and the existing seeded shapes. Browser checks covered site controls, save and restore, a one-variable site-rule comparison, and study export and replay. Desktop and 390-pixel controls and study results were visually inspected with no horizontal page overflow in those views. This is limited visual coverage, not a full accessibility or hardware assessment. Evidence: .Codex/qa-site-types-20261103/. No release was published.

## 2026-11-03, controlled-study import and replay, local version 0.5.0

Added import and preview of complete controlled-study JSON exports. A replay uses the file’s recorded settings, seed sequence, target and duration in a background worker without changing the active chamber or saved experiment A. The result compares each recorded seed, arrangement seed, first-success time, final stability and unintended-bond count, reporting matches and differences. Matching records do not verify the full trajectory or file provenance. Imported random-sampling claims cannot be independently verified, and older model markers produce a warning. Study formats 1 and 2 with recognized model markers 3 and 4 are supported; malformed, incomplete and oversized files are rejected. CSV is not a replay format.

Tightened validation of all base settings before any controlled study runs. The local app version is 0.5.0; chamber save format remains 4 and no release was published.

Verification: 48 simulation and archive tests, 14 isolated Chrome browser tests, lint and production build passed. Browser checks exported and reimported a random study after leaving the lab, reproduced all 40 recorded outcomes, detected an altered outcome, rejected malformed and oversized files, preserved the paused chamber and saved A, and showed the older-model warning on a fixture. Screenshots of the preview and replay status at 1280 and 390 CSS pixels were inspected, without horizontal page overflow in those views. This is limited visual coverage, not a full accessibility or hardware assessment. Evidence: .Codex/qa-replay-20261103/.

## 2026-11-03, sampled seeds and uncertainty, local version 0.4.0

The controlled study now draws 100 distinct uniformly sampled nonzero 32-bit seeds by default, without replacement, and matches each seed between A and B. The existing consecutive-seed option remains for reproducible examples. A completed random sample can be repeated with the same seed list while its results remain in the lab; JSON export records the full list, settings, outcomes and analysis. Study import is not yet available.

Random samples show approximate 95% Wilson score ranges for each observed success rate and a conservative 95% Hoeffding bound for the matched difference. These describe seed sampling for the simplified model and selected starting-arrangement procedure. Settings should be selected before sampling; tuning on the same seeds is exploratory. A fixed arrangement does not generalize to other arrangements. Consecutive seeds do not receive sampling intervals. The explanatory text and README document these limits and the statistical sources.

Verification: 44 simulation and study tests, 13 isolated Chrome browser tests, lint and production build passed. Browser checks ran 100 randomly sampled pairs, checked exported records and analysis, replayed the same seeds with identical results, and verified the consecutive and varying-arrangement option. Screenshots of settings and results at 1280 and 390 CSS pixels were inspected, without horizontal overflow in those views. This is limited visual coverage, not a full accessibility or hardware assessment. Evidence: .Codex/qa-uncertainty-20261103/. No release was published; saved experiment format remains 4.

## 2026-11-03, triangular assembly target and local version 0.3.0

Added a triangular loop target requiring three correctly bonded particles, side lengths from 0.75 to 1.8 model units, longest-to-shortest ratio at most 1.4, and the same triangle held for two simulated time units. The controls explain why an odd loop needs at least one same-type compatibility rule. A seeded example uses 60-degree sites and all bond types; its real simulation first succeeds at 11.125 simulated time units in the bounded engine test. The example replaces the active chamber settings but preserves saved experiment A. Both study tools support the new target and identify it in their reports.

Saved experiments now use format 4. Versions 1, 2 and 3 migrate in memory, and tests check deterministic continuation and restoration of an in-progress triangle. The local app version is 0.3.0. No release was published.

Verification: 41 simulation and study tests, 12 isolated Chrome browser tests, lint and a production build passed. The browser exercised a real triangle, export and import, and both study tools. Screenshots of the controls at 1280 and 390 CSS pixels were inspected, with no horizontal page overflow in those checks. This is limited visual coverage, not a full accessibility or hardware assessment. Screenshots are in .Codex/qa-triangle-20261103/.

## 2026-11-03, controlled experiment laboratory and local version 0.2.0

Added a controlled A/B study for one selected parameter, with 100 matched motion seeds by default and a worker that keeps the interface responsive. The target, duration and other settings are held fixed. A fixed starting arrangement is reused by default, with an option to vary it between seed pairs. Paired runs share starting positions and orientations, except that particle-count comparisons add or remove particles and concentration comparisons scale positions with the chamber. Initial motion seeds match, but random draws can diverge during the run.

Results show success at least once before the deadline, stable-at-end counts, paired outcomes and per-seed records. The study can be cancelled and exported to JSON or CSV; results stay in the lab until it is left. The app describes the fixed-arrangement and simplified-model limitations. The local app version is now 0.2.0 and the sidebar reads it from package metadata; the saved-experiment format remains version 3. No release was published.

Verification: 37 simulation, batch and controlled-study tests, 11 isolated Chrome browser tests, lint and a production build passed. The browser ran and exported a full 100-seed comparison, checked the paired records and displayed totals, verified cancellation and a responsive glossary, and checked geometry disclosures. A desktop study and its results were visually inspected. These checks do not validate physical predictions or establish a full accessibility or hardware assessment.

## 2026-11-03, configurable experiments and visual refresh

Added a custom angle between the two binding sites and an adjustable per-step bond formation chance. Selecting a different layout preserves the chosen chance. Saved experiment format 3 stores both settings; version 1 and 2 saves migrate with their original probabilities, and tests check seeded continuation. Angle changes keep existing bonds but restart the target timer and history.

Added a local worker for studies across 5, 10 or 20 seeds, with bounded simulated durations, optional comparison against saved A, cancellation, per-seed outcomes and JSON and CSV exports. Runs start fresh from captured settings. The interface identifies results from older settings, warns about different targets and explains the limits of same-seed comparisons and small samples. A busy-worker browser check opened the glossary while a study ran, then stopped the study without changing the paused chamber.

Refreshed the interface with graphite surfaces, white typography, amber-lit lines and restrained wood-like trim. Manrope and Newsreader are bundled locally. The lab now keeps the chamber and observations together, with a scrollable desktop control panel and stacked layouts at smaller widths. The design tokens and component guidance are recorded in `docs/DESIGN_SYSTEM.md`.

Verification: 31 simulation and batch tests, 9 isolated Chrome browser tests, lint and the production build passed. Browser checks covered versioned experiment export/import, the seeded square, custom angle and probability, study comparison and cancellation, keyboard focus, and narrow and intermediate layouts. The discovery, lab, controls and study views were visually inspected at desktop, intermediate and narrow widths. This was not a full accessibility or screen-reader audit. Earlier performance measurements predate the new worker and adjustable settings.

## 2026-11-02 to 2026-11-03, shapes and hierarchy

Added optional opposite and corner binding sites, particle rotation, site occupancy and approximate angular alignment forces. Added a selectable square-loop target with explicit geometry and stability checks. The guided square example uses a reproducible seed and remains a real simulation. In the bounded test it first reached a stable target at 38.125 simulated time units. Its 4× playback setting brought it to success in the browser test. Directional modes deliberately use a different bond formation probability from the original mode; both the app and README disclose that this affects comparisons.

The save format is now version 2. Version 1 experiments migrate to their original any-direction behavior, and a test checks that their subsequent random sequence is preserved. Added a separate seeded, discrete hierarchy model for part encounters, faulty modules, repair and larger connections. This model is conceptual, resets when leaving its guide and is not saved as experiment A. Added interactive schematic illustrations for self-assembly, DNA pairing and catalysis, plus topic-specific motifs for several other lessons.

Verification on 2026-11-03: 24 engine and hierarchy tests, 6 isolated Chrome browser tests, lint and the production build passed. Browser tests exercised the square example through success and JSON export/import, hierarchy stepping and reset, and narrow viewport overflow. The directional chamber, hierarchy layout and learning illustrations were visually inspected. A short Node engine measurement and a five-second headless browser callback and JavaScript heap sample are in `docs/PERFORMANCE.md`. They do not establish physical display smoothness, long-run memory stability or performance on other hardware.

## 2026-11-02, roadmap continuation

Added three guided experiment paths with step navigation and focus shortcuts. The compatibility editor now changes the actual A to A, A to B and B to B binding rules; changing a rule reclassifies existing bonds and resets the target timer and graph. Old saves migrate to the original A to B rule. Added a conceptual hierarchy view and an idealized parallel-work calculator, with assumptions visible alongside the results.

Added an in-place searchable glossary, nine more sourced learning notes, topic-specific Curious and Technical notes, and object-specific manufacturing routes with inputs, machinery, inspection, constraints and dependencies. Improved import validation, limited imported JSON size, and made comparison show changed settings and simulated time. Added a proposed versioned backend contract and OpenMM research notes, but no new simulation backend.

Verification: 13 engine tests, 4 isolated Chrome browser tests, lint and the production build passed. Browser flows covered the new rule editor, save and restore, glossary, calculator, guided focus, technical notes and the object-specific ladder. The guide and ladder were visually inspected, and a 390-pixel lab test checked for horizontal page overflow. This was not a full accessibility or screen-reader audit. A bounded engine-only Node measurement on this computer is recorded in `docs/PERFORMANCE.md`; browser frame performance and other hardware remain unmeasured.

## 2026-11-02, initial prototype

Implemented a local React and Canvas application with a deterministic two-dimensional self-assembly engine, reversible compatible and unintended bonds, controls, event explanations, target tracking, live metrics, a rolling graph, save and restore, comparison, JSON and CSV exports, and a chamber PNG export. Added an introductory learning library and a high-level manufacturing ladder. Scientific limitations are visible in the app and documented in the README.

The default seed reached a stable four-particle connected target at 11.95 simulated time units in a bounded engine run. Nine engine tests and the production build passed. Browser checks covered the dashboard, running simulation, parameter explanation, local save, changing a control, comparison and restore. The dashboard and a smaller lab viewport were visually inspected. These are bounded checks, not validation of real molecular behavior or a full accessibility audit.

## Next

1. Expand beyond the shared two-site template and the three current targets. Consider per-particle site templates, per-site strengths, additional geometries, and broader starting-arrangement sampling.
2. Expand the learning illustrations and lessons with more topic-specific visuals and practical exercises. Consider optional persistence and comparison for the separate hierarchy model.
3. Deepen object-specific manufacturing routes with reviewed, traceable dependencies and process-specific constraints. They currently illustrate possible capabilities, not complete manufacturing plans.
4. Continue keyboard and screen-reader review, test more window sizes, and measure browser frame performance and memory on representative hardware. Expand automated coverage for file import and export.
5. Select a published reference system and implement and validate a separate backend only after resolving the input, units, resource, provenance and checkpoint questions in `docs/SIMULATION_BACKENDS.md`.

## Open limitations

There are three targets and two sites per particle; all particles share the same site-type template. This is not a general molecular design tool. Directional forces, site alignment, bond rates and the geometric tolerance are illustrative and not scientifically calibrated. Multi-seed studies are small samples of this model and are only retained if exported. The hierarchy model is a discrete teaching model, not molecular dynamics. Several learning topics still use a generic conceptual illustration, and the ladder routes are not complete engineering plans. Trails are visual traces rather than exported trajectories. There is no interactive 3D model, scientifically validated backend or Atlas integration. User studies, full accessibility testing and broad hardware testing have not been performed.
