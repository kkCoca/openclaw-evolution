/**
 * CMD 工具函数
 * 
 * ClawDevFlow (CDF) 通用工具
 * 提供命令执行封装
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 执行命令（异步）
 * @param {string} command - 命令
 * @param {object} options - 选项
 * @param {string} options.cwd - 工作目录
 * @param {number} options.timeout - 超时时间（毫秒，默认 30000）
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runCmd(command, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = 30000
  } = options;
  
  try {
    const result = await execAsync(command, {
      cwd,
      timeout
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      error: null
    };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      error: error.message
    };
  }
}

/**
 * 执行 git 命令
 * @param {string} args - git 参数（如 'status --porcelain'）
 * @param {string} cwd - 工作目录
 * @returns {Promise<{stdout: string, stderr: string, error?: string}>}
 */
async function runGit(args, cwd) {
  return await runCmd(`git ${args}`, { cwd });
}

module.exports = {
  runCmd,
  runGit
};
