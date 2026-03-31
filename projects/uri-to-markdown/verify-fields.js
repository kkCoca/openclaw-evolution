const fs = require('fs');

// 读取完整的 frame 分析数据
const allFramesData = JSON.parse(fs.readFileSync('all-frames-analysis.json', 'utf-8'));

// 找到 Frame 4（zwIframe，包含表单数据）
const formFrame = allFramesData.find(f => f.frameName === 'zwIframe' || f.frameUrl?.includes('cap4'));

if (!formFrame) {
  console.log('❌ 未找到表单 Frame');
  process.exit(1);
}

const formData = formFrame.data;
const fullText = formData.fullText;

// 按表格提取字段 - 值对
console.log('═══════════════════════════════════════════════════════════');
console.log('致远 OA BUG 上报单 - 完整字段提取验证');
console.log('═══════════════════════════════════════════════════════════\n');

// 从表格数据中提取字段
const fieldPairs = [];

formData.tables.forEach((table, tableIdx) => {
  if (!table.data) return;
  
  table.data.forEach((row, rowIdx) => {
    if (!row.cells) return;
    
    const cells = row.cells.map(c => c.text?.trim()).filter(t => t && t.length > 0);
    
    // 配对：字段名 → 字段值（奇数是字段名，偶数是字段值）
    for (let i = 0; i < cells.length - 1; i += 2) {
      const fieldName = cells[i];
      const fieldValue = cells[i + 1];
      
      // 过滤掉太短的或纯说明文字
      if (fieldName.length > 1 && !fieldName.startsWith('1、') && !fieldName.startsWith('2、') && !fieldName.startsWith('注：')) {
        fieldPairs.push({
          table: tableIdx + 1,
          row: rowIdx + 1,
          field: fieldName,
          value: fieldValue
        });
      }
    }
  });
});

// 按区域分组输出
const sections = {
  '📋 表单头部': ['BUG 上报单', '反馈建议', '客服上报视图', '研发视图 - 正式'],
  '🏢 客户基本信息': ['单位名称', '所属区域', '单位所属类别', '客服唯一编号', 'CRM 编号', '业务线', '服务星卡等级', '服务到期日', '加密狗号字段', '加密狗文件'],
  '📝 问题描述信息': ['BUG 标题', 'BUG 简述', 'BUG 报告单', 'BUG 日志及附件', '产品版本', '产品 Build Id', '是否合规', 'Build Id 版本验证结果', 'BUG 类别', '问题发生时间点', '月度修复包', '所属模块', '数据库', '是否客开', '产品生命周期阶段', '相关补丁包文件', '远程账号/登录地址'],
  '👤 联系人信息': ['联系人类型', '联系人姓名', '联系人手机号', '向日葵', '联系人座机/QQ', '其他联系人', '微信账号', '知会区域人员'],
  '⏰ BUG 单期限信息': ['流水号', '流程上报时间', '流程超期状态', '紧急程度', '第一通电话结束时间', '流程期限处理截止时间', '上报紧急原因'],
  '✍️ 上报人信息': ['上报人', '上报人工号', '关联服务单号', '内部审核人', '审核状态', '审核时间'],
  '👨‍💻 开发人员填写': ['开发开始处理时间', '开发处理截止时间', 'BUG 处理状态', '开发修改人', '开发修改人所属部门', '对应开发模块负责人', '是否提供补丁包', '依赖月度修复包', '是否为重复 BUG', '重复 BUG 关联流程', '补丁包文件', '其他补丁文件', 'BUG 相关关联流程', '产生原因分析', '修改方法', '相关操作文档', '测试点', '问题分类', '诊断结论', '解决方案分类', '超期状态', '是否涉及到核心代码', '转客开处理', '回退客服审核节点', 'BUG 处理完成时间'],
  '✅ 发起者交付信息': ['交付开始时间', '交付截止时间', '交付超期状态', 'BUG 交付时间', 'BUG 交付结果', 'BUG 交付次数', 'BUG 最终解决状态', '满意度服务评价', '不满意原因', '输入当前系统时间'],
  '📞 外呼机器人通知信息': ['通知节点处理时间', '是否取消机器人电话通知任务', '机器人回访时间', '电话是否接通', '电话回访状态', '录音链接'],
  '🔍 本单位历史流程查询': ['服务工单查询', 'BUG 查询', '运维技术工单', '建议单查询', '运维二线查询', '区域移交单', '第三方移交单']
};

let totalFields = 0;
let matchedFields = 0;

Object.entries(sections).forEach(([sectionName, keywords]) => {
  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`${sectionName}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  
  keywords.forEach(keyword => {
    const match = fieldPairs.find(p => p.field === keyword);
    if (match) {
      console.log(`✅ ${match.field}`);
      console.log(`   └─ ${match.value || '(空)'}\n`);
      matchedFields++;
    }
    totalFields++;
  });
});

// 输出未匹配的字段（在数据中但不在关键字列表中）
console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`📊 其他字段（未在预期列表中）`);
console.log(`═══════════════════════════════════════════════════════════\n`);

fieldPairs.forEach(p => {
  const allKeywords = Object.values(sections).flat();
  if (!allKeywords.includes(p.field)) {
    console.log(`⚠️ ${p.field} (表格${p.table}, 行${p.row})`);
    console.log(`   └─ ${p.value || '(空)'}\n`);
  }
});

// 统计
console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`📊 提取统计`);
console.log(`═══════════════════════════════════════════════════════════\n`);
console.log(`预期字段数：${totalFields}`);
console.log(`成功匹配：${matchedFields}`);
console.log(`匹配率：${((matchedFields / totalFields) * 100).toFixed(1)}%`);
console.log(`字段对总数（从表格提取）：${fieldPairs.length}\n`);
