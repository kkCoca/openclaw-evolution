/**
 * Review Decision Parser (审阅结论解析器)
 * 
 * ClawDevFlow (CDF) 审阅系统核心组件
 * 负责解析 openclaw-ouyp 填写的审阅结论
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * 审阅结论枚举
 */
const ReviewDecision = {
  PASS: 'pass',           // 通过
  CONDITIONAL: 'conditional', // 条件通过
  REJECT: 'reject',       // 驳回
  CLARIFY: 'clarify'      // 需澄清
};

/**
 * 审阅结论映射表（支持多种输入格式）
 */
const DECISION_MAP = {
  // 英文
  'pass': ReviewDecision.PASS,
  'conditional': ReviewDecision.CONDITIONAL,
  'reject': ReviewDecision.REJECT,
  'clarify': ReviewDecision.CLARIFY,
  
  // 中文
  '通过': ReviewDecision.PASS,
  '条件通过': ReviewDecision.CONDITIONAL,
  '驳回': ReviewDecision.REJECT,
  '需澄清': ReviewDecision.CLARIFY,
  
  // 数字选项
  '1': ReviewDecision.PASS,
  '2': ReviewDecision.CONDITIONAL,
  '3': ReviewDecision.REJECT,
  '4': ReviewDecision.CLARIFY,
  
  // Emoji
  '✅': ReviewDecision.PASS,
  '⚠️': ReviewDecision.CONDITIONAL,
  '❌': ReviewDecision.REJECT,
  '❓': ReviewDecision.CLARIFY
};

/**
 * 审阅结论解析器
 */
class ReviewDecisionParser {
  /**
   * 构造函数
   */
  constructor() {
    console.log('[Review-Parser] 审阅结论解析器初始化完成');
  }

  /**
   * 解析审阅结论
   * 
   * @param {string} content - 审阅文件内容
   * @returns {{decision: string|null, notes: string, fixItems: Array, score: object|null}}
   * 
   * @example
   * ```javascript
   * const parser = new ReviewDecisionParser();
   * const result = parser.parse(fileContent);
   * console.log(result.decision); // 'pass' | 'conditional' | 'reject' | 'clarify'
   * ```
   */
  parse(content) {
    console.log('[Review-Parser] 开始解析审阅结论...');
    
    if (!content) {
      console.log('[Review-Parser] ❌ 审阅文件内容为空');
      return {
        decision: null,
        notes: '',
        fixItems: [],
        score: null,
        error: '审阅文件内容为空'
      };
    }

    // 1. 解析审阅结论
    const decision = this.extractDecision(content);
    
    // 2. 解析审阅意见
    const notes = this.extractNotes(content);
    
    // 3. 解析待修复项
    const fixItems = this.extractFixItems(content);
    
    // 4. 解析质量评分
    const score = this.extractScore(content);

    console.log('[Review-Parser] 审阅结论解析完成:');
    console.log(`[Review-Parser]   结论：${decision || '未填写'}`);
    console.log(`[Review-Parser]   意见：${notes ? notes.substring(0, 50) + '...' : '无'}`);
    console.log(`[Review-Parser]   待修复项：${fixItems.length} 项`);
    console.log(`[Review-Parser]   评分：${score ? score.overall + '/100' : '无'}`);

    return { decision, notes, fixItems, score };
  }

