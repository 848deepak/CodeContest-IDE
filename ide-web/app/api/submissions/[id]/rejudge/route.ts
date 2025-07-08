import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = parseInt(params.id);
    
    // Get the submission details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            testCases: {
              where: { isHidden: true }
            }
          }
        },
        user: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Re-execute the code against all hidden test cases
    const testResults = [];
    let totalScore = 0;
    const maxScore = submission.question.points;

    for (const testCase of submission.question.testCases) {
      try {
        // Create execution request for Judge0
        const executionRequest = {
          source_code: Buffer.from(submission.code).toString('base64'),
          language_id: getLanguageId(submission.language),
          stdin: Buffer.from(testCase.input).toString('base64'),
          expected_output: Buffer.from(testCase.expectedOutput).toString('base64'),
          cpu_time_limit: 2,
          memory_limit: 128000,
          wall_time_limit: 5,
        };

        const response = await fetch(`${process.env.JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.JUDGE0_API_KEY!,
            'X-RapidAPI-Host': process.env.JUDGE0_API_HOST!,
          },
          body: JSON.stringify(executionRequest),
        });

        const result = await response.json();
        
        const passed = result.status?.id === 3 && 
                      result.stdout && 
                      Buffer.from(result.stdout, 'base64').toString().trim() === testCase.expectedOutput.trim();

        testResults.push({
          testCaseId: testCase.id,
          passed,
          status: result.status?.description || 'Unknown',
          time: result.time,
          memory: result.memory,
        });

        if (passed) {
          totalScore += maxScore / submission.question.testCases.length;
        }
      } catch (error) {
        console.error('Error executing test case:', error);
        testResults.push({
          testCaseId: testCase.id,
          passed: false,
          status: 'Runtime Error',
          time: null,
          memory: null,
        });
      }
    }

    // Update the submission with new results
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: Math.round(totalScore),
        status: totalScore > 0 ? 'ACCEPTED' : 'WRONG_ANSWER',
        rejudgedAt: new Date(),
      }
    });

    // Update or create leaderboard entry
    const existingEntry = await prisma.leaderboard.findUnique({
      where: {
        contestId_userId: {
          contestId: submission.contestId,
          userId: submission.userId,
        }
      }
    });

    if (existingEntry) {
      // Recalculate total score for this user in this contest
      const userSubmissions = await prisma.submission.findMany({
        where: {
          contestId: submission.contestId,
          userId: submission.userId,
        },
        include: {
          question: true
        }
      });

      const questionScores = new Map();
      let earliestSubmission = existingEntry.lastSubmissionTime;

      userSubmissions.forEach((sub: any) => {
        const questionId = sub.questionId;
        const currentScore = questionScores.get(questionId) || 0;
        if (sub.score > currentScore) {
          questionScores.set(questionId, sub.score);
        }
        if (sub.submittedAt < earliestSubmission) {
          earliestSubmission = sub.submittedAt;
        }
      });

      const newTotalScore = Array.from(questionScores.values()).reduce((sum, score) => sum + score, 0);

      await prisma.leaderboard.update({
        where: {
          contestId_userId: {
            contestId: submission.contestId,
            userId: submission.userId,
          }
        },
        data: {
          totalScore: newTotalScore,
          lastSubmissionTime: earliestSubmission,
        }
      });
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission,
      testResults,
      message: 'Submission rejudged successfully'
    });

  } catch (error) {
    console.error('Rejudge error:', error);
    return NextResponse.json(
      { error: 'Failed to rejudge submission' },
      { status: 500 }
    );
  }
}

function getLanguageId(language: string): number {
  const languageMap: { [key: string]: number } = {
    'cpp': 54,      // C++ (GCC 9.2.0)
    'java': 62,     // Java (OpenJDK 13.0.1)
    'python': 71,   // Python (3.8.1)
    'javascript': 63, // JavaScript (Node.js 12.14.0)
    'c': 50,        // C (GCC 9.2.0)
  };
  
  return languageMap[language] || 71; // Default to Python
}
