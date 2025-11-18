# Roadmap Plugin for OpenCode

Strategic roadmap planning and multi-agent coordination plugin for OpenCode. Provides project-wide planning capabilities that complement the session-specific TodoWrite tool.

## 🚀 Quick Start (Manual Installation)

> **⚠️ Important**: Until this plugin is properly packaged, you need to manually install it by copying files into your project. Follow these instructions **exactly** to avoid breaking your project.

### Step 1: Copy Plugin Files

Copy the **entire plugin source** to your project's `.opencode` directory:

```bash
# From THIS repository (the plugin source)
# TO your target project directory

# Copy the plugin source files
cp -r /path/to/this/repo/src /path/to/your/project/.opencode/plugin/roadmap

# Copy required config files
cp /path/to/this/repo/package.json /path/to/your/project/.opencode/plugin/roadmap/
cp /path/to/this/repo/tsconfig.json /path/to/your/project/.opencode/plugin/roadmap/
```

**What you're copying:**
- ✅ `src/` - All TypeScript source files (the actual plugin)
- ✅ `package.json` - Plugin dependencies and metadata  
- ✅ `tsconfig.json` - TypeScript configuration

### Step 2: Create OpenCode Configuration

In your **project root**, create `opencode.json`:

```json
{
  "plugin": [
    "./.opencode/plugin/roadmap"
  ]
}
```

**⚠️ Critical Notes:**
- The path `./.opencode/plugin/roadmap` is **relative to your project root**
- Use **forward slashes** even on Windows
- The path points to the **directory containing the plugin source**, not a specific file
- OpenCode will automatically build the TypeScript files when it starts
- Only copy the files shown above - don't copy `node_modules/` or `dist/` (they won't exist in the git repo)

### Step 3: Verify Installation

Run OpenCode in your project and test:

```bash
cd /path/to/your/project
opencode run "list available roadmap tools"
```

You should see the three roadmap tools: `createroadmap`, `readroadmap`, and `updateroadmap`.

### Step 4: Start Using

```bash
# Create a roadmap
opencode run "create a roadmap for my web app project"

# Append to it later
opencode run "add a new feature for user settings to the roadmap"

# Read roadmap status  
opencode run "show me the current roadmap"

# Update progress (Auto-archives when all done)
opencode run "mark action 1.01 as completed"
```

---

## About OpenCode Plugins

OpenCode plugins extend the AI coding agent with custom tools, hooks, and integrations. This plugin follows the OpenCode plugin architecture and provides three new tools for strategic project planning:

- **createroadmap** - Initialize project roadmaps with features and actions
- **readroadmap** - View roadmap status and progress
- **updateroadmap** - Update action status and descriptions

## Installation (Future Package)

When this plugin is properly packaged, installation will be:

```bash
npm install -g opencode-roadmap-plugin
```

Then add to your OpenCode configuration:

```json
{
  "plugin": ["opencode-roadmap-plugin"]
}
```

## Usage Examples

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
- New features and actions can be added to an existing roadmap using `createroadmap`
- Existing features and actions cannot be modified (except action status/description)
- Maintains roadmap integrity and prevents conflicts

### Auto-Archive
- When the last pending/in_progress action is marked as `completed`, the roadmap is automatically archived
- The file is renamed to `roadmap.archive.<timestamp>.json`
- You can immediately create a new roadmap for the next phase

## Multi-Agent Coordination

### Main Agent Workflow

1. Creates project roadmap with `CreateRoadmap` (initial setup only)
2. Defines strategic features and actions with proper numbering
3. Assigns actions to subagents by updating action status to "in_progress"
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
**Purpose**: Initialize project planning OR append new features/actions
**Usage**: Create new or extend existing
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
This error only occurs if you try to create a *new* roadmap structure that conflicts with the existing one without following append-only rules, or if the file is locked. However, `createroadmap` now supports appending, so you should simply add your new features to the input.

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
