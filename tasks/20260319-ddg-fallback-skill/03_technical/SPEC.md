# DuckDuckGo Fallback Skill 技术详述（SPEC）

## 实验元数据

- 阶段：`03_technical`
- 模式：Plan-and-Execute（B 组贤者方案）
- 开始时间：2026-03-19 10:30
- 输入：`02_roadmapping/ROADMAP.md`
- 输出：`03_technical/SPEC.md`

## Plan-and-Execute 设计步骤

### 设计步骤清单

1. 读取 `02_roadmapping/ROADMAP.md`，锁定 B 组交付范围与模块边界。
2. 将路线图中的核心任务映射为可落地的技术对象：状态机、错误分类器、DDG 适配、配置、日志、测试。
3. 细化 Gemini -> DDG 的状态流转、输入输出契约与最终错误出口。
4. 设计可复用的错误分类器，明确 fallback 触发规则与不可降级规则。
5. 设计秒级切换机制，保证 fallback 决策在 `<5s` 内完成。
6. 设计 DDG direct import 适配方案，避免子进程开销并统一结果结构。
7. 设计可观测性字段、埋点时机与测试验证方案。
8. 回读并校验 SPEC 是否覆盖路线图中的核心任务、风险与验收项。

### 逐步执行记录

| 步骤 | 执行动作 | 结论 |
|------|----------|------|
| 1 | 阅读路线图与 PRD 约束 | 当前技术设计范围聚焦后端 Skill 运行时，无前端内容 |
| 2 | 识别路线图核心任务 | 需要覆盖 fallback 核心、错误分类、DDG 适配、配置、日志、测试 |
| 3 | 细化状态机 | 状态机采用单请求单实例上下文，主路径为 Gemini，降级路径为 DDG |
| 4 | 细化错误分类器 | 使用规则优先级匹配 429/503/Timeout/Network/Error Empty Response |
| 5 | 设计秒级切换 | 采用双层超时：`fallbackDecisionTimeoutMs=4500` 与 `geminiHardTimeoutMs=30000` |
| 6 | 设计 DDG 适配 | 采用 direct import + adapter 封装，禁止子进程 |
| 7 | 设计可观测性 | 使用结构化日志记录原因、时间、重试次数、最终 Provider |
| 8 | 完整性校验 | 已覆盖用户指定 5 个核心设计与路线图涉及模块 |

## 1. 设计目标

本 SPEC 严格承接 `02_roadmapping/ROADMAP.md` 的 B 组贤者方案，目标是在 `web_search` 主 Provider 为 Gemini 的前提下，提供一个可配置、可观测、秒级决策的 DuckDuckGo fallback 技术方案。

核心约束如下：

- 用户无感：调用方始终面向统一的 `smartSearch()` 接口。
- 快速决策：可降级错误必须在 `<5s` 内完成 fallback 决策。
- 结果统一：Gemini 与 DDG 输出需转换为同一结果结构。
- 错误可分流：仅对可恢复错误触发 fallback，配置错误和认证错误直接抛出。
- 可观测：全链路记录 fallback 原因、耗时、重试次数与最终 Provider。

## 2. 模块设计

### 2.1 模块职责

- `src/index.ts`：Skill 入口，导出 `smartSearch()`，拼装配置、logger、provider 实例。
- `src/fallback-manager.ts`：管理状态机、超时、重试、fallback 决策与最终结果。
- `src/error-classifier.ts`：负责错误标准化与 fallback 分类。
- `src/ddg-adapter.ts`：直接 import DDG Provider，并将输入输出映射到统一结构。
- `src/types.ts`：声明请求、结果、错误分类、日志事件、配置等类型。
- `tests/fallback.test.ts`：覆盖主链路、fallback、DDG 重试、最终失败场景。
- `tests/error-classifier.test.ts`：覆盖 429/503/Timeout/网络错误/空响应/不可降级错误。

### 2.2 核心接口

```ts
export interface SmartSearchInput {
  query: string;
  count?: number;
  requestId?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface SmartSearchResult {
  provider: 'gemini' | 'ddg';
  items: SearchResultItem[];
  fallbackUsed: boolean;
  timingMs: number;
  attempts: {
    gemini: number;
    ddg: number;
  };
}

export interface FallbackConfig {
  enabled: boolean;
  maxDdgRetries: number;
  fallbackDecisionTimeoutMs: number;
  geminiHardTimeoutMs: number;
  ddgTimeoutMs: number;
  triggerOnEmptyResponse: boolean;
}
```

