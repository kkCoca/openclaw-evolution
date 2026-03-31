# 需求：URI 页面内容转换为 Markdown（uri-to-markdown）

## 原始需求说明

**Issue ID**: FEATURE-001  
**需求类型**: 全新功能  
**版本**: v1.0.0  
**日期**: 2026-03-30

---

## 版本变更记录

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-30 | 初始版本 |
| **v1.1.0** | **2026-03-30** | **调整部署形式：OpenClaw Skill → Chrome 插件** |

---

## 1. 需求背景

### 1.1 问题描述

需要将公司内部网站的页面内容转换为 Markdown 格式，便于：
- 知识沉淀和归档
- 离线阅读
- 文档迁移
- 内容二次加工

### 1.2 核心痛点

1. **登录认证** — 内部网站需要登录才能访问
2. **手动复制** — 手动复制粘贴效率低，格式易丢失
3. **格式混乱** — 网页 HTML 格式无法直接用于 Markdown 文档

---

## 2. 功能需求

### 2.1 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| **URI 转换** | 将网页 HTML 转换为 Markdown | P0 |
| **登录认证** | 支持配置型登录认证 | P0 |
| **内容提取** | 智能识别正文，过滤导航/广告 | P0 |
| **格式保留** | 标题/列表/代码块/链接/图片 | P0 |

### 2.2 认证配置

**配置型认证设计**：

```yaml
# config.yaml
sites:
  # 需要登录的网站
  - domain: internal.company.com
    loginUrl: https://internal.company.com/login
    username: ${INTERNAL_USER}    # 支持环境变量
    password: ${INTERNAL_PASS}    # 支持环境变量
    
  # 无需登录的网站
  - domain: public.example.com
    # 不配置认证信息，直接访问
```

**认证流程**：
1. 访问 URI 时，检查域名是否在配置中
2. 有认证配置 → 自动登录获取 Cookie
3. 无认证配置 → 直接访问
4. 使用 Cookie/无 Cookie 访问目标页面
5. 提取内容 → 转换为 Markdown

**安全要求**：
- ✅ 支持环境变量引用（避免明文密码）
- ✅ Cookie 过期自动重新登录
- ✅ 登录失败重试限制（防封禁）

### 2.3 输出格式（可配置）

| 选项 | 说明 | 默认 |
|------|------|------|
| **纯 Markdown** | 只输出转换后的 Markdown 内容 | ✅ |
| **带元数据** | Markdown + 标题/作者/发布时间等 | 可选 |
| **保存文件** | 支持输出到本地文件 | 可选 |

### 2.4 部署形式（已确认）

**分层架构设计**：

| 层级 | 形式 | 用途 | 优先级 |
|------|------|------|--------|
| **核心库** | npm 包 (`uri-to-markdown-core`) | 核心转换逻辑，可被复用 | P0（必须） |
| **Chrome 插件** | 浏览器扩展 | 当前标签页一键转换 | P0（必须） |
| **CLI 工具** | 命令行工具 | 批量转换、脚本化 | P0（必须） |
| **HTTP API** | REST 服务 | 未来被智能运维系统调用 | P1（后续） |

**部署说明**：

1. **核心库** — 独立 npm 包，不依赖任何框架，支持 Node.js/Browser
2. **Chrome 插件** — 浏览器扩展，读取当前 tab 内容，一键转换为 Markdown 并下载
3. **CLI 工具** — 命令行批量处理，支持配置文件和脚本化
4. **HTTP API** — 后续扩展，支持被智能运维知识系统调用

**优势**：
- ✅ **通用性** — 核心库独立，不绑定特定业务系统
- ✅ **浏览器体验** — Chrome 插件直接操作当前 tab，无需复制 URL
- ✅ **批量处理** — CLI 支持批量转换客户 BUG 单
- ✅ **系统集成** — HTTP API 可被未来智能运维系统调用

---

## 3. 非功能需求

### 3.1 性能要求

| 指标 | 要求 |
|------|------|
| 单页面转换时间 | < 10 秒（含登录） |
| 并发支持 | 支持串行请求（暂不要求并发） |

### 3.2 可靠性要求

| 要求 | 说明 |
|------|------|
| 登录失败处理 | 重试 3 次后报错，记录日志 |
| Cookie 过期 | 自动检测并重新登录 |
| 网络异常 | 超时重试，友好错误提示 |

### 3.3 安全要求

| 要求 | 说明 |
|------|------|
| 密码存储 | 支持环境变量，禁止明文 |
| 日志脱敏 | 密码/Token 不记录到日志 |
| 配置隔离 | 多账号场景支持多配置 |

---

## 4. 验收标准

### 4.1 Given
- 已安装 uri-to-markdown 工具/Skill
- 已配置 config.yaml（含认证信息）
- 目标网站可正常访问

### 4.2 When
- 调用工具转换内部网站页面

