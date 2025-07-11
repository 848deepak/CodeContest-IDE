import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/* eslint-disable @typescript-eslint/no-explicit-any */

// List test cases for a question
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');
    
    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }
    
    const testCases = await prisma.testCase.findMany({
      where: { questionId },
      orderBy: { createdAt: 'asc' },
    });
    
    return NextResponse.json(testCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

// Add a test case
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { questionId, input, output, isHidden } = data;
    
    if (!questionId || input === undefined || output === undefined || isHidden === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const testCase = await prisma.testCase.create({
      data: {
        questionId,
        input,
        output,
        isHidden,
      },
    });
    
    return NextResponse.json(testCase);
  } catch (error) {
    console.error('Error creating test case:', error);
    return NextResponse.json({ error: 'Failed to create test case' }, { status: 500 });
  }
}

// Update a test case
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Handle bulk update for all test cases of a question
    if (data.questionId && data.testCases) {
      const { questionId, testCases } = data;
      
      // Delete existing test cases for this question
      await prisma.testCase.deleteMany({
        where: { questionId }
      });
      
      // Create new test cases
      if (testCases.length > 0) {
        await prisma.testCase.createMany({
          data: testCases.map((tc: any) => ({
            questionId,
            input: tc.input,
            output: tc.output,
            isHidden: tc.isHidden || false,
          }))
        });
      }
      
      const updatedTestCases = await prisma.testCase.findMany({
        where: { questionId },
        orderBy: { createdAt: 'asc' },
      });
      
      return NextResponse.json(updatedTestCases);
    }
    
    // Handle single test case update
    const { id, input, output, isHidden } = data;
    
    if (!id || input === undefined || output === undefined || isHidden === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const testCase = await prisma.testCase.update({
      where: { id },
      data: { input, output, isHidden },
    });
    
    return NextResponse.json(testCase);
  } catch (error) {
    console.error('Error updating test case:', error);
    return NextResponse.json({ error: 'Failed to update test case' }, { status: 500 });
  }
}

// Delete a test case
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    await prisma.testCase.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test case:', error);
    return NextResponse.json({ error: 'Failed to delete test case' }, { status: 500 });
  }
}
