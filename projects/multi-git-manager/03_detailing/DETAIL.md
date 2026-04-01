# 多 Git 仓库管理工具 - 详细设计文档 (DETAIL)

> **版本**: v1.0.0  
> **日期**: 2026-04-01  
> **状态**: 待审阅  

---

## 1. 文件结构

### 1.1 完整目录结构

```
multi-git-manager/
├── 04_coding/
│   ├── hooks/
│   │   ├── logger.sh         # 日志模块 (50 行)
│   │   ├── config.sh         # 配置模块 (80 行)
│   │   ├── sync.sh           # 同步脚本 (120 行)
│   │   ├── post-commit       # 提交后 Hook (30 行)
│   │   └── pre-push          # 推送前 Hook (25 行)
│   ├── install.sh            # 安装脚本 (100 行)
│   └── config.template.json  # 配置模板 (30 行)
└── README.md                 # 使用说明
```

### 1.2 安装后目录结构

```
{repo}/
├── .git/
│   └── hooks/
│       ├── post-commit → ../../.multi-git/hooks/post-commit
│       └── pre-push → ../../.multi-git/hooks/pre-push
└── .multi-git/
    ├── config.json
    ├── config.template.json
    └── hooks/
        ├── logger.sh
        ├── config.sh
        ├── sync.sh
        ├── post-commit
        └── pre-push
```

---

## 2. 模块详细设计

### 2.1 logger.sh - 日志模块

**文件**: `hooks/logger.sh`

**职责**: 统一日志输出格式

**函数接口**:

```bash
# 初始化日志
# 参数：$1=logLevel (info|debug|error)
# 返回：无
init_logger()

# 输出信息日志
# 参数：$1=message
# 返回：无
log_info()

# 输出调试日志（仅当 logLevel=debug 时）
# 参数：$1=message
# 返回：无
log_debug()

# 输出错误日志
# 参数：$1=message
# 返回：无
log_error()

# 输出成功标记
# 参数：$1=message
# 返回：无
log_success()

# 输出失败标记
# 参数：$1=message
# 返回：无
log_failure()
```

**实现要点**:
- 所有日志以 `[multi-git]` 前缀开头
- 成功标记使用 ✓，失败标记使用 ✗
- debug 日志仅在 logLevel=debug 时输出

---

### 2.2 config.sh - 配置模块

**文件**: `hooks/config.sh`

**职责**: 读取和解析配置文件

**函数接口**:

```bash
# 加载配置文件
# 参数：无
# 返回：0=成功，1=失败
load_config()

# 获取主仓库名称
# 参数：无
# 返回：主仓库名称（stdout）
get_primary()

# 获取镜像仓库数量
# 参数：无
# 返回：数量（stdout）
get_mirrors_count()

# 获取镜像仓库的 URL
# 参数：$1=index (从 0 开始)
# 返回：URL（stdout）
get_mirror_url()

# 获取镜像仓库的名称
# 参数：$1=index
# 返回：名称（stdout）
get_mirror_name()

# 检查镜像仓库是否启用
# 参数：$1=index
# 返回：0=启用，1=禁用
is_mirror_enabled()

# 检查当前分支是否需要同步
# 参数：$1=index
# 返回：0=需要同步，1=不需要
should_sync_branch()

# 验证配置文件
# 参数：无
# 返回：0=有效，1=无效
validate_config()

# 获取同步模式
# 参数：无
# 返回：auto 或 manual
get_sync_mode()

# 获取重试次数
# 参数：无
# 返回：次数
get_retry_count()

# 获取重试间隔
# 参数：无
# 返回：毫秒
get_retry_delay()
```

**实现要点**:
- 使用 `jq` 解析 JSON（如果可用）
- 如 `jq` 不可用，使用 `grep` + `sed` 降级解析
- 配置文件路径：`$GIT_DIR/../.multi-git/config.json`

---

### 2.3 sync.sh - 同步脚本

**文件**: `hooks/sync.sh`

**职责**: 执行同步逻辑

**函数接口**:

