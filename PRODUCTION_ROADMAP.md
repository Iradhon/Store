# Storefront Production Readiness Roadmap

> **Status update (2026-10-21):** Supabase Auth and Postgres are being reinstated as the live account and catalog backend. Demo authentication, seeded products, mock payment, and browser-only order creation are removed. Checkout remains closed until the owner selects a payment provider and confirms launch market, tax, and delivery rules. Product records must be supplied by the owner before publication.

**Prepared:** 20 October 2026  
**Scope:** Turn the React/Vite + Supabase storefront into a secure, supportable commerce application.
**Current assessment:** The account and catalog backend foundation is in place, but the store cannot accept real orders until payment, market, tax, delivery, and operational launch requirements are implemented and configured.

## 1. Production target and assumptions

Production readiness means that the system can accept an order, calculate the correct amount from trusted data, collect payment through a payment provider, record the result exactly once, protect customer data, and give the customer and operators a reliable way to track and resolve that order.

The repository currently presents USD prices, an 8% tax estimate, a $50 free-shipping threshold, standard/express shipping, US-style state and postal fields, guest checkout, card and PayPal choices, and Google sign-in. Treat these as draft behavior until the business confirms them. Before implementing commerce rules, record:

- Launch countries, supported currency or currencies, language, time zone, and tax obligations.
- Legal seller identity, support contact, privacy/retention requirements, terms, return/refund policy, warranty terms, and shipping promises.
- Payment provider(s), merchant accounts, settlement currency, refund/chargeback owner, and payment-provider sandbox access.
- Shipping provider or fulfillment process, delivery regions, delivery estimates, inventory owner, and cancellation process.
- Whether guest checkout is required, how guests securely retrieve orders, and which staff are authorized as administrators.
- Hosting provider/domain, production and staging Supabase projects, email sender, analytics/monitoring choices, and recovery objectives.

Keep these decisions in a short architecture/operations record. Avoid encoding a provisional business rule in the browser or a policy text string and later treating it as authoritative.

## 2. Historical implementation inventory (before the production backend work)

| Area | Current implementation | Production consequence |
|---|---|---|
| Catalog | Sixteen local sample products; Supabase reads fall back to local data on empty results or errors. | The storefront can display and sell stale demo prices or items when the database is unavailable. |
| Inventory | Products have an in-stock boolean; product detail says “In Stock”; cart quantity is client controlled. | Availability and quantities are not enforced at order time; concurrent checkouts can oversell. |
| Cart | Product objects and prices are stored in browser local storage; promo codes and shipping/tax are calculated in React. | Browser state is editable and cannot be trusted for price, discount, tax, or stock decisions. |
| Checkout | Card fields are local React state; submission waits 1.2 seconds and creates an order. PayPal is a message only. | No payment is collected, while the UI reports a successful order and “Total Paid.” |
| Orders | Local storage is the displayed order history; Supabase writes happen in the background as two separate inserts. | A success screen can appear despite failed persistence or missing order items; orders do not load from the database. |
| Guest privacy | SQL permits selecting orders and items where user_id is null. | Guest names, addresses, phone numbers, and order contents can be exposed to anonymous visitors. |
| Authorization | Profile reads are public; a user can update their own profile row; product writes allow any authenticated role. | Profile data is exposed, role changes are not protected, and “admin” is not enforced by the product policies. |
| Authentication | Supabase auth is optional; the local fallback accepts any credentials and the Google demo path creates a fixed admin identity. | A production build with missing credentials silently becomes a fake-auth demo. |
| Order behavior | IDs and status are created client-side; the client can submit totals/status; there is no fulfillment, refund, or email service. | Order integrity, payment status, and customer notifications are not authoritative. |
| Deployment | There is a migration workflow on pushes to main; there is no application deployment/release workflow in the repository. | No defined staging gate, protected production deploy, frontend hosting policy, or rollback procedure. |
| Quality | TypeScript, lint, and build scripts exist; no test script or test files were found; README remains the Vite starter. | Key behaviors and security rules have no automated regression gate, and onboarding/operations are undocumented. |

