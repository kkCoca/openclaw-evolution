/**
 * Coding 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Coding] 开始执行阶段：CODING');
  
  const config = input.config;
  const stageConfig = config.stages.coding;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Coding 阶段 - 代码实现

## 输入
- DETAIL：${projectPath}/03_detailing/DETAIL.md
- PROJECT_MANIFEST：${projectPath}/PROJECT_MANIFEST.json

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/src/
你必须生成以下目录（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件
${input.regenerateHint ? `修复：${input.regenerateHint}` : ''}

## 任务内容
1. 阅读 DETAIL.md，理解任务分解
2. 实现代码，写入 src/ 目录
3. 创建 CHANGESET.md：变更说明、运行命令
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'coding', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };