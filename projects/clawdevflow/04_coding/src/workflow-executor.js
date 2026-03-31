/**
 * Workflow Executor (工作流执行器)
 * 
 * ClawDevFlow (CDF) 主入口
 * 负责解析任务参数、加载配置、执行流程编排
 * 
 * @version 3.0.1
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
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
    console.log('║   AI 辅助研发流程编排引擎 v3.0.1                            ║');
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
  const configPath = path.join(__dirname, 'config.yaml');
  
  const defaultConfig = {
    global: {
      defaultAITool: 'opencode',
      workspaceRoot: '/home/ouyp/Learning/Practice/openclaw-universe',
      logLevel: 'info'
    },
    stages: {
      designing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800 },
      roadmapping: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800 },
      detailing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800 },
      coding: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800 },
      reviewing: { aiTool: 'opencode', requireReview: true, timeoutSeconds: 1800 }
    },
    rollback: {
      strategy: 'A',
      maxRetriesPerStage: 3
    }
  };
  
  try {
    if (fs.existsSync(configPath)) {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      // 简单 YAML 解析（仅支持基本结构）
      const config = parseSimpleYaml(yamlContent);
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.log('[CDF] ⚠️ YAML 解析失败，使用默认配置');
  }
  
  return defaultConfig;
}

/**
 * 简单 YAML 解析器
 */
function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');
  let currentSection = null;
  let currentSubsection = null;
  
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    
    if (indent === 0 && trimmed.endsWith(':')) {
      currentSection = trimmed.slice(0, -1);
      result[currentSection] = {};
      currentSubsection = null;
    } else if (indent === 2 && trimmed.endsWith(':')) {
      currentSubsection = trimmed.slice(0, -1);
      if (currentSection) {
        result[currentSection][currentSubsection] = {};
      }
    } else if (indent >= 4 && trimmed.includes(':')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      if (currentSubsection && result[currentSection][currentSubsection]) {
        result[currentSection][currentSubsection][key] = value.replace(/"/g, '');
      } else if (currentSection && result[currentSection]) {
        result[currentSection][key] = value.replace(/"/g, '');
      }
    }
  }
  
  return result;
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
  
  if (typeof taskConfig === 'string') {
    // 从任务描述字符串解析
    task = taskConfig;
    const lines = taskConfig.split('\n');
    for (const line of lines) {
      if (line.startsWith('# 任务：')) task = line.replace('# 任务：', '').trim();
      if (line.startsWith('场景类型：')) scenario = line.replace('场景类型：', '').trim();
      if (line.startsWith('需求说明：')) requirementsFile = line.replace('需求说明：', '').trim();
      if (line.startsWith('输出目录：')) outputDir = line.replace('输出目录：', '').trim();
      if (line.startsWith('原有项目：')) projectPath = line.replace('原有项目：', '').trim();
    }
  } else if (typeof taskConfig === 'object') {
    // 从对象解析
    task = taskConfig.task || '';
    scenario = taskConfig.scenario || '全新功能';
    requirementsFile = taskConfig.requirementsFile || '';
    projectPath = taskConfig.projectPath || taskConfig.outputDir || '';
    outputDir = taskConfig.outputDir || projectPath;
  }
  
  // 如果没有指定项目路径，从输出目录推断
  if (!projectPath && outputDir) {
    projectPath = outputDir;
  }
  
  // 如果没有指定需求文件，使用默认路径
  if (!requirementsFile && projectPath) {
    requirementsFile = path.join(projectPath, 'REQUIREMENTS.md');
  }
  
  return {
    workflowId,
    task,
    scenario,
    requirementsFile,
    projectPath,
    outputDir: outputDir || projectPath,
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
