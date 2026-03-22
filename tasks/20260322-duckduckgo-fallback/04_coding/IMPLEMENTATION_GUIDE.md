# DDG Fallback 实现指令

> **任务**: 按 TDD 流程实现 DDG Fallback  
> **方案**: A (依赖注入 + 默认实现)  
> **规范**: L2 生产区纯净，L3 命名归一化

---

## 📋 实现要求

### 1. package.json

```json
{
  "name": "duckduckgo-fallback",
  "version": "1.0.0",
  "description": "DDG Fallback with dependency injection",
  "main": "src/index.js",
  "scripts": {
    "build": "node -e \"require('./src/index.js')\" && echo '✅ Build OK'",
    "test": "node tests/index.test.js"
  },
  "keywords": ["ddg", "fallback", "openclaw"],
  "author": "openclaw-ouyp",
  "license": "MIT"
}
```

### 2. src/index.js

```javascript
/**
 * DDG Fallback - 依赖注入实现
 * @version 1.0.0
 */

class DDGFallback {
  constructor(options = {}) {
    // 依赖注入
    this.primarySearch = options.primarySearch || this._defaultPrimarySearch;
    this.fallbackSearch = options.fallbackSearch || this._defaultFallbackSearch;
    
    // 配置参数
    this.maxRetries = options.maxRetries || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.timeoutMs = options.timeoutMs || 10000;
  }

  /**
   * 执行搜索，失败时 fallback
   * @param {string} query 
   * @returns {Promise<Object>}
   */
  async search(query) {
    try {
      return await this.primarySearch(query);
    } catch (error) {
      if (this.shouldFallback(error)) {
        console.log('Primary search failed, fallback to DDG');
        return await this.fallbackSearch(query);
      }
      throw error;
    }
  }

  /**
   * 默认主搜索（抛出错误）
   */
  _defaultPrimarySearch(query) {
    throw new Error('Primary search not implemented - please provide options.primarySearch');
  }

  /**
   * 默认 fallback 搜索（抛出错误）
   */
  _defaultFallbackSearch(query) {
    throw new Error('Fallback search not implemented - please provide options.fallbackSearch');
  }

  /**
   * 判断是否应该 fallback
   * @param {Error} error 
   * @returns {boolean}
   */
  shouldFallback(error) {
    const fallbackCodes = [429, 503, 504];
    return fallbackCodes.includes(error?.code) || 
           error?.message?.includes('timeout') ||
           error?.message?.includes('ETIMEDOUT');
  }
}

module.exports = DDGFallback;
```

### 3. tests/index.test.js

```javascript
/**
 * DDGFallback 单元测试
 */

const DDGFallback = require('../src/index.js');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// 测试 1: 实例化成功
test('应该创建实例', () => {
  const fallback = new DDGFallback();
  assert(fallback instanceof DDGFallback, '实例创建失败');
  assert(fallback.maxRetries === 3, '默认 maxRetries 应为 3');
});

// 测试 2: shouldFallback 识别 429
test('shouldFallback 应该识别 429 错误', () => {
  const fallback = new DDGFallback();
  const error = { code: 429 };
  assert(fallback.shouldFallback(error) === true, '应识别 429');
});

// 测试 3: shouldFallback 识别 503
test('shouldFallback 应该识别 503 错误', () => {
  const fallback = new DDGFallback();
  const error = { code: 503 };
  assert(fallback.shouldFallback(error) === true, '应识别 503');
});

// 测试 4: shouldFallback 识别 timeout
test('shouldFallback 应该识别 timeout', () => {
  const fallback = new DDGFallback();
  const error = { message: 'timeout' };
  assert(fallback.shouldFallback(error) === true, '应识别 timeout');
});

// 输出结果
console.log('\n========================================');
console.log(`测试结果：${passCount} 通过，${failCount} 失败`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
```

### 4. EXECUTION_REPORT.md

```markdown
# 执行报告：DDG Fallback

> **任务 ID**: 20260322-duckduckgo-fallback  
> **执行日期**: 2026-03-22  
> **执行者**: OpenCode  
> **复查者**: OpenClaw

---

## 📋 执行记录

### 架构设计
- [x] 采用依赖注入模式 (方案 A)
- [x] 配置参数：maxRetries, baseDelayMs, timeoutMs

### 代码实现
- [x] src/index.js - DDGFallback 类
- [x] tests/index.test.js - 4 个测试用例
- [x] package.json - 元数据

### 测试验证
- [ ] npm test 通过
- [ ] npm run build 通过

---

## 📊 测试结果

| 用例 | 状态 |
|------|------|
| 实例化成功 | ⏳ |
| 识别 429 | ⏳ |
| 识别 503 | ⏳ |
| 识别 timeout | ⏳ |

---

*本报告由 OpenCode 按 TDD 流程生成*
```

---

## 🚀 执行流程

```bash
# 1. 创建文件
mkdir -p src tests
# 创建 package.json, src/index.js, tests/index.test.js, EXECUTION_REPORT.md

# 2. 运行测试 (TDD 红阶段)
npm test  # 应该失败 (还没实现)

# 3. 实现代码 (TDD 绿阶段)
# 实现 src/index.js

# 4. 再次运行测试
npm test  # 应该通过

# 5. 构建验证
npm run build

# 6. 更新 EXECUTION_REPORT.md
```

---

*请 OpenCode 按此指令执行*
