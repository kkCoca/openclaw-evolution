# 流程引擎配置文件

> **版本**: v3.4.0  
> **说明**: 本文档描述 `config/config.yaml` 的实际可用字段（与代码实现一致）。

---

## 全局设置

```yaml
global:
  # 默认 AI 工具（当前仅支持 opencode）
  defaultAITool: opencode

  # 工作区根目录（支持环境变量或相对路径）
  workspaceRoot: ${OPENCLAW_WORKSPACE_ROOT:-../../..}

  # 日志级别（仅影响控制台输出）
  logLevel: info

  # 运行态目录（审阅请求与临时产物）
  runtimeDir: ${CDF_RUNTIME_DIR:-.cdf-work}
```

---

## OpenCode CLI 配置

```yaml
openclaw:
  # opencode CLI 命令
  command: "opencode"
  # 固定参数（可选）
  args: ["--print"]
  # 任务参数名（默认 --task）
  taskArg: "--task"
  # 默认超时（秒）
  timeoutSecondsDefault: 1800
```

---

## 各阶段配置

每个阶段支持以下字段：

```yaml
stages:
  designing:
    aiTool: opencode
    requireReview: true
    timeoutSeconds: 1800
    maxRetries: 3
    outputDir: 01_designing
    outputsAllOf: [PRD.md, TRD.md]
```

支持的阶段：`designing`、`roadmapping`、`detailing`、`coding`、`testing`、`reviewing`、`precommit`、`releasing`。

`requireReview=false` 时会跳过该阶段审阅并直接标记通过（适用于纯本地演示或快速通路）。

---

## 回滚策略

```yaml
rollback:
  # A=当前阶段重做，B=回滚到上阶段，C=完全重启
  strategy: A
  maxRetriesPerStage: 3
```

---

## 环境变量替换

`config.yaml` 支持以下环境变量替换语法：

- `${VAR}`：环境变量未设置时替换为空字符串
- `${VAR:-default}`：环境变量未设置时使用默认值
- `${VAR:=default}`：环境变量未设置时使用默认值并写入环境变量

---

## 当前限制

- 仅支持 `opencode` 工具适配，未实现 `claude-code` 或 `custom` 适配器。
- 日志目前仅输出到控制台，未实现文件日志或轮转配置。
- 未实现并行阶段、审阅策略扩展等配置项。
