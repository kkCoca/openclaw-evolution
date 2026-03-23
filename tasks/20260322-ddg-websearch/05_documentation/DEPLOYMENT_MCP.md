# DDG Web Search MCP 集成部署文档

**版本**: v1.2  
**日期**: 2026-03-23  
**关联 ISSUE**: ISSUE-002  
**PRD**: [PRD-MCP-002.md](./01_designing/PRD-MCP-002.md)

---

## 📋 部署清单

### 阶段 1: 部署前验证

- [ ] 检查 OpenCode 创建的文件
- [ ] 验证 MCP 服务器代码
- [ ] 验证 MCP 配置文件
- [ ] 运行 MCP 集成测试

### 阶段 2: 部署执行

- [ ] 重启 OpenClaw Gateway
- [ ] 验证 MCP 工具识别
- [ ] AI 对话测试

### 阶段 3: 部署后验证

- [ ] 运行规范检查（L2/L3/L4）
- [ ] Git 提交
- [ ] 更新 ISSUE_LOG

---

## 📁 文件清单

### 新增文件

| 文件 | 用途 | 代码量 | 状态 |
|------|------|--------|------|
| `~/.openclaw/extensions/ddg-websearch/mcp-server.js` | MCP 服务器入口 | 176 行 | ✅ 已创建 |
| `~/.openclaw/mcp.json` | MCP 配置 | 10 行 | ✅ 已创建 |
| `~/.openclaw/extensions/ddg-websearch/test-mcp.js` | 集成测试 | 135 行 | ✅ 已创建 |
| `tasks/20260322-ddg-websearch/04_coding/EXECUTION_LOG_v1.2.md` | 执行记录 | - | ✅ 已创建 |

### 更新文件

| 文件 | 修改内容 | 状态 |
|------|---------|------|
| `~/.openclaw/extensions/ddg-websearch/package.json` | 添加 @modelcontextprotocol/sdk 依赖 | ✅ 已更新 |
| `tasks/20260322-ddg-websearch/ISSUE_LOG.md` | 登记 ISSUE-002 | ✅ 已登记 |

### 复用文件（100% 复用）

| 目录 | 文件数 | 用途 |
|------|--------|------|
| `~/.openclaw/extensions/ddg-websearch/dist/` | 19 个 | 核心搜索逻辑 |

---

## 🚀 部署步骤

### 步骤 1：验证文件创建

```bash
# 检查扩展目录
ls -la ~/.openclaw/extensions/ddg-websearch/

# 检查 MCP 配置
cat ~/.openclaw/mcp.json

# 检查执行记录
cat tasks/20260322-ddg-websearch/04_coding/EXECUTION_LOG_v1.2.md
```

**预期结果**:
- ✅ `ddg-websearch/` 目录存在
- ✅ `mcp-server.js` 存在
- ✅ `mcp.json` 存在
- ✅ `test-mcp.js` 存在
- ✅ `EXECUTION_LOG_v1.2.md` 存在

---

### 步骤 2：重启 OpenClaw Gateway

```bash
openclaw gateway restart
```

**目的**: 使 MCP 配置生效，让 OpenClaw 发现新的 MCP 工具

**预期日志**:
```
[MCP] Discovered server: ddg-websearch
[MCP] Registered tools: ddg_search, ddg_health_check
```

---

### 步骤 3：验证 MCP 工具识别

```bash
openclaw status
```

**预期输出**:
```
MCP Servers:
  - ddg-websearch: running
  - channels: running

MCP Tools:
  - ddg_search: available
  - ddg_health_check: available
```

---

### 步骤 4：AI 对话测试

**测试 1**: 基础搜索
```
搜索 OpenClaw AI 2026 最新动态
```

**预期响应**:
- ✅ AI 调用 ddg_search 工具
- ✅ 返回 ≥ 3 条搜索结果
- ✅ 结果包含标题、URL、摘要

**测试 2**: 健康检查
```
检查 DDG 搜索服务状态
```

**预期响应**:
- ✅ AI 调用 ddg_health_check 工具
- ✅ 返回服务状态（healthy/degraded）

---

### 步骤 5：运行规范检查

```bash
cd /home/ouyp/Learning/Practice/openclaw-universe
./NORMS/checks/check-all-norms.sh
```

**预期输出**:
```
【L2】生产区纯净检查：✅ 通过
【L3】命名归一化检查：✅ 通过
【L4】规划验证检查：✅ 通过
```

---

### 步骤 6：Git 提交

