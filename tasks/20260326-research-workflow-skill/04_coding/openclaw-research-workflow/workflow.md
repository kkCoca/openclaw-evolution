# 流程编排逻辑

## 输入解析

1. 接收用户需求
2. 解析场景类型（全新功能/增量需求/问题修复）
3. 提取关键信息（目标、约束、验收标准）

## 流程编排

### 阶段 1: designing

调用 designing skill：
- **输入**: 用户需求
- **输出**: `01_designing/PRD.md` + `01_designing/TRD.md`
- **检查点**: 文档完整性
- **触发条件**: 用户确认需求后

**执行步骤**:
1. 将用户需求传递给 designing skill
2. designing skill 分析需求类型（新建/直出/审查/增量）
3. designing skill 与用户确认模式和输出格式
4. designing skill 询问需求细节（一次一问）
5. designing skill 输出 PRD.md + TRD.md
6. 验证文档完整性

### 阶段 2: roadmapping

调用 roadmapping skill：
- **输入**: PRD.md + TRD.md
- **输出**: `02_roadmapping/ROADMAP.md`
- **检查点**: 开发计划可行性
- **触发条件**: designing 阶段完成后

**执行步骤**:
1. 将 PRD.md + TRD.md 传递给 roadmapping skill
2. roadmapping skill 分析需求规模和复杂度
3. roadmapping skill 制定开发阶段和里程碑
4. roadmapping skill 输出 ROADMAP.md
5. 验证开发计划可行性

### 阶段 3: detailing

调用 detailing skill：
- **输入**: PRD.md + TRD.md + ROADMAP.md
- **输出**: `03_detailing/DETAIL.md`
- **检查点**: 文件级设计完整性
- **触发条件**: roadmapping 阶段完成后

**执行步骤**:
1. 将 PRD.md + TRD.md + ROADMAP.md 传递给 detailing skill
2. detailing skill 分析系统架构和模块划分
3. detailing skill 设计文件结构和接口
4. detailing skill 输出 DETAIL.md
5. 验证文件级设计完整性

### 阶段 4: coding

调用 coding skill：
- **输入**: DETAIL.md
- **输出**: `04_coding/src/` + `04_coding/tests/` + `04_coding/README.md`
- **检查点**: 代码质量 + 测试覆盖率
- **触发条件**: detailing 阶段完成后

**执行步骤**:
1. 将 DETAIL.md 传递给 coding skill
2. coding skill 按照设计实现代码
3. coding skill 编写单元测试
4. coding skill 编写文档
5. 验证代码质量和测试覆盖率

### 阶段 5: reviewing

调用 reviewing skill：
- **输入**: 所有产出（PRD+TRD+ROADMAP+DETAIL+ 代码 + 测试 + 文档）
- **输出**: `05_reviewing/REVIEW-REPORT.md`
- **检查点**: 验收通过
- **触发条件**: coding 阶段完成后

**执行步骤**:
1. 将所有产出传递给 reviewing skill
2. reviewing skill 执行代码审查
3. reviewing skill 执行文档审查
4. reviewing skill 输出验收报告
5. 验证验收通过

## 错误处理

### 安装错误

| 错误 | 处理 |
|------|------|
| Node.js 未安装 | 提示用户安装 Node.js |
| OpenClaw 未安装 | 提示用户安装 OpenClaw |
| 权限不足 | 提示用户使用 sudo/admin 运行 |

### 执行错误

| 错误 | 处理 |
|------|------|
| skill 未找到 | 检查 bundled-skills 目录，提示重新安装 |
| 流程中断 | 输出错误位置和建议，支持断点续传 |
| 依赖缺失 | 自动修复或提示用户重新安装 |
| 连续失败 3 次 | 提示用户介入，提供错误日志 |

### 恢复机制

1. **断点续传**: 记录每个阶段的完成状态，支持从中断点继续
2. **回滚机制**: 任何阶段失败可回滚到上一稳定状态
3. **日志记录**: 完整记录执行日志，便于排查问题

## 输出汇总

最终输出完整研发产出目录结构：

```
{任务目录}/
├── 01_designing/
│   ├── PRD.md
│   └── TRD.md
├── 02_roadmapping/
│   └── ROADMAP.md
├── 03_detailing/
│   └── DETAIL.md
├── 04_coding/
│   ├── src/
│   ├── tests/
│   └── README.md
└── 05_reviewing/
    └── REVIEW-REPORT.md
```

**重要**: 所有产出必须严格按照上述目录结构组织，**禁止**直接输出到任务根目录！

## 场景适配

### 全新功能开发

- 完整执行所有 5 个阶段
- 每个阶段都产出完整文档
- 适用于从 0 到 1 的项目

### 增量需求开发

- 完整执行所有 5 个阶段
- designing 阶段分析现有系统
- 适用于在现有基础上添加功能

### 问题修复

- 可跳过 designing 阶段（如果问题明确）
- 重点在 roadmapping 和 detailing 阶段
- 适用于定位和修复现有问题

## 性能优化

1. **并行处理**: 独立的子任务可并行执行
2. **缓存机制**: 已加载的 skills 缓存在内存中
3. **增量更新**: 只重新生成变更的部分

## 质量保证

1. **阶段检查点**: 每个阶段完成后执行检查
2. **一致性验证**: 多文档输出时验证一致性
3. **用户确认**: 关键决策点需要用户确认
