#!/bin/bash
# Moltbook RSS 阅读器 - 像管理 RSS 一样管理 Moltbook 内容
# 用法：./moltbook-rss.sh [command] [options]

set -e

RSS_FILE="$HOME/.openclaw/workspace/memory/moltbook-rss.json"
API_KEY="moltbook_sk_LQj5JnqTPaL4mjdXO8vNiL9hD8aUOUqj"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印帮助
print_help() {
    echo -e "${CYAN}🦞 Moltbook RSS 阅读器${NC}"
    echo ""
    echo "用法：$0 [command] [options]"
    echo ""
    echo "命令:"
    echo "  today          查看今日摘要"
    echo "  unread         查看所有未读内容"
    echo "  read <id>      标记为已读"
    echo "  unread <id>    标记为未读"
    echo "  tag <id> <tags> 添加标签"
    echo "  delete <id>    删除内容"
    echo "  archive <id>   归档内容"
    echo "  search <kw>    搜索内容"
    echo "  stats          显示统计"
    echo "  collect        收集新内容"
    echo "  export         导出为 Markdown"
    echo "  help           显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 today"
    echo "  $0 tag 9d800186 哲学 深度"
    echo "  $0 read 9d800186"
    echo "  $0 search 意识"
}

# 检查文件是否存在
check_file() {
    if [ ! -f "$RSS_FILE" ]; then
        echo -e "${RED}错误：RSS 文件不存在${NC}"
        echo "运行 '$0 collect' 先收集内容"
        exit 1
    fi
}

# 查看今日摘要
view_today() {
    check_file
    echo -e "${CYAN}🦞 Moltbook RSS - 今日摘要${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    python3 << 'PYTHON'
import json
from datetime import datetime

with open('$RSS_FILE'.replace('$HOME', '$ENV{HOME}'), 'r') as f:
    data = json.load(f)

subscriptions = data.get('subscriptions', [])
unread = [s for s in subscriptions if s.get('status') == 'unread']

if not unread:
    print("✅ 没有未读内容！")
else:
    print(f"📬 未读内容：{len(unread)} 条\n")
    
    for i, item in enumerate(unread[:10], 1):
        priority_icon = "🔥" if item.get('priority') == 'high' else "📊"
        tags = ' '.join([f"[{t}]" for t in item.get('tags', [])])
        
        print(f"{priority_icon} [{i}] {item['title']}")
        print(f"    by u/{item['author']} | ⬆{item['upvotes']} 💬{item['comments']} | m/{item['submolt']}")
        print(f"    📝 {item['summary'][:100]}...")
        if tags:
            print(f"    🏷️ {tags}")
        print(f"    🔗 {item['url']}")
        print(f"    状态：📖 未读 | 操作：[r]ead [t]ag [d]elete [s]kip")
        print()

print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print("操作提示:")
print("  r <编号> - 标记为已读")
print("  t <编号> <标签> - 添加标签")
print("  d <编号> - 删除")
print("  q - 退出")
PYTHON
}

# 查看所有未读
view_unread() {
    check_file
    echo -e "${CYAN}📖 未读内容列表${NC}"
    echo ""
    
    python3 << PYTHON
import json

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

subscriptions = data.get('subscriptions', [])
unread = [s for s in subscriptions if s.get('status') == 'unread']

for item in unread:
    tags = ' '.join([f"[{t}]" for t in item.get('tags', [])])
    print(f"• {item['title']} (u/{item['author']}) {tags}")
PYTHON
}

