# 多 Git 仓库管理工具 - 产品需求文档 (PRD)

> **版本**: v1.0.0  
> **日期**: 2026-04-01  
> **状态**: 待审阅  

---

## 1. 产品概述

### 1.1 产品定位

multi-git-manager 是一个基于 Git Hook 的轻量级多仓库同步工具，帮助开发者实现：
- **一次提交，多仓同步** - 提交后自动推送到多个远程仓库
- **主从分离** - 明确区分主仓库和镜像仓库
- **零配置成本** - 简单配置，开箱即用

### 1.2 目标用户

| 用户类型 | 使用场景 | 核心诉求 |
|---------|---------|---------|
| 开源项目维护者 | 同时维护 GitHub/Gitee 镜像 | 自动同步，避免手动操作 |
| 企业开发者 | 代码需要备份到多个仓库 | 数据安全，多地备份 |
| 个人开发者 | 多平台代码托管 | 简化管理流程 |

### 1.3 核心价值

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  本地提交   │  →   │  主仓库推送  │  →   │  镜像同步   │
│  git commit │      │  git push   │      │  自动触发   │
└─────────────┘      └─────────────┘      └─────────────┘
                              ↓
                    ┌─────────────────┐
                    │ .multi-git/     │
                    │ config.json     │
                    └─────────────────┘
