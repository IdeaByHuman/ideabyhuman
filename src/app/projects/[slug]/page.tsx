import { ExternalLink, Github, Play } from 'lucide-react'
import Link from 'next/link'

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params

  // Placeholder project data - would be fetched from DB in production
  const project = {
    title: 'AI Art Curator',
    slug: 'ai-art-curator',
    creator: {
      name: 'Sarah Chen',
      bio: 'Product designer and creative technologist',
    },
    category: 'Web App',
    heroImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=1200&h=600&fit=crop',
    shortDescription: 'A web app that uses AI to curate and organize digital art collections.',
    story: {
      problem:
        'Curating large collections of digital art is time-consuming and requires extensive knowledge of aesthetics and art history. Artists and collectors struggle to organize and discover meaningful connections between artworks.',
      idea: 'What if AI could help curators by analyzing visual elements, styles, and themes to suggest meaningful collections and groupings?',
      aiProcess:
        'We used computer vision APIs to analyze images and Claude for semantic understanding of art concepts. The AI processes each artwork, extracts visual and conceptual features, and creates intelligent collections based on various criteria.',
      surprises:
        'We discovered that AI could identify subtle stylistic connections that even experienced curators missed. The system also helped uncover underrepresented artists in collections.',
    },
    aiTools: ['OpenAI Vision', 'Claude API', 'Vercel AI', 'Next.js', 'React'],
    links: {
      live: 'https://example.com',
      github: 'https://github.com/example/ai-art-curator',
      demo: 'https://youtube.com/watch?v=example',
    },
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full h-80 relative mb-12 overflow-hidden bg-gray-100">
        <img
          src={project.heroImageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </section>

      {/* Content */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {project.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{project.title}</h1>
            <div className="text-gray-600 mb-6">
              <p className="text-lg mb-2">Built by {project.creator.name}</p>
              <p>{project.creator.bio}</p>
            </div>
          </div>

          {/* Story Sections */}
          <div className="space-y-12 mb-12">
            {[
              { title: 'The Problem', content: project.story.problem },
              { title: 'The Idea', content: project.story.idea },
              { title: 'The AI Process', content: project.story.aiProcess },
              { title: 'Surprises', content: project.story.surprises },
            ].map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <p className="text-lg text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          {/* AI Tools */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">AI Tools Used</h2>
            <div className="flex flex-wrap gap-2">
              {project.aiTools.map((tool) => (
                <span
                  key={tool}
                  className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-bold mb-4">Links</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {project.links.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink size={18} /> Live Project
                </a>
              )}
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Github size={18} /> Source Code
                </a>
              )}
              {project.links.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Play size={18} /> Demo Video
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-8">
            <Link
              href="/projects"
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              ← Back to projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
