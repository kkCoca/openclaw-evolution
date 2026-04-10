/**
 * Output Scanner - 输出扫描器
 * 
 * ClawDevFlow (CDF) 工具模块
 * 负责扫描输出目录，验证合同文件是否满足
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * 扫描输出目录，验证 outputsAllOf 合同
 * 
 * @param {object} options - 扫描选项
 * @param {string} options.projectPath - 项目路径
 * @param {string} options.outputDir - 输出目录（相对于项目根目录）
 * @param {string[]} options.outputsAllOf - 期望输出文件列表
 * @returns {{ok: boolean, found: string[], missing: string[]}}
 */
function scanOutputsAllOf({ projectPath, outputDir, outputsAllOf }) {
  const found = [];
  const missing = [];
  
  const fullOutputPath = path.join(projectPath, outputDir);
  
  // 检查输出目录是否存在
  if (!fs.existsSync(fullOutputPath)) {
    console.log(`[Output-Scanner] ❌ 输出目录不存在：${fullOutputPath}`);
    return {
      ok: false,
      found: [],
      missing: outputsAllOf
    };
  }
  
  // 逐个检查期望输出
  for (const item of outputsAllOf) {
    // P0-2 修复：目录只以 endsWith('/') 判定，允许文件包含相对路径
    const isDirectory = item.endsWith('/');
    const normalized = isDirectory ? item.slice(0, -1) : item;
    const itemPath = path.join(fullOutputPath, normalized);
    
    if (isDirectory) {
      // 目录路径（以 / 结尾）
      if (fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory()) {
        const files = fs.readdirSync(itemPath).filter(f => !f.startsWith('.'));
        if (files.length > 0) {
          found.push(item);
          console.log(`[Output-Scanner] ✅ 目录存在且非空：${item}`);
        } else {
          missing.push(item);
          console.log(`[Output-Scanner] ❌ 目录为空：${item}`);
        }
      } else {
        missing.push(item);
        console.log(`[Output-Scanner] ❌ 目录不存在：${item}`);
      }
    } else {
    // 文件路径（允许包含相对路径如 reports/VERIFICATION_REPORT.md）
      if (fs.existsSync(itemPath) && fs.statSync(itemPath).isFile()) {
        const stat = fs.statSync(itemPath);
        if (stat.size > 0) {
          found.push(item);
          console.log(`[Output-Scanner] ✅ 文件存在且非空：${item} (${stat.size} bytes)`);
        } else {
          missing.push(item);
          console.log(`[Output-Scanner] ❌ 文件为空：${item}`);
        }
      } else {
        missing.push(item);
        console.log(`[Output-Scanner] ❌ 文件不存在：${item}`);
      }
    }
  }
  
  const ok = missing.length === 0;
  
  console.log(`[Output-Scanner] 扫描结果：${found.length}/${outputsAllOf.length} (${ok ? '✅ PASS' : '❌ FAIL'})`);
  
  return {
    ok,
    found,
    missing
  };
}

module.exports = {
  scanOutputsAllOf
};
