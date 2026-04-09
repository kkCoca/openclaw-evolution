/**
 * OpenCode Runner - OpenCode 工具执行器
 * 
 * ClawDevFlow (CDF) AI 工具适配器
 * 负责：写 actions.json + 等待 outputs 扫描
 * 
 * 关键：不 exec，不调用 CLI，不调网络
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { writeAction } = require('../utils/actions-writer');
const { scanOutputsAllOf } = require('../utils/output-scanner');

/**
 * 运行阶段（写 action + 等待扫描）
 * 
 * @param {object} options - 执行选项
 * @param {object} options.config - 配置对象
 * @param {object} options.stateManager - 状态管理器
 * @param {string} options.stageName - 阶段名称
 * @param {string} options.projectPath - 项目路径
 * @param {string} options.taskText - 任务文本
 * @param {number} [options.attempt=1] - 尝试次数
 * @param {string} [options.regenerateHint=''] - 返工提示
 * @returns {Promise<{success: boolean, outputs: string[], error?: string}>}
 */
async function runStage({ config, stateManager, stageName, projectPath, taskText, attempt = 1, regenerateHint = '' }) {
  console.log(`[OpenCode] 开始运行阶段：${stageName}`);
  console.log(`[OpenCode]   项目路径：${projectPath}`);
  console.log(`[OpenCode]   尝试次数：${attempt}`);
  
  // 1. 从配置获取阶段参数
  const stageConfig = config.stages[stageName];
  if (!stageConfig) {
    throw new Error(`配置中未找到阶段：${stageName}`);
  }
  
  const {
    outputDir,
    outputsAllOf,
    timeoutSeconds = 1800
  } = stageConfig;
  
  console.log(`[OpenCode]   输出目录：${outputDir}`);
  console.log(`[OpenCode]   期望输出：${outputsAllOf.join(', ')}`);
  console.log(`[OpenCode]   超时时间：${timeoutSeconds}s`);
  
  // 2. 生成 action 对象
  const action = {
    workflowId: `cdf-${Date.now()}`,
    stage: stageName,
    actionId: `act-${Date.now().toString(36)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    timeoutSeconds,
    command: '/sessions_spawn opencode',
    task: taskText,
    projectPath,
    outputDir,
    expectedOutputs: outputsAllOf,
    attempt,
    regenerateHint
  };
  
  // 3. 写入 actions.json
  writeAction(projectPath, action);
  
  console.log('[OpenCode] ⏳ 等待输出文件生成...');
  console.log('[OpenCode] 提示：请手动创建合同文件，或由宿主执行 /sessions_spawn opencode');
  
  // 4. 等待输出扫描（轮询）
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  const pollIntervalMs = 2000; // 2 秒轮询一次
  
  while (true) {
    // 扫描输出
    const result = scanOutputsAllOf({ projectPath, outputDir, outputsAllOf });
    
    if (result.ok) {
      // 成功：返回输出文件列表
      console.log(`[OpenCode] ✅ 阶段完成：${stageName}`);
      return {
        success: true,
        outputs: result.found.map(f => `${outputDir}/${f}`)
      };
    }
    
    // 检查超时
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      console.log(`[OpenCode] ❌ 超时：等待 ${timeoutSeconds}s 后仍未找到输出文件`);
      console.log(`[OpenCode]   缺失文件：${result.missing.join(', ')}`);
      return {
        success: false,
        outputs: [],
        error: `Timeout waiting outputs: ${result.missing.join(', ')}`
      };
    }
    
    // 等待下次轮询
    console.log(`[OpenCode] ⏳ 等待中... (${Math.floor(elapsed / 1000)}s / ${timeoutSeconds}s)`);
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

module.exports = {
  runStage
};