#!/bin/bash
# deploy-pipeline.sh - 规范化部署流水线
#
# 🛡️  职责归属:
#   创建者：OpenClaw
#   使用者：OpenClaw (仅 OpenClaw 可执行部署)
#   维护者：OpenClaw
#
# 🚫 边界约束:
#   OpenCode 禁止直接运行此脚本
#   OpenCode 的职责是提供构建产物 (dist/)
#   OpenClaw 负责验证后执行部署

set -e

TASK_DIR=$1
PROD_BASE="/home/ouyp/Learning/Practice/openclaw-universe/extensions"

if [ -z "$TASK_DIR" ]; then
  echo "❌ 用法：deploy-pipeline.sh <任务目录>"
  echo "   示例：deploy-pipeline.sh /home/ouyp/Learning/Practice/openclaw-universe/tasks/20260321-duckduckgo-fallback"
  exit 1
fi

echo "🚀 启动规范化部署流水线..."
echo ""

# 步骤 1: 验证任务目录存在
echo "   [1/7] 验证任务目录..."
if [ ! -d "$TASK_DIR" ]; then
  echo "❌ 错误：任务目录不存在：$TASK_DIR"
  exit 1
fi
echo "   ✅ 任务目录存在"

# 步骤 2: 验证构建产物存在 (OpenCode 交付物)
echo "   [2/7] 验证构建产物..."
if [ ! -d "$TASK_DIR/04_coding/dist" ]; then
  echo "❌ 错误：缺少构建产物，请先执行 npm run build"
  exit 1
fi
echo "   ✅ 构建产物存在"

# 步骤 3: 验证执行报告存在 (OpenCode 交付物)
echo "   [3/7] 验证执行报告..."
if [ ! -f "$TASK_DIR/04_coding/EXECUTION_REPORT.md" ]; then
  echo "❌ 错误：缺少执行报告，请补充 EXECUTION_REPORT.md"
  exit 1
fi
echo "   ✅ 执行报告存在"

# 步骤 4: 确定生产区目录
EXT_NAME=$(basename "$TASK_DIR")
PROD_DIR="$PROD_BASE/$EXT_NAME"

echo "   [4/7] 准备生产区：$PROD_DIR"
if [ -d "$PROD_DIR" ]; then
  echo "   ⚠️  生产区已存在，执行清理..."
  rm -rf "$PROD_DIR"/*
fi

# 步骤 5: 仅复制 dist/ 到生产区 (符合 L2: 生产区纯净)
echo "   [5/7] 部署构建产物..."
mkdir -p "$PROD_DIR"
cp -r "$TASK_DIR/04_coding/dist/"* "$PROD_DIR/"
cp "$TASK_DIR/04_coding/package.json" "$PROD_DIR/" 2>/dev/null || true
echo "   ✅ 构建产物已复制"

# 步骤 6: 验证生产区纯净 (部署后 L2 检查)
echo "   [6/7] 验证生产区纯净 (L2)..."
if [ -d "$PROD_DIR/src" ]; then
  echo "❌ 错误：生产区包含 src/，部署失败！"
  exit 1
fi

if [ -d "$PROD_DIR/tests" ]; then
  echo "❌ 错误：生产区包含 tests/，部署失败！"
  exit 1
fi

if [ -f "$PROD_DIR/tsconfig.json" ]; then
  echo "❌ 错误：生产区包含 tsconfig.json，部署失败！"
  exit 1
fi

if [ ! -d "$PROD_DIR/dist" ]; then
  echo "❌ 错误：生产区缺少 dist/，部署失败！"
  exit 1
fi

echo "   ✅ 生产区纯净验证通过"

# 步骤 7: 生成部署报告
echo "   [7/7] 生成部署报告..."
DEPLOY_REPORT="$TASK_DIR/05_documentation/DEPLOY_REPORT.md"
cat > "$DEPLOY_REPORT" << EOF
# 部署报告

> **部署时间**: $(date '+%Y-%m-%d %H:%M:%S')
> **任务名称**: $EXT_NAME
> **执行者**: OpenClaw
> **状态**: ✅ 成功

---

## 📦 部署内容

### 源目录
\`$TASK_DIR/04_coding/dist/\`

### 目标目录
\`$PROD_DIR/\`

## ✅ 验证结果

- [x] 生产区无 src/
- [x] 生产区无 tests/
- [x] 生产区无 tsconfig.json
- [x] dist/ 存在

## 📋 生产区内容

\`\`\`
$(ls -la "$PROD_DIR")
\`\`\`
EOF

echo "   ✅ 部署报告已生成"

echo ""
echo "========================================"
echo "  ✅ 部署成功！"
echo "========================================"
echo ""
echo "📋 生产区内容:"
ls -la "$PROD_DIR"
echo ""
echo "📄 部署报告：$DEPLOY_REPORT"
echo ""
echo "🛡️  职责边界:"
echo "   OpenClaw: 执行部署 + 质量验证"
echo "   OpenCode: 确认部署成功 + 提供反馈"
