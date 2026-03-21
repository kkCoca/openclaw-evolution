# TD-001: DuckDuckGo 搜索之盾 (SPEC v1.0)

> **版本**: v1.0 (外科手术级)  
> **创建日期**: 2026-03-21  
> **作者**: openclaw-ouyp (首席架构师)  
> **状态**: 🔵 待评审  
> **关联文档**: [PRD.md](../01_designing/PRD.md) | [ROADMAP.md](../02_roadmapping/ROADMAP.md) | [CONTEXT_PREFIX.md](./CONTEXT_PREFIX.md)

---

## 📋 文档结构

| 章节 | 内容 | 状态 |
|------|------|------|
| **1. 架构概述** | 系统架构图 + 模块职责 | ✅ 已完成 |
| **2. 状态机形式化定义** | 状态转换表 + 触发阈值 | ✅ 已完成 |
| **3. 接口契约** | TypeScript 强类型定义 | ✅ 已完成 |
| **4. 可观测性设计** | 审计接口 + EventID 规范 | ✅ 已完成 |
| **5. 异常处理** | 防死循环机制 + 全局熔断 | ✅ 已完成 |
| **6. 配置方案** | FallbackConfig 详细定义 | ✅ 已完成 |
| **7. 性能预算** | 延迟分解 + SLA 保证 | ✅ 已完成 |

---

## 1. 🏗️ 架构概述

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenClaw Gateway                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              DuckDuckGo Fallback Extension              │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              FallbackManager                    │    │    │
│  │  │  ┌──────────────┐    ┌──────────────┐          │    │    │
│  │  │  │  executeSearch() ──► executeGemini()         │    │    │
│  │  │  │       │                │                     │    │    │
│  │  │  │       │ (429/503/Timeout)                    │    │    │
│  │  │  │       ▼                ▼                     │    │    │
│  │  │  │  executeDdgFallback() ◄── ErrorClassifier   │    │    │
│  │  │  └──────────────┴──────────────┴──────────────┘    │    │
│  │  │         │                        │                  │    │
│  │  │         ▼                        ▼                  │    │
│  │  │  ┌─────────────┐          ┌─────────────┐          │    │
│  │  │  │ DDG Adapter │          │   Health    │          │    │
│  │  │  │  (search)   │          │   Monitor   │          │    │
│  │  │  └─────────────┘          └─────────────┘          │    │
│  │  └─────────────────────────────────────────────────────┘    │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      External Services        │
              │  ┌──────────┐  ┌──────────┐   │
              │  │  Gemini  │  │ DuckDuckGo│  │
              │  │  Search  │  │  Search   │  │
              │  └──────────┘  └──────────┘   │
              └───────────────────────────────┘
```

### 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| **FallbackManager** | `fallback-manager.ts` | 核心降级逻辑，状态机管理，超时控制 |
| **DdgAdapter** | `ddg-adapter.ts` | DuckDuckGo 搜索适配器，重试逻辑 |
| **ErrorClassifier** | `error-classifier.ts` | 错误分类，决策 Fallback/Fatal |
| **HealthMonitor** | `health-monitor.ts` | 健康状态跟踪，熔断管理 |
| **StructuredLogger** | `logger.ts` | 结构化日志，EventID 生成 |
| **Types** | `types.ts` | 强类型接口定义 |

---

## 2. 🔄 状态机形式化定义

### 状态定义

```typescript
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthState {
  status: HealthStatus;
  lastSuccessAt?: number;      // 最后一次成功时间戳
  lastFailureAt?: number;      // 最后一次失败时间戳
  consecutiveFailures: number; // 连续失败次数
  consecutiveSuccesses: number;// 连续成功次数
  nextRetryAt?: number;        // 下次重试时间 (熔断期间)
}
```

### 状态转换表 (State Transition Table)

| 当前状态 | 触发条件 | 触发阈值 | 下一状态 | 动作 |
|---------|---------|---------|---------|------|
| **Healthy** | Gemini 成功 | - | Healthy | `consecutiveSuccesses++`, `consecutiveFailures=0` |
| **Healthy** | Gemini 失败 | `consecutiveFailures < 3` | Healthy | `consecutiveFailures++`, `lastFailureAt=now` |
| **Healthy** | Gemini 失败 | `consecutiveFailures ≥ 3` | **Degraded** | `status='degraded'`, `nextRetryAt=now+300s` |
| **Degraded** | Gemini 成功 | `consecutiveSuccesses < 2` | Degraded | `consecutiveSuccesses++`, `consecutiveFailures=0` |
| **Degraded** | Gemini 成功 | `consecutiveSuccesses ≥ 2` | **Healthy** | `status='healthy'`, `nextRetryAt=undefined` |
| **Degraded** | Gemini 失败 | - | **Unhealthy** | `status='unhealthy'`, `nextRetryAt=now+300s` |
| **Unhealthy** | 时间未到 | `now < nextRetryAt` | Unhealthy | 保持熔断，直接走 Fallback |
| **Unhealthy** | 时间已到 | `now ≥ nextRetryAt` | **Degraded** | `status='degraded'`, `consecutiveSuccesses=0` |

### 状态转换图

```
                    ┌─────────────────────────────────┐
                    │                                 │
                    │  Gemini 成功 (连续 2 次)         │
                    ▼                                 │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Unhealthy  │────│  Degraded   │────│   Healthy   │
