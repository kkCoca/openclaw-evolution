# DETAILING 阶段执行环节详解 v3.1.6

**日期**: 2026-04-02 17:31  
**版本**: v3.1.6（完整研发流程中的 detailing 阶段）  
**场景**: designing→roadmapping→**detailing**→coding→reviewing

---

## 一、完整研发流程中的 DETAILING 阶段

### 1.1 流程位置

```
REQUIREMENTS.md
    ↓
[DESIGNING 阶段]
    ↓
PRD.md + TRD.md
    ↓
[ROADMAPPING 阶段]
    ↓
ROADMAP.md
    ↓
[DETAILING 阶段] ← 本环节
    ↓
DETAIL.md
    ↓
[CODING 阶段]
    ↓
源代码
    ↓
[REVIEWING 阶段]
    ↓
REVIEW-REPORT.md
```

### 1.2 DETAILING 阶段输入输出

**输入**:
| 文件 | 位置 | 版本 | 说明 |
|------|------|------|------|
| PRD.md | 01_designing/ | v3.1.6 | 产品需求文档 |
| TRD.md | 01_designing/ | v3.1.6 | 技术设计文档 |
| ROADMAP.md | 02_roadmapping/ | v3.1.6 | 开发计划文档 |

**输出**:
| 文件 | 位置 | 版本 | 说明 |
|------|------|------|------|
| DETAIL.md | 03_detailing/ | v3.1.6 | 文件级详细设计文档 |

---

## 二、DETAILING 阶段执行环节

### 2.1 环节总览

```
┌─────────────────────────────────────────────────────────────────┐
│ DETAILING 阶段执行环节                                           │
└─────────────────────────────────────────────────────────────────┘

PRD.md v3.1.6 + TRD.md v3.1.6 + ROADMAP.md v3.1.6
    ↓
[环节 1] 读取 config.yaml 配置
    ↓
[环节 2] 调用 AI 工具执行 detailing skill
    ↓
[环节 3] 阅读 PRD.md、TRD.md、ROADMAP.md
    ↓
[环节 4] 生成文件级详细设计
    ↓
[环节 5] 写入 DETAIL.md
    ↓
进入 CODING 阶段
```

---

### 环节 1: 读取 config.yaml 配置

**输入依赖**:
| 依赖项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| config.yaml | 配置文件 | 04_coding/src/config.yaml | AI 工具配置 |

**config.yaml 配置内容**:
```yaml
global:
  # 默认 AI 工具（可配置）
  defaultAITool: opencode  # 可选：opencode / claude-code / custom
  
  # 工作区根目录
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  
  # 日志级别
  logLevel: info

stages:
  detailing:
    # AI 工具配置（可覆盖全局默认）
    aiTool: opencode  # 可选：opencode / claude-code / custom
    
    # 是否需要审阅
    requireReview: true
    
    # 子会话超时（秒）
    timeoutSeconds: 1800
    
    # 最大重试次数
    maxRetries: 3
    
    # 输出目录
    outputDir: 03_detailing
    
    # 输出文件
    outputs:
      - DETAIL.md
```

**执行动作**:
```javascript
// workflow-executor.js - loadConfig()
const config = loadConfig(); // 读取 config.yaml
const aiTool = config.stages.detailing.aiTool || config.global.defaultAITool;
```

**产出**:
| 产出项 | 类型 | 说明 |
|--------|------|------|
| config | 对象 | 完整配置对象 |
| aiTool | 字符串 | AI 工具名称（opencode/claude-code/custom） |

**耗时**: ~1 秒

---

### 环节 2: 调用 AI 工具执行 detailing skill

**输入依赖**:
| 依赖项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| workflowConfig | 对象 | 上一环节产出 | 工作流配置 |
| config | 对象 | 环节 1 产出 | 配置对象 |
| aiTool | 字符串 | 环节 1 产出 | AI 工具名称 |
| workflow-executor.js | 脚本 | 04_coding/src/ | 流程引擎入口 |

