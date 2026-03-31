# URI to Markdown 使用指南

> **版本**: v2.1.1  
> **发布日期**: 2026-03-31  
> **项目地址**: https://gitee.com/cola16/openclaw-evolution

---

## 📖 概述

### 解决的问题

在日常工作和研发过程中，我们经常需要将网页内容转换为 Markdown 格式：

| 场景 | 痛点 | 传统方案 |
|------|------|---------|
| **知识沉淀** | 网页内容无法直接归档 | 手动复制粘贴，格式丢失 |
| **BUG 单归档** | 致远 OA BUG 单需要长期保存 | 截图 + 手动整理，效率极低 |
| **内容二次加工** | 优质文章需要编辑引用 | 浏览器插件功能单一 |
| **批量处理** | 大量页面需要统一转换 | 无自动化工具 |

**URI to Markdown** 正是为了解决这些问题而生。

---

### 核心价值

```
┌─────────────────────────────────────────────────────────┐
│                   URI to Markdown                        │
├─────────────────────────────────────────────────────────┤
│  🎯 一键转换 — 任意网页 → 结构化 Markdown                │
│  🔐 自动登录 — 支持内部系统（致远 OA 等）认证             │
│  🧩 智能提取 — 多 iframe 合并、表单字段配对、附件识别     │
│  🚀 多形态 — Chrome 插件 + CLI 工具 + 核心库             │
│  ⚙️ 可配置 — YAML 配置 + 环境变量，灵活适配              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 功能特性

### 核心功能

| 功能 | 说明 | 状态 |
|------|------|------|
| **HTML 转 Markdown** | 基于 Turndown 引擎，保留标题/列表/代码块/链接/图片 | ✅ |
| **智能内容提取** | 过滤导航/广告/脚本，只保留正文内容 | ✅ |
| **登录认证** | 支持表单登录，自动管理 Cookie，过期重登 | ✅ |
| **多 iframe 合并** | 自动检测并合并所有有内容的 iframe | ✅ |
| **表单字段提取** | 82 个字段，16 个区域，左右/上下布局自动识别 | ✅ |
| **附件识别** | 提取文件名 + 大小，识别批量下载 URL | ✅ |
| **元数据保留** | 标题/作者/发布时间/URL 完整记录 | ✅ |

### 部署形式

| 形式 | 用途 | 适用场景 |
|------|------|---------|
| **Chrome 插件** | 当前标签页一键转换 | 个人日常使用 |
| **CLI 工具** | 命令行批量转换 | 自动化脚本、批量处理 |
| **核心库** | npm 包，可编程调用 | 集成到其他系统 |

---

## 🏗️ 架构设计

### 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        用户层                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Chrome 插件  │  │  CLI 工具    │  │  核心库 (API 调用)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          └────────────────┼────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │     URI to Markdown Core        │
          │  ┌────────────────────────────┐ │
          │  │  BrowserManager            │ │ ← 浏览器管理
          │  │  - Playwright 实例管理      │ │
          │  │  - 页面导航/自动登录        │ │
          │  └────────────────────────────┘ │
          │  ┌────────────────────────────┐ │
          │  │  FrameExtractor            │ │ ← iframe 处理
          │  │  - 多 frame 检测            │ │
          │  │  - 内容提取与合并           │ │
          │  └────────────────────────────┘ │
          │  ┌────────────────────────────┐ │
          │  │  Transformer               │ │ ← 转换引擎
          │  │  - Turndown HTML→MD        │ │
          │  │  - 自定义规则过滤           │ │
          │  └────────────────────────────┘ │
          │  ┌────────────────────────────┐ │
          │  │  FormParser                │ │ ← 表单解析
          │  │  - 82 字段提取              │ │
          │  │  - 左右/上下布局识别        │ │
          │  └────────────────────────────┘ │
          │  ┌────────────────────────────┐ │
          │  │  AttachmentParser          │ │ ← 附件处理
          │  │  - 文件名/大小提取          │ │
          │  │  - 批量下载 URL 生成         │ │
          │  └────────────────────────────┘ │
          │  ┌────────────────────────────┐ │
          │  │  ConfigManager             │ │ ← 配置管理
          │  │  - YAML 配置加载            │ │
          │  │  - 环境变量支持            │ │
          │  └────────────────────────────┘ │
          └─────────────────────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │       外部依赖                   │
          │  - Playwright (浏览器自动化)     │
          │  - Turndown (HTML 转 Markdown)   │
          │  - js-yaml (配置解析)           │
          └─────────────────────────────────┘
```

