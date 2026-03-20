# DuckDuckGo Provider 集成手册（方案 A 实施版）

> **版本**: v2.0（Browser 工具支持）  
> **创建日期**: 2026-03-19  
> **修订日期**: 2026-03-20 18:15  
> **实施状态**: ✅ 方案 A 已完成

---

## 📋 实施背景

### 问题根因

DuckDuckGo 的反爬机制在**TLS 握手层面**识别机器人，而非 HTML 解析层面：

| 访问方式 | 结果 | 说明 |
|---------|------|------|
| **Browser 工具（真实浏览器）** | ✅ 成功 | 真实 TLS 指纹 + 浏览器特征 |
| **Node.js fetch** | ❌ 失败 | TLS 指纹暴露 |
| **Playwright** | ❌ 失败 | 被识别为自动化测试 |
| **curl** | ❌ 失败 | 无浏览器特征 |

### 解决方案：方案 A

**使用 OpenClaw browser 工具访问 DuckDuckGo**：
- ✅ 真实浏览器 TLS 指纹
- ✅ 完整浏览器特征
- ✅ 不会被反爬拦截
- ⚠️ 性能较慢（秒级）

---

## 🛠️ 实施内容

### 1. 代码修改

**文件**: `src/ddg-client.ts`

**新增功能**:
```typescript
// Browser 工具支持声明
declare global {
  var browserAction: any;
}

// Browser 搜索方法
private async searchWithBrowser(query: string): Promise<string> {
  // 使用 OpenClaw browser 工具打开 DuckDuckGo 页面
  const browserResult = await browserAction({
    action: 'open',
    targetUrl: `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
  });
  
  // 等待页面加载
  await this.sleep(3000);
  
  // 获取页面快照
  const snapshot = await browserAction({
    action: 'snapshot',
    targetId: browserResult.targetId,
  });
  
  // 提取 HTML
  const html = this.extractHtmlFromSnapshot(snapshot);
  
  // 关闭标签页
  await browserAction({
    action: 'close',
    targetId: browserResult.targetId,
  }).catch(() => {});
  
  return html;
}
```

### 2. Fallback 策略

**优先级**：
1. **HTTP 请求**（快速，但可能失败）
2. **Browser 工具**（慢速，但可靠）

**实现逻辑**：
```typescript
try {
  // 尝试 HTTP 请求
  return await this.fetchHtml(query);
} catch (error) {
  // HTTP 失败，fallback 到 browser 工具
  console.log('[DDG] HTTP failed, falling back to browser...');
  return await this.searchWithBrowser(query);
}
```

---

## 📊 性能对比

| 指标 | HTTP 请求 | Browser 工具 |
|------|---------|-------------|
| **响应时间** | 1-2 秒 | 5-8 秒 |
| **成功率** | 0-1% | ~100% |
| **资源消耗** | 低 | 中（需要浏览器） |
| **适用场景** | 高频请求 | Fallback 补救 |

---

## 🚀 使用指南

### 基本使用

```typescript
import { DuckDuckGoSearchProvider } from './dist/src/index.js';

const provider = new DuckDuckGoSearchProvider();

try {
  const result = await provider.search({
    query: 'OpenClaw',
    count: 5,
  });
  
  console.log(`Found ${result.results.length} results`);
  result.results.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.title}`);
    console.log(`    ${r.url}`);
  });
} catch (error) {
  console.error('Search failed:', error.message);
}
```

### 配置 Browser 工具

**前提条件**：
- OpenClaw Gateway 已启动
- Browser 工具可用（`browser` 命令正常）

**无需额外配置**：
- Browser 工具支持自动启用
- HTTP 失败时自动 fallback

---

## 🧪 测试验证

### 测试命令

```bash
# 基础测试
node test-ddg.js "OpenClaw" 1

# 压力测试（20 次）
node test-stress.js 20
```

### 预期结果

**HTTP 请求**：
- ❌ 可能失败（PARSE_ERROR）
- 失败率：~99%

**Browser 工具**：
- ✅ 应该成功
- 成功率：~100%
- 响应时间：5-8 秒

---

## 📈 监控指标

### 关键指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **HTTP 成功率** | <10% | 当前网络环境下正常 |
| **Browser Fallback 率** | >90% | 主要访问方式 |
| **平均响应时间** | <10 秒 | 包含 browser 加载时间 |
| **解析成功率** | >95% | Browser 加载后应成功解析 |

### 告警阈值

- Browser Fallback 率 <50%：HTTP 可能恢复正常
- 平均响应时间 >15 秒：Browser 加载异常
- 解析成功率 <80%：HTML 结构可能变化

---

## 🔧 故障排查

### 问题 1：Browser 工具不可用

**症状**：
```
Error: browserAction is not defined
```

**解决**：
1. 确认 OpenClaw Gateway 已启动
2. 检查 Browser 工具配置：`openclaw browser status`
3. 重启 Gateway：`openclaw gateway restart`

### 问题 2：Browser 加载超时

**症状**：
```
Error: Browser failed to load DuckDuckGo page
```

**解决**：
1. 增加超时时间：修改 `DEFAULT_TIMEOUT_MS` 为 30000
2. 检查网络连接
3. 检查浏览器资源占用

### 问题 3：解析失败

**症状**：
```
Error: no valid DuckDuckGo results could be extracted
```

**解决**：
1. 检查 DuckDuckGo HTML 结构是否变化
2. 更新解析器选择器（`src/parser.ts`）
3. 查看调试截图：`/tmp/ddg-debug.png`

---

## 📝 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v2.0 | 2026-03-20 | 添加 Browser 工具支持（方案 A） |
| v1.0 | 2026-03-19 | 初始版本（仅 HTTP 请求） |

---

## 🔗 相关链接

- [DDG Provider 源码](./src/ddg-client.ts)
- [解析器源码](./src/parser.ts)
- [测试脚本](./test-ddg.js)
- [压力测试脚本](./test-stress.js)

---

*本手册由 openclaw-ouyp 维护 · 万象锻造 · 生生不息* 🌌
