/**
 * Precommit 阶段执行器（Actions 模式）
 */

async function execute(aiTool, stateManager, projectPath, input) {
  console.log('[Stage-Precommit] 开始执行阶段：PRECOMMIT');
  
  const config = input.config;
  const stageConfig = config.stages.precommit;
  const outputDir = stageConfig.outputDir;
  const outputsAllOf = stageConfig.outputsAllOf;
  
  const taskText = `
# 任务：Precommit 阶段 - 提交前检查

## 输入
- 项目工作区：${projectPath}

## 输出要求
你必须把所有输出写入目录：${projectPath}/${outputDir}/
你必须生成以下文件（必须非空）：${outputsAllOf.join(', ')}
禁止在 ${projectPath} 根目录直接写文件

## 任务内容
1. 扫描敏感文件（.env, *.pem, *.key, id_rsa）
2. 检查未跟踪文件（git status）
3. 检查 08_releasing/ 是否被 git 跟踪
4. 生成 PRECOMMIT_PLAN.json、PRECOMMIT_REPORT.json、PRECOMMIT_SUMMARY.md
`;

  const result = await aiTool.runStage({
    config, stateManager, stageName: 'precommit', projectPath, taskText,
    attempt: input.attempt || 1, regenerateHint: input.regenerateHint || ''
  });
  
  return result;
}

module.exports = { execute };
