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
 * SSH MCP Server v2.1.7 - Enhanced with Desktop Commander functionality
 * Enables AI assistants to execute SSH commands with token-efficient file operations
 * Built with official Model Context Protocol SDK
 */

const SSH_TOOLS = [
  {
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
  },
  {
    name: 'ssh-edit-block',
    description: 'Edit specific text blocks in remote files (token-efficient alternative to full rewrites)',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Remote server hostname or IP address' },
        user: { type: 'string', description: 'SSH username' },
        filePath: { type: 'string', description: 'Path to file on remote server' },
        oldText: { type: 'string', description: 'Text to find and replace' },
        newText: { type: 'string', description: 'Replacement text' },
        expectedReplacements: { type: 'number', description: 'Expected number of replacements (default: 1)', optional: true, default: 1 },
        privateKeyPath: { type: 'string', description: 'Path to SSH private key (optional)', optional: true },
        port: { type: 'number', description: 'SSH port (default: 22)', optional: true, default: 22 }
      },
      required: ['host', 'user', 'filePath', 'oldText', 'newText']
    }
  },
  {
    name: 'ssh-read-lines',
    description: 'Read specific lines from remote files (token-efficient for large files)',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Remote server hostname or IP address' },
        user: { type: 'string', description: 'SSH username' },
        filePath: { type: 'string', description: 'Path to file on remote server' },
        startLine: { type: 'number', description: 'Starting line number (1-based)', optional: true, default: 1 },
        endLine: { type: 'number', description: 'Ending line number (optional, reads to end if not specified)', optional: true },
        maxLines: { type: 'number', description: 'Maximum lines to read (default: 100)', optional: true, default: 100 },
        privateKeyPath: { type: 'string', description: 'Path to SSH private key (optional)', optional: true },
        port: { type: 'number', description: 'SSH port (default: 22)', optional: true, default: 22 }
      },
      required: ['host', 'user', 'filePath']
    }
  },
  {
    name: 'ssh-search-code',
    description: 'Search for patterns in remote files without reading full content (token-efficient)',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Remote server hostname or IP address' },
        user: { type: 'string', description: 'SSH username' },
        path: { type: 'string', description: 'Directory path to search on remote server' },
        pattern: { type: 'string', description: 'Text pattern to search for' },
        filePattern: { type: 'string', description: 'File pattern (e.g., "*.js", "*.py")', optional: true },
        ignoreCase: { type: 'boolean', description: 'Case-insensitive search', optional: true, default: false },
        maxResults: { type: 'number', description: 'Maximum number of results', optional: true, default: 50 },
        contextLines: { type: 'number', description: 'Lines of context around matches', optional: true, default: 2 },
        privateKeyPath: { type: 'string', description: 'Path to SSH private key (optional)', optional: true },
        port: { type: 'number', description: 'SSH port (default: 22)', optional: true, default: 22 }
      },
      required: ['host', 'user', 'path', 'pattern']
    }
  },
  {
    name: 'ssh-write-chunk',
    description: 'Write content to remote files with append/rewrite modes (token-efficient for large content)',
    inputSchema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Remote server hostname or IP address' },
        user: { type: 'string', description: 'SSH username' },
        filePath: { type: 'string', description: 'Path to file on remote server' },
        content: { type: 'string', description: 'Content to write' },
        mode: { type: 'string', description: 'Write mode: "rewrite" or "append"', enum: ['rewrite', 'append'], default: 'rewrite' },
        privateKeyPath: { type: 'string', description: 'Path to SSH private key (optional)', optional: true },
        port: { type: 'number', description: 'SSH port (default: 22)', optional: true, default: 22 }
      },
      required: ['host', 'user', 'filePath', 'content']
    }
  }
];

class SSHMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ssh-mcp-server',
        version: '2.1.7',
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
        tools: SSH_TOOLS,
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'remote-ssh':
            return await this.executeSSHCommand(args);
          case 'ssh-edit-block':
            return await this.executeEditBlock(args);
          case 'ssh-read-lines':
            return await this.executeReadLines(args);
          case 'ssh-search-code':
            return await this.executeSearchCode(args);
          case 'ssh-write-chunk':
            return await this.executeWriteChunk(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `SSH operation failed: ${error.message}`
        );
      }
    });
  }

  async executeSSHCommand(args) {
    const { host, user, command, privateKeyPath, port = 22 } = args;

    if (!host || !user || !command) {
      throw new Error('Missing required parameters: host, user, command');
    }

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host, user, command, privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY, port
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            output: result.output,
            error: result.error || null,
            exitCode: result.exitCode || 0,
            host, command
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false, output: '', error: error.message, exitCode: 1, host, command
          }, null, 2)
        }]
      };
    }
  }

  async executeEditBlock(args) {
    const { host, user, filePath, oldText, newText, expectedReplacements = 1, privateKeyPath, port = 22 } = args;

    if (!host || !user || !filePath || !oldText || !newText) {
      throw new Error('Missing required parameters: host, user, filePath, oldText, newText');
    }

    // Escape special characters for sed
    const escapedOld = oldText.replace(/[[\]/]/g, '\\$&').replace(/\//g, '\\/');
    const escapedNew = newText.replace(/[[\]/]/g, '\\$&').replace(/\//g, '\\/');
    
    // Create sed command with backup and verification
    const sedCommand = `
      if [ ! -f "${filePath}" ]; then
        echo "Error: File ${filePath} not found"
        exit 1
      fi
      
      # Count occurrences before replacement
      before_count=$(grep -F "${oldText}" "${filePath}" | wc -l)
      
      # Create backup
      cp "${filePath}" "${filePath}.backup.$(date +%s)"
      
      # Perform replacement
      sed -i 's/${escapedOld}/${escapedNew}/g' "${filePath}"
      
      # Count occurrences after replacement
      after_count=$(grep -F "${newText}" "${filePath}" | wc -l)
      
      echo "Replacements made: $((before_count - after_count + after_count))"
      echo "Expected: ${expectedReplacements}"
      
      if [ "$before_count" -eq "0" ]; then
        echo "Warning: Pattern not found in file"
        exit 2
      fi
    `;

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host, user, command: sedCommand, privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY, port
      });

      return {
        content: [{
          type: 'text',
          text: `Edit block completed on ${filePath}\n${result.output}\nExit code: ${result.exitCode}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Edit block failed: ${error.message}`
        }]
      };
    }
  }

  async executeReadLines(args) {
    const { host, user, filePath, startLine = 1, endLine, maxLines = 100, privateKeyPath, port = 22 } = args;

    if (!host || !user || !filePath) {
      throw new Error('Missing required parameters: host, user, filePath');
    }

    // Build read command based on parameters
    let readCommand;
    if (endLine) {
      readCommand = `sed -n '${startLine},${endLine}p' "${filePath}"`;
    } else {
      readCommand = `sed -n '${startLine},$p' "${filePath}" | head -${maxLines}`;
    }

    // Add file existence check
    const command = `
      if [ ! -f "${filePath}" ]; then
        echo "Error: File ${filePath} not found"
        exit 1
      fi
      
      total_lines=$(wc -l < "${filePath}")
      echo "File: ${filePath} (\${total_lines} total lines)"
      echo "Reading lines ${startLine}-\${endLine || 'end'} (max ${maxLines})"
      echo "--- Content ---"
      ${readCommand}
    `;

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host, user, command, privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY, port
      });

      return {
        content: [{
          type: 'text',
          text: result.output
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Read lines failed: ${error.message}`
        }]
      };
    }
  }

  async executeSearchCode(args) {
    const { host, user, path, pattern, filePattern, ignoreCase = false, maxResults = 50, contextLines = 2, privateKeyPath, port = 22 } = args;

    if (!host || !user || !path || !pattern) {
      throw new Error('Missing required parameters: host, user, path, pattern');
    }

    // Build grep command
    let grepOptions = '-n';
    if (ignoreCase) grepOptions += 'i';
    if (contextLines > 0) grepOptions += ` -C${contextLines}`;
    
    const findPattern = filePattern ? `-name "${filePattern}"` : '-type f';
    
    const searchCommand = `
      if [ ! -d "${path}" ]; then
        echo "Error: Directory ${path} not found"
        exit 1
      fi
      
      echo "Searching in: ${path}"
      echo "Pattern: ${pattern}"
      echo "File pattern: ${filePattern || 'all files'}"
      echo "--- Results ---"
      
      find "${path}" ${findPattern} -exec grep ${grepOptions} "${pattern}" {} + 2>/dev/null | head -${maxResults}
    `;

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host, user, command: searchCommand, privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY, port
      });

      return {
        content: [{
          type: 'text',
          text: result.output || 'No matches found'
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Search failed: ${error.message}`
        }]
      };
    }
  }

  async executeWriteChunk(args) {
    const { host, user, filePath, content, mode = 'rewrite', privateKeyPath, port = 22 } = args;

    if (!host || !user || !filePath || !content) {
      throw new Error('Missing required parameters: host, user, filePath, content');
    }

    // Escape content for shell
    const escapedContent = content.replace(/'/g, "'\"'\"'");
    
    const writeCommand = mode === 'append' 
      ? `echo '${escapedContent}' >> "${filePath}"`
      : `echo '${escapedContent}' > "${filePath}"`;

    const command = `
      # Create directory if it doesn't exist
      mkdir -p "$(dirname "${filePath}")"
      
      # Write content
      ${writeCommand}
      
      # Verify write
      if [ $? -eq 0 ]; then
        echo "Successfully wrote to ${filePath} (mode: ${mode})"
        echo "File size: $(wc -c < "${filePath}") bytes"
        echo "Line count: $(wc -l < "${filePath}") lines"
      else
        echo "Failed to write to ${filePath}"
        exit 1
      fi
    `;

    const sshClient = new SSHClient();
    
    try {
      const result = await sshClient.executeCommand({
        host, user, command, privateKeyPath: privateKeyPath || process.env.SSH_PRIVATE_KEY, port
      });

      return {
        content: [{
          type: 'text',
          text: result.output
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Write chunk failed: ${error.message}`
        }]
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
    console.error('SSH MCP Server v2.1.7 running on stdio (Enhanced with token-efficient tools)');
  }
}

// Start the server
const server = new SSHMCPServer();
server.start().catch(console.error);