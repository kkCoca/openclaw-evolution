# OMNIFORGE SOP (万象锻造标准作业程序)

> **版本**: v3.0  
> **创建日期**: 2026-03-19  
> **适用场景**: 所有 OpenClaw Universe 研发任务  
> **目标读者**: 首席顾问、AI Agent、开发者  
> **性质**: **宪法级文档**（必须遵循）

---

## 📋 目录

1. [权限授权命令](#1-权限授权命令)
2. [软链接桥接原理](#2-软链接桥接原理)
3. [主权回归规约](#3-主权回归规约)
4. [验证清单](#4-验证清单)

---

## 1. 权限授权命令

### 1.1 OpenCode 沙盒限制

**问题**：OpenCode 是独立 CLI 工具，默认只能访问 `~/.openclaw/workspace/` 目录。

**解决**：通过软链接桥接访问 Universe 主权根目录。

### 1.2 授权命令

```bash
# 步骤 1：创建软链接（一次性操作）
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      /home/ouyp/.openclaw/workspace/universe-bridge

# 步骤 2：验证软链接
ls -la /home/ouyp/.openclaw/workspace/universe-bridge
# 输出：lrwxrwxrwx ... -> /home/ouyp/Learning/Practice/openclaw-universe

# 步骤 3：通过桥接路径访问
cd /home/ouyp/.openclaw/workspace/universe-bridge/tasks/
```

### 1.3 权限验证

```bash
# 验证 OpenCode 可访问
opencode run "ls universe-bridge/tasks/" --workdir ~/.openclaw/workspace/

# 验证 Git 仓库完整
cd universe-bridge && git status
```

---

## 2. 软链接桥接原理

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│              OpenCode 沙盒权限范围                       │
│  (~/.openclaw/workspace/)                               │
│                                                          │
│  ┌────────────────────────────────┐                     │
│  │ universe-bridge (软链接)       │                     │
│  │   ↓                            │                     │
│  │   指向                         │                     │
│  └────────────────────────────────┘                     │
│                     ↓                                    │
└─────────────────────┼──────────────────────────────────┘
                      │
                      │ 实际物理位置
                      ↓
/home/ouyp/Learning/Practice/openclaw-universe/
├── tasks/           # 研发区（OpenCode 可访问）
├── extensions/      # 生产区
└── .git/            # Git 仓库
```

### 2.2 为什么用软链接？

| 方案 | 优点 | 缺点 |
|------|------|------|
| **物理复制** | 简单直接 | 技术主权割裂、同步成本高 |
| **权限授权** | 理论可行 | OpenClaw 授权对 OpenCode 无效 |
| **软链接桥接** | ✅ 主权统一、自动同步、零维护 | 需要理解软链接原理 |

### 2.3 软链接管理

```bash
# 查看软链接目标
readlink /home/ouyp/.openclaw/workspace/universe-bridge

# 删除软链接
rm /home/ouyp/.openclaw/workspace/universe-bridge

# 重新创建
ln -s /home/ouyp/Learning/Practice/openclaw-universe \
      /home/ouyp/.openclaw/workspace/universe-bridge
```

---

## 3. 主权回归规约

### 3.1 核心原则

**所有研发活动必须在 Universe 主权根目录下进行**：
```
/home/ouyp/Learning/Practice/openclaw-universe/
```

### 3.2 路径边界

#### ✅ 合规路径
```bash
# 研发区
/home/ouyp/Learning/Practice/openclaw-universe/tasks/YYYYMMDD-TaskName/

# 生产区
/home/ouyp/Learning/Practice/openclaw-universe/extensions/ExtensionName/

# 文档区
/home/ouyp/Learning/Practice/openclaw-universe/GUIDE.md
~/.openclaw/workspace/AGENTS.md
```

#### ❌ 违规路径
```bash
# 私有 workspace（仅用于桥接）
~/.openclaw/workspace/tasks/  # 错误！

# 其他外部目录
/home/ouyp/some-other-project/  # 错误！
```

### 3.3 研发流程 SOP

```bash
# 步骤 1：在 tasks/ 下初始化
cd /home/ouyp/Learning/Practice/openclaw-universe
mkdir -p tasks/$(date +%Y%m%d)-task-name/{01_designing,02_roadmapping,03_technical,04_coding}

# 步骤 2：通过桥接路径执行（OpenCode）
opencode run "..." \
  --workdir /home/ouyp/.openclaw/workspace/universe-bridge/tasks/$(date +%Y%m%d)-task-name/

# 步骤 3：架构师审批后复制到 extensions/
cp -r tasks/$(date +%Y%m%d)-task-name/04_coding \
      extensions/task-name/

# 步骤 4：Git 提交
git add tasks/$(date +%Y%m%d)-task-name/
git commit -m "feat: Task Name"
git push origin master
```

### 3.4 为什么必须主权回归？

#### 理由 1：Git 版本控制完整性
```bash
# 正确：Git 可以追踪完整研发历史
cd /home/ouyp/Learning/Practice/openclaw-universe
git log --oneline | head -10

# 错误：~/.openclaw/workspace/ 不在 Git 仓库内
# 结果：研发记录丢失，无法追溯
```

#### 理由 2：团队协作基础
```
团队成员 A：代码在哪里？
团队成员 B：在 Universe/tasks/ 下
团队成员 A：好的，git pull 就能看到
```

#### 理由 3：OmniForge 规约要求
```markdown
AGENTS.md v3.0 规定：
- 所有研发产物必须在主权根目录下
- 01-04 阶段文档必须完整保留
- 生产区只能由架构师复制
```

---

## 4. 验证清单

### 4.1 权限验证

- [ ] 软链接已创建：`ls -la ~/.openclaw/workspace/universe-bridge`
- [ ] 软链接指向正确：`readlink ~/.openclaw/workspace/universe-bridge`
- [ ] OpenCode 可访问：`opencode run "ls universe-bridge/tasks/"`
- [ ] Git 仓库完整：`cd universe-bridge && git status`

### 4.2 路径验证

- [ ] tasks/ 在 Universe 根目录下：`ls /home/ouyp/Learning/Practice/openclaw-universe/tasks/`
- [ ] 01-04 阶段文档完整：`ls tasks/YYYYMMDD-TaskName/`
- [ ] extensions/ 由复制而来：`diff tasks/.../04_coding/ extensions/TaskName/`
- [ ] Git 已提交：`git log --oneline | head -5`

### 4.3 规约遵循

- [ ] 研发活动未在 ~/.openclaw/workspace/ 下进行
- [ ] 所有代码变更已 git add/commit
- [ ] AGENTS.md v3.0 已阅读并理解
- [ ] 本 SOP 文档已阅读并理解

---

## 📜 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v3.0 | 2026-03-19 | 初始版本，基于今日实战经验 |

---

*本 SOP 由 openclaw-ouyp 编写，基于真实工程实践*  
**性质**: 宪法级文档（必须遵循）  
**Gitee**: `https://gitee.com/cola16/openclaw-evolution`
