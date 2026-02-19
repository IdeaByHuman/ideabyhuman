# GitHub Setup — IdeaByHuman

Run these commands from **PowerShell** (not from Cowork) to create the GitHub org, repo, and push the project.

## Step 1: Create the GitHub Organization

```powershell
gh org create IdeaByHuman --description "Where human vision meets AI capability"
```

If `gh org create` isn't available in your CLI version, create the org manually:
1. Go to https://github.com/organizations/plan
2. Choose the Free plan
3. Organization name: **IdeaByHuman**
4. Contact email: your email
5. This org belongs to: My personal account

## Step 2: Create the Repository

```powershell
gh repo create IdeaByHuman/ideabyhuman `
  --public `
  --description "A curated showcase platform for projects where people had the idea and used AI to build it." `
  --homepage "https://ideabyhuman.com"
```

## Step 3: Initialize Git and Push

Navigate to the ideabyhuman folder in your workspace, then:

```powershell
cd ideabyhuman

# Initialize git
git init

# Add all files (node_modules is excluded via .gitignore)
git add .

# Initial commit
git commit -m @"
Initial scaffold: Next.js 14 + Supabase + docs

- Next.js 14 App Router with TypeScript and Tailwind CSS
- Supabase integration (client, server, middleware)
- Full database schema with RLS policies
- Documentation suite (architecture, brand, content guidelines, review playbook, roadmap)
- Starter pages: home, gallery, project detail, submit, admin
- Reusable components: header, footer, project card
"@

# Add remote and push
git remote add origin git@github.com:IdeaByHuman/ideabyhuman.git
git branch -M main
git push -u origin main
```

## Step 4: Invite Your Team

```powershell
# Invite team members (replace with actual GitHub usernames)
gh api orgs/IdeaByHuman/invitations -f invitee_id=TEAMMATE_1_GITHUB_ID -f role=admin
gh api orgs/IdeaByHuman/invitations -f invitee_id=TEAMMATE_2_GITHUB_ID -f role=admin
```

Or do it through the web UI:
1. Go to https://github.com/orgs/IdeaByHuman/people
2. Click "Invite member"
3. Enter their GitHub username or email
4. Set role to "Owner" or "Member" (Owner gives full access for a team of 3)

## Step 5: Team Onboarding

Each team member clones and sets up:

```powershell
git clone git@github.com:IdeaByHuman/ideabyhuman.git
cd ideabyhuman
npm install
Copy-Item .env.local.example .env.local
# Edit .env.local with Supabase credentials
npm run dev
```

## Notes

- **No branch protection** — everyone can push to main directly. For a team of 3 moving fast, this keeps things simple. Add protection later if needed.
- **Supabase project** — someone on the team needs to create a Supabase project at https://supabase.com and share the URL + anon key. Run the migration in `supabase/migrations/00001_initial_schema.sql` via the Supabase SQL editor.
- **Delete this file** after setup is complete — it's not needed in the repo long-term.
