---
name: releasing
description: 生成发布证据包与发布说明。在需要发布收口时使用。
---

# 发布

本 skill 由 ClawDevFlow 流程引擎自动调用，输出目录为 `08_releasing/`。

## 输入

- `05_reviewing/RELEASE_READINESS.json`（必须为 PASS）

## 输出

- `08_releasing/RELEASE_RECORD.json`
- `08_releasing/RELEASE_NOTES.md`
- `08_releasing/ARTIFACT_MANIFEST.json`
- `08_releasing/CLEANUP_PLAN.json`
- `08_releasing/CLEANUP_REPORT.json`

## 执行流程

1. 校验 `RELEASE_READINESS.json` 为 PASS
2. 生成发布记录与发布说明
3. 生成制品清单与清理计划
4. 执行清理扫描并生成清理报告

## 约束

- 所有产物必须写入 `08_releasing/`
- 禁止修改项目根目录其他文件
