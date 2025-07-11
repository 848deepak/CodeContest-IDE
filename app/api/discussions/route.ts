import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contestId = searchParams.get('contestId');
    
    if (!contestId) {
      return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 });
    }

    const discussions = await prisma.discussion.findMany({
      where: { contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { isSticky: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ discussions });

  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contestId, userId, title, content } = await request.json();

    if (!contestId || !userId || !title || !content) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const discussion = await prisma.discussion.create({
      data: {
        contestId,
        userId,
        title,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ discussion }, { status: 201 });

  } catch (error) {
    console.error('Error creating discussion:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}
