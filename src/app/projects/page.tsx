import { ProjectCard } from '@/components/project-card'

export default async function ProjectsPage() {
  const categories = ['All', 'Web App', 'App', 'Design Tool', 'Mobile', 'AI Tool', 'Other']

  // Placeholder projects - would be fetched from DB in production
  const projects = [
    {
      title: 'AI Art Curator',
      slug: 'ai-art-curator',
      shortDescription: 'A web app that uses AI to curate and organize digital art collections.',
      heroImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=300&fit=crop',
      category: 'Web App',
      creatorName: 'Sarah Chen',
      aiTools: ['OpenAI', 'Vercel AI'],
    },
    {
      title: 'Smart Recipe Generator',
      slug: 'smart-recipe-generator',
      shortDescription: 'Generate recipes based on ingredients you have at home using AI.',
      heroImageUrl: 'https://images.unsplash.com/photo-1495512821756-a3efb6c91e8f?w=400&h=300&fit=crop',
      category: 'App',
      creatorName: 'Marcus Liu',
      aiTools: ['Claude', 'Next.js'],
    },
    {
      title: 'Design System Builder',
      slug: 'design-system-builder',
      shortDescription: 'AI-powered tool to generate consistent design systems from brand guidelines.',
      heroImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      category: 'Design Tool',
      creatorName: 'Jordan Park',
      aiTools: ['GPT-4', 'Tailwind CSS'],
    },
    {
      title: 'Content Scheduler Pro',
      slug: 'content-scheduler-pro',
      shortDescription: 'AI-powered content calendar and scheduling tool for social media teams.',
      heroImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      category: 'Web App',
      creatorName: 'Alex Rodriguez',
      aiTools: ['Claude', 'React'],
    },
    {
      title: 'Code Review Assistant',
      slug: 'code-review-assistant',
      shortDescription: 'Browser extension that provides AI-powered code review suggestions.',
      heroImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop',
      category: 'AI Tool',
      creatorName: 'Taylor Kim',
      aiTools: ['GPT-4', 'Chrome Extension'],
    },
    {
      title: 'Story Generator Game',
      slug: 'story-generator-game',
      shortDescription: 'Interactive game where AI generates unique stories based on user prompts.',
      heroImageUrl: 'https://images.unsplash.com/photo-1606870260519-184b9c8d6d55?w=400&h=300&fit=crop',
      category: 'App',
      creatorName: 'Jamie Lee',
      aiTools: ['OpenAI', 'Unity'],
    },
  ]

  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="px-4 py-16 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Explore Projects</h1>
          <p className="text-lg text-gray-600">
            Browse the collection of innovative projects built by people with ideas and AI as their tool.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 py-8 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  category === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.slug} {...project} />
          ))}
        </div>
      </section>
    </div>
  )
}
