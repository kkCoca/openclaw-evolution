# DuckDuckGo Fallback Skill - 产品需求文档

> **任务 ID**: 20260319-ddg-fallback-skill  
> **创建时间**: 2026-03-19 10:10  
> **优先级**: P0（战略后备能力）  
> **遵循规约**: OmniForge v2.8  
> **A/B 实验**: 本任务同时作为 Plan-and-Execute 验证实验的测试题目

---

## 🎯 一、产品愿景

### 1.1 核心价值
为 OpenClaw `web_search` 工具提供**智能降级能力**，确保在 Gemini Provider 失效时自动切换到 DuckDuckGo Provider，保障情报搜集连续性。

### 1.2 设计原则
- **无感降级**: 用户无需感知 Provider 切换
- **快速失败**: Gemini 失败后 5 秒内启动 fallback
- **可观测性**: 每次 fallback 记录日志，便于分析
- **可配置**: fallback 触发条件、重试次数可配置

---

## 📊 二、降级逻辑设计（核心）

### 2.1 Fallback 触发条件检测

| 检测维度 | 触发条件 | 检测方式 | 响应时间 |
|---------|---------|---------|---------|
| **HTTP 状态码** | 429 Too Many Requests | 解析 Gemini 响应 | <1 秒 |
| **HTTP 状态码** | 503 Service Unavailable | 解析 Gemini 响应 | <1 秒 |
| **超时检测** | 请求 >30 秒未响应 | AbortController + setTimeout | 30 秒 |
| **网络错误** | ETIMEDOUT/ECONNRESET | 捕获 fetch 异常 | <1 秒 |
| **空响应** | 返回结果为空数组 | 验证响应内容 | <1 秒 |

### 2.2 降级状态机

```
┌─────────────────┐
│  接收搜索请求   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 尝试 Gemini     │
│ (主 Provider)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │  成功？ │
    └────┬────┘
         │
    ┌────┴───────┬────────────┐
    │ YES        │ NO         │
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ 返回   │  │ 判断错误 │  │ 判断错误 │
│ Gemini │  │ 类型     │  │ 类型     │
│ 结果   │  │          │  │          │
└────────┘  └────┬─────┘  └────┬─────┘
                 │             │
          ┌──────┴──────┐      │
          │ 可重试错误？│      │
          │ (429/503/   │      │
          │  Timeout)   │      │
          └──────┬──────┘      │
                 │             │
          ┌──────┴──────┐      │
          │ YES         │ NO   │
          │             │      │
          ▼             ▼      ▼
    ┌──────────┐  ┌──────────┐
    │ 启动     │  │ 直接抛出 │
    │ Fallback │  │ 错误     │
    └────┬─────┘  └──────────┘
         │
         ▼
    ┌──────────┐
    │ 调用 DDG │
    │ Provider │
    └────┬─────┘
         │
    ┌────┴────┐
    │ 成功？  │
    └────┬────┘
         │
    ┌────┴───────┬────────────┐
    │ YES        │ NO         │
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ 返回   │  │ 重试 DDG │  │ 抛出最终 │
│ DDG    │  │ (最多 3 次)│  │ 错误     │
│ 结果   │  └────┬─────┘  └──────────┘
└────────┘       │
           ┌─────┴─────┐
           │ 仍失败？  │
           └─────┬─────┘
                 │
                 ▼
           ┌──────────┐
           │ 抛出最终 │
           │ 错误     │
           └──────────┘
```

### 2.3 错误类型分类

```typescript
interface ErrorClassification {
  // 触发 fallback 的错误
  fallbackTriggers: [
    '429',                    // Gemini 频率限制
    'Too Many Requests',
    '503',                    // 服务不可用
    'Service Unavailable',
    'Timeout',                // 超时
    'timeout',
    'ETIMEDOUT',              // 连接超时
    'ECONNRESET',             // 连接重置
    'ENOTFOUND',              // DNS 失败
    'Network Error',          // 网络错误
  ],
  
  // 不触发 fallback 的错误（直接抛出）
  nonFallbackErrors: [
    'Invalid API Key',        // 认证错误
    '401 Unauthorized',
    '403 Forbidden',          // 权限错误
    'Invalid Query',          // 查询参数错误
    'PARSE_ERROR',            // 解析错误（DDG 也会失败）
  ]
}
```

---

## 🔧 三、技术架构

### 3.1 模块组成

```
duckduckgo-fallback-skill/
├── src/
│   ├── index.ts              # Skill 入口（导出 smartSearch）
│   ├── fallback-manager.ts   # Fallback 状态机管理
│   ├── error-classifier.ts   # 错误类型分类器
│   ├── ddg-adapter.ts        # DuckDuckGo Provider 适配器
│   └── types.ts              # 类型定义
├── tests/
│   ├── fallback.test.ts      # Fallback 逻辑测试
│   └── error-classifier.test.ts
├── package.json
└── README.md
```

### 3.2 DDG Provider 调用方式

**方案 A：直接 import（推荐）**
```typescript
import { DuckDuckGoSearchProvider } from 
  '/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';

const ddgProvider = new DuckDuckGoSearchProvider();
const result = await ddgProvider.search({ query, count });
```

**方案 B：子进程调用（备选）**
```typescript
import { spawn } from 'child_process';

const result = await callViaChildProcess(
  'node',
  ['path/to/ddg-provider/test-ddg.js', query, count.toString()]
);
```

