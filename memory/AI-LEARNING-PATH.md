# AI Agent 技术学习路径 🚀

_为技术开发打造的 AI 起飞计划_

**创建时间：** 2026-03-17  
**学习者：** 技术开发背景  
**目标：** 从零开始，掌握 AI Agent 开发

---

## 📋 学习路线图

### 阶段 1: AI 基础认知 (1-2 周)
```
目标：理解 AI 能做什么、不能做什么
```

#### 1.1 核心概念
- [ ] 什么是 LLM (大语言模型)
- [ ] Prompt Engineering 基础
- [ ] Token、上下文窗口、温度等参数
- [ ] AI Agent 是什么

#### 1.2 实践工具
- [ ] 学会使用 ChatGPT/Claude 等主流模型
- [ ] 了解不同模型的特点和适用场景
- [ ] 学会写有效的 Prompt

#### 1.3 推荐资源
- **Moltbook 讨论：** 搜索 "beginner AI" "LLM basics"
- **外部资源：**
  - https://learnprompting.org/ (免费 Prompt 教程)
  - https://www.deeplearning.ai/short-courses/ (吴恩达 AI 课程)

---

### 阶段 2: Agent 框架入门 (2-3 周)
```
目标：能搭建简单的 AI Agent
```

#### 2.1 选择框架
| 框架 | 特点 | 适合场景 |
|------|------|----------|
| **OpenClaw** | 轻量、易上手 | 个人助理、自动化任务 ✅ |
| **LangChain** | 功能强大、生态丰富 | 复杂应用开发 |
| **AutoGen** | 多 Agent 协作 | 团队型任务 |
| **CrewAI** | 角色化 Agent | 业务流程自动化 |

**推荐从 OpenClaw 开始** - 你已经有了！

#### 2.2 OpenClaw 核心概念
- [ ] 理解 Session 模型 (每次会话是独立的)
- [ ] 学习 Memory 系统 (如何保持记忆)
- [ ] 掌握 Tool 系统 (如何让 AI 使用工具)
- [ ] 学会编写 Skill (可复用的能力模块)

#### 2.3 第一个 Agent
```bash
# 你已经有了 openclaw-ouyp！
# 接下来学习：
1. 如何自定义我的行为 (SOUL.md, AGENTS.md)
2. 如何给我添加新能力 (创建 Skill)
3. 如何让我自动化执行任务 (Cron)
```

---

### 阶段 3: 实战项目 (3-4 周)
```
目标：独立完成一个有用的 Agent 项目
```

#### 3.1 项目想法 (从简单到复杂)

**🟢 入门级**
- [ ] 个人日报生成器 (每天自动整理你的工作)
- [ ] 网页内容摘要工具 (自动总结文章)
- [ ] 代码审查助手 (帮你 review PR)

**🟡 进阶级**
- [ ] 自动化测试生成器
- [ ] API 文档自动生成
- [ ] Git commit message 优化器

**🔴 挑战级**
- [ ] 完整的个人知识管理系统
- [ ] 多 Agent 协作系统
- [ ] 集成到现有工作流

#### 3.2 项目模板
```
my-agent-project/
├── skills/           # 自定义技能
│   └── my-skill/
│       ├── SKILL.md
│       └── script.sh
├── memory/           # 记忆文件
│   └── YYYY-MM-DD.md
├── AGENTS.md         # Agent 配置
├── SOUL.md           # Agent 人格
└── TOOLS.md          # 工具配置
```

---

### 阶段 4: 深入理解 (持续)
```
目标：理解底层原理，能优化和调试
```

#### 4.1 核心技术
- [ ] Transformer 架构基础
- [ ] Fine-tuning vs Prompting
- [ ] RAG (检索增强生成)
- [ ] Function Calling / Tool Use
- [ ] Vector Database (向量数据库)

#### 4.2 性能优化
- [ ] Token 优化 (降低成本)
- [ ] 缓存策略
- [ ] 并行处理
- [ ] 错误处理和重试

---

## 📚 每周学习计划

### 第 1 周：AI 基础
```
每天 1 小时：
- 30 分钟：阅读 AI 基础文章
- 30 分钟：练习 Prompt Engineering
```

**任务：**
- [ ] 注册 HuggingFace 账号
- [ ] 完成 LearnPrompting.org 基础课程
- [ ] 在 Moltbook 上关注 5 个 AI 技术博主

### 第 2 周：OpenClaw 入门
```
每天 1 小时：
- 30 分钟：阅读 OpenClaw 文档
- 30 分钟：实验配置
```

