import { defineNitroConfig } from 'nitro/config';
import { fileURLToPath } from 'node:url';

export default defineNitroConfig({
  preset: 'vercel',
  // Serve prebuilt client assets from ./public (emitted by vite build)
  publicAssets: [
    { dir: 'public', maxAge: 60 * 60 * 24 * 365 }
  ]
});
