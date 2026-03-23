#!/bin/bash
# =============================================================================
# TD-001 生产区部署脚本
# =============================================================================
# 用途：一键部署 DuckDuckGo Fallback Skill 到生产区
# 使用：./scripts/deploy_to_production.sh
# =============================================================================

set -e  # 遇到错误立即退出

# ==================== 配置区 ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TASKS_DIR="$PROJECT_ROOT/tasks"
EXTENSIONS_DIR="$PROJECT_ROOT/extensions"

# TD-001 任务目录 (duckduckgo-fallback)
TASK_ID="20260321-duckduckgo-fallback"
TASK_DIR="$TASKS_DIR/$TASK_ID"
CODING_DIR="$TASK_DIR/04_coding"

# 生产区目录
PROD_DIR="$EXTENSIONS_DIR/duckduckgo-fallback"

# ==================== 颜色输出 ====================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}"; }

# ==================== 校验函数 ====================

check_task_directory() {
  log_info "步骤 1/7: 校验研发区目录..."
  
  if [ ! -d "$TASK_DIR" ]; then
    log_error "研发区目录不存在：$TASK_DIR"
    exit 1
  fi
  
  if [ ! -d "$CODING_DIR" ]; then
    log_error "编码区目录不存在：$CODING_DIR"
    exit 1
  fi
  
  log_success "研发区目录校验通过"
}

check_production_directory() {
  log_info "步骤 2/7: 校验生产区目录..."
  
  if [ ! -d "$PROD_DIR" ]; then
    log_error "生产区目录不存在：$PROD_DIR"
    exit 1
  fi
  
  log_success "生产区目录校验通过"
}

check_source_files() {
  log_info "步骤 3/7: 校验源代码文件..."
  
  if [ ! -d "$CODING_DIR/src" ]; then
    log_error "源代码目录不存在：$CODING_DIR/src"
    exit 1
  fi
  
  if [ ! -f "$CODING_DIR/package.json" ]; then
    log_error "package.json 不存在：$CODING_DIR/package.json"
    exit 1
  fi
  
  log_success "源代码文件校验通过"
}

# ==================== 清理函数 ====================

clean_build_artifacts() {
  log_info "步骤 4/7: 清理旧构建产物..."
  
  if [ -d "$CODING_DIR/dist" ]; then
    rm -rf "$CODING_DIR/dist"
    log_info "  - 已清理：$CODING_DIR/dist"
  fi
  
  log_success "旧构建产物清理完成"
}

clean_production_dir() {
  log_info "步骤 6/7: 清理生产区研发文件..."
  
  # 删除源码目录
  if [ -d "$PROD_DIR/src" ]; then
    rm -rf "$PROD_DIR/src"
    log_info "  - 已删除：$PROD_DIR/src"
  fi
  
  # 删除测试目录
  if [ -d "$PROD_DIR/tests" ]; then
    rm -rf "$PROD_DIR/tests"
    log_info "  - 已删除：$PROD_DIR/tests"
  fi
  
  # 删除 TypeScript 配置
  if [ -f "$PROD_DIR/tsconfig.json" ]; then
    rm -f "$PROD_DIR/tsconfig.json"
    log_info "  - 已删除：$PROD_DIR/tsconfig.json"
  fi
  
  if [ -f "$PROD_DIR/vitest.config.ts" ]; then
    rm -f "$PROD_DIR/vitest.config.ts"
    log_info "  - 已删除：$PROD_DIR/vitest.config.ts"
  fi
  
  # 删除测试编译产物
  if [ -d "$PROD_DIR/dist/tests" ]; then
    rm -rf "$PROD_DIR/dist/tests"
    log_info "  - 已删除：$PROD_DIR/dist/tests"
  fi
  
  # 删除 vitest 配置编译产物
  if [ -f "$PROD_DIR/dist/vitest.config.js" ]; then
    rm -f "$PROD_DIR/dist/vitest.config.js"
    log_info "  - 已删除：$PROD_DIR/dist/vitest.config.js"
  fi
  
  if [ -f "$PROD_DIR/dist/vitest.config.d.ts" ]; then
    rm -f "$PROD_DIR/dist/vitest.config.d.ts"
    log_info "  - 已删除：$PROD_DIR/dist/vitest.config.d.ts"
  fi
  
  log_success "生产区研发文件清理完成"
}

# ==================== 构建函数 ====================

install_dependencies() {
  log_info "步骤 5/7: 安装依赖..."
  
  cd "$CODING_DIR"
  npm install --silent
  
  log_success "依赖安装完成"
}

