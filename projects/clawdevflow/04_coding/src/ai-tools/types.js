/**
 * AI Tools Types - 类型定义
 * 
 * ClawDevFlow (CDF) AI 工具类型
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

/**
 * AI 工具类型枚举
 */
const ToolType = {
  OPENCODE: 'opencode'
};

/**
 * 执行结果结构
 * @typedef {object} ExecutionResult
 * @property {boolean} success - 是否成功
 * @property {string[]} outputs - 输出文件列表（相对项目路径）
 * @property {string} [error] - 错误信息
 * @property {object} [metadata] - 元数据
 */

module.exports = {
  ToolType
};