### 4.3 Then
- ✅ 自动完成登录认证
- ✅ 成功获取页面内容
- ✅ 正确转换为 Markdown 格式
- ✅ 保留标题/列表/链接/图片
- ✅ 过滤导航/广告等无关内容

---

## 5. 使用示例

### 示例 1：Chrome 插件（无需登录的网站）
```
1. 打开 https://juejin.cn/post/123456
2. 点击 Chrome 插件图标
3. 自动转换为 Markdown 并显示
4. 点击"复制"或"下载"按钮
```

### 示例 2：Chrome 插件（需要登录的内部网站）
```
1. 登录致远 OA：https://xt.seeyon.com/seeyon/main.do
2. 打开任意文档页面
3. 点击 Chrome 插件图标
4. 自动使用当前登录状态（Cookie）
5. 转换为 Markdown（含元数据）并下载
```

### 示例 3：CLI 调用（批量处理）
```bash
# 单个 URL
uri2md https://juejin.cn/post/123456

# 批量 URL（从文件读取）
uri2md --batch urls.txt --output-dir ./knowledge-base/

# 指定配置文件
uri2md --config ~/.uri2md/config.yaml https://xt.seeyon.com/...
```

### 示例 4：CLI 调用（多账号场景）
```bash
# 指定配置（如配置了多个账号）
uri2md --site internal-account2 https://xt.seeyon.com/...
```

### 示例 5：HTTP API 调用（未来扩展）
```bash
# POST /api/convert
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://juejin.cn/post/123456", "withMeta": true}'
```

---

## 6. 配置示例

### config.yaml
```yaml
# 全局配置
global:
  timeout: 30000              # 请求超时（毫秒）
  retryCount: 3               # 失败重试次数
  outputFormat: markdown+meta # 输出格式：markdown | markdown+meta
  imageHandling: keep-url     # 图片处理：keep-url | download | ignore

# 站点配置
sites:
  # 内部网站（需要登录）— 致远 OA
  - domain: xt.seeyon.com
    loginUrl: https://xt.seeyon.com/seeyon/main.do
    username: ${SEEEYON_USER}
    password: ${SEEEYON_PASS}
    loginMethod: form         # 登录方式：form | api | oauth
    
  # 外部网站（无需登录）
  - domain: juejin.cn
    # 无需认证
    
  - domain: public.example.com
    # 无需认证

# Chrome 插件配置
chrome-extension:
  showMetaByDefault: true     # 默认显示元数据
  downloadPath: ~/Downloads   # 默认下载路径
  shortcut: Alt+M             # 快捷键
```

### .env（环境变量）
```bash
SEEEYON_USER=your_username
SEEEYON_PASS=your_password
```

### Chrome 插件 manifest.json（关键配置）
```json
{
  "manifest_version": 3,
  "name": "URI to Markdown",
  "version": "1.0.0",
  "permissions": [
    "activeTab",
    "storage",
    "downloads"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+M"
      }
    }
  }
}
```

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-03-30 | 初始版本（全新功能） |

---

## 8. 已确认事项（基于真实页面分析）

### 8.1 致远 OA 页面特点（2026-03-30 实际测试）

**页面类型**: BUG 单详情页

**页面结构**:
- iframe 嵌套（6 个 frame，内容在主 iframe 中）
- 动态加载（需要等待 networkidle）
- 表单驱动（cap4 表单）

**元数据字段**（实际存在）:
| 字段 | 示例值 | 提取方式 |
|------|--------|---------|
| 标题 | BUG_重要_V8.1sp2_VIP1 星卡_博思特能源装备（天津）股份有限公司_发起的 cap4 表单在 pc 端转发协同，m3 打开默认显示的是移动视图不是 pc 视图_BUG2026033017131 | iframe title + 页面内容 |
| 作者 | 车丽芳 | 页面内容 |
| 日期 | 2026-03-30 15:46:32 | 页面内容 |
| 附件数 | 9 | 页面内容 |

**正文内容**:
- 简短文本（约 200 字符）
- 包含表单流程区域（发起附言、处理意见等）

**附件**:
- 多个附件（PDF/Word/Excel/PPT/图片/ZIP）
- 附件链接通过 JavaScript 动态生成（需要特殊处理）

**登录认证**（已验证）:
- ✅ 表单登录（`#login_username` + `#login_password1` + `#login_button`）
- ✅ 登录成功后访问目标页面
- ✅ Cookie 自动传递

### 8.2 需求确认

| 事项 | 确认结果 |
|------|---------|
| 输出格式 | Markdown + 元数据（必须） |
| 部署形式 | Chrome 插件 + CLI + 核心库 + HTTP API |
| 目标网站 | 致远 OA (xt.seeyon.com) + 通用网站 |
| 图片处理 | 保留原 URL（默认） |
| 附件处理 | **记录附件列表，URL 为空时标注**（致远 OA 限制） |
| iframe 支持 | 必须支持（检测所有 frame，提取有效内容） |

