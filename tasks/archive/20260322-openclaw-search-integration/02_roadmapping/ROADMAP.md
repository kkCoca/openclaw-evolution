# ROADMAP: OpenClaw Search Provider 集成 DDG Fallback

> **步骤数**: 8 步 (符合 L4 规范)  
> **执行者**: OpenClaw + OpenCode  
> **复查者**: OpenClaw

---

## 📋 步骤清单

### 步骤 1: 任务目录创建 ✅
- [x] 创建标准目录结构
- [x] 验证目录符合 L4

### 步骤 2: PRD 编写 ✅
- [x] 编写产品愿景
- [x] 定义功能需求 (FR-001 ~ FR-007)
- [x] 定义非功能需求 (NFR-001 ~ NFR-004)
- [x] 定义验收标准

### 步骤 3: ROADMAP 编写 ✅
- [x] 8 步分解
- [x] Context Prefix 注入

### 步骤 4: OpenCode 架构设计 ⏳
- [ ] OpenCode: 设计 Search Provider 架构
- [ ] OpenCode: 定义 API 接口
- [ ] OpenCode: 确认依赖关系

### 步骤 5: OpenCode 代码实现 ⏳
- [ ] OpenCode: 创建 package.json
- [ ] OpenCode: 实现 src/search-provider.js
- [ ] OpenCode: 实现 src/gemini-adapter.js
- [ ] OpenCode: 实现 src/ddg-adapter.js
- [ ] OpenCode: 创建 tests/ 集成测试

### 步骤 6: OpenClaw 质量检查 ⏳
- [ ] OpenClaw: 检查 L2 生产区纯净
- [ ] OpenClaw: 检查 L3 命名归一化
- [ ] OpenClaw: 检查 L4 规划完整性
- [ ] OpenClaw: 验证集成测试结果

### 步骤 7: 部署发布 ⏳
- [ ] 执行 deploy-pipeline.sh
- [ ] 验证生产区纯净 (L2)
- [ ] Git 提交 + Gitee 推送

### 步骤 8: 知识沉淀 ⏳
- [ ] 编写集成白皮书
- [ ] 更新 MEMORY.md
- [ ] 归档任务

---

## 📎 Context Prefix

**核心约束**:
- 100% 遵循 L1 分工规范
- OpenClaw 把控，OpenCode 编码
- 集成测试必须验证真实场景

**架构约束**:
- Search Provider: 统一搜索接口
- Gemini Adapter: Gemini API 适配
- DDG Adapter: DuckDuckGo API 适配
- Fallback: 自动切换逻辑

**物理连接**:
- 研发区：tasks/20260322-openclaw-search-integration/
- 生产区：extensions/openclaw-search-provider/
- 依赖：duckduckgo-fallback (已存在)

---

## 执行记录

| 步骤 | 开始时间 | 结束时间 | 执行者 | 验证 |
|------|---------|---------|--------|------|
| 1 | 17:25 | 17:26 | OpenClaw | ✅ |
| 2 | 17:26 | 17:27 | OpenClaw | ✅ |
| 3 | 17:27 | 17:28 | OpenClaw | ✅ |
| 4 | - | - | OpenCode | ⏳ |
| 5 | - | - | OpenCode | ⏳ |
| 6 | - | - | OpenClaw | ⏳ |
| 7 | - | - | OpenClaw | ⏳ |
| 8 | - | - | OpenClaw | ⏳ |

---

*本文档由 OpenClaw 按 L4 规范生成*
