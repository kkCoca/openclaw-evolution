/**
 * obsidian-sync.test.js
 * ObsidianSync 单元测试 - 纯 Node.js 版本
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ObsidianSync = require('../obsidian-sync');

const TEST_VAULT_PATH = path.join(__dirname, 'test-vault');
const TEST_FILE = 'sync-test.md';

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

async function runTests() {
  console.log('🧪 ObsidianSync 测试\n');
  
  if (!fs.existsSync(TEST_VAULT_PATH)) {
    fs.mkdirSync(TEST_VAULT_PATH, { recursive: true });
  }
  
  const sync = new ObsidianSync(TEST_VAULT_PATH);
  
  const cleanup = (file = TEST_FILE) => {
    const filePath = path.join(TEST_VAULT_PATH, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  };
  
  // ============ parseTasks() 测试 ============
  console.log('\n📄 parseTasks() 测试:');
  
  tests.run('应该解析空文件的任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 0);
  });
  
  tests.run('应该解析基本任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 测试任务\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].description, '测试任务');
    assert.strictEqual(tasks[0].status, 'pending');
  });
  
  tests.run('应该解析已完成任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [x] 已完成任务\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].status, 'done');
  });
  
  tests.run('应该解析带日期的任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 任务 📅 2024-01-15 🛫 2024-01-10 ✅ 2024-01-15\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].dueDate, '2024-01-15');
    assert.strictEqual(tasks[0].startDate, '2024-01-10');
    assert.strictEqual(tasks[0].doneDate, '2024-01-15');
  });
  
  tests.run('应该解析带优先级的任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 高优先级 ⏫\n- [ ] 中优先级 🔼\n- [ ] 低优先级 🔽\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 3);
    assert.strictEqual(tasks[0].priority, 'high');
    assert.strictEqual(tasks[1].priority, 'medium');
    assert.strictEqual(tasks[2].priority, 'low');
  });
  
  tests.run('应该解析带标签和上下文的任务', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 任务 #work #urgent @office @computer\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].tags.length, 2);
    assert.strictEqual(tasks[0].contexts.length, 2);
  });
  
  tests.run('应该清理描述中的元数据', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 纯描述 ⏫ 📅 2024-01-15 #tag @ctx\n');
    const tasks = sync.parseTasks(TEST_FILE);
    assert.strictEqual(tasks[0].description, '纯描述');
  });
  
  // ============ addTask() 测试 ============
  console.log('\n➕ addTask() 测试:');
  
  tests.run('应该添加任务到空文件', () => {
    cleanup();
    const result = sync.addTask(TEST_FILE, { description: '新任务' });
    assert.strictEqual(result, true);
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('- [ ] 新任务'));
  });
  
  tests.run('应该添加任务到现有文件', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 现有任务\n');
    sync.addTask(TEST_FILE, { description: '新任务' });
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    assert.strictEqual(lines.length, 2);
  });
  
  tests.run('应该添加带元数据的任务', () => {
    cleanup();
    sync.addTask(TEST_FILE, {
      description: '完整任务',
      priority: 'high',
      dueDate: '2024-12-31',
      tags: ['#work'],
      contexts: ['@office']
    });
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('⏫'));
    assert.ok(content.includes('📅 2024-12-31'));
    assert.ok(content.includes('#work'));
    assert.ok(content.includes('@office'));
  });
  
  // ============ toggleTask() 测试 ============
  console.log('\n🔄 toggleTask() 测试:');
  
  tests.run('应该切换任务状态', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 待完成\n');
    sync.toggleTask(TEST_FILE, [1]);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('- [x] 待完成'));
  });
  
  tests.run('应该添加完成日期', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    const today = new Date().toISOString().split('T')[0];
    fs.writeFileSync(filePath, '- [ ] 待完成\n');
    sync.toggleTask(TEST_FILE, [1]);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes(`✅ ${today}`));
  });
  
  tests.run('应该支持切换回未完成', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [x] 已完成 ✅ 2024-01-15\n');
    sync.toggleTask(TEST_FILE, [1]);
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.ok(content.includes('- [ ] 已完成 ✅ 2024-01-15'));
  });
  
  tests.run('应该处理不存在的行号', () => {
    cleanup();
    const filePath = path.join(TEST_VAULT_PATH, TEST_FILE);
    fs.writeFileSync(filePath, '- [ ] 任务\n');
    const result = sync.toggleTask(TEST_FILE, [999]);
    assert.strictEqual(result, false);
  });
  
  // ============ findTaskFiles() 测试 ============
  console.log('\n🔍 findTaskFiles() 测试:');
  
  tests.run('应该找到所有 Markdown 文件', () => {
    const file1 = path.join(TEST_VAULT_PATH, 'file1.md');
    const file2 = path.join(TEST_VAULT_PATH, 'file2.md');
    const fileTxt = path.join(TEST_VAULT_PATH, 'file.txt');
    
    fs.writeFileSync(file1, '');
    fs.writeFileSync(file2, '');
    fs.writeFileSync(fileTxt, '');
    
    const files = sync.findTaskFiles();
    
    assert.ok(files.some(f => f.endsWith('file1.md')));
    assert.ok(files.some(f => f.endsWith('file2.md')));
    assert.ok(!files.some(f => f.endsWith('file.txt')));
    
    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
    fs.unlinkSync(fileTxt);
  });
  
  // ============ collectAllTasks() 测试 ============
  console.log('\n📥 collectAllTasks() 测试:');
  
  tests.run('应该收集所有文件的任务', () => {
    const file1 = path.join(TEST_VAULT_PATH, 'collect1.md');
    const file2 = path.join(TEST_VAULT_PATH, 'collect2.md');
    
    fs.writeFileSync(file1, '- [ ] 任务 1\n');
    fs.writeFileSync(file2, '- [ ] 任务 2\n');
    
    const tasks = sync.collectAllTasks();
    
    assert.ok(tasks.length >= 2);
    assert.ok(tasks.some(t => t.description === '任务 1'));
    assert.ok(tasks.some(t => t.description === '任务 2'));
    
    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
  });
  
  // 清理
  cleanup();
  
  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果：${tests.passed} 通过，${tests.failed} 失败\n`);
  
  return tests.failed === 0;
}

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
