const { spawn } = require('child_process');
const path = require('path');

/**
 * Git 版本管理类
 * 
 * 管理 PRD.md 的 Git 版本
 * 
 * @class GitManager
 * @author openclaw-ouyp
 * @since 3.1.3
 */
class GitManager {
  /**
   * 构造函数
   * @param {object} options - 配置选项
   * @param {string} options.projectPath - 项目路径
   */
  constructor(options) {
    this.projectPath = options.projectPath || process.cwd();
  }

  /**
   * 提交 PRD 变更
   * 
   * @async
   * @param {object} commitInfo - 提交信息
   * @param {string} commitInfo.version - 版本号
   * @param {array} commitInfo.signatures - 签字列表
   * @returns {Promise<object>} Git 提交结果
   */
  async commitPRDChange(commitInfo) {
    try {
      const message = this.buildCommitMessage(commitInfo);
      
      // 添加 PRD.md 文件
      await this.exec('git', ['add', '01_designing/PRD.md']);
      
      // 提交变更
      await this.exec('git', ['commit', '-m', message]);
      
      return { 
        success: true, 
        commit: message,
        hash: await this.getLatestCommitHash()
      };
    } catch (error) {
      console.error('Git 提交失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 创建 Tag
   * 
   * @async
   * @param {string} version - 版本号
   * @returns {Promise<object>} Tag 创建结果
   */
  async createTag(version) {
    try {
      await this.exec('git', ['tag', version]);
      return { success: true, tag: version };
    } catch (error) {
      console.error('Git Tag 创建失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 获取版本历史
   * 
   * @async
   * @returns {Promise<Array>} 版本历史列表
   */
  async getVersionHistory() {
    try {
      const result = await this.exec('git', [
        'log',
        '--grep=PRD',
        '--pretty=format:%h|%s|%ai',
        '-10'
      ]);
      
      return result.stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, message, date] = line.split('|');
          return { hash, message, date };
        });
    } catch (error) {
      console.error('获取版本历史失败:', error);
      return [];
    }
  }

  /**
   * 构建 Commit Message
   * @private
   */
  buildCommitMessage(commitInfo) {
    const signatureLines = commitInfo.signatures.map(s => 
      `- ${s.role}: ${s.name} ${this.formatDecision(s.decision)}`
    ).join('\n');
    
    return `docs: PRD 签字确认 ${commitInfo.version}

${signatureLines}
`;
  }

  /**
   * 格式化签字结论
   * @private
   */
  formatDecision(decision) {
    const map = {
      'pass': '✅ 通过',
      'conditional': '⚠️ 条件通过',
      'reject': '❌ 驳回'
    };
    return map[decision] || decision;
  }

  /**
   * 获取最新提交哈希
   * @private
   */
  async getLatestCommitHash() {
    try {
      const result = await this.exec('git', ['rev-parse', 'HEAD']);
      return result.stdout.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * 执行 Git 命令
   * @private
   */
  exec(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { 
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(stderr.trim() || `Exit code: ${code}`));
        }
      });
      
      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 检查是否是 Git 仓库
   * 
   * @async
   * @returns {Promise<boolean>} 是否是 Git 仓库
   */
  async isGitRepository() {
    try {
      await this.exec('git', ['rev-parse', '--git-dir']);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取当前分支
   * 
   * @async
   * @returns {Promise<string>} 分支名称
   */
  async getCurrentBranch() {
    try {
      const result = await this.exec('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 推送 Tag 到远程
   * 
   * @async
   * @param {string} version - 版本号
   * @returns {Promise<object>} 推送结果
   */
  async pushTag(version) {
    try {
      await this.exec('git', ['push', 'origin', version]);
      return { success: true, tag: version };
    } catch (error) {
      console.error('推送 Tag 失败:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

module.exports = { GitManager };