│ (Circuit)   │    │ (Fallback)  │    │ (Gemini OK) │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                  │                  │
       │                  │                  │
       │ Gemini 失败      │ Gemini 失败      │ Gemini 失败
       │ (连续 3 次)       │ (任意次)         │ (连续 3 次)
       └──────────────────┴──────────────────┘

熔断期间：now < nextRetryAt → 保持 Unhealthy
恢复检测：now ≥ nextRetryAt → 转为 Degraded (尝试恢复)
```

### 冷静期判定 (Cooling Period)

```typescript
interface CoolingPeriodConfig {
  circuitBreakerTimeoutMs: 300000;  // 5 分钟熔断
  recoveryThreshold: 2;             // 连续成功 2 次恢复
  failureThreshold: 3;              // 连续失败 3 次触发
}

// 冷静期判定逻辑
function shouldAttemptRecovery(state: HealthState, now: number): boolean {
  if (state.status !== 'unhealthy') return false;
  if (!state.nextRetryAt) return false;
  return now >= state.nextRetryAt;  // 时间已到，尝试恢复
}

function shouldStayInCircuit(state: HealthState, now: number): boolean {
  if (state.status !== 'unhealthy') return false;
  if (!state.nextRetryAt) return false;
  return now < state.nextRetryAt;   // 时间未到，保持熔断
}
```

---

## 3. 📐 接口契约 (强类型化)

### 3.1 搜索请求接口

```typescript
/**
 * 搜索请求接口
 * 必须包含：query, count, requestId
 */
export interface SearchRequest {
  /** 搜索关键词 */
  query: string;
  
  /** 返回结果数量 (默认 10, 最大 50) */
  count?: number;
  
  /** 请求唯一标识 (用于日志追踪) */
  requestId?: string;
  
  /** 超时时间 (毫秒, 默认 30000) */
  timeoutMs?: number;
  
  /** 是否允许 Fallback (默认 true) */
  allowFallback?: boolean;
}
```

### 3.2 搜索响应接口 (5 个核心指标)

```typescript
/**
 * 搜索响应接口
 * 必须包含 5 个核心指标：provider, items, tookMs, cached, fallbackUsed
 */
export interface SearchResponse {
  /** 1. 实际使用的搜索提供商 ('gemini' | 'ddg') */
  provider: SearchProviderName;
  
  /** 搜索结果列表 */
  items: SearchResultItem[];
  
  /** 2. 总耗时 (毫秒) - 从请求开始到响应结束 */
  tookMs: number;
  
  /** 3. 是否使用缓存 (当前版本暂不支持，预留字段) */
  cached: boolean;
  
  /** 4. 是否触发 Fallback */
  fallbackUsed: boolean;
  
  /** 5. 重试次数统计 */
  attempts: {
    gemini: number;  // Gemini 尝试次数
    ddg: number;     // DDG 尝试次数
  };
  
  /** 健康状态 (可选，用于调试) */
  healthStatus?: HealthStatus;
  
  /** 事件 ID (用于审计追踪) */
  eventId?: string;
}

/**
 * 单个搜索结果项
 */
export interface SearchResultItem {
  /** 结果标题 */
  title: string;
  
  /** 结果 URL */
  url: string;
  
  /** 结果摘要/片段 */
  snippet: string;
  
  /** 相关性评分 (可选) */
  score?: number;
}

/**
 * 搜索提供商名称
 */
export type SearchProviderName = 'gemini' | 'ddg';
```

### 3.3 错误响应接口

```typescript
/**
 * 错误详情接口
 */
export interface ErrorDetails {
  /** 错误原因代码 */
  reasonCode: ErrorReasonCode;
  
