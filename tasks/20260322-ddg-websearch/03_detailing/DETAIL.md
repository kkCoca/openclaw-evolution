# 执行方案 - OpenClaw DDG Web Search

> 依据：`01_designing/PRD.md` / `01_designing/TRD.md` / `02_roadmapping/ROADMAP.md` / `detailing/TEMPLATES.md` / 历史归档代码
> 生成范围：全栈（覆盖 `ROADMAP.md` 10 个任务）
> 生成时间：2026-03-22

## 一、现状分析

当前任务仓库只有设计文档与路线图，`03_detailing/` 为空，`extensions/` 目录也尚未落地产物，说明本需求仍处于方案到实现的衔接阶段。现有可复用资产主要来自两类历史归档：一类是 `tasks/archive/20260322-duckduckgo-fallback/04_coding/src/index.js` 的 DDG Fallback 逻辑，提供了基于错误分类的降级入口；另一类是 `tasks/archive/20260322-openclaw-search-integration/04_coding/tests/integration.test.js` 与配套实现指令，展示了统一搜索入口、主备切换与消费者调用的基本组织方式。与此同时，`NORMS/core/02-production-purity.md` 明确要求 `extensions/` 仅保留发布产物，不得直接放置 `src/` 与 `tests/`，因此研发文件应落在 `04_coding/`，生产发布再同步到 `extensions/openclaw-web-search/`。

从技术方案看，当前目标不是简单复用旧的 DDG Fallback，而是重建一个面向 OpenClaw 内部调用的独立 Web Search 扩展：主源为 DuckDuckGo HTML/Lite，备用为 Bing 页面，内部模块至少包含契约层、编排层、主备路由、反爬控制、解析器、格式化器、日志与健康检查。前端消费侧在仓库中没有现成生产代码，因此本方案将前端任务收敛为调用适配层与结果展示模型文件，由 `04_coding/` 提供标准消费接口，再在真实宿主接入时映射到实际 UI 文件。整体基线可以概括为：有清晰文档、有历史模式、无当前实现，需要一次性补齐研发区代码结构、部署产物结构与联调脚本。

## 二、整体思路

整体实现采用“研发区实现 + 生产区发布”的双层结构。研发区统一放在 `04_coding/`，按 TRD 中的模块边界拆分为 contracts、orchestrator、router、source、parser、guard、formatter、logging、config、health、client 与 tests；生产区发布名固定为 `extensions/openclaw-web-search/`，只保留 `dist/`、`package.json`、`MANIFEST.json`、`README.md` 等交付产物，满足命名归一化与生产区纯净原则。这样既能承接历史 DDG Fallback 的降级经验，也能避免把旧实现直接当作运行依赖继续耦合。

核心链路以 `search(request)` 为唯一统一入口：先做参数校验与请求上下文生成，再由 `SourceRouter` 按固定优先级驱动 DDG → Bing；每次外部请求前都通过 `AntiBotGuard` 注入浏览器头、随机延迟与超时控制；主备源各自通过独立 adapter + parser 解析 HTML 页面；结果交给 `ResponseFormatter` 按 `summary` / `detailed` 输出统一结构；最后由 `SearchLogger` 记录结构化日志，并由 `HealthService` 汇总主源最近状态供 `healthCheck()` 返回。前端或调用方不直接感知主备源切换，只消费稳定的 `SearchResponse` 契约。

由于仓库中没有现成 UI 文件，本方案把“前端任务”定义为两个层面：第一，提供稳定的客户端消费适配文件，封装 outputMode、来源标记、部分结果和 retryable 错误；第二，补齐联调测试与演示脚本，确保真实 UI 接入时只需映射展示组件，不必重新理解后端协议。部署阶段再把研发区构建产物同步到 `extensions/openclaw-web-search/`，同时移除旧的历史调用分支，确保发布后只有新扩展入口对外生效。

---

## 任务 1：搜索入口契约（后端）统一搜索请求与响应契约

### 实现思路

先建立扩展内部唯一的请求/响应模型，把 PRD/TRD 中的字段约束固化为契约层，再让编排器、格式化器、健康检查与调用侧都只依赖该模型。错误对象、部分结果、来源标记和可重试标记都在这一层统一定义，避免不同搜索源各自返回不同结构。健康检查也在契约层给出稳定输出，方便部署验证与调用方观测。

### 关键步骤

