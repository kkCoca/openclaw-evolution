/**
 * AI 工具适配器 (AI Tool Adapter)
 * 
 * 提供统一的 AI 工具调用接口，支持 OpenCode/Claude Code/Custom 工具
 * 流程引擎通过此接口调用 AI 工具执行各阶段任务
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 工具类型枚举
const ToolType = {
  OPENCODE: 'opencode',
  CLAUDE_CODE: 'claude-code',
  CUSTOM: 'custom'
};

// 执行结果结构
class ExecutionResult {
  constructor({ success, outputs, error, sessionId, duration }) {
    this.success = success;
    this.outputs = outputs || [];
    this.error = error || null;
    this.sessionId = sessionId || null;
    this.duration = duration || 0;
  }
}

/**
 * AI 工具适配器基类
 */
class AIToolAdapter {
  /**
   * 构造函数
   * @param {object} config - 工具配置
   */
  constructor(config) {
    if (new.target === AIToolAdapter) {
      throw new Error('AIToolAdapter 是抽象类，不能直接实例化');
    }
    this.config = config;
    this.type = this.getType();
  }

  /**
   * 获取工具类型（子类实现）
   * @returns {string} 工具类型
   */
  getType() {
    throw new Error('子类必须实现 getType 方法');
  }

  /**
   * 执行阶段任务（子类实现）
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    throw new Error('子类必须实现 execute 方法');
  }

  /**
   * 构建任务描述（子类实现）
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    throw new Error('子类必须实现 buildTask 方法');
  }

  /**
   * 验证配置（子类可实现）
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    return true;
  }

  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.type}] ${message}`, JSON.stringify(data));
  }
}

/**
 * OpenCode 适配器
 */
class OpenCodeAdapter extends AIToolAdapter {
  getType() {
    return ToolType.OPENCODE;
  }

  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    const startTime = Date.now();
    this.log('开始执行阶段任务', { stage: stageName });

    try {
      // 构建任务描述
      const task = this.buildTask(stageName, input);

      // 调用 OpenCode（通过 sessions_spawn）
      // 注意：实际使用时需要通过 OpenClaw 的 sessions_spawn API
      // 这里提供伪代码示例
      const session = await this.spawnSession(task);

      // 等待完成
      const result = await this.waitForCompletion(session.id);

      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration });

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
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    const stageTasks = {
      designing: `执行 designing skill，分析需求并生成 PRD.md 和 TRD.md`,
      roadmapping: `执行 roadmapping skill，根据设计文档生成开发计划`,
      detailing: `执行 detailing skill，生成文件级执行方案`,
      coding: `执行 coding skill，按照详细设计实现代码`,
      reviewing: `执行 reviewing skill，审查所有产出并生成验收报告`
    };

    const task = stageTasks[stageName] || `执行 ${stageName} 阶段任务`;
    
    // 添加输入信息
    const inputInfo = JSON.stringify(input, null, 2);
    
    return `${task}\n\n输入信息：\n${inputInfo}`;
  }

  /**
   * Spawn 子会话（伪代码，实际使用 OpenClaw API）
   * @param {string} task - 任务描述
   * @returns {Promise<object>} 会话信息
   */
  async spawnSession(task) {
    // 实际使用时调用 OpenClaw 的 sessions_spawn API
    // const session = await sessions_spawn({
    //   task: task,
    //   runtime: "subagent",
    //   mode: "run",
    //   timeoutSeconds: this.config.timeoutSeconds || 1800
    // });
    
    // 伪代码返回
    return {
      id: `session-${Date.now()}`,
      status: 'running'
    };
  }

  /**
   * 等待会话完成（伪代码）
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<object>} 执行结果
   */
  async waitForCompletion(sessionId) {
    // 实际使用时轮询会话状态或等待回调
    // const result = await waitForSessionCompletion(sessionId);
    
    // 伪代码返回
    return {
      outputs: []
    };
  }
}

/**
 * Claude Code 适配器
 */
class ClaudeCodeAdapter extends AIToolAdapter {
  getType() {
    return ToolType.CLAUDE_CODE;
  }

  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    const startTime = Date.now();
    this.log('开始执行阶段任务', { stage: stageName });