## 3. 状态机设计

### 3.1 状态定义

Gemini -> DDG 采用显式状态机，避免把控制流分散在多个 `try/catch` 中。

| 状态 | 含义 | 进入条件 | 退出条件 |
|------|------|----------|----------|
| `INIT` | 接收搜索请求，初始化上下文 | `smartSearch()` 被调用 | 构建上下文完成 |
| `GEMINI_RUNNING` | 调用 Gemini 主 Provider | 进入主搜索阶段 | 成功 / 失败 / 达到 fallback 决策超时 |
| `GEMINI_SUCCEEDED` | Gemini 成功返回且结果有效 | Gemini 成功且未命中空响应规则 | 直接返回结果 |
| `GEMINI_FAILED_CLASSIFIABLE` | Gemini 失败且可触发 fallback | 分类器返回 `fallback` | 进入 `FALLBACK_PENDING` |
| `GEMINI_FAILED_FATAL` | Gemini 失败但不可降级 | 分类器返回 `fatal` | 抛出错误 |
| `FALLBACK_PENDING` | 记录原因并准备切换 DDG | 命中 fallback 条件 | 进入 `DDG_RUNNING` |
| `DDG_RUNNING` | 调用 DDG 适配层 | fallback 启动 | 成功 / 可重试失败 / 最终失败 |
| `DDG_RETRY_WAIT` | DDG 重试前等待 | DDG 可重试失败且未达上限 | 返回 `DDG_RUNNING` |
| `DDG_SUCCEEDED` | DDG 成功返回 | DDG 结果有效 | 直接返回结果 |
| `FAILED_FINAL` | Gemini 与 DDG 均不可用 | DDG 达到最终失败 | 抛出统一最终错误 |

### 3.2 状态转移图

```text
INIT
  -> GEMINI_RUNNING

GEMINI_RUNNING
  -> GEMINI_SUCCEEDED            (Gemini 成功)
  -> GEMINI_FAILED_CLASSIFIABLE  (429/503/Timeout/Network/EmptyResponse)
  -> GEMINI_FAILED_FATAL         (401/403/InvalidQuery/ParseError 等)

GEMINI_FAILED_CLASSIFIABLE
  -> FALLBACK_PENDING
  -> DDG_RUNNING

DDG_RUNNING
  -> DDG_SUCCEEDED               (DDG 成功)
  -> DDG_RETRY_WAIT              (DDG 临时失败且重试次数未超限)
  -> FAILED_FINAL                (DDG 最终失败)

DDG_RETRY_WAIT
  -> DDG_RUNNING
```

### 3.3 状态机执行原则

**单次请求内**：
- 单次请求只允许触发一次 Gemini -> DDG 切换，**不允许在单次请求内回切 Gemini**。
- `fallbackUsed` 在状态进入 `FALLBACK_PENDING` 时立即置为 `true`。
- 状态上下文统一保存 `requestId`、开始时间、分类结果、重试次数、最终 Provider。
- 当 Gemini 已进入 `GEMINI_FAILED_CLASSIFIABLE`，必须主动 abort 原请求，避免资源泄漏。

**跨请求健康检查（回切逻辑）**：

> **主人质询**：当 Gemini 恢复正常后，系统是否会自动切换回 Gemini（以节省本地 CPU）？

**回答**：是的，通过**跨请求健康检查机制**实现自动回切。

```typescript
// 全局健康状态（跨请求共享）
interface GeminiHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastSuccessAt?: number;      // 最后一次成功时间
  lastFailureAt?: number;      // 最后一次失败时间
  consecutiveFailures: number; // 连续失败次数
  nextRetryAt?: number;        // 下次重试时间（用于熔断）
}

// 回切策略
const HEALTH_CHECK_CONFIG = {
  // Gemini 连续失败 3 次后，进入熔断状态，临时禁用 Gemini
  failureThreshold: 3,
  
  // 熔断后等待 5 分钟，然后尝试恢复 Gemini
  circuitBreakerTimeoutMs: 5 * 60 * 1000,
  
  // 连续成功 2 次后，确认 Gemini 已恢复健康
  recoveryThreshold: 2,
};
```

