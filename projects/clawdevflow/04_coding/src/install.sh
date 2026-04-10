#!/bin/bash

# OpenClaw Research Workflow Skill 安装脚本 (Linux/macOS)
# 版本：1.0.0
# 支持：Linux, macOS

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌  $1${NC}"
}

# 主流程
main() {
    echo ""
    print_info "🚀 开始安装 OpenClaw Research Workflow Skill..."
    echo ""

    # 1. 检查环境
    print_info "📋 检查环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        print_info "安装方法："
        print_info "  Ubuntu/Debian: sudo apt install nodejs npm"
        print_info "  macOS: brew install node"
        print_info "  Windows: 下载 https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js 已安装 ($(node --version))"

    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    print_success "npm 已安装 ($(npm --version))"

    # 2. 确定 OpenClaw skills 目录
    SKILLS_DIR="$HOME/.openclaw/skills"
    
    if [ ! -d "$SKILLS_DIR" ]; then
        print_error "OpenClaw skills 目录不存在：$SKILLS_DIR"
        print_info "请先安装 OpenClaw: npm install -g openclaw"
        exit 1
    fi
    print_success "OpenClaw skills 目录：$SKILLS_DIR"

    # 3. 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SKILL_NAME="clawdevflow"
    TARGET_DIR="$SKILLS_DIR/$SKILL_NAME"

    # 4. 检查是否已安装
    if [ -d "$TARGET_DIR" ]; then
        print_warning "已检测到现有安装：$TARGET_DIR"
        read -p "是否覆盖安装？(y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "取消安装"
            exit 0
        fi
        print_info "删除现有安装..."
        rm -rf "$TARGET_DIR"
    fi

    # 5. 复制主 skill
    print_info "📦 复制主 skill..."
    cp -r "$SCRIPT_DIR" "$TARGET_DIR"
    print_success "复制完成"

    # 6. 设置执行权限
    print_info "🔧 设置执行权限..."
    chmod +x "$TARGET_DIR/install.sh"
    chmod +x "$TARGET_DIR/install.js"
    print_success "权限设置完成"

    # 7. 验证安装
    print_info "✅ 验证安装..."
    
    REQUIRED_FILES=(
        "SKILL.md"
        "workflow-executor.js"
        "README.md"
        "install.sh"
        "install.bat"
        "install.js"
    )

    MISSING_FILES=()
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$TARGET_DIR/$file" ]; then
            MISSING_FILES+=("$file")
        fi
    done

    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        print_error "缺少必要文件："
        for file in "${MISSING_FILES[@]}"; do
            echo "  - $file"
        done
        exit 1
    fi

    # 检查 bundled-skills 目录
    if [ ! -d "$TARGET_DIR/bundled-skills" ]; then
        print_error "bundled-skills 目录不存在"
        exit 1
    fi

    # 检查 bundled skills
    BUNDLED_SKILLS=("designing" "roadmapping" "detailing" "coding" "testing" "reviewing" "precommit" "releasing")
    MISSING_SKILLS=()
    for skill in "${BUNDLED_SKILLS[@]}"; do
        if [ ! -d "$TARGET_DIR/bundled-skills/$skill" ]; then
            MISSING_SKILLS+=("$skill")
        fi
    done

    if [ ${#MISSING_SKILLS[@]} -gt 0 ]; then
        print_error "缺少 bundled skills："
        for skill in "${MISSING_SKILLS[@]}"; do
            echo "  - $skill"
        done
        exit 1
    fi

    print_success "所有文件验证通过"

    # 8. 完成
    echo ""
    print_success "🎉 安装成功！"
    echo ""
    print_info "📍 安装位置：$TARGET_DIR"
    echo ""
    print_info "使用方法:"
    echo "  /sessions_spawn clawdevflow"
    echo ""
    print_info "查看文档:"
    echo "  cat $TARGET_DIR/README.md"
    echo ""
    print_info "示例:"
    echo "  cat $TARGET_DIR/examples/example-1-new-feature.md"
    echo ""
}

# 执行主流程
main "$@"