### 数据流

```
用户请求
   │
   ▼
┌─────────────────┐
│ 1. 加载配置      │ → config.yaml + .env
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 启动浏览器    │ → Playwright Chromium
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 访问页面      │ → 自动登录 (如需认证)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 提取内容      │ → 多 iframe 合并
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 转换 Markdown │ → Turndown + 自定义规则
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. 提取元数据    │ → 标题/作者/日期/附件
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. 输出结果      │ → 控制台/文件
└─────────────────┘
```

---

## 📦 安装与配置

### 方式 1：Chrome 插件（推荐个人使用）

**安装步骤**：

```bash
# 1. 打开 Chrome 扩展管理页面
chrome://extensions/

# 2. 启用"开发者模式"（右上角开关）

# 3. 点击"加载已解压的扩展程序"

# 4. 选择插件目录
/home/ouyp/Learning/Practice/openclaw-universe/
  projects/uri-to-markdown/
  04_coding/src/chrome-extension/
```

**使用方法**：
1. 打开任意网页
2. 点击插件图标（绿色 M 字母）
3. 或按快捷键 `Alt+M`
4. 点击"转换"按钮
5. 复制 Markdown 或下载文件

---

### 方式 2：CLI 工具（推荐批量处理）

**安装**：

```bash
# 进入 CLI 目录
cd /home/ouyp/Learning/Practice/openclaw-universe/
  projects/uri-to-markdown/
  04_coding/src/cli/

# 安装依赖
npm install

# 全局安装（可选）
npm link
```

**使用**：

```bash
# 转换单个 URL
npx tsx src/index.ts convert https://example.com

# 带元数据和输出文件
npx tsx src/index.ts convert https://example.com \
  --with-meta \
  --output article.md

# 批量转换
npx tsx src/index.ts batch urls.txt \
  --output-dir ./articles/

# 测试登录
npx tsx src/index.ts login xt.seeyon.com
```

---

### 方式 3：核心库（推荐集成开发）

**安装**：

```bash
npm install uri-to-markdown-core
```

**使用**：

```typescript
import { UriToMarkdown } from 'uri-to-markdown-core';

const converter = new UriToMarkdown();

// 加载配置
await converter.loadConfig('~/.uri2md/config.yaml');

// 转换 URL
const result = await converter.convert('https://example.com', {
  withMeta: true,
  withAttachments: true,
  withFields: true
});

console.log(result.markdown);
console.log(result.meta);
console.log(result.attachments);

// 关闭浏览器
await converter.close();
```

---

### 配置文件

**config.yaml**：

```yaml
# 全局配置
global:
  timeout: 30000              # 请求超时（毫秒）
  retryCount: 3               # 失败重试次数
  outputFormat: markdown+meta # 输出格式
  imageHandling: keep-url     # 图片处理方式

# 站点配置
sites:
  # 致远 OA（需要登录）
  - domain: xt.seeyon.com
    loginUrl: https://xt.seeyon.com/seeyon/main.do
    username: ${SEEEYON_USER}
    password: ${SEEEYON_PASS}
    loginMethod: form

  # 外部网站（无需登录）
  - domain: juejin.cn
    # 无需认证

# Chrome 插件配置
chrome-extension:
  showMetaByDefault: true
  downloadPath: ~/Downloads
  shortcut: Alt+M
```

**.env**：

```bash
SEEEYON_USER=your_username
SEEEYON_PASS=your_password
```

---

## 📚 使用场景

### 场景 1：转换掘金文章

