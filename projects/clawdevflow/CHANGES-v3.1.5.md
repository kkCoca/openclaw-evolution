# ROADMAPPING 审阅 Agent 规则优化 v3.1.5 - 改动文件清单

**日期**: 2026-04-02 16:53  
**版本**: v3.1.5  
**需求**: REQ-011（ROADMAPPING 审阅 Agent 规则优化）

---

## 一、改动文件总览

### 1.1 修改文件（7 个）

| 文件 | 修改类型 | 行数变化 | 说明 |
|------|---------|---------|------|
| `01_designing/PRD.md` | 追加 | +333/-1 | v3.1.5，追加第 16 章产品需求 |
| `01_designing/TRD.md` | 追加 | +510/-1 | v3.1.5，追加第 13 章技术设计 |
| `04_coding/src/adapters/opencode.js` | 编辑 | +44/-0 | v3.1.5，更新 roadmapping 任务描述 |
| `04_coding/src/bundled-skills/roadmapping/SKILL.md` | 编辑 | +51/-0 | v3.1.5，10 项→12 项检查清单 |
| `CHANGELOG.md` | 追加 | +98/-0 | v3.1.5 变更记录 |
| `templates/PRD-template.md` | 追加 | +8/-0 | 更新 PRD 模板 |
| `templates/TRD-template.md` | 追加 | +10/-0 | 更新 TRD 模板 |

**总计**: +999 行/-55 行

---

### 1.2 新增文件（7 个，未跟踪）

| 文件 | 大小 | 说明 |
|------|------|------|
| `05_reviewing/REVIEW-REPORT-v3.1.5.md` | 验收报告 | v3.1.5 验收报告（得分 99.5%） |
| `DESIGNING-STAGE-FLOW-v3.1.3.md` | 流程文档 | designing 环节执行流程 v3.1.3 |
| `DESIGNING-STAGE-FLOW-v3.1.4-LATEST.md` | 流程文档 | designing 环节执行流程 v3.1.4（最新） |
| `REVIEW-DESIGN-REPORT-v3.1.4-BUG-007.md` | 审查报告 | BUG-007 修复审查报告 |
| `ROADMAPPING-REVIEW-AGENT-v3.1.4.md` | 审阅 Agent 文档 | roadmapping 审阅 Agent 详解 |
| `ROADMAPPING-REVIEW-RULES-EVALUATION-v3.1.5.md` | 评估文档 | 新规则评估报告 |
| `ROADMAPPING-STAGE-FLOW-v3.1.4-LATEST.md` | 流程文档 | roadmapping 环节执行流程 v3.1.4 |

---

## 二、详细改动说明

### 2.1 01_designing/PRD.md v3.1.5

**修改内容**:
1. **版本更新**: v3.1.3 → v3.1.5
2. **哈希更新**: 更新 PRD 哈希和 REQUIREMENTS 哈希
3. **术语表更新**: "OpenCode" → "AI 工具（根据 config.yaml 配置选择）"
4. **需求追溯矩阵更新**: 添加 REQ-010, REQ-011
5. **版本历史更新**: 添加 v3.1.4, v3.1.5 记录
6. **新增第 15 章**: v3.1.4 Bugfix 修复 - PRD/TRD 描述 AI 工具为 config.yaml 配置
7. **新增第 16 章**: v3.1.5 产品需求 - ROADMAPPING 审阅 Agent 规则优化

