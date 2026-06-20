# 7. 图形数据 Protobuf 协议

## 7.1 设计目标

- 覆盖点、线、面、体、点云、装配树，同时区分精确表示与显示表示。
- 支持 4–32 MiB 级 chunk、随机访问、增量更新、校验、压缩和版本兼容。
- TypeScript/C++ 均可将二进制缓冲区映射为 TypedArray 或原生 span，避免逐元素对象化。
- 同一实体可拥有多个 LOD、多个显示样式和一个原生精确几何引用。
- 协议控制面与大型数据面分离，降低 Protobuf `bytes` 复制和单消息尺寸风险。

## 7.2 数据分层

| 层 | 内容 |
|---|---|
| Document Manifest | 文档 ID、revision、单位、坐标系、根节点、资源目录和 chunk 索引。 |
| Scene / Entity | 装配树、变换、图层、可见性、属性和稳定实体 ID。 |
| Geometry Resource | Mesh、AnalyticCurveSet、PointCloudTile、BRepReference 等 `oneof`。 |
| Buffer / BufferView / Accessor | 原始 bytes、偏移、步长、分量类型、数量、量化、min/max。 |
| Command / Event | 命令、事务、revision、进度、资源失效和错误。 |

## 7.3 几何映射规则

| 类型 | 协议表示 |
|---|---|
| 点 | `PrimitiveMode.POINTS`；position 必选，color/intensity/label 等为可选 accessor。 |
| 线 | `LINES`/`LINE_STRIP` 用于显示；圆、圆弧、椭圆、NURBS 可附 `AnalyticCurve`，按屏幕误差离散。 |
| 面 | `TRIANGLES` 显示网格；`face_entity_id` 映射到拓扑面，可附精确曲面引用。 |
| 体 | 不把实体编码成海量拓扑 message；使用 `BRepReference` 指向原生精确块，并附多个 tessellation LOD。 |
| 点云 | `PointCloudTile` 包含八叉树地址、AABB、`geometric_error`、`point_count`、子节点和属性 accessors。 |

## 7.4 核心协议草案

```proto
syntax = "proto3";
package model.v1;

message ModelChunk {
  uint32 schema_version = 1;
  bytes document_id = 2;       // 16-byte stable id
  uint64 revision = 3;
  ChunkKey key = 4;
  repeated BufferDescriptor buffers = 5;
  repeated BufferView views = 6;
  repeated Accessor accessors = 7;
  repeated Geometry geometries = 8;
  repeated SceneNode nodes = 9;
  bytes content_hash = 10;
}

message BufferDescriptor {
  uint32 id = 1;
  uint64 byte_length = 2;
  Compression compression = 3;
  uint64 uncompressed_size = 4;

  oneof source {
    bytes inline_data = 10;       // 仅用于小缓冲区
    ExternalBlob external_blob = 11;
    SharedBufferRef shared = 12;  // 仅限受控本地进程/Worker
  }
}

message ExternalBlob {
  bytes content_hash = 1;
  string media_type = 2;
  uint64 byte_offset = 3;
  uint64 byte_length = 4;
}

message BufferView {
  uint32 id = 1;
  uint32 buffer_id = 2;
  uint64 byte_offset = 3;
  uint64 byte_length = 4;
  uint32 byte_stride = 5;
}

message Accessor {
  uint32 id = 1;
  uint32 view_id = 2;
  ComponentType component_type = 3;
  AccessorType type = 4;
  uint64 count = 5;
  bool normalized = 6;
  repeated double min = 7;
  repeated double max = 8;
  Quantization quantization = 9;
}

message Geometry {
  bytes entity_id = 1;
  oneof representation {
    Mesh mesh = 2;
    AnalyticCurveSet curves = 3;
    PointCloudTile point_cloud = 4;
    BRepReference brep = 5;
  }
  repeated LodRef lods = 6;
}
```

## 7.5 实体与资源标识

- `document_id`、`entity_id`、`resource_id` 使用 128 位稳定 ID；不要依赖数组下标或 Three.js `uuid` 作为持久化主键。
- `content_hash` 使用 SHA-256 或等价内容哈希，用于 CAS、去重、校验和缓存。
- `revision` 是文档单调递增的 64 位版本号。
- 资源更新采用新版本/新 hash，不原地覆盖仍被历史引用的块。

## 7.6 传输、分块与兼容

- 单个 `ModelChunk` 建议 4–32 MiB，硬上限 64 MiB；manifest 不内嵌大型 buffer。
- `GET /chunks/{hash}` 返回完整 protobuf chunk 或 raw blob，支持 ETag、`If-None-Match`、取消；raw blob 可支持 Range。
- 流式响应采用长度前缀 protobuf frame；每帧带 sequence、类型和 CRC/hash。
- 64 位 ID/计数在 TypeScript 侧使用 `bigint` 或代码生成器安全包装，禁止隐式转 `number`。
- 字段只追加不复用；删除字段必须 `reserved`；未知字段/属性透传或保留为 opaque metadata。
- API 消息与长期存储消息分离，避免服务演进与项目文件格式强绑定。

## 7.7 坐标、单位和精度

- 文档坐标使用 float64；GPU 显示访问器可使用 float32 或量化整数。
- manifest 明确长度单位、角度单位、上轴、手性、工程原点和可选 CRS。
- 每个 tile/chunk 可定义局部 origin 和 scale，避免大坐标精度损失。
- 精确几何引用必须保留 CAD Kernel 的单位和公差信息。

## 7.8 协议测试

- TS/C++ golden binary 双向测试。
- 旧版本读取、新字段忽略、未知字段保留测试。
- 畸形长度、越界 offset、超大 count、压缩炸弹和 hash 错误测试。
- 同一输入的逻辑文档 hash 与实体映射一致性测试。