1. 在 contracts 层定义请求、结果、响应、错误与健康检查摘要结构。
2. 在入口层统一校验 `query`、`limit`、`outputMode` 并生成 `requestId`。
3. 在编排器中固定 `search()` 与 `healthCheck()` 两个公开入口。

### 注意事项

1. `limit` 默认 10、最大 20，超过上限必须截断或拒绝，不得透传到源站。
2. `relatedSearches` 在主源缺失时返回空数组而不是 `null`。
3. 所有错误对象必须包含 `type` 与 `retryable`，便于前端消费一致化。

### 文件变更

#### `04_coding/package.json` [新增]

**职责**：定义研发区模块名、构建脚本与测试脚本，保证与发布名 `openclaw-web-search` 一致。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `"name": "openclaw-web-search"` | 研发区与发布区命名归一 |
| 新增 | `"main": "src/index.js"` | 声明统一入口 |
| 新增 | `"scripts": { "build": "...", "test": "...", "test:integration": "...", "test:e2e": "..." }` | 约束构建与验证命令 |

#### `04_coding/src/contracts/search-contract.js` [新增]

**职责**：定义搜索请求、响应、错误、健康检查等领域契约。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function validateSearchRequest(request: SearchRequest): ValidatedSearchRequest` | 校验 query、limit、outputMode |
| 新增 | `export function createRequestContext(request: ValidatedSearchRequest): SearchRequestContext` | 生成 requestId、开始时间与追踪上下文 |
| 新增 | `export function createErrorPayload(type: SearchErrorType, retryable: boolean, message: string): ErrorPayload` | 统一错误对象 |
| 新增 | `export function createHealthSummary(status: SourceHealthStatus, lastFailureType?: SearchErrorType): HealthCheckResponse` | 统一健康检查响应 |

#### `04_coding/src/error/search-error.js` [新增]

**职责**：封装业务错误、重试属性与来源信息，供路由器与入口统一处理。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class SearchError extends Error` | 统一业务异常基类 |
| 新增 | `public constructor(type: SearchErrorType, message: string, retryable: boolean, source?: SearchSource)` | 记录错误类型、来源与可重试标记 |
| 新增 | `export function isRetryableError(error: unknown): boolean` | 给主备切换与前端消费复用 |

#### `04_coding/src/index.js` [新增]

**职责**：暴露扩展公开接口，屏蔽内部模块细节。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export async function search(request: SearchRequest): Promise<SearchResponse>` | 扩展统一搜索入口 |
| 新增 | `export async function healthCheck(): Promise<HealthCheckResponse>` | 扩展健康检查入口 |
| 新增 | `export function createWebSearchExtension(config?: Partial<RuntimeConfig>): OpenClawWebSearchExtension` | 创建可注入依赖的扩展实例 |

#### `04_coding/src/orchestrator/search-orchestrator.js` [新增]

**职责**：承接入口调用，串联参数校验、主备路由、格式化和日志。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class SearchOrchestrator` | 统一编排搜索流程 |
| 新增 | `public constructor(deps: SearchOrchestratorDependencies)` | 注入 router、formatter、logger、healthService |
| 新增 | `public async search(request: SearchRequest): Promise<SearchResponse>` | 处理完整搜索流程 |
| 新增 | `public async healthCheck(): Promise<HealthCheckResponse>` | 汇总健康状态与配置摘要 |

---

## 任务 2：主源接入（后端）DuckDuckGo 搜索能力接入

### 实现思路

DDG 主源按“请求构造 + HTML 拉取 + DOM 解析 + 结果归一”四段拆分，避免未来页面结构变化时影响其他模块。解析层只负责从 HTML 中提取标题、链接、摘要和相关搜索，业务层不直接处理 DOM 细节。主源返回空结果不视为错误，但要保留来源、耗时与结果不足标记。

### 关键步骤

1. 在 adapter 中封装 DDG 请求 URL、请求头与超时参数。
2. 在 parser 中提取主结果与相关搜索词，并输出统一中间结构。
3. 在 orchestrator 中覆盖主源成功与空结果两类主路径。

### 注意事项

1. DDG 解析规则与 Bing 解析规则必须严格分离。
2. 抽取到的链接必须经过 URL 合法性标准化。
3. 空结果属于正常返回，不应触发备用源切换。

### 文件变更

#### `04_coding/src/source/ddg-adapter.js` [新增]