```bash
# CLI 方式
npx tsx src/index.ts convert https://juejin.cn/post/7328123456789 \
  --with-meta \
  --output juejin-article.md
```

**输出示例**：

```markdown
---
标题：深入理解 TypeScript 泛型
作者：张三
URL: https://juejin.cn/post/7328123456789
转换时间：2026-03-31T08:00:00.000Z
---

# 深入理解 TypeScript 泛型

## 什么是泛型

泛型是 TypeScript 中非常重要的概念...

## 泛型的使用场景

1. 函数泛型
2. 接口泛型
3. 类泛型
```

---

### 场景 2：归档致远 OA BUG 单

```bash
# 配置环境变量
export SEEEYON_USER=admin
export SEEEYON_PASS=password

# 转换 BUG 单（包含所有字段和附件）
npx tsx src/index.ts convert \
  https://xt.seeyon.com/seeyon/cap4/form/show.do?formId=123 \
  --with-meta \
  --with-attachments \
  --with-fields \
  --config ~/.uri2md/config.yaml \
  --output bug-report-20260331.md
```

**输出示例**：

```markdown
---
标题：BUG_重要_V8.1sp2_客户名称_问题描述
URL: https://xt.seeyon.com/...
转换时间：2026-03-31T08:00:00.000Z
---

## 客户基本信息

- **单位名称**: 博思特能源装备（天津）股份有限公司
- **所属区域**: 华北区
- **服务星卡等级**: VIP1
- **服务到期日**: 2027-12-31
- **加密狗号**: XXXXXXXXXXXX

## 问题描述信息

- **BUG 标题**: cap4 表单在 pc 端转发协同，m3 打开默认显示的是移动视图
- **问题简述**: 客户反馈在移动端查看表单时显示异常...
- **产品版本**: A8+ 企业版 V8.1sp2

## 附件

- screenshot.png (1.2MB)
- error-log.txt (5KB)
- database-dump.sql (15MB)

> 提示：部分附件需要手动下载，或联系管理员获取批量下载权限
```

---

### 场景 3：批量转换客户 BUG 单

```bash
# 准备 URL 列表文件 (urls.txt)
https://xt.seeyon.com/seeyon/cap4/form/show.do?formId=123
https://xt.seeyon.com/seeyon/cap4/form/show.do?formId=124
https://xt.seeyon.com/seeyon/cap4/form/show.do?formId=125

# 批量转换
npx tsx src/index.ts batch urls.txt \
  --config ~/.uri2md/config.yaml \
  --output-dir ./bug-reports/ \
  --concurrency 1

# 输出
批量转换文件：urls.txt
找到 3 个 URL
开始批量转换（并发数：1）...

[1/3] 转换：https://xt.seeyon.com/...
  ✅ 保存到：./bug-reports/BUG20260331001.md
[2/3] 转换：https://xt.seeyon.com/...
  ✅ 保存到：./bug-reports/BUG20260331002.md
[3/3] 转换：https://xt.seeyon.com/...
  ✅ 保存到：./bug-reports/BUG20260331003.md

========================================
批量转换完成！
成功：3, 失败：0
```

---

### 场景 4：集成到自动化流程

```typescript
// automated-archiver.ts
import { UriToMarkdown } from 'uri-to-markdown-core';
import * as fs from 'fs';

async function archiveBugReports() {
  const converter = new UriToMarkdown();
  await converter.loadConfig('./config.yaml');

  const bugIds = ['123', '124', '125'];
  
  for (const id of bugIds) {
    const url = `https://xt.seeyon.com/seeyon/cap4/form/show.do?formId=${id}`;
    const result = await converter.convert(url, {
      withMeta: true,
      withFields: true,
      withAttachments: true
    });

    const filename = `./archive/BUG${id}.md`;
    fs.writeFileSync(filename, result.markdown);
    console.log(`✅ Archived: ${filename}`);
  }

  await converter.close();
}

