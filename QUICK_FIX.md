# Quick Fix: No Models/Agents Showing

## Immediate Actions

### 1. Restart Backend Connection

**Try this first**:
1. Press `Cmd+Shift+P` (Command Palette)
2. Type: `Neusis Code: Restart`
3. Select: **"Neusis Code: Restart API Connection"**
4. Wait 10-15 seconds
5. Check if models appear

---

### 2. Check Backend is Actually Running

Open VS Code **Terminal** (View → Terminal):

```bash
# Check if OpenCode is running
ps aux | grep opencode | grep -v grep

# Check if Claude is running
ps aux | grep claude | grep -v grep

# Try starting OpenCode manually
opencode serve
```

Leave the terminal open if `opencode serve` starts successfully.

---

### 3. Force Specific Backend

**Add this to settings**:

1. `Cmd+,` to open Settings
2. Click **Open Settings (JSON)** icon (top right)
3. Add this:

```json
{
  "neusis-code.backend": "opencode",
  "neusis-code.apiUrl": ""
}
```

4. Save
5. **Reload**: `Cmd+Shift+P` → "Reload Window"

---

### 4. Try Claude CLI Instead

If OpenCode isn't working, try Claude:

```json
{
  "neusis-code.backend": "claude-cli"
}
```

Reload and check if models appear.

---

## What's Likely Happening

The extension UI is loading, but the **backend isn't connecting**, so it can't fetch:
- Available models
- Available agents
- Configuration data

## Quick Test: Is Backend Even Connected?

1. Look at bottom of VS Code window
2. Do you see any status indicators?
3. Are there any error notifications (red badges)?

---

## Alternative: Use Development Mode

For better debugging:

1. **Close current VS Code window**
2. **Open terminal**:
   ```bash
   cd /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode
   code .
   ```
3. **Press F5** in VS Code
4. **New window opens** (Extension Development Host)
5. **Open Developer Tools** there (Help → Toggle Developer Tools)
6. You'll see detailed logs and errors

---

## What I Need From You

To help debug, please share:

### A. Settings Check
Run in VS Code terminal:
```bash
# Check your settings
cat ~/.config/Code/User/settings.json | grep -A5 neusis-code
# Or on Mac:
cat ~/Library/Application\ Support/Code/User/settings.json | grep -A5 neusis-code
```

### B. CLI Check
```bash
which opencode
which claude
opencode --version
claude --version
```

### C. Process Check
```bash
ps aux | grep -E "(opencode|claude)" | grep -v grep
```

Share the output of these commands and I can help pinpoint the issue.

---

## Most Likely Fix

Based on the symptoms, **the backend isn't starting**. Try:

### Option 1: Start OpenCode Manually
```bash
# In terminal
opencode serve
```

Keep that running, then:
```json
{
  "neusis-code.backend": "opencode"
}
```
Reload VS Code.

### Option 2: Use Claude CLI
```json
{
  "neusis-code.backend": "claude-cli"
}
```
Reload VS Code.

One of these should work! Let me know what happens. 🔧
