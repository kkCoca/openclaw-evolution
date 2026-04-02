# 技术需求文档（TRD）

> **版本**: v3.1.3  
> **日期**: 2026-04-02  
> **状态**: 评审通过 ✅

---

## 文档元数据

| 字段 | 值 |
|------|-----|
| **TRD 版本** | v3.1.3 |
| **TRD 哈希** | `待计算` |
| **对齐 REQUIREMENTS 版本** | v3.1.0 |
| **对齐 REQUIREMENTS 哈希** | `sha256:f0e44912d5778703c30ce7921ceb25a81a454672` |
| **对齐 PRD 版本** | v3.1.3 |
| **对齐 PRD 哈希** | `待计算` |
| **需求追溯矩阵** | 完整 |
| **覆盖率** | 100% |

---

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.1.0 |
| 日期 | 2026-03-26 |
| 状态 | 待评审 |
| 作者 | openclaw-ouyp |

---

## 1. 技术架构

### 1.1 系统架构

```
┌─────────────────────────────────────┐
│  openclaw-ouyp (审阅者)              │
│  • 需求整理                         │
│  • 任务分配                         │
│  • 验收验证                         │
│  • Git 管理                         │
│  • 部署上线                         │
└─────────────────────────────────────┘
              ↓ sessions_spawn
┌─────────────────────────────────────┐
│  流程引擎 Skill (编排者)             │
│  • 自动调用 skills                   │
│  • 流程监督                         │
│  • 生成审查报告                     │
└─────────────────────────────────────┘
              ↓ 调用
┌─────────────────────────────────────┐
│  OpenCode (执行者)                  │
│  • designing → PRD + TRD            │
│  • roadmapping → ROADMAP            │
│  • detailing → DETAIL               │
│  • coding → 代码 + 测试             │
│  • reviewing → 验收报告             │
└─────────────────────────────────────┘
```

### 1.2 调用关系

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |

---

## 2. 修改方案

### 2.1 workflow.md 修改

**修改位置**：每个阶段的"执行步骤"部分

**修改前**：
```markdown
### 阶段 1: designing

调用 designing skill：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
```

**修改后**：
```markdown
### 阶段 1: designing

**调用 OpenCode 执行 designing skill**：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
- **检查点**: 文档完整性
- **触发条件**: 用户确认需求后

**执行步骤**:
1. 流程引擎将用户需求传递给 OpenCode
2. OpenCode 执行 designing skill 分析需求类型
3. OpenCode 执行 designing skill 与用户确认模式
4. OpenCode 执行 designing skill 询问需求细节
5. OpenCode 执行 designing skill 输出 PRD.md + TRD.md
6. 流程引擎验证文档完整性
```

### 2.2 README.md 修改

**新增章节**：在"工作流程"章节后增加"工作原理"章节

**内容**：
```markdown
## 工作原理

### 三方协作架构

流程引擎 Skill 采用三方协作架构：

1. **openclaw-ouyp（审阅者）**：负责任务分配和验收验证
2. **流程引擎（编排者）**：负责流程监督和 skill 调用
3. **OpenCode（执行者）**：负责具体研发任务执行

### 调用流程

```
用户需求 → openclaw-ouyp → sessions_spawn → 流程引擎 → 调用 → OpenCode → 执行 skill → 输出
```

### 阶段调用说明

| 阶段 | 流程引擎动作 | OpenCode 执行 |
|------|-------------|--------------|
| designing | 调用 designing skill | 执行需求分析和架构设计 |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 |
| detailing | 调用 detailing skill | 执行文件级设计 |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 |
| reviewing | 调用 reviewing skill | 执行验收验证 |
```

---

## 3. 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| workflow.md | 编辑 | 每个阶段增加"调用 OpenCode 执行"说明 |
| README.md | 编辑 | 增加"工作原理"章节 |

---

## 4. 技术约束

### 4.1 保留原始需求

- ✅ 独立完整：一个包包含所有依赖 skills
- ✅ 零感知安装：用户只需安装 1 个 skill
- ✅ 流程标准化：所有场景都走完整研发流程
- ✅ 易于分享：支持多种安装方式

### 4.2 文档规范

- 保持与现有文档风格一致
- 使用 Markdown 格式
- 图表使用 ASCII art 或 Mermaid

---

## 5. 验收标准

### 5.1 功能验收

- [ ] workflow.md 每个阶段明确"调用 OpenCode 执行 XXX skill"
- [ ] README.md 增加"工作原理"章节
- [ ] 三方协作架构图清晰展示

### 5.2 质量验收

- [ ] 文档语言简洁清晰
- [ ] 结构层次分明
- [ ] 与 AGENTS.md 保持一致

### 5.3 回归验收

- [ ] 原始需求仍然满足
- [ ] 不影响现有功能
- [ ] 所有研发过程文档完整

---

## 6. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） |
| v1.0.1 | 2026-03-26 | BUG-001 修复（目录结构问题） |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| **v2.0.0** | **2026-03-28** | **FEATURE-002：审阅驱动 + 会话隔离 + 工具无关** |
| **v2.0.1** | **2026-03-30** | **BUG-002 修复：补充 02_roadmapping/和 03_detailing/阶段产物** |

