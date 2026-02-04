# Debugging: "Not selected (model)" Issue

## Symptoms
- Extension opens but shows "Not selected (model)"
- "Select Agent" dropdown is empty
- No models or agents are listed

## Root Causes

### Cause 1: Backend Not Connected Yet
**Symptoms**:
- Output panel shows "connecting..." or no messages
- Just opened extension

**Solution**: Wait 10-15 seconds for connection

---

### Cause 2: Backend Connection Failed
**Symptoms**:
- Output panel shows errors
- Status shows "disconnected" or "error"

**Check Output Panel** for errors like:
```
[Backend Manager] Failed to initialize
[OpenCode Adapter] CLI not found
[Claude Adapter] Process failed to start
```

**Solutions**:
1. Check CLI is installed: `opencode --version` or `claude --version`
2. Restart backend: Command → "Neusis Code: Restart API Connection"
3. Check settings: `neusis-code.backend` is set correctly

---

### Cause 3: Backend Connected But API Calls Failing
**Symptoms**:
- Output says "connected"
- But UI shows no models

**Check Developer Console** (Help → Toggle Developer Tools):
- Look for failed API calls (red in Network tab)
- Look for JavaScript errors (red in Console tab)

**Common errors**:
```
Failed to fetch /config
Failed to fetch /config/providers
CORS error
Network request failed
```

**Solutions**:

#### For OpenCode Backend:
1. Check OpenCode server is running:
   ```bash
   # In terminal
   opencode serve
   ```
2. Check API URL in settings (should be empty for auto-start)
3. Try setting explicit API URL if you have OpenCode server running:
   ```json
   {
     "neusis-code.apiUrl": "http://localhost:PORT"
   }
   ```

#### For Claude CLI Backend:
1. Check process is running:
   ```bash
   ps aux | grep claude
   ```
2. Check Output panel for Claude adapter messages
3. Try restarting: Command → "Restart API Connection"

---

### Cause 4: UI-Backend Protocol Mismatch
**Symptoms**:
- Backend connected
- No API errors
- But data not showing in UI

**This might be a compatibility issue** between the unified backend and the expected API format.

**Debug Steps**:

1. **Check which backend is active**:
   - Output panel: Look for "Selected backend: X"
   - Status command: Shows backend type

2. **Check API responses** in Developer Tools:
   - Network tab
   - Look for requests to `/config`, `/config/providers`, `/agent`
   - Check response data format

3. **Try the other backend**:
   ```json
   {
     "neusis-code.backend": "claude-cli"  // Switch if using opencode
   }
   ```
   Reload and see if models appear

---

## Diagnostic Commands

Run these in VS Code terminal:

```bash
# Check CLIs are installed
opencode --version
claude --version

# Check processes
ps aux | grep -E "(opencode|claude)" | grep -v grep

# Check ports (if using OpenCode)
lsof -i :47680  # or whatever port OpenCode uses
netstat -an | grep LISTEN | grep -E "(47680|3000|8080)"
```

---

## Quick Tests

### Test 1: Force OpenCode
```json
{
  "neusis-code.backend": "opencode"
}
```
Reload → Check Output → Check UI

### Test 2: Force Claude CLI
```json
{
  "neusis-code.backend": "claude-cli"
}
```
Reload → Check Output → Check UI

### Test 3: Development Mode
1. Open extension folder in VS Code:
   ```bash
   code /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode
   ```
2. Press **F5** to launch Extension Development Host
3. Check console for detailed errors

---

## Expected Output Panel Messages

### Successful OpenCode Connection:
```
[Backend Manager] Detecting available backends...
[Backend Manager] Available backends: opencode, claude-cli
[Backend Manager] Selected backend: opencode
[Backend Manager] Initializing opencode backend...
[OpenCode Adapter] Initializing...
[OpenCode Adapter] CLI available: true
[OpenCode Adapter] Connecting...
[OpenCode Adapter] Connected
```

### Successful Claude CLI Connection:
```
[Backend Manager] Detecting available backends...
[Backend Manager] Available backends: claude-cli
[Backend Manager] Selected backend: claude-cli
[Backend Manager] Initializing claude-cli backend...
[Claude Adapter] Initializing...
[Claude Adapter] CLI version: 2.1.30
[Claude Adapter] Connecting...
[Claude Adapter] Spawning in native mode...
[Claude Adapter] Sent init request
[Claude Adapter] Session ID: abc123...
```

---

## Data to Collect

If issue persists, gather this info:

1. **Backend Status**:
   - Command → "Show OpenCode Status"
   - Copy full output

2. **Output Panel Logs**:
   - View → Output → "Neusis Code"
   - Copy all messages

3. **Console Errors**:
   - Help → Toggle Developer Tools
   - Console tab → Copy any red errors

4. **Network Activity**:
   - Developer Tools → Network tab
   - Look for failed requests (red)
   - Copy request URLs and errors

5. **Backend Settings**:
   ```json
   // From VS Code settings.json
   {
     "neusis-code.backend": "???",
     "neusis-code.apiUrl": "???"
   }
   ```

6. **CLI Verification**:
   ```bash
   which opencode
   which claude
   opencode --version
   claude --version
   echo $PATH
   ```

Share this data for debugging assistance.

---

## Known Issues & Workarounds

### Issue: OpenCode server not starting automatically
**Workaround**: Start manually in terminal:
```bash
opencode serve
```
Then configure API URL in settings.

### Issue: Claude CLI not spawning
**Workaround**: Check WSL settings (Windows only):
```json
{
  "neusis-code.claudeCli.wslEnabled": false
}
```

### Issue: Models load but agents don't
**Expected**: Claude CLI doesn't support agents - this is normal.
**OpenCode**: Check if agents are configured in OpenCode.

---

## Next Steps

1. **Check Output panel** - Share what you see
2. **Check Developer Console** - Any errors?
3. **Try backend restart** - Does that help?
4. **Try switching backends** - Does one work but not the other?

Let me know what you find and I can help further! 🔍
