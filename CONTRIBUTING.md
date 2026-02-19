# Contributing to ideabyhuman

Team of 3, open collaboration — everyone can push to main. This doc clarifies who owns what so we're not stepping on each other's files.

## Ownership Areas

### Frontend (Friend's name TBD)

Primary workspace:

- `src/app/` — page layouts, routes, UI
- `src/components/` — shared React components
- `src/app/globals.css` — styles
- `public/` — static assets (images, icons, fonts)

### Backend (Mike)

Primary workspace:

- `src/app/api/` — Next.js Route Handlers (REST endpoints)
- `src/lib/` — Supabase clients, database types, server-side utilities
- `supabase/` — migrations, RLS policies, seed data
- `.env.local.example` — environment variable definitions

### Shared (coordinate before changing)

- `src/lib/database.types.ts` — auto-generated from Supabase, affects both sides
- `src/lib/constants.ts` — shared enums, categories, AI tools list
- `src/middleware.ts` — auth session handling
- `package.json` — dependencies
- `docs/` — documentation (anyone can update)

## Workflow

- **Push to main** — no PRs required, but give a heads-up in the group chat if you're touching a shared file.
- **Commit messages** — keep them short and descriptive. No strict format required.
- **Conflicts** — if you're both editing the same area, talk first. `git pull` before you push.
- **Dependencies** — mention in the chat before adding new packages so everyone runs `npm install`.

## Getting Started

```bash
git clone git@github.com:IdeaByHuman/ideabyhuman.git
cd ideabyhuman
npm install
cp .env.local.example .env.local
# Fill in Supabase credentials (ask Mike)
npm run dev
```

## Key Docs

- [Architecture](docs/ARCHITECTURE.md) — tech stack and system design
- [Database Schema](docs/DATABASE_SCHEMA.md) — tables and relationships
- [Roadmap](docs/ROADMAP.md) — what we're building and when
- [Brand Guidelines](docs/BRAND_GUIDELINES.md) — voice, tone, design
