import { z } from 'zod';
import { apiService } from '../services/api.js';

export const ticketReadTools = [
  {
    name: 'list_tickets',
    description: 'List paginated tickets from the system with optional status and priority filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' },
        priority: { type: 'string', description: 'Filter by priority (LOW, MEDIUM, HIGH, CRITICAL)' },
        page: { type: 'number', description: 'Page number (0-indexed, default 0)' },
        size: { type: 'number', description: 'Number of tickets per page (default 10)' },
      },
    },
    handler: async (args: any) => {
      const params = {
        status: args.status,
        priority: args.priority,
        page: args.page ?? 0,
        size: args.size ?? 10,
      };
      const data = await apiService.get('/tickets', params);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'get_ticket',
    description: 'Get detailed info for a single ticket by its numerical ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Ticket ID' },
      },
      required: ['id'],
    },
    handler: async (args: any) => {
      const data = await apiService.get(`/tickets/${args.id}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  },
  {
    name: 'get_at_risk_tickets',
    description: 'Fetch all unresolved tickets that are near or past SLA breach deadline within specified hours.',
    inputSchema: {
      type: 'object',
      properties: {
        thresholdHours: { type: 'number', description: 'Hours before SLA breach (default 4 hours)' },
      },
    },
    handler: async (args: any) => {
      const thresholdHours = args.thresholdHours ?? 4;
      const data = await apiService.get('/tickets/at-risk', { hours: thresholdHours });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    },
  },
];