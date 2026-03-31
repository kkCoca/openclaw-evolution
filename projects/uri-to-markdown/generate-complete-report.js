const fs = require('fs');

// 读取字段数据
const fieldsData = JSON.parse(fs.readFileSync('final-fields.json', 'utf-8'));
// 读取附件数据
const attachmentsData = JSON.parse(fs.readFileSync('attachments-data.json', 'utf-8'));

// 去重附件列表
const uniqueAttachments = [];
const seen = new Set();
attachmentsData.attachments.forEach(att => {
  const key = att.fileMatch?.filename || att.text;
  if (key && !seen.has(key)) {
    seen.add(key);
    uniqueAttachments.push(att);
  }
});

const bugScreenshots = uniqueAttachments.filter(a => a.fileMatch?.extension === 'png');
const logFiles = uniqueAttachments.filter(a => a.fileMatch?.extension === 'zip');

// 批量下载 URL
const bugReportBatchUrl = attachmentsData.allLinks[0]?.href || '';
const bugLogBatchUrl = attachmentsData.allLinks[1]?.href || '';

// 按区域分组
const groupedFields = {};
fieldsData.fieldPairs.forEach(p => {
  const section = p.section || '其他';
  if (!groupedFields[section]) {
    groupedFields[section] = [];
  }
  groupedFields[section].push(p);
});

// 生成完整 Markdown 报告
let markdown = `# 致远 OA BUG 上报单 - 完整字段提取报告\n\n`;
markdown += `**提取时间**: ${new Date().toISOString()}\n\n`;
markdown += `**数据来源**: ${fieldsData.url}\n\n`;
markdown += `**表格总数**: ${fieldsData.tableCount}\n\n`;
markdown += `**字段总数**: ${fieldsData.fieldPairs.length}\n\n`;
markdown += `**附件总数**: ${uniqueAttachments.length} 个\n\n`;

markdown += `---\n\n`;
markdown += `## 📎 附件列表（带 URL）\n\n`;

markdown += `### BUG 报告单附件（5 个截图）\n\n`;
markdown += `**批量下载 URL**:\n\n`;
markdown += `\`\`\`\n${bugReportBatchUrl}\n\`\`\`\n\n`;
markdown += `| 序号 | 文件名 | 大小 |\n`;
markdown += `|------|--------|------|\n`;
bugScreenshots.forEach((att, idx) => {
  markdown += `| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |\n`;
});
markdown += `\n`;

markdown += `### BUG 日志及附件（1 个压缩包）\n\n`;
markdown += `**批量下载 URL**:\n\n`;
markdown += `\`\`\`\n${bugLogBatchUrl}\n\`\`\`\n\n`;
markdown += `| 序号 | 文件名 | 大小 |\n`;
markdown += `|------|--------|------|\n`;
logFiles.forEach((att, idx) => {
  markdown += `| ${idx + 1} | ${att.fileMatch.filename} | ${att.fileMatch.size} |\n`;
});
markdown += `\n`;

markdown += `> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，或使用批量下载 URL 下载所有文件。\n\n`;

// 输出所有字段
Object.entries(groupedFields).forEach(([section, fields]) => {
  markdown += `---\n\n`;
  markdown += `## ${section}\n\n`;
  markdown += `| 序号 | 字段名 | 字段值 | 备注 |\n`;
  markdown += `|------|--------|--------|------|\n`;
  
  fields.forEach((p, idx) => {
    let value = p.value || '(空)';
    let note = '';
    
    // 检测是否是附件字段
    if (p.field.includes('报告单') || p.field.includes('日志') || p.field.includes('附件')) {
      if (p.field.includes('报告单')) {
        note = '📎 [批量下载](' + bugReportBatchUrl + ')';
        value = bugScreenshots.map(a => a.fileMatch.filename + ' (' + a.fileMatch.size + ')').join('<br>');
      } else if (p.field.includes('日志')) {
        note = '📎 [批量下载](' + bugLogBatchUrl + ')';
        value = logFiles.map(a => a.fileMatch.filename + ' (' + a.fileMatch.size + ')').join('<br>');
      }
    }
    
    // 处理换行
    value = value.replace(/\n/g, '<br>');
    
    markdown += `| ${idx + 1} | ${p.field} | ${value} | ${note} |\n`;
  });
  markdown += `\n`;
});

markdown += `---\n\n`;
markdown += `## 📊 统计摘要\n\n`;
markdown += `| 区域 | 字段数 |\n`;
markdown += `|------|--------|\n`;
Object.entries(groupedFields).forEach(([section, fields]) => {
  markdown += `| ${section} | ${fields.length} |\n`;
});
markdown += `| **总计** | **${fieldsData.fieldPairs.length}** |\n\n`;

fs.writeFileSync('complete-report.md', markdown);
console.log('✅ 完整报告已保存：complete-report.md\n');
console.log('报告包含:');
console.log(`  - ${fieldsData.fieldPairs.length} 个字段`);
console.log(`  - ${uniqueAttachments.length} 个附件`);
console.log(`  - ${Object.keys(groupedFields).length} 个区域\n`);
