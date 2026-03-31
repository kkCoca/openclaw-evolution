const fs = require('fs');

// 读取完整的 frame 分析数据
const allFramesData = JSON.parse(fs.readFileSync('all-frames-analysis.json', 'utf-8'));

// 找到 Frame 4（zwIframe，包含表单数据）
const formFrame = allFramesData.find(f => f.frameName === 'zwIframe' || f.frameUrl?.includes('cap4'));

if (!formFrame) {
  console.log('❌ 未找到表单 Frame');
  process.exit(1);
}

console.log('✅ 找到表单 Frame:', formFrame.frameUrl.substring(0, 100) + '...\n');

const formData = formFrame.data;
if (!formData) {
  console.log('❌ Frame 数据为空');
  process.exit(1);
}

console.log(`📊 表单数据统计:`);
console.log(`   - 文本长度：${formData.textLength} 字符`);
console.log(`   - 可见元素：${formData.visibleElementsCount} 个`);
console.log(`   - 表单字段：${formData.formFields.length} 个`);
console.log(`   - 表格：${formData.tables.length} 个`);
console.log(`   - 链接：${formData.links.length} 个\n`);

// ═══════════════════════════════════════════════════════════
// 生成 Markdown 报告
// ═══════════════════════════════════════════════════════════

let markdown = `# 致远 OA BUG 上报单 - 表单表达区\n\n`;
markdown += `**提取时间**: ${new Date().toISOString()}\n\n`;
markdown += `**数据来源**: 致远 OA CAP4 表单\n\n`;

// --- 元数据 ---
markdown += `---\n\n`;
markdown += `## 📋 元数据\n\n`;

// 从完整文本中提取关键元数据
const fullText = formData.fullText;

// 提取 BUG 标题
const bugTitleMatch = fullText.match(/BUG 标题[\s\S]*?(?:发起的 [^\n\t]+|[^\n\t]+)/);
if (bugTitleMatch) {
  const title = bugTitleMatch[0].split('\n').slice(-1)[0]?.trim();
  if (title && title.length > 5) {
    markdown += `**BUG 标题**: ${title}\n\n`;
  }
}

// 提取流水号
const serialMatch = fullText.match(/流水号[\s\S]*?(BUG\d{16})/);
if (serialMatch) {
  markdown += `**流水号**: ${serialMatch[1]}\n\n`;
}

// 提取上报人
const reporterMatch = fullText.match(/上报人[\s\S]*?\n\t*([^\n\t]+)/);
if (reporterMatch) {
  markdown += `**上报人**: ${reporterMatch[1]}\n\n`;
}

// 提取上报时间
const reportTimeMatch = fullText.match(/流程上报时间[\s\S]*?\n\t*([^\n\t]+)/);
if (reportTimeMatch) {
  markdown += `**上报时间**: ${reportTimeMatch[1]}\n\n`;
}

// 提取紧急程度
const urgencyMatch = fullText.match(/紧急程度[\s\S]*?\n\t*([^\n\t]+)/);
if (urgencyMatch) {
  markdown += `**紧急程度**: ${urgencyMatch[1]}\n\n`;
}

// 提取客户名称
const customerMatch = fullText.match(/单位名称[\s\S]*?\n\t*([^\n\t]+)/);
if (customerMatch) {
  markdown += `**客户单位**: ${customerMatch[1]}\n\n`;
}

// 提取服务星卡
const starCardMatch = fullText.match(/服务星卡等级[\s\S]*?\n\t*([^\n\t]+)/);
if (starCardMatch) {
  markdown += `**服务星卡**: ${starCardMatch[1]}\n\n`;
}

// 提取产品版本
const versionMatch = fullText.match(/V8\.[^\n\t]+/);
if (versionMatch) {
  markdown += `**产品版本**: ${versionMatch[0]}\n\n`;
}

// 提取 Build Id
const buildIdMatch = fullText.match(/B\d{6}\.\d+\.[A-Z]+\d+/);
if (buildIdMatch) {
  markdown += `**Build Id**: ${buildIdMatch[0]}\n\n`;
}

// --- 表格数据 ---
markdown += `---\n\n`;
markdown += `## 📊 表单表达区（表格结构）\n\n`;