**新增章节**:
```markdown
## 15. v3.1.4 Bugfix 修复 - PRD/TRD 描述 AI 工具为 config.yaml 配置

### 15.1 问题描述
PRD.md 和 TRD.md 中硬编码描述"使用 OpenCode"，应该描述为"根据 config.yaml 配置选择 AI 工具"。

### 15.2 修复目标
| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **AI 工具描述修正** | PRD.md 描述 AI 工具为"根据 config.yaml 配置选择" | PRD.md v3.1.4 更新 |
| **AI 工具描述修正** | TRD.md 描述 AI 工具为"根据 config.yaml 配置选择" | TRD.md v3.1.4 更新 |
| **模板同步更新** | PRD-template.md 和 TRD-template.md 同步更新 | 模板文件更新 |
| **审查通过** | ReviewDesignAgent 审查得分 >= 90% | 审查报告 |

## 16. v3.1.5 FEATURE-006 - ROADMAPPING 审阅 Agent 规则优化

### 16.1 问题背景
当前 roadmapping 审阅 Agent 只有 10 项检查清单，缺少关键的质量控制规则：
- ❌ 无 Freshness 对齐检查（文档不更新到最新）
- ❌ 无显式需求引用（Traceability 不足）
- ❌ 无 MVP 可交付性检查（空泛计划）
- ❌ 无依赖检查（只检查风险）
- ❌ 无范围膨胀预警

### 16.2 新增规则（4 项 critical + 1 项 non-critical）
| 规则 | 检查点 | 关键性 | 说明 |
|------|--------|--------|------|
| R0 | Freshness 对齐 | critical | ROADMAP.md 必须包含 alignedTo + requirementsHash |
| R1 | Traceability（需求引用） | critical | ROADMAP 必须显式引用需求 ID（覆盖率 100%） |
| R2 | MVP 可交付性 | critical | 必须存在 MVP/Phase 1/里程碑 1 段落 |
| R3 | 依赖与风险 | critical | ROADMAP 必须有 Dependencies/Risks 段落 |
| R4 | 范围膨胀风险 | non-critical | 检测"可能/可选/未来"关键词（warning）

### 16.3 验收标准
- ✅ PRD.md v3.1.5 包含新规则说明
- ✅ TRD.md v3.1.5 包含技术实现方案
- ✅ bundled-skills/roadmapping/SKILL.md 更新 10 项检查清单为 12 项
- ✅ adapters/opencode.js 更新 roadmapping 任务描述
- ✅ ReviewDesignAgent 审查得分 >= 90%
- ✅ 用户验收通过
```

---

### 2.2 01_designing/TRD.md v3.1.5

**修改内容**:
1. **版本更新**: v3.1.3 → v3.1.5
2. **哈希更新**: 更新 TRD 哈希和 REQUIREMENTS 哈希
3. **术语表更新**: "OpenCode" → "AI 工具（根据 config.yaml 配置选择）"
4. **需求追溯矩阵更新**: 添加 REQ-010, REQ-011
5. **版本历史更新**: 添加 v3.1.4, v3.1.5 记录
6. **新增第 12 章**: v3.1.4 Bugfix 修复 - AI 工具描述优化
7. **新增第 13 章**: v3.1.5 技术设计 - ROADMAPPING 审阅 Agent 规则优化

**新增章节**:
```markdown
## 12. v3.1.4 Bugfix 修复 - AI 工具描述优化

### 12.1 问题描述
TRD.md 中硬编码描述"使用 OpenCode"，应该描述为"根据 config.yaml 配置选择 AI 工具"。

## 13. v3.1.5 技术设计 - ROADMAPPING 审阅 Agent 规则优化

### 13.1 技术架构
审阅 Agent 检查清单从 10 项扩展到 12 项，新增 4 项 critical 规则和 1 项 non-critical 规则。

### 13.2 核心规则实现
#### R0 Freshness 对齐
- 检查 ROADMAP.md 是否包含 alignedTo + requirementsHash
- 与 REQUIREMENTS 最新版本比对

#### R1 Traceability（需求引用）
- 检查 ROADMAP 是否显式引用需求 ID（REQ-XXX）
- 覆盖率 100%（所有需求 ID 都出现）

#### R2 MVP 可交付性
- 检查是否存在 MVP/Phase 1/里程碑 1 段落
- 包含 scope、exit criteria、预计工作量

#### R3 依赖与风险
- 检查 Dependencies/Risks 段落
- ≥3 项风险

#### R4 范围膨胀风险
- 检测"可能/可选/未来/后续再说"等关键词
- warning（不阻断）

### 13.3 评分决策规则
- **Critical 项（R0-R3）**: 一票否决，任一失败→驳回重做
- **Non-Critical 项（R4 + 1-5, 7-8）**: 1-2 项失败→条件通过，3 项 + 失败→驳回
```

