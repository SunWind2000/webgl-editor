---
name: frontend-monorepo-coder
description: 当需要在 webgl-editor monorepo 中新增或修改 apps、packages、workspace 配置、包脚本、TypeScript/Vite/Vitest/ESLint 配置，或为 packages 增加测试模块时使用。
---

# Frontend Monorepo Coder

## 概览

使用这个 skill 保持新增 app、可发布 package、package 测试模块与当前 pnpm workspace 结构一致。

## 仓库约定

- 使用 pnpm workspace。工作区根路径是 `packages/*`、`apps/*`、`tests/*`、`playground`。
- 可独立发布的 npm 包放在 `packages/<name>`。
- 可独立打包发布的 Vite Web 应用放在 `apps/<name>`。
- 面向 package 的单元测试模块放在 `tests/<package-name>`。
- 保持根命令可用：`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
- 消费其他 workspace package 时使用公开包入口。除 Vite/Vitest/TS 的 source-mode alias 外，不要跨包引用对方内部 `src/` 私有路径。

## 新增 Package

创建 `packages/<name>` 时至少包含：

- `package.json`：声明 `name`、`version`、`type: module`、`exports`、`files: ["dist"]`、`build`、`typecheck`、`lint` 脚本。
- `src/index.ts`：根公开 API。
- `tsconfig.json`：继承 `../../tsconfig.base.json`。
- `vite.config.ts`：当 package 需要输出浏览器/runtime 代码时，用 Vite library build。

如果 package 暴露多个公开 import 路径，需要同步更新：

- `package.json#exports`
- `vite.config.ts` 的 library entries
- `tsconfig.base.json#paths`

## 新增 App

创建 `apps/<name>` 时至少包含：

- `package.json`：使用 `private: true`，提供 Vite `dev/build/typecheck/lint` 脚本，并通过 `"workspace:*"` 引用 workspace 依赖。
- `index.html`、`src/main.ts`、`src/App.vue`、本地 CSS、`tsconfig.json`、`vite.config.ts`。
- 在 `vite.config.ts` 中为 app 使用到的 workspace package 公开入口配置 source-mode alias。

App 必须能用 `pnpm --filter <app-name> build` 独立构建。

## 新增 Tests

创建或更新 `tests/<package-name>`：

- 测试代码通过公开入口导入 package，例如 `@webgl-editor/ui` 或 `@webgl-editor/ui/debug-card`。
- Vitest 配置放在测试模块本地。
- 只在测试配置中使用 source-mode alias，不要在测试代码里写内部源码路径。
- 优先测试行为；只有在验证 package exports 时才测试文件/导出形态。

## 验证

改变 workspace 结构后运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果影响了 app 或 playground，还要启动对应 dev server 并在浏览器中验证页面。
