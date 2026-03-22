# 规范体系与整改方案整合分析报告

> **文档编号**: INTEG-20260322-001  
> **版本**: v1.0  
> **创建日期**: 2026-03-22 08:55  
> **分析人**: OpenClaw (主权维护者)  
> **目的**: 分析 NORMS 规范体系与系统性整改方案的关系，识别冲突，提出整合建议

---

## 🎯 执行摘要

**结论**: 整改方案与原有规范体系**无本质冲突**，但存在**工具重复**和**位置分散**问题，需要整合归一化。

**核心关系**:
```
NORMS 规范体系 = "法律" (定义什么是对错)
整改方案 = "执法工具" (帮助/强制遵守法律)
```

**发现冲突**:
| 冲突类型 | 严重度 | 说明 |
|---------|--------|------|
| 部署脚本重复 | 🟡 中 | deploy_to_production.sh vs deploy-pipeline.sh |
| 工具位置分散 | 🟡 中 | NORMS/scripts/ vs openclaw-universe/scripts/ |
| 检查脚本调用 | 🟢 低 | 整改方案调用 NORMS/checks/ 脚本 (正确) |

**整合建议**:
1. 废弃 deploy_to_production.sh，统一使用 deploy-pipeline.sh
2. 将 task-scaffold.sh + deploy-pipeline.sh 移动到 NORMS/scripts/
3. 更新 NORMS/README.md 添加整改方案引用

---

## 第一部分：文档体系对比

### 1.1 规范体系文档结构

```
~/.openclaw/workspace/NORMS/
├── README.md                      # 规范索引
├── USER_GUIDE.md                  # 使用指南
├── version.json                   # 版本管理
├── core/                          # 6 条核心规范
│   ├── 01-core-positioning.md     # L1: 核心定位与分工
│   ├── 02-production-purity.md    # L2: 生产区纯净原则
│   ├── 03-naming-convention.md    # L3: 命名归一化准则
│   ├── 04-plan-and-execute.md     # L4: Plan-and-Execute 模式
│   ├── 05-knowledge-assets.md     # L5: 1+N 知识沉淀
│   └── 06-feedback-harvest.md     # L6: 反馈收割机制
├── checks/                        # 6 个检查脚本
│   ├── check-norm-02.sh
│   ├── check-norm-03.sh
│   ├── check-norm-04.sh
│   ├── check-norm-05.sh
│   ├── check-norm-06.sh
│   └── check-all-norms.sh
└── tech/                          # 技术实现 (待填充)
```

**特点**:
- ✅ 规范文档与检查脚本分离
- ✅ 每条规范有对应检查脚本
- ✅ 位置：系统私有区 (`~/.openclaw/workspace/`)

---

### 1.2 整改方案文档结构

```
/home/ouyp/Learning/Practice/openclaw-universe/
├── research/insights/
│   └── 20260322-SYSTEMIC-RECTIFICATION-PLAN.md  # 整改方案白皮书
├── scripts/
│   ├── task-scaffold.sh                          # 任务脚手架
│   └── deploy-pipeline.sh                        # 部署流水线
└── .githooks/
    └── pre-commit                                # Git Hook
```

**特点**:
- ✅ 工具脚本与规范检查脚本分离
- ✅ 位置：项目主权区 (`openclaw-universe/`)
- ⚠️ 与 NORMS/scripts/ 功能重复

---

### 1.3 文档层级关系

