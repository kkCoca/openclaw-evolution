# 变更日志：DDG Web Search

**任务 ID**: 20260322-ddg-websearch

---

## [v1.1] - 2026-03-23（计划中）

### Fixed
- 修复 DDG 验证码检测不完整问题（#ISSUE-001）
  - 新增 `anomaly-modal` 检测
  - 新增 `botnet` 检测
  - 新增 `select all squares` 检测
  - 新增 `human` 检测

### Changed
- `detectDdgBlockingState()` 检测特征从 2 个增加到 6 个
- `extractBingResults()` 支持灵活 class 属性匹配

### Added
- HTML 样本库（tests/fixtures/）
- 集成测试套件（tests/parser-integration.test.js）
- 部署前验证流程（scripts/deploy-pipeline.sh）

### Tested
- 新增 6 个验证码检测单元测试
- 新增 8 个集成测试用例
- 测试覆盖率从 60% 提升到 85%

---

## [v1.0] - 2026-03-22

### Added
- 初始版本
- DDG 解析器基础功能
  - `detectDdgBlockingState()` - 验证码检测
  - `extractDdgResults()` - 结果提取
  - `parseDdgDocument()` - 文档解析
- Bing 解析器基础功能
  - `detectBingBlockingState()` - 验证码检测
  - `extractBingResults()` - 结果提取
  - `parseBingDocument()` - 文档解析
- Fallback 机制（DDG → Bing）
- 单元测试套件（10 个用例）

### Known Issues
- DDG 验证码检测不完整（仅 2 个特征）
- 缺少集成测试
- 测试数据与生产环境不一致

---

**格式说明**: 基于 [Keep a Changelog](https://keepachangelog.com/) 规范
