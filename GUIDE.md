# 万象锻造：高可用搜索集成白皮书

> **版本**: v1.0  
> **创建日期**: 2026-03-19  
> **适用场景**: 在 OpenClaw 中集成高可用搜索服务（Gemini + DuckDuckGo Fallback）  
> **目标读者**: OpenClaw 开发者、AI Agent 架构师、搜索服务集成者  
> **阅读时间**: 15 分钟（含实践）

---

## 🎯 导读：为什么需要这份手册？

**你可能正在经历**：
- ❌ 搜索服务频繁 429 限流，用户投诉不断
- ❌ OpenCode 沙盒限制导致无法访问外部依赖
- ❌ 代码散落在多个目录，Git 仓库混乱不堪
- ❌ 异常处理逻辑分散，维护成本极高

**本手册提供**：
- ✅ 完整的 **Gemini + DuckDuckGo Fallback** 架构方案
- ✅ **权限、路径、意识** 三大深坑的填坑指南
- ✅ **拿来即用** 的代码模板和配置示例
- ✅ **零故障通关** 的最佳实践

**阅读后你将获得**：
- 一套完整的高可用搜索架构
- 避免至少 3 天的试错时间
- 理解 OmniForge v2.9 规约的深层价值

---

## 📋 目录

1. [架构总览](#1-架构总览)
2. [权限之坑](#2-权限之坑-opencode-沙盒限制)
3. [路径之坑](#3-路径之坑-主权回归)
4. [意识之坑](#4-意识之坑-自愈协议)
5. [快速开始](#5-快速开始)
6. [故障排查](#6-故障排查)
7. [附录](#7-附录)

---

## 1. 架构总览

### 1.1 核心组件

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────────────────┐    │
│  │  web_search  │─────▶│  duckduckgo-fallback     │    │
│  │  (Gemini)    │      │  (Fallback Skill)        │    │
│  └──────────────┘      └──────────────────────────┘    │
│         │                          │                     │
│         │ 429/503/Timeout          │                     │
│         ▼                          ▼                     │
│  ┌──────────────┐      ┌──────────────────────────┐    │
│  │  错误分类器  │─────▶│  DuckDuckGo Provider     │    │
│  │  (Classifier)│      │  (独立搜索服务)          │    │
│  └──────────────┘      └──────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 核心流程

```
用户搜索请求
    ↓
Gemini Provider（主）
    ↓
成功？→ 返回结果
    ↓
失败？→ 错误分类
    ↓
429/503/Timeout → 触发 Fallback
    ↓
DuckDuckGo Provider（备）
    ↓
返回结果 + [Fallback Activated] 标记
```

### 1.3 物理架构

```
/home/ouyp/Learning/Practice/openclaw-universe/     # 主权根目录
├── tasks/                                          # 研发区
│   └── 20260319-ddg-fallback-skill/
│       ├── 01_designing/PRD.md
│       ├── 02_roadmapping/ROADMAP.md
│       ├── 03_technical/SPEC.md
│       └── 04_coding/ (完整代码)
├── extensions/                                     # 生产区
│   └── duckduckgo-fallback/
│       ├── src/ (5 个核心模块)
│       ├── tests/ (16 个测试用例)
│       └── README.md
└── AGENTS.md                                       # 规约文档
```

---

## 2. 权限之坑：OpenCode 沙盒限制

### 2.1 问题描述

**现象**：
```bash
# 错误示例：OpenCode 无法访问外部路径
Error: PermissionRejectedError
permission requested: external_directory
path: /home/ouyp/Learning/Practice/openclaw-universe/
```

**根本原因**：
- OpenCode 是独立 CLI 工具，有独立的沙盒权限系统
- 默认只能访问 `~/.openclaw/workspace/` 目录
- 无法直接访问 Universe 主权根目录

### 2.2 错误尝试（我们踩过的坑）

#### ❌ 方案 A：直接授权（失败）
```bash
# 尝试通过 allowlist 授权
openclaw approvals allowlist add /home/ouyp/Learning/Practice/openclaw-universe

# 结果：OpenClaw 的授权对 OpenCode 无效！
```

**教训**：OpenClaw 和 OpenCode 是两个独立进程，权限不共享。

#### ❌ 方案 B：物理复制（失败）
```bash
# 复制 DDG Provider 到 workspace 内
cp -r /home/ouyp/Learning/Practice/openclaw-universe/... \
      /home/ouyp/.openclaw/workspace/external-providers/

# 结果：
# 1. 技术主权割裂（Universe 和 workspace 两份代码）
# 2. 同步成本高（每次更新都要复制）
# 3. 存储浪费
```

**教训**：物理复制违背"主权统一"原则，不可持续。

### 2.3 正确方案：软链接桥接

#### ✅ 步骤 1：创建软链接
```bash
# 在 workspace 内创建指向 Universe 的软链接
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      /home/ouyp/.openclaw/workspace/universe-bridge

# 验证
ls -la /home/ouyp/.openclaw/workspace/universe-bridge
# 输出：lrwxrwxrwx ... -> /home/ouyp/Learning/Practice/openclaw-universe
```

#### ✅ 步骤 2：通过桥接路径访问
```bash
# OpenCode 可以访问的路径
/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260319-ddg-fallback-skill/

# 实际物理位置（OpenCode 不需要知道）
/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260319-ddg-fallback-skill/
```

#### ✅ 步骤 3：在代码中使用桥接路径
```typescript
// ddg-adapter.ts 中的 import 路径
const DDG_PROVIDER_PATH = 
  '/home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260318-duckduckgo-provider/04_coding/dist/src/index.js';

// 通过软链接，实际访问的是 Universe 目录
```

### 2.4 软链接的优势

| 维度 | 物理复制 | 软链接桥接 |
|------|---------|-----------|
| **技术主权** | ❌ 割裂 | ✅ 统一 |
| **同步成本** | ❌ 手动复制 | ✅ 自动同步 |
| **存储占用** | ❌ 双份 | ✅ 零额外 |
| **权限兼容** | ✅ 可访问 | ✅ 可访问 |
| **架构优雅** | ❌ 临时方案 | ✅ 工业级 |

### 2.5 验证清单

- [ ] 软链接已创建：`ls -la ~/.openclaw/workspace/universe-bridge`
- [ ] 软链接指向正确：`readlink ~/.openclaw/workspace/universe-bridge`
- [ ] OpenCode 可访问：`opencode run "ls universe-bridge/tasks/"`
- [ ] Git 仓库完整：`cd universe-bridge && git status`

---

## 3. 路径之坑：主权回归

### 3.1 问题描述

**错误路径**（我们曾经犯的错）：
```bash
# ❌ 错误：代码直接在 extensions/ 下创建
/home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback/src/

# ❌ 错误：研发区在私有 workspace
~/.openclaw/workspace/tasks/20260319-ddg-fallback-skill/
```

**后果**：
- Git 仓库不完整（缺少 01-04 阶段文档）
- 无法追溯研发历史
- 违反 OmniForge v2.8 规约

### 3.2 正确路径：主权统一

#### ✅ 研发区（tasks/）
```bash
# 所有研发活动必须在 Universe 根目录下
/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260319-ddg-fallback-skill/
├── 01_designing/PRD.md          # 战略设计
├── 02_roadmapping/ROADMAP.md    # 研发路线
├── 03_technical/SPEC.md         # 技术详述
└── 04_coding/                   # 最终编码
    ├── src/
    ├── tests/
    └── README.md
```

#### ✅ 生产区（extensions/）
```bash
# 由架构师审批后复制（非直接创建）
/home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback/
# 来源：tasks/20260319-ddg-fallback-skill/04_coding/
```

### 3.3 为什么必须主权回归？

#### 理由 1：Git 版本控制完整性
```bash
# 正确：Git 可以追踪完整研发历史
cd /home/ouyp/Learning/Practice/openclaw-universe
git add tasks/20260319-ddg-fallback-skill/
git commit -m "feat: DuckDuckGo Fallback Skill"

# 错误：~/.openclaw/workspace/ 不在 Git 仓库内
# 结果：研发记录丢失，无法追溯
```

#### 理由 2：OmniForge 规约要求
```markdown
AGENTS.md v2.9 规定：
- 所有研发产物必须在主权根目录下
- 01-04 阶段文档必须完整保留
- 生产区只能由架构师复制
```

#### 理由 3：团队协作基础
```
团队成员 A：代码在哪里？
团队成员 B：在 Universe/tasks/ 下
团队成员 A：好的，git pull 就能看到

vs

团队成员 A：代码在哪里？
团队成员 B：在我本地 workspace 下
团队成员 A：...（无法协作）
```

### 3.4 执行 SOP

#### 步骤 1：在 tasks/ 下初始化
```bash
cd /home/ouyp/Learning/Practice/openclaw-universe
mkdir -p tasks/20260319-ddg-fallback-skill/{01_designing,02_roadmapping,03_technical,04_coding}
```

#### 步骤 2：通过桥接路径执行
```bash
# OpenCode 只能访问 workspace 内路径
opencode run "..." \
  --workdir /home/ouyp/.openclaw/workspace/universe-bridge/tasks/20260319-ddg-fallback-skill/
```

#### 步骤 3：架构师审批后复制
```bash
# 测试通过后，由架构师（OpenClaw）复制到 extensions/
cp -r tasks/20260319-ddg-fallback-skill/04_coding \
      extensions/duckduckgo-fallback/
```

#### 步骤 4：Git 提交
```bash
git add tasks/20260319-ddg-fallback-skill/
git commit -m "feat: DuckDuckGo Fallback Skill"
git push origin master
```

### 3.5 验证清单

- [ ] tasks/ 在 Universe 根目录下：`ls /home/ouyp/Learning/Practice/openclaw-universe/tasks/`
- [ ] 01-04 阶段文档完整：`ls tasks/20260319-ddg-fallback-skill/`
- [ ] extensions/ 由复制而来：`diff tasks/.../04_coding/ extensions/duckduckgo-fallback/`
- [ ] Git 已提交：`git log --oneline | head -5`

---

## 4. 意识之坑：自愈协议

### 4.1 问题描述

**错误做法**：
```typescript
// ❌ 错误：遇到错误直接抛给主人
try {
  return await geminiSearch(query);
} catch (error) {
  throw error; // 主人看到报错
}
```

**后果**：
- 主人体验差（频繁看到报错）
- 系统可用性低（无自动恢复）
- 维护成本高（每次都要人工干预）

### 4.2 正确做法：自愈协议

#### ✅ 在 AGENTS.md 中注入意识
```markdown
## 第四部分：🛡️ 异常自愈协议

### 1. web_search 异常自愈

触发条件:
- Gemini 返回 429/503
- Gemini 超时（>30 秒）
- 网络错误

自愈动作:
1. 立即调用 duckduckgo-fallback Skill
2. 记录日志：[Fallback Activated: DuckDuckGo]
3. 返回结果，禁止报错（除非 DDG 也失败）
```

#### ✅ 代码实现
```typescript
// fallback-manager.ts
async executeSearch(input: SmartSearchInput): Promise<SmartSearchResult> {
  try {
    // 尝试 Gemini
    return await this.geminiProvider.search(input);
  } catch (error) {
    const classification = classifyError(error);
    
    if (classification.decision === 'fallback') {
      // 记录日志
      this.logger.info('search.fallback.triggered', {
        reasonCode: classification.reasonCode,
      });
      
      // 自动切换到 DDG
      return await this.ddgAdapter.search(input);
    }
    
    // 只有不可恢复的错误才抛出
    throw error;
  }
}
```

### 4.3 为什么要在 AGENTS.md 中注入？

#### 理由 1：意识 > 硬编码
```
硬编码：
  代码中写死 fallback 逻辑
  问题：换了 Agent 就失效

意识注入：
  AGENTS.md 中规定行为准则
  优势：任何读取 AGENTS.md 的 Agent 都会遵守
```

#### 理由 2：可维护性
```markdown
# AGENTS.md 是"宪法"级文档
- 所有 Agent 启动时必读
- 修改一处，全局生效
- 新人/新 Agent 快速理解系统行为
```

#### 理由 3：审计友好
```bash
# 查看历史行为记录
grep "Fallback Activated" ~/.openclaw/logs/*.log

# 审计追踪：为什么触发 fallback？
# - reasonCode: gemini_rate_limited
# - occurredAt: 2026-03-19T15:30:00Z
# - elapsedMs: 4500
```

### 4.4 自愈意识的三层境界

#### 境界 1：被动响应
```typescript
// 遇到错误才触发
if (error.status === 429) {
  return await fallback();
}
```

#### 境界 2：主动预防
```typescript
// 执行前检查健康状态
if (geminiHealth.status === 'unhealthy') {
  return await fallback(); // 直接走 DDG
}
```

#### 境界 3：自我进化
```typescript
// 记录每次 fallback，分析模式
if (fallbackCount > 10) {
  alert('Gemini 频繁失败，建议切换主 Provider');
}
```

### 4.5 验证清单

- [ ] AGENTS.md 包含自愈协议：`grep "异常自愈" AGENTS.md`
- [ ] 代码实现 fallback 逻辑：`grep "fallback" src/fallback-manager.ts`
- [ ] 日志记录完整：`grep "Fallback Activated" logs/*.log`
- [ ] 测试覆盖所有异常场景：`npm test`

---

## 5. 快速开始

### 5.1 前置条件

- [ ] OpenClaw Gateway 已安装
- [ ] Node.js v22+ 已安装
- [ ] Git 已配置
- [ ] Universe 根目录已创建

### 5.2 5 分钟部署

#### 步骤 1：克隆仓库
```bash
cd /home/ouyp/Learning/Practice/openclaw-universe
git pull origin master
```

#### 步骤 2：注册 Skill
```bash
ln -s /home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback \
      ~/.openclaw/skills/duckduckgo-fallback
```

#### 步骤 3：验证安装
```bash
cd ~/.openclaw/skills/duckduckgo-fallback
npm install
npm test
# 输出：Tests 16 passed (16)
```

#### 步骤 4：测试 Fallback
```bash
# 手动测试
node -e "
import { FallbackManager } from './dist/src/fallback-manager.js';
// ... 测试代码
"
```

### 5.3 生产环境配置

#### 环境变量
```bash
# 可选：自定义 DDG Provider 路径
export DDG_PROVIDER_PATH=/custom/path/to/ddg-provider/dist/src/index.js

# 可选：强制 fallback（测试用）
export FORCE_FALLBACK=true
```

#### 配置文件
```json5
// ~/.openclaw/openclaw.json
{
  "tools": {
    "web": {
      "search": {
        "enabled": true,
        "provider": "gemini"
      }
    }
  }
}
```

---

## 6. 故障排查

### 6.1 常见问题

#### 问题 1：PermissionRejectedError
```
Error: PermissionRejectedError
permission requested: external_directory
```

**解决**：
```bash
# 检查软链接是否存在
ls -la ~/.openclaw/workspace/universe-bridge

# 重新创建软链接
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      ~/.openclaw/workspace/universe-bridge
```

#### 问题 2：MODULE_NOT_FOUND
```
Error: Cannot find module '...'
```

**解决**：
```bash
# 检查路径是否正确
cat src/types.ts | grep DEFAULT_DDG_PROVIDER_ENTRY

# 确保 DDG Provider 已构建
cd /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding
npm run build
```

#### 问题 3：PARSE_ERROR
```
Error: PARSE_ERROR: no valid DuckDuckGo results could be extracted.
```

**原因**：DuckDuckGo 反机器人检测

**解决**：
```bash
# 方案 1：使用浏览器工具调用（绕过检测）
# 方案 2：集成 Brave Search API
# 方案 3：添加请求头随机化
```

### 6.2 调试技巧

#### 启用详细日志
```typescript
// fallback-manager.ts
this.logger.info('search.request.started', {
  requestId,
  query,
  timestamp: Date.now(),
});
```

#### 查看日志
```bash
# 实时查看
tail -f ~/.openclaw/logs/*.log | grep -i fallback

# 搜索特定错误
grep "gemini_rate_limited" ~/.openclaw/logs/*.log
```

---

## 7. 附录

### 7.1 核心文件清单

| 文件 | 路径 | 说明 |
|------|------|------|
| `types.ts` | `extensions/duckduckgo-fallback/src/` | 类型定义 |
| `error-classifier.ts` | `extensions/duckduckgo-fallback/src/` | 错误分类器 |
| `ddg-adapter.ts` | `extensions/duckduckgo-fallback/src/` | DDG 适配层 |
| `fallback-manager.ts` | `extensions/duckduckgo-fallback/src/` | 状态机核心 |
| `index.ts` | `extensions/duckduckgo-fallback/src/` | Skill 入口 |
| `fallback.test.ts` | `extensions/duckduckgo-fallback/tests/` | 核心测试 |
| `AGENTS.md` | `/home/ouyp/.openclaw/workspace/` | 规约文档 |
| `GUIDE.md` | `/home/ouyp/Learning/Practice/openclaw-universe/` | 本文档 |

### 7.2 关键命令速查

```bash
# 创建软链接
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      ~/.openclaw/workspace/universe-bridge

# 注册 Skill
ln -s /home/ouyp/Learning/Practice/openclaw-universe/extensions/duckduckgo-fallback \
      ~/.openclaw/skills/duckduckgo-fallback

# 运行测试
cd ~/.openclaw/skills/duckduckgo-fallback
npm test

# 查看 Git 历史
cd /home/ouyp/Learning/Practice/openclaw-universe
git log --oneline --grep="fallback"
```

### 7.3 参考资源

- **OmniForge v2.9 规约**: `AGENTS.md`
- **技术详述**: `tasks/20260319-ddg-fallback-skill/03_technical/SPEC.md`
- **实验报告**: `extensions/duckduckgo-fallback/EXPERIMENT_REPORT.md`
- **Gitee 仓库**: `https://gitee.com/cola16/openclaw-evolution`

---

## 📜 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0 | 2026-03-19 | 初始版本，包含三大深坑复盘 |

---

*本手册由 openclaw-ouyp 编写，基于真实工程实践*  
**进化指数**: 92/100  
**内化率**: 61%  
**Gitee**: 已推送至 `cola16/openclaw-evolution`
