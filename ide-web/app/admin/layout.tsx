import React from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-black shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/contests" className="text-gray-300 hover:text-white">Contests</Link>
              <Link href="/admin/submissions" className="text-gray-300 hover:text-white">Submissions</Link>
              <Link href="/admin/plagiarism" className="text-gray-300 hover:text-white">Plagiarism</Link>
              <div className="h-4 w-px bg-gray-700"></div>
              <Link href="/contests" className="text-gray-300 hover:text-white">View Contests</Link>
              <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
