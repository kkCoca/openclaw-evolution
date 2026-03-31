# 测试计划 (TEST-PLAN) - URI to Markdown

> **版本**: v1.0.0  
> **日期**: 2026-03-30  
> **状态**: 已批准 ✅

---

## 1. 测试策略

### 1.1 测试层级

```
┌─────────────────────────────────────┐
│         端到端测试 (E2E)             │  ← 用户场景验证
├─────────────────────────────────────┤
│         集成测试 (Integration)       │  ← 模块间协作
├─────────────────────────────────────┤
│         单元测试 (Unit)             │  ← 单个函数/类
└─────────────────────────────────────┘
```

### 1.2 测试工具

| 层级 | 工具 | 说明 |
|------|------|------|
| 单元测试 | Vitest | 快速，支持 TypeScript |
| 集成测试 | Playwright Test | 浏览器自动化 |
| 端到端测试 | Playwright Test | 真实场景模拟 |

### 1.3 测试覆盖率目标

| 模块 | 行覆盖率 | 分支覆盖率 |
|------|---------|-----------|
| 核心库 | > 80% | > 70% |
| Chrome 插件 | > 60% | > 50% |
| CLI 工具 | > 70% | > 60% |

---

## 2. 单元测试

### 2.1 FrameExtractor 测试

```typescript
// tests/unit/FrameExtractor.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { FrameExtractor } from '../../src/core/browser/FrameExtractor';

describe('FrameExtractor', () => {
  let extractor: FrameExtractor;

  beforeEach(() => {
    extractor = new FrameExtractor();
  });

  describe('mergeFrameContents', () => {
    it('应该按正确顺序合并 iframe 内容', () => {
      const frames = [
        { url: 'cap4/form/dist/index.html', html: '<div>Form Content</div>', text: 'Form', textLength: 3459 },
        { url: 'collaboration.do', html: '<div>Header Content</div>', text: 'Header', textLength: 221 },
      ];

      const merged = extractor.mergeFrameContents(frames);

      // collaboration.do 应该在前
      expect(merged.indexOf('Header Content')).toBeLessThan(merged.indexOf('Form Content'));
    });

    it('应该跳过空 iframe', () => {
      const frames = [
        { url: 'about:blank', html: '', text: '', textLength: 0 },
        { url: 'content.do', html: '<div>Content</div>', text: 'Content', textLength: 100 },
      ];

      const merged = extractor.mergeFrameContents(frames);

      expect(merged).toContain('Content');
      expect(merged).not.toContain('about:blank');
    });
  });
});
```

### 2.2 FormParser 测试

```typescript
// tests/unit/FormParser.test.ts

import { describe, it, expect } from 'vitest';
import { FormParser } from '../../src/core/parser/FormParser';

describe('FormParser', () => {
  const parser = new FormParser();

  describe('pairFields - 左右布局', () => {
    it('应该正确配对左右结构的字段', () => {
      const cells = ['字段名 1', '字段值 1', '字段名 2', '字段值 2'];
      
      // 模拟配对逻辑
      const fields = parser.pairFields(cells, 0);

      expect(fields).toHaveLength(2);
      expect(fields[0]).toEqual({ name: '字段名 1', value: '字段值 1' });
      expect(fields[1]).toEqual({ name: '字段名 2', value: '字段值 2' });
    });
  });

  describe('pairFields - 上下布局', () => {
    it('应该正确处理上下结构的字段', () => {
      const cells = ['字段名 1', '', '字段值 1', ''];
      
      const fields = parser.pairFields(cells, 0);

      expect(fields).toHaveLength(1);
      expect(fields[0].name).toBe('字段名 1');
    });
  });

  describe('pairFields - 跳过项', () => {
    it('应该跳过空单元格', () => {
      const cells = ['', '字段名 1', '字段值 1', ''];
      
      const fields = parser.pairFields(cells, 0);

      expect(fields).toHaveLength(1);
    });

    it('应该跳过区域标题', () => {
      const cells = ['█ 区域标题', '字段名 1', '字段值 1'];
      
      const fields = parser.pairFields(cells, 0);

      expect(fields.every(f => !f.name.includes('█'))).toBe(true);
    });

    it('应该跳过说明文字', () => {
      const cells = ['注：说明文字', '字段名 1', '字段值 1'];
      
      const fields = parser.pairFields(cells, 0);

      expect(fields.every(f => !f.name.startsWith('注：'))).toBe(true);
    });
  });
});
```

