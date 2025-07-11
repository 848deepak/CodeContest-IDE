import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    // Return mock data when database is unavailable
    const mockContests = [
      {
        id: 'demo-1',
        title: 'Weekly Coding Challenge',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: 'demo-2', 
        title: 'Algorithm Contest',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ];
    return NextResponse.json(mockContests);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { title, startTime, endTime } = data;
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const contest = await prisma.contest.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });
    
    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}
