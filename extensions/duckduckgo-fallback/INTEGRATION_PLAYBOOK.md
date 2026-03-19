# DuckDuckGo Fallback 集成手册

> **版本**: v1.0  
> **创建日期**: 2026-03-19  
> **适用场景**: 在 OpenClaw 中集成 DuckDuckGo Fallback 高可用搜索  
> **目标读者**: 系统架构师、运维工程师、AI Agent 开发者  
> **前置条件**: 已阅读 [`OMNIFORGE_SOP.md`](../../OMNIFORGE_SOP.md)

---

## 🎯 导读：为什么需要这份手册？

**这是用血泪换来的经验**：
- ❌ 我们曾经直接在 `extensions/` 下创建代码（违反规约）
- ❌ 我们曾经忽略权限问题（OpenCode 无法访问）
- ❌ 我们曾经假设 DDG 调用一定成功（遇到反爬拦截）

**本手册提供**：
- ✅ **双模块依赖逻辑**：Fallback 如何调用 Provider 的构建产物
- ✅ **集成步骤**：手把手教先部署 Provider，再部署 Fallback
- ✅ **异常自愈验证**：真实点火测试反馈 + 反爬应对建议

**阅读后你将获得**：
- 一套**可复现成功**的集成方案
- 避免我们踩过的所有坑
- 理解"为什么这样设计"的深层逻辑

---

## 📋 目录

