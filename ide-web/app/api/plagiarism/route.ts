import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Simple plagiarism detection using similarity metrics
function calculateSimilarity(code1: string, code2: string): number {
  // Normalize code by removing whitespace and comments
  const normalize = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[{}();,]/g, '') // Remove common punctuation
      .toLowerCase()
      .trim();
  };

  const normalizedCode1 = normalize(code1);
  const normalizedCode2 = normalize(code2);

  // Calculate Jaccard similarity using n-grams
  const getNGrams = (text: string, n: number = 3): Set<string> => {
    const grams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      grams.add(text.substring(i, i + n));
    }
    return grams;
  };

  const grams1 = getNGrams(normalizedCode1);
  const grams2 = getNGrams(normalizedCode2);

  const intersection = new Set([...grams1].filter(x => grams2.has(x)));
  const union = new Set([...grams1, ...grams2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

// Calculate Levenshtein distance for more precise similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

function calculateLevenshteinSimilarity(code1: string, code2: string): number {
  const distance = levenshteinDistance(code1, code2);
  const maxLength = Math.max(code1.length, code2.length);
  return maxLength > 0 ? 1 - distance / maxLength : 1;
}

export async function POST(request: NextRequest) {
  try {
    const { contestId, threshold = 0.7 } = await request.json();

    if (!contestId) {
      return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 });
    }

    // Get all submissions for the contest
    const submissions = await prisma.submission.findMany({
      where: { contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        question: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        submittedAt: 'asc'
      }
    });

    const suspiciousPairs: Array<{
      submission1: any;
      submission2: any;
      similarity: number;
      method: string;
    }> = [];

    // Compare each submission with every other submission for the same question
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const sub1 = submissions[i];
        const sub2 = submissions[j];

        // Only compare submissions for the same question
        if (sub1.questionId !== sub2.questionId) continue;
        
        // Don't compare submissions from the same user
        if (sub1.userId === sub2.userId) continue;

        // Calculate similarities using multiple methods
        const jaccardSimilarity = calculateSimilarity(sub1.code, sub2.code);
        const levenshteinSimilarity = calculateLevenshteinSimilarity(sub1.code, sub2.code);
        
        // Use the higher similarity score
        const maxSimilarity = Math.max(jaccardSimilarity, levenshteinSimilarity);
        const method = jaccardSimilarity > levenshteinSimilarity ? 'Jaccard' : 'Levenshtein';

        if (maxSimilarity >= threshold) {
          suspiciousPairs.push({
            submission1: sub1,
            submission2: sub2,
            similarity: maxSimilarity,
            method
          });
        }
      }
    }

    // Sort by similarity score (highest first)
    suspiciousPairs.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      totalSubmissions: submissions.length,
      suspiciousPairs: suspiciousPairs.length,
      threshold,
      results: suspiciousPairs.map(pair => ({
        similarity: Math.round(pair.similarity * 100),
        method: pair.method,
        question: pair.submission1.question.title,
        users: [
          {
            id: pair.submission1.user.id,
            username: pair.submission1.user.username,
            name: pair.submission1.user.name,
            submissionId: pair.submission1.id,
            submittedAt: pair.submission1.submittedAt,
          },
          {
            id: pair.submission2.user.id,
            username: pair.submission2.user.username,
            name: pair.submission2.user.name,
            submissionId: pair.submission2.id,
            submittedAt: pair.submission2.submittedAt,
          }
        ]
      }))
    });

  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return NextResponse.json(
      { error: 'Failed to check plagiarism' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submission1Id = searchParams.get('submission1');
    const submission2Id = searchParams.get('submission2');

    if (!submission1Id || !submission2Id) {
      return NextResponse.json(
        { error: 'Both submission IDs are required' },
        { status: 400 }
      );
    }

    const [sub1, sub2] = await Promise.all([
      prisma.submission.findUnique({
        where: { id: submission1Id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            }
          },
          question: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      }),
      prisma.submission.findUnique({
        where: { id: submission2Id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            }
          },
          question: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })
    ]);

    if (!sub1 || !sub2) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const jaccardSimilarity = calculateSimilarity(sub1.code, sub2.code);
    const levenshteinSimilarity = calculateLevenshteinSimilarity(sub1.code, sub2.code);

    return NextResponse.json({
      submission1: {
        id: sub1.id,
        user: sub1.user,
        question: sub1.question,
        code: sub1.code,
        submittedAt: sub1.submittedAt,
      },
      submission2: {
        id: sub2.id,
        user: sub2.user,
        question: sub2.question,
        code: sub2.code,
        submittedAt: sub2.submittedAt,
      },
      similarity: {
        jaccard: Math.round(jaccardSimilarity * 100),
        levenshtein: Math.round(levenshteinSimilarity * 100),
        overall: Math.round(Math.max(jaccardSimilarity, levenshteinSimilarity) * 100)
      }
    });

  } catch (error) {
    console.error('Error comparing submissions:', error);
    return NextResponse.json(
      { error: 'Failed to compare submissions' },
      { status: 500 }
    );
  }
}
