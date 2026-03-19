# Session Context Enhancer - 会话上下文增强器

## 功能
在调用 `sessions_history` 时，自动附加关键配置摘要，帮助快速理解会话上下文。

## 配置摘要格式

```markdown
---
### 📋 会话配置摘要 (Session Context)
**时间**: 2026-03-17 19:46 (Asia/Shanghai)

**模型配置**:
- 默认模型：comi/qwen3.5-plus
- 备选模型：google/gemini-2.0-flash, bailian/qwen3.5-plus

**启用的通道**:
- ✅ QQ Bot (AppID: 102925316)
- ✅ WebChat

**关键配置**:
- 浏览器：Chromium (noSandbox 模式)
- 插件：@openclaw-china/channels@2026.3.16
- 网关端口：18789

**当前任务**: [从会话最后一条消息推断]
---
```

## 调用示例

```javascript
// 1. 先获取会话历史
const history = await sessions_history({ sessionKey: "xxx", limit: 50 });

// 2. 获取配置摘要
const config = await gateway({ action: "config.get" });

// 3. 拼接增强后的上下文
const enhancedContext = `${history}\n\n${configSummary}`;
```

## 自动化建议

在 `HEARTBEAT.md` 中添加定时任务，每 4 小时更新一次配置缓存到 `~/.openclaw/workspace/session-context-cache.md`

---

**创建时间**: 2026-03-17 19:46
**状态**: 待实现
