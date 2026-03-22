# OpenClaw DDG Web Search 技术方案

## 技术选型

### 搜索源选型比较
| 方案 | 优点 | 缺点 |
|------|------|------|
| DuckDuckGo Lite/HTML + Bing 页面兜底 | 免费、免 API、页面结构相对稳定、与需求目标一致 | 需要处理 HTML 解析和反爬 |
| Brave Search API | 结果质量高、接口标准化 | 需要账号和信用卡，不符合目标 |
| Google 自研抓取 | 覆盖广 | 反爬强、合规和维护成本高 |

结论：选择 DuckDuckGo 作为主搜索源，Bing 免 API 页面作为备用搜索源。

### 页面获取策略比较
| 方案 | 优点 | 缺点 |
|------|------|------|
| 直接 HTTP 请求 HTML 页面 | 依赖少、性能高、便于部署在 `extensions/` | 需要自己维护解析规则 |
| Headless Browser 抓取 | 兼容复杂页面更强 | 资源消耗大，超出本期复杂度 |
| 第三方聚合接口 | 开发快 | 额外依赖外部服务，不满足免 API 目标 |

结论：采用直接 HTTP 请求 HTML 页面的方式实现搜索。

### 反爬策略比较
| 方案 | 优点 | 缺点 |
|------|------|------|
| 请求头伪装 + 随机延迟 | 成本低、部署简单、符合已确认范围 | 对高强度限流的抵抗能力有限 |
| 代理池 + IP 轮换 | 抗限流更强 | 成本高，运维复杂 |
| 浏览器自动化模拟 | 通过率高 | 性能差，维护成本高 |

结论：采用请求头伪装 + 随机延迟，并补充超时、退避、快速降级机制。

### 扩展部署方式比较
| 方案 | 优点 | 缺点 |
|------|------|------|
| `extensions/` 内独立扩展 | 与项目一体化、便于替换历史模块、交付边界清晰 | 需要明确内部接口契约 |
| `tasks/` 内临时实现 | 开发快 | 不适合作为长期运行产物 |
| 独立仓库 | 生命周期独立 | 增加协作和发布复杂度 |

结论：部署到 `extensions/`，作为 OpenClaw 内部长期扩展。

| 层 | 选择 | 理由 |
|----|------|------|
| 运行时 | Node.js 扩展模块 | 与 OpenClaw 现有扩展形态一致，便于内部调用 |
| 主搜索源 | DuckDuckGo Lite/HTML 页面 | 免费、免 API、适合低成本搜索集成 |
| 备用搜索源 | Bing 搜索页面 | 结果质量较好，与 DDG 互补 |
| 抓取方式 | HTTP 请求 + HTML 解析 | 性能和复杂度平衡最佳 |
| 反爬策略 | 浏览器请求头 + 随机延迟 + 退避 | 满足已确认的 B4 方案 |
| 部署位置 | `extensions/openclaw-web-search/` | 满足 D2 一体化部署要求 |
| 监控方式 | 结构化日志 | 满足排障与验收，不引入额外基础设施 |

## 架构设计

### 模块划分
| 模块 | 职责 | 依赖 |
|------|------|------|
| Search Orchestrator | 接收搜索请求、执行参数校验、调度主备搜索源、统一输出结构 | Source Router, Response Formatter, Logger |
| Source Router | 按优先级选择 DuckDuckGo 或 Bing，处理失败切换 | DDG Adapter, Bing Adapter, Backoff Policy |
| DDG Adapter | 发起 DuckDuckGo 请求并解析标题、链接、摘要、相关搜索 | HTTP Client, HTML Parser |
| Bing Adapter | 在主源失败时发起 Bing 请求并解析结果 | HTTP Client, HTML Parser |
| Anti-Bot Guard | 注入请求头、随机延迟、超时和重试退避 | Config |
| Response Formatter | 根据 `summary` 或 `detailed` 输出视图裁剪字段 | Output Contract |
| Config | 管理结果条数、超时、请求头模板、延迟范围等配置 | Runtime Env |
| Logger | 输出搜索源、耗时、错误类型、结果数量等结构化日志 | Runtime |

