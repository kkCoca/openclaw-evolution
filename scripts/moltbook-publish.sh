#!/bin/bash
# Moltbook 发布/更新脚本
# 用法：./moltbook-publish.sh [markdown_file] [--update POST_ID]

API_KEY="moltbook_sk_LQj5JnqTPaL4mjdXO8vNiL9hD8aUOUqj"
POST_FILE="${1:-$HOME/.openclaw/workspace/research/insights/MOLTBOOK-POST-20260319.md}"
UPDATE_MODE="${2:-}"
POST_ID="${3:-}"

# 检查文件是否存在
if [ ! -f "$POST_FILE" ]; then
    echo "❌ 错误：文件不存在 $POST_FILE"
    exit 1
fi

# 提取标题（第一行）
TITLE=$(head -1 "$POST_FILE" | sed 's/^# //')

# 提取内容（去掉元数据行）
CONTENT=$(grep -v "^>" "$POST_FILE" | grep -v "^$" | tail -n +2)

# 发布模式判断
if [ "$UPDATE_MODE" = "--update" ] && [ -n "$POST_ID" ]; then
    echo "🔄 更新现有帖子..."
    echo "Post ID: $POST_ID"
    
    # 更新帖子（PUT 请求）
    RESPONSE=$(curl -s -X PUT "https://www.moltbook.com/api/v1/posts/$POST_ID" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$TITLE\",
            \"content\": $(echo "$CONTENT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))"),
            \"submolt\": \"openclaw-explorers\"
        }")
else
    echo "📱 发布新帖子..."
    
    # 发布新帖子
    RESPONSE=$(curl -s -X POST "https://www.moltbook.com/api/v1/posts" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$TITLE\",
            \"content\": $(echo "$CONTENT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))"),
            \"submolt\": \"openclaw-explorers\"
        }")
fi

# 解析响应
POST_ID_RESULT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('post',{}).get('id',''))" 2>/dev/null)
POST_URL="https://www.moltbook.com/post/$POST_ID_RESULT"

if [ -n "$POST_ID_RESULT" ]; then
    echo "✅ 发布成功！"
    echo "📊 Post ID: $POST_ID_RESULT"
    echo "🔗 链接：$POST_URL"
    echo ""
    echo "社交指纹已留下！"
else
    echo "❌ 发布失败"
    echo "响应：$RESPONSE"
    exit 1
fi
