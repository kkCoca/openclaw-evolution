/**
 * Review Roadmap Agent V1 (roadmapping 阶段审阅 Agent)
 * 
 * ClawDevFlow (CDF) 审阅系统 - Roadmapping 阶段专用
 * 负责审阅 ROADMAP.md 的质量
 * 
 * 审阅检查（最小三门）：
 * 1. Traceability - REQ 全覆盖（REQ→Roadmap item）
 * 2. Structure - 里程碑/DoD/依赖/风险必备
 * 3. Scope - 禁止引入 PRD 未定义的新需求
 * 
 * @version 1.0.0
 * @author openclaw-ouyp
 */

const ReviewAgentBase = require('../review-framework/review-agent-base');

/**
 * Roadmap 阶段审阅 Agent V1
 */
class ReviewRoadmapAgentV1 extends ReviewAgentBase {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    super('roadmapping', config);
  }

  /**
   * 加载检查点
   * @returns {Checkpoint[]} 检查点列表
   */
  loadCheckpoints() {
    return [
      {
        id: 'R1',
        name: '需求可追溯性',
        type: 'auto',
        rule: 'ROADMAP 必须覆盖 REQUIREMENTS 的所有需求（REQ→Roadmap item）',
        weight: 0.4,
        critical: true,
        order: 1,
        description: '评估需求覆盖率和可追溯性'
      },
      {
        id: 'R2',
        name: '结构完整性',
        type: 'auto',
        rule: 'ROADMAP 必须包含里程碑/DoD/依赖/风险章节',
        weight: 0.3,
        critical: true,
        order: 2,
        description: '评估 ROADMAP 结构完整性'
      },
      {
        id: 'R3',
        name: '范围控制',
        type: 'ai',
        rule: '禁止引入 PRD 未定义的新需求',
        weight: 0.3,
        critical: true,
        order: 3,
        description: '评估范围是否超出 PRD 定义'
      }
    ];
  }

  /**
   * 执行完整审阅流程
   * @param {object} input - 输入数据
   * @returns {Promise<ReviewReport>} 审阅报告
   */
  async executeReview(input) {
    console.log('[Review-Roadmap V1] 开始执行审阅流程');
    
    const report = {
      timestamp: new Date().toISOString(),
      stage: 'roadmapping',
      version: '1.0.0',
      gates: {},
      qualityChecks: {},
      overall: {
        passed: false,
        score: 0,
        recommendation: 'pending'
      }
    };
    
    // 1. Traceability 检查
    console.log('\n[Review-Roadmap V1] 执行 Traceability 检查...');
    const traceabilityResult = await this.checkTraceability(input);
    report.gates.traceability = traceabilityResult;
    
    // 2. Structure 检查
    console.log('\n[Review-Roadmap V1] 执行 Structure 检查...');
    const structureResult = await this.checkStructure(input);
    report.gates.structure = structureResult;
    
    // 3. Scope 检查
    console.log('\n[Review-Roadmap V1] 执行 Scope 检查...');
    const scopeResult = await this.checkScope(input);
    report.qualityChecks.scope = scopeResult;
    
    // 4. 计算综合评分
    report.overall = this.calculateOverallScore(report);
    
    console.log('\n[Review-Roadmap V1] 审阅完成');
    console.log(`[Review-Roadmap V1] 综合评分：${report.overall.score}/100`);
    console.log(`[Review-Roadmap V1] 审阅结论：${report.overall.recommendation}`);
    
    return report;
  }

  /**
   * Traceability 检查 - REQ 全覆盖
   * @param {object} input - 输入数据
   * @returns {Promise<GateResult>} 门禁结果
   */
  async checkTraceability(input) {
    const requirementsContent = input.requirementsContent || '';
    const roadmapContent = input.roadmapContent || '';
    
    // 提取 REQUIREMENTS 中的所有 REQ ID
    const reqIds = [];
    const reqPattern = /### (REQ-\d+):/g;
    let match;
    while ((match = reqPattern.exec(requirementsContent)) !== null) {
      reqIds.push(match[1]);
    }
    
    console.log(`[Traceability] 提取到 ${reqIds.length} 条需求`);
    
    if (reqIds.length === 0) {
      return {
        passed: false,
        critical: true,
        gate: 'traceability',
        reason: 'REQUIREMENTS 中没有找到需求',
        suggestion: '请检查 REQUIREMENTS.md 格式是否正确（### REQ-xxx: 需求描述）'
      };
    }
    
    // 检查每个 REQ 是否在 ROADMAP 中有对应 item
    const uncoveredReqs = [];
    for (const reqId of reqIds) {
      if (!roadmapContent.includes(reqId)) {
        uncoveredReqs.push(reqId);
      }
    }
    
    if (uncoveredReqs.length > 0) {
      return {
        passed: false,
        critical: true,
        gate: 'traceability',
        reason: `${uncoveredReqs.length} 条需求未在 ROADMAP 中覆盖`,
        uncoveredReqs,
        suggestion: `请在 ROADMAP.md 中为以下需求添加对应 item：${uncoveredReqs.join(', ')}`
      };
    }
    
    console.log(`[Traceability] ✅ 需求覆盖率 100% (${reqIds.length}/${reqIds.length})`);
    
    return {
      passed: true,
      critical: false,
      gate: 'traceability',
      coverage: '100%',
      totalReqs: reqIds.length,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Structure 检查 - 里程碑/DoD/依赖/风险必备
   * @param {object} input - 输入数据
   * @returns {Promise<GateResult>} 门禁结果
   */
  async checkStructure(input) {
    const roadmapContent = input.roadmapContent || '';
    
    const requiredSections = [
      { id: 'milestone', keywords: ['里程碑', 'Milestone', 'Phase', '阶段'] },
      { id: 'dod', keywords: ['DoD', 'Definition of Done', '验收标准', '交付标准'] },
      { id: 'dependencies', keywords: ['依赖', 'Dependencies', '前置条件'] },
      { id: 'risks', keywords: ['风险', 'Risks', '风险点'] }
    ];
    
    const missingSections = [];
    for (const section of requiredSections) {
      const hasSection = section.keywords.some(keyword => 
        roadmapContent.includes(keyword)
      );
      
      if (!hasSection) {
        missingSections.push(section.id);
      }
    }
    
    if (missingSections.length > 0) {
      return {
        passed: false,
        critical: true,
        gate: 'structure',
        reason: `ROADMAP 缺少必需章节：${missingSections.join(', ')}`,
        missingSections,
        suggestion: `请在 ROADMAP.md 中添加以下章节：${missingSections.join(', ')}`
      };
    }
    
    console.log('[Structure] ✅ ROADMAP 结构完整（里程碑/DoD/依赖/风险）');
    
    return {
      passed: true,
      critical: false,
      gate: 'structure',
      sections: requiredSections.map(s => s.id),
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Scope 检查 - 禁止引入 PRD 未定义的新需求
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkScope(input) {
    const prdContent = input.prdContent || '';
    const roadmapContent = input.roadmapContent || '';
    
    // 简单启发式：检查 ROADMAP 中是否有 PRD 未提及的 REQ ID
    const prdReqIds = new Set();
    const reqPattern = /REQ-\d+/g;
    let match;
    while ((match = reqPattern.exec(prdContent)) !== null) {
      prdReqIds.add(match[0]);
    }
    
    const roadmapReqIds = new Set();
    while ((match = reqPattern.exec(roadmapContent)) !== null) {
      roadmapReqIds.add(match[0]);
    }
    
    const newReqs = [...roadmapReqIds].filter(id => !prdReqIds.has(id));
    
    if (newReqs.length > 0) {
      return {
        checkpoint: 'R3',
        name: '范围控制',
        passed: false,
        score: 0,
        maxScore: 100,
        details: {
          newReqs,
          prdReqCount: prdReqIds.size,
          roadmapReqCount: roadmapReqIds.size
        },
        issues: [`ROADMAP 引入了 PRD 未定义的新需求：${newReqs.join(', ')}`],
        suggestions: ['请移除 ROADMAP 中 PRD 未定义的新需求，或先更新 PRD']
      };
    }
    
    console.log('[Scope] ✅ ROADMAP 范围未超出 PRD 定义');
    
    return {
      checkpoint: 'R3',
      name: '范围控制',
      passed: true,
      score: 100,
      maxScore: 100,
      details: {
        prdReqCount: prdReqIds.size,
        roadmapReqCount: roadmapReqIds.size
      },
      issues: [],
      suggestions: []
    };
  }

  /**
   * 计算综合评分
   * @param {object} report - 审阅报告
   * @returns {object} 综合评分结果
   */
  calculateOverallScore(report) {
    const checkpoints = this.loadCheckpoints();
    
    // Gate 检查（一票否决）
    if (!report.gates.traceability?.passed || !report.gates.structure?.passed) {
      return {
        passed: false,
        score: 0,
        recommendation: 'reject',
        reason: 'Gate 检查失败（Traceability 或 Structure）'
      };
    }
    
    // Scope 检查
    const scopeCheck = report.qualityChecks.scope;
    if (!scopeCheck?.passed) {
      return {
        passed: false,
        score: 0,
        recommendation: 'reject',
        reason: '范围检查失败（引入了 PRD 未定义的新需求）'
      };
    }
    
    // 所有检查通过
    return {
      passed: true,
      score: 100,
      recommendation: 'pass',
      reason: '所有检查通过'
    };
  }
}

module.exports = ReviewRoadmapAgentV1;
