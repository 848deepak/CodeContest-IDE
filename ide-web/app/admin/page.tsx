'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Contests Card */}
          <div className="bg-[#222222] rounded-lg shadow p-6 border border-[#333333]">
            <h2 className="text-xl font-semibold text-white mb-4">Contests</h2>
            <p className="text-gray-300 mb-4">Manage programming contests, add problems, and view submissions.</p>
            <Link 
              href="/admin/contests" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Manage Contests
            </Link>
          </div>
          
          {/* Submissions Card */}
          <div className="bg-[#222222] rounded-lg shadow p-6 border border-[#333333]">
            <h2 className="text-xl font-semibold text-white mb-4">Submissions</h2>
            <p className="text-gray-300 mb-4">View, evaluate, and manage all user submissions across contests.</p>
            <Link 
              href="/admin/submissions" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              View Submissions
            </Link>
          </div>
          
          {/* Plagiarism Card */}
          <div className="bg-[#222222] rounded-lg shadow p-6 border border-[#333333]">
            <h2 className="text-xl font-semibold text-white mb-4">Plagiarism Detection</h2>
            <p className="text-gray-300 mb-4">Run plagiarism checks across submissions and view similarity reports.</p>
            <Link 
              href="/admin/plagiarism" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Check Plagiarism
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