```bash
# 同步到单个镜像仓库
# 参数：$1=url, $2=name, $3=branch
# 返回：0=成功，1=失败
sync_to_mirror()

# 带重试的同步
# 参数：$1=url, $2=name, $3=branch
# 返回：0=成功，1=失败
sync_with_retry()

# 同步所有镜像仓库
# 参数：无
# 返回：0=全部成功，1=部分失败
sync_all_mirrors()

# 输出同步报告
# 参数：$1=success_count, $2=fail_count
# 返回：无
print_report()
```

**实现要点**:
- 串行执行同步，避免并发冲突
- 每个仓库独立重试
- 记录成功/失败数量用于报告

---

### 2.4 post-commit - 提交后 Hook

**文件**: `hooks/post-commit`

**职责**: 提交后触发同步

**流程**:

```bash
#!/bin/bash

# 1. 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 2. 加载日志模块
source "$SCRIPT_DIR/logger.sh"
init_logger

# 3. 加载配置模块
source "$SCRIPT_DIR/config.sh"

# 4. 加载配置
if ! load_config; then
    log_error "无法加载配置文件"
    exit 0  # 不阻塞提交流程
fi

# 5. 检查同步模式
SYNC_MODE=$(get_sync_mode)
if [ "$SYNC_MODE" = "manual" ]; then
    log_debug "手动同步模式，跳过自动同步"
    exit 0
fi

# 6. 获取当前分支
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ -z "$CURRENT_BRANCH" ]; then
    log_debug "不在分支上，跳过同步"
    exit 0
fi

# 7. 执行同步
source "$SCRIPT_DIR/sync.sh"
sync_all_mirrors
```

---

### 2.5 pre-push - 推送前 Hook

**文件**: `hooks/pre-push`

**职责**: 推送前验证配置

**流程**:

```bash
#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/logger.sh"
init_logger
source "$SCRIPT_DIR/config.sh"

# 验证配置文件存在
if ! load_config; then
    log_error "配置文件不存在，请运行 install.sh"
    exit 1
fi

# 验证主仓库配置
PRIMARY=$(get_primary)
if [ -z "$PRIMARY" ]; then
    log_error "未配置主仓库"
    exit 1
fi

log_debug "配置验证通过"
exit 0
```

---

### 2.6 install.sh - 安装脚本

**文件**: `install.sh`

**职责**: 初始化和配置

**流程**:

```bash
#!/bin/bash

# 1. 检查 Git 是否安装
check_git()

# 2. 获取仓库根目录
get_repo_root()

# 3. 创建 .multi-git 目录结构
create_directories()

# 4. 复制配置文件（如不存在）
copy_config()

# 5. 复制 Hook 脚本
copy_hooks()

# 6. 创建 Git Hook 链接
create_hook_links()

# 7. 设置执行权限
set_permissions()

# 8. 验证配置
validate_config()

# 9. 输出使用说明
print_usage()
```

**安装步骤**:

```bash
# 检查 Git
if ! command -v git &> /dev/null; then
    echo "错误：Git 未安装"
    exit 1
fi

# 获取仓库根目录
REPO_ROOT=$(git rev-parse --show-toplevel)

# 创建目录
mkdir -p "$REPO_ROOT/.multi-git/hooks"

# 复制文件
cp hooks/*.sh "$REPO_ROOT/.multi-git/hooks/"
cp hooks/post-commit "$REPO_ROOT/.multi-git/hooks/"
cp hooks/pre-push "$REPO_ROOT/.multi-git/hooks/"
cp config.template.json "$REPO_ROOT/.multi-git/config.template.json"

# 创建配置（如不存在）
if [ ! -f "$REPO_ROOT/.multi-git/config.json" ]; then
    cp "$REPO_ROOT/.multi-git/config.template.json" \
       "$REPO_ROOT/.multi-git/config.json"
fi

# 创建 Hook 链接
GIT_HOOKS="$REPO_ROOT/.git/hooks"
ln -sf ../../.multi-git/hooks/post-commit "$GIT_HOOKS/post-commit"
ln -sf ../../.multi-git/hooks/pre-push "$GIT_HOOKS/pre-push"

# 设置权限
chmod +x "$REPO_ROOT/.multi-git/hooks/"*
chmod +x "$REPO_ROOT/install.sh"

# 验证
echo "安装完成！"
echo "请编辑 .multi-git/config.json 配置仓库"
```