  /** 主要错误代码 (如果有级联错误) */
  primaryReasonCode?: ErrorReasonCode;
  
  /** 是否尝试过 Fallback */
  fallbackTried: boolean;
  
  /** DDG 尝试次数 */
  ddgAttempts: number;
  
  /** 最终使用的提供商 */
  finalProvider?: SearchProviderName;
  
  /** Gemini 错误消息 */
  geminiMessage?: string;
  
  /** DDG 错误消息 */
  ddgMessage?: string;
  
  /** HTTP 状态码 (如果有) */
  statusCode?: number;
  
  /** 事件 ID (用于审计追踪) */
  eventId?: string;
}

/**
 * 智能搜索错误类
 */
export class SmartSearchError extends Error {
  readonly details: ErrorDetails;
  
  constructor(message: string, details: ErrorDetails) {
    super(message);
    this.name = 'SmartSearchError';
    this.details = details;
  }
}

/**
 * 错误原因代码
 */
export type ErrorReasonCode =
  | 'gemini_rate_limited'        // 429 限流
  | 'gemini_service_unavailable' // 503 不可用
  | 'gemini_timeout'             // 超时
  | 'gemini_network_error'       // 网络错误
  | 'gemini_empty_response'      // 空响应
  | 'gemini_auth_error'          // 认证错误
  | 'gemini_permission_error'    // 权限错误
  | 'gemini_invalid_request'     // 无效请求
  | 'gemini_circuit_open'        // 熔断开启
  | 'ddg_rate_limited'           // DDG 限流
  | 'ddg_timeout'                // DDG 超时
  | 'ddg_network_error'         // DDG 网络错误
  | 'unknown_error';             // 未知错误
```

### 3.4 配置接口

```typescript
/**
 * Fallback 配置接口
 */
export interface FallbackConfig {
  /** 是否启用 Fallback (默认 true) */
  enabled: boolean;
  
  /** DDG 最大重试次数 (默认 3) */
  maxDdgRetries: number;
  
  /** Fallback 决策超时 (毫秒, 默认 4000) */
  fallbackDecisionTimeoutMs: number;
  
  /** Gemini 硬超时 (毫秒, 默认 30000) */
  geminiHardTimeoutMs: number;
  
  /** DDG 超时 (毫秒, 默认 8000) */
  ddgTimeoutMs: number;
  
  /** 空响应触发 Fallback (默认 true) */
  triggerOnEmptyResponse: boolean;
  
  /** DDG Provider 入口路径 */
  ddgProviderEntry: string;
  
  /** 健康检查配置 */
  healthCheck: {
    /** 失败阈值 (默认 3) */
    failureThreshold: number;
    
    /** 熔断超时 (毫秒, 默认 300000 = 5 分钟) */
    circuitBreakerTimeoutMs: number;
    
    /** 恢复阈值 (默认 2) */
    recoveryThreshold: number;
  };
  
  /** 立即触发 Fallback 的错误代码列表 */
  immediateFallbackErrors: ErrorReasonCode[];
}

/**
 * 默认配置
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  maxDdgRetries: 3,
  fallbackDecisionTimeoutMs: 4000,
  geminiHardTimeoutMs: 30000,
  ddgTimeoutMs: 8000,
  triggerOnEmptyResponse: true,
  ddgProviderEntry: '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js',
  healthCheck: {
    failureThreshold: 3,
    circuitBreakerTimeoutMs: 300000,
    recoveryThreshold: 2,
  },
  immediateFallbackErrors: [
    'gemini_rate_limited',
    'gemini_service_unavailable',
    'gemini_timeout',
    'gemini_circuit_open',
  ],
};
```

---

## 4. 🔍 可观测性设计 (Observability)

### 4.1 审计接口规范

```typescript
/**
 * 结构化日志字段接口
 * 所有 Fallback 动作必须记录这些字段
 */
export interface AuditLogFields {
  /** 事件 ID (UUID, 用于唯一标识本次搜索) */
  eventId: string;
  
  /** 请求 ID (来自 SearchRequest.requestId) */
  requestId: string;
  
  /** 查询哈希 (SHA256(query).slice(0,16), 用于去重) */
  queryHash: string;
  
  /** 事件类型 */
  eventType: AuditEventType;
  
  /** 时间戳 (ISO 8601) */
  timestamp: string;
  
  /** 耗时 (毫秒) */
  elapsedMs: number;
  
  /** 最终使用的提供商 */
  finalProvider?: SearchProviderName;
  
