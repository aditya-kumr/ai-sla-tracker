import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function searchPolicyRunbooks(query: string): string {
  const runbooksDir = path.resolve(__dirname, '../../../docs/runbooks');
  
  if (!fs.existsSync(runbooksDir)) {
    return 'No policy runbooks directory found.';
  }

  const files = fs.readdirSync(runbooksDir);
  let aggregatedResults = '';
  const lowerQuery = query.toLowerCase();

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(runbooksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const lines = content.split('\n');
      const matchingLines = lines.filter((line) =>
        line.toLowerCase().includes(lowerQuery) || lowerQuery.split(' ').some(w => w.length > 3 && line.toLowerCase().includes(w))
      );

      if (matchingLines.length > 0) {
        aggregatedResults += `\n--- Source: ${file} ---\n` + matchingLines.join('\n');
      }
    }
  }

  return aggregatedResults || 'No matching policy runbook guidelines found.';
}