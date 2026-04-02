/**
 * ReviewProtocol 单元测试
 * 使用简单 assert 模式，不依赖 Mocha
 */
const assert = require('assert');
const { ReviewProtocol } = require('../src/review/review-protocol');
const { ConfirmationExtractor } = require('../src/designing-agents/confirmation-extractor');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   ReviewProtocol 单元测试                                  ║');
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
  const protocol = new ReviewProtocol();

  // 构造函数测试
  test('应该创建实例', () => {
    assert(protocol);
  });

  test('应该使用自定义 extractor 创建实例', () => {
    const extractor = new ConfirmationExtractor();
    const proto = new ReviewProtocol({ extractor });
    assert.strictEqual(proto.extractor, extractor);
  });

  // generateReviewRequest 测试
  await test('应该生成审阅请求', async () => {
    const context = {
      task: '测试任务',
      scenario: 'new',
      stage: 'designing',
      version: 'v3.1.3',
      prdContent: `
## 3. 功能需求

### 3.1 功能 1
**优先级**: [P0]
**需求描述**: 测试功能
`,
      trdContent: `
## 1. 技术架构

### 1.1 技术选型

- Node.js
`,
      checkpoints: [
        { id: 'D1', description: '检查点 1' },
        { id: 'D2', description: '检查点 2' }
      ]
    };
    const request = await protocol.generateReviewRequest(context);
    assert.strictEqual(typeof request, 'string');
    assert(request.includes('## 📋 审阅请求'));
    assert(request.includes('测试任务'));
    assert(request.includes('v3.1.3'));
    assert(request.includes('## 确认内容提炼'));
    assert(request.includes('### 审阅检查点'));
  });

  await test('应该处理没有检查点的情况', async () => {
    const context = {
      task: '测试任务',
      scenario: 'new',
      stage: 'designing',
      version: 'v3.1.3',
      prdContent: '# PRD',
      trdContent: '# TRD',
      checkpoints: []
    };
    const request = await protocol.generateReviewRequest(context);
    assert(request.includes('无检查点'));
  });

  // generateCheckpointsTable 测试
  test('应该生成检查点表格', () => {
    const checkpoints = [
      { id: 'D1', description: '检查点 1', status: '⏳ 待确认' },
      { id: 'D2', description: '检查点 2', status: '✅ 通过' }
    ];
    const table = protocol.generateCheckpointsTable(checkpoints);
    assert(table.includes('| 检查点 | 说明 | 状态 |'));
    assert(table.includes('D1'));
    assert(table.includes('D2'));
  });

  test('当没有检查点时应该返回默认表格', () => {
    const table = protocol.generateCheckpointsTable([]);
    assert(table.includes('| 检查点 | 说明 | 状态 |'));
  });

  // formatScenario 测试
  test('应该格式化场景类型', () => {
    assert.strictEqual(protocol.formatScenario('new'), '全新功能');
    assert.strictEqual(protocol.formatScenario('incremental'), '增量需求');
    assert.strictEqual(protocol.formatScenario('bugfix'), '问题修复');
    assert.strictEqual(protocol.formatScenario('unknown'), 'unknown');
  });

  // parseReviewDecision 测试
  test('应该解析"通过"结论', () => {
    const result = protocol.parseReviewDecision('审阅结论：通过');
    assert.strictEqual(result.decision, 'pass');
  });

  test('应该解析"条件通过"结论', () => {
    const result = protocol.parseReviewDecision('审阅结论：条件通过，需要修改文档');
    assert.strictEqual(result.decision, 'conditional');
    assert(result.notes.includes('需要修改文档'));
  });

  test('应该解析"驳回"结论', () => {
    const result = protocol.parseReviewDecision('审阅结论：驳回，架构有问题');
    assert.strictEqual(result.decision, 'reject');
  });

  test('应该解析"需澄清"结论', () => {
    const result = protocol.parseReviewDecision('审阅结论：需澄清');
    assert.strictEqual(result.decision, 'clarify');
  });

  test('应该处理英文结论', () => {
    assert.strictEqual(protocol.parseReviewDecision('pass').decision, 'pass');
    assert.strictEqual(protocol.parseReviewDecision('conditional').decision, 'conditional');
    assert.strictEqual(protocol.parseReviewDecision('reject').decision, 'reject');
    assert.strictEqual(protocol.parseReviewDecision('clarify').decision, 'clarify');
  });

  test('当没有回复时应该返回需澄清', () => {
    const result = protocol.parseReviewDecision('');
    assert.strictEqual(result.decision, 'clarify');
  });

  // generateSignatureRequest 测试
  test('应该生成签字确认请求', () => {
    const context = {
      version: '3.1.3',
      confirmationContent: '## 确认内容\n\n测试内容'
    };
    const request = protocol.generateSignatureRequest(context);
    assert.strictEqual(typeof request, 'string');
    assert(request.includes('## ✍️ 签字确认'));
    assert(request.includes('v3.1.3'));
    assert(request.includes('测试内容'));
  });

  // getDesigningCheckpoints 测试
  test('应该返回 DESIGNING 阶段的标准检查点', () => {
    const checkpoints = protocol.getDesigningCheckpoints();
    assert(Array.isArray(checkpoints));
    assert(checkpoints.length >= 6);
    assert(checkpoints.some(cp => cp.id === 'D1'));
    assert(checkpoints.some(cp => cp.description.includes('用户确认签字')));
  });

  // getCodingCheckpoints 测试
  test('应该返回 CODING 阶段的标准检查点', () => {
    const checkpoints = protocol.getCodingCheckpoints();
    assert(Array.isArray(checkpoints));
    assert(checkpoints.length >= 4);
    assert(checkpoints.some(cp => cp.id === 'C1'));
    assert(checkpoints.some(cp => cp.description.includes('单元测试覆盖率')));
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
