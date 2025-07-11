import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const contestId = params.id;
    
    const submissions = await prisma.submission.findMany({
      where: { contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            points: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}