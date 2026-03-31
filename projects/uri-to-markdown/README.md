# URI to Markdown

> 将任意网页转换为 Markdown 格式的工具集

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://gitee.com/openclaw-universe/uri-to-markdown)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📖 简介

URI to Markdown 是一个**通用型网页内容转换工具**，将任意网页 HTML 内容转换为结构化 Markdown 格式。

### 核心特性

- ✅ **通用性** — 不绑定特定业务系统，支持任意网站
- ✅ **智能化** — 自动登录、多 iframe 合并、字段配对
- ✅ **多形态** — Chrome 插件 + CLI + 核心库
- ✅ **可配置** — YAML 配置 + 环境变量，灵活适配

### 致远 OA 特殊支持

- 🎯 **82 字段提取** — 16 个区域完整提取
- 🎯 **多 iframe 合并** — Frame 2 头部 + Frame 4 详情
- 🎯 **附件处理** — 文件名 + 大小，批量下载 URL

---

## 🚀 快速开始

### 方式 1：Chrome 插件（推荐）

```
1. 打开 Chrome 浏览器
2. 访问 chrome://extensions/
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 04_coding/src/chrome-extension 目录
6. 打开任意网页，点击插件图标
7. 点击"转换"按钮
```

**快捷键**: `Alt+M`

### 方式 2：CLI 工具

```bash
# 安装
npm install -g uri-to-markdown-cli

# 转换单个 URL
uri2md convert https://juejin.cn/post/123456

# 批量转换
uri2md batch urls.txt --output-dir ./output/

# 指定配置文件
uri2md convert <url> --config ~/.uri2md/config.yaml
```

### 方式 3：核心库（开发者）

```bash
# 安装
npm install uri-to-markdown-core
```

```typescript
import { UriToMarkdown } from 'uri-to-markdown-core';

const converter = new UriToMarkdown();

// 加载配置
await converter.loadConfig('~/.uri2md/config.yaml');

// 转换 URL
const result = await converter.convert('https://example.com/page', {
  withMeta: true,
  withAttachments: true,
  withFields: true
});

console.log(result.markdown);

// 关闭浏览器
await converter.close();
```

---

## 📋 配置说明

### config.yaml

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
    username: ${SEYYON_USER}
    password: ${SEYYON_PASS}
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

### .env（环境变量）

```bash
SEYYON_USER=your_username
SEYYON_PASS=your_password
```

---

## 📁 项目结构

```
projects/uri-to-markdown/
├── REQUIREMENTS.md           # 需求说明
├── 01_designing/
│   ├── PRD.md                # 产品需求文档
│   └── TRD.md                # 技术设计文档
├── 02_roadmapping/
│   └── ROADMAP.md            # 项目路线图
├── 03_detailing/
│   ├── DETAILED-DESIGN.md    # 详细设计
│   └── TEST-PLAN.md          # 测试计划
├── 04_coding/
│   ├── src/
│   │   ├── core/             # 核心库
│   │   ├── chrome-extension/ # Chrome 插件
│   │   └── cli/              # CLI 工具
│   └── tests/                # 测试代码
├── 05_reviewing/
│   └── REVIEW-REPORT.md      # 验收报告
├── CHANGELOG.md              # 变更日志
└── package.json
```

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 生成覆盖率报告
npm run test:coverage
```

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 构建所有模块
npm run build

# 代码检查
npm run lint

# 清理构建产物
npm run clean
```

---

## 📝 使用示例

### 示例 1：转换掘金文章

```bash
uri2md convert https://juejin.cn/post/7328123456789
```

### 示例 2：转换致远 OA BUG 单

```bash
# 配置环境变量
export SEYYON_USER=your_username
export SEYYON_PASS=your_password

# 转换（包含所有字段和附件）
uri2md convert https://xt.seeyon.com/... \
  --with-meta \
  --with-attachments \
  --with-fields \
  --output bug-report.md
```

### 示例 3：批量转换客户 BUG 单

```bash
# urls.txt
https://xt.seeyon.com/bug1
https://xt.seeyon.com/bug2
https://xt.seeyon.com/bug3

# 批量转换
uri2md batch urls.txt --output-dir ./bugs/
```

---

## 🔧 技术栈

| 组件 | 技术 |
|------|------|
| **核心库** | TypeScript + Playwright + Turndown + js-yaml |
| **Chrome 插件** | Manifest V3 + Vanilla JS |
| **CLI 工具** | TypeScript + Commander.js + cli-progress |
| **测试** | Vitest + Playwright Test |

---

## 📄 许可证

MIT License

---

## 📞 联系方式

- **作者**: openclaw-ouyp
- **项目**: https://gitee.com/openclaw-universe/uri-to-markdown
- **问题**: https://gitee.com/openclaw-universe/uri-to-markdown/issues

---

## 📅 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

---

*README.md by openclaw-ouyp*
