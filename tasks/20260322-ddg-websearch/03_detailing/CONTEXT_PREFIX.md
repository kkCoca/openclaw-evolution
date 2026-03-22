# Context Prefix: DDG Web Search

> **任务 ID**: 20260322-ddg-websearch  
> **创建日期**: 2026-03-23  
> **状态**: ✅ 完成

---

## 📎 核心约束

- 100% 遵循 L0-L6 规范
- OpenClaw 把控，OpenCode 编码
- 生产区纯净原则 (L2)
- 命名归一化 (L3)

---

## 🏗️ 架构约束

**模块职责**:
- index.js: 统一搜索入口
- contracts: 请求/响应契约
- orchestrator: 搜索编排
- router: 搜索源路由 (DDG → Bing)
- source: DDG/Bing 适配器
- parser: HTML 解析
- guard: 反爬控制
- formatter: 响应格式化
- logging: 结构化日志
- health: 健康检查

**搜索流程**:
```
search(request) → validate → router → DDG/Bing → parse → format → response
```

**配置参数**:
- limit: 默认 10，最大 20
- outputMode: summary | detailed
- timeout: 10000ms
- retries: 3

---

## 🔗 物理连接

**研发区**: `tasks/20260322-ddg-websearch/04_coding/`
**生产区**: `extensions/openclaw-web-search/`
**部署方式**: 仅复制 dist/ + package.json

---

## ✅ 验证清单

- [x] 任务目录结构符合 L4
- [x] PRD + TRD + ROADMAP + DETAIL 完整
- [x] 执行报告完整
- [x] 生产区纯净 (无 src/, tests/)
- [x] 命名归一化 (ddg-websearch)
- [x] 27 个测试通过
- [x] npm run build 通过

---

*本文档按 L4 规范生成*
