# multi-git-manager

> 基于 Git Hook 的多仓库同步工具 - 一次提交，自动同步到多个远程仓库  
> **版本**: v1.0.1 | **更新**: 新增 CLI 工具 + 同步日志 + OpenClaw 兼容

## 快速开始

### 安装

```bash
# 克隆或下载本工具
git clone <this-repo> /path/to/multi-git-manager

# 在你的项目仓库中执行安装
cd /path/to/your/repo
/path/to/multi-git-manager/04_coding/install.sh
```

### 配置

编辑 `.multi-git/config.json`：

```json
{
  "primary": "origin",
  "mirrors": [
    {
      "name": "github",
      "url": "https://github.com/USERNAME/REPO.git",
      "branches": ["master", "main"],
      "enabled": true
    },
    {
      "name": "gitee",
      "url": "git@gitee.com:USERNAME/REPO.git",
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

### 使用

### 自动同步（Git Hook）

```bash
# 正常提交代码
git add .
git commit -m "your message"

# 自动同步到镜像仓库
# 输出示例：
# [multi-git] 开始同步到镜像仓库...
# [multi-git] ✓ github: 推送成功 (master)
# [multi-git] ✓ gitee: 推送成功 (master)
# [multi-git] 同步完成，共 2 个仓库
```

### 手动同步（CLI 工具）v1.0.1 新增

```bash
# 手动触发同步
./multi-git.sh sync

# 查看状态
./multi-git.sh status

# 查看配置
./multi-git.sh config

# 查看同步日志（最近 20 条）
./multi-git.sh log

# 查看最近 50 条日志
./multi-git.sh log -n 50

# 实时跟踪日志
./multi-git.sh log -f

# 显示帮助
./multi-git.sh help
```

### 同步日志 v1.0.1 新增

同步日志保存在 `.multi-git/sync.log`，格式如下：

```
[2026-04-01 16:30:45] [INFO] [SUCCESS] [github] 推送到 https://github.com/user/repo.git 成功
[2026-04-01 16:30:46] [INFO] [SUCCESS] [gitee] 推送到 git@gitee.com:user/repo.git 成功
[2026-04-01 16:31:12] [ERROR] [FAILURE] [gitlab] 推送失败：Connection timeout
[2026-04-01 16:31:13] [INFO] [RETRY] [gitlab] 重试 1/3...
[2026-04-01 16:31:15] [INFO] [SUCCESS] [gitlab] 推送成功（重试后）
```

日志自动轮转，保留最近 100 条记录。

## 配置说明

### 字段说明

| 字段 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| primary | string | ✅ | origin | 主仓库 remote 名称 |
| mirrors | array | ✅ | [] | 镜像仓库列表 |
| mirrors[].name | string | ✅ | - | 仓库标识名称 |
| mirrors[].url | string | ✅ | - | 仓库 URL |
| mirrors[].branches | array | ⚠️ | ["master", "main"] | 同步的分支列表 |
| mirrors[].enabled | boolean | ⚠️ | true | 是否启用 |
| syncMode | string | ⚠️ | auto | 同步模式（auto/manual） |
| retryCount | number | ⚠️ | 3 | 失败重试次数 |
| retryDelay | number | ⚠️ | 1000 | 重试间隔（毫秒） |
| logLevel | string | ⚠️ | info | 日志级别 |

### 同步模式

- `auto`: 提交后自动同步（默认）
- `manual`: 需要手动触发同步

### 分支过滤

配置 `branches` 数组选择需要同步的分支：

```json
{
  "name": "github",
  "branches": ["master", "main", "develop"]
}
```

## 目录结构

### 安装后

```
your-repo/
├── .git/
│   └── hooks/
│       ├── post-commit → ../../.multi-git/hooks/post-commit
│       └── pre-push → ../../.multi-git/hooks/pre-push
├── .multi-git/
│   ├── config.json           # 配置文件
│   ├── config.template.json  # 配置模板
│   ├── sync.log              # 同步日志（v1.0.1 新增）
│   └── hooks/
│       ├── logger.sh         # 日志模块
│       ├── config.sh         # 配置模块
│       ├── sync.sh           # 同步脚本
│       ├── post-commit       # 提交后 Hook
│       └── pre-push          # 推送前 Hook
└── multi-git.sh              # CLI 工具（v1.0.1 新增）
```

### 源代码

```
multi-git-manager/
├── 04_coding/
│   ├── hooks/
│   │   ├── logger.sh         # 日志模块 v1.0.1
│   │   ├── config.sh         # 配置模块 v1.0.1（OpenClaw 兼容）
│   │   ├── sync.sh           # 同步脚本
│   │   ├── post-commit       # 提交后 Hook
│   │   └── pre-push          # 推送前 Hook
│   ├── bin/
│   │   └── multi-git.sh      # CLI 工具 v1.0.1 新增
│   ├── install.sh            # 安装脚本 v1.0.1
│   ├── config.template.json  # 配置模板
│   └── README.md             # 本文件
├── 01_designing/
│   ├── PRD.md
│   └── TRD.md
├── 02_roadmapping/
│   └── ROADMAP.md
├── 03_detailing/
│   └── DETAIL.md
└── 05_reviewing/
    └── REVIEW-REPORT.md
