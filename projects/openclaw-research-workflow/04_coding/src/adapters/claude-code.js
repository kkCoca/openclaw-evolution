/**
 * Claude Code 适配器
 * 
 * 调用 Claude Code CLI 执行各阶段任务
 * 通过命令行方式调用，支持完整的权限模式
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const { AIToolAdapter, ExecutionResult } = require('./ai-tool-adapter');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ClaudeCodeAdapter extends AIToolAdapter {
  /**
   * 获取工具类型
   * @returns {string} 工具类型
   */
  getType() {
    return 'claude-code';
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
        timeout: this.config.timeoutSeconds * 1000 || 1800000, // 默认 30 分钟
        maxBuffer: 10 * 1024 * 1024, // 10MB
        cwd: this.config.cwd || process.cwd()
      });

      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration });

      // 解析输出，提取生成的文件
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
    const escapedTask = task
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\$/g, '\\$');

    return `claude ${args.join(' ')} "${escapedTask}"`;
  }

  /**
   * 解析输出，提取生成的文件
   * @param {string} stdout - 标准输出
   * @param {string} stageName - 阶段名称
   * @returns {string[]} 输出文件列表
   */
  parseOutputs(stdout, stageName) {
    // 根据阶段返回预期输出
    const expectedOutputs = {
      designing: ['01_designing/PRD.md', '01_designing/TRD.md'],
      roadmapping: ['02_roadmapping/ROADMAP.md'],
      detailing: ['03_detailing/DETAIL.md'],
      coding: ['04_coding/src/', '04_coding/tests/', '04_coding/README.md'],
      reviewing: ['05_reviewing/REVIEW-REPORT.md']
    };

    // 简单实现：返回预期输出
    // 实际可以解析 stdout 中的文件路径
    return expectedOutputs[stageName] || [];
  }

  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    const stageTasks = {
      designing: `作为产品设计专家，分析用户需求并生成 PRD.md 和 TRD.md 文档。要求：需求覆盖率 100%，无模糊描述，技术选型合理。`,
      roadmapping: `作为技术项目经理，根据设计文档生成详细的开发计划 ROADMAP.md。要求：任务拆分合理（0.5-2 人天），依赖关系清晰，包含联调测试和演示项。`,
      detailing: `作为系统架构师，生成文件级的详细执行方案 DETAIL.md。要求：文件级设计完整，接口定义清晰，无实现代码，符合最佳实践。`,
      coding: `作为资深开发工程师，按照详细设计实现生产级代码。要求：功能完整实现，类型安全，测试覆盖核心逻辑，无重复代码，边界处理完整。`,
      reviewing: `作为质量保障专家，审查所有产出并生成验收报告 REVIEW-REPORT.md。要求：需求对齐验证，架构一致性检查，代码质量审查，问题清单完整。`
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
  async validateConfig() {
    try {
      // 检查 claude 命令是否可用
      await execAsync('which claude');
      return true;
    } catch {
      console.error('Claude Code 未安装或不在 PATH 中');
      return false;
    }
  }

  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      tool: 'claude-code',
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }
}

module.exports = {
  ClaudeCodeAdapter
};
