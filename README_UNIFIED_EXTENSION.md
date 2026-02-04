# Neusis Code - Unified VS Code Extension

A VS Code extension that works with **both OpenCode and Claude Code backends**, featuring automatic detection and seamless switching.

## ✨ Features

- 🔄 **Dual Backend Support**: Works with OpenCode API or Claude Code CLI
- 🎯 **Auto-Detection**: Automatically detects and uses available backend
- 🔌 **Hot-Switching**: Change backends without reinstalling
- 💬 **Full Chat Interface**: AI-powered coding assistant in your sidebar
- 🎨 **Rich UI**: Modern React-based interface with streaming responses
- 🛠️ **OpenCode Features**: Agents, skills, terminal, git/GitHub integration
- 🤖 **Claude Code Support**: Direct integration with Claude Code CLI

---

## 🚀 Quick Start

### Prerequisites

Install **at least one** backend CLI:

**Option A: OpenCode CLI**
```bash
npm install -g @opencode-ai/cli
opencode --version
```

**Option B: Claude Code CLI**
```bash
# Visit: https://claude.ai/download
# Download and install Claude Code
claude --version
```

### Installation

1. **Download the Extension**
   - Get `neusis-code-1.6.2.vsix` from releases

2. **Install in VS Code**
   - Open VS Code
   - Extensions panel (`Cmd+Shift+X`)
   - Click `...` → **Install from VSIX**
   - Select the `.vsix` file
   - Reload VS Code

3. **Configure (Optional)**
   ```json
   {
     "neusis-code.backend": "auto"  // or "opencode" or "claude-cli"
   }
   ```

4. **Start Using**
   - Click Neusis Code icon in Activity Bar
   - Start chatting with AI!

---

## 🏗️ Building from Source

### System Requirements

- **Node.js**: v20+
- **Bun**: v1.3.5+ (for package management)
- **TypeScript**: v5.8+
- **Git**: For cloning repository

### Build Steps

#### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/openchamber-fork.git
cd openchamber-fork
```

#### 2. Initialize Submodules
```bash
git submodule update --init --recursive
```

#### 3. Install Dependencies
```bash
# Install root dependencies
npx bun@1.3.5 install

# Install vscode package dependencies
cd packages/vscode
npx bun@1.3.5 install
```

#### 4. Build Extension
```bash
# Build extension
npx esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node --minify --main-fields=module,main

# Build webview
VITE_OPENCODE_URL=/api npx vite build
```

#### 5. Package Extension
```bash
# Modify package.json to skip prepublish (temporary)
sed -i.bak 's/"vscode:prepublish":/"_vscode:prepublish":/' package.json

# Create VSIX package
npx @vscode/vsce package --no-dependencies

# Restore package.json
mv package.json.bak package.json

# Output: neusis-code-X.X.X.vsix
```

#### 6. Verify Build
```bash
# Run verification script
chmod +x verify-prereqs.sh
./verify-prereqs.sh
```

### Development Mode

For rapid iteration:

```bash
cd packages/vscode
code .

# Press F5 in VS Code to launch Extension Development Host
# Make changes and reload to test
```

---

## 📦 Installation Methods

### Method 1: Install from VSIX (Recommended)

```bash
# After building, you'll have a .vsix file
code --install-extension neusis-code-1.6.2.vsix

# Or install via VS Code UI:
# Extensions → ... → Install from VSIX
```

### Method 2: Development Install

```bash
cd packages/vscode

# Watch mode - auto rebuild on changes
bun run dev

# In VS Code, press F5 to launch development instance
```

### Method 3: Manual Install

```bash
# Copy extension to VS Code extensions directory
cp -r packages/vscode ~/.vscode/extensions/neusis-code-1.6.2

