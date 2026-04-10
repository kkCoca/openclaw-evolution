/**
 * Roadmapping 阶段执行器（Actions 模式）
 * 
 * @version 3.4.0
 */

const path = require('path');

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Roadmapping] 开始执行阶段：ROADMAPPING');
  
  const config = input.config;
  const stageConfig = config.stages.roadmapping;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Roadmapping 阶段 - 研发路线规划

## 输入
- PRD：${projectPath}/01_designing/PRD.md
- TRD：${projectPath}/01_designing/TRD.md

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件
必须遵循 ~/.openclaw/workspace/AGENTS.md（Plan-and-Execute），禁止使用 write 指令做局部修改
${input.regenerateHint ? `修复：${input.regenerateHint}` : ''}

## 任务内容
1. 阅读 PRD.md 和 TRD.md
2. 生成 ROADMAP.md：里程碑、任务分解、依赖关系、验收标准
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'roadmapping', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  console.log('[Stage-Roadmapping] ✅ 阶段完成');
  return result;
}

module.exports = { execute };
