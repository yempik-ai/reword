# Security

reword writes files in your repository and can start a coding agent. It is
designed to exist only in a development server on your own machine. The
contract it keeps is in the [README](README.md#safety).

## Reporting a problem

If you find a way to reach the reword API from another site, from another
machine, or in a production build, or a way to make a save change anything
other than the value of one existing string, please report it privately:

- open a [private security advisory](https://github.com/yempik-ai/reword/security/advisories/new) on this repository.

Please do not open a public issue for it. You will get an answer within a few
days.

## What is in scope

- The request guard (`src/reword/guard.ts`).
- The route gate (`src/reword/next.ts`) and the build-time mount (`src/reword/Mount.tsx`).
- The save (`src/reword/workspace.ts`, `src/reword/literals.ts`).
- The handoff (`src/reword/agents.ts`).

## What is not

A custom `agent` command in your own `reword.config.ts` runs with the
permissions you give it. Choosing those permissions is yours.
