const { ConfirmationExtractor } = require('../designing-agents/confirmation-extractor');

/**
 * 审阅协议类
 * 
 * 生成审阅请求，包含确认内容提炼和签字结论选项
 * 
 * @class ReviewProtocol
 * @author openclaw-ouyp
 * @since 3.1.3
 */
class ReviewProtocol {
  /**
   * 构造函数
   * @param {object} options - 配置选项
   * @param {ConfirmationExtractor} options.extractor - 确认内容提炼器（可选）
   */
  constructor(options = {}) {
    this.extractor = options.extractor || new ConfirmationExtractor();
  }

  /**
   * 生成审阅请求
   * 
   * @async
   * @param {object} context - 审阅上下文
   * @param {string} context.task - 任务描述
   * @param {string} context.scenario - 场景类型（new/incremental/bugfix）
   * @param {string} context.stage - 阶段名称（designing/roadmapping/detailing/coding/reviewing）
   * @param {string} context.version - 版本号
   * @param {string} context.prdContent - PRD.md 内容
   * @param {string} context.trdContent - TRD.md 内容
   * @param {Array<object>} context.checkpoints - 审阅检查点列表
   * @returns {Promise<string>} 审阅请求（Markdown 格式）
   */
  async generateReviewRequest(context) {
    const {
      task,
      scenario,
      stage,
      version,
      prdContent,
      trdContent,
      checkpoints = []
    } = context;

    // 提炼确认内容
    const confirmationContent = await this.extractor.extract(
      prdContent,
      trdContent,
      scenario
    );
    
    const confirmationMarkdown = this.extractor.formatToMarkdown(confirmationContent);
    
    // 生成检查点表格
    const checkpointsTable = this.generateCheckpointsTable(checkpoints);
    
    // 生成审阅请求
    return `## 📋 审阅请求 - ${stage.toUpperCase()} 阶段 ${version}

### 任务信息
- **任务**: ${task}
- **场景**: ${this.formatScenario(scenario)}
- **阶段**: ${stage}
- **版本**: ${version}

${confirmationMarkdown}

### 审阅检查点

${checkpointsTable}

### 审阅结论

请选择审阅结论：

- ✅ **通过** - 符合标准，进入下一阶段
- ⚠️ **条件通过** - 小问题不影响发布，但需后续修复
- ❌ **驳回** - 触及红线，必须修改后重审
- ❓ **需澄清** - 信息不足，无法判断

**回复格式**: \`审阅结论：[通过/条件通过/驳回/需澄清]\` + 备注（可选）
`;
  }

  /**
   * 生成检查点表格
   * @private
   */
  generateCheckpointsTable(checkpoints) {
    if (checkpoints.length === 0) {
      return '| 检查点 | 说明 | 状态 |\n|--------|------|------|\n| - | 无检查点 | ⏳ 待确认 |';
    }

    const rows = checkpoints.map(cp => {
      const id = cp.id || `C${checkpoints.indexOf(cp) + 1}`;
      const description = cp.description || cp;
      const status = cp.status || '⏳ 待确认';
      return `| ${id} | ${description} | ${status} |`;
    });

    return `| 检查点 | 说明 | 状态 |\n|--------|------|------|\n${rows.join('\n')}`;
  }

  /**
   * 格式化场景类型
   * @private
   */
  formatScenario(scenario) {
    const map = {
      'new': '全新功能',
      'incremental': '增量需求',
      'bugfix': '问题修复'
    };
    return map[scenario] || scenario;
  }

  /**
   * 解析审阅结论
   * 
   * @param {string} response - 用户回复
   * @returns {object} 解析结果
   */
  parseReviewDecision(response) {
    if (!response) {
      return { decision: 'clarify', notes: '无回复' };
    }

    const lowerResponse = response.toLowerCase();
    
    // 匹配审阅结论
    const decisionPatterns = [
      { pattern: /通过但需|条件通过|conditional/g, decision: 'conditional' },
      { pattern: /驳回|reject/g, decision: 'reject' },
      { pattern: /需澄清 | 澄清|clarify/g, decision: 'clarify' },
      { pattern: /通过|pass/g, decision: 'pass' }
    ];

    let decision = 'clarify';
    for (const { pattern, decision: dec } of decisionPatterns) {
      if (pattern.test(lowerResponse)) {
        decision = dec;
        break;
      }
    }

    // 提取备注
    const notesMatch = response.match(/备注 [:：]?\s*(.+)$/m) || response.match(/，(.+)$/m);
    const notes = notesMatch ? notesMatch[1].trim() : '';

    return { decision, notes };
  }

