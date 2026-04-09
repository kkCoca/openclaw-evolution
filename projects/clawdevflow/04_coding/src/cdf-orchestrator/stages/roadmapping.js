/**
 * Roadmapping 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Roadmapping 阶段：生成 ROADMAP.md
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const { ensureDir } = require('../utils/fsx');
const { validateRoadmappingEntry } = require('../utils/validate-roadmapping-entry');

/**
 * 执行 Roadmapping 阶段
 * @param {object} aiAdapter - AI 工具适配器
 * @param {object} stateManager - 状态管理器
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeRoadmapping(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：ROADMAPPING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  // Gate#2 防绕过校验（执行层）
  if (stateManager) {
    const validation = validateRoadmappingEntry(stateManager, stateManager.state);
    if (!validation.ok) {
      throw new Error(`roadmapping 入口门禁失败（Gate#2）: ${validation.reason}`);
    }
    console.log('[Stage-Executor] ✅ roadmapping 入口门禁校验通过（Gate#2）');
  }
  
  const roadmappingPath = path.join(projectPath, '02_roadmapping');
  ensureDir(roadmappingPath);

  console.log('[Stage-Executor] 调用 AI 工具执行 Roadmapping 阶段...');
  
  // 传递 attempt + regenerateHint（自动返工闭环）
  const result = await aiAdapter.execute('roadmapping', {
    projectPath: projectPath,
    designingPath: path.join(projectPath, '01_designing'),
    outputDir: roadmappingPath,
    attempt: input.attempt || 1,
    regenerateHint: input.regenerateHint || ''
  });
  
  if (!result.success) {
    throw new Error(`Roadmapping 阶段执行失败：${result.error}`);
  }
  
  console.log('[Stage-Executor] ✅ Roadmapping 阶段完成');
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
  executeRoadmapping
};
