# IdeaByHuman

**Where human vision meets AI capability**

A curated showcase platform for exceptional AI-built projects. IdeaByHuman celebrates the creative fusion of human imagination and artificial intelligence, featuring projects that push the boundaries of what's possible when humans and AI collaborate.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Object Storage**: Cloudflare R2
- **Email**: Resend
- **Language**: TypeScript
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ideabyhuman.git
cd ideabyhuman
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
├── components/          # React components
├── lib/
│   ├── supabase/       # Supabase client & server utilities
│   ├── constants.ts    # Application constants
│   └── database.types.ts # Generated Supabase types
└── middleware.ts       # Next.js middleware

supabase/
└── migrations/         # Database schema migrations

docs/
├── ARCHITECTURE.md     # Technical architecture & design
├── CONTENT_GUIDELINES.md # What qualifies for the platform
├── REVIEW_PLAYBOOK.md  # Review criteria and workflows
├── ROADMAP.md          # Product roadmap
├── BRAND_GUIDELINES.md # Voice, tone, and design principles
├── DATABASE_SCHEMA.md  # Database schema documentation
└── SUBMISSION_FORM_SPEC.md # Submission form specification
```

## Team

This project is built by a collaborative team of 3:
- **Founder & Product**: Human vision & curation
- **Engineering**: Full-stack development
- **Community**: Growth & engagement

Open collaboration — no branch protection, everyone ships.

## Documentation

- [Architecture & Technical Design](./docs/ARCHITECTURE.md)
- [Content Guidelines](./docs/CONTENT_GUIDELINES.md)
- [Review Playbook](./docs/REVIEW_PLAYBOOK.md)
- [Product Roadmap](./docs/ROADMAP.md)
- [Brand Guidelines](./docs/BRAND_GUIDELINES.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Submission Form Specification](./docs/SUBMISSION_FORM_SPEC.md)

## License

MIT
