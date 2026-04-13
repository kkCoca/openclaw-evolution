/**
 * Review Request Generator (审阅请求生成器)
 * 
 * 生成 Markdown 格式的审阅请求文件
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

class ReviewRequestGenerator {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    this.config = config || {};
    this.template = this.loadTemplate();
    console.log('[Review-Generator] 审阅请求生成器初始化完成');
  }

  /**
   * 加载审阅模板
   * @returns {string} 模板内容
   * @private
   */
  loadTemplate() {
    const templatePath = path.join(__dirname, 'templates', 'review-request.md');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板文件不存在：${templatePath}`);
    }
    
    return fs.readFileSync(templatePath, 'utf-8');
  }

  /**
   * 生成审阅请求
   * 
   * @param {string} stageName - 阶段名称
   * @param {ReviewReport} autoResults - 自动检查结果
   * @param {object} outputs - 阶段产出列表
   * @param {string} workflowId - 工作流 ID
   * @returns {string} 审阅请求 Markdown
   * 
   * @example
   * ```javascript
   * const generator = new ReviewRequestGenerator(config);
   * const request = generator.generate('designing', report, [
   *   { name: 'PRD.md', path: 'projects/xxx/01_designing/PRD.md' },
   *   { name: 'TRD.md', path: 'projects/xxx/01_designing/TRD.md' }
   * ]);
   * ```
   */
  generate(stageName, autoResults, outputs, workflowId) {
    const reviewId = `review-${stageName}-${Date.now()}`;
    const resolvedWorkflowId = workflowId || this.config.workflowId || 'unknown';
    const timestamp = new Date().toISOString();

    console.log(`[Review-Generator] 生成审阅请求：${stageName}`);
    console.log(`[Review-Generator]   Review ID: ${reviewId}`);
    console.log(`[Review-Generator]   Workflow ID: ${resolvedWorkflowId}`);

    return this.template
      .replace('{stageName}', this.formatStageName(stageName))
      .replace('{workflowId}', resolvedWorkflowId)
      .replace('{reviewId}', reviewId)
      .replace('{timestamp}', timestamp)
      .replace('{outputs}', this.formatOutputs(outputs))
      .replace('{autoResults}', this.formatAutoResults(autoResults))
      .replace('{warnings}', this.formatWarnings(autoResults))
      .replace('{reviewer}', this.config.reviewer || 'openclaw-ouyp');
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
      'release': 'Release（发布）'
    };
    return names[stageName] || stageName;
  }

  /**
   * 格式化阶段产出
   * @param {object[]} outputs - 产出列表
   * @returns {string} Markdown 表格
   * @private
   */
  formatOutputs(outputs) {
    if (!outputs || outputs.length === 0) {
      return '| 文档 | 路径 | 状态 |\n|------|------|------|\n| - | - | ⬜ 未生成 |';
    }

    const rows = outputs.map(output => {
      const name = output.name || '未知文档';
      const filePath = output.path || '未知路径';
      const status = output.status || '✅ 已生成';
      return `| ${name} | \`${filePath}\` | ${status} |`;
    }).join('\n');

    return `
| 文档 | 路径 | 状态 |
|------|------|------|
${rows}
    `;
  }

  /**
   * 格式化自动检查结果
   * @param {ReviewReport} autoResults - 自动检查结果
   * @returns {string} Markdown 格式
   * @private
   */
  formatAutoResults(autoResults) {
    if (!autoResults) {
      return '⚠️ 自动检查结果不可用';
    }

    const statusIcon = {
      'pass': '✅',
      'fail': '❌',
      'warning': '⚠️',
      'pending': '⬜',
      'error': '🔴'
    };

    const totalStatus = autoResults.summary.failed === 0 ? 
      (autoResults.summary.warnings > 0 ? '⚠️ 通过（有警告）' : '✅ 通过') : 
      '❌ 未通过';

    const rows = autoResults.checkpoints.map(cp => {
      const icon = statusIcon[cp.status] || '❓';
      const description = cp.description || '-';
      return `| ${cp.id} | ${cp.name} | ${icon} ${cp.status} | ${description} |`;
    }).join('\n');

    return `
**检查时间**: ${autoResults.timestamp}  
**检查 Agent**: CDF-Review-${autoResults.stage}  
**总体状态**: ${totalStatus}  
**质量评分**: ${autoResults.summary.score}/100 (${autoResults.summary.qualityLevel || '未知'})

### 检查点详情

| ID | 检查项 | 状态 | 说明 |
|----|--------|------|------|
${rows}
    `;
  }

  /**
   * 格式化警告详情
   * @param {ReviewReport} autoResults - 自动检查结果
   * @returns {string} Markdown 格式
   * @private
   */
  formatWarnings(autoResults) {
    if (!autoResults) {
      return '无';
    }

    const warnings = autoResults.checkpoints.filter(cp => cp.status === 'warning');
    
    if (warnings.length === 0) {
      return '无警告';
    }

    const warningDetails = warnings.map(w => {
      let details = `**${w.id} - ${w.name}**:\n`;
      
      if (w.aiSuggestions && w.aiSuggestions.length > 0) {
        details += w.aiSuggestions.map(s => `- ${s}`).join('\n');
      } else {
        details += '需要人工确认';
      }
      
      return details;
    }).join('\n\n');

    return warningDetails;
  }

  /**
   * 保存到文件
   * 
   * @param {string} content - 文件内容
   * @param {string} outputPath - 输出路径
   * 
   * @example
   * ```javascript
   * generator.saveToFile(content, 'projects/xxx/05_reviewing/review-request-design.md');
   * ```
   */
  saveToFile(content, outputPath) {
    const dir = path.dirname(outputPath);
    
    if (!fs.existsSync(dir)) {
      console.log(`[Review-Generator] 创建目录：${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`[Review-Generator] ✅ 审阅请求已保存：${outputPath}`);
  }

  /**
   * 生成审阅请求并保存
   * 
   * @param {string} stageName - 阶段名称
   * @param {ReviewReport} autoResults - 自动检查结果
   * @param {object} outputs - 阶段产出列表
   * @param {string} projectPath - 项目路径
   * @param {string} workflowId - 工作流 ID
   * @returns {string} 保存的文件路径
   */
  generateAndSave(stageName, autoResults, outputs, projectPath, workflowId) {
    const content = this.generate(stageName, autoResults, outputs, workflowId);
    const outputPath = path.join(projectPath, '05_reviewing', `review-request-${stageName}.md`);
    this.saveToFile(content, outputPath);
    return outputPath;
  }
}

module.exports = ReviewRequestGenerator;
