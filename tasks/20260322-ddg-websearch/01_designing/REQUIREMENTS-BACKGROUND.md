# 需求背景：DDG Web Search 扩展

> **创建者**: OpenClaw  
> **创建日期**: 2026-03-22  
> **状态**: 🟡 待 OpenCode designing 执行

---

## 📋 原始需求

**问题背景**：
- Brave API 需要注册账号
- Brave API 需要绑定信用卡
- 期望免费免 API 实现 Web Search

**目标**：
开发 OpenClaw Web Search 扩展，实现免费免 API 的 Web Search 能力。

---

## ✅ 主人已确认的需求

| 维度 | 选择 | 说明 |
|------|------|------|
| **使用场景** | A | OpenClaw 内置搜索 (AI 主动搜索) |
| **搜索源优先级** | B | DuckDuckGo (主) + 其他免费源 (备) |
| **与 DDG Fallback 关系** | C | 替换之前的 DDG Fallback |
| **输出格式** | C | 可配置 (根据场景决定) |
| **技术要求** | 具备反爬虫能力 | 技术栈不限 |

---

## 📎 OpenClaw 专业建议

| 问题 | 建议 | 理由 |
|------|------|------|
| **功能范围** | A2 (基础搜索 + 相关搜索) | 满足 80% 场景，复杂度可控 |
| **反爬策略** | B4 (请求头 + 延迟组合) | 平衡效果和复杂度 |
| **备用搜索源** | C2 (Bing 免 API) | 结果质量好，与 DDG 互补 |
| **部署方式** | D2 (extensions/) | 与项目一体 |
| **验收标准** | E4 (全部) | 响应<5 秒 + 结果≥10 条 + 成功率≥95% |

---

## 🚀 请 OpenCode 执行 designing skill

**请按 ai-toolkit designing skill 流程执行**：

1. 步骤 1: 启动分析 (识别输入类型 → 确定输出要求 → 检测模式)
2. 步骤 2: 与用户确认模式和输出格式
3. 步骤 3: 询问需求 (一次一问，补充细节)
4. 步骤 4: 按要求输出 PRD.md + TRD.md
5. 步骤 5: 一致性检查

**产出物**：
- `01_designing/PRD.md` (产品需求文档)
- `01_designing/TRD.md` (技术需求文档)

---

*本需求背景由 OpenClaw 整理，按 L1 分工规范，designing 由 OpenCode 执行*
