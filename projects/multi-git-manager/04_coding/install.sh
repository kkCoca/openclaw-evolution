#!/bin/bash
# install.sh - 安装脚本
# 初始化和配置 multi-git-manager

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Git 是否安装
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    print_info "Git 已安装：$(git --version)"
}

# 获取仓库根目录
get_repo_root() {
    git rev-parse --show-toplevel 2>/dev/null
}

# 检查是否在 Git 仓库中
check_repo() {
    REPO_ROOT=$(get_repo_root)
    if [ -z "$REPO_ROOT" ]; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
    print_info "仓库根目录：$REPO_ROOT"
}

# 创建目录结构
create_directories() {
    print_info "创建目录结构..."
    mkdir -p "$REPO_ROOT/.multi-git/hooks"
}

# 获取脚本所在目录
get_script_dir() {
    cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
}

# 复制 Hook 脚本
copy_hooks() {
    print_info "复制 Hook 脚本..."
    local script_dir
    script_dir=$(get_script_dir)
    
    # 确定源目录
    local src_hooks
    if [ -d "$script_dir/hooks" ]; then
        src_hooks="$script_dir/hooks"
    elif [ -d "$script_dir/04_coding/hooks" ]; then
        src_hooks="$script_dir/04_coding/hooks"
    else
        print_error "找不到 hooks 目录"
        exit 1
    fi
    
    # 复制文件
    cp "$src_hooks/logger.sh" "$REPO_ROOT/.multi-git/hooks/"
    cp "$src_hooks/config.sh" "$REPO_ROOT/.multi-git/hooks/"
    cp "$src_hooks/sync.sh" "$REPO_ROOT/.multi-git/hooks/"
    cp "$src_hooks/post-commit" "$REPO_ROOT/.multi-git/hooks/"
    cp "$src_hooks/pre-push" "$REPO_ROOT/.multi-git/hooks/"
    
    print_info "Hook 脚本已复制"
}

# 复制 CLI 脚本
copy_cli() {
    print_info "复制 CLI 脚本..."
    local script_dir
    script_dir=$(get_script_dir)
    
    # 确定源文件
    local src_cli
    if [ -f "$script_dir/bin/multi-git.sh" ]; then
        src_cli="$script_dir/bin/multi-git.sh"
    elif [ -f "$script_dir/04_coding/bin/multi-git.sh" ]; then
        src_cli="$script_dir/04_coding/bin/multi-git.sh"
    else
        print_warning "找不到 CLI 脚本，跳过安装"
        return
    fi
    
    # 复制到仓库根目录
    cp "$src_cli" "$REPO_ROOT/multi-git.sh"
    chmod +x "$REPO_ROOT/multi-git.sh"
    
    print_info "CLI 脚本已复制：$REPO_ROOT/multi-git.sh"
}

# 复制配置文件
copy_config() {
    print_info "配置配置文件..."
    local script_dir
    script_dir=$(get_script_dir)
    
    # 确定源文件
    local src_template
    if [ -f "$script_dir/config.template.json" ]; then
        src_template="$script_dir/config.template.json"
    elif [ -f "$script_dir/04_coding/config.template.json" ]; then
        src_template="$script_dir/04_coding/config.template.json"
    else
        print_warning "找不到配置模板文件"
        return
    fi
    
    # 复制模板
    cp "$src_template" "$REPO_ROOT/.multi-git/config.template.json"
    
    # 创建配置文件（如不存在）
    if [ ! -f "$REPO_ROOT/.multi-git/config.json" ]; then
        cp "$src_template" "$REPO_ROOT/.multi-git/config.json"
        print_info "已创建配置文件：.multi-git/config.json"
    else
        print_info "配置文件已存在，跳过创建"
    fi
}

# 创建 Git Hook 链接
create_hook_links() {
    print_info "创建 Git Hook 链接..."
    local git_hooks="$REPO_ROOT/.git/hooks"
    
    # 创建软链接
    ln -sf ../../.multi-git/hooks/post-commit "$git_hooks/post-commit"
    ln -sf ../../.multi-git/hooks/pre-push "$git_hooks/pre-push"
    
    print_info "Git Hook 链接已创建"
}

# 设置执行权限
set_permissions() {
    print_info "设置执行权限..."
    chmod +x "$REPO_ROOT/.multi-git/hooks/"*
    chmod +x "$REPO_ROOT/.multi-git/config.json" 2>/dev/null || true
    chmod +x "$REPO_ROOT/multi-git.sh" 2>/dev/null || true
    print_info "权限已设置"
}

# 验证配置
validate_config() {
    print_info "验证配置..."
    
    # 检查必要文件
    local required_files=(
        ".multi-git/hooks/logger.sh"
        ".multi-git/hooks/config.sh"
        ".multi-git/hooks/sync.sh"
        ".multi-git/hooks/post-commit"
        ".multi-git/hooks/pre-push"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$REPO_ROOT/$file" ]; then
            print_error "缺少文件：$file"
            return 1
        fi
    done
    
    # 检查 Hook 链接
    if [ ! -L "$REPO_ROOT/.git/hooks/post-commit" ]; then
        print_error "post-commit Hook 链接未创建"
        return 1
    fi
    
    if [ ! -L "$REPO_ROOT/.git/hooks/pre-push" ]; then
        print_error "pre-push Hook 链接未创建"
        return 1
    fi
    
    # 检查 CLI 工具（可选）
    if [ -f "$REPO_ROOT/multi-git.sh" ]; then
        print_info "CLI 工具：已安装"
    else
        print_info "CLI 工具：未安装（可选）"
    fi
    
    print_info "配置验证通过"
    return 0
}

# 输出使用说明
print_usage() {
    echo ""
    echo "========================================"
    print_info "安装完成！"
    echo "========================================"
    echo ""
    echo "下一步："
    echo "1. 编辑配置文件：$REPO_ROOT/.multi-git/config.json"
    echo "2. 配置主仓库和镜像仓库"
    echo "3. 执行一次测试提交：git commit --allow-empty -m 'test'"
    echo ""
    echo "CLI 工具（v1.0.1 新增）："
    echo "  ./multi-git.sh sync       # 手动触发同步"
    echo "  ./multi-git.sh status     # 查看状态"
    echo "  ./multi-git.sh config     # 查看配置"
    echo "  ./multi-git.sh log -n 20  # 查看最近 20 条日志"
    echo "  ./multi-git.sh help       # 显示帮助"
    echo ""
    echo "配置示例："
    echo "{"
    echo '  "primary": "origin",'
    echo '  "mirrors": ['
    echo '    {'
    echo '      "name": "github",'
    echo '      "url": "https://github.com/USERNAME/REPO.git",'
    echo '      "branches": ["master", "main"],'
    echo '      "enabled": true'
    echo '    }'
    echo '  ],'
    echo '  "syncMode": "auto",'
    echo '  "logLevel": "info"'
    echo "}"
    echo ""
}

# 主函数
main() {
    echo "========================================"
    echo "  multi-git-manager 安装程序 v1.0.1"
    echo "========================================"
    echo ""
    
    check_git
    check_repo
    create_directories
    copy_hooks
    copy_config
    copy_cli
    create_hook_links
    set_permissions
    
    if ! validate_config; then
        print_error "配置验证失败"
        exit 1
    fi
    
    print_usage
}

# 执行主函数
main "$@"
