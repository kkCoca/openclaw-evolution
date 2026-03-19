# obsidian-tasks Skill

> **Obsidian 待办事项管理 Skill** - 支持 task add/list/done/report 命令

## 元数据

```json
{
  "name": "obsidian-tasks",
  "version": "1.0.0",
  "description": "Obsidian 待办事项管理 Skill，支持任务添加、列表、完成和报告功能",
  "author": "ouyp",
  "license": "MIT",
  "keywords": ["obsidian", "tasks", "todo", "productivity"],
  "main": "scripts/index.js",
  "scripts": {
    "test": "node tests/task-manager.test.js"
  },
  "dependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 命令说明

### task add

添加新任务到 Obsidian Tasks 系统。

**用法**: `task add <description> [--priority <high|medium|low>] [--due <YYYY-MM-DD>] [--project <project-name>]`

**参数**:
- `description` (必需): 任务描述
- `--priority`: 任务优先级 (high|medium|low, 默认: medium)
- `--due`: 截止日期 (YYYY-MM-DD 格式)
- `--project`: 所属项目

**示例**:
```bash
task add "完成 Skill 开发" --priority high --due 2026-03-25 --project openclaw
task add "回复邮件" --priority low
```

### task list

列出所有待办任务，支持过滤。

**用法**: `task list [--status <pending|in-progress|completed>] [--priority <high|medium|low>] [--project <project-name>] [--limit <number>]`

**参数**:
- `--status`: 按状态过滤 (pending|in-progress|completed)
- `--priority`: 按优先级过滤
- `--project`: 按项目过滤
- `--limit`: 限制返回数量 (默认: 20)

**示例**:
```bash
task list
task list --status pending --priority high
task list --project openclaw --limit 10
```

### task done

标记任务为已完成。

**用法**: `task done <task-id> [--note <completion-note>]`

**参数**:
- `task-id` (必需): 任务 ID
- `--note`: 完成备注

**示例**:
```bash
task done 123
task done 456 --note "提前完成"
```

### task report

生成任务统计报告。

**用法**: `task report [--period <daily|weekly|monthly>] [--project <project-name>]`

**参数**:
- `--period`: 报告周期 (daily|weekly|monthly, 默认: weekly)
- `--project`: 按项目过滤

**示例**:
```bash
task report
task report --period monthly --project openclaw
```

## 状态机

任务状态流转: `Pending` → `In Progress` → `Completed`

- **Pending**: 新建任务，等待开始
- **In Progress**: 任务进行中
- **Completed**: 任务已完成

## 数据存储

### Obsidian Tasks Plugin 数据

- **Vault 路径**: `~/Documents/Obsidian Vault`
- **Tasks 数据文件**: `tasks.json`
- **MEMORY.md 同步**: 支持将任务同步到 MEMORY.md 进行长期追踪

## 架构设计

```
obsidian-tasks/
├── scripts/
│   ├── index.js          # 入口文件，命令路由
│   ├── task-manager.js   # 核心任务管理逻辑
│   ├── obsidian-sync.js  # Obsidian 同步适配器
│   └── memory-sync.js    # MEMORY.md 同步适配器
├── templates/
│   └── task-template.md  # 任务文档模板
└── tests/
    └── task-manager.test.js  # 单元测试
```

## 模块职责

- **index.js**: 命令解析和路由，CLI 入口
- **task-manager.js**: 任务 CRUD 操作，状态管理
- **obsidian-sync.js**: Obsidian Tasks Plugin 数据读写
- **memory-sync.js**: MEMORY.md 文件同步

## 使用示例

### 完整工作流

```bash
# 1. 添加高优先级任务
task add "开发 obsidian-tasks Skill" --priority high --due 2026-03-25 --project openclaw

# 2. 查看待办任务
task list --status pending

# 3. 标记任务完成
task done 1 --note "按时完成"

# 4. 生成周报
task report --period weekly
```

## 配置

在 `~/.openclaw/workspace/obsidian-tasks.config.json` 中配置:

```json
{
  "vaultPath": "~/Documents/Obsidian Vault",
  "tasksFile": "tasks.json",
  "memoryFile": "MEMORY.md",
  "defaultPriority": "medium",
  "defaultLimit": 20
}
```

## 注意事项

1. 确保 Obsidian Tasks Plugin 已安装并启用
2. 首次使用前需运行 `task init` 初始化配置
3. 任务 ID 为自增整数，删除后不会重用
4. 支持 Markdown 格式的任务描述

## 版本历史

- **v1.0.0** (2026-03-20): 初始版本，支持 add/list/done/report 命令
