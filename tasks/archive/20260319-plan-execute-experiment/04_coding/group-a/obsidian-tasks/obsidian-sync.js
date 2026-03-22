/**
 * obsidian-sync.js
 * 负责与 Obsidian Vault 的文件系统交互
 * 支持读取/写入 Markdown 文件，解析和更新任务
 */

const fs = require('fs');
const path = require('path');

class ObsidianSync {
  constructor(vaultPath) {
    this.vaultPath = vaultPath;
    if (!fs.existsSync(vaultPath)) {
      throw new Error(`Obsidian Vault 不存在：${vaultPath}`);
    }
  }

  /**
   * 解析 Markdown 文件中的任务
   * @param {string} filePath - 文件路径（相对于 vault）
   * @returns {Array} 任务数组
   */
  parseTasks(filePath) {
    const fullPath = path.join(this.vaultPath, filePath);
    if (!fs.existsSync(fullPath)) {
      return [];
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const tasks = [];

    // 匹配任务行：- [ ] 或 - [x] 或 - [X]
    const taskRegex = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/;

    lines.forEach((line, index) => {
      const match = line.match(taskRegex);
      if (match) {
        const indent = match[1];
        const status = match[2].toLowerCase() === 'x' ? 'done' : 'pending';
        const description = match[3];

        // 提取元数据
        const dueDate = this.extractDate(description, '📅');
        const startDate = this.extractDate(description, '🛫');
        const doneDate = this.extractDate(description, '✅');
        const priority = this.extractPriority(description);
        const tags = this.extractTags(description);
        const contexts = this.extractContexts(description);

        tasks.push({
          line: index + 1,
          indent,
          status,
          description: this.cleanDescription(description),
          dueDate,
          startDate,
          doneDate,
          priority,
          tags,
          contexts,
          raw: line
        });
      }
    });

    return tasks;
  }

  /**
   * 从描述中提取日期
   */
  extractDate(description, emoji) {
    const regex = new RegExp(`${emoji}\\s*(\\d{4}-\\d{2}-\\d{2})`);
    const match = description.match(regex);
    return match ? match[1] : null;
  }

  /**
   * 提取优先级
   */
  extractPriority(description) {
    if (description.includes('⏫')) return 'high';
    if (description.includes('🔼')) return 'medium';
    if (description.includes('🔽')) return 'low';
    return null;
  }

  /**
   * 提取标签
   */
  extractTags(description) {
    const matches = description.match(/#\w+/g);
    return matches || [];
  }

  /**
   * 提取上下文（@ 符号）
   */
  extractContexts(description) {
    const matches = description.match(/@\w+/g);
    return matches || [];
  }

  /**
   * 清理描述中的元数据
   */
  cleanDescription(description) {
    // 移除日期、优先级、标签、上下文
    let clean = description
      .replace(/📅\s*\d{4}-\d{2}-\d{2}/g, '')
      .replace(/🛫\s*\d{4}-\d{2}-\d{2}/g, '')
      .replace(/✅\s*\d{4}-\d{2}-\d{2}/g, '')
      .replace(/⏫|🔼|🔽/g, '')
      .replace(/#\w+/g, '')
      .replace(/@\w+/g, '')
      .trim();
    return clean;
  }

  /**
   * 添加任务到文件
   */
  addTask(filePath, taskConfig) {
    const fullPath = path.join(this.vaultPath, filePath);
    
    let content = '';
    if (fs.existsSync(fullPath)) {
      content = fs.readFileSync(fullPath, 'utf-8');
    }

    const taskLine = this.formatTaskLine(taskConfig);
    
    if (content.endsWith('\n')) {
      content += taskLine;
    } else if (content.length > 0) {
      content += '\n' + taskLine;
    } else {
      content = taskLine;
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  }

  /**
   * 格式化任务行
   */
  formatTaskLine(config) {
    const { indent = '', description, dueDate, startDate, priority, tags = [], contexts = [] } = config;
    
    let line = `${indent}- [ ] ${description}`;
    
    if (priority === 'high') line += ' ⏫';
    else if (priority === 'medium') line += ' 🔼';
    else if (priority === 'low') line += ' 🔽';
    
    if (dueDate) line += ` 📅 ${dueDate}`;
    if (startDate) line += ` 🛫 ${startDate}`;
    
    if (contexts.length > 0) line += ' ' + contexts.join(' ');
    if (tags.length > 0) line += ' ' + tags.join(' ');
    
    return line + '\n';
  }

  /**
   * 标记任务为完成/未完成
   */
  toggleTask(filePath, lineNumbers) {
    const fullPath = path.join(this.vaultPath, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`文件不存在：${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const taskRegex = /^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/;
    let modified = false;

    lineNumbers.forEach(lineNum => {
      const index = lineNum - 1;
      if (index >= 0 && index < lines.length) {
        const match = lines[index].match(taskRegex);
        if (match) {
          const indent = match[1];
          const currentStatus = match[2];
          const description = match[3];
          const newStatus = currentStatus.toLowerCase() === 'x' ? ' ' : 'x';
          
          // 如果是标记为完成，添加完成日期
          let newDescription = description;
          if (newStatus === 'x' && !description.includes('✅')) {
            const today = new Date().toISOString().split('T')[0];
            newDescription += ` ✅ ${today}`;
          }

          lines[index] = `${indent}- [${newStatus}] ${newDescription}`;
          modified = true;
        }
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8');
    }

    return modified;
  }

  /**
   * 搜索包含任务的文件
   */
  findTaskFiles(searchPattern = '*.md') {
    const files = [];
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const relPath = path.relative(this.vaultPath, fullPath);
          files.push(relPath);
        }
      });
    };
    walk(this.vaultPath);
    return files;
  }

  /**
   * 从所有文件中收集任务
   */
  collectAllTasks() {
    const files = this.findTaskFiles();
    const allTasks = [];

    files.forEach(filePath => {
      const tasks = this.parseTasks(filePath);
      tasks.forEach(task => {
        task.file = filePath;
        allTasks.push(task);
      });
    });

    return allTasks;
  }
}

module.exports = ObsidianSync;