    try {
      // 构建任务描述
      const task = this.buildTask(stageName, input);

      // 调用 Claude Code（通过 CLI）
      const command = this.buildCommand(task);
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutSeconds * 1000 || 1800000,
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });

      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration });

      // 解析输出，提取生成的文件
      const outputs = this.parseOutputs(stdout);

      return new ExecutionResult({
        success: !stderr,
        outputs,
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
   * 构建 Claude Code 命令
   * @param {string} task - 任务描述
   * @returns {string} 命令行
   */
  buildCommand(task) {
    const args = this.config.args || [
      '--print',
      '--permission-mode',
      'bypassPermissions'
    ];

    // 转义任务描述中的特殊字符
    const escapedTask = task.replace(/"/g, '\\"').replace(/\n/g, '\\n');

    return `claude ${args.join(' ')} "${escapedTask}"`;
  }

  /**
   * 解析输出，提取生成的文件
   * @param {string} stdout - 标准输出
   * @returns {string[]} 输出文件列表
   */
  parseOutputs(stdout) {
    // 简单实现：搜索文件路径模式
    const filePattern = /[0-9a-z_/-]+\.(md|js|ts|json|yaml|yml)/gi;
    const matches = stdout.match(filePattern) || [];
    
    // 去重
    return [...new Set(matches)];
  }

  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    const stageTasks = {
      designing: `作为产品设计专家，分析用户需求并生成 PRD.md 和 TRD.md 文档`,
      roadmapping: `作为技术项目经理，根据设计文档生成详细的开发计划和 ROADMAP.md`,
      detailing: `作为系统架构师，生成文件级的详细执行方案 DETAIL.md`,
      coding: `作为资深开发工程师，按照详细设计实现生产级代码`,
      reviewing: `作为质量保障专家，审查所有产出并生成验收报告`
    };

    const task = stageTasks[stageName] || `执行 ${stageName} 阶段任务`;
    
    // 添加输入信息
    const inputInfo = JSON.stringify(input, null, 2);
    
    return `${task}\n\n输入信息：\n${inputInfo}`;
  }

  /**
   * 验证配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    // 检查 claude 命令是否可用
    try {
      execSync('which claude', { stdio: 'ignore' });
      return true;
    } catch {
      console.error('Claude Code 未安装或不在 PATH 中');
      return false;
    }
  }
}

/**
 * 自定义 AI 工具适配器
 */
class CustomAdapter extends AIToolAdapter {
  getType() {
    return ToolType.CUSTOM;
  }

  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    const startTime = Date.now();
    this.log('开始执行阶段任务', { stage: stageName });

    try {
      // 检查配置
      if (!this.config.command) {
        throw new Error('Custom 适配器未配置 command');
      }

      // 构建命令
      const command = this.buildCommand(stageName, input);

      // 执行自定义命令
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutSeconds * 1000 || 1800000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          ...this.config.env
        }
      });

      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration });

      // 解析输出
      const outputs = this.parseOutputs(stdout, stageName);

      return new ExecutionResult({
        success: !stderr,
        outputs,
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
   * 构建命令
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 命令行
   */
  buildCommand(stageName, input) {
    const command = this.config.command;
    const args = this.config.args || [];

    // 替换占位符
    let fullCommand = command;
    
    // 替换 {stage} 占位符
    fullCommand = fullCommand.replace('{stage}', stageName);
    
    // 替换 {input} 占位符（JSON 字符串）
    const inputJson = JSON.stringify(input).replace(/"/g, '\\"');
    fullCommand = fullCommand.replace('{input}', inputJson);
    
    // 添加额外参数
    if (args.length > 0) {
      fullCommand += ' ' + args.join(' ');
    }

    return fullCommand;
  }

  /**
   * 解析输出
   * @param {string} stdout - 标准输出
   * @param {string} stageName - 阶段名称
   * @returns {string[]} 输出文件列表
   */
  parseOutputs(stdout, stageName) {
    // 默认实现：根据阶段返回预期输出
    const expectedOutputs = {
      designing: ['01_designing/PRD.md', '01_designing/TRD.md'],
      roadmapping: ['02_roadmapping/ROADMAP.md'],
      detailing: ['03_detailing/DETAIL.md'],
      coding: ['04_coding/src/', '04_coding/tests/', '04_coding/README.md'],
      reviewing: ['05_reviewing/REVIEW-REPORT.md']
    };

    return expectedOutputs[stageName] || [];
  }

  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    return `执行 ${stageName} 阶段任务\n\n输入：${JSON.stringify(input)}`;
  }
}

/**
 * 适配器工厂
 */
class AdapterFactory {
  /**
   * 创建适配器实例
   * @param {string} toolType - 工具类型
   * @param {object} config - 工具配置
   * @returns {AIToolAdapter} 适配器实例
   */
  static create(toolType, config) {
    switch (toolType) {
      case ToolType.OPENCODE:
        return new OpenCodeAdapter(config);
      case ToolType.CLAUDE_CODE:
        return new ClaudeCodeAdapter(config);
      case ToolType.CUSTOM:
        return new CustomAdapter(config);
      default:
        throw new Error(`不支持的 AI 工具类型：${toolType}`);
    }
  }

  /**
   * 从配置创建适配器
   * @param {object} globalConfig - 全局配置
   * @param {string} stageName - 阶段名称
   * @returns {AIToolAdapter} 适配器实例
   */
  static fromConfig(globalConfig, stageName) {
    const stageConfig = globalConfig.stages?.[stageName] || {};
    const toolType = stageConfig.aiTool || globalConfig.global?.defaultAITool || ToolType.OPENCODE;
    const toolConfig = globalConfig.aiTools?.[toolType] || {};

    return this.create(toolType, toolConfig);
  }
}

// 导出
module.exports = {
  ToolType,
  ExecutionResult,
  AIToolAdapter,
  OpenCodeAdapter,
  ClaudeCodeAdapter,
  CustomAdapter,
  AdapterFactory
};