  /**
   * 生成签字确认请求
   * 
   * @param {object} context - 签字上下文
   * @param {string} context.version - 版本号
   * @param {string} context.confirmationContent - 确认内容（Markdown）
   * @returns {string} 签字确认请求
   */
  generateSignatureRequest(context) {
    const { version, confirmationContent } = context;

    return `## ✍️ 签字确认 - PRD v${version}

### 确认内容

${confirmationContent}

### 签字选项

请选择您的签字结论：

- ✅ **通过** - 同意设计方案，可以进入下一阶段
- ⚠️ **条件通过** - 基本同意，但有以下建议/问题
- ❌ **驳回** - 不同意设计方案，需要重新修改

### 签字信息

- **角色**: [产品负责人/技术负责人/审阅者]
- **姓名**: [您的姓名]
- **日期**: [YYYY-MM-DD]
- **结论**: [通过/条件通过/驳回]
- **备注**: [可选]

**回复格式**: 
\`\`\`
角色：[角色]
姓名：[姓名]
结论：[通过/条件通过/驳回]
备注：[可选备注]
\`\`\`
`;
  }

  /**
   * 生成标准检查点列表（DESIGNING 阶段）
   * 
   * @returns {Array<object>} 检查点列表
   */
  getDesigningCheckpoints() {
    return [
      { id: 'D1', description: 'PRD.md 包含第 15 章"用户确认签字"' },
      { id: 'D2', description: 'PRD.md 版本历史更新到当前版本' },
      { id: 'D3', description: '不生成任何额外文件（确认内容内存化）' },
      { id: 'D4', description: 'ReviewDesignAgent 得分 >= 90%' },
      { id: 'D5', description: '签字回填格式正确（Markdown 表格）' },
      { id: 'D6', description: 'Git 提交记录存在，Message 格式正确' }
    ];
  }

  /**
   * 生成标准检查点列表（ROADMAPPING 阶段）
   * 
   * @returns {Array<object>} 检查点列表
   */
  getRoadmappingCheckpoints() {
    return [
      { id: 'R1', description: 'ROADMAP.md 包含任务分解' },
      { id: 'R2', description: '任务依赖关系清晰' },
      { id: 'R3', description: '时间估算合理' }
    ];
  }

  /**
   * 生成标准检查点列表（DETAILING 阶段）
   * 
   * @returns {Array<object>} 检查点列表
   */
  getDetailingCheckpoints() {
    return [
      { id: 'D1', description: 'DETAIL.md 包含文件级详细设计' },
      { id: 'D2', description: '接口设计完整（API 定义、数据结构）' },
      { id: 'D3', description: '代码结构说明清晰' },
      { id: 'D4', description: '异常处理策略完整' }
    ];
  }

  /**
   * 生成标准检查点列表（CODING 阶段）
   * 
   * @returns {Array<object>} 检查点列表
   */
  getCodingCheckpoints() {
    return [
      { id: 'C1', description: '代码实现符合详细设计' },
      { id: 'C2', description: '单元测试覆盖率 >= 80%' },
      { id: 'C3', description: '所有测试通过' },
      { id: 'C4', description: '无硬编码，使用配置文件' }
    ];
  }

  /**
   * 生成标准检查点列表（REVIEWING 阶段）
   * 
   * @returns {Array<object>} 检查点列表
   */
  getReviewingCheckpoints() {
    return [
      { id: 'RV1', description: 'REVIEW-REPORT.md 包含完整验收报告' },
      { id: 'RV2', description: '所有检查点状态明确' },
      { id: 'RV3', description: '验收结论清晰（通过/条件通过/驳回）' }
    ];
  }
}

module.exports = { ReviewProtocol };
