/**
 * OpenCode 适配器
 * 
 * 调用 OpenCode 执行各阶段任务
 * 使用 OpenClaw 的 sessions_spawn API
 * 
 * @version 2.1.0
 * @author openclaw-ouyp
 */

const path = require('path');
const fs = require('fs');

const { AIToolAdapter, ExecutionResult } = require('../ai-tool-adapter');

class OpenCodeAdapter extends AIToolAdapter {
  /**
   * 获取工具类型
   * @returns {string} 工具类型
   */
  getType() {
    return 'opencode';
  }

  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    const startTime = Date.now();
    this.log('开始执行阶段任务', { stage: stageName, input });

    try {
      // 构建任务描述
      const task = this.buildTask(stageName, input);
      this.log('任务描述已构建', { taskLength: task.length });

      // 调用 OpenCode（通过 sessions_spawn）
      this.log('开始 spawn 子会话...');
      const session = await this.spawnSession(task, stageName);
      this.log('子会话已创建', { sessionId: session.id, sessionKey: session.sessionKey });

      // 等待完成
      this.log('等待会话完成...');
      const result = await this.waitForCompletion(session.sessionKey || session.id, stageName, input);
      
      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration, outputs: result.outputs });

      return new ExecutionResult({
        success: true,
        outputs: result.outputs,
        sessionId: session.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('阶段任务失败', { stage: stageName, error: error.message });

      return new ExecutionResult({
        success: false,
        error: error.message,
        duration
      });
    }
  }

  /**
   * Spawn 子会话
   * @param {string} task - 任务描述
   * @param {string} stageName - 阶段名称
   * @returns {Promise<object>} 会话信息
   */
  async spawnSession(task, stageName) {
    // 检查 sessions_spawn 是否可用（在 OpenClaw Agent 环境中是全局函数）
    if (typeof sessions_spawn === 'undefined') {
      throw new Error('sessions_spawn 不可用：请确保在 OpenClaw Agent 环境中运行（通过 /sessions_spawn clawdevflow 调用）');
    }
    
    // 调用 OpenClaw 的 sessions_spawn API
    const session = await sessions_spawn({
      task: task,
      runtime: "subagent",
      mode: "run",
      timeoutSeconds: this.config.timeoutSeconds || 1800,
      cleanup: "delete"
    });
    
    return session;
  }

  /**
   * 等待会话完成
   * @param {string} sessionKey - 会话 Key
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<{outputs: string[]}>} 执行结果
   */
  async waitForCompletion(sessionKey, stageName, input) {
    const maxWaitTime = (this.config.timeoutSeconds || 1800) * 1000;
    const pollInterval = 3000; // 3 秒轮询一次
    const startTime = Date.now();
    
    this.log('开始轮询会话状态', { sessionKey, pollInterval });
    
    // 轮询会话状态
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 检查输出文件是否生成
        const outputs = this.checkOutputs(stageName, input.outputDir);
        
        if (outputs.length > 0) {
          this.log('检测到输出文件', { outputs });
          return { outputs };
        }
        
        // 等待下一次轮询
        await this.sleep(pollInterval);
      } catch (error) {
        this.log('轮询出错', { error: error.message });
        await this.sleep(pollInterval);
      }
    }
    
    // 超时后最后一次检查
    const outputs = this.checkOutputs(stageName, input.outputDir);
    if (outputs.length > 0) {
      this.log('超时后检测到输出文件', { outputs });
      return { outputs };
    }
    
    this.log('等待超时，返回空输出');
    return { outputs: [] };
  }

  /**
   * 检查输出文件
   * @param {string} stageName - 阶段名称
   * @param {string} outputDir - 输出目录
   * @returns {string[]} 输出文件列表
   */
  checkOutputs(stageName, outputDir) {
    const outputs = [];
    
    try {
      if (!fs.existsSync(outputDir)) {
        this.log('输出目录不存在', { outputDir });
        return outputs;
      }
      
      // 阶段对应的预期输出文件
      const expectedFiles = {
        designing: ['PRD.md', 'TRD.md'],
        roadmapping: ['ROADMAP.md'],
        detailing: ['DETAIL.md'],
        coding: [], // 代码文件可能是多个
        reviewing: ['REVIEW-REPORT.md']
      };
      
      const files = expectedFiles[stageName] || [];
      
      // 检查预期文件
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        if (fs.existsSync(filePath)) {
          outputs.push(filePath);
          this.log('检测到输出文件', { file: filePath });
        }
      }
      
      // 特殊处理 coding 阶段
      if (stageName === 'coding') {
        const allFiles = fs.readdirSync(outputDir);
        for (const file of allFiles) {
          if (file.endsWith('.js') || file.endsWith('.ts')) {
            const filePath = path.join(outputDir, file);
            outputs.push(filePath);
            this.log('检测到代码文件', { file: filePath });
          }
        }
      }
    } catch (error) {
      this.log('检查输出文件失败', { error: error.message });
    }
    
    return outputs;
  }

  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    const stageTasks = {
      designing: `你是一个产品设计专家。请执行 designing skill：

## AI 工具配置
**重要**: 根据 config.yaml 配置选择 AI 工具，不要硬编码"OpenCode"
- 配置文件：04_coding/src/config.yaml
- 配置项：global.defaultAITool 或 stages.designing.aiTool
- 可选值：opencode / claude-code / custom

## 执行步骤
1. 阅读需求文件：${input.requirementsFile || 'REQUIREMENTS.md'}
2. 根据 config.yaml 配置选择 AI 工具（默认 opencode，可配置为 claude-code/custom）
3. 分析需求并生成 PRD.md 和 TRD.md 文档
4. 输出到目录：${input.outputDir || '01_designing'}

## 输出要求
- PRD.md 包含完整的产品需求、用户故事、验收标准
- TRD.md 包含技术选型、架构设计、接口定义
- **AI 工具描述**: 使用"根据 config.yaml 配置选择 AI 工具"，不要硬编码"OpenCode"
- 所有描述必须具体可测试，禁止模糊术语
- 直接创建文件到指定目录

## 示例（正确）
✅ "根据 config.yaml 配置选择 AI 工具（默认 opencode）"
✅ "使用 AI 工具执行 designing skill"

## 示例（错误）
❌ "使用 OpenCode 执行 designing skill"
❌ "OpenCode 分析需求并生成文档"
`,

      roadmapping: `你是一个技术项目经理。请执行 roadmapping skill（纯自动化模式 + 自审阅，无用户交互）：

## 输入
- 设计文档目录：${input.designingPath || '01_designing'}
  - PRD.md：产品需求文档
  - TRD.md：技术设计文档
- 项目路径：${input.projectPath || '项目根目录'}
- 输出目录：${input.outputDir || '02_roadmapping'}

## 执行步骤

### 步骤 1：阅读设计文档
1. 阅读 PRD.md，理解功能需求、业务边界、验收标准
2. 阅读 TRD.md，理解技术架构、模块划分、接口设计

### 步骤 2：分析代码现状（仅增量需求）
如果是增量需求（项目已有代码）：
1. 扫描项目目录结构
2. 识别核心模块、控制器、服务、模型等
3. 分析技术栈（package.json/requirements.txt）
4. 总结代码现状

如果是全新功能，跳过此步骤。

### 步骤 3：生成开发计划
按照以下模板生成 ROADMAP.md 初稿：

\`\`\`markdown
# 开发计划 - {项目名称}

## 需求概述
{基于 PRD.md 一句话描述需求目标}

## 代码现状（增量需求）
{简述现有代码结构、核心模块、技术栈}

## 开发计划

| 任务名称 | 详细描述 | 计划工作量 (人天) |
|----------|----------|------------------|
| 【任务 1】(后端)xxx | 1. 要点 1<br>2. 要点 2 | 1 |
| 【任务 1】(前端)xxx | 1. 要点 1<br>2. 要点 2 | 0.5 |
| ... | ... | ... |
| 【任务 1】(后端)联调测试 | 1. 后端接口联调<br>2. 功能测试 | 0.5 |
| 【任务 1】(前端)联调测试 | 1. 前端功能联调<br>2. 交互测试 | 0.5 |
| 【任务 1】演示 | 1. 功能演示准备<br>2. 演示环境验证 | 0.5 |
| **合计** | | **X** |

## 涉及模块
- 模块 1: 说明
- 模块 2: 说明

## 风险评估
| 风险项 | 可能性 | 影响 | 应对措施 |
|--------|--------|------|---------|
| {风险 1} | 高/中/低 | 高/中/低 | {应对措施} |
\`\`\`

### 步骤 4：自审阅（关键！）
生成初稿后，**必须**执行自审阅，逐项检查以下清单：

#### 审阅检查清单（12 项）

**Critical 项（一票否决）**：
- R0 ✅ **Freshness 对齐** - ROADMAP.md 是否包含 alignedTo + requirementsHash 字段？
- R1 ✅ **Traceability 需求引用** - ROADMAP 是否显式引用需求 ID（REQ-XXX）？覆盖率 100%？
- R2 ✅ **MVP 可交付性** - 是否包含 MVP/Phase 1/里程碑 1 段落（含 scope/验收/工作量）？
- R3 ✅ **依赖与风险** - ROADMAP 是否有 Dependencies 和 Risks 段落？

**Non-Critical 项（允许条件通过）**：
- R4 ⚠️ **范围膨胀风险** - 是否包含"可能/可选/未来"等关键词？有关键词时检查是否包含缓解措施（检测到关键词 + 无缓解措施时标注 warning；有关键词 + 有缓解措施时通过）
- 1 ✅ **任务拆分** - 任务是否按模块和前后端拆分？每个任务职责单一？
- 2 ✅ **工作量评估** - 单个任务是否 ≤ 2 人天？超过的是否已拆分？
- 3 ✅ **收尾项** - 是否包含联调测试（0.5 人天）和演示项（0.5 人天）？
- 4 ✅ **任务命名** - 是否使用固定格式 \`【任务简称】(前端/后端) 任务简述\`？
- 5 ✅ **描述规范** - 是否只描述"做什么"，不涉及"怎么做"？
- 7 ✅ **技术对齐** - 是否与 TRD.md 的技术选型一致？有无冲突？
- 8 ✅ **代码现状** - 增量需求是否包含代码现状章节？

#### 审阅评分

**评分规则**：
1. **检查 Critical 项（R0-R3）**：
   - 任一 Critical 项失败 → **驳回**（重新生成）
   - 全部 Critical 项通过 → 继续检查 Non-Critical 项

2. **检查 Non-Critical 项（R4 + 1-5, 7-8）**：
   - 全部通过 → **通过**（10/10）
   - 1-2 项失败 → **条件通过**（8-9/10，修正后输出）
   - 3 项及以上失败 → **驳回**（<8/10，重新生成）

**审阅决策**：
- **10/10** - 所有检查项符合标准 → 直接通过
- **8-9/10** - 1-2 项 Non-Critical 问题 → 修正后通过
- **<8/10 或 Critical 失败** - 3 项及以上问题或 Critical 项失败 → 重新生成

### 步骤 5：修正（如需要）
如果自审阅评分 <10 分：
1. 记录问题到 SELF-REVIEW.md
2. 修正 ROADMAP.md
3. 重新审阅（最多 3 次）

**修正示例**：
\`\`\`
问题：任务【用户管理】(后端) 工作量为 3 人天，超过 2 人天上限
修正：拆分为【用户管理】(后端) 用户 CRUD 接口（1.5 人天）+ 【用户管理】(后端) 权限控制接口（1 人天）
\`\`\`

### 步骤 6：写入文件
将最终的开发计划写入 \`${input.outputDir || '02_roadmapping'}/ROADMAP.md\`。

**SELF-REVIEW.md 生成逻辑**（v3.1.6 优化）：
- ✅ **Critical 项（R0-R3）全部通过** → 不生成 SELF-REVIEW.md
- ✅ **仅 Non-Critical 项失败** → 不生成 SELF-REVIEW.md（修正后直接输出）
- ⚠️ **Critical 项任一失败** → 生成 SELF-REVIEW.md（记录失败原因用于调试）

**优化理由**：符合"不生成额外文件"原则，减少文件冗余

## 要求
- **禁止用户交互**：不询问、不确认、不评审
- **必须自审阅**：生成后必须执行 12 项检查清单
- **R4 规则优化**：检测到"可能/可选/未来"关键词时，检查是否有缓解措施
- **任务拆分**：按模块和前后端拆分，单个任务不超过 2 人天
- **工作量评估**：基于文档和代码分析，不确定时标注说明
- **必须包含**：联调测试项（各 0.5 人天）+ 演示项（0.5 人天）
- **直接创建文件**：输出到指定目录，不等待确认`,

      detailing: `你是一个系统架构师。请执行 detailing skill（含自审阅）：

## 输入
- 设计文档目录：${input.designingPath || '01_designing'}
  - PRD.md：产品需求文档
  - TRD.md：技术设计文档
- 开发计划：${input.roadmapPath || '02_roadmapping'}/ROADMAP.md
- 需求文件：${input.requirementsFile || 'REQUIREMENTS.md'}
- 项目路径：${input.projectPath || '项目根目录'}
- 输出目录：${input.outputDir || '03_detailing'}

## 执行步骤

### 步骤 1：阅读设计文档和开发计划
1. 阅读 PRD.md，理解功能需求、业务边界、验收标准
2. 阅读 TRD.md，理解技术架构、模块划分、接口设计
3. 阅读 ROADMAP.md，理解开发计划和任务拆分
4. 阅读 REQUIREMENTS.md，理解完整需求列表

### 步骤 2：分析代码现状（仅增量需求）
如果是增量需求（项目已有代码）：
1. 扫描项目目录结构
2. 识别核心模块、控制器、服务、模型等
3. 分析技术栈（package.json/requirements.txt）
4. 总结代码现状

如果是全新功能，跳过此步骤。

### 步骤 3：生成详细设计方案
按照以下模板生成 DETAIL.md 初稿：

\`\`\`markdown
# 详细设计文档（DETAIL）- {项目名称}

## 文档元数据

| 字段 | 值 |
|------|-----|
| **DETAIL 版本** | v3.1.8 |
| **DETAIL 哈希** | sha256:待计算 |
| **alignedTo** | v3.1.8 |
| **requirementsHash** | sha256:f0e44912d5778703c30ce7921ceb25a81a454672 |
| **对齐 PRD 版本** | v3.1.8 |
| **对齐 PRD 哈希** | sha256:待计算 |
| **对齐 TRD 版本** | v3.1.8 |
| **对齐 TRD 哈希** | sha256:待计算 |
| **需求追溯矩阵** | 完整 |
| **覆盖率** | 100% |

## 1. 设计概述
### 1.1 设计目标
{基于 PRD.md 和 TRD.md 描述设计目标}

### 1.2 设计范围
{描述本详细设计覆盖的范围}

### 1.3 约束条件
{描述技术约束和业务约束}

## 2. 需求追溯矩阵
| 需求 ID | REQUIREMENTS.md 章节 | PRD 章节 | TRD 章节 | DETAIL 章节 | DETAIL 行号 | 实现状态 |
|---------|---------------------|---------|---------|------------|-----------|---------|
| REQ-001 | L13-43 | 2.2 | 1.1-1.2 | 3.1 | 50-70 | ✅ 已映射 |
| ... | ... | ... | ... | ... | ... | ... |

### 2.1 覆盖率统计
- **需求总数**: X
- **已映射需求**: X
- **覆盖率**: 100%
- **未映射需求**: 无

## 3. 架构设计
{系统架构图、模块划分}

## 4. 模块设计
{每个模块的详细设计}

## 5. 接口定义
{所有接口的完整定义：参数/返回值/错误码}

## 6. 数据结构
{数据结构的完整定义：字段/类型/约束}

## 7. 异常处理
{异常处理设计：正常流程/失败处理/边界情况}

## 8. 验收标准
### 8.1 Given
{前置条件}

### 8.2 When
{触发条件}

### 8.3 Then
{预期结果}
\`\`\`

### 步骤 4：自审阅（关键！）
生成初稿后，**必须**执行自审阅，逐项检查以下清单：

#### 审阅检查清单（10 项）

**Hard Gates（Critical 项，一票否决）**：
- HG1 ✅ **Freshness 对齐** - DETAIL.md 是否包含 alignedTo + requirementsHash 字段？哈希是否与 REQUIREMENTS.md 一致？
- HG2 ✅ **需求可追溯** - DETAIL 是否包含需求追溯矩阵？每个需求是否有可定位的映射（章节 + 行号）？覆盖率 100%？
- HG3 ✅ **验收可测试** - 验收标准是否包含 Given/When/Then 格式？无模糊术语？
- D0 ✅ **章节完整性** - 是否包含所有必需章节（设计概述/需求追溯/架构设计/模块设计/接口定义/数据结构/验收标准）？
- D2 ✅ **技术一致性** - 是否与 TRD.md 的技术选型一致？无冲突？

**Normal 项（允许条件通过）**：
- D3 ⚠️ **计划对齐** - DETAIL 任务是否与 ROADMAP.md 一致？无遗漏/无新增？
- D4 ⚠️ **接口定义完整性** - 所有接口是否有完整定义（参数/返回值/错误码）？
- D5 ⚠️ **数据结构设计** - 数据结构是否完整（字段/类型/约束）？
- D6 ⚠️ **异常处理** - 异常处理是否完整（正常/失败/边界）？
- D7 ⚠️ **向后兼容** - 增量需求时是否无破坏性变更？

#### 审阅评分

**评分规则**：
1. **检查 Hard Gates（HG1-HG3 + D0 + D2）**：
   - 任一 Critical 项失败 → **驳回**（重新生成）
   - 全部 Critical 项通过 → 继续检查 Normal 项

2. **检查 Normal 项（D3-D7）**：
   - 全部通过 → **通过**（10/10）
   - 1-2 项失败 → **条件通过**（8-9/10，修正后输出）
   - 3 项及以上失败 → **驳回**（<8/10，重新生成）

**审阅决策**：
- **10/10** - 所有检查项符合标准 → 直接通过
- **8-9/10** - 1-2 项 Normal 问题 → 修正后通过
- **<8/10 或 Critical 失败** - 3 项及以上问题或 Critical 项失败 → 重新生成

### 步骤 5：修正（如需要）
如果自审阅评分 <10 分：
1. 记录问题到 DETAIL-SELF-REVIEW.md（仅 Critical 失败时生成）
2. 修正 DETAIL.md
3. 重新审阅（最多 3 次）

**修正示例**：
\`\`\`
问题：HG2 需求可追溯 - REQ-013 缺少 DETAIL 章节映射
修正：在需求追溯矩阵中添加行：| REQ-013 | L780-900 | 18.1-18.6 | 15.1-15.4 | 505-600 | ✅ |

问题：HG3 验收可测试 - 缺少 Given/When/Then 格式
修正：将验收标准改写为：
  - Given 用户已登录
  - When 用户访问受保护资源
  - Then 返回资源内容
\`\`\`

### 步骤 6：写入文件
将最终的详细设计写入 \`${input.outputDir || '03_detailing'}/DETAIL.md\`。

**DETAIL-SELF-REVIEW.md 生成逻辑**（v3.1.8 优化）：
- ✅ **Critical 项（HG1-HG3, D0, D2）全部通过** → 不生成 SELF-REVIEW.md
- ✅ **仅 Normal 项失败** → 不生成 SELF-REVIEW.md（修正后直接输出）
- ⚠️ **Critical 项任一失败** → 生成 DETAIL-SELF-REVIEW.md（记录失败原因用于调试）

**优化理由**：符合"不生成额外文件"原则，减少文件冗余

## 要求
- **必须自审阅**：生成后必须执行 10 项检查清单
- **Hard Gates 一票否决**：HG1-HG3 任一失败则驳回重做
- **需求追溯矩阵**：必须包含章节和行号，可定位映射
- **验收标准**：必须使用 Given/When/Then 格式，无模糊术语
- **直接创建文件**：输出到指定目录，不等待确认`,

      coding: `你是一个资深开发工程师。请执行 coding skill：

1. 阅读详细设计方案
2. 按照设计实现生产级代码
3. 输出到目录：${input.outputDir || '04_coding/src'}

要求：
- 代码符合最佳实践
- 包含必要的注释
- 直接创建文件到指定目录`,

      reviewing: `你是一个质量保障专家。请执行 reviewing skill：

1. 审查所有产出文档和代码
2. 生成验收报告 REVIEW-REPORT.md
3. 输出到目录：${input.outputDir || '05_reviewing'}

要求：
- 检查需求覆盖率
- 检查代码质量
- 直接创建文件到指定目录`
    };

    const task = stageTasks[stageName] || `执行 ${stageName} 阶段任务`;
    
    // 添加输入信息
    const inputInfo = JSON.stringify(input, null, 2);
    
    return `${task}\n\n输入信息：\n${inputInfo}`;
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 日志记录
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.type}] ${message}`, JSON.stringify(data));
  }

  /**
   * 验证配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    return true;
  }
}

module.exports = {
  OpenCodeAdapter
};
