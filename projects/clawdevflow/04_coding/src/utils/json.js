/**
 * JSON 工具函数
 * 
 * ClawDevFlow (CDF) 通用工具
 * 提供 JSON 文件的读写封装
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { ensureDir } = require('./fsx');

/**
 * 读取 JSON 文件（同步）
 * @param {string} filePath - 文件路径
 * @returns {object} JSON 对象
 */
function readJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件（同步）
 * @param {string} filePath - 文件路径
 * @param {object} data - JSON 数据
 * @param {number} spaces - 缩进空格数（默认 2）
 */
function writeJson(filePath, data, spaces = 2) {
  const dir = path.dirname(filePath);
  ensureDir(dir);
  const content = JSON.stringify(data, null, spaces);
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 检查 JSON 文件是否存在且可解析
 * @param {string} filePath - 文件路径
 * @returns {{ok: boolean, data?: object, error?: string}}
 */
function tryReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: '文件不存在' };
    }
    const data = readJson(filePath);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  readJson,
  writeJson,
  tryReadJson
};
