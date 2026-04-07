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
        rule: 'PRD/TRD 必须声明对齐的 REQUIREMENTS 版本，且版本一致 + 哈希匹配',
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
      // ✅ 质量检查（D1-D7）
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
      },
      {
        id: 'D7',
        name: '验收标准可测试性',
        type: 'ai',
        rule: '每条需求的 PRD 映射章节内必须包含 Given/When/Then（v3.1.9 新增）',
        weight: 0.10,
        critical: false,
        order: 9,
        description: '逐条验证每条需求的验收标准是否包含 Given/When/Then 格式'
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
   * 4. 声明的哈希必须与实际 REQUIREMENTS 哈希一致（v3.1.9 新增）
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<GateResult>} 门禁结果
   */
  async checkFreshnessGate(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
    
    // 1. 提取 REQUIREMENTS 版本信息和实际哈希（SHA256）
    const requirementsVersion = this.extractVersion(requirementsContent);
    const requirementsActualHash = this.calculateSha256Hash(requirementsContent);
    
    console.log(`[Freshness Gate] REQUIREMENTS 版本：${requirementsVersion}`);
    console.log(`[Freshness Gate] REQUIREMENTS 实际哈希 (SHA256): ${requirementsActualHash}`);
    
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
          requirementsHash: requirementsActualHash,
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
    
    // 4. 哈希值校验（v3.1.12 更新：支持短哈希，用 startsWith 对比）
    // 允许声明 7-64 位 hex，对比时用 startsWith 判断是否匹配
    const prdHashMatch = prdAlignment.hash && requirementsActualHash.toLowerCase().startsWith(prdAlignment.hash.toLowerCase());
    const trdHashMatch = trdAlignment.hash && requirementsActualHash.toLowerCase().startsWith(trdAlignment.hash.toLowerCase());
    
    if (!prdHashMatch || !trdHashMatch) {
      return {
        passed: false,
        critical: true,
        gate: 'freshness',
        reason: '文档声明的哈希与 REQUIREMENTS 实际哈希不匹配',
        details: {
          requirementsVersion,
          requirementsActualHash,
          prdDeclaredHash: prdAlignment.hash,
          prdHashMatch,
          trdDeclaredHash: trdAlignment.hash,
          trdHashMatch
        },
        suggestion: `请更新 PRD.md 和 TRD.md 的哈希声明为实际值的前 7-64 位：${requirementsActualHash.substring(0, 12)}...`
      };
    }
    
    console.log(`[Freshness Gate] ✅ 版本一致性检查通过`);
    console.log(`[Freshness Gate] ✅ 哈希值校验通过`);
    
    return {
      passed: true,
      critical: false,
      gate: 'freshness',
      version: requirementsVersion,
      hash: requirementsActualHash,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * 提取文档版本号（v3.1.13 修复：取最新版本号）
   * @param {string} content - 文档内容
   * @returns {string} 版本号（最新）
   * 
   * 修复说明：
   * - 使用 matchAll 取最后一个版本号（最新）
   * - 避免多版本文档取到第一个旧版本
   */
  extractVersion(content) {
    // 匹配格式 1：> **版本**: v1.0.0（优先级最高，通常是文档元数据）
    const match1 = content.match(/> \*\*版本\*\*: v?([0-9.]+)/i);
    if (match1) {
      return match1[1];
    }
    
    // 匹配格式 2：| 版本 | v1.0.0 |（表格元数据）
    const match2 = content.match(/\| 版本 \| v?([0-9.]+) \|/i);
    if (match2) {
      return match2[1];
    }
    
    // 匹配格式 3：## v1.0.0（取最后一个，最新版本）
    const matches = [...content.matchAll(/## v([0-9.]+)/gi)];
    if (matches.length > 0) {
      return matches[matches.length - 1][1]; // 取最后一个匹配
    }
    
    return 'unknown';
  }

  /**
   * 计算文档哈希（MD5，用于旧版本兼容）
   * @param {string} content - 文档内容
   * @returns {string} 哈希值（前 12 位）
   */
  calculateHash(content) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return hash.substring(0, 12);
  }

  /**
   * 计算文档 SHA256 哈希（v3.1.9 新增 - 用于 Freshness Gate 哈希校验）
   * @param {string} content - 文档内容
   * @returns {string} SHA256 哈希值（完整 64 位）
   */
  calculateSha256Hash(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return hash;
  }

  /**
   * 提取版本对齐声明
   * @param {string} content - 文档内容
   * @returns {{version: string, hash: string} | null} 版本信息
   * 
   * v3.1.12 修复：
   * - 支持 7-64 位 hex（短哈希便于手写，长哈希更安全）
   * - 对比时用 startsWith，允许短哈希匹配
   * - 降低文档维护成本，同时保持防造假能力
   */
  extractAlignmentDeclaration(content) {
    // 匹配格式 1：引用格式（v3.1.12 更新：支持 7-64 位 hex）
    // > **对齐版本**: REQUIREMENTS v1.0.0 (abc123def...)
    const match1 = content.match(/> \*\*对齐版本\*\*: REQUIREMENTS v([0-9.]+) \(([a-f0-9]{7,64})\)/i);
    if (match1) {
      return { version: match1[1], hash: match1[2].toLowerCase() };
    }
    
    // 匹配格式 2：表格格式（v3.1.12 更新：支持 7-64 位 hex）
    // | 对齐版本 | REQUIREMENTS v1.0.0 |
    // | 对齐哈希 | abc123def... |
    const match2 = content.match(/\| 对齐版本 \| REQUIREMENTS v([0-9.]+) \|/);
    const match3 = content.match(/\| 对齐哈希 \| ([a-f0-9]{7,64}) \|/i);
    if (match2 && match3) {
      return { version: match2[1], hash: match3[1].toLowerCase() };
    }
    
    // 匹配格式 3：简单格式（v3.1.12 更新：支持 7-64 位 hex）
    // 对齐版本：v1.0.0 (abc123def...)
    const match4 = content.match(/对齐版本 [：:]\s*v?([0-9.]+)\s*\(([a-f0-9]{7,64})\)/i);
    if (match4) {
      return { version: match4[1], hash: match4[2].toLowerCase() };
    }
    
    // 匹配格式 4：无哈希声明（标记为无效）
    const match5 = content.match(/对齐版本 [：:]\s*v?([0-9.]+)/i);
    if (match5) {
      return null; // 有版本号但无哈希，声明不完整
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
   * ### **[REQ-ABC-001]** 需求描述...（v3.1.9 支持）
   * 
   * @param {string} content - REQUIREMENTS.md 内容
   * @returns {Array<{id: string, description: string, line: number}>} 需求列表
   */
  extractRequirementsWithIds(content) {
    const requirements = [];
    const lines = content.split('\n');
    // 匹配格式：
    // 1. ### **[REQ-001]** 或 - **[REQ-001]**（带方括号和加粗）
    // 2. ### [REQ-001]（带方括号）
    // 3. ### REQ-001:（REQUIREMENTS.md 标准格式，无方括号）
    // v3.1.9 更新：支持 REQ-(?:[A-Z]+-)?\d+ 格式（如 REQ-001 或 REQ-ABC-001）
    
    // 模式 1：带方括号 [REQ-001] 或 [REQ-ABC-001]
    const reqPatternWithBrackets = /^(?:#{1,6}|[-*])\s*(?:\*\*)?\[(REQ-(?:[A-Z]+-)?\d+)\](?:\*\*)?\s*(.+)/;
    // 模式 2：无方括号 REQ-001:（REQUIREMENTS.md 标准格式）
    const reqPatternNoBrackets = /^(?:#{1,6}|[-*])\s*(REQ-(?:[A-Z]+-)?\d+)[：:]\s*(.+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match = line.match(reqPatternWithBrackets);
      
      if (!match) {
        match = line.match(reqPatternNoBrackets);
      }
      
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
   * v3.1.11 修复：支持多种 PRD 映射格式
   * v3.1.13 修复：要求映射必须在标题或列表项中，避免目录/追溯表误判
   * 
   * 期望格式：
   * 1. ### 2.1 注册功能 [REQ-001]（标题 + 方括号）
   * 2. - **[REQ-001]** 功能描述...（列表项 + 方括号）
   * 3. ### REQ-001: 功能描述（标题 + 冒号）
   * 
   * 不认可的格式（避免误判）：
   * - | REQ-001 | ... |（追溯表中的行）
   * - 1. REQ-001（纯列表编号）
   * - 参见 REQ-001（引用而非实现）
   * 
   * @param {string} prdContent - PRD.md 内容
   * @param {string} requirementId - 需求 ID（如 REQ-001）
   * @returns {{section: string, line: number, content: string} | null} 映射信息
   */
  findRequirementMapping(prdContent, requirementId) {
    const lines = prdContent.split('\n');
    
    // 构建多种匹配模式（要求标题或列表项）
    const patterns = [
      // 模式 1：标题 + 方括号 ### [REQ-001] 或 ### 功能 [REQ-001]
      new RegExp(`^#{1,6}.*\\[${requirementId}\\]`),
      // 模式 2：标题 + 冒号 ### REQ-001: 或 ### REQ-001：
      new RegExp(`^#{1,6}\\s*${requirementId}[：:]`),
      // 模式 3：列表项 + 方括号 - **[REQ-001]** 或 - [REQ-001]
      new RegExp(`^[-*]\\s*(?:\\*\\*)?\\[${requirementId}\\]`),
      // 模式 4：标题 + 词边界（无括号/冒号）### 功能描述 REQ-001
      new RegExp(`^#{1,6}.*\\b${requirementId}\\b`)
    ];
    
    // 证据关键词（用于验证章节内容是否真的实现了需求）
    const evidenceKeywords = [
      /功能 (描述 | 说明 | 设计)/i,
      /验收 (标准 | 条件)/i,
      /(字段 | 数据 | 数据库)/i,
      /(流程 | 逻辑 | 算法)/i,
      /(接口|API|参数)/i,
      /(界面 |UI| 页面)/i,
      /Given|When|Then|前置条件 | 触发条件 | 预期结果/i
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 尝试多种匹配模式
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          // 找到映射，提取上下文
          const section = this.extractSectionContext(lines, i);
          const sectionContent = section.content;
          
          // v3.1.13 验证：章节内容必须包含至少一个证据关键词
          // 避免"目录/追溯表"误判为映射
          const hasEvidence = evidenceKeywords.some(regex => regex.test(sectionContent));
          
          if (hasEvidence) {
            return {
              section: section.title,
              line: i + 1,
              content: sectionContent.substring(0, 200) // 前 200 字符
            };
          } else {
            console.log(`[Traceability Gate] ⚠️ 找到 ${requirementId} 但章节内容缺少证据关键词，跳过 L${i + 1}`);
          }
        }
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
      case 'D7':
        return this.checkAcceptanceCriteriaPerRequirement(input);
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

  /**
   * D7: 验收标准可测试性检查（v3.1.9 新增）
   * 
   * 逐条验证每条需求的 PRD 映射章节内必须包含 Given/When/Then
   * 或等价表述（前置条件/触发条件/预期结果）
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<QualityCheckResult>} 检查结果
   */
  async checkAcceptanceCriteriaPerRequirement(input) {
    const requirementsContent = this.readFile(input.requirementsFile || 'REQUIREMENTS.md');
    const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');
    
    // 1. 提取所有需求
    const requirements = this.extractRequirementsWithIds(requirementsContent);
    console.log(`[D7 验收标准检查] 提取到 ${requirements.length} 条需求`);
    
    if (requirements.length === 0) {
      return {
        checkpoint: 'D7',
        name: '验收标准可测试性',
        passed: true,
        score: 100,
        details: { totalRequirements: 0, checkedRequirements: 0 },
        issues: [],
        suggestions: []
      };
    }
    
    // 2. 逐条验证每条需求的 PRD 映射章节内是否包含 Given/When/Then
    const results = [];
    const failedRequirements = [];
    
    for (const req of requirements) {
      // 查找 PRD 中的映射章节
      const mapping = this.findRequirementMapping(prdContent, req.id);
      
      if (!mapping) {
        // Traceability Gate 已确保不会到这里，但为安全起见仍处理
        failedRequirements.push({
          requirementId: req.id,
          reason: '未找到 PRD 映射',
          suggestion: '请在 PRD.md 中添加该需求的映射章节'
        });
        results.push({ requirementId: req.id, passed: false, reason: '无映射' });
        continue;
      }
      
      // 获取映射章节的完整内容（向上找到章节标题，向下到下一章节）
      const sectionContent = this.extractFullSectionContent(prdContent, mapping.line - 1);
      
      // 检查是否包含 Given/When/Then 或等价表述（v3.1.12 更新：要求结构化标记，减少误判）
      // 要求带冒号（中英文）/换行的段落标签，避免单字误判（如"当用户..."不是 When）
      const hasGiven = /Given\s*[:：]|假设\s*[:：]|前置条件\s*[:：]|【前置条件】|\*\*前置条件\*\*/i.test(sectionContent);
      const hasWhen = /When\s*[:：]|触发条件\s*[:：]|【触发条件】|\*\*触发条件\*\*/i.test(sectionContent);
      const hasThen = /Then\s*[:：]|预期结果\s*[:：]|【预期结果】|\*\*预期结果\*\*/i.test(sectionContent);
      
      // 宽松模式：如果结构化标记未找到，尝试找换行 + 关键字（次优但可接受）
      const hasGivenLoose = hasGiven || /^Given\b|^假设\b|^前置条件\b/im.test(sectionContent);
      const hasWhenLoose = hasWhen || /^When\b|^触发条件\b/im.test(sectionContent);
      const hasThenLoose = hasThen || /^Then\b|^预期结果\b/im.test(sectionContent);
      
      const passed = hasGivenLoose && hasWhenLoose && hasThenLoose;
      
      results.push({
        requirementId: req.id,
        passed,
        details: { hasGiven, hasWhen, hasThen }
      });
      
      if (!passed) {
        failedRequirements.push({
          requirementId: req.id,
          requirement: req.description,
          prdSection: mapping.section,
          missing: [
            !hasGiven ? 'Given/假设/前置条件' : null,
            !hasWhen ? 'When/当/触发条件' : null,
            !hasThen ? 'Then/那么/预期结果' : null
          ].filter(Boolean),
          suggestion: `请在 PRD.md "${mapping.section}"章节中为 [${req.id}] 添加完整的 Given/When/Then 验收标准`
        });
      }
    }
    
    // 3. 计算通过率
    const passedCount = results.filter(r => r.passed).length;
    const passRate = passedCount / requirements.length;
    const score = passRate * 100;
    const passed = passRate === 1.0;
    
    console.log(`[D7 验收标准检查] 通过率：${(passRate * 100).toFixed(1)}% (${passedCount}/${requirements.length})`);
    
    return {
      checkpoint: 'D7',
      name: '验收标准可测试性',
      passed,
      score,
      maxScore: 100,
      details: {
        totalRequirements: requirements.length,
        checkedRequirements: passedCount,
        passRate: (passRate * 100).toFixed(1) + '%',
        results
      },
      issues: failedRequirements.slice(0, 10), // 最多返回 10 个问题
      suggestions: failedRequirements.map(f => f.suggestion).slice(0, 5)
    };
  }

  /**
   * 提取完整章节内容（从章节标题到下一章节前）
   * @param {string} content - 文档内容
   * @param {number} startLine - 起始行号（0-indexed）
   * @returns {string} 章节内容
   */
  extractFullSectionContent(content, startLine) {
    const lines = content.split('\n');
    const sectionLines = [];
    
    // 确定章节标题级别
    let headerLevel = 0;
    for (let i = startLine; i >= 0; i--) {
      const match = lines[i].match(/^(#{1,6})\s+/);
      if (match) {
        headerLevel = match[1].length;
        break;
      }
    }
    
    // 从起始行向下收集内容，直到遇到同级或更高级别的章节标题
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+/);
      
      if (headerMatch && headerMatch[1].length <= headerLevel && i > startLine) {
        break; // 遇到同级或更高级别的章节标题，停止
      }
      
      sectionLines.push(line);
    }
    
    return sectionLines.join('\n');
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
   * 新的决策逻辑（v3.2.0 基础版，v3.3.0 增加 severity 分级）
   * 
   * 决策规则：
   * 1. 如果 blockingIssues 有 blocker → BLOCK（等价 reject）
   * 2. 如果只有 warning → PASS（记录 warning）
   * 3. conditional_blocks_progress = true 时，conditional 也视为 BLOCK
   * 
   * @param {object} report - 审阅报告
   * @param {object} policy - policy 配置
   * @returns {{decision: string, reason: string, blockingIssues: array, warnings: array}}
   */
  makeDecision(report, policy) {
    const severityModel = policy.severity_model || {};
    const blockerList = severityModel.blocker || [];
    const warningList = severityModel.warning || [];
    
    // 1. 检查 Gate 是否通过（FG/TG）- v3.4.0 增强：添加 evidence 和 regenerateHint
    if (!report.gates.freshness.passed || !report.gates.traceability.passed) {
      const isFreshnessFailed = !report.gates.freshness.passed;
      
      return {
        decision: 'BLOCK',
        reason: 'Gate 检查失败',
        blockingIssues: [{
          id: isFreshnessFailed ? 'FG_HASH_MISMATCH' : 'TG_MISSING_MAPPING',
          severity: 'blocker',
          message: isFreshnessFailed ? 'Freshness Gate 失败：PRD/TRD 哈希与 REQUIREMENTS 不匹配' : 'Traceability Gate 失败：需求未完全映射',
          evidence: {
            file: isFreshnessFailed ? '01_designing/PRD.md' : '01_designing/PRD.md',
            section: isFreshnessFailed ? '对齐版本声明' : '需求追溯矩阵',
            details: isFreshnessFailed ? report.gates.freshness : report.gates.traceability
          },
          regenerateHint: isFreshnessFailed 
            ? '【强制修复】更新 PRD.md 和 TRD.md 的对齐版本声明，确保哈希值与 REQUIREMENTS.md 一致。格式：> **对齐版本**: REQUIREMENTS v{version} ({hash})'
            : '【强制修复】在 PRD.md 中为每条需求添加明确映射，格式：### {功能名} [REQ-xxx]，并包含功能描述和验收标准'
        }],
        warnings: []
      };
    }
    
    // 2. 检查 blockingIssues（D7 等自动检查）- v3.4.0 增强：补充 evidence 和 regenerateHint
    let blockingIssues = report.blockingIssues || [];
    
    // 增强 D7 失败的 blockingIssues
    blockingIssues = blockingIssues.map(issue => {
      if (issue.id === 'D7_AC_MISSING' || issue.checkpoint === 'D7') {
        return {
          ...issue,
          severity: issue.severity || 'blocker',
          evidence: {
            file: '01_designing/PRD.md',
            section: '验收标准章节',
            details: issue.details || {}
          },
          regenerateHint: '【强制修复】在 PRD.md 中为每条需求添加结构化验收标准，格式：\n前置条件：...\n触发条件：...\n预期结果：...'
        };
      }
      return issue;
    });
    
    // 3. 分级处理（v3.3.0）
    const blockerIssues = [];
    const warningIssues = [];
    
    for (const issue of blockingIssues) {
      if (blockerList.includes(issue.id) || issue.severity === 'blocker') {
        blockerIssues.push(issue);
      } else if (warningList.includes(issue.id) || issue.severity === 'warning') {
        warningIssues.push(issue);
      } else {
        // 默认视为 blocker
        blockerIssues.push({ ...issue, severity: 'blocker' });
      }
    }
    
    // 4. 有 blocker → BLOCK
    if (blockerIssues.length > 0) {
      return {
        decision: 'BLOCK',
        reason: '存在阻断性问题',
        blockingIssues: blockerIssues,
        warnings: warningIssues
      };
    }
    
    // 5. 只有 warning → PASS（记录 warning）
    if (warningIssues.length > 0) {
      console.log(`[Review-Design v2] 发现 ${warningIssues.length} 个 warning，但不阻断流程`);
      
      return {
        decision: 'PASS',
        reason: '只有 warning 级别问题',
        blockingIssues: [],
        warnings: warningIssues
      };
    }
    
    // 6. conditional 处理（根据 policy）
    if (report.decision === 'conditional' && policy.conditional_blocks_progress) {
      return {
        decision: 'BLOCK',
        reason: 'conditional 阻断流程（policy 配置）',
        blockingIssues: [{
          id: 'CONDITIONAL_BLOCKED',
          severity: 'blocker',
          message: '审阅结论为 conditional，根据 policy 配置阻断流程'
        }],
        warnings: []
      };
    }
    
    // 7. 通过
    return {
      decision: 'PASS',
      reason: '所有检查通过',
      blockingIssues: [],
      warnings: []
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
   * AI 调用（占位符，v3.1.12 明确标记为待实现）
   * 
   * ⚠️ 重要说明：
   * - 当前实现返回固定结果，AI 检查（D1/D2/D4/D5/D6）实际未生效
   * - Gate 检查（FG/TG）是真门禁 ✅
   * - AI 检查是"形同虚设的常通过" ⚠️
   * 
   * TODO: 实际应调用 OpenClaw sessions_spawn API
   * 
   * @param {string} prompt - 提示词
   * @returns {Promise<object>} AI 响应（当前为 mock）
   */
  async callAI(prompt) {
    console.warn('[Review-Design v2] ⚠️ AI 调用未实现 - 返回 mock 结果（D1/D2/D4/D5/D6 检查未生效）');
    console.log('[Review-Design v2] 调用 AI prompt:', prompt.substring(0, 200) + '...');
    
    // v3.1.12: 降级处理 - AI 检查不阻塞流程，仅记录 warning
    // 这样 Gate 检查（FG/TG）仍然是真门禁，AI 检查作为未来扩展
    return {
      score: 80, // 默认通过分数
      passed: true, // 默认通过
      suggestions: ['⚠️ AI 检查未实现，建议人工审阅确认'],
      isMock: true // 标记为 mock 结果
    };
  }
}

module.exports = ReviewDesignAgentV2;
