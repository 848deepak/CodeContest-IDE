"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import SolutionValidator to avoid SSR issues with Monaco editor
const SolutionValidator = dynamic(
  () => import("@/components/SolutionValidator"),
  { ssr: false }
);

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

interface ValidationResult {
  valid: boolean;
  passedTests: number;
  totalTests: number;
  results: any[];
}

export default function AddQuestionPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [sampleInput, setSampleInput] = useState("");
  const [sampleOutput, setSampleOutput] = useState("");
  const [points, setPoints] = useState(100);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", output: "", isHidden: true }
  ]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [contestId, setContestId] = useState<string>("");
  const [showValidator, setShowValidator] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setContestId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", output: "", isHidden: true }]);
    // Reset validation when test cases change
    setValidationComplete(false);
    setValidationResults(null);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
      // Reset validation when test cases change
      setValidationComplete(false);
      setValidationResults(null);
    }
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
    // Reset validation when test cases change
    setValidationComplete(false);
    setValidationResults(null);
  };

  const validateFields = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!description.trim()) {
      errors.description = "Problem description is required";
    }
    
    if (!inputFormat.trim()) {
      errors.inputFormat = "Input format is required";
    }
    
    if (!outputFormat.trim()) {
      errors.outputFormat = "Output format is required";
    }
    
    if (!constraints.trim()) {
      errors.constraints = "Constraints are required";
    }
    
    if (!sampleInput.trim()) {
      errors.sampleInput = "Sample input is required";
    }
    
    if (!sampleOutput.trim()) {
      errors.sampleOutput = "Sample output is required";
    }
    
    const validTestCases = testCases.filter(tc => tc.input.trim() && tc.output.trim());
    if (validTestCases.length === 0) {
      errors.testCases = "At least one valid test case is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleValidationComplete = (results: ValidationResult) => {
    setValidationResults(results);
    setValidationComplete(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestId) return;
    
    // Comprehensive validation
    if (!validateFields()) {
      setError("Please fix all required fields marked in red");
      return;
    }
    
    // Ensure test cases are valid
    const validTestCases = testCases.filter(tc => tc.input.trim() && tc.output.trim());
    if (validTestCases.length === 0) {
      setError("At least one test case is required");
      return;
    }
    
    setError("");
    setSaving(true);
    
    try {
      // Create question
      const questionRes = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestId: contestId,
          title,
          description,
          inputFormat,
          outputFormat,
          constraints,
          sampleInput,
          sampleOutput,
          points,
        }),
      });

      if (!questionRes.ok) {
        const errorData = await questionRes.json();
        throw new Error(errorData.error || "Failed to create question");
      }

      const questionData = await questionRes.json();
      const questionId = questionData.id;

      // Create test cases
      for (const testCase of validTestCases) {
        await fetch("/api/testcases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            input: testCase.input,
            expectedOutput: testCase.output,
            isHidden: testCase.isHidden,
          }),
        });
      }

      setSuccess("Question created successfully!");
      setTimeout(() => {
        router.push(`/admin/contests/${contestId}`);
      }, 1500);

    } catch (error: any) {
      setError(error.message || "Failed to create question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Question</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Title *
                  {fieldErrors.title && (
                    <span className="text-red-600 ml-1">{fieldErrors.title}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-3 border ${fieldErrors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="e.g., Two Sum"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 100)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Description *
                {fieldErrors.description && (
                  <span className="text-red-600 ml-1">{fieldErrors.description}</span>
                )}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className={`w-full p-3 border ${fieldErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Describe the problem in detail..."
              />
            </div>

            {/* Input/Output Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Input Format *
                  {fieldErrors.inputFormat && (
                    <span className="text-red-600 ml-1">{fieldErrors.inputFormat}</span>
                  )}
                </label>
                <textarea
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  rows={3}
                  className={`w-full p-3 border ${fieldErrors.inputFormat ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Describe the input format..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format *
                  {fieldErrors.outputFormat && (
                    <span className="text-red-600 ml-1">{fieldErrors.outputFormat}</span>
                  )}
                </label>
                <textarea
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  rows={3}
                  className={`w-full p-3 border ${fieldErrors.outputFormat ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Describe the output format..."
                />
              </div>
            </div>

            {/* Constraints */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Constraints *
                {fieldErrors.constraints && (
                  <span className="text-red-600 ml-1">{fieldErrors.constraints}</span>
                )}
              </label>
              <textarea
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                rows={3}
                className={`w-full p-3 border ${fieldErrors.constraints ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., 1 ≤ n ≤ 10^5, -10^9 ≤ arr[i] ≤ 10^9"
              />
            </div>

            {/* Sample Input/Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Input *
                  {fieldErrors.sampleInput && (
                    <span className="text-red-600 ml-1">{fieldErrors.sampleInput}</span>
                  )}
                </label>
                <textarea
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  rows={4}
                  className={`w-full p-3 border ${fieldErrors.sampleInput ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
                  placeholder="Enter sample input..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Output *
                  {fieldErrors.sampleOutput && (
                    <span className="text-red-600 ml-1">{fieldErrors.sampleOutput}</span>
                  )}
                </label>
                <textarea
                  value={sampleOutput}
                  onChange={(e) => setSampleOutput(e.target.value)}
                  rows={4}
                  className={`w-full p-3 border ${fieldErrors.sampleOutput ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm`}
                  placeholder="Enter expected output..."
                />
              </div>
            </div>

            {/* Test Cases */}
            <div className={fieldErrors.testCases ? 'border border-red-500 rounded-lg p-4' : ''}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Test Cases *
                  {fieldErrors.testCases && (
                    <span className="text-red-600 ml-1 text-sm">{fieldErrors.testCases}</span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  + Add Test Case
                </button>
              </div>

              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Test Case {index + 1}</h4>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Input *
                        </label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder="Enter test input..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Expected Output *
                        </label>
                        <textarea
                          value={testCase.output}
                          onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                          rows={3}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          placeholder="Enter expected output..."
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`hidden-${index}`}
                        checked={testCase.isHidden}
                        onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`hidden-${index}`} className="ml-2 text-sm text-gray-700">
                        Hidden test case (used for judging)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution Validator */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Validate Solution</h3>
                <button
                  type="button"
                  onClick={() => setShowValidator(!showValidator)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {showValidator ? "Hide Validator" : "Show Validator"}
                </button>
              </div>
              
              {showValidator && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <SolutionValidator 
                    testCases={testCases.filter(tc => tc.input.trim() && tc.output.trim())} 
                    onValidationComplete={handleValidationComplete}
                  />
                </div>
              )}

              {validationComplete && validationResults && (
                <div className={`mt-4 p-4 rounded-lg ${validationResults.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <h4 className="font-medium">
                    {validationResults.valid 
                      ? "All tests passed! Your solution works correctly." 
                      : `${validationResults.passedTests}/${validationResults.totalTests} tests passed. Please fix your solution.`}
                  </h4>
                </div>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/admin/contests/${contestId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Question...
                  </>
                ) : (
                  'Create Question'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
