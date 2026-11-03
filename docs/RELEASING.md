# Windows releases

The public repository contains source code, tests, product documentation and bundled artwork. Local reports, screenshots, credentials, signing keys, browser profiles, generated experiment data and machine-specific launch settings are excluded. Installer contents use an explicit allowlist and exclude source maps.

## Build and verify

Before uploading, confirm `gh api user --jq .login` returns `wardgeys1993-web` and that the Git remote is `https://github.com/wardgeys1993-web/MatterForgeLab.git`. An environment token can override a saved GitHub CLI login. Do not upload with a different account or change global credentials to work around a mismatch. Use the account's GitHub noreply address for commits and annotated tags.

1. Update the version in package.json and run `npm install --package-lock-only`. Update the release notes and roadmap.
2. Run `npm ci`, `npm test`, `npm run test:desktop`, `npm run lint`, `npm run privacy:check` and `npm run dist:win`.
3. Run `npm run test:desktop:smoke`. Review the actual app and inspect the installer contents and staged files.
4. Set `MATTERFORGE_SIGNING_KEY_FILE` to the release signing key stored outside the repository. Run `npm run release:sign`. The script checks that the key matches the embedded public key. Never print, upload or commit the private key.
5. Commit with a GitHub noreply address, tag the tested commit, and push. Use GitHub CLI to create a release containing exactly the installer, its blockmap, latest.yml, release-manifest.json and SHA256SUMS.txt. Provide release notes from a reviewed UTF-8 file.
6. Use `gh release view` to verify the uploaded assets. Download the public installer and verify it against the signed manifest. Launch the installed app and use App updates to verify the published channel.

Keep an offline backup of the signing key. Losing it prevents existing installations from trusting future releases. Key rotation requires a separately planned migration; changing only the public key on GitHub will not update installed clients.

## Update behavior

The installed app queries the public stable GitHub release only when the user chooses Check for updates. No GitHub token is embedded. It verifies an Ed25519 signature over the repository, version, architecture, installer filename, byte count and SHA-512 digest before offering a download. The unsigned GitHub feed must match that signed record. The downloaded file is checked again before installation. Automatic download and installation on normal quit are disabled.

The restart action opens a native confirmation. Settings, saved experiment A and research checkpoints live in the user's app-data folder, outside the application installation. The chamber is saved every ten seconds and on normal close; research can resume from the last completed checkpoint. Pause research before an update to retain an unfinished trial. Browser saves do not automatically migrate into the desktop app; export and import JSON to transfer them.

The release signature is separate from a Microsoft Authenticode certificate. These builds are not Authenticode signed, so Windows SmartScreen may show an unfamiliar-publisher warning. The app's release-signature verification remains required.

## Continuous integration

The optional, manually triggered GitHub workflow validates the source and packages a Windows build. It does not run on push, publish releases or receive the private release-signing key. Publication is an explicit maintainer action after verification.
