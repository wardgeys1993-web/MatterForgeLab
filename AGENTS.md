# MatterForge Lab development

Use Node.js 22 or newer and Windows for the installer. Keep source and bundled assets local. Do not add telemetry, credentials, private paths, personal notes, experiment exports or browser profiles to the repository.

## Verification

- `npm ci`
- `npm test`, `npm run test:desktop`, `npm run lint`, `npm run build`
- `npm run dist:win` creates `release/MatterForge-Lab-Setup-VERSION.exe`, its blockmap and `release/latest.yml`.
- `npm run test:desktop:smoke` runs the packaged executable with an isolated temporary profile.
- `npm run privacy:check` checks tracked source against the public allowlist. Inspect binaries and author metadata too.

## Publishing

Use the ship skill when available. Bump package.json and package-lock.json together; the interface reads package metadata. Read `docs/RELEASING.md`. Never publish an untested build or include the signing key. Check the current remote before pushing. Use the GitHub noreply commit identity. Review the exact staged file list and the archive. Publish only the installer, blockmap, latest.yml, release-manifest.json and SHA256SUMS.txt. Verify the remote release assets and the installed app afterward.

The desktop app accepts stable signed GitHub releases from its configured repository. It neither downloads nor installs without a user action. Preserve the app ID, user-data folder and custom protocol origin across upgrades. Never reset existing experiments during packaging or updater tests.
