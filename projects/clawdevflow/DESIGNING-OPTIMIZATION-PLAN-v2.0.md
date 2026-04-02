# DESIGNING 阶段优化方案 v2.0 - 增加用户确认签字环节

**日期**: 2026-04-02 13:15  
**版本**: v2.0  
**优先级**: P0

---

## 一、环节定位

### 1.1 优化前流程

```
REQUIREMENTS.md
    ↓
designing 阶段
    ↓
PRD.md + TRD.md
    ↓
ReviewDesignAgent v3.1.0 审查（100/100）
    ↓
roadmapping 阶段 ← 直接进入
```

### 1.2 优化后流程

```
REQUIREMENTS.md
    ↓
designing 阶段
    ↓
PRD.md + TRD.md
    ↓
ReviewDesignAgent v3.1.0 审查（100/100）✅
    ↓
提炼关键需求说明和技术方案 ← 新增
    ↓
生成用户确认文档包 ← 新增
    ↓
用户签字确认 ← 新增
    ↓
确认通过？
    ↓
是 → roadmapping 阶段
否 → 返回 designing 阶段重新设计
```

---

## 二、新增用户确认签字环节

### 2.1 环节目标

**目的**: 在 designing 阶段审查通过后，roadmapping 阶段开始前，增加用户确认签字环节，确保用户理解和同意 PRD/TRD 设计方案。

**输入**:
- PRD.md（产品需求文档）
- TRD.md（技术设计文档）
- ReviewDesignAgent 审查报告（100/100）

