import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        requireFullScreen: true,
        disableCopyPaste: true,
        preventTabSwitching: true,
        requireWebcamMonitoring: true,
        questions: {
          select: {
            id: true,
            title: true,
            points: true,
          }
        }
      }
    });
    return NextResponse.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      title, 
      startTime, 
      endTime, 
      requireFullScreen = true, 
      disableCopyPaste = true, 
      preventTabSwitching = true,
      requireWebcamMonitoring = false
    } = data;
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const contest = await prisma.contest.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        requireFullScreen,
        disableCopyPaste,
        preventTabSwitching,
        requireWebcamMonitoring,
      },
    });
    
    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}
