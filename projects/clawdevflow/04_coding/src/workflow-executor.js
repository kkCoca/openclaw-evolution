/**
 * Workflow Executor (工作流执行器)
 * 
 * ClawDevFlow (CDF) 主入口
 * 负责解析任务参数、加载配置、执行流程编排
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const WorkflowOrchestrator = require('./cdf-orchestrator/workflow-orchestrator');

/**
 * 主函数：执行工作流
 * 
 * 当作为 Skill 被 sessions_spawn 调用时，taskConfig 来自任务描述
 * 
 * @param {object} taskConfig - 任务配置
 */
async function executeWorkflow(taskConfig) {
  const startTime = Date.now();
  
  try {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ClawDevFlow (CDF) - 爪刃研发流                           ║');
    console.log('║   AI 辅助研发流程编排引擎 v3.4.0                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    // 1. 加载配置
    console.log('[CDF] 步骤 1/3: 加载配置文件...');
    const config = loadConfig();
    console.log('[CDF] ✅ 配置加载完成');
    console.log(`[CDF]   默认 AI 工具：${config.global.defaultAITool}`);
    console.log(`[CDF]   工作区根目录：${config.global.workspaceRoot}`);
    console.log('');
    
    // 2. 解析任务参数
    console.log('[CDF] 步骤 2/3: 解析任务参数...');
    const workflowConfig = parseTaskConfig(taskConfig, config);
    console.log('[CDF] ✅ 任务解析完成');
    console.log(`[CDF]   工作流 ID: ${workflowConfig.workflowId}`);
    console.log(`[CDF]   场景类型：${workflowConfig.scenario}`);
    console.log(`[CDF]   项目路径：${workflowConfig.projectPath}`);
    console.log(`[CDF]   需求文件：${workflowConfig.requirementsFile}`);
    console.log('');
    
    // 3. 执行流程
    console.log('[CDF] 步骤 3/3: 执行流程编排...');
    const orchestrator = new WorkflowOrchestrator(config);
    const result = await orchestrator.execute(workflowConfig);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ClawDevFlow (CDF) 执行成功                              ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`工作流 ID: ${result.workflowId}`);
      console.log(`执行时长：${(duration / 1000).toFixed(2)}s`);
      console.log(`进度：${result.report.progress.passed}/${result.report.progress.total} (${result.report.progress.percentage}%)`);
      console.log(`待修复项：${result.report.totalFixItems} 项`);
      console.log('');
    } else {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   ClawDevFlow (CDF) 执行失败                              ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`工作流 ID: ${result.workflowId}`);
      console.log(`失败阶段：${result.failedStage || '未知'}`);
      console.log(`错误信息：${result.error}`);
      console.log('');
    }
    
    return result;
  } catch (error) {
    console.error('[CDF] ❌ 执行失败:', error.message);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 加载配置文件
 */
function loadConfig() {
  const configPath = path.join(__dirname, 'config/config.yaml');
  
  // 使用环境变量或相对路径
  const defaultWorkspaceRoot = process.env.OPENCLAW_WORKSPACE_ROOT || 
                               path.resolve(__dirname, '../../..');
  
  const defaultConfig = {
    global: {
      defaultAITool: 'opencode',
      workspaceRoot: defaultWorkspaceRoot,
      logLevel: 'info',
      runtimeDir: '.cdf-work'
    },
    stages: {
      designing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 3 },
      roadmapping: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 3 },
      detailing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 3 },
      coding: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 3600, maxRetries: 3 },
      testing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 2 },
      reviewing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 2 },
      precommit: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 2 },
      releasing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800, maxRetries: 2 }
    },
    openclaw: {
      command: 'opencode',
      args: ['--print'],
      taskArg: '--task',
      timeoutSecondsDefault: 1800
    },
    rollback: {
      strategy: 'A',
      maxRetriesPerStage: 3
    }
  };
  
  try {
    if (fs.existsSync(configPath)) {
      let yamlContent = fs.readFileSync(configPath, 'utf8');
      // 替换环境变量
      yamlContent = substituteEnvVars(yamlContent);
      // 使用 YAML parser 解析
      const config = YAML.parse(yamlContent);
      
      // 合并默认配置
      const mergedConfig = {
        global: { ...defaultConfig.global, ...config.global },
        stages: { ...defaultConfig.stages, ...config.stages },
        openclaw: { ...defaultConfig.openclaw, ...config.openclaw },
        rollback: { ...defaultConfig.rollback, ...config.rollback }
      };
      
      console.log(`[CDF] 配置加载成功`);
      console.log(`[CDF]   默认 AI 工具：${mergedConfig.global.defaultAITool}`);
      console.log(`[CDF]   阶段数量：${Object.keys(mergedConfig.stages).length}`);
      
      return mergedConfig;
    }
  } catch (error) {
    console.log(`[CDF] ⚠️ YAML 解析失败：${error.message}`);
    console.log('[CDF] 使用默认配置');
  }
  
  return defaultConfig;
}

