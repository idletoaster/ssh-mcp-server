# 🚀 SSH MCP Server (Node.js)

[![NPM Version](https://img.shields.io/npm/v/@idletoaster/ssh-mcp-server)](https://www.npmjs.com/package/@idletoaster/ssh-mcp-server)
[![smithery badge](https://smithery.ai/badge/@idletoaster/ssh-mcp-server)](https://smithery.ai/server/@idletoaster/ssh-mcp-server)
[![GitHub Issues](https://img.shields.io/github/issues/idletoaster/ssh-mcp-server)](https://github.com/idletoaster/ssh-mcp-server/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A secure, high-performance **Model Context Protocol (MCP) server** that enables AI assistants like Claude Desktop to execute SSH commands on remote servers. Built with Node.js and the official MCP SDK for maximum compatibility and reliability.

> **🔄 Version 2.0.3**: Complete rewrite in Node.js with official MCP SDK - eliminates all previous Go compatibility issues!

---

## ✨ Features

- 🔐 **Secure SSH**: Private key authentication with multiple key format support
- 🤖 **AI-Ready**: Official MCP SDK integration for Claude Desktop and other AI tools
- ⚡ **High Performance**: Node.js async architecture for fast command execution
- 📦 **Zero Setup**: One-command installation via NPX - no compilation required
- 🌐 **Universal**: Pure JavaScript runs on Windows, macOS, and Linux
- 🛡️ **Type Safe**: Built with modern JavaScript and comprehensive error handling
- 📋 **Standards Compliant**: Uses official @modelcontextprotocol/sdk

---

## 🚀 Quick Start

### Installing via Smithery

To install ssh-mcp-server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@idletoaster/ssh-mcp-server):

```bash
npx -y @smithery/cli install @idletoaster/ssh-mcp-server --client claude
```

### Installation & Usage
```bash
# Use directly with NPX (recommended)
npx @idletoaster/ssh-mcp-server@latest

# Or install globally
npm install -g @idletoaster/ssh-mcp-server
```

### Claude Desktop Configuration
Add to your Claude Desktop MCP configuration file:

```json
{
  "mcpServers": {
    "ssh": {
      "command": "npx",
      "args": ["-y", "@idletoaster/ssh-mcp-server@latest"],
      "env": {}
    }
  }
}
```

**That's it!** Claude can now execute SSH commands on your remote servers.

---

## 💬 Usage Examples

Once configured, Claude can help you with commands like:

> **"Check disk usage on my production server at 192.168.1.100"**

> **"Restart the nginx service on server.example.com as user admin"**

> **"Show running processes on my Ubuntu server using my SSH key"**

### Manual Tool Usage
```json
{
  "tool": "remote-ssh",
  "arguments": {
    "host": "192.168.1.100",
    "user": "ubuntu",
    "command": "df -h",
    "privateKeyPath": "/home/user/.ssh/id_rsa"
  }
}
```

---

## 🔧 Configuration

### SSH Key Authentication
The server supports multiple authentication methods:

#### 1. Explicit Key Path
```json
{
  "privateKeyPath": "/path/to/your/private/key"
}
```

#### 2. Environment Variable
```bash
export SSH_PRIVATE_KEY="/home/user/.ssh/id_rsa"
```

#### 3. Auto-Discovery
Automatically searches for keys in:
- `~/.ssh/id_rsa`
- `~/.ssh/id_ed25519` 
- `~/.ssh/id_ecdsa`

### Supported Key Formats
- ✅ RSA keys (`id_rsa`)
- ✅ ED25519 keys (`id_ed25519`)
- ✅ ECDSA keys (`id_ecdsa`)
- ✅ OpenSSH format
- ✅ PEM format

---

## 🛠️ Development

### Prerequisites
- **Node.js 18+** (check: `node --version`)
- **NPM 9+** (check: `npm --version`)

### Install Node.js

#### Windows:
Download from [nodejs.org](https://nodejs.org/) or use Chocolatey:
```bash
choco install nodejs
```

#### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Linux (CentOS/RHEL):
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

#### macOS:
```bash
brew install node
```

### Build from Source
```bash
# Clone repository
git clone https://github.com/idletoaster/ssh-mcp-server.git
cd ssh-mcp-server

# Install dependencies
npm install

# Run locally
npm start

# Development with auto-reload
npm run dev
```

---

## 🏗️ Architecture

```
ssh-mcp-server/
├── package.json          # NPM configuration & dependencies
├── index.js              # Main MCP server (Official SDK)
├── lib/
│   └── ssh-client.js     # SSH connection management
├── README.md             # Documentation
├── LICENSE               # MIT license
└── .gitignore           # Node.js gitignore
```

### Technology Stack
- **Runtime**: Node.js 18+ with ES Modules
- **MCP SDK**: @modelcontextprotocol/sdk (Official)
- **SSH**: ssh2 library for Node.js
- **Distribution**: NPM with direct NPX execution

---

## 🔒 Security

### Best Practices
- ✅ Private key authentication only (no passwords)
- ✅ Configurable SSH algorithms and timeouts
- ✅ No persistent connections (session-based)
- ✅ Input validation and sanitization
- ✅ Comprehensive error handling

### Security Guidelines
- 🔐 Store private keys with restrictive permissions (`chmod 600`)
- 🌐 Use SSH key passphrases when possible
- 🛡️ Restrict SSH keys to specific hosts in `~/.ssh/config`
- 📝 Monitor SSH access logs
- 🚫 Never run as root unless absolutely necessary

### Network Security
```bash
# Example SSH config for restricted access
Host production-server
    HostName 192.168.1.100
    User deploy
    IdentityFile ~/.ssh/production_key
    IdentitiesOnly yes
    StrictHostKeyChecking yes
```

---

## 🧪 Testing

### Local Testing
```bash
# Test the MCP server
echo '{"host":"test.server.com","user":"testuser","command":"whoami"}' | npm start
```

### Integration Testing
```bash
# Verify Node.js installation
node --version  # Should be 18+
npm --version   # Should be 9+

# Test NPX execution
npx @idletoaster/ssh-mcp-server@latest --help
```

---

## 🌍 Compatibility

### Operating Systems
- ✅ **Windows** 10/11 (x64, ARM64)
- ✅ **macOS** 12+ (Intel & Apple Silicon)
- ✅ **Linux** (x64, ARM64) - All major distributions

### AI Platforms
- 🤖 **Claude Desktop** (Primary target)
- 🤖 **Cursor IDE** 
- 🤖 **Any MCP-compatible application**

### Node.js Compatibility
- ✅ **Node.js 18.x** (LTS)
- ✅ **Node.js 20.x** (LTS) 
- ✅ **Node.js 22.x** (Current)

---

## 📊 Migration from v1.x (Go)

**Upgrading from the Go version?** The Node.js version offers:

### ✅ Improvements
- **Zero compilation** - No more binary builds
- **Better compatibility** - Official MCP SDK
- **Faster development** - Direct code changes
- **Simpler deployment** - Pure NPX distribution
- **No protocol issues** - Official Anthropic SDK

### 🔄 Migration Steps
1. **Uninstall old version**: Remove Go-based installation
2. **Install new version**: `npx @idletoaster/ssh-mcp-server@latest`
3. **Update Claude config**: Same configuration works!
4. **Test connection**: Verify SSH functionality

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly: `npm test`
5. Submit a pull request

### Code Style
- Use ES6+ modern JavaScript
- Follow Node.js best practices
- Add JSDoc comments for functions
- Validate with existing patterns

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)** - Official MCP SDK
- **[ssh2](https://github.com/mscdex/ssh2)** - Node.js SSH client
- **[Claude Desktop](https://claude.ai)** - Primary target platform
- **[Model Context Protocol](https://modelcontextprotocol.io)** - Standard specification

---

## 📞 Support

- 📋 **Issues**: [GitHub Issues](https://github.com/idletoaster/ssh-mcp-server/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/idletoaster/ssh-mcp-server/discussions)
- 📧 **Email**: [idletoaster@gmail.com](mailto:idletoaster@gmail.com)

---

*Built with ❤️ for the AI development community using Node.js and official MCP SDK*
