import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class McpClientManager {
  private client: Client | null = null;

  public async getClient(): Promise<Client> {
    if (this.client) return this.client;

    const serverPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');

    const transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    this.client = new Client(
      { name: 'sla-agent-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await this.client.connect(transport);
    console.log('Successfully connected to MCP Server via Stdio');
    return this.client;
  }
}

export const mcpClientManager = new McpClientManager();