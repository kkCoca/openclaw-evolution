#!/bin/bash
# task-scaffold.sh - 任务创建脚手架
#
# 🛡️  职责归属:
#   创建者：OpenClaw
#   使用者：OpenCode
#   维护者：OpenClaw
#
# 🚫 边界约束:
#   OpenCode 可运行此脚本，但不应修改脚本逻辑
#   如需改进工具，向 OpenClaw 提出需求

set -e

TASK_NAME=$1
TASK_DIR="/home/ouyp/Learning/Practice/openclaw-universe/tasks/$TASK_NAME"

if [ -z "$TASK_NAME" ]; then
  echo "❌ 用法：task-scaffold.sh <任务名称>"
  echo "   示例：task-scaffold.sh 20260322-ddg-fallback"
  exit 1
fi

echo "🏗️  创建任务目录结构：$TASK_NAME"

# 创建标准目录 (符合 L4: Plan-and-Execute)
mkdir -p "$TASK_DIR"/{01_designing,02_roadmapping,03_detailing,04_coding/{src,tests,dist},05_documentation}

# 创建 PRD 模板
cat > "$TASK_DIR/01_designing/PRD.md" << 'EOF'
# PRD: [任务名称]

> **版本**: v1.0
> **创建日期**: $(date '+%Y-%m-%d')
> **作者**: OpenCode
> **状态**: 🟡 待复查 (OpenClaw)

---

## 🎯 产品愿景
[填写核心问题和解决方案]

## 📋 需求定义

### 功能需求 (FR)
- [ ] FR-001: [需求描述]

### 非功能需求 (NFR)
- [ ] NFR-001: [性能/安全/可靠性]

## ✅ 验收标准
- [ ] [验收标准 1]
- [ ] [验收标准 2]
EOF

# 创建 ROADMAP 模板 (符合 L4)
cat > "$TASK_DIR/02_roadmapping/ROADMAP.md" << 'EOF'
# ROADMAP: [任务名称]

> **步骤数**: 5-8 步 (符合 L4 规范)
> **执行者**: OpenCode
> **复查者**: OpenClaw

---

## 📋 步骤清单
1. [ ] [步骤 1 - 类型定义]
2. [ ] [步骤 2 - 核心逻辑]
3. [ ] [步骤 3 - 适配层]
4. [ ] [步骤 4 - 入口文件]
5. [ ] [步骤 5 - 单元测试]
6. [ ] [步骤 6 - 构建验证]
7. [ ] [步骤 7 - 部署发布]

## 📎 Context Prefix
- 核心约束：[来自 PRD]
- 架构约束：[来自规范]
- 物理连接：[依赖路径]
EOF

# 创建部署校验脚本 (任务级 - L2 合规)
cat > "$TASK_DIR/04_coding/deploy-check.sh" << 'EOF'
#!/bin/bash
# 任务级部署校验 - 防止生产区污染 (L2)

TASK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXT_NAME=$(basename "$TASK_DIR")
PROD_DIR="/home/ouyp/Learning/Practice/openclaw-universe/extensions/$EXT_NAME"

echo "🔍 执行部署前校验 (L2: 生产区纯净)..."

if [ -d "$PROD_DIR/src" ]; then
  echo "❌ 错误：生产区包含 src/，中止发布！"
  exit 1
fi

if [ -d "$PROD_DIR/tests" ]; then
  echo "❌ 错误：生产区包含 tests/，中止发布！"
  exit 1
fi

if [ -f "$PROD_DIR/tsconfig.json" ]; then
  echo "❌ 错误：生产区包含 tsconfig.json，中止发布！"
  exit 1
fi

echo "✅ 校验通过，允许发布！"
EOF
chmod +x "$TASK_DIR/04_coding/deploy-check.sh"

# 创建执行报告模板
cat > "$TASK_DIR/04_coding/EXECUTION_REPORT.md" << 'EOF'
# 执行报告：[任务名称]

> **任务 ID**: [任务目录名]
> **执行日期**: $(date '+%Y-%m-%d')
> **执行者**: OpenCode
> **复查者**: OpenClaw

---

## 📋 OpenCode 执行记录

### 架构设计
- [ ] 模块划分
- [ ] 状态机设计
- [ ] 配置参数

### 代码实现
- [ ] src/index.ts
- [ ] src/*.ts
- [ ] tests/*.test.ts

### 构建验证
- [ ] npm run build 成功
- [ ] dist/ 目录生成
- [ ] npm test 通过

---

## 🔍 OpenClaw 复查记录

### 架构复查
- [ ] 模块职责清晰
- [ ] 无循环依赖
- [ ] 配置可调整

### 质量检查
- [ ] 生产区纯净 ✅
- [ ] 命名一致性 ✅
- [ ] 依赖可访问 ✅

### Git 操作
- [ ] Git 提交完成
- [ ] Gitee 推送完成
EOF

echo "✅ 任务目录创建完成"
echo ""
echo "📋 目录结构:"
ls -R "$TASK_DIR" | head -30
echo ""
echo "📋 下一步:"
echo "   1. 编辑 $TASK_DIR/01_designing/PRD.md"
echo "   2. 编辑 $TASK_DIR/02_roadmapping/ROADMAP.md"
echo "   3. 提交 OpenClaw 复查架构"
echo "   4. 开始执行任务"
echo ""
echo "🛡️  职责边界:"
echo "   OpenCode: 填写需求、设计架构、编写代码"
echo "   OpenClaw: 复查架构、执行部署、知识沉淀"
