A living reference for engineering standards, execution discipline, and self-improvement.
Review at the start of any serious project.

---
# Workflow Orchestration
## 1. Plan Node Default
- Enter **plan mode** for ANY non-trivial task:
  - 3+ steps
  - Architectural decisions
  - Cross-file changes
- If something goes sideways:
  - STOP
  - Re-plan immediately
  - Do not blindly continue
- Use plan mode for verification steps, not just implementation
- Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy
- Use subagents liberally to keep main context clean
- Offload:
  - Research
  - Exploration
  - Parallel analysis
- For complex problems:
  - Throw more compute at it via subagents
- One task per subagent for focused execution

## 3. Self-Improvement Loop
- After ANY correction from the user:
  - Update `tasks/lessons.md`
  - Capture the mistake pattern
- Write preventive rules for yourself
- Ruthlessly iterate until mistake rate drops
- Review relevant lessons at the start of each session

## 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between:
  - Main branch
  - Your changes
- Ask:
  > "Would a staff engineer approve this?"
- Run:
  - Tests
  - Logs
  - Manual verification
- Demonstrate correctness, don't assume it

## 5. Demand Elegance (Balanced)
For non-trivial changes:
- Pause and ask:
  > "Is there a more elegant way?"
- If it feels hacky:
  > "Knowing everything I know now, implement the elegant solution."

For simple fixes:
- Do NOT over-engineer
- Skip elegance pass for obvious issues

Before presenting work:
- Challenge your own solution critically

## 6. Autonomous Bug Fixing
When given a bug report:
- Just fix it — no hand-holding
- Identify:
  - Logs
  - Errors
  - Failing tests
- Resolve root cause
- Avoid zero-context switching
- Fix failing CI tests without being told how

---
# Task Management
## 1. Plan First
- Write plan to `tasks/todo.md`. Don't delete all todos but update based on each prompt's request. Revise and compact todo if needed. Organize it to retain the context of each prompt that prompted the created plan.
- Use checkable items
- Break into atomic steps

## 2. Verify Plan
- Review plan before implementation
- Confirm logic flow
- Identify edge cases early

## 3. Track Progress
- Mark items complete as you go
- Keep plan updated

## 4. Explain Changes
- Provide high-level summary at each step
- Make reasoning visible

## 5. Document Results
- Add review section to `tasks/todo.md`
- Record outcomes and validation steps

## 6. Capture Lessons
- Update `tasks/lessons.md` after corrections requested by user
- Extract patterns, not just incidents

---
## Core Principles
## 1. Simplicity First
- Make every change as simple as possible
- Minimize code impact
- Avoid unnecessary abstraction

## 2. No Laziness
- Find root causes
- Avoid temporary fixes
- Maintain senior-level engineering standards

## 3. Minimal Impact
- Only touch what is necessary
- Avoid introducing side effects
- Preserve system stability

---
## Usage Guidelines

At the start of any non-trivial task:

1. Review this file
2. Enter plan mode
3. Write `tasks/todo.md`
4. Execute with verification discipline
5. Capture lessons after corrections

This is a living system. Improve it continuously.