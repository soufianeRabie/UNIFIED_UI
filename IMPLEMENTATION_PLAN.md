# Security UI — Missing Features Implementation Plan

## Gap Analysis Summary

Backend has full implementations for the following features that have **zero Angular UI**:

| Feature                      | Backend Endpoints                                      | Status              |
| ---------------------------- | ------------------------------------------------------ | ------------------- |
| Auth Settings (admin)        | GET/PUT `/api/auth/settings`                           | ❌ Missing          |
| MFA — TOTP Setup             | POST `/api/auth/mfa/totp/setup`, `/verify`, `/disable` | ❌ Missing          |
| MFA — Recovery Codes         | POST `/api/auth/mfa/recovery-codes`                    | ❌ Missing          |
| MFA — Email OTP              | POST `/api/auth/mfa/email`                             | ❌ Missing          |
| Password Reset (public flow) | POST `/api/auth/reset-request`, `/reset/verify`        | ❌ Missing          |
| Auth Events / Login History  | Domain entity `SecuAuthEvent` (no query endpoint yet)  | ⚠ Backend stub only |
| User MFA status              | Embedded in user detail                                | ❌ Missing          |

---

## Implementation Phases

### Phase 1 — Auth Settings Admin Page

**Route:** `/admin/auth-settings`  
**Page code:** `AUTH_SETTINGS`  
**Permissions needed in DB:** `AUTH_SETTINGS` page with `READ`, `UPDATE` actions

UI: Single-page form with sections:

- General (allow password login, require MFA)
- MFA Methods (enable TOTP, email OTP, recovery codes, TTLs, rate limits)
- Password Policy (min length, require upper/lower/digit/special)
- Lockout (enable, max attempts, duration)
- Token TTL (access token minutes, refresh token days)
- Password Reset (token TTL, code TTL, max requests/hour, IP binding, UA binding)

### Phase 2 — User MFA Status in User Detail

Add a "Security" tab to `user-detail.component.ts`:

- Show MFA enabled status (TOTP / Email OTP)
- Show recovery codes enabled status
- Admin actions: force-disable MFA (via a custom admin endpoint if needed)

### Phase 3 — My Security / Profile Page (self-service)

**Route:** `/admin/my-security`  
For the currently logged-in user:

- TOTP Setup wizard (show QR code + secret, verify code to activate)
- Enable/Disable Email OTP
- Generate Recovery Codes (show once)
- Change Password (if API exposes it)

### Phase 4 — Forgot Password Public Page

**Route:** `/auth/forgot-password` (standalone, outside admin layout)  
Two-step flow:

1. Enter email → POST `/api/auth/reset-request` → get SID in response (or from email)
2. Enter SID + code + new password → POST `/api/auth/reset/verify`

Note: `reset-request` returns `AuthActionResultDto { Message }` — actual SID/code is sent via email by backend. Frontend only needs to show "Check your email" then the verify form.

---

## Detailed Implementation Steps

### Step 1: Add models to `secu.models.ts`

New interfaces:

- `AuthSettingsDto` (25 properties matching backend record)
- `UpsertAuthSettingsRequest` (23 optional properties)
- `TotpSetupDto { secret: string; otpauthUri: string }`
- `RecoveryCodesDto { codes: string[] }`
- `AuthActionResultDto { message: string }`

### Step 2: Add API methods to `secu-api.service.ts`

- `getAuthSettings(tenantId?: string)` → GET `/api/auth/settings`
- `upsertAuthSettings(body)` → PUT `/api/auth/settings`
- `setupTotp()` → POST `/api/auth/mfa/totp/setup`
- `verifyTotpSetup(code)` → POST `/api/auth/mfa/totp/verify`
- `disableTotp()` → POST `/api/auth/mfa/totp/disable`
- `generateRecoveryCodes()` → POST `/api/auth/mfa/recovery-codes`
- `setEmailOtp(enabled)` → POST `/api/auth/mfa/email`
- `requestPasswordReset(email, tenantId?)` → POST `/api/auth/reset-request`
- `verifyPasswordReset(sid, code, newPassword)` → POST `/api/auth/reset/verify`

Note: Auth endpoints use `/api/auth/...` not `/api/secu/...` — need separate base URL.

### Step 3: Auth Settings component

File: `src/app/secu/components/auth-settings/auth-settings.component.ts`

- Loads current settings on init
- Form with all 23 settings grouped into sections
- Save button with permission guard (`AUTH_SETTINGS` / UPDATE)
- Tenant selector for multi-tenant

### Step 4: My Security component

File: `src/app/secu/components/my-security/my-security.component.ts`

- Tabs: TOTP | Email OTP | Recovery Codes
- TOTP tab: Setup button → shows QR + secret → verify code → activated
- Email OTP tab: toggle switch
- Recovery codes tab: generate button → modal showing codes (one-time display)

### Step 5: Forgot Password component

File: `src/app/secu/components/auth/forgot-password.component.ts`

- Standalone (no layout wrapper, fullscreen)
- Step 1: email form → "Check your email"
- Step 2: SID + code + new password + confirm

### Step 6: Register routes

- `auth-settings` → in `SECU_ROUTES` under admin layout
- `my-security` → in `SECU_ROUTES` under admin layout
- `forgot-password` → separate route outside layout, accessible without auth

### Step 7: Update sidebar navigation

Add "Auth Settings" and "My Security" to `secu-layout.component.ts` sidebar

---

## File Creation Order

1. `secu.models.ts` — add missing interfaces
2. `secu-api.service.ts` — add auth API methods (separate `authBase` URL)
3. `auth-settings/auth-settings.component.ts` — new component
4. `my-security/my-security.component.ts` — new component
5. `auth/forgot-password.component.ts` — new standalone component
6. `secu.routes.ts` — add new routes
7. `secu-layout.component.ts` — update sidebar links

---

## Status

- [x] Phase 1: Auth Settings Admin Page — `auth-settings.component.ts`, route `/auth-settings`
- [ ] Phase 2: User MFA Status in User Detail — tab in `user-detail.component.ts`
- [x] Phase 3: My Security / Profile Page — `my-security.component.ts`, route `/my-security`
- [x] Phase 4: Forgot Password Public Page — `forgot-password.component.ts`, route `/forgot-password`

## DB Setup Required (add to Pages table via Admin UI)

To make the new pages appear in the sidebar via the menu API, add these records:

- Page code: `AUTH_SETTINGS`, URL: `/admin/auth-settings`, Actions: `READ`, `UPDATE`
- Page code: `MY_SECURITY`, URL: `/admin/my-security`, Actions: `READ`, `UPDATE`
