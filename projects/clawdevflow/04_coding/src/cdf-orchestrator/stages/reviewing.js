/**
 * Reviewing 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Reviewing 阶段：生成 FINAL_REPORT.md
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fsx');

/**
 * 执行 Reviewing 阶段
 * @param {object} aiAdapter - AI 工具适配器
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array}>}
 */
async function executeReviewing(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：REVIEWING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const reviewingPath = path.join(projectPath, '05_reviewing');
  ensureDir(reviewingPath);

  try {
    const finalReportPath = path.join(reviewingPath, 'FINAL_REPORT.md');
    if (!fs.existsSync(finalReportPath)) {
      console.log('[Stage-Executor] 兜底生成 FINAL_REPORT.md 模板...');
      const finalReportContent = `# 项目收口报告 - Reviewing 阶段

## 执行信息
- 时间：${new Date().toISOString()}
- 项目路径：${projectPath}

## 收口结论
待 AI 或人工填充...

## 证据引用
- Testing 验收报告：05_testing/VERIFICATION_REPORT.md
- 变更说明：04_coding/CHANGESET.md
- 项目 Manifest: PROJECT_MANIFEST.json

## 发布就绪
详见：05_reviewing/RELEASE_READINESS.json
`;
      fs.writeFileSync(finalReportPath, finalReportContent, 'utf8');
      console.log('[Stage-Executor] ✅ FINAL_REPORT.md 模板已生成');
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Reviewing 阶段...');
    
    const result = await aiAdapter.execute('reviewing', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      codingPath: path.join(projectPath, '04_coding'),
      outputDir: reviewingPath
    });
    
    if (!result.success) {
      throw new Error(`Reviewing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Reviewing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };

  } catch (error) {
    console.error('[Stage-Executor] ❌ Reviewing 阶段执行失败:', error.message);
    return {
      success: false,
      outputs: [],
      error: error.message
    };
  }
}

module.exports = {
  executeReviewing
};
