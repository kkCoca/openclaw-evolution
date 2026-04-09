/**
 * Actions Writer - 动作协议写入器
 * 
 * ClawDevFlow (CDF) 工具模块
 * 负责写入 .cdf/actions.json 动作协议文件
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * 确保 .cdf 目录存在
 * @param {string} projectPath - 项目路径
 * @returns {string} .cdf 目录路径
 */
function ensureCdfDir(projectPath) {
  const cdfDir = path.join(projectPath, '.cdf');
  if (!fs.existsSync(cdfDir)) {
    fs.mkdirSync(cdfDir, { recursive: true });
  }
  return cdfDir;
}

/**
 * 写入 actions.json
 * 
 * @param {string} projectPath - 项目路径
 * @param {object} action - 动作对象
 * @param {string} action.workflowId - 工作流 ID
 * @param {string} action.stage - 阶段名称
 * @param {string} action.actionId - 动作 ID
 * @param {string} action.status - 状态（pending/running/done/failed）
 * @param {string} action.command - 命令（/sessions_spawn opencode）
 * @param {string} action.task - 任务文本
 * @param {string} action.projectPath - 项目路径
 * @param {string} action.outputDir - 输出目录
 * @param {string[]} action.expectedOutputs - 期望输出文件列表
 * @param {number} action.attempt - 尝试次数
 * @param {number} action.timeoutSeconds - 超时时间（秒）
 * @param {string} action.regenerateHint - 返工提示
 * @param {string} action.createdAt - 创建时间
 */
function writeAction(projectPath, action) {
  // 校验必需字段
  const requiredFields = [
    'workflowId', 'stage', 'actionId', 'status', 'command', 
    'task', 'projectPath', 'outputDir', 'expectedOutputs', 
    'attempt', 'timeoutSeconds', 'createdAt'
  ];
  
  for (const field of requiredFields) {
    if (action[field] === undefined) {
      throw new Error(`Action 缺少必需字段：${field}`);
    }
  }
  
  // 确保 .cdf 目录存在
  ensureCdfDir(projectPath);
  
  // 写入 actions.json
  const actionPath = path.join(projectPath, '.cdf', 'actions.json');
  fs.writeFileSync(actionPath, JSON.stringify(action, null, 2), 'utf8');
  
  console.log(`[Actions-Writer] ✅ 写入 actions.json: ${actionPath}`);
  console.log(`[Actions-Writer]   Stage: ${action.stage}`);
  console.log(`[Actions-Writer]   Status: ${action.status}`);
  console.log(`[Actions-Writer]   Attempt: ${action.attempt}`);
  
  return actionPath;
}

/**
 * 读取 actions.json
 * @param {string} projectPath - 项目路径
 * @returns {object|null} 动作对象，不存在则返回 null
 */
function readAction(projectPath) {
  const actionPath = path.join(projectPath, '.cdf', 'actions.json');
  if (!fs.existsSync(actionPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(actionPath, 'utf8'));
}

module.exports = {
  ensureCdfDir,
  writeAction,
  readAction
};