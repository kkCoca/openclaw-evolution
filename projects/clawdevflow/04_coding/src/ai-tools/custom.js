/**
 * Custom Runner - 自定义工具执行器
 *
 * ClawDevFlow (CDF) AI 工具适配器
 * 负责：执行自定义命令 + 等待 outputs 扫描
 *
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { writeAction } = require('../utils/actions-writer');
const { scanOutputsAllOf } = require('../utils/output-scanner');
const { runCmd } = require('../utils/cmd');

function getToolConfig(config) {
  return config?.aiTools?.custom || {};
}

function substituteTokens(value, tokens) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(tokens, key)) {
      return tokens[key];
    }
    return match;
  });
}

function buildCommand({ toolConfig, tokens }) {
  if (!toolConfig.command) {
    throw new Error('Custom 工具未配置 command');
  }
  const command = substituteTokens(toolConfig.command, tokens);
  const args = (toolConfig.args || []).map(arg => substituteTokens(arg, tokens));
  return [command, ...args].join(' ').trim();
}

async function waitForOutputs({ projectPath, outputDir, outputsAllOf, timeoutSeconds, startTime }) {
  const timeoutMs = timeoutSeconds * 1000;
  const pollIntervalMs = 2000;

  while (true) {
    const result = scanOutputsAllOf({ projectPath, outputDir, outputsAllOf });
    if (result.ok) {
      return {
        success: true,
        outputs: result.found.map(f => `${outputDir}/${f}`)
      };
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      return {
        success: false,
        outputs: [],
        error: `Timeout waiting outputs: ${result.missing.join(', ')}`
      };
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

/**
 * 运行阶段（自定义工具）
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
async function runStage({
  config,
  stateManager,
  stageName,
  projectPath,
  taskText,
  attempt = 1,
  regenerateHint = ''
}) {
  console.log(`[Custom-Tool] 开始运行阶段：${stageName}`);

  const workflowId = stateManager?.state?.workflowId;
  if (!workflowId) {
    throw new Error('Missing workflowId from stateManager');
  }

  const stageConfig = config.stages?.[stageName];
  if (!stageConfig) {
    throw new Error(`配置中未找到阶段：${stageName}`);
  }

  const outputsAllOf = stageConfig.outputsAllOf || stageConfig.outputs || [];
  const outputDir = stageConfig.outputDir;
  const toolConfig = getToolConfig(config);
  const timeoutSeconds = stageConfig.timeoutSeconds || toolConfig.timeoutSeconds || 1800;

  const tokens = {
    stage: stageName,
    task: JSON.stringify(taskText),
    projectPath,
    outputDir,
    attempt: String(attempt),
    regenerateHint: JSON.stringify(regenerateHint || '')
  };

  const command = buildCommand({ toolConfig, tokens });
  const commandLabel = toolConfig.command || 'custom';

  const action = {
    workflowId,
    stage: stageName,
    actionId: `act-${Date.now().toString(36)}`,
    status: 'running',
    createdAt: new Date().toISOString(),
    timeoutSeconds,
    command: commandLabel,
    task: taskText,
    projectPath,
    outputDir,
    expectedOutputs: outputsAllOf,
    attempt,
    regenerateHint
  };

  writeAction(projectPath, action);

  const startTime = Date.now();
  const result = await runCmd(command, {
    cwd: projectPath,
    timeout: timeoutSeconds * 1000,
    env: toolConfig.env
  });

  if (result.error) {
    action.status = 'failed';
    writeAction(projectPath, action);
    return {
      success: false,
      outputs: [],
      error: result.error
    };
  }

  const outputResult = await waitForOutputs({
    projectPath,
    outputDir,
    outputsAllOf,
    timeoutSeconds,
    startTime
  });

  action.status = outputResult.success ? 'done' : 'failed';
  writeAction(projectPath, action);
  return outputResult;
}

module.exports = {
  runStage
};
