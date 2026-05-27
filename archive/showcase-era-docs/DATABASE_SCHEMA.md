# Database Schema

Complete documentation of IdeaByHuman's database structure.

## Overview

The database is built on PostgreSQL (via Supabase) with Row Level Security (RLS) for authorization. All migrations are version-controlled in `supabase/migrations/`.

**Main Database File**: `supabase/migrations/00001_initial_schema.sql`

## Entity Relationship Diagram

```
┌─────────────────────┐
│     auth.users      │  (Supabase managed)
│  (Supabase Auth)    │
└──────────┬──────────┘
           │ id references
           │
      ┌────▼─────────────────────┐
      │      public.users         │
      │  (Creator/Reviewer/Admin) │
      └──┬───────────┬────────────┘
         │           │
    ┌────▼─┐    ┌───▼──────────┐
    │      │    │              │
┌───┴──────▼┐   │  ┌───────────▼────┐
│  projects │   │  │   reviews       │
│  (1-many)│   │  │  (1-many)       │
└──┬────────┘   │  └─────────────────┘
   │            │
   │  ┌─────────▼──────────┐
   │  │  project_tags      │
   │  │  (many-to-many)    │
   │  └────────┬───────────┘
   │           │
   │  ┌────────▼──────┐
   │  │  tags          │
   │  │  (shared)      │
   │  └────────────────┘
   │
   ├─────────┐
   │         │
┌──▼────────────┐   ┌──────────────────┐
│  favorites    │   │  categories      │
│  (user-many)  │   │  (1-many)        │
└───────────────┘   └──────────────────┘
```

## Table Reference

### auth.users (Supabase Managed)
Managed by Supabase Authentication. Do not modify directly.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| email | text | User email (unique) |
| created_at | timestamp | Account creation time |

### public.users
Extended user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK → auth.users(id) ON DELETE CASCADE | References Supabase Auth user |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| name | VARCHAR(255) | NOT NULL | Display name |
| role | VARCHAR(20) | DEFAULT 'creator', CHECK (creator\|reviewer\|admin) | User role |
| bio | TEXT | | Short bio |
| avatar_url | VARCHAR(500) | | Profile picture URL (R2) |
| website_url | VARCHAR(500) | | Personal website |
| twitter_handle | VARCHAR(100) | | @handle |
| linkedin_url | VARCHAR(500) | | LinkedIn profile |
| github_username | VARCHAR(100) | | GitHub username |
| projects_count | INTEGER | DEFAULT 0 | Denormalized count of projects |
| total_views | INTEGER | DEFAULT 0 | Sum of all project views |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Account creation |
| last_login | TIMESTAMP WITH TIME ZONE | | Last login timestamp |

**Indexes**: `idx_users_email`, `idx_users_role`

**RLS Policies**:
- Public read for all authenticated/anon users
- Users can update their own profile
- Admins can update any user

---

### public.categories
Project categories for browsing and filtering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique ID |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Category name (e.g., "Web Applications") |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| description | TEXT | | Category description |
| icon | VARCHAR(50) | | Icon name/emoji |
| display_order | INTEGER | DEFAULT 0 | Sort order in UI |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation time |

**Pre-populated categories**: Web Apps, Mobile Apps, Content Tools, Automation, Creative, Data & Analytics, E-commerce

**Indexes**: `idx_categories_slug`

**RLS Policies**:
- Public read for all
- Admins can insert/update

---

### public.tags
Technology and domain tags applied to projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique ID |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Tag name (e.g., "Next.js", "Claude") |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly slug |
| type | VARCHAR(50) | | Tag type: Framework, Language, Service, AI Tool, Platform, Architecture |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation time |

**Pre-populated tags**: Popular frameworks, languages, services, AI tools (see migration)

**Indexes**: `idx_tags_slug`

**RLS Policies**:
- Public read for all
- Admins can insert/update

---

### public.projects
Main project submission records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique ID |
| title | VARCHAR(255) | NOT NULL | Project name |
| slug | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| short_description | TEXT | NOT NULL | 1-2 sentence summary (max 150 chars) |
| category_id | UUID | FK → categories(id) ON DELETE SET NULL | Primary category |
| creator_id | UUID | FK → users(id) ON DELETE CASCADE | Project creator |
| live_url | VARCHAR(500) | NOT NULL | Live project URL |
| github_url | VARCHAR(500) | | GitHub repo link (optional) |
| demo_video_url | VARCHAR(500) | | YouTube/Vimeo link (optional) |
| story_problem | TEXT | NOT NULL | Problem statement (300-400 words) |
| story_idea | TEXT | NOT NULL | Creator's vision (200-300 words) |
| story_ai_process | TEXT | NOT NULL | How AI was used (300-400 words) |
| story_surprises | TEXT | | Learnings & surprises (200-300 words) |
| ai_tools_used | TEXT[] | DEFAULT '{}' | Array of AI tools (Claude, ChatGPT, etc) |
| build_time_hours | INTEGER | | Hours spent building |
| key_prompts | TEXT | | Notable prompts used (optional) |
| hero_image_url | VARCHAR(500) | NOT NULL | Main image URL (R2) |
| screenshot_urls | TEXT[] | DEFAULT '{}' | Additional images (R2 URLs) |
| status | VARCHAR(20) | CHECK (pending\|approved\|rejected\|archived) | Submission status |
| featured | BOOLEAN | DEFAULT FALSE | Homepage feature flag |
| submission_date | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When submitted |
| approval_date | TIMESTAMP WITH TIME ZONE | | When approved |
| view_count | INTEGER | DEFAULT 0 | Number of views |
| meta_description | VARCHAR(500) | | SEO description |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last modified |

