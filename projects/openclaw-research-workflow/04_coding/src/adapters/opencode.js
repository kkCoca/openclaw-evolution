/**
 * OpenCode 适配器
 * 
 * 调用 OpenCode 执行各阶段任务
 * 通过 OpenClaw 的 sessions_spawn API 创建子会话
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const { AIToolAdapter, ExecutionResult } = require('./ai-tool-adapter');

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
    this.log('开始执行阶段任务', { stage: stageName });

    try {
      // 构建任务描述
      const task = this.buildTask(stageName, input);

      // 调用 OpenCode（通过 sessions_spawn）
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
      designing: `执行 designing skill，分析需求并生成 PRD.md 和 TRD.md 文档`,
      roadmapping: `执行 roadmapping skill，根据设计文档生成开发计划 ROADMAP.md`,
      detailing: `执行 detailing skill，生成文件级详细执行方案 DETAIL.md`,
      coding: `执行 coding skill，按照详细设计实现生产级代码`,
      reviewing: `执行 reviewing skill，审查所有产出并生成验收报告`
    };

    const task = stageTasks[stageName] || `执行 ${stageName} 阶段任务`;
    
    // 添加输入信息
    const inputInfo = JSON.stringify(input, null, 2);
    
    return `${task}\n\n输入信息：\n${inputInfo}`;
  }

  /**
   * Spawn 子会话
   * @param {string} task - 任务描述
   * @returns {Promise<object>} 会话信息
   * 
   * 注意：实际使用时需要导入 OpenClaw 的 sessions_spawn API
   * 这里提供接口定义，具体实现依赖 OpenClaw 运行时环境
   */
  async spawnSession(task) {
    // TODO: 导入并调用 OpenClaw API
    // const { sessions_spawn } = require('@openclaw/api');
    
    const session = await sessions_spawn({
      task: task,
      runtime: "subagent",
      mode: "run",
      timeoutSeconds: this.config.timeoutSeconds || 1800
    });
    
    return session;
  }

  /**
   * 等待会话完成
   * @param {string} sessionId - 会话 ID
   * @returns {Promise<object>} 执行结果
   * 
   * 注意：实际使用时需要调用 OpenClaw API 轮询状态
   */
  async waitForCompletion(sessionId) {
    // TODO: 实现轮询逻辑或等待回调
    // const { process } = require('@openclaw/api');
    
    // 伪代码示例
    return {
      outputs: this.getExpectedOutputs(sessionId)
    };
  }

  /**
   * 获取预期输出（根据会话 ID 推断）
   * @param {string} sessionId - 会话 ID
   * @returns {string[]} 输出文件列表
   */
  getExpectedOutputs(sessionId) {
    // 简单实现：根据阶段返回预期输出
    // 实际应该从会话结果中解析
    return [];
  }

  /**
   * 验证配置
   * @returns {boolean} 配置是否有效
   */
  validateConfig() {
    // OpenCode 通过 OpenClaw 调用，通常总是可用
    return true;
  }
}

module.exports = {
  OpenCodeAdapter
};
