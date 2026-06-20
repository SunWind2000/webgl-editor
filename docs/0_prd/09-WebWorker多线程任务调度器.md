# 9. WebWorker 多线程任务调度器

## 9.1 目标与边界

调度器负责将前端 CPU 密集任务从渲染主线程迁移出去，并统一处理优先级、依赖、共享内存、取消、超时、心跳、异常和指标。

Worker 适合 JavaScript/WASM CPU 密集任务；STEP/DWG/B-Rep 等原生 CAD 任务仍由 Native Sidecar 执行。

## 9.2 调度模型

| 模块 | 设计 |
|---|---|
| WorkerPool | 默认 worker 数 = `clamp(hardwareConcurrency - 2, 1, 配置上限)`，至少为 UI/系统保留一个逻辑核。 |
| TaskGraph | 任务含 deps；依赖完成后进入 ready queue；失败按策略传播、降级或跳过。 |
| Priority | `INTERACTIVE > VISIBLE > BACKGROUND > MAINTENANCE`；支持 aging 防止饥饿。 |
| Affinity | 同一共享数据集/BVH 的任务优先调度到已加载该资源的 Worker。 |
| Cancellation | `AbortSignal` + SAB cancel flag；Worker 必须在分块循环中检查。 |
| Memory Admission | 任务声明 `estimated_memory`；调度前与全局共享预算核对。 |
| Watchdog | 心跳、执行时长、内存和异常统计；卡死 Worker 终止并重建。 |
| Backpressure | ready queue、结果队列、GPU 上传队列均设硬上限，避免生产速度远高于消费速度。 |

## 9.3 任务接口

```ts
interface WorkerTask<T = unknown> {
  id: string;
  type: TaskType;
  priority: 'interactive' | 'visible' | 'background' | 'maintenance';
  dependencies: string[];
  affinityKey?: string;
  estimatedMemory: number;
  deadlineAt?: number;
  payload: T | SharedBufferDescriptor;
  retry: { maxAttempts: number; backoffMs: number };
}

interface SharedBufferDescriptor {
  arenaId: number;
  byteOffset: number;
  byteLength: number;
  componentType: number;
  version: number;
  readonly: boolean;
}

interface TaskResult<T = unknown> {
  taskId: string;
  status: 'completed' | 'cancelled' | 'failed';
  output?: T | SharedBufferDescriptor;
  metrics: {
    queueMs: number;
    runMs: number;
    bytesRead: number;
    bytesWritten: number;
  };
  error?: StructuredTaskError;
}
```

## 9.4 队列与调度算法

- 每个优先级维护独立 ready queue。
- 同优先级采用 deadline + aging + FIFO 的综合排序。
- 任务进入运行态前依次执行依赖校验、能力匹配、内存准入和 affinity 评分。
- 交互任务可抢占尚未运行的低优先级任务；已运行任务通过 cooperative cancellation 让出资源。
- 结果较大时不直接 `postMessage` 对象，而是返回 Transferable 或共享描述符。

## 9.5 SharedArrayBuffer 内存模型

- 使用固定大小 arena + free-list/slab，而不是频繁创建大量 SAB。
- 控制区使用 `Int32Array`：state、owner、version、cancel、progress、refCount；数据区按 64 字节对齐。
- 大数组通过 descriptor 传递；主线程和 Worker 不共享可变 JavaScript 对象。
- 默认单写多读；多写场景必须切分不重叠区间或使用 Atomics/CAS。
- 结果发布采用 version/state 原子切换，读者只读取已提交版本。
- arena 回收采用引用计数 + generation，避免悬空 descriptor 和 ABA 问题。

## 9.6 SAB 部署要求与降级

页面必须处于 secure context 且 cross-origin isolated。建议由 NestJS 同源提供静态页面和 API，并统一设置：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Content-Security-Policy: ...
```

运行时检查：

```ts
const sabAvailable =
  window.crossOriginIsolated &&
  typeof SharedArrayBuffer !== 'undefined';
```

未满足时自动降级为 Transferable `ArrayBuffer`，功能保持一致，性能能力面板显示降级原因。

## 9.7 典型任务

| 任务 | 线程策略 | 输出 |
|---|---|---|
| DXF 快速解析 | Worker；按 section/实体分块 | 实体表 + line/curve buffers |
| glTF 解压 | Worker/WASM | GPU-ready accessors |
| BVH 构建 | Worker；按 geometry affinity | 序列化 BVH + bounds |
| 选择集计算 | 高优先级 Worker | entity IDs / bitset |
| 网格简化/法线 | 后台 Worker 或原生 | 新 LOD chunk |
| 点云过滤/着色 | 可见优先；SAB 输入输出 | tile 属性或索引 |
| 属性索引 | 后台 Worker | 列式索引/倒排索引 |

## 9.8 故障与监控

- Worker 定期发送 heartbeat 和当前任务 ID。
- 超时后先设置 cancel flag，再经过 grace period 终止 Worker。
- Worker 崩溃后按任务幂等性重试；非幂等任务必须由事务层重新准备。
- 记录 queue latency、run time、cancel latency、retry、memory admission reject 和 bytes copied。