**Indexes**: `idx_projects_status`, `idx_projects_slug`, `idx_projects_category_id`, `idx_projects_creator_id`, `idx_projects_featured`, `idx_projects_approval_date`

**Triggers**: `update_projects_updated_at` (auto-updates `updated_at` on modification)

**RLS Policies**:
- Public can view approved or featured projects
- Creators can view their own projects
- Reviewers/admins can view all projects
- Creators can insert/update their own projects
- Admins can update any project

---

### public.project_tags
Junction table linking projects to tags (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| project_id | UUID | FK → projects(id) ON DELETE CASCADE | Project reference |
| tag_id | UUID | FK → tags(id) ON DELETE CASCADE | Tag reference |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Association time |
| | | PRIMARY KEY (project_id, tag_id) | Composite primary key |

**Indexes**: `idx_project_tags_tag_id`

**RLS Policies**:
- Public can view all associations
- Creators can add/remove tags from their projects
- Admins can manage all project tags

---

### public.reviews
Reviewer feedback on project submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique ID |
| project_id | UUID | FK → projects(id) ON DELETE CASCADE | Project being reviewed |
| reviewer_id | UUID | FK → users(id) ON DELETE CASCADE | Reviewer (must have reviewer+ role) |
| decision | VARCHAR(20) | CHECK (approve\|reject\|request_changes) | Approval decision |
| feedback | TEXT | | Detailed feedback message |
| originality_score | INTEGER | CHECK (1-10) | Originality rating (1-10) |
| execution_score | INTEGER | CHECK (1-10) | Quality of execution (1-10) |
| story_score | INTEGER | CHECK (1-10) | Story quality (1-10) |
| ai_integration_score | INTEGER | CHECK (1-10) | AI integration rating (1-10) |
| reviewed_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Review time |
| | | UNIQUE(project_id, reviewer_id) | One review per reviewer per project |

**Indexes**: `idx_reviews_project_id`, `idx_reviews_reviewer_id`

**RLS Policies**:
- Reviewers and admins can view reviews
- Reviewers and admins can create reviews
- Reviewers can update their own reviews
- Admins can update any review

---

### public.favorites
User's saved/favorited projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | FK → users(id) ON DELETE CASCADE | User who favorited |
| project_id | UUID | FK → projects(id) ON DELETE CASCADE | Project favorited |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | When favorited |
| | | PRIMARY KEY (user_id, project_id) | Prevents duplicates |

**Indexes**: `idx_favorites_user_id`, `idx_favorites_project_id`

**RLS Policies**:
- Users can view their own favorites
- Users can add/remove their own favorites

---

## Key Relationships

### One-to-Many
- **users → projects**: One user creates many projects
- **users → reviews**: One user reviews many projects
- **categories → projects**: One category has many projects
- **users → favorites**: One user can favorite many projects

### Many-to-Many
- **projects ↔ tags**: Via `project_tags` junction table

### One-to-One
- **users ↔ auth.users**: Each user linked to one Supabase Auth record

## Denormalization & Caching

To optimize queries, some counts are denormalized:
- `users.projects_count` - Updated when projects created/archived
- `users.total_views` - Updated when project views change
- `projects.view_count` - Incremented on each view

These should be kept in sync via application logic or triggers.

## Common Queries

### Get all approved projects
```sql
SELECT * FROM projects WHERE status = 'approved' ORDER BY created_at DESC;
```

### Get featured projects
```sql
SELECT * FROM projects WHERE featured = true AND status = 'approved' ORDER BY approval_date DESC;
```

### Get projects by category
```sql
SELECT p.* FROM projects p
WHERE p.category_id = $1 AND p.status = 'approved'
ORDER BY p.created_at DESC;
```

### Get project with tags
```sql
SELECT p.*, ARRAY_AGG(t.name) as tags
FROM projects p
LEFT JOIN project_tags pt ON p.id = pt.project_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.id = $1
GROUP BY p.id;
```

### Get pending reviews for admin
```sql
SELECT * FROM projects WHERE status = 'pending' ORDER BY submission_date ASC;
```

### Get creator's projects
```sql
SELECT * FROM projects WHERE creator_id = $1 ORDER BY created_at DESC;
```

## Constraints & Validation

- All email fields are validated as unique
- Status enum strictly enforced at DB level
- Role enum strictly enforced at DB level
- Score fields restricted to 1-10 range
- URLs required for live_url field
- Slugs are unique and URL-safe

## Row Level Security (RLS)

All tables have RLS enabled. RLS policies determine what each role can access:

- **Anonymous**: Can view approved/featured projects only
- **Creator**: Can view/edit own projects, view all public projects
- **Reviewer**: Can view pending projects, create/edit own reviews
- **Admin**: Can view/edit everything

See `00001_initial_schema.sql` for full RLS policy definitions.

## Backup & Recovery

- Supabase provides automatic daily backups
- Retention: 7 days on free tier, 30 days on paid
- Point-in-time recovery available
- Backups can be restored to new database

## Future Considerations

- Analytics table for tracking events (views, favorites, etc)
- Notifications table for tracking user notifications
- Comments/discussion threads on projects
- Project collaboration (multiple creators)
- Activity log table for audit trail
- Statistics views for dashboard reporting
