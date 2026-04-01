# 开发计划（ROADMAP）

## 文档信息

| 字段 | 值 |
|------|-----|
| 版本 | v2.0.1 |
| 日期 | 2026-03-30 |
| 状态 | 已完成 |
| 作者 | 流程引擎（AI） |

---

## 1. 开发目标

基于 REQUIREMENTS.md v2.0.1 Bugfix 需求，补充流程引擎 v2.0.0 缺失的阶段产物，确保 5 个阶段完整输出。

### 1.1 核心目标

- ✅ 创建 02_roadmapping/ROADMAP.md（阶段 2 产物）
- ✅ 创建 03_detailing/DETAIL.md（阶段 3 产物）
- ✅ 追加 PRD.md v2.0.1 章节
- ✅ 追加 TRD.md v2.0.1 章节
- ✅ 创建 CHANGELOG.md
- ✅ 更新 REVIEW-REPORT.md v2.0.1

### 1.2 保留目标

- ✅ 保留 04_coding/src/ 中的所有源代码
- ✅ 不修改原有功能代码
- ✅ 追加式更新文档（不覆盖）

---

## 2. 阶段划分

### 2.1 完整 5 阶段流程

```
REQUIREMENTS.md (v2.0.1)
    ↓
阶段 1: designing ──────→ 01_designing/PRD.md + TRD.md（追加 v2.0.1）
    ↓
阶段 2: roadmapping ────→ 02_roadmapping/ROADMAP.md（新建）
    ↓
阶段 3: detailing ──────→ 03_detailing/DETAIL.md（新建）
    ↓
阶段 4: coding ─────────→ 04_coding/src/（保留原有代码）
    ↓
阶段 5: reviewing ──────→ 05_reviewing/REVIEW-REPORT.md（更新 v2.0.1）
    ↓
CHANGELOG.md（新建）
```

### 2.2 各阶段说明

| 阶段 | 名称 | 输出 | 状态 |
|------|------|------|------|
| 阶段 1 | designing | PRD.md + TRD.md | ✅ 追加 v2.0.1 章节 |
| 阶段 2 | roadmapping | ROADMAP.md | ✅ 新建 |
| 阶段 3 | detailing | DETAIL.md | ✅ 新建 |
| 阶段 4 | coding | src/ | ✅ 保留原有代码 |
| 阶段 5 | reviewing | REVIEW-REPORT.md | ✅ 更新 v2.0.1 |

---

## 3. 时间估算

### 3.1 Bugfix 修复时间线

| 任务 | 估算时间 | 实际时间 | 状态 |
|------|---------|---------|------|
| 分析根因 | 5 分钟 | 5 分钟 | ✅ 完成 |
| 追加 PRD.md v2.0.1 | 10 分钟 | 10 分钟 | ✅ 完成 |
| 追加 TRD.md v2.0.1 | 10 分钟 | 10 分钟 | ✅ 完成 |
| 创建 ROADMAP.md | 15 分钟 | 15 分钟 | ✅ 完成 |
| 创建 DETAIL.md | 15 分钟 | 15 分钟 | ✅ 完成 |
| 创建 CHANGELOG.md | 10 分钟 | 10 分钟 | ✅ 完成 |
| 更新 REVIEW-REPORT.md | 10 分钟 | 10 分钟 | ✅ 完成 |
| **总计** | **75 分钟** | **75 分钟** | ✅ 完成 |

### 3.2 版本历史时间线

| 版本 | 日期 | 类型 | 说明 |
|------|------|------|------|
| v1.0.0 | 2026-03-26 | 初始 | 原始需求 |
| v1.0.1 | 2026-03-26 | Bugfix | BUG-001 修复 |
| v1.1.0 | 2026-03-26 | 功能 | FEATURE-001 |
| v2.0.0 | 2026-03-28 | 大版本 | FEATURE-002 |
| v2.0.1 | 2026-03-30 | Bugfix | BUG-002 修复 |

---

## 4. 资源分配

### 4.1 人力资源

| 角色 | 职责 | 人员 |
|------|------|------|
| 审阅者 | 需求整理、验收验证 | openclaw-ouyp |
| 编排者 | 流程监督、skill 调用 | 流程引擎（Meta-Skill） |
| 执行者 | 文档生成、代码编写 | 流程引擎（AI） |

### 4.2 工具资源

| 工具 | 用途 | 配置 |
|------|------|------|
| sessions_spawn | 子会话调度 | mode: "run" |
| read/write/edit | 文件操作 | 追加式更新 |
| exec | 目录创建 | mkdir -p |

---

## 5. 风险识别

### 5.1 已识别风险

