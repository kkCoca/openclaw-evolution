/**
 * Review Workflow (审阅工作流编排器)
 * 
 * ClawDevFlow (CDF) 审阅系统核心编排器
 * 负责协调审阅流程：生成请求→等待审阅→解析结论→处理决策
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const ReviewRequestGenerator = require('../review-generators/review-request-generator');
const ReviewDecisionParser = require('./review-decision-parser');

/**
 * 审阅工作流编排器
 */
class ReviewWorkflow {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.generator = new ReviewRequestGenerator(config);
    this.parser = new ReviewDecisionParser();
    this.pollInterval = this.config.pollInterval || 5000; // 5 秒
    this.timeout = this.config.timeout || 86400000; // 24 小时
    
    console.log('[Review-Workflow] 审阅工作流编排器初始化完成');
    console.log(`[Review-Workflow]   轮询间隔：${this.pollInterval}ms`);
    console.log(`[Review-Workflow]   超时时间：${this.timeout / 1000 / 3600}小时`);
  }

  /**
   * 执行审阅流程
   * 
   * @param {string} stageName - 阶段名称
   * @param {ReviewReport} autoResults - 自动检查结果
   * @param {object} outputs - 阶段产出列表
   * @param {string} projectPath - 项目路径
   * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
   * 
   * @example
   * ```javascript
   * const workflow = new ReviewWorkflow(config);
   * const result = await workflow.execute('designing', report, outputs, projectPath);
   * console.log(result.decision); // 'pass' | 'conditional' | 'reject' | 'clarify'
   * ```
   */
  async execute(stageName, autoResults, outputs, projectPath) {
    console.log('');
    console.log('[Review-Workflow] ════════════════════════════════════════');
    console.log('[Review-Workflow] 开始审阅流程');
    console.log(`[Review-Workflow]   阶段：${stageName}`);
    console.log(`[Review-Workflow]   项目：${projectPath}`);
    console.log('[Review-Workflow] ════════════════════════════════════════');
    console.log('');

    try {
      // 1. 生成审阅请求
      console.log('[Review-Workflow] 步骤 1/4: 生成审阅请求...');
      const requestPath = this.generator.generateAndSave(
        stageName,
        autoResults,
        outputs,
        projectPath
      );
      console.log(`[Review-Workflow] ✅ 审阅请求已生成：${requestPath}`);
      console.log('');

      // 2. 通知 openclaw-ouyp
      console.log('[Review-Workflow] 步骤 2/4: 通知审阅人...');
      await this.notifyReviewer(stageName, requestPath, autoResults);
      console.log('[Review-Workflow] ✅ 已通知审阅人');
      console.log('');

      // 3. 等待审阅完成
      console.log('[Review-Workflow] 步骤 3/4: 等待审阅完成...');
      console.log(`[Review-Workflow]   轮询间隔：${this.pollInterval}ms`);
      console.log(`[Review-Workflow]   超时时间：${this.timeout / 1000 / 3600}小时`);
      const reviewResult = await this.waitForReview(requestPath);
      console.log('[Review-Workflow] ✅ 审阅完成');
      console.log('');

      // 4. 处理审阅结论
      console.log('[Review-Workflow] 步骤 4/4: 处理审阅结论...');
      const decision = await this.handleDecision(stageName, reviewResult);
      console.log('[Review-Workflow] ✅ 审阅结论已处理');
      console.log('');

      // 5. 返回结果
      console.log('[Review-Workflow] ════════════════════════════════════════');
      console.log('[Review-Workflow] 审阅流程完成');
      console.log(`[Review-Workflow]   结论：${decision.decision}`);
      console.log(`[Review-Workflow]   待修复项：${decision.fixItems.length} 项`);
      console.log('[Review-Workflow] ════════════════════════════════════════');

      return decision;

    } catch (error) {
      console.error('[Review-Workflow] ❌ 审阅流程失败:', error.message);
      throw error;
    }
  }

  /**
   * 通知审阅人
   * @param {string} stageName - 阶段名称
   * @param {string} requestPath - 审阅请求文件路径
   * @param {ReviewReport} autoResults - 自动检查结果
   * @private
   */
  async notifyReviewer(stageName, requestPath, autoResults) {
    const status = autoResults.summary.failed === 0 ?
      (autoResults.summary.warnings > 0 ? '⚠️ 通过（有警告）' : '✅ 通过') :
      '❌ 未通过';

    const message = `
📋 审阅请求：${this.formatStageName(stageName)}

阶段产出：
${autoResults.summary.total} 个检查点：${autoResults.summary.passed} 通过 ✅ | ${autoResults.summary.failed} 失败 ❌ | ${autoResults.summary.warnings} 警告 ⚠️

自动检查状态：${status}
质量评分：${autoResults.summary.score}/100 (${autoResults.summary.qualityLevel})

请查阅并填写审阅结论：
${requestPath}

或直接回复审阅结论：
1. ✅ 通过 (pass)
2. ⚠️ 条件通过 (conditional)
3. ❌ 驳回 (reject)
4. ❓ 需澄清 (clarify)
`.trim();

    console.log('[Review-Workflow] 审阅通知:');
    console.log(message);
    
    // TODO: 通过 OpenClaw sessions_send 发送消息
    // await sessions_send({ message });
  }

  /**
   * 等待审阅完成
   * @param {string} requestPath - 审阅请求文件路径
   * @returns {Promise<{decision: string, notes: string, fixItems: Array, score: object}>}
   * @private
   */
  async waitForReview(requestPath) {
    const startTime = Date.now();
    const initialMtime = fs.statSync(requestPath).mtimeMs;

    console.log('[Review-Workflow] 开始轮询审阅文件...');

    while (true) {
      // 检查超时
      const elapsed = Date.now() - startTime;
      if (elapsed > this.timeout) {
        throw new Error(`审阅超时（${Math.round(elapsed / 1000 / 3600 * 10) / 10}小时）`);
      }

      // 等待轮询间隔
      await this.sleep(this.pollInterval);

      // 检查文件是否更新
      try {
        const stats = fs.statSync(requestPath);
        if (stats.mtimeMs > initialMtime) {
          console.log('[Review-Workflow] ✅ 检测到审阅文件已更新');
          
          // 读取并解析审阅结论
          const result = await this.parser.parseFile(requestPath);
          
          // 验证审阅文件
          if (!result.valid) {
            console.log('[Review-Workflow] ⚠️ 审阅文件填写不完整:');
            result.errors.forEach(err => console.log(`  - ${err}`));
            console.log('[Review-Workflow] 继续等待修正...');
            continue;
          }
          
          // 验证审阅结论是否有效
          if (!this.parser.isValidDecision(result.decision)) {
            console.log('[Review-Workflow] ⚠️ 审阅结论无效:', result.decision);
            console.log('[Review-Workflow] 继续等待修正...');
            continue;
          }

          return result;
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('[Review-Workflow] ❌ 审阅文件不存在:', requestPath);
          throw error;
        }
        // 其他错误继续轮询
      }
    }
  }

  /**
   * 处理审阅结论
   * @param {string} stageName - 阶段名称
   * @param {object} reviewResult - 审阅结果
   * @returns {Promise<{decision: string, notes: string, fixItems: Array, nextAction: string}>}
   * @private
   */
  async handleDecision(stageName, reviewResult) {
    const { decision, notes, fixItems, score } = reviewResult;

    console.log('[Review-Workflow] 处理审阅结论:');
    console.log(`  结论：${decision}`);
    console.log(`  意见：${notes ? notes.substring(0, 50) + '...' : '无'}`);
    console.log(`  待修复项：${fixItems.length} 项`);
    console.log(`  评分：${score ? score.overall + '/100' : '无'}`);

    // 根据结论确定下一步动作
    let nextAction;
    switch (decision) {
      case 'pass':
        nextAction = 'continue';
        console.log('[Review-Workflow] ✅ 审阅通过，进入下一阶段');
        break;

      case 'conditional':
        nextAction = 'continue_with_fixes';
        console.log('[Review-Workflow] ⚠️ 条件通过，进入下一阶段但需修复');
        break;

      case 'reject':
        nextAction = 'retry';
        console.log('[Review-Workflow] ❌ 审阅驳回，重新执行当前阶段');
        break;

      case 'clarify':
        nextAction = 'wait';
        console.log('[Review-Workflow] ❓ 需澄清，等待补充信息');
        break;

      default:
        nextAction = 'unknown';
        console.log('[Review-Workflow] ⚠️ 未知审阅结论:', decision);
    }

    return {
      decision,
      notes,
      fixItems,
      score,
      nextAction,
      stage: stageName,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 格式化阶段名称
   * @param {string} stageName - 阶段名称
   * @returns {string} 格式化后的名称
   * @private
   */
  formatStageName(stageName) {
    const names = {
      'designing': 'Design（设计）',
      'roadmapping': 'Roadmap（路线图）',
      'detailing': 'Detail（详细设计）',
      'coding': 'Code（代码）',
      'testing': 'Test（测试）',
      'reviewing': 'Review（验收）',
      'releasing': 'Release（发布）'
    };
    return names[stageName] || stageName;
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ReviewWorkflow;
