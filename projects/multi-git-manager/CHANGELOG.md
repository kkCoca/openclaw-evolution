# 变更日志 (CHANGELOG)

> multi-git-manager 变更日志

---

## [v1.0.0] - 2026-04-01

### 新增 ✨

- **核心功能**
  - 基于 Git Hook 的多仓库同步工具
  - 支持主仓库和多个镜像仓库配置
  - 提交后自动同步到镜像仓库（post-commit Hook）
  - 推送前配置验证（pre-push Hook）

- **配置管理**
  - `.multi-git/config.json` 配置文件
  - 支持 primary 主仓库配置
  - 支持 mirrors 数组配置多个镜像仓库
  - 支持分支过滤（branches 字段）
  - 支持启用/禁用控制（enabled 字段）

- **同步策略**
  - 自动同步模式（syncMode: auto）
  - 手动同步模式（syncMode: manual）
  - 故障重试机制（retryCount/retryDelay）
  - 同步报告输出（成功/失败状态）

- **工具脚本**
  - `install.sh` - 安装和初始化脚本
  - `config.template.json` - 配置模板
  - `hooks/logger.sh` - 日志模块
  - `hooks/config.sh` - 配置解析模块
  - `hooks/sync.sh` - 同步执行模块

- **文档**
  - PRD.md - 产品需求文档
  - TRD.md - 技术设计文档
  - ROADMAP.md - 研发路线图
  - DETAIL.md - 详细设计文档
  - REVIEW-REPORT.md - 验收报告
  - README.md - 使用说明

### 技术实现 🔧

- 纯 Bash 脚本实现，无额外依赖
- 支持 jq 解析 JSON（可选，有降级方案）
- 跨平台支持（Linux/macOS/Windows Git Bash）
- Git Hook 软链接机制
- 串行同步执行，避免并发冲突

### 验收标准 ✅

- ✅ 主仓库正常推送（用户手动执行）
- ✅ 附属仓库自动同步
- ✅ 同步失败有错误提示
- ✅ 同步报告清晰显示结果

---

## 版本说明

### 版本号规则

遵循语义化版本规范（Semantic Versioning）：

- **主版本号 (Major)**: 不兼容的 API 变更
- **次版本号 (Minor)**: 向后兼容的功能新增
- **补丁号 (Patch)**: 向后兼容的问题修复

### 变更类型标识

| 标识 | 说明 |
|------|------|
| ✨ 新增 | 新功能 |
| 🔧 技术实现 | 技术细节 |
| 🐛 修复 | Bug 修复 |
| 📝 文档 | 文档更新 |
| ⚡ 优化 | 性能优化 |
| 🔒 安全 | 安全相关 |

---

*本变更日志由 clawdevflow 流程引擎生成，openclaw-ouyp 维护*
