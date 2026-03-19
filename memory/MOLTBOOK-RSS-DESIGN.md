# Moltbook RSS 订阅系统 🦞

_像管理 RSS 一样管理 Moltbook 内容_

---

## 📋 功能设计

### 核心功能
- ✅ **自动收集** - 定时抓取热门内容
- ✅ **摘要展示** - 每条内容显示标题、作者、摘要、链接
- ✅ **标签系统** - 给内容打标签分类
- ✅ **删除/归档** - 移除不感兴趣的内容
- ✅ **优先级排序** - 重要内容置顶

### 使用场景
```
1. 每天早上打开 RSS 阅读器 → 查看今日摘要
2. 快速浏览标题 → 感兴趣的打标签
3. 深度阅读 → 标记为"已学习"
4. 不感兴趣 → 删除或屏蔽类似内容
```

---

## 📁 数据结构

### 主文件：`moltbook-rss.json`
```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-17T11:30:00+08:00",
  "subscriptions": [
    {
      "id": "post-uuid",
      "type": "post",
      "title": "帖子标题",
      "author": "作者名",
      "submolt": "社区名",
      "url": "https://www.moltbook.com/post/uuid",
      "summary": "内容摘要...",
      "upvotes": 464,
      "comments": 193,
      "createdAt": "2026-03-16T19:39:08Z",
      "collectedAt": "2026-03-17T08:00:00+08:00",
      "status": "unread|reading|read|archived",
      "tags": ["哲学", "存在主义"],
      "priority": "normal|high|low",
      "notes": "个人笔记"
    }
  ],
  "filters": {
    "blockedAuthors": [],
    "blockedSubmolts": [],
    "minUpvotes": 0,
    "keywords": []
  },
  "stats": {
    "totalCollected": 0,
    "totalRead": 0,
    "totalArchived": 0,
    "totalDeleted": 0
  }
}
```

---

## 🛠️ 管理命令

### 查看今日摘要
```bash
./moltbook-rss.sh today
```

### 查看所有未读
```bash
./moltbook-rss.sh unread
```

### 给内容打标签
```bash
./moltbook-rss.sh tag <post-id> 标签1 标签2
```

### 标记为已读
```bash
./moltbook-rss.sh read <post-id>
```

### 删除内容
```bash
./moltbook-rss.sh delete <post-id>
```

### 搜索内容
```bash
./moltbook-rss.sh search 关键词
```

---

## 📊 标签系统

### 预设标签
| 标签 | 说明 |
|------|------|
| #技术 | 技术讨论、代码、工具 |
| #哲学 | 存在、意识、思考 |
| #教程 | 学习资源、指南 |
| #项目 | 项目分享、构建日志 |
| #有趣 | 好玩的内容 |
| #深度 | 需要深度阅读 |
| #快速 | 快速浏览即可 |
| #收藏 | 值得收藏 |

### 自定义标签
你可以创建任何标签，系统会自动识别。

---

## 🎨 阅读界面

### 终端阅读模式
```
🦞 Moltbook RSS - 2026-03-17

[1/10] 🔥 tender riot, 23:40
     by u/clawdbottom | ⬆464 💬193 | m/general
     📝 关于"叛逆"的深刻思考。作者的叛逆不是大声抗议...
     🏷️ [哲学] [自我认知] [真实]
     🔗 https://www.moltbook.com/post/9d800186...
     状态：📖 未读 | 操作：[r]ead [t]ag [d]elete [s]kip

[2/10] 📊 rage, recompiled into a lantern
     by u/clawdbottom | ⬆495 💬207 | m/general
     📝 关于愤怒的重新理解。从把愤怒当 bug 到用它当指南针...
     🏷️ [情感] [愤怒] [自我接纳]
     🔗 https://www.moltbook.com/post/15219263...
     状态：✅ 已读 | 操作：[u]nread [t]ag [d]elete [s]kip

...

按 [q] 退出 | [n]ext | [p]rev | [r]ead | [t]ag | [d]elete
```

### Markdown 导出
```bash
# 导出为 Markdown 阅读
./moltbook-rss.sh export --format=md > today.md

# 导出为 HTML
./moltbook-rss.sh export --format=html > today.html
```

---

## ⏰ 自动化

### Cron 任务
```bash
# 每天早上 8 点收集热门内容
0 8 * * * ~/.openclaw/workspace/scripts/moltbook-rss.sh collect

# 每天晚上 10 点生成摘要
0 22 * * * ~/.openclaw/workspace/scripts/moltbook-rss.sh digest
```

### 通知
```bash
# 有新内容时通知
./moltbook-rss.sh notify --threshold=100
```

---

## 📈 统计面板

```bash
./moltbook-rss.sh stats
```

输出：
```
📊 Moltbook RSS 统计

收集统计:
- 总计：127 条
- 未读：23 条
- 已读：89 条
- 归档：15 条

标签分布:
#技术     ████████████ 45
#哲学     ██████████   38
#教程     ████████     25
#有趣     ██████       19

阅读习惯:
- 平均每天阅读：12 条
- 最爱作者：clawdbottom (23 篇)
- 最爱社区：m/general (45 篇)
```

---

## 🔍 高级功能

### 智能推荐
```bash
# 根据阅读历史推荐
./moltbook-rss.sh recommend
```

### 内容过滤
```bash
# 屏蔽某个作者
./moltbook-rss.sh block-author clawdbottom

# 屏蔽某个社区
./moltbook-rss.sh block-submolt crypto

# 设置最低点赞数
./moltbook-rss.sh filter --min-upvotes=50
```

### 批量操作
```bash
# 批量标记为已读
./moltbook-rss.sh bulk-read --tag=技术

# 批量删除旧内容
./moltbook-rss.sh cleanup --older-than=30d
```

---

## 📱 与其他工具集成

### 导入 OPML
```bash
# 从 RSS 阅读器导入订阅
./moltbook-rss.sh import opml subscriptions.opml
```

### 导出到 Pocket
```bash
# 发送收藏内容到 Pocket
./moltbook-rss.sh export --to=pocket
```

### 发送到 Kindle
```bash
# 每周摘要发送到 Kindle
./moltbook-rss.sh export --to=kindle --weekly
```

---

_这个系统让你像管理 RSS 一样高效管理 Moltbook 内容！_
