/**
 * Review Design Agent (设计阶段审阅 Agent) v3.1.0
 * 
 * ClawDevFlow (CDF) 审阅系统 - Design 阶段专用
 * 负责审阅 PRD.md 和 TRD.md 的质量
 * 
 * v3.1.0 优化内容:
 * - D1: 版本对齐验证 + 追溯矩阵 + 可定位映射
 * - D4: AI 检查技术选型合理性
 * - D6: AI 检查异常处理完整性
 * - D7: 验收标准可测试性检查
 * 
 * @version 3.1.0
 * @author openclaw-ouyp
 * @license MIT
 */

const ReviewAgentBase = require('../review-framework/review-agent-base');
const fs = require('fs');
const path = require('path');

/**
 * Design 阶段审阅 Agent
 * 
 * 检查点分类:
 * - 红线项 (critical: true): D1/D2/D4/D6，不满足则 reject
 * - 质量项 (critical: false): D5/D7，不满足则 conditional
 * - 加分项 (critical: false): D3，满足则 pass + 建议
 * 
 * 权重分配:
 * - D1: 0.25 (需求覆盖率，含版本对齐 + 可定位映射)
 * - D2: 0.15 (文档完整性)
 * - D3: 0.08 (无模糊词)
 * - D4: 0.20 (技术选型合理)
 * - D5: 0.12 (向后兼容，仅增量需求)
 * - D6: 0.20 (异常处理)
 * - D7: 0.10 (验收标准可测试性)
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
        rule: 'REQUIREMENTS.md 中每条需求在 PRD.md 中都有对应（含版本对齐 + 追溯矩阵 + 可定位映射）',
        weight: 0.25,
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
        weight: 0.08,
        critical: false
      },
      {
        id: 'D4',
        name: '技术选型合理',
        type: 'ai',
        rule: '技术选型有比较表 + 决策依据 + 风险评估',
        weight: 0.20,
        critical: true
      },
      {
        id: 'D5',
        name: '向后兼容',
        type: 'auto',
        rule: '增量需求必须有兼容性说明',
        weight: 0.12,
        critical: false
      },
      {
        id: 'D6',
        name: '异常处理',
        type: 'ai',
        rule: '正常流程 + 失败处理 + 边界情况 + 重试机制',
        weight: 0.20,
        critical: true
      },
      {
        id: 'D7',
        name: '验收标准可测试性',
        type: 'auto',
        rule: '验收标准必须包含 Given/When/Then 格式',
        weight: 0.10,
        critical: false
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
    console.log(`[Review-Design v3.1.0] 执行检查：${checkpoint.id} - ${checkpoint.name}`);
    
    switch (checkpoint.id) {
      case 'D1':
        return this.checkRequirementsCoverage(input);
      case 'D2':
        return this.checkDocumentCompleteness(input);
      case 'D3':
        return this.checkVagueWords(input);
      case 'D5':
        return this.checkCompatibility(input);
      case 'D7':
        return this.checkAcceptanceCriteriaTestability(input);
      default:
        throw new Error(`未知检查点：${checkpoint.id}`);
    }
  }

  /**
   * D1: 检查需求覆盖率（v3.1.0 增强版）
   * 
   * 验证内容:
   * 1. 版本对齐验证 - PRD 声明的 REQUIREMENTS 版本/哈希
   * 2. 版本一致性验证 - PRD 版本与 REQUIREMENTS 最新版本一致
   * 3. 追溯矩阵提取和验证 - PRD 必须包含需求追溯矩阵
   * 4. 可定位映射验证 - 每个映射必须有章节 + 行号
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

      console.log(`[Review-Design D1] ===== 开始版本对齐验证 =====`);
      
      // 1. 版本对齐验证 - 检查 PRD 是否声明对齐的 REQUIREMENTS 版本/哈希
      const versionAlignmentResult = this.checkVersionAlignment(prdContent, requirementsContent);
      console.log(`[Review-Design D1] 版本对齐: ${versionAlignmentResult.passed ? '✅ 通过' : '❌ 失败'}`);
      if (!versionAlignmentResult.passed) {
        console.log(`[Review-Design D1] 问题:`, versionAlignmentResult.issues);
        return false;
      }

      console.log(`[Review-Design D1] ===== 开始追溯矩阵验证 =====`);
      
      // 2. 追溯矩阵提取和验证
      const traceabilityResult = this.checkTraceabilityMatrix(prdContent);
      console.log(`[Review-Design D1] 追溯矩阵: ${traceabilityResult.passed ? '✅ 通过' : '❌ 失败'}`);
      if (!traceabilityResult.passed) {
        console.log(`[Review-Design D1] 问题:`, traceabilityResult.issues);
        return false;
      }

      console.log(`[Review-Design D1] ===== 开始需求映射可定位性验证 =====`);
      
      // 3. 可定位映射验证 - 检查每个映射是否有章节 + 行号
      const mappingResult = this.checkMappingLocatability(traceabilityResult.matrix);
      console.log(`[Review-Design D1] 可定位映射: ${mappingResult.passed ? '✅ 通过' : '❌ 失败'}`);
      if (!mappingResult.passed) {
        console.log(`[Review-Design D1] 问题:`, mappingResult.issues);
        return false;
      }

      console.log(`[Review-Design D1] ===== 开始需求覆盖率验证 =====`);
      
      // 4. 提取 REQUIREMENTS.md 中的需求项（使用需求 ID）
      const requirements = this.extractRequirementsWithIds(requirementsContent);
      console.log(`[Review-Design D1] 提取到 ${requirements.length} 条需求`);
      
      // 5. 检查每条需求在 PRD 中是否有对应（通过追溯矩阵验证）
      const coveredReqs = traceabilityResult.matrix.map(m => m.requirementId);
      const uncovered = requirements.filter(req => !coveredReqs.includes(req.id));
      
      const coverage = requirements.length > 0 
        ? (requirements.length - uncovered.length) / requirements.length 
        : 0;
      
      console.log(`[Review-Design D1] 需求覆盖率 ${(coverage * 100).toFixed(2)}% (${requirements.length - uncovered.length}/${requirements.length})`);
      
      if (uncovered.length > 0) {
        console.log(`[Review-Design D1] 未覆盖需求:`, uncovered.map(r => r.id));
        return false;
      }
      
      console.log(`[Review-Design D1] ✅ D1 检查全部通过`);
      return coverage >= 1.0;
      
    } catch (error) {
      console.error(`[Review-Design D1] 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * D1 子检查：版本对齐验证
   * 
   * 检查 PRD 是否声明了对齐的 REQUIREMENTS 版本和哈希
   * 
   * @param {string} prdContent - PRD.md 内容
   * @param {string} requirementsContent - REQUIREMENTS.md 内容
   * @returns {{passed: boolean, issues: string[]}}
   */
  checkVersionAlignment(prdContent, requirementsContent) {
    const issues = [];
    
    // 检查 PRD 是否包含对齐声明
    const hasAlignmentSection = prdContent.includes('对齐 REQUIREMENTS 版本') || 
                                prdContent.includes('对齐 REQUIREMENTS 哈希') ||
                                prdContent.includes('文档元数据');
    
    if (!hasAlignmentSection) {
      issues.push('PRD 缺少"对齐 REQUIREMENTS 版本/哈希"声明');
    }
    
    // 提取 PRD 中声明的 REQUIREMENTS 版本
    const prdVersionMatch = prdContent.match(/对齐 REQUIREMENTS 版本[：:]\s*v?(\d+\.\d+\.\d+)/i);
    const reqVersionMatch = requirementsContent.match(/版本[：:]\s*v?(\d+\.\d+\.\d+)/i) ||
                            requirementsContent.match(/\*\*v(\d+\.\d+\.\d+)\*\*/i);
    
    if (prdVersionMatch && reqVersionMatch) {
      const prdVersion = prdVersionMatch[1];
      const reqVersion = reqVersionMatch[1];
      
      if (prdVersion !== reqVersion) {
        issues.push(`版本不一致：PRD 声明 v${prdVersion}，REQUIREMENTS 为 v${reqVersion}`);
      }
    }
    
    // 检查哈希声明
    const hasHashDeclaration = prdContent.includes('对齐 REQUIREMENTS 哈希') || 
                               prdContent.includes('git-hash') ||
                               prdContent.includes('`{git-hash}`');
    
    if (!hasHashDeclaration) {
      issues.push('PRD 缺少"对齐 REQUIREMENTS 哈希"声明');
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * D1 子检查：追溯矩阵验证
   * 
   * 检查 PRD 是否包含需求追溯矩阵，并提取矩阵内容
   * 
   * @param {string} prdContent - PRD.md 内容
   * @returns {{passed: boolean, issues: string[], matrix: Array}}
   */
  checkTraceabilityMatrix(prdContent) {
    const issues = [];
    const matrix = [];
    
    // 检查是否包含追溯矩阵章节
    const hasMatrixSection = prdContent.includes('需求追溯矩阵') || 
                             prdContent.includes('Traceability Matrix');
    
    if (!hasMatrixSection) {
      issues.push('PRD 缺少"需求追溯矩阵"章节');
      return { passed: false, issues, matrix };
    }
    
    // 提取追溯矩阵表格
    const tableRegex = /\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|/g;
    const tables = prdContent.match(tableRegex);
    
    if (!tables || tables.length === 0) {
      issues.push('追溯矩阵缺少表格内容');
      return { passed: false, issues, matrix };
    }
    
    // 解析矩阵行（跳过表头，只提取 REQ-XXX 格式的需求）
    let foundHeader = false;
    for (const row of tables) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      
      // 检测表头
      if (cells.some(c => c.includes('需求 ID') || c.includes('Requirement'))) {
        foundHeader = true;
        continue;
      }
      
      // 解析数据行（只提取 REQ-XXX 格式的需求）
      if (foundHeader && cells.length >= 4) {
        const requirementId = cells[0] || '';
        // 只处理 REQ-XXX 格式的需求 ID，跳过版本历史等其他表格
        if (!requirementId.match(/^REQ-\d+$/)) {
          continue;
        }
        
        matrix.push({
          requirementId: requirementId,
          requirementsChapter: cells[1] || '',
          requirementsLine: cells[2] || '',
          prdChapter: cells[3] || '',
          prdLine: cells[4] || '',
          status: cells[5] || '未标注'
        });
      }
    }
    
    if (matrix.length === 0) {
      issues.push('追溯矩阵表格中没有数据行');
    }
    
    return {
      passed: issues.length === 0,
      issues,
      matrix
    };
  }

  /**
   * D1 子检查：可定位映射验证
   * 
   * 检查追溯矩阵中的每个映射是否有章节号和行号
   * 
   * @param {Array} matrix - 追溯矩阵数据
   * @returns {{passed: boolean, issues: string[]}}
   */
  checkMappingLocatability(matrix) {
    const issues = [];
    
    for (const mapping of matrix) {
      // 检查 REQUIREMENTS.md 章节号
      if (!mapping.requirementsChapter || mapping.requirementsChapter === '-') {
        issues.push(`需求 ${mapping.requirementId} 缺少 REQUIREMENTS.md 章节号`);
      }
      
      // 检查 REQUIREMENTS.md 行号
      if (!mapping.requirementsLine || mapping.requirementsLine === '-') {
        issues.push(`需求 ${mapping.requirementId} 缺少 REQUIREMENTS.md 行号`);
      }
      
      // 检查 PRD 章节号
      if (!mapping.prdChapter || mapping.prdChapter === '-') {
        issues.push(`需求 ${mapping.requirementId} 缺少 PRD 章节号`);
      }
      
      // 检查 PRD 行号
      if (!mapping.prdLine || mapping.prdLine === '-') {
        issues.push(`需求 ${mapping.requirementId} 缺少 PRD 行号`);
      }
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
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
          '# 产品需求文档',
          '## 文档元数据',
          '## 需求背景',
          '## 需求目标',
          '## 功能需求',
          '## 非功能需求',
          '## 需求追溯矩阵',
          '## 验收标准',
          '## 版本历史'
        ],
        'TRD.md': [
          '# 技术需求文档',
          '## 文档元数据',
          '## 技术架构',
          '## 技术选型',
          '## 详细设计',
          '## 异常处理',
          '## 需求追溯矩阵',
          '## 版本历史'
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
          console.log(`[Review-Design D2] 文件不存在：${filePath}`);
          allComplete = false;
          continue;
        }

        const content = this.readFile(filePath);
        
        for (const section of sections) {
          // 支持带编号的章节匹配（如 "## 1. 需求背景" 匹配 "## 需求背景"）
          // 支持多级标题（如 "### 13.3 需求追溯矩阵" 或 "#### 10.2.1 技术选型章节"）
          // 支持部分匹配（如 "技术选型" 匹配 "技术选型章节"）
          const sectionPattern = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义特殊字符
          const sectionName = sectionPattern.replace('## ', '');
          // 匹配任意级别标题：# 名称 或 ## 数字。名称 或 ### 数字。数字 名称 或 #### 数字。数字。数字 名称
          const numberedPattern = `#{1,4}\\s*\\d*\\.?\\d*(\\.\\d+)*\\.?\\s*.*${sectionName}.*`;
          const regex = new RegExp(numberedPattern, 'i');
          
          if (!content.includes(section) && !regex.test(content)) {
            console.log(`[Review-Design D2] 缺少章节：${fileName} - ${section}`);
            missingSections.push(`${fileName}: ${section}`);
            allComplete = false;
          }
        }
      }

      if (missingSections.length > 0) {
        console.log(`[Review-Design D2] 缺失章节:`, missingSections);
      } else {
        console.log(`[Review-Design D2] ✅ 文档完整性检查通过`);
      }

      return allComplete;
      
    } catch (error) {
      console.error(`[Review-Design D2] 检查失败:`, error.message);
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
        console.log(`[Review-Design D3] 发现模糊词:`, vagueWords);
        return false;
      }

      console.log(`[Review-Design D3] ✅ 未发现模糊词`);
      return true;
      
    } catch (error) {
      console.error(`[Review-Design D3] 检查失败:`, error.message);
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
                           requirementsContent.includes('追加') ||
                           requirementsContent.includes('FEATURE-');

      if (isIncremental) {
        // 增量需求必须有兼容性说明
        const hasCompatibility = prdContent.includes('兼容') || 
                                prdContent.includes('向后兼容') ||
                                prdContent.includes('兼容性') ||
                                prdContent.includes('不影响') ||
                                prdContent.includes('保留原有');
        
        if (!hasCompatibility) {
          console.log(`[Review-Design D5] 增量需求缺少兼容性说明 ⚠️`);
          return false;
        }
        
        console.log(`[Review-Design D5] ✅ 增量需求有兼容性说明`);
      } else {
        console.log(`[Review-Design D5] ✅ 非增量需求，跳过兼容性检查`);
      }

      return true;
      
    } catch (error) {
      console.error(`[Review-Design D5] 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * D7: 检查验收标准可测试性
   * 
   * 验证验收标准是否包含 Given/When/Then 格式
   * 
   * @param {object} input - 输入数据
   * @param {string} input.prdFile - PRD.md 路径
   * @returns {Promise<boolean>} 是否可测试
   */
  async checkAcceptanceCriteriaTestability(input) {
    try {
      const prdContent = this.readFile(input.prdFile || '01_designing/PRD.md');

      // 检查是否包含 Given/When/Then
      const hasGiven = prdContent.includes('Given') || prdContent.includes('前置条件');
      const hasWhen = prdContent.includes('When') || prdContent.includes('触发条件');
      const hasThen = prdContent.includes('Then') || prdContent.includes('预期结果');

      const issues = [];
      
      if (!hasGiven) {
        issues.push('缺少 Given（前置条件）');
      }
      if (!hasWhen) {
        issues.push('缺少 When（触发条件）');
      }
      if (!hasThen) {
        issues.push('缺少 Then（预期结果）');
      }

      if (issues.length > 0) {
        console.log(`[Review-Design D7] 验收标准可测试性问题:`, issues);
        return false;
      }

      console.log(`[Review-Design D7] ✅ 验收标准包含 Given/When/Then 格式`);
      return true;
      
    } catch (error) {
      console.error(`[Review-Design D7] 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * AI 辅助检查：技术选型（D4）
   * 
   * 评估技术选型合理性：
   * - 是否有候选技术比较表
   * - 是否有决策依据
   * - 是否有风险评估
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, score: number, suggestions: string[]}>}
   */
  async runAICheckpoint(checkpoint, input) {
    if (checkpoint.id === 'D4') {
      return this.aiCheckTechnologySelection(input);
    }
    
    if (checkpoint.id === 'D6') {
      return this.aiCheckExceptionHandling(input);
    }

    return { passed: true, score: 10, suggestions: [] };
  }

  /**
   * D4 AI 检查：技术选型合理性评估
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, score: number, suggestions: string[]}>}
   */
  async aiCheckTechnologySelection(input) {
    try {
      const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
      const suggestions = [];
      let score = 10;

      console.log(`[Review-Design D4] ===== 开始技术选型 AI 检查 =====`);

      // 1. 检查候选技术比较表（权重 4 分）
      const hasComparisonTable = this.hasComparisonTable(trdContent);
      if (!hasComparisonTable.exists) {
        score -= 4;
        suggestions.push('缺少候选技术比较表，建议添加技术方案对比（包含优缺点、适用场景、评分）');
      } else {
        console.log(`[Review-Design D4] ✅ 候选技术比较表存在`);
      }

      // 2. 检查决策依据（权重 3 分）
      const hasDecision = trdContent.includes('决策') || 
                         trdContent.includes('理由') ||
                         trdContent.includes('原因') ||
                         trdContent.includes('选择') ||
                         trdContent.includes('最终选择');
      
      if (!hasDecision) {
        score -= 3;
        suggestions.push('缺少技术选型决策依据，建议说明为什么选择该方案');
      } else {
        console.log(`[Review-Design D4] ✅ 决策依据存在`);
      }

      // 3. 检查风险评估（权重 3 分）
      const hasRiskAssessment = trdContent.includes('风险') || 
                               trdContent.includes('评估') ||
                               trdContent.includes(' mitigat') ||
                               trdContent.includes('缓解');
      
      if (!hasRiskAssessment) {
        score -= 3;
        suggestions.push('缺少风险评估，建议补充技术选型的潜在风险和缓解措施');
      } else {
        console.log(`[Review-Design D4] ✅ 风险评估存在`);
      }

      const passed = score >= 6; // 60 分及格
      
      console.log(`[Review-Design D4] 技术选型评分：${score}/10 ${passed ? '✅ 通过' : '❌ 不通过'}`);
      if (suggestions.length > 0) {
        console.log(`[Review-Design D4] 改进建议:`, suggestions);
      }

      return { passed, score, suggestions };
      
    } catch (error) {
      console.error(`[Review-Design D4] AI 检查失败:`, error.message);
      return { passed: false, score: 0, suggestions: ['AI 检查执行失败'] };
    }
  }

  /**
   * D6 AI 检查：异常处理完整性评估
   * 
   * 评估异常处理完整性：
   * - 正常流程
   * - 失败处理
   * - 边界情况
   * - 重试机制
   * 
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, score: number, suggestions: string[]}>}
   */
  async aiCheckExceptionHandling(input) {
    try {
      const trdContent = this.readFile(input.trdFile || '01_designing/TRD.md');
      const suggestions = [];
      let score = 10;

      console.log(`[Review-Design D6] ===== 开始异常处理 AI 检查 =====`);

      // 1. 检查正常流程（权重 2 分）
      const hasNormalFlow = trdContent.includes('正常流程') || 
                           trdContent.includes('正常情况') ||
                           trdContent.includes('Happy Path') ||
                           trdContent.includes('主流程');
      
      if (!hasNormalFlow) {
        score -= 2;
        suggestions.push('缺少正常流程说明，建议描述系统正常工作情况');
      } else {
        console.log(`[Review-Design D6] ✅ 正常流程存在`);
      }

      // 2. 检查失败处理（权重 3 分）
      const hasFailureHandling = trdContent.includes('失败处理') || 
                                trdContent.includes('异常处理') ||
                                trdContent.includes('错误处理') ||
                                trdContent.includes('失败') ||
                                trdContent.includes('异常');
      
      if (!hasFailureHandling) {
        score -= 3;
        suggestions.push('缺少失败处理说明，建议补充异常和错误处理策略');
      } else {
        console.log(`[Review-Design D6] ✅ 失败处理存在`);
      }

      // 3. 检查边界情况（权重 3 分）
      const hasBoundaryHandling = trdContent.includes('边界') || 
                                 trdContent.includes('极限') ||
                                 trdContent.includes('最大') ||
                                 trdContent.includes('最小') ||
                                 trdContent.includes('边界情况');
      
      if (!hasBoundaryHandling) {
        score -= 3;
        suggestions.push('缺少边界情况处理，建议补充极端输入和边界场景的处理');
      } else {
        console.log(`[Review-Design D6] ✅ 边界情况存在`);
      }

      // 4. 检查重试机制（权重 2 分）
      const hasRetryMechanism = trdContent.includes('重试') || 
                               trdContent.includes('Retry') ||
                               trdContent.includes('退避') ||
                               trdContent.includes('重试次数') ||
                               trdContent.includes('重试间隔');
      
      if (!hasRetryMechanism) {
        score -= 2;
        suggestions.push('缺少重试机制说明，建议补充重试策略（次数、间隔、退避算法）');
      } else {
        console.log(`[Review-Design D6] ✅ 重试机制存在`);
      }

      const passed = score >= 6; // 60 分及格
      
      console.log(`[Review-Design D6] 异常处理评分：${score}/10 ${passed ? '✅ 通过' : '❌ 不通过'}`);
      if (suggestions.length > 0) {
        console.log(`[Review-Design D6] 改进建议:`, suggestions);
      }

      return { passed, score, suggestions };
      
    } catch (error) {
      console.error(`[Review-Design D6] AI 检查失败:`, error.message);
      return { passed: false, score: 0, suggestions: ['AI 检查执行失败'] };
    }
  }

  /**
   * 辅助方法：检查是否有比较表
   * 
   * @param {string} content - TRD.md 内容
   * @returns {{exists: boolean, quality: 'good' | 'fair' | 'poor'}}
   * @private
   */
  hasComparisonTable(content) {
    // 检查 Markdown 表格格式
    const hasTable = content.includes('|') && 
                    content.includes('---') &&
                    (content.includes('方案') || content.includes('技术') || content.includes('对比'));
    
    if (!hasTable) {
      return { exists: false, quality: 'poor' };
    }

    // 检查表格质量（是否包含多维度比较）
    const hasPros = content.includes('优点') || content.includes('优势');
    const hasCons = content.includes('缺点') || content.includes('劣势');
    const hasScore = content.includes('评分') || content.includes('分数');

    if (hasPros && hasCons && hasScore) {
      return { exists: true, quality: 'good' };
    } else if (hasPros || hasCons) {
      return { exists: true, quality: 'fair' };
    } else {
      return { exists: true, quality: 'poor' };
    }
  }

  /**
   * 辅助方法：提取带 ID 的需求项
   * 
   * 支持格式：
   * - REQ-XXX-001: 需求描述
   * - **REQ-XXX-001**: 需求描述
   * - 需求 ID: REQ-XXX-001
   * 
   * @param {string} content - REQUIREMENTS.md 内容
   * @returns {Array<{id: string, description: string, line: number}>} 需求列表
   * @private
   */
  extractRequirementsWithIds(content) {
    const requirements = [];
    const lines = content.split('\n');
    
    // 模式 1: REQ-001 或 REQ-XXX-001 格式
    const reqIdPattern = /REQ-(?:[A-Z]+-)?\d+/gi;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(reqIdPattern);
      
      if (match) {
        const id = match[0].toUpperCase();
        // 提取需求描述（ID 后面的内容）
        const descriptionMatch = line.match(/REQ-(?:[A-Z]+-)?\d+[:：\s]+(.+)/i);
        const description = descriptionMatch ? descriptionMatch[1].trim() : line;
        
        requirements.push({
          id,
          description,
          line: i + 1
        });
      }
    }

    // 如果没有找到带 ID 的需求，回退到普通提取
    if (requirements.length === 0) {
      return this.extractRequirements(content);
    }

    console.log(`[Review-Design] 提取到 ${requirements.length} 条带 ID 的需求`);
    return requirements;
  }

  /**
   * 辅助方法：提取需求项（旧版兼容）
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

  /**
   * 辅助方法：检测模糊词
   * 
   * @param {string} content - 文档内容
   * @returns {string[]} 模糊词列表
   * @private
   */
  detectVagueWords(content) {
    const vaguePatterns = [
      '适当的',
      '一些',
      '可能',
      '大概',
      '也许',
      '基本上',
      '通常',
      '一般',
      '较好',
      '适当',
      '合理',
      '等等',
      '相关',
      '某些'
    ];

    const found = [];
    for (const pattern of vaguePatterns) {
      if (content.includes(pattern)) {
        found.push(pattern);
      }
    }

    return found;
  }
}

module.exports = ReviewDesignAgent;
