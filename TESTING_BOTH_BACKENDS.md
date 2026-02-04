# Testing Both OpenCode and Claude CLI Backends

## Current Setup

You have **both backends** installed:
- ✅ OpenCode CLI
- ✅ Claude CLI (v2.1.30)

The extension will **auto-detect both** and choose one to use.

---

## 🔄 Switching Between Backends

### Option 1: VS Code Settings UI

1. **Open Settings**: `Cmd+,`
2. **Search**: `neusis-code.backend`
3. **Change value**:
   - `auto` - Auto-detect (prefers OpenCode)
   - `opencode` - Force OpenCode
   - `claude-cli` - Force Claude CLI
4. **Reload**: `Cmd+Shift+P` → "Reload Window"

### Option 2: Settings JSON

1. **Open Command Palette**: `Cmd+Shift+P`
2. **Type**: "Preferences: Open User Settings (JSON)"
3. **Add**:
```json
{
  "neusis-code.backend": "opencode"  // or "claude-cli" or "auto"
}
```
4. **Reload VS Code**

---

## 📊 Test Comparison Table

| Feature | OpenCode | Claude CLI | How to Test |
|---------|----------|------------|-------------|
| **Basic Chat** | ✅ | ✅ | Send "Hello, explain recursion" |
| **Code Generation** | ✅ | ✅ | "Write a binary search function in Python" |
| **Streaming** | ✅ | ✅ | Watch response appear gradually |
| **File Context** | ✅ | ✅ | Open file, ask "What does this do?" |
| **Agents** | ✅ | ❌ | Look for agent selector in UI |
| **Skills** | ✅ | ❌ | Command: "Neusis Code: Open Agent Manager" |
| **Terminal** | ✅ | ❌ | Check if terminal commands work |
| **Git/GitHub** | ✅ | ❌ | Try git-related queries |
| **Session History** | ✅ | ✅ | Check conversation persistence |

---

## 🧪 Test Plan for OpenCode

### 1. Configure for OpenCode
```json
{
  "neusis-code.backend": "opencode"
}
```

### 2. Reload VS Code
`Cmd+Shift+P` → "Reload Window"

### 3. Verify Connection
**Output Panel** should show:
```
[Backend Manager] Selected backend: opencode
[OpenCode Adapter] CLI available: true
[Backend Manager] Successfully connected to opencode
```

### 4. Test Basic Features

#### A. Chat
- Open Neusis Code sidebar
- Type: "What is the difference between == and === in JavaScript?"
- Should get detailed response

#### B. Code Generation
- Ask: "Write a function to reverse a linked list"
- Should generate working code

#### C. Code Explanation
- Open any code file
- Ask: "Explain what this file does"
- Should analyze the open file

#### D. Agents (OpenCode Only!)
- Command Palette: "Neusis Code: Open Agent Manager"
- Should see list of available agents
- Try selecting different agents

#### E. Skills (OpenCode Only!)
- In chat, type: "/skills" or look for skills menu
- Should see available skills catalog

#### F. Terminal Integration (OpenCode Only!)
- Try: "Run the tests in this project"
- OpenCode may execute terminal commands

### 5. Check Status
- `Cmd+Shift+P` → "Neusis Code: Show OpenCode Status"
- Should show:
  - Backend Type: `opencode`
  - Status: `connected`
  - OpenCode-specific info

---

## 🧪 Test Plan for Claude CLI

### 1. Configure for Claude CLI
```json
{
  "neusis-code.backend": "claude-cli"
}
```

### 2. Reload VS Code
`Cmd+Shift+P` → "Reload Window"

### 3. Verify Connection
**Output Panel** should show:
```
[Backend Manager] Selected backend: claude-cli
[Claude Adapter] CLI version: 2.1.30
[Backend Manager] Successfully connected to claude-cli
```

### 4. Test Core Features

#### A. Chat
- Open Neusis Code sidebar
- Type: "Explain async/await in JavaScript"
- Should get detailed response

#### B. Code Generation
- Ask: "Create a React component for a todo list"
- Should generate component code

#### C. Streaming
- Ask: "Write a detailed explanation of how React hooks work"
- Watch text appear gradually (streaming)

#### D. Permissions
- Try: "Read the package.json file and list the dependencies"
- Claude may ask for permission to read files
- Approve and see results

#### E. File Context
- Open a code file
- Ask: "Can you refactor this to be more readable?"
- Should analyze and suggest improvements

#### F. Session Persistence
- Have a conversation
- Close and reopen VS Code
- Previous conversation should be available

