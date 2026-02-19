# Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     End Users (Browsers)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Next.js 14 Frontend                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Hero, Gallery, Submit, Dashboard, Project    │   │
│  │ Components: Cards, Forms, Navigation, Search        │   │
│  │ Client State: Hooks & Context                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
┌────▼────────┐  ┌──────▼──────┐  ┌────────▼────┐
│  Supabase   │  │  Cloudflare │  │   Resend    │
│  (Auth &    │  │     R2      │  │   (Email)   │
│  Database)  │  │   (Media)   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Tech Stack & Rationale

### Frontend & Framework
- **Next.js 14 (App Router)**: Modern React framework with built-in optimization, server components for better performance, and API routes for backend logic
- **TypeScript**: Type safety across codebase, better developer experience, fewer runtime errors
- **React 18**: Latest React features, concurrent rendering, automatic batching
- **Tailwind CSS**: Utility-first CSS framework, rapid UI development, consistent design system

### Authentication & Database
- **Supabase**: PostgreSQL database with real-time capabilities, built-in authentication (magic links), RLS for row-level security, minimal DevOps overhead
- **Magic Links**: Passwordless authentication via email, better UX, no password management burden
- **RLS (Row Level Security)**: Database-level access control, ensures users can only access data they should

### File Storage
- **Cloudflare R2**: S3-compatible object storage, no egress fees, global edge locations, cost-effective for high-volume media
- **Signed Upload URLs**: Direct client-to-R2 uploads without proxying through server
- **CDN Integration**: R2 works with Cloudflare's edge network for fast delivery

### Email Service
- **Resend**: Purpose-built email API for developers, reliable delivery, good email templates support

## Project Structure

```
ideabyhuman/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── gallery/            # Projects listing
│   │   ├── submit/             # Submission form
│   │   ├── dashboard/          # Creator dashboard
│   │   ├── project/[slug]/     # Project detail page
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API Route Handlers
│   │       ├── upload/         # Presigned R2 URLs
│   │       ├── submit/         # Form submission
│   │       └── review/         # Review endpoints
│   │
│   ├── components/             # Reusable React components
│   │   ├── layout/             # Layout components
│   │   ├── forms/              # Form components
│   │   ├── cards/              # Card components
│   │   └── ui/                 # Basic UI elements
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Client-side Supabase instance
│   │   │   ├── server.ts       # Server-side Supabase instance
│   │   │   └── middleware.ts   # Auth middleware
│   │   │
│   │   ├── constants.ts        # App constants & config
│   │   ├── database.types.ts   # Generated Supabase types
│   │   └── utils.ts            # Utility functions
│   │
│   └── middleware.ts           # Next.js middleware for auth
│
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql  # Database schema
│
├── public/                     # Static assets
├── docs/                       # Documentation
├── .prettierrc                 # Code formatting config
├── .prettierignore             # Prettier ignore rules
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── next.config.ts              # Next.js config
```

## Data Flow: Submission → Review → Publish

### 1. Project Submission
```
Creator fills form
    ↓
Client uploads media to R2 (presigned URL)
    ↓
Form submission to /api/submit
    ↓
Server validates & creates project record (status: pending)
    ↓
Notification email sent to reviewers via Resend
    ↓
Creator sees confirmation & can view draft
```

### 2. Review Process
```
Reviewer views pending projects in admin panel
    ↓
Reviews submission against criteria
    ↓
Submits review via /api/review
    ↓
Server creates review record with scores & decision
    ↓
If approved: project status → "approved", featured = false initially
If rejected: project status → "rejected"
If request changes: notification sent back to creator
    ↓
Email notification sent to creator
```

### 3. Publishing
```
Approved projects appear in gallery (status = "approved")
    ↓
Admin can feature projects (featured = true)
    ↓
Featured projects get prominent placement
    ↓
Public can view, favorite, share projects
```

## Authentication Flow

```
User visits platform
    ↓
If not authenticated: redirected to login
    ↓
User enters email
    ↓
Supabase Auth sends magic link via Resend
    ↓
User clicks link in email
    ↓
Session established via Supabase cookie
    ↓
User profile fetched from users table
    ↓
Dashboard/submission form becomes available
```

**Key Points:**
- Magic links expire after 24 hours
- Supabase manages session state via httpOnly cookies
- Each authenticated request verified via middleware
- User role (creator, reviewer, admin) determined at database level

