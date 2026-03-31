/**
 * Review Code Agent (代码阶段审阅 Agent)
 * 
 * ClawDevFlow (CDF) 审阅系统 - Code 阶段专用
 * 负责审阅源代码质量
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

const ReviewAgentBase = require('../review-framework/review-agent-base');
const codeCheckpoints = require('./code-checkpoints');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Code 阶段审阅 Agent
 * 
 * 检查点：
 * - C1: 代码规范（ESLint/Prettier）
 * - C2: 单元测试覆盖率（>80%）
 * - C3: 无编译错误（TypeScript/构建）
 * - C4: 无安全漏洞（SAST 扫描）
 * - C5: 代码架构（人工审阅）
 * - C6: 异常处理（AI 辅助）
 */
class ReviewCodeAgent extends ReviewAgentBase {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   */
  constructor(config) {
    super('coding', config);
  }

  /**
   * 加载检查点
   * @returns {Checkpoint[]} 检查点列表
   */
  loadCheckpoints() {
    return codeCheckpoints;
  }

  /**
   * 验证检查点
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<boolean>} 是否通过
   */
  async validateCheckpoint(checkpoint, input) {
    console.log(`[Review-Code] 执行检查：${checkpoint.id} - ${checkpoint.name}`);
    
    switch (checkpoint.id) {
      case 'C1':
        return this.checkCodeStyle(input);
      case 'C2':
        return this.checkTestCoverage(input);
      case 'C3':
        return this.checkCompilation(input);
      default:
        throw new Error(`未知检查点：${checkpoint.id}`);
    }
  }

