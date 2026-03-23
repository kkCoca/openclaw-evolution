# PRD-FIX-001: DDG 验证码检测修复

**关联 ISSUE**: ISSUE-001  
**目标版本**: v1.1  
**创建日期**: 2026-03-23  
**状态**: 🟡 待执行

---

## 问题描述

**症状**:
```
【测试 1】基础搜索 (summary 模式)
✅ 搜索成功
查询：OpenClaw AI
结果数量：0  ❌（期望：5+）
搜索源：bing
```

**影响**:
- 生产环境无法获取搜索结果
- 所有使用 Web Search 功能的用户受影响

**发现阶段**: 部署后验证

---

## 根因分析

### 直接原因
1. **DDG 验证码检测不完整**: 仅检测 `captcha` 和 `challenge-form`，未覆盖新版 `anomaly-modal` 等特征
2. **Bing 解析器正则过严**: 无法匹配 `<h2 class="">` 和 `<p class="b_lineclamp2">` 等灵活结构
3. **测试数据与生产环境不一致**: 使用模拟 HTML 而非真实抓取样本

### 5 Why 分析
```
Q1: 为什么返回 0 结果？
A1: 解析器无法匹配真实 HTML 结构

Q2: 为什么无法匹配？
A2: 正则表达式过严，未考虑 class 属性变化

Q3: 为什么测试没发现？
A3: 使用模拟数据而非真实 HTML 验证

Q4: 为什么用模拟数据？
A4: 测试策略缺失"真实数据验证"环节

Q5: 为什么策略缺失？
A5: 研发流程未定义完整的测试金字塔
```

---

## 修复方案

### 修改文件清单

#### 1. src/parser/ddg-parser.js
**函数**: `detectDdgBlockingState(html)`

**修改内容**:
```javascript
// 当前（v1.0）- 仅 2 个特征
if (lower.includes('captcha') || lower.includes('challenge-form')) {
  return { blocked: true, type: 'captcha_detected', ... };
}

// 修复后（v1.1）- 6 个特征
if (lower.includes('captcha') || 
    lower.includes('challenge-form') || 
    lower.includes('anomaly-modal') ||
    lower.includes('botnet') ||
    lower.includes('select all squares') ||
    lower.includes('human')) {
  return { blocked: true, type: 'captcha_detected', ... };
}
```

**验收标准**:
- [ ] 包含 `anomaly-modal` 检测
- [ ] 包含 `botnet` 检测
- [ ] 包含 `select all squares` 检测
- [ ] 包含 `human` 检测

#### 2. src/parser/bing-parser.js
**函数**: `extractBingResults(html, limit)`

**修改内容**:
```javascript
// 当前（v1.0）- 严格匹配
const titleMatch = block.match(/<h2>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
const snippetMatch = block.match(/<p>([\s\S]*?)<\/p>/i);

// 修复后（v1.1）- 灵活匹配
const titleMatch = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
```

**验收标准**:
- [ ] 支持 `<h2 class="">` 匹配
- [ ] 支持 `<h2>` 匹配
- [ ] 支持 `<p class="b_lineclamp2">` 匹配
- [ ] 支持 `<p>` 匹配

#### 3. tests/fixtures/（新增）
**文件**:
- `ddg-captcha.html` - DDG 验证码页面（已抓取）
- `bing-normal.html` - Bing 正常结果页（已抓取）
- `README.md` - 样本库说明

**验收标准**:
- [ ] 样本文件大小合理（< 500KB）
- [ ] 样本包含预期特征（anomaly-modal、b_algo 等）

#### 4. tests/parser-integration.test.js（新增）
**测试用例**:
- DDG 验证码检测测试（4 个用例）
- Bing 解析器测试（3 个用例）

**验收标准**:
- [ ] 所有集成测试通过
- [ ] 使用真实 HTML 样本

#### 5. package.json
**修改内容**: 新增测试脚本
```json
{
  "scripts": {
    "test:integration": "node --test tests/integration/*.test.js tests/parser-integration.test.js",
    "test:all": "npm run test && npm run test:integration"
  }
}
```

---

## 验收标准

### 功能验收
| 标准 | 目标值 | 验证方法 |
|------|--------|---------|
| DDG 验证码检测率 | 100% | 集成测试 |
| Bing 解析成功率 | 100% | 集成测试 |
| 搜索结果数量 | ≥ 5 | 功能验证 |
| 搜索耗时 | < 3s | 功能验证 |

### 代码质量验收
| 标准 | 目标值 | 验证方法 |
|------|--------|---------|
| 单元测试通过率 | 100% | npm test |
| 集成测试通过率 | 100% | npm run test:integration |
| 测试覆盖率 | ≥ 80% | npm test --coverage |

### 规范验收
| 标准 | 验证方法 |
|------|---------|
| L2 规范：生产区纯净 | ./NORMS/checks/check-norm-02.sh |
| L3 规范：命名归一化 | ./NORMS/checks/check-norm-03.sh |
| L4 规范：规划完整 | ./NORMS/checks/check-norm-04.sh |

---

## 执行计划

### OpenCode 执行步骤
1. 读取 PRD-FIX-001.md 和 ISSUE_LOG.md
2. 修改 `src/parser/ddg-parser.js`（增强验证码检测）
3. 修改 `src/parser/bing-parser.js`（优化正则）
4. 运行 `npm run test:all` 验证
5. 更新 `EXECUTION_LOG_v1.1.md`
6. 报告执行结果

### 预计耗时
- 代码修改：20 分钟
- 测试验证：15 分钟
- 文档更新：10 分钟
- **总计**: 45 分钟

---

## 回归测试范围

- [ ] 现有单元测试全部通过（10 个用例）
- [ ] 新增集成测试全部通过（7 个用例）
- [ ] 功能验证全部通过（7 个指标）

---

## 关联文档

- [ISSUE_LOG.md](./ISSUE_LOG.md) - 问题追踪日志
- [VERSION.md](./VERSION.md) - 版本历史
- [CHANGELOG.md](./CHANGELOG.md) - 变更日志

---

**审批**: OpenClaw ✅  
**执行**: OpenCode ⏳  
**创建日期**: 2026-03-23  
**目标完成日期**: 2026-03-23
