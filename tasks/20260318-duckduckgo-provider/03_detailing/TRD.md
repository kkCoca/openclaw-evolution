# DuckDuckGo Provider for OpenClaw - 技术需求文档 (TRD)

## 1. 文档目标

基于 `01_designing/PRD.md` 与 `02_roadmapping/ROADMAP.md`，定义 DuckDuckGo Provider 的技术边界、系统架构、数据模型与 API 接口契约，用于指导 `04_coding` 阶段实现与验收。

## 2. 范围说明

- 范围：仅后端能力，交付形式为独立部署的 MCP Server。
- 目标：为 OpenClaw `web_search` 工具提供零配置、免 API Key 的 DuckDuckGo Provider。
- 不包含：图片/视频/新闻搜索、分页支持、高级搜索语法、原生集成到 OpenClaw 主仓库。

## 3. 架构设计

### 3.1 架构分层

| 层级 | 职责 | 输入 | 输出 |
|------|------|------|------|
| MCP 接入层 | 接收 `web_search` 请求，校验调用参数，返回标准化响应 | `query`、`country`、`language` | 搜索响应或友好错误 |
| Provider 编排层 | 编排缓存检查、速率限制、网络请求、解析与过滤流程 | 标准化搜索请求 | 标准化搜索结果集合 |
| DuckDuckGo 访问层 | 负责向 `html.duckduckgo.com/html/` 发起搜索请求 | 映射后的 DuckDuckGo 请求参数 | HTML 响应文本 |
| HTML 解析层 | 从 HTML 中提取标题、摘要、URL，并过滤无效结果 | HTML 响应文本 | 原始结果条目集合 |
| 治理层 | 提供缓存、限流、输入验证、URL 协议检查、错误分类 | 请求上下文、原始结果 | 可缓存结果、可返回错误 |
| 观测与文档层 | 提供日志分类、验收统计、README 与使用说明 | 运行事件、验收数据 | 可追踪记录与交付文档 |

### 3.2 核心处理链路

1. MCP 接入层接收搜索请求并校验 `query`、`country`、`language`。
2. Provider 编排层基于标准化参数生成缓存键并检查缓存。
3. 若缓存未命中，则进入速率限制判断。
4. DuckDuckGo 访问层向 `html.duckduckgo.com/html/` 发起请求。
5. HTML 解析层提取搜索结果并过滤无效 URL。
6. 治理层对结果数量、字段完整性与安全约束进行最终校验。
7. Provider 编排层写入缓存并返回标准化结果。
8. 若任一环节失败，则输出统一错误类型与友好错误信息。

### 3.3 组件职责拆分

| 组件 | 责任边界 | 关键要求 |
|------|---------|---------|
| SearchRequestNormalizer | 统一参数命名、默认值与长度限制 | `query` 必填，最大 500 字符 |
| DuckDuckGoSearchProvider | 统一编排搜索主链路 | 仅暴露网页搜索能力 |
| DuckDuckGoHttpGateway | 管理对 DuckDuckGo HTML API 的访问 | 使用标准浏览器 UA，控制请求频率 |
| DuckDuckGoHtmlParser | 解析 HTML 中的标题、摘要、URL | 解析失败时返回可识别错误类型 |
| SearchResultSanitizer | 过滤无效协议与异常链接 | 仅允许 `http/https` |
| SearchCache | 提供 15 分钟内存缓存 | 缓存命中返回标准结果 |
| RateLimitController | 提供默认 1 秒/请求及自适应延迟能力 | 连续 10 次查询不触发明显限流 |
| SearchErrorMapper | 统一网络、解析、限流错误的对外表达 | 返回友好错误信息 |

## 4. 数据模型

### 4.1 搜索请求模型

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| `query` | string | 是 | 1~500 字符 | 搜索关键词 |
| `country` | string | 否 | 国家代码白名单或预定义映射 | 控制地域偏好 |
| `language` | string | 否 | 语言代码白名单或预定义映射 | 控制语言偏好 |

### 4.2 Provider 内部请求模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `query` | string | 已完成空值、长度、空白字符治理的查询词 |
| `country` | string \| null | 规范化后的国家参数 |
| `language` | string \| null | 规范化后的语言参数 |
| `cacheKey` | string | 用于缓存命中的唯一键 |
| `requestTimestamp` | number | 当前请求时间，用于限流与日志统计 |

### 4.3 搜索结果模型

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 搜索结果标题 |
| `snippet` | string | 是 | 搜索结果摘要 |
| `url` | string | 是 | 标准化后的目标链接 |
| `source` | string | 是 | 固定标识为 `duckduckgo` |

