# PRD-MCP-002: DDG Web Search MCP 集成

**关联 ISSUE**: ISSUE-002  
**目标版本**: v1.2  
**创建日期**: 2026-03-23  
**状态**: 🟡 待主人确认

---

## 需求描述

**目标**: 将 DDG Web Search 以 MCP 方式集成到 OpenClaw，支持 AI 自动调用搜索

**约束条件**:
- ❌ 不修改 OpenClaw 核心代码
- ✅ 采用 MCP 协议（OpenClaw 原生支持）
- ✅ AI 可以自动发现和调用工具
- ✅ 配置即可使用，升级无影响

---

## 技术方案

### MCP 架构

```
OpenClaw Gateway
├── MCP 服务器管理
│   └── ddg-websearch (自动发现)
│
└── AI 对话系统
    └── 工具调用
        └── ddg_search (MCP 工具)
```

### 代码复用

```
~/.openclaw/extensions/ddg-websearch/
├── dist/                        ← 原有核心代码（100% 复用）
│   ├── index.js                 ← 导出 search() 和 healthCheck()
│   ├── parser/
│   │   ├── ddg-parser.js        ← ISSUE-001 修复版
│   │   └── bing-parser.js
│   └── ...
│
├── mcp-server.js                ← 新增：MCP 服务器入口 (~150 行)
└── package.json                 ← 更新：添加 MCP 依赖
```

---

## 工作内容

### OpenClaw 职责（规划 + 验收）

1. ✅ **问题登记**: 创建 ISSUE-002
2. ✅ **方案设计**: 编写 PRD-MCP-002
3. ⏳ **调用 OpenCode**: 分配 MCP 集成任务（**等待主人确认**）
4. ⏳ **验收验证**: 测试 MCP 工具调用
5. ⏳ **Git 提交**: 提交配置和文档

### OpenCode 职责（代码实现）

1. ⏳ **读取 PRD**: 理解 MCP 集成方案
2. ⏳ **创建 MCP 服务器**: `mcp-server.js`
3. ⏳ **创建 MCP 配置**: `~/.openclaw/mcp.json`
4. ⏳ **更新 package.json**: 添加 MCP 依赖
5. ⏳ **创建集成测试**: `test-mcp.js`
6. ⏳ **运行测试验证**
7. ⏳ **编写执行记录**: `EXECUTION_LOG_v1.2.md`

---

## 文件清单

### 新增文件

| 文件 | 用途 | 代码量 |
|------|------|--------|
| `~/.openclaw/extensions/ddg-websearch/mcp-server.js` | MCP 服务器入口 | ~150 行 |
| `~/.openclaw/mcp.json` | MCP 服务器配置 | ~10 行 |
| `~/.openclaw/extensions/ddg-websearch/test-mcp.js` | MCP 集成测试 | ~30 行 |

### 更新文件

| 文件 | 修改内容 | 代码量 |
|------|---------|--------|
| `~/.openclaw/extensions/ddg-websearch/package.json` | 添加 @modelcontextprotocol/sdk 依赖 | +5 行 |

### 复用文件（无需修改）

| 文件 | 用途 |
|------|------|
| `~/.openclaw/extensions/ddg-websearch/dist/*` | 核心搜索逻辑（100% 复用） |

---

## 验收标准

### 功能验收

| 标准 | 目标值 | 验证方法 |
|------|--------|---------|
| MCP 服务器启动 | 成功 | node mcp-server.js 无错误 |
| OpenClaw 识别工具 | 成功 | openclaw status 显示 MCP 工具 |
| AI 可调用搜索 | 成功 | 对话中测试"搜索 OpenClaw AI" |
| 搜索结果返回 | ≥ 3 条 | 验证搜索结果数量 |

### 代码质量验收

| 标准 | 目标值 | 验证方法 |
|------|--------|---------|
| 核心代码复用率 | 100% | 代码审查 |
| OpenClaw 核心修改 | 0 行 | 代码审查 |
| MCP 适配层代码 | < 200 行 | 代码审查 |
| 测试覆盖率 | ≥ 80% | MCP 集成测试 |

### 规范验收

| 标准 | 验证方法 |
|------|---------|
| L2 规范：生产区纯净 | ./NORMS/checks/check-norm-02.sh |
| L3 规范：命名归一化 | ./NORMS/checks/check-norm-03.sh |
| L4 规范：规划完整 | ./NORMS/checks/check-norm-04.sh |

---

## 执行流程

### 阶段 1: 方案确认（OpenClaw + 主人）

- [x] OpenClaw 创建 ISSUE-002 登记
- [x] OpenClaw 创建 PRD-MCP-002
- [ ] **主人审阅 PRD-MCP-002**
- [ ] **主人确认方案**

### 阶段 2: 代码实现（OpenCode）

- [ ] OpenClaw 调用 OpenCode 执行
- [ ] OpenCode 读取 PRD
- [ ] OpenCode 创建 MCP 服务器
- [ ] OpenCode 创建 MCP 配置
- [ ] OpenCode 更新 package.json
- [ ] OpenCode 创建集成测试
- [ ] OpenCode 运行测试验证
- [ ] OpenCode 编写执行记录

### 阶段 3: 验收部署（OpenClaw）

- [ ] OpenClaw 验证 MCP 配置
- [ ] OpenClaw 运行规范检查
- [ ] OpenClaw Git 提交
- [ ] OpenClaw 更新 ISSUE_LOG
- [ ] OpenClaw 重启 OpenClaw Gateway

---

## 风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|---------|
| MCP 依赖安装失败 | 低 | 中 | 使用 npm install 手动安装 |
| OpenClaw 不识别 MCP | 低 | 高 | 检查 mcp.json 配置格式 |
| AI 无法调用工具 | 中 | 高 | 验证工具注册逻辑 |

---

## 待确认事项

请主人确认以下事项：

1. **技术方案**: MCP 服务器方式是否可行？✅
2. **工作内容**: 新增 3 个文件、更新 1 个文件是否合理？✅
3. **验收标准**: 功能验收 + 代码质量验收 + 规范验收是否完整？✅
4. **执行流程**: OpenClaw 规划 → OpenCode 执行 → OpenClaw 验收是否正确？✅

**请回复确认或提出修改意见。**

---

**审批状态**: ⏳ 待主人确认  
**创建日期**: 2026-03-23  
**创建者**: OpenClaw
