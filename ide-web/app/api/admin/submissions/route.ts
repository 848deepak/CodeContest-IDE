import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause = contestId ? { contestId: parseInt(contestId) } : {};

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            points: true,
          }
        },
        contest: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.submission.count({
      where: whereClause,
    });

    return NextResponse.json({
      submissions,
      totalCount,
      hasMore: (offset + limit) < totalCount
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
