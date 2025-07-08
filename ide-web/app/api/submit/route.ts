import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "9d17720c32msh8a66fef643d22d3p1eaa26jsn9e13b45d368a";

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

async function executeCode(code: string, language: string, input: string) {
  const language_id = LANGUAGE_MAP[language];
  if (!language_id) {
    throw new Error("Unsupported language");
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
    throw new Error("Failed to submit code to Judge0");
  }

  const submitData = await submitRes.json();
  const token = submitData.token;

  if (!token) {
    throw new Error("Failed to get submission token");
  }

  // Poll for result
  let result = null;
  for (let i = 0; i < 15; i++) {
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
    throw new Error("Timeout waiting for result");
  }

  return result;
}

// Submit solution
export async function POST(req: NextRequest) {
  try {
    const { userId, contestId, questionId, code, language } = await req.json();
    
    if (!userId || !contestId || !questionId || !code || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if contest is active
    const contest = await prisma.contest.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const now = new Date();
    if (now < contest.startTime) {
      return NextResponse.json({ error: "Contest has not started yet" }, { status: 400 });
    }

    if (now > contest.endTime) {
      return NextResponse.json({ error: "Contest has ended" }, { status: 400 });
    }

    // Ensure user exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      // Try to find by username first
      user = await prisma.user.findUnique({
        where: { username: 'demo_user' }
      });

      if (!user) {
        // Create new user if doesn't exist
        user = await prisma.user.create({
          data: {
            id: userId,
            username: 'demo_user',
            email: 'demo@example.com',
            name: 'Demo User',
          }
        });
      }
    }

    // Get question with test cases
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testCases: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Execute code against all test cases
    let passedTests = 0;
    let totalTests = question.testCases.length;
    let status = "ACCEPTED";
    let totalRuntime = 0;
    let totalMemory = 0;

    const results = [];

    for (const testCase of question.testCases) {
      try {
        const result = await executeCode(code, language, testCase.input);
        
        const output = (result.stdout || "").trim();
        const expected = testCase.output.trim();
        const passed = output === expected;
        
        if (passed) {
          passedTests++;
        } else if (status === "ACCEPTED") {
          status = "WRONG_ANSWER";
        }

        if (result.time) totalRuntime += parseFloat(result.time);
        if (result.memory) totalMemory += parseFloat(result.memory);

        results.push({
          testCase: testCase.id,
          passed,
          output,
          expected,
          runtime: result.time,
          memory: result.memory,
          status: result.status
        });

        // Handle different statuses
        if (result.status?.id === 5) { // Time Limit Exceeded
          status = "TIME_LIMIT_EXCEEDED";
          break;
        } else if (result.status?.id === 6) { // Compilation Error
          status = "COMPILATION_ERROR";
          break;
        } else if (result.status?.id === 7) { // Runtime Error (SIGSEGV)
          status = "RUNTIME_ERROR";
          break;
        }

      } catch (error) {
        status = "RUNTIME_ERROR";
        results.push({
          testCase: testCase.id,
          passed: false,
          output: "Execution error",
          expected: testCase.output,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        break;
      }
    }

    // Calculate score
    const score = Math.round((passedTests / totalTests) * question.points);

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.id, // Use the actual user ID from database
        contestId,
        questionId,
        code,
        language,
        status,
        score,
        totalTests,
        passedTests,
        runtime: totalRuntime / totalTests || 0,
        memory: totalMemory / totalTests || 0,
      }
    });

    // Update leaderboard
    await updateLeaderboard(user.id, contestId);

    return NextResponse.json({
      submission,
      results: results.map(r => ({
        passed: r.passed,
        isHidden: question.testCases.find((tc: any) => tc.id === r.testCase)?.isHidden || false,
        output: r.output,
        expected: r.expected,
        runtime: r.runtime,
        memory: r.memory
      })),
      score,
      totalTests,
      passedTests,
      status
    });

  } catch (error) {
    console.error('Error submitting code:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateLeaderboard(userId: string, contestId: string) {
  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return;

  // Calculate total score for this user in this contest
  const submissions = await prisma.submission.groupBy({
    by: ['questionId'],
    where: {
      userId,
      contestId,
      status: 'ACCEPTED'
    },
    _max: {
      score: true,
      submittedAt: true
    }
  });

  const totalScore = submissions.reduce((sum: number, sub: any) => sum + (sub._max.score || 0), 0);
  const lastSubmissionTime = submissions.reduce((latest: Date | null, sub: any) => {
    const time = sub._max.submittedAt;
    return !latest || (time && time > latest) ? time : latest;
  }, null as Date | null);

  // Upsert leaderboard entry
  await prisma.leaderboard.upsert({
    where: {
      contestId_userId: {
        contestId,
        userId
      }
    },
    update: {
      totalScore,
      lastSubmissionTime,
      username: user.username
    },
    create: {
      contestId,
      userId,
      username: user.username,
      totalScore,
      lastSubmissionTime
    }
  });
}