---

### 2.3 04_coding/src/adapters/opencode.js v3.1.5

**修改内容**:
1. **更新 roadmapping 任务描述**: 添加 R0-R4 规则说明

**修改代码**:
```javascript
roadmapping: `你是一个技术项目经理。请执行 roadmapping skill（纯自动化模式 + 自审阅，无用户交互）：

## 自审阅检查清单（12 项）
### Critical 规则（一票否决）
- R0 Freshness 对齐 - ROADMAP.md 必须包含 alignedTo + requirementsHash
- R1 Traceability - ROADMAP 必须显式引用需求 ID（覆盖率 100%）
- R2 MVP 可交付性 - 必须存在 MVP/Phase 1/里程碑 1 段落
- R3 依赖与风险 - ROADMAP 必须有 Dependencies/Risks 段落

### Non-Critical 规则
- R4 范围膨胀风险 - 检测"可能/可选/未来"关键词（warning）
- 1. 任务拆分
- 2. 工作量评估（≤2 人天）
- 3. 收尾项（联调测试 + 演示）
- 4. 任务命名（固定格式）
- 5. 描述规范（只描述"做什么"）
- 7. 技术对齐（与 TRD 一致）
- 8. 代码现状（增量需求分析）

## 评分决策
- 所有 critical 项通过 + 总分 >= 90% → pass
- 所有 critical 项通过 + 总分 70-89% → conditional
- 任一 critical 项失败 → reject
`;
```

---

### 2.4 04_coding/src/bundled-skills/roadmapping/SKILL.md v3.1.5

**修改内容**:
1. **更新检查清单**: 10 项→12 项
2. **添加 Critical 规则说明**
3. **更新评分决策规则**

**修改内容**:
```markdown
#### 审阅检查清单（12 项）

**Critical 规则（一票否决）**:
| 检查项 | 检查内容 | 标准 |
|--------|---------|------|
| ✅ R0 Freshness | 文档是否对齐最新需求？ | 包含 alignedTo + requirementsHash |
| ✅ R1 Traceability | 是否显式引用需求 ID？ | 覆盖率 100%（所有 REQ-XXX 都出现） |
| ✅ R2 MVP 可交付性 | 是否有 MVP/里程碑 1 段落？ | 包含 scope/验收/工作量 |
| ✅ R3 依赖与风险 | 是否有 Dependencies/Risks 段落？ | ≥3 项风险 |

**Non-Critical 规则**:
| 检查项 | 检查内容 | 标准 |
|--------|---------|------|
| R4 范围膨胀 | 是否大量使用"可能/可选/未来"？ | <5 处（warning） |
| 1. 任务拆分 | 任务是否按模块和前后端拆分？ | 每个任务职责单一 |
| 2. 工作量评估 | 单个任务是否 ≤ 2 人天？ | 超过 2 人天的任务已拆分 |
| ... | ... | ... |

#### 评分决策

| 评分 | 决策 | 后续动作 |
|------|------|---------|
| 所有 critical 项通过 + >= 90% | ✅ 通过 | 直接写入 ROADMAP.md |
| 所有 critical 项通过 + 70-89% | ⚠️ 条件通过 | 修正后写入 ROADMAP.md |
| 任一 critical 项失败 | ❌ 驳回 | 重新生成开发计划 |
```

---

### 2.5 CHANGELOG.md v3.1.5

