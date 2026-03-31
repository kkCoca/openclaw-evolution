# URI 转 Markdown 工具 - 问题记录

## Issue #001（2026-03-30）

### 问题描述
URI 转 Markdown 工具在处理某些网页时出现驳回问题，无法正确提取内容。

### 复现步骤
1. 提供目标网页 URI
2. 工具尝试提取内容
3. 返回驳回或错误

### 预期行为
工具应正确提取网页内容并转换为 Markdown 格式

### 实际行为
工具驳回请求或返回不完整内容

### 根因分析
待流程引擎分析（记录到 TRD.md）

### 修复版本
v1.0.1（待修复）

### 状态
待修复

---

## Issue #002（2026-03-31）

### 问题描述
FormParser.pairFields() 方法在处理空单元格时逻辑错误，导致字段配对不正确。

### 复现步骤
1. 运行单元测试 `npm run test:unit`
2. FormParser.test.ts 中「应该跳过空单元格」测试失败
3. 预期返回 1 个字段，实际返回 2 个字段

### 预期行为
- 跳过 null/undefined 单元格
- 空字符串作为占位符保留（表示字段值为空）
- 字段配对准确率 > 99%

### 实际行为
- 使用原始索引奇偶性判断布局
- 跳过单元格后索引奇偶性错乱
- 导致字段配对错误

### 根因分析
`pairFields()` 方法使用原始数组索引的奇偶性判断左右布局，但当跳过某些单元格（区域标题、说明文字）后，剩余单元格的索引奇偶性不再正确，导致配对逻辑错误。

### 修复方案
1. 先过滤掉需要跳过的项（null/undefined、区域标题、说明文字）
2. 在纯净列表上进行配对，保证索引从 0 开始
3. 空字符串作为占位符保留

### 修复版本
v1.0.0（开发阶段即时修复，尚未发布）

### 修复文件
- `04_coding/src/core/src/parser/FormParser.ts`
- `04_coding/tests/unit/FormParser.test.ts`

### 测试结果
✅ 36/36 单元测试通过

### 状态
✅ 已修复

---

## Issue #003（2026-03-31）

### 问题描述
Chrome 插件图标文件是占位符，不是有效的 PNG 文件，导致插件加载后图标显示异常。

### 复现步骤
1. 构建 Chrome 插件 `npm run build`
2. 在 Chrome 中加载插件
3. 观察扩展管理页面中的插件图标

### 预期行为
- 图标显示为有效的 PNG 图像
- 16x16, 48x48, 128x128 三个尺寸都正确显示

### 实际行为
- 图标文件是文本占位符（如 "PLACEHOLDER_ICON_16"）
- Chrome 无法解析，显示默认图标或空白

### 根因分析
构建脚本 `generate-icons.js` 仅创建了文本占位符文件，没有生成真实有效的 PNG 图像数据。

### 修复方案
1. 创建新的 `create-png-icons.js` 脚本
2. 使用 Node.js 内置 `zlib` 模块生成符合 PNG 规范的文件
3. 绘制绿色背景（RGB: 76, 175, 80）+ 白色 M 字母
4. 生成 16x16, 48x48, 128x128 三个尺寸

### 修复版本
v2.1.1

### 修复文件
- `04_coding/src/chrome-extension/icons/create-png-icons.js`（新增）
- `04_coding/src/chrome-extension/icons/icon-16.png`（替换）
- `04_coding/src/chrome-extension/icons/icon-48.png`（替换）
- `04_coding/src/chrome-extension/icons/icon-128.png`（替换）

### 测试结果
```
✅ icon-16.png (115 bytes) - PNG image data, 16 x 16, 8-bit/color RGB
✅ icon-48.png (251 bytes) - PNG image data, 48 x 48, 8-bit/color RGB
✅ icon-128.png (531 bytes) - PNG image data, 128 x 128, 8-bit/color RGB
```

### 状态
✅ 已修复

---

## Issue #004（2026-03-31）

### 问题描述
Chrome 插件转换致远 OA 页面时结果为 `undefined`，无法正确提取内容。

### 复现步骤
1. 在 Chrome 中加载 URI to Markdown 插件
2. 打开致远 OA 页面（如 BUG 单、报表）
   - 示例 URL: `https://xt.seeyon.com/seeyon/report4Result.do?method=reportPenetrate&rptDesignId=-4919087800369594175&...`
3. 点击插件图标 → 点击"转换当前页面"
4. 预览区域显示 `undefined`

### 预期行为
- 正确提取致远 OA 页面内容
- 输出完整 Markdown（含表单字段、附件列表）
- 82 个字段完整提取

### 实际行为
- 转换结果为 `undefined`
- 预览区域空白或显示错误

### 根因分析
致远 OA 页面内容在 iframe 中（`cap4/form/dist/index.html`），但 Chrome 插件的 content script 只获取了主页面 HTML，没有提取 iframe 内容，导致转换引擎无内容可处理。

**技术原因**：
- 致远 OA 使用 iframe 嵌套架构
- 主页面是框架容器，实际业务内容在 iframe 内
- 原 content.ts 仅调用 `document.documentElement.outerHTML` 获取主页面
- iframe 内容未被提取，导致转换结果为空

### 修复方案
1. 修改 `content/content.ts` 添加 iframe 内容提取逻辑
2. 遍历所有 iframe，使用 `iframe.contentDocument` 访问内容
3. 添加 try-catch 处理跨域 iframe（自动跳过）
4. 只提取有实际内容的 iframe（textContent.length > 0）
5. 将 iframe 内容合并到主 HTML（用 HTML 注释标记分隔）
6. 添加 console.log 便于调试

### 修复版本
v2.1.2

### 修复文件
- `04_coding/src/chrome-extension/content/content.ts`（修改）
- `04_coding/src/chrome-extension/content/content.js`（重新构建）
- `01_designing/TRD.md`（追加根因分析）
- `CHANGELOG.md`（追加 v2.1.2 记录）
- `05_reviewing/REVIEW-REPORT.md`（追加修复验证）

### 测试结果
✅ content.ts 已修改
✅ content.js 已重新构建（1.1kb）
✅ 致远 OA 同源 iframe 可正常访问
✅ 跨域 iframe 自动跳过（不报错）
✅ iframe 内容合并到主 HTML

### 状态
✅ 已修复
