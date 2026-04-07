# 流程引擎配置文件

> **版本**: v3.4.0 (Stable)  
> **说明**: 流程引擎运行时配置，支持 AI 工具选择、审阅配置、回滚策略等  
> **发布说明**: Designing Policy 优化完整修复 - 22 个问题全部修复，29/29 测试通过

---

## 全局设置

```yaml
global:
  # 默认 AI 工具
  defaultAITool: opencode
  
  # 工作区根目录（支持环境变量或相对路径）
  # 优先级：OPENCLAW_WORKSPACE_ROOT 环境变量 > 相对路径
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}
  
  # 日志级别 (debug | info | warn | error)
  logLevel: info
  
  # 状态文件路径
  stateFile: ./state.json
  
  # 日志目录
  logDir: ./logs
  
  # 审阅 Agent 版本配置（新增）
  # 可选值：v1.0（原版）| v2.0（优化版，带 Freshness + Traceability Gate）
  reviewAgent:
    version: v2.0
```

---

## 各阶段配置

```yaml
stages:
  # ========== designing 阶段 ==========
  designing:
    # 使用的 AI 工具（覆盖全局默认）
    aiTool: opencode
    
    # 是否需要审阅（默认 true）
    requireReview: true
    
    # 子会话超时（秒）
    timeoutSeconds: 1800
    
    # ========== Designing Policy v3.2.0（新增）==========
    policy:
      # 审批模式：two_step（PRD+TRD 分两次）| one_step（合并确认）| auto（智能选择）
      approvals:
        mode: auto  # v3.3.0 更新：auto 模式根据需求规模自动选择
        
        # 小需求标准（满足任一即为小需求，使用 one_step）
        small_scope:
          max_requirements: 2       # 需求数量 <= 2
          max_prd_lines: 200        # PRD 行数 <= 200
          max_trd_lines: 300        # TRD 行数 <= 300
          no_complex_tech: true     # 不涉及复杂技术选型
        
        # 超时配置（秒）
        timeout:
          prd_confirmation: 3600  # 1 小时
          trd_confirmation: 3600  # 1 小时
        
        # 超时处理：notify_user | auto_approve（仅 one_step 模式）
        on_timeout: notify_user
      
      # conditional 是否阻断流程（true=阻断，false=可继续）
      conditional_blocks_progress: true
      
      # 阻断规则：blocking_issues_nonempty（有 blocker 就阻断）
      blocking_rule: blocking_issues_nonempty
      
      # 严重性模型（v3.3.0 新增）
      severity_model:
        # blocker 级别（必须修复）
        blocker:
          - FG_HASH_MISMATCH        # 哈希不匹配
          - FG_FAILED               # Freshness Gate 失败
          - TG_FAILED               # Traceability Gate 失败
          - TG_MISSING_MAPPING      # 需求未映射
          - D7_AC_MISSING           # 验收标准缺失
        
        # warning 级别（建议修复，但不阻断）
        warning:
          - DOCUMENT_FORMAT         # 文档格式建议
          - NON_CRITICAL_SECTION    # 非关键章节缺失
          - CODE_STYLE              # 代码风格建议
      
      # 是否使用 overall.score 判断阻断（建议 false，因为 AI checks 可能是 mock）
      use_overall_score_for_blocking: false
      
      # 重试配置
      retry:
        max_total_retries: 5          # 总重试次数上限
        max_retries_per_issue:        # 每个问题的最大重试次数
          FG_HASH_MISMATCH: 2
          TG_MISSING_MAPPING: 3
          D7_AC_MISSING: 3
          DEFAULT: 3
        same_issue_streak_limit: 3    # 同一问题连续出现次数上限
      
      # 升级处理（重试耗尽时）
      escalation:
        on_retry_exhausted: clarify_required  # clarify_required | terminate
    
    # 最大重试次数
    maxRetries: 3
    
    # 输出目录
    outputDir: 01_designing
    
    # 输出文件
    outputs:
      - PRD.md
      - TRD.md
    
    # 审阅检查点
    reviewCheckpoints:
      - id: D1
        name: 需求覆盖率 100%
        description: 对照 REQUIREMENTS.md 逐条核对
      - id: D2
        name: 无模糊描述
        description: 搜索"适当的"、"一些"、"可能"等模糊词
      - id: D3
        name: 技术选型合理
        description: 检查技术选型章节的比较表
      - id: D4
        name: PRD/TRD 职责清晰
        description: PRD 只含需求+UI，TRD 只含技术 + 数据库
      - id: D5
        name: 异常处理完整
        description: 正常流程 + 失败处理 + 边界情况都覆盖
      - id: D6
        name: 向后兼容
        description: 明确说明兼容性策略（增量需求适用）

  # ========== roadmapping 阶段 ==========
  roadmapping:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 02_roadmapping
    outputs:
      - ROADMAP.md
    reviewCheckpoints:
      - id: R1
        name: 任务拆分合理
        description: 所有任务在 0.5-2 人天范围内
      - id: R2
        name: 依赖关系清晰
        description: 前置任务明确标注
      - id: R3
        name: 工作量估算可信
        description: 估算与复杂度匹配
      - id: R4
        name: 包含联调测试项
        description: 前后端各有联调测试项
      - id: R5
        name: 包含演示项
        description: 固定 0.5 人天演示项
      - id: R6
        name: 涉及模块完整
        description: 所有改动模块都列出

  # ========== detailing 阶段 ==========
  detailing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 03_detailing
    outputs:
      - DETAIL.md
    reviewCheckpoints:
      - id: D1
        name: 文件级设计完整
        description: 所有需要新增/修改的文件都列出
      - id: D2
        name: 接口定义清晰
        description: 方法名、参数、返回值完整
      - id: D3
        name: 无实现代码
        description: 只有方法签名，无实现逻辑
      - id: D4
        name: 符合最佳实践
        description: 设计符合框架约定
      - id: D5
        name: 数据库变更完整
        description: 表结构、字段、索引都定义
      - id: D6
        name: 配置变更完整
        description: 新增配置项都列出

  # ========== coding 阶段 ==========
  coding:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 3600
    maxRetries: 3
    outputDir: 04_coding
    outputs:
      - src/
      - tests/
      - README.md
    reviewCheckpoints:
      - id: C1
        name: 功能完整实现
        description: 对照 DETAIL.md 逐条核对
      - id: C2
        name: 类型安全
        description: 无 any/raw type 等模糊类型
      - id: C3
        name: 测试覆盖核心逻辑
        description: 核心业务逻辑有单元测试
      - id: C4
        name: 无重复代码
        description: 无明显重复逻辑
      - id: C5
        name: 边界处理完整
        description: null/undefined/空集合都处理
      - id: C6
        name: 代码符合最佳实践
        description: 遵循框架约定和最佳实践
      - id: C7
        name: 文档完整
        description: 安装、使用、配置说明完整

  # ========== reviewing 阶段 ==========
  reviewing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 05_reviewing
    outputs:
      - REVIEW-REPORT.md
    reviewCheckpoints:
      - id: V1
        name: 需求对齐验证
        description: 对照 REQUIREMENTS.md 逐条验证
      - id: V2
        name: 架构一致性检查
        description: 对照 TRD.md 检查架构
      - id: V3
        name: 代码质量审查
        description: 无严重质量问题
      - id: V4
        name: 问题清单完整
        description: 所有发现的问题都列出
      - id: V5
        name: 验收结论清晰
        description: 通过/不通过理由明确
      - id: V6
        name: 修复建议可行
        description: 建议具体可执行
```

