export default function SubmitPage() {
  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="px-4 py-16 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Submit Your Project</h1>
          <p className="text-lg text-gray-600">
            Share your AI-built project with our community and inspire others.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Submissions are currently invitation-only
            </h2>
            <p className="text-blue-800 mb-4">
              We're building our community carefully to ensure quality and authenticity. If you've built
              something amazing with AI, we'd love to hear from you. Reach out to us directly or wait for
              the submission portal to open.
            </p>
            <p className="text-blue-800">
              In the meantime, follow our socials and newsletter for updates on featured projects and
              community news.
            </p>
          </div>

          {/* Placeholder Form Structure */}
          <div className="mt-12 space-y-6 opacity-50 pointer-events-none">
            <div>
              <label className="block text-sm font-medium mb-2">Project Title</label>
              <input
                type="text"
                placeholder="Enter your project title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description</label>
              <textarea
                placeholder="Briefly describe what your project does"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" disabled>
                <option>Select a category</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">AI Tools Used</label>
              <input
                type="text"
                placeholder="e.g., Claude, GPT-4, Custom Model"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled
              />
            </div>

            <button
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              disabled
            >
              Submit Project
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
