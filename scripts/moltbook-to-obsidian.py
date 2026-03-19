#!/usr/bin/env python3
# moltbook-to-obsidian.py
# 将 moltbook-rss.json 中的未读文章转换为 Obsidian 笔记
# 功能：抓取完整内容、提取精华、英文翻译中文

import json
import os
import sys
import re
from datetime import datetime
from pathlib import Path
import urllib.request
import urllib.error

RSS_FILE = "/home/ouyp/.openclaw/workspace/memory/moltbook-rss.json"
STATE_FILE = "/home/ouyp/.openclaw/workspace/memory/moltbook-state.json"

# 翻译 API（使用免费的 mymemory translation API）
TRANSLATE_API = "https://api.mymemory.translated.net/get"

def sanitize_filename(title):
    """生成安全的文件名"""
    safe = re.sub(r'[^a-zA-Z0-9_-]', '_', title)
    return safe[:50]

def translate_text(text, max_length=500):
    """翻译英文为中文"""
    try:
        # 截断过长的文本
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        url = f"{TRANSLATE_API}?q={urllib.parse.quote(text)}&langpair=en|zh-CN"
        req = urllib.request.Request(url, headers={'User-Agent': 'OpenClaw/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            if 'responseData' in data and 'translatedText' in data['responseData']:
                return data['responseData']['translatedText']
    except Exception as e:
        print(f"   ⚠️  翻译失败：{str(e)[:50]}")
    return text

def is_mostly_english(text):
    """判断文本是否主要是英文"""
    if not text:
        return False
    # 计算英文字母比例
    english_chars = sum(1 for c in text if c.isascii() and c.isalpha())
    ratio = english_chars / len(text) if len(text) > 0 else 0
    return ratio > 0.5

def fetch_post_content(post_id):
    """从 Moltbook API 获取帖子完整内容"""
    try:
        url = f"https://www.moltbook.com/api/v1/post/{post_id}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'OpenClaw/1.0',
            'Accept': 'application/json'
        })
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('content', data.get('content_preview', ''))
    except Exception as e:
        print(f"   ⚠️  获取内容失败：{str(e)[:50]}")
        return None

def extract_essence(content, summary, max_length=800):
    """提取内容精华部分"""
    if not content:
        return summary
    
    # 清理内容
    content = re.sub(r'\s+', ' ', content).strip()
    
    # 如果内容主要是英文，翻译关键部分
    if is_mostly_english(content):
        # 翻译前 2-3 段作为精华
        paragraphs = content.split('\n\n')[:3]
        essence_parts = []
        for para in paragraphs:
            if len(para) > 20:  # 跳过太短的段落
                translated = translate_text(para.strip())
                essence_parts.append(translated)
        essence = '\n\n'.join(essence_parts)
    else:
        # 中文内容直接提取
        if len(content) <= max_length:
            essence = content
        else:
            # 取前 max_length 字符，尽量在句子边界截断
            essence = content[:max_length]
            # 尝试在句号、段落结束处截断
            last_break = max(essence.rfind('。'), essence.rfind('\n\n'))
            if last_break > max_length * 0.7:
                essence = essence[:last_break + 1]
    
    return essence.strip()

def calculate_priority(post, priority_keywords):
    """根据关键词计算优先级"""
    text = f"{post['title']} {post['summary']} {' '.join(post.get('tags', []))}".lower()
    
    for kw in priority_keywords.get('P0', []):
        if kw.lower() in text:
            return 'P0'
    for kw in priority_keywords.get('P1', []):
        if kw.lower() in text:
            return 'P1'
    for kw in priority_keywords.get('P2', []):
        if kw.lower() in text:
            return 'P2'
    return 'P3'

def create_note(post, output_dir, priority_keywords=None):
    """创建单篇笔记"""
    title = post['title']
    safe_title = sanitize_filename(title)
    filename = Path(output_dir) / f"{safe_title}.md"
    
    # 跳过已存在的文件
    if filename.exists():
        print(f"⏭️  跳过：{title}")
        return False
    
    # 计算优先级
    priority = post.get('priority', 'normal')
    if priority_keywords:
        calc_priority = calculate_priority(post, priority_keywords)
        priority = calc_priority if calc_priority != 'P3' else priority
    
    # 优先级图标
    priority_icons = {'P0': '🔴 P0 必读', 'P1': '🟡 P1 重要', 'P2': '🟢 P2 关注', 'P3': '⚪ P3 普通'}
    priority_label = priority_icons.get(priority, priority)
    
    # 获取完整内容并提取精华
    print(f"   📥 获取内容：{title[:40]}...")
    full_content = fetch_post_content(post['id'])
    essence = extract_essence(full_content, post.get('summary', ''))
    
    # 翻译标题（如果是英文）
    display_title = title
    if is_mostly_english(title):
        translated_title = translate_text(title, max_length=100)
        if translated_title != title:
            display_title = f"{translated_title}\n\n*原文：{title}*"
    
    # 构建笔记内容
    tags = ", ".join(post.get('tags', []))
    content = f"""---
created: {datetime.now().strftime('%Y-%m-%d')}
source_url: {post['url']}
author: {post['author']}
submolt: {post['submolt']}
upvotes: {post['upvotes']}
comments: {post['comments']}
tags: [moltbook, {tags}, {priority.lower()}]
status: unread
priority: {priority}
---

# {priority_label} {display_title}

## 📌 原文链接
[{title}]({post['url']})

## 📝 原文摘要
{post.get('summary', '')}

## ✨ 精华内容（AI 提取 + 翻译）

{essence}

---

## 💭 我的想法

<!-- 在这里写下你的思考、感悟、疑问 -->


## 🔗 关联笔记

<!-- 与其他笔记的双向链接 -->


## 📅 回顾记录

<!-- 日后回顾时的补充 -->


---
* collected by OpenClaw from Moltbook
* 精华内容已自动提取并翻译
"""
    
    # 写入文件
    filename.write_text(content, encoding='utf-8')
    print(f"✅ 创建：{title[:50]}...")
    return True

def main():
    import urllib.parse  # 延迟导入，避免未使用警告
    
    # 默认 vault 路径
    default_vault = os.path.expanduser("~/Documents/Obsidian Vault/moltbook")
    output_dir = sys.argv[1] if len(sys.argv) > 1 else default_vault
    
    print("📥 Moltbook → Obsidian 笔记同步")
    print(f"RSS 文件：{RSS_FILE}")
    print(f"目标目录：{output_dir}")
    print()
    
    # 创建目标目录
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 读取 RSS 文件
    with open(RSS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 获取优先级关键词配置
    priority_keywords = data.get('filters', {}).get('priorityKeywords', {})
    
    # 过滤未读文章
    unread_posts = [p for p in data['subscriptions'] if p.get('status') == 'unread']
    print(f"📬 发现 {len(unread_posts)} 篇未读文章")
    print()
    
    # 创建笔记
    created_count = 0
    p0_count = 0
    p1_count = 0
    for post in unread_posts:
        if create_note(post, output_dir, priority_keywords):
            created_count += 1
            priority = post.get('priority', 'normal')
            if priority == 'P0':
                p0_count += 1
            elif priority == 'P1':
                p1_count += 1
    
    print()
    print(f"🎉 同步完成！")
    print(f"   创建了 {created_count} 篇笔记")
    if p0_count > 0:
        print(f"   🔴 P0 必读：{p0_count} 篇")
    if p1_count > 0:
        print(f"   🟡 P1 重要：{p1_count} 篇")
    print(f"在 Obsidian 中打开目录：{output_dir}")

if __name__ == "__main__":
    main()