### 4.4 搜索响应模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `results` | SearchResult[] | 最多 10 条网页搜索结果 |
| `cached` | boolean | 标识是否命中缓存 |
| `query` | string | 原始查询词回显 |
| `country` | string \| null | 生效的国家参数 |
| `language` | string \| null | 生效的语言参数 |
| `provider` | string | 固定标识为 `duckduckgo` |

### 4.5 缓存模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `cacheKey` | string | 由 `query`、`country`、`language` 组合生成 |
| `payload` | SearchResponse | 缓存的标准响应 |
| `createdAt` | number | 写入时间 |
| `expiresAt` | number | 失效时间，TTL 15 分钟 |

### 4.6 错误模型

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | string | 错误编码，如 `NETWORK_ERROR`、`PARSE_ERROR`、`RATE_LIMITED` |
| `message` | string | 对外友好错误信息 |
| `retryable` | boolean | 是否允许调用方重试 |
| `details` | object | 供日志记录的附加上下文 |

## 5. API 接口契约

### 5.1 MCP 搜索接口

**接口名称**：`web_search`

**请求契约**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `provider` | string | 是 | 固定值 `duckduckgo` |
| `query` | string | 是 | 搜索关键词 |
| `country` | string | 否 | 地域偏好参数 |
| `language` | string | 否 | 语言偏好参数 |

**成功响应契约**

| 字段 | 类型 | 说明 |
|------|------|------|
| `provider` | string | `duckduckgo` |
| `results` | array | 结果集合，最多 10 条 |
| `cached` | boolean | 是否命中缓存 |
| `metadata` | object | 包含生效的国家、语言与请求时间等上下文 |

**失败响应契约**

| 字段 | 类型 | 说明 |
|------|------|------|
| `error.code` | string | 统一错误编码 |
| `error.message` | string | 友好错误信息 |
| `error.retryable` | boolean | 是否可重试 |

### 5.2 DuckDuckGo HTML API 请求契约

| 项目 | 约定 |
|------|------|
| 请求方式 | GET |
| 请求地址 | `https://html.duckduckgo.com/html/` |
| 必填参数 | `q` |
| 可选参数 | `kl`、`kd` |
| 响应类型 | HTML 文本 |
| 协议要求 | 仅允许 HTTPS |

### 5.3 参数映射契约

| OpenClaw 参数 | DuckDuckGo 参数 | 说明 |
|---------------|-----------------|------|
| `query` | `q` | 直接映射为搜索关键词 |
| `country` | `kl` | 通过预定义地域映射转换 |
| `language` | `kd` | 通过预定义语言映射转换 |

### 5.4 日志与观测契约

| 事件 | 必含字段 | 说明 |
|------|---------|------|
| 搜索请求开始 | `provider`、`queryHash`、`country`、`language` | 避免直接输出原始敏感查询 |
| 缓存命中 | `cacheKey`、`ttlRemaining` | 统计缓存效果 |
| 外部请求失败 | `error.code`、`status`、`retryable` | 识别网络与限流问题 |
| 解析失败 | `error.code`、`parserStage` | 识别 HTML 结构变化 |

## 6. 非功能要求映射

| 维度 | 技术要求 |
|------|---------|
| 性能 | P95 响应时间小于 3 秒，支持 5 个并发请求 |
| 稳定性 | 7 天连续测试可用性大于 95% |
| 资源占用 | 运行内存控制在 50MB 内（含缓存） |
| 安全性 | 具备 SSRF 防护、查询长度限制、URL 协议过滤 |
| 可维护性 | 解析、访问、治理分层清晰，便于应对 DDG HTML 结构变化 |

## 7. 验收映射

| PRD 验收项 | TRD 对应约束 |
|-----------|-------------|
| AC-01 ~ AC-04 | 通过搜索请求模型、结果模型与 MCP 接口契约约束返回行为 |
| AC-05 | 通过统一错误模型与失败响应契约约束错误处理 |
| AC-06 | 通过 RateLimitController 的职责边界约束速率限制能力 |
| AC-07 | 通过缓存模型与 15 分钟 TTL 约束缓存行为 |
| AC-08 | 通过测试与验收映射保证核心场景可验证 |
| 安全验收 | 通过输入校验、SSRF 防护、URL 过滤与 HTTPS 约束落地 |

## 8. 交付边界

- 交付物包含：DuckDuckGo Provider 技术设计、数据契约、异常模型、测试对齐说明。
- 不在本阶段输出：具体实现代码、第三方依赖选型细节、部署脚本内容。
