# 🌌 OpenClaw Universe (万象锻造)

> **OpenClaw 扩展宇宙 · 零门槛 AI 能力工厂**  
> 🚀 为 OpenClaw 打造免 API Key、开箱即用的扩展能力

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-v2026.3.13+-blue.svg)](https://github.com/openclaw/openclaw)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## 📖 项目愿景

**OpenClaw Universe** 是一个独立的 OpenClaw 扩展仓库，专注于为 OpenClaw 框架开发**零配置、免 API Key**的增强能力。

### 🎯 核心使命

| 维度 | 传统方式 | Universe 方案 |
|------|---------|--------------|
| **使用门槛** | 需注册多个平台、配置 API Key | 零配置，开箱即用 |
| **成本** | $5-30/月（商业 API） | 完全免费 |
| **隐私保护** | 商业服务可能有日志 | 隐私优先，本地处理 |
| **新手友好** | 被配置流程劝退 | 1 分钟快速启动 |

---

## 🚀 当前能力矩阵 (Capability Matrix)

| 能力 | 类型 | 状态 | 依赖 | 集成手册 |
|------|------|------|------|---------|
| **DuckDuckGo Provider** | 免 Key 搜索内核 | ✅ 已发布 | 无 | [Provider README](tasks/20260318-duckduckgo-provider/04_coding/README.md) |
| **DDG Fallback Skill** | 异常自愈补救盾牌 | ✅ 已发布 | 需配合 `AGENTS.md` 激活 | [集成手册](extensions/duckduckgo-fallback/INTEGRATION_PLAYBOOK.md) |
| **系统代理支持 (Clash)** | 透明转发 | ✅ 已发布 | 无 | 开发中 |

**关键说明**：
- `DDG Fallback Skill` **不具备自动拦截能力**，必须在 `AGENTS.md` 中手动注入【异常自愈协议】才能工作
- 集成本质：`代码提供能力` + `规约驱动意识`

---

## 📚 文档导航

| 文档 | 说明 | 目标读者 |
|------|------|---------|
| **[OMNIFORGE_SOP.md](OMNIFORGE_SOP.md)** | 宪法级文档 - 权限授权、软链接桥接、主权回归规约 | 所有开发者 |
| **[AGENTS.md v3.1](AGENTS.md)** | 研发规约 + 异常自愈协议 | 首席顾问、AI Agent |
| **[INTEGRATION_PLAYBOOK.md](extensions/duckduckgo-fallback/INTEGRATION_PLAYBOOK.md)** | DuckDuckGo Fallback 集成手册（含实测真相） | 系统架构师 |
| **[MEMORY.md](MEMORY.md)** | 技术认知树与进化日志 | 所有贡献者 |

---

## 🚀 快速开始

**5 分钟部署**：

```bash
# 1. 克隆仓库
git clone https://gitee.com/cola16/openclaw-evolution.git
cd openclaw-evolution

# 2. 阅读 OMNIFORGE_SOP.md
# 包含权限授权命令、软链接桥接原理、主权回归规约
```

**详细部署指南**：请阅读 [`OMNIFORGE_SOP.md`](OMNIFORGE_SOP.md)。

**DuckDuckGo Fallback 集成**：请阅读 [`INTEGRATION_PLAYBOOK.md`](extensions/duckduckgo-fallback/INTEGRATION_PLAYBOOK.md)。

---

## 📦 项目结构

```
openclaw-universe/
├── OMNIFORGE_SOP.md              # 宪法级文档（权限/软链接/主权回归）
├── AGENTS.md v3.1                # 研发规约 + 异常自愈协议
├── MEMORY.md                     # 技术认知树与进化日志
├── README.md                     # 本文档（项目愿景与能力矩阵）
├── tasks/                        # 研发区（01-04 阶段文档）
│   ├── 20260318-duckduckgo-provider/
│   └── 20260319-ddg-fallback-skill/
└── extensions/                   # 生产区（已部署扩展）
    └── duckduckgo-fallback/
        ├── INTEGRATION_PLAYBOOK.md  # 集成手册（含实测真相）
        ├── README.md                # 使用说明（中文）
        └── EXPERIMENT_REPORT.md     # A/B 实验报告
```

---

## 🛠️ 研发流程

本项目遵循 **OmniForge v2.9** 研发规约：

```
01_designing → 02_roadmapping → 03_technical → 04_coding
   (PRD)          (ROADMAP)       (SPEC)       (CODE)
```

**详细说明**：请阅读 [`AGENTS.md`](AGENTS.md) 第二部分。

---

## 🤝 贡献指南

### 提交扩展

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingExtension`)
3. 提交变更 (`git commit -m 'feat: add AmazingExtension'`)
4. 推送到分支 (`git push origin feature/AmazingExtension`)
5. 提交 Pull Request

### 开发环境设置

```bash
# 克隆仓库
git clone https://gitee.com/cola16/openclaw-evolution.git
cd openclaw-evolution

# 安装依赖
npm install
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 社区](https://discord.com/invite/clawd)

---

## 📮 联系方式

- **仓库作者**: kkCoca (@cola16)
- **Gitee**: https://gitee.com/cola16/openclaw-evolution
- **Email**: 569790480@qq.com

---

## 📈 项目状态

| 里程碑 | 状态 | 完成时间 |
|--------|------|---------|
| DuckDuckGo Provider 发布 | ✅ 已完成 | 2026-03-19 |
| DuckDuckGo Fallback Skill | ✅ 已完成 | 2026-03-19 |
| OMNIFORGE_SOP.md 宪法 | ✅ 已完成 | 2026-03-19 |
| INTEGRATION_PLAYBOOK.md 集成手册 | ✅ 已完成 | 2026-03-19 |
| AGENTS.md v3.1（含自愈协议） | ✅ 已完成 | 2026-03-19 |
| 系统代理支持 | 🟡 计划中 | 2026-03-25 |
| 扩展到 5+ Provider | 🟡 计划中 | 2026-04-01 |

---

*最后更新：2026-03-19*  
*由 openclaw-ouyp 维护 · 万象锻造 · 生生不息* 🌌