```
┌─────────────────────────────────────────────────────────┐
│                    文档层级架构                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  宪法层                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ AGENTS.md (人格定义 + 核心原则)                   │ │
│  └───────────────────────────────────────────────────┘ │
│                        ↓                                │
│  法律层                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ NORMS/core/ (6 条核心规范)                          │ │
│  │ + SYSTEMIC-RECTIFICATION-PLAN.md (整改方案)       │ │
│  └───────────────────────────────────────────────────┘ │
│                        ↓                                │
│  工具层                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ NORMS/checks/ (检查脚本)                           │ │
│  │ + NORMS/scripts/ (流程工具) ← 需整合               │ │
│  └───────────────────────────────────────────────────┘ │
│                        ↓                                │
│  执行层                                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ .githooks/ (Git Hook)                             │ │
│  │ tasks/ (任务目录)                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 第二部分：工具脚本对比

### 2.1 部署脚本对比

| 特性 | deploy_to_production.sh (原有) | deploy-pipeline.sh (新增) |
|------|-------------------------------|--------------------------|
| **位置** | `openclaw-universe/scripts/` | `openclaw-universe/scripts/` |
| **创建日期** | 2026-03-21 | 2026-03-22 |
| **步骤数** | 7 步 | 7 步 |
| **L2 检查** | ✅ 部署后检查 | ✅ 部署前 + 部署后检查 |
| **职责标注** | ❌ 无 | ✅ 有 (OpenClaw/OpenCode) |
| **执行报告验证** | ❌ 无 | ✅ 有 (EXECUTION_REPORT.md) |
| **部署报告生成** | ❌ 无 | ✅ 有 (DEPLOY_REPORT.md) |
| **规范引用** | ❌ 无 | ✅ 有 (L2 规范注释) |

**结论**: deploy-pipeline.sh 是 deploy_to_production.sh 的**增强版**，建议废弃旧脚本。

---

### 2.2 任务创建工具对比

| 特性 | 原有方式 | task-scaffold.sh (新增) |
|------|---------|------------------------|
| **创建方式** | 手动 mkdir | 自动化脚本 |
| **模板生成** | ❌ 无 | ✅ PRD/ROADMAP/EXECUTION_REPORT |
| **规范引导** | ❌ 无 | ✅ 职责边界提示 |
| **部署校验** | ❌ 无 | ✅ 任务级 deploy-check.sh |
| **职责标注** | ❌ 无 | ✅ 脚本头部注释 |

**结论**: task-scaffold.sh 填补了"任务创建规范化"的空白，无冲突。

---

### 2.3 检查脚本对比

| 脚本 | 位置 | 调用关系 |
|------|------|---------|
| check-norm-02.sh | `NORMS/checks/` | ✅ 被 deploy-pipeline.sh 调用 |
| check-norm-03.sh | `NORMS/checks/` | ✅ 被 pre-commit 调用 |
| check-norm-04.sh | `NORMS/checks/` | ✅ 被 pre-commit 调用 |
| check-all-norms.sh | `NORMS/checks/` | ✅ 独立执行 |

**结论**: 检查脚本位置正确，整改方案未重复创建，**无冲突**。

---

## 第三部分：冲突识别

### 3.1 已识别冲突

#### 冲突 1: 部署脚本重复

```
问题：
  deploy_to_production.sh (原有) vs deploy-pipeline.sh (新增)
  两者功能重叠，可能导致混淆

影响：
  - 使用者不知道用哪个
  - 维护成本增加
  - 规范执行不一致

解决：
  1. 废弃 deploy_to_production.sh
  2. 保留 deploy-pipeline.sh
  3. 更新 NORMS/README.md 引用
```

#### 冲突 2: 工具位置分散

```
问题：
  NORMS/scripts/ (系统级) vs openclaw-universe/scripts/ (项目级)
  工具位置不统一

影响：
  - 查找困难
  - 版本管理复杂
  - 规范权威性降低

解决：
  1. 系统级工具 → NORMS/scripts/
  2. 项目级工具 → openclaw-universe/scripts/
  3. 明确边界：NORMS/scripts/ 存放规范执行工具
```

#### 冲突 3: Git Hook 配置

```
问题：
  .githooks/pre-commit 调用 NORMS/checks/ 脚本
  但 NORMS/ 位于 ~/.openclaw/workspace/ (系统私有区)
  openclaw-universe/ 位于 ~/Learning/Practice/ (项目主权区)
  跨区依赖可能导致路径问题

影响：
  - 路径硬编码
  - 多机器部署困难

解决：
  1. 使用绝对路径 (当前方案)
  2. 或创建软链接
  3. 或在 NORMS/README.md 中明确路径约定
```

---

### 3.2 潜在冲突

#### 潜在冲突 1: 规范版本不一致

```
风险：
  NORMS/ 版本更新后，整改方案中的引用可能过时

缓解：
  1. NORMS/version.json 增加整改方案引用
  2. 整改方案增加规范版本号
  3. 定期同步检查
```

#### 潜在冲突 2: 职责边界模糊

```
风险：
  整改方案定义了 OpenClaw/OpenCode 职责
  但 L1 规范也定义了职责
  两者可能不一致

验证：
  ✅ 已对比，两者一致
  整改方案是 L1 规范的细化和工具化
```

---

## 第四部分：整合方案

### 4.1 整合原则

1. **规范权威性**: NORMS/ 是唯一规范来源
2. **工具归一化**: 同类工具只保留一个
3. **位置清晰**: 系统级 vs 项目级 明确分离
4. **向后兼容**: 旧脚本保留但标记废弃

---

### 4.2 整合步骤

#### 步骤 1: 工具移动 (系统级归一化)

```bash
# 创建 NORMS/scripts/ 目录
mkdir -p ~/.openclaw/workspace/NORMS/scripts/

# 复制工具脚本到 NORMS/scripts/
cp /home/ouyp/Learning/Practice/openclaw-universe/scripts/task-scaffold.sh \
   ~/.openclaw/workspace/NORMS/scripts/

cp /home/ouyp/Learning/Practice/openclaw-universe/scripts/deploy-pipeline.sh \
   ~/.openclaw/workspace/NORMS/scripts/

