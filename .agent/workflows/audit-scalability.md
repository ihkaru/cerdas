---
description: Audit project architecture against Vue 3 Scalable Principles
---

# Scalability Audit Workflow

This workflow analyzes the project's adherence to modular Vue 3 architecture principles and provides improvement recommendations.

## Instructions for Agent

When the user runs `/audit-scalability`, follow these steps to generate an audit report:

## Step 1: Analyze Modular Structure

Check if features are properly separated into `src/app/{module}` folders.

**Expected Structure per Module:**
```
src/app/{module}/
├── components/    # Module-specific components
├── views/         # Page-level components
├── stores/        # Module-specific Pinia stores
├── composables/   # Module-specific composables
├── types/         # Module-specific types
└── routes.ts      # Module routes (optional)
```

**Commands to Run:**
```powershell
# List all module directories
Get-ChildItem -Path "apps/client/src/app" -Directory
Get-ChildItem -Path "apps/editor/src/app" -Directory
```

**Red Flags:**
- Components directly in `src/components` that are module-specific
- Views not organized by feature/module
- Stores scattered outside module folders

---

## Step 2: Analyze Common Folder Usage

Check if reusable code is centralized in `src/common`.

**Expected Structure:**
```
src/common/
├── api/           # API clients
├── components/    # Shared UI components
├── composables/   # Shared composables
├── stores/        # Global stores (auth, theme, etc.)
├── utils/         # Utility functions
├── types/         # Shared type definitions
└── database/      # Database services
```

**Grep Commands:**
```powershell
# Find imports from common folder
rg "from '@/common" --type vue --type ts -l
rg "from '../common" --type vue --type ts -l
```

**Red Flags:**
- Utility functions duplicated across modules
- API clients defined inside modules instead of common

---

## Step 3: Check for Cross-Module Coupling

Detect if modules import directly from each other (tight coupling).

**Commands to Run:**
```powershell
# Check if dashboard imports from auth (should go through common/stores)
rg "from '.*app/auth" apps/client/src/app/dashboard --type ts --type vue

# Check if editor imports directly from client modules
rg "from '.*app/client" apps/editor/src/app --type ts --type vue
```

**Red Flags:**
- Direct imports between `src/app/{moduleA}` and `src/app/{moduleB}`
- Components importing from other module's internal folders

**Recommendation:**
If cross-module communication is needed, use:
1. Shared stores in `common/stores`
2. Event bus or props through parent components
3. Composables in `common/composables`

---

## Step 4: TypeScript Best Practices

Check for proper type usage.

**Commands to Run:**
```powershell
# Find uses of 'any' type
rg ": any" apps/client/src --type ts --type vue -c
rg ": any" apps/editor/src --type ts --type vue -c

# Find files without proper type imports
rg "import type" apps/client/src --type ts -l | Measure-Object
```

**Red Flags:**
- Excessive use of `any` type
- Missing type definitions for API responses
- Inline type definitions instead of centralized types

---

## Step 5: God Files Detection

Find files that are too large and need refactoring.

> [!TIP]
> This project already has a dedicated script for this! Use it instead of manual commands.

**Command to Run:**
```powershell
# Use the existing project script (threshold: 400 lines)
cd c:\projects\cerdas
.\detect-large-files.bat
```

**What the Script Checks:**
- Files with >400 lines in `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.php`, `.css`, `.scss`
- Automatically excludes: `node_modules`, `vendor`, `.git`, `dist`, `android`, etc.

**Red Flags:**
- Files with 400+ lines of code
- Components doing too many things (violating Single Responsibility)

---

## Step 6: Route Modularity

Check if routes are modular (each module has its own routes.ts).

**Commands to Run:**
```powershell
# Find all routes.ts files
Get-ChildItem -Path "apps/client/src" -Recurse -Filter "routes.ts"
Get-ChildItem -Path "apps/editor/src" -Recurse -Filter "routes.ts"

# Check main router for spread operator usage
rg "\.\.\..*Routes" apps/client/src/routes.ts
rg "\.\.\..*Routes" apps/editor/src/routes.ts
```

**Red Flags:**
- All routes defined in single file
- Missing routes.ts in large modules

## Step 7: Unused Code Detection (Optional - Requires Tool Installation)

Detect unused exports, dead code, and unused components.

> [!NOTE]
> These tools require one-time installation. Run the install command if not already installed.

### A. Using Knip (Recommended for TypeScript)

**Installation (one-time):**

```powershell
pnpm add -D knip -w
```

**Command to Run:**

```powershell
cd c:\projects\cerdas
npx knip
```

**What it Detects:**
- Unused files (never imported)
- Unused exports
- Unused dependencies in package.json
- Unused class/enum members

### B. Using vue-unused (For Vue Components)

**Installation (one-time):**

```powershell
npm install -g vue-unused
```

**Command to Run:**

```powershell
cd c:\projects\cerdas\apps\client
vue-unused --dir src
```

**What it Detects:**
- Vue components that are never used in templates
- Unused imports in Vue files

---

## Step 8: Duplicated Code Detection (Optional - Requires Tool Installation)

Find copy-pasted and structurally similar code.

### Using jscpd (JavaScript Copy/Paste Detector)

**Installation (one-time):**

```powershell
npm install -g jscpd
```

**Command to Run:**

```powershell
cd c:\projects\cerdas
jscpd apps/client/src apps/editor/src --reporters console --ignore "node_modules,vendor,.git,dist,android"
```

**Output:**
- Shows duplicated blocks with file locations and line numbers
- Reports duplication percentage

**Red Flags:**
- Duplication percentage > 5%
- Same logic copy-pasted across modules (should be in `common/`)

---

## Output Format

Generate a markdown report with the following structure:

```markdown
# Scalability Audit Report

**Date:** [Current Date]
**Apps Audited:** client, editor

## Summary

| Aspect | Status | Issues Found |
|--------|--------|--------------|
| Modular Structure | ✅/⚠️/❌ | X issues |
| Common Folder | ✅/⚠️/❌ | X issues |
| Loose Coupling | ✅/⚠️/❌ | X issues |
| TypeScript | ✅/⚠️/❌ | X issues |
| God Files | ✅/⚠️/❌ | X issues |
| Route Modularity | ✅/⚠️/❌ | X issues |

## Detailed Findings

### 1. Modular Structure
[Findings and recommendations]

### 2. Common Folder Usage
[Findings and recommendations]

... (continue for each aspect)

## Recommended Actions

1. [Priority action 1]
2. [Priority action 2]
...
```
