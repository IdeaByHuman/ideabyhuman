import Link from 'next/link'
import { Github } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Side */}
          <div>
            <h3 className="text-lg font-bold mb-4">ideabyhuman</h3>
            <p className="text-gray-600">
              Where human vision meets AI capability. A curated showcase of projects built by people with ideas.
            </p>
          </div>

          {/* Right Side - Links */}
          <div className="flex flex-col gap-3 md:items-end">
            <Link href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="#guidelines" className="text-gray-600 hover:text-gray-900 transition-colors">
              Guidelines
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <Github size={18} /> GitHub
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-gray-600 text-sm">
            &copy; {currentYear} ideabyhuman. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