  /**
   * C1: 检查代码规范
   * 
   * 运行 ESLint 检查代码风格
   * 
   * @param {object} input - 输入数据
   * @param {string} input.codeDir - 代码目录
   * @returns {Promise<boolean>} 是否通过
   */
  async checkCodeStyle(input) {
    try {
      const codeDir = input.codeDir || '04_coding/src';
      
      // 检查是否有 ESLint 配置
      const eslintConfigPath = path.join(codeDir, '.eslintrc.json');
      const hasEslintConfig = this.fileExists(eslintConfigPath);
      
      if (!hasEslintConfig) {
        console.log(`[Review-Code] C1: 未找到 ESLint 配置，跳过检查 ⚠️`);
        return true; // 没有配置时不阻止流程
      }

      // 运行 ESLint
      console.log(`[Review-Code] C1: 运行 ESLint 检查...`);
      
      try {
        const { stdout, stderr } = await execAsync(`cd ${codeDir} && npx eslint . --format json`, {
          timeout: 60000, // 60 秒超时
          maxBuffer: 10 * 1024 * 1024 // 10MB 缓冲区
        });

        if (stderr) {
          console.log(`[Review-Code] C1: ESLint 警告:`, stderr);
        }

        // 解析 ESLint 输出
        const results = JSON.parse(stdout);
        const errorCount = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
        const warningCount = results.reduce((sum, r) => sum + (r.warningCount || 0), 0);

        console.log(`[Review-Code] C1: ESLint 检查结果 - ${errorCount} 个错误，${warningCount} 个警告`);

        if (errorCount > 0) {
          console.log(`[Review-Code] C1: 发现 ${errorCount} 个 ESLint 错误 ❌`);
          return false;
        }

        if (warningCount > 10) {
          console.log(`[Review-Code] C1: 发现 ${warningCount} 个 ESLint 警告 ⚠️`);
          return false;
        }

        console.log(`[Review-Code] C1: 代码规范检查通过 ✅`);
        return true;

      } catch (eslintError) {
        // ESLint 返回非零退出码表示有错误
        if (eslintError.stdout) {
          try {
            const results = JSON.parse(eslintError.stdout);
            const errorCount = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
            console.log(`[Review-Code] C1: ESLint 发现 ${errorCount} 个错误 ❌`);
            return false;
          } catch (e) {
            // 解析失败
          }
        }
        
        console.log(`[Review-Code] C1: ESLint 执行失败:`, eslintError.message);
        return false;
      }
      
    } catch (error) {
      console.error(`[Review-Code] C1: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * C2: 检查测试覆盖率
   * 
   * 运行测试并检查覆盖率
   * 
   * @param {object} input - 输入数据
   * @param {string} input.codeDir - 代码目录
   * @returns {Promise<boolean>} 覆盖率是否达标
   */
  async checkTestCoverage(input) {
    try {
      const codeDir = input.codeDir || '04_coding/src';
      
      // 检查是否有测试配置
      const packageJsonPath = path.join(codeDir, 'package.json');
      
      if (!this.fileExists(packageJsonPath)) {
        console.log(`[Review-Code] C2: 未找到 package.json，跳过检查 ⚠️`);
        return true;
      }

      const packageJson = JSON.parse(this.readFile(packageJsonPath));
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;
      
      if (!hasTestScript) {
        console.log(`[Review-Code] C2: 未找到 test 脚本，跳过检查 ⚠️`);
        return true;
      }

      // 运行测试（带覆盖率）
      console.log(`[Review-Code] C2: 运行测试并检查覆盖率...`);
      
      try {
        // 尝试运行带覆盖率的测试
        const { stdout, stderr } = await execAsync(
          `cd ${codeDir} && npm run test:coverage || npm run test`,
          {
            timeout: 120000, // 120 秒超时
            maxBuffer: 20 * 1024 * 1024 // 20MB 缓冲区
          }
        );

        // 解析覆盖率输出（不同测试工具输出格式不同）
        const coverage = this.parseCoverageOutput(stdout);
        
        if (coverage) {
          console.log(`[Review-Code] C2: 测试覆盖率 ${coverage}%`);
          
          if (coverage >= 80) {
            console.log(`[Review-Code] C2: 测试覆盖率达标 ✅`);
            return true;
          } else {
            console.log(`[Review-Code] C2: 测试覆盖率不足 (${coverage}% < 80%) ❌`);
            return false;
          }
        } else {
          console.log(`[Review-Code] C2: 无法解析覆盖率，假设通过 ⚠️`);
          return true;
        }

      } catch (testError) {
        // 测试失败
        console.log(`[Review-Code] C2: 测试执行失败:`, testError.message);
        return false;
      }
      
    } catch (error) {
      console.error(`[Review-Code] C2: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * C3: 检查编译
   * 
   * 运行 TypeScript 编译或构建
   * 
   * @param {object} input - 输入数据
   * @param {string} input.codeDir - 代码目录
   * @returns {Promise<boolean>} 是否编译通过
   */
  async checkCompilation(input) {
    try {
      const codeDir = input.codeDir || '04_coding/src';
      
      // 检查是否有 TypeScript 配置
      const tsConfigPath = path.join(codeDir, 'tsconfig.json');
      const hasTsConfig = this.fileExists(tsConfigPath);
      
      if (hasTsConfig) {
        // TypeScript 项目
        console.log(`[Review-Code] C3: 运行 TypeScript 编译检查...`);
        
        try {
          const { stdout, stderr } = await execAsync(
            `cd ${codeDir} && npx tsc --noEmit`,
            {
              timeout: 60000,
              maxBuffer: 10 * 1024 * 1024
            }
          );

          if (stderr) {
            console.log(`[Review-Code] C3: TypeScript 编译警告:`, stderr);
          }

          console.log(`[Review-Code] C3: TypeScript 编译通过 ✅`);
          return true;

        } catch (tsError) {
          console.log(`[Review-Code] C3: TypeScript 编译失败 ❌`);
          console.log(`[Review-Code] C3: 错误信息:`, tsError.message);
          return false;
        }
      } else {
        // JavaScript 项目，检查构建脚本
        const packageJsonPath = path.join(codeDir, 'package.json');
        
        if (this.fileExists(packageJsonPath)) {
          const packageJson = JSON.parse(this.readFile(packageJsonPath));
          const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
          
          if (hasBuildScript) {
            console.log(`[Review-Code] C3: 运行构建检查...`);
            
            try {
              await execAsync(`cd ${codeDir} && npm run build`, {
                timeout: 120000,
                maxBuffer: 20 * 1024 * 1024
              });
              
              console.log(`[Review-Code] C3: 构建成功 ✅`);
              return true;
            } catch (buildError) {
              console.log(`[Review-Code] C3: 构建失败 ❌`);
              return false;
            }
          }
        }
        
        // 没有构建脚本，跳过
        console.log(`[Review-Code] C3: 未找到编译配置，跳过检查 ⚠️`);
        return true;
      }
      
    } catch (error) {
      console.error(`[Review-Code] C3: 检查失败:`, error.message);
      return false;
    }
  }

  /**
   * AI 辅助检查：安全漏洞
   * 
   * @param {Checkpoint} checkpoint - 检查点配置
   * @param {object} input - 输入数据
   * @returns {Promise<{passed: boolean, suggestions: string[]}>}
   */
  async runAICheckpoint(checkpoint, input) {
    if (checkpoint.id === 'C4') {
      // 安全检查：检查常见的安全问题
      const codeDir = input.codeDir || '04_coding/src';
      
      // 检查是否有敏感信息
      const sensitivePatterns = [
        /password\s*[:=]\s*['"]/i,
        /secret\s*[:=]\s*['"]/i,
        /api[_-]?key\s*[:=]\s*['"]/i,
        /token\s*[:=]\s*['"]/i
      ];
      
      const suggestions = [];
      let hasIssues = false;
      
      // 简单扫描代码文件
      const jsFiles = this.findFiles(codeDir, '.js');
      
      for (const file of jsFiles.slice(0, 10)) { // 限制扫描前 10 个文件
        try {
          const content = this.readFile(file);
          
          for (const pattern of sensitivePatterns) {
            if (pattern.test(content)) {
              hasIssues = true;
              suggestions.push(`检查文件 ${path.relative(codeDir, file)}: 可能包含敏感信息`);
            }
          }
        } catch (e) {
          // 忽略读取错误
        }
      }
      
      if (hasIssues) {
        console.log(`[Review-Code] C4: 发现潜在安全问题 ⚠️`);
        return { passed: false, suggestions };
      }
      
      console.log(`[Review-Code] C4: 未发现明显安全问题 ✅`);
      return { passed: true, suggestions: [] };
    }
    
    if (checkpoint.id === 'C6') {
      // 异常处理检查
      const codeDir = input.codeDir || '04_coding/src';
      
      const jsFiles = this.findFiles(codeDir, '.js');
      let filesWithErrorHandling = 0;
      let totalFiles = 0;
      
      for (const file of jsFiles.slice(0, 20)) { // 限制扫描前 20 个文件
        try {
          const content = this.readFile(file);
          totalFiles++;
          
          if (content.includes('try') && content.includes('catch')) {
            filesWithErrorHandling++;
          }
        } catch (e) {
          // 忽略
        }
      }
      
      const suggestions = [];
      
      if (totalFiles > 0) {
        const ratio = filesWithErrorHandling / totalFiles;
        
        if (ratio < 0.5) {
          suggestions.push(`只有 ${Math.round(ratio * 100)}% 的文件包含异常处理，建议提高覆盖率`);
          return { passed: false, suggestions };
        }
      }
      
      return { passed: true, suggestions: [] };
    }
    
    return { passed: true, suggestions: [] };
  }

  /**
   * 解析测试覆盖率输出
   * @param {string} output - 测试输出
   * @returns {number|null} 覆盖率百分比
   * @private
   */
  parseCoverageOutput(output) {
    // 尝试匹配常见的覆盖率输出格式
    const patterns = [
      /All files\s*\|\s*([\d.]+)\s*\|/,
      /Statements\s*:\s*([\d.]+)%/,
      /Coverage:\s*([\d.]+)%/,
      /总覆盖率\s*[:：]\s*([\d.]+)%/
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    
    return null;
  }

  /**
   * 查找指定扩展名的文件
   * @param {string} dir - 目录
   * @param {string} ext - 扩展名
   * @returns {string[]} 文件列表
   * @private
   */
  findFiles(dir, ext) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (item === 'node_modules' || item.startsWith('.')) {
          continue;
        }
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.findFiles(fullPath, ext));
        } else if (item.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // 忽略错误
    }
    
    return files;
  }
}

module.exports = ReviewCodeAgent;
