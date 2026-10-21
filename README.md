# Storefront

A React and TypeScript storefront backed by Supabase Auth and Postgres. The catalog contains no seeded or fallback products; publish the store's actual product records before opening the site to customers.

## Current behavior

- Email/password sign-up, sign-in, sign-out, and password reset use Supabase Auth.
- Published products load from Postgres. Admins manage products at `/admin/products`.
- Profiles and order history are scoped to the signed-in account by Postgres row-level security.
- The database has order and line-item tables, but client-side order creation is intentionally disabled.
- Checkout is closed until the owner chooses a payment provider, launch market, currency, tax rules, and delivery rules. No payment or order is created by the current checkout page.

## Configure Supabase

1. Use the Supabase project referenced in `supabase/config.toml`, or update that project reference if the project changes.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's Connect dialog. A publishable key is intended for browser use; never put a Supabase secret or service-role key in a `VITE_*` variable.
3. Apply the migration with the Supabase CLI:

   ```powershell
   npx supabase login
   npx supabase link --project-ref tavjsipzqnlxcmxdivuu
   npx supabase migration list
   npx supabase db push
   ```

   Review the remote migration history before pushing. This repository replaces the earlier migration files; if the linked project reports applied versions that are missing locally, stop and reconcile the history deliberately. Do not reset the project or mark old migrations applied without checking the live schema and data.

4. In Supabase Auth URL Configuration, set the deployed site URL and the allowed redirect URLs. Configure a production email sender before enabling account registration and password recovery for customers.
5. Create and verify the first operator account. In the SQL Editor, promote only that account using its auth user ID:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '<auth-user-uuid>';
   ```

   Role changes are not available through the browser. Database policies remain the authority for product writes.
6. Sign in with that account and use `/admin/products` to add genuine product descriptions, images, inventory, prices, and ISO currency codes. Products are drafts until published.

## Local development

```powershell
npm install
npm run dev
```

If Supabase environment variables are missing, account access and the live catalog report that they are unavailable. The app does not fall back to mock accounts or sample products.

## Production work still required

- Choose the payment provider and implement its server-side checkout session, verified webhook, idempotency, refunds, and payment-state transitions. The database intentionally grants no client insert or update access to orders.
- Confirm supported countries, store currency, tax calculation, shipping prices and coverage, returns, privacy terms, and fulfillment ownership. Do not treat the cart subtotal as a final order total.
- Add inventory reservation and server-side price validation when checkout is implemented.
- Configure and test production email delivery, auth redirect URLs, backups, monitoring, deployment, and rollback procedures.
- Review the migration and row-level security policies in the target Supabase project before applying them to any database that already contains production data.