**职责**：执行 DuckDuckGo 页面请求并返回统一搜索源结果。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class DdgAdapter` | DuckDuckGo 主源适配器 |
| 新增 | `public constructor(deps: DdgAdapterDependencies)` | 注入 httpClient、antiBotGuard、ddgParser、config |
| 新增 | `public async fetchDdg(query: string, limit: number, context: SearchRequestContext): Promise<SourceSearchResponse>` | 拉取并解析 DDG 结果 |
| 新增 | `private buildSearchUrl(query: string, limit: number): string` | 生成 DDG 页面请求地址 |
| 新增 | `private normalizeDdgResponse(parsed: ParsedDdgDocument, tookMs: number): SourceSearchResponse` | 转换为统一结果结构 |

#### `04_coding/src/parser/ddg-parser.js` [新增]

**职责**：解析 DuckDuckGo HTML，提取结果项与相关搜索。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function parseDdgDocument(html: string, limit: number): ParsedDdgDocument` | 解析 HTML 主体 |
| 新增 | `export function extractDdgResults(document: ParsedHtmlDocument, limit: number): SearchResult[]` | 提取标题、链接、摘要 |
| 新增 | `export function extractDdgRelatedSearches(document: ParsedHtmlDocument): string[]` | 提取相关搜索词 |
| 新增 | `export function detectDdgBlockingState(html: string): BlockingDetectionResult` | 检测限流、验证码或结构异常 |

#### `04_coding/tests/ddg-adapter.test.js` [新增]

**职责**：验证主源成功、空结果与解析异常场景。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('fetchDdg returns normalized results on success'): Promise<void>` | 验证标准成功路径 |
| 新增 | `test('fetchDdg returns empty results without throwing when no items found'): Promise<void>` | 验证空结果场景 |
| 新增 | `test('fetchDdg throws parse_error when document shape is invalid'): Promise<void>` | 验证结构异常路径 |

---

## 任务 3：备用降级（后端）Bing 兜底搜索能力接入

### 实现思路

备用源的目标不是复制主源能力，而是在主源超时、限流、验证码或解析失败时提供稳定兜底，因此路由策略应由统一的 SourceRouter 控制，Bing Adapter 只关注可用结果输出。主备源都返回同一 `SourceSearchResponse` 结构，formatter 和前端因此不需要关心来源差异。切换时要保留失败原因，供日志和响应元数据使用。

### 关键步骤

1. 为 Bing 建立独立 adapter 与 parser，不复用 DDG DOM 规则。
2. 在 SourceRouter 中固化主备优先级与触发条件。
3. 在成功响应中补充 `sourceUsed` 与 `partial` 等元数据。

### 注意事项

1. 只有 timeout、rate_limit、captcha_detected、parse_error 才触发备用源切换。
2. Bing 成功时仍需返回统一字段名，不暴露备用源专有结构。
3. 主源失败信息必须进入日志，但不能污染最终成功结果的主字段。

### 文件变更

#### `04_coding/src/source/bing-adapter.js` [新增]

**职责**：执行 Bing 页面请求并生成统一备用源结果。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class BingAdapter` | Bing 备用源适配器 |
| 新增 | `public constructor(deps: BingAdapterDependencies)` | 注入 httpClient、antiBotGuard、bingParser、config |
| 新增 | `public async fetchBing(query: string, limit: number, context: SearchRequestContext): Promise<SourceSearchResponse>` | 拉取并解析 Bing 结果 |
| 新增 | `private buildSearchUrl(query: string, limit: number): string` | 生成 Bing 页面请求地址 |
| 新增 | `private normalizeBingResponse(parsed: ParsedBingDocument, tookMs: number): SourceSearchResponse` | 转换为统一结果结构 |

#### `04_coding/src/parser/bing-parser.js` [新增]

**职责**：解析 Bing HTML 并提取标题、链接与摘要。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function parseBingDocument(html: string, limit: number): ParsedBingDocument` | 解析 Bing HTML |
| 新增 | `export function extractBingResults(document: ParsedHtmlDocument, limit: number): SearchResult[]` | 提取搜索结果列表 |
| 新增 | `export function detectBingBlockingState(html: string): BlockingDetectionResult` | 检测备用源限流或结构异常 |

#### `04_coding/src/router/source-router.js` [新增]

**职责**：统一控制主备搜索源顺序、切换条件与最终错误归并。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class SourceRouter` | 主备切换路由器 |
| 新增 | `public constructor(deps: SourceRouterDependencies)` | 注入 ddgAdapter、bingAdapter、healthService、logger |
| 新增 | `public async execute(request: ValidatedSearchRequest, context: SearchRequestContext): Promise<SourceSearchResponse>` | 先主后备执行搜索 |
| 新增 | `private shouldFallback(error: SearchError): boolean` | 判定是否切换备用源 |
| 新增 | `private createAllSourcesFailedError(errors: SearchError[]): SearchError` | 统一合并最终失败结果 |

