#!/bin/bash
# config.sh - 配置模块 v1.0.1
# 读取和解析配置文件，支持 OpenClaw 环境检测

# 配置文件路径
CONFIG_FILE=""

# 支持环境变量自定义
if [ -n "$MULTI_GIT_CONFIG_FILE" ]; then
    CONFIG_FILE="$MULTI_GIT_CONFIG_FILE"
fi

# ==================== OpenClaw 环境检测 ====================

# 检测是否在 OpenClaw 环境中
# 返回：0=OpenClaw 环境，1=非 OpenClaw 环境
is_openclaw_env() {
    # 检测环境变量
    if [ -n "$OPENCLAW_WORKSPACE" ]; then
        return 0
    fi
    
    # 检测工作区路径
    local workspace
    workspace=$(git rev-parse --show-toplevel 2>/dev/null)
    if [[ "$workspace" == *".openclaw/workspace"* ]]; then
        return 0
    fi
    
    # 检测 Git 配置
    if git config --get openclaw.enabled &>/dev/null; then
        return 0
    fi
    
    return 1
}

# 获取 OpenClaw 工作区路径
# 返回：路径（stdout）
get_openclaw_workspace() {
    if [ -n "$OPENCLAW_WORKSPACE" ]; then
        echo "$OPENCLAW_WORKSPACE"
    else
        # 尝试从路径推断
        local workspace
        workspace=$(git rev-parse --show-toplevel 2>/dev/null)
        echo "$workspace"
    fi
}

# 获取脚本目录（兼容 OpenClaw）
# 返回：绝对路径（stdout）
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
# 参数：$1=module_name
# 返回：0=成功，1=失败
source_module() {
    local module="$1"
    local script_dir
    script_dir=$(get_script_dir)
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

# ==================== 配置管理 ====================

# 获取配置文件路径
get_config_path() {
    # 支持环境变量自定义
    if [ -n "$MULTI_GIT_CONFIG_FILE" ]; then
        echo "$MULTI_GIT_CONFIG_FILE"
        return
    fi
    
    local git_dir="${GIT_DIR:-.git}"
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
    if [ -n "$repo_root" ]; then
        echo "$repo_root/.multi-git/config.json"
    else
        echo "$git_dir/../.multi-git/config.json"
    fi
}

# 加载配置文件
# 返回：0=成功，1=失败
load_config() {
    CONFIG_FILE=$(get_config_path)
    
    if [ ! -f "$CONFIG_FILE" ]; then
        return 1
    fi
    
    # 验证 JSON 格式（如果有 jq）
    if command -v jq &> /dev/null; then
        if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
            return 1
        fi
    fi
    
    return 0
}

# 获取主仓库名称
# 返回：主仓库名称（stdout）
get_primary() {
    if command -v jq &> /dev/null; then
        jq -r '.primary // "origin"' "$CONFIG_FILE"
    else
        grep '"primary"' "$CONFIG_FILE" | sed 's/.*: *"\([^"]*\)".*/\1/' | head -1
    fi
}

# 获取镜像仓库数量
# 返回：数量（stdout）
get_mirrors_count() {
    if command -v jq &> /dev/null; then
        jq '.mirrors | length' "$CONFIG_FILE"
    else
        grep -c '"name"' "$CONFIG_FILE" 2>/dev/null || echo "0"
    fi
}

# 获取镜像仓库的 URL
# 参数：$1=index (从 0 开始)
# 返回：URL（stdout）
get_mirror_url() {
    local index=$1
    if command -v jq &> /dev/null; then
        jq -r ".mirrors[$index].url" "$CONFIG_FILE"
    else
        # 简化处理，仅支持第一个
        grep '"url"' "$CONFIG_FILE" | sed 's/.*: *"\([^"]*\)".*/\1/' | head -1
    fi
}

# 获取镜像仓库的名称
# 参数：$1=index
# 返回：名称（stdout）
get_mirror_name() {
    local index=$1
    if command -v jq &> /dev/null; then
        jq -r ".mirrors[$index].name" "$CONFIG_FILE"
    else
        grep '"name"' "$CONFIG_FILE" | sed 's/.*: *"\([^"]*\)".*/\1/' | head -1
    fi
}

# 检查镜像仓库是否启用
# 参数：$1=index
# 返回：0=启用，1=禁用
is_mirror_enabled() {
    local index=$1
    if command -v jq &> /dev/null; then
        local enabled
        enabled=$(jq -r ".mirrors[$index].enabled" "$CONFIG_FILE")
        if [ "$enabled" = "true" ]; then
            return 0
        fi
    else
        # 默认启用
        return 0
    fi
    return 1
}

# 检查当前分支是否需要同步
# 参数：$1=index
# 返回：0=需要同步，1=不需要
should_sync_branch() {
    local index=$1
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
    
    if [ -z "$current_branch" ]; then
        return 1
    fi
    
    if command -v jq &> /dev/null; then
        local branches
        branches=$(jq -r ".mirrors[$index].branches[]" "$CONFIG_FILE" 2>/dev/null)
        if [ -z "$branches" ]; then
            # 未配置 branches，默认同步 master/main
            if [ "$current_branch" = "master" ] || [ "$current_branch" = "main" ]; then
                return 0
            fi
            return 1
        fi
        while IFS= read -r branch; do
            if [ "$branch" = "$current_branch" ]; then
                return 0
            fi
        done <<< "$branches"
    else
        # 简化处理，默认同步
        return 0
    fi
    
    return 1
}

# 验证配置文件
# 返回：0=有效，1=无效
validate_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        return 1
    fi
    
    # 检查 primary 字段
    local primary
    primary=$(get_primary)
    if [ -z "$primary" ]; then
        return 1
    fi
    
    return 0
}

# 获取同步模式
# 返回：auto 或 manual
get_sync_mode() {
    if command -v jq &> /dev/null; then
        jq -r '.syncMode // "auto"' "$CONFIG_FILE"
    else
        grep '"syncMode"' "$CONFIG_FILE" | sed 's/.*: *"\([^"]*\)".*/\1/' | head -1
    fi
}

# 获取重试次数
# 返回：次数
get_retry_count() {
    if command -v jq &> /dev/null; then
        jq -r '.retryCount // 3' "$CONFIG_FILE"
    else
        echo "3"
    fi
}

# 获取重试间隔（毫秒）
# 返回：毫秒
get_retry_delay() {
    if command -v jq &> /dev/null; then
        jq -r '.retryDelay // 1000' "$CONFIG_FILE"
    else
        echo "1000"
    fi
}

# 获取日志级别
# 返回：info/debug/error
get_log_level() {
    if command -v jq &> /dev/null; then
        jq -r '.logLevel // "info"' "$CONFIG_FILE"
    else
        echo "info"
    fi
}
