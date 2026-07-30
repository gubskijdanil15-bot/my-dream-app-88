import { defineNitroConfig } from 'nitro/config';
import { fileURLToPath } from 'node:url';

export default defineNitroConfig({
  // Let TanStack Start control Nitro output (no explicit entry)
  preset: 'vercel'
});
