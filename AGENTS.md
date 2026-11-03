# MatterForge Lab development

Use Node.js 22 or newer and Windows for the installer. Keep source and bundled assets local. Do not add telemetry, credentials, private paths, personal notes, experiment exports or browser profiles to the repository.

## Verification

- `npm ci`
- `npm test`, `npm run test:desktop`, `npm run lint`, `npm run build`
- `npm run dist:win` creates `release/MatterForge-Lab-Setup-VERSION.exe`, its blockmap and `release/latest.yml`.
- `npm run test:desktop:smoke` runs the packaged executable with an isolated temporary profile.
- `npm run privacy:check` checks tracked source against the public allowlist. Inspect binaries and author metadata too.

## Publishing

Read and use the shared `ship` skill before publishing from Codex. If that skill is unavailable in another environment, follow `docs/RELEASING.md` explicitly and disclose the missing skill rather than claiming to have used it. The only release repository is `wardgeys1993-web/MatterForgeLab`; verify the effective CLI or browser account, exact remote and packaged updater feed before any upload. Environment credentials can override the saved CLI login. Never publish to a different personal account, create a duplicate repository, silently change global credentials or migrate the remote.

Bump package.json and package-lock.json together; the interface reads package metadata. Read `docs/RELEASING.md`. Never publish an untested build or include the signing key. Use the verified GitHub noreply commit identity. Review the outgoing files and history, run the privacy check and Gitleaks or an equivalent scanner, and inspect the packaged archive. Publish only the installer, blockmap, latest.yml, release-manifest.json and SHA256SUMS.txt. Verify the remote release assets and the installed app afterward. Update ROADMAP.md with evidence and any unverified behavior.

The sibling `../MatterForgeLab` folder can contain newer feature work with independent local version numbers. Deliberately merge reviewed changes from that folder; preserve the desktop release implementation and concurrent owners' edits. Do not downgrade the public version or overwrite the release workspace with a wholesale source copy. Use the existing external release-signing key. A publishing reminder does not authorize a new release.

The desktop app accepts stable signed GitHub releases from its configured repository. It neither downloads nor installs without a user action. Preserve the app ID, user-data folder and custom protocol origin across upgrades. Never reset existing experiments during packaging or updater tests.
