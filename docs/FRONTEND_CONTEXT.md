# IdeaByHuman — Frontend Context Doc

Last updated: February 19, 2026

This document captures all design decisions, build status, open questions, and partner dependencies for the IdeaByHuman frontend prototype. Keep this updated as the project evolves.

---

## What Is This

IdeaByHuman is a curated showcase platform for apps built by non-developers using AI. The idea was yours, AI helped build it. Submissions are reviewed by an internal curator team before going live. The platform is built on Next.js 14 + Supabase + Cloudflare R2 + Vercel.

---

## Pages Built (Prototype)

All current files are static HTML/CSS/JS prototypes. They will be rebuilt as Next.js components once backend is ready.

### `ideabyhuman.html` — Homepage
- Compact hero: full-width Bebas Neue headline + stats inline on right
- Featured spotlight section (full-width, image left / content right)
- Filter bar: search input, category pills, sort dropdown
- Gallery grid: 3 columns desktop, 2 tablet, 1 mobile
- Cards link directly to `app-detail.html` — no overlay
- Mobile: hamburger menu, horizontal scroll pills, single column grid

### `app-detail.html` — App Detail Page
- Breadcrumb navigation back to homepage
- Full-width hero screenshot (16:7 aspect ratio)
- App title, category badge, creator link, star rating
- Two-column layout: main content left, sticky sidebar right
- Main content: About, Story (Problem / Idea / AI's Role / Surprises), Reviews with rating summary bar + write review form
- Sidebar: Visit App CTA, AI Tools Used, Tech Stack tags, Build Details, Links
- "More by Creator" grid at bottom (3 cards)
- Save button toggles state, rating bars animate on load

### Pending Pages
- `/submit` — 8-step submission form (not yet built)
- `/profile` — User profile / creator page (not yet built)
- `/login` — Auth flow (not yet built, depends on Supabase Auth)

---

## Design System

### Colors (CSS Variables)
```css
--bg: #080c10
--surface: #0e1420
--surface2: #141c2b
--border: rgba(255,255,255,0.07)
--border-hover: rgba(99,179,237,0.35)
--text: #e8edf5
--text-muted: #6b7a96
--text-dim: #3d4a60
--accent: #63b3ed        /* cyan — primary */
--accent2: #a78bfa       /* violet — secondary */
--accent-glow: rgba(99,179,237,0.15)
--gold: #f6c90e          /* stars, featured badges */
--radius: 14px
```

### Typography
- **Headlines / display**: Bebas Neue (400 weight only — single weight font). Use `letter-spacing: 2px` at large sizes, `1px` at small sizes.
- **Body / UI**: DM Sans (300, 400, 500, 600)
- Google Fonts import: `family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600`

### Category Badge Colors
```css
.cat-finance     → gold    (#f6c90e, rgba background)
.cat-productivity → cyan   (#63b3ed, rgba background)
.cat-games       → violet  (#a78bfa, rgba background)
.cat-tools       → green   (#34d399, rgba background)
```
Note: These will expand to 7 categories once homepage pills are updated (see Open Decisions).

### Breakpoints
- Desktop: > 1024px
- Tablet: 768px – 1024px
- Mobile: < 768px

### Key Patterns
- Cards: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--radius)`, hover lifts + cyan border glow
- Buttons primary: `background: var(--accent)`, `color: #080c10`, `font-weight: 600`
- Buttons ghost: transparent, `border: 1px solid var(--border)`, hover lightens border
- Background: dark base + subtle radial gradients + grid line texture (both via `body::before` and `body::after`)
- Animations: `fadeUp` keyframe (opacity 0→1, translateY 16px→0) used on page load

---

## Database Notes (from partner's schema)

Tech stack: PostgreSQL via Supabase, Row Level Security enabled.

### Key tables relevant to frontend
- `public.users` — creator profiles (name, bio, avatar_url, website, twitter, linkedin, github, projects_count)
- `public.projects` — main project records (title, slug, short_description, category_id, creator_id, story fields, ai_tools_used[], tech_stack implied via tags, hero_image_url, screenshot_urls[], status, **featured** boolean)
- `public.categories` — the 7 categories (pre-populated)
- `public.reviews` — user reviews with star ratings
- `public.tags` — tech/AI tool tags (many-to-many with projects via project_tags)

### Featured app flag
The `featured` boolean on the `projects` table (DEFAULT FALSE) drives the homepage featured spotlight and hero. Only one project should have `featured = true` at a time. Admin flips this to rotate the featured app weekly/daily.

### Submission endpoint
- POST `/api/submit`
- Requires authenticated user with `creator` or `admin` role
- Images upload to Cloudflare R2 via presigned URLs before form submission
- See `SUBMISSION_FORM_SPEC.md` for full request body shape

### Project status flow
`pending` → `approved` → live on site  
`pending` → `rejected`  
`approved` → `archived`

---

## Submission Form (Not Yet Built)

8-step multi-step form at `/submit`. Authenticated users only.

| Step | Content |
|------|---------|
| 1 | Basic Info: title, short description, category, live URL |
| 2 | Links & Media: GitHub, demo video, hero image upload, screenshots |
| 3 | Story: The Problem |
| 4 | Story: Your Idea |
| 5 | Story: How You Used AI |
| 6 | Story: Surprises & Learnings |
| 7 | Technical Details: AI tools (multi-select), tech stack, build hours, key prompts |
| 8 | Review & Submit: summary preview, agreements, submit button |

Full field specs, validation rules, and example request body are in `SUBMISSION_FORM_SPEC.md`.

---

## Open Decisions

### 1. Category update
The homepage currently shows 4 pills: Finance, Productivity, Games, Tools.  
The database has 7 categories: Web Applications, Mobile Apps, Content Tools, Automation, Creative Projects, Data & Analytics, E-commerce.  
**Action needed:** Update homepage category pills and all `data-cat` attributes on cards to match the 7 DB categories. Coordinate with partner on slugs.

### 2. Ratings source
The detail page shows user star ratings. The database has a `reviews` table for public reviews. The curator review (internal scoring 1–10) is separate and not displayed publicly. Current prototype uses mock data — needs to be wired to the reviews table.

### 3. Auth / profile pages
Not yet designed or built. Supabase Auth handles the auth flow. Need to decide on: sign up flow, profile creation step (creator role assignment), and where the user lands after login (dashboard? homepage?).

### 4. Tech stack display
The detail page sidebar shows tech stack as tags. In the DB, technologies are stored in the `tags` table (many-to-many via `project_tags`). The submission form currently takes a comma-separated text input — confirm with partner whether tags are pre-populated or free-entry.

---

## Partner Dependencies (Nadir)

Before submission form can be fully wired up:
- [ ] API endpoint URL for POST `/api/submit` (staging/dev)
- [ ] Confirm exact field names match `SUBMISSION_FORM_SPEC.md`
- [ ] Auth token / API key setup for authenticated requests
- [ ] Confirm presigned URL flow for Cloudflare R2 image uploads
- [ ] Confirm category slugs (for `data-cat` attributes on frontend)
- [ ] Add `is_featured` / `featured` flag confirmed in schema (already in schema per DB docs — just confirm it's live)
- [ ] Share GitHub repo access for checking in prototype files

---

## Next Steps

1. Update homepage categories from 4 → 7 (waiting on decision)
2. Build `/submit` — 8-step submission form (UI only first, wire to backend once endpoint is ready)
3. Build `/profile` — creator profile page
4. Build `/login` — auth flow (depends on Supabase Auth setup)
5. Migrate prototype HTML files to Next.js components
6. Wire up real data from Supabase (replace mock data)
