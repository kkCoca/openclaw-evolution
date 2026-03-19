#!/bin/bash
# moltbook-to-obsidian.sh
# 将 moltbook-rss.json 中的未读文章转换为 Obsidian 笔记

RSS_FILE="/home/ouyp/.openclaw/workspace/memory/moltbook-rss.json"
OBSIDIAN_VAULT="${1:-$HOME/Documents/Obsidian Vault/moltbook}"

echo "📥 Moltbook → Obsidian 笔记同步"
echo "RSS 文件：$RSS_FILE"
echo "目标目录：$OBSIDIAN_VAULT"

# 检查 jq 是否安装
if ! command -v jq &> /dev/null; then
    echo "❌ 需要安装 jq: sudo apt install jq"
    exit 1
fi

# 创建目标目录
mkdir -p "$OBSIDIAN_VAULT"

# 读取未读文章
unread_count=$(jq '.subscriptions | map(select(.status == "unread")) | length' "$RSS_FILE")
echo "📬 发现 $unread_count 篇未读文章"

# 遍历未读文章
jq -c '.subscriptions[] | select(.status == "unread")' "$RSS_FILE" | while read -r post; do
    id=$(echo "$post" | jq -r '.id')
    title=$(echo "$post" | jq -r '.title')
    author=$(echo "$post" | jq -r '.author')
    submolt=$(echo "$post" | jq -r '.submolt')
    url=$(echo "$post" | jq -r '.url')
    summary=$(echo "$post" | jq -r '.summary')
    upvotes=$(echo "$post" | jq -r '.upvotes')
    comments=$(echo "$post" | jq -r '.comments')
    created_at=$(echo "$post" | jq -r '.createdAt')
    tags=$(echo "$post" | jq -r '.tags | join(", ")')
    
    # 生成安全的文件名
    safe_title=$(echo "$title" | sed 's/[^a-zA-Z0-9_-]/_/g' | cut -c1-50)
    filename="$OBSIDIAN_VAULT/${safe_title}.md"
    
    # 跳过已存在的文件
    if [ -f "$filename" ]; then
        echo "⏭️  跳过：$title"
        continue
    fi
    
    # 创建笔记
    cat > "$filename" << EOF
---
created: $(date +%Y-%m-%d)
source_url: $url
author: $author
submolt: $submolt
upvotes: $upvotes
comments: $comments
tags: [moltbook, $tags]
status: unread
---

# $title

## 📌 原文链接
[$title]($url)

## 📝 摘要
$summary

## 💭 我的想法

<!-- 在这里写下你的思考、感悟、疑问 -->


## 🔗 关联笔记

<!-- 与其他笔记的双向链接 -->


## 📅 回顾记录

<!-- 日后回顾时的补充 -->


---
* collected by OpenClaw from Moltbook
EOF
    
    echo "✅ 创建：$title"
done

echo ""
echo "🎉 同步完成！"
echo "在 Obsidian 中打开目录：$OBSIDIAN_VAULT"
