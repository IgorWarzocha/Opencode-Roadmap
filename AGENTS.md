# OpenCode Roadmap Plugin - Development Guidelines

## Commands

```bash
# Build
npm run build

# Development mode
npm run dev

# Type checking
tsc --noEmit

# Prepare for publish
npm run prepublishOnly
```

## Code Style

### Imports

- Use type imports: `import type { Plugin } from "@opencode-ai/plugin"`
- Group external libs first, then internal modules
- Use relative imports from package root: `./tools/createroadmap`
- Avoid deep relative paths with `../`

### TypeScript

- Strict mode enabled with explicit types
- Use Zod for runtime validation and schemas
- Prefer explicit return types for public functions
- Use `any` sparingly - prefer proper typing
- Leverage type inference for internal functions

### Naming Conventions

- **Files**: kebab-case (`createroadmap.ts`, `updateroadmap.ts`)
- **Functions**: camelCase (`createCreateRoadmapTool`, `validateFeatureNumber`)
- **Types**: PascalCase (`RoadmapPlugin`, `CreateRoadmapInput`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`, `MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`ToolContext`, `ValidationResult`)

### Error Handling

- Provide clear, actionable error messages with examples
- Never expose file paths in errors to users
- Use proper validation with helpful examples
- Include tutorial-style guidance for common errors
- Graceful degradation for non-critical failures
- Use specific error messages for validation failures

### Code Organization

- Keep functions focused and single-purpose
- Use descriptive variable names
- Add JSDoc comments for complex logic
- Follow consistent indentation and formatting

## Plugin Development Pattern

### Tool Structure

```typescript
export async function createToolName(directory: string): Promise<ToolDefinition> {
  const description = await loadDescription("toolname.txt")

  return tool({
    description,
    args: {
      // Use tool.schema for validation
      param: tool.schema.string().describe("Parameter description"),
    },
    async execute(args: any) {
      const storage = new FileStorage(directory)
      // Implementation with proper error handling
    },
  })
}
```

### Validation Pattern

- Use Zod schemas for all input validation
- Provide clear error messages with examples
- Validate business rules and sequences
- Handle malformed input gracefully
- Return structured error information

### File Operations

- Use atomic writes (temp file → rename)
- Handle concurrent access gracefully
- Provide bulletproof JSON parsing
- Include proper cleanup on errors
- Use string-based IDs for immutability

## File Organization

```
src/
├── index.ts          # Main plugin export
├── types.ts          # Type definitions and interfaces
├── storage.ts        # File persistence and validation
├── tools/            # Tool implementations
│   ├── createroadmap.ts
│   ├── updateroadmap.ts
│   └── readroadmap.ts
└── descriptions/     # Tool descriptions (.txt files)
    ├── createroadmap.txt
    ├── updateroadmap.txt
    └── readroadmap.txt
```

## Development Workflow

### Before Making Changes

1. Read existing code to understand patterns
2. Check for similar implementations to reuse
3. Consider impact on other parts of system
4. Plan changes with minimal surface area

### Making Changes

1. Follow existing code patterns and conventions
2. Use proper TypeScript typing throughout
3. Include comprehensive error handling
4. Test validation logic thoroughly
5. Ensure build passes: `npm run build`

### Code Review Principles

- Maintain backward compatibility
- Follow existing patterns and conventions
- Validate error handling and edge cases
- Check for security implications
- Verify performance impact

## Security Considerations

- Never expose file paths in error messages
- Validate all user inputs thoroughly
- Use secure defaults for configurations
- Handle path traversal attempts
- Sanitize data before persistence

## Performance Guidelines

- Minimize file I/O operations
- Use efficient data structures
- Cache expensive operations when appropriate
- Consider memory usage for large datasets

## Testing Approach

- Test all validation functions with edge cases
- Mock external dependencies (file system, network)
- Test error conditions and success paths
- Use descriptive test names
- Validate tool registration and execution

## Common Patterns

### Error Message Format

```typescript
if (!args.features || args.features.length === 0) {
  throw new Error(
    'Roadmap must have at least one feature with at least one action. Example: {"features": [{"number": "1", "title": "Feature 1", "description": "Description", "actions": [{"number": "1.01", "description": "Action 1", "status": "pending"}]}]}',
  )
}
```

### Storage Usage

```typescript
const storage = new FileStorage(directory)
if (await storage.exists()) {
  throw new Error("Resource already exists. Ask user to resolve manually.")
}
await storage.write(data)
```

### Validation Pattern

```typescript
const validationErrors = Validator.validate(data)
if (validationErrors.length > 0) {
  const errorMessages = validationErrors.map((err) => err.message).join("\n")
  throw new Error(`Validation errors:\n${errorMessages}\n\nPlease fix these issues and try again.`)
}
```

Follow these guidelines to ensure high-quality, maintainable code that integrates well with the OpenCode plugin ecosystem.

## Code Style

### Imports

- Use type imports: `import type { Plugin } from "@opencode-ai/plugin"`
- Group external libs first, then internal modules
- Use relative imports from package root: `./tools/createroadmap`

### TypeScript

- Strict mode enabled
- Use Zod for runtime validation
- Prefer explicit return types for public functions
- Use `any` sparingly

### Naming

- Files: kebab-case (`createroadmap.ts`)
- Functions: camelCase (`createCreateRoadmapTool`)
- Types: PascalCase (`RoadmapPlugin`)
- Constants: UPPER_SNAKE_CASE

### Error Handling

- Provide clear, actionable error messages
- Never expose file paths in errors
- Use proper validation with helpful examples
- Graceful degradation for failures

## Plugin Pattern

```typescript
export async function createToolName(directory: string): Promise<ToolDefinition> {
  const description = await loadDescription("toolname.txt")
  return tool({
    description,
    args: {
      /* Zod schema */
    },
    async execute(args: any) {
      const storage = new FileStorage(directory)
      // Implementation
    },
  })
}
```

## File Organization

```
src/
├── index.ts          # Main plugin export
├── types.ts          # Type definitions
├── storage.ts        # File persistence
├── tools/            # Tool implementations
└── descriptions/     # Tool descriptions (.txt files)
```