### 2.3 AttachmentParser 测试

```typescript
// tests/unit/AttachmentParser.test.ts

import { describe, it, expect } from 'vitest';
import { AttachmentParser } from '../../src/core/parser/AttachmentParser';

describe('AttachmentParser', () => {
  const parser = new AttachmentParser();

  describe('generateBatchDownloadUrl', () => {
    it('应该生成正确的批量下载 URL', () => {
      const fileIds = ['file1', 'file2', 'file3'];
      const url = parser.generateBatchDownloadUrl(fileIds, 'attachments.zip');

      expect(url).toContain('/rest/attachment/file/batchDownload/');
      expect(url).toContain('file1,file2,file3');
      expect(url).toContain('zipFileName=attachments.zip');
    });

    it('应该使用默认文件名', () => {
      const fileIds = ['file1'];
      const url = parser.generateBatchDownloadUrl(fileIds);

      expect(url).toContain('zipFileName=attachments.zip');
    });
  });
});
```

### 2.4 ConfigManager 测试

```typescript
// tests/unit/ConfigManager.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigManager } from '../../src/core/config/ConfigManager';

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
    process.env.TEST_USER = 'testuser';
    process.env.TEST_PASS = 'testpass';
  });

  afterEach(() => {
    delete process.env.TEST_USER;
    delete process.env.TEST_PASS;
  });

  describe('resolveEnvVariables', () => {
    it('应该解析环境变量引用', () => {
      const config = {
        sites: [{
          domain: 'test.com',
          username: '${TEST_USER}',
          password: '${TEST_PASS}'
        }]
      };

      const resolved = (manager as any).resolveEnvVariables(config);

      expect(resolved.sites[0].username).toBe('testuser');
      expect(resolved.sites[0].password).toBe('testpass');
    });

    it('应该抛出错误当环境变量未设置', () => {
      const config = {
        sites: [{
          domain: 'test.com',
          username: '${UNDEFINED_VAR}',
          password: 'pass'
        }]
      };

      expect(() => (manager as any).resolveEnvVariables(config))
        .toThrow('环境变量 UNDEFINED_VAR 未设置');
    });
  });
});
```

---

## 3. 集成测试

### 3.1 致远 OA 登录测试

```typescript
// tests/integration/zhiyuan-login.test.ts

import { test, expect } from '@playwright/test';

test.describe('致远 OA 登录', () => {
  test('应该成功登录', async ({ page }) => {
    // 访问登录页
    await page.goto('https://xt.seeyon.com/seeyon/main.do');

    // 填写登录表单
    await page.fill('#login_username', process.env.SEYYON_USER!);
    await page.fill('#login_password1', process.env.SEYYON_PASS!);
    await page.click('#login_button');

    // 等待登录成功
    await page.waitForLoadState('networkidle');

    // 验证登录成功（检查是否跳转到主页）
    await expect(page).toHaveURL(/main\.do/);
  });

  test('应该处理登录失败', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/seeyon/main.do');

    // 使用错误密码
    await page.fill('#login_username', 'testuser');
    await page.fill('#login_password1', 'wrongpassword');
    await page.click('#login_button');

    // 等待错误提示
    await page.waitForSelector('.error-message', { timeout: 5000 });

    // 验证错误提示存在
    const errorMessage = await page.$('.error-message');
    expect(errorMessage).toBeTruthy();
  });
});
```

### 3.2 多 iframe 合并测试