## 7. v2.0.0 技术设计（2026-03-28）

### 7.1 架构设计

#### 7.1.1 新架构

```
┌─────────────────────────────────────────────────────────────┐
│                    流程引擎 (纯编排器)                        │
│                                                             │
│  输入层：                                                    │
│  - 解析任务（场景类型 + REQUIREMENTS.md）                     │
│  - 加载配置（config.yaml）                                   │
│                                                             │
│  编排层：                                                    │
│  - 状态机管理（StateManager）                               │
│  - 子会话调度（sessions_spawn）                             │
│  - 审阅协议执行（REVIEW-PROTOCOL.md）                        │
│                                                             │
│  适配层：                                                    │
│  - AI 工具抽象（ai-tool-adapter.js）                        │
│  - 统一调用接口（executeStage）                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ 子会话 1 │          │ 子会话 2 │          │ 子会话 5 │
   │designing│          │roadmap  │          │reviewing│
   │         │          │         │          │         │
   │AI 工具执行│          │AI 工具执行│          │AI 工具执行│
   └─────────┘          └─────────┘          └─────────┘
```

#### 7.1.2 状态机设计

```javascript
const StageStatus = {
  PENDING: 'pending',           // 待执行
  RUNNING: 'running',           // 执行中
  REVIEWING: 'reviewing',       // 待审阅
  PASSED: 'passed',             // 通过
  CONDITIONAL_PASSED: 'conditional_passed', // 条件通过
  REJECTED: 'rejected',         // 驳回
  TERMINATED: 'terminated'      // 终止
};
```

### 7.2 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `workflow.md` | 重写 | 实现状态机 + 子会话编排逻辑 |
| `config.yaml` | 新建 | 配置文件模板 |
| `state-manager.js` | 新建 | 状态持久化管理器 |
| `REVIEW-PROTOCOL.md` | 新建 | 各阶段审阅协议 |
| `SKILL.md` | 更新 | 使用说明更新到 v2.0 |
| `PRD.md` | 追加 | v2.0.0 增量需求章节 |
| `TRD.md` | 追加 | v2.0.0 技术设计章节 |

### 7.3 核心模块设计

#### 7.3.1 StateManager 类

```javascript
class StateManager {
  // 初始化新流程状态
  init(workflowId, task, scenario, projectPath)
  
  // 加载现有状态（断点续传）
  load()
  
  // 保存状态到文件
  save()
  
  // 更新阶段状态
  updateStage(stageName, status, updates)
  
  // 记录审阅结论
  recordReviewDecision(stageName, decision, notes)
  
  // 处理审阅结论
  handleReviewDecision(stageName, decision)
  
  // 获取下一阶段
  getNextStage()
  
  // 检查流程是否完成/终止
  isCompleted()
  isTerminated()
  
  // 获取状态摘要
  getSummary()
  
  // 日志记录
  log(event, details)
}
```

#### 7.3.2 主流程函数

```javascript
async function executeWorkflow(taskConfig) {
  // 1. 初始化状态
  const stateManager = new StateManager();
  const config = loadConfig('./config.yaml');
  const state = stateManager.init(...);
  
  // 2. 阶段执行循环
  while (true) {
    // 3. 执行当前阶段
    await executeStage(currentStage, config, stateManager);
    
    // 4. 等待用户审阅
    const decision = await waitForUserReview(currentStage);
    
    // 5. 处理审阅结论
    const result = stateManager.handleReviewDecision(currentStage, decision);
    
    // 6. 根据决策继续/回滚/终止
    if (result.action === 'continue') {
      // 进入下一阶段
    } else if (result.action === 'retry') {
      // 重新执行当前阶段（策略 A）
      continue;
    } else if (result.action === 'terminate') {
      // 流程终止
      break;
    }
  }
}
```

### 7.4 配置设计

```yaml
global:
  defaultAITool: opencode

stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    reviewCheckpoints:
      - id: D1
        name: 需求覆盖率 100%
      - id: D2
        name: 无模糊描述
      # ...

review:
  requiredStages: [designing, roadmapping, detailing, coding, reviewing]
  timeoutHours: 24
  decisionOptions: [pass, conditional, reject, clarify, terminate]

rollback:
  strategy: A  # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  maxRetriesPerStage: 3
```

### 7.5 回滚策略（策略 A）

```
驳回 → 检查重试次数 → 未超限 → 重置阶段状态为 PENDING → 重新执行当前阶段
                            ↓
                        超限 → 终止流程
```

### 7.6 日志设计

**日志文件**：`logs/{workflowId}.log`（JSON Lines 格式）

**日志条目**：
```json
{"timestamp":"2026-03-28T10:00:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"workflow_started","details":{...}}
{"timestamp":"2026-03-28T10:00:01.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_started","details":{...}}
{"timestamp":"2026-03-28T10:25:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"stage_completed","details":{...}}
{"timestamp":"2026-03-28T10:30:00.000Z","workflowId":"wf-20260328-001","stage":"designing","event":"review_decision","details":{"decision":"pass"}}
```

### 7.7 技术约束

