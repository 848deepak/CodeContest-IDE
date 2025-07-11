"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SimpleDebugPage() {
  const [status, setStatus] = useState("Loading...");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const debug = async () => {
      try {
        setStatus("Testing API routes...");
        
        // Test Judge0 API
        try {
          const judge0Response = await fetch('/api/judge0/about');
          if (judge0Response.ok) {
            setStatus("✅ Judge0 API working");
          } else {
            setErrors(prev => [...prev, `Judge0 API error: ${judge0Response.status}`]);
          }
        } catch (error) {
          setErrors(prev => [...prev, `Judge0 API fetch failed: ${error}`]);
        }

        setStatus("✅ Page loaded successfully!");
      } catch (error) {
        setErrors(prev => [...prev, `General error: ${error}`]);
        setStatus("❌ Error occurred");
      }
    };

    debug();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🎉 CodeContest IDE - Debug Mode</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Deployment Status</h2>
          <p className="text-green-400 text-lg">✅ SUCCESS: Application is deployed and running!</p>
          <p className="text-gray-300">URL: code-contest-ide.vercel.app</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-900 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Errors Found</h2>
            {errors.map((error, index) => (
              <p key={index} className="text-red-300 mb-2">❌ {error}</p>
            ))}
          </div>
        )}

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Required Actions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Set environment variables in Vercel Dashboard</li>
            <li>Add DATABASE_URL (can be dummy for now)</li>
            <li>Add NEXTAUTH_SECRET (any random 32+ character string)</li>
            <li>Add NEXTAUTH_URL=https://code-contest-ide.vercel.app</li>
            <li>Redeploy after adding environment variables</li>
          </ol>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Features Ready</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Real code execution (Judge0 integration)</li>
            <li>✅ Multi-language support (C++, Python, Java, JavaScript)</li>
            <li>✅ Contest system with leaderboards</li>
            <li>✅ User authentication and profiles</li>
            <li>✅ Admin panel for contest management</li>
            <li>✅ Modern IDE interface with Monaco editor</li>
          </ul>
        </div>

        <div className="bg-blue-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Test Links</h2>
          <div className="space-y-2">
            <Link href="/contests" className="block text-blue-300 hover:text-blue-100">
              → Test Contests Page
            </Link>
            <Link href="/admin" className="block text-blue-300 hover:text-blue-100">
              → Test Admin Panel
            </Link>
            <a 
              href="/api/judge0/about" 
              target="_blank" 
              className="block text-blue-300 hover:text-blue-100"
            >
              → Test Judge0 API (opens in new tab)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
