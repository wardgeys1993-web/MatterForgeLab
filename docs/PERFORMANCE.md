# Bounded local performance measurements

Measured on 2026-11-02 on this Windows desktop with an AMD Ryzen 7 2700X and Node.js 22.20.0, before the configurable site angle and multi-seed worker were added. The script in `scripts/benchmark.mjs` warmed the engine, then ran three samples of 4,000 fixed steps for each particle count and site layout. The table shows the median of those short runs, not current worker throughput.

| Particles | Site layout | Median for 4,000 steps | Approximate steps per second |
| --- | --- | ---: | ---: |
| 6 | Any direction | 43.34 ms | 92,287 |
| 6 | Corner | 54.93 ms | 72,819 |
| 12 | Any direction | 44.50 ms | 89,891 |
| 12 | Corner | 54.85 ms | 72,928 |
| 30 | Any direction | 249.04 ms | 16,062 |
| 30 | Corner | 275.21 ms | 14,535 |

These are engine-only Node measurements. They do not measure browser rendering, frame smoothness, startup, GPU use, battery consumption or other hardware. The samples are short and affected by runtime warmup and background activity. The app currently advances 40 fixed steps per simulated time unit, subject to its playback loop and browser scheduling. No general performance guarantee is implied.

## Headless browser sample

One five-second sample used Chrome 156.0.8078.74 in a headless, isolated browser context at 1280 by 720 pixels, with 30 particles, corner sites and normal playback speed. It recorded 300 animation-frame callbacks, a median interval of 16.7 ms, a 95th percentile of 16.8 ms and no intervals above 50 ms. The reported JavaScript heap was about 29.8 MB at the start and 29.1 MB at the end. Heap readings can fluctuate with garbage collection and do not include the whole browser process.

This short headless sample does not establish physical display smoothness, GPU performance, long-run memory stability or behavior on other hardware. It measures callback intervals rather than successful presentation of frames. The browser was run with precise JavaScript heap reporting enabled.

Run the measurement from this folder with Node 22 or later:

```powershell
npm run benchmark
```

The script uses Node’s TypeScript stripping support. Check the installed Node version before comparing results, and compare like-for-like environments.

For the browser sample, start the isolated QA entry in `.Codex/launch.json` and run `npm run benchmark:browser`. It requires installed Chrome and uses a fresh browser context.