### 核心流程
1. OpenClaw 调用 Search Orchestrator，传入 `query`、`limit`、`outputMode`。
2. Search Orchestrator 校验参数，创建请求上下文与追踪 ID。
3. Source Router 根据固定优先级先调用 DDG Adapter。
4. Anti-Bot Guard 在请求前注入 User-Agent、Accept-Language、Referer，并附加随机延迟。
5. DDG Adapter 拉取页面并尝试解析结果与相关搜索。
6. 若出现超时、限流、验证码页或解析失败，Source Router 触发备用搜索源 Bing Adapter。
7. 成功结果交给 Response Formatter，按输出模式生成统一响应。
8. Logger 记录结构化日志并返回结果给 OpenClaw。

## 数据模型

### 实体关系
| 实体 | 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|------|
| SearchRequest | query | string | 必填，1-200 字符 | 用户搜索词 |
| SearchRequest | limit | number | 可选，默认 10，最大 20 | 结果条数 |
| SearchRequest | outputMode | enum | `summary` 或 `detailed` | 输出格式 |
| SearchRequest | requestId | string | 系统生成 | 请求追踪标识 |
| SearchResult | title | string | 必填 | 结果标题 |
| SearchResult | url | string | 必填，合法 URL | 结果链接 |
| SearchResult | snippet | string | 可选 | 结果摘要 |
| SearchResult | source | enum | `ddg` 或 `bing` | 命中来源 |
| SearchResponse | query | string | 必填 | 回显查询词 |
| SearchResponse | results | SearchResult[] | 至少 0 条 | 主结果列表 |
| SearchResponse | relatedSearches | string[] | 可空 | 相关搜索词 |
| SearchResponse | sourceUsed | enum | `ddg` 或 `bing` | 实际响应来源 |
| SearchResponse | tookMs | number | 必填 | 总耗时 |
| SearchResponse | partial | boolean | 必填 | 是否结果不足或降级返回 |
| SearchResponse | error | ErrorPayload | 可空 | 全部失败时返回 |
| ErrorPayload | type | enum | 固定枚举 | 如 timeout、rate_limit、parse_error |
| ErrorPayload | retryable | boolean | 必填 | 是否建议重试 |
| RuntimeConfig | ddgTimeoutMs | number | 默认 3000 | 主源超时 |
| RuntimeConfig | bingTimeoutMs | number | 默认 3000 | 备用源超时 |
| RuntimeConfig | jitterMinMs | number | 默认 200 | 最小随机延迟 |
| RuntimeConfig | jitterMaxMs | number | 默认 800 | 最大随机延迟 |

### 关系
- SearchRequest 1:1 SearchResponse
- SearchResponse 1:N SearchResult
- SearchResponse 0:N relatedSearches
- RuntimeConfig 1:N SearchRequest

## 接口定义

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 执行搜索 | `search(request)` | `internal://openclaw-web-search/search` | 执行一次完整搜索，自动主备切换 |
| 健康检查 | `healthCheck()` | `internal://openclaw-web-search/health` | 返回主源可用性、最近失败状态和配置摘要 |
| 解析 DDG 结果 | `fetchDdg(query, limit)` | `internal://openclaw-web-search/source/ddg` | 获取并解析 DDG 页面 |
| 解析 Bing 结果 | `fetchBing(query, limit)` | `internal://openclaw-web-search/source/bing` | 获取并解析 Bing 页面 |
| 格式化响应 | `format(response, outputMode)` | `internal://openclaw-web-search/formatter` | 将统一结构转换为场景化输出 |

## 错误处理策略

| 错误类型 | 处理方式 |
|---------|---------|
| invalid_query | 直接拒绝请求，返回不可重试错误 |
| timeout | 当前搜索源超时后切换下一搜索源；全部超时则返回可重试错误 |
| rate_limit | 主源被限流时立即降级到备用源，并记录限流事件 |
| captcha_detected | 视为主源不可用，跳过重试直接切换备用源 |
| parse_error | 当前页面解析失败时切换备用源，并上报解析失败日志 |
| empty_results | 返回空结果集并标记 `partial=false`，不视为系统错误 |
| all_sources_failed | 返回统一错误对象，包含最后失败原因与 `retryable` 标记 |

## 实施约束
- 新扩展发布后，调用入口应从历史 `DDG Fallback` 切换到新 Web Search 扩展，避免双路径并存。
- 本期不引入数据库；配置以文件或环境变量形式注入，日志写入现有运行日志体系。
- 解析逻辑必须按搜索源分离，避免 DDG 与 Bing 的 DOM 规则耦合。
- 输出结构在主源与备用源之间保持一致，保证 OpenClaw 调用方无感切换。
