# Production release plan: Phase 1 security migration

Status: **PLAN ONLY. Nothing in this document has been executed on production.**
Every step that modifies production is listed in section 2 and needs your separate explicit approval, one by one.

Scope: enable RLS on `reservations`, remove all browser (anon/authenticated) access to business tables, lock
`profiles.business_id`, and move registration to the server route `/api/register-business`.
Production Supabase project (from Supabase's alert email): `qpptpbjksrqfqjunggrq`. The TEST project `woixwqpnpqteguntgmcq` stays isolated.

Tested so far (real results): on TEST, vulnerable state 15 FAIL / 8 PASS; after migration 0 FAIL / 23 PASS; both runs rolled back.
The release scripts in `supabase/release/` were also tested on a local Postgres 16: success path, verification (44/44), rollback,
re-apply, and a forced failure that left the database unchanged. They have **not** run on any Supabase project.

---

## 1. What the migration does (and does not)

- **Changes:** RLS on, 4 open policies dropped on `reservations`; policies dropped on `businesses`, `profiles`, `services`, `appointments`, `clients`;
  all privileges of `anon` and `authenticated` revoked on the 10 business tables; `profiles` gets two policies, `SELECT` and
  `UPDATE (must_change_password)` only; default privileges for future objects revoked from `anon`/`authenticated`.
- **Does not:** modify, delete or move any row; touch `service_role` (the server keeps full access); touch `auth.*`; change Vercel or Auth settings.
- **Locks:** `ALTER TABLE ... ENABLE RLS` takes a short exclusive lock per table. `lock_timeout = 5s` makes the script fail instead of queueing behind traffic.
- **Atomicity:** `03_migrate.sql` is ONE `DO` block: preflight, migration and final assertions. If any assertion fails, everything is undone.

Files (all in `supabase/release/`, generated from `supabase/migrations/20261028_rls_least_privilege*.sql` by `build_release.py`):

| File | Type | Purpose |
|---|---|---|
| `01_preflight_readonly.sql` | read-only | snapshot of RLS, policies, grants, row counts, anomalies, default privileges, event triggers, tables the migration does not cover |
| `02_backup_in_db.sql` | production write (new objects only) | schema `backup_20261028` with data copies and policy/grant snapshots, row counts compared |
| `03_migrate.sql` | production write | the migration with preflight and assertions |
| `04_verify_readonly.sql` | read-only | 44 checks; every `ok` must be `true` |
| `05_rollback.sql` | production write | return to the pre-migration state (re-opens the vulnerability) |

The exact SQL of `03_migrate.sql` and `05_rollback.sql` is in the repo and is what will be pasted. I will show you the final text again right before execution.

---

## 2. Every action that would modify production (each needs your explicit approval)

| # | Action | System | Reversible? | Notes |
|---|---|---|---|---|
| P1 | Run `02_backup_in_db.sql` (creates schema `backup_20261028` plus copies) | Prod DB | Yes: `drop schema backup_20261028 cascade` | New objects only. Copies `google_calendar_tokens` (secrets): access is revoked from everyone but the DB owner |
| P2 | Merge the PR to `main` (code: new `/api/register-business`, new registration page) | GitHub, then Vercel Production deploy | Yes: Vercel rollback to the previous deployment (P5) | Compatible with the current DB (section 4), so it ships **before** the migration |
| P3 | Run `03_migrate.sql` | Prod DB | Yes: `05_rollback.sql` | The real fix. Do it in a low-traffic window |
| P4 | (only if needed) run `05_rollback.sql` | Prod DB | n/a | Re-opens the hole; prefer a targeted fix first (section 6) |
| P5 | (only if needed) Vercel rollback to deployment `dpl_Fxki2qsmjj2fTna6UBkFNPqmbJio` (`9299fba`) | Vercel Production | Yes | The current production deployment |
| P6 | (optional, separate decision) enable "Leaked password protection" in Supabase Auth | Prod Auth settings | Yes | Changes password rules for new passwords |
| P7 | (after retention) drop `backup_20261028` | Prod DB | No | After e.g. 14 days with no issue |
| P8 | (NOT recommended; only if you insist on a production smoke test) real test signup, booking or cancellation | Prod data + notifications | Partly | Creates a real auth user, a `pending` business or a reservation, and sends real Telegram/Resend messages. I recommend testing on Preview/TEST instead (section 7) |

**Not planned and not requested:** any change to Production environment variables; any Production domain/alias change; any change to the existing production data.

Actions that do NOT touch production but need approval (listed so nothing is a surprise):

| # | Action | System |
|---|---|---|
| V1 | Add branch-scoped Preview env vars for `test/rls-server-registration` pointing at TEST | Vercel (Preview scope only) |
| T1 | Permanently apply `baseline_schema.sql` + migration on TEST (secure state only), create 2 test users | TEST DB |
| T2 | Set TEST Auth options (redirect URL for the preview, email confirmation off or test inbox) | TEST Auth |

Production **reads** (no modification; I will tell you before each, as you asked about SQL on production):
R1 `01_preflight_readonly.sql`; R2 `04_verify_readonly.sql`; R3 Supabase advisors (`rls_disabled_in_public` should disappear); R4 Supabase API gateway logs
(did production traffic use the `service_role` key? see section 4); R5 Vercel deployment and env **metadata** (names only); R6 `auth.users` count before/after the isolation test.

---

## 3. Backup and recovery procedure

The migration does not touch data, so the backup protects against the unexpected (a wrong assumption about production, a bad rollback), not against the expected.

1. **External logical backup (primary; done by you or with you, not by me):**
   - My earlier check showed the Supabase organization on the Free plan, which has no downloadable managed backups. Please confirm in Dashboard → Database → Backups.
   - From your computer, with the connection string from Dashboard → Connect (the password stays with you; never paste it into chat):
     `supabase db dump --db-url "$PROD_DB_URL" -f prod_schema.sql`
     `supabase db dump --db-url "$PROD_DB_URL" --data-only -f prod_data.sql`
     `supabase db dump --db-url "$PROD_DB_URL" --role-only -f prod_roles.sql`
     plus the `auth` schema data (users): `pg_dump "$PROD_DB_URL" --data-only -n auth -f prod_auth_data.sql`.
     `pg_dump` must be version 17 or newer (the server is Postgres 17).
   - Store the files outside the repo (they contain personal data and OAuth tokens). Never commit them.
2. **Verify the backup is restorable:** restore `prod_schema.sql` + `prod_data.sql` into a scratch database and compare row counts with `01_preflight_readonly.sql` output.
   The TEST project can serve as scratch (empty; with your approval, T1-style write on TEST).
3. **In-database snapshot (P1):** `02_backup_in_db.sql` creates `backup_20261028` with copies of the data tables, the policy and grant snapshot, and prints source vs copy row counts (must be equal).
4. **Recovery:**
   - Single table damaged: `insert into public.<t> select * from backup_20261028.<t> on conflict (id) do nothing;` (after reviewing the diff) or restore from the dump.
   - Policy/grant drift: compare `backup_20261028.pg_policies_snapshot` and `table_grants_snapshot` with the live catalog; `05_rollback.sql` restores the known pre-state.
   - Full loss: restore the dump into a new Supabase project and repoint Vercel (a separate, much larger decision; not expected, since the migration changes no data).

---

## 4. Compatibility checks for existing APIs

Audited by reading the code (every `createClient` call and every `.from(...)`):

| Route / code | Key used for table access | Effect of the migration |
|---|---|---|
| `/api/dashboard/*` (reservations, services, customer-notes, inquiries, push, summary) via `utils/ownerAuth.ts` | service role (strict) | none |
| `/api/business-profile`, `/api/business-inquiry`, `/api/calendar`, `/api/cancel-appointment`, `/api/customer/reservations`, `/api/master/businesses` | service role (strict); anon key only to verify user tokens | none |
| `/api/narudzbe` (public booking), `/api/moje-rezervacije` | **`SERVICE_ROLE || ANON` fallback** | none **if** the production `SUPABASE_SERVICE_ROLE_KEY` value is a valid service-role key. If it were missing or wrong, these would silently use anon and break after the migration |
| `/api/auth/google/callback` (stores calendar tokens) | **`SERVICE_ROLE || ANON` fallback** | same condition as above |
| `/api/register-business` (new) | service role + anon for `signUp` | works before and after the migration |
| Browser `app/prijava`: `profiles` SELECT `must_change_password` | authenticated | kept (`SELECT` granted + own-row policy) |
| Browser `app/promijeni-lozinku`: `profiles` UPDATE `must_change_password` | authenticated | kept (column-level `UPDATE`) |
| Old browser registration (direct `businesses` insert, `profiles` insert) | authenticated | **breaks by design.** The new page uses the server route. A visitor with a stale cached page would get an error until reload |
| Other client files (`AuthNavButton`, dashboard layout, master-panel, etc.) | auth methods only (no `.from`, `.rpc`, realtime found by search) | none |

No GitHub Actions workflows and no `supabase/config.toml` exist, so merging to `main` does **not** run any migration automatically.

**Pre-migration check of the key assumption (read-only, R4):** query Supabase API gateway logs for recent `/rest/v1/reservations` requests and confirm the
requests made by the site carry the `service_role` role, not `anon`. If the logs show `anon`, stop: the fallback is active and must be fixed first (set a valid
`SUPABASE_SERVICE_ROLE_KEY`; that is a Production env change and would be a separate approval).

**Code cleanup after a stable week (separate PR):** remove the `|| ANON` fallbacks (Phase 2), so a missing service key fails loudly instead of silently degrading.

---

## 5. Release sequence

**Phase A: no production change**
1. R1 + R4 + R5 reads. Compare R1 with the tested baseline; any difference (an extra table, a different policy) stops the plan until reviewed.
2. Backup step 1 and 2 (external, restore-tested).
3. Preview isolation and API end-to-end tests on TEST (section 7).

**Phase B: production (each step waits for your "go")**
4. P1 in-database backup; check the row counts match.
5. P2 merge, wait for the Production deployment to be `READY`; verify the live site (home page loads, `/registracija` loads, `/api/register-business` answers a GET with 405).
   The old DB is still in place, so behaviour is unchanged for existing flows.
6. Low-traffic window. P3 `03_migrate.sql`. Expected output: `NOTICE: OK: 03_migrate.sql primijenjen i provjeren.`
   Any exception means nothing was applied; stop and report.
7. R2 `04_verify_readonly.sql`: all 44 rows `ok = true`. R3 advisors: `rls_disabled_in_public` gone.
8. Verification of real behaviour (section 6). If anything fails, follow the rollback matrix immediately.
9. After 14 quiet days: P7 drop the backup schema, and the `|| ANON` cleanup PR.

---

## 6. Post-migration verification and rollback

**Verification (read-only unless you do a login yourself):**
- `04_verify_readonly.sql`: 44/44 true.
- Public anon-key check (the anon key is public by design; run from your computer, or I run it if the sandbox can reach the host):
  `curl -s "$SUPABASE_URL/rest/v1/reservations?select=id" -H "apikey: $ANON_KEY"` should return a permission error (`42501`) or no rows.
  `curl -s "$SUPABASE_URL/rest/v1/businesses?select=owner_email" -H "apikey: $ANON_KEY"`: the same.
- You, as owner: log in, the dashboard shows your reservations, status actions work, services list loads (all through the server routes).
- Public pages: a business catalogue page loads (uses `/api/business-profile`).
- Vercel runtime logs: no new 500 errors on `/api/*` for 30 minutes (`get_runtime_errors`).
- Booking and notifications (creates real data and real messages) is P8: do it only if you want it, with your own test data.

**Rollback decision matrix:**

| Symptom | Likely cause | Action |
|---|---|---|
| A route returns 500 with `permission denied for table X` | that route used `anon` (fallback) | Targeted fix first: set a valid `SUPABASE_SERVICE_ROLE_KEY` (Production env, separate approval). Emergency: `grant select, insert, update, delete on public.X to anon;` only for that table and temporarily. Full rollback only if neither is fast enough |
| Registration page broken after the code deploy (before the migration) | code issue | P5 Vercel rollback to `9299fba`; the DB is unchanged |
| Everything broken after P3 | unexpected | P4 `05_rollback.sql` (atomic; ends with assertions), then investigate on TEST. This re-opens the vulnerability, so keep the window short |
| Data looks wrong | not expected (the migration changes no rows) | Compare with `backup_20261028` and the external dump; restore selectively |

Rollback takes seconds (one statement) and was tested locally (state restored; re-apply works).

---

## 7. Isolating Preview from Production before real API tests

**Problem (confirmed from Vercel metadata, names only):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are single variables targeting both
`preview` and `production`; `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `RESEND_API_KEY`, `VAPID_*`, `GOOGLE_*` are shared too. Every preview deployment (including the already-built preview of `test/rls-server-registration`)
therefore talks to the production database and can send real messages. **Until isolation is done, do not register, book or write on any preview URL.**

**Plan (Production variables are not edited):** Vercel lets a Preview variable be scoped to one git branch, which overrides the general Preview value for that branch only.
1. **V1:** for branch `test/rls-server-registration`, add Preview-scoped values: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` of the **TEST** project.
   You paste the TEST keys into Vercel yourself (Dashboard → TEST project → API keys). I do not need to see them. The same branch scope also blanks or dummies
   `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` and the `VAPID_*`/`GOOGLE_*` values, so the preview cannot message anyone. (Routes must tolerate missing values; I will check that in code first.)
2. **T1:** permanently apply `baseline_schema.sql` + migration on TEST (secure state only) and create two test users + two businesses through the new registration route.
3. **T2:** in TEST Auth, set Site URL / redirect to the preview URL and turn email confirmation off (or use test inboxes), so signups finish without real email.
4. Redeploy the branch (a new Preview deployment, not Production). Vercel deployment protection applies to preview URLs: tests need your logged-in browser or a bypass link.
5. **Proof of isolation (before any write test):** register `iso-test-1@example.invalid` on the preview. Then TEST must show +1 `auth.users` row and production (R6, read-only) must show the same count as before. Only if that holds do real API tests start.
6. **API tests on TEST via the preview:** owner A/B tokens: A cannot read/modify B's reservations through `/api/dashboard/*` (expect 404/409 and no data), A cannot reach B by changing `profiles.business_id` (direct REST call with A's token returns permission error), anon REST calls are denied, registration always creates `pending` and ignores client-sent `status`/`business_id`.
7. Clean-up: remove the branch-scoped variables when testing ends (a Vercel change, with your approval).

**Why not edit the existing shared variables:** `sensitive` variables cannot be read back, and changing their targets risks wiping or breaking the production value. Branch-scoped Preview variables leave Production untouched.

---

## 8. Remaining risks and decisions for you

- The real fix is not live until P2 and P3 are approved and run; the exposure noted by Supabase continues until then.
- The service-role assumption (section 4) is verified by logs (R4) before P3, not by reading secrets.
- Free-plan backups: the external dump is the only real backup; please do it before P3.
- `app/prijava` hardcodes an admin email, and leaked-password protection is off: both are outside this release (Phase 6 / P6).
- The first release window should be low-traffic; the migration takes seconds, and rollback takes seconds.
