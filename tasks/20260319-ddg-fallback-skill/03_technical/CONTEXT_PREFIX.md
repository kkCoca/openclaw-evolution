# Context Caching 前缀 - 04_coding 阶段静态约束

> **用途**: 在 04_coding 阶段开始时注入此上下文，作为 System Prompt 前缀
> **目标**: 利用 Context Caching 减少重复理解，节省 30-40% Token
> **使用方式**: 每次调用 OpenCode 时附加此内容

---

## 📋 核心约束（来自 01_designing/PRD.md）

### Fallback 触发条件
- ✅ **429 Too Many Requests** - Gemini 频率限制
- ✅ **503 Service Unavailable** - 服务不可用
- ✅ **Timeout** - 请求超时（>30 秒）
- ✅ **Network Error** - ETIMEDOUT/ECONNRESET/ENOTFOUND
- ✅ **Empty Response** - 返回结果为空数组

### 性能约束
- **秒级切换**: fallback 决策 <5 秒
- **双层超时**: 
  - `fallbackDecisionTimeoutMs = 4500`（用户体验）
  - `geminiHardTimeoutMs = 30000`（资源保护）
- **总响应时间**: <45 秒（Gemini 30 秒 + DDG 15 秒）

### 架构约束
- ❌ **禁止子进程**: DDG 必须 direct import，禁止 `child_process.spawn`
- ✅ **Direct Import**: 通过 `import()` 动态加载 DDG Provider
- ✅ **无感降级**: 用户无需感知 Provider 切换

### 可观测性要求
必须记录以下字段：
- `reasonCode` - fallback 原因（如 `gemini_rate_limited`）
- `occurredAt` - 触发时间（ISO 8601）
- `elapsedMs` - 当前阶段耗时
- `retryCount` - 当前 Provider 已重试次数
- `finalProvider` - 最终返回结果的 Provider（`gemini` 或 `ddg`）
- `fallbackUsed` - 是否触发过 fallback

---

## 🏗️ 架构约束（来自 02_roadmapping/ROADMAP.md）

### 模块职责

| 文件 | 职责 | 关键函数 |
|------|------|---------|
| `src/index.ts` | Skill 入口 | `smartSearch()` |
| `src/fallback-manager.ts` | 状态机管理 | `executeSearch()`, `handleFallback()` |
| `src/error-classifier.ts` | 错误分类器 | `classifyError()` |
| `src/ddg-adapter.ts` | DDG 适配层 | `search()` |
| `src/types.ts` | 类型定义 | `SmartSearchResult`, `FallbackConfig` |
| `tests/fallback.test.ts` | 单元测试 | 覆盖主链路 + fallback + 双失败 |

### 状态机设计

**单次请求内**：
```
INIT → GEMINI_RUNNING → GEMINI_SUCCEEDED (成功)
                     → GEMINI_FAILED_CLASSIFIABLE → FALLBACK_PENDING → DDG_RUNNING → DDG_SUCCEEDED
                     → GEMINI_FAILED_FATAL (直接抛出)
```

**跨请求健康检查**（回切逻辑）：
```
HEALTHY → 连续失败 3 次 → UNHEALTHY (熔断 5 分钟)
       → 等待 5 分钟 → DEGRADED (半开)
       → 尝试 1 次 → 成功 2 次 → HEALTHY (恢复)
                 → 失败 → UNHEALTHY (重新熔断)
```

### 错误分类规则

| 优先级 | 错误类型 | 决策 | reasonCode |
|--------|---------|------|------------|
| 1 | HTTP 429 | fallback | `gemini_rate_limited` |
| 2 | HTTP 503 | fallback | `gemini_service_unavailable` |
| 3 | Timeout/ETIMEDOUT | fallback | `gemini_timeout` |
| 4 | Network Error | fallback | `gemini_network_error` |
| 5 | Empty Response | fallback | `gemini_empty_response` |
| 6 | HTTP 401/Invalid API Key | fatal | `gemini_auth_error` |
| 7 | HTTP 403/Forbidden | fatal | `gemini_permission_error` |
| 8 | Invalid Query/PARSE_ERROR | fatal | `gemini_invalid_request` |

