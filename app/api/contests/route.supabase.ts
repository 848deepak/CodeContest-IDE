import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const contests = await db.contests.findMany();
    return NextResponse.json({ contests });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const contest = await db.contests.create({
      title: data.title,
      start_time: data.startTime,
      end_time: data.endTime,
      disable_copy_paste: data.disableCopyPaste || false,
      prevent_tab_switching: data.preventTabSwitching || false,
      require_full_screen: data.requireFullScreen || false,
      block_navigation: data.blockNavigation || false,
      webcam_monitoring: data.webcamMonitoring || false,
    });

    return NextResponse.json({ contest });
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}
