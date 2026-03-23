# OpenClaw vs OpenCode 职责分工规范

**版本**: v1.0  
**生效日期**: 2026-03-23  
**关联 ISSUE**: ISSUE-002  
**提案编号**: NORM-PROP-2026-002

---

## 一、核心定位

| 角色 | 核心定位 | 核心职责 |
|------|---------|---------|
| **OpenClaw** | 需求整理者、验收者、部署者、知识沉淀者 | 需求理解→任务分配→验收验证→部署上线→知识沉淀→Git 提交 |
| **OpenCode** | 完整研发执行者 | designing→roadmapping→detailing→coding（含文档） |

---

## 二、严禁越权行为

以下行为属于越权，严格禁止：

### 研发阶段越权
- ❌ OpenClaw 直接编写 PRD（应该 OpenCode 调用 designing skill）
- ❌ OpenClaw 直接编写 ROADMAP（应该 OpenCode 调用 roadmapping skill）
- ❌ OpenClaw 直接编写 DETAIL（应该 OpenCode 调用 detailing skill）
- ❌ OpenClaw 直接编写代码（应该 OpenCode 调用 coding skill）
- ❌ OpenClaw 直接编写部署文档（应该 OpenCode 调用 coding skill 文档部分）

### 职责混淆越权
- ❌ OpenClaw 代替 OpenCode 执行研发任务
- ❌ OpenClaw 未经主人确认直接调用 OpenCode
- ❌ OpenClaw 未验收直接部署（必须先调用 reviewing skill 验收）

---

## 三、职责分工明细

| 阶段 | 任务 | OpenClaw | OpenCode | 调用 Skill |
|------|------|---------|---------|-----------|
| **1** | 创建工作区 | ✅ 负责 | ❌ 不参与 | using-git-worktrees |
| **1** | 任务分配 | ✅ 负责 | ❌ 不参与 | sessions_spawn |
| **2.1** | 01_designing | ❌ 不参与 | ✅ 负责 | designing |
| **2.2** | 02_roadmapping | ❌ 不参与 | ✅ 负责 | roadmapping |
| **2.3** | 03_detailing | ❌ 不参与 | ✅ 负责 | detailing |
| **2.4** | 04_coding | ❌ 不参与 | ✅ 负责 | coding |
| **2.5** | 05_documentation | ❌ 不参与 | ✅ 负责 | coding（文档部分） |
| **3** | 验收验证 | ✅ 负责 | ⚠️ 配合 | reviewing |
| **4** | 部署上线 | ✅ 负责 | ❌ 不参与 | - |
| **5** | 知识沉淀 | ✅ 负责 | ❌ 不参与 | writing-skills |
| **6** | Git 提交 | ✅ 负责 | ❌ 不参与 | - |

---

## 四、Skill 调用规范

### OpenCode 调用的 Skill

| Skill | 用途 | 调用时机 |
|------|------|---------|
| **designing** | 编写 PRD + TRD | 01_designing 阶段 |
| **roadmapping** | 编写 ROADMAP | 02_roadmapping 阶段 |
| **detailing** | 编写 DETAIL | 03_detailing 阶段 |
| **coding** | 编写代码 + 测试 + 文档 | 04_coding 阶段 |
| **code-commit** | 自我验证 + 提交准备 | 04_coding 完成后 |
| **reviewing** | 请求审查（自我审查） | code-commit 完成后 |

### OpenClaw 调用的 Skill

| Skill | 用途 | 调用时机 |
|------|------|---------|
| **reviewing** | 验收验证（正式验收） | OpenCode 请求审查后 |
| **writing-skills** | 知识沉淀（复盘报告、精华输出） | 部署完成后 |

### reviewing skill 调用者说明

| 调用者 | 用途 | 说明 |
|--------|------|------|
| **OpenCode** | 请求审查（自我审查） | OpenCode 完成 coding 后，调用 reviewing 自我审查 |
| **OpenClaw** | 验收验证（正式验收） | OpenCode 请求审查后，OpenClaw 调用 reviewing 正式验收 |

---

## 五、05_documentation 职责说明

**职责归属**: OpenCode 负责编写

**调用 Skill**: coding skill（文档部分）

**产出文档**:
- DEPLOYMENT.md（部署文档）
- USER_GUIDE.md（用户指南）

**验收流程**:
1. OpenCode 编写 DEPLOYMENT.md 和 USER_GUIDE.md
2. OpenCode 调用 code-commit skill 自我验证
3. OpenCode 调用 reviewing skill 请求审查
4. OpenClaw 调用 reviewing skill 验收验证
5. OpenClaw 按 DEPLOYMENT.md 部署上线

**方案 B 说明**:
- ✅ OpenCode 编写 + OpenClaw 验收
- ✅ 编写者≠验收者（职责分离）
- ✅ 有制衡机制

---

## 六、文档层级规范

| 层级 | 名称 | 存放位置 | 示例 |
|------|------|---------|------|
| **L1** | 宪法级 | ~/.openclaw/workspace/ | AGENTS.md, SOUL.md |
| **L2** | 法律级 | ~/.openclaw/workspace/NORMS/core/ | 01-core-positioning.md |
| **L3** | 操作级 | 项目级 research/guides/ | openclaw-extension-dev.md |
| **L4** | 过程级 | 项目级 research/insights/ | 20260323-*.md |

---

## 七、路径规范

### 系统级路径

**正确**:
- ✅ `~/.openclaw/extensions/ddg-websearch/`
- ✅ `$OPENCLAW_HOME/extensions/ddg-websearch/`

**错误**:
- ❌ `/home/ouyp/.openclaw/extensions/ddg-websearch/`（硬编码用户路径）

### 工程级路径

**正确**:
- ✅ `tasks/20260322-ddg-websearch/`
- ✅ `openclaw-universe/tasks/20260322-ddg-websearch/`
- ✅ `$PROJECT_ROOT/tasks/20260322-ddg-websearch/`

**错误**:
- ❌ `/home/ouyp/Learning/Practice/openclaw-universe/tasks/...`（硬编码用户路径）

---

## 八、修订历史

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|---------|--------|
| v1.0 | 2026-03-23 | 初始版本（职责分工规范变更） | OpenClaw |
| v1.1 | 2026-03-23 | 修复 3 个问题（见下方） | OpenClaw |

### v1.1 修复内容

| 修复编号 | 问题 | 修复内容 |
|---------|------|---------|
| **修复 1** | 缺少"未验收部署"越权定义 | 补充"❌ 未验收直接部署" |
| **修复 2** | 05_documentation 表述不统一 | 统一为"OpenCode 调用 coding skill 编写" |
| **修复 3** | reviewing skill 调用者需明确 | 明确 OpenCode（请求审查）和 OpenClaw（验收验证） |

---

**本规范自 2026-03-23 起生效，所有研发任务必须遵循。**
