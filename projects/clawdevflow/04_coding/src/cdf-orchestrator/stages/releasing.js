/**
 * Releasing 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Releasing] 开始执行阶段：RELEASING');
  
  const config = input.config;
  const stageConfig = config.stages.releasing;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Releasing 阶段 - 发布准备

## 输入
- 审阅报告：${projectPath}/05_reviewing/REVIEW-REPORT.md
- 测试报告：${projectPath}/06_testing/TEST-REPORT.md

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件

## 任务内容
1. 确认审阅通过
2. 生成 RELEASE-NOTES.md：版本号、变更列表、升级说明
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'releasing', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };