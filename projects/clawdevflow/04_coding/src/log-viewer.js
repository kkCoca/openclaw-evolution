/**
 * 日志查询工具 (Log Viewer)
 * 
 * 提供日志检索、过滤、统计功能
 * 支持 JSON Lines 格式日志文件
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 日志查询器类
 */
class LogViewer {
  /**
   * 构造函数
   * @param {string} logFile - 日志文件路径
   */
  constructor(logFile) {
    this.logFile = logFile;
  }

  /**
   * 读取所有日志条目
   * @returns {Promise<Array<object>>} 日志条目数组
   */
  async readAll() {
    if (!fs.existsSync(this.logFile)) {
      throw new Error(`日志文件不存在：${this.logFile}`);
    }

    const logs = [];
    const content = fs.readFileSync(this.logFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        logs.push(JSON.parse(line));
      } catch (error) {
        // 跳过无效的 JSON 行
        console.warn('跳过无效的日志行:', line.substring(0, 50));
      }
    }

    return logs;
  }

  /**
   * 流式读取日志（适合大文件）
   * @param {function} onLog - 每条日志的回调函数
   * @returns {Promise<void>}
   */
  async readStream(onLog) {
    if (!fs.existsSync(this.logFile)) {
      throw new Error(`日志文件不存在：${this.logFile}`);
    }

    const fileStream = fs.createReadStream(this.logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          const log = JSON.parse(line);
          onLog(log);
        } catch (error) {
          // 跳过无效的 JSON 行
        }
      }
    }
  }

  /**
   * 按阶段过滤日志
   * @param {string} stageName - 阶段名称
   * @returns {Promise<Array<object>>} 过滤后的日志
   */
  async filterByStage(stageName) {
    const logs = await this.readAll();
    return logs.filter(log => log.stage === stageName);
  }

  /**
   * 按事件类型过滤日志
   * @param {string} eventType - 事件类型
   * @returns {Promise<Array<object>>} 过滤后的日志
   */
  async filterByEvent(eventType) {
    const logs = await this.readAll();
    return logs.filter(log => log.event === eventType);
  }

  /**
   * 按时间范围过滤日志
   * @param {string} startTime - 开始时间（ISO 格式）
   * @param {string} endTime - 结束时间（ISO 格式）
   * @returns {Promise<Array<object>>} 过滤后的日志
   */
  async filterByTimeRange(startTime, endTime) {
    const logs = await this.readAll();
    return logs.filter(log => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= new Date(startTime) && timestamp <= new Date(endTime);
    });
  }

  /**
   * 搜索日志（关键词）
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array<object>>} 匹配的日志
   */
  async search(keyword) {
    const logs = await this.readAll();
    const keywordLower = keyword.toLowerCase();

    return logs.filter(log => {
      const logStr = JSON.stringify(log).toLowerCase();
      return logStr.includes(keywordLower);
    });
  }

  /**
   * 获取日志统计信息
   * @returns {Promise<object>} 统计信息
   */
  async getStats() {
    const logs = await this.readAll();

    const stats = {
      total: logs.length,
      byStage: {},
      byEvent: {},
      errors: 0,
      startTime: null,
      endTime: null,
      duration: 0
    };

    for (const log of logs) {
      // 按阶段统计
      if (log.stage) {
        stats.byStage[log.stage] = (stats.byStage[log.stage] || 0) + 1;
      }

      // 按事件统计
      if (log.event) {
        stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
      }

      // 统计错误
      if (log.event === 'error' || log.details?.error) {
        stats.errors++;
      }

      // 时间范围
      if (log.timestamp) {
        const timestamp = new Date(log.timestamp);
        if (!stats.startTime || timestamp < stats.startTime) {
          stats.startTime = timestamp;
        }
        if (!stats.endTime || timestamp > stats.endTime) {
          stats.endTime = timestamp;
        }
      }
    }

    // 计算持续时间
    if (stats.startTime && stats.endTime) {
      stats.duration = stats.endTime - stats.startTime;
    }

    return stats;
  }

  /**
   * 获取阶段执行时间线
   * @returns {Promise<Array<object>>} 时间线
   */
  async getTimeline() {
    const logs = await this.readAll();
    const timeline = [];

    const stageEvents = {
      stage_started: '开始',
      stage_completed: '完成',
      review_request_sent: '审阅请求',
      review_decision: '审阅结论',
      stage_rejected: '驳回重试'
    };

    for (const log of logs) {
      if (stageEvents[log.event]) {
        timeline.push({
          timestamp: log.timestamp,
          stage: log.stage,
          event: log.event,
          description: stageEvents[log.event],
          details: log.details
        });
      }
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return timeline;
  }

  /**
   * 格式化输出日志
   * @param {Array<object>} logs - 日志数组
   * @param {string} format - 输出格式（text|json|table）
   * @returns {string} 格式化后的输出
   */
  format(logs, format = 'text') {
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'table':
        return this.formatAsTable(logs);

      case 'text':
      default:
        return this.formatAsText(logs);
    }
  }

  /**
   * 格式化为文本
   * @param {Array<object>} logs - 日志数组
   * @returns {string} 文本输出
   */
  formatAsText(logs) {
    return logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString('zh-CN');
      return `[${time}] [${log.stage}] ${log.event}: ${JSON.stringify(log.details)}`;
    }).join('\n');
  }

  /**
   * 格式化为表格
   * @param {Array<object>} logs - 日志数组
   * @returns {string} 表格输出
   */
  formatAsTable(logs) {
    if (logs.length === 0) return '无日志';

    const headers = ['时间', '阶段', '事件', '详情'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('zh-CN'),
      log.stage,
      log.event,
      JSON.stringify(log.details).substring(0, 50)
    ]);

    // 简单的表格格式化
    const widths = headers.map((h, i) => 
      Math.max(h.length, ...rows.map(r => r[i]?.length || 0))
    );

    const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
    const separator = widths.map(w => '-'.repeat(w)).join('-|-');

    const dataRows = rows.map(row => 
      row.map((cell, i) => (cell || '').padEnd(widths[i])).join(' | ')
    );

    return [headerRow, separator, ...dataRows].join('\n');
  }

  /**
   * 导出日志为文件
   * @param {string} outputFile - 输出文件路径
   * @param {string} format - 导出格式
   */
  async export(outputFile, format = 'json') {
    const logs = await this.readAll();
    const content = this.format(logs, format);
    fs.writeFileSync(outputFile, content, 'utf8');
  }
}