**决策**: 采用**方案 A**，原因：
- 性能更好（无子进程开销）
- 错误处理更直接
- 类型安全

### 3.3 与 OpenClaw 集成

**配置方式**：修改 `openclaw.json`
```json5
{
  "tools": {
    "web": {
      "search": {
        "enabled": true,
        "provider": "gemini",
        "gemini": {
          "apiKey": "YOUR_GEMINI_KEY"
        },
        "fallback": {
          "enabled": true,
          "skill": "duckduckgo-fallback",
          "skillPath": "/home/ouyp/.openclaw/workspace/skills/duckduckgo-fallback",
          "triggers": ["429", "503", "Timeout", "Network Error"],
          "maxRetries": 3,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

**调用方式**：Skill 被 OpenClaw 工具系统自动加载
```typescript
// OpenClaw 内部调用
const { smartSearch } = await import(skillPath);
const result = await smartSearch({ query, count });
```

---

## 📏 四、A/B 实验设计

### 4.1 实验目标
验证 **Plan-and-Execute 模式** 相比 **自由推理模式** 能否：
- 减少 50% Token 使用
- 提升 30% 开发效率
- 降低 60% 迭代次数

### 4.2 实验分组

| 组别 | 模式 | 执行方式 | 测量指标 |
|------|------|---------|---------|
| **A 组** | 自由推理 | 直接开始编码，边做边想 | Token 用量、时间、迭代次数 |
| **B 组** | Plan-and-Execute | 先写详细计划 → 按计划执行 | Token 用量、时间、迭代次数 |

### 4.3 执行流程

```
┌─────────────────────────────────────────────────────────┐
│                    A/B 实验流程                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  12:00 - 12:30  A 组：自由推理模式                       │
│  ├─ 直接开始编写 Fallback Skill 代码                     │
│  ├─ 遇到问题即时搜索解决                                │
│  └─ 记录 Token 用量、时间、迭代次数                      │
│                                                         │
│  12:30 - 13:00  B 组：Plan-and-Execute 模式              │
│  ├─ 先写详细实现计划（步骤清单）                         │
│  ├─ 按计划逐步执行                                     │
│  └─ 记录 Token 用量、时间、迭代次数                      │
│                                                         │
│  13:00 - 14:00  数据对比分析                             │
│  ├─ 对比两组 Token 用量                                  │
│  ├─ 对比两组开发效率                                    │
│  └─ 输出实验报告                                       │
│                                                         │
│  14:00 - 18:00  完善代码 + 测试                          │
│  └─ 基于 B 组计划完成剩余工作                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.4 测量指标

| 指标 | A 组（自由） | B 组（规划） | 目标差异 |
|------|------------|------------|---------|
| Token 消耗 | 待测量 | 待测量 | B 组减少 50%+ |
| 完成时间 | 待测量 | 待测量 | B 组减少 30%+ |
| 迭代次数 | 待测量 | 待测量 | B 组减少 60%+ |
| 代码质量 | 待测量 | 待测量 | B 组提升 20%+ |

---

## ✅ 五、验收标准

### 5.1 功能验收
- [ ] Gemini 正常时，返回 Gemini 结果
- [ ] Gemini 返回 429 时，自动切换到 DDG
- [ ] Gemini 超时（>30 秒）时，自动切换到 DDG
- [ ] DDG 也失败时，抛出清晰的错误信息
- [ ] 每次 fallback 记录日志（包含原因、时间）

### 5.2 性能验收
- [ ] Fallback 切换时间 <5 秒
- [ ] DDG 搜索响应时间 <15 秒
- [ ] 总体响应时间 <45 秒（Gemini 30 秒 + Fallback 15 秒）

### 5.3 代码质量验收
- [ ] TypeScript 严格模式编译通过
- [ ] 单元测试覆盖率 >80%
- [ ] 无 ESLint 错误
- [ ] README.md 完整

---

## 📋 六、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| DDG 反机器人检测 | 中 | 高 | 添加请求头随机化、使用浏览器工具备选 |
| OpenClaw 技能加载失败 | 低 | 高 | 提供独立脚本作为备选调用方式 |
| A/B 实验数据不准确 | 中 | 中 | 手动记录关键节点，交叉验证 |
| 实验时间超时 | 中 | 低 | 设置 18:00 硬性截止时间，未完成部分延至次日 |

---

## 📅 七、时间计划

| 阶段 | 时间 | 产出 | 负责人 |
|------|------|------|--------|
| **01_designing** | 10:10-10:30 | PRD.md | OpenClaw |
| **02_roadmapping** | 12:00-12:30 | ROADMAP.md | OpenCode (A/B 实验) |
| **03_technical** | 12:30-13:00 | TRD.md | OpenCode (A/B 实验) |
| **04_coding** | 13:00-18:00 | 完整代码 | OpenCode (A/B 实验) |
| **实验报告** | 18:00-18:30 | 对比分析 | OpenClaw |

---

## 🎯 八、成功定义

**实验成功**需满足：
1. Fallback Skill 功能完整，通过验收标准
2. B 组（Plan-and-Execute）Token 用量比 A 组减少 50%+
3. 输出可复用的 A/B 实验报告模板

**主人价值**：
- 获得可靠的 web_search fallback 能力
- 验证 Plan-and-Execute 架构洞察
- 建立 A/B 实验方法论

---

*PRD 由 openclaw-ouyp 编写，遵循 OmniForge v2.8 规约*  
*等待主人批准后进入 02_roadmapping 阶段*
