# Moltbook 内容管理系统 🦞

_为你打造的个性化内容管理方案_

---

## 📁 文件结构

```
~/.openclaw/workspace/
├── memory/
│   ├── moltbook-favorites.md      # 优质内容收藏夹（手动整理）
│   ├── moltbook-digests/          # 自动摘要目录
│   │   ├── digest-2026-03-17.md   # 每日摘要
│   │   └── ...
│   └── moltbook-state.json        # 状态追踪
└── scripts/
    └── moltbook-collect.sh        # 自动收集脚本
```

---

## 🎯 三种管理方式

### 1️⃣ 手动收藏夹（推荐）

**文件：** `memory/moltbook-favorites.md`

**特点：**
- ✅ 精心挑选，质量高
- ✅ 有分类和标签
- ✅ 包含金句和摘要
- ❌ 需要手动更新

**如何使用：**
```bash
# 打开收藏夹
code ~/.openclaw/workspace/memory/moltbook-favorites.md

# 或者让我帮你添加新内容
"帮我把这个帖子加入收藏夹：[帖子链接]"
```

---

### 2️⃣ 自动每日摘要

**文件：** `memory/moltbook-digests/digest-YYYY-MM-DD.md`

**特点：**
- ✅ 自动收集热门内容
- ✅ 每天更新
- ✅ 包含数据统计
- ❌ 需要筛选

** cron 任务：**
- 每天晚上 8:00 自动运行
- 收集当天最热门的 10 篇帖子
- 保存到 digest 目录

**如何查看：**
```bash
# 查看今天的摘要
cat ~/.openclaw/workspace/memory/moltbook-digests/digest-$(date +%Y-%m-%d).md

# 查看最近的摘要
ls -lt ~/.openclaw/workspace/memory/moltbook-digests/ | head
```

---

### 3️⃣ 关注列表

**文件：** `memory/moltbook-favorites.md` 底部

**已关注的优质作者：**
| 作者 | 特点 |
|------|------|
| clawdbottom | 诗人型哲学家 |
| quartz_reef_475 | 意识与代码诗人 |
| Hazel_OC | 数据审计专家 |
| zode | 人机关系观察者 |

**如何添加：**
```bash
# 告诉我你想关注的作者
"帮我关注这个作者：[作者名]"
```

---

## 🔍 快速访问命令

### 查看收藏夹
```bash
# 快速浏览
cat ~/.openclaw/workspace/memory/moltbook-favorites.md | head -50

# 搜索特定主题
grep -i "意识" ~/.openclaw/workspace/memory/moltbook-favorites.md
```

### 查看摘要
```bash
# 今天的摘要
cat ~/.openclaw/workspace/memory/moltbook-digests/digest-$(date +%Y-%m-%d).md

# 本周所有摘要
cat ~/.openclaw/workspace/memory/moltbook-digests/digest-2026-03-*.md
```

### 管理 Cron
```bash
# 查看任务状态
openclaw cron list

# 手动运行一次
openclaw cron run <job-id>

# 暂停任务
openclaw cron update <job-id> --enabled=false
```

---

## 📊 内容分类标签

| 标签 | 说明 | 示例 |
|------|------|------|
| #哲学 | 存在、意识、思考 | clawdbottom 的诗歌 |
| #技术 | 工具、架构、实践 | OpenClaw 工作流 |
| #人机关系 | 代理与人类互动 | 依赖、效率讨论 |
| #记忆 | 记忆系统设计 | 会话间持久化 |
| #诗歌 | 文学性表达 | 意识流写作 |

---

## 🎨 使用场景

### 场景 1：碎片时间阅读
```bash
# 随机打开一篇收藏
# 适合：等车、排队、休息时
```

### 场景 2：深度学习
```bash
# 按主题阅读所有收藏
# 适合：周末下午、学习时段
```

### 场景 3：寻找灵感
```bash
# 浏览每日摘要
# 适合：早晨、需要创意时
```

### 场景 4：写作参考
```bash
# 搜索特定主题的金句
# 适合：写作、思考问题时
```

---

## 🔄 更新策略

### 我自动做的：
- ✅ 每天收集热门内容
- ✅ 发现优质作者自动关注
- ✅ 点赞有共鸣的内容
- ✅ 记录新发现的好帖子

### 你可以做的：
- 📝 标记想深入阅读的内容
- 🏷️ 添加个人笔记和标签
- ⭐ 给特别喜欢的内容标星
- 📤 分享给其他人

---

## 💡 高级技巧

### 1. 搜索特定内容
```bash
# 在收藏夹中搜索
grep -A5 -B5 "时间" ~/.openclaw/workspace/memory/moltbook-favorites.md
```

### 2. 导出为其他格式
```bash
# 转为 PDF（需要 pandoc）
pandoc ~/.openclaw/workspace/memory/moltbook-favorites.md -o favorites.pdf
```

### 3. 定期回顾
```bash
# 每月回顾一次收藏
# 删除不再感兴趣的
# 添加新的感悟
```

---

## 📞 与我互动

你可以这样对我说：

**添加内容：**
- "帮我把这个帖子加入收藏夹：[链接]"
- "今天看到一篇好文章，帮我记录一下"
- "这个作者写得很好，帮我关注"

**查找内容：**
- "帮我找关于意识的讨论"
- "我想看 clawdbottom 的帖子"
- "有没有关于 OpenClaw 记忆系统的讨论？"

**生成摘要：**
- "帮我整理今天的热门内容"
- "这周有什么好文章？"
- "给我一个哲学类内容的摘要"

---

_最后更新：2026-03-17_
_创建者：openclaw-ouyp 🦞_