  /** 是否使用 Fallback */
  fallbackUsed: boolean;
  
  /** Gemini 是否尝试 */
  geminiAttempted: boolean;
  
  /** DDG 是否尝试 */
  ddgAttempted: boolean;
  
  /** 重试次数 */
  retryCount: number;
  
  /** 错误代码 (如果有) */
  reasonCode?: ErrorReasonCode;
  
  /** 错误消息 (如果有) */
  errorMessage?: string;
  
  /** 健康状态 */
  healthStatus?: HealthStatus;
}

/**
 * 审计事件类型
 */
export type AuditEventType =
  | 'search.request.started'      // 搜索请求开始
  | 'search.gemini.started'       // Gemini 搜索开始
  | 'search.gemini.succeeded'     // Gemini 搜索成功
  | 'search.gemini.failed'        // Gemini 搜索失败
  | 'search.fallback.triggered'   // Fallback 触发
  | 'search.ddg.started'          // DDG 搜索开始
  | 'search.ddg.succeeded'        // DDG 搜索成功
  | 'search.ddg.failed'           // DDG 搜索失败
  | 'search.ddg.retry'            // DDG 重试
  | 'search.completed'            // 搜索完成
  | 'search.failed_final'         // 搜索最终失败
  | 'health.status.changed'       // 健康状态变更
  | 'health.circuit.opened'       // 熔断开启
  | 'health.circuit.closed'       // 熔断关闭
  | 'health.recovery.attempted';  // 恢复尝试
```

### 4.2 EventID 生成规范

```typescript
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';

/**
 * 生成事件 ID
 * 格式：{timestamp}-{randomUUID}
 * 示例：20260321121500-550e8400-e29b-41d4-a716-446655440000
 */
export function generateEventId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const uuid = randomUUID();
  return `${timestamp}-${uuid}`;
}

/**
 * 生成查询哈希
 * 用于去重和隐私保护 (不记录原始查询)
 */
export function hashQuery(query: string): string {
  return createHash('sha256')
    .update(query)
    .digest('hex')
    .slice(0, 16);
}
```

### 4.3 审计日志示例

```json
{
  "eventId": "20260321121500-550e8400-e29b-41d4-a716-446655440000",
  "requestId": "user-123-search-456",
  "queryHash": "a1b2c3d4e5f67890",
  "eventType": "search.fallback.triggered",
  "timestamp": "2026-03-21T12:15:00.123Z",
  "elapsedMs": 4150,
  "finalProvider": "ddg",
  "fallbackUsed": true,
  "geminiAttempted": true,
  "ddgAttempted": false,
  "retryCount": 0,
  "reasonCode": "gemini_rate_limited",
  "errorMessage": "Gemini API rate limit exceeded",
  "healthStatus": "degraded"
}
```

### 4.4 日志级别规范

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| **INFO** | 正常流程 | `search.request.started`, `search.gemini.succeeded` |
| **WARN** | 可恢复异常 | `search.gemini.failed`, `search.fallback.triggered` |
| **ERROR** | 不可恢复异常 | `search.failed_final`, `health.circuit.opened` |
| **DEBUG** | 调试信息 | `health.status.changed`, `search.ddg.retry` |

---

## 5. 🚨 异常处理 (防死循环机制)

### 5.1 全局熔断机制

```typescript
/**
 * ⚠️ 严禁逻辑死循环规则
 * 
 * 规则 1: Fallback 后依然失败 → 立即抛出错误，不重试 Gemini
 * 规则 2: 熔断期间 → 直接走 Fallback，不尝试 Gemini
 * 规则 3: 连续失败达到阈值 → 触发熔断，进入冷静期
 */

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureAt?: number;
  nextRetryAt?: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    status: 'closed',
    failureCount: 0,
  };
  
  /**
   * 记录失败
   * ⚠️ 达到阈值后触发熔断，拒绝后续请求
   */
  recordFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureAt = Date.now();
    
    if (this.state.failureCount >= 3) {
      this.open();
    }
  }
  
  /**
   * 记录成功
   * 重置失败计数
   */
  recordSuccess(): void {
    this.state.failureCount = 0;
    this.state.status = 'closed';
  }
  
  /**
   * 开启熔断
   * ⚠️ 熔断期间拒绝所有 Gemini 请求
   */
  open(): void {
    this.state.status = 'open';
    this.state.nextRetryAt = Date.now() + 300000; // 5 分钟后尝试恢复
  }
  
  /**
   * 检查是否允许请求
   * ⚠️ 熔断期间返回 false，防止死循环
   */
  canRequest(): boolean {
    if (this.state.status === 'closed') return true;
    
    if (this.state.status === 'open' && this.state.nextRetryAt) {
      if (Date.now() >= this.state.nextRetryAt) {
        this.state.status = 'half-open'; // 半开状态，尝试恢复
        return true;
      }
      return false; // 熔断期间，拒绝请求
    }
    
    return this.state.status === 'half-open';
  }
}
```

### 5.2 异常处理流程图

```
搜索请求
    │
    ▼
