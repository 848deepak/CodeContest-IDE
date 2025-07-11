import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { userId, contestId, type, details, evidence } = data;

    // For now, just log the violation since we don't have the security_violations table
    console.log('Security violation logged:', {
      userId,
      contestId,
      type,
      details,
      evidence,
      timestamp: new Date().toISOString()
    });

    // You can later add this to Supabase or create the security_violations table
    // const violation = await prisma.securityViolation.create({
    //   data: {
    //     userId,
    //     contestId,
    //     type,
    //     details,
    //     evidence,
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Violation logged successfully' 
    });
  } catch (error) {
    console.error('Error logging violation:', error);
    return NextResponse.json({ 
      error: 'Failed to log violation' 
    }, { status: 500 });
  }
}