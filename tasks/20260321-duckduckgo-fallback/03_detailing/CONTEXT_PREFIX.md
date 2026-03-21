# TD-001: Context Prefix (缓存复用)

> **版本**: v1.0  
> **创建日期**: 2026-03-21  
> **用途**: Context Caching - 避免重复理解相同上下文，节省 30-40% Token

---

## 🧠 核心约束 (来自 PRD)

### <5 秒无缝切换 SLA
```
决策超时 (fallbackDecisionTimeoutMs) ≤ 4000ms
DDG 适配器超时 (ddgTimeoutMs) ≤ 8000ms (含重试)
端到端延迟 P95 < 5000ms (生产环境监控)
用户无感知切换 (无错误提示、无加载中状态重置)
```

### 智能熔断机制
```
连续失败 3 次触发熔断 (failureThreshold=3)
熔断持续时间 5 分钟 (circuitBreakerTimeoutMs=300000)
恢复阈值：连续成功 2 次 (recoveryThreshold=2)
熔断状态持久化 (跨会话保持)
```

### 多级降级策略
```
429/503/Timeout → 立即触发 Fallback (无需等待决策超时)
空响应 → 触发 Fallback (可配置)
认证错误/权限错误 → 直接报错 (不触发 Fallback)
网络错误 → 重试 1 次后触发 Fallback
```

---

## 🏗️ 架构约束 (来自 ROADMAP)

### 模块职责
```
index.ts           → 入口文件，导出 FallbackManager + 工具函数
types.ts           → 类型定义 (SearchProviderName, FallbackConfig, SmartSearchResult 等)
fallback-manager.ts → 核心降级逻辑 (executeSearch, executeGemini, executeDdgFallback)
ddg-adapter.ts     → DuckDuckGo 适配器 (search 方法)
error-classifier.ts → 错误分类 (classifyError, classifyEmptyResponse)
```

### 状态机流转
```
Healthy (Gemini OK)
    │ 429/503/Timeout
    ▼
Degraded (Fallback)
    │ 连续失败 3 次
    ▼
Unhealthy (Circuit Open)
    │ 5 分钟后
    └─────→ 尝试恢复 → Healthy
```

### 关键延迟预算
```
Gemini 搜索：0-4000ms (决策超时阈值)
错误分类：<100ms (本地同步操作)
Fallback 决策：<100ms (状态检查 + 配置读取)
DDG 搜索：4000-4800ms (含重试，最多 3 次)
结果返回：<200ms (序列化 + 响应)
总计：<5000ms (SLA 目标)
```

---

## 🔌 物理连接 (来自现有代码)

### DuckDuckGo Provider 路径
```javascript
DEFAULT_DDG_PROVIDER_ENTRY = 
  '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js'
```

### 现有代码位置
```
项目主权区：/home/ouyp/Learning/Practice/openclaw-universe/
├── extensions/duckduckgo-fallback/
│   ├── src/
│   │   ├── types.ts              (类型定义)
│   │   ├── fallback-manager.ts   (核心逻辑)
│   │   ├── ddg-adapter.ts        (DDG 适配器)
│   │   ├── error-classifier.ts   (错误分类)
│   │   └── index.ts              (入口文件)
│   └── tests/
│       ├── ddg-adapter.test.ts
│       ├── error-classifier.test.ts
│       └── fallback.test.ts
```

### 配置位置
```
系统私有区：~/.openclaw/workspace/
├── openclaw.json          (OpenClaw 配置)
└── AGENTS.md              (异常自愈协议注入点)
```

---

## 📊 当前配置 (待优化)

### FallbackConfig (当前值 → 目标值)
```typescript
{
  enabled: true,                          // 保持不变
  maxDdgRetries: 3,                       // 保持不变
  fallbackDecisionTimeoutMs: 4500,        // → 4000 (预留 1 秒缓冲)
  geminiHardTimeoutMs: 30000,             // 保持不变
  ddgTimeoutMs: 12000,                    // → 8000 (优化至 SLA 预算内)
  triggerOnEmptyResponse: true,           // 保持不变
  ddgProviderEntry: DEFAULT_DDG_PROVIDER_ENTRY,
  healthCheck: {
    failureThreshold: 3,                  // 保持不变
    circuitBreakerTimeoutMs: 300000,      // 保持不变 (5 分钟)
    recoveryThreshold: 2,                 // 保持不变
  }
}
```

### 关键修改点
1. **fallbackDecisionTimeoutMs**: 4500 → 4000 (为 DDG 搜索预留更多时间)
2. **ddgTimeoutMs**: 12000 → 8000 (符合<5 秒 SLA 预算)
3. **立即触发优化**: 429/503/Timeout 错误跳过决策超时，直接触发 Fallback

---

## 🧪 测试策略

### 单元测试覆盖
- [ ] FallbackManager.executeSearch (正常流程)
- [ ] FallbackManager.executeGemini (超时处理)
- [ ] FallbackManager.executeDdgFallback (重试逻辑)
- [ ] 错误分类器 (所有 ErrorReasonCode)
- [ ] 健康状态管理 (熔断触发/恢复)

### 集成测试场景
- [ ] Gemini 429 限流 → 立即触发 Fallback
- [ ] Gemini 503 不可用 → 立即触发 Fallback
- [ ] Gemini Timeout → 决策超时后触发 Fallback
- [ ] DDG 搜索失败 → 重试 3 次后报错
- [ ] 熔断期间搜索 → 直接走 DDG

### 性能测试指标
- [ ] P95 端到端延迟 < 5000ms
- [ ] P99 端到端延迟 < 8000ms
- [ ] 吞吐量 ≥ 100 请求/秒
- [ ] Fallback 触发成功率 ≥ 99.9%

---

## 📝 开发注意事项

### 禁止行为
- ❌ 禁止 `git add .` (必须显式指定目录)
- ❌ 禁止在系统私有区初始化 Git 实例
- ❌ 禁止将~/.openclaw/workspace/文件提交到项目主权区
- ❌ 禁止跳过规划步骤直接编码

### 必须遵守
- ✅ 遵循 Plan-and-Execute 模式 (按步骤清单执行)
- ✅ 每步完成后验证 (TypeScript 编译/测试通过)
- ✅ 结构化日志记录 (requestId, queryHash, elapsedMs)
- ✅ 物理边界清晰 (项目主权区 vs 系统私有区)

### Context Caching 使用说明
```
同一会话内后续步骤会自动复用本 Context Prefix，避免重复理解：
- 核心约束 (PRD 需求)
- 架构约束 (模块职责/状态机)
- 物理连接 (文件路径/配置位置)

预计节省：30-40% Token
```

---

## 🎯 验收清单

### 03_detailing 阶段验收
- [ ] 架构设计符合 PRD 约束
- [ ] 接口定义完整 (TypeScript 类型)
- [ ] 配置方案支持<5 秒 SLA

### 04_coding 阶段验收
- [ ] TypeScript 编译通过
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 符合 PRD 约束 (<5 秒 SLA)

### 06_testing 阶段验收
- [ ] 端到端测试通过
- [ ] P95 延迟 < 5000ms
- [ ] 所有异常场景处理正确

---

*本文档用于 Context Caching，避免重复理解相同上下文*  
**版本**: v1.0 | **创建日期**: 2026-03-21 | **预计 Token 节省**: 30-40% 🌌