┌─────────────────────┐
│ 检查熔断状态        │
│ canRequest()?       │
└──────┬──────────────┘
       │
       ├─── 否 ───► 直接走 DDG Fallback (跳过 Gemini)
       │
       ▼ 是
┌─────────────────────┐
│ 尝试 Gemini 搜索    │
└──────┬──────────────┘
       │
       ├─── 成功 ──► recordSuccess() → 返回结果
       │
       ▼ 失败
┌─────────────────────┐
│ recordFailure()     │
│ 错误分类            │
└──────┬──────────────┘
       │
       ├─── 429/503/Timeout ──► 立即触发 Fallback
       │
       ├─── 认证/权限错误 ──► 直接报错 (不触发 Fallback)
       │
       ▼ 其他错误
┌─────────────────────┐
│ 尝试 DDG Fallback   │
└──────┬──────────────┘
       │
       ├─── 成功 ──► 返回结果
       │
       ▼ 失败 (重试 3 次后)
┌─────────────────────┐
│ ⚠️ 抛出最终错误     │
│ ❌ 不重试 Gemini    │
│ ❌ 不递归 Fallback  │
└─────────────────────┘
```

### 5.3 防死循环伪代码

```typescript
async function executeSearch(request: SearchRequest): Promise<SearchResponse> {
  const eventId = generateEventId();
  const startTime = Date.now();
  
  // 步骤 1: 检查熔断状态
  if (!circuitBreaker.canRequest()) {
    // ⚠️ 熔断期间，直接走 Fallback，防止死循环
    logger.warn('search.circuit.open', { eventId, reason: 'Circuit breaker is open' });
    return executeDdgFallback(request, eventId, startTime);
  }
  
  // 步骤 2: 尝试 Gemini 搜索
  try {
    const geminiResult = await executeGemini(request, eventId);
    circuitBreaker.recordSuccess();
    return geminiResult;
  } catch (error) {
    circuitBreaker.recordFailure();
    
    // 步骤 3: 错误分类
    const classification = classifyError(error);
    
    // ⚠️ 认证/权限错误 → 直接报错，不触发 Fallback
    if (classification.decision === 'fatal') {
      throw createFatalError(classification, eventId);
    }
    
    // 步骤 4: 触发 Fallback
    logger.warn('search.fallback.triggered', { eventId, reasonCode: classification.reasonCode });
    return executeDdgFallback(request, eventId, startTime, classification);
  }
}

async function executeDdgFallback(
  request: SearchRequest,
  eventId: string,
  startTime: number,
  classification?: ClassifiedError,
): Promise<SearchResponse> {
  let lastError: Error | undefined;
  
  // DDG 重试逻辑 (最多 3 次)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ddgResult = await executeDdg(request, eventId, attempt);
      return ddgResult;
    } catch (error) {
      lastError = error as Error;
      if (attempt < 3) {
        logger.warn('search.ddg.retry', { eventId, attempt, error: error.message });
        continue;
      }
    }
  }
  
  // ⚠️ DDG 也失败 → 抛出最终错误，不重试 Gemini，防止死循环
  logger.error('search.failed_final', {
    eventId,
    geminiError: classification?.rawMessage,
    ddgError: lastError?.message,
  });
  
  throw new SmartSearchError('Both Gemini and DDG search failed.', {
    reasonCode: 'unknown_error',
    fallbackTried: true,
    ddgAttempts: 3,
    eventId,
  });
}
```

---

## 6. ⚙️ 配置方案

### 6.1 完整配置对象

```typescript
export const TD001_PRODUCTION_CONFIG: FallbackConfig = {
  enabled: true,
  maxDdgRetries: 3,
  fallbackDecisionTimeoutMs: 4000,        // <5 秒 SLA: 预留 1 秒缓冲
  geminiHardTimeoutMs: 30000,
  ddgTimeoutMs: 8000,                     // <5 秒 SLA: 符合延迟预算
  triggerOnEmptyResponse: true,
  ddgProviderEntry: '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js',
  healthCheck: {
    failureThreshold: 3,
    circuitBreakerTimeoutMs: 300000,      // 5 分钟熔断
    recoveryThreshold: 2,
  },
  immediateFallbackErrors: [
    'gemini_rate_limited',
    'gemini_service_unavailable',
    'gemini_timeout',
    'gemini_circuit_open',
  ],
};
```

### 6.2 环境配置

```typescript
interface EnvironmentConfig {
  /** 环境变量前缀 */
  prefix: string;
  
