import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// List questions for a contest
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contestId = searchParams.get('contestId');
    const questionId = searchParams.get('questionId');
    
    if (!contestId) {
      return NextResponse.json({ error: 'Missing contestId' }, { status: 400 });
    }
    
    let questions;
    if (questionId) {
      // Get specific question with test cases
      questions = await prisma.question.findMany({
        where: { 
          contestId,
          id: questionId 
        },
        include: {
          testCases: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      // Get all questions for contest
      questions = await prisma.question.findMany({
        where: { contestId },
        include: {
          testCases: true,
        },
        orderBy: { createdAt: 'asc' },
      });
    }
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// Add a question to a contest
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { contestId, title, description, inputFormat, outputFormat, constraints, sampleInput, sampleOutput, points } = data;
    
    if (!contestId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields: contestId, title, description' }, { status: 400 });
    }
    
    const question = await prisma.question.create({
      data: {
        contestId,
        title,
        description,
        inputFormat: inputFormat || "",
        outputFormat: outputFormat || "",
        constraints: constraints || "",
        sampleInput: sampleInput || "",
        sampleOutput: sampleOutput || "",
        points: points || 100,
      },
    });
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

// Update a question
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, title, description, inputFormat, outputFormat, constraints, sampleInput, sampleOutput, points } = data;
    
    if (!id || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields: id, title, description' }, { status: 400 });
    }
    
    const question = await prisma.question.update({
      where: { id },
      data: { 
        title, 
        description, 
        inputFormat: inputFormat || "",
        outputFormat: outputFormat || "",
        constraints: constraints || "",
        sampleInput: sampleInput || "",
        sampleOutput: sampleOutput || "",
        points: points || 100,
      },
    });
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// Delete a question
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
