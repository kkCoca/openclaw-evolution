/**
 * Review Design Agent v2.0 (设计阶段审阅 Agent - 优化版)
 * 
 * ClawDevFlow (CDF) 审阅系统 - Design 阶段专用
 * 负责审阅 PRD.md 和 TRD.md 的质量
 * 
 * 检查流程：
 * 1. Freshness Gate (强门禁) - 版本一致性检查
 * 2. Traceability Gate (强门禁) - 需求可追溯性检查
 * 3. 质量检查 (D1-D6) - 文档质量评估
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const ReviewAgentBase = require('../review-framework/review-agent-base');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Design 阶段审阅 Agent v2.0
 */
class ReviewDesignAgentV2 extends ReviewAgentBase {
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
      // 🔒 强门禁（前置检查）
      {
        id: 'FG',
        name: 'Freshness Gate',
        type: 'gate',
        rule: 'PRD/TRD 必须声明对齐的 REQUIREMENTS 版本，且版本一致',
        weight: 0,
        critical: true,
        order: 1
      },
      {
        id: 'TG',
        name: 'Traceability Gate',
        type: 'gate',
        rule: 'REQUIREMENTS 的每条需求必须在 PRD 有可定位的映射',
        weight: 0,
        critical: true,
        order: 2
      },
      // ✅ 质量检查（D1-D6）
      {
        id: 'D1',
        name: '需求理解准确性',
        type: 'ai',
        rule: '需求被正确理解和转化，不是简单复制',
        weight: 0.2,
        critical: true,
        order: 3,
        description: '评估需求理解的准确性和转化质量'
      },
      {
        id: 'D2',
        name: '文档完整性',
        type: 'ai',
        rule: '文档章节完整且内容充实',
        weight: 0.15,
        critical: true,
        order: 4,
        description: '评估文档章节完整性和内容充实度'
      },
      {
        id: 'D3',
        name: '无模糊词',
        type: 'auto',
        rule: '检测"适当的"、"一些"、"可能"等模糊词',
        weight: 0.1,
        critical: false,
        order: 5,
        description: '检测并报告模糊描述'
      },
      {
        id: 'D4',
        name: '技术选型合理',
        type: 'ai',
        rule: '技术选型有比较表 + 决策依据',
        weight: 0.2,
        critical: true,
        order: 6,
        description: '评估技术选型的合理性'
      },
      {
        id: 'D5',
        name: '向后兼容',
        type: 'ai',
        rule: '增量需求有可行的兼容性方案',
        weight: 0.15,
        critical: true,
        order: 7,
        description: '评估兼容性方案的可行性'
      },
      {
        id: 'D6',
        name: '异常处理',
        type: 'ai',
        rule: '正常流程 + 失败处理 + 边界情况都覆盖',
        weight: 0.2,
        critical: true,
        order: 8,
        description: '评估异常处理的完整性'
      }
    ];
  }

  /**
   * 执行完整审阅流程
   * @param {object} input - 输入数据
   * @returns {Promise<ReviewReport>} 审阅报告
   */
  async executeReview(input) {
    console.log('[Review-Design v2] 开始执行审阅流程');
    
    const report = {
      timestamp: new Date().toISOString(),
      stage: 'designing',
      version: '2.0.0',
      gates: {},
      qualityChecks: {},
      overall: {
        passed: false,
        score: 0,
        recommendation: 'pending'
      }
    };
    
    // 1. Freshness Gate（强门禁）
    console.log('\n[Review-Design v2] 执行 Freshness Gate...');
    const freshnessResult = await this.checkFreshnessGate(input);
    report.gates.freshness = freshnessResult;
    
    if (!freshnessResult.passed) {
      console.log('[Review-Design v2] ❌ Freshness Gate 失败，审阅终止');
      report.overall.passed = false;
      report.overall.recommendation = 'reject';
      report.overall.reason = 'Freshness Gate 失败：版本不一致';
      return report;
    }
    
    // 2. Traceability Gate（强门禁）
    console.log('\n[Review-Design v2] 执行 Traceability Gate...');
    const traceabilityResult = await this.checkTraceabilityGate(input);
    report.gates.traceability = traceabilityResult;
    
    if (!traceabilityResult.passed) {
      console.log('[Review-Design v2] ❌ Traceability Gate 失败，审阅终止');
      report.overall.passed = false;
      report.overall.recommendation = 'reject';
      report.overall.reason = 'Traceability Gate 失败：需求映射不完整';
      return report;
    }
    
    // 3. 质量检查（D1-D6）
    console.log('\n[Review-Design v2] 执行质量检查...');
    
    const qualityCheckpoints = this.loadCheckpoints().filter(cp => cp.id.startsWith('D'));
    
    for (const checkpoint of qualityCheckpoints) {
      console.log(`\n[Review-Design v2] 执行检查：${checkpoint.id} - ${checkpoint.name}`);
      
      try {
        const result = await this.validateCheckpoint(checkpoint, input);
        report.qualityChecks[checkpoint.id] = result;
      } catch (error) {
        console.error(`[Review-Design v2] ${checkpoint.id} 检查失败:`, error.message);
        report.qualityChecks[checkpoint.id] = {
          passed: false,
          score: 0,
          error: error.message
        };
      }
    }
    
    // 4. 计算综合评分
    report.overall = this.calculateOverallScore(report);
    
    console.log('\n[Review-Design v2] 审阅完成');
    console.log(`[Review-Design v2] 综合评分：${report.overall.score}/100`);
    console.log(`[Review-Design v2] 审阅结论：${report.overall.recommendation}`);
    
    return report;
  }

  // =========================================================================
  // 🔒 Freshness Gate - 版本一致性检查（强门禁）
  // =========================================================================

  /**
   * Freshness Gate - 版本一致性检查
   * 
   * 强制要求：
   * 1. PRD.md 必须声明对齐的 REQUIREMENTS 版本
   * 2. TRD.md 必须声明对齐的 REQUIREMENTS 版本
   * 3. 声明的版本必须与实际 REQUIREMENTS 版本一致
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<GateResult>} 门禁结果
   */
  async checkFreshnessGate(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
    
    // 1. 提取 REQUIREMENTS 版本信息
    const requirementsVersion = this.extractVersion(requirementsContent);
    const requirementsHash = this.calculateHash(requirementsContent);
    
    console.log(`[Freshness Gate] REQUIREMENTS 版本：${requirementsVersion}`);
    console.log(`[Freshness Gate] REQUIREMENTS 哈希：${requirementsHash}`);
    
    // 2. 检查 PRD 是否声明了对齐版本
    const prdAlignment = this.extractAlignmentDeclaration(prdContent);
    const trdAlignment = this.extractAlignmentDeclaration(trdContent);
    
    // 检查 PRD 版本声明
    if (!prdAlignment) {
      return {
        passed: false,
        critical: true,
        gate: 'freshness',
        reason: 'PRD.md 未声明对齐的 REQUIREMENTS 版本',
        suggestion: '请在 PRD.md 开头添加：\n\n> **对齐版本**: REQUIREMENTS v{version} ({hash})'
      };
    }
    
    // 检查 TRD 版本声明
    if (!trdAlignment) {
      return {
        passed: false,
        critical: true,
        gate: 'freshness',
        reason: 'TRD.md 未声明对齐的 REQUIREMENTS 版本',
        suggestion: '请在 TRD.md 开头添加：\n\n> **对齐版本**: REQUIREMENTS v{version} ({hash})'
      };
    }
    
    // 3. 版本一致性检查
    const prdVersionMatch = prdAlignment.version === requirementsVersion;
    const trdVersionMatch = trdAlignment.version === requirementsVersion;
    
    if (!prdVersionMatch || !trdVersionMatch) {
      return {
        passed: false,
        critical: true,
        gate: 'freshness',
        reason: '文档版本与 REQUIREMENTS 不一致',
        details: {
          requirementsVersion,
          requirementsHash,
          prdVersion: prdAlignment.version,
          prdHash: prdAlignment.hash,
          trdVersion: trdAlignment.version,
          trdHash: trdAlignment.hash,
          prdVersionMatch,
          trdVersionMatch
        },
        suggestion: '请更新 PRD.md 和 TRD.md 的版本声明，确保与 REQUIREMENTS.md 一致'
      };
    }
    
    console.log(`[Freshness Gate] ✅ 版本一致性检查通过`);
    
    return {
      passed: true,
      critical: false,
      gate: 'freshness',
      version: requirementsVersion,
      hash: requirementsHash,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * 提取文档版本号
   * @param {string} content - 文档内容
   * @returns {string} 版本号
   */
  extractVersion(content) {
    // 匹配格式 1：> **版本**: v1.0.0
    const match1 = content.match(/> \*\*版本\*\*: v?([0-9.]+)/i);
    if (match1) {
      return match1[1];
    }
    
    // 匹配格式 2：| 版本 | v1.0.0 |
    const match2 = content.match(/\| 版本 \| v?([0-9.]+) \|/i);
    if (match2) {
      return match2[1];
    }
    
    // 匹配格式 3：## v1.0.0
    const match3 = content.match(/## v([0-9.]+)/i);
    if (match3) {
      return match3[1];
    }
    
    return 'unknown';
  }

  /**
   * 计算文档哈希
   * @param {string} content - 文档内容
   * @returns {string} 哈希值（前 12 位）
   */
  calculateHash(content) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return hash.substring(0, 12);
  }

  /**
   * 提取版本对齐声明
   * @param {string} content - 文档内容
   * @returns {{version: string, hash: string} | null} 版本信息
   */
  extractAlignmentDeclaration(content) {
    // 匹配格式 1：引用格式
    // > **对齐版本**: REQUIREMENTS v1.0.0 (abc123def456)
    const match1 = content.match(/> \*\*对齐版本\*\*: REQUIREMENTS v([0-9.]+) \(([a-f0-9]+)\)/);
    if (match1) {
      return { version: match1[1], hash: match1[2] };
    }
    
    // 匹配格式 2：表格格式
    // | 对齐版本 | REQUIREMENTS v1.0.0 |
    // | 对齐哈希 | abc123def456 |
    const match2 = content.match(/\| 对齐版本 \| REQUIREMENTS v([0-9.]+) \|/);
    const match3 = content.match(/\| 对齐哈希 \| ([a-f0-9]+) \|/);
    if (match2 && match3) {
      return { version: match2[1], hash: match3[1] };
    }
    
    // 匹配格式 3：简单格式
    // 对齐版本：v1.0.0
    const match4 = content.match(/对齐版本 [：:]\s*v?([0-9.]+)/i);
    if (match4) {
      return { version: match4[1], hash: null };
    }
    
    return null;
  }

  // =========================================================================
  // 🔒 Traceability Gate - 需求可追溯性检查（强门禁）
  // =========================================================================

  /**
   * Traceability Gate - 需求可追溯性检查
   * 
   * 强制要求：
   * 1. REQUIREMENTS 的每条需求必须有唯一 ID（如 [REQ-001]）
   * 2. PRD.md 必须明确声明映射到哪个需求 ID
   * 3. 映射必须是可定位的（有具体章节引用）
   * 4. 映射率必须 100%
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<GateResult>} 门禁结果
   */
  async checkTraceabilityGate(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    
    // 1. 提取 REQUIREMENTS 中的需求（必须有 ID）
    const requirements = this.extractRequirementsWithIds(requirementsContent);
    console.log(`[Traceability Gate] 提取到 ${requirements.length} 条需求`);
    
    if (requirements.length === 0) {
      return {
        passed: false,
        critical: true,
        gate: 'traceability',
        reason: 'REQUIREMENTS.md 中没有找到带 ID 的需求',
        suggestion: '请使用以下格式定义需求：\n\n- **[REQ-001]** 需求描述...\n- **[REQ-002]** 需求描述...'
      };
    }
    
    // 2. 检查每条需求在 PRD 中是否有明确映射
    const traceabilityMatrix = [];
    const unmappedRequirements = [];
    
    for (const req of requirements) {
      const mapping = this.findRequirementMapping(prdContent, req.id);
      
      if (!mapping) {
        unmappedRequirements.push(req);
        traceabilityMatrix.push({
          requirementId: req.id,
          requirement: req.description,
          mapped: false,
          prdSection: null,
          prdLine: null
        });
      } else {
        traceabilityMatrix.push({
          requirementId: req.id,
          requirement: req.description,
          mapped: true,
          prdSection: mapping.section,
          prdLine: mapping.line,
          prdContent: mapping.content
        });
      }
    }
    
    // 3. 计算可追溯率
    const mappedCount = requirements.length - unmappedRequirements.length;
    const traceabilityRate = requirements.length > 0 
      ? mappedCount / requirements.length 
      : 0;
    
    if (traceabilityRate < 1.0) {
      return {
        passed: false,
        critical: true,
        gate: 'traceability',
        reason: `${unmappedRequirements.length} 条需求没有明确映射`,
        traceabilityRate,
        totalRequirements: requirements.length,
        mappedCount,
        unmappedCount: unmappedRequirements.length,
        unmappedRequirements: unmappedRequirements.map(r => ({
          id: r.id,
          description: r.description
        })),
        suggestion: '请在 PRD.md 中为每条需求添加明确映射：\n\n### 功能需求\n\n- **[REQ-001]** 对应功能描述...\n- **[REQ-002]** 对应功能描述...',
        traceabilityMatrix
      };
    }
    
    console.log(`[Traceability Gate] ✅ 可追溯率 100% (${mappedCount}/${requirements.length})`);
    
    return {
      passed: true,
      critical: false,
      gate: 'traceability',
      traceabilityRate: 1.0,
      totalRequirements: requirements.length,
      mappedCount,
      unmappedCount: 0,
      traceabilityMatrix,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * 提取带 ID 的需求
   * 
   * 期望格式：
   * ### **[REQ-001]** 需求描述...
   * - **[REQ-001]** 需求描述...
   * 
   * @param {string} content - REQUIREMENTS.md 内容
   * @returns {Array<{id: string, description: string, line: number}>} 需求列表
   */
  extractRequirementsWithIds(content) {
    const requirements = [];
    const lines = content.split('\n');
    // 匹配格式：### **[REQ-001]** 或 - **[REQ-001]** 或 ### [REQ-001]
    const reqPattern = /^(?:#{1,6}|[-*])\s*(?:\*\*)?\[([A-Z]+-\d+)\](?:\*\*)?\s*(.+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(reqPattern);
      
      if (match) {
        requirements.push({
          id: match[1],
          description: match[2].trim(),
          line: i + 1
        });
      }
    }
    
    console.log(`[Traceability Gate] 提取到 ${requirements.length} 条需求`);
    return requirements;
  }

  /**
   * 在 PRD 中查找需求映射
   * 
   * 期望格式：
   * ### 2.1 注册功能 [REQ-001]
   * 或
   * - **[REQ-001]** 功能描述...
   * 
   * @param {string} prdContent - PRD.md 内容
   * @param {string} requirementId - 需求 ID
   * @returns {{section: string, line: number, content: string} | null} 映射信息
   */
  findRequirementMapping(prdContent, requirementId) {
    const lines = prdContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 查找需求 ID 在 PRD 中的位置
      if (line.includes(`[${requirementId}]`)) {
        // 找到映射，提取上下文
        const section = this.extractSectionContext(lines, i);
        
        return {
          section: section.title,
          line: i + 1,
          content: section.content.substring(0, 200) // 前 200 字符
        };
      }
    }
    
    return null;
  }

  /**
   * 提取章节上下文
   * @param {string[]} lines - 文档行数组
   * @param {number} targetLine - 目标行号
   * @returns {{title: string, content: string}} 章节信息
   */
  extractSectionContext(lines, targetLine) {
    // 向上查找章节标题
    let sectionTitle = '未知章节';
    for (let i = targetLine; i >= 0; i--) {
      const match = lines[i].match(/^#{1,3}\s+(.+)/);
      if (match) {
        sectionTitle = match[1].trim();
        break;
      }
    }
    
    // 提取章节内容（前后各 5 行）
    const start = Math.max(0, targetLine - 5);
    const end = Math.min(lines.length, targetLine + 6);
    const content = lines.slice(start, end).join('\n');
    
    return { title: sectionTitle, content };
  }

  // =========================================================================
  // ✅ 质量检查（D1-D6）
  // =========================================================================

  /**
   * 验证检查点
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async validateCheckpoint(checkpoint, input) {
    console.log(`[Review-Design v2] 执行检查：${checkpoint.id} - ${checkpoint.name}`);
    
    switch (checkpoint.id) {
      case 'D1':
        return this.checkRequirementsUnderstanding(input);
      case 'D2':
        return this.checkDocumentCompleteness(input);
      case 'D3':
        return this.checkVagueWords(input);
      case 'D4':
        return this.checkTechnicalSelection(input);
      case 'D5':
        return this.checkCompatibility(input);
      case 'D6':
        return this.checkErrorHandling(input);
      default:
        throw new Error(`未知检查点：${checkpoint.id}`);
    }
  }

  /**
   * D1: 需求理解准确性检查
   * 
   * 职责：评估需求理解的准确性和转化质量
   * 注意：不再检查"有没有映射"（由 Traceability Gate 负责）
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkRequirementsUnderstanding(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    
    // 1. 提取需求
    const requirements = this.extractRequirementsWithIds(requirementsContent);
    
    // 2. 对每条需求调用 AI 判断理解准确性
    const qualityScores = [];
    const issues = [];
    
    for (const req of requirements) {
      // 查找 PRD 中的映射内容
      const mapping = this.findRequirementMapping(prdContent, req.id);
      
      if (!mapping) {
        // Traceability Gate 已确保不会到这里
        continue;
      }
      
      // AI 评估理解准确性
      const aiResult = await this.callAI(`
        请评估以下需求在 PRD 中的理解准确性：
        
        原始需求 [${req.id}]: ${req.description}
        
        PRD 中的映射内容:
        ${mapping.content}
        
        评估标准：
        1. 需求是否被准确理解（不是简单复制）
        2. 是否有对应的功能设计
        3. 是否有验收标准
        4. 描述是否清晰具体
        
        请返回 JSON 格式：
        {
          "score": 0-100,
          "understanding": "准确/部分准确/不准确",
          "issues": ["问题 1", "问题 2"],
          "suggestions": ["建议 1", "建议 2"]
        }
      `);
      
      qualityScores.push(aiResult.score);
      
      if (aiResult.score < 70) {
        issues.push({
          requirementId: req.id,
          requirement: req.description,
          score: aiResult.score,
          issues: aiResult.issues,
          suggestions: aiResult.suggestions
        });
      }
    }
    
    // 3. 计算平均质量评分
    const avgScore = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0;
    
    const passed = avgScore >= 70;
    
    return {
      checkpoint: 'D1',
      name: '需求理解准确性',
      passed,
      score: avgScore,
      maxScore: 100,
      details: {
        totalRequirements: requirements.length,
        avgScore,
        qualityDistribution: {
          excellent: qualityScores.filter(s => s >= 90).length,
          good: qualityScores.filter(s => s >= 70 && s < 90).length,
          poor: qualityScores.filter(s => s < 70).length
        }
      },
      issues: issues.slice(0, 5), // 最多返回 5 个问题
      suggestions: issues.flatMap(i => i.suggestions).slice(0, 3)
    };
  }

  /**
   * D2: 文档完整性检查
   * 
   * 职责：评估文档章节完整性和内容充实度
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkDocumentCompleteness(input) {
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
    
    const requiredSections = {
      'PRD.md': [
        { title: '# 产品概述', minWords: 100 },
        { title: '# 功能需求', minWords: 200 },
        { title: '# 非功能需求', minWords: 100 },
        { title: '# 验收标准', minWords: 150 }
      ],
      'TRD.md': [
        { title: '# 技术架构', minWords: 150 },
        { title: '# 数据库设计', minWords: 100 },
        { title: '# 接口设计', minWords: 100 },
        { title: '# 安全设计', minWords: 100 }
      ]
    };
    
    const files = {
      'PRD.md': prdContent,
      'TRD.md': trdContent
    };
    
    const sectionScores = [];
    const issues = [];
    
    for (const [fileName, sections] of Object.entries(requiredSections)) {
      const content = files[fileName];
      
      for (const section of sections) {
        const sectionContent = this.extractSectionContent(content, section.title);
        
        if (!sectionContent) {
          issues.push({
            file: fileName,
            section: section.title,
            issue: '章节缺失',
            score: 0
          });
          sectionScores.push(0);
          continue;
        }
        
        // 检查字数
        const wordCount = this.countWords(sectionContent);
        const wordScore = Math.min(100, (wordCount / section.minWords) * 100);
        
        // AI 评估内容质量
        const qualityScore = await this.evaluateSectionQuality(section.title, sectionContent);
        
        // 综合评分（字数 40% + 质量 60%）
        const sectionScore = wordScore * 0.4 + qualityScore * 0.6;
        sectionScores.push(sectionScore);
        
        if (sectionScore < 70) {
          issues.push({
            file: fileName,
            section: section.title,
            issue: `内容质量不足（${sectionScore.toFixed(0)}分）`,
            wordCount,
            qualityScore,
            score: sectionScore
          });
        }
      }
    }
    
    const avgScore = sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length;
    const passed = avgScore >= 70;
    
    return {
      checkpoint: 'D2',
      name: '文档完整性',
      passed,
      score: avgScore,
      maxScore: 100,
      details: {
        totalSections: sectionScores.length,
        avgScore,
        sectionScores
      },
      issues: issues.slice(0, 5),
      suggestions: issues.map(i => `请完善 ${i.file} 的"${i.section}"章节`)
    };
  }

  /**
   * D3: 模糊词检查
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkVagueWords(input) {
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    const vagueWords = this.detectVagueWords(prdContent);
    
    const passed = vagueWords.length === 0;
    const score = passed ? 100 : Math.max(0, 100 - vagueWords.length * 10);
    
    return {
      checkpoint: 'D3',
      name: '无模糊词',
      passed,
      score,
      maxScore: 100,
      details: {
        vagueWordsCount: vagueWords.length,
        vagueWords: vagueWords.slice(0, 10)
      },
      issues: vagueWords.length > 0 ? [{
        type: '模糊词',
        count: vagueWords.length,
        words: vagueWords.slice(0, 5)
      }] : [],
      suggestions: vagueWords.length > 0 ? ['请替换模糊词为具体描述'] : []
    };
  }

  /**
   * D4: 技术选型合理性检查
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkTechnicalSelection(input) {
    const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
    const sectionContent = this.extractSectionContent(trdContent, '# 技术选型');
    
    if (!sectionContent) {
      return {
        checkpoint: 'D4',
        name: '技术选型合理',
        passed: false,
        score: 0,
        issues: [{ type: '章节缺失', section: '技术选型' }],
        suggestions: ['请添加技术选型章节']
      };
    }
    
    const aiResult = await this.callAI(`
      请评估技术选型章节的质量：
      
      技术选型内容:
      ${sectionContent}
      
      评估标准：
      1. 是否有至少 2 个候选技术对比
      2. 是否有明确的评估维度（性能/成本/学习曲线等）
      3. 是否有决策依据和理由
      4. 选型是否与项目需求匹配
      
      返回 JSON 格式：
      {
        "score": 0-100,
        "passed": true/false,
        "hasComparison": true/false,
        "hasDecision": true/false,
        "suggestions": ["建议 1", "建议 2"]
      }
    `);
    
    return {
      checkpoint: 'D4',
      name: '技术选型合理',
      passed: aiResult.passed,
      score: aiResult.score,
      maxScore: 100,
      details: {
        hasComparison: aiResult.hasComparison,
        hasDecision: aiResult.hasDecision
      },
      issues: aiResult.passed ? [] : [{ type: '技术选型质量不足' }],
      suggestions: aiResult.suggestions || []
    };
  }

  /**
   * D5: 向后兼容性检查
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkCompatibility(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    
    // 检查是否是增量需求
    const isIncremental = this.detectIncrementalRequirement(requirementsContent);
    
    if (!isIncremental) {
      return {
        checkpoint: 'D5',
        name: '向后兼容',
        passed: true,
        score: 100,
        details: { isIncremental: false },
        issues: [],
        suggestions: []
      };
    }
    
    // AI 评估兼容性方案
    const aiResult = await this.callAI(`
      这是一个增量需求项目，请评估兼容性设计：
      
      原有功能：${this.extractExistingFeatures(prdContent)}
      新增功能：${this.extractNewFeatures(prdContent)}
      兼容性说明：${this.extractSectionContent(prdContent, '兼容')}
      
      评估标准：
      1. 是否明确说明了对原有功能的影响
      2. 是否有数据迁移方案（如需要）
      3. 是否有 API 兼容性说明
      4. 是否有回滚方案
      
      返回 JSON 格式：
      {
        "score": 0-100,
        "passed": true/false,
        "risks": ["风险 1", "风险 2"],
        "suggestions": ["建议 1", "建议 2"]
      }
    `);
    
    return {
      checkpoint: 'D5',
      name: '向后兼容',
      passed: aiResult.passed,
      score: aiResult.score,
      maxScore: 100,
      details: { isIncremental: true },
      issues: aiResult.risks || [],
      suggestions: aiResult.suggestions || []
    };
  }

  /**
   * D6: 异常处理检查
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkErrorHandling(input) {
    const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
    
    const aiResult = await this.callAI(`
      请评估异常处理设计的完整性：
      
      异常处理内容:
      ${this.extractSectionContent(trdContent, '异常')}
      
      评估标准：
      1. 正常流程是否清晰
      2. 失败场景是否有处理方案
      3. 边界情况是否考虑（最大值/最小值/空值）
      4. 是否有重试/降级/熔断机制
      5. 是否有监控和告警设计
      
      返回 JSON 格式：
      {
        "score": 0-100,
        "passed": true/false,
        "missingScenarios": ["缺失场景 1", "缺失场景 2"],
        "suggestions": ["建议 1", "建议 2"]
      }
    `);
    
    return {
      checkpoint: 'D6',
      name: '异常处理',
      passed: aiResult.passed,
      score: aiResult.score,
      maxScore: 100,
      details: {},
      issues: aiResult.missingScenarios || [],
      suggestions: aiResult.suggestions || []
    };
  }

  // =========================================================================
  // 辅助方法
  // =========================================================================

  /**
   * 计算综合评分
   * @param {object} report - 审阅报告
   * @returns {{passed: boolean, score: number, recommendation: string}}
   */
  calculateOverallScore(report) {
    const qualityChecks = Object.values(report.qualityChecks);
    
    if (qualityChecks.length === 0) {
      return { passed: false, score: 0, recommendation: 'error' };
    }
    
    // 加权平均
    const checkpoints = this.loadCheckpoints().filter(cp => cp.id.startsWith('D'));
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const check of qualityChecks) {
      const checkpoint = checkpoints.find(cp => cp.id === check.checkpoint);
      const weight = checkpoint ? checkpoint.weight : 1;
      
      weightedScore += check.score * weight;
      totalWeight += weight;
    }
    
    const avgScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // 判定是否通过
    const criticalChecks = qualityChecks.filter((_, i) => checkpoints[i]?.critical);
    const allCriticalPassed = criticalChecks.every(c => c.passed);
    
    const passed = allCriticalPassed && avgScore >= 70;
    
    let recommendation;
    if (passed) {
      recommendation = avgScore >= 90 ? 'approve_excellent' : 'approve';
    } else if (avgScore >= 60) {
      recommendation = 'conditional';
    } else {
      recommendation = 'reject';
    }
    
    return {
      passed,
      score: Math.round(avgScore),
      recommendation,
      totalChecks: qualityChecks.length,
      passedChecks: qualityChecks.filter(c => c.passed).length
    };
  }

  /**
   * 检测模糊词
   * @param {string} content - 文档内容
   * @returns {string[]} 模糊词列表
   */
  detectVagueWords(content) {
    const vagueWords = [
      '适当的', '一些', '可能', '也许', '大概',
      '较好', '适当', '相关', '等等', '若干',
      '尽量', '尽可能', '原则上', '一般来说'
    ];
    
    const found = [];
    for (const word of vagueWords) {
      if (content.includes(word)) {
        found.push(word);
      }
    }
    return found;
  }

  /**
   * 检测是否是增量需求
   * @param {string} content - REQUIREMENTS.md 内容
   * @returns {boolean} 是否增量需求
   */
  detectIncrementalRequirement(content) {
    return content.includes('增量需求') || 
           content.includes('v1.1') ||
           content.includes('v1.2') ||
           content.includes('追加');
  }

  /**
   * 提取章节内容
   * @param {string} content - 文档内容
   * @param {string} sectionTitle - 章节标题
   * @returns {string} 章节内容
   */
  extractSectionContent(content, sectionTitle) {
    const lines = content.split('\n');
    let inSection = false;
    let sectionLines = [];
    
    for (const line of lines) {
      if (line.includes(sectionTitle)) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        if (line.startsWith('#')) {
          break;
        }
        sectionLines.push(line);
      }
    }
    
    return sectionLines.join('\n');
  }

  /**
   * 统计字数
   * @param {string} content - 内容
   * @returns {number} 字数
   */
  countWords(content) {
    return content.replace(/\s+/g, '').length;
  }

  /**
   * AI 评估章节质量
   * @param {string} sectionTitle - 章节标题
   * @param {string} content - 章节内容
   * @returns {Promise<number>} 质量评分
   */
  async evaluateSectionQuality(sectionTitle, content) {
    const result = await this.callAI(`
      请评估以下章节内容的质量：
      
      章节：${sectionTitle}
      内容：${content.substring(0, 500)}
      
      评估维度：
      1. 内容是否充实
      2. 描述是否清晰
      3. 是否有具体细节
      
      返回 0-100 的评分
    `);
    return result.score || 50;
  }

  /**
   * AI 调用（占位符，实际应调用 OpenClaw sessions_spawn）
   * @param {string} prompt - 提示词
   * @returns {Promise<object>} AI 响应
   */
  async callAI(prompt) {
    console.log('[Review-Design v2] 调用 AI:', prompt.substring(0, 100) + '...');
    
    // TODO: 实际应调用 OpenClaw sessions_spawn API
    // 临时返回模拟结果
    return {
      score: 80,
      passed: true,
      suggestions: []
    };
  }
}

module.exports = ReviewDesignAgentV2;
