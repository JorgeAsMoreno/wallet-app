<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

Invariants to respect when modifying this repo. The canonical documentation lives in [README.md](README.md).

- **Money = `Cents` (integers), never floats.** Use the helpers in [src/core/money/index.ts](src/core/money/index.ts) (`cents`, `parseAmountToCents`, `formatMoney`, `addCents`/`subtractCents`). Don't operate on amounts with raw `number`.
- **Business rules in one place, enforced twice.** They live in [src/features/transactions/domain/rules.ts](src/features/transactions/domain/rules.ts) (`validateTransfer`) and are enforced on **both client and server** ([src/app/api/transfer/route.ts](src/app/api/transfer/route.ts)). A new rule goes there, not inline in the UI.
- **Typed errors; the UI never touches HTTP.** Requests go through [src/core/http/client.ts](src/core/http/client.ts) (timeout + `HttpError`/`NetworkError`/`TimeoutError`) and are normalized to the `TransferOutcome` union in [src/features/transactions/domain/mappers.ts](src/features/transactions/domain/mappers.ts). The UI does an exhaustive `switch` over the outcome.
- **Validation with Zod, shared schema** between client and API (e.g. [src/features/auth/schema.ts](src/features/auth/schema.ts)).
- **Layered architecture:** `core/` (pure logic, no React) → `features/` (self-contained domain) → `components/ui/` (dumb presentation). Don't import React in `core/`.
- **State:** React Query = server state; Zustand = UI/wizard state; React Hook Form = forms. See [README.md](README.md) §5.
- **Tests:** Vitest in `src/tests/unit/`, prioritizing the domain (money, rules, mappers, schemas). Run `npm run test`.
