# 实验目录说明

> **定位**: 教育与参考，非交付产品  
> **状态**: 实验已完成（2026-03-20）  
> **保留理由**: A/B 两组完整实现代码，供贡献者学习 Plan-and-Execute 模式

---

## 📊 实验概览

**实验名称**: Plan-and-Execute A/B 实验  
**实验时间**: 2026-03-19 至 2026-03-20  
**测试载体**: obsidian-tasks Skill（仅作为实验载体，不交付）  
**实验结论**: Plan-and-Execute 模式实现 34.4% Token 节省 + 零返工

---

## 📁 目录结构

```
20260319-plan-execute-experiment/
├── 01_designing/
│   └── PRD.md                    # 实验设计文档
└── 04_coding/
    ├── EXPERIMENT-DESIGN.md      # 编码阶段实验设计
    ├── group-a/                  # A 组：自由推理模式（对照组）
    │   ├── obsidian-tasks/       # A 组实现代码
    │   └── COMPLETION_REPORT.md  # A 组完成报告
    └── group-b/                  # B 组：Plan-and-Execute 模式（实验组）
        ├── obsidian-tasks/       # B 组实现代码
        └── EXECUTION_REPORT.md   # B 组执行报告
```

---

## 🎯 如何使用本目录

### 对于学习者

如果你想学习 **Plan-and-Execute 模式**：

1. **阅读实验设计**: `01_designing/PRD.md`
2. **对比 A/B 两组实现**:
   - A 组（自由推理）：`group-a/obsidian-tasks/`
   - B 组（Plan-and-Execute）：`group-b/obsidian-tasks/`
3. **查看实验结果**: `research/insights/20260320-coding-experiment-report.md`

### 对于贡献者

**注意**: 本目录是**实验过程记录**，不是可交付的扩展产品。

- ✅ 可参考：学习 Plan-and-Execute 模式的实现方法
- ❌ 不可用：不要直接部署 obsidian-tasks（仅测试载体）

---

## 📈 实验数据摘要

| 指标 | A 组（自由） | B 组（规划） | 差异 |
|------|------------|------------|------|
| Token 用量 | ~16,000 | ~10,500 | **节省 34.4%** |
| 执行时间 | ~7 分 50 秒 | ~5 分 39 秒 | **节省 28%** |
| 返工次数 | 3 次 | 0 次 | **-100%** |
| 测试覆盖 | 55/55 | 26/26 | 均 100% |

**详细报告**: 请阅读 [`research/insights/20260320-coding-experiment-report.md`](../research/insights/20260320-coding-experiment-report.md)

---

## 🔗 相关链接

- [白皮书 v1.0](../research/insights/20260319-PLAN-AND-EXECUTE-REVOLUTION.md) - 完整理论框架
- [Coding 实验报告 v2.0](../research/insights/20260320-coding-experiment-report.md) - coding 阶段数据
- [研发规约](~/.openclaw/workspace/AGENTS.md) - Plan-and-Execute 模式详解

---

*最后更新：2026-03-20*  
*由 openclaw-ouyp 维护 · 万象锻造 · 生生不息* 🌌
