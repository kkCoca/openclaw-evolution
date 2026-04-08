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
const ReviewDesignAgent = require('../review-agents/review-design');
const ReviewCodeAgent = require('../review-agents/review-code');
const ReviewRoadmapAgentV1 = require('../review-agents/review-roadmap-v1');
const ReviewWorkflow = require('./review-workflow');

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
      // detailing 使用最小规则检查（硬编码）
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
      // - coding: 走现有 workflow.execute()（人工确认）
      
      if (stageName === 'roadmapping' || stageName === 'detailing') {
        // 自动审阅模式（roadmapping/detailing）
        console.log('[Review-Orchestrator] 步骤 1/1: 执行自动审阅...');
        const decision = await this.executeAutoReview(stageName, input, projectPath);
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
  async executeAutoReview(stageName, input, projectPath) {
    if (stageName === 'roadmapping') {
      // Roadmapping: 使用 ReviewRoadmapAgentV1
      const agent = this.agents.roadmapping;
      
      // 从文件系统读取 ROADMAP.md（P0 修复：避免审阅空文本）
      const roadmapPath = path.join(projectPath, '02_roadmapping/ROADMAP.md');
      if (!fs.existsSync(roadmapPath)) {
        return {
          decision: 'clarify',
          notes: 'ROADMAP.md 文件不存在',
          fixItems: []
        };
      }
      
      const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');
      
      // 空内容判空（v3.5.0 修复）
      if (!roadmapContent || roadmapContent.trim().length === 0) {
        return {
          decision: 'clarify',
          notes: 'ROADMAP.md 文件存在但内容为空',
          fixItems: []
        };
      }
      
      input.roadmapContent = roadmapContent;
      
      // 执行审阅
      const report = await agent.executeReview(input);
      
      // 转换审阅报告为 decision
      if (report.error) {
        return {
          decision: 'clarify',
          notes: `审阅执行错误：${report.error}`,
          fixItems: []
        };
      }
      
      if (report.overall.recommendation === 'pass') {
        return {
          decision: 'pass',
          notes: '所有检查通过',
          fixItems: []
        };
      } else {
        // reject/conditional → 返回 reject 触发自动返工
        const blockingIssues = [];
        
        if (!report.gates.traceability?.passed) {
          blockingIssues.push({
            id: 'TRACEABILITY_FAILED',
            message: report.gates.traceability.reason,
            regenerateHint: report.gates.traceability.suggestion
          });
        }
        
        if (!report.gates.structure?.passed) {
          blockingIssues.push({
            id: 'STRUCTURE_FAILED',
            message: report.gates.structure.reason,
            regenerateHint: report.gates.structure.suggestion
          });
        }
        
        if (!report.qualityChecks.scope?.passed) {
          blockingIssues.push({
            id: 'SCOPE_FAILED',
            message: report.qualityChecks.scope.issues?.[0],
            regenerateHint: report.qualityChecks.scope.suggestions?.[0]
          });
        }
        
        return {
          decision: 'reject',
          notes: `自动审阅失败：${blockingIssues.length} 个 blocking issue`,
          fixItems: blockingIssues.map(issue => ({
            id: issue.id,
            description: issue.message,
            suggestion: issue.regenerateHint
          }))
        };
      }
      
    } else if (stageName === 'detailing') {
      // Detailing: 最小规则检查
      const detailPath = path.join(projectPath, '03_detailing/DETAIL.md');
      
      if (!fs.existsSync(detailPath)) {
        return {
          decision: 'reject',
          notes: 'DETAIL.md 文件不存在',
          fixItems: [{
            id: 'FILE_MISSING',
            description: 'DETAIL.md 文件不存在',
            suggestion: '请生成 DETAIL.md 文件'
          }]
        };
      }
      
      const detailContent = fs.readFileSync(detailPath, 'utf8');
      
      // 空内容判空
      if (!detailContent || detailContent.trim().length === 0) {
        return {
          decision: 'reject',
          notes: 'DETAIL.md 文件存在但内容为空',
          fixItems: [{
            id: 'FILE_EMPTY',
            description: 'DETAIL.md 文件存在但内容为空',
            suggestion: '请生成 DETAIL.md 内容'
          }]
        };
      }
      
      // 最小规则检查：关键章节关键词
      const requiredKeywords = [
        { id: 'interface', keywords: ['接口', 'API'], name: '接口设计' },
        { id: 'data', keywords: ['数据结构', 'Schema', '数据模型'], name: '数据结构' },
        { id: 'test', keywords: ['测试', 'Test'], name: '测试方案' },
        { id: 'error', keywords: ['异常', 'Error', '错误处理'], name: '异常处理' }
      ];
      
      const missingKeywords = [];
      for (const req of requiredKeywords) {
        const hasKeyword = req.keywords.some(kw => detailContent.includes(kw));
        if (!hasKeyword) {
          missingKeywords.push(req.name);
        }
      }
      
      if (missingKeywords.length > 0) {
        return {
          decision: 'reject',
          notes: `DETAIL.md 缺少关键章节：${missingKeywords.join(', ')}`,
          fixItems: [{
            id: 'MISSING_SECTIONS',
            description: `缺少关键章节：${missingKeywords.join(', ')}`,
            suggestion: `请在 DETAIL.md 中添加 ${missingKeywords.join(', ')} 相关章节`
          }]
        };
      }
      
      // 所有检查通过
      return {
        decision: 'pass',
        notes: '所有检查通过',
        fixItems: []
      };
    }
    
    // 未知阶段
    return {
      decision: 'clarify',
      notes: `未知的自动审阅阶段：${stageName}`,
      fixItems: []
    };
  }

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