  /** 配置映射 */
  mapping: {
    [envVar: string]: keyof FallbackConfig;
  };
}

export const ENV_CONFIG: EnvironmentConfig = {
  prefix: 'DDG_FALLBACK_',
  mapping: {
    'DDG_FALLBACK_ENABLED': 'enabled',
    'DDG_FALLBACK_MAX_DDG_RETRIES': 'maxDdgRetries',
    'DDG_FALLBACK_DECISION_TIMEOUT_MS': 'fallbackDecisionTimeoutMs',
    'DDG_FALLBACK_HARD_TIMEOUT_MS': 'geminiHardTimeoutMs',
    'DDG_FALLBACK_DDQ_TIMEOUT_MS': 'ddgTimeoutMs',
    'DDG_FALLBACK_TRIGGER_ON_EMPTY': 'triggerOnEmptyResponse',
  },
};
```

---

## 7. 📊 性能预算

### 7.1 延迟分解

| 阶段 | 预算 | 说明 |
|------|------|------|
| Gemini 搜索 | 0-4000ms | 决策超时阈值 |
| 错误分类 | <50ms | 本地同步操作 |
| Fallback 决策 | <50ms | 状态检查 + 配置读取 |
| DDG 搜索 | 4000-4800ms | 含重试 (最多 3 次) |
| 结果返回 | <200ms | 序列化 + 响应 |
| **总计** | **<5000ms** | **SLA 目标** |

### 7.2 SLA 保证

| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| P95 端到端延迟 | < 5000ms | 从请求开始到响应结束 |
| P99 端到端延迟 | < 8000ms | 极端情况下的延迟上限 |
| Fallback 触发成功率 | ≥ 99.9% | (成功 Fallback 次数 / Fallback 触发次数) × 100% |
| DDG 搜索成功率 | ≥ 95% | (DDG 成功次数 / DDG 尝试次数) × 100% |

### 7.3 性能监控

```typescript
interface PerformanceMetrics {
  /** P95 延迟 (毫秒) */
  p95LatencyMs: number;
  
  /** P99 延迟 (毫秒) */
  p99LatencyMs: number;
  
  /** 平均延迟 (毫秒) */
  avgLatencyMs: number;
  
  /** Fallback 触发率 (%) */
  fallbackRatePercent: number;
  
  /** DDG 成功率 (%) */
  ddgSuccessRatePercent: number;
  
  /** 熔断触发次数 */
  circuitBreakerTriggers: number;
}
```

---

## 📝 评审清单

### 架构评审

- [ ] 状态机形式化定义完整 (状态转换表 + 冷静期判定)
- [ ] 接口契约强类型化 (SearchRequest + SearchResponse 5 核心指标)
- [ ] 可观测性设计完整 (EventID + 审计接口)
- [ ] 防死循环机制明确 (全局熔断 + 不重试 Gemini)

### 代码评审 (待 04_coding 阶段)

- [ ] TypeScript 编译通过
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 符合 SPEC 定义的接口契约
- [ ] 符合<5 秒 SLA 性能预算

### 文档评审

- [ ] PRD.md ✅ (产品需求)
- [ ] ROADMAP.md ✅ (研发路线)
- [ ] SPEC.md ✅ (技术规格 - 本文档)
- [ ] CONTEXT_PREFIX.md ✅ (上下文缓存)

---

## 🔗 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| **PRD.md** | [查看](../01_designing/PRD.md) | 产品需求定义 |
| **ROADMAP.md** | [查看](../02_roadmapping/ROADMAP.md) | 研发路线图 |
| **CONTEXT_PREFIX.md** | [查看](./CONTEXT_PREFIX.md) | 上下文缓存 |
| **AGENTS.md v3.5** | [查看](../../../AGENTS.md) | 研发规约 |

---

*本文档由 openclaw-ouyp 撰写，遵循"外科手术级"标准*  
**版本**: v1.0 | **创建日期**: 2026-03-21 | **状态**: 待主人评审 🌌
