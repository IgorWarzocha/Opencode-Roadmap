# Roadmap Plugin: Multi-Agent Strategic Planning & Coordination

## TL;DR

Create a distributable **OpenCode plugin** that provides `CreateRoadmap`, `UpdateRoadmap`, and `ReadRoadmap` tools for multi-agent project coordination. Unlike the existing `TodoWrite` tool (session-specific, tactical tasks), the Roadmap plugin provides project-wide, strategic planning with ordered features and subtasks for multi-session work coordination using strict immutable numbering and append-only operations.

## 1. Problem Statement

### Current Limitations
- **Session Isolation**: TodoWrite tool is session-specific, preventing cross-agent task coordination
- **Flat Task Structure**: No support for hierarchical task relationships or dependencies
- **No Multi-Agent Coordination**: Main agents cannot assign tasks to or track progress of subagents
- **Strategic Planning Gap**: No tool for long-term project planning beyond immediate session tasks

### User Impact
- Main agents struggle to coordinate complex multi-agent projects
- Subagents lack visibility into project-wide context and objectives
- No mechanism for tracking progress across multiple sessions
- Difficult to hand off work between agents or maintain project continuity

## 2. Solution Overview

### Core Concept
The **Roadmap Plugin** is a distributable OpenCode plugin that adds `CreateRoadmap`, `UpdateRoadmap`, and `ReadRoadmap` tools, providing project-level strategic planning and multi-agent coordination capabilities that complement the existing TodoWrite functionality using strict immutable numbering and append-only mutation rules.

### Plugin Architecture Benefits

- ✅ **No Core Modifications**: Works with existing OpenCode installations
- ✅ **Optional Installation**: Users choose to install or not
- ✅ **Independent Updates**: Plugin can be updated separately from OpenCode
- ✅ **NPM Distribution**: Install via `npm install -g opencode-roadmap-plugin`
- ✅ **Cross-Project**: Single plugin works across multiple projects
- ✅ **Community Extensible**: Others can contribute features

### Key Differentiators from TodoWrite

| **Aspect** | **TodoWrite** | **Roadmap Plugin** |
|------------|---------------|-------------------|
| **Scope** | Session-specific | Project-wide/Cross-session |
| **Granularity** | Immediate tasks | Strategic milestones |
| **Hierarchy** | Flat list | Hierarchical (features → tasks) |
| **Duration** | Short-term (current session) | Long-term (multi-session) |
| **Collaboration** | Individual | Multi-agent coordination |
| **Numbering** | Simple sequence | String-based immutable IDs |
| **Installation** | Built into OpenCode | Plugin via NPM |
| **Storage** | `["todo", sessionID]` | Local JSON file (./roadmap.json) |

## 3. Technical Specifications

### 3.1 Roadmap Schema with String-Based Numbering

```json
{
  "features": [
    {
      "number": "1",
      "title": "User Authentication",
      "description": "Login and registration system",
      "actions": [
        {
          "number": "1.01",
          "description": "Create login form with email/password fields",
          "status": "completed"
        },
        {
          "number": "1.02",
          "description": "Implement JWT token handling",
          "status": "in_progress"
        },
        {
          "number": "1.03",
          "description": "Add user registration form",
          "status": "pending"
        }
      ]
    },
    {
      "number": "2",
      "title": "Dashboard Layout",
      "description": "Main dashboard structure",
      "actions": [
        {
          "number": "2.01",
          "description": "Build responsive grid layout",
          "status": "pending"
        },
        {
          "number": "2.02",
          "description": "Create sidebar navigation",
          "status": "pending"
        }
      ]
    }
  ]
}
```

**Key Properties:**
- **String-Based Numbering**: All numbers stored as strings (`"1"`, `"1.01"`, `"1.02"`)
- **Canonical IDs**: Feature and action numbers never change after creation
- **Two-Decimal Action Format**: Actions use `"1.01"`, `"1.02"`, `"1.03"` format
- **Immutable Features**: Feature fields cannot be modified after creation
- **Append-Only Creation**: New features and actions can only be added to the end
- **Rigid Action Order**: Action order within features cannot be changed

### 3.2 Strict Field Definitions

#### Feature Fields (Immutable After Creation)
```typescript
interface Feature {
  number: string      // "1", "2", "3" - canonical ID, never changes
  title: string       // Feature title
  description: string // Brief description of what this feature accomplishes
  actions: Action[]   // Array of actions for this feature
}
```

#### Action Fields
```typescript
interface Action {
  number: string           // "1.01", "1.02", "2.01" - canonical ID, never changes
  description: string      // Action description - MUTABLE (overwrite only)
  status: "pending" | "in_progress" | "completed" // MUTABLE
}
```

### 3.3 Plugin Tool API Design

