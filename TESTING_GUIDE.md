# Testing Guide - Unified VS Code Extension

## ✅ Prerequisites Status

### Build Status
- ✅ **Dependencies Installed**: 888 packages via Bun
- ✅ **TypeScript Compilation**: No errors
- ✅ **Extension Built**: `dist/extension.js` (337 KB)
- ✅ **Webview Built**: `dist/webview/index.html`

### Backend CLI Status
- ❌ **OpenCode CLI**: Not installed
- ✅ **Claude CLI**: Installed (v2.1.30)

**Result**: You can test with **Claude CLI backend** immediately!

---

## 🚀 How to Test

### Option 1: Quick Test with Claude CLI (Recommended)

Since Claude CLI is already installed, you can test right away:

#### Step 1: Package the Extension
```bash
cd /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode
npx --yes bun@1.3.5 run package
```

This creates: `neusis-code-<version>.vsix`

#### Step 2: Install in VS Code
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Click the `...` menu → **Install from VSIX**
4. Select `neusis-code-<version>.vsix`
5. Reload VS Code

#### Step 3: Test!
1. Open a workspace folder
2. Look for "Neusis Code" in the activity bar (left sidebar)
3. Click it to open the chat interface
4. The extension should auto-detect Claude CLI and connect
5. Try sending a message!

---

### Option 2: Development Mode (For Testing/Debugging)

#### Step 1: Open Extension in VS Code
```bash
code /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode
```

#### Step 2: Launch Extension Development Host
1. In VS Code, press **F5** (or Run → Start Debugging)
2. This opens a new "Extension Development Host" window
3. The extension runs in this debug window

#### Step 3: Open Developer Tools
- Press **Cmd+Option+I** to see logs and errors
- Check "Output" panel → "Neusis Code" for backend logs

---

## 🧪 Testing Checklist

### 1. Extension Activation
- [ ] Extension shows up in activity bar with icon
- [ ] Clicking icon opens sidebar with chat interface
- [ ] No errors in Developer Console
- [ ] "Neusis Code" appears in Output panel

### 2. Backend Detection (Claude CLI)
Check Output panel for:
```
[Backend Manager] Detecting available backends...
[Backend Manager] Available backends: claude-cli
[Backend Manager] Selected backend: claude-cli
[Backend Manager] Initializing claude-cli backend...
[Claude Adapter] Initializing...
[Claude Adapter] CLI version: 2.1.30
[Backend Manager] Successfully connected to claude-cli
```

### 3. Chat Functionality
- [ ] Chat interface loads (no blank screen)
- [ ] Input box is visible at bottom
- [ ] Can type messages
- [ ] Can send messages (Enter or button)
- [ ] Claude responds to messages
- [ ] Streaming responses work (text appears gradually)

### 4. Claude CLI Features
- [ ] **Messages**: Sending and receiving work
- [ ] **Streaming**: Responses stream in real-time
- [ ] **Permissions**: Permission prompts appear when needed
- [ ] **Code blocks**: Code formatting displays correctly
- [ ] **Session**: Session ID is maintained across messages

### 5. UI Adaptation
Since Claude CLI doesn't support certain features:
- [ ] Agent selector should be hidden/disabled (if present)
- [ ] Skills catalog should be hidden/disabled (if present)
- [ ] Terminal integration not available (expected)
- [ ] Git/GitHub features not available (expected)

### 6. Status Information
Test the status command:
1. Press **Cmd+Shift+P** (Command Palette)
2. Type "Neusis Code: Show OpenCode Status"
3. Should show:
   - Backend Type: `claude-cli`
   - Backend Version: `2.1.30`
   - Status: `connected`
   - Working directory
   - No errors

### 7. Error Handling
Try these scenarios:
- [ ] Kill Claude CLI process → Extension should show error
- [ ] Restart via Command Palette → Should reconnect
- [ ] Send invalid message → Should show error gracefully

---

## 🔍 Debugging Tips

### Check Logs
**VS Code Output Panel**:
1. View → Output
2. Select "Neusis Code" from dropdown
3. Look for initialization messages

**Developer Console**:
1. Help → Toggle Developer Tools
2. Check Console tab for errors
3. Check Network tab for API calls (if using OpenCode)

### Common Issues

#### Issue: Extension doesn't appear
**Solution**:
- Make sure you reloaded VS Code after install
- Check Extensions panel → Search "Neusis Code"
- Try disabling/enabling

#### Issue: "No backend available" error
**Check**:
```bash
claude --version  # Should show version
which claude      # Should show path
```

#### Issue: Blank chat interface
**Check**:
- Developer Console for JavaScript errors
- Output panel for backend connection errors
- Try opening in new workspace

#### Issue: Messages not sending
**Check**:
- Backend status in Output panel
- Look for "connected" status
- Try restarting: Cmd+Shift+P → "Neusis Code: Restart API Connection"

---

## 📊 Testing with Both Backends

### To Test OpenCode Backend

