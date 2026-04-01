# 多 Git 仓库管理工具 - 需求说明

## 版本信息

| 字段 | 值 |
|------|-----|
| 版本 | v1.0.0 |
| 日期 | 2026-04-01 |
| 场景类型 | 全新功能 |
| 项目名称 | multi-git-manager |

---

## 1. 项目概述

### 1.1 项目目标

开发一个基于 Git Hook 的多仓库管理工具，实现：
- 一次提交，自动同步到多个远程仓库
- 主仓库和附属仓库分离管理
- 配置简单，无需手动操作

### 1.2 核心概念

| 概念 | 说明 | 示例 |
|------|------|------|
| **主仓库** | 默认 push/pull 的仓库，与本地代码保持一致 | `git push` 默认目标 |
| **附属仓库** | 自动同步的镜像/备份仓库 | GitHub/Gitee 镜像 |

---

## 2. 功能需求

### 2.1 核心功能（P0）

| 功能 | 说明 | 验收标准 |
|------|------|---------|
| **主仓库配置** | 配置默认 push/pull 仓库 | `.multi-git/config.json` 中设置 primary |
| **附属仓库配置** | 配置多个镜像仓库 | 支持配置多个 mirrors |
| **自动同步** | 提交后自动推送到附属仓库 | post-commit Hook 自动触发 |
| **配置验证** | 验证仓库 URL 和连接 | 初始化时测试连接 |

### 2.2 增强功能（P1）

| 功能 | 说明 | 验收标准 |
|------|------|---------|
| **同步策略** | 可配置自动/手动同步 | config.json 中设置 syncMode |
| **故障重试** | 同步失败自动重试 | 重试 3 次，间隔 1 秒 |
| **同步报告** | 显示同步结果 | 终端输出成功/失败状态 |
| **分支过滤** | 选择同步哪些分支 | config.json 中配置 branches 数组 |

---

## 3. 技术约束

| 约束 | 说明 |
|------|------|
| **纯 Git Hook** | 不依赖外部 CLI 工具 |
| **配置文件** | `.multi-git/config.json` |
| **脚本语言** | Bash（兼容 Linux/macOS/Windows Git Bash） |
| **无额外依赖** | 仅使用 Git 和系统命令 |
| **跨平台** | 支持 Linux/macOS/Windows |

---

## 4. 输出要求

**必须输出到**：
```
projects/multi-git-manager/
├── REQUIREMENTS.md              # 本文件
├── 01_designing/
│   ├── PRD.md                   # 产品需求文档
│   └── TRD.md                   # 技术设计文档
├── 02_roadmapping/
│   └── ROADMAP.md               # 研发路线图
├── 03_detailing/
│   └── DETAIL.md                # 详细设计
├── 04_coding/
│   ├── hooks/
│   │   ├── post-commit          # 提交后同步 Hook
│   │   └── pre-push             # 推送前验证 Hook
│   ├── install.sh               # 安装脚本
│   └── config.template.json     # 配置模板
├── 05_reviewing/
│   └── REVIEW-REPORT.md         # 验收报告
└── CHANGELOG.md                 # 变更日志
```

---

## 5. 验收标准

### 5.1 Given
- Git 仓库已初始化
- `.multi-git/config.json` 已配置

### 5.2 When
- 执行 `git commit`
- 或执行 `git push`

### 5.3 Then
- ✅ 主仓库正常推送（用户手动执行）
- ✅ 附属仓库自动同步
- ✅ 同步失败有错误提示
- ✅ 同步报告清晰显示结果

---

## 6. 配置示例

### 6.1 配置文件格式

```json
{
  "primary": "origin",
  "mirrors": [
    {
      "name": "github",
      "url": "https://github.com/kkCoca/openclaw-evolution.git",
      "branches": ["master", "main"],
      "enabled": true
    },
    {
      "name": "gitee",
      "url": "git@gitee.com:cola16/openclaw-evolution.git",
      "branches": ["master"],
      "enabled": true
    }
  ],
  "syncMode": "auto",
  "retryCount": 3,
  "retryDelay": 1000,
  "logLevel": "info"
}
```

