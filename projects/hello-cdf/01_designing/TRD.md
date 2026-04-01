# hello-cdf - 技术设计文档 (TRD)

## v1.0.0（2026-04-01）

### 1. 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| 运行时 | Node.js | 轻量、跨平台、无需编译 |
| 语言 | JavaScript (ES6+) | 简洁、无需构建步骤 |
| 包管理 | npm | Node.js 标准 |

### 2. 项目结构

```
projects/hello-cdf/
├── REQUIREMENTS.md              # 需求说明（openclaw-ouyp 提供）
├── 01_designing/
│   ├── PRD.md                   # 产品需求文档
│   └── TRD.md                   # 技术设计文档
├── 02_roadmapping/
│   └── ROADMAP.md               # 研发路线图
├── 03_detailing/
│   └── DETAIL.md                # 详细设计
├── 04_coding/
│   ├── src/
│   │   └── index.js             # 主入口
│   ├── bin/
│   │   └── hello-cdf.js         # CLI 入口
│   ├── package.json             # 项目配置
│   └── tests/
│       └── index.test.js        # 单元测试
├── 05_reviewing/
│   └── REVIEW-REPORT.md         # 验收报告
└── CHANGELOG.md                 # 变更日志
```

### 3. 模块设计

#### 3.1 主模块 (src/index.js)

```javascript
/**
 * hello-cdf 核心模块
 * @param {string} name - 可选的名字参数
 * @returns {string} 问候语
 */
function hello(name) {
  return `Hello, ${name || 'CDF'}!`;
}

module.exports = { hello };
```

#### 3.2 CLI 入口 (bin/hello-cdf.js)

```javascript
#!/usr/bin/env node
const { hello } = require('../src');

// 解析命令行参数
const args = process.argv.slice(2);
let name = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) {
    name = args[i + 1];
    break;
  }
  if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage: hello-cdf [--name <名字>] [--help] [--version]');
    process.exit(0);
  }
  if (args[i] === '--version' || args[i] === '-v') {
    console.log('hello-cdf v1.0.0');
    process.exit(0);
  }
}

console.log(hello(name));
```

### 4. 接口设计

#### 4.1 命令行接口

| 参数 | 别名 | 说明 | 默认值 |
|------|------|------|--------|
| --name | -n | 自定义名字 | CDF |
| --help | -h | 显示帮助 | - |
| --version | -v | 显示版本 | - |

#### 4.2 程序化接口

```javascript
const { hello } = require('hello-cdf');
hello('Alice'); // "Hello, Alice!"
hello();        // "Hello, CDF!"
```

### 5. 测试策略

- 单元测试：覆盖 hello() 函数的所有分支
- CLI 测试：验证命令行参数解析
- 集成测试：验证完整流程

### 6. 构建与发布

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 全局安装
npm link

# 发布到 npm
npm publish
```

### 7. 变更记录

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-04-01 | 初始设计 |