```

## 故障排除

### Hook 未触发

检查 Hook 是否有执行权限：

```bash
chmod +x .git/hooks/post-commit
chmod +x .multi-git/hooks/*.sh
```

### 同步失败

1. 检查网络连接
2. 检查仓库 URL 是否正确
3. 检查 Git 认证配置（SSH Key 或 Token）
4. 查看同步日志：`./multi-git.sh log`

### 查看调试日志

设置 `logLevel: "debug"` 查看详细日志：

```json
{
  "logLevel": "debug"
}
```

或使用环境变量：

```bash
export MULTI_GIT_DEBUG=1
git commit -m "test"
```

### OpenClaw 兼容性 v1.0.1 新增

在 OpenClaw 环境中，工具会自动检测并使用绝对路径加载模块：

```bash
# OpenClaw 工作区环境变量
export OPENCLAW_WORKSPACE=~/.openclaw/workspace

# 工具会自动检测并使用正确的路径
```

如果遇到问题，可以手动设置：

```bash
export MULTI_GIT_CONFIG_FILE=~/.openclaw/workspace/project/.multi-git/config.json
export MULTI_GIT_LOG_FILE=~/.openclaw/workspace/project/.multi-git/sync.log
```

### 日志文件位置

默认位置：`.multi-git/sync.log`

自定义位置（环境变量）：

```bash
export MULTI_GIT_LOG_FILE=/path/to/custom/sync.log
```

### 日志轮转

日志文件自动轮转，保留最近 100 条记录。如需查看完整历史，建议定期备份日志文件。

## 卸载

```bash
# 删除 .multi-git 目录
rm -rf .multi-git

# 删除 Git Hook
rm .git/hooks/post-commit
rm .git/hooks/pre-push
```

## 变更日志

### v1.0.1 (2026-04-01) - Bugfix

**新增功能**:
- ✅ CLI 工具 (`multi-git.sh`) - 支持 sync/status/config/log/help 命令
- ✅ 同步日志文件 (`.multi-git/sync.log`) - 记录每次同步结果
- ✅ 日志轮转策略 - 自动保留最近 100 条记录
- ✅ OpenClaw 环境检测 - 三级降级路径检测
- ✅ 环境变量支持 - `MULTI_GIT_LOG_FILE`, `MULTI_GIT_CONFIG_FILE`, `MULTI_GIT_DEBUG`

**改进**:
- ✅ logger.sh - 新增文件日志写入和轮转功能
- ✅ config.sh - 新增 OpenClaw 兼容性检测
- ✅ sync.sh - 集成文件日志记录
- ✅ install.sh - 自动安装 CLI 工具

### v1.0.0 (2026-04-01) - 初始版本

- ✅ 基于 Git Hook 的自动同步
- ✅ 主仓库和镜像仓库分离
- ✅ 故障重试机制
- ✅ 分支过滤
- ✅ 配置验证

## 许可证

MIT
