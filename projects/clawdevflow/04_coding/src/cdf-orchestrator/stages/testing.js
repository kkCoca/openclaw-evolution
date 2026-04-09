/**
 * Testing 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Testing] 开始执行阶段：TESTING');
  
  const config = input.config;
  const stageConfig = config.stages.testing;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Testing 阶段 - 测试执行

## 输入
- 源代码：${projectPath}/04_coding/src/
- 配置：${projectPath}/PROJECT_MANIFEST.json

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件

## 任务内容
1. 运行测试命令（PROJECT_MANIFEST.json 中的 commands.test）
2. 运行验收命令（commands.verify）
3. 生成 TEST-REPORT.md：测试结果、覆盖率、问题列表
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'testing', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };