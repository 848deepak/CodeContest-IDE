import { NextRequest, NextResponse } from "next/server";

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "9d17720c32msh8a66fef643d22d3p1eaa26jsn9e13b45d368a";

// Map our language values to Judge0 language IDs
const LANGUAGE_MAP: Record<string, number> = {
  python: 71, // Python 3.8.1
  cpp: 54,    // C++ (GCC 9.2.0)
  c: 50,      // C (GCC 9.2.0)
  java: 62,   // Java (OpenJDK 13.0.1)
};

async function judge0Request(path: string, options: RequestInit) {
  return fetch(`${JUDGE0_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": RAPIDAPI_KEY,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      ...(options.headers || {}),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, input } = await req.json();
    
    if (!code || !language) {
      return NextResponse.json({ error: "Missing code or language" }, { status: 400 });
    }
    
    const language_id = LANGUAGE_MAP[language];
    if (!language_id) {
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
    }

    // Submit code to Judge0
    const submitRes = await judge0Request("/submissions?base64_encoded=false&wait=false", {
      method: "POST",
      body: JSON.stringify({
        source_code: code,
        language_id,
        stdin: input || "",
      }),
    });
    
    if (!submitRes.ok) {
      return NextResponse.json({ error: "Failed to submit code to Judge0" }, { status: 500 });
    }
    
    const submitData = await submitRes.json();
    const token = submitData.token;
    
    if (!token) {
      return NextResponse.json({ error: "Failed to get submission token" }, { status: 500 });
    }

    // Poll for result
    let result = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      const res = await judge0Request(`/submissions/${token}?base64_encoded=false`, { 
        method: "GET" 
      });
      
      if (!res.ok) {
        continue;
      }
      
      result = await res.json();
      if (result.status && result.status.id >= 3) break; // 3: Accepted, 6: Compilation Error, etc.
    }

    if (!result) {
      return NextResponse.json({ error: "Timeout waiting for result" }, { status: 500 });
    }

    return NextResponse.json({
      output: result.stdout || result.compile_output || result.stderr || "No output",
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
