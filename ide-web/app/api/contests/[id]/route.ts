import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get contest details with questions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            points: true,
            description: true,
            inputFormat: true,
            outputFormat: true,
            constraints: true,
            sampleInput: true,
            sampleOutput: true,
          }
        }
      }
    });
    
    // Add default security settings if not present in the database
    if (contest) {
      return NextResponse.json({
        ...contest,
        requireFullScreen: contest.requireFullScreen ?? true,
        disableCopyPaste: contest.disableCopyPaste ?? true,
        preventTabSwitching: contest.preventTabSwitching ?? true,
        requireWebcamMonitoring: contest.requireWebcamMonitoring ?? false
      });
    }
    
    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }
    
    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 });
  }
}

// Update contest
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { title, startTime, endTime } = data;
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const contest = await prisma.contest.update({
      where: { id },
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    
    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error updating contest:', error);
    return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 });
  }
}

// Delete contest
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.contest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contest:', error);
    return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 });
  }
}