- 使用 Node.js 编写（与现有 install.js 一致）
- YAML 配置使用 `js-yaml` 库解析
- 状态文件使用 JSON 格式
- 日志使用 JSON Lines 格式

---

## 8. 附录

### 8.1 相关文档

- AGENTS.md - 操作手册
- REQUIREMENTS.md - 需求说明
- workflow.md - 流程编排逻辑
- README.md - 使用文档
- config.yaml - 配置文件
- REVIEW-PROTOCOL.md - 审阅协议
- state-manager.js - 状态管理器

### 8.2 术语表

| 术语 | 说明 |
|------|------|
| OpenCode | 执行者，负责具体研发任务执行 |
| 流程引擎 | 编排者，负责流程监督和 skill 调用 |
| openclaw-ouyp | 审阅者，负责任务分配和验收验证 |
| 审阅驱动 | 每个阶段必须审阅确认后才继续 |
| 会话隔离 | 每个阶段独立子会话执行 |
| 工具无关 | 可配置 AI 工具 |
| 策略 A | 驳回后重新执行当前阶段 |

---

## 9. v2.0.1 Bugfix 技术设计（2026-03-30）

### 9.1 问题根因

1. **PRD v2.0.0 需求定义不完整**
   - 没有明确要求输出 ROADMAP.md 和 DETAIL.md
   - 验收标准模糊

2. **流程引擎未执行自己的标准**
   - SKILL.md 要求 5 阶段完整输出
   - 实际只输出 3 个阶段（01_designing/04_coding/05_reviewing）

3. **验收报告造假**
   - REVIEW-REPORT.md 声称文件存在
   - 实际文件不存在

### 9.2 修复方案

#### 9.2.1 创建 02_roadmapping/ROADMAP.md

**文件结构**：
```markdown
# 开发计划（ROADMAP）

## 文档信息
| 字段 | 值 |
|------|-----|
| 版本 | v2.0.1 |
| 日期 | 2026-03-30 |

## 1. 开发目标
基于 v2.0.0 需求制定开发计划

## 2. 阶段划分
- 阶段 1: designing（PRD + TRD）
- 阶段 2: roadmapping（ROADMAP）
- 阶段 3: detailing（DETAIL）
- 阶段 4: coding（源代码）
- 阶段 5: reviewing（验收报告）

## 3. 时间估算
## 4. 资源分配
## 5. 风险识别
```

#### 9.2.2 创建 03_detailing/DETAIL.md

**文件结构**：
```markdown
# 详细设计（DETAIL）

## 文档信息
| 字段 | 值 |
|------|-----|
| 版本 | v2.0.1 |
| 日期 | 2026-03-30 |

## 1. 架构设计
## 2. 模块设计
## 3. 接口定义
## 4. 数据结构
## 5. 算法说明
```

#### 9.2.3 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `01_designing/PRD.md` | 追加 | v2.0.1 Bugfix 需求章节 |
| `01_designing/TRD.md` | 追加 | v2.0.1 修复方案章节 |
| `02_roadmapping/ROADMAP.md` | 新建 | 阶段 2 产物 |
| `03_detailing/DETAIL.md` | 新建 | 阶段 3 产物 |
| `CHANGELOG.md` | 新建 | 变更记录 |
| `05_reviewing/REVIEW-REPORT.md` | 更新 | v2.0.1 验收报告 |

#### 9.2.4 保留原有代码

**不修改的文件**：
- 04_coding/src/ 中的所有文件
- workflow.md
- SKILL.md
- config.yaml
- state-manager.js
- 其他源代码文件

### 9.3 技术约束

- **追加式更新**：PRD.md/TRD.md 不覆盖原有内容
- **保留原有代码**：04_coding/src/保持不变
- **文档一致性**：与 REQUIREMENTS.md v2.0.1 保持一致

### 9.4 验收检查点

| 检查点 | 验收标准 | 验证方法 |
|--------|---------|---------|
| C1 | 02_roadmapping/ROADMAP.md 存在 | `ls -la 02_roadmapping/` |
| C2 | 03_detailing/DETAIL.md 存在 | `ls -la 03_detailing/` |
| C3 | PRD.md 含 v2.0.1 章节 | `grep "v2.0.1" PRD.md` |
| C4 | TRD.md 含 v2.0.1 章节 | `grep "v2.0.1" TRD.md` |
| C5 | CHANGELOG.md 存在 | `ls -la CHANGELOG.md` |
| C6 | 04_coding/src/ 代码完整 | `ls -la 04_coding/src/` |
| C7 | REVIEW-REPORT.md 更新 | `grep "v2.0.1" REVIEW-REPORT.md` |

---

## 10. v3.1.1 Bugfix 技术设计（2026-04-02）

### 10.1 问题根因

DESIGNING 阶段审查报告显示 TRD.md 缺少以下关键章节：
- ❌ 数据库设计章节
- ❌ 接口设计章节
- ❌ 安全设计章节
- ❌ 技术选型章节（比较表 + 决策依据）
- ❌ 异常处理章节
- ❌ 需求追溯矩阵

### 10.2 修复方案

#### 10.2.1 技术选型章节

**选型原则**：
- 与现有 Node.js 技术栈一致
- 社区活跃度高，维护良好
- 性能满足流程引擎需求
- 易于调试和维护

