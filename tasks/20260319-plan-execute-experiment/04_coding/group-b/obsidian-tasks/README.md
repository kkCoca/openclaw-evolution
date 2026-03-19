# obsidian-tasks Skill

> Obsidian 待办事项管理 Skill - 让任务管理更高效

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ouyp/openclaw-universe)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

## 📖 简介

`obsidian-tasks` 是一个专为 Obsidian 用户设计的任务管理 Skill，集成 Obsidian Tasks Plugin，提供完整的任务生命周期管理能力。

### ✨ 特性

- 📝 **任务管理**: 添加、编辑、删除任务
- 📊 **状态跟踪**: Pending → In Progress → Completed 状态机
- 🎯 **优先级**: 高/中/低三级优先级
- 📅 **截止日期**: 支持设置任务截止日期
- 🏷️ **项目分类**: 按项目组织任务
- 📈 **统计报告**: 生成日/周/月度报告
- 💾 **数据同步**: 自动同步到 Obsidian 和 MEMORY.md

## 🚀 快速开始

### 安装

```bash
# 克隆或复制到 Skill 目录
cd ~/.openclaw/workspace/skills/
git clone <repository-url> obsidian-tasks
```

### 配置

创建配置文件 `~/.openclaw/workspace/obsidian-tasks.config.json`:

```json
{
  "vaultPath": "~/Documents/Obsidian Vault",
  "tasksFile": "tasks.json",
  "memoryFile": "MEMORY.md",
  "defaultPriority": "medium",
  "defaultLimit": 20
}
```

### 初始化

```bash
# 首次使用前初始化
node scripts/index.js init
```

## 📚 使用指南

### 添加任务

```bash
# 基本用法
task add "完成 Skill 开发"

# 带优先级和截止日期
task add "完成 Skill 开发" --priority high --due 2026-03-25

# 指定项目
task add "回复邮件" --project work --priority low
```

### 查看任务

```bash
# 查看所有任务
task list

# 按状态过滤
task list --status pending
task list --status in-progress
task list --status completed

# 按优先级过滤
task list --priority high

# 按项目过滤
task list --project openclaw

# 限制数量
task list --limit 10
```

### 完成任务

```bash
# 标记为已完成
task done 123

# 带完成备注
task done 456 --note "提前完成"
```

### 生成报告

```bash
# 周报（默认）
task report

# 日报
task report --period daily

# 月报
task report --period monthly

# 按项目
task report --project openclaw
```

## 🏗️ 架构设计

```
obsidian-tasks/
├── scripts/
│   ├── index.js          # 入口文件，CLI 命令路由
│   ├── task-manager.js   # 核心任务管理逻辑
│   ├── obsidian-sync.js  # Obsidian 同步适配器
│   └── memory-sync.js    # MEMORY.md 同步适配器
├── templates/
│   └── task-template.md  # 任务文档模板
├── tests/
│   └── task-manager.test.js  # 单元测试
├── SKILL.md            # Skill 规范文档
└── README.md           # 使用指南
```

### 模块职责

| 模块 | 职责 |
|------|------|
| `index.js` | CLI 入口，命令解析和路由 |
| `task-manager.js` | 任务 CRUD 操作，状态管理 |
| `obsidian-sync.js` | Obsidian Tasks Plugin 数据读写 |
| `memory-sync.js` | MEMORY.md 文件同步和归档 |

### 状态机

```
┌─────────────┐
│   Pending   │
│  (待处理)   │
└──────┬──────┘
       │ start()
       ▼
┌─────────────┐
│In Progress  │
│  (进行中)   │
└──────┬──────┘
       │ complete()
       ▼
┌─────────────┐
│  Completed  │
│  (已完成)   │
└─────────────┘
```

## 📊 数据格式

### tasks.json

```json
{
  "tasks": [
    {
      "id": 1,
      "description": "完成 Skill 开发",
      "status": "pending",
      "priority": "high",
      "dueDate": "2026-03-25",
      "project": "openclaw",
      "createdAt": "2026-03-20T10:00:00.000Z",
      "updatedAt": "2026-03-20T10:00:00.000Z",
      "completedAt": null,
      "completionNote": null
    }
  ],
  "nextId": 2,
  "lastUpdated": "2026-03-20T10:00:00.000Z"
}
```

## 🧪 测试

```bash
# 运行单元测试
npm test

# 或直接运行
node tests/task-manager.test.js
```

## 📝 任务模板

使用 `templates/task-template.md` 创建详细的任务文档：

```markdown
# Task Template - 任务模板

## 任务信息

- **任务 ID**: `{{TASK_ID}}`
- **任务描述**: {{TASK_DESCRIPTION}}
- **状态**: `{{TASK_STATUS}}`
- **优先级**: `{{TASK_PRIORITY}}`
- **创建日期**: {{CREATED_AT}}
- **截止日期**: {{DUE_DATE}}
- **项目**: {{PROJECT}}

## 任务详情

### 背景
### 目标
### 执行步骤
### 资源
### 笔记

## 完成记录
### 回顾
```

## 🔧 开发

### 添加新命令

1. 在 `scripts/index.js` 中添加命令解析
2. 在 `scripts/task-manager.js` 中实现逻辑
3. 在 `tests/task-manager.test.js` 中添加测试
4. 更新 `SKILL.md` 和 `README.md` 文档

### 代码风格

- 使用 ES6+ 语法
- 遵循 Node.js 最佳实践
- 所有公共方法必须有 JSDoc 注释
- 所有功能必须有单元测试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 支持

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交 Issue](https://github.com/ouyp/openclaw-universe/issues)
- Email: [你的邮箱]

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的知识管理工具
- [Obsidian Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) - 任务管理插件
- [OpenClaw](https://openclaw.com/) - AI 助手框架

---

*最后更新：2026-03-20 | 版本：1.0.0*
