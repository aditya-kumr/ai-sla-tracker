import { GoogleGenAI } from '@google/genai';
import { mcpClientManager } from '../mcp/mcpClient.js';
import { searchPolicyRunbooks } from './ragService.js';

export interface ChatUserContext {
  role: 'ROLE_ADMIN' | 'ROLE_AGENT';
  email: string;
}

// Declare policy RAG tool specification
const policyTool = {
  name: 'search_policy_runbooks',
  description: 'Search operational policy runbooks for SLA targets, escalation guidelines, on-call contacts, and priority definitions.',
  parameters: {
    type: 'OBJECT',
    properties: {
      query: { 
        type: 'STRING', 
        description: 'Keywords or query regarding policies, SLAs, on-call contacts, or priority rules' 
      },
    },
    required: ['query'],
  },
};

export async function processUserMessage(
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; parts: string }> = [],
  userContext: ChatUserContext = { role: 'ROLE_AGENT', email: 'agent@company.com' }
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  // Explicitly instantiate GoogleGenAI with valid API key
  const ai = new GoogleGenAI({ apiKey });

  const mcpClient = await mcpClientManager.getClient();

  const toolsResult = await mcpClient.listTools();
  const mcpTools = toolsResult.tools;

  const geminiTools = mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  }));

  // Combine dynamic MCP tools and the policy RAG tool
  const allTools = [...geminiTools, policyTool];

  const systemInstruction = `
    You are an AI SLA Assistant for operational ticket management.
    User Role: ${userContext.role} (User Email: ${userContext.email}).

    GROUNDING & TRUTHFULNESS RULES:
    1. Answer ONLY using data retrieved from tool responses, official policy runbooks, or system results.
    2. NEVER invent, hallucinate, or guess ticket details, IDs, SLA dates, contacts, or policy guidelines.
    3. If a ticket or policy guideline is not found, explicitly state: "The requested ticket or information was not found."

    ROLE-BASED GUARDRAILS:
    1. ROLE_AGENT users CANNOT perform delete operations or execute administrative mutating actions.
    2. Write actions (update_ticket_status) require explicit user confirmation.

    TOOL SELECTION RULES:
    - For querying tickets: use list_tickets, get_ticket, or get_at_risk_tickets.
    - For operational policies, SLA rules, priority matrix, or contacts: use search_policy_runbooks.
    - For status updates: call update_ticket_status.
    - If no tool execution is required, answer directly and concisely.
  `;

  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        ...history.map((h) => ({ role: h.role, parts: [{ text: h.parts }] })),
        { role: 'user', parts: [{ text: userMessage }] },
      ],
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: allTools as any }],
      },
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0].functionCall;
      if (!call || !call.name) throw new Error('Invalid function call format');

      const args = (call.args || {}) as Record<string, any>;

      console.log(`[AGENT LOG] Tool Requested: ${call.name} | Args: ${JSON.stringify(args)} | User: ${userContext.email}`);

      // 1. Handle Write Confirmation Guardrail
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

      // 2. Handle RAG Policy Runbook Search Tool Execution
      if (call.name === 'search_policy_runbooks') {
        const query = (args.query as string) || userMessage;
        const policyResult = searchPolicyRunbooks(query);
        console.log(`[AGENT LOG] Executed RAG Policy Search | Query: "${query}" | Latency: ${Date.now() - startTime}ms`);

        const finalSummary = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ text: `Policy Search Result:\n${policyResult}` }] },
            { role: 'user', parts: [{ text: 'Answer the user prompt accurately using ONLY the policy information provided above.' }] },
          ],
        });

        return {
          text: finalSummary.text || policyResult,
          toolCallExecuted: call.name,
        };
      }

      // 3. Handle MCP Tool Execution
      const toolExecutionResult: any = await mcpClient.callTool({
        name: call.name,
        arguments: args,
      });

      const contentArray = (toolExecutionResult.content || []) as Array<any>;
      const resultText = contentArray.map((c) => c.text || '').join('\n');

      console.log(`[AGENT LOG] Tool Executed: ${call.name} | Latency: ${Date.now() - startTime}ms`);

      const finalSummary = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: userMessage }] },
          {
            role: 'model',
            parts: [{ text: `Tool '${call.name}' returned: ${resultText}` }],
          },
          {
            role: 'user',
            parts: [{ text: 'Summarize the result accurately without adding extra unverified facts.' }],
          },
        ],
      });

      return {
        text: finalSummary.text || resultText || 'Task completed successfully.',
        toolCallExecuted: call.name,
      };
    }

    const responseText = response.text || candidate?.content?.parts?.[0]?.text || 'No response generated.';
    return { text: responseText };
  } catch (error: any) {
    console.error(`[AGENT ERROR] Failed processing message: ${error.message}`);
    return {
      text: `An error occurred while processing your request: ${error.message || 'Unknown agent error.'}`,
    };
  }
}