/**
 * SignatureUpdater 单元测试
 * 使用简单 assert 模式，不依赖 Mocha
 */
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { SignatureUpdater } = require('../src/designing-agents/signature-updater');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   SignatureUpdater 单元测试                                ║');
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
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'signature-test-'));
  
  try {
    // 构造函数测试
    await test('应该创建实例', async () => {
      const prdPath = path.join(tempDir, 'PRD.md');
      const updater = new SignatureUpdater({ prdPath: prdPath });
      assert(updater);
      assert.strictEqual(updater.prdPath, prdPath);
    });

    // hasSignatureChapter 测试
    await test('应该检测签字章节是否存在', async () => {
      const prdPath = path.join(tempDir, 'PRD1.md');
      const updater = new SignatureUpdater({ prdPath });
      const contentWithChapter = '## 15. 用户确认签字';
      const contentWithoutChapter = '## 8. 附录';
      assert(updater.hasSignatureChapter(contentWithChapter));
      assert(!updater.hasSignatureChapter(contentWithoutChapter));
    });

    // createSignatureChapter 测试
    await test('应该创建签字章节模板', async () => {
      const prdPath = path.join(tempDir, 'PRD2.md');
      const updater = new SignatureUpdater({ prdPath });
      const content = '# PRD';
      const result = updater.createSignatureChapter(content);
      assert(result.includes('## 15. 用户确认签字'));
      assert(result.includes('### 15.1 确认内容提炼'));
      assert(result.includes('### 15.2 签字确认'));
      assert(result.includes('### 15.3 签字历史'));
    });

    // update 测试
    await test('应该创建签字章节并更新签字信息', async () => {
      const prdPath = path.join(tempDir, 'PRD3.md');
      const prdContent = `# PRD\n\n> **版本**: v3.1.3\n\n## 1. 需求背景\n\n内容\n`;
      await fs.writeFile(prdPath, prdContent);
      
      const updater = new SignatureUpdater({ prdPath });
      const signature = {
        role: '审阅者',
        name: 'openclaw-ouyp',
        date: '2026-04-02',
        decision: 'pass',
        notes: '测试通过'
      };
      const success = await updater.update(signature);
      assert.strictEqual(success, true);
      
      const updatedContent = await fs.readFile(prdPath, 'utf8');
      assert(updatedContent.includes('## 15. 用户确认签字'));
      assert(updatedContent.includes('openclaw-ouyp'));
      assert(updatedContent.includes('✅ 通过'));
    });

    await test('应该更新已有的签字章节', async () => {
      const prdPath = path.join(tempDir, 'PRD4.md');
      const prdContent = `# PRD\n\n> **版本**: v3.1.3\n\n## 15. 用户确认签字\n\n### 15.2 签字确认\n\n| 角色 | 姓名 | 签字日期 | 结论 | 备注 |\n|------|------|---------|------|------|\n| 产品负责人 | 待填写 | 待填写 | 待填写 | - |\n`;
      await fs.writeFile(prdPath, prdContent);
      
      const updater = new SignatureUpdater({ prdPath });
      const signature = {
        role: '产品负责人',
        name: '张三',
        date: '2026-04-02',
        decision: 'pass',
        notes: '同意'
      };
      const success = await updater.update(signature);
      assert.strictEqual(success, true);
      
      const updatedContent = await fs.readFile(prdPath, 'utf8');
      assert(updatedContent.includes('张三'));
      assert(updatedContent.includes('2026-04-02'));
    });

    await test('应该处理不同的签字结论', async () => {
      const prdPath = path.join(tempDir, 'PRD5.md');
      const prdContent = '# PRD\n\n> **版本**: v3.1.3';
      await fs.writeFile(prdPath, prdContent);
      
      const updater = new SignatureUpdater({ prdPath });
      const signatures = [
        { role: '审阅者', name: 'A', date: '2026-04-02', decision: 'pass' },
        { role: '技术负责人', name: 'B', date: '2026-04-02', decision: 'conditional' },
        { role: '产品负责人', name: 'C', date: '2026-04-02', decision: 'reject' }
      ];
      for (const sig of signatures) {
        await updater.update(sig);
      }
      
      const updatedContent = await fs.readFile(prdPath, 'utf8');
      assert(updatedContent.includes('✅ 通过'));
      assert(updatedContent.includes('⚠️ 条件通过'));
      assert(updatedContent.includes('❌ 驳回'));
    });

    // updateBatch 测试
    await test('应该批量更新签字信息', async () => {
      const prdPath = path.join(tempDir, 'PRD6.md');
      const prdContent = '# PRD\n\n> **版本**: v3.1.3';
      await fs.writeFile(prdPath, prdContent);
      
      const updater = new SignatureUpdater({ prdPath });
      const signatures = [
        { role: '产品负责人', name: '张三', date: '2026-04-02', decision: 'pass' },
        { role: '技术负责人', name: '李四', date: '2026-04-02', decision: 'pass' },
        { role: '审阅者', name: 'openclaw-ouyp', date: '2026-04-02', decision: 'pass' }
      ];
      const success = await updater.updateBatch(signatures);
      assert.strictEqual(success, true);
      
      const updatedContent = await fs.readFile(prdPath, 'utf8');
      assert(updatedContent.includes('张三'));
      assert(updatedContent.includes('李四'));
      assert(updatedContent.includes('openclaw-ouyp'));
    });

    // extractVersion 测试
    await test('应该从 PRD 内容中提取版本号', async () => {
      const prdPath = path.join(tempDir, 'PRD7.md');
      const updater = new SignatureUpdater({ prdPath });
      const content1 = `# PRD\n\n> **版本**: v3.1.3`;
      const content2 = `# PRD\n\n| **PRD 版本** | v2.0.0 |`;
      const version1 = updater.extractVersion(content1);
      const version2 = updater.extractVersion(content2);
      assert.strictEqual(version1, 'v3.1.3');
      assert.strictEqual(version2, 'v2.0.0');
    });

    await test('当没有版本号时应该返回默认值', async () => {
      const prdPath = path.join(tempDir, 'PRD8.md');
      const updater = new SignatureUpdater({ prdPath });
      const content = '# PRD\n\n没有版本号';
      const version = updater.extractVersion(content);
      assert.strictEqual(version, 'v3.1.3');
    });

  } finally {
    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true });
  }

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
