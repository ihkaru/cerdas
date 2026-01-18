# Cerdas Architecture Principles

> **Purpose**: Living document capturing all architectural decisions, coding principles, and technical context. This document MUST be consulted before any implementation.

---

## Core Technical Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Backend API** | Laravel 12 | Pure API, NO Filament, NO Blade views |
| **Client App** | Framework7 v9 + Vue 3 + TypeScript | For enumerators/field users |
| **Editor App** | Framework7 v9 + Vue 3 + TypeScript | For admins building forms |
| **Offline Storage** | capacitor-community/sqlite | sql.js + IndexedDB for web |
| **Database** | MySQL | Shared multi-tenant |
| **Auth** | Laravel Sanctum | Self-hosted, token-based |

---

## Monorepo Principles (from references)

### Structure
```
cerdas/
├── apps/
│   ├── backend/     # Laravel API only
│   ├── client/      # Framework7 - data collection (own UI)
│   └── editor/      # Framework7 - form builder (own UI)
├── packages/
│   ├── types/       # @cerdas/types - Shared TS interfaces
│   ├── form-engine/ # @cerdas/form-engine - Form rendering
│   ├── expression-engine/  # @cerdas/expression-engine
│   └── sync-engine/ # @cerdas/sync-engine - Offline sync
```

> [!NOTE]
> UI components are **per-app** (not shared). Client and Editor have different UI needs.

### Key Rules
1. **Apps don't depend on each other** - only on packages
2. **Packages can depend on other packages** - build order managed by Turborepo
3. **Shared code goes to packages** - never duplicate between apps
4. **Each package has own package.json** with scoped name (e.g., `@cerdas/types`)
5. **UI stays in apps** - not shared, each app has `src/components/`

---

## TypeScript Principles (from references)

### 1. Boundaries are King
```typescript
// ✅ CORRECT - Explicit props with strict types
defineProps<{
  user: User;
  config?: { darkMode: boolean };
}>();

// ❌ WRONG - Loose typing
defineProps(['user', 'config']);
```

### 2. Avoid `any` Like Plague
```typescript
// ✅ Use unknown + narrowing
const data: unknown = await fetchData();
if (isUserResponse(data)) {
  console.log(data.user.name);
}

// ❌ Never do this
const data: any = await fetchData();
```

### 3. Discriminated Unions for State
```typescript
// ✅ Single state with union
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// ❌ Multiple booleans
// isLoading, isError, isSuccess - can have invalid states
```

### 4. Type API Responses
```typescript
// Always define interface for API
interface ApiResponse<T> {
  data: T;
  meta?: { pagination: Pagination };
  message?: string;
}
```

### 5. Strict Mode Configuration (MANDATORY)
```json
// tsconfig.json - All packages and apps MUST use these settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

> [!CAUTION]
> Never disable strict mode. Fix type errors, don't silence them.

---

## Vue 3 Scalable Principles (from references)

### Modular App Structure
```
src/
├── app/
│   ├── auth/
│   │   ├── components/
│   │   ├── views/
│   │   ├── composables/
│   │   └── routes.ts
│   ├── forms/
│   │   ├── components/
│   │   ├── views/
│   │   └── routes.ts
│   └── sync/
├── common/
│   ├── api/
│   ├── components/
│   ├── stores/
│   └── utils/
```

### Rules
1. **Each module is self-contained** - own routes, components, composables
2. **Common folder for cross-cutting concerns** - API client, global stores
3. **Lazy load routes** - use `defineAsyncComponent`
4. **Use Suspense** - for async component loading

---

## Context Object Pattern (DI Lite)

> **Purpose**: Inject dependencies via single `ctx` object instead of argument drilling

### AppContext Interface
```typescript
// src/common/types/context.ts
import type { ApiClient } from '../api/ApiClient';
import type { Router } from 'framework7/types';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface AppContext {
  api: ApiClient;
  router: Router;
  db: SQLiteDBConnection;
  currentUser: AuthedUser | null;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

// Extended context when user is authenticated
export type AuthedContext = AppContext & { currentUser: AuthedUser };
```

### Usage in Service Layer
```typescript
// src/app/forms/services/submitForm.ts
import type { AppContext } from '@/common/types/context';

export async function submitForm(ctx: AppContext, formData: FormData) {
  const { api, db, notify, currentUser } = ctx;
  
  // 1. Save to local SQLite first (offline-first)
  await db.run(`INSERT INTO responses ...`, [formData]);
  
  // 2. Try sync to server
  try {
    await api.post('/responses', { data: formData });
    notify('Form submitted!', 'success');
  } catch {
    notify('Saved offline, will sync later', 'success');
  }
}
```

### Creating Context in Components
```typescript
// src/common/composables/useAppContext.ts
import { useStore } from 'framework7-vue';
import { f7 } from 'framework7-vue';
import { useApi } from './useApi';
import { useDatabase } from './useDatabase';

export function useAppContext(): AppContext {
  const authStore = useStore('auth');
  return {
    api: useApi(),
    router: f7.views.main.router,
    db: useDatabase(),
    currentUser: authStore.value.user,
    notify: (msg, type = 'success') => f7.toast.show({ text: msg })
  };
}
```

### Rules for Context Pattern
1. **Use only in Service/Logic layer** - NOT in dumb UI components
2. **If only 1 dependency needed** - pass directly, don't force ctx
3. **Easy to mock for testing** - just create fake ctx object

---

## Framework7 + Vue 3 + TypeScript Setup

### Recommended Initialization
```bash
# Option 1: Use community Vite template (RECOMMENDED)
npx degit sajjadalis/f7-vue-typescript-template apps/client
cd apps/client && pnpm install

# Option 2: Manual setup with Vite
npm create vite@latest apps/client -- --template vue-ts
cd apps/client
pnpm add framework7 framework7-vue
pnpm add @capacitor-community/sqlite
```

### Essential F7 + Vue Config
```typescript
// src/main.ts
import { createApp } from 'vue';
import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';
import App from './App.vue';

Framework7.use(Framework7Vue);

const app = createApp(App);
registerComponents(app);
app.mount('#app');
```

### Using script setup with F7
```vue
<!-- src/app/forms/views/FormView.vue -->
<template>
  <f7-page>
    <f7-navbar title="Form" back-link="Back" />
    <f7-list>
      <f7-list-input
        v-model:value="formData.name"
        label="Name"
        type="text"
        :error-message="errors.name"
        :error-message-force="!!errors.name"
      />
    </f7-list>
    <f7-button fill @click="handleSubmit">Submit</f7-button>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAppContext } from '@/common/composables/useAppContext';