### 8.3 致远 OA 技术细节（已验证）

#### 问题 1：附件下载链接无法从静态 HTML 获取

**原因**：
- 致远 OA 使用 Vue 组件渲染附件列表
- `<a>` 标签只有 `download=""` 属性，`href` 为空
- 没有 `onclick` 事件或 `data-*` 属性存储 URL
- URL 是通过 JavaScript 动态生成的

**影响**：
- ✅ 可以提取附件文件名（含大小）
- ❌ 无法提取附件下载链接

**解决方案**：
1. **方案 A（推荐）**：仅记录附件列表，用户手动下载
2. **方案 B（复杂）**：模拟点击下载，拦截网络请求获取 URL

**批量下载 URL**（2026-03-30 实测获取）：
- BUG 报告单附件：`/rest/attachment/file/batchDownload/{fileIds}?zipFileName={name}`
- BUG 日志附件：`/rest/attachment/file/batchDownload/?zipFileName={name}`

---

#### 问题 2：内容分布在多个 iframe 中

**发现**（2026-03-30 实测）：

| Frame | URL | 文本长度 | 内容 |
|-------|-----|---------|------|
| Frame 1 | report4Result.do | 0 | 容器页面（空） |
| Frame 2 | collaboration.do | 221 字符 | BUG 单头部 + 附件列表 |
| Frame 3 | about:blank | 0 | 空 |
| **Frame 4** | **cap4/form/dist/index.html** | **3459 字符** | **完整表单详情** |
| Frame 5 | about:blank | 0 | 空 |
| Frame 6 | about:blank | 0 | 空 |

**Frame 4 包含的完整内容**：
- 客户基本信息（单位名称、所属区域、服务星卡等级、服务到期日）
- 加密狗号
- 问题描述信息（BUG 标题、简述、报告单、日志）
- 产品版本信息（A8+ 企业版、V8.1sp2、Build Id）
- 15 个表格

**影响**：
- ❌ 只提取单个 iframe 会得到不完整内容
- ✅ 必须**合并所有有内容的 iframe** 才能得到完整页面

**解决方案**：
1. 检测所有 iframe
2. 识别有内容的 iframe（文本长度 > 0）
3. 分别提取每个 iframe 的内容
4. 按逻辑顺序合并（Frame 2 头部 + Frame 4 详情）

---

#### 问题 3：表单字段配对逻辑

**发现**（2026-03-30 实测）：

致远 OA 表单表格布局有两种模式：

**模式 A：左右结构**
```
字段名 1 | 字段值 1 | 字段名 2 | 字段值 2
```

**模式 B：上下结构**
```
字段名 1
字段值 1
```

**配对逻辑**：
1. 跳过空单元格（占位符）
2. 按顺序配对：字段名 → 字段值
3. 跳过区域标题行（包含 █ 符号）
4. 跳过说明文字（以"注："、"1、"、"2、"开头）

**已验证字段**（82 个字段，16 个区域）：

| 区域 | 字段数 | 验证状态 |
|------|--------|---------|
| BUG 单期限信息 | 5 | ✅ 已确认 |
| 上报人信息 | 6 | ✅ 已确认 |
| 客户信息 | 10 | ✅ 已确认 |
| 联系人信息 | 5 | ✅ 已确认 |
| 问题描述信息 | 10 | ✅ 已确认 |
| 开发人员填写 | 13 | ✅ 已确认 |
| 备注说明 | 2 | ✅ 已确认 |
| 补丁包相关 | 1 | ✅ 已确认 |
| 核心代码 | 1 | ✅ 已确认 |
| 转客开处理 | 5 | ✅ 已确认 |
| 代码检查结果 | 4 | ✅ 已确认 |
| 诊断结论 | 3 | ✅ 已确认 |
| 测试人员填写 | 6 | ✅ 已确认 |
| 客开人员填写信息 | 3 | ✅ 已确认 |
| 区域客开 | 2 | ✅ 已确认 |
| 发起人交付信息 | 6 | ✅ 已确认 |
| **总计** | **82** | **✅ 全部确认** |

---

#### 验收标准调整

| 项目 | 标准 |
|------|------|
| 正文内容 | ✅ 合并所有 iframe 内容，完整提取 |
| 元数据 | ✅ 标题/作者/日期完整提取 |
| 附件列表 | ✅ 文件名 + 大小完整提取 |
| 附件 URL | ⚠️ 致远 OA 标注"需手动下载"或提供批量下载 URL |
| 表单字段 | ✅ 完整提取（82 个字段，16 个区域） |
| 表格 | ✅ 完整提取（15 个表格） |
| 字段配对 | ✅ 正确处理左右/上下两种布局模式 |

---

*REQUIREMENTS.md 由 openclaw-ouyp 提供，追加式记录所有版本需求*