**执行动作**:
```javascript
// workflow-executor.js
const result = await orchestrator.execute({
  projectPath: '/path/to/project',
  scenario: '增量需求',
  requirementsFile: 'REQUIREMENTS.md',
  aiTool: aiTool // 从 config.yaml 读取
});

// adapters/opencode.js - buildTask()
const task = `你是一个系统架构师。请执行 detailing skill：

## 输入
- PRD.md：产品需求文档
- TRD.md：技术设计文档
- ROADMAP.md：开发计划

## 执行步骤
1. 阅读 PRD.md，理解功能需求、业务边界、验收标准
2. 阅读 TRD.md，理解技术架构、模块划分、接口设计
3. 阅读 ROADMAP.md，理解开发计划、任务分解、里程碑
4. 生成文件级详细设计 DETAIL.md

## 输出要求
- DETAIL.md 包含文件级详细设计
- 包含模块设计、接口设计、数据结构设计
- 包含代码结构说明
- 直接创建文件到指定目录
`;
```

**产出**:
| 产出项 | 类型 | 说明 |
|--------|------|------|
| workflowConfig | 对象 | 工作流配置（workflowId, scenario, projectPath） |
| state.json | 文件 | 工作流状态（.cdf-state.json） |

**耗时**: ~1 秒

---

### 环节 3: 阅读 PRD.md、TRD.md、ROADMAP.md

**输入依赖**:
| 依赖项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| PRD.md v3.1.6 | 文件 | 01_designing/PRD.md | DESIGNING 环节产出 |
| TRD.md v3.1.6 | 文件 | 01_designing/TRD.md | DESIGNING 环节产出 |
| ROADMAP.md v3.1.6 | 文件 | 02_roadmapping/ROADMAP.md | ROADMAPPING 环节产出 |
| detailing skill | 技能 | 04_coding/src/bundled-skills/detailing/ | detailing 技能定义 |
| AI 工具 | 外部 | - | 根据 config.yaml 配置选择 |

**执行动作**:
```javascript
// AI 工具执行（根据 config.yaml 配置）
const prdContent = fs.readFileSync(prdPath, 'utf8');
const trdContent = fs.readFileSync(trdPath, 'utf8');
const roadmapContent = fs.readFileSync(roadmapPath, 'utf8');

// 提取关键信息
const requirements = extractRequirements(prdContent);
const technicalArchitecture = extractArchitecture(trdContent);
const developmentPlan = extractPlan(roadmapContent);
```

**产出**:
| 产出项 | 类型 | 说明 |
|--------|------|------|
| requirements | 数组 | 需求列表（从 PRD.md 提取） |
| technicalArchitecture | 对象 | 技术架构（从 TRD.md 提取） |
| developmentPlan | 对象 | 开发计划（从 ROADMAP.md 提取） |

**耗时**: ~2-5 秒

---

### 环节 4: 生成文件级详细设计

**输入依赖**:
| 依赖项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| requirements | 数组 | 环节 3 产出 | 需求列表 |
| technicalArchitecture | 对象 | 环节 3 产出 | 技术架构 |
| developmentPlan | 对象 | 环节 3 产出 | 开发计划 |
| detailing skill | 技能 | 04_coding/src/bundled-skills/detailing/ | detailing 技能定义 |
| AI 工具 | 外部 | - | 根据 config.yaml 配置选择 |

**执行动作**:
```javascript
// 生成文件级详细设计
const detail = {
  projectName: extractProjectName(requirements),
  overview: generateOverview(requirements),
  moduleDesign: generateModuleDesign(technicalArchitecture),
  interfaceDesign: generateInterfaceDesign(technicalArchitecture),
  dataStructureDesign: generateDataStructureDesign(technicalArchitecture),
  codeStructure: generateCodeStructure(developmentPlan)
};

// 格式化 DETAIL.md
const detailContent = formatToMarkdown(detail);
```

**产出**:
| 产出项 | 类型 | 说明 |
|--------|------|------|
| detailContent | 字符串 | DETAIL.md 内容（内存中） |

**DETAIL.md 核心章节**:
- 第 1 章：概述
- 第 2 章：模块设计
- 第 3 章：接口设计
- 第 4 章：数据结构设计
- 第 5 章：代码结构说明
- 第 6 章：验收标准

