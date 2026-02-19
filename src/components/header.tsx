import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
            ideabyhuman
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/projects"
              className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/submit"
              className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            >
              Submit
            </Link>
            <Link
              href="#about"
              className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
