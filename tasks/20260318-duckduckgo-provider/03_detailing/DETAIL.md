# DuckDuckGo Provider for OpenClaw - 实现细节说明

## 1. 文档目标

本文件用于细化 `TRD.md` 的落地边界，描述建议的文件划分、职责分配、算法伪代码与异常处理逻辑，供 `04_coding` 阶段逐项实现。

## 2. 生成范围

- 范围：全量后端任务。
- 输入依据：`01_designing/PRD.md`、`02_roadmapping/ROADMAP.md`、`03_detailing/TRD.md`。
- 约束：仅描述做什么，不提供具体实现代码。

## 3. 建议文件规划

### `04_coding/src/providers/duckduckgo/DuckDuckGoSearchProvider.ts` `[新增]`

**职责**

- 编排 DuckDuckGo Provider 的完整搜索流程。
- 串联参数标准化、缓存查询、速率限制、HTML 请求、结果解析与统一返回。

**方法签名**

- `search(request: DuckDuckGoSearchRequest): Promise<DuckDuckGoSearchResponse>`
- `buildCacheKey(request: DuckDuckGoSearchRequest): string`
- `buildResponse(results: SearchResult[], context: SearchExecutionContext): DuckDuckGoSearchResponse`

### `04_coding/src/providers/duckduckgo/DuckDuckGoHttpGateway.ts` `[新增]`

**职责**

- 管理对 `https://html.duckduckgo.com/html/` 的访问。
- 处理请求参数映射、User-Agent、超时与响应文本返回。

**方法签名**

- `searchHtml(request: DuckDuckGoSearchRequest): Promise<string>`
- `buildQueryParams(request: DuckDuckGoSearchRequest): DuckDuckGoHttpQuery`
- `validateEndpoint(url: string): void`

### `04_coding/src/providers/duckduckgo/DuckDuckGoHtmlParser.ts` `[新增]`

**职责**

- 从 HTML 响应中解析标题、摘要与 URL。
- 保证输出结构对齐 `SearchResult` 数据模型。

**方法签名**

- `parse(html: string): SearchResult[]`
- `extractTitle(node: HtmlResultNode): string`
- `extractSnippet(node: HtmlResultNode): string`
- `extractUrl(node: HtmlResultNode): string`

### `04_coding/src/providers/duckduckgo/SearchResultSanitizer.ts` `[新增]`

**职责**

- 过滤非 `http/https` URL。
- 清理空标题、空摘要、重复链接与异常结果。

**方法签名**

- `sanitize(results: SearchResult[]): SearchResult[]`
- `isAllowedUrl(url: string): boolean`
- `deduplicate(results: SearchResult[]): SearchResult[]`

### `04_coding/src/providers/duckduckgo/RateLimitController.ts` `[新增]`

**职责**

- 管理默认 1 秒/请求的访问节奏。
- 根据连续请求结果调整等待策略。

**方法签名**

- `beforeRequest(context: RateLimitContext): Promise<void>`
- `afterSuccess(context: RateLimitContext): void`
- `afterFailure(context: RateLimitContext, error: ProviderError): void`

### `04_coding/src/providers/duckduckgo/SearchCache.ts` `[新增]`

**职责**

- 提供 15 分钟 TTL 的内存缓存。
- 以 `query + country + language` 为缓存粒度。

**方法签名**

- `get(cacheKey: string): DuckDuckGoSearchResponse | null`
- `set(cacheKey: string, response: DuckDuckGoSearchResponse, ttlMs: number): void`
- `delete(cacheKey: string): void`

### `04_coding/src/providers/duckduckgo/SearchRequestNormalizer.ts` `[新增]`

**职责**

- 统一请求参数的清洗、默认值与边界验证。
- 将 OpenClaw 参数转换为 Provider 内部请求模型。

**方法签名**

- `normalize(input: WebSearchInput): DuckDuckGoSearchRequest`
- `validateQuery(query: string): void`
- `mapCountry(country?: string): string | null`
- `mapLanguage(language?: string): string | null`

### `04_coding/src/providers/duckduckgo/SearchErrorMapper.ts` `[新增]`

**职责**

- 统一外部网络错误、解析错误、限流错误与输入错误的编码和消息。
- 为 MCP 层提供一致的失败响应结构。

**方法签名**

- `toProviderError(error: unknown, context: ErrorContext): ProviderError`
- `toClientError(error: ProviderError): ClientFacingError`

### `04_coding/src/providers/duckduckgo/types.ts` `[新增]`

**职责**

- 存放 DuckDuckGo Provider 的请求、响应、错误、缓存与限流上下文类型定义。

**关键类型**

- `DuckDuckGoSearchRequest`
- `DuckDuckGoSearchResponse`
- `SearchResult`
- `ProviderError`
- `RateLimitContext`
- `SearchExecutionContext`

### `04_coding/tests/providers/duckduckgo/*.test.ts` `[新增]`

**职责**

- 覆盖参数校验、HTML 解析、缓存命中、限流行为、异常处理与安全约束。

## 4. 关键流程算法伪代码

### 4.1 搜索主流程

```text
输入：query, country, language
输出：标准化搜索响应或友好错误

步骤 1：标准化请求参数，并验证 query 是否为空或超长
步骤 2：根据 query、country、language 生成缓存键
步骤 3：检查缓存是否命中
步骤 4：若命中，则直接返回缓存结果，并标记 cached = true
步骤 5：若未命中，则执行速率限制前置检查
步骤 6：构造 DuckDuckGo HTML 请求参数并发起外部请求
步骤 7：接收 HTML 响应文本，并校验响应是否为空
步骤 8：解析 HTML，提取 title、snippet、url
步骤 9：过滤非 http/https、空字段与重复结果
步骤 10：截断结果数量到 10 条
步骤 11：组装标准响应，并写入 15 分钟缓存
步骤 12：返回 cached = false 的搜索结果
步骤 13：若任一步骤失败，则映射为统一错误并返回友好消息
```

### 4.2 参数标准化流程

```text
输入：原始搜索参数
输出：Provider 内部请求模型

步骤 1：移除 query 首尾空白字符
步骤 2：校验 query 长度是否在 1~500 字符范围内
步骤 3：将 country 转换为预定义 DuckDuckGo 地域参数
步骤 4：将 language 转换为预定义 DuckDuckGo 语言参数
步骤 5：生成缓存键与请求时间戳
步骤 6：输出标准化后的内部请求对象
```

### 4.3 HTML 解析流程

```text
输入：DuckDuckGo HTML 响应
输出：原始搜索结果集合

步骤 1：定位每个搜索结果节点
步骤 2：提取标题节点文本
步骤 3：提取摘要节点文本
步骤 4：提取目标链接并转换为完整 URL
步骤 5：若任意核心字段缺失，则跳过该结果
步骤 6：汇总所有候选结果并返回
步骤 7：若有效结果为 0，则抛出解析失败错误
```

### 4.4 限流与自适应延迟流程

```text
输入：当前请求上下文、历史请求状态
输出：允许执行的请求时机

步骤 1：读取最近一次外部请求时间
步骤 2：计算距离上次请求的时间间隔
步骤 3：若未达到最小间隔，则等待剩余时间
步骤 4：若近期出现限流或失败，则增加额外等待时间
步骤 5：记录本次请求开始时间
步骤 6：根据成功或失败结果更新后续等待策略
```

### 4.5 缓存读写流程

```text
输入：缓存键、标准响应
输出：缓存命中结果或新的缓存记录

读流程：
1. 根据缓存键读取缓存条目
2. 若不存在，则返回未命中
3. 若已过期，则删除后返回未命中
4. 若有效，则返回缓存响应

写流程：
1. 记录当前写入时间
2. 计算 15 分钟后的失效时间
3. 保存缓存键与标准响应
4. 在响应中保留 cached 状态区分
```

## 5. 异常处理逻辑

| 异常类型 | 触发条件 | 对外表现 | 处理动作 |
|---------|---------|---------|---------|
| 输入错误 | `query` 为空、超长或参数非法 | 返回明确的参数错误信息 | 直接拒绝请求，不访问 DuckDuckGo |
| 网络错误 | 连接失败、超时、TLS 异常 | 返回可重试的网络错误 | 记录失败日志，交由错误映射器统一输出 |
| 限流错误 | DuckDuckGo 返回限流特征或频率过高 | 返回稍后重试提示 | 增加后续等待时间，并保留限流日志 |
| 解析错误 | HTML 结构变化、核心字段缺失 | 返回搜索结果暂不可用提示 | 记录解析阶段与原始上下文摘要 |
| 安全错误 | 非法 URL、异常协议、目标地址不合规 | 返回安全校验失败信息 | 丢弃问题结果，必要时中断响应 |
| 空结果错误 | 请求成功但无有效结果 | 返回无结果提示 | 保持响应结构稳定，不写入异常缓存 |

## 6. 边界与回退规则

- 若 `country` 或 `language` 无法映射到 DuckDuckGo 支持值，则回退为未设置状态，并在文档中说明能力限制。
- 若外部请求失败，不返回脏缓存或半结构化结果。
- 若解析结果超过 10 条，仅保留前 10 条。
- 若单条结果 URL 不合法，仅剔除该条，不影响其他有效结果返回。
- 若 DuckDuckGo HTML 结构整体变化导致无法解析，应优先返回统一解析错误，避免返回误导性结果。

## 7. 测试细化范围

| 测试主题 | 核心场景 |
|---------|---------|
| 参数校验 | 空 query、超长 query、非法 country、非法 language |
| 搜索结果解析 | 标题/摘要/URL 正常提取、字段缺失跳过、结果数量限制 |
| 缓存能力 | 首次请求未命中、重复请求命中、过期后失效 |
| 限流能力 | 连续请求间隔控制、失败后等待时间增加 |
| 错误处理 | 网络错误、解析错误、限流错误、空结果错误 |
| 安全校验 | 非 `http/https` URL 过滤、可疑链接剔除、输入长度限制 |

## 8. 实施顺序建议

1. 先完成类型定义、请求标准化与错误模型，固定输入输出边界。
2. 再完成外部访问与 HTML 解析，打通基础搜索主链路。
3. 随后补充 URL 过滤、缓存与限流治理，满足稳定性目标。
4. 最后完善测试、README、示例与验收记录，支撑交付演示。