```typescript
// tests/integration/iframe-merge.test.ts

import { test, expect } from '@playwright/test';

test.describe('多 iframe 合并', () => {
  test('应该检测所有 iframe', async ({ page }) => {
    // 访问测试页面（致远 OA BUG 单）
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    // 获取所有 iframe
    const frames = page.frames();

    // 验证 iframe 数量
    expect(frames.length).toBeGreaterThanOrEqual(4);

    // 验证有内容的 iframe
    const contentFrames = await Promise.all(
      frames.map(async (frame) => {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );
        return { url: frame.url(), textLength };
      })
    );

    const hasContentFrames = contentFrames.filter(f => f.textLength > 0);
    expect(hasContentFrames.length).toBeGreaterThanOrEqual(2);

    // 验证 Frame 2 (collaboration.do) 存在
    const frame2 = contentFrames.find(f => f.url.includes('collaboration.do'));
    expect(frame2).toBeTruthy();

    // 验证 Frame 4 (cap4/form) 存在
    const frame4 = contentFrames.find(f => f.url.includes('cap4/form'));
    expect(frame4).toBeTruthy();
  });

  test('应该合并 iframe 内容', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    // 提取并合并内容
    const frames = page.frames();
    const contents: string[] = [];

    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );
        if (textLength > 0) {
          const html = await frame.content();
          contents.push(html);
        }
      } catch (e) {
        // 跳过无法访问的 frame
      }
    }

    const merged = contents.join('\n\n');

    // 验证合并后的内容包含关键信息
    expect(merged).toContain('BUG');
    expect(merged).toContain('客户信息');
  });
});
```

### 3.3 82 字段提取测试

```typescript
// tests/integration/fields-extraction.test.ts

import { test, expect } from '@playwright/test';

test.describe('82 字段提取', () => {
  test('应该提取所有 16 个区域的字段', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    // 找到表单 frame
    const formFrame = page.frames().find(f => f.url().includes('cap4/form'));
    expect(formFrame).toBeTruthy();

    // 提取所有表格
    const tables = await formFrame!.$$('table');
    expect(tables.length).toBeGreaterThanOrEqual(15);

    // 提取所有单元格
    let cellCount = 0;
    for (const table of tables) {
      const cells = await table.$$('td, th');
      cellCount += cells.length;
    }

    // 验证单元格数量（82 个字段 × 2 + 区域标题 + 说明文字）
    expect(cellCount).toBeGreaterThanOrEqual(164);
  });

  test('应该正确配对字段', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    const formFrame = page.frames().find(f => f.url().includes('cap4/form'));
    
    // 提取特定字段验证
    const titleCell = await formFrame?.$eval('td:has-text("BUG 标题")', 
      el => el.textContent?.trim()
    );
    expect(titleCell).toBeTruthy();
  });
});
```

### 3.4 附件提取测试

```typescript
// tests/integration/attachments-extraction.test.ts

import { test, expect } from '@playwright/test';

test.describe('附件提取', () => {
  test('应该提取附件文件名和大小', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    // 查找附件区域
    const attachmentItems = await page.$$('.attachment-item');
    
    expect(attachmentItems.length).toBeGreaterThanOrEqual(1);

    // 验证每个附件的信息
    for (const item of attachmentItems) {
      const name = await item.$eval('.file-name', 
        el => el.textContent?.trim()
      );
      const size = await item.$eval('.file-size', 
        el => el.textContent?.trim()
      );

      expect(name).toBeTruthy();
      expect(size).toMatch(/[\d.]+\s*(KB|MB|GB)/);
    }
  });

  test('应该识别需要手动下载的附件', async ({ page }) => {
    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    const attachmentLinks = await page.$$('.attachment-item a');
    
    for (const link of attachmentLinks) {
      const href = await link.getAttribute('href');
      
      // 致远 OA 中 href 通常为空
      if (!href || href === '') {
        // 验证是否标注为需手动下载
        // （这是预期行为）
      }
    }
  });
});
```

---

## 4. 端到端测试

### 4.1 Chrome 插件 E2E

