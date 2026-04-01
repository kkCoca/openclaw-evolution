# clawdevflow v3.1.0 - P0 任务需求说明

## 版本信息

| 字段 | 值 |
|------|-----|
| 版本 | v3.1.0 |
| 日期 | 2026-04-01 |
| 场景类型 | 增量需求 |
| 父版本 | v3.0.1 |

---

## 任务背景

clawdevflow v3.0.1 发布评估中发现以下差距：
- 测试覆盖率仅~60%，未达到 80%+ 目标
- 缺少 npm test 脚本
- 缺少完整的单元测试框架

---

## P0 任务目标

### 1. 补充单元测试至 80% 覆盖率

**需求**：
- 新增 State Manager 单元测试
- 新增 AI Tool Adapter 单元测试
- 新增全量测试运行脚本
- 整体测试覆盖率提升至 80%+

**验收标准**：
- Given 测试文件已创建
- When 运行 npm test
- Then State Manager 测试 100% 通过，整体覆盖率>80%

---

### 2. 添加 npm test 脚本

**需求**：
- 创建 package.json
- 添加 test 脚本
- 添加 test:state/test:adapter/test:workflow 等子命令

**验收标准**：
- Given package.json 已创建
- When 运行 npm test
- Then 所有测试自动执行并输出结果

---

### 3. 验证 install.sh 全平台可用

**需求**：
- 验证 Linux 平台安装
- 验证 macOS 平台安装
- 验证 Windows 平台安装（install.bat）

**验收标准**：
- Given 安装脚本已存在
- When 在各平台执行
- Then 无错误，bundled skills 正确注册

---

## 技术约束

- 保持现有目录结构不变
- 测试文件放在 tests/ 目录
- package.json 放在 04_coding/src/ 目录
- 不修改核心业务逻辑

---

## 输出要求

**必须输出到**：
```
projects/clawdevflow/
├── 04_coding/src/
│   └── package.json              # 新增
├── tests/
│   ├── test-state-manager.js     # 新增
│   ├── test-ai-tool-adapter.js   # 新增
│   └── run-all-tests.js          # 新增
├── CHANGELOG.md                  # 追加 v3.1.0 记录
└── ASSESSMENT-REPORT.md          # 更新评估状态
```

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.0.0 | 2026-03-31 | CDF 重命名为 clawdevflow |
| v3.0.1 | 2026-04-01 | 文档精简 + README 新增 |
| **v3.1.0** | **2026-04-01** | **P0 任务：测试框架 + npm test** |

---

## 验收检查点

| 编号 | 检查项 | 状态 |
|------|--------|------|
| P0-1 | State Manager 测试 100% 通过 | ⬜ |
| P0-2 | AI Tool Adapter 测试>50% 通过 | ⬜ |
| P0-3 | npm test 脚本可用 | ⬜ |
| P0-4 | CHANGELOG.md 追加 v3.1.0 | ⬜ |
| P0-5 | package.json 语法正确 | ⬜ |

---

*本需求由 openclaw-ouyp 提供，clawdevflow 执行*
