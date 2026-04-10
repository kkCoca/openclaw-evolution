/**
 * Detailing 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Detailing] 开始执行阶段：DETAILING');
  
  const config = input.config;
  const stageConfig = config.stages.detailing;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Detailing 阶段 - 详细设计

## 输入
- PRD：${projectPath}/01_designing/PRD.md
- TRD：${projectPath}/01_designing/TRD.md
- ROADMAP：${projectPath}/02_roadmapping/ROADMAP.md

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件
必须遵循 ~/.openclaw/workspace/AGENTS.md（Plan-and-Execute），禁止使用 write 指令做局部修改
${input.regenerateHint ? `修复：${input.regenerateHint}` : ''}

## 任务内容
1. 阅读输入文件
2. 生成 DETAIL.md：接口设计、数据结构、测试方案、异常处理
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'detailing', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };
