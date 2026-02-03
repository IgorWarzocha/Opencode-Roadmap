# OpenCode Planning Toolkit

**Keep your projects organized and your AI agents aligned.**

This plugin adds structure to your development workflow with reusable specifications, actionable plans, and progress tracking—all integrated directly into OpenCode.

## Why This Plugin

- Enables planning with any and all agents
- Organize work into reusable specs and actionable plans
- Track progress with clear status (active/done)
- Maintain project-wide standards that apply across all work
- Automatically receive `<available_plans>` in the system prompt with all plan names and descriptions
- **Bundled skill** automatically loads to guide agents through proper planning workflow

## Tools

- **`create_spec`** - Create a reusable specification (repo-level or feature-specific)
- **`create_plan`** - Create an actionable work plan with implementation steps (min 5)
- **`append_spec`** - Link an existing spec to a plan
- **`read_plan`** - Read a plan with all linked spec content expanded inline
- **`mark_plan_done`** - Mark a plan as complete

![opencode-roadmap](https://github.com/user-attachments/assets/e2479a72-ec65-457f-9503-bf2d01580c70)

## Bundled Skill

This plugin includes a **bundled skill** (`plans-and-specs`) that automatically loads with the plugin. The skill provides agents with:

- Clear workflow instructions for creating plans and specs
- Proper order of operations (create plan → append REPO specs → ask about FEATURE specs)
- Instructions to check for existing plans before creating new ones
- Guidance on when to use each tool

**When agents use it:**
- User asks to create a plan, roadmap, or break down work
- User mentions specs, requirements, or standards documentation
- User references existing plans that need reading or updating
- User asks to mark work complete or link requirements

The skill ensures agents follow best practices automatically without manual prompting.

## Installation

Add to your `opencode.json`:

```json
{
  "plugins": [
    "@howaboua/opencode-planning-toolkit@latest"
  ]
}
```

Or for local development:

```json
{
  "plugins": [
    "file:///path/to/opencode-planning-toolkit/index.ts"
  ]
}
```

## Quick Start

### 1. Create a Reusable Spec

Define standards or requirements once, use them everywhere:

**Ask the agent:** "Create a repo-level spec for TypeScript coding standards"

The agent creates `docs/specs/typescript-standards.md`:

```markdown
# Spec: typescript-standards

Scope: repo

- Use strict mode
- All functions must have explicit return types
- Prefer `const` over `let`
- No `any` types without justification
```

### 2. Create a Plan

Turn a goal into actionable steps:

**Ask the agent:** "Create a plan for adding user authentication"

The agent creates `docs/plans/user-auth.md`:

```markdown
---
plan name: user-auth
plan description: JWT authentication for API
plan status: active
---

## Idea
Add secure JWT authentication to the API with login, logout, and token refresh.

## Implementation
- Design JWT token structure and expiry policy
- Add /auth/login endpoint with password validation
- Add /auth/refresh endpoint for token renewal
- Add /auth/logout endpoint to invalidate tokens
- Write tests for all auth endpoints

## Required Specs
<!-- SPECS_START -->
<!-- SPECS_END -->
```

**Agent automatically:**
1. Links any existing REPO scope specs
2. Asks if you want a FEATURE spec for this plan

### 3. Link Specs to Plans

Attach relevant specs to ensure standards are followed:

**Ask the agent:** "Link typescript-standards spec to the user-auth plan"

The plan updates:

```markdown
## Required Specs
<!-- SPECS_START -->
- typescript-standards
<!-- SPECS_END -->
```

### 4. Read Before Work

When starting implementation, the agent reads the full context:

**Ask the agent:** "Read the user-auth plan and start implementing"

The agent receives the full plan with all linked spec content expanded inline.

### 5. Mark Complete

**Ask the agent:** "Mark the user-auth plan as done"

Status updates from `active` → `done`.

## File Organization

```
your-project/
├── docs/
│   ├── specs/           # Reusable specifications
│   │   └── *.md         # Each spec is a markdown file
│   └── plans/           # Work plans
│       └── *.md         # Each plan is a markdown file
```

**Specs naming:** `{name}.md` (e.g., `typescript-standards.md`)
**Plans naming:** `{name}.md` (e.g., `user-auth.md`)

## License

MIT