# Restart VS Code
```

---

## ⚙️ Configuration

### Basic Settings

```json
{
  // Backend selection
  "neusis-code.backend": "auto",  // Options: "auto", "opencode", "claude-cli"

  // OpenCode settings
  "neusis-code.apiUrl": "",  // External OpenCode API URL (leave empty for auto-start)

  // Claude CLI WSL settings (Windows only)
  "neusis-code.claudeCli.wslEnabled": false,
  "neusis-code.claudeCli.wslDistro": "Ubuntu",
  "neusis-code.claudeCli.wslClaudePath": "/usr/local/bin/claude"
}
```

### Backend Selection

**Auto-Detection (Default)**
```json
{
  "neusis-code.backend": "auto"
}
```
Priority: Configured API URL → OpenCode CLI → Claude CLI

**Force OpenCode**
```json
{
  "neusis-code.backend": "opencode"
}
```

**Force Claude CLI**
```json
{
  "neusis-code.backend": "claude-cli"
}
```

---

## 🎯 Usage

### Basic Chat

1. Click **Neusis Code** icon in Activity Bar
2. Type your message in the input box
3. Press Enter or click Send
4. AI responds in real-time!

### Example Prompts

```
"Explain how this code works"
"Write a function to sort an array"
"Find bugs in this implementation"
"Refactor this code to be more readable"
"Create a REST API endpoint for user auth"
```

### Advanced Features (OpenCode Only)

**Agents**
- Command Palette → "Neusis Code: Open Agent Manager"
- Select specialized agents for different tasks

**Skills**
- Type `/skills` in chat
- Browse and use available skills

**Terminal Integration**
- Ask to run commands
- OpenCode can execute in terminal

**Git/GitHub**
- Ask about commits, branches, PRs
- Get contextual git assistance

---

## 🔄 Backend Comparison

| Feature | OpenCode | Claude CLI |
|---------|----------|------------|
| Chat Interface | ✅ | ✅ |
| Streaming | ✅ | ✅ |
| Code Generation | ✅ | ✅ |
| File Context | ✅ | ✅ |
| **Agents** | ✅ | ❌ |
| **Skills** | ✅ | ❌ |
| **Terminal** | ✅ | ❌ |
| **Git/GitHub** | ✅ | ❌ |
| Session History | ✅ | ✅ |
| Permissions | ✅ | ✅ |
| WSL Support | ❌ | ✅ |

---

## 🧪 Testing

### Quick Verification

```bash
cd packages/vscode
./verify-prereqs.sh
```

### Manual Testing

1. **Backend Connection**
   - View → Output → "Neusis Code"
   - Check for "Successfully connected" message

2. **Status Check**
   - `Cmd+Shift+P` → "Neusis Code: Show OpenCode Status"
   - Verify backend type and status

3. **Chat Test**
   - Send test message
   - Verify response
   - Check streaming works

### Switching Backends

```json
// Change setting
{
  "neusis-code.backend": "claude-cli"  // Switch to Claude
}

// Reload VS Code
// Cmd+Shift+P → "Reload Window"

// Verify switch
// Check Output panel for new backend connection
```

---

## 🐛 Troubleshooting

### "OpenCode CLI not found"

**Check**:
```bash
which opencode
opencode --version
```

**Fix**:
```bash
npm install -g @opencode-ai/cli
# Or configure to use Claude CLI instead
```

### "No models found"

**Solutions**:
1. Restart backend: `Cmd+Shift+P` → "Neusis Code: Restart API Connection"
2. Check backend is running: View → Output → "Neusis Code"
3. Verify settings: Check `neusis-code.backend` value
4. Try explicit backend:
   ```json
   {
     "neusis-code.backend": "opencode"
   }
   ```

### Backend Won't Connect

**Debug**:
```bash
# Check CLIs are accessible
opencode --version
claude --version

# Check processes
ps aux | grep -E "(opencode|claude)"

# Check logs
# View → Output → "Neusis Code"
```

**Fix**:
1. Restart VS Code completely
2. Open VS Code from terminal to inherit PATH:
   ```bash
   code /path/to/workspace
   ```
3. Try starting OpenCode manually:
   ```bash
   opencode serve
   ```

### Build Errors

**esbuild: cannot execute binary file**

Platform mismatch. Reinstall dependencies:
```bash
cd packages/vscode
rm -rf node_modules
npx bun@1.3.5 install
```

**TypeScript errors**

```bash
npx tsc --noEmit
# Fix any type errors shown
```

---

## 📁 Project Structure

```
openchamber-fork/
├── packages/
│   ├── vscode/                   # VS Code extension
│   │   ├── src/
│   │   │   ├── backends/        # Backend abstraction layer
│   │   │   │   ├── types.ts
│   │   │   │   ├── detector.ts
│   │   │   │   ├── backendManager.ts
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── opencodeAdapter.ts
│   │   │   │   │   └── claudeAdapter.ts
│   │   │   │   └── utils/
│   │   │   │       ├── wsl.ts
│   │   │   │       └── childProcess.ts
│   │   │   ├── extension.ts    # Extension entry point
│   │   │   ├── ChatViewProvider.ts
│   │   │   └── ...
│   │   ├── webview/             # React UI
│   │   ├── dist/                # Build output
│   │   └── package.json
│   ├── ui/                       # Shared UI components
│   ├── web/                      # Web runtime
│   └── desktop/                  # Desktop app
├── claude-code-chat/             # Claude CLI submodule (reference)
├── opencode/                     # OpenCode submodule (reference)
└── README.md
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/openchamber-fork.git
   cd openchamber-fork
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **Make Changes**
   ```bash
   cd packages/vscode
   # Edit code
   bun run dev  # Watch mode
   ```

4. **Test**
   ```bash
   # Press F5 in VS Code to test
   ./verify-prereqs.sh
   ```

5. **Build**
   ```bash
   bun run build
   bun run package
   ```

6. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

7. **Create PR**

### Code Style

- TypeScript for all new code
- ESLint for linting
- Prettier for formatting (if configured)
- Follow existing patterns

### Testing

- Test with both OpenCode and Claude CLI
- Verify backend switching
- Check all features work
- Test on macOS, Windows, Linux if possible

---

## 📚 Documentation

- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Full implementation details
- **[TESTING_GUIDE.md](./packages/vscode/TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[TESTING_BOTH_BACKENDS.md](./TESTING_BOTH_BACKENDS.md)** - Backend comparison and testing
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Architecture explanation

---

## 🏛️ Architecture

### Backend Abstraction Layer

```
Extension (extension.ts)
    ↓
UnifiedBackendManager (auto-detect, factory)
    ↓
BackendManager Interface
    ↓
    ├── OpenCodeAdapter → wraps OpenCode SDK
    │   └── HTTP/SSE protocol
    └── ClaudeAdapter → spawns Claude CLI
        └── Stream-JSON protocol
```

### Key Components

1. **Backend Manager** (`backendManager.ts`)
   - Auto-detection logic
   - Factory pattern for adapters
   - Lifecycle management

2. **Adapters** (`adapters/`)
   - OpenCode: Wraps existing OpenCode SDK
   - Claude: Spawns and manages Claude CLI process
   - Both implement unified `BackendManager` interface

3. **Detection** (`detector.ts`)
   - CLI availability checking
   - Version detection
   - WSL support detection

4. **View Providers**
   - ChatViewProvider: Main chat interface
   - AgentManagerPanelProvider: Agent management
   - SessionEditorPanelProvider: Session editor

---

## 🔐 Security

- Extension runs in VS Code sandbox
- Backend CLIs run as separate processes
- No credentials stored in extension
- API keys managed by backend CLIs
- Permission prompts for file access (Claude CLI)

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

---

## 🙏 Acknowledgments

- **OpenChamber** - Original OpenCode integration
- **Claude Code Chat** - Reference for Claude CLI integration
- **OpenCode** - Backend API and SDK
- **Anthropic** - Claude AI and Claude Code

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: See docs/ folder

---

## 🗺️ Roadmap

- [ ] Support for additional AI backends
- [ ] Enhanced UI features
- [ ] Better error handling
- [ ] Performance optimizations
- [ ] Extended testing coverage
- [ ] CI/CD pipeline

---

## ⭐ Star History

If you find this useful, please star the repository!

---

**Built with ❤️ for the AI-assisted coding community**
