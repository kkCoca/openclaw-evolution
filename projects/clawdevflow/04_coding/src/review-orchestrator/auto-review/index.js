/**
 * ReviewOrchestrator 自动审阅路由层
 * 
 * ClawDevFlow (CDF) 审阅编排器
 * 负责将审阅请求路由到各阶段 auto-review 模块
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');

// 引入 auto-review 模块（7 个阶段）
const autoReviewers = {
  roadmapping: require('./auto-review/roadmapping'),
  detailing: require('./auto-review/detailing'),
  coding: require('./auto-review/coding'),
  testing: require('./auto-review/testing'),
  reviewing: require('./auto-review/reviewing'),
  precommit: require('./auto-review/precommit'),
  releasing: require('./auto-review/releasing')
};

// 引入审阅代理（roadmapping 需要）
const ReviewRoadmapAgentV1 = require('../review-agents/review-roadmap-v1');
const ReviewDesignAgent = require('../review-agents/review-design');
const ReviewCodeAgent = require('../review-agents/review-code');

/**
 * 自动审阅路由函数
 * 
 * @param {string} stageName - 阶段名称
 * @param {object} input - 阶段输入
 * @param {string} projectPath - 项目路径
 * @param {object} config - 配置对象
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function executeAutoReview(stageName, input, projectPath, config = {}) {
  const ctx = {
    stageName,
    input,
    projectPath,
    config,
    agents: {
      roadmapping: new ReviewRoadmapAgentV1(config),
      designing: new ReviewDesignAgent(config),
      coding: new ReviewCodeAgent(config)
    }
  };
  
  const reviewer = autoReviewers[stageName];
  if (!reviewer) {
    throw new Error(`未知阶段的自动审阅：${stageName}`);
  }
  
  return await reviewer(ctx);
}

module.exports = {
  executeAutoReview
};
