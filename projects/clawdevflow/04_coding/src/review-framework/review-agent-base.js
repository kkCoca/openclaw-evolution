/**
 * Review Agent 基类 (Review Agent Base Class)
 * 
 * ClawDevFlow (CDF) 审阅系统核心基类
 * 提供统一的检查执行入口和报告格式
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * Review Agent 基类
 * 
 * 使用示例：
 * ```javascript
 * class ReviewDesignAgent extends ReviewAgentBase {
 *   constructor(config) {
 *     super('designing', config);
 *   }
 *   
 *   loadCheckpoints() {
 *     return [{ id: 'D1', name: '需求覆盖率', type: 'auto', rule: '...' }];
 *   }
 *   
 *   async validateCheckpoint(checkpoint, input) {
 *     // 实现具体检查逻辑
 *   }
 * }
 * ```
 */
class ReviewAgentBase {
  /**
   * 构造函数
   * @param {string} stageName - 阶段名称 (designing/roadmapping/coding/testing/release)
   * @param {object} config - 配置对象
   * @throws {Error} 不能直接实例化抽象类
   */
  constructor(stageName, config) {
    if (new.target === ReviewAgentBase) {
      throw new Error('ReviewAgentBase 是抽象类，不能直接实例化');
    }
    
    this.stageName = stageName;
    this.config = config || {};
    this.checkpoints = [];
    this.results = [];
    this.startTime = null;
    this.endTime = null;
    
    console.log(`[Review] ${stageName} Agent 初始化完成`);
  }

  /**
   * 执行检查（统一入口）
   * 
   * @param {object} input - 阶段产出输入
   * @param {string} input.prdFile - PRD.md 文件路径
   * @param {string} input.trdFile - TRD.md 文件路径
   * @param {string} input.requirementsFile - REQUIREMENTS.md 文件路径
   * @param {string} input.codeDir - 代码目录路径
   * @returns {Promise<ReviewReport>} 检查报告
   * 
   * @example
   * ```javascript
   * const agent = new ReviewDesignAgent(config);
   * const report = await agent.execute({
   *   prdFile: 'projects/xxx/01_designing/PRD.md',
   *   trdFile: 'projects/xxx/01_designing/TRD.md',
   *   requirementsFile: 'projects/xxx/REQUIREMENTS.md'
   * });
   * ```
   */
  async execute(input) {
    this.startTime = Date.now();
    console.log(`[Review] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[Review] 开始检查 ${this.stageName.toUpperCase()} 阶段`);
    console.log(`[Review] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    try {
      // 1. 加载检查点
      console.log(`[Review] 步骤 1/3: 加载检查点...`);
      this.checkpoints = this.loadCheckpoints();
      console.log(`[Review] ✅ 已加载 ${this.checkpoints.length} 个检查点`);
      
      // 2. 执行检查
      console.log(`[Review] 步骤 2/3: 执行检查...`);
      this.results = [];
      
      for (const checkpoint of this.checkpoints) {
        console.log(`[Review]   检查 ${checkpoint.id}: ${checkpoint.name}...`);
        const result = await this.runCheckpoint(checkpoint, input);
        this.results.push(result);
        
        const icon = result.status === 'pass' ? '✅' : 
                     result.status === 'warning' ? '⚠️' : 
                     result.status === 'fail' ? '❌' : '⬜';
        console.log(`[Review]   ${icon} ${checkpoint.id}: ${result.status}`);
      }
      
      // 3. 生成报告
      console.log(`[Review] 步骤 3/3: 生成报告...`);
      const report = this.generateReport();
      this.endTime = Date.now();
      report.duration = this.endTime - this.startTime;
      
      // 4. 输出总结
      console.log(`[Review] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[Review] 检查完成:`);
      console.log(`[Review]   总计：${report.summary.total} 项`);
      console.log(`[Review]   通过：${report.summary.passed} 项 ✅`);
      console.log(`[Review]   失败：${report.summary.failed} 项 ❌`);
      console.log(`[Review]   警告：${report.summary.warnings} 项 ⚠️`);
      console.log(`[Review]   耗时：${report.duration}ms`);
      console.log(`[Review]   结论：${report.conclusion === 'pass' ? '✅ 通过' : '❌ 驳回'}`);
      console.log(`[Review] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      return report;
      
    } catch (error) {
      console.error(`[Review] ❌ 检查失败:`, error.message);
      console.error(`[Review] 错误堆栈:`, error.stack);
      throw error;
    }
  }

  /**
   * 加载检查点（子类必须实现）
   * 
   * @returns {Checkpoint[]} 检查点列表
   * 
   * @example
   * ```javascript
   * loadCheckpoints() {
   *   return [
   *     { id: 'D1', name: '需求覆盖率', type: 'auto', rule: '...', weight: 0.2, critical: true },
   *     { id: 'D2', name: '文档完整性', type: 'auto', rule: '...', weight: 0.15, critical: true }
   *   ];
   * }
   * ```
   */
  loadCheckpoints() {
    throw new Error('子类必须实现 loadCheckpoints 方法');
  }

