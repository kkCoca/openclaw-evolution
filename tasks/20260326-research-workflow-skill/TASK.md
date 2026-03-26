# 任务：创建 OpenClaw Research Workflow Skill

## 目标
创建一个独立的流程引擎 Skill，实现 AI 辅助研发流程的自动化编排。

## 需求文档
阅读：`01_designing/REQUIREMENTS.md`

## 工作流程

### 阶段 1: designing
- 输出 `01_designing/PRD.md`（产品需求文档）
- 输出 `01_designing/TRD.md`（技术架构文档）

### 阶段 2: roadmapping
- 输出 `02_roadmapping/ROADMAP.md`（开发计划）

### 阶段 3: detailing
- 输出 `03_detailing/DETAIL.md`（文件级设计）

### 阶段 4: coding
- 创建目录：`04_coding/openclaw-research-workflow/`
- 创建文件：
  - `SKILL.md`（主 Skill 定义）
  - `workflow.md`（流程编排逻辑）
  - `install.sh`（Linux/macOS 安装脚本）
  - `install.bat`（Windows 安装脚本）
  - `install.js`（Node.js 自动安装脚本）
  - `README.md`（使用文档）
- 复制 bundled skills：从 `/home/ouyp/Documents/ai-toolkit/skills/` 复制到 `bundled-skills/`
- 创建示例：`examples/` 目录（三个场景示例）

## 输出目录
`/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260326-research-workflow-skill/04_coding/openclaw-research-workflow/`

## 验收标准
1. ✅ Skill 目录结构完整
2. ✅ 安装脚本可执行（有执行权限）
3. ✅ bundled skills 完整（designing/roadmapping/detailing/coding/reviewing）
4. ✅ 文档清晰（README.md 包含安装和使用说明）

## 约束
- ✅ 必须支持 Windows/Linux/macOS
- ✅ 必须零感知依赖安装
- ✅ 必须与 ai-toolkit skills 兼容
