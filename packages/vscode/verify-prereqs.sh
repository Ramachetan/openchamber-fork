#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Neusis Code Extension - Prerequisites Verification       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="${GREEN}✅${NC}"
cross_mark="${RED}❌${NC}"
warning_mark="${YELLOW}⚠️${NC}"

all_pass=true

echo "=== Build Outputs ==="
if [ -f "dist/extension.js" ]; then
    size=$(ls -lh dist/extension.js | awk '{print $5}')
    echo -e "${check_mark} Extension built: dist/extension.js ($size)"
else
    echo -e "${cross_mark} Extension not built: dist/extension.js missing"
    all_pass=false
fi

if [ -f "dist/webview/index.html" ]; then
    echo -e "${check_mark} Webview built: dist/webview/index.html"
else
    echo -e "${cross_mark} Webview not built: dist/webview/index.html missing"
    all_pass=false
fi

echo ""
echo "=== Dependencies ==="

if [ -d "node_modules/@types/vscode" ]; then
    echo -e "${check_mark} VS Code types installed"
else
    echo -e "${cross_mark} VS Code types missing"
    all_pass=false
fi

if [ -d "node_modules/@opencode-ai/sdk" ]; then
    echo -e "${check_mark} OpenCode SDK installed"
else
    echo -e "${cross_mark} OpenCode SDK missing"
    all_pass=false
fi

dep_count=$(ls -1 node_modules 2>/dev/null | wc -l)
echo -e "${check_mark} Total packages: $dep_count"

echo ""
echo "=== Backend CLIs ==="

if command -v opencode &> /dev/null; then
    version=$(opencode --version 2>&1 | head -1)
    echo -e "${check_mark} OpenCode CLI: $version"
else
    echo -e "${warning_mark} OpenCode CLI: Not installed (optional)"
fi

if command -v claude &> /dev/null; then
    version=$(claude --version 2>&1 | head -1)
    echo -e "${check_mark} Claude CLI: $version"
else
    echo -e "${warning_mark} Claude CLI: Not installed (optional)"
fi

# Check if at least one backend is available
if command -v opencode &> /dev/null || command -v claude &> /dev/null; then
    echo -e "${check_mark} At least one backend CLI available"
else
    echo -e "${cross_mark} No backend CLI available (need OpenCode or Claude)"
    echo "  Install OpenCode: npm install -g @opencode-ai/cli"
    echo "  Install Claude: https://claude.ai/download"
    all_pass=false
fi

echo ""
echo "=== TypeScript Compilation ==="

if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${cross_mark} TypeScript errors found"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -5
    all_pass=false
else
    echo -e "${check_mark} No TypeScript errors"
fi

echo ""
echo "=== Package Configuration ==="

if [ -f "package.json" ]; then
    echo -e "${check_mark} package.json exists"

    if grep -q '"neusis-code.backend"' package.json; then
        echo -e "${check_mark} Backend configuration added"
    else
        echo -e "${cross_mark} Backend configuration missing"
        all_pass=false
    fi
else
    echo -e "${cross_mark} package.json missing"
    all_pass=false
fi

echo ""
echo "=== Backend Implementation ==="

backend_files=(
    "src/backends/types.ts"
    "src/backends/detector.ts"
    "src/backends/backendManager.ts"
    "src/backends/adapters/opencodeAdapter.ts"
    "src/backends/adapters/claudeAdapter.ts"
    "src/backends/utils/wsl.ts"
    "src/backends/utils/childProcess.ts"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo -e "${check_mark} $file ($lines lines)"
    else
        echo -e "${cross_mark} $file missing"
        all_pass=false
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"

if [ "$all_pass" = true ]; then
    echo -e "║ ${GREEN}✅ All Prerequisites Met - Ready to Test!${NC}              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "  1. Package extension: npx bun run package"
    echo "  2. Install in VS Code: Extensions → Install from VSIX"
    echo "  3. Or press F5 for development mode"
    echo ""
    echo "See TESTING_GUIDE.md for detailed instructions."
    exit 0
else
    echo -e "║ ${RED}❌ Some Prerequisites Missing${NC}                          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Please fix the issues above before testing."
    exit 1
fi
