/**
 * Review Design Agent (设计阶段审阅 Agent)
 * 
 * ClawDevFlow (CDF) 审阅系统 - Design 阶段专用
 * 负责审阅 PRD.md 和 TRD.md 的质量
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const ReviewAgentBase = require('../review-framework/review-agent-base');
const fs = require('fs');

/**
 * Design 阶段审阅 Agent
 * 
 * 检查点：
 * - D1: 需求覆盖率（100% 覆盖 REQUIREMENTS.md）
 * - D2: 文档完整性（PRD+TRD 章节完整）
 * - D3: 无模糊词（检测模糊描述）
 * - D4: 技术选型合理（有比较表 + 决策依据）
 * - D5: 向后兼容（增量需求有兼容性说明）
 * - D6: 异常处理（正常流程 + 失败处理 + 边界情况）
 */
class ReviewDesignAgent extends ReviewAgentBase {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    super('designing', config);
  }

  /**
   * 加载检查点
   * @returns {Checkpoint[]} 检查点列表
   */
  loadCheckpoints() {
    return [
      {
        id: 'D1',
        name: '需求覆盖率',
        type: 'auto',
        rule: 'REQUIREMENTS.md 中每条需求在 PRD.md 中都有对应',
        weight: 0.2,
        critical: true
      },
      {
        id: 'D2',
        name: '文档完整性',
        type: 'auto',
        rule: 'PRD.md 和 TRD.md 所有章节完整',
        weight: 0.15,
        critical: true
      },
      {
        id: 'D3',
        name: '无模糊词',
        type: 'auto',
        rule: '检测"适当的"、"一些"、"可能"等模糊词',
        weight: 0.1,
        critical: false
      },
      {
        id: 'D4',
        name: '技术选型合理',
        type: 'ai',
        rule: '技术选型章节有比较表 + 决策依据',
        weight: 0.2,
        critical: true
      },
      {
        id: 'D5',
        name: '向后兼容',
        type: 'auto',
        rule: '增量需求必须有兼容性说明',
        weight: 0.15,
        critical: true
      },
      {
        id: 'D6',
        name: '异常处理',
        type: 'ai',
        rule: '正常流程 + 失败处理 + 边界情况都覆盖',
        weight: 0.2,
        critical: true
      }
    ];
  }

  /**
   * 验证检查点
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<boolean>} 是否通过
   */
  async validateCheckpoint(checkpoint, input) {
    console.log(`[Review-Design] 执行检查：${checkpoint.id} - ${checkpoint.name}`);
    
    switch (checkpoint.id) {
      case 'D1':
        return this.checkRequirementsCoverage(input);
      case 'D2':
        return this.checkDocumentCompleteness(input);
      case 'D3':
        return this.checkVagueWords(input);
      case 'D5':
        return this.checkCompatibility(input);
      default:
        throw new Error(`未知检查点：${checkpoint.id}`);
    }
  }

  /**
   * D1: 检查需求覆盖率
   * 
   * 验证 REQUIREMENTS.md 中的每条需求在 PRD.md 中都有对应
   * 
   * @param {object} input - 输入数据
   * @param {string} input.requirementsFile - REQUIREMENTS.md 路径
   * @param {string} input.prdFile - PRD.md 路径
   * @returns {Promise<boolean>} 覆盖率是否 100%
   */
  async checkRequirementsCoverage(input) {
    try {
      const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
      const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');

      // 提取 REQUIREMENTS.md 中的需求项
      const requirements = this.extractRequirements(requirementsContent);
      console.log(`[Review-Design] D1: 提取到 ${requirements.length} 条需求`);
      
      // 检查每条需求在 PRD 中是否有对应
      let covered = 0;
      const uncovered = [];
      
      for (const req of requirements) {
        // 检查需求 ID 或描述是否在 PRD 中出现
        const isCovered = prdContent.includes(req.id) || 
                         prdContent.includes(req.description) ||
                         prdContent.toLowerCase().includes(req.description.toLowerCase());
        
        if (isCovered) {
          covered++;
        } else {
          uncovered.push(req.description);
        }
      }

      const coverage = requirements.length > 0 ? covered / requirements.length : 0;
      console.log(`[Review-Design] D1: 需求覆盖率 ${(coverage * 100).toFixed(2)}% (${covered}/${requirements.length})`);
      
      if (uncovered.length > 0) {
        console.log(`[Review-Design] D1: 未覆盖需求:`, uncovered.slice(0, 3));
      }
      
      return coverage >= 1.0;
      
    } catch (error) {
      console.error(`[Review-Design] D1: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * D2: 检查文档完整性
   * 
   * 验证 PRD.md 和 TRD.md 的必需章节是否存在
   * 
   * @param {object} input - 输入数据
   * @param {string} input.prdFile - PRD.md 路径
   * @param {string} input.trdFile - TRD.md 路径
   * @returns {Promise<boolean>} 文档是否完整
   */
  async checkDocumentCompleteness(input) {
    try {
      const requiredSections = {
        'PRD.md': [
          '# 产品概述',
          '# 功能需求',
          '# 非功能需求',
          '# 验收标准'
        ],
        'TRD.md': [
          '# 技术架构',
          '# 数据库设计',
          '# 接口设计',
          '# 安全设计'
        ]
      };

      const files = {
        'PRD.md': input.prdFile || '01_designing/PRD.md',
        'TRD.md': input.trdFile || '01_designing/TRD.md'
      };

      let allComplete = true;
      const missingSections = [];

      for (const [fileName, sections] of Object.entries(requiredSections)) {
        const filePath = files[fileName];
        
        if (!this.fileExists(filePath)) {
          console.log(`[Review-Design] D2: 文件不存在：${filePath}`);
          allComplete = false;
          continue;
        }

        const content = this.readFile(filePath);
        
        for (const section of sections) {
          if (!content.includes(section)) {
            console.log(`[Review-Design] D2: 缺少章节：${fileName} - ${section}`);
            missingSections.push(`${fileName}: ${section}`);
            allComplete = false;
          }
        }
      }

      if (missingSections.length > 0) {
        console.log(`[Review-Design] D2: 缺失章节:`, missingSections);
      }

      return allComplete;
      
    } catch (error) {
      console.error(`[Review-Design] D2: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * D3: 检查模糊词
   * 
   * 检测 PRD.md 中的模糊描述
   * 
   * @param {object} input - 输入数据
   * @param {string} input.prdFile - PRD.md 路径
   * @returns {Promise<boolean>} 是否无模糊词
   */
  async checkVagueWords(input) {
    try {
      const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
      const vagueWords = this.detectVagueWords(prdContent);

      if (vagueWords.length > 0) {
        console.log(`[Review-Design] D3: 发现模糊词:`, vagueWords);
        return false;
      }

      console.log(`[Review-Design] D3: 未发现模糊词 ✅`);
      return true;
      
    } catch (error) {
      console.error(`[Review-Design] D3: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * D5: 检查向后兼容
   * 
   * 增量需求必须有兼容性说明
   * 
   * @param {object} input - 输入数据
   * @param {string} input.requirementsFile - REQUIREMENTS.md 路径
   * @param {string} input.prdFile - PRD.md 路径
   * @returns {Promise<boolean>} 是否有兼容性说明
   */
  async checkCompatibility(input) {
    try {
      const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
      const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');

      // 检查是否是增量需求
      const isIncremental = requirementsContent.includes('增量需求') || 
                           requirementsContent.includes('v1.1') ||
                           requirementsContent.includes('v1.2') ||
                           requirementsContent.includes('追加');

      if (isIncremental) {
        // 增量需求必须有兼容性说明
        const hasCompatibility = prdContent.includes('兼容') || 
                                prdContent.includes('向后兼容') ||
                                prdContent.includes('兼容性') ||
                                prdContent.includes('不影响');
        
        if (!hasCompatibility) {
          console.log(`[Review-Design] D5: 增量需求缺少兼容性说明 ⚠️`);
          return false;
        }
        
        console.log(`[Review-Design] D5: 增量需求有兼容性说明 ✅`);
      } else {
        console.log(`[Review-Design] D5: 非增量需求，跳过兼容性检查 ✅`);
      }

      return true;
      
    } catch (error) {
      console.error(`[Review-Design] D5: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * AI 辅助检查：技术选型
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, suggestions: string[]}>}
   */
  async runAICheckpoint(checkpoint, input) {
    if (checkpoint.id === 'D4') {
      // 检查技术选型章节
      const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
      
      const hasComparison = trdContent.includes('比较') || 
                           trdContent.includes('对比') ||
                           trdContent.includes('vs') ||
                           trdContent.includes('|') && trdContent.includes('选型');
      
      const hasDecision = trdContent.includes('决策') || 
                         trdContent.includes('理由') ||
                         trdContent.includes('原因') ||
                         trdContent.includes('选择');
      
      const passed = hasComparison && hasDecision;
      const suggestions = [];
      
      if (!hasComparison) {
        suggestions.push('建议添加技术选型比较表');
      }
      if (!hasDecision) {
        suggestions.push('建议补充技术选型决策依据');
      }

      return { passed, suggestions };
    }
    
    if (checkpoint.id === 'D6') {
      // 检查异常处理
      const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
      
      const hasErrorHandling = trdContent.includes('异常') || 
                              trdContent.includes('错误') ||
                              trdContent.includes('失败') ||
                              trdContent.includes('重试');
      
      const hasBoundary = trdContent.includes('边界') || 
                         trdContent.includes('极限') ||
                         trdContent.includes('最大') ||
                         trdContent.includes('最小');
      
      const passed = hasErrorHandling && hasBoundary;
      const suggestions = [];
      
      if (!hasErrorHandling) {
        suggestions.push('建议补充异常处理设计');
      }
      if (!hasBoundary) {
        suggestions.push('建议补充边界情况处理');
      }

      return { passed, suggestions };
    }

    return { passed: true, suggestions: [] };
  }

  /**
   * 辅助方法：提取需求项
   * 
   * @param {string} content - REQUIREMENTS.md 内容
   * @returns {Array<{id: string, description: string, line: number}>} 需求列表
   * @private
   */
  extractRequirements(content) {
    const requirements = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 匹配列表项（- 或 1. 开头）
      const match = line.match(/^(\s*[-*]|\s*\d+\.)\s+(.+)/);
      if (match) {
        const description = match[2].trim();
        
        // 跳过空行和标题
        if (description && !description.startsWith('#')) {
          requirements.push({
            id: `R${requirements.length + 1}`,
            description,
            line: i + 1
          });
        }
      }
    }

    console.log(`[Review-Design] 提取到 ${requirements.length} 条需求`);
    return requirements;
  }
}

module.exports = ReviewDesignAgent;
