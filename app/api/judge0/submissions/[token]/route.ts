import { NextRequest, NextResponse } from "next/server";

// This would be shared with the submissions route in a real app
// For now, we'll use a simple approach
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ 
      error: "Missing token parameter" 
    }, { status: 400 });
  }

  try {
    // Make a request to our submissions endpoint to get the result
    const baseUrl = req.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/judge0/submissions?token=${token}`);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: "Submission not found" 
      }, { status: 404 });
    }

    const submission = await response.json();
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error retrieving submission:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
