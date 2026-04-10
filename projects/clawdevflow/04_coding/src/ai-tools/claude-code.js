/**
 * Claude Code Runner - Claude Code 工具执行器
 *
 * ClawDevFlow (CDF) AI 工具适配器
 * 负责：执行 Claude Code CLI + 等待 outputs 扫描
 *
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { writeAction } = require('../utils/actions-writer');
const { scanOutputsAllOf } = require('../utils/output-scanner');
const { runCmd } = require('../utils/cmd');

function getToolConfig(config) {
  return config?.aiTools?.['claude-code'] || {};
}

function escapeTask(taskText) {
  return JSON.stringify(taskText);
}

function buildCommand({ toolConfig, taskText }) {
  const command = toolConfig.command || 'claude';
  const args = toolConfig.args || ['--print', '--permission-mode', 'bypassPermissions'];
  return `${command} ${args.join(' ')} ${escapeTask(taskText)}`;
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
 * 运行阶段（Claude Code CLI）
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
  console.log(`[Claude-Code] 开始运行阶段：${stageName}`);

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
  const command = buildCommand({ toolConfig, taskText });
  const commandLabel = `${toolConfig.command || 'claude'} ${toolConfig.args?.join(' ') || '--print --permission-mode bypassPermissions'}`;

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
    timeout: timeoutSeconds * 1000
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
