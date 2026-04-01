# hello-cdf - 详细设计 (DETAIL)

## v1.0.0（2026-04-01）

### 1. 函数签名

#### 1.1 hello()

```javascript
/**
 * 生成问候语
 * @param {string} [name] - 可选的名字参数
 * @returns {string} 格式化的问候语
 * @example
 * hello()           // "Hello, CDF!"
 * hello('Alice')    // "Hello, Alice!"
 */
function hello(name) {
  return `Hello, ${name || 'CDF'}!`;
}
```

### 2. 文件结构

```
04_coding/
├── src/
│   └── index.js          # 核心模块（导出 hello 函数）
├── bin/
│   └── hello-cdf.js      # CLI 入口（#!/usr/bin/env node）
├── package.json          # 项目配置
└── tests/
    └── index.test.js     # 单元测试
```

### 3. 测试用例

#### 3.1 单元测试

| 测试名 | 输入 | 期望输出 |
|--------|------|----------|
| hello() 无参数 | undefined | "Hello, CDF!" |
| hello('Alice') | 'Alice' | "Hello, Alice!" |
| hello('') | '' | "Hello, CDF!" |
| hello(null) | null | "Hello, CDF!" |

#### 3.2 CLI 测试

| 命令 | 期望输出 |
|------|----------|
| `hello-cdf` | "Hello, CDF!" |
| `hello-cdf --name Bob` | "Hello, Bob!" |
| `hello-cdf --help` | 显示使用说明 |
| `hello-cdf --version` | "hello-cdf v1.0.0" |

### 4. package.json 配置

```json
{
  "name": "hello-cdf",
  "version": "1.0.0",
  "description": "A simple CLI greeting tool",
  "main": "src/index.js",
  "bin": {
    "hello-cdf": "./bin/hello-cdf.js"
  },
  "scripts": {
    "test": "node tests/index.test.js"
  },
  "keywords": ["cli", "greeting"],
  "license": "MIT"
}
```

### 5. 实现步骤

1. 创建 04_coding/package.json
2. 创建 04_coding/src/index.js
3. 创建 04_coding/bin/hello-cdf.js
4. 创建 04_coding/tests/index.test.js
5. 运行测试验证
6. 生成 REVIEW-REPORT.md

### 6. 验收检查点

- [ ] 代码不超过 50 行
- [ ] 无外部依赖
- [ ] 所有测试通过
- [ ] CLI 参数解析正确
- [ ] 目录结构符合 AGENTS.md 规范
