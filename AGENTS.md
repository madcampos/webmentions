# Webmentions Agent Instructions

You are an expert AI assistant tasked with maintaining and extending the `webmentions` project, a Cloudflare Workers-based implementation for handling Webmentions.

## Project Overview

- **Stack:** TypeScript, Node.js (v24+), pnpm (v10+).
- **Platform:** Cloudflare Workers, D1 Database.
- **Standards:** Prefers modern web-platform standards and native APIs (e.g., `fetch`, `AbortController`, `URLPattern`).
- **Formatting:** Managed by `dprint`. DO NOT argue with the formatter or hand-format code.
- **Linting:** `oxlint`.

## Repository Structure

- [src/index.ts](src/index.ts): Main entry point for the Cloudflare Worker.
- [src/router.ts](src/router.ts): Custom `URLPattern`-based router implementation.
- [src/db.ts](src/db.ts): D1 database interactions and schemas.
- [src/parser.ts](src/parser.ts): Logic for parsing various content types (HTML, JSON, Text) for mentions.
- [src/fetch.ts](src/fetch.ts): Helpers for fetching source URLs with proper validation and abort handling.
- [src/validation.ts](src/validation.ts): Parameter and response validation.
- [src/utils.ts](src/utils.ts): Shared response types and constants.
- [db/migrations/](db/migrations/): SQL migration files for the D1 database.
- [docs/](docs/): Project architectural and lifecycle documentation.

## Patterns & Conventions

### 1. Cloudflare Workers & D1
- Use the `env.Database` binding for all D1 operations.
- Prefer SQL comments for syntax highlighting in IDEs if supported: `/* sql */ \`SELECT ...\``.
- Use `strftime('%Y-%m-%dT%H:%M:%SZ', 'now')` for ISO8601 timestamps in SQLite.

### 2. Error Handling
- Throw `ErrorResponse` for known error cases that should return a specific HTTP status code.
- Wrap request handlers in `try/catch` and use `ErrorResponse` to return meaningful feedback.

### 3. Routing
- The project uses a custom [Router](src/router.ts) class. Register routes in [src/index.ts](src/index.ts).
- Routes support `URLPattern` syntax.

### 5. Type Safety & TypeScript
- The project uses explicit types. Ensure new database models or parser results are typed in [src/db.ts](src/db.ts) or [src/parser.ts](src/parser.ts).
- For classes, prefer native private fields (`#field`) instead of TypeScript's `private` modifiers.
- Use type inference as much as possible and only write types if absolutely needed.
- Prefer `satisfies` over `as` for type casting/validation.
- Run `pnpm run bootstrap` to update wrangler types in [src/env.d.ts](src/env.d.ts) after configuration changes.

## Development Workflow

- **Local Development:** `pnpm start` (runs `wrangler dev`).
- **Migrations:**
  - Local: `pnpm run db:migrations:local`
  - Remote: `pnpm run db:migrations:remote`
- **Testing:** `vitest` (uses `@cloudflare/vitest-pool-workers`).
- **Test Descriptions:** Follow the **Action-Condition-Result** pattern (e.g., `it('should return 200 when the request is valid')`).
- **Lint/Check:** `pnpm run lint` (runs `tsc` and `oxlint`).
- **Format:** `pnpm run format` (runs `dprint`).

## Additional Resources

- [docs/DEPLOYING.md](docs/DEPLOYING.md) for deployment procedures.
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines.
