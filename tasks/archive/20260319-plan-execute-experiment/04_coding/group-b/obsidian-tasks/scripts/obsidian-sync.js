/**
 * obsidian-sync.js - Obsidian 同步适配器
 * 
 * 负责与 Obsidian Tasks Plugin 的数据同步
 * 支持读取和写入 tasks.json 文件
 */

const fs = require('fs');
const path = require('path');
const { Task, TaskStatus, Priority } = require('./task-manager');

/**
 * Obsidian 同步器类
 */
class ObsidianSync {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || path.join(require('os').homedir(), 'Documents/Obsidian Vault');
    this.tasksFile = config.tasksFile || 'tasks.json';
    this.dataFilePath = path.join(this.vaultPath, this.tasksFile);
  }

  /**
   * 检查 Vault 是否存在
   */
  vaultExists() {
    return fs.existsSync(this.vaultPath);
  }

  /**
   * 检查 Tasks 数据文件是否存在
   */
  tasksFileExists() {
    return fs.existsSync(this.dataFilePath);
  }

  /**
   * 初始化 Vault 和 Tasks 文件
   */
  initialize() {
    // 创建 Vault 目录（如果不存在）
    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true });
      console.log(`Created Obsidian Vault at: ${this.vaultPath}`);
    }

    // 创建 Tasks 数据文件（如果不存在）
    if (!this.tasksFileExists()) {
      const initialData = {
        tasks: [],
        nextId: 1,
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(initialData, null, 2), 'utf8');
      console.log(`Created Tasks data file at: ${this.dataFilePath}`);
    }

    return true;
  }

  /**
   * 读取所有任务
   */
  readTasks() {
    if (!this.tasksFileExists()) {
      throw new Error('Tasks file not found. Run initialize() first.');
    }

    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to read tasks file: ${error.message}`);
    }
  }

  /**
   * 写入所有任务
   */
  writeTasks(data) {
    if (!this.tasksFileExists()) {
      this.initialize();
    }

    try {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      throw new Error(`Failed to write tasks file: ${error.message}`);
    }
  }

  /**
   * 添加任务
   */
  addTask(taskData) {
    const data = this.readTasks();
    
    const task = {
      id: data.nextId || 1,
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.tasks.push(task);
    data.nextId = (data.nextId || 1) + 1;
    
    this.writeTasks(data);
    return task;
  }

  /**
   * 更新任务
   */
  updateTask(taskId, updates) {
    const data = this.readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    data.tasks[taskIndex] = {
      ...data.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.writeTasks(data);
    return data.tasks[taskIndex];
  }

  /**
   * 删除任务
   */
  deleteTask(taskId) {
    const data = this.readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const deleted = data.tasks.splice(taskIndex, 1)[0];
    this.writeTasks(data);
    return deleted;
  }

  /**
   * 获取单个任务
   */
  getTask(taskId) {
    const data = this.readTasks();
    return data.tasks.find(t => t.id === taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    const data = this.readTasks();
    return data.tasks;
  }

  /**
   * 按状态过滤任务
   */
  getTasksByStatus(status) {
    const tasks = this.getAllTasks();
    return tasks.filter(t => t.status === status);
  }

  /**
   * 按优先级过滤任务
   */
  getTasksByPriority(priority) {
    const tasks = this.getAllTasks();
    return tasks.filter(t => t.priority === priority);
  }

  /**
   * 按项目过滤任务
   */
  getTasksByProject(project) {
    const tasks = this.getAllTasks();
    return tasks.filter(t => t.project === project);
  }

  /**
   * 标记任务为已完成
   */
  completeTask(taskId, completionNote = null) {
    const data = this.readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    data.tasks[taskIndex].status = TaskStatus.COMPLETED;
    data.tasks[taskIndex].completedAt = new Date().toISOString();
    if (completionNote) {
      data.tasks[taskIndex].completionNote = completionNote;
    }
    data.tasks[taskIndex].updatedAt = new Date().toISOString();

    this.writeTasks(data);
    return data.tasks[taskIndex];
  }

  /**
   * 标记任务为进行中
   */
  startTask(taskId) {
    const data = this.readTasks();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (data.tasks[taskIndex].status !== TaskStatus.PENDING) {
      throw new Error(`Cannot start task with status: ${data.tasks[taskIndex].status}`);
    }

    data.tasks[taskIndex].status = TaskStatus.IN_PROGRESS;
    data.tasks[taskIndex].updatedAt = new Date().toISOString();

    this.writeTasks(data);
    return data.tasks[taskIndex];
  }

  /**
   * 搜索任务
   */
  searchTasks(query) {
    const tasks = this.getAllTasks();
    const lowerQuery = query.toLowerCase();
    
    return tasks.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) ||
      (t.project && t.project.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 获取统计数据
   */
  getStatistics() {
    const tasks = this.getAllTasks();
    
    return {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
        inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length
      },
      byPriority: {
        high: tasks.filter(t => t.priority === Priority.HIGH).length,
        medium: tasks.filter(t => t.priority === Priority.MEDIUM).length,
        low: tasks.filter(t => t.priority === Priority.LOW).length
      }
    };
  }

  /**
   * 导出任务为 Markdown
   */
  exportToMarkdown(options = {}) {
    const tasks = this.getAllTasks();
    let markdown = '# Tasks\n\n';

    // 按状态分组
    const groups = {
      [TaskStatus.PENDING]: '## 📋 Pending\n\n',
      [TaskStatus.IN_PROGRESS]: '## 🔄 In Progress\n\n',
      [TaskStatus.COMPLETED]: '## ✅ Completed\n\n'
    };

    tasks.forEach(task => {
      const checkbox = task.status === TaskStatus.COMPLETED ? '[x]' : '[ ]';
      const priority = task.priority === Priority.HIGH ? '🔴' : task.priority === Priority.MEDIUM ? '🟡' : '🟢';
      const dueDate = task.dueDate ? ` 📅 ${task.dueDate}` : '';
      const project = task.project ? ` #${task.project}` : '';
      
      groups[task.status] += `${checkbox} ${priority} ${task.description}${dueDate}${project}\n`;
    });

    markdown += groups[TaskStatus.PENDING];
    markdown += groups[TaskStatus.IN_PROGRESS];
    markdown += groups[TaskStatus.COMPLETED];

    return markdown;
  }

  /**
   * 从 Markdown 导入任务
   */
  importFromMarkdown(markdownContent) {
    const tasks = [];
    const lines = markdownContent.split('\n');
    let id = 1;

    lines.forEach(line => {
      const match = line.match(/^\[([ x])\]\s*(.+)$/);
      if (match) {
        const isCompleted = match[1] === 'x';
        const description = match[2].replace(/[🔴🟡🟢]\s*/, '').trim();
        
        // 提取截止日期
        const dueMatch = description.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
        const dueDate = dueMatch ? dueMatch[1] : null;

        // 提取项目
        const projectMatch = description.match(/#(\w+)/);
        const project = projectMatch ? projectMatch[1] : null;

        tasks.push({
          id: id++,
          description: description.replace(/📅.*|#\w+/g, '').trim(),
          status: isCompleted ? TaskStatus.COMPLETED : TaskStatus.PENDING,
          priority: Priority.MEDIUM,
          dueDate,
          project,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    return tasks;
  }
}

module.exports = {
  ObsidianSync
};