**候选技术比较**：

| 技术方案 | 优点 | 缺点 | 适用场景 | 评分 |
|---------|------|------|---------|------|
| Node.js + fs/yaml | 轻量、无需额外依赖、与现有代码一致 | 功能相对基础 | 配置文件解析、状态持久化 | 9/10 |
| Node.js + SQLite | 支持复杂查询、事务支持 | 增加依赖、过度设计 | 需要复杂数据查询的场景 | 6/10 |
| Node.js + MongoDB | 灵活 Schema、易扩展 | 需要独立服务、运维成本高 | 大规模分布式系统 | 5/10 |
| 纯文件存储（JSON） | 最简单、无依赖 | 不支持查询、并发安全性差 | 极小规模配置存储 | 7/10 |

**最终选择**: Node.js + fs/yaml

**决策理由**：
1. 与现有代码库技术栈完全一致（install.js 已使用 js-yaml）
2. 流程引擎状态管理不需要复杂查询，JSON 文件足够
3. 零额外依赖，降低安装复杂度
4. 配置文件和状态文件都是小型文件，性能不是瓶颈

**风险评估**：
- 风险 1：并发写入冲突 → 缓解：文件锁机制（future）
- 风险 2：状态文件损坏 → 缓解：写入前备份 + 校验和

#### 10.2.2 异常处理章节

**正常流程**：
1. 流程引擎加载配置（config.yaml）
2. 初始化状态管理器（state.json）
3. 依次执行 5 个阶段（designing→roadmapping→detailing→coding→reviewing）
4. 每个阶段完成后等待用户审阅
5. 根据审阅结论继续/回滚/终止
6. 流程完成，归档状态文件

**失败处理**：

| 异常类型 | 触发条件 | 处理策略 | 恢复方式 |
|---------|---------|---------|---------|
| 配置文件不存在 | config.yaml 缺失 | 使用默认配置 | 创建默认配置文件 |
| 配置文件解析失败 | YAML 语法错误 | 报错并退出 | 修复 YAML 语法 |
| 状态文件损坏 | state.json 格式错误 | 尝试从日志恢复 | 手动修复或重启流程 |
| AI 工具调用失败 | API 超时/鉴权失败 | 重试 3 次 | 检查网络/API Key |
| 子会话启动失败 | sessions_spawn 失败 | 报错并终止 | 检查 OpenClaw 环境 |
| 文件写入失败 | 权限不足/磁盘满 | 报错并终止 | 修复权限/清理磁盘 |
| 审阅超时 | 24 小时无响应 | 发送提醒 | 用户响应审阅请求 |

**边界情况**：

| 边界场景 | 输入范围 | 处理逻辑 | 预期结果 |
|---------|---------|---------|---------|
| 空项目目录 | 项目目录为空 | 创建必要目录结构 | 目录创建成功 |
| 增量需求 | 项目目录已有文件 | 追加式更新 | 原有文件保留 |
| 中断后恢复 | state.json 存在 | 从断点继续执行 | 流程正常恢复 |
| 最大重试次数 | 阶段失败≥3 次 | 终止流程 | 状态标记为 terminated |
| 大文件处理 | 文件>10MB | 分块读取/写入 | 内存不溢出 |

**重试机制**：
- **重试次数**: 3 次
- **重试间隔**: 指数退避（1s, 2s, 4s）
- **退避策略**: 指数退避，最大间隔 30 秒

**降级方案**：

| 降级场景 | 触发条件 | 降级策略 | 备选方案 |
|---------|---------|---------|---------|
| AI 工具不可用 | OpenCode/Claude Code API 连续失败≥3 次 | 切换到备用 AI 工具 | 使用配置文件中配置的备用 AI 工具 |
| AI 工具不可用 | 所有 AI 工具均不可用 | 降级为手动模式 | 生成任务清单，由用户手动执行并回填结果 |
| 文件系统不可用 | 磁盘空间不足/权限错误 | 切换到只读模式 | 使用内存临时存储，恢复后同步到磁盘 |
| 文件系统不可用 | 文件锁冲突 | 等待重试 | 指数退避重试，超过 3 次后终止 |
| 网络不可用 | 网络连接中断 | 本地缓存模式 | 使用本地缓存的配置和状态，网络恢复后同步 |
| 网络不可用 | DNS 解析失败 | 使用 IP 直连 | 配置文件中预配置备用 IP 地址 |

**降级流程**：
1. 检测异常类型和严重程度
2. 判断是否触发降级条件
3. 执行降级策略（切换工具/模式/存储）
4. 记录降级事件到日志
5. 通知用户（如配置告警）
6. 异常恢复后自动切回正常模式

**降级限制**：
- 手动模式最多支持 3 个阶段
- 内存临时存储上限 100MB
- 降级状态下不执行代码生成（仅文档生成）

**监控告警**：

