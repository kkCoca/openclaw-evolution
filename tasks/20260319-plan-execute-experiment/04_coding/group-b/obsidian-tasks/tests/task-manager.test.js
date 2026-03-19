/**
 * task-manager.test.js - 单元测试
 * 
 * 测试 TaskManager 和 Task 类的核心功能
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { Task, TaskManager, TaskStatus, Priority } = require('../scripts/task-manager');

// 测试用的临时目录
const TEST_VAULT_PATH = path.join(__dirname, 'test-vault');
const TEST_TASKS_FILE = 'test-tasks.json';

/**
 * 清理测试环境
 */
function cleanup() {
  const tasksFilePath = path.join(TEST_VAULT_PATH, TEST_TASKS_FILE);
  if (fs.existsSync(tasksFilePath)) {
    fs.unlinkSync(tasksFilePath);
  }
  if (fs.existsSync(TEST_VAULT_PATH)) {
    fs.rmdirSync(TEST_VAULT_PATH);
  }
}

/**
 * 测试套件
 */
function runTests() {
  console.log('🧪 开始运行单元测试...\n');
  
  let passed = 0;
  let failed = 0;

  /**
   * 辅助函数：运行单个测试
   */
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }

  /**
   * 辅助函数：断言相等
   */
  function equal(actual, expected, message) {
    assert.strictEqual(actual, expected, message);
  }

  /**
   * 辅助函数：断言深度相等
   */
  function deepEqual(actual, expected, message) {
    assert.deepStrictEqual(actual, expected, message);
  }

  /**
   * 辅助函数：断言抛出错误
   */
  function throws(fn, message) {
    assert.throws(fn, message ? undefined : Error);
  }

  // ============================================
  // Task 类测试
  // ============================================
  
  console.log('📋 Task 类测试\n');

  test('Task - 创建任务', () => {
    const task = new Task(1, 'Test task', { priority: Priority.HIGH });
    equal(task.id, 1);
    equal(task.description, 'Test task');
    equal(task.priority, Priority.HIGH);
    equal(task.status, TaskStatus.PENDING);
  });

  test('Task - 默认优先级', () => {
    const task = new Task(2, 'Test task 2');
    equal(task.priority, Priority.MEDIUM);
  });

  test('Task - 标记为进行中', () => {
    const task = new Task(3, 'Test task 3');
    task.start();
    equal(task.status, TaskStatus.IN_PROGRESS);
  });

  test('Task - 不能重复开始', () => {
    const task = new Task(4, 'Test task 4');
    task.start();
    throws(() => task.start());
  });

  test('Task - 标记为已完成', () => {
    const task = new Task(5, 'Test task 5');
    task.complete('Done!');
    equal(task.status, TaskStatus.COMPLETED);
    equal(task.completionNote, 'Done!');
    assert(task.completedAt !== null);
  });

  test('Task - 不能重复完成', () => {
    const task = new Task(6, 'Test task 6');
    task.complete();
    throws(() => task.complete());
  });

  test('Task - toJSON 序列化', () => {
    const task = new Task(7, 'Test task 7', { project: 'test' });
    const json = task.toJSON();
    equal(json.id, 7);
    equal(json.description, 'Test task 7');
    equal(json.project, 'test');
  });

  test('Task - fromJSON 反序列化', () => {
    const json = {
      id: 8,
      description: 'Test task 8',
      status: TaskStatus.COMPLETED,
      priority: Priority.LOW,
      createdAt: '2026-03-20T00:00:00.000Z',
      updatedAt: '2026-03-20T00:00:00.000Z',
      completedAt: '2026-03-20T00:00:00.000Z'
    };
    const task = Task.fromJSON(json);
    equal(task.id, 8);
    equal(task.status, TaskStatus.COMPLETED);
    equal(task.priority, Priority.LOW);
  });

  // ============================================
  // TaskManager 类测试
  // ============================================
  
  console.log('\n📋 TaskManager 类测试\n');

  let manager;

  test('TaskManager - 初始化', () => {
    cleanup();
    manager = new TaskManager({
      vaultPath: TEST_VAULT_PATH,
      tasksFile: TEST_TASKS_FILE
    });
    assert(manager !== null);
  });

  test('TaskManager - 添加任务', () => {
    const task = manager.addTask('Test task', { priority: Priority.HIGH, project: 'test' });
    equal(task.id, 1);
    equal(task.description, 'Test task');
  });

  test('TaskManager - 获取任务', () => {
    const task = manager.getTask(1);
    equal(task.id, 1);
    equal(task.description, 'Test task');
  });

  test('TaskManager - 更新任务', () => {
    const task = manager.updateTask(1, { description: 'Updated task' });
    equal(task.description, 'Updated task');
  });

  test('TaskManager - 标记任务为进行中', () => {
    const task = manager.startTask(1);
    equal(task.status, TaskStatus.IN_PROGRESS);
  });

  test('TaskManager - 标记任务为已完成', () => {
    const task = manager.completeTask(1, 'Completed!');
    equal(task.status, TaskStatus.COMPLETED);
    equal(task.completionNote, 'Completed!');
  });

  test('TaskManager - 列出所有任务', () => {
    manager.addTask('Task 2');
    manager.addTask('Task 3');
    const tasks = manager.listTasks();
    equal(tasks.length, 3);
  });

  test('TaskManager - 按状态过滤', () => {
    const pending = manager.listTasks({ status: TaskStatus.PENDING });
    equal(pending.length, 2); // Task 2 and Task 3
  });

  test('TaskManager - 按优先级过滤', () => {
    const high = manager.listTasks({ priority: Priority.HIGH });
    equal(high.length, 1); // Task 1
  });

  test('TaskManager - 按项目过滤', () => {
    const project = manager.listTasks({ project: 'test' });
    equal(project.length, 1); // Task 1
  });

  test('TaskManager - 限制数量', () => {
    const limited = manager.listTasks({ limit: 2 });
    equal(limited.length, 2);
  });

  test('TaskManager - 删除任务', () => {
    const deleted = manager.deleteTask(1);
    equal(deleted.id, 1);
    const tasks = manager.listTasks();
    equal(tasks.length, 2);
  });

  test('TaskManager - 生成报告', () => {
    const report = manager.generateReport({ period: 'weekly' });
    assert(report.statistics !== undefined);
    assert(report.period === 'weekly');
  });

  test('TaskManager - 搜索任务', () => {
    manager.addTask('Search test task');
    const results = manager.searchTasks('Search');
    equal(results.length, 1);
  });

  // ============================================
  // 边界条件测试
  // ============================================
  
  console.log('\n📋 边界条件测试\n');

  test('TaskManager - 获取不存在的任务', () => {
    const task = manager.getTask(999);
    equal(task, undefined);
  });

  test('TaskManager - 更新不存在的任务', () => {
    throws(() => manager.updateTask(999, { description: 'Test' }));
  });

  test('TaskManager - 删除不存在的任务', () => {
    throws(() => manager.deleteTask(999));
  });

  test('TaskManager - 完成不存在的任务', () => {
    throws(() => manager.completeTask(999));
  });

  // ============================================
  // 清理
  // ============================================
  
  cleanup();

  // ============================================
  // 测试结果
  // ============================================
  
  console.log('\n' + '='.repeat(50));
  console.log(`测试结果：${passed} 通过，${failed} 失败`);
  console.log('='.repeat(50) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// 运行测试
runTests();