#### 1. Install OpenCode CLI
```bash
npm install -g @opencode-ai/cli
# or visit: https://www.opencode.ai
```

#### 2. Verify Installation
```bash
opencode --version
```

#### 3. Set Backend Preference (Optional)
In VS Code Settings (Cmd+,):
```json
{
  "neusis-code.backend": "opencode"
}
```

Or use auto-detection (default):
```json
{
  "neusis-code.backend": "auto"
}
```

#### 4. Reload Extension
- Command Palette → "Reload Window"
- Extension should detect OpenCode

#### 5. Test OpenCode-Specific Features
- [ ] Agent selector available
- [ ] Skills catalog works
- [ ] Terminal integration works
- [ ] Git operations work
- [ ] GitHub integration works
- [ ] Session management more advanced

### Backend Switching Test

With both CLIs installed:

1. **Auto-Detection**: Set `backend: "auto"` → Should prefer OpenCode
2. **Manual Override**: Set `backend: "claude-cli"` → Should use Claude
3. **Switch**: Change setting → Should reconnect to new backend
4. **Restart**: Use restart command → Should maintain backend choice

---

## 🎯 Quick Verification Script

Run this to verify everything:

```bash
cd /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode

echo "=== Build Status ==="
ls -lh dist/extension.js dist/webview/index.html

echo -e "\n=== Dependencies ==="
ls node_modules/@types/vscode > /dev/null 2>&1 && echo "✅ VS Code types" || echo "❌ VS Code types"
ls node_modules/@opencode-ai/sdk > /dev/null 2>&1 && echo "✅ OpenCode SDK" || echo "❌ OpenCode SDK"

echo -e "\n=== Backend CLIs ==="
opencode --version 2>/dev/null && echo "✅ OpenCode CLI" || echo "❌ OpenCode CLI (not required)"
claude --version 2>/dev/null && echo "✅ Claude CLI" || echo "❌ Claude CLI (not required)"

echo -e "\n=== TypeScript ==="
npx tsc --noEmit && echo "✅ No TypeScript errors" || echo "❌ TypeScript errors found"

echo -e "\n=== Ready to Test! ==="
```

---

## 📝 Test Results Template

Use this template to document your testing:

```markdown
## Test Session: [Date]

### Environment
- OS: [macOS/Windows/Linux]
- VS Code Version: [version]
- Backend: [opencode/claude-cli]
- Backend Version: [version]

### Test Results

#### Extension Activation: [✅/❌]
- Notes:

#### Backend Connection: [✅/❌]
- Auto-detection worked: [✅/❌]
- Connection status: [connected/error]
- Notes:

#### Chat Functionality: [✅/❌]
- Sending messages: [✅/❌]
- Receiving responses: [✅/❌]
- Streaming: [✅/❌]
- Notes:

#### Feature Availability: [✅/❌]
- Expected features visible: [✅/❌]
- Unsupported features hidden: [✅/❌]
- Notes:

#### Error Handling: [✅/❌]
- Graceful errors: [✅/❌]
- Recovery works: [✅/❌]
- Notes:

### Issues Found
1. [Issue description]
2. [Issue description]

### Overall: [PASS/FAIL]
```

---

## 🚨 If Something Goes Wrong

### Get Debug Information
1. **Open Command Palette**: Cmd+Shift+P
2. **Run**: "Neusis Code: Show OpenCode Status"
3. **Copy output** and share for debugging

### Check Logs
- Output panel: "Neusis Code" channel
- Developer Console: Check for errors
- Extension Host logs: Help → Toggle Developer Tools

### Reset Extension
If things are broken:
1. Uninstall extension
2. Restart VS Code
3. Reinstall extension
4. Try again

---

## ✅ Success Criteria

The implementation is successful if:

1. ✅ Extension activates without errors
2. ✅ Auto-detects Claude CLI backend
3. ✅ Connects to backend successfully
4. ✅ Chat interface loads and is functional
5. ✅ Messages can be sent and received
6. ✅ Streaming responses work
7. ✅ Status command shows correct backend info
8. ✅ No crashes or critical errors

---

## 🎉 Next Steps After Testing

Once basic testing passes:

1. **Test edge cases**: Network issues, permission prompts, long messages
2. **Performance testing**: Large conversations, file attachments
3. **Install OpenCode CLI**: Test dual-backend support
4. **Backend switching**: Test manual override and auto-detection
5. **WSL testing** (Windows): Enable WSL mode for Claude CLI
6. **Create bug reports**: Document any issues found
7. **Gather feedback**: Share with users for real-world testing

---

## 💡 Pro Tips

- **Use Development Mode** for debugging (F5 in VS Code)
- **Watch logs continuously** in Output panel
- **Test incrementally**: One feature at a time
- **Document everything**: Screenshots, error messages, logs
- **Compare behaviors**: Test same scenario with different backends
- **Check performance**: Monitor CPU/memory usage

Happy Testing! 🚀
