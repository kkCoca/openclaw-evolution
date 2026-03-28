/**
 * 并行执行器 (Parallel Executor)
 * 
 * 支持独立任务并行执行，提升流程执行效率
 * 主要用于 coding 阶段的前后端并行开发
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const { AdapterFactory } = require('./ai-tool-adapter');

// 并行任务状态
const ParallelTaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * 并行任务类
 */
class ParallelTask {
  constructor(id, stageName, input, config) {
    this.id = id;
    this.stageName = stageName;
    this.input = input;
    this.config = config;
    this.status = ParallelTaskStatus.PENDING;
    this.result = null;
    this.error = null;
    this.startedAt = null;
    this.completedAt = null;
  }

  /**
   * 执行任务
   * @returns {Promise<object>} 执行结果
   */
  async execute() {
    this.status = ParallelTaskStatus.RUNNING;
    this.startedAt = Date.now();

    try {
      const adapter = AdapterFactory.fromConfig(this.config, this.stageName);
      this.result = await adapter.execute(this.stageName, this.input);
      this.status = ParallelTaskStatus.COMPLETED;
      this.completedAt = Date.now();
      return this.result;
    } catch (error) {
      this.status = ParallelTaskStatus.FAILED;
      this.error = error.message;
      this.completedAt = Date.now();
      throw error;
    }
  }

  /**
   * 取消任务
   */
  cancel() {
    if (this.status === ParallelTaskStatus.PENDING || 
        this.status === ParallelTaskStatus.RUNNING) {
      this.status = ParallelTaskStatus.CANCELLED;
      this.completedAt = Date.now();
    }
  }

  /**
   * 获取任务状态
   * @returns {object} 任务状态信息
   */
  getStatus() {
    return {
      id: this.id,
      stageName: this.stageName,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.completedAt ? (this.completedAt - this.startedAt) : null,
      error: this.error
    };
  }
}

/**
 * 并行执行器类
 */
class ParallelExecutor {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    this.tasks = new Map();
    this.maxConcurrent = config.parallel?.maxConcurrentTasks || 3;
    this.runningCount = 0;
  }

  /**
   * 添加并行任务
   * @param {string} id - 任务 ID
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {ParallelTask} 任务对象
   */
  addTask(id, stageName, input) {
    if (this.tasks.has(id)) {
      throw new Error(`任务 ${id} 已存在`);
    }

    const task = new ParallelTask(id, stageName, input, this.config);
    this.tasks.set(id, task);
    return task;
  }

  /**
   * 执行所有并行任务
   * @param {number} maxConcurrent - 最大并发数（覆盖配置）
   * @returns {Promise<Map<string, object>>} 所有任务结果
   */
  async executeAll(maxConcurrent = null) {
    const limit = maxConcurrent || this.maxConcurrent;
    const results = new Map();
    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => task.status === ParallelTaskStatus.PENDING);

    let index = 0;
    const taskQueue = [];

    // 启动初始批次
    while (this.runningCount < limit && index < pendingTasks.length) {
      const task = pendingTasks[index];
      taskQueue.push(this.executeTask(task));
      index++;
    }

    // 等待任务完成并启动新任务
    while (taskQueue.length > 0) {
      const done = await Promise.race(taskQueue.map(p => p.promise));
      
      // 移除已完成的任务
      const taskIndex = taskQueue.findIndex(p => p.taskId === done.taskId);
      if (taskIndex !== -1) {
        taskQueue.splice(taskIndex, 1);
      }

      // 启动新任务
      if (index < pendingTasks.length && this.runningCount < limit) {
        const nextTask = pendingTasks[index];
        taskQueue.push(this.executeTask(nextTask));
        index++;
      }
    }

    // 收集结果
    for (const [id, task] of this.tasks) {
      results.set(id, {
        status: task.status,
        result: task.result,
        error: task.error,
        duration: task.completedAt ? (task.completedAt - task.startedAt) : null
      });
    }

    return results;
  }

  /**
   * 执行单个任务（内部使用）
   * @param {ParallelTask} task - 任务对象
   * @returns {Promise<object>} 任务结果
   */
  async executeTask(task) {
    this.runningCount++;

    const promise = (async () => {
      try {
        await task.execute();
        return { taskId: task.id, success: true };
      } catch (error) {
        return { taskId: task.id, success: false, error };
      } finally {
        this.runningCount--;
      }
    })();

    return { taskId: task.id, promise };
  }

  /**
   * 取消所有任务
   */
  cancelAll() {
    for (const task of this.tasks.values()) {
      task.cancel();
    }
    this.runningCount = 0;
  }

  /**
   * 获取所有任务状态
   * @returns {Map<string, object>} 任务状态映射
   */
  getAllStatus() {
    const statusMap = new Map();
    for (const [id, task] of this.tasks) {
      statusMap.set(id, task.getStatus());
    }
    return statusMap;
  }

  /**
   * 获取任务进度
   * @returns {object} 进度信息
   */
  getProgress() {
    const total = this.tasks.size;
    const completed = Array.from(this.tasks.values())
      .filter(task => task.status === ParallelTaskStatus.COMPLETED).length;
    const failed = Array.from(this.tasks.values())
      .filter(task => task.status === ParallelTaskStatus.FAILED).length;
    const running = Array.from(this.tasks.values())
      .filter(task => task.status === ParallelTaskStatus.RUNNING).length;
    const pending = Array.from(this.tasks.values())
      .filter(task => task.status === ParallelTaskStatus.PENDING).length;

    return {
      total,
      completed,
      failed,
      running,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * 清空任务列表
   */
  clear() {
    this.tasks.clear();
    this.runningCount = 0;
  }
}

/**
 * 创建并行任务组（用于 coding 阶段前后端并行）
 * @param {ParallelExecutor} executor - 并行执行器
 * @param {object} input - 输入数据
 * @param {object} config - 配置对象
 * @returns {ParallelExecutor} 执行器实例
 */
function createCodingParallelTasks(executor, input, config) {
  // 前端任务
  executor.addTask('coding-frontend', 'coding', {
    ...input,
    taskType: 'frontend',
    detailFile: input.detailFile,
    outputDir: '04_coding/frontend'
  });

  // 后端任务
  executor.addTask('coding-backend', 'coding', {
    ...input,
    taskType: 'backend',
    detailFile: input.detailFile,
    outputDir: '04_coding/backend'
  });

  return executor;
}

/**
 * 检查是否可以并行执行
 * @param {string} stageName - 阶段名称
 * @param {object} config - 配置对象
 * @returns {boolean} 是否可并行
 */
function canParallelExecute(stageName, config) {
  if (!config.parallel?.enabled) {
    return false;
  }

  // 检查是否配置了并行组
  const groups = config.parallel.groups || [];
  return groups.some(group => 
    group.stages && group.stages.includes(stageName)
  );
}

// 导出
module.exports = {
  ParallelTask,
  ParallelTaskStatus,
  ParallelExecutor,
  createCodingParallelTasks,
  canParallelExecute
};