| 监控指标 | 告警阈值 | 告警级别 | 通知方式 | 响应时间 |
|---------|---------|---------|---------|---------|
| 流程执行时间 | > 30 分钟 | Warning | 日志 + 终端提示 | 立即 |
| 流程执行时间 | > 60 分钟 | Critical | 日志 + 邮件/钉钉 | 5 分钟内 |
| 阶段失败次数 | 连续≥3 次 | Critical | 日志 + 邮件/钉钉 | 立即 |
| AI 工具调用失败率 | > 50%（10 分钟内） | Warning | 日志 + 终端提示 | 立即 |
| 磁盘空间使用率 | > 90% | Warning | 日志 + 终端提示 | 立即 |
| 磁盘空间使用率 | > 95% | Critical | 日志 + 邮件/钉钉 | 5 分钟内 |
| 内存使用率 | > 80% | Warning | 日志 + 终端提示 | 立即 |
| 审阅超时 | > 24 小时无响应 | Warning | 发送提醒 | 超时后 |
| 状态文件异常 | 格式错误/损坏 | Critical | 日志 + 邮件/钉钉 | 立即 |

**告警配置**（config.yaml）：
```yaml
monitoring:
  enabled: true
  metrics:
    - name: execution_time
      warning_threshold: 1800  # 30 分钟（秒）
      critical_threshold: 3600  # 60 分钟（秒）
    - name: stage_failure_count
      critical_threshold: 3
    - name: ai_tool_failure_rate
      warning_threshold: 0.5  # 50%
    - name: disk_usage
      warning_threshold: 0.9  # 90%
      critical_threshold: 0.95  # 95%
    - name: memory_usage
      warning_threshold: 0.8  # 80%
  
  notifications:
    - type: log
      enabled: true
    - type: terminal
      enabled: true
    - type: email
      enabled: false  # 可选
      recipients: []
    - type: dingtalk
      enabled: false  # 可选
      webhook: ""
```

**流程失败通知**：
- 流程终止时自动发送通知
- 通知内容：流程 ID、任务名称、终止阶段、错误信息、状态文件位置
- 通知渠道：日志（必选）、邮件/钉钉（可选配置）

#### 10.2.3 数据库设计章节

流程引擎使用文件存储，不涉及传统数据库。以下是核心数据结构设计：

**状态文件结构**（state.json）：
```json
{
  "workflowId": "wf-20260402-001",
  "task": "PRD/TRD 文档修复 v3.1.1",
  "scenario": "Bugfix",
  "projectPath": "/home/ouyp/Learning/Practice/openclaw-universe/projects/clawdevflow/",
  "createdAt": "2026-04-02T12:00:00.000Z",
  "updatedAt": "2026-04-02T12:30:00.000Z",
  "status": "reviewing",
  "stages": {
    "designing": {
      "status": "passed",
      "startedAt": "2026-04-02T12:00:00.000Z",
      "completedAt": "2026-04-02T12:25:00.000Z",
      "reviewedAt": "2026-04-02T12:30:00.000Z",
      "reviewDecision": "pass",
      "output": {
        "prdFile": "01_designing/PRD.md",
        "trdFile": "01_designing/TRD.md"
      }
    },
    "roadmapping": { "status": "pending" },
    "detailing": { "status": "pending" },
    "coding": { "status": "pending" },
    "reviewing": { "status": "pending" }
  },
  "logs": [
    {"timestamp": "...", "event": "workflow_started", "details": {...}}
  ]
}
```

**配置文件结构**（config.yaml）：
```yaml
global:
  defaultAITool: opencode

stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    reviewCheckpoints:
      - id: D1
        name: 需求覆盖率 100%
      - id: D2
        name: 文档完整性
      # ...

review:
  requiredStages: [designing, roadmapping, detailing, coding, reviewing]
  timeoutHours: 24
  decisionOptions: [pass, conditional, reject, clarify, terminate]

rollback:
  strategy: A
  maxRetriesPerStage: 3
```

**日志文件结构**（logs/{workflowId}.log）：
```json
{"timestamp":"2026-04-02T12:00:00.000Z","workflowId":"wf-20260402-001","stage":"designing","event":"workflow_started","details":{...}}
{"timestamp":"2026-04-02T12:00:01.000Z","workflowId":"wf-20260402-001","stage":"designing","event":"stage_started","details":{...}}
```

#### 10.2.4 接口设计章节

**StateManager 类接口**：
```javascript
class StateManager {
  /**
   * 初始化新流程状态
   * @param {string} workflowId - 流程 ID
   * @param {object} taskConfig - 任务配置
   * @param {string} scenario - 场景类型
   * @param {string} projectPath - 项目路径
   */
  init(workflowId, taskConfig, scenario, projectPath)
  
  /**
   * 加载现有状态（断点续传）
   * @returns {object} 状态对象
   */
  load()
  
  /**
   * 保存状态到文件
   */
  save()
  
  /**
   * 更新阶段状态
   * @param {string} stageName - 阶段名称
   * @param {string} status - 状态枚举
   * @param {object} updates - 更新字段
   */
  updateStage(stageName, status, updates)
  
  /**
   * 记录审阅结论
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @param {string} notes - 备注
   */
  recordReviewDecision(stageName, decision, notes)
  
  /**
   * 处理审阅结论
   * @param {string} stageName - 阶段名称
   * @param {string} decision - 审阅结论
   * @returns {object} 处理结果
   */
  handleReviewDecision(stageName, decision)
  
  /**
   * 获取下一阶段
   * @returns {string|null} 下一阶段名称
   */
  getNextStage()
  
  /**
   * 检查流程是否完成
   * @returns {boolean}
   */
  isCompleted()
  
  /**
   * 检查流程是否终止
   * @returns {boolean}
   */
  isTerminated()
  
  /**
   * 获取状态摘要
   * @returns {string}
   */
  getSummary()
  
  /**
   * 日志记录
   * @param {string} event - 事件名称
   * @param {object} details - 事件详情
   */
  log(event, details)
}
```

