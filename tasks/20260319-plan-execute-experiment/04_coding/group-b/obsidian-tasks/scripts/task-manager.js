/**
 * task-manager.js - 核心任务管理逻辑
 * 
 * 负责任务的 CRUD 操作和状态管理
 * 状态机：Pending → In Progress → Completed
 */

const fs = require('fs');
const path = require('path');

// 任务状态枚举
const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed'
};

// 优先级枚举
const Priority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * 任务类
 */
class Task {
  constructor(id, description, options = {}) {
    this.id = id;
    this.description = description;
    this.status = TaskStatus.PENDING;
    this.priority = options.priority || Priority.MEDIUM;
    this.dueDate = options.due || null;
    this.project = options.project || null;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.completedAt = null;
    this.completionNote = null;
  }

  /**
   * 标记任务为进行中
   */
  start() {
    if (this.status !== TaskStatus.PENDING) {
      throw new Error(`Cannot start task with status: ${this.status}`);
    }
    this.status = TaskStatus.IN_PROGRESS;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 标记任务为已完成
   */
  complete(note = null) {
    if (this.status === TaskStatus.COMPLETED) {
      throw new Error('Task is already completed');
    }
    this.status = TaskStatus.COMPLETED;
    this.completedAt = new Date().toISOString();
    this.completionNote = note;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 转换为 JSON 对象
   */
  toJSON() {
    return {
      id: this.id,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      project: this.project,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      completionNote: this.completionNote
    };
  }

  /**
   * 从 JSON 对象创建任务
   */
  static fromJSON(json) {
    const task = new Task(json.id, json.description, {
      priority: json.priority,
      due: json.dueDate,
      project: json.project
    });
    task.status = json.status;
    task.createdAt = json.createdAt;
    task.updatedAt = json.updatedAt;
    task.completedAt = json.completedAt;
    task.completionNote = json.completionNote;
    return task;
  }
}

/**
 * 任务管理器类
 */
class TaskManager {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || path.join(require('os').homedir(), 'Documents/Obsidian Vault');
    this.tasksFile = config.tasksFile || 'tasks.json';
    this.tasks = [];
    this.nextId = 1;
    this.loadTasks();
  }

  /**
   * 获取任务文件完整路径
   */
  getTasksFilePath() {
    return path.join(this.vaultPath, this.tasksFile);
  }

  /**
   * 加载任务
   */
  loadTasks() {
    const filePath = this.getTasksFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        this.tasks = parsed.tasks || [];
        this.nextId = parsed.nextId || 1;
      } catch (error) {
        console.error('Error loading tasks:', error.message);
        this.tasks = [];
        this.nextId = 1;
      }
    }
  }

  /**
   * 保存任务
   */
  saveTasks() {
    const filePath = this.getTasksFilePath();
    const dir = path.dirname(filePath);
    
    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      tasks: this.tasks,
      nextId: this.nextId,
      lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * 添加任务
   */
  addTask(description, options = {}) {
    const task = new Task(this.nextId++, description, options);
    this.tasks.push(task.toJSON());
    this.saveTasks();
    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId) {
    return this.tasks.find(t => t.id === taskId);
  }

  /**
   * 更新任务
   */
  updateTask(taskId, updates) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = Task.fromJSON(this.tasks[taskIndex]);
    
    if (updates.description) task.description = updates.description;
    if (updates.priority) task.priority = updates.priority;
    if (updates.due) task.dueDate = updates.due;
    if (updates.project) task.project = updates.project;
    
    task.updatedAt = new Date().toISOString();
    this.tasks[taskIndex] = task.toJSON();
    this.saveTasks();
    
    return task;
  }

  /**
   * 删除任务
   */
  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const deleted = this.tasks.splice(taskIndex, 1)[0];
    this.saveTasks();
    return deleted;
  }

  /**
   * 标记任务为进行中
   */
  startTask(taskId) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = Task.fromJSON(this.tasks[taskIndex]);
    task.start();
    this.tasks[taskIndex] = task.toJSON();
    this.saveTasks();
    
    return task;
  }

  /**
   * 标记任务为已完成
   */
  completeTask(taskId, note = null) {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const task = Task.fromJSON(this.tasks[taskIndex]);
    task.complete(note);
    this.tasks[taskIndex] = task.toJSON();
    this.saveTasks();
    
    return task;
  }

  /**
   * 列出任务
   */
  listTasks(filters = {}) {
    let filtered = this.tasks;

    // 按状态过滤
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // 按优先级过滤
    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    // 按项目过滤
    if (filters.project) {
      filtered = filtered.filter(t => t.project === filters.project);
    }

    // 按限制数量
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * 生成报告
   */
  generateReport(options = {}) {
    const period = options.period || 'weekly';
    const project = options.project;

    let filtered = this.tasks;
    if (project) {
      filtered = filtered.filter(t => t.project === project);
    }

    const now = new Date();
    let startDate;

    // 计算周期起始日期
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 统计
    const total = filtered.length;
    const completed = filtered.filter(t => 
      t.status === TaskStatus.COMPLETED && 
      new Date(t.completedAt) >= startDate
    ).length;
    const inProgress = filtered.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pending = filtered.filter(t => t.status === TaskStatus.PENDING).length;

    // 按优先级统计
    const byPriority = {
      high: filtered.filter(t => t.priority === Priority.HIGH && t.status === TaskStatus.COMPLETED).length,
      medium: filtered.filter(t => t.priority === Priority.MEDIUM && t.status === TaskStatus.COMPLETED).length,
      low: filtered.filter(t => t.priority === Priority.LOW && t.status === TaskStatus.COMPLETED).length
    };

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      project: project || 'all',
      statistics: {
        total,
        completed,
        inProgress,
        pending,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) + '%' : '0%',
        byPriority
      }
    };
  }

  /**
   * 搜索任务
   */
  searchTasks(query) {
    const lowerQuery = query.toLowerCase();
    return this.tasks.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) ||
      (t.project && t.project.toLowerCase().includes(lowerQuery))
    );
  }
}

module.exports = {
  Task,
  TaskManager,
  TaskStatus,
  Priority
};
