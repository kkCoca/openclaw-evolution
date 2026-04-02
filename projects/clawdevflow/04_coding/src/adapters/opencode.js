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

#### 审阅检查清单（10 项）
1. ✅ **任务拆分** - 任务是否按模块和前后端拆分？每个任务职责单一？
2. ✅ **工作量评估** - 单个任务是否 ≤ 2 人天？超过的是否已拆分？
3. ✅ **收尾项** - 是否包含联调测试（0.5 人天）和演示项（0.5 人天）？
4. ✅ **任务命名** - 是否使用固定格式 \`【任务简称】(前端/后端) 任务简述\`？
5. ✅ **描述规范** - 是否只描述"做什么"，不涉及"怎么做"？
6. ✅ **需求覆盖** - 是否覆盖 PRD.md 中的所有功能？有无遗漏？
7. ✅ **技术对齐** - 是否与 TRD.md 的技术选型一致？有无冲突？
8. ✅ **代码现状** - 增量需求是否包含代码现状章节？
9. ✅ **风险评估** - 是否识别了至少 3 项主要风险？
10. ✅ **不确定性标注** - 不确定的任务是否标注了原因和范围估算？

#### 审阅评分
- **10/10** - 所有检查项符合标准 → 直接通过
- **8-9/10** - 1-2 项小问题 → 修正后通过
- **<8/10** - 3 项及以上问题 → 重新生成

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

如果执行过修正，同时写入 \`${input.outputDir || '02_roadmapping'}/SELF-REVIEW.md\` 记录审阅过程。

## 要求
- **禁止用户交互**：不询问、不确认、不评审
- **必须自审阅**：生成后必须执行 10 项检查清单
- **任务拆分**：按模块和前后端拆分，单个任务不超过 2 人天
- **工作量评估**：基于文档和代码分析，不确定时标注说明
- **必须包含**：联调测试项（各 0.5 人天）+ 演示项（0.5 人天）
- **直接创建文件**：输出到指定目录，不等待确认`,

      detailing: `你是一个系统架构师。请执行 detailing skill：

1. 阅读设计文档和开发计划
2. 生成文件级详细执行方案 DETAIL.md
3. 输出到目录：${input.outputDir || '03_detailing'}

要求：
- 包含每个模块的详细设计
- 包含数据结构和接口定义
- 直接创建文件到指定目录`,

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
