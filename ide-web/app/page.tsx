"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const LANGUAGES = [
  { label: "C++", value: "cpp" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "JavaScript", value: "javascript" },
];

const DEFAULT_CODE: Record<string, string> = {
  cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    cout << "Welcome to CodeContest IDE!" << endl;\n    \n    // Your code here\n    vector<string> features = {\n        "Real-time collaboration",\n        "Multi-language support",\n        "Advanced test cases"\n    };\n    \n    cout << "\\nFeatures:" << endl;\n    for(const auto& feature : features) {\n        cout << "- " << feature << endl;\n    }\n    \n    return 0;\n}`,
  python: `def welcome():\n    print("Welcome to CodeContest IDE!")\n    \n    # Your code here\n    features = [\n        "Real-time collaboration",\n        "Multi-language support", \n        "Advanced test cases"\n    ]\n    \n    print("\\nFeatures:")\n    for feature in features:\n        print(f"- {feature}")\n\nwelcome()`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to CodeContest IDE!");\n        \n        // Your code here\n        String[] features = {\n            "Real-time collaboration",\n            "Multi-language support",\n            "Advanced test cases"\n        };\n        \n        System.out.println("\\nFeatures:");\n        for (String feature : features) {\n            System.out.println("- " + feature);\n        }\n    }\n}`,
  javascript: `function welcome() {\n    console.log("Welcome to CodeContest IDE!");\n    \n    // Your code here\n    const features = [\n        "Real-time collaboration",\n        "Multi-language support",\n        "Advanced test cases"\n    ];\n    \n    console.log("\\nFeatures:");\n    features.forEach(feature => {\n        console.log(\`- \${feature}\`);\n    });\n}\n\nwelcome();`,
};

// Features with icons
const FEATURES = [
  {
    title: "Multi-language Support",
    description: "Code in C++, Python, Java, JavaScript, and more with full syntax highlighting and autocomplete.",
    icon: "🔤"
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with your team in real-time, seeing changes as they happen.",
    icon: "👥"
  },
  {
    title: "Advanced Test Cases",
    description: "Create and run custom test cases to verify your solution works correctly.",
    icon: "✅"
  },
  {
    title: "Competition Platform",
    description: "Join coding contests, compete with others, and improve your skills.",
    icon: "🏆"
  },
  {
    title: "Plagiarism Detection",
    description: "Ensure academic integrity with our advanced plagiarism detection system.",
    icon: "🔍"
  },
  {
    title: "Performance Metrics",
    description: "Track your code's runtime and memory usage to optimize your solutions.",
    icon: "📊"
  }
];

export default function HomePage() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE["cpp"]);
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const fullText = "Build. Code. Compete.";
  
  // Typewriter effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setTypewriterText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || "");
  };

  const handleRun = async () => {
    setLoading(true);
    setTimeout(() => {
      // Simulate execution response
      if (language === "cpp") {
        setOutput("Welcome to CodeContest IDE!\n\nFeatures:\n- Real-time collaboration\n- Multi-language support\n- Advanced test cases");
      } else if (language === "python") {
        setOutput("Welcome to CodeContest IDE!\n\nFeatures:\n- Real-time collaboration\n- Multi-language support\n- Advanced test cases");
      } else if (language === "java") {
        setOutput("Welcome to CodeContest IDE!\n\nFeatures:\n- Real-time collaboration\n- Multi-language support\n- Advanced test cases");
      } else {
        setOutput("Welcome to CodeContest IDE!\n\nFeatures:\n- Real-time collaboration\n- Multi-language support\n- Advanced test cases");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 px-6 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="w-full md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">{typewriterText}</span>
                <span className="animate-blink">|</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300">
                A modern, powerful online IDE and contest platform for developers and competitive programmers
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contests" className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                  Browse Contests
                </Link>
                <Link href="/admin" className="px-6 py-3 bg-transparent border border-blue-500 rounded-lg text-blue-400 font-medium hover:bg-blue-900/20 transition-colors duration-200">
                  Admin Dashboard
                </Link>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-1">
              <div className="bg-gray-900/80 rounded-xl overflow-hidden">
                <div className="bg-gray-900 p-3 border-b border-gray-800 flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-3 text-gray-400 text-sm">main.cpp</div>
                </div>
                <div className="h-[300px] md:h-[350px]">
                  <MonacoEditor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    theme="vs-dark"
                    options={{ 
                      readOnly: false,
                      fontSize: 14, 
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Interactive Code Demo Section */}
      <section className="py-16 px-6 md:px-10 lg:px-16 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-300">Try It Out</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
              <div className="bg-gray-900 p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <select
                    className="border border-gray-700 bg-gray-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value} className="bg-gray-800 text-white">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-[350px]">
                <MonacoEditor
                  height="100%"
                  defaultLanguage={language}
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  theme="vs-dark"
                  options={{ 
                    fontSize: 14, 
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false
                  }}
                />
              </div>
              <div className="p-3 bg-gray-900 border-t border-gray-800">
                <button
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-md transition-colors duration-200"
                  onClick={handleRun}
                  disabled={loading}
                >
                  {loading ? "Running..." : "Run Code"}
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
              <div className="p-3 bg-gray-900 border-b border-gray-800">
                <h3 className="text-sm font-medium text-gray-300">Output</h3>
              </div>
              <div className="h-[350px] overflow-auto p-4 font-mono bg-black text-green-400 text-sm">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-400"></div>
                  </div>
                ) : output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <div className="text-gray-500 h-full flex items-center justify-center">
                    Click "Run Code" to see the output
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-900 border-t border-gray-800 text-right">
                <div className="text-xs text-gray-400">
                  Memory: 0.2 MB | Time: 0.01s
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-6 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-blue-300">Powerful Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-800 shadow-lg hover:shadow-blue-900/10 hover:translate-y-[-4px] transition-all duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-blue-300">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 px-6 md:px-10 lg:px-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-16 text-blue-300">What People Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-300 mb-6">
                "The best online IDE I've used. Perfect for coding competitions and collaborative work."
              </p>
              <div className="font-semibold">Alex Johnson</div>
              <div className="text-gray-400 text-sm">Software Engineer</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-300 mb-6">
                "CodeContest IDE made running our university programming competitions so much easier!"
              </p>
              <div className="font-semibold">Dr. Sarah Chen</div>
              <div className="text-gray-400 text-sm">CS Professor</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-300 mb-6">
                "The real-time collaboration features are game-changing for team coding interviews."
              </p>
              <div className="font-semibold">Michael Rodriguez</div>
              <div className="text-gray-400 text-sm">Tech Lead</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 md:px-10 lg:px-16 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to start coding?</h2>
          <p className="text-xl text-gray-300 mb-10">
            Join our platform today and take your coding experience to the next level.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contests" className="px-8 py-4 bg-blue-600 rounded-lg text-white font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg text-lg">
              Browse Contests
            </Link>
            <Link href="/admin" className="px-8 py-4 bg-transparent border border-blue-500 rounded-lg text-blue-400 font-semibold hover:bg-blue-900/20 transition-colors duration-200 text-lg">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-blue-400 font-semibold text-lg mb-4 md:mb-0">
            CodeContest IDE
          </div>
          <div className="flex items-center space-x-6 text-gray-400">
            <Link href="#" className="hover:text-white">About</Link>
            <Link href="#" className="hover:text-white">Features</Link>
            <Link href="#" className="hover:text-white">Documentation</Link>
            <Link href="#" className="hover:text-white">Contact</Link>
          </div>
          <div className="mt-4 md:mt-0 text-gray-500 text-sm">
            © 2025 CodeContest IDE. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
