/**
 * GitManager 单元测试
 * 使用简单 assert 模式，不依赖 Mocha
 */
const assert = require('assert');
const { GitManager } = require('../src/utils/git-manager');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   GitManager 单元测试                                      ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
    failed++;
  }
}

// 运行测试
(async () => {
  const manager = new GitManager({ projectPath: process.cwd() });

  // 构造函数测试
  test('应该创建实例', () => {
    assert(manager);
    assert.strictEqual(manager.projectPath, process.cwd());
  });

  test('应该使用自定义路径创建实例', () => {
    const customPath = '/tmp/test';
    const mgr = new GitManager({ projectPath: customPath });
    assert.strictEqual(mgr.projectPath, customPath);
  });

  // buildCommitMessage 测试
  test('应该构建正确的提交信息', () => {
    const commitInfo = {
      version: 'v3.1.3',
      signatures: [
        { role: '\u4ea7\u54c1\u8d1f\u8d23\u4eba', name: '\u5f20\u4e09', decision: 'pass' },
        { role: '\u6280\u672f\u8d1f\u8d23\u4eba', name: '\u674e\u56db', decision: 'pass' },
        { role: '\u5ba1\u9605\u8005', name: 'openclaw-ouyp', decision: 'pass' }
      ]
    };
    const message = manager.buildCommitMessage(commitInfo);
    assert(message.includes('docs: PRD 签字确认 v3.1.3'));
    assert(message.includes('\u4ea7\u54c1\u8d1f\u8d23\u4eba'));
    assert(message.includes('\u5f20\u4e09'));
    assert(message.includes('✅ 通过'));
  });

  test('应该处理不同的签字结论', () => {
    const commitInfo = {
      version: 'v3.1.3',
      signatures: [
        { role: '审阅者', name: 'A', decision: 'conditional' },
        { role: '审阅者', name: 'B', decision: 'reject' }
      ]
    };
    const message = manager.buildCommitMessage(commitInfo);
    assert(message.includes('⚠️ 条件通过'));
    assert(message.includes('❌ 驳回'));
  });

  // formatDecision 测试
  test('应该格式化签字结论', () => {
    assert.strictEqual(manager.formatDecision('pass'), '✅ 通过');
    assert.strictEqual(manager.formatDecision('conditional'), '⚠️ 条件通过');
    assert.strictEqual(manager.formatDecision('reject'), '❌ 驳回');
    assert.strictEqual(manager.formatDecision('unknown'), 'unknown');
  });

  // isGitRepository 测试
  await test('应该检测是否是 Git 仓库', async () => {
    const isRepo = await manager.isGitRepository();
    assert.strictEqual(typeof isRepo, 'boolean');
  });

  // getCurrentBranch 测试
  await test('应该获取当前分支', async () => {
    const branch = await manager.getCurrentBranch();
    assert.strictEqual(typeof branch, 'string');
    assert(branch.length > 0);
  });

  // getVersionHistory 测试
  await test('应该获取版本历史', async () => {
    const history = await manager.getVersionHistory();
    assert(Array.isArray(history));
  });

  // exec 测试
  await test('应该执行 Git 命令', async () => {
    const result = await manager.exec('git', ['--version']);
    assert(result.stdout);
    assert(result.stdout.includes('git version'));
  });

  await test('执行失败时应该抛出错误', async () => {
    try {
      await manager.exec('git', ['invalid-command']);
      console.log('❌ 应该抛出错误');
      failed++;
    } catch (error) {
      assert(error.message);
      passed++;
      console.log('✅ 执行失败时应该抛出错误');
    }
  });

  // 打印结果
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   测试结果汇总                                            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n✅ 通过：${passed}`);
  console.log(`❌ 失败：${failed}`);
  console.log(`📊 测试通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n✅ 所有测试通过');
    process.exit(0);
  } else {
    console.log(`\n❌ ${failed} 个测试失败`);
    process.exit(1);
  }
})();
