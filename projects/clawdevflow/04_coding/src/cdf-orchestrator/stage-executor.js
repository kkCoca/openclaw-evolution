/**
 * Stage Executor (阶段执行器)
 * 
 * ClawDevFlow (CDF) 核心组件
 * 负责执行单个研发阶段（designing/roadmapping/detailing/coding/reviewing）
 * 
 * @version 3.0.1
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { validateRoadmappingEntry } = require('../utils/validate-roadmapping-entry');

// 引入 AI 工具适配器
const { OpenCodeAdapter } = require('../adapters/opencode');

const execAsync = promisify(exec);

/**
 * 阶段枚举
 */
const Stage = {
  DESIGNING: 'designing',
  ROADMAPPING: 'roadmapping',
  DETAILING: 'detailing',
  CODING: 'coding',
  REVIEWING: 'reviewing'
};

/**
 * 阶段执行器
 */
class StageExecutor {
  /**
   * 构造函数
   * @param {object} config - 配置对象
   * @param {object} stateManager - 状态管理器（用于 Gate 校验）
   */
  constructor(config, stateManager) {
    this.config = config || {};
    this.workspaceRoot = config.workspaceRoot || '/home/ouyp/Learning/Practice/openclaw-universe';
    this.stateManager = stateManager;  // P0#2 修复：传入 stateManager 用于 Gate 校验
    
    // 初始化 AI 工具适配器
    this.aiAdapter = new OpenCodeAdapter({
      workspaceRoot: this.workspaceRoot,
      timeoutSeconds: config.timeoutSeconds || 1800
    });
    
    console.log('[Stage-Executor] 阶段执行器初始化完成');
    console.log(`[Stage-Executor]   工作区根目录：${this.workspaceRoot}`);
    console.log(`[Stage-Executor]   AI 工具：opencode`);
  }