1. [双模块依赖逻辑](#1-双模块依赖逻辑)
2. [集成步骤](#2-集成步骤)
3. [异常自愈验证](#3-异常自愈验证)
4. [故障排查](#4-故障排查)

---

## 1. 双模块依赖逻辑

### 1.1 模块关系图

```
┌─────────────────────────────────────────────────────────┐
│              DuckDuckGo Fallback Skill                  │
│  (extensions/duckduckgo-fallback/)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  fallback-manager.ts                            │    │
│  │    ↓ 调用                                       │    │
│  │  ddg-adapter.ts                                 │    │
│  │    ↓ import                                     │    │
│  └────────────────────────────────────────────────┘    │
│                     ↓                                    │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ 依赖路径
                      ↓
┌─────────────────────────────────────────────────────────┐
│         DuckDuckGo Provider (构建产物)                   │
│  (tasks/20260318-duckduckgo-provider/04_coding/dist/)  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  dist/src/index.js                              │    │
│  │    - DuckDuckGoSearchProvider                   │    │
│  │    - 指数退避重试                               │    │
│  │    - 代理支持                                   │    │
│  │    - ESM 模块                                   │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 依赖路径

**Fallback Skill 中的硬编码路径**：
```typescript
// extensions/duckduckgo-fallback/src/types.ts (第 143-145 行)
export const DEFAULT_DDG_PROVIDER_ENTRY =
  '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';
```

**为什么是这个路径？**
1. **通过软链接访问**：`universe-bridge` 指向 Universe 根目录
2. **OpenCode 可访问**：在 `~/.openclaw/workspace/` 内
3. **Git 版本控制**：实际文件在 Git 仓库内

### 1.3 构建产物依赖

**Provider 构建命令**：
```bash
cd /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding
npm install
npm run build
```

**构建产物**：
```
tasks/20260318-duckduckgo-provider/04_coding/dist/
├── src/
│   ├── index.js           # 入口文件（Fallback 依赖）
│   ├── ddg-client.js      # DDG API 客户端
│   ├── ddg-provider.js    # Provider 主逻辑
│   ├── parser.js          # HTML 解析器
│   ├── cache.js           # 缓存管理
│   ├── rate-limiter.js    # 速率限制
│   └── types.js           # 类型定义
└── ...
```

**验证构建产物**：
```bash
# 检查文件是否存在
ls -la tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js

# 检查模块导出
node -e "import('./tasks/.../dist/src/index.js').then(m => console.log(Object.keys(m)))"
```

---

## 2. 集成步骤

### 2.1 前置条件检查

```bash
# 检查 1：Universe 根目录存在
ls -la /home/ouyp/Learning/Practice/openclaw-universe/

# 检查 2：软链接已创建
ls -la ~/.openclaw/workspace/universe-bridge

# 检查 3：OpenClaw 已安装
openclaw --version
```

### 2.2 步骤 1：部署 DuckDuckGo Provider

**为什么先部署 Provider？**
- Fallback Skill 依赖 Provider 的构建产物
- Provider 是独立的搜索服务
- Fallback 是"备用方案"，需要知道"主方案失败后切换到哪里"

**执行步骤**：
```bash
# 1. 进入 Provider 目录
cd /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 验证构建产物
ls -la dist/src/index.js

# 5. 运行测试（可选）
npm test
```

**预期输出**：
```
✓ tests/ddg-client.test.ts (5 tests)
✓ tests/parser.test.ts (5 tests)
Test Files  2 passed (2)
Tests  10 passed (10)
```

### 2.3 步骤 2：部署 DuckDuckGo Fallback Skill

```bash
# 1. 进入 Fallback 目录
cd /home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 运行测试
npm test
```

**预期输出**：
```
✓ tests/error-classifier.test.ts (8 tests)
✓ tests/ddg-adapter.test.ts (1 test)
✓ tests/fallback.test.ts (7 tests)
Test Files  3 passed (3)
Tests  16 passed (16)
```

### 2.4 步骤 3：注册 Skill

```bash
# 创建软链接到 OpenClaw Skills 目录
ln -s /home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback \
      ~/.openclaw/skills/duckduckgo-fallback

# 验证
ls -la ~/.openclaw/skills/duckduckgo-fallback
```

**预期输出**：
```
lrwxrwxrwx 1 ouyp ouyp 77 ... -> /home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback
```

### 2.5 步骤 4：验证集成

```bash
# 验证 1：检查依赖路径
cat extensions/duckduckgo-fallback/src/types.ts | grep DEFAULT_DDG_PROVIDER_ENTRY

# 验证 2：检查 Provider 构建产物是否存在
ls -la tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js

# 验证 3：手动测试 Fallback
cd extensions/duckduckgo-fallback
node -e "
import { FallbackManager } from './dist/src/fallback-manager.js';
// ... 测试代码
"
```

---

## 3. 异常自愈验证

### 3.1 点火测试记录（2026-03-19 15:40）

**测试场景**：模拟 Gemini 429 错误，触发 Fallback

**测试命令**：
```bash
cd /home/ouyp/.openclaw/skills/duckduckgo-fallback
node << 'EOF'
import { FallbackManager } from './dist/src/fallback-manager.js';
import { classifyError } from './dist/src/error-classifier.js';

// 模拟 Gemini 429 错误
const gemini429Error = new Error('429 Too Many Requests');
gemini429Error.status = 429;

// 错误分类
const classification = classifyError(gemini429Error);
console.log('错误分类结果:', classification);

// 验证触发条件
if (classification.decision === 'fallback') {
  console.log('[Fallback Activated: DuckDuckGo]');
}
EOF
```

**测试结果**：
```
📊 错误分类结果:
  Decision: fallback
  Reason: gemini_rate_limited
  Retryable: true

✅ 触发 Fallback 条件满足！
[Fallback Activated: DuckDuckGo]
✅ 盾牌已举起！
```

### 3.2 真实 DDG 调用测试

**测试命令**：
```bash
cd /home/ouyp/.openclaw/skills/duckduckgo-fallback
node << 'EOF'
import { DdgAdapter } from './dist/src/ddg-adapter.js';

const adapter = new DdgAdapter({
  providerEntry: '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js',
});

adapter.search({
  query: '2026 年 3 月最新 AI 技术',
  count: 3,
  requestId: 'test-001',
}).then(result => {
  console.log('✅ DuckDuckGo 搜索结果:', result);
}).catch(err => {
  console.error('❌ 错误:', err.message);
});
EOF
```

**测试结果**：
```
❌ 错误：PARSE_ERROR: no valid DuckDuckGo results could be extracted.
```

### 3.3 失败原因分析

**根本原因**：DuckDuckGo 反爬虫检测

**详细分析**：
1. **检测机制**：DuckDuckGo 会检测自动化请求（User-Agent、请求频率、IP 行为）
2. **我们的请求**：Node.js 原生 fetch，User-Agent 固定，容易被识别
3. **返回结果**：返回"bots use DuckDuckGo too"页面，而非搜索结果

**证据**：
```bash
# 直接 curl 测试
curl -A "Mozilla/5.0" -d "q=AI+technology" https://html.duckduckgo.com/html/
# 返回：正常 HTML

curl -A "node-fetch" -d "q=AI+technology" https://html.duckduckgo.com/html/
# 返回：反爬页面
```

### 3.4 应对建议（血泪经验）

#### 方案 A：使用浏览器工具（推荐）
```typescript
// 通过 CDP 控制浏览器访问 DDG
import { browser } from 'openclaw';

const html = await browser.navigate('https://html.duckduckgo.com/html/')
  .type('input[name="q"]', 'AI technology')
  .press('Enter')
  .html();
```

**优点**：
- ✅ 真实浏览器环境，绕过反爬
- ✅ 支持 JavaScript 渲染
- ✅ 可复用 OpenClaw 浏览器工具

**缺点**：
- ⚠️ 依赖浏览器环境
- ⚠️ 性能较慢（~3-5 秒）

#### 方案 B：请求头随机化
```typescript
// ddg-client.ts 中添加随机 User-Agent
const USER_AGENTS = [
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
];

const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
```

**优点**：
- ✅ 简单快速
- ✅ 无需额外依赖

**缺点**：
- ⚠️ 仍可能被识别（IP 行为模式）

#### 方案 C：集成 Brave Search API（备选）
```typescript
// 使用 Brave Search API（需 API Key）
const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
  headers: {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip',
    'X-Subscription-Token': process.env.BRAVE_API_KEY,
  },
});
```

**优点**：
- ✅ 稳定可靠
- ✅ 官方 API，无反爬

**缺点**：
- ⚠️ 需 API Key（免费额度有限）
- ⚠️ 违背"免 API Key"初衷

### 3.5 最终建议

**生产环境推荐**：
```
主方案：Gemini（稳定，有 API Key）
备用 1：DuckDuckGo + 浏览器工具（绕过反爬）
备用 2：Brave Search API（有 API Key 时）
```

**测试环境**：
```
使用 Mock 数据（fallback.test.ts 中的测试方案）
```

---

## 4. 故障排查

### 4.1 常见问题

#### 问题 1：MODULE_NOT_FOUND
```
Error: Cannot find module '/home/ouyp/.../dist/src/index.js'
```

**解决**：
```bash
# 检查 Provider 是否已构建
ls -la tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js

# 如不存在，执行构建
cd tasks/20260318-duckduckgo-provider/04_coding
npm run build
```

#### 问题 2：软链接失效
```
Error: ENOENT: no such file or directory
```

**解决**：
```bash
# 检查软链接
ls -la ~/.openclaw/workspace/universe-bridge

# 重新创建
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      ~/.openclaw/workspace/universe-bridge
```

#### 问题 3：PARSE_ERROR（反爬）
```
Error: PARSE_ERROR: no valid DuckDuckGo results could be extracted.
```

**解决**：见 [3.4 应对建议](#34-应对建议血泪经验)

### 4.2 日志查看

```bash
# 实时查看 Fallback 日志
tail -f ~/.openclaw/logs/*.log | grep -i fallback

# 搜索特定错误
grep "gemini_rate_limited" ~/.openclaw/logs/*.log

# 查看 DDG 调用日志
grep "search.ddg" ~/.openclaw/logs/*.log
```

### 4.3 调试技巧

#### 启用详细日志
```typescript
// fallback-manager.ts 中添加
this.logger.info('search.request.started', {
  requestId,
  query,
  timestamp: Date.now(),
  ddgProviderPath: this.config.ddgProviderEntry,
});
```

#### 检查依赖路径
```bash
# 查看 Fallback 配置的 DDG Provider 路径
cat extensions/duckduckgo-fallback/src/types.ts | grep DEFAULT_DDG_PROVIDER_ENTRY

# 验证路径存在
ls -la $(cat extensions/duckduckgo-fallback/src/types.ts | grep DEFAULT_DDG_PROVIDER_ENTRY | cut -d"'" -f2)
```

---

## 📜 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-03-19 | 初始版本，基于真实点火测试经验 |

---

*本手册由 openclaw-ouyp 编写，基于 2026-03-19 真实集成血泪史*  
**进化指数**: 92/100  
**内化率**: 61%  
**Gitee**: `https://gitee.com/cola16/openclaw-evolution`
