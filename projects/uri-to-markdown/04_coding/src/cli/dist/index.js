#!/usr/bin/env node
/**
 * URI to Markdown CLI 工具
 *
 * 使用示例:
 *   uri2md convert <url>              # 转换单个 URL
 *   uri2md batch <file>               # 批量转换
 *   uri2md login <site>               # 测试登录
 */
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { UriToMarkdown } from 'uri-to-markdown-core';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();
program
    .name('uri2md')
    .description('将网页转换为 Markdown 格式')
    .version('1.0.0');
// convert 命令
program
    .command('convert <url>')
    .description('转换单个 URL')
    .option('-c, --config <path>', '配置文件路径')
    .option('-o, --output <path>', '输出文件路径')
    .option('--with-meta', '包含元数据')
    .option('--with-attachments', '包含附件列表')
    .option('--with-fields', '包含表单字段（致远 OA）')
    .action(async (url, options) => {
    console.log(`转换 URL: ${url}`);
    const converter = new UriToMarkdown();
    try {
        // 加载配置文件
        if (options.config) {
            console.log(`加载配置文件：${options.config}`);
            await converter.loadConfig(options.config);
        }
        // 构建转换选项
        const convertOptions = {
            withMeta: options.withMeta,
            withAttachments: options.withAttachments,
            withFields: options.withFields
        };
        console.log('开始转换...');
        const result = await converter.convert(url, convertOptions);
        // 输出结果
        let output = result.markdown;
        if (result.meta) {
            output = `---\n标题：${result.meta.title}\nURL: ${result.meta.url}\n转换时间：${result.meta.convertedAt}\n---\n\n${output}`;
        }
        if (result.attachments && result.attachments.length > 0) {
            output += '\n\n## 附件\n\n';
            output += result.attachments.map(a => `- ${a.name} (${a.size})`).join('\n');
        }
        // 输出到控制台或文件
        if (options.output) {
            fs.writeFileSync(options.output, output, 'utf-8');
            console.log(`\n✅ 已保存到：${options.output}`);
        }
        else {
            console.log('\n' + output);
        }
    }
    catch (error) {
        console.error('❌ 转换失败:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await converter.close();
    }
});
// batch 命令
program
    .command('batch <file>')
    .description('批量转换（从文件读取 URL 列表）')
    .option('-c, --config <path>', '配置文件路径')
    .option('-o, --output-dir <path>', '输出目录')
    .option('--concurrency <n>', '并发数', '1')
    .action(async (file, options) => {
    console.log(`批量转换文件：${file}`);
    // 读取 URL 列表
    if (!fs.existsSync(file)) {
        console.error(`❌ 错误：文件不存在 - ${file}`);
        process.exit(1);
    }
    const content = fs.readFileSync(file, 'utf-8');
    const urls = content.split('\n').filter(line => line.trim());
    console.log(`找到 ${urls.length} 个 URL`);
    // 创建输出目录
    if (options.outputDir && !fs.existsSync(options.outputDir)) {
        fs.mkdirSync(options.outputDir, { recursive: true });
    }
    const converter = new UriToMarkdown();
    try {
        // 加载配置文件
        if (options.config) {
            console.log(`加载配置文件：${options.config}`);
            await converter.loadConfig(options.config);
        }
        // 批量转换
        const concurrency = parseInt(options.concurrency) || 1;
        console.log(`开始批量转换（并发数：${concurrency}）...\n`);
        let successCount = 0;
        let failCount = 0;
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const progress = `[${i + 1}/${urls.length}]`;
            try {
                console.log(`${progress} 转换：${url}`);
                const result = await converter.convert(url, { withMeta: true });
                // 生成输出文件名
                let filename = `page-${i + 1}.md`;
                if (result.meta?.title) {
                    filename = result.meta.title
                        .replace(/[<>:"/\\|?*]/g, '')
                        .substring(0, 50)
                        .trim() + '.md';
                }
                const outputPath = options.outputDir
                    ? path.join(options.outputDir, filename)
                    : `page-${i + 1}.md`;
                fs.writeFileSync(outputPath, result.markdown, 'utf-8');
                console.log(`  ✅ 保存到：${outputPath}`);
                successCount++;
            }
            catch (error) {
                console.error(`  ❌ 失败：${error instanceof Error ? error.message : error}`);
                failCount++;
            }
        }
        console.log(`\n========================================`);
        console.log(`批量转换完成！`);
        console.log(`成功：${successCount}, 失败：${failCount}`);
    }
    catch (error) {
        console.error('❌ 批量转换失败:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await converter.close();
    }
});
// login 命令
program
    .command('login <site>')
    .description('测试登录指定站点')
    .option('-c, --config <path>', '配置文件路径')
    .action(async (site, options) => {
    console.log(`测试登录站点：${site}`);
    const converter = new UriToMarkdown();
    try {
        // 加载配置文件
        if (options.config) {
            console.log(`加载配置文件：${options.config}`);
            await converter.loadConfig(options.config);
        }
        else {
            console.log('⚠️  未指定配置文件，使用默认配置');
        }
        console.log('\n正在连接浏览器...');
        // 初始化浏览器（会启动 Playwright 浏览器）
        await converter.convert('about:blank');
        console.log('✅ 浏览器启动成功');
        console.log('\n✅ 登录模块就绪');
        console.log('提示：实际登录在访问需要认证的 URL 时自动进行');
    }
    catch (error) {
        console.error('❌ 登录失败:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await converter.close();
    }
});
// 解析命令行参数
program.parse();
// 如果没有提供参数，显示帮助
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map