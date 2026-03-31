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
   */
  constructor(config) {
    this.config = config || {};
    this.workspaceRoot = config.workspaceRoot || '/home/ouyp/Learning/Practice/openclaw-universe';
    
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
    
    const roadmappingPath = path.join(projectPath, '02_roadmapping');
    
    if (!fs.existsSync(roadmappingPath)) {
      fs.mkdirSync(roadmappingPath, { recursive: true });
      console.log(`[Stage-Executor] 创建目录：${roadmappingPath}`);
    }

    console.log('[Stage-Executor] 调用 AI 工具执行 Roadmapping 阶段...');
    
    const result = await this.aiAdapter.execute('roadmapping', {
      projectPath: projectPath,
      designingPath: designingPath,
      outputDir: roadmappingPath
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
    
    const result = await this.aiAdapter.execute('detailing', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      roadmappingPath: path.join(projectPath, '02_roadmapping'),
      outputDir: detailingPath
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

    console.log('[Stage-Executor] 调用 AI 工具执行 Coding 阶段...');
    
    const result = await this.aiAdapter.execute('coding', {
      projectPath: projectPath,
      designingPath: path.join(projectPath, '01_designing'),
      detailingPath: path.join(projectPath, '03_detailing'),
      outputDir: srcPath
    });
    
    if (!result.success) {
      throw new Error(`Coding 阶段执行失败：${result.error}`);
    }
    
    console.log('[Stage-Executor] ✅ Coding 阶段完成');
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
