# DDG Web Search 完整功能需求清单

> **整理日期**: 2026-03-24  
> **整理人**: OpenClaw  
> **来源**: Git 历史恢复（提交 1918922）+ 源代码分析  
> **用途**: 新研发任务输入（完整版）

---

## 📋 项目概述

**项目名称**: OpenClaw DDG Web Search  
**项目类型**: Web Search 扩展（免 API Key）  
**目标用户**: OpenClaw 内置搜索场景  
**核心价值**: 免费、免 API、低接入门槛的搜索扩展

---

## 🎯 核心目标

1. **替换历史方案**: 替换 `DDG Fallback` 归档方案，形成可独立部署、可维护的新扩展
2. **双搜索源**: DuckDuckGo 主搜索源 + Bing 备用搜索源
3. **性能指标**: 响应时间 < 5 秒，结果 ≥ 10 条，成功率 ≥ 95%

---

## 📊 完整功能需求清单

### F001: 搜索请求校验

| 属性 | 说明 |
|------|------|
| **功能描述** | 校验搜索请求的输入参数，确保符合契约要求 |
| **验收标准** | 1. 查询词不能为空（trim 后）<br>2. 查询词长度 ≤ 200 字符<br>3. limit 默认 10，范围 1-20<br>4. outputMode 默认 summary，可选 summary/detailed<br>5. 参数无效时抛出 SearchError |
| **优先级** | P0 |
| **模块** | contracts/search-contract.js |
| **输入** | `{ query, limit, outputMode }` |
| **输出** | `{ query, limit, outputMode }`（已校验） |
| **错误处理** | 抛出 `SearchError(type, message, retryable)` |

---

### F002: 请求上下文生成

| 属性 | 说明 |
|------|------|
| **功能描述** | 为每次搜索请求生成唯一追踪上下文 |
| **验收标准** | 1. 生成唯一 requestId（UUID）<br>2. 计算 queryHash（SHA1）<br>3. 记录 startedAt 时间戳 |
| **优先级** | P0 |
| **模块** | contracts/search-contract.js |
| **输入** | `{ query, limit, outputMode }` |
| **输出** | `{ requestId, query, queryHash, startedAt }` |

---

### F003: DuckDuckGo 主搜索源接入

| 属性 | 说明 |
|------|------|
| **功能描述** | 接入 DuckDuckGo HTML/Lite 搜索，提取结果 |
| **验收标准** | 1. 支持 DuckDuckGo HTML 页面请求<br>2. 提取标题、链接、摘要<br>3. 提取相关搜索词<br>4. 支持空结果场景<br>5. 解析失败时抛出 parse_error |
| **优先级** | P0 |
| **模块** | source/ddg-adapter.js, parser/ddg-parser.js |
| **输入** | `{ query, limit, context }` |
| **输出** | `{ results: [], relatedSearches: [], source: 'ddg' }` |
| **错误场景** | timeout, rate_limit, captcha_detected, parse_error |

---

### F004: Bing 备用搜索源接入

| 属性 | 说明 |
|------|------|
| **功能描述** | 接入 Bing 免 API 页面搜索，作为备用源 |
| **验收标准** | 1. 支持 Bing 页面请求<br>2. 提取标题、链接、摘要<br>3. 输出结构与 DuckDuckGo 一致<br>4. 支持空结果场景 |
| **优先级** | P0 |
| **模块** | source/bing-adapter.js, parser/bing-parser.js |
| **输入** | `{ query, limit, context }` |
| **输出** | `{ results: [], relatedSearches: [], source: 'bing' }` |

---

### F005: 搜索源路由与降级

| 属性 | 说明 |
|------|------|
| **功能描述** | 管理主备搜索源路由，自动降级切换 |
| **验收标准** | 1. 优先请求 DuckDuckGo<br>2. DuckDuckGo 失败时自动切换 Bing<br>3. 降级条件：timeout, rate_limit, captcha_detected, parse_error<br>4. 全部失败时抛出 all_sources_failed<br>5. 记录健康状态（成功/失败） |
| **优先级** | P0 |
| **模块** | router/source-router.js, health/health-service.js |
| **输入** | `{ query, limit, context }` |
| **输出** | `{ results, relatedSearches, source, fallbackUsed, partial, primaryFailureType }` |

