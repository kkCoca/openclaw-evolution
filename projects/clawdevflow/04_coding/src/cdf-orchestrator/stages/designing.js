/**
 * Designing 阶段执行器（Actions 模式）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');

/**
 * 执行 Designing 阶段
 * @param {object} aiTool - AI 工具实例
 * @param {object} stateManager - 状态管理器
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array, error?: string}>}
 */
async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Designing] 开始执行阶段：DESIGNING');
  
  const config = input.config;
  const stageConfig = config.stages.designing;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  // 生成任务文本（包含硬约束模板）
  const taskText = `
# 任务：Designing 阶段 - 需求分析与产品设计

## 输入
- 需求文件：${input.requirementsFile || 'REQUIREMENTS.md'}

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件
${input.regenerateHint ? `如果提供了 regenerateHint，你必须逐条修复：${input.regenerateHint}` : ''}

## 任务内容
1. 阅读需求文件，理解需求目标、约束条件、验收标准
2. 生成 PRD.md（产品需求文档）：目标、范围、用户故事、验收标准
3. 生成 TRD.md（技术设计文档）：架构设计、技术栈、接口定义、风险评估
`;

  // 调用 AI 工具运行阶段
  const result = await aiTool.runStage({
    config,
    stateManager,
    stageName: 'designing',
    projectPath,
    taskText,
    attempt: input.attempt || 1,
    regenerateHint: input.regenerateHint || ''
  });
  
  console.log('[Stage-Designing] ✅ 阶段完成');
  return result;
}

module.exports = { execute };