**回切状态机**：

```
Gemini 健康状态流转：

HEALTHY（健康）
  → 连续失败 3 次
  ↓
UNHEALTHY（不健康，熔断）
  → 等待 5 分钟
  ↓
DEGRADED（降级，半开状态）
  → 尝试 1 次请求
  ↓
  ┌─成功 2 次─→ HEALTHY（恢复）
  │
  └─失败─→ UNHEALTHY（重新熔断）
```

**实现位置**：
- 在 `fallback-manager.ts` 中添加全局健康状态管理
- 每次请求前检查 `GeminiHealthStatus`
- 如果 Gemini 处于 `UNHEALTHY` 且未到 `nextRetryAt`，直接走 DDG（跳过 Gemini）
- 如果 Gemini 恢复健康，自动回切（节省本地 CPU）

**收益**：
- 避免在 Gemini 故障期间持续浪费请求
- Gemini 恢复后自动回切，无需人工干预
- 通过健康状态共享，减少不必要的 DDG 调用（节省本地 CPU）

## 4. 错误分类器设计

### 4.1 设计目标

错误分类器负责把 Gemini 抛出的任意异常标准化为可执行决策，输出以下三类之一：

- `success`：无错误，直接返回 Gemini 结果。
- `fallback`：允许切换到 DDG。
- `fatal`：不应 fallback，直接抛错给调用方。

### 4.2 分类结果结构

```ts
export interface ClassifiedError {
  decision: 'fallback' | 'fatal';
  reasonCode:
    | 'gemini_rate_limited'
    | 'gemini_service_unavailable'
    | 'gemini_timeout'
    | 'gemini_network_error'
    | 'gemini_empty_response'
    | 'gemini_auth_error'
    | 'gemini_permission_error'
    | 'gemini_invalid_request'
    | 'unknown_error';
  retryable: boolean;
  source: 'http_status' | 'timeout' | 'network' | 'response_body' | 'runtime';
  rawMessage: string;
  rawStatus?: number;
}
```

### 4.3 识别规则

分类器按优先级从高到低匹配，避免同一错误命中多个分支。

| 优先级 | 条件 | 决策 | reasonCode |
|--------|------|------|------------|
| 1 | HTTP 状态码 `429`，或 message 包含 `429` / `Too Many Requests` | `fallback` | `gemini_rate_limited` |
| 2 | HTTP 状态码 `503`，或 message 包含 `503` / `Service Unavailable` | `fallback` | `gemini_service_unavailable` |
| 3 | `AbortError` 且触发源为 fallback 决策超时，或 message 包含 `Timeout` / `ETIMEDOUT` | `fallback` | `gemini_timeout` |
| 4 | code/message 包含 `ECONNRESET` / `ENOTFOUND` / `Network Error` / `fetch failed` | `fallback` | `gemini_network_error` |
| 5 | Gemini 调用成功但 `items.length === 0` 且 `triggerOnEmptyResponse=true` | `fallback` | `gemini_empty_response` |
| 6 | HTTP `401` 或 message 包含 `Invalid API Key` / `Unauthorized` | `fatal` | `gemini_auth_error` |
| 7 | HTTP `403` 或 message 包含 `Forbidden` | `fatal` | `gemini_permission_error` |
| 8 | message 包含 `Invalid Query` / `PARSE_ERROR` / schema 校验失败 | `fatal` | `gemini_invalid_request` |
| 9 | 其他未识别错误 | 默认 `fatal` | `unknown_error` |

### 4.4 分类器实现要求

- 输入必须支持 `Error`、HTTP 响应异常、自定义对象和字符串异常。
- 所有匹配最终都输出标准化 `ClassifiedError`，禁止在业务层直接解析原始 message。
- 分类器必须纯函数化，便于单元测试与未来扩展更多 Provider。
- `429/503/Timeout` 规则属于强制 fallback 触发规则，不允许被外层吞掉。

## 5. 秒级切换方案（fallback 决策 <5 秒）

### 5.1 约束澄清

PRD 同时给出了 `30s` 超时上限和“快速失败，5 秒内启动 fallback”的目标。为同时满足二者，本方案采用“双层超时”模型：

