/**
 * Coding 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Coding 阶段：生成源代码
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fsx');

/**
 * 执行 Coding 阶段
 * @param {object} aiAdapter - AI 工具适配器
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeCoding(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：CODING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const codingPath = path.join(projectPath, '04_coding');
  const srcPath = path.join(codingPath, 'src');
  ensureDir(srcPath);

  // Gate 防绕过：校验 manifest 存在 + commands.test 存在
  const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!manifest.commands || !manifest.commands.test) {
        throw new Error('PROJECT_MANIFEST.json 缺少 commands.test 字段');
      }
      console.log('[Stage-Executor] ✅ PROJECT_MANIFEST.json 校验通过');
    } catch (error) {
      throw new Error(`PROJECT_MANIFEST.json 校验失败：${error.message}`);
    }
  } else {
    console.log('[Stage-Executor] ⚠️ PROJECT_MANIFEST.json 不存在，将在审阅阶段 reject');
  }

  console.log('[Stage-Executor] 调用 AI 工具执行 Coding 阶段...');
  
  const result = await aiAdapter.execute('coding', {
    projectPath: projectPath,
    designingPath: path.join(projectPath, '01_designing'),
    detailingPath: path.join(projectPath, '03_detailing'),
    outputDir: srcPath,
    attempt: input.attempt || 1,
    regenerateHint: input.regenerateHint || ''
  });
  
  if (!result.success) {
    throw new Error(`Coding 阶段执行失败：${result.error}`);
  }
  
  console.log('[Stage-Executor] ✅ Coding 阶段完成');
  console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
  
  // 确保 CHANGESET.md 一定存在（不依赖 AI）
  const changesetPath = path.join(codingPath, 'CHANGESET.md');
  if (!fs.existsSync(changesetPath)) {
    console.log('[Stage-Executor] 创建 CHANGESET.md 模板...');
    
    let testCmd = 'npm test';
    try {
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (manifest.commands && manifest.commands.test) {
          testCmd = manifest.commands.test;
        }
      }
    } catch (error) {
      console.log('[Stage-Executor] ⚠️ 无法读取 manifest，使用默认 test 命令');
    }
    
    const changesetContent = `# 变更说明 - Coding 阶段

## 本次变更
- 时间：${new Date().toISOString()}
- 尝试次数：${input.attempt || 1}

## 如何跑命令
请根据 PROJECT_MANIFEST.json 执行以下命令：

\`\`\`bash
# 测试
${testCmd}

# Lint（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run lint'}

# 构建（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run build'}
\`\`\`

## 变更详情
待补充...
`;
    fs.writeFileSync(changesetPath, changesetContent, 'utf8');
    console.log(`[Stage-Executor] ✅ CHANGESET.md 模板已创建（testCmd: ${testCmd}）`);
  }
  
  return {
    success: true,
    outputs: result.outputs.map(o => ({
      name: path.basename(o),
      path: path.relative(projectPath, o)
    }))
  };
}

module.exports = {
  executeCoding
};
