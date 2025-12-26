# @howaboua/opencode-roadmap-plugin

Persistent project roadmaps for OpenCode. Coordinates work across sessions and parallel Task tool subagents.

## Why Use This?

OpenCode's built-in todo is session-scoped—it disappears when you restart. Task tool subagents are stateless—they can't see each other's work.

This plugin solves both:

- **Persists to disk** — survives restarts, available across sessions
- **Shared context** — subagents read the same roadmap to understand the bigger picture
- **Concurrent awareness** — agents see what's `in_progress` and avoid conflicts

## Installation

Add to your `opencode.json`:

```json
{
  "plugin": ["@howaboua/opencode-roadmap-plugin@latest"]
}
```

OpenCode installs it automatically on next launch.

## Tools

### `createroadmap`

Create or extend a project roadmap.

```
"Create a roadmap for building user auth with login, signup, and password reset"
```

- Features group related work (`"1"`, `"2"`, `"3"`)
- Actions are concrete tasks (`"1.01"`, `"1.02"`) within features
- New actions always start as `pending`
- Append-only: existing IDs never change

### `readroadmap`

View current state and progress.

```
"Show me the roadmap"
"What's the status of feature 2?"
```

Before delegating work to Task tool subagents, instruct them to read the roadmap first so they understand their assigned action within the broader plan.

### `updateroadmap`

Change action status or description.

```
"Mark action 1.01 as in_progress"
"Action 2.03 is completed"
```

**Statuses:** `pending` → `in_progress` → `completed` | `cancelled`

Transitions are flexible—you can revert if plans change. Only `cancelled` is terminal.

Auto-archives the roadmap when all actions reach `completed`.

## Coordinating Parallel Work

When multiple subagents work simultaneously:

1. Each reads the roadmap to see what's `in_progress`
2. Agents stay focused on their assigned action only
3. They avoid modifying files that belong to another `in_progress` action
4. Errors outside their scope get noted, not fixed

This prevents conflicts when subagents run in parallel.

## Workflow Example

```
You: "Plan out building a REST API with auth, users, and posts endpoints"

AI: Creates roadmap with 3 features, ~12 actions

You: "Implement feature 1"

AI: Reads roadmap → sees Feature 1 has 4 actions → uses todowrite for immediate steps → delegates to subagents → each subagent reads roadmap first → updates status when done
```

## Storage

- **Active:** `roadmap.json` in project root
- **Archived:** `roadmap.archive.<timestamp>.json` when complete

## License

MIT