### 6.2 字段说明

| 字段 | 类型 | 必需 | 说明 | 默认值 |
|------|------|------|------|--------|
| primary | string | ✅ | 主仓库 remote 名称 | origin |
| mirrors | array | ✅ | 附属仓库列表 | [] |
| mirrors[].name | string | ✅ | 仓库标识名称 | - |
| mirrors[].url | string | ✅ | 仓库 URL | - |
| mirrors[].branches | array | ⚠️ | 同步的分支列表 | ["master", "main"] |
| mirrors[].enabled | boolean | ⚠️ | 是否启用 | true |
| syncMode | string | ⚠️ | 同步模式（auto/manual） | auto |
| retryCount | number | ⚠️ | 失败重试次数 | 3 |
| retryDelay | number | ⚠️ | 重试间隔（毫秒） | 1000 |
| logLevel | string | ⚠️ | 日志级别（info/debug/error） | info |

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本（纯 Git Hook 方案） |
| **v1.0.1** | **2026-04-01** | **Bugfix：同步日志 + OpenClaw 兼容 + sync 命令** |

---

## 8. v1.0.1 Bugfix 需求说明

**Issue ID**: BUGFIX-001  
**需求类型**: 问题修复  
**版本升级**: v1.0.0 → v1.0.1

### 8.1 问题背景

v1.0.0 部署验证中发现以下问题：

1. **缺少同步日志** - 无法追溯同步历史
2. **OpenClaw 兼容性** - post-commit Hook 有时不触发
3. **缺少手动同步命令** - 用户需要手动执行 Hook 脚本

### 8.2 修复目标

| 目标 | 说明 | 验收标准 |
|------|------|---------|
| **同步日志** | 记录每次同步结果 | `.multi-git/sync.log` 文件存在 |
| **OpenClaw 兼容** | 适配 OpenClaw Git 提交流程 | post-commit Hook 稳定触发 |
| **sync 命令** | 提供手动同步命令 | `multi-git sync` 可用 |

### 8.3 功能需求

1. **同步日志文件**
   - 路径：`.multi-git/sync.log`
   - 格式：`[时间] [状态] [仓库] [消息]`
   - 保留：最近 100 条记录

2. **OpenClaw 兼容性改进**
   - 检测 OpenClaw 环境
   - 使用绝对路径加载模块
   - 添加环境变量支持

3. **multi-git sync 命令**
   - 脚本：`multi-git.sh`
   - 功能：手动触发同步
   - 位置：项目根目录或 PATH 中

### 8.4 输出要求

**新增文件**：
```
projects/multi-git-manager/
├── 04_coding/
│   ├── multi-git.sh         # 新增：CLI 命令
│   └── hooks/
│       ├── logger.sh        # 修改：添加日志文件支持
│       ├── sync.sh          # 修改：添加日志记录
│       └── post-commit      # 修改：OpenClaw 兼容性改进
├── 05_reviewing/
│   └── REVIEW-REPORT-v1.0.1.md  # 新增：验收报告
└── CHANGELOG.md             # 追加：v1.0.1 记录
```

### 8.5 验收标准

- Given 同步日志功能已实现
- When 执行同步
- Then `.multi-git/sync.log` 包含同步记录

- Given OpenClaw 环境
- When 执行 git commit
- Then post-commit Hook 正常触发

- Given multi-git.sh 脚本存在
- When 执行 `./multi-git.sh sync`
- Then 手动触发同步到所有镜像仓库

### 8.6 版本历史（追加）

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本 |
| **v1.0.1** | **2026-04-01** | **Bugfix：同步日志 + OpenClaw 兼容 + sync 命令** |

---

*本需求由 openclaw-ouyp 提供，clawdevflow 执行*
