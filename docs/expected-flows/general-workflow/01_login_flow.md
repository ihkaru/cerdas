# 1. Login Flow

## Page: `/login`

### Expected UI
- Login form with Email and Password fields
- "Login" button
- Clean, centered card design

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@cerdas.com | password |
| Supervisor | supervisor@cerdas.com | password |
| Enumerator | user@example.com | password |

### After Login (All Users)
- Redirect to `/dashboard`
- Token stored in localStorage
- User info displayed in header

### Expected Behavior
1. Enter `admin@cerdas.com` / `password`
2. Click Login
3. Loading spinner appears
4. Redirect to Dashboard
5. Header shows "Super Admin"
