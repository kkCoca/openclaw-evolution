/**
 * FSX - 文件系统工具函数
 * 
 * ClawDevFlow (CDF) 通用工具
 * 提供常用的文件系统操作封装
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

/**
 * 确保目录存在（递归创建）
 * @param {string} dirPath - 目录路径
 * @returns {string} 目录路径
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[FSX] 创建目录：${dirPath}`);
  }
  return dirPath;
}

/**
 * 检查文件是否存在且非空
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否存在且非空
 */
function existsNonEmpty(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    console.log(`[FSX] ⚠️ 文件存在但为空：${filePath}`);
    return false;
  }
  return true;
}

/**
 * 读取文件内容（同步）
 * @param {string} filePath - 文件路径
 * @param {string} encoding - 编码（默认 utf8）
 * @returns {string} 文件内容
 */
function readFile(filePath, encoding = 'utf8') {
  return fs.readFileSync(filePath, encoding);
}

/**
 * 写入文件内容（同步）
 * @param {string} filePath - 文件路径
 * @param {string} content - 文件内容
 * @param {string} encoding - 编码（默认 utf8）
 */
function writeFile(filePath, content, encoding = 'utf8') {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  fs.writeFileSync(filePath, content, encoding);
}

/**
 * 删除文件（如果存在）
 * @param {string} filePath - 文件路径
 */
function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[FSX] 删除文件：${filePath}`);
  }
}

/**
 * 递归扫描目录，返回匹配模式的文件列表
 * @param {string} dirPath - 目录路径
 * @param {string[]} patterns - 文件模式（如 ['.env', '*.pem']）
 * @returns {string[]} 匹配的文件路径列表
 */
function scanFiles(dirPath, patterns = []) {
  const results = [];
  
  if (!fs.existsSync(dirPath)) {
    return results;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // 递归扫描子目录
      results.push(...scanFiles(itemPath, patterns));
    } else {
      // 检查是否匹配模式
      for (const pattern of patterns) {
        if ((pattern.startsWith('*') && item.endsWith(pattern.slice(1))) || 
            (pattern === item)) {
          results.push(itemPath);
          break;
        }
      }
    }
  }
  
  return results;
}

module.exports = {
  ensureDir,
  existsNonEmpty,
  readFile,
  writeFile,
  deleteFile,
  scanFiles
};
