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

// Serves public/index.html in dev, moves it to dist/client/ after build
function htmlEntryPlugin() {
  return {
    name: 'html-entry-plugin',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
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
    async closeBundle() {
      const fs = await import('fs');
      const clientDir = path.resolve(__dirname, 'dist/client');
      const destPath = path.join(clientDir, 'index.html');

      if (fs.existsSync(destPath)) return;

      // Symlinks can cause index.html to end up nested - find and move it
      function findIndexHtml(dir) {
        if (!fs.existsSync(dir)) return null;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const found = findIndexHtml(fullPath);
            if (found) return found;
          } else if (entry.name === 'index.html') {
            return fullPath;
          }
        }
        return null;
      }

      const srcPath = findIndexHtml(clientDir);
      if (srcPath && srcPath !== destPath) {
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath);
        let parentDir = path.dirname(srcPath);
        while (parentDir !== clientDir && fs.existsSync(parentDir)) {
          const contents = fs.readdirSync(parentDir);
          if (contents.length === 0) {
            fs.rmdirSync(parentDir);
            parentDir = path.dirname(parentDir);
          } else {
            break;
          }
        }
        console.log(`[html-entry-plugin] Moved index.html from ${srcPath} to dist/client/`);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const useLocalData = isDev && env.VITE_USE_LOCAL_DATA === 'true';

  return {
    plugins: [htmlEntryPlugin(), electionDataMiddleware(useLocalData), electionHtmlPlugin(), 
        cloudflare({ configPath: 'wrangler/wrangler.toml' }), react()],
    base: '/',
    publicDir: 'public/static',
    server: {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    },
    build: {
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
