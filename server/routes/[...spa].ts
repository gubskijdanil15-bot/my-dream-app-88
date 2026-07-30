import { eventHandler } from 'h3';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export default eventHandler(async (event) => {
  // Prefer the built index.html under dist/, which references hashed JS
  try {
    const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  } catch (e) {
    // As a fallback (e.g., local dev without build), proxy to Vite dev server if available
    const dev = process.env.NODE_ENV !== 'production';
    if (dev) {
      return await event.node.res.writeHead(302, { Location: 'http://localhost:5173' }).end();
    }
    throw e;
  }
});
