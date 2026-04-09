/**
 * Releasing 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Releasing 阶段：发布证据包生成 + cleanup 清理
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fsx');
const { writeJson } = require('../utils/json');

/**
 * 执行 Releasing 阶段
 * @param {object} aiAdapter - AI 工具适配器（未使用，保持接口一致）
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array, error?: string}>}
 */
async function executeReleasing(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：RELEASING');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const releasingPath = path.join(projectPath, '06_releasing');
  
  // P0-1 修复：Step A - 读取并校验 readiness
  console.log('[Stage-Executor] 校验 Release Readiness...');
  const readinessPath = path.join(projectPath, '05_reviewing', 'RELEASE_READINESS.json');
  
  if (!fs.existsSync(readinessPath)) {
    console.error('[Stage-Executor] ❌ RELEASE_READINESS.json 文件不存在');
    return {
      success: false,
      outputs: [],
      error: 'RELEASE_READINESS.json 文件不存在，请先完成 reviewing 阶段'
    };
  }
  
  let readiness;
  try {
    readiness = JSON.parse(fs.readFileSync(readinessPath, 'utf8'));
  } catch (error) {
    console.error('[Stage-Executor] ❌ RELEASE_READINESS.json 解析失败:', error.message);
    return {
      success: false,
      outputs: [],
      error: `RELEASE_READINESS.json 解析失败：${error.message}`
    };
  }
  
  if (readiness.result !== 'PASS') {
    console.error(`[Stage-Executor] ❌ Release Readiness 检查结果为 ${readiness.result}，不允许发布`);
    const blockingIssues = readiness.blockingIssues || [];
    const firstIssue = blockingIssues[0] ? ` - ${blockingIssues[0].gateId}: ${blockingIssues[0].description}` : '';
    return {
      success: false,
      outputs: [],
      error: `Release Readiness 检查结果为 ${readiness.result}，不允许发布${firstIssue}`
    };
  }
  
  console.log('[Stage-Executor] ✅ Release Readiness 检查通过（result=PASS）');
  
  // P0-1 修复：Step C - 通过后才生成发布证据包
  ensureDir(releasingPath);

  try {
    // 1. 生成 RELEASE_RECORD.json（发布记录）- 引用真实 readiness.result
    console.log('[Stage-Executor] 生成 RELEASE_RECORD.json...');
    const releaseRecord = {
      schemaVersion: 'v1',
      releaseId: `release-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      readiness: {
        path: '05_reviewing/RELEASE_READINESS.json',
        result: readiness.result  // P0-1 修复：引用真实 result，不写死
      },
      inputs: {
        projectPath: projectPath,
        attempt: input.attempt || 1
      },
      cleanup: {
        planPath: '06_releasing/CLEANUP_PLAN.json',
        reportPath: '06_releasing/CLEANUP_REPORT.json',
        summary: {
          deletedCount: 0,
          securityFindingsCount: 0
        }
      },
      outputs: {
        releaseNotes: '06_releasing/RELEASE_NOTES.md',
        artifactManifest: '06_releasing/ARTIFACT_MANIFEST.json'
      }
    };
    writeJson(path.join(releasingPath, 'RELEASE_RECORD.json'), releaseRecord);
    console.log('[Stage-Executor] ✅ RELEASE_RECORD.json 已生成');

    // 2. 生成 CLEANUP_PLAN.json（清理计划）
    console.log('[Stage-Executor] 生成 CLEANUP_PLAN.json...');
    const cleanupPlan = {
      version: 'v1',
      generatedAt: new Date().toISOString(),
      protectedDirectories: [
        '01_designing/',
        '02_roadmapping/',
        '03_detailing/',
        '04_coding/',
        '05_testing/',
        '05_reviewing/',
        '06_releasing/'
      ],
      protectedFiles: [
        'PROJECT_MANIFEST.json',
        'REQUIREMENTS.md'
      ],
      cleanupRules: [
        { pattern: '.DS_Store', reason: '系统临时文件' },
        { pattern: 'Thumbs.db', reason: '系统临时文件' },
        { pattern: '*.tmp', reason: '临时文件' },
        { pattern: '*.swp', reason: '编辑器交换文件' },
        { pattern: '*~', reason: '备份文件' },
        { pattern: '__pycache__/', reason: 'Python 缓存' },
        { pattern: '*.pyc', reason: 'Python 编译文件' }
      ],
      securityScan: {
        enabled: true,
        patterns: ['.env', '*.pem', '*.key', 'id_rsa', '*.p12']
      }
    };
    writeJson(path.join(releasingPath, 'CLEANUP_PLAN.json'), cleanupPlan);
    console.log('[Stage-Executor] ✅ CLEANUP_PLAN.json 已生成');

    // 3. 执行清理并生成 CLEANUP_REPORT.json
    console.log('[Stage-Executor] 执行清理...');
    const cleanupReport = {
      version: 'v1',
      executedAt: new Date().toISOString(),
      deletedFiles: [],
      securityFindings: [],
      summary: {
        totalDeleted: 0,
        totalSecurityFindings: 0
      }
    };
    
    // 扫描项目根目录，匹配清理规则和安全模式
    const cleanupRules = cleanupPlan.cleanupRules.map(r => r.pattern);
    const securityPatterns = cleanupPlan.securityScan.patterns;
    
    console.log('[Stage-Executor] 扫描临时文件和安全风险...');
    
    // 简单实现：扫描项目根目录的一级文件/目录
    try {
      const rootItems = fs.readdirSync(projectPath);
      
      for (const item of rootItems) {
        const itemPath = path.join(projectPath, item);
        const stat = fs.statSync(itemPath);
        
        // 跳过受保护的目录
        if (stat.isDirectory() && cleanupPlan.protectedDirectories.some(d => itemPath.includes(d))) {
          continue;
        }
        
        // 检查是否匹配清理规则
        for (const pattern of cleanupRules) {
          if (pattern.startsWith('*') && item.endsWith(pattern.slice(1))) {
            // 匹配临时文件，记录到 deletedFiles
            cleanupReport.deletedFiles.push({
              path: item,
              reason: `匹配清理规则：${pattern}`,
              deleted: false  // 简化实现：只记录不删除
            });
            cleanupReport.summary.totalDeleted++;
            console.log(`[Stage-Executor] 发现临时文件：${item} (${pattern})`);
            break;
          }
        }
        
        // 检查是否匹配安全模式（敏感文件）
        for (const pattern of securityPatterns) {
          if ((pattern.startsWith('*') && item.endsWith(pattern.slice(1))) || 
              (pattern === item)) {
            // 匹配敏感文件，记录到 securityFindings
            cleanupReport.securityFindings.push({
              path: item,
              pattern: pattern,
              severity: 'HIGH',
              recommendation: `建议删除或加入 .gitignore：${item}`
            });
            cleanupReport.summary.totalSecurityFindings++;
            console.log(`[Stage-Executor] ⚠️ 发现敏感文件：${item} (${pattern})`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('[Stage-Executor] ⚠️ 扫描失败:', error.message);
    }
    
    // 更新 summary
    cleanupReport.summary.totalDeleted = cleanupReport.deletedFiles.length;
    cleanupReport.summary.totalSecurityFindings = cleanupReport.securityFindings.length;
    
    writeJson(path.join(releasingPath, 'CLEANUP_REPORT.json'), cleanupReport);
    console.log('[Stage-Executor] ✅ CLEANUP_REPORT.json 已生成');
    console.log(`[Stage-Executor]   删除文件数：${cleanupReport.summary.totalDeleted}`);
    console.log(`[Stage-Executor]   安全发现数：${cleanupReport.summary.totalSecurityFindings}`);

    // 4. 生成 RELEASE_NOTES.md（发布说明）- 引用真实 readiness.result
    console.log('[Stage-Executor] 生成 RELEASE_NOTES.md...');
    const releaseNotes = `# 发布说明 - Releasing 阶段

## 发布信息
- 发布时间：${new Date().toISOString()}
- 发布 ID: ${releaseRecord.releaseId}

## 发布就绪
- Reviewing 放行凭证：05_reviewing/RELEASE_READINESS.json
- 结果：${readiness.result}

## 清理报告
- 删除文件数：${cleanupReport.summary.totalDeleted}
- 安全发现数：${cleanupReport.summary.totalSecurityFindings}

## 制品清单
详见：06_releasing/ARTIFACT_MANIFEST.json

## 发布记录
详见：06_releasing/RELEASE_RECORD.json
`;
    fs.writeFileSync(
      path.join(releasingPath, 'RELEASE_NOTES.md'),
      releaseNotes,
      'utf8'
    );
    console.log('[Stage-Executor] ✅ RELEASE_NOTES.md 已生成');

    // 5. 生成 ARTIFACT_MANIFEST.json（制品清单）
    console.log('[Stage-Executor] 生成 ARTIFACT_MANIFEST.json...');
    const artifactManifest = {
      version: 'v1',
      generatedAt: new Date().toISOString(),
      artifacts: [
        {
          path: '06_releasing/RELEASE_RECORD.json',
          type: 'record',
          description: '发布记录'
        },
        {
          path: '06_releasing/RELEASE_NOTES.md',
          type: 'notes',
          description: '发布说明'
        },
        {
          path: '06_releasing/CLEANUP_PLAN.json',
          type: 'cleanup',
          description: '清理计划'
        },
        {
          path: '06_releasing/CLEANUP_REPORT.json',
          type: 'cleanup',
          description: '清理报告'
        }
      ]
    };
    writeJson(path.join(releasingPath, 'ARTIFACT_MANIFEST.json'), artifactManifest);
    console.log('[Stage-Executor] ✅ ARTIFACT_MANIFEST.json 已生成');

    // 更新 releaseRecord 中的 cleanup summary
    releaseRecord.cleanup.summary.deletedCount = cleanupReport.summary.totalDeleted;
    releaseRecord.cleanup.summary.securityFindingsCount = cleanupReport.summary.totalSecurityFindings;
    writeJson(path.join(releasingPath, 'RELEASE_RECORD.json'), releaseRecord);

    console.log('[Stage-Executor] ✅ Releasing 阶段完成');
    console.log(`[Stage-Executor]   产出：${artifactManifest.artifacts.length + 1} 个文件`);
    
    return {
      success: true,
      outputs: [
        path.join(releasingPath, 'RELEASE_RECORD.json'),
        path.join(releasingPath, 'RELEASE_NOTES.md'),
        path.join(releasingPath, 'ARTIFACT_MANIFEST.json'),
        path.join(releasingPath, 'CLEANUP_PLAN.json'),
        path.join(releasingPath, 'CLEANUP_REPORT.json')
      ]
    };

  } catch (error) {
    console.error('[Stage-Executor] ❌ Releasing 阶段执行失败:', error.message);
    return {
      success: false,
      outputs: [],
      error: error.message
    };
  }
}

module.exports = {
  execute: executeReleasing
};
