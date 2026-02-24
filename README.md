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

Run all E2E specs (includes real-backend spec):

```bash
npm run test:e2e:all
```

Run E2E in headed mode:

```bash
npm run test:e2e:headed
```

Run real-backend integration E2E in one command (auto-starts backend, waits for health, then runs Playwright):

```bash
npm run test:e2e:backend:auto
```

If default ports are occupied, this command auto-selects free ports for backend/frontend test processes.

By default this starts backend on `127.0.0.1:8010`. Override with:

```bash
E2E_BACKEND_PORT=8020 npm run test:e2e:backend:auto
```

Manual mode (if backend is already running):

```bash
npm run test:e2e:backend
```

Run full E2E suite with real-backend contract test enabled:

```bash
npm run test:e2e:backend:all
```

## CI-ready E2E flow

Use this command in CI:

```bash
npm run test:e2e:ci
```

It runs `build` first, then Playwright with `next start` web server.

GitHub Actions workflow is included at:

- `.github/workflows/frontend-quality.yml`
- `CI.md`
- `BRANCH_PROTECTION.md`

## E2E Environment Variables

- `E2E_PORT`: server port for Playwright-managed web server (default `3101`)
- `E2E_BASE_URL`: override base URL (default `http://127.0.0.1:<E2E_PORT>`)
- `E2E_SERVER_CMD`: override server command used by Playwright
- `E2E_API_BASE`: backend API base injected into Next server process for tests
- `E2E_BACKEND_PORT`: backend port used by `test:e2e:backend:auto` (default `8010`)
- `CI`: if set, Playwright uses `next start`; otherwise `next dev`

## Notes

- Route-level error boundaries are enabled for `auth`, `dashboard`, and `storefront`.
- Onboarding wizard route: `/dashboard/onboarding`.
# project-y-frontend