- `fallbackDecisionTimeoutMs = 4500`：用于用户体验与实验目标；超过该时限仍未得到 Gemini 有效结果，则触发 fallback 决策。
- `geminiHardTimeoutMs = 30000`：用于资源保护；若未进入 fallback 或处于诊断模式，则作为硬超时兜底。

也就是说，默认生产链路优先执行 `<5s` 的 fallback 决策；`30s` 保留为系统级安全上限，而不是常规等待时长。

### 5.2 实现机制

1. 发起 Gemini 请求时创建两个 `AbortController` 语义：
   - 决策级超时控制器：`setTimeout(4500)`。
   - 硬超时控制器：`setTimeout(30000)`。
2. 如果 Gemini 在 `4500ms` 内返回有效结果，立即走成功分支。
3. 如果在 `4500ms` 内返回 429/503/网络错误，也立即进入 fallback。
4. 如果 `4500ms` 到期仍无有效结果：
   - 标记 `reasonCode=gemini_timeout`
   - 主动 abort Gemini 请求
   - 在同一事件循环内切换到 DDG
5. DDG 阶段使用独立超时 `ddgTimeoutMs`，默认 `10000~15000ms`。

### 5.3 时序预算

| 阶段 | 预算 |
|------|------|
| Gemini 成功窗口 | `0-4500ms` |
| fallback 决策与日志落盘 | `<200ms` |
| DDG 首次调用启动 | `<=4700ms` |
| DDG 单次调用超时 | `10000-15000ms` |

结论：即使 Gemini 完全无响应，系统也能在约 `4.7s` 内进入 DDG 调用，满足“秒级切换”要求。

## 6. DDG 适配设计（direct import，非子进程）

### 6.1 设计决策

DDG 集成必须采用 direct import 方案，不允许通过 `child_process.spawn()` 或 shell 脚本调用。原因如下：

- 避免子进程创建成本，缩短 fallback 启动时间。
- 保持异常堆栈与类型信息，便于分类和日志归因。
- 便于在同一进程共享配置、logger 和测试 mock。

### 6.2 适配模式

`src/ddg-adapter.ts` 负责屏蔽外部 Provider 的路径、构造与结果差异。

```ts
import { DuckDuckGoSearchProvider } from '<ddg-provider-entry>';

export class DdgAdapter {
  private readonly provider: DuckDuckGoSearchProvider;

  constructor() {
    this.provider = new DuckDuckGoSearchProvider();
  }

  async search(input: SmartSearchInput): Promise<SmartSearchResult> {
    // 1. 调用 DDG provider
    // 2. 把外部响应映射成统一结果
    // 3. 对外只暴露 provider='ddg' 的标准对象
  }
}
```

### 6.3 入口解析策略（物理连接确认）

**明确 DDG Provider 调用路径**：

```typescript
// src/ddg-adapter.ts 中的实际 import 语句
import { DuckDuckGoSearchProvider } from 
  '/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';

// 或通过配置注入（推荐，便于测试）
const DDG_PROVIDER_PATH = process.env.DDG_PROVIDER_PATH || 
  '/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';

const { DuckDuckGoSearchProvider } = await import(DDG_PROVIDER_PATH);
```

**物理连接说明**：
- DDG Provider 源码位置：`/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/`
- 构建产物位置：`.../dist/src/index.js`
- 已实现功能：指数退避重试、代理支持、ESM 模块
- Gitee 仓库：`https://gitee.com/cola16/openclaw-evolution.git`

**集成方式**：
- **方案 A（推荐）**：direct import + 动态加载，便于测试 mock
- **方案 B（备选）**：将 DDG Provider 发布为 npm 包，通过 `npm install` 集成
- **禁止**：子进程调用（性能差、错误处理复杂）

### 6.4 结果归一化要求

DDG 结果必须映射为 `SmartSearchResult`：

- `provider` 固定为 `ddg`
- `fallbackUsed` 固定为 `true`
- `items` 统一为 `{ title, url, snippet }[]`
- `attempts.ddg` 记录真实重试次数

## 7. 可观测性设计

### 7.1 日志事件

至少记录以下结构化事件：

