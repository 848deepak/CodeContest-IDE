// lib/judge0Service.ts
export interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

export interface Judge0SubmissionResponse {
  token: string;
}

export interface Judge0ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
  token: string;
}

export interface Judge0Language {
  id: number;
  name: string;
}

export interface TestCaseResult {
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  execution_time: string;
  memory_used: number;
  status: string;
}

// Language mappings for convenience
export const JUDGE0_LANGUAGES: Record<string, number> = {
  'c': 50,
  'cpp': 54,
  'csharp': 51,
  'go': 60,
  'java': 62,
  'javascript': 63,
  'kotlin': 78,
  'python': 71,
  'python2': 70,
  'python3': 71,
  'rust': 73,
  'typescript': 74,
  'php': 68,
  'ruby': 72,
  'bash': 46
};

class Judge0Service {
  private baseUrl: string;
  private connected: boolean = false;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/about`);
      this.connected = response.ok;
      return this.connected;
    } catch (error) {
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getLanguages(): Promise<Judge0Language[]> {
    try {
      const response = await fetch(`${this.baseUrl}/languages`);
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  async executeCode(
    sourceCode: string,
    language: string | number,
    stdin?: string
  ): Promise<Judge0ExecutionResult> {
    try {
      // Convert language name to ID if needed
      const languageId = typeof language === 'string' 
        ? JUDGE0_LANGUAGES[language.toLowerCase()]
        : language;

      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Submit code
      const submitResponse = await fetch(`${this.baseUrl}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: languageId,
          stdin: stdin || ''
        })
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit code');
      }

      const { token } = await submitResponse.json();

      // Get result
      const resultResponse = await fetch(`${this.baseUrl}/submissions/${token}`);
      
      if (!resultResponse.ok) {
        throw new Error('Failed to get execution result');
      }

      return await resultResponse.json();

    } catch (error) {
      console.error('Code execution error:', error);
      throw error;
    }
  }

  async executeWithTestCases(
    sourceCode: string,
    language: string | number,
    testCases: Array<{ input: string; expected_output: string }>
  ): Promise<{
    results: TestCaseResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      score: number;
    };
  }> {
    try {
      const results: TestCaseResult[] = [];

      // Execute code for each test case
      for (const testCase of testCases) {
        try {
          const result = await this.executeCode(sourceCode, language, testCase.input);
          
          const actualOutput = (result.stdout || '').trim();
          const expectedOutput = testCase.expected_output.trim();
          const passed = actualOutput === expectedOutput;

          results.push({
            input: testCase.input,
            expected_output: expectedOutput,
            actual_output: actualOutput,
            passed,
            execution_time: result.time || '0.00',
            memory_used: result.memory || 0,
            status: result.status.description
          });

        } catch (error) {
          results.push({
            input: testCase.input,
            expected_output: testCase.expected_output,
            actual_output: '',
            passed: false,
            execution_time: '0.00',
            memory_used: 0,
            status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      // Calculate summary
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const score = total > 0 ? Math.round((passed / total) * 100) : 0;

      return {
        results,
        summary: {
          total,
          passed,
          failed: total - passed,
          score
        }
      };

    } catch (error) {
      console.error('Batch execution error:', error);
      throw error;
    }
  }

  getLanguageId(language: string): number | undefined {
    return JUDGE0_LANGUAGES[language.toLowerCase()];
  }

  formatExecutionResult(result: Judge0ExecutionResult): string {
    let output = '';

    if (result.stdout) {
      output += `📤 OUTPUT:\n${result.stdout}\n`;
    }

    if (result.stderr) {
      output += `❌ ERRORS:\n${result.stderr}\n`;
    }

    if (result.compile_output) {
      output += `🔧 COMPILE OUTPUT:\n${result.compile_output}\n`;
    }

    if (!result.stdout && !result.stderr && !result.compile_output) {
      output = 'No output generated.';
    }

    // Add status
    const statusEmoji = result.status.id === 3 ? '✅' : result.status.id === 6 ? '❌' : '⚠️';
    output += `\n${statusEmoji} STATUS: ${result.status.description}`;

    if (result.time) {
      output += `\n⏱️ TIME: ${result.time}s`;
    }

    if (result.memory) {
      output += `\n💾 MEMORY: ${(result.memory / 1024).toFixed(2)} MB`;
    }

    return output;
  }

  getSetupInstructions(): string {
    return `🚨 Judge0 Server Not Available

To enable code execution:

1. Open Terminal and run:
   cd "/Users/deepakpandey/Coding /Projects/judge0"
   node mock-judge0-server.js

2. Wait for "Mock Judge0 API Server running on http://localhost:3001"

3. Refresh this page and try again!

Your code will then execute with real Judge0 integration! 🚀`;
  }
}

// Create a singleton instance
export const judge0Service = new Judge0Service();

// Export utility functions
export const getLanguageIdFromString = (language: string): number => {
  return JUDGE0_LANGUAGES[language.toLowerCase()] || 71; // Default to Python
};

export const isLanguageSupported = (language: string): boolean => {
  return language.toLowerCase() in JUDGE0_LANGUAGES;
};
