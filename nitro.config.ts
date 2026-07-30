import { defineNitroConfig } from 'nitro/config';
import { fileURLToPath } from 'node:url';

export default defineNitroConfig({
  preset: 'vercel',
  // Expose the built client as public assets
  publicAssets: [
    { dir: 'dist', maxAge: 60 * 60 }
  ]
});
