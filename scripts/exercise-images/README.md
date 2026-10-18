# Exercise images (dev tool)

Bundles start/end position images for the built-in exercises from
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense).

- `mapping.json`: hand-reviewed mapping from our exercise key (slug of the English name) to a
  dataset id, with a confidence level and notes. `datasetId: null` means no suitable image (the
  app shows the muscle-group icon). A wrong image is worse than no image. `startIndex: 1`
  swaps the two frames when the dataset's first frame is only a setup (e.g. plank).
- `build.mjs`: downloads the dataset and the mapped images, resizes them to max 600 px wide,
  converts to WebP under 60 KB, writes `assets/exercises/<key>/{0,1}.webp` and generates
  `src/constants/exerciseImages.ts` (static `require()` calls for Metro).

```bash
node scripts/exercise-images/build.mjs --report   # just the mapping report
node scripts/exercise-images/build.mjs            # download, convert and generate
```

Requires network access and the `sharp` dev dependency. This script is never bundled with or
run by the app.