**耗时**: ~10-20 秒

---

### 环节 5: 写入 DETAIL.md

**输入依赖**:
| 依赖项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| detailContent | 字符串 | 环节 4 产出 | DETAIL.md 内容 |
| detailing skill | 技能 | 04_coding/src/bundled-skills/detailing/ | 输出目录配置 |

**执行动作**:
```javascript
// 写入 DETAIL.md
fs.writeFileSync(outputPath, detailContent, 'utf8');
```

**产出**:
| 产出项 | 类型 | 位置 | 说明 |
|--------|------|------|------|
| DETAIL.md v3.1.6 | 文件 | 03_detailing/DETAIL.md | 文件级详细设计文档 |

**耗时**: ~2-5 秒

---

## 三、环节总结

### 3.1 环节依赖关系图

```
┌──────────────────────────────────────────────────────────────┐
│ 环节 1: 读取 config.yaml 配置                                 │
│ 依赖：config.yaml                                            │
│ 产出：config, aiTool                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 环节 2: 调用 AI 工具执行 detailing skill                       │
│ 依赖：workflowConfig, config, aiTool                         │
│ 产出：workflowConfig, state.json                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 环节 3: 阅读 PRD.md、TRD.md、ROADMAP.md                       │
│ 依赖：PRD.md, TRD.md, ROADMAP.md                             │
│ 产出：requirements, technicalArchitecture, developmentPlan   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 环节 4: 生成文件级详细设计                                     │
│ 依赖：requirements, technicalArchitecture, developmentPlan   │
│ 产出：detailContent（内存中）                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────────┐
│ 环节 5: 写入 DETAIL.md                                        │
│ 依赖：detailContent                                          │
│ 产出：DETAIL.md v3.1.6                                       │
└──────────────────────────────────────────────────────────────┘
                     │
                     ↓
          进入 CODING 阶段
```

---

### 3.2 时间和资源消耗

| 环节 | 预计时间 | 实际时间 | CPU | 内存 | 网络 |
|------|---------|---------|-----|------|------|
| 1. 读取 config.yaml | ~1 秒 | ~1 秒 | 低 | 低 | 无 |
| 2. 调用 AI 工具 | ~1 秒 | ~1 秒 | 低 | 低 | 无 |
| 3. 阅读 PRD/TRD/ROADMAP | ~2-5 秒 | ~3 秒 | 低 | 中 | 无 |
| 4. 生成文件级详细设计 | ~10-20 秒 | ~15 秒 | 中 | 中 | 有（AI 工具） |
| 5. 写入 DETAIL.md | ~2-5 秒 | ~3 秒 | 低 | 低 | 无 |
| **总计** | **~16-32 秒** | **~23 秒** | - | - | - |

---

### 3.3 关键产出物

| 产出物 | 类型 | 位置 | 用途 |
|--------|------|------|------|
| DETAIL.md v3.1.6 | 文件 | 03_detailing/DETAIL.md | 文件级详细设计文档 |
| config | 对象 | 内存中 | 配置对象 |
| aiTool | 字符串 | 内存中 | AI 工具名称 |
| requirements | 数组 | 内存中 | 需求列表 |
| technicalArchitecture | 对象 | 内存中 | 技术架构 |
| developmentPlan | 对象 | 内存中 | 开发计划 |
| detailContent | 字符串 | 内存中 | DETAIL.md 内容 |

---

### 3.4 核心原则遵循

| 原则 | 实现方式 | 验证方法 |
|------|---------|---------|
| **不生成额外文件** | 只生成 DETAIL.md | `ls 03_detailing/` 仅 DETAIL.md |
| **AI 工具可配置** | config.yaml 配置（默认 opencode，可切换） | `cat config.yaml \| grep aiTool` |
| **文件级详细设计** | 包含模块/接口/数据结构/代码结构设计 | `grep "## " DETAIL.md` |
| **Git 版本管理** | git-manager.js 自动提交和 Tag | `git log --oneline` |