---

### 2.7 config.template.json - 配置模板

**文件**: `config.template.json`

**内容**:

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

## 3. 错误处理详细设计

### 3.1 错误码定义

| 错误码 | 含义 | 处理 |
|--------|------|------|
| 0 | 成功 | 继续执行 |
| 1 | 配置文件错误 | 提示用户修复 |
| 2 | 网络连接失败 | 重试 |
| 3 | Git 命令失败 | 记录错误 |
| 4 | 权限不足 | 提示用户 |

### 3.2 错误处理流程

```
发生错误
    ↓
┌─────────────┐
│ 记录错误日志 │
└──────┬──────┘
       ↓
┌─────────────┐
│ 是否可重试？ │
└──────┬──────┘
       ↓
    ┌──┴──┐
    │ 是  │ 否
    ↓     ↓
┌───────┐ ┌─────────┐
│ 重试  │ │ 输出错误 │
└───────┘ │ 信息    │
          └─────────┘
```

### 3.3 降级策略

**JSON 解析降级**:

```bash
# 优先使用 jq
if command -v jq &> /dev/null; then
    value=$(jq -r ".primary" "$CONFIG_FILE")
else
    # 降级使用 grep + sed
    value=$(grep '"primary"' "$CONFIG_FILE" | sed 's/.*: *"\([^"]*\)".*/\1/')
fi
```

---

## 4. 测试用例

### 4.1 配置加载测试

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 有效配置 | 完整 config.json | 成功加载 |
| 文件不存在 | 无 config.json | 返回错误 |
| 格式错误 | 无效 JSON | 返回错误 |

### 4.2 同步功能测试

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 单仓库同步 | 1 个 mirror | 推送成功 |
| 多仓库同步 | 3 个 mirrors | 全部推送成功 |
| 分支过滤 | 非同步分支 | 跳过同步 |
| 禁用仓库 | enabled=false | 跳过该仓库 |

### 4.3 重试机制测试

| 用例 | 输入 | 预期输出 |
|------|------|---------|
| 首次成功 | 网络正常 | 1 次成功 |
| 重试成功 | 前 2 次失败 | 第 3 次成功 |
| 全部失败 | 持续失败 | 返回错误 |

---

## 5. 性能考虑

### 5.1 同步性能

| 指标 | 目标 | 优化措施 |
|------|------|---------|
| 单仓库同步时间 | < 5 秒 | 并行推送（未来） |
| 脚本启动时间 | < 0.5 秒 | 精简依赖 |
| 内存占用 | < 10MB | Bash 原生 |

### 5.2 并发策略

**当前**: 串行执行（简单可靠）

**未来优化**: 可考虑并行推送多个仓库

---

## 6. 安全考虑

### 6.1 敏感信息

| 信息 | 存储方式 | 说明 |
|------|---------|------|
| 仓库 URL | config.json | 明文（依赖 Git 认证） |
| SSH Key | Git 原生 | 不使用本工具存储 |
| Token | Git 原生 | 不使用本工具存储 |

### 6.2 权限控制

- Hook 脚本设置执行权限：`chmod +x`
- 配置文件不提交到仓库（.gitignore）
- 不存储任何认证信息

---

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本 |

---

## 8. v1.0.1 详细设计（Bugfix）

> **版本**: v1.0.1  
> **日期**: 2026-04-01  
> **场景类型**: 问题修复  
> **Issue ID**: BUGFIX-001

### 8.1 变更概述

v1.0.0 部署验证中发现的 3 个问题及修复方案：

| 问题 | 根因 | 修复方案 | 涉及文件 |
|------|------|---------|---------|
| 缺少同步日志 | 未实现日志持久化 | 新增文件日志 + 轮转策略 | logger.sh |
| OpenClaw 兼容性差 | 路径检测不准确 | 环境检测 + 绝对路径加载 | config.sh |
| 缺少手动同步命令 | 未提供 CLI 工具 | 新增 multi-git.sh | multi-git.sh |

---

### 8.2 logger.sh - 日志模块增强

**变更类型**: 功能增强  
**文件**: `hooks/logger.sh`

#### 8.2.1 新增函数接口