**输出**:
- **KEY-REQUIREMENTS-SUMMARY.md**（关键需求说明）← 新增
- **TECHNICAL-SOLUTION-SUMMARY.md**（技术方案说明）← 新增
- **USER-CONFIRMATION.md**（用户确认签字）← 新增
- **DESIGN-CONFIRMATION-PACKAGE/**（用户确认文档包）← 新增

**审查**:
- ReviewDesignAgent v3.1.0（已完成，100/100）
- **用户确认签字** ← 新增

---

### 2.2 关键需求说明（KEY-REQUIREMENTS-SUMMARY.md）

**目的**: 提炼 PRD.md 中的核心需求，供用户快速理解和确认

**文件位置**: `01_designing/KEY-REQUIREMENTS-SUMMARY.md`

**模板**:
```markdown
# 关键需求说明 - {项目名称}

**版本**: v{PRD 版本}  
**日期**: {YYYY-MM-DD}  
**审阅状态**: ReviewDesignAgent v3.1.0 审查通过 ✅（100/100）

---

## 一、需求概述

{一句话描述项目目标}

---

## 二、核心功能需求

### 2.1 REQ-001: {需求名称}

**位置**: PRD.md L{行号}

**需求描述**:
{简洁描述需求内容}

**验收标准**:
- Given {前置条件}
- When {操作}
- Then {预期结果}

**优先级**: P0/P1/P2

---

### 2.2 REQ-002: {需求名称}

...

---

## 三、非功能需求

### 3.1 性能需求
- {性能指标 1}
- {性能指标 2}

### 3.2 安全需求
- {安全要求 1}
- {安全要求 2}

### 3.3 可用性需求
- {可用性要求 1}

---

## 四、需求追溯矩阵

| 需求 ID | REQUIREMENTS 位置 | PRD 章节 | 映射状态 |
|---------|------------------|---------|---------|
| REQ-001 | L13-43 | 2.2 | ✅ 已映射 |
| REQ-002 | L46-76 | 3.1-3.2 | ✅ 已映射 |
| ... | ... | ... | ... |

**覆盖率**: X/X = 100%

---

## 五、用户确认

### 5.1 确认事项

- [ ] 我已阅读并理解所有核心功能需求
- [ ] 我已阅读并理解所有非功能需求
- [ ] 我确认需求追溯矩阵完整（100% 覆盖）
- [ ] 我同意进入 roadmapping 阶段

### 5.2 用户签字

| 字段 | 值 |
|------|-----|
| **用户姓名** | |
| **签字日期** | |
| **联系方式** | |
| **确认意见** | □ 同意进入 roadmapping 阶段<br>□ 需要修改（见下方备注） |

### 5.3 备注

{用户填写修改意见或备注}

---

*关键需求说明 by clawdevflow*  
**版本**: v{PRD 版本} | **日期**: {YYYY-MM-DD}
```

---

### 2.3 技术方案说明（TECHNICAL-SOLUTION-SUMMARY.md）

**目的**: 提炼 TRD.md 中的核心技术方案，供用户理解和确认

**文件位置**: `01_designing/TECHNICAL-SOLUTION-SUMMARY.md`

**模板**:
```markdown
# 技术方案说明 - {项目名称}

**版本**: v{TRD 版本}  
**日期**: {YYYY-MM-DD}  
**审阅状态**: ReviewDesignAgent v3.1.0 审查通过 ✅（100/100）

---

## 一、技术架构

### 1.1 系统架构图

```
{系统架构图}
```

### 1.2 技术栈

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| 前端 | {技术} | {说明} |
| 后端 | {技术} | {说明} |
| 数据库 | {技术} | {说明} |
| 部署 | {技术} | {说明} |

---

## 二、核心模块设计

### 2.1 {模块名称 1}

**职责**: {模块职责描述}

**接口**:
- `{方法名 1}({参数})` - {功能说明}
- `{方法名 2}({参数})` - {功能说明}

**数据结构**:
```json
{
  "字段 1": "类型",
  "字段 2": "类型"
}
```

---

### 2.2 {模块名称 2}

...

---

## 三、数据库设计

### 3.1 数据表结构

| 表名 | 说明 | 字段数 |
|------|------|--------|
| {表名 1} | {说明} | X |
| {表名 2} | {说明} | X |

### 3.2 ER 图

```
{ER 图}
```

---

## 四、接口设计

### 4.1 内部接口

| 接口名 | 方法 | 路径 | 说明 |
|--------|------|------|------|
| {接口 1} | POST | /api/xxx | {说明} |
| {接口 2} | GET | /api/xxx | {说明} |

### 4.2 外部接口

| 接口名 | 提供方 | 说明 |
|--------|--------|------|
| {接口 1} | {提供方} | {说明} |

---

## 五、异常处理

### 5.1 正常流程

{正常流程说明}

### 5.2 失败处理

{失败处理方案}

### 5.3 边界情况

{边界情况说明}

### 5.4 重试机制

{重试机制说明}

### 5.5 降级方案

{降级方案说明}

### 5.6 监控告警

{监控告警说明}

---

## 六、技术选型说明

### 6.1 候选技术比较

| 技术 | 性能 | 成本 | 可维护性 | 选择 |
|------|------|------|---------|------|
| {技术 1} | 8 | 9 | 8 | ✅ |
| {技术 2} | 9 | 7 | 7 | ❌ |

### 6.2 决策依据

- {决策依据 1}
- {决策依据 2}
- {决策依据 3}

---

## 七、用户确认

### 7.1 确认事项

- [ ] 我已阅读并理解技术架构
- [ ] 我已阅读并理解核心模块设计
- [ ] 我已阅读并理解数据库设计
- [ ] 我已阅读并理解异常处理方案
- [ ] 我同意技术选型方案
- [ ] 我同意进入 roadmapping 阶段

### 7.2 用户签字

| 字段 | 值 |
|------|-----|
| **用户姓名** | |
| **签字日期** | |
| **联系方式** | |
| **确认意见** | □ 同意技术方案<br>□ 需要修改（见下方备注） |

### 7.3 备注

{用户填写修改意见或备注}

---

*技术方案说明 by clawdevflow*  
**版本**: v{TRD 版本} | **日期**: {YYYY-MM-DD}
```

---

### 2.4 用户确认签字（USER-CONFIRMATION.md）

**目的**: 用户正式确认签字文档

**文件位置**: `01_designing/USER-CONFIRMATION.md`

**模板**:
```markdown
# 用户确认签字 - {项目名称}

**确认日期**: {YYYY-MM-DD}  
**确认版本**: v{PRD/TRD 版本}

---

## 一、确认文档

本次确认包含以下文档：

| 文档 | 版本 | 审阅状态 |
|------|------|---------|
| PRD.md | v{版本} | ✅ ReviewDesignAgent v3.1.0 审查通过（100/100） |
| TRD.md | v{版本} | ✅ ReviewDesignAgent v3.1.0 审查通过（100/100） |
| KEY-REQUIREMENTS-SUMMARY.md | v{版本} | ✅ 已审阅 |
| TECHNICAL-SOLUTION-SUMMARY.md | v{版本} | ✅ 已审阅 |

---

## 二、用户确认声明

本人已阅读并理解以下文档：

1. **产品需求文档**（PRD.md）
   - 核心功能需求（X 项）
   - 非功能需求（性能/安全/可用性）
   - 需求追溯矩阵（100% 覆盖）

2. **技术设计文档**（TRD.md）
   - 技术架构
   - 核心模块设计
   - 数据库设计
   - 接口设计
   - 异常处理方案
   - 技术选型方案

3. **关键需求说明**（KEY-REQUIREMENTS-SUMMARY.md）
   - 核心功能需求提炼
   - 非功能需求提炼
   - 需求追溯矩阵

4. **技术方案说明**（TECHNICAL-SOLUTION-SUMMARY.md）
   - 技术架构提炼
   - 核心模块设计提炼
   - 技术选型说明

---

## 三、确认结论

本人确认：

- [ ] 需求理解正确，无歧义
- [ ] 技术方案合理，可接受
- [ ] 同意进入 roadmapping 阶段

**确认意见**:
- [ ] ✅ 同意进入 roadmapping 阶段
- [ ] ⚠️ 条件同意（需要修改，见备注）
- [ ] ❌ 不同意（需要重新设计，见备注）

---

## 四、用户签字

| 字段 | 值 |
|------|-----|
| **用户姓名** | |
| **签字** | {手写签字或电子签字} |
| **签字日期** | {YYYY-MM-DD} |
| **联系方式** | {邮箱/电话} |
| **职位** | {职位} |

---

## 五、审阅者签字

| 字段 | 值 |
|------|-----|
| **审阅者姓名** | openclaw-ouyp |
| **签字** | {电子签字} |
| **签字日期** | {YYYY-MM-DD} |

---

## 六、备注

{用户填写的修改意见或备注}

---

*用户确认签字 by clawdevflow*  
**确认日期**: {YYYY-MM-DD} | **版本**: v{版本}
```

---

## 三、审查流程

### 3.1 完整审查流程

```
PRD.md + TRD.md 生成完成
    ↓
ReviewDesignAgent v3.1.0 审查
    ↓
审查得分 >= 90%？
    ↓
是 → 生成用户确认文档包
    ↓
生成 KEY-REQUIREMENTS-SUMMARY.md
    ↓
生成 TECHNICAL-SOLUTION-SUMMARY.md
    ↓
生成 USER-CONFIRMATION.md
    ↓
发送给用户确认签字
    ↓
用户确认通过？
    ↓
是 → 进入 roadmapping 阶段
否 → 返回 designing 阶段重新设计
```

---

### 3.2 用户确认文档包结构

```
01_designing/
├── PRD.md                              # 产品需求文档
├── TRD.md                              # 技术设计文档
├── DESIGN-CONFIRMATION-PACKAGE/        # 用户确认文档包（新增）
│   ├── KEY-REQUIREMENTS-SUMMARY.md     # 关键需求说明
│   ├── TECHNICAL-SOLUTION-SUMMARY.md   # 技术方案说明
│   └── USER-CONFIRMATION.md            # 用户确认签字
└── DESIGNING-REVIEW-REPORT.md          # 审查报告
```

---

## 四、实施计划

### 阶段 1: 创建用户确认文档模板（P0, 2 小时）

**任务**:
- [ ] 创建 KEY-REQUIREMENTS-SUMMARY.md 模板
- [ ] 创建 TECHNICAL-SOLUTION-SUMMARY.md 模板
- [ ] 创建 USER-CONFIRMATION.md 模板
- [ ] 创建 DESIGN-CONFIRMATION-PACKAGE/ 目录结构

**输出**:
- `templates/KEY-REQUIREMENTS-SUMMARY-template.md`
- `templates/TECHNICAL-SOLUTION-SUMMARY-template.md`
- `templates/USER-CONFIRMATION-template.md`

**预计时间**: 2 小时

---

### 阶段 2: 实现文档生成功能（P0, 2 小时）

**任务**:
- [ ] 实现从 PRD.md 提炼关键需求
- [ ] 实现从 TRD.md 提炼技术方案
- [ ] 实现用户确认文档自动生成
- [ ] 实现文档包打包功能

**输出**:
- `scripts/generate-confirmation-package.js`
- `01_designing/DESIGN-CONFIRMATION-PACKAGE/`

**预计时间**: 2 小时

---

### 阶段 3: 集成到 designing 环节（P0, 2 小时）

**任务**:
- [ ] 修改 designing 环节流程
- [ ] 在 ReviewDesignAgent 审查后生成用户确认文档包
- [ ] 添加用户确认签字环节
- [ ] 添加用户确认通过检查

**输出**:
- `bundled-skills/designing/SKILL.md`（更新）
- `adapters/opencode.js`（更新）

**预计时间**: 2 小时

---

### 阶段 4: 测试验证（P1, 1 小时）

**任务**:
- [ ] 测试用户确认文档包生成
- [ ] 测试 ReviewDesignAgent 审查流程
- [ ] 测试用户确认签字流程
- [ ] 测试完整 designing 环节

**输出**:
- `tests/test-designing-confirmation.js`

**预计时间**: 1 小时

---

## 五、验收标准

### Given
- PRD.md 存在且审查通过（ReviewDesignAgent v3.1.0，100/100）
- TRD.md 存在且审查通过（ReviewDesignAgent v3.1.0，100/100）

### When
- 执行 designing 阶段
- 生成用户确认文档包
- 用户确认签字

### Then
- ✅ KEY-REQUIREMENTS-SUMMARY.md 提炼核心需求
- ✅ TECHNICAL-SOLUTION-SUMMARY.md 提炼技术方案
- ✅ USER-CONFIRMATION.md 包含用户签字
- ✅ 用户确认签字完成
- ✅ 用户确认通过后进入 roadmapping 阶段
- ✅ 用户确认不通过时返回 designing 重新设计

---

## 六、端到端流程

```
REQUIREMENTS.md
    ↓
designing 阶段
    ↓
PRD.md + TRD.md
    ↓
ReviewDesignAgent v3.1.0 审查（100/100）✅
    ↓
生成用户确认文档包 ← 本次优化
    ↓
用户确认签字 ← 本次优化
    ↓
确认通过？
    ↓
是 → roadmapping 阶段
否 → 返回 designing 重新设计
```

---

## 七、预期收益

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 用户理解度 | 低（文档太长） | 高（提炼关键信息） | 显著提升 |
| 用户确认 | 无正式确认 | 正式签字确认 | 显著提升 |
| 需求追溯 | PRD 追溯 REQUIREMENTS | 增加用户确认环节 | 显著提升 |
| 设计质量 | ReviewDesignAgent 审查 | 审查 + 用户确认双重保障 | 显著提升 |
| 返工风险 | 高（用户可能不理解） | 低（用户签字确认） | 显著降低 |

---

## 八、总结

### 8.1 核心创新

1. **用户确认签字环节** - 在 designing 阶段审查通过后，roadmapping 阶段前增加用户确认
2. **关键需求说明** - 提炼 PRD 核心需求，供用户快速理解
3. **技术方案说明** - 提炼 TRD 核心技术方案，供用户理解
4. **双重质量保障** - ReviewDesignAgent 审查 + 用户确认签字

### 8.2 与之前方案的区别

| 特性 | 原方案（detailing） | 新方案（designing） |
|------|-------------------|-------------------|
| **环节位置** | detailing 阶段后 | designing 阶段后 |
| **输入文档** | DETAIL.md | PRD.md + TRD.md |
| **审查 Agent** | ReviewDetailingAgent v1.0.0 | ReviewDesignAgent v3.1.0 |
| **进入下一阶段** | coding 阶段 | roadmapping 阶段 |
| **优势** | 代码实现前确认 | 设计阶段确认，返工成本更低 ✅ |

### 8.3 为什么选择 designing 阶段？

**优势**:
1. **返工成本更低** - 在设计阶段确认，比代码实现后确认返工成本低
2. **用户更易理解** - 需求和设计方案比代码细节更易理解
3. **流程更合理** - 设计确认后再做开发计划（roadmapping）更合理
4. **质量保障更早** - 在流程早期发现问 题，质量保障更早

---

*designing 阶段优化方案 v2.0 by openclaw-ouyp*  
**版本**: v2.0 | **日期**: 2026-04-02 13:15 | **状态**: 待评审
