# Snabb — Production Readiness Assessment
_Generated: 2026-05-04_

---

## Overall Scores

| Layer | Score | Status |
|-------|-------|--------|
| Backend (FastAPI) | 8 / 10 | ✅ Near-ready |
| Database (Postgres + Alembic) | 7 / 10 | ✅ Good shape |
| Mobile (React Native / Expo) | 5 / 10 | ⚠️ Logging & crash reporting missing |
| Web (Next.js) | 4 / 10 | ⚠️ Minimal error handling, no monitoring |

---

## 1. Backend

### ✅ What's solid

- **Security hardened**: SECRET_KEY strength validator, bounded JWT blocklist, HTTPS-aware cookies, magic-byte image validation, admin-gated Pro approval, GDPR soft-delete.
- **Rate limiting**: Redis-backed, separate tighter budget for auth endpoints (5 req/min vs 60 req/min general).
- **Sentry integrated**: `SENTRY_DSN` wired through config; traces + profiles sample rates are environment-driven.
- **MonitoringMiddleware**: every request is timed and stats are written to Redis (`stats:total_requests`, `stats:status_codes`, `stats:endpoint_hits`, `stats:recent_requests`).
- **Health check**: `GET /health` now runs `SELECT 1` against the DB and returns HTTP 503 on failure — Render's load balancer will pull the instance.
- **Structured loggers**: all routers, middleware, services use `logging.getLogger(__name__)`. All `print()` calls replaced with levelled logger calls with `exc_info=True` on errors.
- **71 / 71 integration tests passing** across auth, users, asks, and payments.
- **Alembic migrations**: six migrations in chain, `alembic upgrade head` runs on every Render deploy.

### ⚠️ Remaining gaps

| Priority | Issue | Fix |
|----------|-------|-----|
| **High** | Logging format is plain text (`%(asctime)s - %(name)s - ...`). Render's log stream is more searchable with JSON lines. | Add a `JSONFormatter` or use `python-json-logger` in `main.py`. |
| **High** | No request correlation ID. When an error fires in Sentry you can't trace it back to the exact request in logs. | Add a `X-Request-ID` middleware that stamps every log record and response header. |
| **Medium** | DB connection pool not tuned. Render free Postgres has a 25-connection limit; SQLAlchemy default pool size is 5 + 10 overflow = 15 per worker. With 2–4 Gunicorn workers that's fine, but worth explicit configuration. | Set `pool_size=5, max_overflow=5, pool_timeout=30` in `create_engine()`. |
| **Medium** | `config.py.bak` and scratch `.db` files still committed (`audit_autogen.db`, `snabb.db`, `out.txt`, etc.). | Add to `.gitignore`, remove from git history. |
| **Low** | No slow-query logging. Queries >500 ms are invisible until they cause a timeout. | Add SQLAlchemy `event.listen(engine, "before_cursor_execute", ...)` to log slow queries. |

---

## 2. Database

### ✅ What's solid

- Alembic chain is complete and covers all current model fields including `id_card_url`.
- `alembic/env.py` reads `DATABASE_URL` from app settings — no hardcoded strings.
- `render.yaml` runs `alembic upgrade head` in the build command before the server starts.
- Soft-delete pattern (`is_deleted`, `deleted_at`) protects FK integrity while scrubbing PII.

### ⚠️ Remaining gaps

| Priority | Issue | Fix |
|----------|-------|-----|
| **High** | `id_card_url` migration (`c661bcccd07d`) adds indexes for all tables **but does not add the `id_card_url` column** to users — it was accidentally committed as an index-only migration. The column addition needs to be in a new migration. | Run `alembic revision --autogenerate -m "add_id_card_url_column"` against a real Postgres instance and commit the output. |
| **Medium** | `prod_initial_schema.py` has no `revision` or `down_revision` — it's an orphan file in the versions folder and will confuse `alembic heads`. | Delete or properly wire it into the chain. |
| **Medium** | No DB connection pooler (PgBouncer). The free Render Postgres allows 25 connections total; aggressive reconnects under load will exhaust them. | Enable Supabase's built-in PgBouncer, or deploy a PgBouncer instance. |
| **Low** | `CHECK` constraints on string length exist only at the Pydantic/SQLAlchemy layer, not the DB layer. A direct SQL insert can bypass them. | Add `CheckConstraint` to critical columns (`username`, `email`) in the model and a migration. |

---

## 3. Mobile (React Native / Expo)

### ✅ What's solid

- `@sentry/react-native` is installed and in `package.json`.
- `ErrorBoundary` wraps the entire app tree — uncaught render errors show a "Try Again" screen rather than a white crash.
- Axios interceptor handles 401s by clearing the token and emitting an `unauthorized` event.
- `usePerformanceMonitor` hook tracks screen render times (in-memory, dev-only logs).
- `OfflineContext` queues failed API calls and retries on reconnect.

### ❌ Critical gaps

