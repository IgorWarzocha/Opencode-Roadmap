# Roadmap Plugin for OpenCode

Strategic roadmap planning and multi-agent coordination plugin for OpenCode. Provides project-wide planning capabilities that complement the session-specific TodoWrite tool.

## About OpenCode Plugins

OpenCode plugins extend the AI coding agent with custom tools, hooks, and integrations. This plugin follows the OpenCode plugin architecture and provides three new tools for strategic project planning:

- **createroadmap** - Initialize project roadmaps with features and actions
- **readroadmap** - View roadmap status and progress
- **updateroadmap** - Update action status and descriptions

## Installation

### Option 1: Install from OpenCode Repository

```bash
# Clone the OpenCode repository
git clone https://github.com/sst/opencode.git
cd opencode/roadmap

# Install dependencies and build
npm install
npm run build
```

Add to your OpenCode configuration (`~/.config/opencode/opencode.json` or project `opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["file:///path/to/opencode/roadmap"]
}
```

### Option 2: Development Installation

For local development:

```bash
# Clone and setup
git clone https://github.com/sst/opencode.git
cd opencode/roadmap
npm install
npm run dev  # Watch mode for development
```

### Option 3: Global Installation (when published)

```bash
npm install -g opencode-roadmap-plugin
```

Then add to config:

```json
{
  "plugin": ["opencode-roadmap-plugin"]
}
```

## Quick Start

Once installed and configured, the plugin provides three new tools:

### 1. Create a New Roadmap

```javascript
createroadmap({
  features: [
    {
      number: "1",
      title: "User Authentication",
      description: "Login and registration system",
      actions: [
        {
          number: "1.01",
          description: "Create login form with email/password fields",
          status: "pending",
        },
        {
          number: "1.02",
          description: "Implement JWT token handling",
          status: "pending",
        },
      ],
    },
  ],
})
```

### 2. Read Roadmap Status

```javascript
// Read entire roadmap
readroadmap({})

// Read specific feature
readroadmap({ featureNumber: "1" })

// Read specific action
readroadmap({ actionNumber: "1.01" })
```

### 3. Update Action Progress

```javascript
// Update status only
updateroadmap({
  actionNumber: "1.01",
  status: "in_progress",
})

// Update both description and status
updateroadmap({
  actionNumber: "1.01",
  description: "Create responsive login form with validation",
  status: "completed",
})
```

## Quick Start

Once installed, the plugin provides three new tools:

### 1. Create a New Roadmap

```javascript
createroadmap({
  features: [
    {
      number: "1",
      title: "User Authentication",
      description: "Login and registration system",
      actions: [
        {
          number: "1.01",
          description: "Create login form with email/password fields",
          status: "pending",
        },
        {
          number: "1.02",
          description: "Implement JWT token handling",
          status: "pending",
        },
      ],
    },
  ],
})
```

### 2. Read Roadmap Status

```javascript
// Read entire roadmap
readroadmap({})

// Read specific feature
readroadmap({ featureNumber: "1" })

// Read specific action
readroadmap({ actionNumber: "1.01" })
```

### 3. Update Action Progress

```javascript
// Update status only
updateroadmap({
  actionNumber: "1.01",
  status: "in_progress",
})

// Update both description and status
updateroadmap({
  actionNumber: "1.01",
  description: "Create responsive login form with validation",
  status: "completed",
})
```

## Key Concepts

### Features vs Actions

- **Features**: Major project components (numbered "1", "2", "3"...)
- **Actions**: Specific work items within features (numbered "1.01", "1.02", "2.01"...)

### Immutable Numbering

- Feature and action numbers never change after creation
- String-based numbering ensures consistency ("1", "1.01", not 1, 1.01)
- Two-decimal format for actions: "1.01", "1.02", "1.03"

### Status Progression

Actions follow strict status flow:

- `pending` → `in_progress` → `completed`
- No backward transitions allowed

### Append-Only Creation

- New features and actions can only be added to the end
- Existing features and actions cannot be modified (except action status/description)
- Maintains roadmap integrity and prevents conflicts

## Multi-Agent Coordination

### Main Agent Workflow

1. Creates project roadmap with `CreateRoadmap` (initial setup only)
2. Defines strategic features and actions with proper numbering
3. Assigns tasks to subagents by updating action status to "in_progress"
4. Monitors progress with `ReadRoadmap`
5. Updates action status to "completed" as work is finished

### Subagent Workflow

1. Reads project context with `ReadRoadmap`
2. Creates session-specific todos with `TodoWrite` for tactical work
3. Completes assigned tactical work
4. Updates action status with `UpdateRoadmap` (status and/or description)
5. Checks overall progress with `ReadRoadmap`

## Tool Reference

### CreateRoadmap

**Purpose**: Initialize project planning with features and actions
**Usage**: Only when no roadmap exists
**Constraints**: Append-only creation, proper numbering required

### UpdateRoadmap

**Purpose**: Modify action status and/or description
**Usage**: Update progress on existing actions
**Constraints**: Actions only, status progression enforced

### ReadRoadmap

**Purpose**: View roadmap status and structure
**Usage**: Understanding context and tracking progress
**Constraints**: Read-only, flexible access patterns

## Storage

The plugin stores roadmap data in `./roadmap.json` in your project directory. This file:

- Uses atomic writes to prevent corruption
- Contains human-readable JSON format
- Is automatically created and managed by the plugin
- Should be committed to version control for team coordination

## Error Handling

The plugin provides clear, tutorial-style error messages for:

- Invalid numbering formats
- Status progression violations
- Missing roadmap files
- Duplicate numbers
- Schema validation errors

Each error includes guidance on how to fix the issue.

## Best Practices

1. **Plan Before Creating**: Design your feature and action numbering before creating the roadmap
2. **Use Descriptive Titles**: Clear feature titles and action descriptions help with coordination
3. **Update Status Regularly**: Keep action status current for accurate progress tracking
4. **Read Before Updating**: Use `ReadRoadmap` to get correct action numbers and current status
5. **Commit roadmap.json**: Include roadmap file in version control for team visibility

## Integration with TodoWrite

- **Roadmap**: Strategic, project-wide planning (multi-session)
- **TodoWrite**: Tactical, session-specific tasks (single-session)

Use both together:

1. Plan strategic work with Roadmap tools
2. Execute tactical work with TodoWrite
3. Update strategic progress with UpdateRoadmap
4. Repeat for continuous development

## Troubleshooting

### "Roadmap already exists"

The plugin prevents overwriting existing roadmaps. Archive the current `roadmap.json` file manually before creating a new one.

### "Invalid action number"

Action numbers must follow the format "X.YY" where X is the feature number and YY is a two-digit action number (e.g., "1.01", "1.02").

### "Invalid status transition"

Status must follow the progression: pending → in_progress → completed. You cannot move backward or skip states.

### File corruption

If `roadmap.json` becomes corrupted, the plugin will detect this and guide you to restore from version control or recreate the roadmap.

## Development

### Build & Development

```bash
# Build the plugin
npm run build

# Development mode with watch
npm run dev

# Type checking
tsc --noEmit

# Prepare for publishing
npm run prepublishOnly
```

### Repository Structure

```
roadmap/
├── src/
│   ├── index.ts              # Main plugin export
│   ├── types.ts              # TypeScript interfaces
│   ├── storage.ts            # File operations & validation
│   ├── tools/                # Tool implementations
│   │   ├── createroadmap.ts
│   │   ├── updateroadmap.ts
│   │   └── readroadmap.ts
│   └── descriptions/         # Tool descriptions
│       ├── createroadmap.txt
│       ├── updateroadmap.txt
│       └── readroadmap.txt
├── dist/                    # Built output (auto-generated)
├── package.json              # NPM configuration
├── tsconfig.json            # TypeScript config
├── README.md                # This file
└── AGENTS.md                # Development guidelines
```

### Git Integration

This plugin is part of the main OpenCode repository and is Git-ready:

```bash
# From the opencode root directory
git add roadmap/
git commit -m "feat: Add Roadmap plugin for strategic planning"

# Push to main repository
git push origin main
```

## Contributing

This plugin is part of the OpenCode project. Contributions welcome!

### Development Workflow

1. Fork the OpenCode repository: `https://github.com/sst/opencode`
2. Create a feature branch: `git checkout -b feature/roadmap-improvement`
3. Make changes in `/roadmap/` directory
4. Follow development guidelines in `AGENTS.md`
5. Test changes: `npm run build`
6. Commit changes: `git commit -m "feat: Add roadmap feature"`
7. Push to fork: `git push origin feature/roadmap-improvement`
8. Create Pull Request to `sst/opencode` main branch

### Code Standards

- Follow TypeScript strict mode with explicit types
- Use Zod for runtime validation
- Follow patterns in `AGENTS.md` development guidelines
- Maintain existing code style and naming conventions
- Include comprehensive error handling with examples
- Update documentation for new features

### Plugin Development

This plugin follows OpenCode plugin architecture:

```typescript
export const RoadmapPlugin: Plugin = async ({ project, directory, worktree, $ }) => {
  return {
    tool: {
      createroadmap: await createCreateRoadmapTool(directory),
      updateroadmap: await createUpdateRoadmapTool(directory),
      readroadmap: await createReadRoadmapTool(directory),
    },
  }
}
```

### Resources

- **OpenCode Project**: [github.com/sst/opencode](https://github.com/sst/opencode)
- **Plugin Development**: [OpenCode Plugin Documentation](https://opencode.ai/docs/plugins)
- **General Issues**: Use GitHub Issues for OpenCode core issues only

## License

MIT License - see OpenCode project license for details.
