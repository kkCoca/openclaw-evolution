# ClawDevFlow 改造状态报告

> 日期：2026-04-09  
> 状态：Stage 1-5 完成，Stage 6-10 待执行

---

## 已完成改造（Stage 1-5）

### Stage 1：清理运行态文件 ✅
- 删除 `.cdf-state.json`
- 更新 `.gitignore`（添加 .cdf/）

### Stage 2：配置真 YAML 化 ✅
- 新增 `config/config.yaml`（真实 YAML 配置）
- 改名 `config.yaml` → `docs/config.md`
- 添加 `yaml` 依赖
- 修改 `workflow-executor.js`（使用 YAML parser）

### Stage 3：阶段序列 SSOT ✅
- `constants.js` 已符合 SSOT 要求
- 8 个阶段：designing/roadmapping/detailing/coding/testing/reviewing/precommit/releasing

### Stage 4：actions.json + outputs 扫描 ✅
- 新增 `utils/actions-writer.js`
- 新增 `utils/output-scanner.js`

### Stage 5：AI Tools 收敛 ✅
- 新增 `ai-tools/types.js`
- 新增 `ai-tools/opencode.js`
- 新增 `ai-tools/index.js`

---

## 待完成改造（Stage 6-10）

### Stage 6：Stage 模块最小改造
**要求**：每个 stage 的 execute 内必须：
1. 从 config 取 outputDir、outputsAllOf
2. 生成 taskText（包含硬约束模板）
3. 调用 aiTool.runStage()

**风险**：破坏性改造，会影响现有运行逻辑

### Stage 7：WorkflowOrchestrator 统一重试/决策
**要求**：
- 所有阶段用 while-loop 重试
- 取消递归 retry
- decision 规则写死

### Stage 8：precommit/testing/releasing 三阶段接入
**要求**：扫描固定产物文件

### Stage 9：文档与 lint:docs
**要求**：
- README 对齐
- 新增 docs/actions-contract.md
- 新增 scripts/lint-docs.js

### Stage 10：本地 smoke
**要求**：手工创建文件测试流程

---

## 新增文件清单

```
04_coding/src/
├── config/
│   └── config.yaml          # 真实配置
├── docs/
│   └── config.md            # 旧配置文档
├── ai-tools/
│   ├── types.js             # 类型定义
│   ├── index.js             # AI 工具工厂
│   └── opencode.js          # OpenCode 执行器
└── utils/
    ├── actions-writer.js    # 动作协议写入器
    └── output-scanner.js    # 输出扫描器
```

---

## 下一步建议

1. **提交当前进度**（Stage 1-5 已完成）
2. **评估 Stage 6-10 的风险**（破坏性改造）
3. **分批执行剩余改造**

---

**当前改造进度：50%（Stage 1-5 完成）**