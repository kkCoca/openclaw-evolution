/**
 * 执行 Roadmap 阶段审阅（v1.0）
 * @param {object} input - 阶段输入
 * @returns {Promise<object>} 审阅报告
 */
async function executeRoadmapReviewV1(input, config, stateManager) {
  try {
    const ReviewRoadmapAgentV1 = require('./review-agents/review-roadmap-v1');
    const agent = new ReviewRoadmapAgentV1(config);
    const report = await agent.executeReview(input);
    
    console.log('[Orchestrator] ReviewRoadmapAgent v1.0 审阅完成');
    console.log(`[Orchestrator] Traceability Gate: ${report.gates.traceability?.passed ? '✅' : '❌'}`);
    console.log(`[Orchestrator] Structure Gate: ${report.gates.structure?.passed ? '✅' : '❌'}`);
    console.log(`[Orchestrator] Scope Check: ${report.qualityChecks.scope?.passed ? '✅' : '❌'}`);
    console.log(`[Orchestrator] 综合评分：${report.overall.score}/100`);
    console.log(`[Orchestrator] 审阅结论：${report.overall.recommendation}`);
    
    // 保存审阅报告
    if (stateManager) {
      stateManager.setReviewReport('roadmapping', report);
    }
    
    return report;
    
  } catch (error) {
    console.error('[Orchestrator] ReviewRoadmapAgent v1.0 执行失败:', error.message);
    return {
      error: error.message,
      overall: { passed: false, score: 0, recommendation: 'error' }
    };
  }
}

/**
 * 将 v1.0 审阅报告转换为审阅结论
 * @param {object} reviewResult - v1.0 审阅报告
 * @returns {string} ReviewDecision 枚举值
 */
function convertV1ReviewToDecision(reviewResult) {
  const ReviewDecision = {
    PASS: 'pass',
    CONDITIONAL: 'conditional',
    REJECT: 'reject',
    CLARIFY: 'clarify',
    TERMINATE: 'terminate'
  };
  
  if (reviewResult.error) {
    return ReviewDecision.CLARIFY;
  }
  
  // 根据审阅结论转换
  switch (reviewResult.overall.recommendation) {
    case 'pass':
      return ReviewDecision.PASS;
    case 'conditional':
      return ReviewDecision.CONDITIONAL;
    case 'reject':
      return ReviewDecision.REJECT;
    default:
      return ReviewDecision.CLARIFY;
  }
}

module.exports = { executeRoadmapReviewV1, convertV1ReviewToDecision };
