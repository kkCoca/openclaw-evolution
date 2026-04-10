# 任务模板（Task Template）

> 使用此模板创建新任务，确保流程引擎正确执行。

---

## 任务描述

{在此填写任务描述}

## 场景类型

[全新功能 | 增量需求 | 问题修复]

## 需求说明

**文件位置**：REQUIREMENTS.md（openclaw-ouyp 提供）

**说明**：REQUIREMENTS.md 是 openclaw-ouyp 提供的原始需求说明，采用追加式记录所有版本需求。

**内容要求**：
- 全新功能：创建 REQUIREMENTS.md（包含 v1.0.0）
- 增量需求：追加 REQUIREMENTS.md（包含 v1.1.0 等）— 不覆盖原有内容
- 问题修复：REQUIREMENTS.md 不更新，使用 ISSUES.md

**示例**：
```markdown
## v1.0.0（2026-03-27）
### 目标
完整的用户注册、登录、权限管理系统

### 约束条件
- 支持 OAuth2
- 支持 JWT
- 向后兼容

### 验收标准
- Given 用户未登录
- When 访问受保护资源
- Then 重定向到登录页面

## v1.1.0（2026-03-27）
### 目标
添加 timeout 参数配置

### 功能需求
- 用户可自定义请求超时时间
- 默认值 30 秒

### 约束条件
- 向后兼容，不破坏 v1.0.0 功能
```

## 约束条件

{在此填写约束条件}

## 验收标准

- Given {前提条件}
- When {执行动作}
- Then {预期结果}

---

## 重要要求（必须遵守）

**必须按照以下目录结构输出到项目目录**：

```
projects/{项目名}/
├── REQUIREMENTS.md         # openclaw-ouyp 提供（已有）
├── 01_designing/
│   ├── PRD.md              # AI 生成（追加式）
│   └── TRD.md              # AI 生成（追加式）
├── 04_coding/
│   └── src/                # AI 生成（增量修改）
├── 05_reviewing/
│   └── REVIEW-REPORT.md    # AI 生成
├── CHANGELOG.md            # AI 生成（追加式）
└── ISSUES.md               # openclaw-ouyp 提供（Bugfix 使用）
```

**禁止**直接输出到项目根目录！
**禁止**覆盖原有 PRD.md（增量需求采用追加式）！
**必须遵循** `~/.openclaw/workspace/AGENTS.md`（Plan-and-Execute），禁止 write 局部改动！

**追加式更新规范**：
- 全新功能：创建 REQUIREMENTS.md 和 PRD.md
- 增量需求：REQUIREMENTS.md 追加新章节，PRD.md 追加 v1.1.0 章节
- 问题修复：REQUIREMENTS.md 不更新，ISSUES.md 记录问题

---

## 使用示例

```markdown
## 任务描述
实现 web_search 技能的异常处理机制

## 场景类型
增量需求

## 需求描述
为 web_search 技能添加 6 类异常处理和 Fallback 机制

## 约束条件
- 必须使用现有 web_search 工具
- 不能修改工具签名
- 需要保持向后兼容

## 验收标准
- Given web_search 技能已安装
- When 执行搜索遇到异常
- Then 自动触发 Fallback 机制并记录日志
```

---

**版本**: 1.0.0  
**创建日期**: 2026-03-26  
**作者**: openclaw-ouyp