```bash
# 获取日志文件路径
# 参数：无
# 返回：日志文件绝对路径（stdout）
get_log_file_path()

# 写入文件日志
# 参数：$1=level, $2=status, $3=mirror_name, $4=message
# 返回：无
write_log_file()

# 轮转日志文件（保留最近 100 条）
# 参数：无
# 返回：无
rotate_log_file()

# 初始化日志（含文件日志）
# 参数：$1=logLevel
# 返回：无
init_logger()
```

#### 8.2.2 日志文件格式

**文件路径**: `.multi-git/sync.log`

**日志格式**:
```
[YYYY-MM-DD HH:MM:SS] [LEVEL] [STATUS] [MIRROR_NAME] MESSAGE
```

**示例**:
```
[2026-04-01 16:30:45] [INFO] [SUCCESS] [github] 推送到 https://github.com/user/repo.git 成功
[2026-04-01 16:30:46] [INFO] [SUCCESS] [gitee] 推送到 git@gitee.com:user/repo.git 成功
[2026-04-01 16:31:12] [ERROR] [FAILURE] [gitlab] 推送失败：Connection timeout
[2026-04-01 16:31:13] [INFO] [RETRY] [gitlab] 重试 1/3...
[2026-04-01 16:31:15] [INFO] [SUCCESS] [gitlab] 推送成功（重试后）
```

**字段说明**:

| 字段 | 说明 | 示例值 |
|------|------|--------|
| 时间戳 | ISO 8601 格式 | 2026-04-01 16:30:45 |
| LEVEL | 日志级别 | INFO / DEBUG / ERROR |
| STATUS | 同步状态 | SUCCESS / FAILURE / RETRY / SKIP |
| MIRROR_NAME | 仓库标识 | github / gitee / gitlab |
| MESSAGE | 详细信息 | 推送成功/失败原因 |

#### 8.2.3 日志轮转策略

**策略**: 保留最近 100 条记录

**实现**:
```bash
rotate_log_file() {
    local log_file="$MULTI_GIT_DIR/sync.log"
    local max_lines=100
    
    if [ -f "$log_file" ]; then
        local line_count=$(wc -l < "$log_file")
        if [ "$line_count" -gt "$max_lines" ]; then
            # 保留最后 100 条
            tail -n "$max_lines" "$log_file" > "$log_file.tmp"
            mv "$log_file.tmp" "$log_file"
        fi
    fi
}
```

**触发时机**:
- 每次写入日志前检查并轮转
- 避免日志文件无限增长

#### 8.2.4 完整实现

```bash
#!/bin/bash
# logger.sh - 日志模块 v1.0.1

# 全局变量
LOG_LEVEL="${LOG_LEVEL:-info}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MULTI_GIT_DIR="$(dirname "$SCRIPT_DIR")"

# 获取日志文件路径
get_log_file_path() {
    echo "$MULTI_GIT_DIR/sync.log"
}

# 获取当前时间戳
get_timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

# 写入文件日志
write_log_file() {
    local level="$1"
    local status="$2"
    local mirror_name="$3"
    local message="$4"
    local log_file=$(get_log_file_path)
    
    # 轮转日志
    rotate_log_file
    
    # 写入日志
    local timestamp=$(get_timestamp)
    echo "[$timestamp] [$level] [$status] [$mirror_name] $message" >> "$log_file"
}

# 轮转日志文件（保留最近 100 条）
rotate_log_file() {
    local log_file=$(get_log_file_path)
    local max_lines=100
    
    if [ -f "$log_file" ]; then
        local line_count=$(wc -l < "$log_file")
        if [ "$line_count" -gt "$max_lines" ]; then
            tail -n "$max_lines" "$log_file" > "$log_file.tmp"
            mv "$log_file.tmp" "$log_file"
        fi
    fi
}

# 初始化日志
init_logger() {
    # 从配置加载日志级别（如果已加载配置）
    if [ -n "$CONFIG_LOG_LEVEL" ]; then
        LOG_LEVEL="$CONFIG_LOG_LEVEL"
    fi
}

# 输出信息日志
log_info() {
    local message="$1"
    echo "[multi-git] $message"
    if [ "$LOG_LEVEL" != "error" ]; then
        write_log_file "INFO" "-" "-" "$message"
    fi
}

# 输出调试日志
log_debug() {
    local message="$1"
    if [ "$LOG_LEVEL" = "debug" ]; then
        echo "[multi-git] [DEBUG] $message"
        write_log_file "DEBUG" "-" "-" "$message"
    fi
}

# 输出错误日志
log_error() {
    local message="$1"
    echo "[multi-git] [ERROR] $message" >&2
    write_log_file "ERROR" "-" "-" "$message"
}

# 输出成功标记
log_success() {
    local mirror_name="$1"
    local message="$2"
    echo "[multi-git] ✓ $mirror_name: $message"
    write_log_file "INFO" "SUCCESS" "$mirror_name" "$message"
}

# 输出失败标记
log_failure() {
    local mirror_name="$1"
    local message="$2"
    echo "[multi-git] ✗ $mirror_name: $message" >&2
    write_log_file "ERROR" "FAILURE" "$mirror_name" "$message"
}

# 输出重试标记
log_retry() {
    local mirror_name="$1"
    local retry_count="$2"
    local max_retries="$3"
    local message="重试 ${retry_count}/${max_retries}..."
    echo "[multi-git] ↻ $mirror_name: $message"
    write_log_file "INFO" "RETRY" "$mirror_name" "$message"
}

# 输出跳过标记
log_skip() {
    local mirror_name="$1"
    local reason="$2"
    echo "[multi-git] ⊘ $mirror_name: $reason"
    write_log_file "INFO" "SKIP" "$mirror_name" "$reason"
}
```

