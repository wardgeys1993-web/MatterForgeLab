# MatterForge Lab 0.8.0 release receipt

Published on 2026-11-03 from source commit `feeff56c83c64b5106bc59e1de0b22c3c19261c2`.

- [Public source repository](https://github.com/wardgeys1993-web/MatterForgeLab)
- [Release and downloads](https://github.com/wardgeys1993-web/MatterForgeLab/releases/tag/v0.8.0)
- Installer: `MatterForge-Lab-Setup-0.8.0.exe`, 124,464,927 bytes.
- SHA-256: `0bcaa0add0052c40ffdf447632cf45299e7bdb5b522f10c21fbd646754e661d1`.
- Supporting assets: installer blockmap, `latest.yml`, `release-manifest.json`, `SHA256SUMS.txt`.

## Checks completed

The source passed 72 simulation/research tests and six desktop updater tests. TypeScript, production frontend build, lint and Windows packaging passed. The packaged app launched, ran the simulation and a complete research session, rendered the learning views, saved and restored experiment A, and recovered the chamber and completed research after reopening. Checked lab flows reported no renderer errors or unsolicited external requests.

The public-source allowlist and Gitleaks scans found no secrets. Commit and tag authors use the correct account's GitHub noreply address. The public Git tree contained no local workspace data or dependency/build folders. Bundled images had no EXIF, XMP or IPTC metadata. The application archive contained runtime dependencies, desktop code, frontend assets and package metadata, with no detected personal path, private key or obsolete repository address. The private signing key remains outside source and build output.

An installed 0.7.99 test build, made from the current implementation with a lower package version, checked the live public GitHub feed. It verified the signed manifest, downloaded and verified the installer, installed 0.8.0 and relaunched. The test harness accepted the native restart confirmation. The saved experiment and current chamber were byte-for-byte preserved. A follow-up live update check reported that 0.8.0 was current. The test baseline was never published.

## Remaining limits

This is a bounded Windows 10 check on one computer, not a broad hardware or full accessibility assessment. It does not verify migration from an earlier public desktop release. Builds lack Microsoft Authenticode signing; Windows may show an unfamiliar-publisher warning. Ed25519 release verification is separate and was exercised against the live release. The runtime audit had no known advisories; the development toolchain had 15 moderate advisories, mainly in transitive glob/minimatch dependencies. The scientific model remains educational and uncalibrated.