- `search.request.started`
- `search.gemini.succeeded`
- `search.gemini.failed`
- `search.fallback.triggered`
- `search.ddg.retry`
- `search.ddg.succeeded`
- `search.search.failed_final`

### 7.2 必填日志字段

用户要求的核心字段必须强制存在：

| 字段 | 说明 |
|------|------|
| `requestId` | 请求唯一标识，串联全链路 |
| `queryHash` | 查询内容摘要，避免原文直接入日志 |
| `reasonCode` | fallback 原因，如 `gemini_rate_limited` |
| `occurredAt` | 触发时间，ISO 8601 字符串 |
| `elapsedMs` | 当前阶段耗时 |
| `retryCount` | 当前 Provider 已重试次数 |
| `finalProvider` | 最终返回结果的 Provider：`gemini` 或 `ddg` |
| `fallbackUsed` | 是否触发过 fallback |
| `geminiAttempted` | 是否执行过 Gemini |
| `ddgAttempted` | 是否执行过 DDG |
| `errorMessage` | 原始错误摘要 |

### 7.3 埋点时机

- Gemini 失败并完成分类后，立即记录 `search.gemini.failed`。
- 状态切换到 `FALLBACK_PENDING` 时，立即记录 `search.fallback.triggered`。
- DDG 每次重试前记录 `search.ddg.retry`，包含 `retryCount`。
- 最终成功或失败时，统一记录 `finalProvider` 与总耗时。

### 7.4 指标建议

除日志外，建议同步累积以下计数指标：

- `fallback_trigger_total{reasonCode}`
- `provider_success_total{provider}`
- `provider_failure_total{provider,reasonCode}`
- `fallback_decision_latency_ms`
- `search_total_latency_ms`

## 8. 配置设计

### 8.1 配置项

```json
{
  "fallback": {
    "enabled": true,
    "maxDdgRetries": 3,
    "fallbackDecisionTimeoutMs": 4500,
    "geminiHardTimeoutMs": 30000,
    "ddgTimeoutMs": 12000,
    "triggerOnEmptyResponse": true,
    "ddgProviderEntry": "/abs/path/to/ddg/dist/src/index.js"
  }
}
```

### 8.2 默认值原则

- 默认开启 fallback，符合 PRD 的 P0 战略后备能力定位。
- `fallbackDecisionTimeoutMs` 默认 `4500`，为 `<5s` 留出日志和切换缓冲。
- `maxDdgRetries` 默认 `3`，与 PRD 和路线图一致。
- `ddgProviderEntry` 必填；缺失时启动阶段即报错，避免运行期才发现配置问题。

## 9. 失败处理与最终错误出口

- Gemini 命中 `fatal` 分类时，直接抛出 `SmartSearchError`，不尝试 DDG。
- DDG 达到最大重试次数后，抛出统一最终错误：
  - 包含 `primaryReasonCode`
  - 包含 `fallbackTried=true`
  - 包含 `ddgAttempts`
  - 包含 `finalProvider='ddg'`
- 最终错误需要同时保留 Gemini 原始原因和 DDG 最后一次失败摘要，便于排障。

## 10. 测试与验证策略

### 10.1 单元测试矩阵

| 场景 | 预期 |
|------|------|
| Gemini 正常返回 | 不触发 fallback，`finalProvider=gemini` |
| Gemini 返回 429 | 立即 fallback 到 DDG |
| Gemini 返回 503 | 立即 fallback 到 DDG |
| Gemini 在 `4500ms` 内无响应 | 触发超时 fallback，决策耗时 `<5s` |
| Gemini 网络错误 | fallback 到 DDG |
| Gemini 空响应 | 按配置决定是否 fallback |
| Gemini 401/403 | 直接抛错，不触发 fallback |
| DDG 首次失败后二次成功 | 记录 retry 日志并返回 DDG 结果 |
| DDG 连续失败 3 次 | 抛出最终错误 |

### 10.2 验证重点

- 验证分类器对 `429/503/Timeout` 的识别优先级。
- 验证 fallback 决策事件在 `<5s` 内记录。
- 验证 direct import 模式下 DDG adapter 可被 mock，且不依赖子进程。
- 验证日志中包含原因、时间、重试次数、最终 Provider 四个必填字段。

