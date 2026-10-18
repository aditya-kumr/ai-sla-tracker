import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ticketReadTools } from './tools/ticketTools.js';
import { updateTools } from './tools/updateTools.js';

const allTools = [...ticketReadTools, ...updateTools];

const server = new Server(
  {
    name: 'sla-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

// Handle tool execution with typed request parameter
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const tool = allTools.find((t) => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Tool not found: ${request.params.name}`);
  }

  try {
    return await tool.handler(request.params.arguments);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool '${request.params.name}': ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SLA MCP Server running over Stdio');
}

run().catch((err: any) => {
  console.error('Fatal error running MCP server:', err);
  process.exit(1);
});