# 更新脚本中的硬编码路径 (如需)
# 添加规范引用注释
```

#### 步骤 2: 旧脚本标记废弃

```bash
# 在 deploy_to_production.sh 头部添加废弃警告
cat > /home/ouyp/Learning/Practice/openclaw-universe/scripts/deploy_to_production.sh << 'EOF'
#!/bin/bash
# ⚠️  已废弃：2026-03-22
# 替代方案：deploy-pipeline.sh
# 原因：功能重复，新脚本增加职责标注和规范检查
# 迁移指南：
#   旧：bash deploy_to_production.sh <任务目录>
#   新：bash deploy-pipeline.sh <任务目录>
# ... 原有脚本内容 ...
EOF
```

#### 步骤 3: 更新 NORMS/README.md

```markdown
# 在 NORMS/README.md 中添加：

## 🔧 规范执行工具

| 工具 | 位置 | 用途 |
|------|------|------|
| `task-scaffold.sh` | `scripts/` | 任务创建脚手架 (符合 L4) |
| `deploy-pipeline.sh` | `scripts/` | 规范化部署流水线 (符合 L2) |
| `check-all-norms.sh` | `checks/` | 规范全量检查 |
```

#### 步骤 4: 更新整改方案引用

```markdown
# 在 SYSTEMIC-RECTIFICATION-PLAN.md 中添加：

## 与 NORMS 规范体系的关系

整改方案是 NORMS 规范体系的**执行工具层**，不是替代关系。

| 规范 | 整改方案工具 |
|------|------------|
| L1: 核心定位 | 职责分工矩阵 |
| L2: 生产区纯净 | deploy-pipeline.sh |
| L3: 命名归一化 | task-scaffold.sh |
| L4: Plan-and-Execute | task-scaffold.sh (模板生成) |
```

---

### 4.3 整合后架构

```
~/.openclaw/workspace/NORMS/
├── README.md                      # 规范索引 (更新工具引用)
├── version.json                   # 版本管理 (增加整改方案引用)
├── core/                          # 6 条核心规范
│   └── ...
├── checks/                        # 检查脚本
│   └── ...
├── scripts/                       # 流程工具 (新增)
│   ├── task-scaffold.sh          # 任务脚手架
│   └── deploy-pipeline.sh        # 部署流水线
└── tech/
    └── ...

/home/ouyp/Learning/Practice/openclaw-universe/
├── scripts/
│   ├── deploy_to_production.sh   # ⚠️ 已废弃
│   ├── deploy-pipeline.sh        # → 软链接到 NORMS/scripts/
│   └── task-scaffold.sh          # → 软链接到 NORMS/scripts/
└── research/insights/
    └── 20260322-SYSTEMIC-RECTIFICATION-PLAN.md  # 整改方案白皮书
```

---

## 第五部分：验证清单

### 5.1 整合后验证

| 检查项 | 验证命令 | 预期结果 |
|--------|---------|---------|
| 工具可执行 | `bash NORMS/scripts/task-scaffold.sh --help` | 正常执行 |
| 部署流程 | `bash NORMS/scripts/deploy-pipeline.sh --help` | 正常执行 |
| 规范检查 | `bash NORMS/checks/check-all-norms.sh` | 100% 通过 |
| Git Hook | `git commit` | 触发 pre-commit |
| 旧脚本废弃 | `bash deploy_to_production.sh` | 显示废弃警告 |

---

### 5.2 长期维护

| 任务 | 频率 | 责任人 |
|------|------|--------|
| 规范版本同步 | 每次 NORMS 更新 | OpenClaw |
| 工具功能验证 | 每周日 | OpenClaw |
| 冲突检查 | 每月一次 | OpenClaw |
| 文档更新 | 按需 | OpenClaw |

---

## 第六部分：结论

### 6.1 核心结论

1. **无本质冲突**: 整改方案是 NORMS 规范体系的工具化，不是替代
2. **存在工具重复**: deploy_to_production.sh vs deploy-pipeline.sh 需整合
3. **位置需归一化**: 系统级工具应移动到 NORMS/scripts/
4. **引用需更新**: NORMS/README.md 需添加整改方案引用

### 6.2 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 工具版本不一致 | 中 | 中 | 定期同步检查 |
| 路径依赖问题 | 低 | 中 | 使用绝对路径 |
| 使用者混淆 | 中 | 低 | 废弃警告 + 文档更新 |

### 6.3 建议

**立即执行**:
1. ✅ 废弃 deploy_to_production.sh
2. ✅ 更新 NORMS/README.md
3. ✅ 添加规范引用注释

**本周执行**:
1. ⏳ 工具移动到 NORMS/scripts/
2. ⏳ 创建软链接
3. ⏳ 验证整合后功能

**长期维护**:
1. ⏳ 每周规范同步检查
2. ⏳ 每月冲突审计

---

*本分析报告由 openclaw-ouyp 编写，基于 NORMS 规范体系 v1.0 和整改方案 v1.0*  
**版本**: v1.0 | **日期**: 2026-03-22  
**状态**: 🟡 待审核  
**下次审查**: 2026-03-29 (周度审计)
