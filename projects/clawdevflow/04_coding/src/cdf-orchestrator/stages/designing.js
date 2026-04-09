/**
 * Designing 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Designing 阶段：生成 PRD.md 和 TRD.md
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const { ensureDir } = require('../utils/fsx');

/**
 * 执行 Designing 阶段
 * @param {object} aiAdapter - AI 工具适配器
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeDesigning(aiAdapter, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：DESIGNING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const designingPath = path.join(projectPath, '01_designing');
  ensureDir(designingPath);

  console.log('[Stage-Executor] 调用 AI 工具执行 Designing 阶段...');
  
  const result = await aiAdapter.execute('designing', {
    projectPath: projectPath,
    requirementsFile: input.requirementsFile,
    outputDir: designingPath
  });
  
  if (!result.success) {
    throw new Error(`Designing 阶段执行失败：${result.error}`);
  }
  
  console.log('[Stage-Executor] ✅ Designing 阶段完成');
  console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
  console.log(`[Stage-Executor]   文件：${result.outputs.join(', ')}`);
  
  return {
    success: true,
    outputs: result.outputs.map(o => ({
      name: path.basename(o),
      path: path.relative(projectPath, o)
    }))
  };
}

module.exports = {
  executeDesigning
};
