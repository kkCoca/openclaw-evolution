#!/usr/bin/env node

/**
 * index.js - obsidian-tasks Skill 入口文件
 * 
 * 负责 CLI 命令解析和路由
 * 支持命令：task add/list/done/report
 */

const path = require('path');
const { TaskManager, TaskStatus, Priority } = require('./task-manager');
const { ObsidianSync } = require('./obsidian-sync');
const { MemorySync } = require('./memory-sync');

// 配置文件路径
const CONFIG_PATH = path.join(
  require('os').homedir(),
  '.openclaw/workspace/obsidian-tasks.config.json'
);

// 加载配置
function loadConfig() {
  try {
    const fs = require('fs');
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Warning: Could not load config file:', error.message);
  }
  
  return {
    vaultPath: path.join(require('os').homedir(), 'Documents/Obsidian Vault'),
    tasksFile: 'tasks.json',
    memoryFile: 'MEMORY.md',
    defaultPriority: 'medium',
    defaultLimit: 20
  };
}

// 解析命令行参数
function parseArgs(args) {
  const result = {
    command: args[0],
    subcommand: null,
    params: {},
    description: '',
    taskId: null
  };

  // 收集描述部分（在 -- 参数之前的所有内容）
  const descriptionParts = [];
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        result.params[key] = value;
        i++; // 跳过下一个参数
      } else {
        result.params[key] = true;
      }
    } else if (result.command === 'add') {
      // 收集任务描述
      descriptionParts.push(arg);
    } else if (!result.taskId && result.command === 'done') {
      result.taskId = parseInt(arg, 10);
    }
  }

  if (result.command === 'add' && descriptionParts.length > 0) {
    result.description = descriptionParts.join(' ');
  }

  return result;
}