  /**
   * 执行阶段
   * 
   * @param {string} stageName - 阶段名称
   * @param {object} input - 阶段输入
   * @param {string} projectPath - 项目路径
   * @returns {Promise<{success: boolean, outputs: string[], error?: string}>}
   */
  async execute(stageName, input, projectPath) {
    console.log('');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log(`[Stage-Executor] 开始执行阶段：${stageName.toUpperCase()}`);
    console.log(`[Stage-Executor] 项目路径：${projectPath}`);
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('');

    try {
      switch (stageName) {
        case Stage.DESIGNING:
          return await this.executeDesigning(input, projectPath);
        
        case Stage.ROADMAPPING:
          return await this.executeRoadmapping(input, projectPath);
        
        case Stage.DETAILING:
          return await this.executeDetailing(input, projectPath);
        
        case Stage.CODING:
          return await this.executeCoding(input, projectPath);
        
        case Stage.REVIEWING:
          return await this.executeReviewing(input, projectPath);
        
        default:
          throw new Error(`未知阶段：${stageName}`);
      }
    } catch (error) {
      console.error(`[Stage-Executor] ❌ 阶段执行失败:`, error.message);
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }

  /**
   * 执行 Designing 阶段
   */
  async executeDesigning(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：DESIGNING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const designingPath = path.join(projectPath, '01_designing');
    
    // 确保目录存在
    if (!fs.existsSync(designingPath)) {
      fs.mkdirSync(designingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${designingPath}`);
    }

    // 调用 AI 工具适配器执行 Designing 阶段
    console.log('[Stage-Executor] 调用 AI 工具执行 Designing 阶段...');
    
    const result = await this.aiAdapter.execute('designing', {
      projectPath: projectPath,
      requirementsFile: input.requirementsFile,
      outputDir: designingPath
    });
    
    if (!result.success) {
      throw new Error(`Designing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Designing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    console.log(`[Stage-Executor]   文件：${result.outputs.join(', ')}`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Roadmapping 阶段
   */
  async executeRoadmapping(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：ROADMAPPING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    // P0#2 修复：Gate#2 防绕过校验（执行层）
    if (this.stateManager) {
      const validation = validateRoadmappingEntry(this.stateManager, this.stateManager.state);
      if (!validation.ok) {
        throw new Error(`roadmapping 入口门禁失败（Gate#2）: ${validation.reason}`);
      }
      console.log('[Stage-Executor] ✅ roadmapping 入口门禁校验通过（Gate#2）');
    }
    
    const roadmappingPath = path.join(projectPath, '02_roadmapping');
    const designingPath = path.join(projectPath, '01_designing');
    
    if (!fs.existsSync(roadmappingPath)) {
      fs.mkdirSync(roadmappingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${roadmappingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Roadmapping 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('roadmapping', {
      projectPath: projectPath,
      designingPath: designingPath,
      outputDir: roadmappingPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Roadmapping 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Roadmapping 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Detailing 阶段
   */
  async executeDetailing(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：DETAILING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const detailingPath = path.join(projectPath, '03_detailing');
    
    if (!fs.existsSync(detailingPath)) {
      fs.mkdirSync(detailingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${detailingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Detailing 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('detailing', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      roadmappingPath: path.join(projectPath, '02_roadmapping'),
      outputDir: detailingPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Detailing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Detailing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Coding 阶段
   */
  async executeCoding(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：CODING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const codingPath = path.join(projectPath, '04_coding');
    const srcPath = path.join(codingPath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${srcPath}`);
    }

    // Gate 防绕过：校验 manifest 存在 + commands.test 存在
    const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (!manifest.commands || !manifest.commands.test) {
          throw new Error('PROJECT_MANIFEST.json 缺少 commands.test 字段');
        }
        console.log('[Stage-Executor] ✅ PROJECT_MANIFEST.json 校验通过');
      } catch (error) {
        throw new Error(`PROJECT_MANIFEST.json 校验失败：${error.message}`);
      }
    } else {
      console.log('[Stage-Executor] ⚠️ PROJECT_MANIFEST.json 不存在，将在审阅阶段 reject');
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Coding 阶段...');
    
    // 传递 attempt + regenerateHint（自动返工闭环）
    const result = await this.aiAdapter.execute('coding', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      detailingPath: path.join(projectPath, '03_detailing'),
      outputDir: srcPath,
      attempt: input.attempt || 1,
      regenerateHint: input.regenerateHint || ''
    });
    
    if (!result.success) {
      throw new Error(`Coding 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Coding 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    // 确保 CHANGESET.md 一定存在（不依赖 AI）
    const changesetPath = path.join(codingPath, 'CHANGESET.md');
    if (!fs.existsSync(changesetPath)) {
      console.log('[Stage-Executor] 创建 CHANGESET.md 模板...');
      
      // GAP-1 修复：读取 manifest 的 commands.test，确保 CHANGESET 包含真实命令
      let testCmd = 'npm test';  // 默认占位
      try {
        const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (manifest.commands && manifest.commands.test) {
            testCmd = manifest.commands.test;
          }
        }
      } catch (error) {
        console.log('[Stage-Executor] ⚠️ 无法读取 manifest，使用默认 test 命令');
      }
      
      const changesetContent = `# 变更说明 - Coding 阶段

## 本次变更
- 时间：${new Date().toISOString()}
- 尝试次数：${input.attempt || 1}

## 如何跑命令
请根据 PROJECT_MANIFEST.json 执行以下命令：

\`\`\`bash
# 测试
${testCmd}

# Lint（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run lint'}

# 构建（如有）
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm run build'}
\`\`\`

## 变更详情
待补充...
`;
      fs.writeFileSync(changesetPath, changesetContent, 'utf8');
      console.log(`[Stage-Executor] ✅ CHANGESET.md 模板已创建（testCmd: ${testCmd}）`);
    }
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }

  /**
   * 执行 Reviewing 阶段
   */
  async executeReviewing(input, projectPath) {
    console.log('[Stage-Executor] ════════════════════════════════════════');
    console.log('[Stage-Executor] 开始执行阶段：REVIEWING');
    console.log('[Stage-Executor] ════════════════════════════════════════');
    
    const reviewingPath = path.join(projectPath, '05_reviewing');
    
    if (!fs.existsSync(reviewingPath)) {
      fs.mkdirSync(reviewingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${reviewingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Reviewing 阶段...');
    
    const result = await this.aiAdapter.execute('reviewing', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      codingPath: path.join(projectPath, '04_coding'),
      outputDir: reviewingPath
    });
    
    if (!result.success) {
      throw new Error(`Reviewing 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Reviewing 阶段完成');
    console.log(`[Stage-Executor]   产出：${result.outputs.length} 个文件`);
    
    return {
      success: true,
      outputs: result.outputs.map(o => ({
        name: path.basename(o),
        path: path.relative(projectPath, o)
      }))
    };
  }
}

module.exports = StageExecutor;
module.exports.Stage = Stage;
