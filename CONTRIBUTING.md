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