| Priority | Issue | Fix |
|----------|-------|-----|
| **Critical** | **Sentry is commented out in `App.tsx`**. `@sentry/react-native` is installed but never initialised. Every crash in production is invisible. | Uncomment and configure: `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.2 })`. Wrap the app with `Sentry.wrap(App)`. |
| **Critical** | **44 `console.*` calls** in production code (errors, warnings, logs). On a released app these disappear into the void — `console.error('Failed to close ask', error)` etc. never reach any log aggregator. | Create a thin `logger` wrapper that calls `Sentry.captureException(error)` for `error`-level calls and `Sentry.addBreadcrumb(...)` for `warn`/`info`. Replace all `console.error` calls with it. |
| **High** | `analytics.ts` is a mock that only calls `console.log`. No real events reach any analytics platform. | Wire to Mixpanel, PostHog, or Firebase Analytics using `EXPO_PUBLIC_ANALYTICS_KEY`. |
| **High** | `authService.updateProfile` calls `PUT /auth/me` — the backend route is `PATCH /users/me`. This will silently 404/405 every time a user edits their profile. | Change to `apiClient.patch('/users/me', data)`. |
| **Medium** | `usePerformanceMonitor` collects render-time data in memory and logs to console in dev but never sends it anywhere in production. | Forward metrics to Sentry Performance or your analytics service. |
| **Medium** | No token refresh flow. When the 60-minute JWT expires the user is logged out silently. | Implement a refresh-token endpoint on the backend and a silent re-auth interceptor in Axios. |
| **Low** | `API_CONFIG.TIMEOUT = 30000` (30 s). For file upload endpoints this may be too short on slow mobile connections. | Increase to 60 s for upload endpoints specifically, keep 15 s for read endpoints. |

---

## 4. Web (Next.js)

### ✅ What's solid

- `NEXT_PUBLIC_API_URL` is configurable via `.env.local` — no hardcoded prod URLs in component code.
- `next.config.ts` whitelists allowed image domains (Render + S3) — no open wildcard.
- Fonts loaded via `next/font/google` (no CLS).

### ❌ Critical gaps

| Priority | Issue | Fix |
|----------|-------|-----|
| **Critical** | **No Sentry at all** — not in `package.json`, not initialised anywhere. Every JS error in the web app is invisible. | `npx @sentry/wizard@latest -i nextjs` — adds `sentry.client.config.ts`, `sentry.server.config.ts`, and source-map upload automatically. |
| **Critical** | **No error boundary**. An uncaught error in any component crashes the entire page with a blank white screen. | Add a root `error.tsx` in `app/` (Next.js 13+ app-router built-in error boundary). |
| **High** | `web/src/lib/api.ts` is just a URL constant — no Axios/fetch wrapper, no auth headers, no error interceptor. All API calls in page components are likely bare `fetch()` with no consistent error handling. | Create an `apiClient` matching the mobile pattern: base URL + auth header from cookie/localStorage + 401 redirect. |
| **High** | **24 `console.*` calls** across web `src/`. These appear in browser DevTools but not in any log aggregator or error tracker. | After Sentry is wired, route `console.error` calls through `Sentry.captureException`. |
| **High** | No Content Security Policy header. Next.js serves no `Content-Security-Policy` response header, leaving the app open to XSS escalation. | Add CSP headers in `next.config.ts` under `headers()`. |
| **Medium** | `web/.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8001` — if this is accidentally committed it will point prod builds at localhost. | Add `.env.local` to `.gitignore` (verify it's already there). |
| **Medium** | No `robots.txt` or `sitemap.xml`. The marketing page (`/`) will be crawled but dashboard routes (`/app/*`) should be blocked. | Add `public/robots.txt` disallowing `/app/` and an auto-generated sitemap. |
| **Low** | `metadata` in `layout.tsx` has `title: "Snabb Web"` — generic. | Set proper OG tags: title, description, og:image for social sharing. |

---

## 5. Logging — Full-Stack Assessment

| Layer | Log destination | Log level | Structured? | Crash reporting |
|-------|----------------|-----------|-------------|-----------------|
| Backend | Render log stream | INFO+ (configurable) | ❌ Plain text | ✅ Sentry (configured, needs DSN) |
| Database | Alembic stdout | INFO | ❌ Plain text | — |
| Mobile | Console only in prod | — | ❌ | ❌ Sentry installed but **commented out** |
| Web | Console only in prod | — | ❌ | ❌ **Not installed** |

### What needs to happen before go-live

1. **Backend**: Switch to JSON log format so Render's log search works. Add a `X-Request-ID` header middleware. Set `SENTRY_DSN` in Render Dashboard.
2. **Mobile**: Uncomment Sentry init. Set `EXPO_PUBLIC_SENTRY_DSN`. Replace `console.error` with a logger that calls `Sentry.captureException`.
3. **Web**: Run `npx @sentry/wizard -i nextjs`. Add `error.tsx`. Centralise API calls through a typed client with error handling.

---

## 6. render.yaml — Current State

`render.yaml` has been updated in this session. Key values now set:

| Variable | Value |
|----------|-------|
| `CORS_ORIGINS` | `["https://snabb.vercel.app","https://www.snabb.com"]` — update to your real domains |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `SECRET_KEY` | Render `generateValue: true` |
| `SENTRY_DSN` | `sync: false` — must be set in Render Dashboard |
| `AWS_*` | `sync: false` — must be set in Render Dashboard |
| `RESEND_API_KEY` | `sync: false` — must be set in Render Dashboard |
| `STRIPE_*` | `sync: false` — must be set in Render Dashboard |

---

## Priority Action List

### Must-do before launch
1. Uncomment and configure Sentry in `mobile/App.tsx`
2. Install and configure Sentry in the Next.js web app
3. Create a `logger` wrapper in mobile to route `console.error` to Sentry
4. Fix `authService.updateProfile` — `PUT /auth/me` → `PATCH /users/me`
5. Add `error.tsx` to the Next.js app router
6. Set all `sync: false` secrets in the Render Dashboard
7. Fix the `id_card_url` Alembic migration (run autogenerate against real Postgres)
8. Delete or wire `prod_initial_schema.py` into the Alembic chain

### Should-do before scaling
9. Add JSON log formatter to the backend
10. Add `X-Request-ID` correlation middleware
11. Add CSP headers to Next.js
12. Tune SQLAlchemy connection pool (`pool_size=5, max_overflow=5`)
13. Create a centralised `apiClient` in the web app
14. Implement token refresh flow (mobile + web)