#### `04_coding/tests/source-router.test.js` [新增]

**职责**：验证主备切换条件、最终失败与来源一致性。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('execute returns DDG result when primary source succeeds'): Promise<void>` | 主源成功不切换 |
| 新增 | `test('execute falls back to Bing on retryable DDG failure'): Promise<void>` | 可降级错误触发备用源 |
| 新增 | `test('execute throws all_sources_failed when both sources fail'): Promise<void>` | 双源失败统一报错 |

---

## 任务 4：反爬控制（后端）请求保护与失败退避

### 实现思路

反爬能力作为横切模块实现，不散落在 adapter 内部。所有外部请求都必须先经过 AntiBotGuard，统一注入浏览器级 headers、随机延迟、超时与短时退避策略。日志与健康状态也在这个过程中同步更新，使“请求保护”“失败退避”“结构化可观测”形成一条完整链路。

### 关键步骤

1. 抽象通用 HTTP Client，统一承接超时与请求执行。
2. 在 AntiBotGuard 中封装 headers、jitter、backoff 与失败判定。
3. 在 Logger 与 HealthService 中记录连续失败、恢复与限流状态。

### 注意事项

1. 随机延迟必须可配置，便于联调环境降速或关闭。
2. 退避策略只作用于源站调用，不应阻塞输入校验或 formatter。
3. 日志不得记录额外敏感内容，默认仅保留 query 摘要或长度信息。

### 文件变更

#### `04_coding/src/http/http-client.js` [新增]

**职责**：统一处理 GET 请求、超时、响应状态与原始文本返回。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class HttpClient` | 统一 HTTP 请求执行器 |
| 新增 | `public constructor(fetchFn: FetchLike)` | 注入可替换的 fetch 实现 |
| 新增 | `public async getHtml(url: string, options: HttpRequestOptions): Promise<HttpTextResponse>` | 拉取页面 HTML |
| 新增 | `private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>` | 实现请求超时包装 |

#### `04_coding/src/guard/anti-bot-guard.js` [新增]

**职责**：统一生成请求头、随机延迟、退避与可重试判定。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class AntiBotGuard` | 反爬控制核心模块 |
| 新增 | `public constructor(config: RuntimeConfig)` | 读取请求头模板、jitter、退避配置 |
| 新增 | `public async beforeRequest(source: SearchSource, context: SearchRequestContext): Promise<RequestExecutionPolicy>` | 生成本次请求策略 |
| 新增 | `public recordFailure(source: SearchSource, error: SearchError): void` | 写入失败计数与退避状态 |
| 新增 | `public recordSuccess(source: SearchSource): void` | 重置连续失败状态 |
| 新增 | `private createBrowserHeaders(source: SearchSource): Record<string, string>` | 生成浏览器级请求头 |
| 新增 | `private calculateJitterDelay(): number` | 计算随机延迟 |
| 新增 | `private calculateBackoffUntil(source: SearchSource): number | undefined` | 计算短时退避截止时间 |

#### `04_coding/src/logging/search-logger.js` [新增]

**职责**：输出结构化搜索日志与失败事件。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class SearchLogger` | 搜索日志记录器 |
| 新增 | `public info(event: SearchLogEvent): void` | 记录成功或普通事件 |
| 新增 | `public warn(event: SearchLogEvent): void` | 记录降级与结果不足事件 |
| 新增 | `public error(event: SearchLogEvent): void` | 记录失败事件 |
| 新增 | `public createSearchEvent(context: SearchRequestContext, response?: SearchResponse, error?: SearchError): SearchLogEvent` | 统一构建日志对象 |

#### `04_coding/src/health/health-service.js` [新增]

