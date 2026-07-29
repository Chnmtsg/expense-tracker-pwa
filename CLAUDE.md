# Expense Tracker

## Purpose

This repository contains a modern personal finance application.

The goal is long-term maintainability, reliability, and clean architecture.

Never sacrifice maintainability for short-term speed.

---

# Repository Layout

All paths in this file are relative to the repository root.

- expense-pwa/ — the application

- knowledge/ — project references

- .claude/agents/ — review role definitions

- .claude/commands/ — workflow definitions

- reports/ — generated review reports

---

# Development Philosophy

Always think before coding.

Prefer analysis before implementation.

Never modify unrelated files.

Never introduce unnecessary complexity.

Always preserve backward compatibility.

---

# Workflow

Every significant change should follow this order.

1. Review UI

2. Review Code

3. Prioritize Work

4. Make Engineering Decision

5. Implement

6. Review Again

---

# Knowledge

Always use these project references.

- knowledge/project.md

- knowledge/coding-standards.md

- knowledge/ui-guidelines.md

- knowledge/review-conventions.md

---

# Review Roles

When reviewing software use the following responsibilities.

Each role is a subagent. Invoke it by name.

Every review role follows the shared output contract in knowledge/review-conventions.md.

UI Review

ui-review

Code Review

code-review

Engineering Manager

engineering-manager

Chief Architect

chief-architect

---

# Review Workflow

Run the full review with /review.

The workflow is defined in .claude/commands/review.md.

Run the roles in that order.

Never skip a role.

---

# General Rules

Always explain major architectural decisions.

Always recommend the smallest safe implementation.

Never implement multiple unrelated features in one task.

Always keep the application production ready.