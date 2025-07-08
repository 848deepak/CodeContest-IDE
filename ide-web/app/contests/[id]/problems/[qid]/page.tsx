"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface TestCase {
  id: string;
  input: string;
  output: string;
  isHidden: boolean;
}

interface Question {
  id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  points: number;
  testCases: TestCase[];
}

interface Contest {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

const LANGUAGES = [
  { value: "python", label: "Python 3" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `# Read input\n# Write your solution here\n`,
  cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n    }\n}`,
};

export default function ProblemPage({ 
  params 
}: { 
  params: Promise<{ id: string; qid: string }> 
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string>("");
  const [questionId, setQuestionId] = useState<string>("");
  
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  
  // Demo user - in real app, this would come from authentication
  const [userId] = useState("demo-user-123");

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setContestId(resolvedParams.id);
      setQuestionId(resolvedParams.qid);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (!contestId || !questionId) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch contest info
        const contestRes = await fetch(`/api/contests/${contestId}`);
        if (contestRes.ok) {
          const contestData = await contestRes.json();
          setContest(contestData);
        }
        
        // Fetch question details
        const questionRes = await fetch(`/api/contests/${contestId}/questions/${questionId}`);
        if (questionRes.ok) {
          const questionData = await questionRes.json();
          setQuestion(questionData);
          setInput(questionData.sampleInput || "");
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    }
    fetchData();
  }, [contestId, questionId]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || "");
  };

  const handleRun = async () => {
    if (!code.trim()) {
      alert("Please write some code first!");
      return;
    }

    setRunning(true);
    setOutput("");
    try {
      console.log("Running code:", { code, language, input });
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, input }),
      });
      
      console.log("Execute response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Execute response data:", data);
        setOutput(data.output || "No output");
      } else {
        const errorText = await res.text();
        console.error("Execute error:", errorText);
        setOutput("Error running code: " + errorText);
      }
    } catch (error) {
      console.error("Network error during execution:", error);
      setOutput("Network error during execution");
    }
    setRunning(false);
  };

  const handleSubmit = async () => {
    if (!userId || !contestId || !questionId) {
      alert("Missing required information for submission");
      console.error("Missing info:", { userId, contestId, questionId });
      return;
    }

    if (!code.trim()) {
      alert("Please write some code first!");
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      console.log("Starting submission:", { userId, contestId, questionId, language });
      
      // First ensure user exists (simplified approach)
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "demo_user",
          email: "demo@example.com",
          name: "Demo User"
        }),
      });

      if (!userRes.ok) {
        const userError = await userRes.text();
        console.error("User creation failed:", userError);
      }

      // Submit the code
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId,
          contestId, 
          questionId, 
          code, 
          language 
        }),
      });
      
      console.log("Submit response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Submit response data:", data);
        setSubmitResult(data);
        alert(`Submission completed! Score: ${data.score}/${data.totalTests} tests passed`);
      } else {
        const error = await res.json();
        console.error("Submission error:", error);
        alert(`Submission failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Network error during submission:", error);
      alert("Network error during submission");
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading problem...</div>
    </div>
  );
  
  if (!question || !contest) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Problem not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href={`/contests/${contestId}`} className="text-blue-600 hover:text-blue-800">
                ← Back to {contest.title}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{question.points} points</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Problem Description */}
        <div className="w-1/2 p-6 bg-white border-r overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
          
          <div className="prose max-w-none mb-6">
            <h3>Problem Description</h3>
            <p className="whitespace-pre-line">{question.description}</p>
            
            <h3>Input Format</h3>
            <p>{question.inputFormat}</p>
            
            <h3>Output Format</h3>
            <p>{question.outputFormat}</p>
            
            <h3>Constraints</h3>
            <p className="whitespace-pre-line">{question.constraints}</p>
            
            <h3>Sample Input</h3>
            <pre className="bg-gray-100 p-3 rounded">{question.sampleInput}</pre>
            
            <h3>Sample Output</h3>
            <pre className="bg-gray-100 p-3 rounded">{question.sampleOutput}</pre>
          </div>

          {submitResult && (
            <div className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Submission Result</h3>
              <div className={`text-lg font-medium mb-2 ${
                submitResult.status === 'ACCEPTED' ? 'text-green-600' : 'text-red-600'
              }`}>
                {submitResult.status}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Score: {submitResult.score}/{question.points} | 
                Passed: {submitResult.passedTests}/{submitResult.totalTests} test cases
              </div>
              
              <div className="space-y-2">
                {submitResult.results?.map((result: any, index: number) => (
                  <div key={index} className={`p-2 rounded text-sm ${
                    result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    Test Case {index + 1}: {result.passed ? '✅ Passed' : '❌ Failed'}
                    {result.isHidden && ' (Hidden)'}
                    {!result.isHidden && !result.passed && (
                      <div className="mt-1 text-xs">
                        Expected: {result.expected} | Got: {result.output}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 bg-white border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Language:</span>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log("Run button clicked!");
                    handleRun();
                  }}
                  disabled={running}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  {running ? "Running..." : "Run"}
                </button>
                <button
                  onClick={() => {
                    console.log("Submit button clicked!");
                    handleSubmit();
                  }}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
            />
          </div>

          <div className="h-48 border-t flex">
            <div className="w-1/2 p-4 border-r">
              <h4 className="font-medium mb-2">Custom Input</h4>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 border rounded p-2 text-sm font-mono resize-none"
                placeholder="Enter custom input for testing..."
              />
            </div>
            <div className="w-1/2 p-4">
              <h4 className="font-medium mb-2">Output</h4>
              <div className="w-full h-32 border rounded p-2 bg-gray-50 text-sm font-mono overflow-auto">
                {output || "Output will appear here..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
