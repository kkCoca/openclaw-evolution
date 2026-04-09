/**
 * Detailing 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Detailing 阶段：生成 DETAIL.md
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const { ensureDir } = require('../utils/fsx');

/**
 * 执行 Detailing 阶段
 * @param {object} aiAdapter - AI 工具适配器
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeDetailing(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：DETAILING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const detailingPath = path.join(projectPath, '03_detailing');
  ensureDir(detailingPath);

  console.log('[Stage-Executor] 调用 AI 工具执行 Detailing 阶段...');
  
  const result = await aiAdapter.execute('detailing', {
    projectPath: projectPath,
    designingPath: path.join(projectPath, '01_designing'),
    roadmappingPath: path.join(projectPath, '02_roadmapping'),
    outputDir: detailingPath,
    attempt: input.attempt || 1,
    regenerateHint: input.regenerateHint || ''
  });
  
  if (!result.success) {
    throw new Error(`Detailing 阶段执行失败：${result.error}`);
  }
  
  console.log('[Stage-Executor] ✅ Detailing 阶段完成');
  console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
  
  return {
    success: true,
    outputs: result.outputs.map(o => ({
      name: path.basename(o),
      path: path.relative(projectPath, o)
    }))
  };
}

module.exports = {
  executeDetailing
};
