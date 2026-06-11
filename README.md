# nexus-module-hosting

> Public host for compiled Performonomics Nexus module bundles. Served via GitHub Pages.

Only compiled, content-hashed `.mjs` bundles live here. **Module source code stays private** in `*-Module` repos.

## URL convention

```
https://tnekomoto.github.io/nexus-module-hosting/{MODULE_CODE}/{VERSION}/bundle.mjs
https://tnekomoto.github.io/nexus-module-hosting/{MODULE_CODE}/{VERSION}/SHA256SUM
```

Examples:

```
https://tnekomoto.github.io/nexus-module-hosting/pursuit/2.0.0/bundle.mjs
https://tnekomoto.github.io/nexus-module-hosting/pursuit/2.0.0/SHA256SUM
https://tnekomoto.github.io/nexus-module-hosting/memora/1.2.0/bundle.mjs
```

- `{MODULE_CODE}` — lowercase, matches the module's `MODULE_MANIFEST.module_code` lowercased (e.g., `pursuit`, `memora`, `orienta`, `percepta_det`, `percepta_word`, `percepta_image`)
- `{VERSION}` — semver, no leading `v`, matches `MODULE_MANIFEST.module_version`
- `bundle.mjs` — pre-compiled ESM bundle, browser-evaluatable
- `SHA256SUM` — single line, `sha256:<hex>` of the bundle bytes

## Versioning rules

- **Append-only.** Once a `/{MODULE_CODE}/{VERSION}/` directory exists with a published bundle, never edit or delete. Bump the version and add a new directory.
- **Semver.** PATCH for non-behavior changes; MINOR for additive scoring or new metrics; MAJOR for output-schema changes or norm-affecting changes.
- **Norms.** Bumping `norm_version` is independent of `module_version`. A scoring math fix that affects norms requires both bumps.

## How modules land here

For MVP (manual):

1. In the module's source repo, build the ESM bundle: `npm run build` produces `dist/bundle.mjs`.
2. Compute hash: `shasum -a 256 dist/bundle.mjs | awk '{print "sha256:"$1}' > dist/SHA256SUM`.
3. Copy both files to this repo: `nexus-module-hosting/{module_code}/{version}/`.
4. Commit + push.
5. Within ~1 minute, GitHub Pages serves them.
6. In Base44, register the new `Module` row with `artifact_url` and `content_hash`.

For Month 2+ (CI-driven via GitHub Actions in the source repo):

- A push of a version tag triggers CI.
- CI builds, hashes, and PRs into `nexus-module-hosting`.
- A human reviewer (methodology owner) approves the PR.
- Merge → Pages serves → Base44 catalog updated.

For Month 3+ (KMS signing):

- CI also produces a KMS signature alongside the bundle.
- Runner verifies the signature before evaluating the bundle.
- Content_hash check becomes the second line of defense, not the first.

## Why public?

- GitHub Pages free tier requires public.
- Module bundles are intentionally tamper-evident (content_hash + future signing). No secrets in the bundles.
- Source code stays private in `*-Module` repos.
- Anyone with the URL can fetch a bundle, but only Nexus instances with valid licenses can use them (license gates the runtime, not the asset).

## What does NOT live here

- Module source code → `*-Module` repos (private)
- Module manifest / metadata → Base44 `Module` entity
- Norms data → Base44 `Norm` entity
- License-tunable parameters → Base44 `License.tunables`
- Asset files (instructions video, examples, captions) — TBD: for MVP, bundle them inline; for Month 2+, host them here as separate files

## Index page

The repo's `index.html` is served at `https://tnekomoto.github.io/nexus-module-hosting/` for human discoverability of what's hosted.

## Related repos

- [tnekomoto/nexus-app-state](https://github.com/tnekomoto/nexus-app-state) — plans + build prompts (private)
- [tnekomoto/nexus](https://github.com/tnekomoto/nexus) — Base44 app
- [tnekomoto/nexus-module-api](https://github.com/tnekomoto/nexus-module-api) — module SDK contract
