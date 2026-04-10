# OpenCode CLI 执行契约

> 版本：v2.0.0  
> 更新日期：2026-04-10

---

## 概述

ClawDevFlow (CDF) 在每个阶段**直接 spawn opencode CLI**，执行完毕后退出并扫描产物。该文件描述执行契约与错误码约定。

---

## 执行配置来源

`config/config.yaml`：

```yaml
openclaw:
  command: "opencode"
  args: ["--print"]
  taskArg: "--task"
```

---

## 执行流程

1. CDF 组装阶段任务文本（taskText）
2. CDF 调用 `child_process.spawn(command, args, { cwd })`
3. 进程退出后执行 `scanOutputsAllOf()` 校验产物
4. 成功：返回 outputs 列表；失败：返回 error

---

## 执行参数

| 字段 | 说明 |
|------|------|
| `command` | opencode CLI 命令 |
| `args` | CLI 固定参数（如 `--print`） |
| `taskArg` | 任务文本参数名（默认 `--task`） |
| `cwd` | 项目根目录（projectPath） |
| `timeoutSeconds` | 由 `config.yaml` 每阶段定义 |

---

## 超时与终止

- 超时：达到 `timeoutSeconds` 后发送 `SIGTERM`
- 宽限：2 秒后仍未退出则发送 `SIGKILL`

---

## 错误码约定

| 错误码 | 含义 | 处理 |
|--------|------|------|
| 0 | 执行成功 | 继续扫描产物 |
| 124 | 超时被 kill | 记录超时并返回失败 |
| 127 | CLI 未找到 | 返回失败并提示安装 |
| 其他 | opencode 执行异常 | 返回失败并记录 stderr |

---

## 产物扫描

CDF 使用 `output-scanner.js` 校验产物：

```
scanOutputsAllOf({ projectPath, outputDir, outputsAllOf })
```

`outputsAllOf` 来自 `config/config.yaml`，必须与 `docs/CDF_IO_SPEC.md` 一致。

---

## 相关文档

- `docs/CDF_IO_SPEC.md` - 阶段 I/O 规范
- `docs/config.md` - 配置说明
