const fs = require('fs');

const data = JSON.parse(fs.readFileSync('new-url-frames-full.json', 'utf-8'));
const formFrame = data.find(f => f.frameName === 'zwIframe');

if (!formFrame) process.exit(1);

// 表格 13：测试人员填写
console.log('表格 13（测试人员填写）完整数据:\n');
const table13 = formFrame.data.tables[12];
table13.data.forEach((row, idx) => {
  const cells = row.cells.map(c => c.text).filter(t => t && t.length > 0);
  console.log(`行${idx + 1}: ${cells.join(' | ')}`);
});

// 表格 14：客开人员填写
console.log('\n\n表格 14（客开人员填写）完整数据:\n');
const table14 = formFrame.data.tables[13];
table14.data.forEach((row, idx) => {
  const cells = row.cells.map(c => c.text).filter(t => t && t.length > 0);
  console.log(`行${idx + 1}: ${cells.join(' | ')}`);
});
