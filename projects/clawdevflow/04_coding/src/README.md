# OpenClaw Research Workflow Skill

AI 辅助研发流程引擎，自动化编排完整研发流程。

## 特性

- ✅ **一键安装** - 一个命令安装所有依赖
- ✅ **流程标准化** - 完整的研发流程编排（designing→roadmapping→detailing→coding→testing→reviewing→precommit→releasing）
- ✅ **场景支持** - 全新功能/增量需求/问题修复
- ✅ **跨平台** - Windows/Linux/macOS
- ✅ **零感知依赖** - bundled skills 自动注册
- ✅ **易于分享** - 支持 clawhub/脚本/压缩包多种安装方式
- ✅ **规约绑定** - 遵循 ~/.openclaw/workspace/AGENTS.md（Plan-and-Execute）

## 快速开始

### 1. 安装

选择以下任一安装方式：

#### 方法 1: 脚本安装（推荐）

**Linux/macOS**:
```bash
cd openclaw-research-workflow
./install.sh
```

**Windows**:
```batch
cd openclaw-research-workflow
install.bat
```

#### 方法 2: Node.js 安装（跨平台）

```bash
cd openclaw-research-workflow
node install.js
```

#### 方法 3: clawhub 安装

```bash
clawhub install openclaw-research-workflow
```

### 2. 使用

```bash
/sessions_spawn openclaw-research-workflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求说明：REQUIREMENTS.md（openclaw-ouyp 提供）
# 原有项目：{项目路径，增量/修复必填}
# 约束条件：{约束条件}
# 验收标准：{Given/When/Then}
# 输出目录：/home/ouyp/Learning/Practice/openclaw-universe/projects/{项目名}/
# 
# 重要要求：
# 输出到项目目录（01_designing/02_roadmapping/03_detailing/04_coding/05_reviewing/06_testing/07_precommit/08_releasing）
# 遵循 ~/.openclaw/workspace/AGENTS.md，禁止 write 局部改动
# 全新功能：生成 PRD.md + TRD.md + src/ + CHANGELOG.md
# 增量需求：读取完整 REQUIREMENTS.md，追加 PRD.md 章节
# 问题修复：记录根因到 TRD.md，更新 CHANGELOG.md
```

### 3. 查看产出

执行完成后，在项目目录下查看完整研发产出：

```
projects/{项目名}/
├── REQUIREMENTS.md         # openclaw-ouyp 提供（已有）
├── 01_designing/
│   ├── PRD.md              # AI 生成（追加式）
│   └── TRD.md              # AI 生成（追加式）
├── 02_roadmapping/
│   └── ROADMAP.md          # AI 生成
├── 03_detailing/
│   └── DETAIL.md           # AI 生成
├── 04_coding/
│   └── src/                # AI 生成（增量修改）
├── 05_reviewing/
│   └── REVIEW-REPORT.md    # AI 生成
├── 06_testing/
│   └── TEST-REPORT.md      # AI 生成
├── 07_precommit/
│   └── PRECOMMIT-CHECKLIST.md # AI 生成
├── 08_releasing/
│   └── RELEASE-NOTES.md    # AI 生成
├── CHANGELOG.md            # AI 生成（追加式）
└── ISSUES.md               # openclaw-ouyp 提供（Bugfix 使用）
```

**目录说明**：
- `REQUIREMENTS.md` — openclaw-ouyp 提供的原始需求说明（追加式）
- `01_designing/` — 产品需求文档（PRD.md）和技术设计文档（TRD.md）
- `02_roadmapping/` — 开发计划（ROADMAP.md）
- `03_detailing/` — 详细设计（DETAIL.md）
- `04_coding/` — 源代码（src/）
- `05_reviewing/` — 验收报告（REVIEW-REPORT.md）
- `06_testing/` — 测试报告（TEST-REPORT.md）
- `07_precommit/` — 提交前检查（PRECOMMIT-CHECKLIST.md）
- `08_releasing/` — 发布说明（RELEASE-NOTES.md）
- `CHANGELOG.md` — 变更日志（追加式）
- `ISSUES.md` — 问题记录（Bugfix 使用）

## 场景示例

详见 `examples/` 目录：

| 示例 | 文件 | 说明 |
|------|------|------|
| 全新功能开发 | `example-1-new-feature.md` | 从 0 到 1 创建用户登录功能 |
| 增量需求开发 | `example-2-incremental.md` | 在现有系统上添加头像上传功能 |
| 问题修复 | `example-3-bugfix.md` | 修复登录会话过期问题 |