---

### 8.3 config.sh - OpenClaw 环境检测

**变更类型**: 功能增强  
**文件**: `hooks/config.sh`

#### 8.3.1 新增函数接口

```bash
# 检测是否在 OpenClaw 环境中
# 参数：无
# 返回：0=OpenClaw 环境，1=非 OpenClaw 环境
is_openclaw_env()

# 获取 OpenClaw 工作区路径
# 参数：无
# 返回：路径（stdout）
get_openclaw_workspace()

# 获取脚本目录（兼容 OpenClaw）
# 参数：无
# 返回：绝对路径（stdout）
get_script_dir()

# 加载模块（兼容 OpenClaw）
# 参数：$1=module_name
# 返回：0=成功，1=失败
source_module()
```

#### 8.3.2 OpenClaw 环境检测逻辑

**检测特征**:

| 特征 | 检测方法 | 说明 |
|------|---------|------|
| 环境变量 | `$OPENCLAW_WORKSPACE` | OpenClaw 工作区路径 |
| 工作区路径 | 包含 `~/.openclaw/workspace` | 典型 OpenClaw 路径 |
| Git 配置 | `git config openclaw.enabled` | OpenClaw Git 扩展标记 |

**实现**:
```bash
is_openclaw_env() {
    # 检测环境变量
    if [ -n "$OPENCLAW_WORKSPACE" ]; then
        return 0
    fi
    
    # 检测工作区路径
    local workspace=$(git rev-parse --show-toplevel 2>/dev/null)
    if [[ "$workspace" == *".openclaw/workspace"* ]]; then
        return 0
    fi
    
    # 检测 Git 配置
    if git config --get openclaw.enabled &>/dev/null; then
        return 0
    fi
    
    return 1
}

get_openclaw_workspace() {
    if [ -n "$OPENCLAW_WORKSPACE" ]; then
        echo "$OPENCLAW_WORKSPACE"
    else
        # 尝试从路径推断
        local workspace=$(git rev-parse --show-toplevel 2>/dev/null)
        echo "$workspace"
    fi
}

# 获取脚本目录（兼容 OpenClaw）
get_script_dir() {
    local script_dir=""
    
    # 方法 1: 使用 BASH_SOURCE
    if [ -n "${BASH_SOURCE[0]}" ]; then
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    fi
    
    # 方法 2: OpenClaw 环境下使用环境变量
    if [ -z "$script_dir" ] && is_openclaw_env; then
        script_dir="$(get_openclaw_workspace)/.multi-git/hooks"
    fi
    
    # 方法 3: 降级使用 PWD
    if [ -z "$script_dir" ]; then
        script_dir="$(pwd)/.multi-git/hooks"
    fi
    
    echo "$script_dir"
}

# 加载模块（兼容 OpenClaw）
source_module() {
    local module="$1"
    local script_dir=$(get_script_dir)
    local module_path="$script_dir/$module"
    
    # 使用绝对路径加载
    if [ -f "$module_path" ]; then
        source "$module_path"
        return 0
    else
        echo "[multi-git] [ERROR] 无法加载模块：$module" >&2
        return 1
    fi
}
```

