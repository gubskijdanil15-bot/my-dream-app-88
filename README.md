# Paperweight

A quiet workspace for capturing notes, setting goals with real progress, and planning your day.

Stack: Vite 8 + React 19 + TanStack (Start/Router/Query) + Tailwind CSS 4 + Supabase 2.

## Development

Requirements: Node 20+ and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Environment

Create a .env file with:

```
VITE_SUPABASE_URL=... // e.g. https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=... // sb_publishable_...
```

Optional server-only variables (for server functions if ever needed):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## OAuth (Google)

Google sign-in uses Supabase OAuth directly via supabase.auth.signInWithOAuth. Configure the Google provider in your Supabase project.

## Build

- Lint: npm run lint
- Build: npm run build
- Preview: npm run preview

## CI

GitHub Actions workflow .github/workflows/ci.yml runs lint and build on push/PR to main.

## License

MIT
