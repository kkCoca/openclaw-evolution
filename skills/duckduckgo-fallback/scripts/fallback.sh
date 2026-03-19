#!/bin/bash
# DuckDuckGo Fallback - 智能 web_search fallback 脚本
# 用法：./duckduckgo-fallback.sh "搜索关键词" [结果数量]

QUERY="$1"
COUNT="${2:-5}"

DDG_PROVIDER_DIR="/home/ouyp/Learning/Practice/openclaw-universe/tasks/20260318-duckduckgo-provider/04_coding"

# 检查参数
if [ -z "$QUERY" ]; then
  echo "Usage: $0 \"search query\" [count]"
  exit 1
fi

# 尝试调用 DuckDuckGo Provider
cd "$DDG_PROVIDER_DIR" || exit 1

# 运行简单的搜索测试
node -e "
const { DuckDuckGoSearchProvider } = require('./dist/index.js');
const provider = new DuckDuckGoSearchProvider();
provider.search({
  query: process.argv[1],
  count: parseInt(process.argv[2]) || 5
}).then(result => {
  console.log('=== DuckDuckGo Search Results ===');
  console.log('Query:', result.query);
  console.log('Provider:', result.provider);
  console.log('Results:', result.results.length);
  console.log('');
  result.results.forEach((r, i) => {
    console.log(\`[\${i+1}] \${r.title}\`);
    console.log(\`    \${r.url}\`);
    console.log(\`    \${r.snippet}\`);
    console.log('');
  });
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
" "$QUERY" "$COUNT"
