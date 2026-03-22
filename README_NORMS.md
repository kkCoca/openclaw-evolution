# 项目规范索引

> 本项目遵循 [万象锻造规范](file:///home/ouyp/.openclaw/workspace/NORMS/README.md)

---

## 📚 核心规范

所有核心规范位于：`~/.openclaw/workspace/NORMS/core/`

| 规范 | 文件 | 检查脚本 |
|------|------|---------|
| L1: 核心定位 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/01-core-positioning.md) | - |
| L2: 生产区纯净 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/02-production-purity.md) | [check-norm-02.sh](file:///home/ouyp/.openclaw/workspace/NORMS/checks/check-norm-02.sh) |
| L3: 命名归一化 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/03-naming-convention.md) | [check-norm-03.sh](file:///home/ouyp/.openclaw/workspace/NORMS/checks/check-norm-03.sh) |
| L4: Plan-and-Execute | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/04-plan-and-execute.md) | [check-norm-04.sh](file:///home/ouyp/.openclaw/workspace/NORMS/checks/check-norm-04.sh) |
| L5: 知识沉淀 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/05-knowledge-assets.md) | [check-norm-05.sh](file:///home/ouyp/.openclaw/workspace/NORMS/checks/check-norm-05.sh) |
| L6: 反馈收割 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/core/06-feedback-harvest.md) | [check-norm-06.sh](file:///home/ouyp/.openclaw/workspace/NORMS/checks/check-norm-06.sh) |

---

## 🛠️ 技术实现

| 技术实现 | 文件 | 状态 |
|---------|------|------|
| web_search 异常自愈 | [查看](file:///home/ouyp/.openclaw/workspace/NORMS/tech/web-search-exception.md) | ⚪ 待实施 |

---

## 🔧 规范检查

**统一入口**: `~/.openclaw/workspace/NORMS/checks/check-all-norms.sh`

**执行时机**:
- 任务启动前
- 任务完成后
- 每日 23:00 (Cron Job)
- 每周日 (Cron Job)

---

## 📊 规范执行检查清单

### 任务启动前
- [ ] 检查命名规范 (check-norm-03.sh)
- [ ] 创建 PRD + ROADMAP + CONTEXT_PREFIX
- [ ] 执行规划验证 (check-norm-04.sh)

### 任务执行中
- [ ] 遵循 Plan-and-Execute 模式
- [ ] 记录执行日志
- [ ] 收集反馈

### 任务完成后
- [ ] 执行部署 (deploy_to_production.sh)
- [ ] 创建实战记录 (check-norm-05.sh)
- [ ] 发布 Moltbook (check-moltbook-quality.sh)
- [ ] 收集反馈并转化 (check-norm-06.sh)

---

*本索引由 OpenClaw 自动维护*
**版本**: v1.0 | **更新日期**: 2026-03-22 🌌