**职责**：维护主备源健康状态、连续失败次数与最近失败原因。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class HealthService` | 搜索源健康服务 |
| 新增 | `public recordSourceSuccess(source: SearchSource): void` | 记录成功并恢复状态 |
| 新增 | `public recordSourceFailure(source: SearchSource, error: SearchError): void` | 记录失败与降级原因 |
| 新增 | `public getHealthCheckResponse(): HealthCheckResponse` | 返回健康检查摘要 |
| 新增 | `public getSourceState(source: SearchSource): SourceHealthSnapshot` | 查询单一搜索源状态 |

#### `04_coding/src/config/runtime-config.js` [新增]

**职责**：集中管理超时、条数、延迟、请求头模板与退避配置。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function loadRuntimeConfig(env?: NodeJS.ProcessEnv): RuntimeConfig` | 从环境变量或默认值加载配置 |
| 新增 | `export function validateRuntimeConfig(config: RuntimeConfig): RuntimeConfig` | 校验配置边界 |
| 新增 | `export function getPublicConfigSummary(config: RuntimeConfig): PublicRuntimeConfigSummary` | 生成健康检查可返回的配置摘要 |

---

## 任务 5：结果消费（前端）搜索结果接入与视图适配

### 实现思路

由于仓库内没有现成 UI 文件，前端消费先以客户端适配层形式实现：一层负责调用扩展统一入口，一层负责根据 `summary` / `detailed` 模式裁剪展示模型。这样既能覆盖路线图中的前端消费任务，也能让后续真实 UI 集成只需绑定到展示组件。历史 `DDG Fallback` 调用路径在客户端层完成替换，不再由页面直接拼接旧接口。

### 关键步骤

1. 新增面向调用方的 web search client，固定调用 `search(request)`。
2. 新增视图模式解析与展示模型映射，兼容 `summary` 与 `detailed`。
3. 在消费层删除旧的 `DDG Fallback` 直接调用分支。

### 注意事项

1. 视图层只消费统一响应，不直接读取主备源内部字段。
2. `summary` 模式应保留必要可读信息，不能只剩链接。
3. 历史调用迁移后必须只有一个搜索入口，避免双路径并存。

### 文件变更

#### `04_coding/src/client/openclaw-search-client.js` [新增]

**职责**：为宿主调用方提供统一搜索客户端，替换历史调用路径。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export class OpenClawSearchClient` | 宿主侧统一搜索客户端 |
| 新增 | `public constructor(extension: OpenClawWebSearchExtension)` | 注入扩展实例 |
| 新增 | `public async search(query: string, options?: SearchClientOptions): Promise<SearchViewModel>` | 发起统一搜索并转换为消费模型 |
| 新增 | `private buildSearchRequest(query: string, options?: SearchClientOptions): SearchRequest` | 构造搜索请求 |

#### `04_coding/src/client/view-mode-resolver.js` [新增]

**职责**：按 `summary` / `detailed` 模式裁剪展示字段。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function resolveOutputMode(options?: SearchClientOptions): OutputMode` | 计算输出模式 |
| 新增 | `export function mapResponseToSummaryView(response: SearchResponse): SearchViewModel` | 生成精简视图 |
| 新增 | `export function mapResponseToDetailedView(response: SearchResponse): SearchViewModel` | 生成详细视图 |

#### `04_coding/src/client/search-result-consumer.js` [新增]

**职责**：消费搜索响应，补充来源标记、相关搜索与结果不足提示。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function consumeSearchResponse(response: SearchResponse, outputMode: OutputMode): SearchViewModel` | 统一结果消费入口 |
| 新增 | `export function mapResultItems(results: SearchResult[], outputMode: OutputMode): SearchResultViewItem[]` | 映射结果项 |
| 新增 | `export function createResultMeta(response: SearchResponse): SearchViewMeta` | 生成来源、partial、relatedSearches 元数据 |

#### `04_coding/src/client/openclaw-search-client.js` [修改]

**职责**：在统一客户端中清理历史回退路径，确保仅保留新扩展入口。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 删除 | `public async searchWithDdgFallback(query: string): Promise<LegacySearchResponse>` | 移除历史直接调用路径 |

---

## 任务 6：异常反馈（前端）降级结果与失败态展示

### 实现思路

异常反馈不由页面临时拼装，而是在消费层统一生成可展示的反馈对象。这样无论是主备切换成功、空结果、部分结果还是全部失败，宿主都能拿到稳定的文案与行为建议。尤其是 `retryable` 标记必须贯穿到前端反馈模型，用于决定是否展示重试操作。

### 关键步骤

1. 把降级成功、部分结果、空结果、全部失败拆成明确状态枚举。
2. 在反馈呈现器中根据 `error`、`partial`、`sourceUsed` 生成展示模型。
3. 为重试按钮、错误提示和空态说明提供统一数据源。

### 注意事项

1. 降级成功属于可用结果，提示语不能等同于失败态。
2. 空结果与系统失败必须分开建模，避免误导用户。
3. 重试能力只由 `retryable` 控制，不由错误文案字符串判断。

### 文件变更

#### `04_coding/src/client/search-feedback-presenter.js` [新增]

**职责**：把响应元数据转换为可展示的异常反馈模型。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function presentSearchFeedback(response: SearchResponse): SearchFeedbackModel` | 统一反馈生成入口 |
| 新增 | `export function createDegradedFeedback(response: SearchResponse): SearchFeedbackModel` | 生成主备切换成功提示 |
| 新增 | `export function createPartialFeedback(response: SearchResponse): SearchFeedbackModel` | 生成结果不足提示 |
| 新增 | `export function createFailureFeedback(error: ErrorPayload): SearchFeedbackModel` | 生成失败态提示 |
| 新增 | `export function createEmptyStateFeedback(response: SearchResponse): SearchFeedbackModel` | 生成空结果提示 |

