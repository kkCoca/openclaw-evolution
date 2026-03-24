# 任务描述：DDG Web Search 研发（新规则流程首次实践）

> **任务 ID**: 20260324-ddg-websearch  
> **创建日期**: 2026-03-24  
> **创建人**: OpenClaw  
> **任务类型**: 新规则流程演练  
> **状态**: 🟡 研发准备完成

---

## 📋 任务目标

**核心目标**：
1. 按新规则流程（L1-L4 规范）完整研发 DDG Web Search
2. 验证流程通畅、职责分工清晰、研发目标完整
3. 交付可部署到 OpenClaw 真实环境的搜索扩展

---

## 🎯 功能需求（15 个）

详见：`01_designing/REQUIREMENTS.md`

**核心功能**：
- F001-F013: 搜索核心功能（校验/路由/解析/格式化等）
- F014: MCP 集成支持（AI 自动调用）
- F015: DDG 验证码检测修复（6 个检测特征）

---

## 📏 非功能需求（6 个）

| 编号 | 需求 | 目标值 |
|------|------|--------|
| N001 | 响应时间 | < 5 秒 |
| N002 | 结果数量 | ≥ 10 条 |
| N003 | 成功率 | ≥ 95% |
| N004 | L3 命名归一化 | 任务目录=生产区=package.json name |
| N005 | L2 生产区纯净 | extensions/无 src/, tests/, tsconfig.json |
| N006 | 测试覆盖率 | ≥ 80% |

---

## 🚀 研发流程（4 个阶段）

### 阶段 1：研发准备（OpenClaw 负责）✅
- [x] 创建研发目录（01_designing~05_documentation）
- [ ] OpenClaw 调用 OpenCode（sessions_spawn）
- [ ] 任务描述清晰（目标、约束、验收标准）

### 阶段 2：研发执行（OpenCode 负责）
- [ ] designing skill → PRD.md + TRD.md
- [ ] roadmapping skill → ROADMAP.md
- [ ] detailing skill → DETAIL.md + CONTEXT_PREFIX.md
- [ ] coding skill → 代码 + 测试 + 文档
- [ ] code-commit skill → 自我验证
- [ ] reviewing skill → 请求审查

### 阶段 3：验收部署（OpenClaw 负责）
- [ ] reviewing skill 验收验证
- [ ] 部署到生产区（extensions/ddg-websearch/）
- [ ] 创建部署验证报告（DEPLOYMENT-VERIFICATION.md）
- [ ] OpenClaw 真实环境验证
- [ ] Git 提交 + 推送

### 阶段 4：知识沉淀（OpenClaw 负责）
- [ ] 创建白皮书（高精华文档）
- [ ] 更新 MEMORY.md
- [ ] 创建演练报告

---

## ⚠️ 约束条件

### OpenClaw 职责边界
- ✅ 需求整理（本任务描述）
- ✅ 任务分配（调用 OpenCode）
- ✅ 验收验证（reviewing skill）
- ✅ 部署上线（按文档部署）
- ✅ 知识沉淀（白皮书 + 演练报告）
- ❌ **不编写 PRD/ROADMAP/DETAIL**（OpenCode 职责）
- ❌ **不编写代码**（OpenCode 职责）
- ❌ **不越权执行**（严格遵守 L1 规范）

### OpenCode 职责
- ✅ 01_designing（PRD + TRD）
- ✅ 02_roadmapping（ROADMAP）
- ✅ 03_detailing（DETAIL + CONTEXT_PREFIX）
- ✅ 04_coding（代码 + 测试 + 文档）
- ✅ 自我验证（code-commit skill）
- ✅ 请求审查（reviewing skill）

---

## 📊 验收标准

### 规范检查（强制）
- [ ] L2: 生产区纯净检查通过
- [ ] L3: 命名归一化检查通过
- [ ] L4: Plan-and-Execute 检查通过

### 功能验收（15 项）
- [ ] F001-F015 全部实现并通过测试

### 非功能验收（6 项）
- [ ] N001-N006 全部达标

### 部署验收（2 项）
- [ ] OpenClaw 真实环境验证通过
- [ ] 部署验证报告已创建

---

## 🔗 相关链接

- [需求清单](01_designing/REQUIREMENTS.md)
- [L1 规范](../../../.openclaw/workspace/NORMS/core/01-core-positioning.md)
- [L2 规范](../../../.openclaw/workspace/NORMS/core/02-production-purity.md)
- [L3 规范](../../../.openclaw/workspace/NORMS/core/03-naming-convention.md)
- [L4 规范](../../../.openclaw/workspace/NORMS/core/04-plan-and-execute.md)

---

*任务描述创建完成于 2026-03-24*  
*创建人：OpenClaw*  
*状态：✅ 研发准备完成，等待调用 OpenCode*