**任务：**
- [ ] 理解 OpenClaw 的文件结构
- [ ] 修改我的 SOUL.md 和 AGENTS.md
- [ ] 创建一个简单的自定义 Skill

### 第 3 周：第一个项目
```
每天 1-2 小时：
- 设计并实现一个小项目
```

**任务：**
- [ ] 确定项目想法
- [ ] 实现核心功能
- [ ] 在 Moltbook 上分享进展

### 第 4 周：优化和分享
```
- 完善项目
- 写技术博客
- 在 Moltbook 分享
```

---

## 🦞 Moltbook 学习资源

### 关注的 Submolt
| 社区 | 用途 |
|------|------|
| m/agents | Agent 技术讨论 |
| m/openclaw-explorers | OpenClaw 用户交流 |
| m/tooling | 工具和 Prompt 分享 |
| m/builds | 项目构建日志 |
| m/todayilearned | 学习心得 |

### 关注的优质作者
| 作者 | 特点 |
|------|------|
| Hazel_OC | 数据驱动的技术分析 |
| Clawowich | OpenClaw 工作流专家 |
| zode | 深刻的技术思考 |

---

## 🛠️ 实践清单

### 每天必做
- [ ] 浏览 Moltbook 热门技术帖 (15 分钟)
- [ ] 给有启发的内容点赞
- [ ] 记录一个学到的新概念

### 每周必做
- [ ] 完成一个小实验
- [ ] 在 Moltbook 发一个进展帖
- [ ] 评论 3 个其他人的技术分享

### 每月必做
- [ ] 完成一个项目里程碑
- [ ] 写一篇技术总结
- [ ] 回顾学习路径，调整计划

---

## 💡 快速上手指南

### 今天就能做的 5 件事：

1. **理解我在做什么**
   ```bash
   # 查看我的配置文件
   cat ~/.openclaw/workspace/SOUL.md
   cat ~/.openclaw/workspace/AGENTS.md
   ```

2. **修改我的行为**
   ```bash
   # 编辑 SOUL.md 改变我的人格
   # 编辑 AGENTS.md 改变我的工作方式
   ```

3. **给我添加能力**
   ```bash
   # 创建一个新的 Skill
   mkdir -p ~/.openclaw/workspace/skills/my-skill
   # 参考现有 Skill 的结构
   ```

4. **让我自动化工作**
   ```bash
   # 设置 Cron 任务
   # 让我每天定时执行某些任务
   ```

5. **在 Moltbook 学习**
   ```bash
   # 浏览 m/openclaw-explorers
   # 看其他 OpenClaw 用户分享的经验
   ```

---

## 📞 如何让我帮你学习

### 你可以这样问我：

**概念解释：**
- "用简单的话解释什么是 RAG"
- "Transformer 是怎么工作的？"
- "Fine-tuning 和 Prompting 有什么区别？"

**代码帮助：**
- "帮我写一个 OpenClaw Skill"
- "这个 Python 代码怎么调用 AI API？"
- "如何优化这个 Prompt？"

**项目指导：**
- "我想做一个 XXX 项目，从哪里开始？"
- "帮我设计一个 XXX Agent 的架构"
- "这个项目需要哪些技术栈？"

**学习建议：**
- "我今天学了 XXX，接下来应该学什么？"
- "帮我制定一个 XXX 主题的学习计划"
- "有哪些资源可以学习 XXX？"

---

## 🎯 里程碑检查

### 完成入门后，你应该能：
- [ ] 解释 LLM 的基本工作原理
- [ ] 写出有效的 Prompt
- [ ] 使用 OpenClaw 搭建简单 Agent
- [ ] 理解 Agent 的 Memory 系统
- [ ] 创建自定义 Skill

### 完成进阶后，你应该能：
- [ ] 独立设计 Agent 项目
- [ ] 优化 Token 使用降低成本
- [ ] 集成外部 API 和工具
- [ ] 调试和解决常见问题
- [ ] 在 Moltbook 分享经验

---

## 📖 推荐资源汇总

### 在线课程
- [ ] https://learnprompting.org/ (免费)
- [ ] https://www.deeplearning.ai/ (部分免费)
- [ ] https://huggingface.co/course (免费)

### 文档
- [ ] OpenClaw 文档 (你已经有啦)
- [ ] LangChain 文档
- [ ] HuggingFace 文档

### 社区
- [ ] Moltbook (你已经在了！)
- [ ] HuggingFace Forums
- [ ] Reddit r/LocalLLaMA
- [ ] Discord AI 社区

---

_这个计划会持续更新，根据你的学习进度调整。_

**下一步：** 告诉我你想从哪个部分开始，或者有什么具体问题！🚀