---

### F006: 反爬控制

| 属性 | 说明 |
|------|------|
| **功能描述** | 实现基础反爬策略，避免被限流 |
| **验收标准** | 1. 每次请求携带浏览器级 User-Agent<br>2. 请求间加入随机延迟（可配置）<br>3. 支持超时控制（可配置）<br>4. 连续失败时触发短时退避 |
| **优先级** | P0 |
| **模块** | guard/anti-bot-guard.js, http/http-client.js |
| **输入** | `{ userAgent, delayMs, timeoutMs }` |
| **输出** | 增强后的 HTTP 请求 |

---

### F007: 响应格式化

| 属性 | 说明 |
|------|------|
| **功能描述** | 将搜索结果格式化为统一响应结构 |
| **验收标准** | 1. 支持 summary 模式（精简：title, url, source）<br>2. 支持 detailed 模式（完整：title, url, source, snippet）<br>3. 包含元数据（query, tookMs, sourceUsed, partial, fallbackUsed）<br>4. 错误响应包含 error 对象 |
| **优先级** | P0 |
| **模块** | formatter/response-formatter.js |
| **输入** | `{ results, relatedSearches, source, partial, fallbackUsed }, request, context` |
| **输出** | `{ query, results, relatedSearches, sourceUsed, outputMode, tookMs, partial, fallbackUsed, error }` |

---

### F008: 客户端消费适配

| 属性 | 说明 |
|------|------|
| **功能描述** | 为 OpenClaw 提供搜索调用接口 |
| **验收标准** | 1. 构建搜索请求（query, limit, outputMode）<br>2. 调用搜索扩展<br>3. 消费搜索结果<br>4. 支持 outputMode 解析 |
| **优先级** | P0 |
| **模块** | client/openclaw-search-client.js, client/view-mode-resolver.js, client/search-result-consumer.js |
| **输入** | `{ query, limit, outputMode }` |
| **输出** | `{ results, relatedSearches, metadata }` |

---

### F009: 健康检查

| 属性 | 说明 |
|------|------|
| **功能描述** | 提供扩展健康状态查询接口 |
| **验收标准** | 1. 返回各搜索源健康状态（healthy/degraded/unhealthy）<br>2. 记录最近失败类型<br>3. 包含配置摘要 |
| **优先级** | P0 |
| **模块** | health/health-service.js |
| **输入** | 无 |
| **输出** | `{ status, sources: { ddg: { status, lastFailureType }, bing: {...} }, config }` |

---

### F010: 搜索日志记录

| 属性 | 说明 |
|------|------|
| **功能描述** | 记录搜索请求和响应的结构化日志 |
| **验收标准** | 1. 记录搜索源、耗时、结果条数<br>2. 记录失败原因（如有）<br>3. 不记录敏感用户内容<br>4. 支持 info/error/warn 级别 |
| **优先级** | P1 |
| **模块** | logging/search-logger.js |
| **输入** | `{ context, response, error }` |
| **输出** | 结构化日志事件 |

---

### F011: 统一搜索入口

| 属性 | 说明 |
|------|------|
| **功能描述** | 提供扩展统一公开接口 |
| **验收标准** | 1. search(request) 方法<br>2. healthCheck() 方法<br>3. createClient() 方法<br>4. 支持依赖注入（测试友好） |
| **优先级** | P0 |
| **模块** | index.js, orchestrator/search-orchestrator.js |
| **输入** | `{ query, limit, outputMode }` |
| **输出** | `{ query, results, relatedSearches, metadata, error }` |

---

### F012: 运行时配置

| 属性 | 说明 |
|------|------|
| **功能描述** | 管理扩展运行时配置 |
| **验收标准** | 1. 支持自定义配置覆盖<br>2. 包含默认配置（userAgent, delayMs, timeoutMs 等）<br>3. 配置验证 |
| **优先级** | P1 |
| **模块** | config/runtime-config.js |
| **输入** | `{ userAgent, delayMs, timeoutMs, ... }` |
| **输出** | 配置对象 |

---

### F013: 错误处理与分类

