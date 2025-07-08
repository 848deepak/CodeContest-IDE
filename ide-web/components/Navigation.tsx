'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-black shadow-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-400">
              CodeContest IDE
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/contests" className="text-gray-300 hover:text-white">
              Contests
            </Link>
            <Link href="/admin" className="text-gray-300 hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
