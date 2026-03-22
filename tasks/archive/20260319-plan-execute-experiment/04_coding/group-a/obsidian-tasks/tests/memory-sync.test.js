/**
 * memory-sync.test.js
 * MemorySync 单元测试 - 纯 Node.js 版本
 */

const assert = require('assert');
const MemorySync = require('../memory-sync');

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

function runTests() {
  console.log('🧪 MemorySync 测试\n');
  
  let memory;
  
  beforeEach = () => {
    memory = new MemorySync();
  };
  
  // ============ addTask() 测试 ============
  console.log('\n➕ addTask() 测试:');
  
  tests.run('应该添加任务到内存', () => {
    beforeEach();
    const key = memory.addTask({
      file: 'test.md',
      description: '测试任务',
      line: 1
    });
    assert.ok(key);
    assert.ok(key.includes('test.md:'));
  });
  
  tests.run('应该生成唯一 ID', () => {
    beforeEach();
    const key1 = memory.addTask({ file: 'test.md', description: '任务 1', line: 1 });
    const key2 = memory.addTask({ file: 'test.md', description: '任务 2', line: 2 });
    assert.notStrictEqual(key1, key2);
  });
  
  tests.run('应该设置创建时间', () => {
    beforeEach();
    const key = memory.addTask({ file: 'test.md', description: '任务', line: 1 });
    const task = memory.getTask('test.md', 1);
    assert.ok(task);
    assert.ok(task.createdAt);
  });
  
  // ============ syncTasks() 测试 ============
  console.log('\n🔄 syncTasks() 测试:');
  
  tests.run('应该同步多个任务', () => {
    beforeEach();
    const tasks = [
      { file: 'test.md', line: 1, description: '任务 1' },
      { file: 'test.md', line: 2, description: '任务 2' },
      { file: 'test.md', line: 3, description: '任务 3' }
    ];
    memory.syncTasks(tasks);
    const allTasks = memory.getAllTasks();
    assert.strictEqual(allTasks.length, 3);
  });
  
  tests.run('应该更新 lastSync 时间', () => {
    beforeEach();
    memory.syncTasks([{ file: 'test.md', line: 1, description: '任务' }]);
    assert.ok(memory.lastSync);
  });
  
  // ============ toggleTask() 测试 ============
  console.log('\n🔄 toggleTask() 测试:');
  
  tests.run('应该切换任务状态', () => {
    beforeEach();
    memory.addTask({
      file: 'test.md',
      line: 1,
      description: '任务',
      status: 'pending'
    });
    const task = memory.toggleTask('test.md', 1);
    assert.strictEqual(task.status, 'done');
  });
  
  tests.run('应该添加完成日期', () => {
    beforeEach();
    memory.addTask({
      file: 'test.md',
      line: 1,
      description: '任务',
      status: 'pending'
    });
    const task = memory.toggleTask('test.md', 1);
    assert.ok(task.doneDate);
  });
  
  tests.run('应该切换回 pending 状态', () => {
    beforeEach();
    memory.addTask({
      file: 'test.md',
      line: 1,
      description: '任务',
      status: 'done',
      doneDate: '2024-01-15'
    });
    const task = memory.toggleTask('test.md', 1);
    assert.strictEqual(task.status, 'pending');
  });
  
  tests.run('应该更新 updatedAt 时间', () => {
    beforeEach();
    memory.addTask({
      file: 'test.md',
      line: 1,
      description: '任务',
      status: 'pending'
    });
    const task = memory.toggleTask('test.md', 1);
    assert.ok(task.updatedAt);
  });
  
  // ============ getTask() 测试 ============
  console.log('\n🔍 getTask() 测试:');
  
  tests.run('应该获取存在的任务', () => {
    beforeEach();
    memory.addTask({
      file: 'test.md',
      line: 1,
      description: '测试任务'
    });
    const task = memory.getTask('test.md', 1);
    assert.ok(task);
    assert.strictEqual(task.description, '测试任务');
  });
  
  tests.run('应该返回 undefined 对于不存在的任务', () => {
    beforeEach();
    const task = memory.getTask('test.md', 999);
    assert.strictEqual(task, undefined);
  });
  
  // ============ getAllTasks() 测试 ============
  console.log('\n📋 getAllTasks() 测试:');
  
  tests.run('应该返回所有任务', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2' });
    const tasks = memory.getAllTasks();
    assert.strictEqual(tasks.length, 2);
  });
  
  tests.run('空内存应该返回空数组', () => {
    beforeEach();
    const tasks = memory.getAllTasks();
    assert.strictEqual(tasks.length, 0);
  });
  
  // ============ query() 测试 ============
  console.log('\n🔎 query() 测试:');
  
  tests.run('应该按状态过滤', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', status: 'pending' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', status: 'done' });
    memory.addTask({ file: 'test.md', line: 3, description: '任务 3', status: 'pending' });
    const tasks = memory.query({ status: 'pending' });
    assert.strictEqual(tasks.length, 2);
  });
  
  tests.run('应该按优先级过滤', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', priority: 'high' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', priority: 'medium' });
    const tasks = memory.query({ priority: 'high' });
    assert.strictEqual(tasks.length, 1);
  });
  
  tests.run('应该按标签过滤', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', tags: ['#work'] });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', tags: ['#personal'] });
    const tasks = memory.query({ tag: '#work' });
    assert.strictEqual(tasks.length, 1);
  });
  
  tests.run('应该支持多条件过滤', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', status: 'pending', priority: 'high' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', status: 'pending', priority: 'low' });
    memory.addTask({ file: 'test.md', line: 3, description: '任务 3', status: 'done', priority: 'high' });
    const tasks = memory.query({ status: 'pending', priority: 'high' });
    assert.strictEqual(tasks.length, 1);
  });
  
  // ============ getStats() 测试 ============
  console.log('\n📊 getStats() 测试:');
  
  tests.run('应该返回统计信息', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', status: 'pending' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', status: 'pending' });
    memory.addTask({ file: 'test.md', line: 3, description: '任务 3', status: 'done' });
    const stats = memory.getStats();
    assert.strictEqual(stats.total, 3);
    assert.strictEqual(stats.pending, 2);
    assert.strictEqual(stats.done, 1);
  });
  
  tests.run('应该按优先级统计', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务 1', priority: 'high' });
    memory.addTask({ file: 'test.md', line: 2, description: '任务 2', priority: 'medium' });
    memory.addTask({ file: 'test.md', line: 3, description: '任务 3', priority: 'low' });
    const stats = memory.getStats();
    assert.ok(stats.byPriority);
    assert.strictEqual(stats.byPriority.high, 1);
    assert.strictEqual(stats.byPriority.medium, 1);
    assert.strictEqual(stats.byPriority.low, 1);
  });
  
  tests.run('应该包含 lastSync 时间', () => {
    beforeEach();
    memory.syncTasks([{ file: 'test.md', line: 1, description: '任务' }]);
    const stats = memory.getStats();
    assert.ok(stats.lastSync !== undefined);
  });
  
  // ============ clear() 测试 ============
  console.log('\n🗑️  clear() 测试:');
  
  tests.run('应该清除所有任务', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务' });
    memory.clear();
    const tasks = memory.getAllTasks();
    assert.strictEqual(tasks.length, 0);
  });
  
  tests.run('应该重置 lastSync', () => {
    beforeEach();
    memory.syncTasks([{ file: 'test.md', line: 1, description: '任务' }]);
    memory.clear();
    assert.strictEqual(memory.lastSync, null);
  });
  
  // ============ export() and import() 测试 ============
  console.log('\n💾 export/import() 测试:');
  
  tests.run('应该导出数据', () => {
    beforeEach();
    memory.addTask({ file: 'test.md', line: 1, description: '任务' });
    const data = memory.export();
    assert.ok(data.tasks);
    assert.ok(data.exportedAt);
    assert.strictEqual(data.tasks.length, 1);
  });
  
  tests.run('应该导入数据', () => {
    beforeEach();
    const data = {
      tasks: [
        { key: 'test.md:1', file: 'test.md', line: 1, description: '导入任务', status: 'pending' }
      ],
      lastSync: '2024-01-15T00:00:00.000Z'
    };
    memory.import(data);
    const tasks = memory.getAllTasks();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].description, '导入任务');
    assert.strictEqual(memory.lastSync, data.lastSync);
  });
  
  tests.run('应该处理空数据', () => {
    beforeEach();
    memory.import({});
    const tasks = memory.getAllTasks();
    assert.strictEqual(tasks.length, 0);
  });
  
  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果：${tests.passed} 通过，${tests.failed} 失败\n`);
  
  return tests.failed === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
