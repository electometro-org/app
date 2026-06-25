// Injects election-specific meta tags into index.html at build time

import fs from 'fs';
import path from 'path';

const defaultMeta = {
  title: "Electómetro",
  description: "Aplicación de consejo de voto.",
  favicon: "/favicon.svg",
  canonicalUrl: "https://electometro.org/",
  lang: "es",
};

// Extracts meta object from election config file via regex (sync context)
function loadElectionConfig(electionId) {
  if (!electionId) return null;

  const configPath = path.resolve(__dirname, `src/elections/${electionId}.js`);

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const metaMatch = content.match(/meta:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
    if (metaMatch) {
      const metaStr = metaMatch[1];
      const meta = {};

      const titleMatch = metaStr.match(/title:\s*["']([^"']+)["']/);
      const descMatch = metaStr.match(/description:\s*["']([^"']+)["']/);
      const faviconMatch = metaStr.match(/favicon:\s*["']([^"']+)["']/);
      const canonicalMatch = metaStr.match(/canonicalUrl:\s*["']([^"']+)["']/);
      const langMatch = metaStr.match(/lang:\s*["']([^"']+)["']/);

      if (titleMatch) meta.title = titleMatch[1];
      if (descMatch) meta.description = descMatch[1];
      if (faviconMatch) meta.favicon = faviconMatch[1];
      if (canonicalMatch) meta.canonicalUrl = canonicalMatch[1];
      if (langMatch) meta.lang = langMatch[1];

      return meta;
    }
  } catch (err) {
    console.warn(`Could not load election config for ${electionId}:`, err.message);
  }

  return null;
}

export default function electionHtmlPlugin() {
  let resolvedBase = '/';

  return {
    name: 'vite-plugin-election-html',

    configResolved(config) {
      resolvedBase = config.base || '/';
    },

    transformIndexHtml(html) {
      const electionId = process.env.VITE_ELECTION_ID || process.env.ELECTION_ID;
      const electionMeta = loadElectionConfig(electionId);
      const meta = { ...defaultMeta, ...electionMeta };

      // Prepend base URL to favicon path
      const faviconRelative = meta.favicon.startsWith('/') ? meta.favicon.slice(1) : meta.favicon;
      const faviconPath = `${resolvedBase}${faviconRelative}`;

      console.log(`[election-html] Applying meta for: ${electionId || 'default'}`);
      console.log(`[election-html] Title: ${meta.title}`);
      console.log(`[election-html] Base: ${resolvedBase}`);
      console.log(`[election-html] Favicon: ${faviconPath}`);

      return html
        .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
        .replace(
          /<meta name="description" content="[^"]*"\s*\/?>/,
          `<meta name="description" content="${meta.description}" />`
        )
        .replace(
          /<link rel="canonical" href="[^"]*"\s*\/?>/,
          `<link rel="canonical" href="${meta.canonicalUrl}" />`
        )
        .replace(
          /<link rel="icon"[^>]*>/,
          `<link rel="icon" type="image/svg+xml" href="${faviconPath}" />`
        )
        .replace(/<html lang="[^"]*">/, `<html lang="${meta.lang}">`);
    },
  };
}