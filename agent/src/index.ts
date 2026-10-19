import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processUserMessage } from './agent/agentLoop.js';
import { mcpClientManager } from './mcp/mcpClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const { message, history, confirmedToolCall } = req.body;

    if (confirmedToolCall) {
      const mcpClient = await mcpClientManager.getClient();
      const executionResult: any = await mcpClient.callTool({
        name: confirmedToolCall.name,
        arguments: confirmedToolCall.args,
      });

      const contentArray = (executionResult.content || []) as Array<any>;
      const text = contentArray.map((c) => c.text || '').join('\n');
      return res.json({ text });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processUserMessage(message, history || []);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /chat endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal Agent Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Agent Service running on port ${PORT}`);
});