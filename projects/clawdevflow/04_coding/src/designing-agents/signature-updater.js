const fs = require('fs').promises;
const path = require('path');
const { GitManager } = require('../utils/git-manager');

/**
 * 签字回填类
 * 
 * 将用户签字信息回填到 PRD.md 第 15 章
 * 
 * @class SignatureUpdater
 * @author openclaw-ouyp
 * @since 3.1.3
 */
class SignatureUpdater {
  /**
   * 构造函数
   * @param {object} options - 配置选项
   * @param {string} options.prdPath - PRD.md 文件路径
   * @param {string} options.projectPath - 项目路径（用于 Git 管理）
   */
  constructor(options) {
    this.prdPath = options.prdPath;
    this.projectPath = options.projectPath || path.dirname(path.dirname(this.prdPath));
    this.gitManager = new GitManager({ projectPath: this.projectPath });
  }

  /**
   * 更新签字信息
   * 
   * @async
   * @param {object} signature - 签字信息
   * @param {string} signature.role - 角色（产品负责人/技术负责人/审阅者）
   * @param {string} signature.name - 姓名
   * @param {string} signature.date - 签字日期（YYYY-MM-DD）
   * @param {string} signature.decision - 签字结论（pass/conditional/reject）
   * @param {string} [signature.notes] - 备注（可选）
   * @returns {Promise<boolean>} 是否成功
   */
  async update(signature) {
    try {
      // 1. 读取 PRD.md
      const prdContent = await fs.readFile(this.prdPath, 'utf8');
      
      // 2. 检查第 15 章是否存在
      let updatedContent = prdContent;
      if (!this.hasSignatureChapter(prdContent)) {
        updatedContent = this.createSignatureChapter(updatedContent);
      }
      
      // 3. 更新签字表格
      updatedContent = this.updateSignatureTable(updatedContent, signature);
      
      // 4. 更新版本历史
      updatedContent = this.updateVersionHistory(updatedContent, signature);
      
      // 5. 写回 PRD.md
      await fs.writeFile(this.prdPath, updatedContent, 'utf8');
      
      return true;
    } catch (error) {
      console.error('签字回填失败:', error);
      return false;
    }
  }

  /**
   * 批量更新签字
   * 
   * @async
   * @param {Array<object>} signatures - 签字信息列表
   * @returns {Promise<boolean>} 是否成功
   */
  async updateBatch(signatures) {
    for (const signature of signatures) {
      const success = await this.update(signature);
      if (!success) {
        return false;
      }
    }
    return true;
  }

  /**
   * 检查是否存在签字章节
   * @private
   */
  hasSignatureChapter(content) {
    return content.includes('## 15. 用户确认签字') || 
           content.includes('## 14. 用户确认签字') ||
           content.includes('## 用户确认签字');
  }

  /**
   * 创建签字章节模板
   * @private
   */
  createSignatureChapter(content) {
    const signatureChapter = `

## 15. 用户确认签字

### 15.1 确认内容提炼

> 以下内容由流程引擎在内存中提炼，供用户快速理解

| 类别 | 关键内容 |
|------|---------|
| 核心需求 | 待提炼 |
| 技术方案 | 待提炼 |
| 变更影响 | 待分析 |
| 风险提示 | 待提炼 |

### 15.2 签字确认

| 角色 | 姓名 | 签字日期 | 结论 | 备注 |
|------|------|---------|------|------|
| 产品负责人 | 待填写 | 待填写 | 待填写 | - |
| 技术负责人 | 待填写 | 待填写 | 待填写 | - |
| 审阅者 | openclaw-ouyp | 待填写 | 待填写 | - |

### 15.3 签字历史

| 版本 | 签字日期 | 角色 | 结论 | 备注 |
|------|---------|------|------|------|
| 待填写 | 待填写 | 待填写 | 待填写 | - |
`;
    return content + signatureChapter;
  }

  /**
   * 更新签字表格
   * @private
   */
  updateSignatureTable(content, signature) {
    const decisionMap = {
      'pass': '✅ 通过',
      'conditional': '⚠️ 条件通过',
      'reject': '❌ 驳回'
    };
    
    const decisionText = decisionMap[signature.decision] || signature.decision;
    const notes = signature.notes || '-';
    
    // 匹配签字确认表格的行
    const rolePattern = `\\|\\s*${this.escapeRegex(signature.role)}\\s*\\|[^|]+\\|[^|]+\\|[^|]+\\|[^|]+\\|`;
    const roleRegex = new RegExp(rolePattern);
    const existingRow = content.match(roleRegex);
    
    if (existingRow) {
      // 更新现有行
      const newRow = `| ${signature.role} | ${signature.name} | ${signature.date} | ${decisionText} | ${notes} |`;
      content = content.replace(roleRegex, newRow);
    } else {
      // 添加新行 - 查找签字确认表格部分
      const tableHeaderPattern = '(\\| 角色 \\| 姓名 \\| 签字日期 \\| 结论 \\| 备注 \\|\\n\\|------\\|------\\|---------\\|------\\|------\\|)';
      const tableHeaderRegex = new RegExp(tableHeaderPattern);
      const headerMatch = content.match(tableHeaderRegex);
      
      if (headerMatch) {
        const newRow = `\n| ${signature.role} | ${signature.name} | ${signature.date} | ${decisionText} | ${notes} |`;
        const insertPosition = headerMatch.index + headerMatch[0].length;
        content = content.slice(0, insertPosition) + newRow + content.slice(insertPosition);
      }
    }
    
    // 更新签字历史表格
    const historyRegex = /(\| 版本 \| 签字日期 \| 角色 \| 结论 \| 备注 \|\n\|------\|---------\|------\|------\|------\|)([\s\S]*?)(\n\n|$)/;
    const historyMatch = content.match(historyRegex);
    
    if (historyMatch) {
      const version = this.extractVersion(content);
      const historyRow = `\n| ${version} | ${signature.date} | ${signature.role} | ${decisionText} | ${notes} |`;
      
      const insertPosition = historyMatch.index + historyMatch[1].length + (historyMatch[2] || '').length;
      content = content.slice(0, insertPosition) + historyRow + content.slice(insertPosition);
    }
    
    return content;
  }

  /**
   * 更新版本历史
   * @private
   */
  updateVersionHistory(content, signature) {
    const version = this.extractVersion(content);
    const date = new Date().toISOString().split('T')[0];
    
    // 检查版本历史章节是否存在
    const versionHistoryRegex = /## (?:7|8|9)\. 版本历史([\s\S]*?)(?=## |\*本文档|$)/;
    const match = content.match(versionHistoryRegex);
    
    if (match) {
      // 版本历史已存在，无需更新（由 PRD 生成流程负责）
      return content;
    }
    
    return content;
  }

  /**
   * 提取版本号
   * @private
   */
  extractVersion(content) {
    const versionMatch = content.match(/>\s*\*\*版本\*\*:\s*v([\d.]+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }
    
    const metaMatch = content.match(/\*\*PRD 版本\*\*\s*\|\s*v([\d.]+)/);
    if (metaMatch) {
      return `v${metaMatch[1]}`;
    }
    
    return 'v3.1.3';
  }

  /**
   * 转义正则表达式特殊字符
   * @private
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 提交签字变更到 Git
   * 
   * @async
   * @param {string} version - 版本号
   * @param {Array<object>} signatures - 签字列表
   * @returns {Promise<object>} Git 提交结果
   */
  async commitChanges(version, signatures) {
    return await this.gitManager.commitPRDChange({
      version,
      signatures
    });
  }
}

module.exports = { SignatureUpdater };
