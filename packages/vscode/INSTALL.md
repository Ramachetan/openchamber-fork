# 🎉 Extension Ready to Install!

## ✅ Build Complete

Your unified VS Code extension has been successfully built and packaged!

**File**: `neusis-code-1.6.1.vsix` (6.2 MB)
**Location**: `/sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode/`

---

## 📦 How to Install

### Method 1: Install from VSIX (Recommended)

1. **Open VS Code**

2. **Go to Extensions**
   - Click the Extensions icon in the Activity Bar (left sidebar)
   - Or press `Cmd+Shift+X` (Mac) / `Ctrl+Shift+X` (Windows/Linux)

3. **Install from VSIX**
   - Click the `...` (More Actions) menu at the top of Extensions panel
   - Select **"Install from VSIX..."**
   - Navigate to: `/sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode/`
   - Select `neusis-code-1.6.1.vsix`

4. **Reload VS Code**
   - Click "Reload Now" when prompted
   - Or restart VS Code manually

5. **Verify Installation**
   - Look for "Neusis Code" icon in the Activity Bar
   - Click it to open the sidebar
   - You should see the chat interface!

---

## 🚀 First Run

After installation:

1. **Open a Workspace**
   - The extension works best with an open folder/workspace
   - File → Open Folder

2. **Open Neusis Code**
   - Click the Neusis Code icon in the Activity Bar
   - Or use Command Palette: `Cmd+Shift+P` → "Neusis Code: Open Sidebar"

3. **Backend Auto-Detection**
   - The extension will automatically detect Claude CLI (v2.1.30)
   - Check Output panel (View → Output → "Neusis Code") for connection logs
   - Should see: "Backend Manager] Successfully connected to claude-cli"

4. **Start Chatting!**
   - Type a message in the input box
   - Press Enter or click Send
   - Claude should respond!

---

## 🔍 Verify Backend Connection

### Check Logs
1. **View → Output**
2. Select **"Neusis Code"** from the dropdown
3. Look for:
   ```
   [Backend Manager] Available backends: claude-cli
   [Backend Manager] Selected backend: claude-cli
   [Claude Adapter] CLI version: 2.1.30
   [Backend Manager] Successfully connected to claude-cli
   ```

### Check Status
1. **Command Palette** (`Cmd+Shift+P`)
2. Type: **"Neusis Code: Show OpenCode Status"**
3. Should show:
   - Backend Type: `claude-cli`
   - Backend Version: `2.1.30`
   - Status: `connected`

---

## 🧪 Quick Test Checklist

- [ ] Extension appears in Activity Bar with icon
- [ ] Clicking icon opens sidebar
- [ ] Chat interface loads (no blank screen)
- [ ] Backend connects to Claude CLI
- [ ] Can type and send messages
- [ ] Claude responds to messages
- [ ] Streaming responses work
- [ ] No errors in Developer Console (Help → Toggle Developer Tools)

---

## 🐛 Troubleshooting

### Extension Not Visible
**Solution**:
- Restart VS Code completely
- Check Extensions panel → Search "Neusis Code"
- Try disabling/re-enabling the extension

### "No backend available" Error
**Check**:
```bash
claude --version  # Should show: 2.1.30 (Claude Code)
which claude      # Should show: /usr/local/bin/claude
```

### Blank Chat Interface
**Check**:
1. Open Developer Tools: Help → Toggle Developer Tools
2. Look for JavaScript errors in Console
3. Check Output panel for backend errors
4. Try: Command Palette → "Reload Window"

### Backend Won't Connect
**Try**:
1. Command Palette → "Neusis Code: Restart API Connection"
2. Check Claude CLI works: `claude --version`
3. Check logs in Output panel

---

## ⚙️ Configuration

### Set Backend Manually (Optional)

If you want to force a specific backend:

1. **Open Settings** (`Cmd+,`)
2. Search: **"neusis-code.backend"**
3. Options:
   - `auto` - Auto-detect (default)
   - `claude-cli` - Force Claude CLI
   - `opencode` - Force OpenCode (if installed)

### WSL Configuration (Windows Only)

If using Claude CLI in WSL:

```json
{
  "neusis-code.claudeCli.wslEnabled": true,
  "neusis-code.claudeCli.wslDistro": "Ubuntu",
  "neusis-code.claudeCli.wslClaudePath": "/usr/local/bin/claude"
}
```

---

## 📊 What's Included

### Features Available (Claude CLI Backend)
- ✅ **Chat Interface** - Full conversation support
- ✅ **Streaming Responses** - Real-time response streaming
- ✅ **Permission System** - Controlled access to files/operations
- ✅ **Session Management** - Conversation history maintained
- ✅ **Code Formatting** - Syntax highlighting for code blocks
- ✅ **File Context** - Can reference files from workspace

### Features Not Available (Claude CLI Limitations)
- ❌ **Agent Selector** - Not supported by Claude CLI
- ❌ **Skills Catalog** - Not supported by Claude CLI
- ❌ **Terminal Integration** - Not supported by Claude CLI
- ❌ **Git/GitHub** - Not supported by Claude CLI

*These features are available if you install OpenCode CLI*

---

## 🎯 Next Steps

### 1. Test Basic Functionality
- Send a few messages
- Try code generation requests
- Test file references
- Verify streaming works

### 2. Install OpenCode CLI (Optional)
To unlock all features:
```bash
npm install -g @opencode-ai/cli
```

Then:
- Set `neusis-code.backend: "auto"`
- Restart VS Code
- Extension will auto-detect and use OpenCode
- All advanced features become available!

### 3. Report Issues
If you find any bugs:
1. Gather debug info: Command Palette → "Show OpenCode Status"
2. Check logs: Output panel → "Neusis Code"
3. Note: What you did, what happened, what you expected
4. Share findings for debugging

---

## 📚 Additional Documentation

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[READY_TO_TEST.md](./READY_TO_TEST.md)** - Quick start guide
- **[IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)** - Full technical details

---

## 🎉 Congratulations!

Your unified VS Code extension is ready to use! You can now:
- Chat with Claude directly in VS Code
- Have conversations with context about your code
- Get AI assistance without leaving your editor
- Switch backends seamlessly

Enjoy coding with AI assistance! 🚀

---

## 💡 Pro Tips

1. **Use Keyboard Shortcuts**
   - `Cmd+Shift+P` → Quick command access
   - Pin Neusis Code to Activity Bar for easy access

2. **Context is King**
   - Open relevant files before chatting
   - Reference files by name in messages
   - Claude can see your workspace context

3. **Watch the Logs**
   - Output panel shows what's happening
   - Useful for debugging connection issues
   - Shows backend initialization process

4. **Experiment!**
   - Try different types of requests
   - Test code generation
   - Ask for explanations
   - Request refactoring suggestions

Happy coding! 🎊
