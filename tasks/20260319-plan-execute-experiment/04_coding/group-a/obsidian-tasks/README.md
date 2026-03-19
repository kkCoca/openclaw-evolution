# 📝 Obsidian Tasks Skill

> 为你的 Obsidian Vault 提供强大的待办事项管理能力

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Obsidian](https://img.shields.io/badge/Obsidian-Tasks-purple.svg)]()

---

## 🎯 快速开始

### 1. 安装

```bash
# 方法 1: 直接复制
cp -r obsidian-tasks ~/.openclaw/skills/

# 方法 2: 使用 clawhub
npx clawhub install obsidian-tasks
```

### 2. 配置

```bash
# 设置环境变量
export OBSIDIAN_VAULT_PATH="$HOME/Obsidian Vault"

# 或创建配置文件
cat > ~/.openclaw/skills/obsidian-tasks/config.json << EOF
{
  "vaultPath": "$HOME/Obsidian Vault",
  "defaultFile": "inbox.md"
}
EOF
```

### 3. 使用

```bash
# 添加任务
task add "完成项目报告" --due 2024-01-15 --priority high

# 查看任务
task list --status pending

# 完成任务
task done inbox.md 5

# 生成报告
task report --period week
```

---

## 📚 完整文档

详细文档请查看 [SKILL.md](./SKILL.md)

### 核心命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `task add` | 添加新任务 | `task add "任务" --due 2024-01-15` |
| `task list` | 列出任务 | `task list --priority high` |
| `task done` | 完成任务 | `task done inbox.md 5` |
| `task report` | 生成报告 | `task report --period week` |

### 支持的功能

- ✅ 任务创建和管理
- 📅 日期跟踪 (到期日/开始日/完成日)
- 🎯 优先级系统
- 🏷️ 标签和上下文
- 📊 统计报告
- 💾 内存缓存优化

---

## 🔧 开发

### 目录结构

```
obsidian-tasks/
├── index.js              # CLI 入口
├── task-manager.js       # 核心逻辑
├── obsidian-sync.js      # 文件同步
├── memory-sync.js        # 内存缓存
├── tests/                # 单元测试
└── SKILL.md              # 完整文档
```

### 运行测试

```bash
# 安装依赖 (如果需要)
npm init -y

# 运行测试
node tests/run-tests.js
```

---

## 💡 使用场景

### 场景 1: 日常工作管理

```bash
# 早晨规划
task add "完成周报" --due 2024-01-12 --priority high --tag #work
task add "团队会议" --due 2024-01-12 --start 2024-01-12 --context @office

# 查看今日任务
task list --due 2024-01-12

# 完成任务
task done inbox.md 1 2
```

### 场景 2: 项目管理

```bash
# 创建项目任务
task add "设计数据库架构" --tag #project-alpha --priority high
task add "实现 API 接口" --tag #project-alpha --context @dev
task add "编写测试用例" --tag #project-alpha --context @dev

# 查看项目进度
task list --tag #project-alpha

# 生成项目报告
task report --period month --group priority
```

### 场景 3: 个人生活

```bash
# 购物清单
task add "购买牛奶" --tag #shopping --context @home
task add "预约牙医" --tag #health --priority medium

# 查看个人任务
task list --tag #shopping --tag #health
```

---

## 🤝 与 Obsidian 集成

### Tasks 插件兼容

本 Skill 生成的任务格式与 Obsidian Tasks 插件完全兼容：

```markdown
- [ ] 完成任务 📅 2024-01-15 ⏫ #work @office
- [x] 已完成任务 📅 2024-01-14 ✅ 2024-01-14
```

在 Obsidian 中可以使用 Tasks 插件的查询功能：

````markdown
```tasks
not done
due before 2024-01-20
sort by priority
```
````

### 推荐工作流

1. **快速捕获**: 使用 `task add` 快速添加任务
2. **批量处理**: 在 Obsidian 中查看和整理任务
3. **状态更新**: 使用 `task done` 或 Obsidian 界面完成任务
4. **定期回顾**: 使用 `task report` 生成周报/月报

---

## ⚙️ 高级配置

### 自定义默认文件

```json
{
  "vaultPath": "/path/to/vault",
  "defaultFile": "daily/2024-01-12.md"
}
```

### 多文件支持

```javascript
const { TaskManager } = require('obsidian-tasks');

const tm = new TaskManager(config);

// 添加到特定文件
await tm.add({
  description: '任务',
  file: 'projects/active.md'
});

// 从特定文件列出
await tm.list({
  file: 'projects/active.md'
});
```

---

## 🐛 常见问题

### Q: 如何备份我的任务？

任务存储在 Obsidian Vault 中，建议：
- 使用 Git 版本控制 Vault
- 使用 Obsidian Sync 或第三方同步服务
- 定期导出任务报告

### Q: 可以与其他工具集成吗？

可以！通过编程接口：

```javascript
const { TaskManager } = require('obsidian-tasks');
const tm = new TaskManager(config);

// 在你的脚本中使用
const tasks = await tm.list({ status: 'pending' });
console.log(`你有 ${tasks.count} 个待办任务`);
```

### Q: 支持重复任务吗？

当前版本不支持自动重复任务。建议：
- 在 Obsidian 中使用 Tasks 插件的重复功能
- 或手动创建周期性任务

---

## 📊 性能

- **内存缓存**: 减少文件系统访问
- **批量操作**: 支持一次完成多个任务
- **增量同步**: 只更新变更的任务

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

---

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的知识库工具
- [Obsidian Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) - 灵感来源

---

**Happy Tasking! 🎉**