| 属性 | 说明 |
|------|------|
| **功能描述** | 统一错误类型定义和处理 |
| **验收标准** | 1. 错误类型：invalid_query, timeout, rate_limit, captcha_detected, parse_error, all_sources_failed<br>2. 每个错误包含 retryable 标记<br>3. 错误对象包含 source 信息 |
| **优先级** | P0 |
| **模块** | error/search-error.js |
| **输入** | 原始错误 |
| **输出** | `SearchError(type, message, retryable, source, errors)` |

---

### F014: MCP 集成支持

| 属性 | 说明 |
|------|------|
| **功能描述** | 以 MCP 协议方式集成到 OpenClaw，支持 AI 自动调用搜索 |
| **验收标准** | 1. 创建 MCP 服务器入口（mcp-server.js）<br>2. 创建 MCP 配置（~/.openclaw/mcp.json）<br>3. AI 可自动发现和调用 ddg_search 工具<br>4. 配置即可使用，升级无影响<br>5. 不修改 OpenClaw 核心代码 |
| **优先级** | P0 |
| **模块** | mcp-server.js, ~/.openclaw/mcp.json |
| **输入** | OpenClaw MCP 协议 |
| **输出** | ddg_search 工具（AI 可调用） |
| **约束条件** | ❌ 不修改 OpenClaw 核心代码<br>✅ 采用 MCP 协议（OpenClaw 原生支持）<br>✅ 代码复用（dist/100% 复用） |

---

### F015: DDG 验证码检测修复

| 属性 | 说明 |
|------|------|
| **功能描述** | 增强 DDG 验证码/异常状态检测，覆盖新版验证码页面 |
| **验收标准** | 1. detectDdgBlockingState() 检测 6 个特征（原 2 个）<br>2. 创建 HTML 样本库（tests/fixtures/）<br>3. 新增集成测试验证真实样本<br>4. 验证码页面应抛出 SearchError（type: captcha_detected）<br>5. 正常页面应提取到结果（≥5 条） |
| **优先级** | P0 |
| **模块** | parser/ddg-parser.js, tests/fixtures/ |
| **输入** | DDG HTML 页面 |
| **输出** | 检测结果（blocking: boolean, type: string） |
| **检测特征** | 1. anomaly-modal（验证码弹窗）<br>2. captcha-form（验证码表单）<br>3. rate-limit-message（限流消息）<br>4. access-denied（访问拒绝）<br>5. challenge-window（挑战窗口）<br>6. js-redirect（JS 重定向） |
| **修复版本** | v1.1（ISSUE-001 已修复） |

---

## 📏 非功能需求清单

| 编号 | 需求类型 | 目标值 | 验收方法 |
|------|---------|--------|---------|
| **N001** | 响应时间 | < 5 秒 | 单次搜索响应时间测量 |
| **N002** | 结果数量 | ≥ 10 条 | 返回结果计数 |
| **N003** | 成功率 | ≥ 95% | 100 次搜索请求成功率统计 |
| **N004** | 命名归一化 | 任务目录=生产区=package.json name | L3 规范检查 |
| **N005** | 生产区纯净 | extensions/无 src/, tests/, tsconfig.json | L2 规范检查 |
| **N006** | 测试覆盖率 | ≥ 80% | 单元测试 + 集成测试 |

---

## 🔄 核心流程

### 正常流程

```
1. OpenClaw 内部搜索模块发起搜索请求
   ↓
2. 校验输入参数（F001）
   ↓
3. 生成请求上下文（F002）
   ↓
4. 路由到 DuckDuckGo（F005）
   ↓
5. DuckDuckGo 请求 + 反爬控制（F003 + F006）
   ↓
6. 解析 DuckDuckGo 结果（F003）
   ↓
7. 格式化响应（F007）
   ↓
8. 记录日志（F010）
   ↓
9. 返回给 OpenClaw 调用方（F008）
```

### 失败处理流程

```
查询词为空 → F001 校验失败，抛出 invalid_query
DuckDuckGo 超时 → F005 切换到 Bing，记录 timeout
DuckDuckGo 返回限流/验证码 → F005 切换到 Bing，记录 rate_limit/captcha_detected
DuckDuckGo 解析失败 → F005 切换到 Bing，记录 parse_error
Bing 也失败 → F005 抛出 all_sources_failed，包含所有错误
返回结果少于 10 条 → F007 返回实际结果，partial=true
相关搜索缺失 → F007 relatedSearches=[]
```

