import { NextRequest, NextResponse } from "next/server";

// Production Judge0 configuration
const JUDGE0_URL = process.env.JUDGE0_URL || "http://your-judge0-server:2358";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // Only if using RapidAPI
const USE_RAPIDAPI = process.env.USE_RAPIDAPI === "true";

// Judge0 language IDs (official)
const LANGUAGE_MAP: Record<number, { name: string; ext: string }> = {
  50: { name: 'c', ext: 'c' },           // C (GCC 9.2.0)
  54: { name: 'cpp', ext: 'cpp' },       // C++ (GCC 9.2.0)
  62: { name: 'java', ext: 'java' },     // Java (OpenJDK 13.0.1)
  63: { name: 'javascript', ext: 'js' }, // JavaScript (Node.js 12.14.0)
  71: { name: 'python', ext: 'py' },     // Python (3.8.1)
  72: { name: 'ruby', ext: 'rb' },       // Ruby (2.7.0)
  73: { name: 'rust', ext: 'rs' },       // Rust (1.40.0)
  78: { name: 'kotlin', ext: 'kt' },     // Kotlin (1.3.70)
  85: { name: 'perl', ext: 'pl' },       // Perl (5.28.1)
  89: { name: 'go', ext: 'go' },         // Go (1.13.5)
};

// Database storage for submissions (replace with your DB)
const submissions = new Map<string, any>();

async function makeJudge0Request(path: string, options: RequestInit = {}) {
  const url = `${JUDGE0_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  // Add RapidAPI headers if using RapidAPI
  if (USE_RAPIDAPI && RAPIDAPI_KEY) {
    headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  return fetch(url, {
    ...options,
    headers
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_code, language_id, stdin = '', wait = false, cpu_time_limit = 2, memory_limit = 128000 } = body;

    if (!source_code || !language_id) {
      return NextResponse.json({ 
        error: "Missing required fields: source_code, language_id" 
      }, { status: 400 });
    }

    const langConfig = LANGUAGE_MAP[language_id];
    if (!langConfig) {
      return NextResponse.json({ 
        error: `Unsupported language_id: ${language_id}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}` 
      }, { status: 400 });
    }

    // Submit to Judge0
    const submitResponse = await makeJudge0Request('/submissions?wait=false', {
      method: 'POST',
      body: JSON.stringify({
        source_code,
        language_id,
        stdin,
        cpu_time_limit,
        memory_limit,
        wall_time_limit: cpu_time_limit + 1,
        max_processes_and_or_threads: 60,
        enable_per_process_and_thread_time_limit: false,
        enable_per_process_and_thread_memory_limit: false,
        max_file_size: 1024
      })
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('Judge0 submission failed:', errorText);
      return NextResponse.json({ 
        error: `Judge0 submission failed: ${submitResponse.status}` 
      }, { status: 500 });
    }

    const submitResult = await submitResponse.json();
    const token = submitResult.token;

    if (!token) {
      return NextResponse.json({ 
        error: "No token received from Judge0" 
      }, { status: 500 });
    }

    // Store submission metadata
    submissions.set(token, {
      token,
      source_code,
      language_id,
      stdin,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    });

    if (wait) {
      // Poll for result
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max wait
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const resultResponse = await makeJudge0Request(`/submissions/${token}`);
        if (resultResponse.ok) {
          const result = await resultResponse.json();
          
          // Update stored submission
          submissions.set(token, {
            ...submissions.get(token),
            ...result,
            retrieved_at: new Date().toISOString()
          });
          
          // Check if execution is complete
          if (result.status && result.status.id >= 3) {
            return NextResponse.json(result);
          }
        }
        
        attempts++;
      }
      
      return NextResponse.json({ 
        error: "Execution timeout - result may be available later via token" 
      }, { status: 408 });
    }

    return NextResponse.json({ token });

  } catch (error) {
    console.error('Judge0 API error:', error);
    return NextResponse.json({ 
      error: "Internal server error during code execution" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ 
      error: "Missing token parameter" 
    }, { status: 400 });
  }

  try {
    // Try to get result from Judge0
    const response = await makeJudge0Request(`/submissions/${token}`);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: `Judge0 error: ${response.status}` 
      }, { status: response.status });
    }

    const result = await response.json();
    
    // Update stored submission
    const stored = submissions.get(token);
    if (stored) {
      submissions.set(token, {
        ...stored,
        ...result,
        retrieved_at: new Date().toISOString()
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error retrieving submission:', error);
    return NextResponse.json({ 
      error: "Failed to retrieve submission result" 
    }, { status: 500 });
  }
}
