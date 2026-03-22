/**
 * memory-sync.js - MEMORY.md 同步适配器
 * 
 * 负责将任务同步到 MEMORY.md 文件进行长期追踪
 * 支持任务归档和历史记录管理
 */

const fs = require('fs');
const path = require('path');
const { TaskStatus, Priority } = require('./task-manager');

/**
 * MEMORY.md 同步器类
 */
class MemorySync {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || path.join(require('os').homedir(), 'Documents/Obsidian Vault');
    this.memoryFile = config.memoryFile || 'MEMORY.md';
    this.dataFilePath = path.join(this.vaultPath, this.memoryFile);
  }

  /**
   * 检查 MEMORY.md 文件是否存在
   */
  memoryFileExists() {
    return fs.existsSync(this.dataFilePath);
  }

  /**
   * 初始化 MEMORY.md 文件
   */
  initialize() {
    if (!this.memoryFileExists()) {
      const initialContent = `# MEMORY - 任务历史归档

> 自动生成的任务历史记录，用于长期追踪和回顾

## 最近更新时间

${new Date().toISOString()}

## 任务归档

<!-- 任务归档区域 -->

## 统计摘要

<!-- 统计摘要区域 -->

---
*最后更新：${new Date().toLocaleString('zh-CN')}*
`;
      fs.writeFileSync(this.dataFilePath, initialContent, 'utf8');
      console.log(`Created MEMORY.md at: ${this.dataFilePath}`);
    }

    return true;
  }

  /**
   * 读取 MEMORY.md 内容
   */
  readMemory() {
    if (!this.memoryFileExists()) {
      this.initialize();
    }

    return fs.readFileSync(this.dataFilePath, 'utf8');
  }

  /**
   * 写入 MEMORY.md 内容
   */
  writeMemory(content) {
    fs.writeFileSync(this.dataFilePath, content, 'utf8');
  }

  /**
   * 归档已完成的任务
   */
  archiveTask(task) {
    const content = this.readMemory();
    const archiveSection = '<!-- 任务归档区域 -->';
    
    const taskEntry = `
### 任务 #${task.id}: ${task.description}

- **状态**: ${task.status}
- **优先级**: ${task.priority}
- **项目**: ${task.project || '无'}
- **创建时间**: ${new Date(task.createdAt).toLocaleString('zh-CN')}
- **完成时间**: ${task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : '未完成'}
- **备注**: ${task.completionNote || '无'}

---
`;

    const newContent = content.replace(
      archiveSection,
      `${archiveSection}\n${taskEntry}`
    );

    this.writeMemory(newContent);
    return true;
  }

  /**
   * 批量归档任务
   */
  archiveTasks(tasks) {
    tasks.forEach(task => {
      if (task.status === TaskStatus.COMPLETED) {
        this.archiveTask(task);
      }
    });
  }

  /**
   * 更新统计摘要
   */
  updateStatistics(statistics) {
    const content = this.readMemory();
    const statsSection = '<!-- 统计摘要区域 -->';
    
    const statsContent = `
#### 总体统计

- **总任务数**: ${statistics.total || 0}
- **已完成**: ${statistics.completed || 0}
- **进行中**: ${statistics.inProgress || 0}
- **待处理**: ${statistics.pending || 0}
- **完成率**: ${statistics.completionRate || '0%'}

#### 按优先级统计

- 🔴 **高优先级**: ${statistics.byPriority?.high || 0}
- 🟡 **中优先级**: ${statistics.byPriority?.medium || 0}
- 🟢 **低优先级**: ${statistics.byPriority?.low || 0}

*更新时间：${new Date().toLocaleString('zh-CN')}*
`;

    const newContent = content.replace(
      statsSection,
      `${statsSection}\n${statsContent}`
    );

    this.writeMemory(newContent);
    return true;
  }

  /**
   * 添加每日总结
   */
  addDailySummary(date, summary) {
    const content = this.readMemory();
    const archiveSection = '<!-- 任务归档区域 -->';
    
    const summaryEntry = `
## 📅 每日总结 - ${date}

${summary}

---
`;

    const newContent = content.replace(
      archiveSection,
      `${summaryEntry}\n${archiveSection}`
    );

    this.writeMemory(newContent);
    return true;
  }

  /**
   * 添加每周回顾
   */
  addWeeklyReview(weekStart, weekEnd, review) {
    const content = this.readMemory();
    const archiveSection = '<!-- 任务归档区域 -->';
    
    const reviewEntry = `
## 📊 每周回顾 - ${weekStart} 至 ${weekEnd}

${review}

---
`;

    const newContent = content.replace(
      archiveSection,
      `${reviewEntry}\n${archiveSection}`
    );

    this.writeMemory(newContent);
    return true;
  }

  /**
   * 搜索归档任务
   */
  searchArchivedTasks(query) {
    const content = this.readMemory();
    const lowerQuery = query.toLowerCase();
    
    // 简单的文本搜索
    const lines = content.split('\n');
    const matchingSections = [];
    let currentSection = [];
    let inSection = false;

    lines.forEach(line => {
      if (line.startsWith('### 任务 #')) {
        if (inSection && currentSection.join('\n').toLowerCase().includes(lowerQuery)) {
          matchingSections.push(currentSection.join('\n'));
        }
        currentSection = [line];
        inSection = true;
      } else if (inSection) {
        currentSection.push(line);
        if (line.startsWith('---')) {
          if (currentSection.join('\n').toLowerCase().includes(lowerQuery)) {
            matchingSections.push(currentSection.join('\n'));
          }
          currentSection = [];
          inSection = false;
        }
      }
    });

    return matchingSections;
  }

  /**
   * 导出月度报告
   */
  exportMonthlyReport(year, month) {
    const content = this.readMemory();
    const monthName = new Date(year, month - 1).toLocaleString('zh-CN', { month: 'long' });
    
    // 这里可以添加更复杂的逻辑来提取特定月份的任务
    // 简化版本：返回整个 MEMORY.md 内容
    return {
      title: `${year}年${monthName}任务报告`,
      content: content,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 清理旧数据（保留最近 N 天的记录）
   */
  cleanup(daysToKeep = 90) {
    const content = this.readMemory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // 简化版本：只更新更新时间戳
    const newContent = content.replace(
      /## 最近更新时间\n\n.+\n/,
      `## 最近更新时间\n\n${new Date().toISOString()}\n`
    );

    this.writeMemory(newContent);
    return true;
  }

  /**
   * 同步任务状态到 MEMORY.md
   */
  syncTasks(tasks) {
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    
    // 归档已完成任务
    this.archiveTasks(completedTasks);
    
    // 更新统计
    const statistics = {
      total: tasks.length,
      completed: completedTasks.length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      completionRate: tasks.length > 0 
        ? ((completedTasks.length / tasks.length) * 100).toFixed(2) + '%' 
        : '0%',
      byPriority: {
        high: tasks.filter(t => t.priority === Priority.HIGH && t.status === TaskStatus.COMPLETED).length,
        medium: tasks.filter(t => t.priority === Priority.MEDIUM && t.status === TaskStatus.COMPLETED).length,
        low: tasks.filter(t => t.priority === Priority.LOW && t.status === TaskStatus.COMPLETED).length
      }
    };

    this.updateStatistics(statistics);
    
    return statistics;
  }
}

module.exports = {
  MemorySync
};