if (formData.tables.length === 0) {
  markdown += `> ⚠️ 未检测到表格结构，使用字段提取模式\n\n`;
} else {
  markdown += `**表格总数**: ${formData.tables.length}\n\n`;
  
  formData.tables.forEach((table, tableIdx) => {
    markdown += `### 表格 ${tableIdx + 1}\n\n`;
    markdown += `**Class**: \`${table.className || '(无)'}\`\n\n`;
    markdown += `**行数**: ${table.rows || table.data?.length || 0}\n\n`;
    
    if (table.data && table.data.length > 0) {
      // 渲染为 Markdown 表格
      const maxCols = Math.max(...table.data.map(row => row.cells?.length || 0));
      
      if (maxCols > 0 && maxCols <= 20) {
        table.data.forEach((row, rowIdx) => {
          const cells = row.cells || [];
          const rowText = cells.map(cell => {
            const text = cell.text?.trim() || '';
            // 处理跨列
            if (cell.colSpan > 1) {
              return text + ' | ' + Array(cell.colSpan - 1).fill('').join(' | ');
            }
            return text;
          }).join(' | ');
          
          markdown += `${rowText}\n`;
          
          // 表头分隔线
          if (rowIdx === 0) {
            markdown += cells.map(() => '---').join(' | ') + '\n';
          }
        });
        markdown += `\n`;
      }
      
      // 输出单元格详情
      markdown += `**单元格详情**:\n\n`;
      table.data.slice(0, 10).forEach((row, rowIdx) => {
        markdown += `<details>\n<summary>第 ${rowIdx + 1} 行（${row.cells?.length || 0} 个单元格）</summary>\n\n`;
        row.cells?.forEach((cell, cellIdx) => {
          const text = cell.text?.trim() || '(空)';
          if (text !== '(空)') {
            markdown += `- **列${cellIdx + 1}**: ${text}\n`;
          }
        });
        markdown += `</details>\n\n`;
      });
    }
    
    markdown += `---\n\n`;
  });
}

// --- 字段提取 ---
markdown += `## 📝 表单字段（按区域分组）\n\n`;

// 从完整文本中按区域提取
const sections = [
  { name: '客户基本信息', keywords: ['单位名称', '所属区域', '服务星卡', '加密狗号', 'CRM 编号', '业务线'] },
  { name: '问题描述信息', keywords: ['BUG 标题', 'BUG 简述', 'BUG 报告单', 'BUG 日志', '产品版本', 'Build Id', '所属模块'] },
  { name: '联系人信息', keywords: ['联系人类型', '联系人姓名', '联系人手机号', '联系人座机', 'QQ', '向日葵'] },
  { name: 'BUG 单期限信息', keywords: ['流水号', '紧急程度', '上报时间', '超期状态', '截止时间'] },
  { name: '上报人信息', keywords: ['上报人', '上报人工号', '审核状态', '审核时间', '内部审核人'] },
  { name: '开发人员填写', keywords: ['开发开始处理时间', '开发处理截止时间', 'BUG 处理状态', '开发修改人'] },
  { name: '发起者交付信息', keywords: ['交付开始时间', '交付截止时间', 'BUG 交付时间', 'BUG 交付结果', 'BUG 最终解决状态'] }
];

sections.forEach(section => {
  markdown += `### ${section.name}\n\n`;
  markdown += `| 字段名 | 字段值 |\n`;
  markdown += `|--------|--------|\n`;
  
  let foundFields = 0;
  section.keywords.forEach(keyword => {
    // 在完整文本中查找字段
    const regex = new RegExp(`${keyword}[\\s\\S]*?\\n\\t*([^\\n\\t]+)`, 'i');
    const match = fullText.match(regex);
    if (match && match[1]?.trim()) {
      const value = match[1].trim();
      // 过滤掉太短的或重复的值
      if (value.length > 1 && value !== keyword) {
        markdown += `| ${keyword} | ${value} |\n`;
        foundFields++;
      }
    }
  });
  
  if (foundFields === 0) {
    markdown += `| - | 未找到相关字段 |\n`;
  }
  
  markdown += `\n`;
});

// --- 附件列表 ---
markdown += `---\n\n`;
markdown += `## 📎 附件列表\n\n`;

const attachments = fullText.match(/([^\n\t]+\.(pdf|zip|pptx|png|jpg|jpeg|doc|docx|xls|xlsx|mp3))\s*\(([^)]+)\)/gi);
if (attachments && attachments.length > 0) {
  markdown += `**附件总数**: ${attachments.length}\n\n`;
  markdown += `| 序号 | 文件名 | 大小 |\n`;
  markdown += `|------|--------|------|\n`;
  attachments.forEach((att, idx) => {
    const parts = att.match(/([^\n\t]+)\s*\(([^)]+)\)/);
    if (parts) {
      markdown += `| ${idx + 1} | ${parts[1].trim()} | ${parts[2].trim()} |\n`;
    }
  });
  markdown += `\n`;
} else {
  markdown += `> 未找到附件\n\n`;
}

// 保存报告
fs.writeFileSync('bug-form-report.md', markdown);
console.log('✅ Markdown 报告已保存：bug-form-report.md\n');

// 同时输出到控制台
console.log('═══════════════════════════════════════════════════════════');
console.log('📄 报告预览（前 100 行）:');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(markdown.split('\n').slice(0, 100).join('\n'));
