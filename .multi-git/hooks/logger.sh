#!/bin/bash
# logger.sh - 日志模块
# 统一日志输出格式

# 日志级别
LOG_LEVEL="${LOG_LEVEL:-info}"

# 初始化日志
# 参数：$1=logLevel (info|debug|error)
init_logger() {
    if [ -n "$1" ]; then
        LOG_LEVEL="$1"
    fi
}

# 输出信息日志
# 参数：$1=message
log_info() {
    echo "[multi-git] $1"
}

# 输出调试日志（仅当 logLevel=debug 时）
# 参数：$1=message
log_debug() {
    if [ "$LOG_LEVEL" = "debug" ]; then
        echo "[multi-git] [DEBUG] $1"
    fi
}

# 输出错误日志
# 参数：$1=message
log_error() {
    echo "[multi-git] [ERROR] $1" >&2
}

# 输出成功标记
# 参数：$1=message
log_success() {
    echo "[multi-git] ✓ $1"
}

# 输出失败标记
# 参数：$1=message
log_failure() {
    echo "[multi-git] ✗ $1" >&2
}
