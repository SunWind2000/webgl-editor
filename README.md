# webgl-editor

Vite + TypeScript + Vue 3 monorepo scaffold managed with pnpm workspaces.

## Workspace layout

- `packages/*`: shared packages that can be built and published independently.
- `apps/*`: deployable web applications that may consume workspace packages.
- `tests/*`: package-focused unit test projects.
- `playground`: a standalone Vite visual debugging workbench for components.

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter playground dev
```

## Initial packages

- `@webgl-editor/ui`: minimal shared Vue component package.
- `@webgl-editor/demo`: example app consuming `@webgl-editor/ui`.
- `playground`: searchable component workbench consuming `@webgl-editor/ui`.
