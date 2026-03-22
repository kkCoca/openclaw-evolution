# OpenClaw Search Provider 实现指令

> **任务**: 创建 OpenClaw Search Provider，集成 DDG Fallback  
> **方案**: 完整集成 (方案 A)  
> **规范**: L1 分工，L2 生产区纯净，L3 命名归一化

---

## 📋 实现要求

### 1. package.json (04_coding/package.json)

```json
{
  "name": "openclaw-search-provider",
  "version": "1.0.0",
  "description": "OpenClaw Search Provider with DDG Fallback",
  "main": "src/search-provider.js",
  "scripts": {
    "build": "node -e \"require('./src/search-provider.js')\" && echo '✅ Build OK'",
    "test": "node tests/integration.test.js",
    "test:e2e": "node tests/e2e.test.js"
  },
  "dependencies": {
    "duckduckgo-fallback": "file:../duckduckgo-fallback"
  },
  "keywords": ["openclaw", "search", "provider", "ddg", "fallback"],
  "author": "openclaw-ouyp",
  "license": "MIT"
}
```

### 2. src/search-provider.js (核心)

```javascript
/**
 * OpenClaw Search Provider
 * 集成 DDG Fallback 的统一搜索接口
 * @version 1.0.0
 */

const DDGFallback = require('duckduckgo-fallback');

class SearchProvider {
  constructor(options = {}) {
    this.geminiApiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
    this.ddgApiKey = options.ddgApiKey || process.env.DDG_API_KEY;
    
    // 创建 Fallback 实例
    this.fallback = new DDGFallback({
      primarySearch: this.geminiSearch.bind(this),
      fallbackSearch: this.ddgSearch.bind(this),
      maxRetries: options.maxRetries || 3,
      timeoutMs: options.timeoutMs || 10000
    });
  }

  /**
   * 统一搜索接口
   */
  async search(query, options = {}) {
    return await this.fallback.search(query);
  }

  /**
   * Gemini 搜索实现
   */
  async geminiSearch(query) {
    // 调用 Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Search: ${query}` }] }]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      source: 'gemini',
      query,
      results: data.candidates?.[0]?.content?.parts?.[0]?.text || []
    };
  }

  /**
   * DuckDuckGo 搜索实现
   */
  async ddgSearch(query) {
    // 调用 DuckDuckGo API
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`DDG API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      source: 'duckduckgo',
      query,
      results: [data.AbstractText || data.RelatedTopics?.[0]?.Text || '']
    };
  }
}

module.exports = SearchProvider;
```

### 3. tests/integration.test.js (集成测试)

```javascript
/**
 * Search Provider 集成测试
 */

const SearchProvider = require('../src/search-provider.js');

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

// 测试 1: 实例化
test('应该创建 SearchProvider 实例', () => {
  const provider = new SearchProvider();
  assert(provider instanceof SearchProvider);
  assert(provider.fallback !== undefined);
});

// 测试 2: fallback 配置正确
test('fallback 应该配置正确的搜索函数', () => {
  const provider = new SearchProvider();
  assert(typeof provider.fallback.primarySearch === 'function');
  assert(typeof provider.fallback.fallbackSearch === 'function');
});

// 测试 3: search 方法存在
test('search 方法应该存在', () => {
  const provider = new SearchProvider();
  assert(typeof provider.search === 'function');
});

// 测试 4: 错误处理
test('应该正确处理 API 错误', async () => {
  const provider = new SearchProvider({ geminiApiKey: 'invalid' });
  try {
    await provider.search('test');
    assert(false, '应该抛出错误');
  } catch (error) {
    assert(error.message.includes('API error'), '错误消息应包含 API error');
  }
});

console.log('\n========================================');
console.log(`测试结果：${passCount} 通过，${failCount} 失败`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
```

### 4. EXECUTION_REPORT.md

```markdown
# 执行报告：OpenClaw Search Provider 集成

> **任务 ID**: 20260322-openclaw-search-integration  
> **执行日期**: 2026-03-22  
> **执行者**: OpenCode  
> **复查者**: OpenClaw

---

## 执行记录

### 架构设计
- [x] Search Provider 统一接口
- [x] Gemini Adapter
- [x] DDG Adapter
- [x] Fallback 集成

### 代码实现
- [x] src/search-provider.js
- [x] tests/integration.test.js
- [x] package.json

### 测试验证
- [ ] npm test 通过
- [ ] npm run build 通过

---

## 测试结果

| 用例 | 状态 |
|------|------|
| 实例化 | ⏳ |
| fallback 配置 | ⏳ |
| search 方法 | ⏳ |
| 错误处理 | ⏳ |

---

*本报告由 OpenCode 按 TDD 流程生成*
```

---

## 🚀 执行流程

```bash
# 1. 创建文件
mkdir -p src tests
# 创建 package.json, src/search-provider.js, tests/integration.test.js

# 2. 运行测试 (TDD 红阶段)
npm test  # 应该失败 (还没实现)

# 3. 实现代码 (TDD 绿阶段)
# 实现 src/search-provider.js

# 4. 再次运行测试
npm test  # 应该通过

# 5. 构建验证
npm run build

# 6. 更新 EXECUTION_REPORT.md
```

---

*请 OpenCode 按此指令执行*
