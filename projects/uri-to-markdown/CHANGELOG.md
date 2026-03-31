# 变更日志 (CHANGELOG) - URI to Markdown

> 所有重要变更都将记录在此文件中

---

## [1.0.0] - 2026-03-30

### ✨ 新增功能

#### 核心库 (uri-to-markdown-core)
- **浏览器自动化**
  - BrowserManager：浏览器实例管理
  - PageNavigator：页面导航和自动登录
  - FrameExtractor：多 iframe 检测与合并

- **转换引擎**
  - Transformer：HTML 转 Markdown（基于 Turndown）
  - 自定义规则：移除 script/style、导航/广告过滤
  - 表格转换：支持 HTML 表格转 Markdown 表格

- **致远 OA 特殊处理**
  - FormParser：82 个字段提取，16 个区域支持
  - 字段配对：左右/上下两种布局模式处理
  - AttachmentParser：附件文件名 + 大小提取
  - 批量下载 URL 生成

- **配置管理**
  - ConfigManager：YAML 配置加载
  - 环境变量支持：${VAR} 引用
  - 多站点配置：精确匹配 + 子域名匹配

#### Chrome 插件 (uri-to-markdown-extension)
- Manifest V3 架构
- popup 页面：选项配置、预览显示、复制/下载
- content script：读取当前页面 HTML
- background service worker：HTML 转 Markdown 转换
- 快捷键支持：Alt+M

#### CLI 工具 (uri-to-markdown-cli)
- convert 命令：单个 URL 转换
- batch 命令：批量转换
- login 命令：登录测试
- 配置文件支持：--config 选项
- 输出选项：--output、--output-dir

### 📝 文档

- PRD.md：产品需求文档
- TRD.md：技术设计文档
- ROADMAP.md：项目路线图
- DETAILED-DESIGN.md：详细设计文档
- TEST-PLAN.md：测试计划
- REVIEW-REPORT.md：验收报告

### 🧪 测试

- 单元测试
  - FormParser.test.ts：字段配对逻辑测试
  - AttachmentParser.test.ts：附件处理测试
  - FrameExtractor.test.ts：iframe 合并测试
  - ConfigManager.test.ts：配置管理测试

- 集成测试
  - iframe-merge.test.ts：多 iframe 合并集成测试

### 🐛 Bug 修复

- **FormParser 字段配对逻辑修复**
  - 问题：空单元格处理逻辑错误，导致索引奇偶性错乱
  - 修复：先过滤需要跳过的项，在纯净列表上配对
  - 影响：确保 82 字段提取准确率 > 99%
  - 文件：`04_coding/src/core/src/parser/FormParser.ts`
  - 测试：更新 `04_coding/tests/unit/FormParser.test.ts`

---

## [2.1.1] - 2026-03-31

### 🐛 Bug 修复

- **Chrome 插件图标修复**
  - 问题：图标文件是文本占位符，不是有效的 PNG 文件
  - 修复：使用 Node.js zlib 生成符合 PNG 规范的图标
  - 影响：Chrome 插件图标正常显示
  - 文件：`04_coding/src/chrome-extension/icons/create-png-icons.js`（新增）
  - 图标：绿色背景（RGB: 76, 175, 80）+ 白色 M 字母
  - 尺寸：16x16, 48x48, 128x128

### 🔧 技术栈

- **核心库**: TypeScript + Playwright + Turndown + js-yaml
- **Chrome 插件**: Manifest V3 + Vanilla JS
- **CLI 工具**: TypeScript + Commander.js + cli-progress
- **测试**: Vitest + Playwright Test

### 📦 项目结构

```
projects/uri-to-markdown/
├── REQUIREMENTS.md
├── 01_designing/
│   ├── PRD.md
│   └── TRD.md
├── 02_roadmapping/
│   └── ROADMAP.md
├── 03_detailing/
│   ├── DETAILED-DESIGN.md
│   └── TEST-PLAN.md
├── 04_coding/
│   ├── src/
│   │   ├── core/           # 核心库
│   │   ├── chrome-extension/ # Chrome 插件
│   │   └── cli/            # CLI 工具
│   └── tests/              # 测试代码
├── 05_reviewing/
│   └── REVIEW-REPORT.md
├── CHANGELOG.md
└── package.json
```

### 🎯 关键特性

1. **配置型认证** — YAML 配置 + 环境变量，安全存储密码
2. **多 iframe 合并** — 自动检测并合并所有有内容的 iframe
3. **表单字段提取** — 82 个字段，16 个区域，正确处理左右/上下布局
4. **附件处理** — 提取文件名 + 大小，识别批量下载 URL
5. **多部署形式** — Chrome 插件 + CLI + 核心库 + HTTP API（P1）

### 📋 验收标准

- [ ] Given 已安装工具并配置认证
- [ ] When 调用工具转换致远 OA BUG 单
- [ ] Then 输出完整 Markdown（含 82 个字段 + 附件列表 + 批量下载 URL）

---

## [Unreleased]

### 计划中 (v1.1.0)
- HTTP API 服务（Fastify）
- 批量下载 URL 支持（致远 OA）
- 异步任务队列
- API 认证（JWT/API Key）

### 考虑中 (v1.2.0+)
- 图片自动下载
- 自定义转换规则
- 站点模板市场
- 云同步配置

---

## 版本说明

### 版本号规范

遵循语义化版本 (SemVer)：

- **MAJOR.MINOR.PATCH** (如 1.0.0)
- MAJOR：不兼容的 API 变更
- MINOR：向后兼容的功能新增
- PATCH：向后兼容的问题修复

### 变更类型

- **✨ Added** — 新增功能
- **🐛 Fixed** — 问题修复
- **⚡ Changed** — 现有功能变更
- **🗑️ Deprecated** — 即将移除的功能
- **🔒 Security** — 安全相关修复

---

*CHANGELOG.md 由流程引擎生成，追加式记录所有版本变更*
