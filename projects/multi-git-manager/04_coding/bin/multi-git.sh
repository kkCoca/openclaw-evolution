#!/bin/bash
# multi-git.sh - CLI 命令 v1.0.1
# 用法：./multi-git.sh <command> [options]

# 获取脚本目录（绝对路径）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 智能查找 hooks 目录
# 场景 1: 脚本在 bin/ 目录 → hooks 在上一级
# 场景 2: 脚本在仓库根目录 → hooks 在 .multi-git/hooks/
find_hooks_dir() {
    local script_dir="$1"
    local basename
    basename="$(basename "$script_dir")"
    
    # 场景 1: 在 bin 目录中
    if [ "$basename" = "bin" ] && [ -d "$(dirname "$script_dir")/hooks" ]; then
        echo "$(dirname "$script_dir")/hooks"
        return
    fi
    
    # 场景 2: 在仓库根目录，hooks 在 .multi-git/hooks/
    if [ -d "$script_dir/.multi-git/hooks" ]; then
        echo "$script_dir/.multi-git/hooks"
        return
    fi
    
    # 降级：尝试上一级
    if [ -d "$(dirname "$script_dir")/hooks" ]; then
        echo "$(dirname "$script_dir")/hooks"
        return
    fi
    
    echo ""
}

HOOKS_DIR="$(find_hooks_dir "$SCRIPT_DIR")"

if [ -z "$HOOKS_DIR" ]; then
    echo "[multi-git] [ERROR] 无法找到 hooks 目录" >&2
    exit 1
fi

# 加载模块
source "$HOOKS_DIR/logger.sh"
source "$HOOKS_DIR/config.sh"

# ==================== 命令实现 ====================

# 显示帮助
cmd_help() {
    cat << EOF
multi-git - 多 Git 仓库管理工具 v1.0.1

用法:
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
    local log_file
    log_file=$(get_log_file_path)
    if [ -f "$log_file" ]; then
        local log_lines
        log_lines=$(wc -l < "$log_file")
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
    
    local log_file
    log_file=$(get_log_file_path)
    
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

# ==================== 主入口 ====================

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
