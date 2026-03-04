import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import electionHtmlPlugin from './vite-plugin-election-html.js';
import path from 'path';

// Rewrites /api/elections/{id}/*.json to /{id}/*.json for local dev
function electionDataMiddleware(enabled) {
  return {
    name: 'election-data-middleware',
    configureServer(server) {
      if (!enabled) return;
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/^\/api\/elections\/([^/]+)\/(.+\.json)$/);
        if (match) {
          const electionId = match[1];
          const filename = match[2];
          req.url = '/' + electionId + '/' + filename;
        }
        next();
      });
    },
  };
}

// Subdirectory for assets (set to null to disable)
const ASSETS_SUBDIR = 'electometro';

// Moves all files except index.html into a subdirectory after build
// This is needed due to wrangler not resolving assets and being unable to call "not_found_handling"
// See https://github.com/cloudflare/workers-sdk/issues/9885
// and https://github.com/cloudflare/workers-sdk/issues/11857
function nestAssetsPlugin(subdir) {
  if (!subdir) return { name: 'nest-assets-plugin-disabled' };

  return {
    name: 'nest-assets-plugin',
    apply: 'build',
    applyToEnvironment(env) {
      return env.name === 'client';
    },
    async closeBundle() {
      const fs = await import('fs');
      const clientDir = path.resolve(__dirname, 'dist/client');
      const targetDir = path.join(clientDir, subdir);
      const rootIndexPath = path.join(clientDir, 'index.html');

      if (!fs.existsSync(clientDir)) return;

      // Create target directory
      fs.mkdirSync(targetDir, { recursive: true });

      // Track index.html location if found nested
      let foundIndexHtml = null;

      // Recursively move contents, resolving symlinks
      function moveRecursive(dir, relPath = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(dir, entry.name);
          const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

          // Skip the target directory itself
          if (!relPath && entry.name === subdir) continue;

          // Skip files that must stay at root
          const keepAtRoot = ['index.html', 'wrangler.json', '.assetsignore'];
          if (!relPath && keepAtRoot.includes(entry.name)) {
            if (entry.name === 'index.html') foundIndexHtml = srcPath;
            continue;
          }

          // Skip index.html anywhere (might be nested due to symlinks)
          if (entry.name === 'index.html') {
            foundIndexHtml = srcPath;
            continue;
          }

          const destPath = path.join(targetDir, entryRelPath);

          if (entry.isSymbolicLink()) {
            // Resolve symlink and copy the actual content
            const realPath = fs.realpathSync(srcPath);
            const stat = fs.statSync(realPath);
            if (stat.isDirectory()) {
              fs.mkdirSync(destPath, { recursive: true });
              moveRecursive(realPath, entryRelPath);
            } else {
              fs.mkdirSync(path.dirname(destPath), { recursive: true });
              fs.copyFileSync(realPath, destPath);
            }
            fs.unlinkSync(srcPath);
          } else if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            moveRecursive(srcPath, entryRelPath);
            // Only remove if empty (index.html might still be inside)
            try { fs.rmdirSync(srcPath); } catch {}
          } else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.renameSync(srcPath, destPath);
          }
        }
      }

      moveRecursive(clientDir);

      // Ensure index.html is at the root
      if (foundIndexHtml && foundIndexHtml !== rootIndexPath) {
        fs.copyFileSync(foundIndexHtml, rootIndexPath);
        fs.unlinkSync(foundIndexHtml);
        // Clean up empty parent directories
        let parentDir = path.dirname(foundIndexHtml);
        while (parentDir !== clientDir && fs.existsSync(parentDir)) {
          try {
            fs.rmdirSync(parentDir);
            parentDir = path.dirname(parentDir);
          } catch { break; }
        }
        console.log(`[nest-assets] Moved index.html to root`);
      }

      console.log(`[nest-assets] Assets nested under dist/client/${subdir}/`);
    },
  };
}

// Serves public/index.html in dev
function htmlEntryPlugin() {
  return {
    name: 'html-entry-plugin',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const indexPaths = ['/', '/index.html'];
          if (ASSETS_SUBDIR) {
            indexPaths.push(`/${ASSETS_SUBDIR}/`, `/${ASSETS_SUBDIR}/index.html`);
          }
          if (indexPaths.includes(req.url)) {
            const fs = await import('fs');
            const htmlPath = path.resolve(__dirname, 'public/index.html');
            let html = fs.readFileSync(htmlPath, 'utf-8');
            html = await server.transformIndexHtml(req.url, html);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
          }
          next();
        });
      };
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const useLocalData = isDev && env.VITE_USE_LOCAL_DATA === 'true';

  return {
    plugins: [
      htmlEntryPlugin(),
      electionDataMiddleware(useLocalData),
      electionHtmlPlugin(),
      react(),
      cloudflare({configPath: 'wrangler/wrangler.toml'}),
      nestAssetsPlugin(ASSETS_SUBDIR),
    ],
    base: ASSETS_SUBDIR ? `/${ASSETS_SUBDIR}/` : '/',
    publicDir: 'public/static',
    server: {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    },
    environments: {
      client: {
        build: {
          outDir: 'dist/client/',
          // assetsDir: 'electometro/assets',
        }
      }
    },
    build: {
      // Left for future debugging. Cloudflare Vite plugin seems to be broken atm...
      // outDir: 'dist/client/electometro/',
      // assetsDir: 'electometro/assets',
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'public/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
