/**
 * Review Code Agent Checkpoints (代码阶段检查点定义)
 * 
 * ClawDevFlow (CDF) 审阅系统 - Code 阶段专用
 * 
 * @version 3.0.0
 * @author openclaw-ouyp
 * @license MIT
 */

module.exports = [
  {
    id: 'C1',
    name: '代码规范',
    type: 'auto',
    rule: 'ESLint/Prettier 检查通过',
    weight: 0.15,
    critical: true
  },
  {
    id: 'C2',
    name: '单元测试覆盖率',
    type: 'auto',
    rule: '测试覆盖率 > 80%',
    weight: 0.2,
    critical: true
  },
  {
    id: 'C3',
    name: '无编译错误',
    type: 'auto',
    rule: 'TypeScript/构建编译通过',
    weight: 0.15,
    critical: true
  },
  {
    id: 'C4',
    name: '无安全漏洞',
    type: 'ai',
    rule: 'SAST 扫描无高危漏洞',
    weight: 0.2,
    critical: true
  },
  {
    id: 'C5',
    name: '代码架构',
    type: 'manual',
    rule: '代码分层清晰，职责单一',
    weight: 0.15,
    critical: true
  },
  {
    id: 'C6',
    name: '异常处理',
    type: 'ai',
    rule: '关键路径有 try-catch 和错误处理',
    weight: 0.15,
    critical: true
  }
];
