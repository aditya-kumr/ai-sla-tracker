import { GoogleGenAI } from '@google/genai';
import { mcpClientManager } from '../mcp/mcpClient.js';

const ai = new GoogleGenAI();

export async function processUserMessage(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; parts: string }> = []
) {
  const mcpClient = await mcpClientManager.getClient();

  // Fetch available tools dynamically from MCP Server
  const toolsResult = await mcpClient.listTools();
  const mcpTools = toolsResult.tools;

  // Convert MCP tool schemas to Gemini function declarations
  const geminiTools = mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }));

  const systemInstruction = `
    You are an AI SLA Assistant for operational ticket management.
    You answer questions and take actions strictly by using available tools.
    - Read tools (list_tickets, get_ticket, get_at_risk_tickets) can be executed directly.
    - Write tools (update_ticket_status) require user confirmation.
    If no tool execution is needed, answer directly and concisely.
  `;

  // Initiate Gemini Chat session with dynamic tools
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.parts }] })),
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: geminiTools as any }],
    },
  });

  const candidate = response.candidates?.[0];
  const functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall);

  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0].functionCall;
    if (!call || !call.name) throw new Error('Invalid function call format');

    const args = (call.args || {}) as Record<string, any>;

    // Handle Write Confirmation Guardrail
    if (call.name === 'update_ticket_status') {
      return {
        requiresConfirmation: true,
        toolCall: {
          name: call.name,
          args,
        },
        message: `Are you sure you want to update ticket #${args.id} status to '${args.status}'?`,
      };
    }

    // Execute Read Tool directly over MCP
    const toolExecutionResult: any = await mcpClient.callTool({
      name: call.name,
      arguments: args,
    });

    const contentArray = (toolExecutionResult.content || []) as Array<any>;
    const resultText = contentArray.map((c) => c.text || '').join('\n');

    // Return context back to LLM to summarize
    const finalSummary = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userMessage }] },
        {
          role: 'model',
          parts: [{ text: `Executed tool ${call.name} with result: ${resultText}` }],
        },
        {
          role: 'user',
          parts: [{ text: 'Summarize the result for the user concisely and clearly.' }],
        },
      ],
    });

    return {
      text: finalSummary.text,
      toolCallExecuted: call.name,
    };
  }

  return {
    text: response.text,
  };
}