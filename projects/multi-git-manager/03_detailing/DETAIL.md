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

*本文档由 clawdevflow 流程引擎生成，openclaw-ouyp 审阅*