```

---

## 2. 功能需求

### 2.1 功能列表

| 优先级 | 功能模块 | 功能点 | 验收标准 |
|--------|---------|-------|---------|
| **P0** | 主仓库配置 | 配置默认 push/pull 仓库 | config.json 中设置 primary 字段 |
| **P0** | 附属仓库配置 | 配置多个镜像仓库 | 支持配置多个 mirrors 数组项 |
| **P0** | 自动同步 | 提交后自动推送到附属仓库 | post-commit Hook 自动触发 |
| **P0** | 配置验证 | 验证仓库 URL 和连接 | 初始化时测试连接 |
| **P1** | 同步策略 | 可配置自动/手动同步 | config.json 中设置 syncMode |
| **P1** | 故障重试 | 同步失败自动重试 | 重试 3 次，间隔 1 秒 |
| **P1** | 同步报告 | 显示同步结果 | 终端输出成功/失败状态 |
| **P1** | 分支过滤 | 选择同步哪些分支 | config.json 中配置 branches 数组 |

### 2.2 功能详细说明

#### 2.2.1 主仓库配置 (P0)

**用户故事**:
> 作为开发者，我希望配置一个主仓库，这样 `git push` 可以正常工作，同时知道代码的主要托管位置。

**功能描述**:
- 在 `.multi-git/config.json` 中配置 `primary` 字段
- 默认值为 `origin`
- 主仓库是用户手动 `git push` 的目标

**验收标准**:
```gherkin
Given 已配置 .multi-git/config.json
When primary 字段设置为 "origin"
Then git push 默认推送到 origin 仓库
```

#### 2.2.2 附属仓库配置 (P0)

**用户故事**:
> 作为开发者，我希望配置多个附属仓库，这样代码可以自动同步到 GitHub、Gitee 等多个平台。

**功能描述**:
- 在 `mirrors` 数组中配置多个仓库
- 每个仓库包含 name、url、branches、enabled 字段
- 支持启用/禁用特定仓库

**验收标准**:
```gherkin
Given 已配置 .multi-git/config.json
When mirrors 数组包含 github 和 gitee 两个仓库
Then 提交后自动同步到这两个仓库
```

#### 2.2.3 自动同步 (P0)

**用户故事**:
> 作为开发者，我希望提交后自动同步到附属仓库，这样不需要手动执行额外的 push 命令。

**功能描述**:
- 通过 Git post-commit Hook 实现
- 提交成功后自动触发同步脚本
- 同步脚本读取配置并推送到所有启用的镜像仓库

**验收标准**:
```gherkin
Given 已安装 multi-git-manager
And 已配置至少一个启用的镜像仓库
When 执行 git commit
Then 自动推送到所有启用的镜像仓库
```

#### 2.2.4 配置验证 (P0)

**用户故事**:
> 作为开发者，我希望在安装时验证配置，这样可以提前发现配置错误。

**功能描述**:
- install.sh 脚本验证 config.json 格式
- 测试主仓库和镜像仓库的连接
- 输出验证结果

**验收标准**:
```gherkin
Given 已创建 .multi-git/config.json
When 执行 install.sh
Then 验证配置文件格式
And 测试仓库连接
And 输出验证结果
```

#### 2.2.5 同步策略 (P1)

**用户故事**:
> 作为开发者，我希望可以选择自动或手动同步模式，这样在某些场景下可以控制同步时机。

**功能描述**:
- `syncMode: "auto"` - 提交后自动同步（默认）
- `syncMode: "manual"` - 需要手动触发同步

**验收标准**:
```gherkin
Given syncMode 设置为 "manual"
When 执行 git commit
Then 不自动同步到镜像仓库
```

#### 2.2.6 故障重试 (P1)

**用户故事**:
> 作为开发者，我希望同步失败时自动重试，这样可以应对网络波动等临时问题。

**功能描述**:
- 同步失败时自动重试
- 可配置重试次数（默认 3 次）
- 可配置重试间隔（默认 1000ms）

**验收标准**:
```gherkin
Given 镜像仓库网络不稳定
When 第一次推送失败
Then 自动重试 3 次
And 每次间隔 1 秒
```

#### 2.2.7 同步报告 (P1)

**用户故事**:
> 作为开发者，我希望看到同步结果，这样可以知道哪些仓库同步成功，哪些失败。

**功能描述**:
- 同步完成后输出报告
- 显示每个仓库的同步状态（成功/失败）
- 失败时显示错误信息

**验收标准**:
```gherkin
Given 配置了 3 个镜像仓库
When 提交完成
Then 输出每个仓库的同步状态
And 失败的仓库显示错误信息
```

#### 2.2.8 分支过滤 (P1)

**用户故事**:
> 作为开发者，我希望可以选择同步哪些分支，这样可以避免同步不必要的分支。

**功能描述**:
- 在 mirrors[].branches 中配置需要同步的分支
- 默认同步 master 和 main 分支
- 只同步配置的分支

**验收标准**:
```gherkin
Given mirrors[].branches 设置为 ["master"]
When 在 main 分支提交
Then 不同步到该镜像仓库
When 在 master 分支提交
Then 同步到该镜像仓库
```

---

## 3. 非功能需求

### 3.1 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 同步延迟 | < 5 秒 | 单个仓库同步时间 |
| 并发同步 | 支持 | 多个仓库并行推送 |
| 资源占用 | < 10MB | 脚本运行内存占用 |

### 3.2 兼容性要求

| 平台 | 支持 | 说明 |
|------|------|------|
| Linux | ✅ | Ubuntu/Debian/CentOS |
| macOS | ✅ | 10.15+ |
| Windows | ✅ | Git Bash |

### 3.3 安全要求

| 要求 | 说明 |
|------|------|
| 不存储敏感信息 | config.json 不存储密码/Token |
| 使用 Git 原生认证 | 依赖 Git 的 SSH/HTTPS 认证 |
| 配置文件本地化 | .multi-git/ 目录不提交到仓库 |

---

## 4. 用户界面

### 4.1 配置文件界面

```json
{
  "primary": "origin",
  "mirrors": [
    {
      "name": "github",
      "url": "https://github.com/user/repo.git",
      "branches": ["master", "main"],
      "enabled": true
    }
  ],
  "syncMode": "auto",
  "retryCount": 3,
  "retryDelay": 1000,
  "logLevel": "info"
}
```

### 4.2 同步报告界面

```
[multi-git] 开始同步到镜像仓库...
[multi-git] ✓ github: 推送成功 (master)
[multi-git] ✓ gitee: 推送成功 (master)
[multi-git] 同步完成，共 2 个仓库
```

### 4.3 错误报告界面

```
[multi-git] 开始同步到镜像仓库...
[multi-git] ✓ github: 推送成功 (master)
[multi-git] ✗ gitee: 推送失败 - Connection timeout
[multi-git] 重试 1/3...
[multi-git] ✗ gitee: 推送失败 - Connection timeout
[multi-git] 重试 2/3...
[multi-git] ✓ gitee: 推送成功 (master)
[multi-git] 同步完成，共 2 个仓库
```

---

## 5. 数据模型

### 5.1 配置数据结构

```typescript
interface MultiGitConfig {
  primary: string;           // 主仓库 remote 名称
  mirrors: MirrorConfig[];   // 镜像仓库列表
  syncMode: 'auto' | 'manual';  // 同步模式
  retryCount: number;        // 重试次数
  retryDelay: number;        // 重试间隔 (ms)
  logLevel: 'info' | 'debug' | 'error';  // 日志级别
}

interface MirrorConfig {
  name: string;              // 仓库标识
  url: string;               // 仓库 URL
  branches: string[];        // 同步的分支列表
  enabled: boolean;          // 是否启用
}
```

---

## 6. 验收标准总结

### 6.1 Given
- Git 仓库已初始化
- `.multi-git/config.json` 已配置

### 6.2 When
- 执行 `git commit`
- 或执行 `git push`

### 6.3 Then
- ✅ 主仓库正常推送（用户手动执行）
- ✅ 附属仓库自动同步
- ✅ 同步失败有错误提示
- ✅ 同步报告清晰显示结果

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本（纯 Git Hook 方案） |

---

*本文档由 clawdevflow 流程引擎生成，openclaw-ouyp 审阅*
