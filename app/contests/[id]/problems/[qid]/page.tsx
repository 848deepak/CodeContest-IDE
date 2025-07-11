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

interface TestResult {
  passed: boolean;
  isHidden: boolean;
  expected?: string;
  output?: string;
}

interface SubmitResult {
  status: string;
  score?: number;
  results?: TestResult[];
  errorMessage?: string;
  passedTests?: number;
  totalTests?: number;
}

const LANGUAGES = [
  { value: "python", label: "Python 3", judge0Id: 71 },
  { value: "cpp", label: "C++", judge0Id: 54 },
  { value: "c", label: "C", judge0Id: 50 },
  { value: "java", label: "Java", judge0Id: 62 },
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
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [judge0Connected, setJudge0Connected] = useState(false);
  
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
        // Check Judge0 connection
        try {
          const judge0Response = await fetch('http://localhost:3001/about');
          setJudge0Connected(judge0Response.ok);
        } catch {
          setJudge0Connected(false);
        }
        
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
      // Check Judge0 connection first
      const connectionCheck = await fetch('http://localhost:3001/about');
      if (!connectionCheck.ok) {
        setOutput(`🚨 Judge0 Server Not Available

To enable code execution:

1. Open Terminal and run:
   cd "/Users/deepakpandey/Coding /Projects/judge0"
   node mock-judge0-server.js

2. Wait for "Mock Judge0 API Server running on http://localhost:3001"

3. Try running your code again!

Your code will execute with real Judge0 integration! 🚀`);
        setRunning(false);
        return;
      }

      // Get Judge0 language ID
      const currentLang = LANGUAGES.find(lang => lang.value === language);
      const languageId = currentLang?.judge0Id || 71; // Default to Python
      
      // Submit code to Judge0 with custom input
      const submitResponse = await fetch('http://localhost:3001/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input || undefined
        })
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit code to Judge0');
      }

      const { token } = await submitResponse.json();

      // Get result from Judge0
      const resultResponse = await fetch(`http://localhost:3001/submissions/${token}`);
      
      if (!resultResponse.ok) {
        throw new Error('Failed to get execution result from Judge0');
      }

      const result = await resultResponse.json();
      
      // Format output for display
      let formattedOutput = "";
      
      if (result.stdout) {
        formattedOutput += result.stdout;
      }
      
      if (result.stderr) {
        formattedOutput += `\n❌ ERRORS:\n${result.stderr}`;
      }
      
      if (result.compile_output) {
        formattedOutput += `\n🔧 COMPILE OUTPUT:\n${result.compile_output}`;
      }
      
      if (!result.stdout && !result.stderr && !result.compile_output) {
        formattedOutput = "No output generated.";
      }
      
      // Add execution status info  
      const statusDesc = result.status?.description || 'Unknown';
      const statusEmoji = result.status?.id === 3 ? '✅' : result.status?.id === 6 ? '❌' : '⚠️';
      
      if (result.status?.id !== 3) {
        formattedOutput += `\n\n${statusEmoji} STATUS: ${statusDesc}`;
      }
      
      setOutput(formattedOutput);
      
    } catch (error) {
      console.error("Execution error:", error);
      setOutput(`❌ EXECUTION ERROR: ${error instanceof Error ? error.message : 'Unknown error'}

🔧 Troubleshooting:
1. Make sure Judge0 mock server is running:
   cd "/Users/deepakpandey/Coding /Projects/judge0"
   node mock-judge0-server.js

2. Check if http://localhost:3001 is accessible
3. Try refreshing the page`);
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
      // Check Judge0 connection first
      const connectionCheck = await fetch('http://localhost:3001/about');
      if (!connectionCheck.ok) {
        alert(`🚨 Judge0 Server Not Available

To enable code submission:

1. Open Terminal and run:
   cd "/Users/deepakpandey/Coding /Projects/judge0"
   node mock-judge0-server.js

2. Wait for server to start, then try submitting again!`);
        setSubmitting(false);
        return;
      }

      console.log("Starting Judge0-powered submission:", { userId, contestId, questionId, language });
      
      // Get Judge0 language ID
      const currentLang = LANGUAGES.find(lang => lang.value === language);
      const languageId = currentLang?.judge0Id || 71;
      
      // Run test cases using Judge0
      const testCases = question?.testCases || [];
      const results: TestResult[] = [];
      let passedTests = 0;
      
      // Test with sample input/output first
      if (question?.sampleInput && question?.sampleOutput) {
        const sampleResult = await runTestCase(code, languageId, question.sampleInput, question.sampleOutput);
        results.push({ 
          passed: sampleResult.passed, 
          isHidden: false, 
          expected: question.sampleOutput, 
          output: sampleResult.output 
        });
        if (sampleResult.passed) passedTests++;
      }
      
      // Run actual test cases
      for (const testCase of testCases) {
        const result = await runTestCase(code, languageId, testCase.input, testCase.output);
        results.push({
          passed: result.passed,
          isHidden: testCase.isHidden,
          expected: testCase.isHidden ? undefined : testCase.output,
          output: testCase.isHidden ? undefined : result.output
        });
        if (result.passed) passedTests++;
      }
      
      const totalTests = results.length;
      const score = Math.round((passedTests / totalTests) * (question?.points || 100));
      const status = passedTests === totalTests ? 'ACCEPTED' : 'WRONG_ANSWER';
      
      const submitResult: SubmitResult = {
        status,
        score,
        results,
        passedTests,
        totalTests
      };
      
      setSubmitResult(submitResult);
      alert(`Submission completed with Judge0! Score: ${passedTests}/${totalTests} tests passed`);
      
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitResult({
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        passedTests: 0,
        totalTests: 0
      });
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSubmitting(false);
  };

  // Helper function to run a single test case with Judge0
  const runTestCase = async (code: string, languageId: number, input: string, expectedOutput: string) => {
    try {
      // Submit to Judge0
      const submitResponse = await fetch('http://localhost:3001/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input
        })
      });

      if (!submitResponse.ok) {
        return { passed: false, output: 'Submission failed' };
      }

      const { token } = await submitResponse.json();

      // Get result
      const resultResponse = await fetch(`http://localhost:3001/submissions/${token}`);
      
      if (!resultResponse.ok) {
        return { passed: false, output: 'Failed to get result' };
      }

      const result = await resultResponse.json();
      
      // Check if execution was successful
      if (result.status?.id !== 3) {
        return { 
          passed: false, 
          output: result.stderr || result.compile_output || 'Execution failed' 
        };
      }
      
      // Compare output (trim whitespace for comparison)
      const actualOutput = (result.stdout || '').trim();
      const expected = expectedOutput.trim();
      const passed = actualOutput === expected;
      
      return { passed, output: actualOutput };
      
    } catch (error) {
      return { passed: false, output: 'Test case execution error' };
    }
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
                {submitResult.results?.map((result: TestResult, index: number) => (
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
                  className={`px-4 py-2 rounded disabled:opacity-50 ${
                    judge0Connected 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {running ? "Running..." : judge0Connected ? "Run" : "Run (Start Judge0)"}
                </button>
                <button
                  onClick={() => {
                    console.log("Submit button clicked!");
                    handleSubmit();
                  }}
                  disabled={submitting}
                  className={`px-4 py-2 rounded disabled:opacity-50 ${
                    judge0Connected 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  {submitting ? "Submitting..." : judge0Connected ? "Submit" : "Submit (Start Judge0)"}
                </button>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${judge0Connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-gray-500">
                    {judge0Connected ? 'Judge0 Ready' : 'Judge0 Offline'}
                  </span>
                </div>
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
                automaticLayout: true,
                cursorStyle: 'block',
                cursorBlinking: 'solid',
                renderLineHighlight: 'all',
                selectOnLineNumbers: true,
                mouseWheelZoom: true,
                contextmenu: true,
                cursorSmoothCaretAnimation: 'off',
                cursorWidth: 3,
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3
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