---

## 🔗 物理连接（来自 03_technical/SPEC.md）

### DDG Provider 路径

**绝对路径（通过 universe-bridge 软链接）**：
```
/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js
```

**使用方式**：
```typescript
// 方案 A：静态 import（推荐）
import { DuckDuckGoSearchProvider } from 
  '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';

// 方案 B：动态 import（便于配置）
const DDG_PROVIDER_PATH = process.env.DDG_PROVIDER_PATH || 
  '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';
const { DuckDuckGoSearchProvider } = await import(DDG_PROVIDER_PATH);
```

**桥接说明**：
- 软链接：`/home/ouyp/.openclaw/workspace/universe-bridge` → `/home/ouyp/Learning/Practice/openclaw-universe`
- 技术主权：保持 Universe 目录原始位置不变
- 权限桥接：OpenCode 可通过 workspace 内软链接访问

### 回切逻辑实现

**配置参数**：
```typescript
const HEALTH_CHECK_CONFIG = {
  failureThreshold: 3,           // 连续失败 3 次熔断
  circuitBreakerTimeoutMs: 300000, // 5 分钟
  recoveryThreshold: 2,          // 连续成功 2 次恢复
};
```

**实现位置**：
- 在 `fallback-manager.ts` 中添加全局 `GeminiHealthStatus`
- 每次请求前检查健康状态
- 如果 Gemini 处于 `UNHEALTHY` 且未到 `nextRetryAt`，直接走 DDG

### 日志格式

```typescript
interface FallbackLog {
  requestId: string;           // 请求唯一标识
  queryHash: string;           // 查询内容摘要
  reasonCode: string;          // fallback 原因
  occurredAt: string;          // ISO 8601 时间
  elapsedMs: number;           // 阶段耗时
  retryCount: number;          // 重试次数
  finalProvider: 'gemini' | 'ddg';
  fallbackUsed: boolean;
  geminiAttempted: boolean;
  ddgAttempted: boolean;
  errorMessage?: string;       // 错误摘要
}
```

---

## 🧪 A/B 实验约束

### 实验组别
- **B 组（Plan-and-Execute 模式）**
- **对比组**: A 组（自由推理）- 已完成，Token 用量 4.5k

### 测量指标
- **Token 用量**: 预测比 A 组节省 40-60%（编码阶段）
- **步骤执行时间**: 记录每步耗时
- **迭代次数**: 代码修改次数
- **缓存命中率**: Context Caching 复用次数

### 执行要求
1. ✅ 按步骤执行（先写计划 → 逐步实现 → 每步验证）
2. ✅ 记录 Token 用量（从 OpenCode 日志获取）
3. ✅ 遇到阻塞立即记录，不跳过
4. ✅ 完成后输出对比报告

---

## 🎯 验收标准（快速检查清单）

### 功能验收
- [ ] Gemini 正常时，返回 Gemini 结果（`finalProvider='gemini'`）
- [ ] Gemini 返回 429 时，自动切换到 DDG（`fallbackUsed=true`）
- [ ] Gemini 超时（>4500ms）时，自动切换到 DDG
- [ ] DDG 也失败时，抛出清晰的最终错误
- [ ] 每次 fallback 记录日志（包含原因、时间、重试次数、最终 Provider）

### 性能验收
- [ ] Fallback 切换时间 <5 秒
- [ ] DDG 搜索响应时间 <15 秒
- [ ] 总体响应时间 <45 秒

### 代码质量验收
- [ ] TypeScript 严格模式编译通过
- [ ] 单元测试覆盖率 >80%
- [ ] 无 ESLint 错误
- [ ] README.md 完整

---

*此文件由 openclaw-ouyp 创建，用于 04_coding 阶段 Context Caching*  
*版本：v1.0 | 创建时间：2026-03-19 10:35*
