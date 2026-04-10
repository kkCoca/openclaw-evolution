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
const { runCmd } = require('../utils/cmd');

function getOpenclawConfig(config) {
  const openclawConfig = config?.openclaw || {};
  return {
    command: openclawConfig.command || '/sessions_spawn',
    spawnSkill: openclawConfig.defaultSpawnSkill || 'opencode',
    autoSpawn: openclawConfig.autoSpawn !== false
  };
}

function buildSpawnCommand({ command, spawnSkill, taskText }) {
  const escapedTask = JSON.stringify(taskText);
  return `${command} ${spawnSkill} --task ${escapedTask}`;
}

async function trySpawnSession({ config, taskText, timeoutSeconds, projectPath }) {
  const { command, spawnSkill, autoSpawn } = getOpenclawConfig(config);
  if (!autoSpawn) {
    return { started: false, reason: 'autoSpawn disabled' };
  }

  if (typeof sessions_spawn === 'function') {
    try {
      const session = await sessions_spawn({
        task: taskText,
        runtime: 'subagent',
        mode: 'run',
        timeoutSeconds,
        cleanup: 'delete'
      });
      return { started: true, method: 'api', session };
    } catch (error) {
      return { started: false, method: 'api', error: error.message };
    }
  }

  if (!command) {
    return { started: false, reason: 'missing command' };
  }

  const spawnCommand = buildSpawnCommand({ command, spawnSkill, taskText });
  const result = await runCmd(spawnCommand, {
    cwd: projectPath,
    timeout: timeoutSeconds * 1000
  });

  if (result.error) {
    return { started: false, method: 'cli', error: result.error };
  }

  return { started: true, method: 'cli', stdout: result.stdout };
}

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
  
  // P0-1 修复：workflowId 必须来自 stateManager，禁止每次生成新值
  const workflowId = stateManager?.state?.workflowId;
  if (!workflowId) {
    throw new Error('Missing workflowId from stateManager');
  }
  console.log(`[OpenCode]   工作流 ID：${workflowId}`);
  
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

  const openclawConfig = getOpenclawConfig(config);
  const commandLabel = `${openclawConfig.command} ${openclawConfig.spawnSkill}`;
  
  console.log(`[OpenCode]   输出目录：${outputDir}`);
  console.log(`[OpenCode]   期望输出：${outputsAllOf.join(', ')}`);
  console.log(`[OpenCode]   超时时间：${timeoutSeconds}s`);
  
  // 2. 生成 action 对象
  const action = {
    workflowId,  // P0-1 修复：使用 stateManager 的 workflowId
    stage: stageName,
    actionId: `act-${Date.now().toString(36)}`,
    status: 'pending',
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
  
  // 3. 写入 actions.json
  writeAction(projectPath, action);

  // 4. 尝试自动启动子会话（OpenClaw 环境）
  const spawnResult = await trySpawnSession({
    config,
    taskText,
    timeoutSeconds,
    projectPath
  });

  if (spawnResult.started) {
    action.status = 'running';
    writeAction(projectPath, action);
    console.log(`[OpenCode] ✅ 已触发子会话（${spawnResult.method}）`);
  } else if (spawnResult.error) {
    console.log(`[OpenCode] ⚠️ 自动触发失败，继续等待输出：${spawnResult.error}`);
  } else {
    console.log('[OpenCode] ⚠️ 未触发子会话，等待宿主执行 actions.json');
  }
  
  console.log('[OpenCode] ⏳ 等待输出文件生成...');
  
  // 4. 等待输出扫描（轮询）
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;
  const pollIntervalMs = 2000; // 2 秒轮询一次
  
  while (true) {
    // 扫描输出
    const result = scanOutputsAllOf({ projectPath, outputDir, outputsAllOf });
    
    if (result.ok) {
      // 成功：返回输出文件列表
      action.status = 'done';
      writeAction(projectPath, action);
      console.log(`[OpenCode] ✅ 阶段完成：${stageName}`);
      return {
        success: true,
        outputs: result.found.map(f => `${outputDir}/${f}`)
      };
    }
    
    // 检查超时
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      action.status = 'failed';
      writeAction(projectPath, action);
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
