import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * SSH Client for executing remote commands
 * Handles private key authentication and secure connections
 */
export class SSHClient {
  constructor() {
    this.defaultKeyPaths = [
      join(homedir(), '.ssh', 'id_rsa'),
      join(homedir(), '.ssh', 'id_ed25519'),
      join(homedir(), '.ssh', 'id_ecdsa')
    ];
  }

  /**
   * Execute command on remote SSH server
   * @param {Object} options - SSH connection options
   * @param {string} options.host - Remote hostname/IP
   * @param {string} options.user - SSH username  
   * @param {string} options.command - Command to execute
   * @param {string} [options.privateKeyPath] - Path to private key
   * @param {number} [options.port=22] - SSH port
   * @returns {Promise<Object>} Command execution result
   */
  async executeCommand({ host, user, command, privateKeyPath, port = 22 }) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';
      let errorOutput = '';
      
      // Get private key
      let privateKey;
      try {
        privateKey = this.getPrivateKey(privateKeyPath);
      } catch (error) {
        return reject(new Error(`Private key error: ${error.message}`));
      }

      // Connection configuration
      const config = {
        host,
        port,
        username: user,
        privateKey,
        algorithms: {
          kex: [
            'ecdh-sha2-nistp256',
            'ecdh-sha2-nistp384', 
            'ecdh-sha2-nistp521',
            'diffie-hellman-group14-sha256'
          ]
        },
        readyTimeout: 20000,
        keepaliveInterval: 30000
      };

      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(new Error(`Execution failed: ${err.message}`));
          }

          stream.on('close', (code, signal) => {
            conn.end();
            resolve({
              output: output.trim(),
              error: errorOutput.trim() || null,
              exitCode: code
            });
          });

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
        });
      });

      conn.on('error', (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`));
      });

      conn.connect(config);
    });
  }

  /**
   * Get private key from file or environment
   * @param {string} [keyPath] - Optional path to private key
   * @returns {Buffer} Private key buffer
   */
  getPrivateKey(keyPath) {
    const paths = keyPath ? [keyPath] : this.defaultKeyPaths;
    
    for (const path of paths) {
      try {
        return readFileSync(path);
      } catch (error) {
        continue; // Try next path
      }
    }
    
    throw new Error(
      `No private key found. Tried: ${paths.join(', ')}\n` +
      'Please provide privateKeyPath or set SSH_PRIVATE_KEY environment variable'
    );
  }
}
