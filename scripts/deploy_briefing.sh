#!/bin/bash
#
# deploy_briefing.sh - 健壮的简报分发脚本
# 功能：将万象空间研发成果自动同步到 Obsidian 库
#
# 用法：
#   ./deploy_briefing.sh [source_dir] [obsidian_target]
#
# 示例：
#   ./deploy_briefing.sh /home/ouyp/.openclaw/workspace "/home/ouyp/Documents/Obsidian Vault"
#

set -euo pipefail

# ============ 配置 ============
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="${SCRIPT_DIR}/.."
DEFAULT_OBSIDIAN_ROOT="/home/ouyp/Documents/Obsidian Vault"
OBSIDIAN_TARGET="${2:-$DEFAULT_OBSIDIAN_ROOT}"
SOURCE_DIR="${1:-$WORKSPACE_ROOT}"

# 日志颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============ 工具函数 ============
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查目录是否存在且可写
check_directory() {
    local dir="$1"
    local name="$2"
    
    if [[ ! -d "$dir" ]]; then
        log_error "$name 目录不存在：$dir"
        return 1
    fi
    
    if [[ ! -w "$dir" ]]; then
        log_error "$name 目录不可写：$dir"
        return 1
    fi
    
    log_info "$name 目录验证通过：$dir"
    return 0
}

# 检查软链接
check_symlink() {
    local link="$1"
    local target="$2"
    
    if [[ -L "$link" ]]; then
        local actual_target=$(readlink -f "$link")
        if [[ "$actual_target" == "$target" ]]; then
            log_success "软链接验证通过：$link -> $target"
            return 0
        else
            log_warning "软链接目标不匹配：$link -> $actual_target (期望：$target)"
            return 1
        fi
    else
        log_warning "软链接不存在：$link"
        return 1
    fi
}

# 同步单个文件（带版本检查）
sync_file() {
    local src="$1"
    local dst="$2"
    
    # 如果目标文件不存在，直接复制
    if [[ ! -f "$dst" ]]; then
        cp "$src" "$dst"
        log_success "新建：$(basename "$dst")"
        return 0
    fi
    
    # 检查源文件是否更新（通过修改时间）
    local src_mtime=$(stat -c %Y "$src")
    local dst_mtime=$(stat -c %Y "$dst")
    
    if [[ "$src_mtime" -gt "$dst_mtime" ]]; then
        cp "$src" "$dst"
        log_success "更新：$(basename "$dst")"
        return 0
    else
        log_info "跳过（未变更）：$(basename "$dst")"
        return 0
    fi
}

# 同步待办事项到 Obsidian
sync_tasks_to_obsidian() {
    local workspace_tasks="$SOURCE_DIR/MEMORY.md"
    local obsidian_tasks_dir="$OBSIDIAN_TARGET/AI+/待办事项"
    
    log_info "正在同步待办事项到 Obsidian..."
    
    # 确保 Obsidian 目标目录存在
    mkdir -p "$obsidian_tasks_dir"
    
    # 解析 MEMORY.md 中的待办事项表格，生成独立文件
    # 这里使用简单的 grep + awk 提取 P0/P1 任务
    local task_count=0
    
    # 提取 P0 任务（未完成）
    grep -E "^\| \*\*" "$workspace_tasks" | grep "🟡 待处理" | while read -r line; do
        # 提取任务名称（去掉 ** 和状态标记）
        local task_name=$(echo "$line" | awk -F'|' '{print $2}' | sed 's/\*\*//g' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        local task_date=$(echo "$line" | awk -F'|' '{print $3}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        if [[ -n "$task_name" && "$task_name" != "任务" ]]; then
            # 生成文件名（从任务名称提取日期）
            local file_date=$(echo "$task_date" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            local safe_name=$(echo "$task_name" | sed 's/[\/\\:*?"<>|]/_/g')
            local target_file="$obsidian_tasks_dir/${file_date}-${safe_name}.md"
            
            # 如果文件不存在，创建模板
            if [[ ! -f "$target_file" ]]; then
                cat > "$target_file" << EOF
# $task_name

> **创建时间**: $task_date  
> **状态**: 🟡 待处理  
> **优先级**: P0

## 任务描述

（在此填写任务详细描述）

## 执行步骤

1. [ ] 步骤 1
2. [ ] 步骤 2
3. [ ] 步骤 3

## 执行记录

| 时间 | 动作 | 结果 |
|------|------|------|
| | | |

## 备注

EOF
                log_success "创建任务文件：$(basename "$target_file")"
                ((task_count++)) || true
            fi
        fi
    done
    
    log_info "待办事项同步完成"
}

# 同步实验报告到 Obsidian
sync_research_to_obsidian() {
    local workspace_research="$SOURCE_DIR/research/insights"
    local obsidian_research_dir="$OBSIDIAN_TARGET/AI+/研究洞察"
    
    log_info "正在同步研究洞察到 Obsidian..."
    
    # 确保 Obsidian 目标目录存在
    mkdir -p "$obsidian_research_dir"
    
    # 同步最近 7 天的报告
    find "$workspace_research" -name "*.md" -type f -mtime -7 | while read -r src_file; do
        local filename=$(basename "$src_file")
        local dst_file="$obsidian_research_dir/$filename"
        sync_file "$src_file" "$dst_file"
    done
    
    log_info "研究洞察同步完成"
}

# 生成同步报告
generate_sync_report() {
    local report_file="$SOURCE_DIR/logs/sync-report-$(date +%Y%m%d-%H%M%S).md"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# 资产化同步报告

**同步时间**: $(date '+%Y-%m-%d %H:%M:%S')  
**源目录**: $SOURCE_DIR  
**目标目录**: $OBSIDIAN_TARGET

## 同步内容

### 待办事项
- 源文件：MEMORY.md
- 目标目录：AI+/待办事项/

### 研究洞察
- 源目录：research/insights/
- 目标目录：AI+/研究洞察/

## 验证结果

- [ ] 软链接检查通过
- [ ] 目录权限检查通过
- [ ] 文件同步完成
- [ ] 同步报告生成

## 备注

（如有异常，在此记录）

EOF
    
    log_success "同步报告生成：$report_file"
}

# ============ 主流程 ============
main() {
    log_info "========================================="
    log_info "资产化部署脚本启动"
    log_info "========================================="
    log_info "源目录：$SOURCE_DIR"
    log_info "目标目录：$OBSIDIAN_TARGET"
    log_info "========================================="
    
    # 1. 预检：目录验证
    log_info "[1/5] 预检：目录验证..."
    check_directory "$SOURCE_DIR" "工作空间" || exit 1
    check_directory "$OBSIDIAN_TARGET" "Obsidian 库" || exit 1
    
    # 2. 检查软链接（可选）
    log_info "[2/5] 检查：软链接状态..."
    check_symlink "$WORKSPACE_ROOT/universe-bridge" "/home/ouyp/Learning/Practice/openclaw-universe" || true
    
    # 3. 同步待办事项
    log_info "[3/5] 同步：待办事项..."
    sync_tasks_to_obsidian
    
    # 4. 同步研究洞察
    log_info "[4/5] 同步：研究洞察..."
    sync_research_to_obsidian
    
    # 5. 生成同步报告
    log_info "[5/5] 生成：同步报告..."
    generate_sync_report
    
    log_success "========================================="
    log_success "资产化部署完成"
    log_success "========================================="
}

# 执行主流程
main "$@"
