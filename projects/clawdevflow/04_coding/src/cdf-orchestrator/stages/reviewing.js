/**
 * Reviewing 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Reviewing] 开始执行阶段：REVIEWING');
  
  const config = input.config;
  const stageConfig = config.stages.reviewing;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Reviewing 阶段 - 代码审阅

## 输入
- 全部阶段产出：${projectPath}/01_designing/ ~ ${projectPath}/06_testing/

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件
必须遵循 ~/.openclaw/workspace/AGENTS.md（Plan-and-Execute），禁止使用 write 指令做局部修改

## 任务内容
1. 审阅全部阶段产出
2. 生成 REVIEW-REPORT.md：审阅结论、问题列表、改进建议
3. 检查测试覆盖率、代码质量、文档完整性
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'reviewing', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };
