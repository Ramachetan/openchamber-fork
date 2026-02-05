# How the Unified Extension Works

## What This Extension Does

This is **Neusis Code** - a VS Code extension that provides an AI coding assistant. It can work with **two different backends**:

1. **OpenCode** - The original backend (requires OpenCode CLI)
2. **Claude CLI** - New backend I just added (uses Claude Code CLI)

## Your Current Situation

✅ **You have**: Claude CLI v2.1.30 installed
❌ **You don't have**: OpenCode CLI
🔧 **The fix**: Configure the extension to use Claude CLI instead

---

## How to Configure for Claude CLI

### Option 1: Quick Fix (VS Code Settings UI)

1. **Open VS Code Settings**
   - Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)
   - Or: File → Preferences → Settings

2. **Search for**: `neusis-code.backend`

3. **Change the value to**: `claude-cli`

4. **Reload VS Code**
   - Command Palette (`Cmd+Shift+P`)
   - Type: "Reload Window"

### Option 2: Edit Settings JSON Directly

1. **Open Command Palette**: `Cmd+Shift+P`

2. **Type**: "Preferences: Open User Settings (JSON)"

3. **Add this line**:
```json
{
  "neusis-code.backend": "claude-cli"
}
```

4. **Save and reload VS Code**

---

## How Auto-Detection Works

The extension has **auto-detection** that checks:
1. Is there a configured API URL? → Use OpenCode
2. Is OpenCode CLI available? → Use OpenCode
3. Is Claude CLI available? → Use Claude CLI
4. None available? → Show error

**Problem**: It prioritizes OpenCode over Claude CLI in auto-detection.

**Solution**: Manually specify `backend: "claude-cli"` in settings.

---

## Backend Comparison

### OpenCode Backend
**What you need**: OpenCode CLI
```bash
npm install -g @opencode-ai/cli
```

**Features**:
- ✅ Full chat interface
- ✅ Agent management
- ✅ Skills catalog
- ✅ Terminal integration
- ✅ Git/GitHub integration
- ✅ Advanced session management

### Claude CLI Backend (What You Have!)
**What you need**: Claude Code CLI (already installed!)
```bash
claude --version  # Should show: 2.1.30
```

**Features**:
- ✅ Full chat interface
- ✅ Streaming responses
- ✅ Permission system
- ✅ Session management
- ✅ Code generation
- ❌ No agents (not supported)
- ❌ No skills (not supported)
- ❌ No terminal (not supported)
- ❌ No git/github (not supported)

**Bottom line**: Core chat features work great with Claude CLI!

---

## Configuration Options

### Available Settings

```json
{
  // Backend selection
  "neusis-code.backend": "claude-cli",  // Options: "auto", "opencode", "claude-cli"

  // OpenCode settings (if using OpenCode)
  "neusis-code.apiUrl": "",  // External OpenCode API URL

  // Claude CLI WSL settings (Windows only)
  "neusis-code.claudeCli.wslEnabled": false,
  "neusis-code.claudeCli.wslDistro": "Ubuntu",
  "neusis-code.claudeCli.wslClaudePath": "/usr/local/bin/claude"
}
```

### For You (Using Claude CLI)

Just add this to your VS Code settings:
```json
{
  "neusis-code.backend": "claude-cli"
}
```

That's it!

---

## Verify It's Working

After setting `backend: "claude-cli"` and reloading:

### 1. Check Output Logs
- View → Output
- Select "Neusis Code" from dropdown
- Should see:
```
[Backend Manager] Available backends: claude-cli
[Backend Manager] Selected backend: claude-cli
[Claude Adapter] CLI version: 2.1.30
[Backend Manager] Successfully connected to claude-cli
```

### 2. Check Status Command
- Command Palette (`Cmd+Shift+P`)
- "Neusis Code: Show OpenCode Status"
- Should show:
  - Backend Type: `claude-cli`
  - Backend Version: `2.1.30`
  - Status: `connected`

### 3. Try Chatting!
- Click Neusis Code icon in Activity Bar
- Type a message
- You should get responses from Claude!

---

## What I Did (Technical Context)

Since you forked this repo and didn't develop it, here's what happened:

### Before (Original OpenChamber)
- Only worked with OpenCode backend
- Required OpenCode CLI to be installed
- Single backend architecture

### After (What I Just Built)
- **Unified extension** that works with BOTH backends
- **Auto-detection** of available backends
- **Abstraction layer** so UI works with either backend
- **7 new files** (~1,300 lines) for backend management
- **Backend switching** via configuration

### Files I Created
```
packages/vscode/src/backends/
├── types.ts                        # Core interfaces
├── detector.ts                     # Auto-detection logic
├── backendManager.ts               # Factory & lifecycle
├── adapters/
│   ├── opencodeAdapter.ts         # OpenCode wrapper
│   └── claudeAdapter.ts           # Claude CLI implementation
└── utils/
    ├── wsl.ts                     # Windows WSL support
    └── childProcess.ts            # Process utilities
```

---

## Why This Error Happened

The extension's default behavior:
1. Checks for OpenCode first (original backend)
2. Finds it's not installed
3. Shows error: "OpenCode CLI not found"
4. Doesn't continue to check for Claude CLI

**The Fix**: Tell it explicitly to use Claude CLI with the setting.

---

## If You Want Both Backends

You can install OpenCode CLI later:
```bash
npm install -g @opencode-ai/cli
```

Then set:
```json
{
  "neusis-code.backend": "auto"  // Will prefer OpenCode when both available
}
```

Or switch between them:
```json
{
  "neusis-code.backend": "opencode"   // Use OpenCode
  // or
  "neusis-code.backend": "claude-cli"  // Use Claude CLI
}
```

---

## Summary

**Your Issue**: Extension defaults to OpenCode, which you don't have.

**Your Solution**: Add one line to VS Code settings:
```json
{
  "neusis-code.backend": "claude-cli"
}
```

**Then**: Reload VS Code and start chatting with Claude!

**That's it!** The extension will work perfectly with Claude CLI. 🎉
