# 阶段说明

> 版本：v3.4.0  
> 更新日期：2026-04-09

---

## 阶段序列（8 阶段）

```
designing → roadmapping → detailing → coding → testing → reviewing → precommit → releasing
```

---

## 阶段详情

### 1. Designing（需求分析 → 产品设计）

| 项目 | 说明 |
|------|------|
| **输出目录** | `01_designing/` |
| **固定产物** | `PRD.md`, `TRD.md` |
| **审阅方式** | 人工确认 |
| **最大重试** | 3 次 |

### 2. Roadmapping（产品设计 → 研发路线）

| 项目 | 说明 |
|------|------|
| **输出目录** | `02_roadmapping/` |
| **固定产物** | `ROADMAP.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 3 次 |

### 3. Detailing（研发路线 → 详细任务）

| 项目 | 说明 |
|------|------|
| **输出目录** | `03_detailing/` |
| **固定产物** | `DETAIL.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 3 次 |

### 4. Coding（详细任务 → 源代码）

| 项目 | 说明 |
|------|------|
| **输出目录** | `04_coding/` |
| **固定产物** | `src/` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 3 次 |

### 5. Testing（源代码 → 测试证据）

| 项目 | 说明 |
|------|------|
| **输出目录** | `06_testing/` |
| **固定产物** | `TEST-REPORT.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 2 次 |

### 6. Reviewing（全部产出 → 发布就绪判断）

| 项目 | 说明 |
|------|------|
| **输出目录** | `05_reviewing/` |
| **固定产物** | `REVIEW-REPORT.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 2 次 |

### 7. Precommit（提交前清理 + 风险检查）

| 项目 | 说明 |
|------|------|
| **输出目录** | `07_precommit/` |
| **固定产物** | `PRECOMMIT-CHECKLIST.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 2 次 |

### 8. Releasing（发布证据包生成）

| 项目 | 说明 |
|------|------|
| **输出目录** | `08_releasing/` |
| **固定产物** | `RELEASE-NOTES.md` |
| **审阅方式** | 自动审阅 |
| **最大重试** | 2 次 |

---

## 输出目录约定

| 阶段 | 输出目录 | 说明 |
|------|---------|------|
| designing | `01_designing/` | 产品设计文档 |
| roadmapping | `02_roadmapping/` | 研发路线图 |
| detailing | `03_detailing/` | 详细设计 |
| coding | `04_coding/` | 源代码 |
| testing | `06_testing/` | 测试证据 |
| reviewing | `05_reviewing/` | 审阅报告 |
| precommit | `07_precommit/` | 提交前检查 |
| releasing | `08_releasing/` | 发布证据 |

---

## 产物合同

每个阶段有固定的产物合同，子会话必须生成这些文件：

| 阶段 | 产物合同 |
|------|---------|
| designing | `PRD.md`, `TRD.md` |
| roadmapping | `ROADMAP.md` |
| detailing | `DETAIL.md` |
| coding | `src/` |
| testing | `TEST-REPORT.md` |
| reviewing | `REVIEW-REPORT.md` |
| precommit | `PRECOMMIT-CHECKLIST.md` |
| releasing | `RELEASE-NOTES.md` |

---

## 相关文档

- `docs/actions-contract.md` - Actions 协议规范
- `docs/config.md` - 配置说明