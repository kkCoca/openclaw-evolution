/**
 * 审阅提醒服务 (Remind Service)
 * 
 * 监控审阅超时，发送提醒通知
 * 支持多种通知方式（控制台/邮件/Webhook）
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const fs = require('fs');
const path = require('path');
const { StateManager, StageStatus } = require('./state-manager');

// 通知类型
const NotificationType = {
  CONSOLE: 'console',
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  CUSTOM: 'custom'
};

/**
 * 提醒服务类
 */
class RemindService {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config;
    this.timeoutHours = config.review?.timeoutHours || 24;
    this.maxReminds = config.review?.maxReminds || 3;
    this.notifications = config.review?.notifications || [];
    this.activeTimers = new Map();
  }

  /**
   * 启动审阅超时监控
   * @param {string} workflowId - 流程 ID
   * @param {string} stateFile - 状态文件路径
   */
  startMonitoring(workflowId, stateFile) {
    const stateManager = new StateManager(stateFile);
    
    // 定期检查
    const checkInterval = setInterval(async () => {
      await this.checkTimeout(workflowId, stateManager);
    }, 60 * 60 * 1000); // 每小时检查一次

    this.activeTimers.set(workflowId, {
      interval: checkInterval,
      startedAt: Date.now()
    });

    console.log(`[RemindService] 启动监控：${workflowId}`);
  }

  /**
   * 停止审阅超时监控
   * @param {string} workflowId - 流程 ID
   */
  stopMonitoring(workflowId) {
    const timer = this.activeTimers.get(workflowId);
    if (timer) {
      clearInterval(timer.interval);
      this.activeTimers.delete(workflowId);
      console.log(`[RemindService] 停止监控：${workflowId}`);
    }
  }

  /**
   * 检查审阅超时
   * @param {string} workflowId - 流程 ID
   * @param {StateManager} stateManager - 状态管理器
   */
  async checkTimeout(workflowId, stateManager) {
    const state = stateManager.load();
    if (!state) return;

    // 检查是否有待审阅的阶段
    const reviewingStage = Object.entries(state.stages)
      .find(([_, stage]) => stage.status === StageStatus.REVIEWING);

    if (!reviewingStage) return;

    const [stageName, stage] = reviewingStage;
    const reviewedAt = stage.reviewedAt ? new Date(stage.reviewedAt) : null;
    
    // 如果没有审阅时间，使用阶段开始时间
    const checkTime = reviewedAt || new Date(stage.startedAt);
    const now = new Date();
    const hoursElapsed = (now - checkTime) / (1000 * 60 * 60);

    // 检查是否超时
    if (hoursElapsed >= this.timeoutHours) {
      const remindCount = stage.remindCount || 0;

      if (remindCount < this.maxReminds) {
        await this.sendTimeoutReminder({
          workflowId,
          stageName,
          hoursElapsed,
          remindCount: remindCount + 1,
          task: state.task
        });

        // 更新提醒计数
        stage.remindCount = remindCount + 1;
        stage.lastRemindAt = now.toISOString();
        stateManager.save();
      } else {
        // 超过最大提醒次数，暂停流程
        await this.sendFinalReminder({
          workflowId,
          stageName,
          hoursElapsed,
          task: state.task
        });
      }
    }
  }

  /**
   * 发送超时提醒
   * @param {object} context - 上下文信息
   */
  async sendTimeoutReminder(context) {
    const message = this.buildTimeoutMessage(context);
    await this.sendNotifications(message, 'timeout_reminder');
  }

  /**
   * 发送最终提醒（超过最大次数）
   * @param {object} context - 上下文信息
   */
  async sendFinalReminder(context) {
    const message = this.buildFinalReminderMessage(context);
    await this.sendNotifications(message, 'final_reminder');
  }

  /**
   * 构建超时提醒消息
   * @param {object} context - 上下文信息
   * @returns {string} 消息内容
   */
  buildTimeoutMessage(context) {
    const { workflowId, stageName, hoursElapsed, remindCount, task } = context;
    
    return `
⏰ 流程审阅超时提醒

流程 ID: ${workflowId}
任务：${task}
当前阶段：${stageName}
超时时长：${Math.round(hoursElapsed)} 小时
提醒次数：${remindCount}/${this.maxReminds}

请及时审阅，避免流程暂停。

审阅指令：
- ✅ 通过
- ⚠️ 条件通过
- ❌ 驳回
- ❓ 需澄清
`.trim();
  }

  /**
   * 构建最终提醒消息
   * @param {object} context - 上下文信息
   * @returns {string} 消息内容
   */
  buildFinalReminderMessage(context) {
    const { workflowId, stageName, hoursElapsed, task } = context;
    
    return `
⚠️ 流程审阅超时 - 最终提醒

流程 ID: ${workflowId}
任务：${task}
当前阶段：${stageName}
超时时长：${Math.round(hoursElapsed)} 小时

已达到最大提醒次数，流程将暂停。
如需继续，请重新启动流程。
`.trim();
  }

  /**
   * 发送通知
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  async sendNotifications(message, type) {
    for (const config of this.notifications) {
      try {
        await this.sendNotification(config, message, type);
      } catch (error) {
        console.error(`发送通知失败 (${config.type}):`, error.message);
      }
    }
  }

  /**
   * 发送单个通知
   * @param {object} config - 通知配置
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  async sendNotification(config, message, type) {
    switch (config.type) {
      case NotificationType.CONSOLE:
        this.sendConsole(message);
        break;

      case NotificationType.EMAIL:
        await this.sendEmail(config, message);
        break;

      case NotificationType.WEBHOOK:
        await this.sendWebhook(config, message, type);
        break;

      case NotificationType.CUSTOM:
        await this.sendCustom(config, message, type);
        break;
    }
  }

  /**
   * 控制台通知
   * @param {string} message - 消息内容
   */
  sendConsole(message) {
    console.log('\n' + '='.repeat(50));
    console.log(message);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * 邮件通知
   * @param {object} config - 邮件配置
   * @param {string} message - 消息内容
   */
  async sendEmail(config, message) {
    // 简单实现：输出到日志
    // 实际使用时可集成 nodemailer 等邮件库
    console.log(`[Email] 发送到：${config.to}`);
    console.log(`[Email] 主题：${config.subject || '流程引擎审阅提醒'}`);
    console.log(`[Email] 内容：${message}`);
  }

  /**
   * Webhook 通知
   * @param {object} config - Webhook 配置
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  async sendWebhook(config, message, type) {
    const { url, method = 'POST', headers = {} } = config;

    // 简单实现：使用 curl
    // 实际使用时可使用 axios 等 HTTP 库
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const payload = JSON.stringify({
      type,
      message,
      timestamp: new Date().toISOString()
    });

    try {
      await execAsync(`curl -X ${method} ${url} -H "Content-Type: application/json" -d '${payload}'`);
      console.log(`[Webhook] 发送成功：${url}`);
    } catch (error) {
      console.error(`[Webhook] 发送失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 自定义通知
   * @param {object} config - 自定义配置
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  async sendCustom(config, message, type) {
    const { command } = config;

    if (!command) {
      throw new Error('自定义通知未配置 command');
    }

    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // 替换占位符
    const fullCommand = command
      .replace('{message}', message.replace(/"/g, '\\"'))
      .replace('{type}', type)
      .replace('{timestamp}', new Date().toISOString());

    try {
      await execAsync(fullCommand);
      console.log(`[Custom] 发送成功：${command}`);
    } catch (error) {
      console.error(`[Custom] 发送失败：${error.message}`);
      throw error;
    }
  }

  /**
   * 手动发送提醒（用户主动触发）
   * @param {string} workflowId - 流程 ID
   * @param {string} stateFile - 状态文件路径
   */
  async sendManualReminder(workflowId, stateFile) {
    const stateManager = new StateManager(stateFile);
    const state = stateManager.load();

    if (!state) {
      throw new Error(`流程不存在：${workflowId}`);
    }

    const reviewingStage = Object.entries(state.stages)
      .find(([_, stage]) => stage.status === StageStatus.REVIEWING);

    if (!reviewingStage) {
      throw new Error('当前没有待审阅的阶段');
    }

    const [stageName, stage] = reviewingStage;
    const hoursElapsed = stage.reviewedAt 
      ? (Date.now() - new Date(stage.reviewedAt)) / (1000 * 60 * 60)
      : 0;

    await this.sendTimeoutReminder({
      workflowId,
      stageName,
      hoursElapsed: Math.round(hoursElapsed),
      remindCount: (stage.remindCount || 0) + 1,
      task: state.task
    });
  }

  /**
   * 获取提醒历史
   * @param {string} stateFile - 状态文件路径
   * @returns {Array<object>} 提醒历史
   */
  getRemindHistory(stateFile) {
    const stateManager = new StateManager(stateFile);
    const state = stateManager.load();

    if (!state) return [];

    const history = [];

    for (const [stageName, stage] of Object.entries(state.stages)) {
      if (stage.remindCount > 0 || stage.lastRemindAt) {
        history.push({
          stage: stageName,
          remindCount: stage.remindCount || 0,
          lastRemindAt: stage.lastRemindAt,
          status: stage.status
        });
      }
    }

    return history;
  }
}

/**
 * 创建提醒服务（便捷函数）
 * @param {object} config - 配置对象
 * @returns {RemindService} 提醒服务实例
 */
function createRemindService(config) {
  return new RemindService(config);
}

// 导出
module.exports = {
  RemindService,
  NotificationType,
  createRemindService
};
