/**
 * 自定义 AI 工具适配器
 * 
 * 支持调用任意自定义 AI 工具
 * 通过配置 command 和 args 灵活适配不同工具
 * 
 * @version 2.0.0
 * @author openclaw-ouyp
 */

const { AIToolAdapter, ExecutionResult } = require('./ai-tool-adapter');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

class CustomAdapter extends AIToolAdapter {
  /**
   * 获取工具类型
   * @returns {string} 工具类型
   */
  getType() {
    return 'custom';
  }

  /**
   * 执行阶段任务
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {Promise<ExecutionResult>} 执行结果
   */
  async execute(stageName, input) {
    const startTime = Date.now();
    this.log('开始执行阶段任务', { stage: stageName });

    try {
      // 检查配置
      if (!this.config.command) {
        throw new Error('Custom 适配器未配置 command');
      }

      // 构建命令
      const command = this.buildCommand(stageName, input);
      this.log('执行命令', { command });

      // 执行自定义命令
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.timeoutSeconds * 1000 || 1800000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: this.config.cwd || process.cwd(),
        env: {
          ...process.env,
          ...this.resolveEnvVariables(this.config.env || {})
        }
      });

      const duration = Date.now() - startTime;
      this.log('阶段任务完成', { stage: stageName, duration });

      // 解析输出
      const outputs = this.parseOutputs(stdout, stderr, stageName);

      return new ExecutionResult({
        success: !stderr,
        outputs,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log('阶段任务失败', { stage: stageName, error: error.message });

      return new ExecutionResult({
        success: false,
        error: error.message,
        duration
      });
    }
  }

  /**
   * 构建命令
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 命令行
   */
  buildCommand(stageName, input) {
    let command = this.config.command;
    const args = this.config.args || [];

    // 替换常见占位符
    command = command.replace('{stage}', stageName);
    
    // 替换 {input} 占位符（JSON 字符串）
    const inputJson = JSON.stringify(input);
    command = command.replace('{input}', inputJson.replace(/"/g, '\\"'));
    
    // 替换 {inputFile} 占位符（临时文件）
    if (command.includes('{inputFile}')) {
      const inputFile = this.createInputFile(input);
      command = command.replace('{inputFile}', inputFile);
    }

    // 添加额外参数
    if (args.length > 0) {
      command += ' ' + args.join(' ');
    }

    return command;
  }

  /**
   * 创建临时输入文件
   * @param {object} input - 输入数据
   * @returns {string} 文件路径
   */
  createInputFile(input) {
    const tempDir = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = `input-${Date.now()}.json`;
    const filePath = path.join(tempDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(input, null, 2), 'utf8');
    
    return filePath;
  }

  /**
   * 解析输出
   * @param {string} stdout - 标准输出
   * @param {string} stderr - 标准错误
   * @param {string} stageName - 阶段名称
   * @returns {string[]} 输出文件列表
   */
  parseOutputs(stdout, stderr, stageName) {
    // 如果配置了输出解析器，使用配置
    if (this.config.outputParser) {
      return this.parseWithConfig(stdout, this.config.outputParser);
    }

    // 默认实现：根据阶段返回预期输出
    const expectedOutputs = {
      designing: ['01_designing/PRD.md', '01_designing/TRD.md'],
      roadmapping: ['02_roadmapping/ROADMAP.md'],
      detailing: ['03_detailing/DETAIL.md'],
      coding: ['04_coding/src/', '04_coding/tests/', '04_coding/README.md'],
      reviewing: ['05_reviewing/REVIEW-REPORT.md']
    };

    return expectedOutputs[stageName] || [];
  }

  /**
   * 使用配置解析输出
   * @param {string} stdout - 标准输出
   * @param {object} parserConfig - 解析器配置
   * @returns {string[]} 输出文件列表
   */
  parseWithConfig(stdout, parserConfig) {
    const outputs = [];

    // 支持正则表达式匹配
    if (parserConfig.patterns) {
      parserConfig.patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'g');
        const matches = stdout.match(regex) || [];
        outputs.push(...matches);
      });
    }

    // 支持文件路径提取
    if (parserConfig.extractFiles) {
      const filePattern = /[0-9a-z_/-]+\.(md|js|ts|json|yaml|yml)/gi;
      const matches = stdout.match(filePattern) || [];
      outputs.push(...matches);
    }

    return [...new Set(outputs)];
  }

  /**
   * 解析环境变量中的占位符
   * @param {object} env - 环境变量对象
   * @returns {object} 解析后的环境变量
   */
  resolveEnvVariables(env) {
    const resolved = {};
    
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        // 替换 ${VAR_NAME} 占位符
        resolved[key] = value.replace(/\$\{(\w+)\}/g, (match, name) => {
          return process.env[name] || match;
        });
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * 构建任务描述
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @returns {string} 任务描述
   */
  buildTask(stageName, input) {
    return `执行 ${stageName} 阶段任务\n\n输入：${JSON.stringify(input)}`;
  }

  /**
   * 验证配置
   * @returns {boolean} 配置是否有效
   */
  async validateConfig() {
    if (!this.config.command) {
      console.error('Custom 适配器必须配置 command');
      return false;
    }

    // 检查命令是否存在
    try {
      const command = this.config.command.split(' ')[0];
      await execAsync(`which ${command}`);
      return true;
    } catch {
      console.error(`命令 ${this.config.command} 不存在或不在 PATH 中`);
      return false;
    }
  }

  /**
   * 清理临时文件
   * @param {string} inputFile - 输入文件路径
   */
  cleanup(inputFile) {
    if (inputFile && fs.existsSync(inputFile)) {
      try {
        fs.unlinkSync(inputFile);
        this.log('清理临时文件', { file: inputFile });
      } catch (error) {
        this.log('清理临时文件失败', { file: inputFile, error: error.message });
      }
    }
  }

  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      tool: 'custom',
      command: this.config.command,
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }
}

module.exports = {
  CustomAdapter
};