/**
 * 日志目录查看器（查看多个工作流的日志）
 */
class LogDirectoryViewer {
  /**
   * 构造函数
   * @param {string} logDir - 日志目录路径
   */
  constructor(logDir) {
    this.logDir = logDir;
  }

  /**
   * 列出所有日志文件
   * @returns {string[]} 日志文件列表
   */
  listLogs() {
    if (!fs.existsSync(this.logDir)) {
      return [];
    }

    return fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .sort();
  }

  /**
   * 获取所有工作流摘要
   * @returns {Promise<Array<object>>} 工作流摘要列表
   */
  async getAllSummaries() {
    const summaries = [];

    for (const logFile of this.listLogs()) {
      const logPath = path.join(this.logDir, logFile);
      const viewer = new LogViewer(logPath);
      
      try {
        const stats = await viewer.getStats();
        const timeline = await viewer.getTimeline();
        
        summaries.push({
          workflowId: logFile.replace('.log', ''),
          logFile: logPath,
          totalLogs: stats.total,
          errors: stats.errors,
          startTime: stats.startTime,
          endTime: stats.endTime,
          lastEvent: timeline[timeline.length - 1]?.event
        });
      } catch (error) {
        summaries.push({
          workflowId: logFile.replace('.log', ''),
          logFile: logPath,
          error: error.message
        });
      }
    }

    return summaries;
  }

  /**
   * 搜索所有日志
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array<object>>} 搜索结果
   */
  async searchAll(keyword) {
    const results = [];

    for (const logFile of this.listLogs()) {
      const logPath = path.join(this.logDir, logFile);
      const viewer = new LogViewer(logPath);
      
      try {
        const matches = await viewer.search(keyword);
        if (matches.length > 0) {
          results.push({
            workflowId: logFile.replace('.log', ''),
            logFile: logPath,
            matches: matches.length,
            logs: matches
          });
        }
      } catch (error) {
        // 跳过错误的文件
      }
    }

    return results;
  }
}

// 导出
module.exports = {
  LogViewer,
  LogDirectoryViewer
};
