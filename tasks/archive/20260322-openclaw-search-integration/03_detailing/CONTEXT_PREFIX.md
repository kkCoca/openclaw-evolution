# Context Prefix: OpenClaw Search Provider 集成

> **任务 ID**: 20260322-openclaw-search-integration  
> **创建日期**: 2026-03-22  
> **状态**: ✅ 完成

---

## 📎 核心约束

- 100% 遵循 L1 分工规范
- OpenClaw 把控，OpenCode 编码
- 集成测试必须验证真实场景
- 生产区纯净原则 (L2)
- 命名归一化 (L3)

---

## 🏗️ 架构约束

**模块职责**:
- search-provider.js: 统一搜索接口
- gemini-adapter.js: Gemini API 适配
- ddg-adapter.js: DuckDuckGo API 适配
- 依赖：duckduckgo-fallback (已存在)

**接口定义**:
```javascript
class SearchProvider {
  async search(query, options);
  async geminiSearch(query);
  async ddgSearch(query);
}
```

**Fallback 逻辑**:
- Gemini 429/503/504 → DDG
- Gemini timeout → DDG
- 其他错误 → 抛出

---

## 🔗 物理连接

**研发区**: `tasks/20260322-openclaw-search-integration/`
**生产区**: `extensions/openclaw-search-provider/`
**依赖**: `extensions/duckduckgo-fallback/` (已存在)

---

## ✅ 验证清单

- [x] 任务目录结构符合 L4
- [x] PRD + ROADMAP 完整
- [ ] OpenCode 架构设计完成
- [ ] OpenCode 代码实现完成
- [ ] 集成测试通过
- [ ] OpenClaw 质量检查完成
- [ ] 生产区纯净 (无 src/, tests/)
- [ ] 命名归一化 (openclaw-search-provider)

---

*本文档按 L4 规范生成*
