const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding Supabase database...');

  try {
    // Create a sample user
    const user = await prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        username: 'demo_user',
        email: 'demo@example.com',
        name: 'Demo User',
      },
    });
    console.log('✅ Created user:', user.username);

    // Create a sample contest
    const contest = await prisma.contest.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Judge0 Programming Contest',
        startTime: new Date('2025-01-15T10:00:00Z'),
        endTime: new Date('2025-01-15T13:00:00Z'),
        disableCopyPaste: false,
        preventTabSwitching: false,
        requireFullScreen: false,
        blockNavigation: false,
        webcamMonitoring: false,
      },
    });
    console.log('✅ Created contest:', contest.title);

    // Create sample questions
    const question1 = await prisma.question.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        contestId: contest.id,
        title: 'Two Sum Problem',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        inputFormat: 'First line contains n (size of array)\nSecond line contains n space-separated integers\nThird line contains target integer',
        outputFormat: 'Two integers representing the indices (0-based) separated by space',
        constraints: '2 ≤ n ≤ 1000\n-1000 ≤ nums[i] ≤ 1000\n-2000 ≤ target ≤ 2000',
        sampleInput: '4\n2 7 11 15\n9',
        sampleOutput: '0 1',
        points: 100,
      },
    });

    const question2 = await prisma.question.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        contestId: contest.id,
        title: 'Palindrome Check',
        description: `Write a program to check if a given string is a palindrome.

A palindrome is a word, phrase, number, or other sequence of characters that reads the same forward and backward.`,
        inputFormat: 'A single line containing a string',
        outputFormat: 'Print "YES" if palindrome, "NO" otherwise',
        constraints: '1 ≤ length of string ≤ 1000\nString contains only lowercase letters',
        sampleInput: 'racecar',
        sampleOutput: 'YES',
        points: 50,
      },
    });

    console.log('✅ Created questions:', [question1.title, question2.title]);

    // Create test cases for Two Sum
    await prisma.testCase.createMany({
      data: [
        {
          questionId: question1.id,
          input: '4\n2 7 11 15\n9',
          output: '0 1',
          isHidden: false,
        },
        {
          questionId: question1.id,
          input: '3\n3 2 4\n6',
          output: '1 2',
          isHidden: true,
        },
        {
          questionId: question1.id,
          input: '2\n3 3\n6',
          output: '0 1',
          isHidden: true,
        },
      ],
      skipDuplicates: true,
    });

    // Create test cases for Palindrome Check
    await prisma.testCase.createMany({
      data: [
        {
          questionId: question2.id,
          input: 'racecar',
          output: 'YES',
          isHidden: false,
        },
        {
          questionId: question2.id,
          input: 'hello',
          output: 'NO',
          isHidden: true,
        },
        {
          questionId: question2.id,
          input: 'madam',
          output: 'YES',
          isHidden: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Created test cases');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Users: 1`);
    console.log(`- Contests: 1`);
    console.log(`- Questions: 2`);
    console.log(`- Test Cases: 6`);
    console.log('\n🌐 You can now visit http://localhost:3002/contests to see the contest!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
