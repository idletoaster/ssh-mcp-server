#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { SSHClient } from './lib/ssh-client.js';

/**
 * SSH MCP Server
 * Enables AI assistants to execute SSH commands on remote servers
 * Built with official Model Context Protocol SDK
 */

const SSH_TOOL = {
  name: 'remote-ssh',
  description: 'Execute SSH commands on remote servers with private key authentication',
  inputSchema: {
    type: 'object',
    properties: {
      host: {
        type: 'string',
        description: 'Remote server hostname or IP address'
      },
      user: {
        type: 'string', 
        description: 'SSH username'
      },
      command: {
        type: 'string',
        description: 'Command to execute on remote server'
      },
      privateKeyPath: {
        type: 'string',
        description: 'Path to SSH private key (optional, falls back to SSH_PRIVATE_KEY env var)',
        optional: true
      },
      port: {
        type: 'number',
        description: 'SSH port (default: 22)',
        optional: true,
        default: 22
      }
    },
    required: ['host', 'user', 'command']
  }
};

class SSHMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ssh-mcp-server',
        version: '2.0.2',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [SSH_TOOL],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name !== 'remote-ssh') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      try {
        return await this.executeSSHCommand(args);
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `SSH command failed: ${error.message}`
        );
      }
    });
  }

  async executeSSHCommand(args) {
    const { host, user, command, privateKeyPath, port = 22 } = args;

    // Validate required parameters
    if (!host || !user || !command) {
      throw new Error('Missing required parameters: host, user, command');
    }

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host,
        user,
        command,
        privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY,
        port
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              output: result.output,
              error: result.error || null,
              exitCode: result.exitCode || 0,
              host,
              command
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text', 
            text: JSON.stringify({
              success: false,
              output: '',
              error: error.message,
              exitCode: 1,
              host,
              command
            }, null, 2)
          }
        ]
      };
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SSH MCP Server running on stdio (Node.js v2.0.2)');
  }
}

// Start the server
const server = new SSHMCPServer();
server.start().catch(console.error);