#### 8.3.3 环境变量支持

**新增环境变量**:

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `OPENCLAW_WORKSPACE` | OpenClaw 工作区路径 | 自动检测 |
| `MULTI_GIT_LOG_FILE` | 自定义日志文件路径 | `.multi-git/sync.log` |
| `MULTI_GIT_CONFIG_FILE` | 自定义配置文件路径 | `.multi-git/config.json` |
| `MULTI_GIT_DEBUG` | 调试模式（1=启用） | 0 |

**使用示例**:
```bash
# OpenClaw 环境中设置
export OPENCLAW_WORKSPACE=~/.openclaw/workspace
export MULTI_GIT_DEBUG=1

# 执行 git commit 时自动使用这些环境变量
```

---

### 8.4 multi-git.sh - CLI 命令

**变更类型**: 新增功能  
**文件**: `multi-git.sh`

#### 8.4.1 命令结构

```
multi-git <command> [options]

命令:
  sync      手动触发同步到所有镜像仓库
  status    显示同步状态和配置
  config    显示或编辑配置
  log       查看同步日志
  help      显示帮助信息

选项:
  -v, --verbose    详细输出（debug 模式）
  -q, --quiet      静默模式（仅错误输出）
  -h, --help       显示帮助
```

#### 8.4.2 函数接口

```bash
# 主入口
# 参数：$@=命令行参数
# 返回：0=成功，1=失败
main()

# sync 命令
# 参数：无
# 返回：0=全部成功，1=部分失败
cmd_sync()

# status 命令
# 参数：无
# 返回：0=成功
cmd_status()

# config 命令
# 参数：无
# 返回：0=成功
cmd_config()

# log 命令
# 参数：$1=行数（默认 20）
# 返回：0=成功
cmd_log()

# help 命令
# 参数：无
# 返回：0=成功
cmd_help()
```

#### 8.4.3 完整实现

