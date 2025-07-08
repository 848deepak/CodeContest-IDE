"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

interface ValidatorProps {
  testCases: TestCase[];
  onValidationComplete: (results: ValidationResult) => void;
}

interface TestResult {
  passed: boolean;
  output: string;
  expected: string;
  runtime?: string;
  memory?: string;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  passedTests: number;
  totalTests: number;
  results: TestResult[];
}

export default function SolutionValidator({ testCases, onValidationComplete }: ValidatorProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [error, setError] = useState("");

  const validateSolution = async () => {
    if (!code.trim()) {
      setError("Please enter some code first");
      return;
    }

    if (testCases.length === 0) {
      setError("No test cases to validate against");
      return;
    }

    setValidating(true);
    setError("");
    setResults([]);

    try {
      let passedTests = 0;
      const testResults: TestResult[] = [];

      for (const testCase of testCases) {
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            input: testCase.input,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Execution failed");
        }

        const result = await response.json();
        const output = (result.output || "").trim();
        const expected = testCase.output.trim();
        const passed = output === expected;

        if (passed) passedTests++;

        testResults.push({
          passed,
          output,
          expected,
          runtime: result.time,
          memory: result.memory,
          error: result.status?.description,
        });
      }

      setResults(testResults);
      
      const validationResult: ValidationResult = {
        valid: passedTests === testCases.length,
        passedTests,
        totalTests: testCases.length,
        results: testResults
      };

      onValidationComplete(validationResult);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Solution Validator</h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="java">Java</option>
        </select>
      </div>

      <Editor
        height="300px"
        language={language === "cpp" ? "cpp" : language}
        value={code}
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={validateSolution}
        disabled={validating}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {validating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Validating...
          </>
        ) : (
          "Validate Solution"
        )}
      </button>

      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Runtime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">Test Case {index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.passed ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Passed
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.runtime ? `${result.runtime} s` : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {result.memory ? `${result.memory} KB` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length > 0 && results.some(r => !r.passed) && (
        <div className="space-y-4 mt-4">
          <h4 className="font-medium">Failure Details</h4>
          {results.map((result, index) => !result.passed && (
            <div key={index} className="border rounded p-4 bg-red-50">
              <h5 className="font-medium mb-2">Test Case {index + 1}</h5>
              {result.error && (
                <div className="mb-2 text-red-700">{result.error}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="text-sm font-medium mb-1">Expected Output:</h6>
                  <pre className="bg-white p-2 border rounded text-xs overflow-auto">{result.expected}</pre>
                </div>
                <div>
                  <h6 className="text-sm font-medium mb-1">Your Output:</h6>
                  <pre className="bg-white p-2 border rounded text-xs overflow-auto">{result.output}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
