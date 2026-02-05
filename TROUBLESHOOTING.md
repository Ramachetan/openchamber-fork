# Troubleshooting - "OpenCode CLI not found"

## Issue
Extension shows: "OpenCode CLI not found" even though `opencode --version` works in your terminal.

## Cause
VS Code might not have the same PATH as your terminal.

## Solutions

### Solution 1: Restart VS Code Completely

1. **Quit VS Code entirely** (Cmd+Q on Mac)
2. **Reopen VS Code from terminal**:
   ```bash
   code /path/to/your/workspace
   ```
3. This ensures VS Code inherits your terminal's PATH

### Solution 2: Check VS Code's PATH

1. Open VS Code terminal (View → Terminal)
2. Run:
   ```bash
   echo $PATH
   opencode --version
   ```
3. If `opencode --version` fails here, VS Code doesn't have access to it

### Solution 3: Add OpenCode to VS Code's PATH

If VS Code terminal can't find `opencode`, add it to your shell profile:

**For Zsh (default on macOS):**
```bash
# Add to ~/.zshrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

**For Bash:**
```bash
# Add to ~/.bash_profile or ~/.bashrc
export PATH="$PATH:$(npm config get prefix)/bin"
```

Then:
1. Restart terminal
2. Verify: `opencode --version`
3. Restart VS Code
4. Try again

### Solution 4: Use Claude CLI Instead

If troubleshooting is taking too long, just use Claude CLI (which is working):

```json
{
  "neusis-code.backend": "claude-cli"
}
```

You'll have core chat features working immediately!

### Solution 5: Configure External API URL

If you have OpenCode running as a server somewhere:

```json
{
  "neusis-code.apiUrl": "http://localhost:PORT"
}
```

Replace PORT with your OpenCode server port.

## Verification Steps

After any solution, verify with:

1. **VS Code Terminal:**
   ```bash
   opencode --version  # Should work
   claude --version    # Should work
   ```

2. **Extension Logs:**
   - View → Output → "Neusis Code"
   - Should see: "Successfully connected to opencode"

3. **Status Command:**
   - Cmd+Shift+P → "Neusis Code: Show OpenCode Status"
   - Backend Type should show: `opencode`
   - Status should show: `connected`

## Still Not Working?

### Check Installation Location

Find where OpenCode is installed:
```bash
which opencode
npm list -g @opencode-ai/cli
```

### Check npm Global Prefix

```bash
npm config get prefix
# Should show something like: /usr/local or ~/.npm-global
```

### Reinstall OpenCode CLI

```bash
npm uninstall -g @opencode-ai/cli
npm install -g @opencode-ai/cli
opencode --version
```

### Use Development Mode

For debugging:
1. Open extension folder in VS Code:
   ```bash
   code /sessions/gifted-determined-bell/mnt/openchamber-fork/packages/vscode
   ```
2. Press **F5** to launch Extension Development Host
3. Check Developer Console for detailed errors

## Contact for Help

If none of these work, gather this info:

```bash
# Your environment
echo "OS: $(uname -s)"
echo "Shell: $SHELL"
echo "PATH: $PATH"

# CLI status
which opencode || echo "opencode not in PATH"
which claude || echo "claude not in PATH"
opencode --version 2>&1 || echo "opencode command failed"
claude --version 2>&1 || echo "claude command failed"

# npm config
npm config get prefix
npm list -g --depth=0 | grep -E "(opencode|claude)"
```

Share this output for debugging assistance.
