# HTML 样本库

**用途**: 用于集成测试的真实 HTML 样本

---

## 样本清单

| 文件名 | 来源 | 类型 | 用途 |
|--------|------|------|------|
| `ddg-captcha.html` | DuckDuckGo | 验证码页 | 测试验证码检测逻辑 |
| `ddg-normal.html` | DuckDuckGo | 正常结果页 | 测试结果提取逻辑 |
| `ddg-rate-limit.html` | DuckDuckGo | 限流页 | 测试限流检测逻辑 |
| `ddg-empty.html` | DuckDuckGo | 空结果页 | 测试空结果处理 |
| `bing-normal.html` | Bing | 正常结果页 | 测试结果提取逻辑 |
| `bing-captcha.html` | Bing | 验证码页 | 测试验证码检测逻辑 |

---

## 当前状态

| 文件 | 状态 | 大小 | 更新日期 |
|------|------|------|---------|
| `ddg-captcha.html` | ✅ 已抓取 | 14KB | 2026-03-23 |
| `bing-normal.html` | ✅ 已抓取 | 109KB | 2026-03-23 |
| `ddg-normal.html` | ⏳ 待抓取 | - | - |
| `ddg-rate-limit.html` | ⏳ 待抓取 | - | - |
| `ddg-empty.html` | ⏳ 待抓取 | - | - |
| `bing-captcha.html` | ⏳ 待抓取 | - | - |

---

## 更新方法

### 手动更新

```bash
# 抓取 DDG 样本
curl -s -L -A "Mozilla/5.0" "https://duckduckgo.com/html/?q=OpenClaw%20AI" \
  > tests/fixtures/ddg-normal.html

# 抓取 Bing 样本
curl -s -L -A "Mozilla/5.0" "https://www.bing.com/search?q=OpenClaw%20AI" \
  > tests/fixtures/bing-normal.html
```

### 自动更新（Cron Job）

```bash
# 每周日 02:00 更新
0 2 * * 0 /home/ouyp/Learning/Practice/openclaw-universe/scripts/fetch-html-fixtures.sh
```

---

## 使用示例

```javascript
// tests/parser-integration.test.js
const fs = require('fs');
const path = require('path');

const ddgCaptchaHtml = fs.readFileSync(
  path.join(__dirname, 'fixtures/ddg-captcha.html'),
  'utf8'
);

test('DDG 验证码页面应抛出错误', () => {
  expect(() => parseDdgDocument(ddgCaptchaHtml, 10))
    .toThrow('captcha_detected');
});
```

---

## 注意事项

1. **样本时效性**: HTML 结构可能变化，建议每周更新
2. **样本代表性**: 应覆盖正常、异常、边界情况
3. **样本大小**: 单文件建议 < 500KB（避免测试过慢）
4. **样本验证**: 每次更新后运行集成测试验证

---

**最后更新**: 2026-03-23
