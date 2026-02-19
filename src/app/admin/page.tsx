export default function AdminPage() {
  return (
    <div className="w-full">
      {/* Page Header */}
      <section className="px-4 py-16 border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Review Dashboard</h1>
          <p className="text-lg text-gray-600">Manage and review project submissions</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-yellow-900 mb-2">
              Authenticated reviewers only
            </h2>
            <p className="text-yellow-800">
              This page requires authentication. If you're a reviewer, please log in to access the
              submission review dashboard.
            </p>
          </div>

          {/* Placeholder Stats */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 opacity-50 pointer-events-none">
            {[
              { label: 'Pending Reviews', value: '0' },
              { label: 'Approved', value: '0' },
              { label: 'Rejected', value: '0' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 p-6 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Placeholder Table */}
          <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden opacity-50 pointer-events-none">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Project</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Creator</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No submissions to review
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