// 命令处理函数
const commands = {
  /**
   * task add - 添加任务
   */
  add: (args, config) => {
    const manager = new TaskManager(config);
    const description = args.description;
    
    if (!description) {
      console.error('Error: Task description is required');
      console.log('Usage: task add <description> [--priority <high|medium|low>] [--due <YYYY-MM-DD>] [--project <name>]');
      process.exit(1);
    }

    const task = manager.addTask(description, {
      priority: args.params.priority || config.defaultPriority,
      due: args.params.due || null,
      project: args.params.project || null
    });

    console.log(`✅ 任务已添加:`);
    console.log(`   ID: ${task.id}`);
    console.log(`   描述：${task.description}`);
    console.log(`   优先级：${task.priority}`);
    if (task.dueDate) console.log(`   截止日期：${task.dueDate}`);
    if (task.project) console.log(`   项目：${task.project}`);
  },

  /**
   * task list - 列出任务
   */
  list: (args, config) => {
    const manager = new TaskManager(config);
    const filters = {
      status: args.params.status,
      priority: args.params.priority,
      project: args.params.project,
      limit: args.params.limit ? parseInt(args.params.limit, 10) : config.defaultLimit
    };

    const tasks = manager.listTasks(filters);

    if (tasks.length === 0) {
      console.log('📭 没有找到任务');
      return;
    }

    console.log(`📋 任务列表 (${tasks.length} 个):\n`);

    tasks.forEach(task => {
      const statusIcon = task.status === TaskStatus.COMPLETED ? '✅' : 
                         task.status === TaskStatus.IN_PROGRESS ? '🔄' : '📋';
      const priorityIcon = task.priority === Priority.HIGH ? '🔴' : 
                           task.priority === Priority.MEDIUM ? '🟡' : '🟢';
      
      console.log(`${statusIcon} [${task.id}] ${priorityIcon} ${task.description}`);
      if (task.dueDate) console.log(`     📅 ${task.dueDate}`);
      if (task.project) console.log(`     #${task.project}`);
      console.log();
    });
  },

  /**
   * task done - 完成任务
   */
  done: (args, config) => {
    const manager = new TaskManager(config);
    const taskId = args.taskId;

    if (!taskId) {
      console.error('Error: Task ID is required');
      console.log('Usage: task done <task-id> [--note <completion-note>]');
      process.exit(1);
    }

    try {
      const task = manager.completeTask(taskId, args.params.note || null);
      console.log(`✅ 任务已完成:`);
      console.log(`   ID: ${task.id}`);
      console.log(`   描述：${task.description}`);
      console.log(`   完成时间：${new Date(task.completedAt).toLocaleString('zh-CN')}`);
      if (task.completionNote) {
        console.log(`   备注：${task.completionNote}`);
      }

      // 同步到 MEMORY.md
      const memorySync = new MemorySync(config);
      if (memorySync.memoryFileExists()) {
        memorySync.archiveTask(task);
        console.log(`   📝 已归档到 MEMORY.md`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  },

  /**
   * task report - 生成报告
   */
  report: (args, config) => {
    const manager = new TaskManager(config);
    const report = manager.generateReport({
      period: args.params.period || 'weekly',
      project: args.params.project
    });

    console.log(`📊 任务报告 - ${report.period.toUpperCase()}`);
    console.log(`   周期：${new Date(report.startDate).toLocaleDateString('zh-CN')} 至 ${new Date(report.endDate).toLocaleDateString('zh-CN')}`);
    console.log(`   项目：${report.project}`);
    console.log();
    console.log('📈 统计:');
    console.log(`   总任务数：${report.statistics.total}`);
    console.log(`   已完成：${report.statistics.completed}`);
    console.log(`   进行中：${report.statistics.inProgress}`);
    console.log(`   待处理：${report.statistics.pending}`);
    console.log(`   完成率：${report.statistics.completionRate}`);
    console.log();
    console.log('🎯 按优先级:');
    console.log(`   🔴 高优先级：${report.statistics.byPriority.high}`);
    console.log(`   🟡 中优先级：${report.statistics.byPriority.medium}`);
    console.log(`   🟢 低优先级：${report.statistics.byPriority.low}`);
  },

  /**
   * task init - 初始化
   */
  init: (args, config) => {
    console.log('🔧 初始化 obsidian-tasks Skill...\n');

    // 初始化 Obsidian 同步
    const obsidianSync = new ObsidianSync(config);
    obsidianSync.initialize();

    // 初始化 MEMORY.md 同步
    const memorySync = new MemorySync(config);
    memorySync.initialize();

    console.log('\n✅ 初始化完成!');
    console.log(`   Vault 路径：${config.vaultPath}`);
    console.log(`   Tasks 文件：${config.tasksFile}`);
    console.log(`   Memory 文件：${config.memoryFile}`);
  },

  /**
   * task sync - 同步到 MEMORY.md
   */
  sync: (args, config) => {
    const manager = new TaskManager(config);
    const memorySync = new MemorySync(config);

    if (!memorySync.memoryFileExists()) {
      memorySync.initialize();
    }

    const tasks = manager.listTasks();
    const statistics = memorySync.syncTasks(tasks);

    console.log('✅ 同步完成!');
    console.log(`   归档任务：${statistics.completed}`);
    console.log(`   完成率：${statistics.completionRate}`);
  },

  /**
   * task search - 搜索任务
   */
  search: (args, config) => {
    const manager = new TaskManager(config);
    const query = args.description;

    if (!query) {
      console.error('Error: Search query is required');
      console.log('Usage: task search <query>');
      process.exit(1);
    }

    const results = manager.searchTasks(query);

    if (results.length === 0) {
      console.log('🔍 没有找到匹配的任务');
      return;
    }

    console.log(`🔍 搜索结果 (${results.length} 个):\n`);
    results.forEach(task => {
      console.log(`[${task.id}] ${task.description}`);
    });
  },

  /**
   * task help - 显示帮助
   */
  help: () => {
    console.log(`
📚 obsidian-tasks Skill - 使用指南

命令:
  task add <description>     添加新任务
    --priority <high|medium|low>  设置优先级
    --due <YYYY-MM-DD>            设置截止日期
    --project <name>              设置项目

  task list                  列出任务
    --status <pending|in-progress|completed>  按状态过滤
    --priority <high|medium|low>            按优先级过滤
    --project <name>                        按项目过滤
    --limit <number>                        限制数量

  task done <task-id>        完成任务
    --note <text>              完成备注

  task report                生成报告
    --period <daily|weekly|monthly>  报告周期
    --project <name>                 按项目过滤

  task init                  初始化配置
  task sync                  同步到 MEMORY.md
  task search <query>        搜索任务
  task help                  显示此帮助信息

示例:
  task add "完成 Skill 开发" --priority high --due 2026-03-25 --project openclaw
  task list --status pending --priority high
  task done 123 --note "提前完成"
  task report --period weekly

配置:
  配置文件：~/.openclaw/workspace/obsidian-tasks.config.json
`);
  }
};

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    commands.help();
    process.exit(0);
  }

  const config = loadConfig();
  const parsed = parseArgs(args);
  const command = commands[parsed.command];

  if (!command) {
    console.error(`Error: Unknown command '${parsed.command}'`);
    console.log('Run "task help" for usage information.');
    process.exit(1);
  }

  command(parsed, config);
}

// 运行主函数
main();
