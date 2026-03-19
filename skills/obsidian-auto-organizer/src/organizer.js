#!/usr/bin/env node
/**
 * Obsidian Auto-Organizer - 自动整理笔记
 * 
 * 功能:
 * 1. 自动补全 Frontmatter (日期、标签、类型)
 * 2. 智能标签推荐 (基于内容分析)
 * 3. 双向链接发现
 * 4. 孤儿笔记检测
 * 5. TODO 提取
 * 6. 笔记健康度评分
 */

const fs = require('fs');
const path = require('path');

// ============ 配置 ============
const CONFIG = {
    // Obsidian 库路径
    vaultPath: process.env.OBSIDIAN_VAULT || '/home/ouyp/Documents/Obsidian Vault',
    
    // 需要扫描的目录（排除）
    excludeDirs: ['.obsidian', '.git', 'node_modules', '.trash'],
    
    // 标签关键词映射
    tagKeywords: {
        '会议': ['会议', 'meeting', '参会', '讨论', '决定'],
        '学习记录': ['学习', 'learn', '阅读', '文章', '教程'],
        'AI-Agent': ['agent', 'AI', '人工智能', '大模型', 'LLM'],
        '技术笔记': ['技术', 'code', '代码', '编程', '开发'],
        '项目': ['项目', 'project', '产品', '功能'],
        'TODO': ['todo', '待办', '计划', '要做'],
        '成本优化': ['成本', 'cost', '预算', '优化'],
        '上下文管理': ['上下文', 'context', 'token', 'memory'],
        'SRE': ['SRE', '监控', '健康', '运维', 'stability'],
    },
    
    // 笔记类型判断
    noteTypePatterns: {
        'meeting': [/会议/, /meeting/, /参会/, /讨论决定/],
        'learning': [/学习/, /learn/, /阅读/, /笔记.*技术/],
        'briefing': [/简报/, /briefing/, /日报/, /周报/],
        'memory': [/memory/, /记忆/, /进化日志/],
        'note': /.*/  // 默认
    }
};

// ============ 工具函数 ============

/**
 * 读取 Markdown 文件
 */
function readMarkdown(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * 写入 Markdown 文件
 */
function writeMarkdown(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * 解析 Frontmatter
 */
function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) return null;
    
    const frontmatter = {};
    const lines = match[1].split('\n');
    
    for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            let value = valueParts.join(':').trim();
            // 处理数组
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
            }
            frontmatter[key.trim()] = value;
        }
    }
    
    return frontmatter;
}

/**
 * 生成 Frontmatter 字符串
 */
function generateFrontmatter(fm) {
    let result = '---\n';
    for (const [key, value] of Object.entries(fm)) {
        if (Array.isArray(value)) {
            result += `${key}: [${value.join(', ')}]\n`;
        } else {
            result += `${key}: ${value}\n`;
        }
    }
    result += '---\n\n';
    return result;
}

/**
 * 检测笔记类型
 */
function detectNoteType(content, filename) {
    const text = (content + ' ' + filename).toLowerCase();
    
    for (const [type, patterns] of Object.entries(CONFIG.noteTypePatterns)) {
        const patternList = Array.isArray(patterns) ? patterns : [patterns];
        for (const pattern of patternList) {
            if (pattern.test(text)) {
                return type;
            }
        }
    }
    
    return 'note';
}

/**
 * 智能标签推荐
 */
function recommendTags(content, filename) {
    const text = (content + ' ' + filename).toLowerCase();
    const tags = new Set();
    
    for (const [tag, keywords] of Object.entries(CONFIG.tagKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
                tags.add(tag);
                break;
            }
        }
    }
    
    return Array.from(tags);
}

/**
 * 从内容中提取日期
 */
function extractDate(content, filename) {
    // 尝试从文件名提取
    const filenameMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    if (filenameMatch) return filenameMatch[1];
    
    // 尝试从内容提取
    const contentMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
    if (contentMatch) return contentMatch[1];
    
    // 使用今天
    return new Date().toISOString().split('T')[0];
}

/**
 * 提取 TODO 项
 */