import { submitForm } from '../services/submitForm';

const ctx = useAppContext();
const formData = reactive({ name: '' });
const errors = reactive<Record<string, string>>({});

async function handleSubmit() {
  await submitForm(ctx, formData);
}
</script>
```

## Multi-Tenant Hierarchy

```
Central Authority (Super Admin)
└── Project
    ├── Project Admins (can be added per project)
    └── Organization
        ├── Org Admin
        ├── Supervisor
        └── Enumerator → Assignment(s)
```

### Business Rules
- 1 Assignment = 1 Org + 1 Supervisor + 1 Enumerator
- Users can have **different roles** in different projects
- User sees only **their related assignments**
- Roles: `super_admin`, `project_admin`, `org_admin`, `supervisor`, `enumerator`

---

## Data Schema Decisions

### Dynamic Form Storage
```
app_schemas (id, project_id, name, current_version)
    └── app_schema_versions (id, schema_id, version, schema JSON, published_at)
        └── fields stored in schema JSON or as rows tied to version

assignments (id, schema_version_id, org_id, prelist_data JSON)
    └── responses (id, assignment_id, data JSON, parent_id, local_id)
```

### Schema Versioning Rules
1. **Draft** versions can be edited freely
2. **Published** versions are **immutable**
3. Responses are tied to specific `schema_version_id`
4. Client syncs assigned version (not always latest)
5. Old responses stay with their original version

### Why JSON?
- Forms are dynamic, columns unknown at design time
- Avoids ALTER TABLE for each new field
- Trade-off: harder to query, but acceptable for survey data

---

## Offline-First Strategy

### Sync Flow
```
[Client SQLite] → Sync Queue → [Laravel API] → [MySQL]
                     ↓
              Last-Write-Wins
```

### What Syncs Down (to client)?
- App schema (form definition)
- Prelist/assignments for current user
- Lookup table data

### What Syncs Up (to server)?
- Responses (form submissions)
- Attachments (images, signatures)

---

## Validation Engine

### Execution Environment
- **JavaScript closures** executed on **client-side**
- Admin writes JS in editor, stored as string in DB
- Sandboxed execution with limited context

### Context Available to Closures
```typescript
interface ExpressionContext {
  row: Record<string, any>;      // Current form data
  parent?: Record<string, any>;  // Parent (for nested)
  user: { id, role, orgId };
  prelist: Record<string, any>;  // Prefilled data
  lookup: (table: string, id: any) => any;
}
```

### Expression Types
| Type | Purpose | Example |
|------|---------|---------|
| `VALID_IF` | Validation rule | `row.age >= 17` |
| `SHOW_IF` | Conditional visibility | `row.maritalStatus === 'married'` |
| `EDITABLE_IF` | Enable/disable | `user.role === 'admin'` |
| `REQUIRE_IF` | Conditional required | `row.hasChildren === true` |
| `INITIAL_VALUE` | Default value | `new Date().toISOString()` |

---

## Security Considerations

> [!WARNING]
> JS closures from admin can be malicious. Mitigations:
> 1. Only trusted admins can edit schemas
> 2. Client-side sandboxing (limited global access)
> 3. Audit log for schema changes

---

## Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| TS Types | PascalCase | `AppSchema`, `FieldConfig` |
| Vue Components | PascalCase | `FormRenderer.vue` |
| Composables | camelCase with `use` | `useFormState.ts` |
| Stores | camelCase | `authStore.ts` |
| API Routes | kebab-case | `/api/v1/app-schemas` |
| DB Tables | snake_case plural | `app_schemas`, `responses` |
| Package names | @scope/kebab | `@cerdas/form-engine` |

---

## Questions to Always Ask Before Coding

1. Does this belong in `apps/` or `packages/`?
2. Is this reusable across client and editor?
3. Have I typed the API response?
4. Am I using discriminated unions for state?
5. Does this work offline?
6. Have I considered multi-tenant data isolation?