#### CreateRoadmap Tool (Append-Only Creation)
```typescript
createroadmap: tool({
  description: "Create a new project roadmap with ordered features and actions. Use this to initialize project planning. This is the ONLY tool that can add features or actions. Supports append-only additions: new features (e.g., '4') and new actions (e.g., '2.04'). Actions are numbered with two decimals: '1.01', '1.02', '2.01', '2.02', etc.",

  args: {
    features: tool.schema.array(tool.schema.object({
      number: tool.schema.string().describe("Feature number as string (\"1\", \"2\", \"3...\")"),
      title: tool.schema.string().describe("Feature title"),
      description: tool.schema.string().describe("Brief description of what this feature accomplishes"),
      actions: tool.schema.array(tool.schema.object({
        number: tool.schema.string().describe("Action number as string with two decimals (\"1.01\", \"1.02\", etc.)"),
        description: tool.schema.string().describe("Action description"),
        status: tool.schema.enum(["pending"]).describe("Initial action status (must be \"pending\")")
      })).describe("List of actions for this feature in order")
    })).describe("Array of features for the roadmap")
  }
})
```

#### UpdateRoadmap Tool (Action-Only Modification)
```typescript
updateroadmap: tool({
  description: "Update action description or status in the roadmap. Can ONLY modify actions, never features. Allowed changes: action status (pending → in_progress → completed) and action description (full overwrite). Cannot add actions, modify features, or change numbers.",

  args: {
    actionNumber: tool.schema.string().describe("Action number to update (\"1.01\", \"1.02\", \"2.01\", etc.) - required"),
    description: tool.schema.string().optional().describe("New action description (full overwrite). If not provided, only status is updated."),
    status: tool.schema.enum(["pending", "in_progress", "completed"]).describe("New action status - required")
  }
})
```

#### ReadRoadmap Tool (Read-Only Access)
```typescript
readroadmap: tool({
  description: "Read project roadmap and see current status of features and actions. Use this to understand project context and track progress. No side effects.",

  args: {
    actionNumber: tool.schema.string().optional().describe("Specific action to read (\"1.01\", \"1.02\", etc.). If not provided, reads entire roadmap."),
    featureNumber: tool.schema.string().optional().describe("Specific feature to read (\"1\", \"2\", etc.). Use only if not providing actionNumber.")
  }
})
```

### 3.4 KISS Cross-Session Coordination

The plugin handles all data persistence internally using a simple local storage approach.

- **No complex event system needed** - agents use tool calls to get current status
- **ReadRoadmap always shows the latest status** across all sessions
- **Changes are immediately visible** to all agents in the project
- **Plugin abstracts away all storage details** - agents only interact with tools

## 4. Mutation Rules and Constraints

### 4.1 CreateRoadmap Constraints
- **Append-Only Operations**: Can only add new features and tasks to the end
- **No Modifications**: Cannot modify existing features or tasks
- **Sequential Numbering**: Must follow proper numbering sequence
- **Initial Status**: All tasks must start with "pending" status
- **Single Creation**: Cannot be called if roadmap already exists

### 4.2 UpdateRoadmap Constraints
- **Task-Only Modification**: Can only modify tasks, never features
- **Limited Fields**: Only task `description` and `status` can be changed
- **No Number Changes**: Task numbers cannot be modified
- **No Reordering**: Task order within features cannot be changed
- **Status Progression**: Status follows pending → in_progress → completed flow

### 4.3 ReadRoadmap Constraints
- **Read-Only**: No side effects or modifications
- **Flexible Access**: Can read entire roadmap, specific feature, or specific task
- **Current State**: Always returns the latest status

### 4.4 Strict Limitations

The following are explicitly NOT supported:
- No assignees or owner fields
- No notes or comments system
- No history or audit trail
- No agent metadata
- No dependency graph between tasks
- No tagging system
- No automatic reordering
- No task deletion or removal
- No feature modification after creation
- No task number changes

## 5. User Experience & Agent Workflows

### 5.1 Auto-Registration Plugin Experience

#### NPM Installation
```bash
# Install the roadmap plugin - tools auto-register on install
npm install -g opencode-roadmap-plugin

# No additional configuration required
# CreateRoadmap, UpdateRoadmap, and ReadRoadmap are immediately available
```

#### Local Development
```bash
# Clone and install locally
git clone https://github.com/your-org/opencode-roadmap-plugin
cd opencode-roadmap-plugin
npm install
npm run build

# Add to local config
{
  "plugin": ["file://./path/to/opencode-roadmap-plugin"]
}
```

### 5.2 Agent Mental Model

```
Main Agent Workflow:
├── Creates project roadmap with CreateRoadmap (initial setup only)
├── Defines strategic features and tasks with proper numbering
├── Assigns tasks to subagents by updating task status to "in_progress"
├── Monitors progress with ReadRoadmap
└── Updates task status to "completed" as work is finished

Subagent Workflow:
├── Reads project context with ReadRoadmap
├── Creates session-specific todos with TodoWrite for tactical work
├── Completes assigned tactical work
├── Updates task status with UpdateRoadmap (status and/or description)
└── Checks overall progress with ReadRoadmap
```