  /**
   * 提取审阅结论
   * @param {string} content - 文件内容
   * @returns {string|null} 审阅结论
   * @private
   */
  extractDecision(content) {
    // 搜索多种可能的格式
    const patterns = [
      // **审阅结论**: `pass`
      /\*\*审阅结论\*\*:\s*`([^`]+)`/,
      
      // **审阅结论**: pass
      /\*\*审阅结论\*\*:\s*([a-zA-Z]+)/,
      
      // 审阅结论：pass
      /审阅结论 [:：]\s*([a-zA-Z]+)/,
      
      // 直接匹配结论关键词
      /\b(pass|conditional|reject|clarify|通过 | 条件通过 | 驳回 | 需澄清)\b/i,
      
      // 匹配数字选项
      /^\s*([1-4])\s*$/m
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const rawValue = match[1].trim().toLowerCase();
        const decision = DECISION_MAP[rawValue] || DECISION_MAP[match[1].trim()];
        
        if (decision) {
          console.log(`[Review-Parser] 提取到审阅结论：${decision} (原始值：${rawValue || match[1]})`);
          return decision;
        }
      }
    }

    console.log('[Review-Parser] ⚠️ 未找到审阅结论');
    return null;
  }

  /**
   * 提取审阅意见
   * @param {string} content - 文件内容
   * @returns {string} 审阅意见
   * @private
   */
  extractNotes(content) {
    // 匹配审阅意见区域
    const notesMatch = content.match(/\*\*审阅意见\*\*:\s*\n*```([\s\S]*?)```/);
    
    if (notesMatch && notesMatch[1]) {
      const notes = notesMatch[1].trim();
      console.log(`[Review-Parser] 提取到审阅意见 (${notes.length} 字符)`);
      return notes;
    }

    // 尝试其他格式
    const altMatch = content.match(/审阅意见 [:：]\s*([\s\S]+)/);
    if (altMatch && altMatch[1]) {
      const notes = altMatch[1].trim().split('\n\n')[0];
      console.log(`[Review-Parser] 提取到审阅意见 (备用格式，${notes.length} 字符)`);
      return notes;
    }

    console.log('[Review-Parser] ⚠️ 未找到审阅意见');
    return '';
  }

  /**
   * 提取待修复项
   * @param {string} content - 文件内容
   * @returns {Array<{id: string, description: string, severity: string, deadline: string}>}
   * @private
   */
  extractFixItems(content) {
    const fixItems = [];
    const lines = content.split('\n');
    
    // 匹配表格格式：| F1 | 问题描述 | 低 | v1.1.0 |
    const tablePattern = /^\|\s*F(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;
    
    let inFixItemsTable = false;
    
    for (const line of lines) {
      // 检测是否进入待修复项表格
      if (line.includes('待修复项')) {
        inFixItemsTable = true;
        continue;
      }
      
      if (inFixItemsTable) {
        const match = line.match(tablePattern);
        if (match) {
          fixItems.push({
            id: `F${match[1]}`,
            description: match[2].trim(),
            severity: match[3].trim(),
            deadline: match[4].trim()
          });
          console.log(`[Review-Parser] 提取到待修复项：${match[1]} - ${match[2].trim()}`);
        } else if (line.trim().startsWith('|---')) {
          // 表格分隔线，继续
        } else if (line.trim().startsWith('|') && !line.includes('F')) {
          // 表格结束
          break;
        }
      }
    }

    console.log(`[Review-Parser] 共提取到 ${fixItems.length} 项待修复项`);
    return fixItems;
  }

  /**
   * 提取质量评分
   * @param {string} content - 文件内容
   * @returns {{overall: number, dimensions: object}|null}
   * @private
   */
  extractScore(content) {
    // 匹配质量评分表格
    const scoreMatch = content.match(/\*\*审阅结论\*\*:\s*`([^`]+)`[\s\S]*?整体评分\s*\|\s*(\d+)/);
    
    if (scoreMatch && scoreMatch[2]) {
      const overall = parseInt(scoreMatch[2]);
      console.log(`[Review-Parser] 提取到质量评分：${overall}/100`);
      
      return {
        overall,
        dimensions: {}
      };
    }

    // 尝试匹配评分表格
    const tablePattern = /整体评分\s*\|\s*(\d+)/;
    const match = content.match(tablePattern);
    
    if (match && match[1]) {
      const overall = parseInt(match[1]);
      console.log(`[Review-Parser] 提取到质量评分：${overall}/100`);
      
      return {
        overall,
        dimensions: {}
      };
    }

    console.log('[Review-Parser] ⚠️ 未找到质量评分');
    return null;
  }

  /**
   * 验证审阅结论是否有效
   * @param {string|null} decision - 审阅结论
   * @returns {boolean} 是否有效
   */
  isValidDecision(decision) {
    return Object.values(ReviewDecision).includes(decision);
  }

  /**
   * 验证审阅文件是否已填写
   * @param {string} content - 文件内容
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateReviewFile(content) {
    const errors = [];
    
    // 检查审阅结论
    const decision = this.extractDecision(content);
    if (!decision) {
      errors.push('未填写审阅结论');
    }
    
    // 检查审阅意见
    const notes = this.extractNotes(content);
    if (!notes || notes.length < 10) {
      errors.push('审阅意见过于简单（至少 10 字符）');
    }
    
    // 条件通过时必须有待修复项
    if (decision === ReviewDecision.CONDITIONAL) {
      const fixItems = this.extractFixItems(content);
      if (fixItems.length === 0) {
        errors.push('条件通过时必须填写待修复项');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 从文件读取并解析审阅结论
   * @param {string} filePath - 审阅文件路径
   * @returns {Promise<{decision: string|null, notes: string, fixItems: Array, score: object|null, valid: boolean, errors: string[]}>}
   */
  async parseFile(filePath) {
    console.log(`[Review-Parser] 读取审阅文件：${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`审阅文件不存在：${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = this.parse(content);
    const validation = this.validateReviewFile(content);
    
    return {
      ...result,
      valid: validation.valid,
      errors: validation.errors
    };
  }
}

module.exports = ReviewDecisionParser;
module.exports.ReviewDecision = ReviewDecision;