#### `04_coding/src/client/search-result-consumer.js` [修改]

**职责**：在结果消费中追加错误反馈与重试建议输出。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 修改 | `export function consumeSearchResponse(response: SearchResponse, outputMode: OutputMode): SearchViewModel` | 合并 feedbackModel 与 resultMeta |
| 新增 | `export function shouldShowRetryAction(response: SearchResponse): boolean` | 判断是否展示重试能力 |

#### `04_coding/tests/search-feedback-presenter.test.js` [新增]

**职责**：验证降级成功、空结果、部分结果和失败态的反馈模型。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('presentSearchFeedback returns degraded feedback for fallback success'): void` | 验证降级成功提示 |
| 新增 | `test('presentSearchFeedback returns retryable failure feedback when error.retryable is true'): void` | 验证可重试失败态 |
| 新增 | `test('presentSearchFeedback returns empty state feedback for empty results'): void` | 验证空结果提示 |

---

## 任务 7：部署发布（后端）扩展部署与运行配置落地

### 实现思路

部署阶段必须遵循研发区与生产区隔离原则：研发区保留 `src/`、`tests/`、脚本与联调文件；生产区只保留 `dist/`、元数据、清单和说明文件。扩展入口要在发布时切换为新模块名 `openclaw-web-search`，并从客户端与部署说明中清理历史 `DDG Fallback` 依赖描述。健康检查作为发布后首个验证项，确保部署不是“文件拷贝完成”而是“服务可用”。

### 关键步骤

1. 生成发布产物与 MANIFEST，建立 `extensions/openclaw-web-search/` 目录。
2. 发布 package 元数据、README 与配置示例，不带 `src/`、`tests/`。
3. 在部署验证中执行健康检查并确认旧入口不再被引用。

### 注意事项

1. `extensions/openclaw-web-search/` 中不得出现研发区文件。
2. 发布名、任务目录名与 package 名必须一致。
3. 旧 `DDG Fallback` 仅保留归档，不得继续作为运行依赖。

### 文件变更

#### `04_coding/README.md` [新增]

**职责**：记录研发区构建、测试、发布与联调说明。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `Build: npm run build` | 研发区构建命令 |
| 新增 | `Verify: npm test && npm run test:integration && npm run test:e2e` | 研发区验证命令 |
| 新增 | `Deploy: scripts/deploy-openclaw-web-search.sh` | 部署流程说明 |

#### `04_coding/scripts/deploy-openclaw-web-search.sh` [新增]

**职责**：把研发区产物同步到生产区并执行部署后验证。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `build_release_artifacts()` | 构建发布产物 |
| 新增 | `sync_extension_artifacts()` | 同步到 `extensions/openclaw-web-search/` |
| 新增 | `verify_extension_layout()` | 校验生产区纯净原则 |
| 新增 | `run_post_deploy_health_check()` | 执行部署后健康检查 |

#### `extensions/openclaw-web-search/package.json` [新增]

**职责**：生产区发布元数据，仅声明运行所需内容。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `"name": "openclaw-web-search"` | 生产区命名归一 |
| 新增 | `"main": "dist/index.js"` | 指向发布产物入口 |
| 新增 | `"files": ["dist", "README.md", "MANIFEST.json"]` | 限定发布内容 |

#### `extensions/openclaw-web-search/MANIFEST.json` [新增]

**职责**：记录发布产物、依赖与校验清单。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `"artifacts": ["dist/index.js", "dist/contracts/search-contract.d.ts"]` | 声明核心产物 |
| 新增 | `"healthEndpoint": "internal://openclaw-web-search/health"` | 声明验证入口 |
| 新增 | `"moduleName": "openclaw-web-search"` | 保持命名一致 |

#### `extensions/openclaw-web-search/README.md` [新增]

**职责**：提供部署后的运行说明与健康检查方式。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `Usage: search(request)` | 说明公开调用入口 |
| 新增 | `Health: healthCheck()` | 说明健康检查入口 |
| 新增 | `Config: ddgTimeoutMs / bingTimeoutMs / jitterMinMs / jitterMaxMs` | 说明关键配置项 |

---

## 任务 8：全链路联调（后端）联调测试

### 实现思路

后端联调测试围绕 TRD 的三类关键路径展开：主源成功、主备切换成功、全部失败统一报错。联调测试使用可替换的 fetch/mock HTML 输入，验证的重点不是 DOM 细节重复，而是输出契约、日志字段、健康状态和 fallback 决策是否符合设计。这样可以避免只测单个 adapter 而忽略完整编排链路。

### 关键步骤

1. 建立 orchestrator 级集成测试，串联 router、formatter、logger 与 health。
2. 覆盖主源成功、DDG 失败切 Bing、双源失败三类主链路。
3. 对 healthCheck 与日志事件做断言，保证可观测性可验证。

### 注意事项

1. 联调测试要断言 `sourceUsed`、`partial`、`error.retryable` 等关键字段。
2. 不要只验证 adapter 返回值，必须经过统一入口 `search()`。
3. 健康检查断言要覆盖失败后降级与恢复后的变化。

### 文件变更

#### `04_coding/tests/integration/search-orchestrator.integration.test.js` [新增]

**职责**：验证完整搜索编排链路。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('search returns DDG response on primary success'): Promise<void>` | 验证主源成功链路 |
| 新增 | `test('search returns Bing response when DDG throws retryable error'): Promise<void>` | 验证主备切换链路 |
| 新增 | `test('search returns all_sources_failed payload when both sources fail'): Promise<void>` | 验证双源失败链路 |

