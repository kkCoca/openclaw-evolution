/**
 * Detailing 自动审阅模块
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const path = require('path');
const fs = require('fs');

async function review(ctx) {
  const { projectPath } = ctx;
  const detailPath = path.join(projectPath, '03_detailing/DETAIL.md');
  
  if (!fs.existsSync(detailPath)) {
    return {
      decision: 'reject',
      notes: 'DETAIL.md 文件不存在',
      fixItems: [{
        id: 'FILE_MISSING',
        description: 'DETAIL.md 文件不存在',
        suggestion: '请生成 DETAIL.md 文件'
      }]
    };
  }
  
  const detailContent = fs.readFileSync(detailPath, 'utf8');
  
  if (!detailContent || detailContent.trim().length === 0) {
    return {
      decision: 'reject',
      notes: 'DETAIL.md 文件存在但内容为空',
      fixItems: [{
        id: 'FILE_EMPTY',
        description: 'DETAIL.md 文件存在但内容为空',
        suggestion: '请生成 DETAIL.md 内容'
      }]
    };
  }
  
  // 最小规则检查：关键章节关键词
  const requiredKeywords = [
    { id: 'interface', keywords: ['接口', 'API'], name: '接口设计' },
    { id: 'data', keywords: ['数据结构', 'Schema', '数据模型'], name: '数据结构' },
    { id: 'test', keywords: ['测试', 'Test'], name: '测试方案' },
    { id: 'error', keywords: ['异常', 'Error', '错误处理'], name: '异常处理' }
  ];
  
  const missingKeywords = [];
  for (const req of requiredKeywords) {
    const hasKeyword = req.keywords.some(kw => detailContent.includes(kw));
    if (!hasKeyword) {
      missingKeywords.push(req.name);
    }
  }
  
  if (missingKeywords.length > 0) {
    return {
      decision: 'reject',
      notes: `DETAIL.md 缺少关键章节：${missingKeywords.join(', ')}`,
      fixItems: [{
        id: 'MISSING_SECTIONS',
        description: `缺少关键章节：${missingKeywords.join(', ')}`,
        suggestion: `请在 DETAIL.md 中添加 ${missingKeywords.join(', ')} 相关章节`
      }]
    };
  }
  
  return { decision: 'pass', notes: '所有检查通过', fixItems: [] };
}

module.exports = { review };
