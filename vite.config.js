import { defineConfig } from 'vite';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

// Trägt eine Build-Kennung und die Liste aller Dateien in den Service Worker ein: beim ersten Besuch wird alles
// vorab gespeichert, danach läuft das Spiel komplett offline (Flugmodus).
function swBuildStamp() {
  return {
    name: 'sw-build-stamp',
    closeBundle() {
      const file = resolve('dist/sw.js');
      if (!existsSync(file)) return;
      const stamp = Date.now().toString(36);
      const files = [];
      const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else files.push(relative(resolve('dist'), p).split('\\').join('/')); } };
      walk(resolve('dist'));
      const list = ['./', ...files.filter((f) => f !== 'sw.js').map((f) => `./${f}`)];
      writeFileSync(file, readFileSync(file, 'utf8').replace('__BUILD__', stamp).replace('[/*__ASSETS__*/]', JSON.stringify(list)));
    },
  };
}

// Relativer Base-Pfad, damit der Build lokal und unter GitHub Pages (https://<user>.github.io/<repo>/) läuft.
export default defineConfig({
  base: './',
  plugins: [swBuildStamp()],
  server: { port: 5173 },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
