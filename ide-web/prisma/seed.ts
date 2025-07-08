import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { username: 'demo_user' },
    update: {},
    create: {
      username: 'demo_user',
      email: 'demo@example.com',
      name: 'Demo User',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@example.com',
      name: 'Alice Johnson',
    },
  });

  // Create sample contest
  const contest = await prisma.contest.upsert({
    where: { id: 'sample-contest-1' },
    update: {},
    create: {
      id: 'sample-contest-1',
      title: 'Sample Programming Contest',
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-12-31T14:00:00Z'),
    },
  });

  // Create sample questions
  const question1 = await prisma.question.upsert({
    where: { id: 'q1' },
    update: {},
    create: {
      id: 'q1',
      contestId: contest.id,
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      inputFormat: 'First line contains space-separated integers representing the array.\nSecond line contains the target integer.',
      outputFormat: 'Return the indices of the two numbers that add up to target, separated by space.',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
      sampleInput: '2 7 11 15\n9',
      sampleOutput: '0 1',
      points: 100,
    },
  });

  const question2 = await prisma.question.upsert({
    where: { id: 'q2' },
    update: {},
    create: {
      id: 'q2',
      contestId: contest.id,
      title: 'Palindrome Number',
      description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
      inputFormat: 'A single integer x.',
      outputFormat: 'Print "true" if the number is a palindrome, "false" otherwise.',
      constraints: '-2^31 <= x <= 2^31 - 1',
      sampleInput: '121',
      sampleOutput: 'true',
      points: 150,
    },
  });

  // Create test cases for question 1
  await prisma.testCase.createMany({
    data: [
      {
        questionId: question1.id,
        input: '2 7 11 15\n9',
        output: '0 1',
        isHidden: false,
      },
      {
        questionId: question1.id,
        input: '3 2 4\n6',
        output: '1 2',
        isHidden: false,
      },
      {
        questionId: question1.id,
        input: '3 3\n6',
        output: '0 1',
        isHidden: true,
      },
      {
        questionId: question1.id,
        input: '1 2 3 4 5\n8',
        output: '2 4',
        isHidden: true,
      },
    ],
  });

  // Create test cases for question 2
  await prisma.testCase.createMany({
    data: [
      {
        questionId: question2.id,
        input: '121',
        output: 'true',
        isHidden: false,
      },
      {
        questionId: question2.id,
        input: '-121',
        output: 'false',
        isHidden: false,
      },
      {
        questionId: question2.id,
        input: '10',
        output: 'false',
        isHidden: true,
      },
      {
        questionId: question2.id,
        input: '12321',
        output: 'true',
        isHidden: true,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
