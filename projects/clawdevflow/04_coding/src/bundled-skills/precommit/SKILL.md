---
name: precommit
description: 提交前检查与清理证据生成。在需要提交前风险检查时使用。
---

# 提交前检查

本 skill 由 ClawDevFlow 流程引擎自动调用，输出目录为 `07_precommit/`。

## 输入

- 项目工作区（必须是 git 仓库）

## 输出

- `07_precommit/PRECOMMIT_PLAN.json`
- `07_precommit/PRECOMMIT_REPORT.json`
- `07_precommit/PRECOMMIT_SUMMARY.md`

## 执行流程

1. 扫描敏感文件（`.env`、`*.pem`、`*.key`、`id_rsa`）
2. 检查未跟踪文件是否位于受保护目录
3. 检查 `08_releasing/` 是否被 git 跟踪
4. 生成清理计划与检查报告

## 约束

- 所有产物必须写入 `07_precommit/`
- 禁止修改项目根目录其他文件
