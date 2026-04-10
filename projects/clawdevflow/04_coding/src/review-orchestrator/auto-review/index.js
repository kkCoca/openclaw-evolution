/**
 * Auto-Review 路由索引
 * 
 * ClawDevFlow (CDF) 审阅系统
 * 负责将审阅请求路由到各阶段 auto-review 模块
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

// 引入 auto-review 模块（7 个阶段）
const autoReviewers = {
  roadmapping: require('./roadmapping'),
  detailing: require('./detailing'),
  coding: require('./coding'),
  testing: require('./testing'),
  reviewing: require('./reviewing'),
  precommit: require('./precommit'),
  releasing: require('./releasing')
};

/**
 * 自动审阅路由函数
 * 
 * @param {object} ctx - 上下文对象
 * @param {string} ctx.stageName - 阶段名称
 * @param {object} ctx.input - 阶段输入
 * @param {string} ctx.projectPath - 项目路径
 * @param {object} ctx.agents - 审阅代理
 * @param {object} ctx.config - 配置对象
 * @returns {Promise<{decision: string, notes: string, fixItems: Array}>}
 */
async function autoReview(ctx) {
  const { stageName } = ctx;
  
  const reviewer = autoReviewers[stageName];
  if (!reviewer) {
    throw new Error(`未知阶段的自动审阅：${stageName}`);
  }
  
  return await reviewer.review(ctx);
}

module.exports = {
  autoReview,
  autoReviewers
};
