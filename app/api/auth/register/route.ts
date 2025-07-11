import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, email, name } = await request.json();

    if (!username || !email || !name) {
      return NextResponse.json(
        { error: 'Username, email, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ user }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
