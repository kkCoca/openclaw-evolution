# DuckDuckGo Provider for OpenClaw

> **零成本搜索能力 · OmniForge 万象锻造工厂出品**  
> **版本**: v1.0.0  
> **创建时间**: 2026-03-18  
> **作者**: by Ai.Coding (OpenCode) + openclaw-ouyp (首席顾问)

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

**测试时间**: 2026-03-18 20:35  
**测试查询**: `OpenClaw 2026 最新动态`  
**测试环境**: Linux x64, Node.js v22.22.1

**测试结果**:
```
❌ 网络请求失败 (ProviderError: NETWORK_ERROR)
原因：DuckDuckGo HTML API 可能需要特殊网络环境
```

**后续优化方向**:
1. 添加代理支持（`HTTP_PROXY`/`HTTPS_PROXY`）
2. 增加重试机制（指数退避）
3. 备用 API 端点（`duckduckgo.com/acm`）

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