### 5. Check Status
- `Cmd+Shift+P` → "Neusis Code: Show OpenCode Status"
- Should show:
  - Backend Type: `claude-cli`
  - Backend Version: `2.1.30`
  - Status: `connected`

### 6. Verify Limited Features
These should NOT be available with Claude CLI:
- ❌ No agent selector
- ❌ No skills catalog
- ❌ No terminal commands
- ❌ No git/github integration

This is expected and correct!

---

## 🔄 Auto-Detection Test

### 1. Set to Auto
```json
{
  "neusis-code.backend": "auto"
}
```

### 2. Reload VS Code

### 3. Check Which Was Selected
**Output Panel** will show which backend was auto-detected:
```
[Backend Manager] Available backends: opencode, claude-cli
[Backend Manager] Recommended: opencode
[Backend Manager] Selected backend: opencode
```

**Auto-detection priority**:
1. Configured API URL → OpenCode
2. OpenCode CLI available → OpenCode
3. Claude CLI available → Claude CLI
4. None available → Error

So with both installed, **auto mode will prefer OpenCode**.

---

## 📝 Test Results Template

Use this to document your testing:

### Test Session: [Date/Time]

#### OpenCode Backend Test
**Configuration**: `"neusis-code.backend": "opencode"`

- [ ] Extension activated successfully
- [ ] Backend connected: ✅/❌
- [ ] Basic chat works: ✅/❌
- [ ] Code generation works: ✅/❌
- [ ] Agent manager accessible: ✅/❌
- [ ] Skills catalog visible: ✅/❌
- [ ] Status command shows correct backend: ✅/❌

**Notes**:

#### Claude CLI Backend Test
**Configuration**: `"neusis-code.backend": "claude-cli"`

- [ ] Extension activated successfully
- [ ] Backend connected: ✅/❌
- [ ] Basic chat works: ✅/❌
- [ ] Code generation works: ✅/❌
- [ ] Streaming responses work: ✅/❌
- [ ] Permission prompts work: ✅/❌
- [ ] Agent/skills hidden (expected): ✅/❌
- [ ] Status command shows correct backend: ✅/❌

**Notes**:

#### Auto-Detection Test
**Configuration**: `"neusis-code.backend": "auto"`

- [ ] Detected both backends: ✅/❌
- [ ] Selected OpenCode (expected): ✅/❌
- [ ] Connection successful: ✅/❌

**Notes**:

---

## 🐛 Troubleshooting

### Backend Won't Switch

**Symptom**: Changed setting but still using old backend

**Solution**:
1. Save settings file
2. **Fully reload**: `Cmd+Shift+P` → "Reload Window"
3. Check Output panel to verify switch

### Both Backends Fail

**Check**:
```bash
# In terminal
opencode --version
claude --version
```

Both should work. If not, reinstall the failing one.

### Wrong Backend Selected

**Force specific backend**:
```json
{
  "neusis-code.backend": "claude-cli"  // Explicit, no auto-detection
}
```

---

## 💡 Tips for Testing

1. **Watch the Logs**: Output panel shows everything
2. **Test Incrementally**: One feature at a time
3. **Compare Behaviors**: Same question, different backends
4. **Document Differences**: Note what works where
5. **Check Performance**: Speed, quality, accuracy

---

## 🎯 Quick Test Commands

Try these with each backend:

1. **Basic**:
   - "Hello! What can you help me with?"

2. **Code Gen**:
   - "Write a function to check if a string is a palindrome"

3. **Explanation**:
   - "Explain how JavaScript closures work"

4. **Refactoring**:
   - (Open a file) "Make this code more efficient"

5. **Debugging**:
   - (With code) "Find potential bugs in this code"

6. **Architecture**:
   - "How should I structure a REST API for a todo app?"

---

## ✅ Success Criteria

Both backends pass if:

- ✅ Connection succeeds
- ✅ Chat is responsive
- ✅ Code generation works
- ✅ Responses are accurate
- ✅ No crashes or errors
- ✅ Switching works smoothly

OpenCode passes if:
- ✅ All above, PLUS
- ✅ Agents accessible
- ✅ Skills visible
- ✅ Advanced features work

Claude CLI passes if:
- ✅ Core features work
- ✅ Permissions work
- ✅ Advanced features properly hidden

---

## 📚 Additional Testing

After basic tests pass:

1. **Long Conversations**: Test session persistence
2. **Large Files**: Open big files, ask for analysis
3. **Multiple Files**: Work with multiple open files
4. **Error Handling**: Try invalid requests
5. **Performance**: Monitor CPU/memory usage

Enjoy testing! 🚀
