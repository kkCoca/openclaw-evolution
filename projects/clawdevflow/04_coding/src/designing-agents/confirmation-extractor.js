/**
 * 确认内容提炼类
 * 
 * 从 PRD/TRD 自动提炼关键信息，供用户签字确认时快速理解
 * 
 * @class ConfirmationExtractor
 * @author openclaw-ouyp
 * @since 3.1.3
 */
class ConfirmationExtractor {
  /**
   * 构造函数
   * @param {object} options - 配置选项
   * @param {number} options.maxRequirements - 最大核心需求数（默认 5）
   * @param {number} options.maxRisks - 最大风险数（默认 5）
   */
  constructor(options = {}) {
    this.maxRequirements = options.maxRequirements || 5;
    this.maxRisks = options.maxRisks || 5;
  }

  /**
   * 提取确认内容
   * 
   * @async
   * @param {string} prdContent - PRD.md 内容
   * @param {string} trdContent - TRD.md 内容
   * @param {string} scenario - 场景类型（new/incremental/bugfix）
   * @returns {Promise<object>} 确认内容对象
   */
  async extract(prdContent, trdContent, scenario) {
    return {
      coreRequirements: await this.extractCoreRequirements(prdContent),
      technicalSolution: await this.extractTechnicalSolution(trdContent),
      changeImpact: await this.analyzeChangeImpact(prdContent, scenario),
      risks: await this.extractRisks(trdContent)
    };
  }

  /**
   * 提取核心需求
   * @private
   */
  async extractCoreRequirements(prdContent) {
    const requirements = [];
    
    // 解析 PRD 第 3 章"功能需求"
    const sectionMatch = prdContent.match(/## 3\. 功能需求([\s\S]*?)(?=## 4\.|$)/);
    if (!sectionMatch) {
      return ['未找到功能需求章节'];
    }

    const sectionContent = sectionMatch[1];
    
    // 提取每个功能模块的标题和描述
    const moduleRegex = /### \d+\.?\d*?\s*([^\n]+)\n([\s\S]*?)(?=### \d+\.|$)/g;
    let match;
    
    while ((match = moduleRegex.exec(sectionContent)) !== null) {
      const title = match[1].trim();
      const content = match[2] || '';
      
      // 提取需求描述
      const descMatch = content.match(/\*\*需求描述\*\*:\s*([^\n]+)/);
      if (descMatch) {
        requirements.push({
          title,
          description: descMatch[1].trim(),
          priority: this.extractPriority(content)
        });
      }
    }
    
    // 按优先级排序，取前 N 条
    requirements.sort((a, b) => {
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    return requirements
      .slice(0, this.maxRequirements)
      .map(r => `${r.title}: ${r.description.substring(0, 50)}${r.description.length > 50 ? '...' : ''}`);
  }

  /**
   * 提取优先级
   * @private
   */
  extractPriority(content) {
    const priorityMatch = content.match(/\*\*优先级\*\*:\s*\[?(P[0-2])\]?/);
    return priorityMatch ? priorityMatch[1] : 'P1';
  }

  /**
   * 提取技术方案
   * @private
   */
  async extractTechnicalSolution(trdContent) {
    // 解析 TRD 第 1 章"技术架构"
    const sectionMatch = trdContent.match(/## 1\. 技术架构([\s\S]*?)(?=## 2\.|$)/);
    if (!sectionMatch) {
      return '未找到技术架构章节';
    }

    const sectionContent = sectionMatch[1];
    
    // 提取技术选型
    const selectionMatch = sectionContent.match(/### 1\.\d*?\s*技术选型([\s\S]*?)(?=###|$)/);
    if (selectionMatch) {
      const technologies = [];
      const techLines = selectionMatch[1].split('\n');
      
      for (const line of techLines) {
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          const tech = line.replace(/^[-•]\s*/, '').trim();
          if (tech && tech.length > 0) {
            technologies.push(tech);
          }
        }
      }
      
      if (technologies.length > 0) {
        return technologies.join(' + ');
      }
    }
    
    // 如果没有找到技术选型，尝试提取技术栈描述
    const stackMatch = sectionContent.match(/技术栈[:：]?\s*([^\n]+)/);
    if (stackMatch) {
      return stackMatch[1].trim();
    }
    
    return 'Node.js + 文件系统操作';
  }

  /**
   * 分析变更影响
   * @private
   */
  async analyzeChangeImpact(prdContent, scenario) {
    if (scenario === 'new') {
      return null; // 全新功能无变更影响
    }
    
    if (scenario === 'bugfix') {
      return '最小化修复，不影响现有功能';
    }
    
    // 增量需求：分析保留需求和新增需求
    const sectionMatch = prdContent.match(/## 2\. 需求目标([\s\S]*?)(?=## 3\.|$)/);
    if (!sectionMatch) {
      return '向后兼容，不影响现有功能';
    }

    const sectionContent = sectionMatch[1];
    
    // 检查是否有保留需求
    const hasRetained = sectionContent.includes('保留需求');
    const hasNew = sectionContent.includes('新增需求');
    
    if (hasRetained && hasNew) {
      return '向后兼容，保留原有功能，追加新功能';
    } else if (hasNew) {
      return '追加新功能，需验证原有功能';
    }
    
    return '向后兼容，不影响现有功能';
  }

  /**
   * 提取风险提示
   * @private
   */
  async extractRisks(trdContent) {
    const risks = [];
    
    // 解析 TRD 第 10 章"异常处理"或类似章节
    const sectionMatch = trdContent.match(/## (?:10\. 异常处理|9\. 异常处理|8\. 风险管理)([\s\S]*?)(?=## \d+\.|$)/);
    if (sectionMatch) {
      const sectionContent = sectionMatch[1];
      
      // 提取异常类型表格或列表
      const riskLines = sectionContent.split('\n');
      for (const line of riskLines) {
        if (line.includes('|') && line.includes('异常') || line.includes('风险')) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
          if (cells.length >= 2) {
            risks.push(cells[0]);
          }
        }
      }
    }
    
    // 如果没有找到，尝试从技术架构中提取潜在风险
    if (risks.length === 0) {
      const defaultRisks = [
        '文件操作可能失败',
        'Git 提交可能冲突',
        '用户签字确认可能延迟'
      ];
      return defaultRisks.slice(0, this.maxRisks);
    }
    
    return risks.slice(0, this.maxRisks);
  }

  /**
   * 格式化为 Markdown 表格
   * 
   * @param {object} content - 确认内容对象
   * @returns {string} Markdown 表格
   */
  formatToMarkdown(content) {
    const coreReqs = content.coreRequirements
      .map((r, i) => `${i + 1}. ${r}`)
      .join('<br>');
    
    const risks = content.risks
      .map((r, i) => `${i + 1}. ${r}`)
      .join('<br>');
    
    return `## 确认内容提炼

> 以下内容由流程引擎在内存中提炼，供用户快速理解

| 类别 | 关键内容 |
|------|---------|
| 核心需求 | ${coreReqs} |
| 技术方案 | ${content.technicalSolution} |
| 变更影响 | ${content.changeImpact || '无（全新功能）'} |
| 风险提示 | ${risks} |`;
  }
}

module.exports = { ConfirmationExtractor };
