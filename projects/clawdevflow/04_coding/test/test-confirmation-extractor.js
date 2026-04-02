/**
 * ConfirmationExtractor 单元测试
 * 使用简单 assert 模式，不依赖 Mocha
 */
const assert = require('assert');
const { ConfirmationExtractor } = require('../src/designing-agents/confirmation-extractor');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   ConfirmationExtractor 单元测试                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误：${error.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
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
  // 构造函数测试
  test('应该使用默认配置创建实例', () => {
    const ext = new ConfirmationExtractor();
    assert.strictEqual(ext.maxRequirements, 5);
    assert.strictEqual(ext.maxRisks, 5);
  });

  test('应该使用自定义配置创建实例', () => {
    const ext = new ConfirmationExtractor({ maxRequirements: 3, maxRisks: 3 });
    assert.strictEqual(ext.maxRequirements, 3);
    assert.strictEqual(ext.maxRisks, 3);
  });

  // 核心需求提取测试
  await asyncTest('应该从 PRD 内容中提取核心需求', async () => {
    const ext = new ConfirmationExtractor();
    const prdContent = `
## 3. 功能需求

### 3.1 用户登录

**优先级**: [P0]
**需求描述**: 实现用户登录功能，支持用户名密码登录

### 3.2 用户注册

**优先级**: [P1]
**需求描述**: 实现用户注册功能，支持邮箱验证
`;
    const requirements = await ext.extractCoreRequirements(prdContent);
    assert(Array.isArray(requirements));
    assert(requirements.length > 0);
    assert(requirements[0].includes('用户登录'));
  });

  await asyncTest('当 PRD 没有功能需求章节时应该返回默认值', async () => {
    const ext = new ConfirmationExtractor();
    const prdContent = '# PRD\n\n没有功能需求章节';
    const requirements = await ext.extractCoreRequirements(prdContent);
    assert(Array.isArray(requirements));
    assert.strictEqual(requirements[0], '未找到功能需求章节');
  });

  await asyncTest('应该限制返回的核心需求数量', async () => {
    const ext = new ConfirmationExtractor({ maxRequirements: 3 });
    const prdContent = `
## 3. 功能需求

### 3.1 功能 1
**优先级**: [P0]
**需求描述**: 描述 1

### 3.2 功能 2
**优先级**: [P0]
**需求描述**: 描述 2

### 3.3 功能 3
**优先级**: [P0]
**需求描述**: 描述 3

### 3.4 功能 4
**优先级**: [P0]
**需求描述**: 描述 4

### 3.5 功能 5
**优先级**: [P0]
**需求描述**: 描述 5

### 3.6 功能 6
**优先级**: [P0]
**需求描述**: 描述 6
`;
    const requirements = await ext.extractCoreRequirements(prdContent);
    assert.strictEqual(requirements.length, 3);
  });

  // 技术方案提取测试
  await asyncTest('应该从 TRD 内容中提取技术方案', async () => {
    const ext = new ConfirmationExtractor();
    const trdContent = `
## 1. 技术架构

### 1.1 技术选型

- Node.js
- Express
- MongoDB
`;
    const solution = await ext.extractTechnicalSolution(trdContent);
    assert.strictEqual(typeof solution, 'string');
    assert(solution.includes('Node.js'));
  });

  await asyncTest('当 TRD 没有技术选型时应该返回默认值', async () => {
    const ext = new ConfirmationExtractor();
    const trdContent = '# TRD\n\n没有技术架构章节';
    const solution = await ext.extractTechnicalSolution(trdContent);
    assert.strictEqual(typeof solution, 'string');
  });

  // 变更影响分析测试
  await asyncTest('全新功能应该返回 null', async () => {
    const ext = new ConfirmationExtractor();
    const impact = await ext.analyzeChangeImpact('', 'new');
    assert.strictEqual(impact, null);
  });

  await asyncTest('问题修复应该返回最小化修复说明', async () => {
    const ext = new ConfirmationExtractor();
    const impact = await ext.analyzeChangeImpact('', 'bugfix');
    assert.strictEqual(impact, '最小化修复，不影响现有功能');
  });

  await asyncTest('增量需求应该分析变更影响', async () => {
    const ext = new ConfirmationExtractor();
    const prdContent = `
## 2. 需求目标

### 2.2 保留需求

- ✅ 需求 1

### 2.3 新增需求

- ✅ 新增需求 1
`;
    const impact = await ext.analyzeChangeImpact(prdContent, 'incremental');
    assert.strictEqual(typeof impact, 'string');
  });

  // 风险提示提取测试
  await asyncTest('应该从 TRD 内容中提取风险提示', async () => {
    const ext = new ConfirmationExtractor();
    const trdContent = `
## 10. 异常处理

| 异常类型 | 处理策略 |
|---------|---------|
| 文件不存在 | 报错并终止 |
| 文件格式错误 | 报错并终止 |
`;
    const risks = await ext.extractRisks(trdContent);
    assert(Array.isArray(risks));
    assert(risks.length > 0);
  });

  await asyncTest('当没有异常处理章节时应该返回默认风险', async () => {
    const ext = new ConfirmationExtractor();
    const trdContent = '# TRD\n\n没有异常处理章节';
    const risks = await ext.extractRisks(trdContent);
    assert(Array.isArray(risks));
    assert(risks.length > 0);
  });

  // Markdown 格式化测试
  test('应该将确认内容格式化为 Markdown 表格', () => {
    const ext = new ConfirmationExtractor();
    const content = {
      coreRequirements: ['需求 1', '需求 2'],
      technicalSolution: 'Node.js + Express',
      changeImpact: '向后兼容',
      risks: ['风险 1', '风险 2']
    };
    const markdown = ext.formatToMarkdown(content);
    assert.strictEqual(typeof markdown, 'string');
    assert(markdown.includes('## 确认内容提炼'));
    assert(markdown.includes('| 类别 | 关键内容 |'));
    assert(markdown.includes('需求 1'));
    assert(markdown.includes('Node.js + Express'));
  });

  // 完整提取测试
  await asyncTest('应该提取完整的确认内容', async () => {
    const ext = new ConfirmationExtractor();
    const prdContent = `
## 3. 功能需求

### 3.1 用户登录
**优先级**: [P0]
**需求描述**: 实现用户登录功能
`;
    const trdContent = `
## 1. 技术架构

### 1.1 技术选型

- Node.js
- Express
`;
    const content = await ext.extract(prdContent, trdContent, 'new');
    assert(content.coreRequirements);
    assert(content.technicalSolution);
    assert(content.risks);
    assert.strictEqual(content.changeImpact, null);
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
