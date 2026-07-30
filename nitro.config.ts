import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
  // Target Vercel Build Output API v3
  preset: 'vercel',
  // Nitro entry for SSR handler
  entry: 'src/server.ts',
  // Serve Vite client assets generated into ./dist
  publicAssets: [
    { dir: 'dist', maxAge: 60 * 60 * 24 * 365 }
  ]
});