#### `04_coding/tests/integration/health-check.integration.test.js` [新增]

**职责**：验证健康检查、失败状态与恢复逻辑。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('healthCheck reports degraded after retryable DDG failures'): Promise<void>` | 验证降级状态 |
| 新增 | `test('healthCheck reports healthy after recovery successes'): Promise<void>` | 验证恢复状态 |

#### `04_coding/tests/integration/search-logging.integration.test.js` [新增]

**职责**：验证结构化日志字段完整性。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('search logger emits source, tookMs, resultCount and failureType fields'): Promise<void>` | 验证日志核心字段 |
| 新增 | `test('search logger does not persist raw sensitive query content outside request metadata policy'): Promise<void>` | 验证日志边界 |

---

## 任务 9：全链路联调（前端）联调测试

### 实现思路

前端联调测试围绕“消费是否正确”而不是“页面长什么样”展开。测试输入直接使用统一 `SearchResponse`，验证 `summary` / `detailed` 输出差异、来源标记、相关搜索、结果不足提示与失败态反馈是否都能被客户端消费层正确建模。这样既适配当前仓库无真实 UI 文件的现状，也能为未来宿主页面接入提供稳定回归基础。

### 关键步骤

1. 用固定响应样本验证两种输出模式映射结果。
2. 覆盖 fallback 成功、结果不足、空结果与失败态的消费逻辑。
3. 验证重试按钮显隐逻辑只受 `retryable` 驱动。

### 注意事项

1. 前端联调必须基于统一响应契约，不直接依赖 adapter 内部返回值。
2. 相关搜索为空时，消费层应返回空数组而非报错。
3. `sourceUsed` 与 `partial` 是展示辅助信息，不能被消费层丢失。

### 文件变更

#### `04_coding/tests/client/search-result-consumer.integration.test.js` [新增]

