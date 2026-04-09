/**
 * Stage Executor (阶段执行器)
 * 
 * ClawDevFlow (CDF) 核心组件
 * 负责执行单个研发阶段（纯路由层）
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const { OpenCodeAdapter } = require('../adapters/opencode');

// 引入阶段模块（8 个阶段）
const stages = {
  designing: require('./stages/designing'),
  roadmapping: require('./stages/roadmapping'),
  detailing: require('./stages/detailing'),
  coding: require('./stages/coding'),
  testing: require('./stages/testing'),
  reviewing: require('./stages/reviewing'),
  precommit: require('./stages/precommit'),
  releasing: require('./stages/releasing')
};

/**
 * 阶段枚举
 */
const Stage = {
  DESIGNING: 'designing',
  ROADMAPPING: 'roadmapping',
  DETAILING: 'detailing',
  CODING: 'coding',
  TESTING: 'testing',
  REVIEWING: 'reviewing',
  PRECOMMIT: 'precommit',
  RELEASING: 'releasing'
};

/**
 * 阶段执行器（纯路由层）
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
    this.stateManager = stateManager;
    
    // 初始化 AI 工具适配器
    this.aiAdapter = new OpenCodeAdapter({
      workspaceRoot: this.workspaceRoot,
      timeoutSeconds: config.timeoutSeconds || 1800
    });
    
    console.log('[Stage-Executor] 阶段执行器初始化完成（路由层）');
    console.log(`[Stage-Executor]   工作区根目录：${this.workspaceRoot}`);
    console.log(`[Stage-Executor]   AI 工具：opencode`);
  }

  /**
   * 执行阶段（路由到对应阶段模块）
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
      const stageModule = stages[stageName];
      if (!stageModule) {
        throw new Error(`未知阶段：${stageName}`);
      }
      
      // 调用阶段模块的 execute 函数（统一接口）
      return await stageModule.execute(this.aiAdapter, this.stateManager, projectPath, input);
    } catch (error) {
      console.error(`[Stage-Executor] ❌ 阶段执行失败:`, error.message);
      return {
        success: false,
        outputs: [],
        error: error.message
      };
    }
  }
}

module.exports = StageExecutor;
module.exports.Stage = Stage;