**新增内容**:
```markdown
## v3.1.5 (2026-04-02)

### FEATURE-006: ROADMAPPING 审阅 Agent 规则优化

**新增规则**（4 项 critical + 1 项 non-critical）:
- R0 Freshness 对齐 - ROADMAP.md 必须包含 alignedTo + requirementsHash
- R1 Traceability - ROADMAP 必须显式引用需求 ID（覆盖率 100%）
- R2 MVP 可交付性 - 必须存在 MVP/Phase 1/里程碑 1 段落
- R3 依赖与风险 - ROADMAP 必须有 Dependencies/Risks 段落
- R4 范围膨胀风险 - 检测"可能/可选/未来"关键词（warning）

**更新检查清单**: 10 项 → 12 项

**更新评分决策规则**:
- Critical 项（R0-R3）: 一票否决
- Non-Critical 项（R4 + 1-5, 7-8）: 1-2 项失败→条件通过，3 项 + 失败→驳回

**修改文件**:
- bundled-skills/roadmapping/SKILL.md
- adapters/opencode.js
- templates/PRD-template.md
- templates/TRD-template.md
```

---

### 2.6 templates/PRD-template.md v3.1.5

**新增内容**:
```markdown
## AI 工具配置

**AI 工具选择**: 根据 config.yaml 中的 `defaultAITool` 配置
- 可选值：opencode / claude-code / custom
- 每个阶段可单独配置 AI 工具

**配置文件位置**: `04_coding/src/config.yaml`

**配置示例**:
```yaml
global:
  defaultAITool: opencode

stages:
  designing:
    aiTool: opencode
```
```

---

### 2.7 templates/TRD-template.md v3.1.5

**新增内容**:
```markdown
## AI 工具配置

**AI 工具选择**: 根据 config.yaml 中的 `defaultAITool` 配置
- 可选值：opencode / claude-code / custom
- 每个阶段可单独配置 AI 工具

**配置文件位置**: `04_coding/src/config.yaml`

**配置示例**:
```yaml
global:
  defaultAITool: opencode

stages:
  designing:
    aiTool: opencode
```

**系统架构图**:
- 使用"AI 工具（执行者）"描述，不硬编码具体工具名称
- 说明根据 config.yaml 配置选择
```

---

## 三、Git 提交建议

```bash
git add 01_designing/PRD.md
git add 01_designing/TRD.md
git add 04_coding/src/adapters/opencode.js
git add 04_coding/src/bundled-skills/roadmapping/SKILL.md
git add CHANGELOG.md
git add templates/PRD-template.md
git add templates/TRD-template.md
git add 05_reviewing/REVIEW-REPORT-v3.1.5.md

git commit -m "feat: ROADMAPPING 审阅 Agent 规则优化 v3.1.5

新增规则（4 项 critical + 1 项 non-critical）:
- R0 Freshness 对齐 - ROADMAP.md 必须包含 alignedTo + requirementsHash
- R1 Traceability - ROADMAP 必须显式引用需求 ID（覆盖率 100%）
- R2 MVP 可交付性 - 必须存在 MVP/Phase 1/里程碑 1 段落
- R3 依赖与风险 - ROADMAP 必须有 Dependencies/Risks 段落
- R4 范围膨胀风险 - 检测"可能/可选/未来"关键词（warning）

更新检查清单：10 项 → 12 项
更新评分决策规则：critical 项一票否决

修改文件:
- 01_designing/PRD.md（追加第 15-16 章）
- 01_designing/TRD.md（追加第 12-13 章）
- 04_coding/src/adapters/opencode.js（更新任务描述）
- 04_coding/src/bundled-skills/roadmapping/SKILL.md（更新检查清单）
- CHANGELOG.md（追加 v3.1.5 记录）
- templates/PRD-template.md（更新 AI 工具配置）
- templates/TRD-template.md（更新 AI 工具配置）

验收得分：99.5%
审阅决策：pass"

git tag v3.1.5
git push origin master --tags
```

---

*改动文件清单 by openclaw-ouyp*  
**版本**: v3.1.5 | **日期**: 2026-04-02 16:53 | **状态**: 完成 ✅
