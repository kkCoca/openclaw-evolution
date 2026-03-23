#!/bin/bash
# deploy-validate.sh - 部署前/后校验脚本
# 用途：防止生产区污染，确保 L2 生产区纯净原则

set -e

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIVERSE_ROOT="$(dirname "$SCRIPT_DIR")"
PRODUCTION_DIR="$UNIVERSE_ROOT/extensions"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_error() {
  echo -e "${RED}❌ 错误：$1${NC}" >&2
}

log_warn() {
  echo -e "${YELLOW}⚠️  警告：$1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
  echo -e "ℹ️  $1"
}

# 校验函数
validate_production_purity() {
  local target_dir="$1"
  local has_error=false
  
  log_info "🔍 执行生产区纯净性校验：$target_dir"
  
  # 检查 src/ 目录
  if [ -d "$target_dir/src" ]; then
    log_error "生产区包含 src/ 目录，违反 L2 生产区纯净原则！"
    has_error=true
  fi
  
  # 检查 tests/ 目录
  if [ -d "$target_dir/tests" ]; then
    log_error "生产区包含 tests/ 目录，违反 L2 生产区纯净原则！"
    has_error=true
  fi
  
  # 检查 tsconfig.json
  if [ -f "$target_dir/tsconfig.json" ]; then
    log_error "生产区包含 tsconfig.json，违反 L2 生产区纯净原则！"
    has_error=true
  fi
  
  # 检查 package-lock.json（生产区不应包含）
  if [ -f "$target_dir/package-lock.json" ]; then
    log_warn "生产区包含 package-lock.json，建议删除"
  fi
  
  # 检查 .ts 文件（生产区不应包含 TypeScript 源码）
  local ts_files=$(find "$target_dir" -maxdepth 2 -name "*.ts" 2>/dev/null | wc -l)
  if [ "$ts_files" -gt 0 ]; then
    log_error "生产区包含 $ts_files 个 TypeScript 源文件，违反 L2 生产区纯净原则！"
    has_error=true
  fi
  
  # 检查 dist/ 目录（生产区必须包含）
  if [ ! -d "$target_dir/dist" ]; then
    log_error "生产区缺少 dist/ 目录，请先执行构建！"
    has_error=true
  fi
  
  if [ "$has_error" = true ]; then
    return 1
  fi
  
  log_success "生产区纯净性校验通过！"
  return 0
}

# 校验 MANIFEST.json 中的依赖路径
validate_manifest_dependencies() {
  local manifest_file="$UNIVERSE_ROOT/MANIFEST.json"
  
  log_info "🔍 校验 MANIFEST.json 依赖路径..."
  
  if [ ! -f "$manifest_file" ]; then
    log_warn "MANIFEST.json 不存在，跳过依赖路径校验"
    return 0
  fi
  
  # 检查 jq 是否安装
  if ! command -v jq &> /dev/null; then
    log_warn "jq 未安装，跳过 MANIFEST.json 校验"
    return 0
  fi
  
  # 提取外部依赖路径并验证
  local external_deps=$(jq -r '.dependencies.external[]? | select(.required==true) | .path' "$manifest_file" 2>/dev/null)
  
  if [ -z "$external_deps" ]; then
    log_info "  无必需的外部依赖，跳过校验"
    return 0
  fi
  
  local has_error=false
  while IFS= read -r dep_path; do
    if [ ! -f "$dep_path" ]; then
      log_error "必需依赖路径不存在：$dep_path"
      has_error=true
    else
      log_success "  依赖路径可访问：$dep_path"
    fi
  done <<< "$external_deps"
  
  if [ "$has_error" = true ]; then
    log_error "MANIFEST.json 依赖路径校验失败！"
    return 1
  fi
  
  log_success "MANIFEST.json 依赖路径校验通过！"
  return 0
}

# 校验 Git 状态与物理磁盘一致性
validate_git_consistency() {
  log_info "🔍 校验 Git 状态与物理磁盘一致性..."
  
  cd "$UNIVERSE_ROOT"
  
  # 检查是否有未提交的变更
  local git_status=$(git status --porcelain 2>/dev/null)
  
  if [ -n "$git_status" ]; then
    log_warn "Git 仓库有未提交的变更："
    echo "$git_status" | head -10
    
    if [ $(echo "$git_status" | wc -l) -gt 10 ]; then
      echo "  ... 更多变更请使用 'git status' 查看"
    fi
    
    log_warn "建议：提交变更后再部署，确保 Git 状态与物理磁盘一致"
  else
    log_success "Git 状态与物理磁盘一致！"
  fi
  
  return 0
}

# 主函数
main() {
  local mode="${1:-post}"
  local target_dir="${2:-}"
  
  echo "========================================"
  echo "  部署校验脚本 v1.0"
  echo "  模式：$mode"
  echo "========================================"
  echo ""
  
  local exit_code=0
  
  case "$mode" in
    pre)
      log_info "执行部署前校验..."
      echo ""
      
      # 部署前校验：MANIFEST 依赖路径
      if ! validate_manifest_dependencies; then
        exit_code=1
      fi
      echo ""
      
      # 部署前校验：研发区存在性
      if [ -n "$target_dir" ]; then
        if [ ! -d "$target_dir" ]; then
          log_error "研发区目录不存在：$target_dir"
          exit_code=1
        else
          log_success "研发区目录存在：$target_dir"
        fi
        echo ""
      fi
      ;;
      
    post)
      log_info "执行部署后校验..."
      echo ""
      
      # 部署后校验：生产区纯净性
      if [ -n "$target_dir" ]; then
        if ! validate_production_purity "$target_dir"; then
          exit_code=1
        fi
        echo ""
      else
        # 自动扫描所有扩展目录
        log_info "自动扫描 extensions/ 目录..."
        for ext_dir in "$PRODUCTION_DIR"/*/; do
          if [ -d "$ext_dir" ]; then
            echo ""
            if ! validate_production_purity "$ext_dir"; then
              exit_code=1
            fi
          fi
        done
        echo ""
      fi
      
      # 部署后校验：MANIFEST 依赖路径
      if ! validate_manifest_dependencies; then
        exit_code=1
      fi
      echo ""
      
      # 部署后校验：Git 一致性
      if ! validate_git_consistency; then
        exit_code=1
      fi
      echo ""
      ;;
      
    *)
      log_error "未知模式：$mode"
      echo "用法：$0 {pre|post} [目标目录]"
      echo ""
      echo "示例:"
      echo "  $0 pre  /path/to/research-dir"
      echo "  $0 post /path/to/production-dir"
      echo "  $0 post  # 自动扫描所有扩展目录"
      exit 1
      ;;
  esac
  
  echo "========================================"
  if [ $exit_code -eq 0 ]; then
    log_success "校验全部通过，允许发布！"
  else
    log_error "校验失败，中止发布！"
  fi
  echo "========================================"
  
  exit $exit_code
}

# 执行主函数
main "$@"