function extractTODOs(content) {
    const todos = [];
    const lines = content.split('\n');
    let inTodoSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测 TODO 标题行
        if (/^TODO[:：]?$/.test(line.trim()) || /^##.*TODO/.test(line)) {
            inTodoSection = true;
            continue;
        }
        
        // 检测新的章节开始（结束 TODO 区块）
        if (inTodoSection && /^##/.test(line) && !/TODO/i.test(line)) {
            inTodoSection = false;
        }
        
        // 匹配 TODO 项
        if (inTodoSection || line.toUpperCase().includes('TODO')) {
            const match = line.match(/[-*]\s*(.+)$/);
            if (match && !line.includes('##')) {
                todos.push({
                    text: match[1].trim(),
                    line: i + 1,
                    done: line.includes('[x]') || line.includes('[X]')
                });
            }
        }
    }
    
    return todos;
}

/**
 * 计算笔记健康度
 */
function calculateHealthScore(frontmatter, backlinks, hasOutgoingLinks) {
    let score = 0;
    const details = [];
    
    // Frontmatter (30 分)
    if (frontmatter) {
        score += 10;
        details.push('✅ 有 frontmatter');
        if (frontmatter.tags && frontmatter.tags.length > 0) {
            score += 10;
            details.push(`✅ 有标签 (${frontmatter.tags.length}个)`);
        } else {
            details.push('⚠️ 无标签');
        }
        if (frontmatter.type) {
            score += 5;
            details.push('✅ 有类型');
        } else {
            details.push('⚠️ 无类型');
        }
        if (frontmatter.created || frontmatter.date) {
            score += 5;
            details.push('✅ 有日期');
        } else {
            details.push('⚠️ 无日期');
        }
    } else {
        details.push('❌ 无 frontmatter');
    }
    
    // 双向链接 (40 分)
    if (backlinks > 0) {
        score += Math.min(40, backlinks * 10);
        details.push(`✅ 有双向链接 (${backlinks}个)`);
    } else {
        details.push('⚠️ 无双向链接 (孤儿笔记)');
    }
    
    // 外出链接 (15 分)
    if (hasOutgoingLinks) {
        score += 15;
        details.push('✅ 有外出链接');
    } else {
        details.push('⚠️ 无外出链接');
    }
    
    // 回顾频率 (15 分) - 简化版本，假设有 modified 就加分
    if (frontmatter && frontmatter.modified) {
        score += 15;
        details.push('✅ 有修改记录');
    } else {
        details.push('⚠️ 无修改记录');
    }
    
    return { score, details };
}

/**
 * 发现内容中的链接
 */
function findLinks(content) {
    const wikiLinks = [];
    const match = content.match(/\[\[([^\]]+)\]\]/g);
    if (match) {
        for (const m of match) {
            wikiLinks.push(m.slice(2, -2));
        }
    }
    return wikiLinks;
}

/**
 * 扫描笔记库
 */
function scanVault(vaultPath) {
    const notes = [];
    
    function scanDir(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (CONFIG.excludeDirs.includes(entry.name)) continue;
            
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else if (entry.name.endsWith('.md')) {
                notes.push(fullPath);
            }
        }
    }
    
    scanDir(vaultPath);
    return notes;
}

// ============ 主功能 ============

/**
 * 整理单篇笔记
 */
