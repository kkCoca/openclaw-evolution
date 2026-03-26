---
name: openclaw-research-workflow
description: AI 辅助研发流程引擎，自动化编排 designing→roadmapping→detailing→coding→reviewing 完整流程
triggers:
  - /sessions_spawn openclaw-research-workflow
entry: workflow.md
version: 1.0.0
author: openclaw-ouyp
license: MIT
---

# OpenClaw Research Workflow Skill

## 简介

本 Skill 是一个流程引擎，自动编排 AI 辅助研发流程，将复杂的研发流程封装为单一入口，降低用户使用门槛。

## 支持的场景

1. **全新功能开发** - 从 0 到 1 的完整研发流程
2. **增量需求开发** - 在现有基础上添加新功能
3. **问题修复** - 定位并修复现有问题

## 使用方法

```bash
/sessions_spawn openclaw-research-workflow

# 任务：{任务描述}
# 场景类型：[全新功能 | 增量需求 | 问题修复]
# 需求描述：{详细描述}
# 约束条件：{约束条件}
# 验收标准：{验收标准}
```

## 重要要求

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

## 工作流程

详见 workflow.md

## 依赖

本 Skill 包含以下 bundled skills：
- designing
- roadmapping
- detailing
- coding
- reviewing

安装时自动注册，无需单独安装。

## 安装

详见 README.md

## 特性

- ✅ 一键安装 - 一个命令安装所有依赖
- ✅ 流程标准化 - 完整的研发流程编排
- ✅ 场景支持 - 全新功能/增量需求/问题修复
- ✅ 跨平台 - Windows/Linux/macOS
- ✅ 零感知依赖 - bundled skills 自动注册

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-26 | 初始版本 |

## 许可证

MIT
