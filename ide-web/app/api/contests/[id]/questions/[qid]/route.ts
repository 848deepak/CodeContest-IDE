import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get question details with test cases
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  try {
    const { qid } = await params;
    
    const question = await prisma.question.findUnique({
      where: { id: qid },
      include: {
        testCases: {
          where: { isHidden: false }, // Only show public test cases to participants
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            input: true,
            output: true,
            isHidden: true
          }
        }
      }
    });
    
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 });
  }
}
