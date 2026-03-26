# AGENTS.md 更新报告

**更新日期**: 2026-03-26  
**版本**: v5.0 → v6.0 (流程引擎版)  
**更新人**: openclaw-ouyp

---

## 更新概览

| 更新项 | 状态 | 说明 |
|--------|------|------|
| 版本号 | ✅ 更新 | v5.0 → v6.0 |
| 生效日期 | ✅ 更新 | 2026-03-25 → 2026-03-26 |
| 执行流程章节 | ✅ 重写 | 新增流程引擎 Skill 使用说明 |
| 版本历史 | ✅ 更新 | 新增 v6.0 变更记录 |

---

## 主要变更

### 1. 执行流程章节重写

**变更前**：
- 4 阶段流程（研发准备→研发执行→验收部署→知识沉淀）
- 手动调用各个 skills（designing/roadmapping/detailing/coding）
- 无流程编排概念

**变更后**：
- 3 场景流程（全新功能/增量需求/问题修复）
- 使用流程引擎 Skill（openclaw-research-workflow）自动编排
- 完整 Git Flow 分支策略
- 版本 Tag 规范（语义化版本）

### 2. 新增内容

| 章节 | 说明 |
|------|------|
| **核心原则** | 所有变更走完整研发流程 |
| **场景 1: 全新功能** | 从零开始的完整流程 |
| **场景 2: 增量需求** | 现有功能增加新能力的流程 |
| **场景 3: 问题修复** | Bug 修复流程（含紧急修复例外） |
| **流程判断树** | 场景选择指南 |
| **Git 分支策略** | Git Flow 变体（5 种分支类型） |
| **版本 Tag 规范** | 语义化版本（vX.Y.Z） |
| **流程引擎 Skill** | openclaw-research-workflow 使用说明 |
| **关键检查点** | 研发准备/执行/验收三阶段检查清单 |

### 3. 删除内容

| 章节 | 说明 |
|------|------|
| ~~4 阶段详细流程~~ | 简化为 3 场景流程 |
| ~~L0-L7 规范体系~~ | 移到 NORMS/ 目录 |
| ~~OpenCode 调用规范~~ | 整合到流程引擎 Skill |

---

## 流程引擎 Skill 集成

### 使用方式

```bash
/sessions_spawn openclaw-research-workflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求描述：{详细描述}
# 约束条件：{约束条件}
# 验收标准：{验收标准}
```

### 流程编排

```
用户需求
  ↓
designing → PRD.md + TRD.md
  ↓
roadmapping → ROADMAP.md
  ↓
detailing → DETAIL.md
  ↓
coding → 代码 + 测试 + 文档
  ↓
reviewing → 验收报告
  ↓
完整研发产出
```

### 依赖管理

- ✅ bundled skills（designing/roadmapping/detailing/coding/reviewing）
- ✅ 一键安装（install.sh/install.bat/install.js）
- ✅ 零感知依赖（自动注册）

---

## Git Flow 分支策略

| 分支类型 | 命名 | 用途 | 来源 | 合并目标 |
|---------|------|------|------|---------|
| 主分支 | `main` | 稳定版本 | - | - |
| 开发分支 | `develop` | 集成测试 | `main` | `main` |
| 功能分支 | `feature/{name}` | 新功能/增量需求 | `develop` | `develop` |
| 修复分支 | `fix/{id}` | Bug 修复 | `main` | `main` + `develop` |
| 发布分支 | `release/v{x.y.z}` | 版本发布 | `develop` | `main` + `develop` |

---

## 版本 Tag 规范

```
vX.Y.Z
│ │ │
│ │ └─ Z: 补丁版本（Bug 修复）
│ └─── Y: 小版本（新功能/增量需求）
└───── X: 主版本（大变更）
```

| Tag | 场景 | 示例 |
|-----|------|------|
| `v1.0.0` | 初始版本 | ddg-websearch 首次发布 |
| `v1.0.1` | Bug 修复 | 修复登录失败问题 |
| `v1.1.0` | 新功能/增量需求 | 增加 Bing 搜索源 |
| `v2.0.0` | 大变更 | 架构重构 |

---

## 关键检查点

### 研发准备阶段
- [ ] 任务描述清晰（目标/约束/验收标准）
- [ ] 分支已创建（feature/ 或 fix/）
- [ ] 需求清单已创建（REQUIREMENTS.md）

### 研发执行阶段
- [ ] PRD + TRD 已生成（designing）
- [ ] ROADMAP 已生成（roadmapping）
- [ ] DETAIL 已生成（detailing）
- [ ] 代码 + 测试已完成（coding）
- [ ] 自我验证通过

### 验收部署阶段
- [ ] 验收通过（openclaw-ouyp 审阅）
- [ ] 知识沉淀已完成（新功能必须）
- [ ] 分支已合并
- [ ] Tag 已创建
- [ ] 部署成功

---

## 影响评估

| 维度 | 影响 | 说明 |
|------|------|------|
| **工作流程** | ✅ 优化 | 流程引擎自动编排，减少手动步骤 |
| **文档质量** | ✅ 提升 | 所有变更走完整流程，文档完整 |
| **版本管理** | ✅ 规范 | Git Flow + 语义化版本 |
| **学习成本** | ⚠️ 略增 | 需要理解流程引擎和 Git Flow |
| **执行效率** | ✅ 提升 | AI 辅助后完整流程只需 2-5 小时 |

---

## 后续行动

| 行动 | 状态 | 说明 |
|------|------|------|
| 流程引擎 Skill 安装 | ✅ 完成 | 已安装到 ~/.openclaw/skills/ |
| 安装测试 | ✅ 完成 | ./install.sh 测试通过 |
| AGENTS.md 更新 | ✅ 完成 | v5.0 → v6.0 |
| 流程引擎测试 | ⏳ 待执行 | 运行 /sessions_spawn openclaw-research-workflow |
| 发布到 clawhub | ⏳ 可选 | 标准化分享 |
| 推送到 Gitee | ⏳ 可选 | 开源分享 |

---

## 文档位置

| 文档 | 位置 |
|------|------|
| **AGENTS.md** | `~/.openclaw/workspace/AGENTS.md` |
| **流程引擎 Skill** | `~/.openclaw/skills/openclaw-research-workflow/` |
| **研发文档** | `/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260326-research-workflow-skill/` |

---

## 签字

**更新人**: openclaw-ouyp  
**日期**: 2026-03-26  
**结论**: ✅ 完成

---

*AGENTS.md 更新报告结束*
