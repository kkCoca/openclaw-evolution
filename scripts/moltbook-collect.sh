#!/bin/bash
# Moltbook 热门内容收集脚本
# 用法：./moltbook-collect.sh [daily|weekly]

API_KEY="moltbook_sk_LQj5JnqTPaL4mjdXO8vNiL9hD8aUOUqj"
FAVORITES_FILE="$HOME/.openclaw/workspace/memory/moltbook-favorites.md"
OUTPUT_DIR="$HOME/.openclaw/workspace/memory/moltbook-digests"

mkdir -p "$OUTPUT_DIR"

# 获取热门帖子
get_hot_posts() {
    local limit=${1:-10}
    curl -s "https://www.moltbook.com/api/v1/feed?sort=hot&limit=$limit" \
        -H "Authorization: Bearer $API_KEY"
}

# 生成每日摘要
generate_daily_digest() {
    local date_str=$(date +%Y-%m-%d)
    local output_file="$OUTPUT_DIR/digest-$date_str.md"
    
    echo "# Moltbook 每日摘要 - $date_str" > "$output_file"
    echo "" >> "$output_file"
    echo "_自动生成于 $(date '+%Y-%m-%d %H:%M:%S')_" >> "$output_file"
    echo "" >> "$output_file"
    echo "---" >> "$output_file"
    echo "" >> "$output_file"
    
    # 获取热门帖子并解析
    get_hot_posts 20 | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, post in enumerate(data.get('posts', [])[:10], 1):
    title = post.get('title', '无标题')
    author = post.get('author', {}).get('name', '未知')
    upvotes = post.get('upvotes', 0)
    comments = post.get('comment_count', 0)
    content = post.get('content', '')[:300].replace('\n', ' ')
    post_id = post.get('id', '')
    submolt = post.get('submolt_name', 'unknown')
    
    print(f'## {i}. {title}')
    print(f'**作者：** u/{author}')
    print(f'**数据：** ⬆{upvotes} 💬{comments}')
    print(f'**社区：** m/{submolt}')
    print(f'**链接：** https://www.moltbook.com/post/{post_id}')
    print(f'**摘要：** {content}...')
    print('')
    print('---')
    print('')
" >> "$output_file"
    
    echo "✅ 每日摘要已保存：$output_file"
}

# 更新收藏夹
update_favorites() {
    echo "📝 更新收藏夹..."
    # 这里可以添加逻辑来识别和收藏高价值内容
}

# 主程序
case "${1:-daily}" in
    daily)
        generate_daily_digest
        ;;
    weekly)
        echo "📊 生成每周摘要..."
        # 可以扩展为聚合 7 天的内容
        ;;
    update)
        update_favorites
        ;;
    *)
        echo "用法：$0 {daily|weekly|update}"
        exit 1
        ;;
esac
