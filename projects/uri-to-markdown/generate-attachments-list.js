const fs = require('fs');

// 读取附件数据
const data = JSON.parse(fs.readFileSync('attachments-data.json', 'utf-8'));

console.log('═══════════════════════════════════════════════════════════');
console.log('📎 致远 OA BUG 上报单 - 附件 URL 列表');
console.log('═══════════════════════════════════════════════════════════\n');

// 去重附件列表
const uniqueAttachments = [];
const seen = new Set();

data.attachments.forEach(att => {
  const key = att.fileMatch?.filename || att.text;
  if (key && !seen.has(key)) {
    seen.add(key);
    uniqueAttachments.push(att);
  }
});

console.log(`**提取时间**: ${new Date().toISOString()}\n`);
console.log(`**附件总数**: ${uniqueAttachments.length}\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('📋 BUG 报告单附件（5 个截图）');
console.log('═══════════════════════════════════════════════════════════\n');

const bugScreenshots = uniqueAttachments.filter(a => a.fileMatch?.extension === 'png');
console.log(`**批量下载 URL**:\n`);
console.log(`${data.allLinks[0]?.href}\n`);

console.log(`**单个文件列表**:\n`);
console.log(`| 序号 | 文件名 | 大小 |`);
console.log(`|------|--------|------|`);
bugScreenshots.forEach((att, idx) => {
  console.log(`| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |`);
});

console.log(`\n> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，`);
console.log(`> 或使用批量下载 URL 下载所有文件。\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('📦 BUG 日志及附件（1 个压缩包）');
console.log('═══════════════════════════════════════════════════════════\n');

const logFiles = uniqueAttachments.filter(a => a.fileMatch?.extension === 'zip');
console.log(`**批量下载 URL**:\n`);
console.log(`${data.allLinks[1]?.href}\n`);

console.log(`**文件列表**:\n`);
console.log(`| 序号 | 文件名 | 大小 |`);
console.log(`|------|--------|------|`);
logFiles.forEach((att, idx) => {
  console.log(`| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |`);
});

console.log(`\n> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，`);
console.log(`> 或使用批量下载 URL 下载所有文件。\n`);

// 生成 Markdown 报告
let markdown = `# 致远 OA BUG 上报单 - 附件 URL 列表\n\n`;
markdown += `**提取时间**: ${new Date().toISOString()}\n\n`;
markdown += `**附件总数**: ${uniqueAttachments.length} 个\n\n`;

markdown += `---\n\n`;
markdown += `## 📋 BUG 报告单附件（5 个截图）\n\n`;
markdown += `**批量下载 URL**:\n\n`;
markdown += `\`\`\`\n${data.allLinks[0]?.href}\n\`\`\`\n\n`;
markdown += `**文件列表**:\n\n`;
markdown += `| 序号 | 文件名 | 大小 |\n`;
markdown += `|------|--------|------|\n`;
bugScreenshots.forEach((att, idx) => {
  markdown += `| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |\n`;
});
markdown += `\n`;

markdown += `> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，`);
markdown += `> 或使用批量下载 URL 下载所有文件。\n\n`;

markdown += `---\n\n`;
markdown += `## 📦 BUG 日志及附件（1 个压缩包）\n\n`;
markdown += `**批量下载 URL**:\n\n`;
markdown += `\`\`\`\n${data.allLinks[1]?.href}\n\`\`\`\n\n`;
markdown += `**文件列表**:\n\n`;
markdown += `| 序号 | 文件名 | 大小 |\n`;
markdown += `|------|--------|------|\n`;
logFiles.forEach((att, idx) => {
  markdown += `| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |\n`;
});
markdown += `\n`;

markdown += `> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，`);
markdown += `> 或使用批量下载 URL 下载所有文件。\n\n`;

markdown += `---\n\n`;
markdown += `## 📝 说明\n\n`;
markdown += `致远 OA 的附件下载链接是通过 JavaScript 动态生成的。\n\n`;
markdown += `### 使用方式\n\n`;
markdown += `1. **批量下载**：直接访问上述批量下载 URL\n`;
markdown += `2. **单个下载**：需要在页面中点击附件，拦截网络请求获取真实 URL\n\n`;
markdown += `### URL 格式分析\n\n`;
markdown += `- 批量下载：\`/rest/attachment/file/batchDownload/{fileIds}?zipFileName={name}\`\n`;
markdown += `- 文件 ID 从 HTML 元素的 \`data-id\` 或 JavaScript 中获取\n\n`;

fs.writeFileSync('attachments-final-report.md', markdown);
console.log('✅ Markdown 报告已保存：attachments-final-report.md\n');
