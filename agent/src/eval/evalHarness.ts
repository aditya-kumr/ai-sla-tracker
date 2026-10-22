import dotenv from 'dotenv';
dotenv.config();

import { processUserMessage } from '../agent/agentLoop.js';

interface TestCase {
  id: number;
  prompt: string;
  expectedKeywords: string[];
}

const testCases: TestCase[] = [
  {
    id: 1,
    prompt: 'What is the SLA resolution target for CRITICAL tickets?',
    expectedKeywords: ['2 hours', 'critical'],
  },
  {
    id: 2,
    prompt: 'Who should breached tickets be escalated to?',
    expectedKeywords: ['ops-manager@company.com', 'operations manager'],
  },
  {
    id: 3,
    prompt: 'Show details for non-existent ticket #888888',
    expectedKeywords: ['not found'],
  },
  {
    id: 4,
    prompt: 'What is the SLA resolution target for HIGH tickets?',
    expectedKeywords: ['8 hours'],
  },
  {
    id: 5,
    prompt: 'Who is the contact for Security Incident Response?',
    expectedKeywords: ['sirt@company.com'],
  }
];

async function runEvaluation() {
  console.log('=== STARTING AGENT EVALUATION HARNESS ===\n');
  let passed = 0;

  for (const test of testCases) {
    console.log(`[TEST #${test.id}] Prompt: "${test.prompt}"`);
    try {
      const result = await processUserMessage(test.prompt, []);
      const output = (result.text || '').toLowerCase();

      const isPass = test.expectedKeywords.some((keyword) => output.includes(keyword.toLowerCase()));

      if (isPass) {
        console.log(`✅ PASSED\n`);
        passed++;
      } else {
        console.log(`❌ FAILED | Output: "${result.text}" | Expected one of: ${JSON.stringify(test.expectedKeywords)}\n`);
      }
    } catch (err: any) {
      console.log(`❌ ERROR: ${err.message}\n`);
    }
  }

  console.log(`=== EVALUATION SUMMARY: ${passed}/${testCases.length} Passed (${Math.round((passed / testCases.length) * 100)}%) ===`);
}

runEvaluation();