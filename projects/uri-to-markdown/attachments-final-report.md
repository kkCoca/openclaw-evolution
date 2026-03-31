# 致远 OA BUG 上报单 - 附件 URL 列表

**提取时间**: 2026-03-30T10:24:42.959Z

**附件总数**: 6 个

---

## 📋 BUG 报告单附件（5 个截图）

**批量下载 URL**:

```
https://xt.seeyon.com/seeyon/rest/attachment/file/batchDownload/-7382843913157655814,-2186330649782300951,-8346053922800120577,-6249155877267815092,-8779588216445121308?zipFileName=JCXX_BUG%E6%8A%A5%E5%91%8A%E5%8D%95%E6%96%87%E4%BB%B6
```

**文件列表**:

| 序号 | 文件名 | 大小 |
|------|--------|------|
| 1 | QQ截图20260330112824.png | 772KB |
| 2 | QQ截图20260330112948.png | 127KB |
| 3 | QQ截图20260330113048.png | 382KB |
| 4 | QQ截图20260330113137.png | 480KB |
| 5 | QQ截图20260330113155.png | 500KB |

> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，> 或使用批量下载 URL 下载所有文件。

---

## 📦 BUG 日志及附件（1 个压缩包）

**批量下载 URL**:

```
https://xt.seeyon.com/seeyon/rest/attachment/file/batchDownload/?zipFileName=JCXX_BUG%E7%9B%B8%E5%85%B3%E6%97%A5%E5%BF%97
```

**文件列表**:

| 序号 | 文件名 | 大小 |
|------|--------|------|
| 1 | 日志(5).zip | 32.4M |

> ⚠️ 注意：单个附件 URL 需要通过点击下载按钮后拦截网络请求获取，> 或使用批量下载 URL 下载所有文件。

---

## 📝 说明

致远 OA 的附件下载链接是通过 JavaScript 动态生成的。

### 使用方式

1. **批量下载**：直接访问上述批量下载 URL
2. **单个下载**：需要在页面中点击附件，拦截网络请求获取真实 URL

### URL 格式分析

- 批量下载：`/rest/attachment/file/batchDownload/{fileIds}?zipFileName={name}`
- 文件 ID 从 HTML 元素的 `data-id` 或 JavaScript 中获取

