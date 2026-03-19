# DuckDuckGo Fallback Skill

> **功能**: 智能 web_search fallback 机制 - Gemini 为主，DuckDuckGo 为战略后备
> **版本**: v1.0
> **创建时间**: 2026-03-19

---

## 🎯 核心功能

当 `web_search` 调用失败时（频率限制、网络错误等），自动切换到 DuckDuckGo Provider。

### Fallback 触发条件
- **429 Too Many Requests** - Gemini 频率限制
- **503 Service Unavailable** - Gemini 服务不可用
- **Timeout** - 请求超时（>30 秒）
- **Network Error** - 网络连接失败

---

## 📦 安装

```bash
cd /home/ouyp/.openclaw/workspace/skills/duckduckgo-fallback
npm install
```

---

## 🔧 配置

在 `openclaw.json` 中添加：

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
          "provider": "duckduckgo",
          "module": "/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding/dist/index.js",
          "options": {
            "maxRetries": 3,
            "baseDelayMs": 1000,
            "timeoutMs": 10000
          }
        }
      }
    }
  }
}
```

---

## 📊 工作流程

```
web_search 请求
    ↓
尝试 Gemini Provider
    ↓
成功？→ 返回结果
    ↓
失败（429/503/Timeout）
    ↓
记录错误日志
    ↓
切换到 DuckDuckGo Provider
    ↓
返回 DDG 结果 + fallback 标记
```

---

## 🧪 测试

```bash
npm test
```

---

## 📝 使用示例

```typescript
import { webSearchWithFallback } from './src/index';

// 自动 fallback 的搜索
const results = await webSearchWithFallback({
  query: "AI Agent architecture 2026",
  count: 5,
});

// results.metadata.fallback === true 表示使用了 DDG fallback
```

---

## 🎯 进化度

- [x] v1.0: 基础 fallback 逻辑
- [ ] v1.1: 添加缓存层（避免重复 fallback）
- [ ] v1.2: 添加健康检查（自动探测 Gemini 恢复）

---

*Skill 由 openclaw-ouyp 创建，遵循 OmniForge v2.8 规约*
