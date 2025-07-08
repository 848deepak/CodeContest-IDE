import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Create or login user (simplified for demo)
export async function POST(req: NextRequest) {
  try {
    const { username, email, name } = await req.json();
    
    if (!username || !email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          username,
          email,
          name
        }
      });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error with user:', error);
    return NextResponse.json({ error: 'Failed to process user' }, { status: 500 });
  }
}

// Get all users (admin only)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