  /**
   * 执行单个检查点
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<CheckpointResult>} 检查结果
   * 
   * @private
   */
  async runCheckpoint(checkpoint, input) {
    const result = {
      id: checkpoint.id,
      name: checkpoint.name,
      type: checkpoint.type,
      status: 'pending',
      description: checkpoint.rule || '',
      timestamp: new Date().toISOString(),
      weight: checkpoint.weight || 0
    };

    try {
      // 自动检查
      if (checkpoint.type === 'auto') {
        const passed = await this.validateCheckpoint(checkpoint, input);
        result.status = passed ? 'pass' : 'fail';
      }
      // 人工检查
      else if (checkpoint.type === 'manual') {
        result.status = 'pending'; // 等待人工确认
        result.description = '需要人工审阅确认';
      }
      // AI 辅助检查
      else if (checkpoint.type === 'ai') {
        const aiResult = await this.runAICheckpoint(checkpoint, input);
        result.status = aiResult.passed ? 'pass' : 'warning';
        result.aiSuggestions = aiResult.suggestions || [];
      }
      // 未知类型
      else {
        result.status = 'error';
        result.error = `未知检查类型：${checkpoint.type}`;
      }
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }

    return result;
  }

  /**
   * 验证检查点（子类必须实现）
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<boolean>} 是否通过
   * 
   * @example
   * ```javascript
   * async validateCheckpoint(checkpoint, input) {
   *   switch (checkpoint.id) {
   *     case 'D1': return this.checkRequirementsCoverage(input);
   *     case 'D2': return this.checkDocumentCompleteness(input);
   *     default: throw new Error(`未知检查点：${checkpoint.id}`);
   *   }
   * }
   * ```
   */
  async validateCheckpoint(checkpoint, input) {
    throw new Error('子类必须实现 validateCheckpoint 方法');
  }

  /**
   * AI 辅助检查（可选实现）
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, suggestions: string[]}>} AI 检查结果
   */
  async runAICheckpoint(checkpoint, input) {
    // TODO: 集成 AI 辅助检查
    // 目前返回默认结果
    return { passed: true, suggestions: [] };
  }

  /**
   * 生成检查报告
   * 
   * @returns {ReviewReport} 检查报告
   * 
   * @private
   */
  generateReport() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail' || r.status === 'error').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const pending = this.results.filter(r => r.status === 'pending').length;

    // 计算加权得分
    const totalWeight = this.results.reduce((sum, r) => sum + (r.weight || 0), 0);
    const passedWeight = this.results
      .filter(r => r.status === 'pass')
      .reduce((sum, r) => sum + (r.weight || 0), 0);
    const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;

    return {
      stage: this.stageName,
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed,
        failed,
        warnings,
        pending,
        score
      },
      checkpoints: this.results,
      conclusion: failed === 0 ? 'pass' : 'reject',
      duration: 0,
      qualityLevel: score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 60 ? '合格' : '待改进'
    };
  }

  /**
   * 读取文件内容（辅助方法）
   * 
   * @param {string} filePath - 文件路径
   * @returns {string} 文件内容
   * @protected
   */
  readFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在：${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * 检查文件是否存在（辅助方法）
   * 
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否存在
   * @protected
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * 检测模糊词（辅助方法）
   * 
   * @param {string} content - 文本内容
   * @returns {Array<{pattern: string, matches: string[]}>} 模糊词匹配结果
   * @protected
   */
  detectVagueWords(content) {
    const vaguePatterns = [
      { name: '适当的', pattern: /适当的/g },
      { name: '一些', pattern: /一些/g },
      { name: '可能', pattern: /可能/g },
      { name: '大概', pattern: /大概/g },
      { name: '也许', pattern: /也许/g },
      { name: '若干', pattern: /若干/g },
      { name: '等', pattern: /等/g }
    ];

    const found = [];
    for (const { name, pattern } of vaguePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        found.push({
          pattern: name,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    }

    return found;
  }
}

// 类型定义（JSDoc）
/**
 * @typedef {Object} Checkpoint
 * @property {string} id - 检查点 ID
 * @property {string} name - 检查点名称
 * @property {'auto' | 'manual' | 'ai'} type - 检查类型
 * @property {string} rule - 检查规则描述
 * @property {number} weight - 权重（0-1）
 * @property {boolean} critical - 是否关键检查点
 */

/**
 * @typedef {Object} CheckpointResult
 * @property {string} id - 检查点 ID
 * @property {string} name - 检查点名称
 * @property {string} type - 检查类型
 * @property {'pass' | 'fail' | 'warning' | 'pending' | 'error'} status - 检查状态
 * @property {string} description - 检查规则
 * @property {string} timestamp - ISO 时间戳
 * @property {string} [error] - 错误信息
 * @property {string[]} [aiSuggestions] - AI 建议
 * @property {number} weight - 权重
 */

/**
 * @typedef {Object} ReviewReport
 * @property {string} stage - 阶段名称
 * @property {string} timestamp - ISO 时间戳
 * @property {Object} summary - 检查摘要
 * @property {number} summary.total - 总检查点数
 * @property {number} summary.passed - 通过数
 * @property {number} summary.failed - 失败数
 * @property {number} summary.warnings - 警告数
 * @property {number} summary.pending - 待确认数
 * @property {number} summary.score - 质量评分（0-100）
 * @property {CheckpointResult[]} checkpoints - 检查点结果列表
 * @property {'pass' | 'reject'} conclusion - 自动结论
 * @property {number} duration - 耗时（毫秒）
 * @property {string} qualityLevel - 质量等级
 */

module.exports = ReviewAgentBase;