### 5.3 When to Use Roadmap Tools vs TodoWrite

**Use CreateRoadmap for:**
- Initial project setup with features and tasks
- Adding new features at the end (append-only)
- Adding new tasks to existing features (append-only)

**Use UpdateRoadmap for:**
- Updating task status (pending → in_progress → completed)
- Modifying task descriptions (full overwrite only)
- Marking work as completed

**Use ReadRoadmap for:**
- Understanding project context and assignments
- Checking task status and progress
- Seeing what other agents are working on
- Getting overall project health

**Use TodoWrite for:**
- Immediate session tasks
- Short-term tactical work
- Single-agent workflows
- Implementation details within assigned roadmap tasks

### 5.4 Plugin Hook Integration

**No external tool integration** - The plugin operates independently and does not integrate with TodoWrite or other OpenCode tools. Agents manually manage both TodoWrite tasks and roadmap updates as needed.

## 6. Plugin Implementation Structure

### 6.1 Package Structure
```
opencode-roadmap-plugin/
├── package.json
├── README.md
├── src/
│   ├── index.ts          # Main plugin export
│   ├── tools/
│   │   ├── createroadmap.ts    # CreateRoadmap tool logic
│   │   ├── updateroadmap.ts    # UpdateRoadmap tool logic
│   │   └── readroadmap.ts      # ReadRoadmap tool logic
│   ├── descriptions/
│   │   ├── createroadmap.txt  # CreateRoadmap tool description
│   │   ├── updateroadmap.txt  # UpdateRoadmap tool description
│   │   └── readroadmap.txt      # ReadRoadmap tool description
│   ├── storage.ts        # Roadmap data persistence
│   └── types.ts          # TypeScript definitions
└── dist/
```

### 6.2 Tool Description Pattern

Following OpenCode's architecture, each tool will have:
- **TypeScript file** (`tools/createroadmap.ts`) - Contains the tool logic and implementation
- **Text description file** (`descriptions/createroadmap.txt`) - Contains the detailed tool description for LLMs

This separation allows for:
- Clear separation of logic and documentation
- Detailed, rich descriptions without cluttering the code
- Easy maintenance and updates of tool descriptions
- Consistent pattern with OpenCode's existing tools

### 6.3 Plugin Main Export
```typescript
// src/index.ts
import { tool } from "@opencode-ai/plugin"
import { createCreateRoadmapTool } from "./tools/createroadmap"
import { createUpdateRoadmapTool } from "./tools/updateroadmap"
import { createReadRoadmapTool } from "./tools/readroadmap"

export const RoadmapPlugin: Plugin = async ({ project, directory, worktree, $ }) => {
  return {
    // Register custom roadmap tools
    tool: {
      createroadmap: createCreateRoadmapTool(project),
      updateroadmap: createUpdateRoadmapTool(project),
      readroadmap: createReadRoadmapTool(project),
    }
  }
}

export default RoadmapPlugin
```

### 6.4 Tool Implementation Example

```typescript
// src/tools/createroadmap.ts
import DESCRIPTION from "../descriptions/createroadmap.txt"
import { Tool } from "@opencode-ai/plugin"

export function createCreateRoadmapTool(project: any) {
  return Tool.define("createroadmap", {
    description: DESCRIPTION,
    parameters: z.object({
      features: z.array(z.object({
        number: z.string().describe("Feature number as string (\"1\", \"2\", \"3...\")"),
        title: z.string().describe("Feature title"),
        description: z.string().describe("Brief description of what this feature accomplishes"),
        tasks: z.array(z.object({
          number: z.string().describe("Task number as string with two decimals (\"1.01\", \"1.02\", etc.)"),
          description: z.string().describe("Task description"),
          status: z.enum(["pending"]).describe("Initial task status (must be \"pending\")")
        })).describe("List of tasks for this feature in order")
      })).describe("Array of features for the roadmap")
    }),
    async execute(params, opts) {
      // Implementation logic with append-only validation
    }
  })
}
```

### 6.5 Package Configuration
```json
{
  "name": "opencode-roadmap-plugin",
  "version": "1.0.0",
  "description": "Strategic roadmap planning and multi-agent coordination for OpenCode",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["opencode", "plugin", "roadmap", "planning", "multi-agent"],
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "zod": "^3.22.0"
  },
  "opencode": {
    "type": "plugin",
    "tools": ["createroadmap", "updaterroadmap", "readroadmap"]
  }
}
```

## 7. Plugin Implementation Plan