build_project() {
  log_info "步骤 6/7: 执行构建..."
  
  cd "$CODING_DIR"
  npm run build --silent
  
  if [ ! -d "$CODING_DIR/dist" ]; then
    log_error "构建失败：dist/ 目录未生成"
    exit 1
  fi
  
  if [ ! -d "$CODING_DIR/dist/src" ]; then
    log_error "构建失败：dist/src/ 目录未生成"
    exit 1
  fi
  
  log_success "构建完成"
}

# ==================== 同步函数 ====================

sync_to_production() {
  log_info "步骤 7/7: 同步到生产区..."
  
  # 确保生产区目录存在
  mkdir -p "$PROD_DIR/dist"
  
  # 同步 dist/src/ (仅运行时文件)
  # 使用 --exclude 确保不同步研发源码和配置文件（L2 生产区纯净原则）
  rsync -av --delete \
    --exclude='src/' \
    --exclude='tests/' \
    --exclude='*.ts' \
    --exclude='tsconfig.json' \
    --exclude='package-lock.json' \
    "$CODING_DIR/dist/src/" "$PROD_DIR/dist/src/"
  log_info "  - 已同步：dist/src/ (已排除 src/, tests/, *.ts, tsconfig.json)"
  
  # 创建生产版 package.json (仅包含 production 字段)
  cat > "$PROD_DIR/package.json" << 'EOF'
{
  "name": "ddg-fallback-skill",
  "version": "2.0.0",
  "description": "DuckDuckGo Fallback Skill v2.0 (TD-001) - Production",
  "type": "module",
  "main": "dist/src/index.js",
  "types": "dist/src/index.d.ts",
  "engines": {
    "node": ">=18"
  },
  "files": [
    "dist/"
  ],
  "keywords": [
    "openclaw",
    "duckduckgo",
    "fallback",
    "search",
    "skill"
  ],
  "author": "openclaw-ouyp",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://gitee.com/cola16/openclaw-evolution.git"
  }
}
EOF
  log_info "  - 已创建：package.json (生产版)"
  
  log_success "同步到生产区完成"
}

# ==================== 校验函数 (部署后) ====================

validate_production() {
  log_info "执行生产区校验..."
  
  local has_errors=0
  
  # 检查是否包含 src/
  if [ -d "$PROD_DIR/src" ]; then
    log_error "生产区包含 src/ 目录，违反生产区纯净原则！"
    has_errors=1
  fi
  
  # 检查是否包含 tests/
  if [ -d "$PROD_DIR/tests" ]; then
    log_error "生产区包含 tests/ 目录，违反生产区纯净原则！"
    has_errors=1
  fi
  
  # 检查是否包含 tsconfig.json
  if [ -f "$PROD_DIR/tsconfig.json" ]; then
    log_error "生产区包含 tsconfig.json，违反生产区纯净原则！"
    has_errors=1
  fi
  
  # 检查 dist/src/ 是否存在
  if [ ! -d "$PROD_DIR/dist/src" ]; then
    log_error "生产区缺少 dist/src/ 目录！"
    has_errors=1
  fi
  
  # 检查 dist/src/*.js 是否存在
  local js_count=$(find "$PROD_DIR/dist/src" -name "*.js" | wc -l)
  if [ "$js_count" -eq 0 ]; then
    log_error "生产区 dist/src/ 下没有 .js 文件！"
    has_errors=1
  fi
  
  if [ "$has_errors" -eq 1 ]; then
    log_error "生产区校验失败！"
    exit 1
  fi
  
  log_success "生产区校验通过"
}

# ==================== 主流程 ====================

main() {
  echo ""
  echo "============================================================================="
  echo "  TD-001 DuckDuckGo Fallback Skill - 生产区部署"
  echo "============================================================================="
  echo ""
  
  # 校验阶段
  check_task_directory
  check_production_directory
  check_source_files
  
  # 清理阶段
  clean_build_artifacts
  
  # 构建阶段
  install_dependencies
  build_project
  
  # 同步阶段
  clean_production_dir
  sync_to_production
  
  # 校验阶段 (部署后)
  validate_production
  
  echo ""
  echo "============================================================================="
  echo "  ✅ 部署完成！"
  echo "============================================================================="
  echo ""
  echo "📊 生产区文件树:"
  find "$PROD_DIR" -type f | sort | sed 's|^'"$PROJECT_ROOT"'|  |'
  echo ""
  echo "💡 下次部署只需说：'发布插件'"
  echo ""
}

# 执行主流程
main "$@"