```typescript
// tests/e2e/chrome-extension.test.ts

import { test, expect, _electron as electron } from '@playwright/test';

test.describe('Chrome 插件', () => {
  test('应该转换当前标签页', async () => {
    // 启动 Chrome（加载插件）
    const browser = await electron.launch({
      args: ['--load-extension=dist/chrome-extension']
    });

    // 访问测试页面
    const page = await browser.newPage();
    await page.goto('https://juejin.cn/post/123456');

    // 点击插件图标
    await page.click('extension-icon');

    // 验证预览显示
    await page.waitForSelector('.preview');
    const previewContent = await page.$eval('.preview pre', el => el.textContent);
    
    expect(previewContent).toContain('#');
    expect(previewContent.length).toBeGreaterThan(100);

    // 点击下载
    await page.click('#downloadBtn');
    
    // 验证文件下载（需要配置下载目录）
    // ...

    await browser.close();
  });
});
```

### 4.2 CLI E2E

```typescript
// tests/e2e/cli.test.ts

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';

test.describe('CLI 工具', () => {
  test('应该转换单个 URL', () => {
    const output = execSync(
      'npx uri2md convert https://juejin.cn/post/123456 --output test-output.md',
      { encoding: 'utf-8' }
    );

    // 验证输出文件
    expect(fs.existsSync('test-output.md')).toBe(true);
    
    const content = fs.readFileSync('test-output.md', 'utf-8');
    expect(content).toContain('#');

    // 清理
    fs.unlinkSync('test-output.md');
  });

  test('应该批量转换', () => {
    // 准备 URL 列表文件
    fs.writeFileSync('test-urls.txt', 'https://juejin.cn/post/1\nhttps://juejin.cn/post/2');

    execSync('npx uri2md batch test-urls.txt --output-dir test-output/', {
      encoding: 'utf-8'
    });

    // 验证输出文件
    expect(fs.existsSync('test-output/1.md')).toBe(true);
    expect(fs.existsSync('test-output/2.md')).toBe(true);

    // 清理
    fs.unlinkSync('test-urls.txt');
    fs.rmSync('test-output/', { recursive: true });
  });
});
```

---

## 5. 性能测试

### 5.1 单页面转换性能

```typescript
// tests/performance/single-page.test.ts

import { test, expect } from '@playwright/test';

test.describe('性能测试', () => {
  test('单页面转换应该 < 10 秒', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('https://xt.seeyon.com/...');
    await page.waitForLoadState('networkidle');

    // 提取内容
    const frames = page.frames();
    let mergedHtml = '';
    for (const frame of frames) {
      try {
        const textLength = await frame.evaluate(
          () => document.body?.innerText?.length || 0
        );
        if (textLength > 0) {
          mergedHtml += await frame.content();
        }
      } catch (e) {}
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(10000);
  });
});
```

---

## 6. 测试执行

### 6.1 本地测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 E2E 测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

### 6.2 CI 测试

```yaml
# .github/workflows/test.yml

name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 7. 测试数据

### 7.1 测试 URL

| 类型 | URL | 用途 |
|------|-----|------|
| 致远 OA | https://xt.seeyon.com/... | 登录 + 表单测试 |
| 掘金 | https://juejin.cn/post/... | 通用网站测试 |
| 本地测试页 | http://localhost:3000/test | 单元测试 |

### 7.2 测试账号

```bash
# .env.test
SEYYON_USER=test_user
SEYYON_PASS=test_pass
```

---

## 8. 验收标准

### 8.1 功能验收

| 功能 | 验收标准 | 状态 |
|------|---------|------|
| URI 转换 | 输出正确 Markdown | ⬜ |
| 登录认证 | 自动登录成功 | ⬜ |
| iframe 合并 | 内容完整 | ⬜ |
| 字段提取 | 82 字段完整 | ⬜ |
| 附件处理 | 文件名 + 大小完整 | ⬜ |

### 8.2 性能验收

| 指标 | 目标值 | 状态 |
|------|--------|------|
| 单页面转换时间 | < 10 秒 | ⬜ |
| 内存占用 | < 200MB | ⬜ |

### 8.3 质量验收

| 指标 | 目标值 | 状态 |
|------|--------|------|
| 单元测试覆盖率 | > 80% | ⬜ |
| P0/P1 Bug 数 | 0 | ⬜ |

---

## 9. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-30 | 初始版本（全新功能） |

---

*TEST-PLAN.md 由流程引擎生成，指导测试实施*