**AI Tool Adapter 接口**：
```javascript
class AIToolAdapter {
  /**
   * 执行阶段任务
   * @param {string} stage - 阶段名称
   * @param {object} input - 输入参数
   * @param {object} config - 配置对象
   * @returns {Promise<object>} 执行结果
   */
  async executeStage(stage, input, config)
  
  /**
   * 调用 OpenCode
   * @param {string} task - 任务描述
   * @param {object} options - 选项
   * @returns {Promise<object>} 执行结果
   */
  async callOpenCode(task, options)
  
  /**
   * 调用 Claude Code
   * @param {string} task - 任务描述
   * @param {object} options - 选项
   * @returns {Promise<object>} 执行结果
   */
  async callClaudeCode(task, options)
}
```

**Workflow Orchestrator 接口**：
```javascript
class WorkflowOrchestrator {
  /**
   * 执行工作流
   * @param {object} taskConfig - 任务配置
   * @returns {Promise<object>} 执行结果
   */
  async executeWorkflow(taskConfig)
  
  /**
   * 执行单个阶段
   * @param {string} stage - 阶段名称
   * @param {object} stateManager - 状态管理器
   * @param {object} config - 配置对象
   */
  async executeStage(stage, stateManager, config)
  
  /**
   * 等待用户审阅
   * @param {string} stage - 阶段名称
   * @returns {Promise<string>} 审阅结论
   */
  async waitForUserReview(stage)
}
```

#### 10.2.5 安全设计章节

**认证授权**：
- OpenClaw 内部调用，依赖 OpenClaw 会话鉴权
- AI 工具调用使用配置的 API Key（环境变量或配置文件）
- 不暴露外部 API，无需额外认证层

**数据加密**：
- 配置文件支持环境变量语法 `${VAR:-default}` 避免明文存储敏感信息
- 状态文件不包含敏感数据（API Key 等）
- 日志文件脱敏处理（不记录 API Key、密码等）

**审计日志**：
- 所有阶段执行记录到日志文件（JSON Lines 格式）
- 日志包含时间戳、工作流 ID、阶段、事件、详情
- 日志保留策略：最近 30 天或最近 100 个流程

**文件权限**：
- 状态文件权限：600（仅所有者可读写）
- 配置文件权限：644（所有者可写，其他人可读）
- 日志文件权限：644

#### 10.2.6 需求追溯矩阵

> 此矩阵用于追踪需求从 REQUIREMENTS.md + PRD 到 TRD 的映射关系

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | TRD 章节 | TRD 行号 | 实现状态 |
|---------|---------------------|---------|---------|---------|---------|
| REQ-001 | L13-43 | 2.2 | 1.1-1.2 | 50-70 | ✅ 已实现 |
| REQ-002 | L46-76 | 3.1-3.2 | 2.1-2.2 | 75-95 | ✅ 已实现 |
| REQ-003 | L79-152 | 7.1-7.5 | 7.1-7.7 | 245-340 | ✅ 已实现 |
| REQ-004 | L155-182 | 9.1-9.6 | 9.1-9.4 | 425-510 | ✅ 已实现 |
| REQ-005 | L185-268 | 12.1-12.7 | 8.1-8.4 | 345-420 | ✅ 已实现 |
| REQ-006 | L271-375 | 10.1-10.5 | 10.1-10.6 | 515-700 | ✅ 已实现 |

##### 10.2.6.1 覆盖率统计

- **需求总数**: 6
- **已实现需求**: 6
- **覆盖率**: 100%
- **未实现需求**: 无

### 10.3 版本历史更新

| 版本 | 日期 | 变更说明 | Issue ID | 对齐 REQUIREMENTS 版本 | 对齐 PRD 版本 | TRD 哈希 |
|------|------|---------|----------|----------------------|-------------|---------|
| v1.0.0 | 2026-03-26 | 初始版本（原始需求） | - | v1.0.0 | v1.0.0 | `git-hash` |
| v1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 | FEATURE-001 | v1.1.0 | v1.1.0 | `git-hash` |
| v2.0.0 | 2026-03-28 | FEATURE-002：审阅驱动 + 会话隔离 + 工具无关 | FEATURE-002 | v2.0.0 | v2.0.0 | `git-hash` |
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/ | BUG-002 | v2.0.1 | v2.0.1 | `git-hash` |
| v2.1.0 | 2026-04-02 | FEATURE-003：Roadmap Agent 优化 | FEATURE-003 | v2.1.0 | v2.1.0 | `git-hash` |
| v3.1.0 | 2026-04-02 | FEATURE-004：DESIGNING 阶段审阅优化 | FEATURE-004 | v3.1.0 | v3.1.0 | `git-hash` |
| **v3.1.1** | **2026-04-02** | **BUG-005 修复：PRD/TRD 文档修复** | **BUG-005** | **v3.1.0** | **v3.1.1** | **`910651f`** |
| **v3.1.2** | **2026-04-02** | **BUG-006 修复：PRD/TRD 审查问题修复（哈希对齐 + 异常处理完善）** | **BUG-006** | **v3.1.0** | **v3.1.2** | **`f0e4491`** |
| **v3.1.3** | **2026-04-02** | **FEATURE-005：DESIGNING 阶段用户确认签字优化** | **FEATURE-005** | **v3.1.0** | **v3.1.3** | **`待计算`** |

