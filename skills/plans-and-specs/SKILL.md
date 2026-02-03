---
name: plans-and-specs
description: |-
  This SKILL provides detailed instructions on how to use the planning plugin tools. MUST be loaded when:

  Situations:
  - User asks to create a plan, roadmap, or break down work into steps
  - User mentions specs, requirements, or standards that need to be documented
  - User references an existing plan that needs to be read or updated
  - User asks to mark work as complete or done
  - User wants to link requirements to a plan
  - User references a task that matches <available_plans>
---

# Plans and Specs

<objective>
Plans are actionable work breakdowns stored as markdown with frontmatter. Specs are reusable requirements/documents. Plans link to specs via appendSpec. readPlan expands linked specs inline.
</objective>

<rules>
After createPlan: MUST call appendSpec for each REPO scope spec (sequential), then ask about FEATURE specs.
Before major work: MUST use readPlan to get plan + all linked specs.
appendSpec: MUST be sequential calls, never batch/parallel.
Specs MUST exist before appendSpec.
markPlanDone: MUST ensure plan fully completed first.
</rules>

<procedure>

## Planning Workflow

1. Check if plan already exists - if exact match, execute instead of creating
2. createPlan with name, idea, description (3-5 words), steps (min 5)
3. For each REPO spec returned: appendSpec(planName, specName) - sequential
4. Ask user: "Want a FEATURE spec for this plan?"
5. If yes: createSpec, then appendSpec
6. Before work: readPlan to get full context

## Spec Creation

createSpec with name, scope (repo/feature), reusable content.

## Completion

markPlanDone only after all work verified complete.

</procedure>

<errors>

Invalid name: Use [A-Za-z0-9-], max 3 words.
Description error: 3-5 words, not overlapping name.
Steps error: Need min 5 specific steps.
Already exists: Use different name.
Spec not found: Create spec first.
Concurrent updates: appendSpec must be sequential.

</errors>
