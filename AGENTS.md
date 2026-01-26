## Repository Overview

OpenCode plugin for project planning and roadmap management. Provides tools for creating specifications (`spec.md`), generating study plans (`plan.md`), and tracking progress. Built with TypeScript and the OpenCode Plugin SDK.

<instructions>

## Build & Type Check

- **Build**: `npm run build` - Compiles TypeScript to JavaScript
- **Type check**: `npm run lint` - Runs TypeScript compiler with `--noEmit` to verify types without emitting files
- **Clean**: `npm run clean` - Removes all generated `.js` and `.d.ts` files (excluding node_modules)

**Note**: The `npm run watch` command is a long-running process and MUST NOT be used by agents.

## Plugin Structure

- **Entry point**: `index.ts` - Exports `PlanPlugin` function that registers tools and hooks
- **Tools directory**: `tools/` - Individual tool implementations (create-spec, append-spec, create-plan, read-plan, mark-plan-done, shared)
- **Hooks directory**: `hooks/` - System-level plugin hooks
- **Utilities**: `utils.ts` - Path security, file operations, and formatting helpers

## File Organization

TypeScript source files compile to `dist/` directory:
- Edit `.ts` source files in root, `tools/`, `hooks/`
- Run `npm run build` to compile to `dist/`
- Source `.ts` files and compiled `dist/*.js` are both tracked
- Generated `.d.ts` files are ignored via gitignore

## Tool Implementation Pattern

Each tool in `tools/` follows this structure:
- Validates input parameters
- Uses utility functions from `utils.ts` for secure path handling
- Formats frontmatter for plan/spec files consistently
- Returns structured responses to the agent

</instructions>

<rules>

## Process Constraints

- MUST NOT run long-running/blocking processes (e.g., `npm run watch`)
- MUST use one-shot commands only (`npm run build`, `npm run lint`)
- Dev servers and watch modes are the USER's responsibility

## Coding Conventions

- **TypeScript strict mode**: All code must pass `tsc --noEmit` with strict type checking
- **Path security**: MUST use `getSecurePath`, `getPlanPath`, or `getSpecPath` from `utils.ts` for all file paths
- **Name validation**: MUST use `validateName` for user-provided plan/spec names (letters, numbers, hyphens only, max 3 words)
- **File formats**: 
  - Plans use frontmatter: `plan name`, `plan description`, `plan status`
  - Specs use: `# Spec: {name}` header with `Scope:` field
- **Error handling**: All tools should return error objects with clear messages
- **Utility imports**: Import shell and context types from `@opencode-ai/plugin`

## Frontmatter Structure

Plan files must maintain this exact format:
```yaml
---
plan name: {name}
plan description: {description}
plan status: active
---
```

Spec files must use this format:
```markdown
# Spec: {name}

Scope: {scope}

{content}
```

</rules>

<routing>

## Task Navigation

| Task | Entry Point | Key Files |
|------|-------------|-----------|
| Add new tool | `tools/index.ts` | Create new `.ts` file in `tools/` |
| Modify tool logic | `tools/{tool-name}.ts` | Edit tool implementation |
| Change file formats | `utils.ts` | Update `formatPlan` or `formatSpec` functions |
| Plugin initialization | `index.ts` | Exports and hook registration |
| Type definitions | `tools/shared.ts` | Shared types and interfaces |

</routing>

<context_hints>

## Context Allocation

- **`dist/` directory**: Compiled outputs - can skip unless debugging runtime issues
- **`node_modules/`**: Always skip
- **`.git/`**: Skip version control metadata
- **`bun.lock`**: Skip lockfile
- **Critical paths**: `utils.ts` path security functions break if modified incorrectly

</context_hints>