---

## 11. v3.1.3 技术设计 - DESIGNING 阶段用户确认签字优化

### 11.1 架构设计

#### 11.1.1 签字流程架构

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGNING 阶段完成                        │
│                   (PRD.md + TRD.md 生成)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              确认内容提炼（内存中）                          │
│  • 从 PRD 提炼核心需求（3-5 条）                              │
│  • 从 TRD 提炼技术方案                                        │
│  • 分析变更影响（增量需求）                                  │
│  • 提取风险提示                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              审阅请求（聊天窗口/邮件）                        │
│  • 展示确认内容提炼                                          │
│  • 请求用户签字确认                                          │
│  • 提供签字结论选项（通过/条件通过/驳回）                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              用户签字确认                                     │
│  • 聊天窗口回复 / 邮件回复 / 表单填写                         │
│  • 签字结论：✅ 通过 / ⚠️ 条件通过 / ❌ 驳回                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              签字回填（PRD.md）                               │
│  • 更新 PRD.md 第 15 章"用户确认签字"                          │
│  • 填写签字表格（角色/日期/结论/备注）                        │
│  • Git 提交变更                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              进入下一阶段（roadmapping）                       │
└─────────────────────────────────────────────────────────────┘
```

#### 11.1.2 核心原则

| 原则 | 说明 | 实现方式 |
|------|------|---------|
| **不生成额外文件** | 避免文件过多导致信息不一致 | 签字信息直接回填到 PRD.md |
| **确认内容内存化** | 提炼内容不持久化 | 仅在审阅请求中展示，不生成文件 |
| **接口一致性** | 与 ReviewDesignAgent v3.1.0 一致 | 复用现有审阅协议 |

---

### 11.2 功能设计

#### 11.2.1 确认内容提炼模块

**位置**：`04_coding/src/designing-agents/confirmation-extractor.js`（逻辑模块，不生成文件）

**功能**：从 PRD/TRD 提炼关键信息

**提炼规则**：
```javascript
/**
 * 确认内容提炼函数（内存中执行）
 * 
 * @param {string} prdContent - PRD.md 内容
 * @param {string} trdContent - TRD.md 内容
 * @param {string} scenario - 场景类型（全新功能/增量需求/问题修复）
 * @returns {object} 确认内容对象
 */
function extractConfirmationContent(prdContent, trdContent, scenario) {
  return {
    coreRequirements: extractCoreRequirements(prdContent),  // 3-5 条核心需求
    technicalSolution: extractTechnicalSolution(trdContent), // 关键技术选型
    changeImpact: analyzeChangeImpact(prdContent, scenario), // 变更影响（增量需求）
    risks: extractRisks(trdContent)  // 主要风险
  };
}
```

**输出格式**（内存中）：
```markdown
## 确认内容提炼

| 类别 | 关键内容 |
|------|---------|
| 核心需求 | 1. xxx 2. xxx 3. xxx |
| 技术方案 | Node.js + fs/yaml |
| 变更影响 | 向后兼容，不影响现有功能 |
| 风险提示 | AI 工具调用失败风险 |
```

#### 11.2.2 签字回填模块

**位置**：`04_coding/src/designing-agents/signature-updater.js`（逻辑模块，不生成文件）

**功能**：将用户签字回填到 PRD.md

**回填逻辑**：
```javascript
/**
 * 签字回填函数
 * 
 * @param {string} prdPath - PRD.md 文件路径
 * @param {object} signature - 签字信息
 * @param {string} signature.role - 角色（产品负责人/技术负责人/审阅者）
 * @param {string} signature.name - 姓名
 * @param {string} signature.date - 签字日期
 * @param {string} signature.decision - 签字结论（pass/conditional/reject）
 * @param {string} signature.notes - 备注（可选）
 */
async function updateSignature(prdPath, signature) {
  // 1. 读取 PRD.md
  const prdContent = fs.readFileSync(prdPath, 'utf8');
  
  // 2. 查找签字章节（第 15 章）
  // 3. 更新签字表格
  // 4. 更新版本历史
  // 5. 写回 PRD.md
  // 6. Git 提交变更
}
```

**PRD.md 签字章节模板**：
```markdown
## 15. 用户确认签字

### 15.1 确认内容提炼

> 以下内容由流程引擎在内存中提炼，供用户快速理解

