---
description: Scan for dangerous fallback patterns using || with arrays that might be empty
---

# Audit Fallback Patterns

This workflow detects potentially buggy JavaScript/TypeScript patterns where `||` operator is used with arrays that could be empty (truthy but logically "false").

## Problem Pattern

```javascript
// DANGEROUS - empty array [] is truthy!
let config = data?.groupBy || data?.settings?.groupBy || fallback;
// If data.groupBy is [], it's truthy and fallback is never reached!

// SAFE - explicitly check length
if (data?.groupBy?.length > 0) {
    config = data.groupBy;
} else if (data?.settings?.groupBy?.length > 0) {
    config = data.settings.groupBy;
}
```

## Steps

// turbo-all

1. Run the detection script:
```powershell
# Scan for patterns like: variable?.arrayProp || fallback
# Focus on common array property names: groupBy, fields, items, list, data, values, options, actions, levels
Get-ChildItem -Path "c:\projects\cerdas\apps" -Recurse -Include *.ts,*.tsx,*.vue,*.js -File | 
    Select-String -Pattern '\?\.(groupBy|fields|items|list|data|values|options|actions|levels|columns|rows|records|entries)\s*\|\|' |
    ForEach-Object { 
        [PSCustomObject]@{
            File = $_.Path -replace '^.*\\apps\\', 'apps\'
            Line = $_.LineNumber
            Match = $_.Line.Trim()
        }
    } | Format-Table -AutoSize -Wrap
```

2. Review each match manually - not all are bugs, but each should be evaluated:
   - Is the property expected to be an array?
   - Could it be empty `[]`?
   - If empty, should the fallback be used?

3. Fix pattern by replacing `||` with explicit length check:
```typescript
// Before (buggy):
let config = data?.groupBy || data?.views?.default?.groupBy;

// After (safe):
const hasNonEmptyArray = (val: any) => Array.isArray(val) && val.length > 0;
let config = null;
if (hasNonEmptyArray(data?.groupBy)) {
    config = data.groupBy;
} else if (hasNonEmptyArray(data?.views?.default?.groupBy)) {
    config = data.views.default.groupBy;
}
```

## Quick Scan Command

Run this one-liner to quickly find potential issues:
```powershell
Get-ChildItem -Path "apps" -Recurse -Include *.ts,*.vue -File | sls '\?\.\w+\s*\|\|' | Select-Object -First 50
```

## Common False Positives
- `value?.string || 'default'` - strings are fine
- `value?.number || 0` - numbers are fine  
- `value?.boolean || false` - booleans are fine
- `value?.object || {}` - objects without checking nested arrays are fine

Focus on property names that are likely arrays: `groupBy`, `fields`, `items`, `list`, `actions`, `options`, `values`, `levels`, `columns`, `rows`.
