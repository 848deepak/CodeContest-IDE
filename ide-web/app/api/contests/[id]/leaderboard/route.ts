import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get leaderboard for a contest
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const leaderboard = await prisma.leaderboard.findMany({
      where: { contestId: id },
      orderBy: [
        { totalScore: 'desc' },
        { lastSubmissionTime: 'asc' }
      ]
    });

    // Calculate ranks
    interface LeaderboardEntry {
      id: string;
      contestId: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      username: string;
      totalScore: number;
      lastSubmissionTime: Date | null;
      rank: number | null;
    }

    const rankedLeaderboard = leaderboard.map((entry: LeaderboardEntry, index: number) => ({
      ...entry,
      rank: index + 1
    }));

    return NextResponse.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
