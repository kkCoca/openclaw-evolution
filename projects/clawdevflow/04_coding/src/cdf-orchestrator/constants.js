/**
 * CDF 常量定义
 * 
 * ClawDevFlow (CDF) 单一事实来源
 * 定义阶段序列、状态枚举等核心常量
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

/**
 * 阶段序列（单一事实来源）
 * 
 * 所有阶段相关的硬编码都应该从这里派生：
 * - StateManager.getCurrentStageIndex()
 * - StateManager.getReport().progress.total
 * - WorkflowOrchestrator.STAGE_SEQUENCE
 */
const STAGE_SEQUENCE = [
  'designing',
  'roadmapping',
  'detailing',
  'coding',
  'testing',
  'reviewing',
  'precommit',
  'releasing'
];

/**
 * 阶段总数
 */
const STAGE_COUNT = STAGE_SEQUENCE.length;

module.exports = {
  STAGE_SEQUENCE,
  STAGE_COUNT
};