## 11. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| DDG import 路径变动 | 运行时无法加载 fallback Provider | 将路径集中到 `ddgProviderEntry` 配置，并在启动时校验 |
| Gemini 超时语义与 `<5s` 目标冲突 | 无法满足快速切换 | 采用双层超时，区分决策超时与硬超时 |
| 外部 Provider 错误格式不稳定 | 分类器误判 | 在分类器入口先做标准化，缺省走 `unknown_error` |
| 日志字段不一致 | 实验数据不可比 | 在 `types.ts` 中定义统一日志 schema |

## 12. 实施顺序建议

1. 先实现 `types.ts` 与 `error-classifier.ts`，锁定数据契约和原因码。
2. 再实现 `fallback-manager.ts` 状态机与双层超时控制。
3. 随后实现 `ddg-adapter.ts` direct import 与结果归一化。
4. 最后补 `index.ts` 装配、结构化日志和测试。

## 13. Context Caching 优化（实验数据注入）

**主人要求**：利用 Context Caching 将 01/02 阶段的核心约束作为"静态前缀"注入到 OpenCode 上下文中。

**实现方案**：

在 04_coding 阶段开始时，通过**系统提示词前缀**注入以下静态约束：

```typescript
// 04_coding 阶段的 System Prompt 前缀（用于 Context Caching）
const SYSTEM_PROMPT_PREFIX = `
=== 核心约束（来自 01_designing/PRD.md）===
1. Fallback 触发条件：429/503/Timeout/Network Error/Empty Response
2. 秒级切换：fallback 决策 <5 秒（双层超时：4500ms + 30000ms）
3. 禁止子进程：DDG 必须 direct import，禁止 spawn
4. 可观测性：记录原因、时间、重试次数、最终 Provider

=== 架构约束（来自 02_roadmapping/ROADMAP.md）===
1. 模块职责：
   - index.ts: Skill 入口，导出 smartSearch()
   - fallback-manager.ts: 状态机管理
   - error-classifier.ts: 错误分类器
   - ddg-adapter.ts: DDG 适配层
   - types.ts: 类型定义
2. 状态机：Gemini → DDG 单向切换，跨请求健康检查实现回切
3. 错误分类：429/503/Timeout → fallback，401/403 → fatal

=== 物理连接（来自 03_technical/SPEC.md）===
1. DDG Provider 路径：
   /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js
2. 回切逻辑：连续失败 3 次熔断，5 分钟后尝试恢复，连续成功 2 次确认健康
3. 日志字段：requestId, reasonCode, occurredAt, elapsedMs, retryCount, finalProvider

=== A/B 实验约束 ===
1. 本任务为 B 组（Plan-and-Execute 模式）
2. 必须按步骤执行，每步验证
3. 记录 Token 用量、步骤执行时间、迭代次数
`;

// 使用方式：在 04_coding 阶段开始时，将此作为 system prompt 前缀
// 这样后续所有步骤都复用此上下文，避免重复理解（节省 Token）
```

**Context Caching 效果预测**：
- **04_coding 阶段**：预计节省 30-40% Token（无需重复理解约束）
- **代码质量提升**：减少因遗忘约束导致的返工
- **执行效率**：每步直接聚焦实现，无需重新阅读文档

**实施步骤**：
1. 在 04_coding 阶段开始时，先写入 `CONTEXT_PREFIX.md`
2. 每次调用 OpenCode 时，通过 `--system-prompt` 或环境变量注入
3. 在会话日志中记录"缓存命中率"（复用前缀的次数）

---

## 14. 评审结论

本 SPEC 已严格基于 `02_roadmapping/ROADMAP.md` 的 B 组贤者方案展开，并明确落地以下核心设计：

- ✅ **物理连接**：明确 DDG Provider import 路径（绝对路径 + 配置注入）
- ✅ **状态机闭环**：跨请求健康检查实现 Gemini 自动回切
- ✅ **秒级切换**：双层超时（4500ms 决策 + 30000ms 硬上限）
- ✅ **错误分类**：429/503/Timeout → fallback，401/403 → fatal
- ✅ **可观测性**：原因、时间、重试次数、最终 Provider 全记录
- ✅ **DDG 适配**：direct import 非子进程方案
- ✅ **Context Caching**：01/02 约束作为静态前缀注入 04 阶段

该文档可直接作为 `04_coding` 阶段的实现输入。
