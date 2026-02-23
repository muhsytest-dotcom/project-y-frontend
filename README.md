# Project Y Frontend

Next.js frontend for Universal Chat Commerce SaaS.

## Prerequisites

- Node.js 20+
- Backend API available at `NEXT_PUBLIC_API_BASE` (default: `http://127.0.0.1:8000/api/v1`)

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Build

```bash
npm run build
npm run start
```

## End-to-End Tests (Playwright)

Install browser once:

```bash
npm run test:e2e:install
```

Run E2E in local mode (Playwright auto-starts Next dev server):

```bash
npm run test:e2e
```

Run E2E in headed mode:

```bash
npm run test:e2e:headed
```

## CI-ready E2E flow

Use this command in CI:

```bash
npm run test:e2e:ci
```

It runs `build` first, then Playwright with `next start` web server.

GitHub Actions workflow is included at:

- `.github/workflows/e2e.yml`

## E2E Environment Variables

- `E2E_PORT`: server port for Playwright-managed web server (default `3000`)
- `E2E_BASE_URL`: override base URL (default `http://127.0.0.1:<E2E_PORT>`)
- `E2E_SERVER_CMD`: override server command used by Playwright
- `CI`: if set, Playwright uses `next start`; otherwise `next dev`

## Notes

- Route-level error boundaries are enabled for `auth`, `dashboard`, and `storefront`.
- Onboarding wizard route: `/dashboard/onboarding`.
# project-y-frontend
