import { defineNitroConfig } from 'nitro/config';
import { fileURLToPath } from 'node:url';

export default defineNitroConfig({
  preset: 'vercel',
  // Serve dist/ at the web root so dist/index.html and dist/assets/* are available at '/'
  publicAssets: [
    { dir: 'dist', baseURL: '/', maxAge: 60 * 60 }
  ]
});
