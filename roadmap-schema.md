# Roadmap Schema Design

## Core Concept
A roadmap is a collection of **ordered features** where each feature has **actions**. Agents work on one feature at a time.

## JSON Schema

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

## Agent Workflow

### Orchestrator Agent
```
"Create a roadmap for a React dashboard project"
→ calls CreateRoadmap with all features
```

### Subagent
```
"Show me feature 2"
→ calls ReadRoadmap(featureNumber: 2) → gets feature 2 description + actions

"I completed the first action"
→ calls UpdateRoadmap to update action status to "completed"
```

## Key Properties

1. **Numbered Features**: Easy to reference (feature 1, feature 2, etc.)
2. **Simple Structure**: Just what agents need - no extra metadata
3. **Single Sentence Instructions**: Clear, actionable items
4. **Status Tracking**: Same as TodoWrite (pending/in_progress/completed)
