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

1. 阅读需求文件：${input.requirementsFile || 'REQUIREMENTS.md'}
2. 分析需求并生成 PRD.md 和 TRD.md 文档
3. 输出到目录：${input.outputDir || '01_designing'}

要求：
- PRD.md 包含完整的产品需求、用户故事、验收标准
- TRD.md 包含技术选型、架构设计、接口定义
- 所有描述必须具体可测试，禁止模糊术语
- 直接创建文件到指定目录`,

      roadmapping: `你是一个技术项目经理。请执行 roadmapping skill：

1. 阅读设计文档：${input.designingPath || '01_designing'}/PRD.md 和 TRD.md
2. 生成详细的开发计划 ROADMAP.md
3. 输出到目录：${input.outputDir || '02_roadmapping'}

要求：
- 任务拆分到可执行粒度
- 包含依赖关系和优先级
- 直接创建文件到指定目录`,

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
