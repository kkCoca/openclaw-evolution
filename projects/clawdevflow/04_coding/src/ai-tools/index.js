/**
 * AI Tools Index - AI 工具工厂
 * 
 * ClawDevFlow (CDF) AI 工具适配器工厂
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { ToolType } = require('./types');
const opencode = require('./opencode');
const claudeCode = require('./claude-code');
const custom = require('./custom');

/**
 * 从配置创建 AI 工具实例
 * 
 * @param {object} config - 配置对象
 * @param {string} stageName - 阶段名称
 * @returns {object} AI 工具实例
 */
function fromConfig(config, stageName) {
  const stageConfig = config.stages?.[stageName];
  if (!stageConfig) {
    throw new Error(`配置中未找到阶段：${stageName}`);
  }

  const aiTool = stageConfig.aiTool || config.global?.defaultAITool || ToolType.OPENCODE;

  if (aiTool === ToolType.OPENCODE) {
    return opencode;
  }

  if (aiTool === ToolType.CLAUDE_CODE) {
    return claudeCode;
  }

  if (aiTool === ToolType.CUSTOM) {
    return custom;
  }

  throw new Error(`不支持的 AI 工具：${aiTool}，支持：opencode | claude-code | custom`);
}

module.exports = {
  fromConfig,
  ToolType
};
