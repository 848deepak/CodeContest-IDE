import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { securitySettings } = await req.json();
    
    // Update security settings for the contest
    const contest = await prisma.contest.update({
      where: { id },
      data: {
        requireFullScreen: securitySettings.requireFullScreen ?? true,
        disableCopyPaste: securitySettings.disableCopyPaste ?? true,
        preventTabSwitching: securitySettings.preventTabSwitching ?? true,
        requireWebcamMonitoring: securitySettings.requireWebcamMonitoring ?? false
      },
    });
    
    return NextResponse.json(contest);
  } catch (error) {
    console.error('Error updating contest security settings:', error);
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}
