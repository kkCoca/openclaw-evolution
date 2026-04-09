/**
 * Precommit 阶段执行器
 * 
 * ClawDevFlow (CDF) 阶段模块
 * 执行 Precommit 阶段：提交前清理 + 风险检查
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { ensureDir } = require('../utils/fsx');
const { runGit } = require('../utils/cmd');

/**
 * 执行 Precommit 阶段
 * @param {object} aiAdapter - AI 工具适配器（未使用，保持接口一致）
 * @param {object} stateManager - 状态管理器（未使用，保持接口一致）
 * @param {string} projectPath - 项目路径
 * @param {object} input - 阶段输入
 * @returns {Promise<{success: boolean, outputs: Array, error?: string}>}
 */
async function executePrecommit(aiAdapter, stateManager, projectPath, input) {
  console.log('[Stage-Executor] ════════════════════════════════════════');
  console.log('[Stage-Executor] 开始执行阶段：PRECOMMIT');
  console.log('[Stage-Executor] ════════════════════════════════════════');
  
  const precommitPath = path.join(projectPath, '07_precommit');
  ensureDir(precommitPath);

  try {
    // Step A: 生成 PRECOMMIT_PLAN.json
    console.log('[Stage-Executor] 生成 PRECOMMIT_PLAN.json...');
    const precommitPlan = {
      version: 'v1',
      generatedAt: new Date().toISOString(),
      cleanupTargets: [
        { pattern: '.DS_Store', reason: '系统临时文件' },
        { pattern: 'Thumbs.db', reason: '系统临时文件' },
        { pattern: '*.tmp', reason: '临时文件' },
        { pattern: '*.swp', reason: '编辑器交换文件' },
        { pattern: '*~', reason: '备份文件' },
        { pattern: '__pycache__/', reason: 'Python 缓存' },
        { pattern: '*.pyc', reason: 'Python 编译文件' },
        { pattern: 'node_modules/', reason: '依赖目录（应通过 .gitignore 忽略）' },
        { pattern: 'dist/', reason: '构建输出（应通过 .gitignore 忽略）' },
        { pattern: 'build/', reason: '构建输出（应通过 .gitignore 忽略）' }
      ],
      securityPatterns: [
        '.env',
        '*.pem',
        '*.key',
        'id_rsa',
        '*.p12',
        '*.pfx',
        '*.crt',
        '*.cer'
      ],
      gitCheck: {
        enabled: true,
        allowlist: [
          'README.md',
          'CHANGELOG.md',
          'LICENSE',
          '.gitignore',
          'package.json',
          'package-lock.json'
        ]
      },
      protectedDirectories: [
        '06_releasing/',
        '07_precommit/'
      ]
    };
    fs.writeFileSync(
      path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
      JSON.stringify(precommitPlan, null, 2),
      'utf8'
    );
    console.log('[Stage-Executor] ✅ PRECOMMIT_PLAN.json 已生成');

    // Step B: 执行清理和风险检查
    console.log('[Stage-Executor] 执行提交前清理和风险检查...');
    const precommitReport = {
      version: 'v1',
      executedAt: new Date().toISOString(),
      deleted: [],
      securityFindings: [],
      gitStatus: '',
      untrackedFiles: [],
      result: 'PASS',
      blockingIssues: []
    };

    // B1: 扫描敏感文件（PC0）
    console.log('[Stage-Executor] PC0: 扫描敏感文件...');
    try {
      const rootItems = fs.readdirSync(projectPath);
      for (const item of rootItems) {
        const itemPath = path.join(projectPath, item);
        const stat = fs.statSync(itemPath);
        
        // 跳过受保护的目录
        if (stat.isDirectory() && precommitPlan.protectedDirectories.some(d => itemPath.includes(d))) {
          continue;
        }
        
        // 检查敏感文件
        for (const pattern of precommitPlan.securityPatterns) {
          if ((pattern.startsWith('*') && item.endsWith(pattern.slice(1))) || 
              (pattern === item)) {
            precommitReport.securityFindings.push({
              path: item,
              pattern: pattern,
              severity: 'HIGH',
              gateId: 'PC0',
              recommendation: `敏感文件，禁止提交：${item}`
            });
            console.log(`[Stage-Executor] ❌ PC0: 发现敏感文件：${item} (${pattern})`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('[Stage-Executor] ⚠️ 敏感文件扫描失败:', error.message);
    }

    // B2: 检查 git status（PC1）
    console.log('[Stage-Executor] PC1: 检查 git 未跟踪文件...');
    const gitStatusResult = await runGit('status --porcelain', projectPath);
    
    if (gitStatusResult.error) {
      precommitReport.gitStatus = `ERROR: ${gitStatusResult.error}`;
      precommitReport.blockingIssues.push({
        gateId: 'PC1',
        description: '无法执行 git status 命令，请确认当前目录是 git 仓库',
        evidencePath: '07_precommit/PRECOMMIT_REPORT.json',
        suggestion: '请在 git 仓库内运行 precommit 阶段，或初始化 git 仓库'
      });
      console.error('[Stage-Executor] ❌ PC1: git status 执行失败:', gitStatusResult.error);
    } else {
      precommitReport.gitStatus = gitStatusResult.stdout.trim();
      
      // 解析未跟踪文件（?? 开头）
      const lines = precommitReport.gitStatus.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.startsWith('??')) {
          const file = line.slice(3).trim();
          const fileName = path.basename(file);
          
          // 检查是否在 allowlist 中
          const inAllowlist = precommitPlan.gitCheck.allowlist.some(
            allowed => file === allowed || fileName === allowed
          );
          
          // 检查是否是受保护目录
          const isProtectedDir = precommitPlan.protectedDirectories.some(
            dir => file.startsWith(dir)
          );
          
          if (!inAllowlist) {
            precommitReport.untrackedFiles.push({
              path: file,
              gateId: 'PC1',
              isProtectedDir: isProtectedDir,
              recommendation: isProtectedDir 
                ? `受保护目录内容，不应提交：${file}`
                : `未跟踪文件，请确认是否应该提交：${file}`
            });
            console.log(`[Stage-Executor] ❌ PC1: 发现未跟踪文件：${file}`);
          }
        }
      }
    }

    // B3: 检查 releasing 目录是否被纳入提交风险（PC2）
    console.log('[Stage-Executor] PC2: 检查 releasing 证据包提交风险...');
    const releasingDir = path.join(projectPath, '06_releasing');
    if (fs.existsSync(releasingDir)) {
      const gitLsFilesResult = await runGit('ls-files 06_releasing/', projectPath);
      
      if (gitLsFilesResult.stdout && gitLsFilesResult.stdout.trim()) {
        const trackedFiles = gitLsFilesResult.stdout.trim().split('\n');
        precommitReport.blockingIssues.push({
          gateId: 'PC2',
          description: `releasing 证据包目录 (${trackedFiles.length} 个文件) 已被 git 跟踪，不应提交`,
          evidencePath: '06_releasing/',
          suggestion: '请将 06_releasing/ 添加到 .gitignore，或从 git 历史中移除'
        });
        console.log(`[Stage-Executor] ❌ PC2: releasing 目录已被 git 跟踪（${trackedFiles.length} 个文件）`);
      } else {
        console.log('[Stage-Executor] ✅ PC2: releasing 目录未被 git 跟踪');
      }
    }

    // Step C: 汇总结果，判定 PASS/FAIL
    console.log('[Stage-Executor] 汇总 precommit 检查结果...');
    
    // PC0: 敏感文件检查
    if (precommitReport.securityFindings.length > 0) {
      precommitReport.result = 'FAIL';
      for (const finding of precommitReport.securityFindings) {
        precommitReport.blockingIssues.push({
          gateId: finding.gateId,
          description: finding.recommendation,
          evidencePath: `07_precommit/PRECOMMIT_REPORT.json`,
          suggestion: '请移除敏感文件或将其添加到 .gitignore'
        });
      }
    }
    
    // PC1: 未跟踪文件检查（硬阻断：不在白名单的未跟踪文件必须 FAIL）
    if (precommitReport.untrackedFiles.length > 0) {
      precommitReport.result = 'FAIL';
      for (const untracked of precommitReport.untrackedFiles) {
        precommitReport.blockingIssues.push({
          gateId: 'PC1',
          description: `未跟踪文件：${untracked.path}（不在白名单）`,
          evidencePath: '07_precommit/PRECOMMIT_REPORT.json',
          suggestion: untracked.isProtectedDir
            ? `受保护目录内容不应提交，请删除或加入 .gitignore：${untracked.path}`
            : `确认是否应提交；不应提交则删除或加入 .gitignore：${untracked.path}`
        });
      }
      console.log(`[Stage-Executor] ❌ PC1: 发现 ${precommitReport.untrackedFiles.length} 个未跟踪文件，阻断提交`);
    }
    
    // PC2: releasing 目录检查（已在 B3 中添加到 blockingIssues）
    
    // 更新 summary
    precommitReport.summary = {
      totalDeleted: precommitReport.deleted.length,
      totalSecurityFindings: precommitReport.securityFindings.length,
      totalUntrackedFiles: precommitReport.untrackedFiles.length,
      totalBlockingIssues: precommitReport.blockingIssues.length
    };

    // Step D: 写入 PRECOMMIT_REPORT.json
    fs.writeFileSync(
      path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
      JSON.stringify(precommitReport, null, 2),
      'utf8'
    );
    console.log('[Stage-Executor] ✅ PRECOMMIT_REPORT.json 已生成');

    // Step E: 生成 PRECOMMIT_SUMMARY.md
    console.log('[Stage-Executor] 生成 PRECOMMIT_SUMMARY.md...');
    const summaryContent = `# Precommit 检查报告

## 执行信息
- 时间：${precommitReport.executedAt}
- 项目路径：${projectPath}

## 检查结果
**RESULT: ${precommitReport.result}**

## Gate 检查
| Gate | 描述 | 状态 |
|------|------|------|
| PC0 | 敏感文件检查 | ${precommitReport.securityFindings.length > 0 ? '❌ FAIL' : '✅ PASS'} |
| PC1 | 未跟踪文件检查 | ${precommitReport.untrackedFiles.length > 0 ? '❌ FAIL' : '✅ PASS'} |
| PC2 | releasing 目录检查 | ${precommitReport.blockingIssues.some(i => i.gateId === 'PC2') ? '❌ FAIL' : '✅ PASS'} |

## 发现汇总
- 敏感文件：${precommitReport.summary.totalSecurityFindings}
- 未跟踪文件：${precommitReport.summary.totalUntrackedFiles}
- Blocking Issues: ${precommitReport.summary.totalBlockingIssues}

## Blocking Issues
${precommitReport.blockingIssues.length > 0 
  ? precommitReport.blockingIssues.map(i => `- **${i.gateId}**: ${i.description}`).join('\n')
  : '无'}

## 下一步
${precommitReport.result === 'PASS' 
  ? '✅ 可以安全提交代码' 
  : '❌ 请先修复上述问题后再提交'}
`;
    fs.writeFileSync(
      path.join(precommitPath, 'PRECOMMIT_SUMMARY.md'),
      summaryContent,
      'utf8'
    );
    console.log('[Stage-Executor] ✅ PRECOMMIT_SUMMARY.md 已生成');

    console.log('[Stage-Executor] ✅ Precommit 阶段完成');
    console.log(`[Stage-Executor]   结果：${precommitReport.result}`);
    console.log(`[Stage-Executor]   Blocking Issues: ${precommitReport.summary.totalBlockingIssues}`);
    
    // 如果有 blocking issues，返回 success=false
    if (precommitReport.result === 'FAIL') {
      return {
        success: false,
        outputs: [
          path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
          path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
          path.join(precommitPath, 'PRECOMMIT_SUMMARY.md')
        ],
        error: `Precommit 检查失败：发现 ${precommitReport.summary.totalBlockingIssues} 个 blocking issues`
      };
    }
    
    return {
      success: true,
      outputs: [
        path.join(precommitPath, 'PRECOMMIT_PLAN.json'),
        path.join(precommitPath, 'PRECOMMIT_REPORT.json'),
        path.join(precommitPath, 'PRECOMMIT_SUMMARY.md')
      ]
    };

  } catch (error) {
    console.error('[Stage-Executor] ❌ Precommit 阶段执行失败:', error.message);
    return {
      success: false,
      outputs: [],
      error: error.message
    };
  }
}

module.exports = {
  executePrecommit
};
