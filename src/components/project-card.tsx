import Link from 'next/link'

interface ProjectCardProps {
  title: string
  slug: string
  shortDescription: string
  heroImageUrl: string
  category: string
  creatorName: string
  aiTools: string[]
}

export function ProjectCard({
  title,
  slug,
  shortDescription,
  heroImageUrl,
  category,
  creatorName,
  aiTools,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${slug}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Hero Image */}
        <div className="h-48 overflow-hidden bg-gray-100">
          <img
            src={heroImageUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2">{title}</h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{shortDescription}</p>

          {/* Creator */}
          <p className="text-gray-700 text-sm font-medium mb-4">by {creatorName}</p>

          {/* AI Tools */}
          <div className="flex flex-wrap gap-1.5">
            {aiTools.slice(0, 3).map((tool) => (
              <span key={tool} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {tool}
              </span>
            ))}
            {aiTools.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                +{aiTools.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
