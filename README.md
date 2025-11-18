# Roadmap Plugin for OpenCode

Strategic roadmap planning and multi-agent coordination plugin. Provides project-wide planning capabilities with immutable history and auto-archiving.

## 🚀 Installation

1. Copy the plugin source to your project:
   ```bash
   mkdir -p .opencode/plugin/roadmap
   cp -r /path/to/roadmap-repo/* .opencode/plugin/roadmap/
   ```

2. Add to `opencode.json` in your project root:
   ```json
   {
     "plugin": ["./.opencode/plugin/roadmap"]
   }
   ```

3. Restart OpenCode. The tools `createroadmap`, `readroadmap`, and `updateroadmap` will be available.

## 🛠️ Usage

### 1. Create or Append
Initialize a project roadmap or add new features to an existing one.

```bash
# Create new
opencode run "create a roadmap with feature 'Auth' and actions 'DB Init', 'Login API'"

# Append later
opencode run "add feature 'Dashboard' with actions 'Layout', 'Widgets' to the roadmap"
```

### 2. Update & Track
Mark actions as complete. The tool provides context on what's next.

```bash
opencode run "mark action 1.01 as completed"
# Output: "Updated... Feature Progress: 1/2. Next action: 1.02..."
```

### 3. Auto-Archive
When the last action is completed, the roadmap is automatically archived to `roadmap.archive.<timestamp>.json`, ready for a fresh start.

## 🧩 Key Concepts

- **Append-Only**: You can add new features, but cannot modify the structure of existing ones.
- **Immutable IDs**: Feature (`1`) and Action (`1.01`) IDs never change.
- **Strict Flow**: Status moves forward only: `pending` → `in_progress` → `completed`.
- **Action Actions**: Use "Actions" (not tasks) for sub-items.

## 📦 Development

```bash
npm run build   # Build plugin
npm run dev     # Watch mode
```

See `AGENTS.md` for contribution guidelines.