## 目录结构

```
openclaw-research-workflow/
├── SKILL.md              # 主 Skill 定义
├── workflow.md           # 流程编排逻辑
├── README.md             # 使用文档
├── install.sh            # Linux/macOS 安装脚本
├── install.bat           # Windows 安装脚本
├── install.js            # Node.js 自动安装脚本
├── bundled-skills/       # 依赖 Skills
│   ├── designing/
│   ├── roadmapping/
│   ├── detailing/
│   ├── coding/
│   └── reviewing/
└── examples/             # 使用示例
    ├── example-1-new-feature.md
    ├── example-2-incremental.md
    └── example-3-bugfix.md
```

## 依赖

本 Skill 包含以下 bundled skills，安装时自动注册：

| Skill | 说明 |
|-------|------|
| designing | 需求分析和架构设计 |
| roadmapping | 开发计划制定 |
| detailing | 文件级设计 |
| coding | 代码实现 + 测试 + 文档 |
| reviewing | 验收验证 |

## 工作流程

```
用户需求
  ↓
┌─────────────────────────────────────┐
│ 阶段 1: designing                   │
│ 输出：PRD.md + TRD.md               │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 阶段 2: roadmapping                 │
│ 输出：ROADMAP.md                    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 阶段 3: detailing                   │
│ 输出：DETAIL.md                     │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 阶段 4: coding                      │
│ 输出：代码 + 测试 + 文档             │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 阶段 5: reviewing                   │
│ 输出：验收报告                       │
└─────────────────────────────────────┘
  ↓
完整研发产出
```

## 工作原理

### 三方协作架构

流程引擎 Skill 采用三方协作架构，明确分工：

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
│  AI 工具 (执行者)                   │
│  • OpenCode / Claude Code / Custom  │
│  • designing → PRD + TRD            │
│  • roadmapping → ROADMAP            │
│  • detailing → DETAIL               │
│  • coding → 代码 + 测试             │
│  • reviewing → 验收报告             │
└─────────────────────────────────────┘
```

### 调用流程

每个阶段的调用流程如下：

```
用户需求 → openclaw-ouyp → sessions_spawn → 流程引擎 → 调用 → AI 工具 → 执行 skill → 输出
```

### 阶段调用说明

| 阶段 | 流程引擎动作 | OpenCode 执行 | 输出 |
|------|-------------|--------------|------|
| designing | 调用 designing skill | 执行需求分析和架构设计 | PRD.md + TRD.md |
| roadmapping | 调用 roadmapping skill | 执行开发计划制定 | ROADMAP.md |
| detailing | 调用 detailing skill | 执行文件级设计 | DETAIL.md |
| coding | 调用 coding skill | 执行代码实现 + 测试 + 文档 | src/ + tests/ + README.md |
| reviewing | 调用 reviewing skill | 执行验收验证 | REVIEW-REPORT.md |

## 故障排除

### 安装失败

**问题**: Node.js 未安装

**解决**: 
```bash
# 安装 Node.js
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS
brew install node

# Windows
# 下载 https://nodejs.org/
```

**问题**: OpenClaw 未安装

**解决**:
```bash
# 安装 OpenClaw
npm install -g openclaw
```

**问题**: 权限不足

**解决**:
```bash
# Linux/macOS
sudo ./install.sh

# Windows
# 以管理员身份运行 install.bat
```

### 执行失败

**问题**: bundled-skills 目录不存在

**解决**: 重新安装
```bash
./install.sh  # 或 install.bat / node install.js
```

**问题**: 流程中断

**解决**: 
1. 查看错误日志
2. 根据错误提示修复
3. 重新执行

## 与 ai-toolkit 兼容

本 Skill 的 bundled skills 直接从 [ai-toolkit](https://github.com/ai-toolkit/skills) 复制，保持完全兼容。

如需更新 bundled skills，从 ai-toolkit 同步最新版本：

```bash
# 同步 designing skill
cp -r /path/to/ai-toolkit/skills/designing/* ./bundled-skills/designing/

# 同步其他 skills...
```

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |
| 1.1.0 | 2026-03-26 | FEATURE-001：增加 OpenCode 调用说明 |
| 1.2.0 | 2026-03-27 | 按 AGENTS.md v11.0 标准更新文档 |

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

- GitHub: [openclaw-ouyp](https://github.com/openclaw-ouyp)
- Email: openclaw-ouyp@example.com
