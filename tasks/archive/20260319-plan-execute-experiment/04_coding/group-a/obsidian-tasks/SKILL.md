# Obsidian Tasks Skill

**版本**: 1.0.0  
**作者**: openclaw-ouyp  
**描述**: Obsidian 待办事项管理 Skill，支持 task add/list/done/report 命令

---

## 📋 概述

本 Skill 提供完整的 Obsidian Tasks 管理功能，与 Obsidian 原生 Tasks 插件完全兼容。支持任务的创建、查询、完成和报告生成。

### 核心特性

- ✅ **原生兼容**: 完全支持 Obsidian Tasks 插件的语法格式
- 📅 **日期管理**: 支持到期日 (📅)、开始日 (🛫)、完成日 (✅)
- 🎯 **优先级**: 支持高 (⏫)、中 (🔼)、低 (🔽) 优先级
- 🏷️ **标签系统**: 支持 #tags 和 @contexts
- 💾 **内存缓存**: 内置 MemorySync 层，减少文件系统访问
- 📊 **报告生成**: 支持按时间段和分组生成任务报告

---

## 🚀 安装

### 方法 1: 手动安装

```bash
# 克隆或复制到 skills 目录
cp -r obsidian-tasks ~/.openclaw/skills/obsidian-tasks
```

### 方法 2: 使用 clawhub (推荐)

```bash
npx clawhub install obsidian-tasks
```

---

## ⚙️ 配置

### 环境变量

```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/Obsidian Vault"
```

### 配置文件 (config.json)

```json
{
  "vaultPath": "/path/to/your/Obsidian Vault",
  "defaultFile": "inbox.md"
}
```

---

## 📖 命令用法

### task add - 添加任务

```bash
# 基本用法
task add "完成项目报告"

# 带到期日
task add "完成项目报告" --due 2024-01-15

# 带优先级
task add "紧急修复" --priority high
task add "普通任务" --priority medium
task add "低优先级" --priority low

# 带标签和上下文
task add "购买 groceries" --tag #shopping --tag #personal --context @home

# 完整示例
task add "完成 Q1 报告" --due 2024-03-31 --priority high --tag #work --context @office
```

### task list - 列出任务

```bash
# 列出所有任务
task list

# 只列出待办任务
task list --status pending

# 只列出已完成任务
task list --status done

# 按文件过滤
task list --file inbox.md

# 按优先级过滤
task list --priority high

# 按到期日过滤
task list --due 2024-01-15

# 按标签过滤
task list --tag #work

# 限制结果数量
task list --limit 10
```

### task done - 标记任务完成

```bash
# 标记单个任务
task done inbox.md 5

# 标记多个任务
task done inbox.md 5 10 15

# 标记其他文件的任务
task done projects/active.md 3 7
```

### task report - 生成报告

```bash
# 今日报告
task report --period today

# 本周报告
task report --period week

# 本月报告
task report --period month

# 全部任务
task report --period all

# 按优先级分组
task report --period week --group priority

# 按文件分组
task report --period month --group file

# 按标签分组
task report --period week --group tag
```

---

## 🔧 编程接口

### 在 Node.js 中使用

```javascript
const { TaskManager } = require('obsidian-tasks');

const taskManager = new TaskManager({
  vaultPath: '/path/to/vault',
  defaultFile: 'inbox.md'
});

// 添加任务
await taskManager.add({
  description: '完成报告',
  dueDate: '2024-01-15',
  priority: 'high',
  tags: ['#work'],
  contexts: ['@office']
});

// 列出任务
const result = await taskManager.list({
  status: 'pending',
  priority: 'high',
  limit: 10
});

// 完成任务
await taskManager.done('inbox.md', [5, 10]);

// 生成报告
const report = await taskManager.report({
  period: 'week',
  groupBy: 'priority'
});
```

### 在 OpenClaw Skill 中使用

