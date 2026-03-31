const fs = require('fs');

// 读取完整数据
const data = JSON.parse(fs.readFileSync('new-url-frames-full.json', 'utf-8'));

// 找到表单 Frame
const formFrame = data.find(f => f.frameName === 'zwIframe' || f.frameUrl?.includes('cap4'));

if (!formFrame || !formFrame.data) {
  console.log('未找到表单数据');
  process.exit(1);
}

// 分析表格 13（测试人员填写）
const table13 = formFrame.data.tables.find(t => t.index === 12); // 0-indexed

if (table13) {
  console.log('表格 13（测试人员填写）结构分析:\n');
  console.log(`行数：${table13.rows}\n`);
  
  table13.data.slice(0, 10).forEach((row, idx) => {
    console.log(`行 ${idx + 1}:`);
    row.cells.forEach((cell, cellIdx) => {
      console.log(`  列${cellIdx + 1}: [${cell.className}] "${cell.text.substring(0, 50)}"`);
    });
    console.log('');
  });
}

// 分析表格 14（客开人员填写）
const table14 = formFrame.data.tables.find(t => t.index === 13);

if (table14) {
  console.log('\n表格 14（客开人员填写）结构分析:\n');
  console.log(`行数：${table14.rows}\n`);
  
  table14.data.slice(0, 10).forEach((row, idx) => {
    console.log(`行 ${idx + 1}:`);
    row.cells.forEach((cell, cellIdx) => {
      console.log(`  列${cellIdx + 1}: [${cell.className}] "${cell.text.substring(0, 50)}"`);
    });
    console.log('');
  });
}
