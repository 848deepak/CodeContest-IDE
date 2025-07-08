import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In Next.js 15, params should be awaited before accessing properties
    const { id: contestId } = params;
    
    // In a real app, get the user ID from the session
    const userId = 'sample-user-id'; // Replace with actual user ID from session
    
    // Get all submissions for this user in this contest
    const submissions = await prisma.submission.findMany({
      where: {
        contestId,
        userId,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      include: {
        question: {
          select: {
            title: true,
          },
        },
      },
    });

    // Calculate total score
    const totalScore = submissions.reduce((sum, submission) => sum + submission.score, 0);

    // Get user rank from leaderboard
    const userRank = await prisma.leaderboard.findFirst({
      where: {
        contestId,
        userId,
      },
      select: {
        rank: true,
      },
    });

    // Format the submissions
    const formattedSubmissions = submissions.map((submission) => ({
      id: submission.id,
      questionId: submission.questionId,
      questionTitle: submission.question.title,
      score: submission.score,
      status: submission.status,
      submittedAt: submission.submittedAt.toISOString(),
    }));

    return NextResponse.json({
      submissions: formattedSubmissions,
      totalScore,
      rank: userRank?.rank || null,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
