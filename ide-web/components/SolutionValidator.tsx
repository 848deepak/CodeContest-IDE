"use client";
import React, { useState, useEffect, useCallback } from 'react';

interface CodeSubmission {
  code: string;
  language: string;
  timestamp: string;
  userId: string;
  questionId: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  suspiciousPatterns: string[];
  plagiarismScore: number;
  codeQualityScore: number;
  timeAnalysis: {
    submissionTime: number;
    averageTypingSpeed: number;
    suspiciouslyFast: boolean;
  };
}

interface SolutionValidatorProps {
  submission: CodeSubmission;
  previousSubmissions?: CodeSubmission[];
  onValidationComplete: (result: ValidationResult) => void;
  onSuspiciousActivity: (activity: string, details: string) => void;
}

export default function SolutionValidator({
  submission,
  previousSubmissions = [],
  onValidationComplete,
  onSuspiciousActivity
}: SolutionValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  // Suspicious patterns to detect
  const SUSPICIOUS_PATTERNS = {
    // Common copy-paste indicators
    UNUSUAL_FORMATTING: /\s{4,}|\t{2,}/g,
    MIXED_INDENTATION: /^(\t+).*\n^( +)/m,
    UNICODE_CHARACTERS: /[^\x00-\x7F]/g,
    EXCESSIVE_COMMENTS: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    
    // Potential obfuscation
    SINGLE_LETTER_VARS: /\b[a-z]\s*=/g,
    UNCLEAR_NAMING: /\b(var|temp|tmp|data|val|x|y|z)\d*\b/g,
    
    // Language-specific patterns
    PYTHON_UNUSUAL: /exec\s*\(|eval\s*\(|__import__/g,
    CPP_UNUSUAL: /#pragma|__asm__|inline\s+assembly/g,
    JAVA_UNUSUAL: /Runtime\.getRuntime\(\)|ProcessBuilder|reflection/g
  };

  // Code quality metrics
  const calculateCodeQuality = useCallback((code: string, language: string): number => {
    let score = 100;
    const lines = code.split('\n');
    
    // Check for proper indentation
    const indentationIssues = code.match(SUSPICIOUS_PATTERNS.MIXED_INDENTATION);
    if (indentationIssues) score -= 10;
    
    // Check for meaningful variable names
    const unclearVars = code.match(SUSPICIOUS_PATTERNS.UNCLEAR_NAMING);
    if (unclearVars && unclearVars.length > 3) score -= 15;
    
    // Check for excessive comments (might indicate copied code)
    const comments = code.match(SUSPICIOUS_PATTERNS.EXCESSIVE_COMMENTS);
    if (comments && comments.length > lines.length * 0.3) score -= 20;
    
    // Language-specific checks
    switch (language) {
      case 'python':
        if (code.includes('import *')) score -= 10;
        if (!code.includes('def ') && code.length > 100) score -= 5;
        break;
      case 'java':
        if (!code.includes('public class')) score -= 10;
        if (code.includes('public static void main') && !code.includes('Scanner')) score -= 5;
        break;
      case 'cpp':
        if (!code.includes('#include')) score -= 10;
        if (!code.includes('int main')) score -= 10;
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  }, []);

  // Plagiarism detection using simple similarity algorithm
  const calculateSimilarity = useCallback((code1: string, code2: string): number => {
    // Normalize code for comparison
    const normalize = (code: string) => {
      return code
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[{};,]/g, '')
        .replace(/\b(var|let|const|int|string|bool|double|float)\b/g, 'TYPE')
        .replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, 'VAR')
        .trim();
    };

    const norm1 = normalize(code1);
    const norm2 = normalize(code2);

    if (norm1.length === 0 || norm2.length === 0) return 0;

    // Calculate Levenshtein distance
    const matrix = Array(norm2.length + 1).fill(null).map(() => Array(norm1.length + 1).fill(null));

    for (let i = 0; i <= norm1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= norm2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= norm2.length; j++) {
      for (let i = 1; i <= norm1.length; i++) {
        const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    const distance = matrix[norm2.length][norm1.length];
    const maxLength = Math.max(norm1.length, norm2.length);
    
    return Math.max(0, 1 - distance / maxLength);
  }, []);

  // Analyze typing patterns and timing
  const analyzeTimingPatterns = useCallback((code: string, submissionTime: number): {
    averageTypingSpeed: number;
    suspiciouslyFast: boolean;
  } => {
    const codeLength = code.length;
    const typingSpeedWPM = (codeLength / 5) / (submissionTime / 60000); // Words per minute
    
    // Average programming typing speed is 20-40 WPM
    const suspiciouslyFast = typingSpeedWPM > 80 || (codeLength > 200 && submissionTime < 60000);
    
    return {
      averageTypingSpeed: typingSpeedWPM,
      suspiciouslyFast
    };
  }, []);

  // Main validation function
  const validateSubmission = useCallback(async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    const suspiciousPatterns: string[] = [];
    let plagiarismScore = 0;

    try {
      // Step 1: Basic code analysis
      setCurrentCheck("Analyzing code structure...");
      setValidationProgress(20);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time

      // Check for suspicious patterns
      Object.entries(SUSPICIOUS_PATTERNS).forEach(([patternName, pattern]) => {
        if (pattern.test(submission.code)) {
          suspiciousPatterns.push(patternName);
        }
      });

      // Step 2: Plagiarism check
      setCurrentCheck("Checking for plagiarism...");
      setValidationProgress(40);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      if (previousSubmissions.length > 0) {
        const similarities = previousSubmissions.map(prevSub => 
          calculateSimilarity(submission.code, prevSub.code)
        );
        plagiarismScore = Math.max(...similarities) * 100;
        
        if (plagiarismScore > 80) {
          suspiciousPatterns.push('HIGH_SIMILARITY');
          onSuspiciousActivity(
            'POTENTIAL_PLAGIARISM', 
            `Code similarity of ${plagiarismScore.toFixed(1)}% detected`
          );
        }
      }

      // Step 3: Code quality analysis
      setCurrentCheck("Evaluating code quality...");
      setValidationProgress(60);
      
      await new Promise(resolve => setTimeout(resolve, 600));

      const codeQualityScore = calculateCodeQuality(submission.code, submission.language);

      // Step 4: Timing analysis
      setCurrentCheck("Analyzing submission timing...");
      setValidationProgress(80);
      
      await new Promise(resolve => setTimeout(resolve, 400));

      const submissionTimeMs = new Date(submission.timestamp).getTime();
      const timeAnalysis = analyzeTimingPatterns(submission.code, submissionTimeMs);

      if (timeAnalysis.suspiciouslyFast) {
        suspiciousPatterns.push('SUSPICIOUS_TIMING');
        onSuspiciousActivity(
          'FAST_SUBMISSION', 
          `Unusually fast submission: ${timeAnalysis.averageTypingSpeed.toFixed(1)} WPM`
        );
      }

      // Step 5: Final validation
      setCurrentCheck("Finalizing validation...");
      setValidationProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const finalResult: ValidationResult = {
        isValid: suspiciousPatterns.length === 0 || plagiarismScore < 50,
        score: Math.max(0, 100 - suspiciousPatterns.length * 15 - Math.max(0, plagiarismScore - 50)),
        suspiciousPatterns,
        plagiarismScore,
        codeQualityScore,
        timeAnalysis: {
          submissionTime: submissionTimeMs,
          ...timeAnalysis
        }
      };

      setResult(finalResult);
      onValidationComplete(finalResult);

    } catch (error) {
      console.error('Validation error:', error);
      onSuspiciousActivity('VALIDATION_ERROR', `Error during validation: ${error}`);
    } finally {
      setIsValidating(false);
      setCurrentCheck("");
    }
  }, [
    submission, 
    previousSubmissions, 
    calculateSimilarity, 
    calculateCodeQuality, 
    analyzeTimingPatterns,
    onValidationComplete, 
    onSuspiciousActivity
  ]);

  // Auto-validate when submission changes
  useEffect(() => {
    if (submission.code && submission.code.trim().length > 0) {
      validateSubmission();
    }
  }, [submission, validateSubmission]);

  return (
    <div className="solution-validator bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Solution Validation</h3>
        {isValidating && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-600">Validating...</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isValidating && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{currentCheck}</span>
            <span>{validationProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${validationProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Validation results */}
      {result && !isValidating && (
        <div className="space-y-4">
          {/* Overall status */}
          <div className={`p-3 rounded-lg ${
            result.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-medium ${
                result.isValid ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.isValid ? '✓ Validation Passed' : '⚠ Validation Issues'}
              </span>
              <span className={`text-sm ${
                result.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                Score: {result.score}/100
              </span>
            </div>
          </div>

          {/* Detailed metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Code Quality:</span>
                <span className={`font-medium ${
                  result.codeQualityScore >= 80 ? 'text-green-600' : 
                  result.codeQualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.codeQualityScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plagiarism Risk:</span>
                <span className={`font-medium ${
                  result.plagiarismScore < 30 ? 'text-green-600' : 
                  result.plagiarismScore < 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.plagiarismScore.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Typing Speed:</span>
                <span className={`font-medium ${
                  result.timeAnalysis.suspiciouslyFast ? 'text-red-600' : 'text-green-600'
                }`}>
                  {result.timeAnalysis.averageTypingSpeed.toFixed(1)} WPM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issues Found:</span>
                <span className={`font-medium ${
                  result.suspiciousPatterns.length === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.suspiciousPatterns.length}
                </span>
              </div>
            </div>
          </div>

          {/* Suspicious patterns */}
          {result.suspiciousPatterns.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="font-medium text-yellow-800 mb-2">Detected Issues:</h4>
              <ul className="space-y-1 text-sm text-yellow-700">
                {result.suspiciousPatterns.map((pattern, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                    <span>{pattern.replace(/_/g, ' ').toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              {result.codeQualityScore < 70 && (
                <li>• Improve code structure and variable naming</li>
              )}
              {result.plagiarismScore > 50 && (
                <li>• Ensure originality of solution</li>
              )}
              {result.timeAnalysis.suspiciouslyFast && (
                <li>• Review submission timing patterns</li>
              )}
              {result.suspiciousPatterns.length === 0 && (
                <li>• Great job! No issues detected</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Manual re-validation button */}
      {result && !isValidating && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={validateSubmission}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm"
          >
            Re-validate Solution
          </button>
        </div>
      )}
    </div>
  );
}