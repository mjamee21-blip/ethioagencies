# Cloudflare Deployment Guide for Recruitment Agency OS

This document outlines the architecture, compatibility analysis, and step-by-step instructions for deploying the **Recruitment Agency OS** Next.js application to **Cloudflare Pages** using [`@cloudflare/next-on-pages`](package.json:16) and connecting to Cloudflare D1 (SQLite) or PostgreSQL.

---

## 1. Cloudflare Compatibility Analysis

Next.js 14 (`"next": "14.2.5"`) application running on Cloudflare Pages has specific architectural considerations:

- **Runtime Environment**: Cloudflare Workers run on the V8-based Workers runtime (Edge/Serverless), which does not support full Node.js APIs like native TCP socket modules (`net`, `tls`).
- **Database Connectivity**:
  - **Option A (Cloudflare D1 - Recommended for Serverless/Edge)**: Native SQLite database provided by Cloudflare, accessed via Drizzle ORM (`drizzle-orm/d1`) and bound via `wrangler.toml`.
  - **Option B (Neon Serverless / HTTP / WebSockets)**: Use `@neondatabase/serverless` for direct HTTP/WebSocket-based queries to Neon Postgres.
  - **Option C (Supabase JS / REST / Pooling)**: Use Supabase's connection pooling URL or Supabase REST API (`@supabase/supabase-js`).
  - **Option D (Cloudflare Hyperdrive)**: Accelerates and proxies traditional TCP PostgreSQL connections over Cloudflare's global network.

---

## 2. Configuration Files

The project has been configured with the following setup for Cloudflare deployment and D1 database support:

1. **[`package.json`](package.json:1)**:
   - Added dependency [`@cloudflare/next-on-pages`](package.json:16).
   - Added dev dependency [`wrangler`](package.json:39).
   - Added build scripts:
     - [`pages:build`](package.json:9): `npx @cloudflare/next-on-pages`
     - [`preview`](package.json:10): `npm run pages:build && wrangler pages dev .vercel/output/static`
     - [`deploy`](package.json:11): `npm run pages:build && wrangler pages deploy .vercel/output/static`

2. **[`wrangler.toml`](wrangler.toml:1)**:
   - Configured pages project settings, `compatibility_date`, `pages_build_output_dir = ".vercel/output/static"`, and D1 database binding (`DB`).

3. **[`src/db/index.ts`](src/db/index.ts:1)**:
   - Automatically detects Cloudflare D1 binding (`process.env.DB`) or falls back to PostgreSQL connection (`DATABASE_URL`).

4. **[`drizzle.config.ts`](drizzle.config.ts:1)**:
   - Configured with SQLite dialect for D1 compatibility.

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create / Bind Cloudflare D1 Database
1. Create a D1 database using Wrangler:
   ```bash
   npx wrangler d1 create recruitment-agency-os-db
   ```
2. Update `database_id` in [`wrangler.toml`](wrangler.toml:1) with the returned database ID.
3. Run migrations locally or remotely:
   ```bash
   npx wrangler d1 execute recruitment-agency-os-db --local --file=./drizzle/0000_*.sql
   npx wrangler d1 execute recruitment-agency-os-db --remote --file=./drizzle/0000_*.sql
   ```

### Step 3: Test Local Build & Preview
```bash
npm run pages:build
npm run preview
```

### Step 4: Deploy to Cloudflare Pages
1. Log in to Cloudflare CLI:
   ```bash
   npx wrangler login
   ```
2. Deploy the application:
   ```bash
   npm run deploy
   ```
