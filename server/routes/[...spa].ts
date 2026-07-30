import { eventHandler } from 'h3';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export default eventHandler(async () => {
  // Serve the SPA HTML for any unmatched route
  const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
});
