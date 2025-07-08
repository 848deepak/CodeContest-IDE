"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TestCase {
  id?: string;
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

export default function EditQuestionPage({ 
  params 
}: { 
  params: Promise<{ id: string; qid: string }> 
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [sampleInput, setSampleInput] = useState("");
  const [sampleOutput, setSampleOutput] = useState("");
  const [points, setPoints] = useState(100);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string>("");
  const [questionId, setQuestionId] = useState<string>("");
  const router = useRouter();

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

    async function fetchQuestion() {
      setLoading(true);
      try {
        const res = await fetch(`/api/questions?contestId=${contestId}&questionId=${questionId}`);
        if (res.ok) {
          const questions = await res.json();
          const currentQuestion = questions.find((q: Question) => q.id === questionId);
          
          if (currentQuestion) {
            setQuestion(currentQuestion);
            setTitle(currentQuestion.title);
            setDescription(currentQuestion.description);
            setInputFormat(currentQuestion.inputFormat || "");
            setOutputFormat(currentQuestion.outputFormat || "");
            setConstraints(currentQuestion.constraints || "");
            setSampleInput(currentQuestion.sampleInput || "");
            setSampleOutput(currentQuestion.sampleOutput || "");
            setPoints(currentQuestion.points);
            setTestCases(currentQuestion.testCases || []);
          }
        }
      } catch (error) {
        console.error('Error fetching question:', error);
        setError("Failed to load question");
      }
      setLoading(false);
    }

    fetchQuestion();
  }, [contestId, questionId]);

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", output: "", isHidden: true }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestId || !questionId) return;
    
    // Validation
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    const validTestCases = testCases.filter(tc => tc.input.trim() && tc.output.trim());
    
    setError("");
    setSaving(true);
    
    try {
      // Update question
      const questionRes = await fetch("/api/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: questionId,
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
        throw new Error(errorData.error || "Failed to update question");
      }

      // Update test cases
      if (validTestCases.length > 0) {
        const testCaseRes = await fetch("/api/testcases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: questionId,
            testCases: validTestCases,
          }),
        });

        if (!testCaseRes.ok) {
          const errorData = await testCaseRes.json();
          throw new Error(errorData.error || "Failed to update test cases");
        }
      }

      setSuccess("Question updated successfully!");
      setTimeout(() => {
        router.push(`/admin/contests/${contestId}`);
      }, 1500);

    } catch (error: any) {
      setError(error.message || "Failed to update question");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/questions?id=${questionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Question deleted successfully!");
        setTimeout(() => {
          router.push(`/admin/contests/${contestId}`);
        }, 1500);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete question");
      }
    } catch (error) {
      setError("Failed to delete question");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center">Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center text-red-600">Question not found</div>
        <div className="text-center mt-4">
          <Link href={`/admin/contests/${contestId}`} className="text-blue-600 hover:underline">
            ← Back to Contest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin/contests/${contestId}`} className="text-blue-600 hover:underline">
          ← Back to Contest
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit Question</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Question Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Points</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                min="1"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Problem statement..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Input Format</label>
              <textarea
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Describe the input format..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Output Format</label>
              <textarea
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Describe the output format..."
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Constraints</label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g., 1 ≤ N ≤ 10^5..."
            />
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sample Test Case</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample Input</label>
              <textarea
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                placeholder="Enter sample input..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Sample Output</label>
              <textarea
                value={sampleOutput}
                onChange={(e) => setSampleOutput(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                placeholder="Enter expected output..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Test Cases</h2>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              + Add Test Case
            </button>
          </div>

          {testCases.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No test cases yet. Click "Add Test Case" to add some.
            </div>
          ) : (
            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Test Case {index + 1}</h3>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                          className="mr-1"
                        />
                        Hidden
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                        placeholder="Test input..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expected Output</label>
                      <textarea
                        value={testCase.output}
                        onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                        placeholder="Expected output..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Delete Question
          </button>
          
          <div className="space-x-4">
            <Link
              href={`/admin/contests/${contestId}`}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Question"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
