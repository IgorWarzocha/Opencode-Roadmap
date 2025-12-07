# @howaboua/opencode-roadmap-plugin

Strategic roadmap planning and multi-agent coordination for OpenCode.

## Installation

Add to your repository `opencode.json` or user-level `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@howaboua/opencode-roadmap-plugin"]
}
```

## How It Works

- `createroadmap`: create or append features/actions while keeping IDs immutable.
- `updateroadmap`: advance action status forward only (`pending` → `in_progress` → `completed`), optional description update.
- `readroadmap`: summarize roadmap, optionally filtered by feature/action.
- Storage: JSON on disk with auto-archive when all actions complete.
- Validation: Zod schemas enforce shape; errors surface readable templates.

## Development

```bash
npm run build   # Emit dist/ (ESM + d.ts)
```

See `AGENTS.md` for coding standards.
