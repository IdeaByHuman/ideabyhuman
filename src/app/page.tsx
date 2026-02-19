import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'

export default async function HomePage() {
  // Placeholder featured projects - would be fetched from DB in production
  const featuredProjects = [
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
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:py-32 max-w-6xl mx-auto">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Where human vision meets <span className="text-blue-600">AI capability</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            A curated showcase of projects built by people who had the idea and used AI to bring it to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Projects <ArrowRight size={18} />
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Submit Your Project
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Submit',
                description: 'Tell us about your project — the idea, the problem you solved, and how you used AI.',
              },
              {
                step: 2,
                title: 'Review',
                description: 'Our team reviews submissions to ensure quality and alignment with our community values.',
              },
              {
                step: 3,
                title: 'Showcase',
                description: 'Your project gets featured in our gallery, inspiring others to build with AI.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-8 rounded-lg border border-gray-200">
                <div className="text-4xl font-bold text-blue-600 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold">Featured Projects</h2>
          <Link
            href="/projects"
            className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2"
          >
            View all <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} {...project} />
          ))}
        </div>
      </section>
    </div>
  )
}
