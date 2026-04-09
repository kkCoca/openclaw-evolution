# Stage 7-10 改造说明

> 状态：待执行  
> 优先级：P1（高）

---

## Stage 7：WorkflowOrchestrator 统一重试/决策

### 改造目标
- 所有阶段用 while-loop 重试
- 取消递归 retry
- decision 规则写死

### 具体改动

#### 7.1 executeStage() 改造
```javascript
async executeStage(stageName, workflowConfig) {
  const maxRetries = this.config.stages[stageName].maxRetries || 3;
  let attempt = 1;
  let regenerateHint = '';
  
  while (attempt <= maxRetries) {
    // 执行阶段
    const result = await this.stageExecutor.execute(stageName, {
      ...workflowConfig,
      config: this.config,
      attempt,
      regenerateHint
    });
    
    // 执行审阅
    const decision = await this.reviewOrchestrator.review(stageName, result, projectPath);
    
    // 处理决策
    if (decision.decision === 'pass') {
      return { success: true, ...result };
    } else if (decision.decision === 'reject') {
      attempt++;
      regenerateHint = decision.fixItems.map(i => i.description).join('\n');
      // 重写 actions.json
      // ...
    } else if (decision.decision === 'clarify') {
      return { success: false, error: 'blocked', blockReason: decision.notes };
    }
  }
  
  return { success: false, error: 'Max retries exceeded' };
}
```

#### 7.2 StageExecutor 改造
```javascript
// 使用 AI Tools 工厂
const AITools = require('../ai-tools');
const aiTool = AITools.fromConfig(this.config, stageName);
return await stageModule.execute(aiTool, this.stateManager, projectPath, input);
```

---

## Stage 8：precommit/testing/releasing 三阶段接入

### 改动点
- testing：扫描 `06_testing/TEST-REPORT.md`
- precommit：扫描 `07_precommit/PRECOMMIT-CHECKLIST.md`
- releasing：扫描 `08_releasing/RELEASE-NOTES.md`

### config.yaml 输出目录调整
当前配置：
- testing → 06_testing
- reviewing → 05_reviewing
- precommit → 07_precommit
- releasing → 08_releasing

---

## Stage 9：文档与 lint:docs

### 9.1 README 对齐
- 阶段图改为 8 阶段
- 输出结构补齐 06/07/08
- 说明 actions.json 协议

### 9.2 新增文档
- `docs/actions-contract.md`
- `docs/stages.md`

### 9.3 新增 lint:docs
```javascript
// scripts/lint-docs.js
const fs = require('fs');
const YAML = require('yaml');

// 1. package.json.version == SKILL.md version
// 2. constants.STAGE_SEQUENCE 在 README 出现
// 3. config/config.yaml 可解析
// 4. stages 包含 testing/precommit/releasing
```

---

## Stage 10：本地 smoke

### 验证步骤
1. 创建项目目录 `projects/cdf-smoke/`
2. 运行 CDF
3. 手动创建合同文件
4. 验证扫描推进

---

## 风险评估

| 改动 | 风险 | 缓解措施 |
|------|------|---------|
| WorkflowOrchestrator 改造 | 高 | 保留旧接口，新增 Actions 模式开关 |
| StageExecutor 改造 | 中 | 向后兼容，渐进迁移 |
| 文档改造 | 低 | 无风险 |

---

## 下一步执行建议

1. **先测试 Actions 模式**
   - 手动创建 `.cdf/actions.json`
   - 手动创建合同文件
   - 验证扫描推进

2. **分批执行**
   - Stage 7（核心编排器）单独提交
   - Stage 8-10 合并提交

3. **保留回滚能力**
   - 创建分支 `feature/actions-mode`
   - 测试通过后合并主分支

---

**当前进度：Stage 1-6 已完成并提交**