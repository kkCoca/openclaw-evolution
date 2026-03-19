#!/usr/bin/env node
/**
 * obsidian-tasks Skill 入口
 * 提供 CLI 接口和 OpenClaw Skill 导出
 */

const TaskManager = require('./task-manager');
const path = require('path');
const fs = require('fs');

// 默认配置
const DEFAULT_CONFIG = {
  vaultPath: process.env.OBSIDIAN_VAULT_PATH || path.join(process.env.HOME, 'Obsidian Vault'),
  defaultFile: 'inbox.md'
};

// 加载配置文件
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...config };
  }
  return DEFAULT_CONFIG;
}

// CLI 命令处理
async function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  const config = loadConfig();
  const taskManager = new TaskManager(config);

  try {
    switch (command) {
      case 'add':
        await handleAdd(taskManager, args.slice(1));
        break;
      case 'list':
        await handleList(taskManager, args.slice(1));
        break;
      case 'done':
        await handleDone(taskManager, args.slice(1));
        break;
      case 'report':
        await handleReport(taskManager, args.slice(1));
        break;
      default:
        console.error(`❌ 未知命令：${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 错误：${error.message}`);
    process.exit(1);
  }
}

// 添加任务
async function handleAdd(taskManager, args) {
  // 简单解析：task add "描述" --due 2024-01-01 --priority high --tag #work
  const options = {
    description: '',
    dueDate: null,
    startDate: null,
    priority: null,
    tags: [],
    contexts: [],
    file: null
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    
    if (arg.startsWith('--due=') || arg === '--due') {
      options.dueDate = arg.startsWith('--due=') ? arg.split('=')[1] : args[++i];
    } else if (arg.startsWith('--start=') || arg === '--start') {
      options.startDate = arg.startsWith('--start=') ? arg.split('=')[1] : args[++i];
    } else if (arg.startsWith('--priority=') || arg === '--priority') {
      options.priority = arg.startsWith('--priority=') ? arg.split('=')[1] : args[++i];
    } else if (arg.startsWith('--tag=') || arg === '--tag') {
      const tag = arg.startsWith('--tag=') ? arg.split('=')[1] : args[++i];
      options.tags.push(tag.startsWith('#') ? tag : `#${tag}`);
    } else if (arg.startsWith('--context=') || arg === '--context') {
      const ctx = arg.startsWith('--context=') ? arg.split('=')[1] : args[++i];
      options.contexts.push(ctx.startsWith('@') ? ctx : `@${ctx}`);
    } else if (arg.startsWith('--file=') || arg === '--file') {
      options.file = arg.startsWith('--file=') ? arg.split('=')[1] : args[++i];
    } else if (!arg.startsWith('--')) {
      options.description += (options.description ? ' ' : '') + arg;
    }
    
    i++;
  }

  if (!options.description) {
    console.error('❌ 请提供任务描述');
    console.log('用法：task add "任务描述" --due 2024-01-01 --priority high');
    process.exit(1);
  }

  const result = await taskManager.add(options);
  console.log(result.message);
  console.log(`📝 ${result.task.description}`);
}

// 列出任务
async function handleList(taskManager, args) {
  const filters = {};
  
  args.forEach((arg, i) => {
    if (arg.startsWith('--status=')) {
      filters.status = arg.split('=')[1];
    } else if (arg.startsWith('--file=')) {
      filters.file = arg.split('=')[1];
    } else if (arg.startsWith('--due=')) {
      filters.dueDate = arg.split('=')[1];
    } else if (arg.startsWith('--priority=')) {
      filters.priority = arg.split('=')[1];
    } else if (arg.startsWith('--tag=')) {
      filters.tag = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      filters.limit = parseInt(arg.split('=')[1]);
    }
  });

  const result = await taskManager.list(filters);
  
  console.log(`📋 找到 ${result.count} 个任务:\n`);
  
  if (result.tasks.length === 0) {
    console.log('暂无任务');
  } else {
    result.tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task}`);
    });
  }
}

// 完成任务
async function handleDone(taskManager, args) {
  if (args.length < 2) {
    console.error('❌ 请提供文件路径和行号');
    console.log('用法：task done <file> <line1> [line2] ...');
    process.exit(1);
  }

  const file = args[0];
  const lineNumbers = args.slice(1).map(n => parseInt(n));

  const result = await taskManager.done(file, lineNumbers);
  console.log(result.message);
}

// 生成报告
async function handleReport(taskManager, args) {
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--period=')) {
      options.period = arg.split('=')[1];
    } else if (arg.startsWith('--group=')) {
      options.groupBy = arg.split('=')[1];
    }
  });

  const result = await taskManager.report(options);
  
  console.log(`📊 任务报告 (${result.period})\n`);
  console.log(`总计：${result.summary.total} | 待办：${result.summary.pending} | 完成：${result.summary.done}\n`);
  
  Object.entries(result.report).forEach(([group, data]) => {
    console.log(`\n${group.toUpperCase()} (${data.count}):`);
    data.tasks.slice(0, 5).forEach(task => {
      console.log(`  - ${task.description}`);
    });
    if (data.tasks.length > 5) {
      console.log(`  ... 还有 ${data.tasks.length - 5} 个任务`);
    }
  });
}

// 打印帮助
function printHelp() {
  console.log(`
📝 Obsidian Tasks Skill

用法：task <command> [options]

命令:
  add       添加新任务
  list      列出任务
  done      标记任务为完成
  report    生成任务报告
  help      显示帮助

添加任务示例:
  task add "完成项目报告" --due 2024-01-15 --priority high --tag #work
  task add "购买 groceries" --context @shopping --tag #personal

列出任务示例:
  task list --status pending
  task list --priority high --limit 10
  task list --due 2024-01-15

完成任务示例:
  task done inbox.md 5 10 15

生成报告示例:
  task report --period week --group priority

环境变量:
  OBSIDIAN_VAULT_PATH    Obsidian Vault 路径
`);
}

// 导出给 OpenClaw 使用
module.exports = {
  TaskManager,
  loadConfig,
  DEFAULT_CONFIG
};

// 如果是直接执行则运行 CLI
if (require.main === module) {
  handleCLI();
}
