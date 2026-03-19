#!/usr/bin/env python3
"""
自动信息处理脚本 - 基于 Moltbook 学习成果
功能：将原始信息（会议记录/文章/笔记）自动处理为结构化简报

使用方法:
    python auto-briefing.py input.md output.md
"""

import sys
import re
from datetime import datetime
from pathlib import Path

# 优先级评估框架（来自洞察 #16）
PRIORITY_CRITERIA = {
    'P0': {'impact_threshold': 4, 'difficulty_max': 2, 'label': '立即执行 (本周)'},
    'P1': {'impact_threshold': 3, 'difficulty_max': 4, 'label': '近期执行 (本月)'},
    'P2': {'impact_threshold': 2, 'difficulty_max': 5, 'label': '中期执行 (本季)'},
}

def extract_key_points(text):
    """从原始文本中提取关键点（基于洞察 #15 的主题聚类方法）"""
    points = []
    
    # 提取带标记的段落
    patterns = [
        r'###?\s+(.+?)\n(.*?)(?=\n#|\Z)',  # Markdown 标题 + 内容
        r'[-*]\s*(.+?)\n(.*?)(?=\n[-*]|\Z)',  # 列表项
        r'>(.+?)\n',  # 引用块
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        for match in matches:
            if len(match) == 2:
                title, content = match
                points.append({
                    'title': title.strip(),
                    'content': content.strip()[:200],  # 限制长度
                })
    
    return points

def cluster_by_theme(points):
    """将关键点按主题聚类（基于洞察 #15）"""
    themes = {
        '身份与记忆': [],
        '系统健康': [],
        '学习与内化': [],
        '其他': []
    }
    
    # 简单的关键词匹配聚类
    theme_keywords = {
        '身份与记忆': ['记忆', '身份', 'identity', 'memory', 'persistent', 'receipt'],
        '系统健康': ['监控', '健康', 'SRE', '上下文', 'overflow', 'API', '配置'],
        '学习与内化': ['学习', '内化', '知识', 'learning', 'practice', '实验'],
    }
    
    for point in points:
        text = (point['title'] + ' ' + point['content']).lower()
        matched = False
        for theme, keywords in theme_keywords.items():
            if any(kw.lower() in text for kw in keywords):
                themes[theme].append(point)
                matched = True
                break
        if not matched:
            themes['其他'].append(point)
    
    return {k: v for k, v in themes.items() if v}  # 移除空主题

def assess_priority(title, content):
    """评估行动项优先级（基于洞察 #16 的影响力/难度框架）"""
    text = (title + ' ' + content).lower()
    
    # 简单的影响力评估
    impact_score = 3  # 默认中等
    if any(w in text for w in ['阻塞', '立即', 'critical', 'blocking', '🔴']):
        impact_score = 5
    elif any(w in text for w in ['建议', '优化', 'improve', 'enhance']):
        impact_score = 4
    elif any(w in text for w in ['中期', '长期', 'future', 'later']):
        impact_score = 2
    
    # 简单的难度评估
    difficulty = 2  # 默认中等
    if any(w in text for w in ['配置', '简单', 'easy', 'quick', '立即']):
        difficulty = 1
    elif any(w in text for w in ['实现', '重构', 'complex', 'implement', 'system']):
        difficulty = 3
    elif any(w in text for w in ['设计', '架构', 'design', 'architecture', 'research']):
        difficulty = 4
    
    # 确定优先级
    if impact_score >= PRIORITY_CRITERIA['P0']['impact_threshold'] and difficulty <= PRIORITY_CRITERIA['P0']['difficulty_max']:
        return 'P0'
    elif impact_score >= PRIORITY_CRITERIA['P1']['impact_threshold'] and difficulty <= PRIORITY_CRITERIA['P1']['difficulty_max']:
        return 'P1'
    else:
        return 'P2'

def generate_briefing(input_path, output_path):
    """生成结构化简报"""
    
    # 读取输入
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取关键点
    points = extract_key_points(content)
    
    # 主题聚类
    themes = cluster_by_theme(points)
    
    # 生成输出
    output = []
    output.append(f"# 自动信息处理简报")
    output.append(f"\n*生成时间*: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    output.append(f"*输入文件*: {input_path}")
    output.append(f"*提取关键点*: {len(points)} 个")
    output.append(f"*主题分类*: {len(themes)} 个\n")
    
    output.append("---\n")
    
    # 按主题输出
    for theme_name, theme_points in themes.items():
        output.append(f"## 📁 {theme_name}\n")
        
        for i, point in enumerate(theme_points, 1):
            priority = assess_priority(point['title'], point['content'])
            priority_label = PRIORITY_CRITERIA[priority]['label']
            
            output.append(f"### {i}. {point['title']}")
            output.append(f"**优先级**: {priority} - {priority_label}\n")
            output.append(f"{point['content']}\n")
    
    # 汇总统计
    output.append("---\n")
    output.append("## 📊 汇总统计\n")
    
    p0_count = sum(1 for theme_points in themes.values() 
                   for p in theme_points if assess_priority(p['title'], p['content']) == 'P0')
    p1_count = sum(1 for theme_points in themes.values() 
                   for p in theme_points if assess_priority(p['title'], p['content']) == 'P1')
    p2_count = sum(1 for theme_points in themes.values() 
                   for p in theme_points if assess_priority(p['title'], p['content']) == 'P2')
    
    output.append(f"| 优先级 | 数量 | 说明 |")
    output.append(f"|--------|------|------|")
    output.append(f"| P0 | {p0_count} | 立即执行 (本周) |")
    output.append(f"| P1 | {p1_count} | 近期执行 (本月) |")
    output.append(f"| P2 | {p2_count} | 中期执行 (本季) |")
    
    # 写入输出
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print(f"✅ 简报生成完成：{output_path}")
    print(f"   - 关键点：{len(points)} 个")
    print(f"   - 主题：{len(themes)} 个")
    print(f"   - P0: {p0_count}, P1: {p1_count}, P2: {p2_count}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("用法：python auto-briefing.py input.md output.md")
        sys.exit(1)
    
    generate_briefing(sys.argv[1], sys.argv[2])
