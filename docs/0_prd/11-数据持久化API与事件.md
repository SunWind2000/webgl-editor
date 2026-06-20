# 11. 数据持久化、API 与事件

## 11.1 推荐项目结构

```text
.cadproj/
  project.db                  # SQLite: document/entity/command/job/index
  manifest.json               # 最小启动信息、版本、迁移标记
  sources/                    # 可选：原始文件副本或外部引用清单
  objects/aa/bb/<sha256>      # 内容寻址几何/纹理/B-Rep/点云块
  derived/<profile>/          # 可重建的 LOD、BVH、缩略图、边线
  autosave/                   # 检查点与恢复信息
  logs/                       # 轮转诊断日志（可配置）
```

## 11.2 SQLite 数据职责

| 表/域 | 内容 |
|---|---|
| project/document | 项目、文档、revision、单位、坐标系和根节点。 |
| entity/node | 稳定 ID、父子关系、类型、显示状态和源映射。 |
| resource/chunk | hash、类型、字节数、压缩、LOD、包围盒和引用计数。 |
| command/transaction | 命令 envelope、状态、base/committed revision 和逆数据引用。 |
| import_job/task | 阶段、进度、日志、错误、重试和解析器版本。 |
| property_index | 可搜索属性的列式/倒排索引；大型原始属性保存在 chunk。 |
| migration | 项目 schema 迁移记录、状态和备份引用。 |

SQLite 使用 WAL 获得原子事务和较好的读写并行；大型几何块落文件系统，并由数据库维护 hash、引用和生命周期。

## 11.3 内容寻址存储

- 对原始源文件、精确 B-Rep、显示网格、纹理、点云瓦片、BVH 分别计算 hash。
- 写入采用临时文件 + fsync + 原子 rename，再提交数据库引用。
- 相同内容自动去重。
- 派生资源记录生成 profile、算法版本和输入 hash；任一变化时自动失效。
- GC 只删除无项目引用、无历史保留且超过宽限期的资源。

## 11.4 HTTP API 草案

| 方法 | 路径 | 用途 | 响应 |
|---|---|---|---|
| POST | `/api/v1/projects` | 创建项目 | `CreateProjectResponse` |
| POST | `/api/v1/import-jobs` | 创建导入任务 | `CreateImportJobResponse` |
| POST | `/api/v1/import-jobs/{id}:cancel` | 取消任务 | `CancelTaskResponse` |
| GET | `/api/v1/documents/{id}/manifest` | 获取文档目录 | `DocumentManifest` |
| GET | `/api/v1/chunks/{hash}` | 获取几何/纹理块 | `ModelChunk` 或 raw blob |
| POST | `/api/v1/documents/{id}/commands:commit` | 提交命令/事务 | `CommandResult` |
| POST | `/api/v1/documents/{id}:undo` | 撤销 | `CommandResult` |
| POST | `/api/v1/documents/{id}:redo` | 重做 | `CommandResult` |
| GET | `/api/v1/events` | SSE 任务/版本事件 | `text/event-stream` |
| GET | `/api/v1/capabilities` | 后端、格式、GPU/Worker 能力 | `CapabilitiesResponse` |

## 11.5 API 约束

- API 使用 `/api/v1` major 版本；项目 schema 版本独立管理。
- 所有写请求携带 request ID、document ID、base revision 和 session credential。
- 大响应支持取消、超时、ETag 和明确的 Content-Length/Range 能力。
- 错误使用结构化错误码，不依赖本地化字符串判断逻辑。

## 11.6 SSE 事件

- `task.progress`：job ID、phase、completed、total、message、estimated remaining。
- `task.completed` / `task.failed`：输出资源、告警、错误码、可重试标志。
- `document.revision`：document ID、previous revision、new revision、transaction ID。
- `resource.invalidated`：受影响 entity/resource、失效原因和替换 chunk。
- `heartbeat`：连接存活与服务版本。

断线后客户端使用 `Last-Event-ID` 补齐；若事件窗口已过期，则重新获取 manifest 和当前 revision。

## 11.7 项目迁移与备份

- 迁移前生成 manifest 与数据库备份。
- 迁移步骤幂等、可中断、可继续。
- 大型派生资源优先标记失效而不是逐块转换。
- 迁移失败时保留原项目只读打开能力。
