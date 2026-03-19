#!/usr/bin/env node
/**
 * 测试运行器
 * 运行所有单元测试
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_DIR = __dirname;

console.log('🧪 Obsidian Tasks Skill 测试套件\n');
console.log('=' .repeat(50));

const testFiles = [
  'task-manager.test.js',
  'obsidian-sync.test.js',
  'memory-sync.test.js'
];

let totalPassed = 0;
let totalFailed = 0;
const results = [];

testFiles.forEach(file => {
  const filePath = path.join(TEST_DIR, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`\n📄 运行 ${file}...\n`);
    
    try {
      const output = execSync(`node ${filePath}`, { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      console.log(output);
      
      // 解析结果
      const match = output.match(/测试结果：(\d+) 通过，(\d+) 失败/);
      if (match) {
        const passed = parseInt(match[1]);
        const failed = parseInt(match[2]);
        totalPassed += passed;
        totalFailed += failed;
        results.push({ file, passed, failed, status: '✅' });
      }
    } catch (error) {
      console.log(error.stdout || error.message);
      results.push({ file, error: error.message, status: '❌' });
      totalFailed++;
    }
  } else {
    console.log(`⚠️  跳过 ${file} (文件不存在)`);
    results.push({ file, status: '⚠️', note: '文件不存在' });
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 测试汇总\n');

console.log('文件结果:');
results.forEach(r => {
  if (r.error) {
    console.log(`  ${r.status} ${r.file}: ${r.error}`);
  } else if (r.note) {
    console.log(`  ${r.status} ${r.file}: ${r.note}`);
  } else {
    console.log(`  ${r.status} ${r.file}: ${r.passed} 通过，${r.failed} 失败`);
  }
});

console.log(`\n总计：${totalPassed} 通过，${totalFailed} 失败`);

if (totalFailed === 0) {
  console.log('\n🎉 所有测试通过!\n');
  process.exit(0);
} else {
  console.log('\n❌ 部分测试失败\n');
  process.exit(1);
}
