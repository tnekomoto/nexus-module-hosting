#!/usr/bin/env node
// Build a manifest.json listing every published module + version + hash.
// Run from repo root: node scripts/build-manifest.mjs
//
// Output: manifest.json at repo root, consumable by the Nexus Module catalog
// and by the catalog.html landing page.

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const BASE_URL = 'https://tnekomoto.github.io/nexus-module-hosting';

function isVersionDir(name) {
  return /^\d+\.\d+\.\d+/.test(name);
}

function listSubdirs(parent) {
  if (!existsSync(parent)) return [];
  return readdirSync(parent)
    .filter(name => {
      try { return statSync(join(parent, name)).isDirectory(); } catch { return false; }
    });
}

function main() {
  const moduleDirs = listSubdirs(ROOT).filter(d => {
    // Skip non-module dirs
    return !['.git', '.github', 'node_modules', 'scripts'].includes(d);
  });

  const modules = [];

  for (const moduleCode of moduleDirs.sort()) {
    const versions = listSubdirs(join(ROOT, moduleCode))
      .filter(isVersionDir)
      .sort((a, b) => {
        const [a1, a2, a3] = a.split('.').map(Number);
        const [b1, b2, b3] = b.split('.').map(Number);
        if (a1 !== b1) return b1 - a1;
        if (a2 !== b2) return b2 - a2;
        return b3 - a3;
      });

    for (const version of versions) {
      const bundlePath = join(ROOT, moduleCode, version, 'bundle.mjs');
      const shasumPath = join(ROOT, moduleCode, version, 'SHA256SUM');
      if (!existsSync(bundlePath) || !existsSync(shasumPath)) continue;

      const sizeBytes = statSync(bundlePath).size;
      const contentHash = readFileSync(shasumPath, 'utf8').trim();
      const mtime = statSync(bundlePath).mtime.toISOString();

      modules.push({
        module_code: moduleCode.toUpperCase(),
        url_path: moduleCode,
        version,
        artifact_url: `${BASE_URL}/${moduleCode}/${version}/bundle.mjs`,
        shasum_url:   `${BASE_URL}/${moduleCode}/${version}/SHA256SUM`,
        content_hash: contentHash,
        size_bytes:   sizeBytes,
        published_at: mtime,
        is_latest:    version === versions[0],
      });
    }
  }

  const manifest = {
    schema_version: '1.0',
    base_url: BASE_URL,
    generated_at: new Date().toISOString(),
    module_count: modules.length,
    modules,
  };

  const outPath = join(ROOT, 'manifest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✓ Wrote ${outPath}`);
  console.log(`  ${modules.length} module bundle(s) cataloged`);
}

main();
