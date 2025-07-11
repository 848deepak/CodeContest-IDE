import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;
    
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: {
        id: true,
        title: true,
        disableCopyPaste: true,
        preventTabSwitching: true,
        requireFullScreen: true,
        webcamMonitoring: true,
      }
    });

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 });
    }

    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error fetching contest security settings:', error);
    return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;
    const data = await request.json();
    
    const updatedContest = await prisma.contest.update({
      where: { id: contestId },
      data: {
        disableCopyPaste: data.disableCopyPaste,
        preventTabSwitching: data.preventTabSwitching,
        requireFullScreen: data.requireFullScreen,
        webcamMonitoring: data.webcamMonitoring,
      },
      select: {
        id: true,
        title: true,
        disableCopyPaste: true,
        preventTabSwitching: true,
        requireFullScreen: true,
        webcamMonitoring: true,
      }
    });

    return NextResponse.json(updatedContest);
  } catch (error) {
    console.error('Error updating contest security settings:', error);
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}