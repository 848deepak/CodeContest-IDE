import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { contestId, userId, violationType, details, screenshotUrl } = await request.json();
    
    // Get user ID from session if not provided
    const actualUserId = userId || 'anonymous'; // In a real app, get from session
    
    // Log the violation using the Prisma model instead of raw SQL
    const violation = await prisma.securityViolation.create({
      data: {
        userId: actualUserId,
        contestId,
        violationType: violationType || 'GENERAL',
        details: details || 'Security violation detected',
        screenshotUrl: screenshotUrl || null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging violation:', error);
    return NextResponse.json(
      { error: 'Failed to log violation' },
      { status: 500 }
    );
  }
}
