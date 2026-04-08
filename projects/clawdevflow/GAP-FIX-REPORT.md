# GAP Fix 报告（GAP-1/GAP-2）

> **版本**: v1.0  
> **日期**: 2026-04-08  
> **状态**: 已完成 ✅  
> **基线提交**: 225bae1（Coding Gates）  
> **修复提交**: 2989d01（GAP Fix）

---

## 📋 修复背景

根据复核报告 `CODING_GATES_GAP_FIX_TODO_LIST.md`，存在 2 个实现缺口需要补洞。

---

## 🔧 GAP 修复清单

### GAP-1（P0）：CHANGESET 模板必须写入"实际 test 命令"

**问题描述**：
- `review-orchestrator.js` Gate C5：要求 `CHANGESET.md` 必须包含 `commands.test` 的原始字符串 `testCmd`
- `stage-executor.js` 自动生成的 CHANGESET 模板目前写的是"见 PROJECT_MANIFEST.json"或固定 `npm test`
- 当 `commands.test` ≠ `npm test` 时，即使测试通过，也可能被 C5 卡死 → 影响收敛

**修复方案**：
- 创建 CHANGESET.md 前读取 `manifest.commands.test`
- 将真实 testCmd 写入模板

**改动文件**：`stage-executor.js`

**代码对比**：
```javascript
// 修复前
const changesetContent = `# 变更说明
# 测试
${input.manifestFile ? '见 PROJECT_MANIFEST.json' : 'npm test'}
`;

// 修复后（GAP-1）
let testCmd = 'npm test';  // 默认占位
try {
  const manifestPath = path.join(projectPath, 'PROJECT_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.commands && manifest.commands.test) {
      testCmd = manifest.commands.test;  // 读取真实命令
    }
  }
} catch (error) {
  console.log('⚠️ 无法读取 manifest，使用默认 test 命令');
}

const changesetContent = `# 变更说明
# 测试
${testCmd}  // ← 真实命令
`;
```

**验收**：
- ✅ CHANGESET.md 包含真实 test 命令（非占位符）
- ✅ Gate C5 不会误判 reject

---

### GAP-2（P0）：coding 阶段无入口门禁

**问题描述**：
- roadmapping 有双门禁（Gate#1 + Gate#2）
- coding 只有 Gate#2（stage-executor 内校验），没有 Gate#1（orchestrator 校验）
- 不一致，且无法在早期失败

**修复方案**：
- `workflow-orchestrator.js` `executeStage()` 开头增加 coding 门禁校验
- 检查项：`PROJECT_MANIFEST.json` 存在 + `commands.test` 存在
- 失败处理：`BLOCKED` 状态 + `blockReason`

**改动文件**：`workflow-orchestrator.js`

**代码对比**：
```javascript
// 修复前
// 自动返工循环（roadmapping/detailing/coding）
const autoRetryStages = ['roadmapping', 'detailing', 'coding'];

// 修复后（GAP-2）
// Coding 入口门禁（第一处：执行阶段前）
if (stageName === 'coding') {
  const manifestPath = path.join(workflowConfig.projectPath, 'PROJECT_MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('[Workflow-Orchestrator] ❌ coding 入口门禁校验失败：PROJECT_MANIFEST.json 不存在');
    this.stateManager.updateStage('coding', StageStatus.BLOCKED, { blockReason: 'PROJECT_MANIFEST.json 不存在' });
    return { success: false, error: 'coding 入口门禁失败：PROJECT_MANIFEST.json 不存在' };
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.commands || !manifest.commands.test) {
      console.error('[Workflow-Orchestrator] ❌ coding 入口门禁校验失败：commands.test 缺失');
      this.stateManager.updateStage('coding', StageStatus.BLOCKED, { blockReason: 'commands.test 缺失' });
      return { success: false, error: 'coding 入口门禁失败：commands.test 缺失' };
    }
    console.log('[Workflow-Orchestrator] ✅ coding 入口门禁校验通过');
  } catch (error) {
    console.error('[Workflow-Orchestrator] ❌ coding 入口门禁校验失败：manifest 解析失败');
    this.stateManager.updateStage('coding', StageStatus.BLOCKED, { blockReason: `manifest 解析失败：${error.message}` });
    return { success: false, error: `coding 入口门禁失败：manifest 解析失败` };
  }
}

// 自动返工循环（roadmapping/detailing/coding）
```

**验收**：
- ✅ 无 manifest → coding 入口门禁失败（BLOCKED）
- ✅ manifest 无 commands.test → 入口门禁失败（BLOCKED）
- ✅ manifest 解析失败 → 入口门禁失败（BLOCKED）

---

## 📊 代码统计

| 文件 | 改动行数 | 改动内容 |
|------|---------|---------|
| `stage-executor.js` | +20 行 | GAP-1: 读取 manifest + 写入真实 testCmd |
| `workflow-orchestrator.js` | +30 行 | GAP-2: coding 入口门禁校验 |
| **总计** | **+50 行** | **2 个 GAP** |

---

## 🧪 验收用例

| # | 用例 | 验证点 | 期望结果 | 状态 |
|---|------|--------|---------|------|
| 1 | CHANGESET 包含真实 test 命令 | 非占位符 | ✅ 已修复 |
| 2 | 无 manifest → 入口门禁失败 | BLOCKED | ✅ 已修复 |
| 3 | manifest 无 commands.test → 入口门禁失败 | BLOCKED | ✅ 已修复 |
| 4 | manifest 解析失败 → 入口门禁失败 | BLOCKED | ✅ 已修复 |

---

## 📝 Git 提交记录

```bash
commit 2989d01 (最新)
fix: coding gates gap fix（GAP-1/GAP-2）

GAP-1 修复：CHANGESET 模板写入实际 test 命令
- stage-executor.js: 创建 CHANGESET.md 前读取 manifest.commands.test
- 确保 CHANGESET.md 包含真实 test 命令（非占位符）

GAP-2 修复：coding 阶段增加入口门禁（Gate#1）
- workflow-orchestrator.js: executeStage 开头增加 coding 门禁校验
- 检查项：PROJECT_MANIFEST.json 存在 + commands.test 存在
- 失败处理：BLOCKED 状态 + blockReason

改动统计：
- stage-executor.js: +20 行
- workflow-orchestrator.js: +30 行
总计：+50 行

commit 225bae1
feat: coding gates with manifest（质量门禁 + 自动返工）
```

---

## 🔗 参考文档

- GAP 修复清单：`CODING_GATES_GAP_FIX_TODO_LIST.md`
- Coding Gates 整改报告：`CODING-GATES-COMPLETE-REPORT.md`
- Manifest 规范：`PROJECT_MANIFEST_SPEC.md`

---

## ✅ 修复确认

| GAP | 状态 | 验收 |
|-----|------|------|
| GAP-1: CHANGESET 模板写入真实 test 命令 | ✅ 完成 | ✅ 通过 |
| GAP-2: coding 阶段入口门禁 | ✅ 完成 | ✅ 通过 |

---

*GAP Fix 报告 by openclaw-ouyp*  
**版本**: v1.0 | **日期**: 2026-04-08 | **状态**: 已完成 ✅
