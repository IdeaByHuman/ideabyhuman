# LOCATIONS — Where Things Live

*Read this first when returning to IdeaByHuman after time away. One-page index of where to find everything. Updated: 2026-05-26.*

⚠️ **This repo is PUBLIC** (`github.com/IdeaByHuman/ideabyhuman`). Sensitive content does NOT live here — see the Drive section below for canonical paths.

---

## In this repo (public)

| Looking for | Path |
|---|---|
| Project overview for visitors | `README.md` *(currently describes the paused showcase brand — rewrite pending)* |
| DO (Claude Code) context | `CLAUDE.md` *(currently a stub — fill-in pending; remember the repo is public when writing it)* |
| Contributing guide | `CONTRIBUTING.md` |
| GitHub setup notes | `GITHUB_SETUP.md` |
| Frontend source (Next.js App Router) | `src/` |
| Static assets | `public/` |
| Supabase migrations / config | `supabase/` |
| Showcase-era documentation (paused brand) | `archive/showcase-era-docs/` |

## In Google Drive (private — canonical home for sensitive content)

All paths under `[Your Drive] / IdeaByHuman / Internal/`:

| Looking for | Drive folder |
|---|---|
| Cross-project BO primer (Mike's identity, operating model) | `BO Primers/BO_Primer_2026-05-24.md` |
| Project-specific BO primers (MASSÉ, SW, TFO, IBH) | `BO Primers/` |
| Business plan, pitch deck, vision, one-pager | `Business & Strategy/` |
| Invention disclosure, technical architecture | `Business & Strategy/` (or `IP & Patents/` if you split it later) |
| IBH OS plan + audit briefs | `IBH OS/` |
| Solution architecture diagrams | `Architecture Diagrams/` |
| Old primer drafts + feedback (historical) | `Archive/` |

## Cross-project (local, shared across all IBH projects)

| Looking for | Path |
|---|---|
| Cross-project lessons (shared infra) | `C:\Users\mberr\.claude\projects\shared\LESSONS_CROSS_PROJECT.md` |
| Adversarial Advisor Skill | `~\.claude\skills\adversarial-advisor\SKILL.md` |
| Parked ideas list | `C:\Users\mberr\.claude\projects\shared\IDEAS_PARKED.md` |
| Disagreement reference card | `C:\Users\mberr\.claude\projects\shared\DISAGREEMENT_REFERENCE.md` |
| CLAUDE template for new projects | `C:\Users\mberr\.claude\projects\shared\CLAUDE_TEMPLATE.md` |

## Sibling project repos (each with its own CLAUDE.md, LOCATIONS.md, BO primer)

| Project | Path |
|---|---|
| MASSÉ (job-discovery) | `C:\Users\mberr\MUSE\mas-sprint` |
| Slab Worthy (comic grading) | `C:\Users\mberr\CC\SW` |
| TheFormOf (agentic app dev platform) | `C:\Users\mberr\TheFormOf` |

---

## Deploy / Ops

| Looking for | Path |
|---|---|
| Live site | ideabyhuman.com (verified live 2026-05-19) |
| Deploy method | Next.js App Router, served from this repo (deploy method TBD per CLAUDE.md stub) |
| Email — receive | `mike@ideabyhuman.com` → Cloudflare Email Routing → Yahoo (works) |
| Email — send | Not yet wired (Cloudflare forwarding is receive-only); two paths queued |
| Contact form | `contact@ideabyhuman.com` mailto on landing page |

---

## Things this index does NOT solve

- **CLAUDE.md is a stub.** Needs filling in, but constrained by the fact that this repo is public — only put information here that's safe to share.
- **README still describes the paused showcase brand.** Rewrite pending; should describe the current AI-native venture studio identity.
- **Sibling routes (`/projects`, `/submit`, `/admin`) still render old showcase chrome.** Cleanup deferred.
- **`mike@ideabyhuman.com` sending not yet wired.** Receive works.
- **Currency.** This index assumes the cleanup state as of 2026-05-26. Update when meaningful new content lands.

---

## Privacy discipline

Before running `git add`, always check `git status` and ask:
- Does this file belong in a **public** repo?
- Is this a `.claude/` worktree file? (gitignored, but double-check)
- Is this a `*.docx` / `*.pptx` / `BO_Primer*` / `IBH_OS_*` / `docs/business/*` file? (all explicitly gitignored)

If yes to "doesn't belong public" — move it to Drive, never `git add` it.