---

### 3.5 config.yaml 配置说明

**全局配置**:
```yaml
global:
  # 默认 AI 工具（可配置）
  defaultAITool: opencode  # 可选：opencode / claude-code / custom
  
  # 工作区根目录
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  
  # 日志级别
  logLevel: info
```

**阶段配置（优先级：阶段配置 > 全局配置）**:
```yaml
stages:
  detailing:
    # AI 工具配置（可覆盖全局默认）
    aiTool: opencode  # 可选：opencode / claude-code / custom
    
    # 是否需要审阅
    requireReview: true
    
    # 子会话超时（秒）
    timeoutSeconds: 1800
    
    # 最大重试次数
    maxRetries: 3
    
    # 输出目录
    outputDir: 03_detailing
    
    # 输出文件
    outputs:
      - DETAIL.md
```

**AI 工具切换**:
```yaml
# 切换到 Claude Code
global:
  defaultAITool: claude-code

# 或针对特定阶段切换
stages:
  detailing:
    aiTool: claude-code
```

---

## 四、与上下游环节的关系

### 4.1 上游环节

| 环节 | 产出 | 作为 DETAILING 的输入 |
|------|------|---------------------|
| DESIGNING | PRD.md + TRD.md | ✅ 环节 3 阅读 |
| ROADMAPPING | ROADMAP.md | ✅ 环节 3 阅读 |

### 4.2 下游环节

| 环节 | 输入 | 来自 DETAILING 的产出 |
|------|------|---------------------|
| CODING | DETAIL.md | ✅ 环节 5 产出 |
| REVIEWING | 所有产出文档 | ✅ 环节 5 产出（间接） |

---

### 4.3 完整流程数据流

```
REQUIREMENTS.md
    ↓
[DESIGNING]
    ↓
PRD.md + TRD.md
    ↓
[ROADMAPPING]
    ↓
ROADMAP.md
    ↓
[DETAILING] ← 本环节
    ├─ 环节 1: 读取 config.yaml → config, aiTool
    ├─ 环节 2: 调用 AI 工具 → workflowConfig, state.json
    ├─ 环节 3: 阅读文档 → requirements, technicalArchitecture, developmentPlan
    ├─ 环节 4: 生成设计 → detailContent（内存中）
    └─ 环节 5: 写入文件 → DETAIL.md
    ↓
[CODING]
    ↓
源代码
    ↓
[REVIEWING]
    ↓
REVIEW-REPORT.md
```

---

## 五、可能需要调整的环节

### 5.1 当前环节优点

1. ✅ **不生成额外文件** - 只生成 DETAIL.md
2. ✅ **AI 工具可配置** - 根据 config.yaml 灵活切换
3. ✅ **文件级详细设计** - 包含模块/接口/数据结构/代码结构设计
4. ✅ **高效** - ~23 秒完成整个环节
5. ✅ **与上下游衔接顺畅** - 输入输出明确

### 5.2 可能需要调整的环节

| 环节 | 当前实现 | 可能问题 | 建议调整 |
|------|---------|---------|---------|
| 环节 4: 生成文件级详细设计 | AI 工具自动生成 | 可能遗漏关键设计细节 | 可增加设计检查清单（类似 roadmapping 的 12 项检查） |
| 环节 5: 写入 DETAIL.md | 直接写入文件 | 无质量检查 | 可增加简单验证（章节完整性检查） |

### 5.3 建议保留的环节

| 环节 | 建议 | 理由 |
|------|------|------|
| 环节 1-2 | 保留 | config.yaml 配置读取，AI 工具可配置 |
| 环节 3 | 保留 | PRD/TRD/ROADMAP 阅读，理解需求和技术架构 |
| 环节 4 | 保留 | AI 工具自动生成文件级详细设计 |
| 环节 5 | 保留 | DETAIL.md 写入，符合"不生成额外文件"原则 |

---

*DETAILING 阶段执行环节详解 v3.1.6 by openclaw-ouyp*  
**版本**: v3.1.6 | **日期**: 2026-04-02 17:31 | **状态**: 完成 ✅