```javascript
// 在你的 Skill 中引入
const { TaskManager } = require('./obsidian-tasks');

async function run({ params }) {
  const taskManager = new TaskManager(config);
  
  switch (params.command) {
    case 'add':
      return await taskManager.add(params.options);
    case 'list':
      return await taskManager.list(params.filters);
    case 'done':
      return await taskManager.done(params.file, params.lines);
    case 'report':
      return await taskManager.report(params.options);
  }
}
```

---

## 📁 目录结构

```
obsidian-tasks/
├── index.js              # 入口文件 (CLI + 导出)
├── task-manager.js       # 核心任务管理器
├── obsidian-sync.js      # Obsidian 文件系统同步
├── memory-sync.js        # 内存缓存层
├── SKILL.md              # 技能文档 (本文件)
├── README.md             # 使用说明
├── config.json.example   # 配置示例
└── tests/
    ├── task-manager.test.js
    ├── obsidian-sync.test.js
    └── memory-sync.test.js
```

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行单个测试文件
npm test -- tests/task-manager.test.js

# 带覆盖率报告
npm test -- --coverage
```

---

## 📝 Obsidian Tasks 语法支持

本 Skill 完全支持以下 Obsidian Tasks 语法:

| 元素 | 语法 | 示例 |
|------|------|------|
| 任务 | `- [ ]` / `- [x]` | `- [ ] 完成任务` |
| 到期日 | `📅 YYYY-MM-DD` | `📅 2024-01-15` |
| 开始日 | `🛫 YYYY-MM-DD` | `🛫 2024-01-10` |
| 完成日 | `✅ YYYY-MM-DD` | `✅ 2024-01-15` |
| 高优先级 | `⏫` | `⏫ 紧急任务` |
| 中优先级 | `🔼` | `🔼 普通任务` |
| 低优先级 | `🔽` | `🔽 低优先级` |
| 标签 | `#tag` | `#work #project` |
| 上下文 | `@context` | `@home @office` |

---

## 🔄 与 Obsidian 同步

### 自动同步

Skill 会在以下情况自动同步:

1. 添加任务时立即写入文件
2. 完成任务时立即更新文件
3. 列出任务时从文件读取最新状态

### 手动同步

```javascript
const { ObsidianSync } = require('obsidian-tasks');

const sync = new ObsidianSync(vaultPath);

// 重新读取所有任务
const allTasks = sync.collectAllTasks();

// 解析特定文件
const tasks = sync.parseTasks('inbox.md');
```

---

## ⚠️ 注意事项

1. **Vault 路径**: 确保 `OBSIDIAN_VAULT_PATH` 指向正确的 Obsidian Vault 目录
2. **文件权限**: 确保对 Vault 目录有读写权限
3. **并发访问**: 避免多个进程同时修改同一文件
4. **备份**: 建议定期备份 Vault，尤其是使用自动化脚本时

---

## 🐛 故障排除

### 常见问题

**Q: 找不到 Vault 目录**
```bash
# 检查环境变量
echo $OBSIDIAN_VAULT_PATH

# 或在 config.json 中明确指定路径
```

**Q: 任务未显示**
```bash
# 确保任务格式正确
# 使用：- [ ] 描述
# 而非：- [] 描述 或 -[ ] 描述
```

**Q: 完成日期未添加**
```bash
# 完成日期仅在首次标记完成时添加
# 切换状态不会更新完成日期
```

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📊 Token 用量记录

**开发日期**: 2026-03-20  
**总 Token 用量**: ~8000 tokens (预估)

| 文件 | 行数 | Token 估算 |
|------|------|-----------|
| index.js | 220 | ~2000 |
| task-manager.js | 230 | ~2000 |
| obsidian-sync.js | 210 | ~2000 |
| memory-sync.js | 130 | ~1000 |
| SKILL.md | 300+ | ~1000 |
| 测试文件 | ~200 | ~500 |
| **总计** | **~1290** | **~8500** |

---

## 📝 更新日志

### v1.0.0 (2026-03-20)
- ✅ 初始版本发布
- ✅ 支持 task add/list/done/report 命令
- ✅ 完整的 Obsidian Tasks 语法支持
- ✅ 内存缓存层优化
- ✅ 单元测试覆盖