```bash
#!/bin/bash
# multi-git.sh - CLI 命令 v1.0.1
# 用法：./multi-git.sh <command> [options]

set -e

# 获取脚本目录（绝对路径）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/hooks"

# 加载模块
source "$HOOKS_DIR/logger.sh"
source "$HOOKS_DIR/config.sh"

# 显示帮助
cmd_help() {
    cat << EOF
multi-git - 多 Git 仓库管理工具 v1.0.1

用法:
  multi-git <command> [options]

命令:
  sync      手动触发同步到所有镜像仓库
  status    显示同步状态和配置
  config    显示配置文件路径
  log       查看同步日志
  help      显示帮助信息

选项:
  -v, --verbose    详细输出（debug 模式）
  -q, --quiet      静默模式（仅错误输出）
  -h, --help       显示帮助

示例:
  ./multi-git.sh sync           # 手动同步
  ./multi-git.sh status         # 查看状态
  ./multi-git.sh log -n 50      # 查看最近 50 条日志
  ./multi-git.sh help           # 显示帮助

EOF
}

# sync 命令 - 手动触发同步
cmd_sync() {
    init_logger
    
    log_info "开始手动同步到镜像仓库..."
    
    # 加载配置
    if ! load_config; then
        log_error "无法加载配置文件"
        return 1
    fi
    
    # 检查同步模式
    SYNC_MODE=$(get_sync_mode)
    if [ "$SYNC_MODE" = "manual" ]; then
        log_info "手动同步模式，执行同步..."
    fi
    
    # 获取当前分支
    CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
    if [ -z "$CURRENT_BRANCH" ]; then
        log_error "不在分支上，无法同步"
        return 1
    fi
    
    log_debug "当前分支：$CURRENT_BRANCH"
    
    # 执行同步
    source "$HOOKS_DIR/sync.sh"
    sync_all_mirrors
}

# status 命令 - 显示状态
cmd_status() {
    init_logger
    
    echo "=== multi-git 状态 ==="
    echo ""
    
    # 检查配置
    if [ -f ".multi-git/config.json" ]; then
        echo "✓ 配置文件：已存在"
        
        if load_config; then
            echo "✓ 配置加载：成功"
            echo ""
            echo "主仓库：$(get_primary)"
            echo "镜像仓库数量：$(get_mirrors_count)"
            echo "同步模式：$(get_sync_mode)"
            echo "重试次数：$(get_retry_count)"
            echo "日志级别：$LOG_LEVEL"
        else
            echo "✗ 配置加载：失败"
        fi
    else
        echo "✗ 配置文件：不存在"
        echo "  请运行 install.sh 初始化"
    fi
    
    echo ""
    
    # 检查 Hook
    if [ -L ".git/hooks/post-commit" ]; then
        echo "✓ post-commit Hook：已安装"
    else
        echo "✗ post-commit Hook：未安装"
    fi
    
    if [ -L ".git/hooks/pre-push" ]; then
        echo "✓ pre-push Hook：已安装"
    else
        echo "✗ pre-push Hook：未安装"
    fi
    
    echo ""
    
    # 检查日志文件
    local log_file=$(get_log_file_path)
    if [ -f "$log_file" ]; then
        local log_lines=$(wc -l < "$log_file")
        echo "✓ 日志文件：$log_file ($log_lines 条)"
    else
        echo "ℹ 日志文件：尚未生成"
    fi
}

# config 命令 - 显示配置
cmd_config() {
    local config_file=".multi-git/config.json"
    
    if [ -f "$config_file" ]; then
        echo "配置文件路径：$config_file"
        echo ""
        echo "内容:"
        cat "$config_file"
    else
        echo "配置文件不存在：$config_file"
        echo "请运行 install.sh 初始化"
        return 1
    fi
}

# log 命令 - 查看日志
cmd_log() {
    local lines=20
    local follow=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--lines)
                lines="$2"
                shift 2
                ;;
            -f|--follow)
                follow=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    local log_file=$(get_log_file_path)
    
    if [ -f "$log_file" ]; then
        if [ "$follow" = true ]; then
            tail -f "$log_file"
        else
            tail -n "$lines" "$log_file"
        fi
    else
        echo "日志文件不存在：$log_file"
        echo "执行同步操作后会生成日志"
        return 1
    fi
}

# 主入口
main() {
    if [ $# -eq 0 ]; then
        cmd_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        sync)
            cmd_sync "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        config)
            cmd_config "$@"
            ;;
        log)
            cmd_log "$@"
            ;;
        help|-h|--help)
            cmd_help
            ;;
        *)
            echo "[multi-git] [ERROR] 未知命令：$command"
            echo "运行 'multi-git help' 查看帮助"
            exit 1
            ;;
    esac
}

# 执行主入口
main "$@"
```

---

### 8.5 接口定义汇总

#### 8.5.1 logger.sh 接口

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `get_log_file_path()` | 无 | string | 日志文件路径 |
| `get_timestamp()` | 无 | string | 当前时间戳 |
| `write_log_file(level, status, name, msg)` | 4 个参数 | 无 | 写入文件日志 |
| `rotate_log_file()` | 无 | 无 | 轮转日志 |
| `init_logger()` | 无 | 无 | 初始化日志 |
| `log_info(msg)` | 1 个参数 | 无 | 信息日志 |
| `log_debug(msg)` | 1 个参数 | 无 | 调试日志 |
| `log_error(msg)` | 1 个参数 | 无 | 错误日志 |
| `log_success(name, msg)` | 2 个参数 | 无 | 成功标记 |
| `log_failure(name, msg)` | 2 个参数 | 无 | 失败标记 |
| `log_retry(name, count, max)` | 3 个参数 | 无 | 重试标记 |
| `log_skip(name, reason)` | 2 个参数 | 无 | 跳过标记 |

