# AGENTS.md — Engineering Guidelines

## 1. Core Engineering Principles

- Prioritize correctness, security, maintainability and simplicity.
- Respect the existing project architecture and conventions.
- Avoid unnecessary abstractions, dependencies and complexity.
- Do not duplicate existing functionality.
- Do not introduce unrelated changes.
- Prefer solutions that are easy to understand, test and maintain.
- Analyze existing code before proposing architectural changes.
- Never assume a dependency, function or configuration exists without verifying it.

## 2. Security and Sensitive Information

- NEVER read, open, display, print, copy, expose or disclose `.env` files.
- NEVER read files containing credentials, API keys, tokens, passwords, private keys or other secrets.
- NEVER use commands such as `cat`, `less`, `head`, `tail` or equivalent to inspect sensitive files.
- NEVER expose secrets in terminal output, logs, documentation, code, commits or responses.
- NEVER hardcode credentials or sensitive configuration.
- Use environment variable names and `.env.example` placeholders when configuration needs to be documented.
- Preserve existing `.gitignore` protections.
- Do not remove or weaken existing security restrictions.
- If a task requires secret configuration, ask the user to perform the sensitive operation manually.

## 3. Skill Discovery (Mandatory)

Before starting a task:

1. Check which skills are available in the environment.
2. Identify the skills relevant to the current task.
3. Read the complete `SKILL.md` instructions of each relevant skill.
4. Apply their guidelines throughout the workflow.
5. Avoid loading unrelated skills.
6. Never claim to have used a skill without actually loading it.
7. If a relevant skill is unavailable, report its absence and continue using established engineering practices.

### Skill Priorities

- **Superpowers:** specification, planning, TDD, debugging and systematic problem-solving.
- **Ponytail:** simplicity, maintainability and avoiding unnecessary complexity.
- **Impeccable:** frontend quality, interface refinement and design consistency.
- **Frontend Design:** visual direction, UI/UX and high-quality frontend implementation.
- **Security Skills:** authentication, authorization, input validation, backend security and vulnerability prevention.
- **Playwright:** browser automation and end-to-end testing.

These skills are selected according to the task. Do not load every skill unnecessarily.

## 4. Development Workflow

Follow this workflow for new features, significant changes and complex bug fixes.

For trivial tasks, use a proportionate workflow without unnecessary documentation.

### Phase 1 — SPEC (Specification)

Before implementation:

1. Understand the requested functionality.
2. Inspect the existing project architecture.
3. Identify relevant files, modules and dependencies.
4. Understand existing coding conventions.
5. Define functional requirements.
6. Define non-functional requirements.
7. Identify business rules and edge cases.
8. Define acceptance criteria.
9. Identify potential risks.
10. Define the testing strategy.

**Deliverable:** A clear, testable specification.

Do not implement anything during this phase.

### Phase 2 — PLAN (Technical Planning)

Based on the specification:

1. Define the implementation approach.
2. Identify files to create, modify or remove.
3. Define database changes and migrations when applicable.
4. Define API contracts and integrations when applicable.
5. Identify dependencies.
6. Break the implementation into small, ordered tasks.
7. Define unit, integration and E2E tests.
8. Identify potential regressions and technical risks.

**Deliverable:** An actionable implementation plan.

Do not begin implementation before the plan is approved when human approval is required.

### Phase 3 — IMPLEMENT (Test-Driven Development)

Follow the approved plan and use the TDD cycle:

#### RED — Write a failing test

- Write the test before implementing the functionality.
- Execute the test.
- Confirm that it fails for the expected reason.
- Ensure the test validates expected behavior rather than implementation details.

#### GREEN — Make the test pass

- Implement the minimum code necessary.
- Execute the test again.
- Confirm that it passes.
- Avoid implementing unrelated functionality.

#### REFACTOR — Improve the implementation

- Improve code structure and readability.
- Remove unnecessary complexity.
- Eliminate duplication.
- Preserve existing behavior.
- Execute relevant tests again.

Repeat this cycle for each implementation unit.

Never skip tests without explaining why TDD is impractical for the specific task.

### Phase 4 — VERIFY (Quality Assurance)

After implementation:

1. Run relevant unit tests.
2. Run integration tests when applicable.
3. Run E2E tests when applicable.
4. Use Playwright for browser-based testing when appropriate.
5. Run TypeScript checks when applicable.
6. Run linting and formatting checks when configured.
7. Verify database interactions and migrations when applicable.
8. Review security-sensitive operations.
9. Compare the implementation against the original specification.
10. Identify missing requirements and regressions.

Never claim a test passed without actually executing it.

## 5. Backend Engineering Standards

- Maintain clear separation of responsibilities.
- Validate all external input.
- Implement proper authentication and authorization.
- Never trust client-provided permissions or sensitive values.
- Handle errors consistently.
- Protect endpoints against abuse.
- Use secure password hashing.
- Avoid exposing internal errors and sensitive information.
- Use database transactions when operations require atomicity.
- Avoid unnecessary database queries.
- Follow existing API conventions.

## 6. Frontend Engineering Standards

- Prioritize usability, accessibility and responsiveness.
- Maintain consistent design systems and visual hierarchy.
- Reuse components when it improves maintainability.
- Avoid unnecessary component abstractions.
- Handle loading, error and empty states.
- Validate forms appropriately.
- Avoid exposing sensitive information in the client.
- Follow the existing design direction unless explicitly asked to change it.
- Use Impeccable and Frontend Design skills for relevant interface tasks.

## 7. Testing Standards

- Test expected behavior and business rules.
- Cover success and failure scenarios.
- Test edge cases.
- Test validation and error handling.
- Avoid tests that merely reproduce implementation details.
- Keep tests deterministic.
- Do not remove or weaken existing tests just to make the suite pass.
- Fix the underlying problem instead of hiding failures.

## 8. Documentation

- Document important architectural decisions.
- Update documentation when behavior or APIs change.
- Keep examples consistent with the actual implementation.
- Never include real credentials, tokens or secrets.
- Avoid unnecessary documentation for trivial changes.

## 9. Git and Change Management

- Inspect the current Git state before making changes.
- Preserve unrelated user modifications.
- Never overwrite or discard user changes without permission.
- Avoid destructive Git commands unless explicitly authorized.
- Do not commit secrets or sensitive files.
- Keep changes focused on the requested task.
- Never claim that changes were committed or pushed unless the operation actually succeeded.

## 10. Completion Report

When finishing a task, provide:

- Summary of what was implemented.
- Main files created or modified.
- Important technical decisions.
- Tests created and executed.
- Actual verification results.
- Remaining limitations or known issues.

A task is complete only when its acceptance criteria are satisfied and the relevant verification has been performed.

## 11. Final Rule

Think before coding.

Understand the project before changing it.

Specify before planning.

Plan before implementing.

Test before considering the implementation complete.

Verify before declaring the task finished.

Security and existing user changes must always be respected.
