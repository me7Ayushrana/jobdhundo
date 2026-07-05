# Contributing to Job Dhundo!

Welcome! Thank you for helping build and scale this developer workspace platform.

## Getting Started

1. Clone the repository.
2. Configure your local environment file (`.env.local`) with your Firebase configurations.
3. Install dependencies:
   ```bash
   npm install
   ```

## Folder Structure

The project follows a standard Next.js App Router structure:
- `src/app/`: Core route pages and layout entrypoints.
- `src/components/`: Modular React view components (e.g., layouts, jobs widgets, social panels).
- `src/lib/`: Custom modules, types, database connections, and aggregator sync managers.

## API Routes Schema

The server routes are defined under `src/app/api/`:
- `GET /api/jobs`: Fetches aggregated listings (remote, types, page, keywords parameters).
- `GET /api/jobs/[id]`: Pulls details dynamically from Greenhouse, Lever, Ashby, RemoteOK, or Jobicy on cache miss.
- `POST /api/skills`: Runs repository-to-skill DNA parsing scripts.

## Job Synchronization & Caching

To optimize page speeds:
1. `SyncManager` coordinates live parallel API calls.
2. Results are deduplicated and cached using Firestore or server memory caches.
3. If users query specific details, the API route checks the cache before launching a direct endpoint fetch.

## State Providers & Context Hooks

- `SocialProvider` (`src/components/providers/social-context.tsx`): Manages authentication and sync state with Firestore, whitelisting, and in-memory fallback.
- `SmoothScrollProvider` (`src/app/layout.tsx`): Sets up Lenis smooth scroll configurations.

## Production Build Verification

Always test production compiles before deploying:
```bash
npm run build
```
This runs TypeScript checking, lint rules, static optimization, and collects page structures.

## Environmental Variables Configuration

Add the following keys to your local configuration:
- `COHERE_API_KEY`: Connects the workspace AI helper chat.
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Client authorization for databases and authentication.

## Responsive Viewport Audits

When reviewing styling templates, perform layout audits using Chrome DevTools for both desktop and mobile viewports.

