# 任务模板（Task Template）

> 使用此模板创建新任务，确保流程引擎正确执行。

---

## 任务描述

{在此填写任务描述}

## 场景类型

[全新功能 | 增量需求 | 问题修复]

## 需求描述

{在此填写详细需求描述}

## 约束条件

{在此填写约束条件}

## 验收标准

- Given {前提条件}
- When {执行动作}
- Then {预期结果}

---

## 重要要求（必须遵守）

**必须按照以下目录结构输出**：

```
{任务目录}/
├── 01_designing/
│   ├── PRD.md
│   └── TRD.md
├── 02_roadmapping/
│   └── ROADMAP.md
├── 03_detailing/
│   └── DETAIL.md
├── 04_coding/
│   ├── src/
│   ├── tests/
│   └── README.md
└── 05_reviewing/
    └── REVIEW-REPORT.md
```

**禁止**直接输出到任务根目录！

---

## 使用示例

```markdown
## 任务描述
实现 web_search 技能的异常处理机制

## 场景类型
增量需求

## 需求描述
为 web_search 技能添加 6 类异常处理和 Fallback 机制

## 约束条件
- 必须使用现有 web_search 工具
- 不能修改工具签名
- 需要保持向后兼容

## 验收标准
- Given web_search 技能已安装
- When 执行搜索遇到异常
- Then 自动触发 Fallback 机制并记录日志
```

---

**版本**: 1.0.0  
**创建日期**: 2026-03-26  
**作者**: openclaw-ouyp