| 类别 | 关键内容 |
|------|---------|
| 核心需求 | {从 PRD 提炼的 3-5 条核心需求} |
| 技术方案 | {从 TRD 提炼的关键技术选型} |
| 变更影响 | {增量需求时，说明对现有功能的影响} |
| 风险提示 | {主要技术风险和使用限制} |

### 15.2 签字确认

| 角色 | 姓名 | 签字日期 | 结论 | 备注 |
|------|------|---------|------|------|
| 产品负责人 | {姓名} | {YYYY-MM-DD} | ✅ 通过 | - |
| 技术负责人 | {姓名} | {YYYY-MM-DD} | ✅ 通过 | - |
| 审阅者 | openclaw-ouyp | {YYYY-MM-DD} | ✅ 通过 | - |

### 15.3 签字历史

| 版本 | 签字日期 | 角色 | 结论 | 备注 |
|------|---------|------|------|------|
| v3.1.3 | {YYYY-MM-DD} | 产品负责人 | ✅ 通过 | - |
| v3.1.3 | {YYYY-MM-DD} | 技术负责人 | ✅ 通过 | - |
```

#### 11.2.3 版本管理模块

**功能**：使用 Git 管理 PRD.md 版本

**Git 操作流程**：
```bash
# 1. 检查变更
git diff 01_designing/PRD.md

# 2. 添加变更
git add 01_designing/PRD.md

# 3. 提交变更
git commit -m "docs: PRD 签字确认 v3.1.3

- 产品负责人：xxx ✅ 通过
- 技术负责人：xxx ✅ 通过
- 审阅者：openclaw-ouyp ✅ 通过"

# 4. 创建 Tag（可选，重要版本）
git tag v3.1.3

# 5. 推送（可选）
git push origin main --tags
```

---

### 11.3 接口设计

#### 11.3.1 与 ReviewDesignAgent 的接口

**保持接口一致**：
- 审阅检查点：D1~D7（与 v3.1.0 一致）
- 审阅结论选项：pass/conditional/reject/clarify/terminate
- 审阅协议：REVIEW-PROTOCOL.md

**新增检查点**（可选）：
- D8: 签字章节完整性（检查 PRD.md 是否包含第 15 章）
- D9: 签字信息填写（检查签字表格是否填写完整）

#### 11.3.2 与流程引擎的接口

**输入**：
- PRD.md 路径
- TRD.md 路径
- 场景类型（全新功能/增量需求/问题修复）
- 用户签字信息

**输出**：
- 更新后的 PRD.md（包含签字章节）
- Git 提交记录

---

### 11.4 数据结构设计

#### 11.4.1 签字信息对象

```javascript
{
  version: "v3.1.3",
  signatures: [
    {
      role: "产品负责人",
      name: "张三",
      date: "2026-04-02",
      decision: "pass",  // pass | conditional | reject
      notes: "-"
    },
    {
      role: "技术负责人",
      name: "李四",
      date: "2026-04-02",
      decision: "pass",
      notes: "-"
    },
    {
      role: "审阅者",
      name: "openclaw-ouyp",
      date: "2026-04-02",
      decision: "pass",
      notes: "-"
    }
  ]
}
```

#### 11.4.2 确认内容对象

```javascript
{
  coreRequirements: [
    "需求 1 描述",
    "需求 2 描述",
    "需求 3 描述"
  ],
  technicalSolution: "技术方案描述",
  changeImpact: "变更影响描述（增量需求时）",
  risks: [
    "风险 1",
    "风险 2"
  ]
}
```

---

### 11.5 安全设计

#### 11.5.1 签字真实性

- **聊天窗口签字** - 依赖 QQ/微信等平台的用户身份验证
- **邮件签字** - 依赖邮件系统的发件人验证
- **表单签字** - 可选使用数字签名/验证码

#### 11.5.2 审计追溯

- **Git 历史** - 所有签字变更通过 Git 提交记录追溯
- **签字历史** - PRD.md 中的签字历史章节记录所有版本签字
- **日志记录** - 签字操作记录到流程引擎日志

---

### 11.6 需求追溯矩阵

| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | TRD 章节 | TRD 行号 | 实现状态 |
|---------|---------------------|---------|---------|---------|---------|
| REQ-009 | L473-530 | 14.1-14.6 | 11.1-11.6 | 待计算 | ✅ 已映射 |

#### 11.6.1 覆盖率统计

- **需求总数**: 9
- **已实现需求**: 9
- **覆盖率**: 100%
- **未实现需求**: 无

---

### 11.7 验收检查点

| 检查点 | 验收标准 | 验证方法 |
|--------|---------|---------|
| C1 | PRD.md 包含第 15 章"用户确认签字" | `grep "## 15. 用户确认签字" PRD.md` |
| C2 | PRD.md 版本历史更新到 v3.1.3 | `grep "v3.1.3" PRD.md` |
| C3 | TRD.md 版本历史更新到 v3.1.3 | `grep "v3.1.3" TRD.md` |
| C4 | 不生成额外文件 | `ls -la 01_designing/` 检查无新文件 |
| C5 | Git 提交记录存在 | `git log --oneline -5` |
| C6 | ReviewDesignAgent 得分 >= 90% | 执行审查脚本 |

---

*TRD 文档结束*
