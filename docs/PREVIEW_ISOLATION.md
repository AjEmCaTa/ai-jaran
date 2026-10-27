# Preview isolation: read-only findings and proposed changes

Status: **READ-ONLY CHECKS DONE. NOTHING CHANGED.** No production SQL that writes, no Vercel variable change, no TEST write, no merge, no deploy.
Everything in section 3 waits for your explicit approval.

## 1. Read-only results (2026-10-27)

**R1: production schema and policies (project `qpptpbjksrqfqjunggrq`, "AjEmCaTa's Project", ACTIVE_HEALTHY)**
- Identical to the state the migration was tested against: RLS off only on `reservations`; the same 4 open policies on `reservations`, 3 on `businesses`,
  4 on `profiles`, 1 on `services`, 6 on `appointments`/`clients`; `anon` and `authenticated` hold full privileges on 7 tables (`business_inquiries` and `push_subscriptions` already grant only `service_role`).
- Rows: reservations 7, businesses 2 (both `active`), profiles 2, services 5, business_inquiries 1, push_subscriptions 1, others 0.
  No profile without a business, no profile pointing at a missing business.
- No tables outside the 10 covered ones. No triggers and no functions in `public`. Event triggers: only the standard Supabase ones (production does **not** have the `ensure_rls` trigger that TEST has).
- Constraints/indexes the TEST schema must have (the app relies on them): `UNIQUE(businesses.slug)`, `UNIQUE(push_subscriptions.business_id, endpoint)`, `UNIQUE(customer_notes.business_id, customer_key)`, foreign keys to `auth.users` and `businesses`. Captured in `supabase/tests/baseline_constraints.sql`.

**R4: production API gateway logs, last 24h (the maximum window)**
- 39 `/rest/v1/*` requests: `profiles` 12, `businesses` 12, `reservations` 11 GET + 1 PATCH, `services` 3. **All 39 used the secret-type server key; none used `anon`.** All returned 200.
- The key assumption for the migration holds: the site's server routes authenticate with the server key. The booking route (`narudzbe`) had no traffic in the window, but it reads the same
  `SUPABASE_SERVICE_ROLE_KEY` variable that the strict routes just proved is set and valid, so its `|| ANON` fallback is not taken.

**R5: Vercel metadata (names and targets only, no values)**
- No git-branch-scoped variables exist today. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are each ONE record for `preview` + `production`
  (ids `v6MFiWY9VEMIJRG2`, `x5qjGN3Gr3ZxNrDR`, `t7mspY28ograHj0t`; `updatedAt` 1787227168698 / 1787227194483 / 1787227215508). These must stay untouched.
- `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GOOGLE_CLIENT_ID/SECRET` are `preview` + `production`; `VAPID_*` exist as separate `preview` and `production` records.
- Deployment protection: SSO on all non-custom domains, so preview URLs need a signed-in Vercel session (or a bypass) to open.
- Preview deployments of the branch already exist (latest `dpl_DomEpM1yjmEAka4x6QVWJaewUUp5`, commit `b798f13`) and currently talk to production data.

**R6: baseline counts for the isolation proof (production, before any test)**

| Table | Rows | Latest `created_at` |
|---|---|---|
| auth.users | 2 | 2026-10-12 21:58:52 UTC |
| businesses | 2 | 2026-10-12 21:52:44 UTC |
| profiles | 2 | 2026-10-12 22:09:14 UTC |
| reservations | 7 | 2026-10-19 18:40:27 UTC |

**Code inspection: missing messaging variables are handled safely**

