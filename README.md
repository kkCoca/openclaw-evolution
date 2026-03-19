# 🌌 OpenClaw Universe (万象锻造)

> **OpenClaw 扩展宇宙 · 零门槛 AI 能力工厂**  
> 🚀 为 OpenClaw 打造免 API Key、开箱即用的扩展能力

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-v2026.3.13+-blue.svg)](https://github.com/openclaw/openclaw)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

---

## 📖 项目简介

**OpenClaw Universe** 是一个独立的 OpenClaw 扩展仓库，专注于为 OpenClaw 框架开发**零配置、免 API Key**的增强能力。

### 🎯 核心使命

| 维度 | 传统方式 | Universe 方案 |
|------|---------|--------------|
| **使用门槛** | 需注册多个平台、配置 API Key | 零配置，开箱即用 |
| **成本** | $5-30/月（商业 API） | 完全免费 |
| **隐私保护** | 商业服务可能有日志 | 隐私优先，本地处理 |
| **新手友好** | 被配置流程劝退 | 1 分钟快速启动 |

### 🌟 已交付能力

| 扩展 | 状态 | 说明 |
|------|------|------|
| **DuckDuckGo Search** | ✅ 已发布 | 免 API Key 的隐私搜索 Provider |
| **系统代理支持 (Clash)** | ✅ 已发布 | 支持系统代理模式的网络请求 |

---

## 🚀 快速开始

### 前置要求

- OpenClaw v2026.3.13+
- Node.js 18+
- npm 或 pnpm

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://gitee.com/cola16/openclaw-evolution.git
cd openclaw-evolution

# 2. 安装依赖（以 DuckDuckGo Provider 为例）
cd extensions/search_providers/duckduckgo
npm install

# 3. 构建
npm run build

# 4. 部署到 OpenClaw
# 将 dist/ 目录复制到 OpenClaw 的 extensions/ 目录
cp -r dist/ ~/.openclaw/extensions/search_providers/duckduckgo/

# 5. 配置 OpenClaw
# 在 OpenClaw 配置文件中添加 provider 配置
```

### 配置示例

```json
{
  "web_search": {
    "providers": ["duckduckgo", "gemini"],
    "default_provider": "duckduckgo",
    "duckduckgo": {
      "rate_limit_ms": 1000,
      "cache_ttl_minutes": 15
    }
  }
}
```

---

## 📦 项目结构

```
openclaw-universe/
├── extensions/                    # 扩展模块
│   └── search_providers/
│       └── duckduckgo/           # DuckDuckGo 搜索 Provider
│           ├── src/              # 源代码
│           │   ├── ddg-client.ts # DDG API 客户端
│           │   ├── ddg-provider.ts # Provider 主逻辑
│           │   ├── parser.ts     # HTML 解析器
│           │   ├── cache.ts      # 缓存管理
│           │   ├── rate-limiter.ts # 速率限制
│           │   ├── types.ts      # 类型定义
│           │   └── index.ts      # 入口文件
│           ├── dist/             # 编译输出
│           ├── tests/            # 单元测试
│           ├── package.json
│           └── README.md
├── tasks/                        # 任务工作区（AGENTS.md 四步法）
│   └── 20260318-duckduckgo-provider/
│       ├── 01_designing/         # 战略设计
│       │   └── PRD.md
│       ├── 02_roadmapping/       # 研发路线
│       │   └── ROADMAP.md
│       ├── 03_detailing/         # 技术详述
│       │   ├── TRD.md
│       │   └── DETAIL.md
│       └── 04_coding/            # 最终编码
│           └── src/
├── research/                     # 技术调研
├── scripts/                      # 工具脚本
├── .gitignore
└── README.md
```

---

## 🛠️ 开发指南

### 开发流程

本项目遵循 **AGENTS.md 四步法** 研发流程：

```
01_designing → 02_roadmapping → 03_detailing → 04_coding
   (PRD)          (ROADMAP)       (TRD/DETAIL)   (CODE)
```

### 创建新扩展

1. **在 `tasks/` 目录创建任务文件夹**
   ```bash
   mkdir tasks/$(date +%Y%m%d)-your-extension-name
   cd tasks/$(date +%Y%m%d)-your-extension-name
   ```

2. **执行四步法流程**
   - `01_designing/PRD.md` - 产品需求文档
   - `02_roadmapping/ROADMAP.md` - 研发路线图
   - `03_detailing/TRD.md` - 技术需求文档
   - `04_coding/` - 源代码与测试

3. **成熟后迁移到 `extensions/`**
   ```bash
   mkdir -p extensions/your-category/your-extension
   cp -r tasks/.../04_coding/* extensions/your-category/your-extension/
   ```

### 代码规范

- **TypeScript**: 严格模式，禁止 `any`
- **测试**: 核心功能覆盖率 > 80%
- **文档**: 每个模块必须有 JSDoc 注释
- **提交**: Conventional Commits 规范

---

## 🔧 扩展列表

### 1. DuckDuckGo Search Provider 🦆

**零配置网页搜索**

```typescript
// 使用示例
const results = await web_search({
  provider: "duckduckgo",
  query: "OpenClaw framework",
  country: "CN",
  language: "zh-CN"
});

console.log(results);
// {
//   provider: "duckduckgo",
//   results: [
//     { title: "...", snippet: "...", url: "..." },
//     ...
//   ],
//   cached: false
// }
```

**特性**:
- ✅ 免 API Key，开箱即用
- ✅ 隐私保护（无日志）
- ✅ 15 分钟智能缓存
- ✅ 自适应速率限制
- ✅ 支持国家/语言参数

**详细文档**: [`extensions/search_providers/duckduckgo/README.md`](extensions/search_providers/duckduckgo/README.md)

### 2. 系统代理支持 (Clash) 🌐

**支持系统代理模式的网络请求**

```typescript
// 自动检测并使用系统代理
const response = await fetchWithProxy("https://api.example.com");
```

**特性**:
- ✅ 自动检测系统代理设置
- ✅ 支持 Clash/Shadowsocks 等代理工具
- ✅ 透明代理，无需修改代码

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行单个扩展的测试
cd extensions/search_providers/duckduckgo
npm test

# 生成覆盖率报告
npm run test:coverage
```

---

## 📊 性能指标

| 扩展 | P95 响应时间 | 缓存命中率 | 内存占用 |
|------|------------|-----------|---------|
| DuckDuckGo | < 3 秒 | > 60% | < 50MB |
| 系统代理 | < 100ms | N/A | < 10MB |

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

# 链接到本地 OpenClaw
npm link
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

- [OpenClaw 官方文档](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 社区](https://discord.com/invite/clawd)
- [MCP Protocol](https://modelcontextprotocol.io)

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
| 系统代理支持 | ✅ 已完成 | 2026-03-18 |
| MCP Server 独立部署 | 🟡 计划中 | 2026-03-25 |
| 扩展到 5+ Provider | 🟡 计划中 | 2026-04-01 |
| 官方仓库 PR 提交 | ⏳ 待启动 | 2026-04-15 |

---

*最后更新：2026-03-19*  
*由 openclaw-ouyp 维护 · 万象锻造 · 生生不息* 🌌