# 标记为已读
mark_read() {
    local id=$1
    check_file
    
    python3 << PYTHON
import json

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

for item in data.get('subscriptions', []):
    if item['id'] == '$id' or item['id'].startswith('$id'):
        item['status'] = 'read'
        print(f"✅ 已标记为已读：{item['title']}")
        break

with open('$RSS_FILE', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYTHON
}

# 添加标签
add_tags() {
    local id=$1
    shift
    local tags=$@
    check_file
    
    python3 << PYTHON
import json

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

new_tags = '$tags'.split()

for item in data.get('subscriptions', []):
    if item['id'] == '$id' or item['id'].startswith('$id'):
        existing = item.get('tags', [])
        for tag in new_tags:
            if tag not in existing:
                existing.append(tag)
        item['tags'] = existing
        print(f"✅ 已添加标签：{', '.join(new_tags)}")
        print(f"   当前标签：{', '.join(existing)}")
        break

with open('$RSS_FILE', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYTHON
}

# 删除内容
delete_item() {
    local id=$1
    check_file
    
    python3 << PYTHON
import json

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

original_count = len(data.get('subscriptions', []))
data['subscriptions'] = [
    item for item in data.get('subscriptions', [])
    if not (item['id'] == '$id' or item['id'].startswith('$id'))
]
new_count = len(data['subscriptions'])

if original_count > new_count:
    data['stats']['totalDeleted'] = data['stats'].get('totalDeleted', 0) + 1
    print(f"✅ 已删除")
else:
    print(f"❌ 未找到 ID 为 '$id' 的内容")

with open('$RSS_FILE', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYTHON
}

# 搜索内容
search_items() {
    local keyword=$1
    check_file
    
    echo -e "${CYAN}🔍 搜索：$keyword${NC}"
    echo ""
    
    python3 << PYTHON
import json

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

keyword = '$keyword'.lower()
results = []

for item in data.get('subscriptions', []):
    if (keyword in item.get('title', '').lower() or
        keyword in item.get('summary', '').lower() or
        keyword in ' '.join(item.get('tags', [])).lower() or
        keyword in item.get('author', '').lower()):
        results.append(item)

if results:
    print(f"找到 {len(results)} 条相关内容:\n")
    for item in results:
        status_icon = "📖" if item.get('status') == 'unread' else "✅"
        print(f"{status_icon} {item['title']}")
        print(f"    by u/{item['author']} | 🏷️ {' '.join(item.get('tags', []))}")
        print()
else:
    print("未找到相关内容")
PYTHON
}

# 显示统计
show_stats() {
    check_file
    
    python3 << PYTHON
import json
from collections import Counter

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

stats = data.get('stats', {})
subscriptions = data.get('subscriptions', [])

print("📊 Moltbook RSS 统计\n")
print(f"收集统计:")
print(f"  总计：{stats.get('totalCollected', len(subscriptions))} 条")
print(f"  未读：{len([s for s in subscriptions if s.get('status') == 'unread'])} 条")
print(f"  已读：{len([s for s in subscriptions if s.get('status') == 'read'])} 条")
print(f"  归档：{stats.get('totalArchived', 0)} 条")
print(f"  删除：{stats.get('totalDeleted', 0)} 条")
print()

# 标签分布
all_tags = []
for item in subscriptions:
    all_tags.extend(item.get('tags', []))

if all_tags:
    tag_counts = Counter(all_tags)
    print("标签分布:")
    for tag, count in tag_counts.most_common(10):
        bar = '█' * (count // 2)
        print(f"  #{tag:<10} {bar} {count}")
    print()

# 作者分布
authors = [item.get('author', '') for item in subscriptions]
if authors:
    author_counts = Counter(authors)
    print("最爱作者:")
    for author, count in author_counts.most_common(5):
        print(f"  u/{author}: {count} 篇")
PYTHON
}

# 收集新内容
collect_new() {
    echo -e "${CYAN}🔄 收集新内容...${NC}"
    
    # 调用 API 获取热门内容
    response=$(curl -s "https://www.moltbook.com/api/v1/feed?sort=hot&limit=20" \
        -H "Authorization: Bearer $API_KEY")
    
    # 解析并添加到 RSS
    python3 << PYTHON
import json
from datetime import datetime

# 读取现有数据
try:
    with open('$RSS_FILE', 'r') as f:
        data = json.load(f)
except:
    data = {
        "version": "1.0",
        "lastUpdated": "",
        "subscriptions": [],
        "filters": {"blockedAuthors": [], "blockedSubmolts": [], "minUpvotes": 0, "keywords": []},
        "stats": {"totalCollected": 0, "totalRead": 0, "totalArchived": 0, "totalDeleted": 0}
    }

# 解析 API 响应
api_data = json.loads('''$response''')
new_posts = api_data.get('posts', [])

existing_ids = {item['id'] for item in data['subscriptions']}
added = 0

for post in new_posts:
    post_id = post.get('id', '')
    if post_id not in existing_ids:
        # 添加新内容
        item = {
            "id": post_id,
            "type": "post",
            "title": post.get('title', ''),
            "author": post.get('author', {}).get('name', ''),
            "submolt": post.get('submolt_name', ''),
            "url": f"https://www.moltbook.com/post/{post_id}",
            "summary": post.get('content', '')[:200].replace('\n', ' '),
            "content_preview": post.get('content', '')[:500],
            "upvotes": post.get('upvotes', 0),
            "comments": post.get('comment_count', 0),
            "createdAt": post.get('created_at', ''),
            "collectedAt": datetime.now().strftime('%Y-%m-%dT%H:%M:%S+08:00'),
            "status": "unread",
            "tags": [],
            "priority": "high" if post.get('upvotes', 0) > 400 else "normal",
            "notes": ""
        }
        data['subscriptions'].insert(0, item)
        added += 1

data['lastUpdated'] = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+08:00')
data['stats']['totalCollected'] = len(data['subscriptions'])

with open('$RSS_FILE', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"✅ 收集完成！新增 {added} 条内容")
PYTHON
}

# 导出为 Markdown
export_md() {
    check_file
    
    python3 << PYTHON
import json
from datetime import datetime

with open('$RSS_FILE', 'r') as f:
    data = json.load(f)

print(f"# Moltbook RSS 摘要\n")
print(f"_生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}_\n")
print("---\n")

subscriptions = data.get('subscriptions', [])
unread = [s for s in subscriptions if s.get('status') == 'unread']

print(f"## 📬 未读内容 ({len(unread)} 条)\n")

for i, item in enumerate(unread, 1):
    tags = ' '.join([f"`#{t}`" for t in item.get('tags', [])])
    print(f"### {i}. {item['title']}")
    print(f"**作者：** u/{item['author']} | **社区：** m/{item['submolt']}")
    print(f"**数据：** ⬆{item['upvotes']} 💬{item['comments']}")
    print(f"**标签：** {tags}")
    print(f"**摘要：** {item['summary']}")
    print(f"**链接：** [{item['url']}]({item['url']})")
    print()
PYTHON
}

# 主程序
case "${1:-help}" in
    today)
        view_today
        ;;
    unread)
        if [ -n "$2" ]; then
            mark_read "$2"
        else
            view_unread
        fi
        ;;
    read)
        mark_read "$2"
        ;;
    tag)
        shift
        id=$1
        shift
        add_tags "$id" "$@"
        ;;
    delete)
        delete_item "$2"
        ;;
    archive)
        echo "归档功能开发中..."
        ;;
    search)
        search_items "$2"
        ;;
    stats)
        show_stats
        ;;
    collect)
        collect_new
        ;;
    export)
        export_md
        ;;
    help|--help|-h)
        print_help
        ;;
    *)
        echo -e "${RED}未知命令：$1${NC}"
        print_help
        exit 1
        ;;
esac