Relevant code to revisit: **src/context/AuthContext.tsx**, **src/context/CartContext.tsx**, **src/context/OrderContext.tsx**, **src/services/productService.ts**, **src/component/Checkout.tsx**, **src/component/Orders.tsx**, **src/component/OrderSuccess.tsx**, **supabase/migrations/**, **supabase/schema.sql**, and **.github/workflows/deploy-migrations.yml**.

## 3. Delivery sequence

Work in the following order. Do not expose a public production deployment until the launch gates in section 5 pass. Keep the existing production data intact: add forward migrations and rehearse them against a staging copy; do not rewrite migration history that may already have been applied.

### Phase 0 — Lock the launch contract

1. Confirm the business decisions listed in section 1. In particular, select the launch market, currency, payment provider, tax/shipping rules, and fulfillment owner.
2. Define user roles and use cases: anonymous shopper, signed-in customer, guest-order recipient, catalog administrator, order-support operator, and service/webhook identity. Decide whether administrators and support staff are distinct roles.
3. Write state diagrams for checkout/payment and fulfillment. Separate payment state from fulfillment state; a payment being authorized is not the same as an order being shipped.
4. Define customer-visible claims and service levels: shipping eligibility, delivery estimates, return window, warranty, email confirmation, and stock availability.
5. Select a hosting platform and create isolated development, staging, and production projects/environments. Define who can access production and who approves a production release.

**Exit criteria:** Business rules, trust boundaries, providers, supported markets, roles, environments, and operator ownership are written down and approved by the project owner.

### Phase 1 — Close the database and authorization vulnerabilities (P0)

Create a new migration that replaces the effective policies. Do not rely on client-side route checks or hidden buttons as authorization.

#### Profiles and roles

- Remove public profile reads. A user may read only the minimum fields needed for their own account. Do not expose email, avatar, or role through an unrestricted table policy.
- Remove client write access to security-sensitive profile columns. Keep user-editable fields such as display name separate from role, email, verification state, and account status.
- Make role assignment server-controlled. Prefer a trusted JWT app-metadata claim or a narrowly scoped server-side role table/function; only an administrative service may grant/revoke roles. Never trust user metadata or a role value returned from a client-writable profile row.
- Make admin authorization explicit in every admin operation. Update product insert, update, and delete policies to check the trusted admin role, not merely auth.role() = authenticated.
- Restrict profile insert/update grants and RLS checks to the intended columns and identity. A user must not self-promote through either INSERT or UPDATE.
- Replace email-equals-admin special cases with an explicit, audited bootstrap/invitation procedure. Remove the fixed demo identity from client code and SQL seeds.

#### Products and public catalog

- Keep public reads limited to published/active catalog fields. Add a publication/archival state if needed so draft, internal, and discontinued records are not exposed.
- Restrict catalog writes to administrators or a trusted catalog-management service. Add audit information for who changed price, availability, and publication state.
- Revoke any broad table grants that would bypass intended policies. Review policies and grants together for anon, authenticated, and service_role.

#### Orders, order items, and guest access

- Remove the policy that returns every row with user_id IS NULL. Null ownership is not an access credential. Also remove the matching order-item policy that inherits this public visibility.
- Decide on one safe guest receipt design. Options include authenticated guest-order lookup through a server endpoint using a high-entropy, unguessable capability token whose hash is stored server-side, or requiring sign-in. Never expose a list/read policy based only on an order ID or null user ID.
- Prevent direct anon/authenticated inserts of order totals, status, ownership, or line items. Route order creation through a trusted endpoint/RPC that validates input and writes the order atomically. A client may request checkout; it may not assert payment success or final price.
- Make order state server-owned. A customer cannot create an order as delivered/paid, alter a paid total, or attach items to somebody else's order. Only verified payment webhooks and authorized staff can make state transitions.
- Revisit user deletion behavior. The current ON DELETE SET NULL changes a customer order into a row treated as a public guest order. Use a deliberate retention/anonymization policy without changing ownership semantics or granting public access.
- Ensure order reads are limited to the owning customer, the authorized guest capability, and explicitly authorized staff. Line-item reads must enforce the same parent-order authorization.
- Add request throttling and abuse controls for guest checkout, promo attempts, account creation, and order lookup. RLS protects data; it does not prevent high-volume abuse.

#### SQL function and schema security

- Review all SECURITY DEFINER functions, especially the auth-user trigger. Pin a safe search_path (ideally empty) and schema-qualify referenced objects. Revoke execution from client roles where it is not needed.
- Inspect any auto-RLS helper or trigger in the Supabase project; remove unneeded privileged helpers and ensure RLS is enabled on every exposed table.
- Add database constraints for allowed order/payment/shipping states, positive quantity, valid currency amounts, and required fields. Use database constraints as a final integrity boundary, not only TypeScript types.
- Establish the migration folder as the only schema change source. Reconcile the duplicate manual SQL in **supabase/schema.sql**, **supabase/fix_security_warnings.sql**, **supabase/fix_performance_advisor.sql**, and **supabase/setup_admin_role.sql**. Keep a generated/current schema snapshot if useful, clearly labeled as generated; do not maintain several divergent policy definitions.
- Use least-privilege grants for exposed schema/table/function access. Verify no service-role or database password is bundled into Vite variables or browser code. Only the public anon key belongs in the browser, and it must be paired with correct RLS.

**Exit criteria:** Automated policy checks demonstrate that anonymous visitors cannot read profiles, guest orders, or order items; customer A cannot access customer B's rows or mutate order/payment state; a customer cannot self-assign admin or modify catalog; only the intended admin/service identity can do so.

### Phase 2 — Make checkout and payment authoritative (P0)

Use a trusted server boundary, such as Supabase Edge Functions plus narrowly scoped SQL transactions, or a separate backend. Never put provider secret keys in VITE_* variables.

1. Replace the mock card form with a provider-hosted checkout or provider-hosted secure fields. Do not collect, log, persist, or send raw card number/CVC through this app. Remove the false PayPal redirect claim until a real PayPal flow exists.
2. Create a checkout endpoint that accepts product IDs, quantities, shipping choice, promo code, customer identity/address, and an idempotency key. Treat every submitted amount, product name, product image, stock value, discount, tax, status, and user ID as untrusted.
3. In the trusted boundary, reload products and current prices, validate publication and inventory, cap quantity, recalculate discounts and shipping, compute tax under the confirmed market rules, and produce a server-side quote/order. Reject stale or unavailable items clearly.
4. Use integer minor units for money and an explicit ISO currency on quotes, orders, line items, discounts, tax, shipping, refunds, and payment records. Avoid floating-point money arithmetic. Define rounding at each required tax/discount boundary.
5. Persist a checkout attempt/order in a pending state and create the payment session with a provider idempotency key. Do not show paid/success until a verified provider event confirms payment. Handle cancel, decline, timeout, duplicate click, browser close, and return from provider.
6. Implement a webhook endpoint that validates provider signatures, records provider event IDs uniquely, processes duplicate/retry events idempotently, and updates payment/order state in a transaction. Never trust a success URL parameter as proof of payment.
7. Store provider references and payment state only; never store card credentials. Define refund, partial refund, cancellation, chargeback, and payment retry paths.
8. Reserve inventory atomically during checkout. Lock or conditionally decrement inventory so two checkouts cannot sell the last item. Release expired/failed reservations; make the expiration process observable and retryable.
9. Make order plus item writes atomic. Snapshot product name/SKU/price/currency/tax treatment into line items so later catalog edits do not rewrite purchase history. Persist promotion code and applied rule details for support and refunds.
10. Add checkout/quote expiry and server-side idempotency. A retry after a network timeout must return the same logical order/payment attempt rather than create a duplicate charge or order.

**Exit criteria:** Sandbox purchases cover paid, declined, canceled, duplicate, late webhook, invalid signature, retry, refund, and inventory-race cases. The browser cannot forge a lower total or a paid order, and order/payment records reconcile to the provider.

### Phase 3 — Replace local-only account and order behavior

#### Authentication and authorization experience

- Make production startup fail closed if required Supabase configuration is missing or malformed. Keep demo/local auth in a clearly separated development-only mode that cannot be enabled in production builds.
- Remove the local fallback that accepts arbitrary credentials and the Google fallback that creates an admin user. Remove the fixed email role check from the client.
- Complete the account lifecycle: email verification, password reset, expired-session behavior, sign-out, OAuth redirect allow-list, provider configuration, and useful failure/retry messages. Decide whether guest checkout remains available.
- Model auth loading, signed-out, signed-in, and auth-error states explicitly. Handle session initialization failures and auth-change races without leaving the UI permanently loading or showing stale identity. Keep server authorization authoritative.
- Protect private order views. Return only that user's orders from the server. Never use a frontend role badge as evidence of permission.

#### Cart, checkout, and order persistence

- Store cart product IDs and quantities, not trusted product records/prices. Rehydrate against the live catalog and show changed price/stock before checkout.
- Validate local storage at runtime (schema/version) and recover from malformed or old values. Scope signed-in carts by user; define merge behavior on sign-in and clear/switch behavior on sign-out. Avoid putting personal addresses or order records in shared browser storage.
- Treat the database/server as the order-history source. Add paginated order history and a server-authorized order detail query. The current local filter treats all guest orders as belonging to every signed-in user on that browser; remove that behavior.
- Await order/checkout API responses before clearing the cart or navigating. Show pending, recoverable error, and success states. Preserve the cart after payment failure and recover the order after a refresh.
- Generate order identifiers server-side (UUID/opaque public reference). Do not use Date.now plus Math.random as a commerce identifier or security mechanism.
- Add accessible loading, empty, unavailable, retry, and validation states for auth, catalog, cart, payment, order history, and receipt routes.

#### Catalog and commercial rules

- In production, API failure or an empty database must not silently return demo products. Keep sample data confined to local development/story/demo fixtures. Show a deliberate unavailable state and log the service failure.
- Honor in_stock/quantity in product detail, cards, cart edits, and checkout; recheck on the server at purchase time. Do not display “In Stock” unconditionally.
- Move fixed 8% tax, $50 free-shipping threshold, express surcharge, promo values, eligibility, expiration, use limits, stackability, and shipping rules into the agreed business model and trusted service. Decide whether the free-shipping threshold uses pre- or post-discount subtotal, whether discount applies before tax, and whether shipping is taxable per market.
- Support validated country-specific address fields and postal formats for the markets actually served. The current fixed country list and state requirement are not a general international address model.
- If product administration is required, build a protected admin workflow for create/edit/archive, image upload, stock adjustments, price changes, and audit history. The present admin role is only shown as a badge; there is no admin UI.
- Product ratings and review counts are hard-coded sample values. Remove them from a live catalog or replace them with genuine review records and a moderation/eligibility policy; do not present seeded demo ratings as customer reviews.
- Ensure product search submission/URL behavior is consistent, and choose client or server search/pagination based on catalog size. Add sort/filter parameters to URLs if shareable results are desired.
- Recheck all promotional copy. Current claims conflict with logic or are not backed by services: “Free Shipping on all orders” vs a threshold, “Worldwide” shipping vs a limited country list, stated warranty/return guarantees, “receipt sent” without an email sender, and “Total Paid” without payment. Calculate delivery dates with the actual carrier/business-day rules.

#### Customer notifications and support operations

- Add transactional email for order received/paid, shipment, cancellation/refund, and password reset using an authenticated sender/domain. Send from server-side events, not the browser.
- Make notification delivery retryable and idempotent; store delivery status and avoid logging full addresses or other unnecessary personal data.
- Define how support staff find orders, verify a guest, correct an address, cancel/refund, and record shipment/tracking. Audit every privileged operation.
- Add a real order status progression, tracking number/carrier fields, and event history. Prevent arbitrary client state changes.

**Exit criteria:** A customer can sign in or securely use approved guest flow, refresh/return on another device, see only their own order, retry a failed checkout without losing the cart, and receive messages that correspond to real backend events.

### Phase 4 — Data model, privacy, and content integrity

- Design the schema around the confirmed flow. Expected concepts include profiles or minimal account preferences, products, inventory/reservations, promotions/redemptions, orders, immutable order-item snapshots, payment attempts/events, shipment/tracking, and audit/order events. Add only what the launch needs, but define ownership and retention for every table.
- Use status constraints/enums and explicit currency. Keep payment status and fulfillment status distinct. Store amounts in integer minor units, not floating-point values.
- Add unique constraints and foreign keys where the lifecycle requires them. For intentional historical snapshots, retain the necessary snapshot columns even if a catalog product is later archived/deleted. Review current product_id indexing because order_items.product_id is not currently declared as a foreign key.
- Use database-generated IDs and timestamps. Define server-owned created/updated fields. Add indexes for real owner/date/status queries and verify them with representative query plans.
- Keep an audit trail for price/stock changes, role grants, refunds, cancellations, manual status changes, and support access. Do not log card data, auth tokens, or full customer addresses.
- Define deletion/export/retention behavior for account profiles, guest-order capabilities, shipping addresses, payment references, support logs, and backups. Separate anonymization from ownership and RLS rules.
- Review any analytics/cookie tooling with the relevant consent/privacy requirements. Do not add tracking until its data use and consent behavior are decided.
- Move production product imagery to controlled storage/CDN with optimized formats, dimensions, caching, and a fallback image. Current catalog photos rely on third-party Unsplash URLs; verify usage terms and availability.

**Exit criteria:** Schema and retention decisions are documented; RLS and database constraints preserve access boundaries and commercial history; personal data has an explicit lifecycle.

### Phase 5 — Frontend quality, accessibility, and resilience

- Turn on strict TypeScript checks, including strict null checking, and add generated Supabase database types so schema changes cannot silently drift from client mappings.
- Remove unused dependencies (Axios appears unused) and unused starter assets/styles after confirming they are not referenced. Keep dependency changes deliberate and lockfile committed.
- Keep source and content files in UTF-8 and verify punctuation renders correctly in the built site. Normalize currency and date formatting rather than relying on inconsistent hand-entered symbols.
- Add a shared currency/price formatter driven by the actual order currency; avoid repeated hard-coded USD formatters.
- Audit keyboard and screen reader behavior: drawer focus trap/restore, Escape handling, hidden drawer focusability, form labels/errors, live status updates, headings, focus visibility, image alt text, listbox semantics, and minimum contrast. Target WCAG 2.2 AA for the customer flows.
- Make all interactive states usable on mobile, reduced motion, zoom, keyboard-only, and screen readers. Avoid toasts that disappear before assistive technology can announce them.
- Add error boundaries and safe retry boundaries for failed routes/data fetches. Do not swallow errors into fake product/order state.
- Add an explicit not-found route and useful route-level error pages. The current router has no catch-all route, so unknown paths do not have a deliberate recovery experience.
- Add SEO basics for a storefront: meaningful document title/description, share metadata, canonical URL strategy, favicon/brand consistency, robots/sitemap policy, and no indexing of private order/account routes.
- Review image loading, route chunking, layout shift, large CSS bundles, and catalog pagination against performance budgets. Keep the initial page useful on slow networks.

**Exit criteria:** Type checks/lint/build are clean; core shopping paths pass keyboard/screen-reader and mobile checks; production failures remain visible and recoverable without corrupting cart/order state.

### Phase 6 — Automated verification and secure CI/CD

Build a test pyramid around the actual business/security risks. These are future roadmap tasks; no tests were run as part of this review.

- Unit tests for money rounding, tax/shipping/discount rules, quantities, promo eligibility, address validation, state transitions, and local-storage parsing/migration.
- Component tests for catalog empty/error states, stock controls, cart edits, checkout validation, auth lifecycle, and accessible announcements.
- Supabase local/integration tests for migrations and RLS with anonymous, customer A, customer B, admin, and service/webhook identities. Include negative authorization assertions, not only happy paths.
- Backend tests for atomic order creation, price recalculation, inventory races, idempotency, webhook signature validation, duplicate event handling, refund paths, and notification retries.
- End-to-end browser tests for browse → cart → checkout → provider sandbox → receipt → order history; include refresh, multiple accounts, guest retrieval if supported, and mobile viewport.
- Add accessibility checks and a manual assistive-technology pass for critical journeys. Add dependency/security scanning and secret scanning to CI.
- Expand scripts/CI to run formatter or formatting check, lint, strict typecheck, unit/component/integration/e2e suites as appropriate, and production build. Make a failure block merge/release.
- Create isolated Supabase development/staging projects. Apply migrations and tests against local/staging before production.
- Change **.github/workflows/deploy-migrations.yml** from automatic unreviewed production mutation to a staged/protected rollout: least-privilege workflow token permissions, pinned CLI version, no hard-coded project fallback, protected environment approvals, concurrency protection, migration validation, backup/restore plan, and explicit production promotion. Keep database passwords in protected secrets and avoid exposing them in shell arguments/logs where possible.
- Add frontend deployment workflow and host configuration: SPA route fallback for BrowserRouter, immutable asset caching, correct environment injection, HTTPS, and a rollback/previous-release procedure. Use separate domains/config for staging and production.
- Make schema snapshots/manual SQL clearly generated or remove them after migration workflow is the sole source of truth. Document a safe local setup and migration process in README.

**Exit criteria:** A pull request cannot merge with failing quality/security checks; a staging release is reproducible; a production migration/deploy requires an authorized, auditable release action and can be recovered.

### Phase 7 — Production operations and release hardening

- Configure HTTPS, HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and an appropriate frame policy. CSP must allow only required Supabase, payment-provider, and image endpoints; test payment redirects and OAuth under the real policy.
- Restrict Supabase Auth redirect URLs, OAuth origins, API/CORS origins, and production secrets to the actual production domains. Keep staging credentials separate.
- Add client/server error monitoring, uptime checks, structured server logs, and alerts for payment/webhook failures, order/payment mismatch, failed migrations, email backlog, elevated authorization denials, and provider outages. Scrub personal data and tokens from events.
- Configure database backups/PITR according to the chosen plan. Perform a restore rehearsal and document recovery time/data objectives, incident contacts, and breach/credential rotation steps.
- Add rate limits and abuse detection at the server/provider boundary for checkout, login, guest order lookup, coupons, and account creation. Use provider fraud tools where applicable.
- Establish dependency update cadence, vulnerability triage, lockfile review, release notes, and supported runtime/browser policy.
- Verify legal/support content is published and reachable: privacy, terms, shipping, returns/refunds, warranty, contact, tax/pricing disclosures, and accessibility statement as appropriate to the launch jurisdictions.
- Prepare operational runbooks for payment outage, duplicate/unknown payment, stuck inventory reservation, order not persisted, failed email, refund, admin lockout, migration rollback/forward-fix, and data incident.

**Exit criteria:** Alerts are tested, a restore has been completed, support can perform documented order operations, production config is restricted, and incidents have an owner/runbook.

## 4. Test and authorization matrix

Every table/API should be tested against the following actors. “Denied” should be asserted explicitly.

| Actor | Catalog read | Product write | Profile read/write | Order read | Order create/state change |
|---|---|---|---|---|---|
| Anonymous | Published fields only | Denied | Denied | Denied except an approved guest capability flow | May request a checkout; trusted server validates and creates pending records |
| Customer A | Published fields only | Denied | Own permitted fields only | Customer A only | Can initiate own checkout; cannot set amount/payment/fulfillment state |
| Customer B | Published fields only | Denied | Own permitted fields only | Customer B only; cannot read A | Same as customer A |
| Catalog/order admin | Published fields plus authorized admin functions | Explicitly authorized actions only | No broad customer PII access unless support role requires it | Authorized operational scope, audited | Authorized audited actions; payment proof still comes from provider |
| Webhook/service identity | Minimum required data | Narrow server work only | No general browser profile use | Required records only | Verified/idempotent state transitions only |

Include the account-deletion and guest-order cases in this matrix. A deleted account must not accidentally convert a private customer order into a public guest row.

## 5. Release gates

Do not call the project production-ready until all gates pass:

1. **Security:** RLS/grants are reviewed and automated; no public profile/order PII; no customer self-promotion; admin routes/actions are server-authorized; no secrets in the browser.
2. **Commerce correctness:** trusted price, stock, discount, tax, and shipping calculation; integer money; payment provider sandbox/live configuration; verified webhook/idempotency; refund and failure paths.
3. **Data reliability:** atomic order/item creation; persistent authenticated order history; safe guest retrieval if enabled; backup/restore rehearsal; no false success on failed writes.
4. **Customer trust:** policies and marketing claims match implemented shipping, return, warranty, payment, and email behavior; accessible and understandable failures.
5. **Quality:** strict typecheck, lint, automated tests, RLS negative tests, payment sandbox E2E, accessibility review, and production build pass in CI.
6. **Operations:** staging/prod separation, protected deployment, security headers, monitoring/alerts, support/runbooks, legal/privacy materials, and named owners are in place.

## 6. Recommended execution order

1. Configure the Supabase project URL and publishable key locally; apply and review the new migration without overwriting an existing production schema.
2. Configure email confirmation and production email delivery, then bootstrap the first administrator through a trusted SQL operation.
3. Enter and verify the store's real product data, prices, inventory, images, and currencies.
4. Confirm the launch country, currency, tax rules, delivery regions, shipping prices, returns policy, and fulfillment owner.
5. Select a payment provider and implement a trusted checkout endpoint, server-side price and inventory checks, provider-hosted payment, verified webhooks, and idempotency.
6. Add payment failure, cancellation, refund, inventory reservation, and reconciliation paths before accepting customer orders.
7. Add transactional email and minimum order-support operations.
8. Add staging/production deployment controls, authorization and payment verification, hosting headers, monitoring, backup/restore, and runbooks.
9. Complete the accessibility and performance review, reconcile customer-facing copy, and pass the release gates.

Security and payment work are launch blockers. Visual polish, SEO depth, and advanced admin analytics can follow the minimum safe transactional flow, but customer-facing claims must be accurate before public release.
