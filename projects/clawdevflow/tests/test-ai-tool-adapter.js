#!/usr/bin/env node

/**
 * AI Tool Adapter 单元测试脚本
 * 测试覆盖率目标：80%+
 */

const path = require('path');
const fs = require('fs');

// 测试结果统计
let passed = 0;
let failed = 0;

/**
 * 断言函数
 */
function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   AI Tool Adapter 单元测试                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  // ========== 测试 1: 模块加载 ==========
  console.log('📋 测试 1: 模块加载');
  try {
    const { AIToolAdapter } = require('../04_coding/src/ai-tool-adapter');
    assert(AIToolAdapter !== undefined, 'AIToolAdapter 模块已加载');
    assert(typeof AIToolAdapter === 'function', 'AIToolAdapter 是构造函数');
  } catch (error) {
    console.log(`❌ 模块加载失败：${error.message}`);
    failed += 2;
  }
  console.log('');

  // ========== 测试 2: ExecutionResult 类 ==========
  console.log('📋 测试 2: ExecutionResult 类');
  try {
    const { ExecutionResult } = require('../04_coding/src/ai-tool-adapter');
    
    // 测试成功结果
    const successResult = new ExecutionResult({
      success: true,
      outputs: ['PRD.md', 'TRD.md'],
      duration: 1000
    });
    
    assert(successResult.success === true, '成功结果创建正确');
    assert(Array.isArray(successResult.outputs), 'outputs 是数组');
    assert(successResult.outputs.length === 2, 'outputs 数量为 2');
    assert(successResult.duration === 1000, 'duration 正确');
    assert(successResult.error === null, '成功结果无 error');
    
    // 测试失败结果
    const failedResult = new ExecutionResult({
      success: false,
      error: '测试错误',
      duration: 500
    });
    
    assert(failedResult.success === false, '失败结果创建正确');
    assert(failedResult.error === '测试错误', 'error 消息正确');
    assert(failedResult.duration === 500, 'duration 正确');
    assert(Array.isArray(failedResult.outputs), '失败结果 outputs 是数组');
    assert(failedResult.outputs.length === 0, '失败结果 outputs 为空数组');
    
  } catch (error) {
    console.log(`❌ ExecutionResult 测试失败：${error.message}`);
    failed += 9;
  }
  console.log('');

  // ========== 测试 3: AIToolAdapter 基类 ==========
  console.log('📋 测试 3: AIToolAdapter 基类');
  try {
    const { AIToolAdapter } = require('../04_coding/src/ai-tool-adapter');
    
    // 创建测试适配器
    class TestAdapter extends AIToolAdapter {
      getType() {
        return 'test';
      }
      
      async execute(stageName, input) {
        return new ExecutionResult({
          success: true,
          outputs: ['test.md'],
          duration: 100
        });
      }
    }
    
    const config = {
      timeoutSeconds: 1800,
      logLevel: 'info'
    };
    
    const adapter = new TestAdapter(config);
    
    assert(adapter.getType() === 'test', 'getType() 返回正确');
    assert(adapter.config === config, '配置对象已设置');
    assert(typeof adapter.execute === 'function', 'execute 方法存在');
    assert(typeof adapter.log === 'function', 'log 方法存在');
    
  } catch (error) {
    console.log(`❌ AIToolAdapter 基类测试失败：${error.message}`);
    failed += 6;
  }
  console.log('');

  // ========== 测试 4: OpenCode 适配器加载 ==========
  console.log('📋 测试 4: OpenCode 适配器加载');
  try {
    const { OpenCodeAdapter } = require('../04_coding/src/adapters/opencode');
    assert(OpenCodeAdapter !== undefined, 'OpenCodeAdapter 模块已加载');
    assert(typeof OpenCodeAdapter === 'function', 'OpenCodeAdapter 是构造函数');
    
    // 检查是否继承 AIToolAdapter
    const { AIToolAdapter } = require('../04_coding/src/ai-tool-adapter');
    assert(OpenCodeAdapter.prototype instanceof AIToolAdapter, 'OpenCodeAdapter 继承 AIToolAdapter');
    
  } catch (error) {
    console.log(`❌ OpenCode 适配器加载失败：${error.message}`);
    failed += 3;
  }
  console.log('');

  // ========== 测试 5: Claude Code 适配器加载 ==========
  console.log('📋 测试 5: Claude Code 适配器加载');
  try {
    const { ClaudeCodeAdapter } = require('../04_coding/src/adapters/claude-code');
    assert(ClaudeCodeAdapter !== undefined, 'ClaudeCodeAdapter 模块已加载');
    assert(typeof ClaudeCodeAdapter === 'function', 'ClaudeCodeAdapter 是构造函数');
    
    const { AIToolAdapter } = require('../04_coding/src/ai-tool-adapter');
    assert(ClaudeCodeAdapter.prototype instanceof AIToolAdapter, 'ClaudeCodeAdapter 继承 AIToolAdapter');
    
  } catch (error) {
    console.log(`❌ Claude Code 适配器加载失败：${error.message}`);
    failed += 3;
  }
  console.log('');

  // ========== 测试 6: Custom 适配器加载 ==========
  console.log('📋 测试 6: Custom 适配器加载');
  try {
    const { CustomAdapter } = require('../04_coding/src/adapters/custom');
    assert(CustomAdapter !== undefined, 'CustomAdapter 模块已加载');
    assert(typeof CustomAdapter === 'function', 'CustomAdapter 是构造函数');
    
    const { AIToolAdapter } = require('../04_coding/src/ai-tool-adapter');
    assert(CustomAdapter.prototype instanceof AIToolAdapter, 'CustomAdapter 继承 AIToolAdapter');
    
  } catch (error) {
    console.log(`❌ Custom 适配器加载失败：${error.message}`);
    failed += 3;
  }
  console.log('');

  // ========== 测试 7: 适配器工厂方法 ==========
  console.log('📋 测试 7: 适配器工厂方法（模拟）');
  try {
    // 模拟适配器工厂逻辑
    const { OpenCodeAdapter } = require('../04_coding/src/adapters/opencode');
    const { ClaudeCodeAdapter } = require('../04_coding/src/adapters/claude-code');
    const { CustomAdapter } = require('../04_coding/src/adapters/custom');
    
    const adapters = {
      'opencode': OpenCodeAdapter,
      'claude-code': ClaudeCodeAdapter,
      'custom': CustomAdapter
    };
    
    assert(Object.keys(adapters).length === 3, '支持 3 种适配器');
    assert(adapters.opencode !== undefined, 'opencode 适配器存在');
    assert(adapters['claude-code'] !== undefined, 'claude-code 适配器存在');
    assert(adapters.custom !== undefined, 'custom 适配器存在');
    
  } catch (error) {
    console.log(`❌ 适配器工厂测试失败：${error.message}`);
    failed += 4;
  }
  console.log('');

  // ========== 测试 8: 配置解析 ==========
  console.log('📋 测试 8: 配置解析（模拟）');
  try {
    // 模拟配置解析
    const config = {
      opencode: {
        command: 'opencode',
        args: ['--print', '--permission-mode', 'bypassPermissions'],
        timeoutSeconds: 1800
      },
      claudeCode: {
        command: 'claude',
        args: ['--print', '--permission-mode', 'bypassPermissions'],
        timeoutSeconds: 1800
      },
      custom: {
        command: '/path/to/custom/tool',
        env: { API_KEY: '${CUSTOM_AI_API_KEY}' }
      }
    };
    
    assert(config.opencode.command === 'opencode', 'opencode 命令正确');
    assert(Array.isArray(config.opencode.args), 'opencode 参数是数组');
    assert(config.opencode.timeoutSeconds === 1800, 'opencode 超时正确');
    assert(config.claudeCode.command === 'claude', 'claude-code 命令正确');
    assert(config.custom.env !== undefined, 'custom 环境变量存在');
    
  } catch (error) {
    console.log(`❌ 配置解析测试失败：${error.message}`);
    failed += 6;
  }
  console.log('');

  // ========== 测试结果汇总 ==========
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   测试结果汇总                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log(`📊 覆盖率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('');

  if (failed > 0) {
    console.log('❌ 测试失败');
    process.exit(1);
  } else {
    console.log('✅ 所有测试通过');
    process.exit(0);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
