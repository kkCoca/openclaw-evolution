/**
 * Review Orchestrator (审阅编排器)
 * 
 * ClawDevFlow (CDF) 审阅系统统一调用入口
 * 协调各个 Review Agent 和审阅工作流
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const ReviewDesignAgent = require('../review-agents/review-design-v2');
const ReviewCodeAgent = require('../review-agents/review-code');
const ReviewRoadmapAgentV1 = require('../review-agents/review-roadmap-v1');
const ReviewWorkflow = require('./review-workflow');
const { autoReview, autoReviewers } = require('./auto-review/index');

/**
 * 审阅编排器
 */
class ReviewOrchestrator {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.agents = {
      designing: new ReviewDesignAgent(config),
      coding: new ReviewCodeAgent(config),
      roadmapping: new ReviewRoadmapAgentV1(config)
      // detailing 使用 auto-review/detailing.js 最小规则检查
    };
    this.workflow = new ReviewWorkflow(config);
    
    console.log('[Review-Orchestrator] 审阅编排器初始化完成');
    console.log('[Review-Orchestrator] 已注册 Agent:');
    Object.keys(this.agents).forEach(stage => {
      console.log(`  - ${stage}: ${this.agents[stage].constructor.name}`);
    });
  }

  /**
   * 执行阶段审阅
   * 
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段产出输入
   * @param {object} outputs - 阶段产出列表
   * @param {string} projectPath - 项目路径
   * @returns {Promise<ReviewDecision>} 审阅结论
   * 
   * @example
   * ```javascript
   * const orchestrator = new ReviewOrchestrator(config);
   * const decision = await orchestrator.review('designing', input, outputs, projectPath);
   * console.log(decision); // { decision: 'pass', notes: '...', fixItems: [] }
   * ```
   */
  async review(stageName, input, outputs, projectPath) {
    console.log('');
    console.log('[Review-Orchestrator] ════════════════════════════════════');
    console.log('[Review-Orchestrator] 开始阶段审阅');
    console.log(`[Review-Orchestrator]   阶段：${stageName}`);
    console.log(`[Review-Orchestrator]   项目：${projectPath}`);
    console.log('[Review-Orchestrator] ════════════════════════════════════');
    console.log('');

    try {
      // 审阅模式分流：
      // - designing: 走现有 workflow.execute()（人工确认）
      // - roadmapping: 走自动审阅（ReviewRoadmapAgentV1）并直接返回
      // - detailing: 走自动审阅（最小规则）并直接返回
      // - coding: 走自动审阅（真执行命令）
      // - testing: 走自动审阅（检查证据包）
      // - reviewing: 走自动审阅（Release Readiness Gate）
      // - releasing: 走自动审阅（检查 readiness + 产出证据）
      
      if (autoReviewers[stageName]) {
        // 自动审阅模式（基于 autoReviewers 动态判断）
        console.log('[Review-Orchestrator] 步骤 1/1: 执行自动审阅...');
        const decision = await autoReview({
          stageName,
          input,
          projectPath,
          agents: this.agents
        });
        console.log('[Review-Orchestrator] ✅ 自动审阅完成');
        console.log('');
        return decision;
      } else {
        // 人工确认模式（designing/coding）
        const agent = this.agents[stageName];
        
        if (!agent) {
          throw new Error(`未知的审阅阶段：${stageName}`);
        }

        // 2. 执行自动检查
        console.log('[Review-Orchestrator] 步骤 1/2: 执行自动检查...');
        const autoResults = await agent.execute(input);
        console.log('[Review-Orchestrator] ✅ 自动检查完成');
        console.log('');

        // 3. 执行审阅工作流
        console.log('[Review-Orchestrator] 步骤 2/2: 执行审阅工作流...');
        const decision = await this.workflow.execute(
          stageName,
          autoResults,
          outputs,
          projectPath
        );
        console.log('[Review-Orchestrator] ✅ 审阅工作流完成');
        console.log('');

        // 4. 返回审阅结论
        return decision;
      }

    } catch (error) {
      console.error('[Review-Orchestrator] ❌ 审阅失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行自动审阅（roadmapping/detailing）
   * @param {string} stageName - 阶段名称
   * @param {object} input - 输入数据
   * @param {string} projectPath - 项目路径
   * @returns {Promise<ReviewDecision>} 审阅结论
   */
  /**
   * 获取可用的审阅阶段
   * @returns {string[]} 阶段列表
   */
  getAvailableStages() {
    return Object.keys(this.agents);
  }

  /**
   * 注册新的 Review Agent
   * @param {string} stageName - 阶段名称
   * @param {ReviewAgentBase} agent - Review Agent 实例
   */
  registerAgent(stageName, agent) {
    this.agents[stageName] = agent;
    console.log(`[Review-Orchestrator] 已注册 Agent: ${stageName}`);
  }
}

module.exports = ReviewOrchestrator;
