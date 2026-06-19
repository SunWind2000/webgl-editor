---
name: frontend-ui-module-coder
description: 当需要在 webgl-editor monorepo 中新增或修改 packages/ui 的 Vue 组件、根入口 named exports、tree-shaking 约定、playground 模块，或对应 tests 时使用。
---

# Frontend UI Module Coder

## 概览

使用这个 skill 新增 UI 组件时，需要保证根入口 named exports 可用、根入口可 tree-shake、测试和 playground 调试链路都成立。

## 组件约定

- Vue SFC 放在 `packages/ui/src/components`。
- 组件通过 `packages/ui/src/index.ts` 的根入口 named exports 暴露。
- `src/index.ts` 只做静态导出，不要维护带组件对象的 registry，避免破坏 tree-shaking。
- 不要新增未声明的 `@webgl-editor/ui/<subpath>` 子路径入口，除非需求明确要求修改 `package.json#exports`。
- playground 的模块 registry 放在 `playground/src/modules.ts`，不要放在 UI 包根入口。
- 不要把 `dist/` 里的生成 chunk 名当成公开 API。

## 新增组件

以 `ExamplePanel` 为例：

从根入口导出：

```ts
// packages/ui/src/index.ts
export { default as ExamplePanel } from './components/ExamplePanel.vue';
```

消费方使用 named import：

```ts
import { ExamplePanel } from '@webgl-editor/ui';
```

## Playground

组件需要可视化调试时，把模块加入 `playground/src/modules.ts`：

- `id`：稳定的 kebab-case 标识。
- `title`：面向人的组件名。
- `description`：简短说明用途。
- `component`：导入的组件对象。
- `props`：需要在工作台右侧面板动态编辑的 props 控件。
- `emits`：需要在工作台右侧面板记录的 emit 事件名。

完成后验证 workbench 仍然能渲染搜索框、模块导航、可拖拽侧边栏、props 控件、调试主区域和 emits 事件面板。

## Tests

在 `tests/ui` 下新增或更新测试：

- 测试根入口 named export。
- 不要在测试代码中导入 `@webgl-editor/ui/<subpath>`，除非该子路径已正式写入 `package.json#exports`。
- 使用 `@vue/test-utils` mount Vue 组件，验证可见行为。
- 组件声明 emits 时，测试至少一个 emit payload。

## 验证

运行：

```bash
pnpm --filter @webgl-editor/ui build
find packages/ui/dist -maxdepth 2 -type f | sort
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

如果修改了 playground，运行 `pnpm --filter playground dev` 并在浏览器中验证页面。