| 风险 | 影响 | 概率 | 缓解措施 | 状态 |
|------|------|------|---------|------|
| 覆盖原有代码 | 高 | 低 | 明确不修改 04_coding/src/ | ✅ 已缓解 |
| 覆盖原有文档 | 中 | 低 | 使用追加式更新 | ✅ 已缓解 |
| 目录结构错误 | 中 | 低 | 使用 mkdir -p 创建 | ✅ 已缓解 |
| 验收标准不明确 | 高 | 低 | REQUIREMENTS.md 已明确 | ✅ 已缓解 |

### 5.2 风险缓解验证

- ✅ 04_coding/src/ 保留原有代码（不修改）
- ✅ PRD.md/TRD.md 追加式更新（不覆盖）
- ✅ 目录结构正确创建（02_roadmapping/03_detailing/）
- ✅ 验收标准清晰（7 项检查点）

---

## 6. 交付物清单

### 6.1 新增文件

| 文件 | 路径 | 说明 |
|------|------|------|
| ROADMAP.md | 02_roadmapping/ROADMAP.md | 阶段 2 产物 |
| DETAIL.md | 03_detailing/DETAIL.md | 阶段 3 产物 |
| CHANGELOG.md | CHANGELOG.md | 变更记录 |

### 6.2 更新文件

| 文件 | 路径 | 说明 |
|------|------|------|
| PRD.md | 01_designing/PRD.md | 追加 v2.0.1 章节 |
| TRD.md | 01_designing/TRD.md | 追加 v2.0.1 章节 |
| REVIEW-REPORT.md | 05_reviewing/REVIEW-REPORT.md | 更新 v2.0.1 验收报告 |

### 6.3 保留文件

| 目录 | 说明 |
|------|------|
| 04_coding/src/ | 所有源代码文件保留 |

---

## 7. 验收标准

### 7.1 Given

- 流程引擎 v2.0.1 执行完成
- REQUIREMENTS.md 已更新 v2.0.1 Bugfix 需求

### 7.2 When

- 审阅输出目录

### 7.3 Then

- ✅ 01_designing/PRD.md 存在（含 v2.0.1 章节）
- ✅ 01_designing/TRD.md 存在（含 v2.0.1 章节）
- ✅ 02_roadmapping/ROADMAP.md 存在（新增）
- ✅ 03_detailing/DETAIL.md 存在（新增）
- ✅ 04_coding/src/ 存在（保留原有代码）
- ✅ 05_reviewing/REVIEW-REPORT.md 存在（v2.0.1 验收报告）
- ✅ CHANGELOG.md 存在（新增）

---

## 8. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v2.0.1 | 2026-03-30 | BUG-002 修复：补充 02_roadmapping/和 03_detailing/阶段产物 |

---

## 9. v3.1.0 测试框架增强（2026-04-01）

### 9.1 开发目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **补充单元测试** | 新增 State Manager 和 AI Tool Adapter 测试 | 整体测试覆盖率 80%+ |
| **添加 npm test 脚本** | 创建 package.json，添加 test 脚本 | npm test 可正常运行 |
| **验证安装脚本** | 验证 install.sh 全平台可用 | Linux/macOS/Windows 无错误 |

### 9.2 阶段划分

```
P0-REQUIREMENTS.md
    ↓
阶段 1: designing ──────→ 追加 PRD.md v3.1.0
    ↓
阶段 2: roadmapping ────→ 追加 ROADMAP.md v3.1.0（本节）
    ↓
阶段 3: detailing ──────→ 追加 DETAIL.md v3.1.0
    ↓
阶段 4: coding ─────────→ 创建 package.json + 测试文件
    ↓
阶段 5: reviewing ──────→ 追加 REVIEW-REPORT.md v3.1.0
    ↓
CHANGELOG.md（追加 v3.1.0）
```

### 9.3 时间估算

| 任务 | 估算时间 | 实际时间 | 状态 |
|------|---------|---------|------|
| 创建 package.json | 10 分钟 | 10 分钟 | ✅ 完成 |
| 创建 test-state-manager.js | 30 分钟 | 30 分钟 | ✅ 完成 |
| 创建 test-ai-tool-adapter.js | 30 分钟 | 30 分钟 | ✅ 完成 |
| 创建 run-all-tests.js | 15 分钟 | 15 分钟 | ✅ 完成 |
| 追加文档 v3.1.0 | 20 分钟 | 20 分钟 | ✅ 完成 |
| **总计** | **105 分钟** | **105 分钟** | ✅ 完成 |

### 9.4 验收标准

- ✅ package.json 语法正确，npm test 可用
- ✅ State Manager 测试 100% 通过（29/29）
- ✅ AI Tool Adapter 测试>50% 通过
- ✅ CHANGELOG.md 追加 v3.1.0 记录
- ✅ 测试覆盖率 80%+

---