/**
 * 替换字符串中的环境变量
 * 
 * 支持以下语法：
 * - ${VAR_NAME} - 替换为环境变量值，未设置时替换为空字符串
 * - ${VAR_NAME:-default} - 替换为环境变量值，未设置时使用默认值
 * - ${VAR_NAME:=default} - 替换为环境变量值，未设置时使用默认值并设置环境变量
 * 
 * @function substituteEnvVars
 * @param {string} str - 包含环境变量占位符的字符串
 * @returns {string} 替换后的字符串
 * 
 * @example
 * // 假设环境变量 OPENCLAW_WORKSPACE_ROOT 未设置
 * substituteEnvVars('${OPENCLAW_WORKSPACE_ROOT:-../../..}')
 * // 返回：'../../..'
 * 
 * @example
 * // 假设环境变量 CUSTOM_API_KEY 已设置为 'abc123'
 * substituteEnvVars('${CUSTOM_API_KEY}')
 * // 返回：'abc123'
 * 
 * @author openclaw-ouyp
 * @since 3.3.0
 */
function substituteEnvVars(str) {
  if (typeof str !== 'string') return str;
  
  // 匹配 ${VAR_NAME} 或 ${VAR_NAME:-default} 或 ${VAR_NAME:=default}
  const envRegex = /\$\{([^}:]+?)(?::(-|=)([^}]*))?\}/g;
  
  return str.replace(envRegex, (match, varName, operator, defaultValue) => {
    let value = process.env[varName];
    
    if (value === undefined || value === '') {
      if (defaultValue !== undefined) {
        value = defaultValue;
        if (operator === '=') {
          process.env[varName] = value;
        }
      } else {
        value = '';
      }
    }
    
    return value;
  });
}

/**
 * 解析任务行（兼容 # 前缀与中英文冒号）
 * @param {string} line
 * @returns {{key: string, value: string}|null}
 */
function parseTaskLine(line) {
  if (!line) return null;
  const trimmed = line.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/^#+\s*/, '').replace(/^-+\s*/, '');
  const chineseColonIndex = normalized.indexOf('：');
  const asciiColonIndex = normalized.indexOf(':');
  const splitIndex = [chineseColonIndex, asciiColonIndex]
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];
  if (splitIndex === undefined || splitIndex < 0) return null;
  const key = normalized.slice(0, splitIndex).trim();
  const value = normalized.slice(splitIndex + 1).trim();
  if (!key) return null;
  return { key, value };
}

/**
 * 解析任务配置
 */
function parseTaskConfig(taskConfig, config) {
  const workflowId = `cdf-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  // 支持多种输入格式
  let task = '';
  let scenario = '全新功能';
  let requirementsFile = '';
  let projectPath = '';
  let outputDir = '';
  let resume = false;
  
  if (typeof taskConfig === 'string') {
    // 从任务描述字符串解析
    task = taskConfig;
    const lines = taskConfig.split('\n');
    for (const line of lines) {
      const parsed = parseTaskLine(line);
      if (!parsed) continue;

      const { key, value } = parsed;
      switch (key) {
        case '任务':
        case '任务描述':
        case '任务名称':
          task = value;
          break;
        case '场景类型':
          scenario = value;
          break;
        case '需求说明':
        case '需求描述':
        case '问题描述':
        case '问题记录':
        case '需求文件':
          requirementsFile = value;
          break;
        case '输出目录':
          outputDir = value;
          break;
        case '项目路径':
        case '原有项目':
          projectPath = value;
          break;
        case '恢复流程':
          resume = value === 'true';
          break;
        default:
          break;
      }
    }
  } else if (typeof taskConfig === 'object' && taskConfig !== null) {
    // 从对象解析
    task = taskConfig.task || '';
    scenario = taskConfig.scenario || '全新功能';
    requirementsFile = taskConfig.requirementsFile || '';
    projectPath = taskConfig.projectPath || taskConfig.outputDir || '';
    outputDir = taskConfig.outputDir || projectPath;
    resume = taskConfig.resume === true || taskConfig.resume === 'true';
  } else if (taskConfig !== undefined) {
    console.log('[CDF] ⚠️ 任务配置类型无效，使用默认解析结果');
  }
  
  // 如果没有指定项目路径，从输出目录推断
  if (!projectPath && outputDir) {
    projectPath = outputDir;
  }
  
  // 如果没有指定需求文件，使用默认文件名（在编排器中解析为完整路径）
  if (!requirementsFile) {
    if (scenario.includes('问题修复') || scenario.toLowerCase().includes('bug')) {
      requirementsFile = 'ISSUES.md';
    } else {
      requirementsFile = 'REQUIREMENTS.md';
    }
  }
  
  return {
    workflowId,
    task,
    scenario,
    requirementsFile,
    projectPath,
    outputDir: outputDir || projectPath,
    resume,
    config
  };
}

// 导出主函数
module.exports = {
  executeWorkflow
};

// 如果直接运行（命令行模式），解析命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  const taskConfig = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--task':
        taskConfig.task = nextArg;
        i++;
        break;
      case '--scenario':
        taskConfig.scenario = nextArg;
        i++;
        break;
      case '--requirements':
        taskConfig.requirementsFile = nextArg;
        i++;
        break;
      case '--output':
        taskConfig.outputDir = nextArg;
        i++;
        break;
      case '--resume':
        taskConfig.resume = nextArg;
        i++;
        break;
    }
  }
  
  executeWorkflow(taskConfig).then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
