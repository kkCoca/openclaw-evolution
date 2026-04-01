#!/bin/bash
# sync.sh - 同步脚本 v1.0.1
# 执行同步逻辑，集成文件日志

# 同步计数器
SUCCESS_COUNT=0
FAIL_COUNT=0

# 同步到单个镜像仓库
# 参数：$1=url, $2=name, $3=branch
# 返回：0=成功，1=失败
sync_to_mirror() {
    local url=$1
    local name=$2
    local branch=$3
    
    log_debug "推送到 $name ($url) 分支：$branch"
    
    if git push "$url" "$branch" 2>/dev/null; then
        log_success "$name" "推送成功 ($branch)"
        return 0
    else
        log_failure "$name" "推送失败 ($branch)"
        return 1
    fi
}

# 带重试的同步
# 参数：$1=url, $2=name, $3=branch
# 返回：0=成功，1=失败
sync_with_retry() {
    local url=$1
    local name=$2
    local branch=$3
    local max_retries
    local delay
    local retry=0
    
    max_retries=$(get_retry_count)
    delay=$(get_retry_delay)
    
    while [ $retry -lt $max_retries ]; do
        log_debug "尝试推送 $name (第 $((retry + 1))/$max_retries 次)"
        
        if sync_to_mirror "$url" "$name" "$branch"; then
            return 0
        fi
        
        retry=$((retry + 1))
        if [ $retry -lt $max_retries ]; then
            local delay_sec=$((delay / 1000))
            log_retry "$name" "$retry" "$max_retries"
            sleep $delay_sec
        fi
    done
    
    return 1
}

# 同步所有镜像仓库
# 返回：0=全部成功，1=部分失败
sync_all_mirrors() {
    local mirrors_count
    mirrors_count=$(get_mirrors_count)
    
    if [ "$mirrors_count" -eq 0 ]; then
        log_debug "未配置镜像仓库，跳过同步"
        return 0
    fi
    
    log_info "开始同步到镜像仓库..."
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
    
    if [ -z "$current_branch" ]; then
        log_debug "不在分支上，跳过同步"
        return 0
    fi
    
    # 遍历所有镜像仓库
    for ((i=0; i<mirrors_count; i++)); do
        local mirror_name
        mirror_name=$(get_mirror_name $i)
        
        # 检查是否启用
        if ! is_mirror_enabled $i; then
            log_skip "$mirror_name" "仓库未启用"
            continue
        fi
        
        # 检查分支是否需要同步
        if ! should_sync_branch $i; then
            log_skip "$mirror_name" "分支 $current_branch 不在同步列表"
            continue
        fi
        
        # 获取仓库信息
        local url
        url=$(get_mirror_url $i)
        
        if [ -z "$url" ]; then
            log_error "仓库 $mirror_name 的 URL 为空，跳过"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            continue
        fi
        
        # 执行同步（带重试）
        if sync_with_retry "$url" "$mirror_name" "$current_branch"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    done
    
    # 输出报告
    print_report
    
    # 返回状态
    if [ $FAIL_COUNT -gt 0 ]; then
        return 1
    fi
    return 0
}

# 输出同步报告
# 返回：无
print_report() {
    local total=$((SUCCESS_COUNT + FAIL_COUNT))
    
    if [ $total -eq 0 ]; then
        log_info "没有需要同步的仓库"
        return
    fi
    
    if [ $FAIL_COUNT -eq 0 ]; then
        log_success "sync" "同步完成，共 $total 个仓库"
    else
        log_error "同步完成，成功 $SUCCESS_COUNT/$total，失败 $FAIL_COUNT"
    fi
}