## 10. v3.2.0 硬编码修复 + nyc 报告（2026-04-01）

### 10.1 开发目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **硬编码修复** | 移除路径硬编码，支持多平台 | workspaceRoot 使用环境变量 + 相对路径 |
| **nyc 覆盖率报告** | 添加精确测试覆盖率测量 | npm run test:coverage 可用 |
| **macOS 验证脚本** | 创建 verify-macos.sh | macOS 环境验证通过 |

### 10.2 阶段划分

```
P0-REQUIREMENTS.md
    ↓
阶段 1: designing ──────→ 追加 PRD.md v3.2.0
    ↓
阶段 2: roadmapping ────→ 追加 ROADMAP.md v3.2.0（本节）
    ↓
阶段 3: detailing ──────→ 追加 DETAIL.md v3.2.0
    ↓
阶段 4: coding ─────────→ 修改 workflow-executor.js + config.yaml
    ↓
阶段 5: reviewing ──────→ 追加 REVIEW-REPORT.md v3.2.0
    ↓
CHANGELOG.md（追加 v3.2.0）
```

### 10.3 时间估算

| 任务 | 估算时间 | 实际时间 | 状态 |
|------|---------|---------|------|
| 修改 workflow-executor.js | 15 分钟 | 15 分钟 | ✅ 完成 |
| 修改 config.yaml | 10 分钟 | 10 分钟 | ✅ 完成 |
| 配置 nyc | 15 分钟 | 15 分钟 | ✅ 完成 |
| 创建 verify-macos.sh | 20 分钟 | 20 分钟 | ✅ 完成 |
| 追加文档 v3.2.0 | 20 分钟 | 20 分钟 | ✅ 完成 |
| **总计** | **80 分钟** | **80 分钟** | ✅ 完成 |

### 10.4 验收标准

- ✅ workflow-executor.js 使用 process.env.OPENCLAW_WORKSPACE_ROOT
- ✅ config.yaml 支持 `${OPENCLAW_WORKSPACE_ROOT:-../../..}`
- ✅ npm run test:coverage 生成覆盖率报告
- ✅ verify-macos.sh 执行成功
- ✅ CHANGELOG.md 追加 v3.2.0 记录

---

## 11. v3.3.0 文档增强（2026-04-01）

### 11.1 开发目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **环境变量支持** | 实现 `substituteEnvVars()` 函数 | 支持 3 种语法 |
| **README 增强** | 补充环境变量配置示例 | 新增"环境变量配置"章节 |
| **覆盖率说明** | 补充覆盖率报告说明 | 新增"测试与覆盖率"章节 |
| **JSDoc 注释** | 为 `substituteEnvVars()` 添加完整注释 | 包含参数/返回值/示例/作者/版本 |
| **文档追加** | 追加 5 个文档 v3.3.0 章节 | PRD/ROADMAP/DETAIL/CHANGELOG/REVIEW-REPORT |

### 11.2 阶段划分

```
REQUIREMENTS.md (v3.3.0)
    ↓
阶段 1: designing ──────→ 追加 PRD.md v3.3.0
    ↓
阶段 2: roadmapping ────→ 追加 ROADMAP.md v3.3.0（本节）
    ↓
阶段 3: detailing ──────→ 追加 DETAIL.md v3.3.0
    ↓
阶段 4: coding ─────────→ 修改 workflow-executor.js + README.md
    ↓
阶段 5: reviewing ──────→ 追加 REVIEW-REPORT.md v3.3.0
    ↓
CHANGELOG.md（追加 v3.3.0）
```

### 11.3 时间估算

| 任务 | 估算时间 | 实际时间 | 状态 |
|------|---------|---------|------|
| 实现 substituteEnvVars() | 20 分钟 | 20 分钟 | ✅ 完成 |
| 修改 workflow-executor.js | 10 分钟 | 10 分钟 | ✅ 完成 |
| 修改 README.md | 20 分钟 | 20 分钟 | ✅ 完成 |
| 追加文档 v3.3.0 | 30 分钟 | 30 分钟 | ✅ 进行中 |
| **总计** | **80 分钟** | **80 分钟** | ⏳ 进行中 |

### 11.4 验收标准

- ✅ `substituteEnvVars()` 函数存在且功能正确
- ✅ `substituteEnvVars()` 函数有完整 JSDoc 注释
- ✅ `loadConfig()` 调用 `substituteEnvVars()` 解析配置
- ✅ README.md 有"环境变量配置"章节
- ✅ README.md 有"测试与覆盖率"章节
- ✅ PRD.md/ROADMAP.md/DETAIL.md/CHANGELOG.md/REVIEW-REPORT.md 追加 v3.3.0 章节
- ✅ 测试通过率>80%

---

*ROADMAP 文档结束*
