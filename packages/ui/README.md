# @webgl-editor/ui

`@webgl-editor/ui` 是 webgl-editor workspace 的共享 Vue 3 组件包。

当前包采用根入口 named exports，并通过 ESM tree-shaking 支持消费方按需打包未使用组件。

## 消费方式

推荐写法：

```ts
import { DebugCard } from '@webgl-editor/ui';
```

不要从 package 内部源码路径引入：

```ts
// 不推荐
import DebugCard from '@webgl-editor/ui/src/components/DebugCard.vue';
```

也不要在没有 `package.json#exports` 声明的情况下使用子路径入口：

```ts
// 当前不支持
import DebugCard from '@webgl-editor/ui/debug-card';
```

## Tree-shaking 约定

为了让根入口可 tree-shake，`src/index.ts` 必须保持为静态导出入口：

```ts
export { default as DebugCard } from './components/DebugCard.vue';
```

不要在 `src/index.ts` 中维护带组件对象的 registry，例如：

```ts
// 不推荐：会让根入口 eager import 组件
import DebugCard from './components/DebugCard.vue';

export const modules = [
  { id: 'debug-card', component: DebugCard }
];
```

如果 playground 需要 registry，把 registry 放在 `playground/src/modules.ts`，由 playground 自己组合：

```ts
import { DebugCard } from '@webgl-editor/ui';

export const playgroundModules = [
  {
    id: 'debug-card',
    title: 'Debug Card',
    description: 'A minimal shared component for workspace smoke tests.',
    component: DebugCard
  }
];
```

## 新增组件

以 `ExamplePanel` 为例：

1. 创建组件：

```text
packages/ui/src/components/ExamplePanel.vue
```

2. 从根入口导出：

```ts
// packages/ui/src/index.ts
export { default as ExamplePanel } from './components/ExamplePanel.vue';
```

3. 在测试中通过根入口 named export 引入：

```ts
import { ExamplePanel } from '@webgl-editor/ui';
```

4. 如果需要可视化调试，在 `playground/src/modules.ts` 中注册模块。

## 构建产物

`vite-plugin-dts` 会在 `vite build` 时生成声明文件。

新增组件后验证：

```bash
pnpm --filter @webgl-editor/ui build
find packages/ui/dist -maxdepth 2 -type f | sort
```

根入口模式下，公开产物至少应包含：

- `dist/index.js`
- `dist/index.d.ts`
- `dist/index.css`

不要把 `dist/` 中的生成 chunk 名当成公开 API。
