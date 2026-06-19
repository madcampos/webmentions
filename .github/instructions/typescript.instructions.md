---
applyTo: "**/*.ts"
---

# TypeScript Patterns

- For classes, prefer native private fields (`#field`) instead of TypeScript's `private` modifiers.
- Use type inference as much as possible and only write types if absolutely needed.
- Prefer `satisfies` over `as` for type casting and validation.
- Minimize explicit type annotations where the compiler can accurately infer the type.
- Use `const enum` for internal constants if performance is critical, otherwise prefer object literals or template literal types.
- Ensure `Env` types in `src/env.d.ts` are kept up to date by running `pnpm run bootstrap` after configuration changes.

# Testing Patterns

- Test descriptions should follow the **Action-Condition-Result** pattern (e.g., `it('should return 200 when the request is valid')`).
