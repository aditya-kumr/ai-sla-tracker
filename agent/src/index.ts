import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { processUserMessage, ChatUserContext } from './agent/agentLoop.js';
import { mcpClientManager } from './mcp/mcpClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const requestStartTime = Date.now();
  try {
    const { message, history, confirmedToolCall, userContext } = req.body;

    const currentUser: ChatUserContext = userContext || {
      role: 'ROLE_AGENT',
      email: 'agent@company.com',
    };

    if (confirmedToolCall) {
      console.log(`[AGENT LOG] Executing Confirmed Tool: ${confirmedToolCall.name} | User: ${currentUser.email} (${currentUser.role})`);

      if (confirmedToolCall.name === 'delete_ticket' && currentUser.role !== 'ROLE_ADMIN') {
        console.warn(`[SECURITY WARN] Unauthorized action attempt by ${currentUser.email}`);
        return res.status(403).json({
          error: 'Forbidden: Your role does not have permission to execute this administrative action.',
        });
      }

      const mcpClient = await mcpClientManager.getClient();
      const executionResult: any = await mcpClient.callTool({
        name: confirmedToolCall.name,
        arguments: confirmedToolCall.args,
      });

      const contentArray = (executionResult.content || []) as Array<any>;
      const text = contentArray.map((c) => c.text || '').join('\n');

      console.log(`[AGENT LOG] Confirmed Action Completed in ${Date.now() - requestStartTime}ms`);
      return res.json({ text });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[AGENT LOG] Incoming Prompt: "${message}" | User: ${currentUser.email}`);
    const result = await processUserMessage(message, history || [], currentUser);

    console.log(`[AGENT LOG] Response Ready | Total Latency: ${Date.now() - requestStartTime}ms`);
    return res.json(result);
  } catch (error: any) {
    console.error(`[AGENT ERROR] Endpoint Exception: ${error.message}`);
    return res.status(500).json({ error: error.message || 'Internal Agent Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Hardened Agent Service running on port ${PORT}`);
});