**职责**：验证前端消费层对两种输出模式和来源信息的处理。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('consumeSearchResponse maps summary mode correctly'): void` | 验证 summary 消费 |
| 新增 | `test('consumeSearchResponse maps detailed mode correctly'): void` | 验证 detailed 消费 |
| 新增 | `test('consumeSearchResponse preserves relatedSearches and sourceUsed metadata'): void` | 验证元数据透传 |

#### `04_coding/tests/client/search-feedback.integration.test.js` [新增]

**职责**：验证降级成功、失败态与重试提示的前端联调行为。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `test('presentSearchFeedback marks fallback success as usable result'): void` | 验证降级成功提示 |
| 新增 | `test('shouldShowRetryAction returns true only for retryable failures'): void` | 验证重试逻辑 |
| 新增 | `test('presentSearchFeedback distinguishes empty results from hard failures'): void` | 验证空结果与失败分离 |

---

## 任务 10：全链路联调演示

### 实现思路

演示任务的目标是把前九个任务沉淀成可重复运行的脚本与样本，而不是人工口头说明。演示脚本应至少覆盖主源成功、主备切换成功、双源失败三种路径，并打印健康检查、来源、结果数和反馈摘要，供评审快速确认系统符合 PRD。所有演示输入输出都基于统一契约，避免临时写死字段导致与正式实现脱节。

### 关键步骤

1. 准备三组演示样本：主源成功、降级成功、全部失败。
2. 编写演示脚本串联 `search()` 与 `healthCheck()`，输出关键字段。
3. 在 README 中记录演示命令、预期现象与验证点。

### 注意事项

1. 演示脚本应复用正式入口，不允许绕过 orchestrator 直调 adapter。
2. 演示输出必须包含 `sourceUsed`、`tookMs`、`partial`、`retryable`。
3. 演示样本应与联调测试样本保持一致的字段结构。

### 文件变更

#### `04_coding/scripts/demo-web-search.js` [新增]

**职责**：执行主源成功、降级成功与失败回退三类演示流程。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `async function runPrimarySuccessDemo(): Promise<void>` | 演示 DDG 主源成功 |
| 新增 | `async function runFallbackSuccessDemo(): Promise<void>` | 演示 DDG 失败后 Bing 成功 |
| 新增 | `async function runFailureDemo(): Promise<void>` | 演示双源失败与 retryable 输出 |
| 新增 | `async function printHealthSummary(): Promise<void>` | 打印健康检查摘要 |
| 新增 | `async function main(): Promise<void>` | 统一演示入口 |

#### `04_coding/demo/demo-fixtures.js` [新增]

**职责**：维护演示与联调共享的样本数据。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `export function createPrimarySuccessFixture(): DemoSearchFixture` | 主源成功样本 |
| 新增 | `export function createFallbackSuccessFixture(): DemoSearchFixture` | 降级成功样本 |
| 新增 | `export function createFailureFixture(): DemoSearchFixture` | 全部失败样本 |

#### `04_coding/README.md` [修改]

**职责**：补充演示命令、预期结果与评审核对点。

| 操作 | 签名 | 说明 |
|----|-----|-----|
| 新增 | `Demo: node scripts/demo-web-search.js` | 演示执行命令 |
| 修改 | `Verify: npm test && npm run test:integration && npm run test:e2e` | 补充演示前验证要求 |

---

## 附录：数据库/配置变更（如有）

### 数据库变更

本需求无数据库变更。

### 配置变更

| 文件 | 配置项 | 值 | 说明 |
|------|-------|---|------|
| `04_coding/.env.example` | `DDG_TIMEOUT_MS` | `3000` | DuckDuckGo 主源超时 |
| `04_coding/.env.example` | `BING_TIMEOUT_MS` | `3000` | Bing 备用源超时 |
| `04_coding/.env.example` | `SEARCH_DEFAULT_LIMIT` | `10` | 默认结果条数 |
| `04_coding/.env.example` | `SEARCH_MAX_LIMIT` | `20` | 最大结果条数 |
| `04_coding/.env.example` | `SEARCH_JITTER_MIN_MS` | `200` | 最小随机延迟 |
| `04_coding/.env.example` | `SEARCH_JITTER_MAX_MS` | `800` | 最大随机延迟 |
| `04_coding/.env.example` | `SEARCH_BACKOFF_BASE_MS` | `1000` | 连续失败后的基础退避时长 |
| `04_coding/.env.example` | `SEARCH_LOG_QUERY_POLICY` | `hash` | 日志中查询词记录策略 |
| `extensions/openclaw-web-search/README.md` | `healthEndpoint` | `internal://openclaw-web-search/health` | 发布后健康检查入口 |