## Media Storage Strategy

### Upload Process
1. Frontend requests presigned URL from `/api/upload`
2. Server generates temporary R2 credentials (5-minute expiry)
3. Frontend uploads directly to R2 bucket
4. Server records final URL in projects table

### Why Presigned URLs?
- No file size limits imposed by server
- No bandwidth usage on Vercel (R2 pays for egress)
- Faster uploads (direct to R2)
- Better security (time-limited credentials)

### Asset Types
- **Hero Image**: Primary project image (required, recommended 1200x630px)
- **Screenshots**: Additional project images (up to 5)
- **Demo Video**: Optional (stored as URL to YouTube/Vimeo)

## API Routes Overview

### Authentication (`/api/auth`)
- POST `/api/auth/signin` - Send magic link
- POST `/api/auth/callback` - Handle magic link callback

### Submissions (`/api/submit`)
- POST `/api/submit` - Create new project submission
- GET `/api/submit/[id]` - Get submission details
- PATCH `/api/submit/[id]` - Update pending submission

### Reviews (`/api/review`)
- POST `/api/review` - Create review (reviewer only)
- GET `/api/review/[projectId]` - Get project reviews (admin/reviewer)
- PATCH `/api/review/[id]` - Update review (own review or admin)

### Media (`/api/upload`)
- POST `/api/upload` - Get presigned R2 upload URL

### Projects (`/api/projects`)
- GET `/api/projects` - List approved projects
- GET `/api/projects/[slug]` - Get project details
- POST `/api/projects/[id]/favorite` - Add to favorites

### Admin (`/api/admin`)
- GET `/api/admin/submissions` - List pending submissions
- PATCH `/api/admin/projects/[id]` - Update project (feature, archive)

## Deployment

### Recommended: Vercel
- Direct Next.js integration
- Automatic deployments from Git
- Environment variable management
- Analytics & monitoring included
- Edge middleware support

### Alternative: Self-hosted
- Node.js 18+ required
- `npm run build` for production build
- `npm start` to run server
- Set all environment variables
- Requires CDN for static assets (optional but recommended)

## Cost Estimates

### Monthly Infrastructure Costs (estimated)
- **Supabase**: $25-100 (depending on usage tier)
  - PostgreSQL database
  - Auth & RLS
  - Realtime (optional)

- **Cloudflare R2**: $5-20 (storage + requests)
  - Typically 1GB per 1000 projects
  - $0.015/GB storage
  - No egress fees

- **Resend**: $0-99 (depending on email volume)
  - Free tier: 3000 emails/day
  - Paid: $20-99/month for higher volume

- **Vercel**: $20-150 (depending on usage)
  - Hobby tier: $0
  - Pro: $20/month
  - Scale as needed

**Total Estimated**: $50-350/month depending on scale

## Scaling Considerations

### As Platform Grows
1. **Database**: Supabase scales automatically; consider read replicas for reporting
2. **Storage**: R2 has no practical limits; add analytics with Cloudflare
3. **Email**: Resend scales automatically; switch to dedicated IP if needed
4. **Frontend**: Vercel distributes globally; no action needed

### Performance Optimizations
- Next.js Image Optimization for project images
- ISR (Incremental Static Regeneration) for gallery pages
- Server-side filtering & pagination
- Database indexes on common queries (already configured)

## Security Considerations

### Authentication
- Magic links over email (no passwords)
- httpOnly cookies for session
- CSRF protection built into Next.js

### Authorization
- Row-level security at database level
- Role-based access control (creator, reviewer, admin)
- Middleware guards protected routes

### Data Protection
- HTTPS everywhere (enforced by Vercel)
- Environment variables never exposed to client
- Presigned URLs for secure file uploads

### Rate Limiting
- Implement on API routes (suggested: 100 requests/5min per IP)
- Supabase auto-handles auth rate limits

## Monitoring & Analytics

### Recommended Tools
- **Vercel Analytics**: Real User Monitoring
- **Supabase Logs**: Database query performance
- **Cloudflare Analytics**: R2 storage & bandwidth
- **Email Logs**: Resend delivery tracking

### Key Metrics to Track
- User signups & active creators
- Project submissions & approval rate
- Page load times & Core Web Vitals
- Email delivery rates
- Storage usage & growth