```bash
cd /home/ouyp/Learning/Practice/openclaw-universe

# 查看变更
git status

# 添加文件
git add ~/.openclaw/extensions/ddg-websearch/
git add ~/.openclaw/mcp.json
git add tasks/20260322-ddg-websearch/

# 提交
git commit -m "feat: ISSUE-002 MCP 集成 (v1.2)

- 创建 MCP 服务器 (mcp-server.js, 176 行)
- 创建 MCP 配置 (mcp.json)
- 创建集成测试 (test-mcp.js)
- 核心代码 100% 复用 (dist/)
- OpenClaw 核心代码 0 修改

关联 ISSUE: ISSUE-002
关联 PRD: PRD-MCP-002"

# 推送
git push origin master
```

---

### 步骤 7：更新 ISSUE_LOG

编辑 `tasks/20260322-ddg-websearch/ISSUE_LOG.md`：

```markdown
## ISSUE-002: DDG Web Search MCP 集成

**状态**: ✅ 已完成
**完成日期**: 2026-03-23
**部署版本**: v1.2

### 验收结果

| 标准 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| MCP 服务器启动 | 成功 | ✅ 成功 | ✅ |
| OpenClaw 识别工具 | 成功 | ✅ 已识别 | ✅ |
| AI 可调用搜索 | 成功 | ✅ 可调用 | ✅ |
| 搜索结果返回 | ≥ 3 条 | ✅ 10 条 | ✅ |
| 核心代码复用率 | 100% | ✅ 100% | ✅ |
| OpenClaw 核心修改 | 0 行 | ✅ 0 行 | ✅ |

### 部署记录

- [x] 文件验证
- [x] Gateway 重启
- [x] 工具识别验证
- [x] AI 对话测试
- [x] 规范检查
- [x] Git 提交
```

---

## ✅ 部署完成标准

| 标准 | 验证方法 | 状态 |
|------|---------|------|
| 文件创建 | ls 检查 | ⏳ 待验证 |
| Gateway 重启 | openclaw gateway restart | ⏳ 待执行 |
| 工具识别 | openclaw status | ⏳ 待验证 |
| AI 调用测试 | 对话测试 | ⏳ 待验证 |
| 规范检查 | check-all-norms.sh | ⏳ 待验证 |
| Git 提交 | git push | ⏳ 待执行 |
| ISSUE_LOG 更新 | 文档更新 | ⏳ 待执行 |

---

## 🚨 回滚方案

如果部署失败，执行以下回滚步骤：

```bash
# 1. 删除 MCP 配置
rm -rf ~/.openclaw/extensions/ddg-websearch/
rm -f ~/.openclaw/mcp.json

# 2. 重启 Gateway
openclaw gateway restart

# 3. 回滚 Git
cd /home/ouyp/Learning/Practice/openclaw-universe
git revert HEAD
```

---

## 📞 问题排查

### 问题 1: MCP 服务器启动失败

**症状**: `node mcp-server.js` 报错

**排查步骤**:
1. 检查 Node.js 版本：`node --version`
2. 检查依赖安装：`npm list @modelcontextprotocol/sdk`
3. 查看错误日志：`~/.openclaw/logs/openclaw.log`

**解决方案**:
```bash
cd ~/.openclaw/extensions/ddg-websearch
npm install @modelcontextprotocol/sdk
```

---

### 问题 2: OpenClaw 不识别 MCP 工具

**症状**: `openclaw status` 不显示 ddg-websearch

**排查步骤**:
1. 检查 mcp.json 格式：`cat ~/.openclaw/mcp.json`
2. 检查 Gateway 日志：`tail -100 ~/.openclaw/logs/openclaw.log`
3. 重新重启 Gateway：`openclaw gateway restart`

**解决方案**:
确保 mcp.json 格式正确：
```json
{
  "mcpServers": {
    "ddg-websearch": {
      "command": "node",
      "args": ["/home/ouyp/.openclaw/extensions/ddg-websearch/mcp-server.js"],
      "enabled": true
    }
  }
}
```

---

### 问题 3: AI 无法调用搜索工具

**症状**: AI 说"我无法搜索"或不调用工具

**排查步骤**:
1. 检查工具注册：`openclaw status | grep ddg`
2. 检查工具名称：确保对话中使用正确的工具名
3. 查看工具调用日志

**解决方案**:
- 确保 AI 知道可以使用搜索工具
- 在对话中明确说"搜索..."

---

## 📊 部署时间估算

| 步骤 | 预计时间 |
|------|---------|
| 文件验证 | 2 分钟 |
| Gateway 重启 | 1 分钟 |
| 工具识别验证 | 1 分钟 |
| AI 对话测试 | 3 分钟 |
| 规范检查 | 2 分钟 |
| Git 提交 | 2 分钟 |
| ISSUE_LOG 更新 | 2 分钟 |
| **总计** | **13 分钟** |

---

**部署文档创建完成，等待确认执行部署。**
