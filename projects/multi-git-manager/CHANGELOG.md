# multi-git-manager - 变更日志

## v1.0.1 (2026-04-01) - Bugfix

**Issue ID**: BUGFIX-001  
**场景类型**: 问题修复  
**版本升级**: v1.0.0 → v1.0.1

### 问题背景

v1.0.0 部署验证中发现以下问题：

1. **缺少同步日志** - 无法追溯同步历史
2. **OpenClaw 兼容性** - post-commit Hook 有时不触发
3. **缺少手动同步命令** - 用户需要手动执行 Hook 脚本

### 修复内容

#### 新增功能

- ✅ **CLI 工具** (`bin/multi-git.sh`)
  - `sync` 命令 - 手动触发同步
  - `status` 命令 - 显示状态和配置
  - `config` 命令 - 查看配置文件
  - `log` 命令 - 查看同步日志（支持 `-n` 和 `-f` 参数）
  - `help` 命令 - 显示帮助信息

- ✅ **同步日志文件** (`.multi-git/sync.log`)
  - 日志格式：`[时间] [级别] [状态] [仓库] 消息`
  - 自动轮转：保留最近 100 条记录
  - 支持环境变量自定义：`MULTI_GIT_LOG_FILE`

- ✅ **OpenClaw 环境检测**
  - 三级降级路径检测（环境变量 → 工作区路径 → Git 配置）
  - 绝对路径加载模块
  - 支持环境变量：`OPENCLAW_WORKSPACE`, `MULTI_GIT_CONFIG_FILE`, `MULTI_GIT_DEBUG`

#### 模块改进

- **logger.sh**
  - 新增 `get_log_file_path()` - 获取日志文件路径
  - 新增 `write_log_file()` - 写入文件日志
  - 新增 `rotate_log_file()` - 日志轮转
  - 新增 `log_retry()` - 重试标记
  - 新增 `log_skip()` - 跳过标记

- **config.sh**
  - 新增 `is_openclaw_env()` - 检测 OpenClaw 环境
  - 新增 `get_openclaw_workspace()` - 获取工作区路径
  - 新增 `get_script_dir()` - 获取脚本目录（兼容 OpenClaw）
  - 新增 `source_module()` - 加载模块（使用绝对路径）

- **sync.sh**
  - 集成文件日志记录
  - 使用 `log_retry()` 记录重试
  - 使用 `log_skip()` 记录跳过

- **install.sh**
  - 新增 `copy_cli()` - 复制 CLI 工具
  - 更新 `validate_config()` - 检查 CLI 工具
  - 更新 `print_usage()` - 添加 CLI 使用说明

- **post-commit**
  - 使用 `source_module()` 加载模块
  - 添加 OpenClaw 环境检测日志

- **pre-push**
  - 使用 `source_module()` 加载模块
  - 添加 OpenClaw 环境检测日志

### 验收检查点（12 项）

#### 同步日志功能（4 项）
- [x] 日志文件创建 - `.multi-git/sync.log` 存在且非空
- [x] 日志格式正确 - `[时间] [级别] [状态] [仓库] 消息`
- [x] 日志轮转生效 - 保留最近 100 条
- [x] 日志级别控制 - `logLevel=error` 仅记录 ERROR

#### OpenClaw 兼容性（4 项）
- [x] 环境变量检测 - `OPENCLAW_WORKSPACE` 生效
- [x] 绝对路径加载 - 模块正确加载
- [x] post-commit 触发 - Hook 稳定触发
- [x] 降级路径检测 - BASH_SOURCE 降级工作

#### CLI 命令功能（4 项）
- [x] sync 命令 - 手动触发同步
- [x] status 命令 - 显示状态
- [x] log 命令 - 查看日志
- [x] help 命令 - 显示帮助

### 文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `hooks/logger.sh` | 增强 | 新增文件日志和轮转功能 |
| `hooks/config.sh` | 增强 | 新增 OpenClaw 环境检测 |
| `hooks/sync.sh` | 增强 | 集成文件日志 |
| `hooks/post-commit` | 增强 | 使用 source_module |
| `hooks/pre-push` | 增强 | 使用 source_module |
| `bin/multi-git.sh` | 新增 | CLI 工具 |
| `install.sh` | 增强 | 添加 CLI 安装逻辑 |
| `README.md` | 增强 | 添加 v1.0.1 说明 |

---

## v1.0.0 (2026-04-01) - 初始版本

**场景类型**: 全新功能

### 功能特性

- ✅ 基于 Git Hook 的自动同步
- ✅ 主仓库和镜像仓库分离管理
- ✅ 故障重试机制（可配置次数和间隔）
- ✅ 分支过滤（选择同步哪些分支）
- ✅ 配置验证（安装时验证 JSON 格式和连接）
- ✅ 同步报告（显示成功/失败状态）
- ✅ 同步模式（auto/manual）

### 核心组件

| 组件 | 文件 | 说明 |
|------|------|------|
| 配置模块 | `hooks/config.sh` | 读取和解析 config.json |
| 日志模块 | `hooks/logger.sh` | 统一日志输出格式 |
| 同步模块 | `hooks/sync.sh` | 执行同步逻辑（带重试） |
| Post-commit Hook | `hooks/post-commit` | 提交后触发同步 |
| Pre-push Hook | `hooks/pre-push` | 推送前验证配置 |
| 安装脚本 | `install.sh` | 初始化和配置 |
| 配置模板 | `config.template.json` | 配置示例 |

### 配置示例

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

---

*本变更日志由 clawdevflow 流程引擎生成，openclaw-ouyp 维护*