#### 8.5.2 config.sh 接口

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `is_openclaw_env()` | 无 | 0/1 | 检测 OpenClaw 环境 |
| `get_openclaw_workspace()` | 无 | string | 工作区路径 |
| `get_script_dir()` | 无 | string | 脚本目录 |
| `source_module(name)` | 1 个参数 | 0/1 | 加载模块 |
| `load_config()` | 无 | 0/1 | 加载配置 |
| `get_primary()` | 无 | string | 主仓库名称 |
| `get_mirrors_count()` | 无 | int | 镜像数量 |
| `get_mirror_url(index)` | 1 个参数 | string | 镜像 URL |
| `get_mirror_name(index)` | 1 个参数 | string | 镜像名称 |
| `is_mirror_enabled(index)` | 1 个参数 | 0/1 | 是否启用 |
| `should_sync_branch(index)` | 1 个参数 | 0/1 | 是否同步分支 |
| `validate_config()` | 无 | 0/1 | 验证配置 |
| `get_sync_mode()` | 无 | string | 同步模式 |
| `get_retry_count()` | 无 | int | 重试次数 |
| `get_retry_delay()` | 无 | int | 重试间隔 |

#### 8.5.3 multi-git.sh 接口

| 命令 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `sync` | 无 | 0/1 | 手动同步 |
| `status` | 无 | 0 | 显示状态 |
| `config` | 无 | 0/1 | 显示配置 |
| `log` | `-n <lines>`, `-f` | 0/1 | 查看日志 |
| `help` | 无 | 0 | 显示帮助 |

---

### 8.6 验收检查点（12 项）

#### 8.6.1 同步日志功能（4 项）

| # | 检查点 | 验收方法 | 预期结果 |
|---|--------|---------|---------|
| 1 | 日志文件创建 | 执行同步后检查 `.multi-git/sync.log` | 文件存在且非空 |
| 2 | 日志格式正确 | 查看日志内容 | 格式为 `[时间] [级别] [状态] [仓库] 消息` |
| 3 | 日志轮转生效 | 模拟生成 150 条日志 | 文件保留最近 100 条 |
| 4 | 日志级别控制 | 设置 `logLevel=error` 后同步 | 仅 ERROR 级别写入文件 |

#### 8.6.2 OpenClaw 兼容性（4 项）

| # | 检查点 | 验收方法 | 预期结果 |
|---|--------|---------|---------|
| 5 | 环境变量检测 | 设置 `OPENCLAW_WORKSPACE` 后执行 | 正确识别 OpenClaw 环境 |
| 6 | 绝对路径加载 | 在 OpenClaw 工作区执行 git commit | 模块正确加载，无路径错误 |
| 7 | post-commit 触发 | 在 OpenClaw 环境中 git commit | Hook 稳定触发 |
| 8 | 降级路径检测 | 清除环境变量后执行 | 使用 BASH_SOURCE 降级检测 |

#### 8.6.3 CLI 命令功能（4 项）

| # | 检查点 | 验收方法 | 预期结果 |
|---|--------|---------|---------|
| 9 | sync 命令可用 | 执行 `./multi-git.sh sync` | 手动触发同步，输出报告 |
| 10 | status 命令可用 | 执行 `./multi-git.sh status` | 显示配置、Hook、日志状态 |
| 11 | log 命令可用 | 执行 `./multi-git.sh log -n 10` | 显示最近 10 条日志 |
| 12 | help 命令可用 | 执行 `./multi-git.sh help` | 显示完整帮助信息 |

---

### 8.7 版本历史（v1.0.1）

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| v1.0.0 | 2026-04-01 | 初始版本 |
| v1.0.1 | 2026-04-01 | Bugfix：同步日志 + OpenClaw 兼容 + sync 命令 |

**v1.0.1 变更详情**:
- ✅ 新增 logger.sh 文件日志功能
- ✅ 新增日志轮转策略（保留 100 条）
- ✅ 新增 config.sh OpenClaw 环境检测
- ✅ 新增环境变量支持
- ✅ 新增 multi-git.sh CLI 工具
- ✅ 新增 5 个 CLI 命令（sync/status/config/log/help）
- ✅ 新增 12 项验收检查点

---

*本文档由 clawdevflow 流程引擎生成，openclaw-ouyp 审阅*