| Variable missing | Code path | Behaviour |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` or chat id | `narudzbe`, `cancel-appointment` | `if (token && chatId)`, otherwise skipped, inside `try/catch`; the booking still succeeds |
| `RESEND_API_KEY` | `narudzbe`, `cancel-appointment` | logs an error and skips both emails, inside `try/catch`; the booking still succeeds |
| `RESEND_API_KEY` | `business-inquiry` | returns 503 (no false success), nothing sent |
| `VAPID_*` | `utils/pushSender.ts` | `isPushConfigured()` is false, so push is skipped |
| `GOOGLE_CLIENT_*` | `calendar` | returns a 500 with a clear message; the callback fails at Google (it also hardcodes `aijaran.ba`) |

Hardcoded fallbacks found (not reachable once the keys are blank): the owner email defaults to a fixed personal address when `business.owner_email` is empty, and Telegram falls back to a global chat id.
They are why the messaging variables must be neutralised on the branch, not just "unlikely to fire". The fixed fallbacks themselves are scheduled for removal in Phase 3.

## 2. Isolation mechanism

Branch-scoped Preview variables for `test/rls-server-registration` override the shared Preview values for that branch only. Production records are not edited.
Two safeguards, because the `create_project_env` tool has an `upsert` option that would overwrite an existing variable with the same key:
- Every creation must carry `gitBranch = test/rls-server-registration` and `target = ["preview"]`, and **`upsert` must not be set**.
- Immediately afterwards I re-list the variables and compare the three production-affecting records above (same id, same `updatedAt`, same targets). Any difference stops everything.

Open questions only a live attempt can answer (I will report, not work around): (a) whether Vercel accepts a branch-scoped Preview variable alongside a record that also targets `production` for the same key;
(b) whether an empty value is accepted for the neutralised messaging variables. If (a) is refused, the fallback is a **separate Vercel project** (e.g. `poslo-one-test`) connected to the same repo with its own environment, so the production project is not touched at all.
If (b) is refused, an inert placeholder is used (`disabled-in-preview`): the calls then fail at the provider and are caught by the existing `try/catch`, so nothing is delivered.

## 3. Proposed changes (NOT applied; each group needs your approval)

**T1: TEST database, permanent, secure end state.** File: `test_project_setup.sql` (generated, attached; source `supabase/tests/build_test_project_setup.py`).
- One `DO` block: refuses to run unless `public` has 0 tables (so it cannot run on production); creates the 10 tables, production's constraints and indexes, RLS on all, then the migration `20261028_rls_least_privilege.sql`, then assertions.
- Only `CREATE`, `ALTER ... ENABLE RLS`, `GRANT`/`REVOKE`, `CREATE POLICY` and `DROP POLICY IF EXISTS` (no-ops on an empty database). No DELETE/UPDATE/TRUNCATE, no data, no external effects.
- Atomic: any failed assertion leaves TEST empty. Verified locally: setup OK, `04_verify_readonly.sql` 44/44, re-running it refuses, an app-style flow works (registration inserts, the push `ON CONFLICT` upsert, slug uniqueness 23505).
- Undo: `drop table ... cascade` on the 10 tables (TEST holds only test data) or the rollback script.

**T2: TEST Auth setting (you, in the dashboard).** Turn off "Confirm email" so test signups finish without inboxes. Applies to TEST only.

**V1: Vercel Preview variables, branch `test/rls-server-registration` only** (nine records; no Production record is created, edited or removed):

| Key | Value | Type |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://woixwqpnpqteguntgmcq.supabase.co` | plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | TEST publishable key (public by design) | sensitive |
| `SUPABASE_SERVICE_ROLE_KEY` | TEST secret key: **you paste it in the Vercel dashboard; I never see it** | sensitive |
| `RESEND_API_KEY` | empty (or `disabled-in-preview`) | sensitive |
| `TELEGRAM_BOT_TOKEN` | empty (or `disabled-in-preview`) | sensitive |
| `TELEGRAM_CHAT_ID` | empty (or `disabled-in-preview`) | sensitive |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | empty (or `disabled-in-preview`) | sensitive |

Undo: delete those records (dashboard or `vercel env rm`), then redeploy the branch.

**Then, still read-only first:** redeploy the branch (a Preview deployment, not Production), and run isolation proof 1, a GET for a known production business slug against the preview (through the authorised Vercel fetch): it must be "not found", because TEST is empty.

**Write tests (only after you approve this stage separately; TEST only):**
1. Register `rls-owner-a@example.invalid` and `rls-owner-b@example.invalid` through the preview's registration page. TEST must gain 2 `auth.users`, 2 `businesses` (`pending`) and 2 `profiles`; **production counts must equal the R6 table above** (isolation proof 2).
2. `test_project_seed.sql` on TEST: activates the two test businesses and adds one service and one reservation each (only `*.invalid` rows).
3. API matrix through the preview, owner A vs owner B tokens: A cannot read, change or delete B's reservations or services via `/api/dashboard/*`; a PATCH with B's reservation id returns 404/409 and the row is unchanged; a direct REST call with A's token to change `profiles.business_id` is denied; anon REST reads of `reservations`/`businesses` are denied; registration always yields `pending` and ignores client-sent `status`/`business_id`; the owner dashboard of a `pending` business is refused; booking and cancellation produce no email/Telegram (blank keys) and still succeed.
4. Clean-up: delete the test rows or leave TEST as is; remove the branch variables when testing ends.

## 4. Remaining risks

- Until V1 is applied and verified, **do not register, book or write on any preview URL**: previews write to the production database.
- The preview that already exists for this branch was built before isolation, so it must be redeployed after V1 (the build inlines `NEXT_PUBLIC_*` values).
- If isolation cannot be proven (proof 1 or 2 fails), stop: no write test runs.
