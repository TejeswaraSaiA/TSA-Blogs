# Let's Talk Money

A React + TypeScript shared-expense app with a private, authenticated Cloudflare Worker backend. Let's Talk Money has its own design and implementation; it does not use Splitwise branding or claim affiliation with Splitwise.

## Included workflows

- Groups with individually named members, optional account-link invitations, shared ledgers, and membership checks on every API operation.
- Unlimited expense entry, editing and deletion; full-text expense search; original currency and saved conversion rate; receipt attachments; categories, dates, and notes.
- Equal, exact-amount, percentage, weighted-share, and item-by-item splits. Integer-cent allocations use deterministic largest-remainder rounding.
- Group default split shares (for example, 55/45), recurring weekly/monthly expenses, and month-end catch-up without duplicate entries.
- Net balances, simplified payment suggestions, and recording payments made outside the app. Recording a payment does not transfer money.
- Browser-based Tesseract receipt OCR. Extracted descriptions, amounts, items, and adjustments are always editable and must be reviewed before saving. PDF receipts can be attached but are not OCR-scanned.
- Live reference currency rates from Frankfurter (ECB), or an explicitly entered rate. Each expense stores its original amount, converted group amount, rate, and rate date. The ten supported currencies are listed in `src/model.ts`.
- Bank/card CSV import with a review screen and per-row selection; CSV export; activity history; spending/category/trend charts; group budgets; day/night theme.
- Private receipt files, authorization checks, server-side recomputation of splits, and optimistic-concurrency protection so conflicting edits cannot silently overwrite each other.

## Boundaries and integrations

Direct bank-account synchronization requires a banking provider, credentials, and the provider's onboarding; it is not connected. CSV statement import is implemented. Payments are ledger records, not bank transfers. There is no access to Splitwise's proprietary early-access program.

Recurring bills are generated when the workspace loads (and refreshes each minute while open). Missed occurrences catch up on the next visit. They retain their template's saved conversion rate. This is not a background notification service.

The Site is owner-private initially. To collaborate, use the Site sharing controls to allow your chosen people to visit, then create an invitation for a group member and share its link yourself. No emails or messages are sent by this app. A member with a specified email can only be claimed by an account with that email. Invitation tokens are single-use and omitted from ordinary API responses.

Exchange rates are reference data, not guaranteed transaction/settlement rates. The UI lets you review and override a rate. Dashboard totals are kept separate by group currency instead of adding incompatible currencies together.

OCR runs in the browser. Tesseract downloads its worker/language files; poor scans or unavailable downloads can require manual entry. Receipt images are attached only to the private app storage. Files are limited to 10 MB. Detached/deleted expense receipts remain private objects; automatic orphan-file cleanup is not included.

## Runtime

`.openai/hosting.json` declares the existing Site identity and private `BUCKET` R2 binding. Group documents are stored under `groups/`; receipts under `receipts/GROUP_ID/`. Writes use R2 conditional ETags to reject concurrent changes. The backend reads platform-supplied ChatGPT identity headers and does not trust user IDs from browser request bodies.

- `src/model.ts`: financial domain, splits, balances, simplified debts, recurrence, and OCR text extraction.
- `src/App.tsx`: dashboard, groups, expenses, insights, forms, imports, and receipt workflows.
- `src/api.ts`: browser API client, shared mutations, and clearly labeled development-only sample workspace.
- `worker/index.ts`: authenticated APIs and private storage.
- `scripts/build.mjs`: bundles the React UI and embeds it into one deployable Worker ES module.

Development preview uses sample data saved only to that preview browser. Production builds always disable sample mode; a signed-in hosted user starts with an empty real workspace.

```sh
npm ci
npm run dev
npm test
npm run build
```

The build emits `dist/server/index.js` and the hosting manifest. Thirteen automated tests cover allocation, exact/percentage/item splits, conversion snapshots, balanced settlements, recurrence idempotency/month-end behavior, receipt extraction, anonymous requests, cross-user access, revision conflicts, server recomputation, receipt ownership, and invitations. Hosted storage and browser workflows are also checked during delivery.


## Custom-domain edition
The GitHub Pages frontend is built with `node scripts/build-pages.mjs` and served at `/letstalkmoney/`. API: Supabase Edge Function `letstalkmoney`; it validates every bearer token using Auth getUser, then uses service-role-only documents and a private receipts bucket. Existing ChatGPT/R2 records are not automatically migrated. The old Site deployment remains independent.

Google setup: create a Web OAuth client in Google Cloud, with JavaScript origin `https://tejeswarasaia.tech` and redirect URI `https://iajjgwxnxtvzdwohnqce.supabase.co/auth/v1/callback`. Configure the client ID and secret in Supabase Authentication > Sign In / Providers > Google. Add `https://tejeswarasaia.tech/letstalkmoney/` to Auth URL Configuration redirect URLs; preserve the blog Site URL and existing redirect URLs. Publish the Google consent app for invited users beyond test users. Client secret must never be committed to GitHub.

Group icons and banners are resized WebP images stored in private group documents. Owner-only settings support replace/remove and banner background color. Recurrence remains catch-up on workspace access.


## Responsive branding update
The current app name is Let's Talk Money. Custom SVG/ICO browser icons, an Apple touch icon, and a web manifest are copied from `public/` during the Pages build. On screens up to 650px, a fixed five-column bottom navigation includes safe-area spacing. Forms use 16px inputs to avoid iOS focus zoom, and dialogs fit narrow screens. Legacy browser preference keys are read for migration only.


## Group management
Owners can assign Admin or Member roles in Group Settings. Existing participants without a role remain Members; the creator remains Owner. Every linked member can add, edit, or delete group expenses, while admins and owners manage settings, members, and invitations. Only the owner can assign roles or delete the group.
Group deletion requires the exact current group name and a fresh revision. It soft-deletes the document, hides it from all workspaces, invalidates invitations, and blocks group and receipt access; it does not erase the underlying private document or uploaded receipt bytes.


## Account profiles
The profile button in the top bar and the desktop sidebar opens an editor for display name and profile picture. Pictures are resized client-side to WebP, and can be replaced or removed. The authenticated `/profile` endpoint writes only `profiles/{authenticated-user-id}.json` to the existing private document store; request-supplied IDs cannot select another account. Group responses resolve linked member names and avatars from these profiles, preserving member IDs, permissions, balances, and historical expense records. New creators and accepted invitees retain real names rather than a shared “You” label.


## Personalized payment breakdown
Overview shows the signed-in person's complete suggested payments and receivables across all groups, with separate totals for each currency. A group's breakdown includes a member selector to inspect each participant's position. Suggestions come from the existing cent-exact group debt simplification and reflect recorded settlements. Payments stay within their source group and currency. The Settle up shortcut is shown only when the viewer is the payer or group owner, matching server permissions; it records payments rather than transferring money.
