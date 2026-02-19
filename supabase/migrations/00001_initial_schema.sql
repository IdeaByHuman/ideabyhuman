-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
CREATE POLICY enable_rls ON public.projects;

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'reviewer', 'admin')),
  bio TEXT,
  avatar_url VARCHAR(500),
  website_url VARCHAR(500),
  twitter_handle VARCHAR(100),
  linkedin_url VARCHAR(500),
  github_username VARCHAR(100),
  projects_count INTEGER NOT NULL DEFAULT 0,
  total_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  CONSTRAINT users_email_not_empty CHECK (email != '')
);

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  live_url VARCHAR(500) NOT NULL,
  github_url VARCHAR(500),
  demo_video_url VARCHAR(500),
  story_problem TEXT NOT NULL,
  story_idea TEXT NOT NULL,
  story_ai_process TEXT NOT NULL,
  story_surprises TEXT,
  ai_tools_used TEXT[] NOT NULL DEFAULT '{}',
  build_time_hours INTEGER,
  key_prompts TEXT,
  hero_image_url VARCHAR(500) NOT NULL,
  screenshot_urls TEXT[] DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approval_date TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  meta_description VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Project tags junction table
CREATE TABLE public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, tag_id)
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approve', 'reject', 'request_changes')),
  feedback TEXT,
  originality_score INTEGER CHECK (originality_score >= 1 AND originality_score <= 10),
  execution_score INTEGER CHECK (execution_score >= 1 AND execution_score <= 10),
  story_score INTEGER CHECK (story_score >= 1 AND story_score <= 10),
  ai_integration_score INTEGER CHECK (ai_integration_score >= 1 AND ai_integration_score <= 10),
  reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, reviewer_id)
);

-- Favorites table
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- Create indexes for common queries
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_category_id ON public.projects(category_id);
CREATE INDEX idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX idx_projects_featured ON public.projects(featured);
CREATE INDEX idx_projects_approval_date ON public.projects(approval_date);

CREATE INDEX idx_project_tags_tag_id ON public.project_tags(tag_id);

CREATE INDEX idx_reviews_project_id ON public.reviews(project_id);
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);

CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_project_id ON public.favorites(project_id);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_tags_slug ON public.tags(slug);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all public user profiles"
  ON public.users FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for projects table
CREATE POLICY "Anyone can view approved and featured projects"
  ON public.projects FOR SELECT
  TO authenticated, anon
  USING (status = 'approved' OR featured = true);

CREATE POLICY "Creators can view their own projects regardless of status"
  ON public.projects FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Reviewers and admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('reviewer', 'admin')));

CREATE POLICY "Creators can insert their own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Admins can update any project"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for categories table
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for tags table
CREATE POLICY "Anyone can view tags"
  ON public.tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON public.tags FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update tags"
  ON public.tags FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for project_tags table
CREATE POLICY "Anyone can view project tags"
  ON public.project_tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Creators can add tags to their projects"
  ON public.project_tags FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(
    SELECT 1 FROM public.projects
    WHERE id = project_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Creators can remove tags from their projects"
  ON public.project_tags FOR DELETE
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM public.projects
    WHERE id = project_id AND creator_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all project tags"
  ON public.project_tags FOR ALL
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for reviews table
CREATE POLICY "Reviewers and admins can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
    OR reviewer_id = auth.uid());

CREATE POLICY "Reviewers and admins can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('reviewer', 'admin')));

CREATE POLICY "Reviewers can update their own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can update any review"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for favorites table
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add their own favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their own favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Seed data for categories
INSERT INTO public.categories (name, slug, description, icon, display_order) VALUES
('Web Applications', 'web-apps', 'Full-stack web apps, SaaS, and web tools', 'Globe', 1),
('Mobile Apps', 'mobile-apps', 'iOS, Android, and cross-platform applications', 'Smartphone', 2),
('Content Tools', 'content-tools', 'Writing, editing, and content creation tools', 'PenTool', 3),
('Automation', 'automation', 'Workflow automation and productivity tools', 'Zap', 4),
('Creative Projects', 'creative', 'Art, design, music, and creative applications', 'Palette', 5),
('Data & Analytics', 'data-analytics', 'Data visualization, analytics, and BI tools', 'BarChart3', 6),
('E-commerce', 'ecommerce', 'Stores, marketplaces, and shopping platforms', 'ShoppingCart', 7)
ON CONFLICT (slug) DO NOTHING;

-- Seed data for common tags
INSERT INTO public.tags (name, slug, type) VALUES
('Next.js', 'nextjs', 'Framework'),
('React', 'react', 'Framework'),
('TypeScript', 'typescript', 'Language'),
('Supabase', 'supabase', 'Service'),
('Claude', 'claude', 'AI Tool'),
('ChatGPT', 'chatgpt', 'AI Tool'),
('OpenAI', 'openai', 'AI Tool'),
('Python', 'python', 'Language'),
('Node.js', 'nodejs', 'Runtime'),
('PostgreSQL', 'postgresql', 'Database'),
('TailwindCSS', 'tailwindcss', 'Framework'),
('Vercel', 'vercel', 'Platform'),
('GitHub', 'github', 'Platform'),
('API', 'api', 'Architecture'),
('Database', 'database', 'Architecture')
ON CONFLICT (slug) DO NOTHING;
