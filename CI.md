# Frontend CI

Workflow file:
- `.github/workflows/frontend-quality.yml`

## What it runs

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. `npm run test:e2e` (mock mode)
5. Optional real-backend contract test:
   - `npx playwright test e2e/backend.real.spec.ts`
   - Runs only when repository secret `E2E_API_BASE` is set

## Trigger

- Pull requests
- Push to `main` or `master`

## Required secret (optional contract job)

- `E2E_API_BASE`  
  Example: `https://api.yourapp.com/api/v1`

## Runtime expectation

- Lint/build + Playwright usually a few minutes depending on runner load.

## Failure triage

1. Reproduce locally:
   - `npm run lint`
   - `npm run build`
   - `npm run test:e2e`
2. If contract spec failed, validate API availability and `E2E_API_BASE`.