---

## 📋 范围定义

### 范围内（In Scope）

- ✅ 面向 OpenClaw 的 Web Search 扩展设计与交付
- ✅ DuckDuckGo 主搜索源接入
- ✅ Bing 免 API 备用搜索源接入
- ✅ 基础搜索结果解析
- ✅ 相关搜索词提取
- ✅ 输出格式配置（summary/detailed）
- ✅ 基础反爬与失败降级
- ✅ 替换历史 `DDG Fallback` 的集成入口
- ✅ 健康检查接口
- ✅ 结构化日志记录

### 范围外（Out of Scope）

- ❌ 代理池、IP 轮换、验证码自动识别
- ❌ 多区域搜索策略和个性化排序
- ❌ 搜索结果缓存平台或持久化数据仓库
- ❌ 图片搜索、新闻搜索、学术搜索等垂类能力
- ❌ 面向第三方开发者的公网 API 服务

---

## 📊 验收标准汇总

### 功能验收（15 项）

| 编号 | 功能 | 验收标准 | 状态 |
|------|------|---------|------|
| **F001** | 搜索请求校验 | 5 项校验全部通过 | ⏳ 待验收 |
| **F002** | 请求上下文生成 | requestId, queryHash, startedAt | ⏳ 待验收 |
| **F003** | DuckDuckGo 主搜索源 | 提取标题/链接/摘要/相关搜索 | ⏳ 待验收 |
| **F004** | Bing 备用搜索源 | 输出结构一致 | ⏳ 待验收 |
| **F005** | 搜索源路由与降级 | 自动切换，健康记录 | ⏳ 待验收 |
| **F006** | 反爬控制 | User-Agent + 随机延迟 | ⏳ 待验收 |
| **F007** | 响应格式化 | summary/detailed 模式 | ⏳ 待验收 |
| **F008** | 客户端消费适配 | OpenClaw 调用接口 | ⏳ 待验收 |
| **F009** | 健康检查 | 返回健康状态 | ⏳ 待验收 |
| **F010** | 搜索日志记录 | 结构化日志 | ⏳ 待验收 |
| **F011** | 统一搜索入口 | search/healthCheck/createClient | ⏳ 待验收 |
| **F012** | 运行时配置 | 可配置覆盖 | ⏳ 待验收 |
| **F013** | 错误处理与分类 | 6 种错误类型 + retryable | ⏳ 待验收 |
| **F014** | MCP 集成支持 | MCP 服务器 + mcp.json 配置 | ⏳ 待验收 |
| **F015** | DDG 验证码检测修复 | 6 个检测特征 + HTML 样本库 | ⏳ 待验收 |

### 非功能验收（6 项）

| 编号 | 需求 | 目标值 | 状态 |
|------|------|--------|------|
| **N001** | 响应时间 | < 5 秒 | ⏳ 待验收 |
| **N002** | 结果数量 | ≥ 10 条 | ⏳ 待验收 |
| **N003** | 成功率 | ≥ 95% | ⏳ 待验收 |
| **N004** | L3 命名归一化 | 三者一致 | ⏳ 待验收 |
| **N005** | L2 生产区纯净 | 无 src/tests/tsconfig | ⏳ 待验收 |
| **N006** | 测试覆盖率 | ≥ 80% | ⏳ 待验收 |

### 部署验收（2 项）

| 验收项 | 说明 | 状态 |
|--------|------|------|
| **OpenClaw 真实环境验证** | 部署到 OpenClaw 后，AI 可正常调用搜索 | ⏳ 待验收 |
| **部署验证报告** | 创建 DEPLOYMENT-VERIFICATION.md | ⏳ 待验收 |

---

## 📝 备注

1. **需求来源**: Git 历史恢复（提交 1918922）+ 源代码分析
2. **整理目的**: 作为新研发任务的完整输入，确保需求无遗漏
3. **功能模块**: 13 个功能需求，覆盖完整搜索流程
4. **下一步**: 请主人确认需求清单后，执行步骤 2（删除旧内容）

---

*完整需求整理完成于 2026-03-24*  
*整理人：OpenClaw*  
*状态：✅ 待主人确认*
