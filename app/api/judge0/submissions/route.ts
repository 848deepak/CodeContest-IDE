import { NextRequest, NextResponse } from "next/server";

// Judge0 compatible language IDs
const LANGUAGE_MAP: Record<number, { name: string; ext: string }> = {
  50: { name: 'c', ext: 'c' },
  54: { name: 'cpp', ext: 'cpp' }, 
  62: { name: 'java', ext: 'java' },
  63: { name: 'javascript', ext: 'js' },
  71: { name: 'python', ext: 'py' }
};

// In-memory storage for submissions (in production, use a database)
const submissions = new Map<string, unknown>();

// Simple code execution simulation for demo purposes
// In production, this would connect to a real Judge0 instance or code execution service
function simulateExecution(sourceCode: string, languageId: number) {
  const language = LANGUAGE_MAP[languageId];
  if (!language) {
    return {
      status: { id: 4, description: "Runtime Error" },
      stderr: "Unsupported language",
      stdout: null,
      compile_output: null,
      time: 0.01,
      memory: 1024
    };
  }

  // Simple simulation based on language
  try {
    let output = "";
    
    if (language.name === 'python') {
      // Simple Python simulation
      if (sourceCode.includes('print')) {
        const printMatches = sourceCode.match(/print\s*\(\s*['"](.*?)['"]?\s*\)/g);
        if (printMatches) {
          output = printMatches.map(match => {
            const content = match.match(/['"](.*?)['"]/) || match.match(/print\s*\(\s*([^'"]+?)\s*\)/);
            return content ? content[1] : 'Hello World';
          }).join('\n');
        }
      } else if (sourceCode.includes('input')) {
        output = "Interactive input not supported in demo mode";
      } else {
        output = "Code executed successfully (simulation)";
      }
    } else if (language.name === 'javascript') {
      // Simple JavaScript simulation
      if (sourceCode.includes('console.log')) {
        const logMatches = sourceCode.match(/console\.log\s*\(\s*['"](.*?)['"]?\s*\)/g);
        if (logMatches) {
          output = logMatches.map(match => {
            const content = match.match(/['"](.*?)['"]/) || match.match(/console\.log\s*\(\s*([^'"]+?)\s*\)/);
            return content ? content[1] : 'Hello World';
          }).join('\n');
        }
      } else {
        output = "Code executed successfully (simulation)";
      }
    } else if (language.name === 'cpp' || language.name === 'c') {
      // Simple C/C++ simulation
      if (sourceCode.includes('cout')) {
        const coutMatches = sourceCode.match(/cout\s*<<\s*['"](.*?)['"]?/g);
        if (coutMatches) {
          output = coutMatches.map(match => {
            const content = match.match(/['"](.*?)['"]/) || match.match(/cout\s*<<\s*([^'";]+)/);
            return content ? content[1] : 'Hello World';
          }).join('\n');
        }
      } else if (sourceCode.includes('printf')) {
        const printfMatches = sourceCode.match(/printf\s*\(\s*['"](.*?)['"]?/g);
        if (printfMatches) {
          output = printfMatches.map(match => {
            const content = match.match(/['"](.*?)['"]/) || ['', 'Hello World'];
            return content[1];
          }).join('\n');
        }
      } else {
        output = "Code executed successfully (simulation)";
      }
    } else if (language.name === 'java') {
      // Simple Java simulation
      if (sourceCode.includes('System.out.print')) {
        const printMatches = sourceCode.match(/System\.out\.print(?:ln)?\s*\(\s*['"](.*?)['"]?\s*\)/g);
        if (printMatches) {
          output = printMatches.map(match => {
            const content = match.match(/['"](.*?)['"]/) || match.match(/System\.out\.print(?:ln)?\s*\(\s*([^'"]+?)\s*\)/);
            return content ? content[1] : 'Hello World';
          }).join('\n');
        }
      } else {
        output = "Code executed successfully (simulation)";
      }
    }

    return {
      status: { id: 3, description: "Accepted" },
      stdout: output || "No output (this is a simulation)",
      stderr: null,
      compile_output: null,
      time: Math.random() * 0.5 + 0.1, // Random execution time
      memory: Math.floor(Math.random() * 10000) + 1024 // Random memory usage
    };

  } catch (error) {
    return {
      status: { id: 4, description: "Runtime Error" },
      stderr: error instanceof Error ? error.message : "Unknown error",
      stdout: null,
      compile_output: null,
      time: 0.01,
      memory: 1024
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_code, language_id, stdin = '', wait = false } = body;

    if (!source_code || !language_id) {
      return NextResponse.json({ 
        error: "Missing required fields: source_code, language_id" 
      }, { status: 400 });
    }

    const langConfig = LANGUAGE_MAP[language_id];
    if (!langConfig) {
      return NextResponse.json({ 
        error: `Unsupported language_id: ${language_id}` 
      }, { status: 400 });
    }

    const token = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate execution
    const result = simulateExecution(source_code, language_id);
    
    // Store submission
    const submission = {
      token,
      status: result.status,
      source_code,
      language_id,
      stdin,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory,
      created_at: new Date().toISOString()
    };

    submissions.set(token, submission);

    if (wait) {
      return NextResponse.json(submission);
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error in Judge0 submissions:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// GET endpoint to retrieve submission results
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ 
      error: "Missing token parameter" 
    }, { status: 400 });
  }

  const submission = submissions.get(token);
  if (!submission) {
    return NextResponse.json({ 
      error: "Submission not found" 
    }, { status: 404 });
  }

  return NextResponse.json(submission);
}
