import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { discussionId, userId, content, parentId } = await request.json();

    if (!discussionId || !userId || !content) {
      return NextResponse.json(
        { error: 'Discussion ID, user ID, and content are required' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        discussionId,
        userId,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        replies: {
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
      }
    });

    return NextResponse.json({ comment }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const discussionId = searchParams.get('discussionId');
    
    if (!discussionId) {
      return NextResponse.json({ error: 'Discussion ID is required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { 
        discussionId,
        parentId: null // Only get top-level comments, replies are included via relations
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        replies: {
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
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