function organizeNote(filePath, options = { dryRun: false }) {
    const content = readMarkdown(filePath);
    const filename = path.basename(filePath);
    const relativePath = path.relative(CONFIG.vaultPath, filePath);
    
    // 解析现有 frontmatter
    const existingFm = parseFrontmatter(content);
    const body = existingFm ? content.replace(/^---\n[\s\S]*?\n---\n/, '') : content;
    
    // 生成/补全 frontmatter
    const newFm = {
        ...existingFm,
        created: existingFm?.created || existingFm?.date || extractDate(content, filename),
        modified: new Date().toISOString().split('T')[0],
        type: existingFm?.type || detectNoteType(content, filename),
        tags: existingFm?.tags || recommendTags(content, filename),
    };
    
    // 提取 TODO
    const todos = extractTODOs(body);
    
    // 发现链接
    const links = findLinks(body);
    
    // 计算健康度
    const health = calculateHealthScore(newFm, 0, links.length > 0);
    
    // 生成整理后的内容
    let newContent = generateFrontmatter(newFm) + body;
    
    // 添加自动生成的区块
    const autoSections = [];
    
    if (todos.length > 0) {
        autoSections.push('\n---\n## ✅ 自动提取的 TODO\n');
        for (const todo of todos) {
            autoSections.push(`- [ ] ${todo.text} (第${todo.line}行)\n`);
        }
    }
    
    if (links.length > 0) {
        autoSections.push('\n## 🔗 外出链接\n');
        for (const link of links) {
            autoSections.push(`- [[${link}]]\n`);
        }
    }
    
    autoSections.push('\n## 📊 笔记健康度\n');
    autoSections.push(`**得分**: ${health.score}/100\n\n`);
    for (const detail of health.details) {
        autoSections.push(`${detail}\n`);
    }
    
    if (autoSections.length > 0) {
        newContent += autoSections.join('');
    }
    
    // 输出报告
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📄 ${relativePath}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`类型：${newFm.type}`);
    console.log(`标签：${newFm.tags.join(', ') || '无'}`);
    console.log(`健康度：${health.score}/100`);
    if (todos.length > 0) {
        console.log(`TODO: ${todos.length} 个`);
    }
    if (links.length > 0) {
        console.log(`链接：${links.length} 个`);
    }
    
    // 写入文件
    if (!options.dryRun) {
        // 备份原文件
        const backupPath = filePath + '.bak';
        fs.copyFileSync(filePath, backupPath);
        
        // 写入新内容
        writeMarkdown(filePath, newContent);
        console.log(`✅ 已整理 (备份：${path.basename(backupPath)})`);
    } else {
        console.log(`🔍 Dry-run 模式，未修改文件`);
    }
    
    return {
        path: relativePath,
        frontmatter: newFm,
        health: health.score,
        todos: todos.length,
        links: links.length
    };
}

/**
 * 整理整个笔记库
 */
function organizeVault(options = { dryRun: false }) {
    console.log(`🔍 扫描笔记库：${CONFIG.vaultPath}`);
    
    const notes = scanVault(CONFIG.vaultPath);
    console.log(`📚 找到 ${notes.length} 篇笔记\n`);
    
    const results = [];
    
    for (const note of notes) {
        try {
            const result = organizeNote(note, options);
            results.push(result);
        } catch (error) {
            console.error(`❌ 处理失败 ${note}: ${error.message}`);
        }
    }
    
    // 汇总报告
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 整理汇总`);
    console.log(`${'='.repeat(60)}`);
    console.log(`总笔记数：${results.length}`);
    console.log(`平均健康度：${(results.reduce((sum, r) => sum + r.health, 0) / results.length).toFixed(1)}/100`);
    console.log(`有 TODO 的笔记：${results.filter(r => r.todos > 0).length}`);
    console.log(`有链接的笔记：${results.filter(r => r.links > 0).length}`);
    
    // 孤儿笔记
    const orphans = results.filter(r => r.links === 0);
    if (orphans.length > 0) {
        console.log(`\n⚠️ 孤儿笔记 (${orphans.length}篇):`);
        for (const orphan of orphans) {
            console.log(`   - ${orphan.path}`);
        }
    }
    
    return results;
}

// ============ CLI ============

function printHelp() {
    console.log(`
Obsidian Auto-Organizer - 自动整理笔记

用法:
  node organizer.js [选项]

选项:
  --all, -a          整理整个笔记库
  --file, -f <路径>   整理单篇笔记
  --dry-run, -d      仅检查，不修改
  --help, -h         显示帮助

示例:
  node organizer.js --all
  node organizer.js --file "my-note.md"
  node organizer.js --all --dry-run
`);
}

// 主程序
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
}

const options = {
    dryRun: args.includes('--dry-run') || args.includes('-d')
};

if (args.includes('--all') || args.includes('-a')) {
    organizeVault(options);
} else if (args.includes('--file') || args.includes('-f')) {
    const fileIndex = args.findIndex(a => a === '--file' || a === '-f');
    const filePath = args[fileIndex + 1];
    const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(CONFIG.vaultPath, filePath);
    
    if (fs.existsSync(fullPath)) {
        organizeNote(fullPath, options);
    } else {
        console.error(`❌ 文件不存在：${fullPath}`);
        process.exit(1);
    }
} else {
    console.error('❌ 请指定 --all 或 --file');
    printHelp();
    process.exit(1);
}