### Phase 1: Core Plugin (MVP)
- [ ] Set up basic plugin structure and package.json
- [ ] Implement CreateRoadmap tool with JSON file persistence and append-only validation
- [ ] Implement UpdateRoadmap tool with task-only modification constraints
- [ ] Implement ReadRoadmap tool with flexible access patterns
- [ ] Add local JSON file storage (./roadmap.json)

### Phase 2: Error Handling & Validation
- [ ] Implement atomic file writes to prevent corruption
- [ ] Add bulletproof JSON parsing and validation
- [ ] Implement error handling for invalid feature/task numbers
- [ ] Add strict mutation rule enforcement
- [ ] Create tutorial-style error messages for schema validation

### Phase 3: User Experience Polish
- [ ] Add comprehensive status validation
- [ ] Implement numbering sequence validation
- [ ] Add roadmap summary and progress metrics
- [ ] Create helpful tool descriptions for agents
- [ ] Implement concurrent update conflict detection

### Phase 4: Distribution & Documentation
- [ ] Publish to npm package registry
- [ ] Create installation and usage documentation
- [ ] Add example roadmap templates
- [ ] Test across different OpenCode versions
- [ ] Community contribution guidelines

## 8. Error Handling Strategy

### Error Messages & Scenarios

**Critical Errors (Must Handle):**
- **No roadmap exists**: Return "No roadmap exists. Use CreateRoadmap to create one."
- **Invalid feature number**: Return "Invalid feature number X. Feature numbers must be strings like '1', '2', '3'."
- **Invalid task number**: Return "Invalid task number X.Y. Task numbers must be strings like '1.01', '1.02', '2.01'. Use ReadRoadmap to see valid numbers."
- **JSON corruption**: Handled internally by bulletproof JSON parsing

**Business Logic Errors:**
- **CreateRoadmap on existing roadmap**: Return "Roadmap already exists. Ask the user to archive the current roadmap manually. Do not remove yourself."
- **Empty roadmap or no tasks**: Return schema example with tutorial: "Roadmap must have at least one feature with at least one task. Example: {schema example}"
- **Invalid schema**: Return correct schema example as "small tutorial" for the LLM
- **CreateRoadmap trying to modify existing**: Return "CreateRoadmap can only create new roadmaps. Use UpdateRoadmap to modify existing tasks."
- **UpdateRoadmap trying to modify feature**: Return "UpdateRoadmap can only modify tasks, not features. Features are immutable after creation."
- **Invalid task numbering**: Return "Task numbers must follow two-decimal format: '1.01', '1.02', '1.03', etc."

**Technical Errors (Handled Internally):**
- **Concurrent file access**: Handled by atomic file writes (write to temp, then rename)
- **Invalid JSON**: Bulletproof JSON parsing with clear error handling
- **Permission errors**: Not expected to occur, but basic error handling included

### Technical Risks & Mitigations

- **Plugin Compatibility**: Version compatibility testing
- **Plugin Conflicts**: Graceful error handling
- **File System**: Atomic file writes prevent corruption
- **Mutation Rule Violations**: Strict validation in all tools

### User Experience Risks
- **Installation Friction**: Users may not want to install external plugins
- **Tool Confusion**: Clear "Roadmap" naming to distinguish from TodoWrite
- **Agent Adoption**: Clear workflow examples and documentation

**Mitigations**: One-click installation, intuitive defaults, strict validation

### Distribution Risks
- **NPM Maintenance**: Long-term plugin maintenance and updates
- **Community Support**: Need for issue tracking and support
- **OpenCode Updates**: Core changes might break plugin compatibility

**Mitigations**: Automated testing, contribution guidelines, version compatibility testing

## 9. Plugin Open Questions & Discussion Points

1. **Naming Strategy**: Is "Roadmap" distinctive enough from existing planning tools?
2. **Plugin Scope**: Should the plugin handle other project management features?
3. **Storage Strategy**: Should we use SDK storage or local JSON file for persistence?
4. **Template System**: Should we include roadmap templates for common project types?
5. **Integration Depth**: How deeply should the plugin integrate with existing OpenCode tools?

## 10. Next Steps

1. **Validate Plugin Approach**: Confirm this is better than core OpenCode modifications
2. **Create Plugin Repository**: Set up GitHub repo with basic structure
3. **Implement MVP**: Build basic CreateRoadmap/UpdateRoadmap/ReadRoadmap tools with strict constraints
4. **Test Mutation Rules**: Verify append-only and task-only modification constraints work correctly
5. **Beta Testing**: Release to early adopters for feedback
6. **NPM Publishing**: Make plugin publicly available

---

*This PRD outlines a distributable Roadmap Plugin for OpenCode that enables multi-agent strategic planning without requiring core source code modifications. The plugin uses strict immutable numbering, append-only operations, and task-only modification rules to ensure data integrity and LLM safety.*