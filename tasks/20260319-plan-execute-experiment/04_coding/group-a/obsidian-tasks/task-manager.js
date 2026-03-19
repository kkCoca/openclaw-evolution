/**
 * task-manager.js
 * Obsidian Tasks Skill 核心管理器
 * 处理 task add/list/done/report 命令
 */

const ObsidianSync = require('./obsidian-sync');
const MemorySync = require('./memory-sync');

class TaskManager {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.defaultFile = config.defaultFile || 'inbox.md';
    this.obsidian = new ObsidianSync(this.vaultPath);
    this.memory = new MemorySync();
  }

  /**
   * 添加任务
   * @param {Object} options - 任务配置
   */
  async add(options) {
    const {
      description,
      file = this.defaultFile,
      dueDate,
      startDate,
      priority,
      tags = [],
      contexts = []
    } = options;

    if (!description || description.trim() === '') {
      throw new Error('任务描述不能为空');
    }

    const taskConfig = {
      description: description.trim(),
      dueDate,
      startDate,
      priority,
      tags,
      contexts
    };

    const result = this.obsidian.addTask(file, taskConfig);
    
    // 同步到内存
    this.memory.addTask({
      file,
      description: description.trim(),
      dueDate,
      startDate,
      priority,
      tags,
      contexts,
      status: 'pending'
    });

    return {
      success: true,
      message: `✅ 任务已添加到 ${file}`,
      task: taskConfig
    };
  }

  /**
   * 列出任务
   * @param {Object} filters - 过滤条件
   */
  async list(filters = {}) {
    const {
      status,      // 'pending' | 'done' | 'all'
      file,
      dueDate,
      priority,
      tag,
      context,
      limit = 50
    } = filters;

    let tasks = this.obsidian.collectAllTasks();

    // 应用过滤
    if (status && status !== 'all') {
      tasks = tasks.filter(t => t.status === status);
    }

    if (file) {
      tasks = tasks.filter(t => t.file === file);
    }

    if (dueDate) {
      tasks = tasks.filter(t => t.dueDate === dueDate);
    }

    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    if (tag) {
      tasks = tasks.filter(t => t.tags.includes(tag));
    }

    if (context) {
      tasks = tasks.filter(t => t.contexts.includes(context));
    }

    // 按优先级和到期日排序
    tasks = this.sortTasks(tasks);

    // 限制数量
    tasks = tasks.slice(0, limit);

    // 同步到内存
    this.memory.syncTasks(tasks);

    return {
      success: true,
      count: tasks.length,
      tasks: tasks.map(t => this.formatTaskForDisplay(t))
    };
  }

  /**
   * 标记任务为完成/未完成
   * @param {string} file - 文件路径
   * @param {number|Array} lineNumbers - 行号
   */
  async done(file, lineNumbers) {
    const lines = Array.isArray(lineNumbers) ? lineNumbers : [lineNumbers];
    
    const result = this.obsidian.toggleTask(file, lines);
    
    if (result) {
      // 更新内存
      lines.forEach(lineNum => {
        this.memory.toggleTask(file, lineNum);
      });

      return {
        success: true,
        message: `✅ 已更新 ${lines.length} 个任务状态`
      };
    }

    return {
      success: false,
      message: '未找到可更新的任务'
    };
  }

  /**
   * 生成报告
   * @param {Object} options - 报告配置
   */
  async report(options = {}) {
    const {
      period = 'today',  // 'today' | 'week' | 'month' | 'all'
      groupBy = 'status' // 'status' | 'priority' | 'file' | 'tag'
    } = options;

    const allTasks = this.obsidian.collectAllTasks();
    const today = new Date().toISOString().split('T')[0];
    
    let filteredTasks = allTasks;

    // 按时间段过滤
    if (period === 'today') {
      filteredTasks = allTasks.filter(t => t.dueDate === today || t.doneDate === today);
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      filteredTasks = allTasks.filter(t => 
        (t.dueDate && t.dueDate >= weekAgoStr) || 
        (t.doneDate && t.doneDate >= weekAgoStr)
      );
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      filteredTasks = allTasks.filter(t => 
        (t.dueDate && t.dueDate >= monthAgoStr) || 
        (t.doneDate && t.doneDate >= monthAgoStr)
      );
    }

    // 分组统计
    const report = this.generateReport(filteredTasks, groupBy);

    return {
      success: true,
      period,
      groupBy,
      summary: {
        total: filteredTasks.length,
        pending: filteredTasks.filter(t => t.status === 'pending').length,
        done: filteredTasks.filter(t => t.status === 'done').length
      },
      report
    };
  }

  /**
   * 排序任务
   */
  sortTasks(tasks) {
    const priorityOrder = { high: 0, medium: 1, low: 2, null: 3 };
    
    return tasks.sort((a, b) => {
      // 先按状态（未完成优先）
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      
      // 再按优先级
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // 最后按到期日
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      
      return 0;
    });
  }

  /**
   * 格式化任务用于显示
   */
  formatTaskForDisplay(task) {
    let display = `${task.status === 'done' ? '✅' : '⬜'} `;
    
    if (task.priority === 'high') display += '⏫ ';
    else if (task.priority === 'medium') display += '🔼 ';
    
    display += task.description;
    
    if (task.dueDate) display += ` 📅 ${task.dueDate}`;
    if (task.startDate) display += ` 🛫 ${task.startDate}`;
    if (task.doneDate) display += ` ✅ ${task.doneDate}`;
    
    if (task.tags.length > 0) display += ' ' + task.tags.join(' ');
    if (task.contexts.length > 0) display += ' ' + task.contexts.join(' ');
    
    display += ` (${task.file}:${task.line})`;
    
    return display;
  }

  /**
   * 生成报告
   */
  generateReport(tasks, groupBy) {
    const report = {};

    tasks.forEach(task => {
      let key;
      
      switch (groupBy) {
        case 'priority':
          key = task.priority || 'none';
          break;
        case 'file':
          key = task.file;
          break;
        case 'tag':
          key = task.tags.length > 0 ? task.tags[0] : 'untagged';
          break;
        case 'status':
        default:
          key = task.status;
      }

      if (!report[key]) {
        report[key] = { count: 0, tasks: [] };
      }
      
      report[key].count++;
      report[key].tasks.push(task);
    });

    return report;
  }
}

module.exports = TaskManager;
