# OpenCode Roadmap Agent Guide
Build/type-check: `npm run build` (tsc -p tsconfig.json, emits dist/).
Lint: not defined; add `npm run lint` if introduced.
Tests: none defined; single-test command not available.
Runtime: ESM with "type": "module"; Bun/Node friendly.
Imports: external before internal; use `import type`; include `.js` on relative paths.
Verbatim syntax: avoid type-only elision issues; keep import/export forms intact.
Types: strict; avoid `any`; prefer `unknown` then narrow; use discriminated unions.
Avoid: `enum`, `namespace`, constructor parameter props; prefer `type` aliases; `interface` only for extensible APIs.
Literals: use `as const` + `satisfies` to prevent widening.
Naming: files kebab-case; functions/vars camelCase; types PascalCase; constants UPPER_SNAKE_CASE.
Errors: clear, actionable, no file paths; reuse error loaders/messages.
Validation: favor existing Zod schemas and RoadmapValidator helpers.
Storage: keep FileStorage writes atomic (temp → rename); IDs remain strings.
Imports (local): use `./tools/*.js`, `./errors/*.js`, `./descriptions/index.js`, etc.
Formatting: match current style/indentation; modern ES2024 features allowed.
Structure: single-purpose modules; keep logic pure where possible; add brief JSDoc for non-obvious sections.
Security: guard against path traversal; sanitize user-provided paths/IDs before file access.
Performance: minimize I/O and allocations; avoid redundant reads/writes.
Cursor/Copilot rules: none present in repo.
