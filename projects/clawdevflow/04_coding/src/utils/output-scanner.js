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
    const isDirectory = item.endsWith('/') || item.includes('/');
    const itemPath = path.join(fullOutputPath, isDirectory && !item.endsWith('/') ? item : item.replace(/\/$/, ''));
    
    if (isDirectory && !item.endsWith('/')) {
      // 目录路径（如 src/）
      const dirPath = itemPath;
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        // 检查目录下是否有非隐藏文件
        const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
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
    } else if (item.endsWith('/')) {
      // 目录路径（以 / 结尾）
      const dirPath = itemPath;
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
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
      // 文件路径
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