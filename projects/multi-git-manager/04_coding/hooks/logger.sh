#!/bin/bash
# logger.sh - 日志模块 v1.0.1
# 统一日志输出格式，支持文件日志和轮转

# 日志级别
LOG_LEVEL="${LOG_LEVEL:-info}"

# 脚本目录（由调用者设置）
SCRIPT_DIR="${SCRIPT_DIR:-}"

# 多 Git 目录
MULTI_GIT_DIR=""

# 获取多 Git 目录
get_multi_git_dir() {
    if [ -n "$MULTI_GIT_DIR" ]; then
        echo "$MULTI_GIT_DIR"
        return
    fi
    
    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
    if [ -n "$repo_root" ]; then
        MULTI_GIT_DIR="$repo_root/.multi-git"
    else
        MULTI_GIT_DIR="$(dirname "$SCRIPT_DIR")"
    fi
    echo "$MULTI_GIT_DIR"
}

# 获取日志文件路径
# 返回：日志文件绝对路径（stdout）
get_log_file_path() {
    # 支持环境变量自定义
    if [ -n "$MULTI_GIT_LOG_FILE" ]; then
        echo "$MULTI_GIT_LOG_FILE"
        return
    fi
    
    local multi_git_dir
    multi_git_dir=$(get_multi_git_dir)
    echo "$multi_git_dir/sync.log"
}

# 获取当前时间戳
# 返回：ISO 8601 格式时间戳（stdout）
get_timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

# 轮转日志文件（保留最近 100 条）
# 返回：无
rotate_log_file() {
    local log_file
    log_file=$(get_log_file_path)
    local max_lines=100
    
    if [ -f "$log_file" ]; then
        local line_count
        line_count=$(wc -l < "$log_file")
        if [ "$line_count" -gt "$max_lines" ]; then
            tail -n "$max_lines" "$log_file" > "$log_file.tmp"
            mv "$log_file.tmp" "$log_file"
        fi
    fi
}

# 写入文件日志
# 参数：$1=level, $2=status, $3=mirror_name, $4=message
# 返回：无
write_log_file() {
    local level="$1"
    local status="$2"
    local mirror_name="$3"
    local message="$4"
    local log_file
    log_file=$(get_log_file_path)
    
    # 确保日志目录存在
    local log_dir
    log_dir=$(dirname "$log_file")
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir" 2>/dev/null || return
    fi
    
    # 轮转日志
    rotate_log_file
    
    # 写入日志
    local timestamp
    timestamp=$(get_timestamp)
    echo "[$timestamp] [$level] [$status] [$mirror_name] $message" >> "$log_file"
}

# 初始化日志
# 参数：$1=logLevel (可选)
# 返回：无
init_logger() {
    if [ -n "$1" ]; then
        LOG_LEVEL="$1"
    fi
    
    # 从配置加载日志级别（如果已加载配置）
    if [ -n "$CONFIG_LOG_LEVEL" ]; then
        LOG_LEVEL="$CONFIG_LOG_LEVEL"
    fi
    
    # 环境变量覆盖
    if [ -n "$MULTI_GIT_DEBUG" ] && [ "$MULTI_GIT_DEBUG" = "1" ]; then
        LOG_LEVEL="debug"
    fi
}

# 输出信息日志
# 参数：$1=message
log_info() {
    local message="$1"
    echo "[multi-git] $message"
    if [ "$LOG_LEVEL" != "error" ]; then
        write_log_file "INFO" "-" "-" "$message"
    fi
}

# 输出调试日志（仅当 logLevel=debug 时）
# 参数：$1=message
log_debug() {
    local message="$1"
    if [ "$LOG_LEVEL" = "debug" ]; then
        echo "[multi-git] [DEBUG] $message"
        write_log_file "DEBUG" "-" "-" "$message"
    fi
}

# 输出错误日志
# 参数：$1=message
log_error() {
    local message="$1"
    echo "[multi-git] [ERROR] $message" >&2
    write_log_file "ERROR" "-" "-" "$message"
}

# 输出成功标记
# 参数：$1=mirror_name, $2=message
log_success() {
    local mirror_name="$1"
    local message="$2"
    echo "[multi-git] ✓ $mirror_name: $message"
    write_log_file "INFO" "SUCCESS" "$mirror_name" "$message"
}

# 输出失败标记
# 参数：$1=mirror_name, $2=message
log_failure() {
    local mirror_name="$1"
    local message="$2"
    echo "[multi-git] ✗ $mirror_name: $message" >&2
    write_log_file "ERROR" "FAILURE" "$mirror_name" "$message"
}

# 输出重试标记
# 参数：$1=mirror_name, $2=retry_count, $3=max_retries
log_retry() {
    local mirror_name="$1"
    local retry_count="$2"
    local max_retries="$3"
    local message="重试 ${retry_count}/${max_retries}..."
    echo "[multi-git] ↻ $mirror_name: $message"
    write_log_file "INFO" "RETRY" "$mirror_name" "$message"
}

# 输出跳过标记
# 参数：$1=mirror_name, $2=reason
log_skip() {
    local mirror_name="$1"
    local reason="$2"
    echo "[multi-git] ⊘ $mirror_name: $reason"
    write_log_file "INFO" "SKIP" "$mirror_name" "$reason"
}
