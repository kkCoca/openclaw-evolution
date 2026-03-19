/**
 * memory-sync.js
 * 内存缓存层
 * 提供快速的任务查询和状态跟踪，减少文件系统访问
 */

class MemorySync {
  constructor() {
    this.tasks = new Map();  // key: "file:line"
    this.lastSync = null;
    this.taskCounter = 0;
  }

  /**
   * 添加任务到内存
   */
  addTask(task) {
    this.taskCounter++;
    const key = `${task.file}:${task.line || this.taskCounter}`;
    
    this.tasks.set(key, {
      ...task,
      id: this.taskCounter,
      key,
      createdAt: new Date().toISOString()
    });

    return key;
  }

  /**
   * 同步任务列表
   */
  syncTasks(tasks) {
    tasks.forEach(task => {
      const key = `${task.file}:${task.line}`;
      if (!this.tasks.has(key)) {
        this.addTask({ ...task, line: task.line });
      }
    });
    this.lastSync = new Date().toISOString();
  }

  /**
   * 切换任务状态
   */
  toggleTask(file, lineNum) {
    const key = `${file}:${lineNum}`;
    const task = this.tasks.get(key);
    
    if (task) {
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      task.status = newStatus;
      
      if (newStatus === 'done' && !task.doneDate) {
        task.doneDate = new Date().toISOString().split('T')[0];
      }
      
      task.updatedAt = new Date().toISOString();
      this.tasks.set(key, task);
    }

    return task;
  }

  /**
   * 获取任务
   */
  getTask(file, lineNum) {
    const key = `${file}:${lineNum}`;
    return this.tasks.get(key);
  }

  /**
   * 获取所有任务
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * 查询任务
   */
  query(filters = {}) {
    let results = this.getAllTasks();

    if (filters.status) {
      results = results.filter(t => t.status === filters.status);
    }

    if (filters.file) {
      results = results.filter(t => t.file === filters.file);
    }

    if (filters.priority) {
      results = results.filter(t => t.priority === filters.priority);
    }

    if (filters.tag) {
      results = results.filter(t => t.tags && t.tags.includes(filters.tag));
    }

    if (filters.context) {
      results = results.filter(t => t.contexts && t.contexts.includes(filters.context));
    }

    return results;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const allTasks = this.getAllTasks();
    
    return {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      done: allTasks.filter(t => t.status === 'done').length,
      byPriority: {
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length,
        none: allTasks.filter(t => !t.priority).length
      },
      lastSync: this.lastSync
    };
  }

  /**
   * 清除内存
   */
  clear() {
    this.tasks.clear();
    this.lastSync = null;
  }

  /**
   * 导出内存数据
   */
  export() {
    return {
      tasks: Array.from(this.tasks.values()),
      lastSync: this.lastSync,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * 导入内存数据
   */
  import(data) {
    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks.forEach(task => {
        if (task.key) {
          this.tasks.set(task.key, task);
        }
      });
      this.lastSync = data.lastSync;
    }
  }
}

module.exports = MemorySync;