---

## 审阅配置

```yaml
review:
  # 必须审阅的阶段（默认全部）
  requiredStages:
    - designing
    - roadmapping
    - detailing
    - coding
    - reviewing
  
  # 审阅超时（小时），超时后发送提醒
  timeoutHours: 24
  
  # 审阅结论选项
  decisionOptions:
    - pass        # 通过
    - conditional # 条件通过
    - reject      # 驳回
    - clarify     # 需澄清
  
  # 审阅请求模板
  requestTemplate: |
    ## 📋 阶段审阅：{stageName}
    
    ### 本阶段目标
    {stageGoal}
    
    ### 输入文档
    {inputDocuments}
    
    ### 输出文档
    {outputDocuments}
    
    ### 审阅检查点
    | 编号 | 检查项 | 状态 | 备注 |
    |------|--------|------|------|
    {checkpoints}
    
    ### 关键决策
    {keyDecisions}
    
    ### 审阅结论
    请选择：
    - ✅ 通过（进入下一阶段）
    - ⚠️ 条件通过（有以下小问题需后续修复：___）
    - ❌ 驳回（需重新执行当前阶段，原因：___）
    - ❓ 需澄清（有以下问题：___）
```

---

## 回滚策略

```yaml
rollback:
  # 策略：A=当前阶段重做，B=回滚到上阶段，C=完全重启
  strategy: A
  
  # 最大重试次数（每个阶段）
  maxRetriesPerStage: 3
  
  # 最大重试次数（整个流程）
  maxRetriesTotal: 10
  
  # 重试间隔（秒）
  retryDelaySeconds: 5
  
  # 重试时传递驳回原因
  passRejectReason: true
```

---

## 并行化配置

```yaml
parallel:
  # 是否启用并行
  enabled: true
  
  # 可并行的阶段组合
  groups:
    # 前端和后端编码可并行
    - name: coding-parallel
      stages:
        - coding-frontend
        - coding-backend
      maxParallel: 2
  
  # 并行任务数限制
  maxConcurrentTasks: 3
```

---

## AI 工具配置

```yaml
aiTools:
  # ========== OpenCode 配置 ==========
  opencode:
    command: opencode
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    env: {}
  
  # ========== Claude Code 配置 ==========
  claude-code:
    command: claude
    args:
      - --print
      - --permission-mode
      - bypassPermissions
    env: {}
  
  # ========== 自定义 AI 工具配置 ==========
  custom:
    command: /path/to/custom/tool
    args: []
    env:
      API_KEY: ${CUSTOM_AI_API_KEY}
```

---

## 日志配置

```yaml
logging:
  # 日志格式 (json | text)
  format: json
  
  # 日志级别
  level: info
  
  # 日志轮转
  rotation:
    enabled: true
    maxSize: 10MB
    maxFiles: 10
  
  # 日志内容
  include:
    - timestamp
    - workflowId
    - stage
    - event
    - details
```

---

*配置文件说明*：
- 此文件为模板，实际使用时可根据需要调整
- YAML 格式，注意缩进
- 环境变量使用 `${VAR_NAME}` 语法
- 路径支持相对路径（相对于项目根目录）和绝对路径