archiveBugReports();
```

---

## 🔧 高级配置

### 多账号管理

```yaml
# config-multi-account.yaml
sites:
  # 账号 1 - 测试环境
  - domain: test.seeyon.com
    username: ${TEST_USER}
    password: ${TEST_PASS}

  # 账号 2 - 生产环境
  - domain: xt.seeyon.com
    username: ${PROD_USER}
    password: ${PROD_PASS}

  # 账号 3 - 客户环境
  - domain: customer.seeyon.com
    username: ${CUSTOMER_USER}
    password: ${CUSTOMER_PASS}
```

```bash
# 使用指定配置
npx tsx src/index.ts convert <url> \
  --config config-multi-account.yaml
```

---

### 自定义转换规则

```typescript
// custom-rules.ts
import { Transformer } from 'uri-to-markdown-core';

const transformer = new Transformer();

// 添加自定义规则
transformer.addRule('custom-removal', {
  filter: (node) => {
    return node.classList?.contains('advertisement');
  },
  replacement: () => ''
});

// 使用自定义 transformer 进行转换
```

---

## 🧪 测试与验证

### 单元测试

```bash
cd /home/ouyp/Learning/Practice/openclaw-universe/
  projects/uri-to-markdown

# 运行所有测试
npm run test:unit

# 运行覆盖率
npm run test:coverage
```

**测试结果**：
```
✓ AttachmentParser.test.ts  (8 tests)
✓ FrameExtractor.test.ts   (5 tests)
✓ FormParser.test.ts       (14 tests)
✓ ConfigManager.test.ts    (9 tests)

Test Files  4 passed (4)
Tests       36 passed (36)
```

---

### 集成测试

```bash
# 测试 iframe 合并
npm run test:integration
```

---

## 📊 性能指标

| 指标 | 目标值 | 实测值 |
|------|--------|--------|
| 单页面转换时间 | < 10 秒 | ~3-5 秒 |
| 内存占用 | < 200MB | ~150MB |
| 正文提取率 | > 95% | ~98% |
| 字段配对准确率 | > 99% | ~99.5% |

---

## 🔒 安全说明

### 密码存储

✅ **推荐**：使用环境变量

```bash
# .env
SEEEYON_USER=admin
SEEEYON_PASS=your_password
```

```yaml
# config.yaml
sites:
  - domain: xt.seeyon.com
    username: ${SEEEYON_USER}
    password: ${SEEEYON_PASS}
```

❌ **禁止**：明文密码

```yaml
# 不要这样做！
sites:
  - domain: xt.seeyon.com
    username: admin
    password: plaintext_password  # ❌
```

### 日志脱敏

系统自动脱敏以下信息：
- 密码
- Token
- Cookie

---

## ❓ 常见问题

### Q1: 转换后内容为空？

**可能原因**：
- 页面需要登录，但未配置认证
- 页面内容在 iframe 中，但未启用 iframe 提取

**解决方案**：
```yaml
# 配置登录认证
sites:
  - domain: xt.seeyon.com
    loginUrl: https://xt.seeyon.com/seeyon/main.do
    username: ${USER}
    password: ${PASS}
```

---

### Q2: 附件下载链接为空？

**原因**：致远 OA 的附件链接是动态生成的，无法从静态 HTML 获取

**解决方案**：
- 使用批量下载 URL（如有权限）
- 手动下载附件

---

### Q3: Chrome 插件无法加载？

**检查项**：
1. 确认启用了"开发者模式"
2. 确认选择了正确的目录（包含 manifest.json）
3. 确认图标文件存在（icons/icon-*.png）

---

### Q4: CLI 工具报错 "Cannot find module"？

**解决方案**：
```bash
# 确保使用 tsx 运行
npx tsx src/index.ts <command>

# 或安装 tsx
npm install tsx
```

---

## 📝 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

**项目地址**: https://gitee.com/cola16/openclaw-evolution

---

## 📄 许可证

MIT License

---

## 📞 联系方式

- **作者**: openclaw-ouyp
- **邮箱**: (请联系项目仓库)
- **Issue**: https://gitee.com/cola16/openclaw-evolution/issues

---

*最后更新：2026-03-31*
