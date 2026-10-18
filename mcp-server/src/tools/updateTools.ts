import { apiService } from '../services/api.js';

export const updateTools = [
  {
    name: 'update_ticket_status',
    description: 'Update the status of an existing ticket. Requires confirmation before execution.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Ticket ID to update' },
        status: { type: 'string', description: 'New status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' },
      },
      required: ['id', 'status'],
    },
    handler: async (args: any) => {
      const data = await apiService.put(`/tickets/${args.id}/status`, { status: args.status });
      return {
        content: [
          {
            type: 'text',
            text: `Successfully updated ticket #${args.id} status to ${args.status}.\n\n` + JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  },
];