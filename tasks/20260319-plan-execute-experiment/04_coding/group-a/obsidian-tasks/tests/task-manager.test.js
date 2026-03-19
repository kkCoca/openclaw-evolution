/**
 * task-manager.test.js
 * TaskManager 单元测试 - 纯 Node.js 版本
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const TaskManager = require('../task-manager');

const TEST_VAULT_PATH = path.join(__dirname, 'test-vault');
const TEST_FILE = 'test-inbox.md';

// 测试工具函数
const tests = {
  passed: 0,
  failed: 0,
  
  run(name, fn) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`  ❌ ${name}`);
      console.log(`     错误：${error.message}`);
      this.failed++;
    }
  }
};

// 主测试函数
async function runTests() {
  console.log('🧪 TaskManager 测试\n');
  
  // 准备测试环境
  if (!fs.existsSync(TEST_VAULT_PATH)) {
    fs.mkdirSync(TEST_VAULT_PATH, { recursive: true });
  }
  
  const taskManager = new TaskManager({
    vaultPath: TEST_VAULT_PATH,
    defaultFile: TEST_FILE
  });
  
  // 清理测试文件
  const cleanup = () => {
    const testFilePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  };
  
  // ============ add() 测试 ============
  console.log('\n📝 add() 测试:');
  
  tests.run('应该成功添加基本任务', async () => {
    cleanup();
    const result = await taskManager.add({ description: '测试任务' });
    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('已添加'));
  });
  
  tests.run('应该拒绝空描述', async () => {
    try {
      await taskManager.add({ description: '' });
      throw new Error('应该抛出错误');
    } catch (error) {
      assert.ok(error.message.includes('不能为空'));
    }
  });
  
  tests.run('应该支持优先级', async () => {
    cleanup();
    const result = await taskManager.add({
      description: '高优先级任务',
      priority: 'high'
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.task.priority, 'high');
  });
  
  tests.run('应该支持到期日', async () => {
    cleanup();
    const dueDate = '2024-12-31';
    const result = await taskManager.add({
      description: '有截止日期的任务',
      dueDate
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.task.dueDate, dueDate);
  });
  
  tests.run('应该支持标签和上下文', async () => {
    cleanup();
    const result = await taskManager.add({
      description: '带标签的任务',
      tags: ['#work', '#urgent'],
      contexts: ['@office', '@computer']
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.task.tags.length, 2);
    assert.strictEqual(result.task.contexts.length, 2);
  });
  
  // ============ list() 测试 ============
  console.log('\n📋 list() 测试:');
  
  tests.run('应该列出所有任务', async () => {
    cleanup();
    await taskManager.add({ description: '任务 1' });
    await taskManager.add({ description: '任务 2' });
    const result = await taskManager.list();
    assert.strictEqual(result.success, true);
    assert.ok(result.count >= 2);
  });
  
  tests.run('应该限制结果数量', async () => {
    cleanup();
    await taskManager.add({ description: '任务 1' });
    await taskManager.add({ description: '任务 2' });
    await taskManager.add({ description: '任务 3' });
    const result = await taskManager.list({ limit: 2 });
    assert.strictEqual(result.success, true);
    assert.ok(result.count <= 2);
  });
  
  // ============ done() 测试 ============
  console.log('\n✅ done() 测试:');
  
  tests.run('应该标记任务为完成', async () => {
    cleanup();
    await taskManager.add({ description: '待完成任务 1' });
    await taskManager.add({ description: '待完成任务 2' });
    const result = await taskManager.done(TEST_FILE, [1]);
    assert.strictEqual(result.success, true);
  });
  
  tests.run('应该处理不存在的文件', async () => {
    try {
      await taskManager.done('nonexistent.md', [1]);
    } catch (error) {
      assert.ok(error.message.includes('不存在'));
    }
  });
  
  // ============ report() 测试 ============
  console.log('\n📊 report() 测试:');
  
  tests.run('应该生成今日报告', async () => {
    cleanup();
    const today = new Date().toISOString().split('T')[0];
    await taskManager.add({ description: '今日任务', dueDate: today });
    const result = await taskManager.report({ period: 'today' });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.period, 'today');
    assert.ok(result.summary);
  });
  
  tests.run('应该生成分组报告', async () => {
    cleanup();
    await taskManager.add({ description: '高优先级', priority: 'high' });
    await taskManager.add({ description: '中优先级', priority: 'medium' });
    const result = await taskManager.report({ period: 'all', groupBy: 'priority' });
    assert.strictEqual(result.success, true);
    assert.ok(result.report);
  });
  
  tests.run('应该包含统计信息', async () => {
    cleanup();
    const result = await taskManager.report();
    assert.ok(result.summary.total !== undefined);
    assert.ok(result.summary.pending !== undefined);
    assert.ok(result.summary.done !== undefined);
  });
  
  // ============ sortTasks() 测试 ============
  console.log('\n🔀 sortTasks() 测试:');
  
  tests.run('应该优先排序未完成的任务', () => {
    const tasks = [
      { status: 'done', priority: null },
      { status: 'pending', priority: 'low' },
      { status: 'pending', priority: 'high' }
    ];
    const sorted = taskManager.sortTasks(tasks);
    assert.strictEqual(sorted[0].status, 'pending');
    assert.strictEqual(sorted[0].priority, 'high');
  });
  
  tests.run('应该按优先级排序', () => {
    const tasks = [
      { status: 'pending', priority: 'low' },
      { status: 'pending', priority: 'high' },
      { status: 'pending', priority: 'medium' }
    ];
    const sorted = taskManager.sortTasks(tasks);
    assert.strictEqual(sorted[0].priority, 'high');
    assert.strictEqual(sorted[1].priority, 'medium');
    assert.strictEqual(sorted[2].priority, 'low');
  });
  
  // 清理
  cleanup();
  
  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果：${tests.passed} 通过，${tests.failed} 失败\n`);
  
  return tests.failed === 0;
}

// 运行测试
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('测试执行错误:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
