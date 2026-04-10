/**
 * OpenCode Runner - OpenCode 工具执行器
 * 
 * ClawDevFlow (CDF) AI 工具适配器
 * 负责：spawn opencode CLI + 扫描 outputs
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { spawn } = require('child_process');
const { scanOutputsAllOf } = require('../utils/output-scanner');

/**
 * 运行阶段（spawn opencode + 扫描产物）
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
  
  console.log(`[OpenCode]   输出目录：${outputDir}`);
  console.log(`[OpenCode]   期望输出：${outputsAllOf.join(', ')}`);
  console.log(`[OpenCode]   超时时间：${timeoutSeconds}s`);
  
  const openclawConfig = config.openclaw || {};
  const command = openclawConfig.command || 'opencode';
  const baseArgs = Array.isArray(openclawConfig.args) ? openclawConfig.args : [];
  const taskArg = typeof openclawConfig.taskArg === 'string' ? openclawConfig.taskArg : '--task';
  const args = [...baseArgs, taskArg, taskText];
  const timeoutMs = timeoutSeconds * 1000;
  const commandPreview = [command, ...baseArgs, taskArg, `<task:${taskText.length} chars>`]
    .filter(Boolean)
    .join(' ');
  const taskPreview = taskText.replace(/\s+/g, ' ').slice(0, 120);
  
  console.log(`[OpenCode]   CLI 命令：${commandPreview}`);
  console.log(`[OpenCode]   任务预览：${taskPreview}${taskText.length > 120 ? '...' : ''}`);
  
  const execution = await new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: projectPath,
      env: {
        ...process.env,
        CDF_WORKFLOW_ID: workflowId,
        CDF_STAGE: stageName,
        CDF_ATTEMPT: String(attempt)
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2000);
    }, timeoutMs);
    
    child.stdout?.on('data', data => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', data => {
      stderr += data.toString();
    });
    
    child.on('error', error => {
      clearTimeout(timeout);
      resolve({
        ok: false,
        code: error.code === 'ENOENT' ? 127 : (error.code || 'SPAWN_ERROR'),
        stderr: error.message
      });
    });
    
    child.on('close', code => {
      clearTimeout(timeout);
      resolve({
        ok: !timedOut && code === 0,
        code: timedOut ? 124 : code,
        stdout,
        stderr
      });
    });
  });
  
  if (!execution.ok) {
    const errorCode = execution.code ?? 'UNKNOWN';
    const errorDetail = execution.stderr ? execution.stderr.trim() : 'opencode 执行失败';
    console.log(`[OpenCode] ❌ CLI 执行失败 (code=${errorCode})`);
    return {
      success: false,
      outputs: [],
      error: `OpenCode exit ${errorCode}: ${errorDetail}`
    };
  }
  
  const result = scanOutputsAllOf({ projectPath, outputDir, outputsAllOf });
  
  if (!result.ok) {
    console.log(`[OpenCode] ❌ 产物不完整，缺失文件：${result.missing.join(', ')}`);
    return {
      success: false,
      outputs: [],
      error: `Missing outputs: ${result.missing.join(', ')}`
    };
  }
  
  console.log(`[OpenCode] ✅ 阶段完成：${stageName}`);
  return {
    success: true,
    outputs: result.found.map(f => `${outputDir}/${f}`)
  };
}

module.exports = {
  runStage
};
