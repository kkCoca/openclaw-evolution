# Actions 协议规范

> 版本：v1.0.0  
> 更新日期：2026-04-09

---

## 概述

ClawDevFlow (CDF) 通过 `{projectPath}/.cdf/actions.json` 文件向宿主系统传达执行动作。

---

## 动作文件位置

```
{projectPath}/.cdf/actions.json
```

---

## 动作文件 Schema

```json
{
  "workflowId": "cdf-YYYYMMDD-XXXX",
  "stage": "designing",
  "actionId": "act-XXXXXX",
  "status": "pending",
  "createdAt": "2026-04-09T12:00:00.000Z",
  "timeoutSeconds": 1800,
  "command": "/sessions_spawn opencode",
  "task": "完整子会话任务文本",
  "projectPath": "openclaw-evolution/projects/<projectName>",
  "outputDir": "01_designing",
  "expectedOutputs": ["PRD.md", "TRD.md"],
  "attempt": 1,
  "regenerateHint": ""
}
```

---

## 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `workflowId` | string | ✅ | 工作流唯一标识 |
| `stage` | string | ✅ | 阶段名称（8 阶段之一） |
| `actionId` | string | ✅ | 动作唯一标识 |
| `status` | string | ✅ | 状态：pending/running/done/failed |
| `createdAt` | string | ✅ | 创建时间（ISO 8601） |
| `timeoutSeconds` | number | ✅ | 超时时间（秒） |
| `command` | string | ✅ | 宿主应执行的命令 |
| `task` | string | ✅ | 任务文本（注入子会话） |
| `projectPath` | string | ✅ | 项目路径 |
| `outputDir` | string | ✅ | 输出目录（相对项目根） |
| `expectedOutputs` | string[] | ✅ | 期望输出文件列表 |
| `attempt` | number | ✅ | 尝试次数（从 1 开始） |
| `regenerateHint` | string | ⚠️ | 返工提示（返工时填写） |

---

## 生命周期

1. **CDF 写入** `status=pending`
2. **CDF 自动触发**（当检测到 `sessions_spawn` 或 `openclaw.autoSpawn=true`）并将 `status` 更新为 `running`
3. 子会话写入产物到 `{projectPath}/{outputDir}/`
4. CDF 扫描产物并更新 `status=done`，若超时则 `status=failed`
5. 返工时重写 `actions.json`（`attempt++`，带 `regenerateHint`）

---

## 宿主消费示例

```bash
# 读取动作
action=$(cat .cdf/actions.json)

# 执行命令
/sessions_spawn opencode --task "$action"

# 等待产物...
```

---

## 硬约束

- CDF **默认自动触发** `/sessions_spawn`（可通过 `openclaw.autoSpawn=false` 禁用）
- CDF **必须负责**：写 actions.json、等待扫描、超时报错、写入状态更新
- 子会话只能写 `{projectPath}/{outputDir}/` 下
- 禁止在项目根目录直接写文件

---

## 相关文档

- `docs/config.md` - 配置说明
- `docs/stages.md` - 阶段说明
