# DuckDuckGo Provider for OpenClaw

> **零成本搜索能力 · OmniForge 万象锻造工厂出品**  
> **版本**: v1.1.0  
> **创建时间**: 2026-03-18  
> **作者**: by Ai.Coding (OpenCode) + openclaw-ouyp (首席顾问)  
> **代理支持**: ✅ 系统代理 (Clash) / ✅ 直接连接

---

## 🎯 项目简介

本项目为 OpenClaw 提供 **零配置、免 API Key** 的 DuckDuckGo 网页搜索能力，以 MCP Server 形式交付。

**核心价值**：
- ✅ **零成本**：无需申请 API Key，无使用费用
- ✅ **开箱即用**：无需复杂配置
- ✅ **隐私保护**：DuckDuckGo 不追踪用户
- ✅ **中文支持**：支持国家/语言参数定制

---

## 🏆 OmniForge 进化日志

| 日期 | 事件 | 进化指数 |
|------|------|---------|
| 2026-03-18 | 完成 01_designing → 04_coding 全流程 | 100 |
| 2026-03-18 | 单元测试 10/10 通过 | ✅ |
| 2026-03-18 | TypeScript 编译通过 | ✅ |
| 2026-03-18 | 部署到 `/extensions/search_providers/duckduckgo/` | ✅ |
| 2026-03-18 | 实测搜索（网络环境限制） | ⚠️ 待优化 |

---

## 📦 功能特性

- ✅ 严格 TypeScript 实现（Node.js 18+）
- ✅ DuckDuckGo HTML API 客户端（HTTPS 验证）
- ✅ HTML 解析器（提取 `title`/`snippet`/`url`）
- ✅ 内存缓存（默认 15 分钟 TTL）
- ✅ 自适应速率限制器（默认 1 秒/请求）
- ✅ 单元测试覆盖（解析/缓存/限流/编排）

## 🧪 实测记录

### 测试 1：系统代理模式 (Clash) ✅

**测试时间**: 2026-03-18 21:20  
**测试查询**: `AI Agent Architecture 2026`  
**代理配置**: `HTTP_PROXY=http://127.0.0.1:7897`

**测试结果**:
```
✅ 搜索成功！
来源：duckduckgo
结果数量：10
```

**前 3 条结果**:
1. 2026 年 AI Agent 发展趋势：从概念到落地的关键突破 - 知乎
2. PDF AI agent trends 2026 - Google Cloud
3. AI Agent Architecture: Build Systems That Work in 2026 - Redis

### 测试 2：非代理模式 (直接连接) ⚠️

**测试时间**: 2026-03-18 21:20  
**测试查询**: `AI Agent Architecture 2026`  
**代理配置**: 无

**测试结果**:
```
⚠️  中国大陆地区可能无法直接访问
建议：配置 HTTP_PROXY/HTTPS_PROXY 环境变量
```

---

## 🔧 代理配置

### 系统代理模式（推荐）

如果您使用 **Clash**、**V2Ray** 等系统级代理：

```bash
# 临时配置（当前终端）
export HTTP_PROXY=http://127.0.0.1:7897
export HTTPS_PROXY=http://127.0.0.1:7897

# 永久配置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export HTTP_PROXY=http://127.0.0.1:7897' >> ~/.bashrc
echo 'export HTTPS_PROXY=http://127.0.0.1:7897' >> ~/.bashrc
source ~/.bashrc
```

### 非代理模式

如果您可以直接访问 DuckDuckGo（海外环境）：

```bash
# 不配置任何环境变量，直接使用
node dist/src/index.js
```

### 自动检测

Provider 会自动检测环境变量：
- 有 `HTTP_PROXY`/`HTTPS_PROXY` → **系统代理模式**
- 无环境变量 → **非代理模式**

## Install

```bash
npm install
```

## Scripts

```bash
npm test
npm run build
```

## Usage

```ts
import { DuckDuckGoSearchProvider } from './src/index';

const provider = new DuckDuckGoSearchProvider();
const response = await provider.search({
  query: 'OpenClaw gateway',
  country: 'CN',
  language: 'zh-CN',
});

console.log(response.results);
```

## Notes

- `country` and `language` fall back to `null` when the value is unsupported.
- Only `http` and `https` result URLs are returned.
- The implementation returns at most 10 results from the first DuckDuckGo page.
- Empty or malformed HTML responses surface as provider errors.
