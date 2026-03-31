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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入核心库（实际使用时需要正确配置）
// import { UriToMarkdown } from 'uri-to-markdown-core';

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
  .action(async (url: string, options: any) => {
    console.log(`转换 URL: ${url}`);
    console.log('选项:', JSON.stringify(options, null, 2));
    
    // TODO: 实现实际转换逻辑
    console.log('\n[模拟输出]');
    console.log('# 页面标题\n\n页面内容...');
    
    if (options.output) {
      console.log(`\n输出到文件：${options.output}`);
      // fs.writeFileSync(options.output, markdown);
    }
  });

// batch 命令
program
  .command('batch <file>')
  .description('批量转换（从文件读取 URL 列表）')
  .option('-c, --config <path>', '配置文件路径')
  .option('-o, --output-dir <path>', '输出目录')
  .option('--concurrency <n>', '并发数', '1')
  .action(async (file: string, options: any) => {
    console.log(`批量转换文件：${file}`);
    console.log('选项:', JSON.stringify(options, null, 2));

    // 读取 URL 列表
    if (!fs.existsSync(file)) {
      console.error(`错误：文件不存在 - ${file}`);
      process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf-8');
    const urls = content.split('\n').filter(line => line.trim());
    
    console.log(`找到 ${urls.length} 个 URL`);
    
    // TODO: 实现批量转换逻辑
    for (const url of urls) {
      console.log(`  - ${url}`);
    }
  });

// login 命令
program
  .command('login <site>')
  .description('测试登录指定站点')
  .option('-c, --config <path>', '配置文件路径')
  .action(async (site: string, options: any) => {
    console.log(`测试登录站点：${site}`);
    console.log('选项:', JSON.stringify(options, null, 2));
    
    // TODO: 实现登录测试逻辑
    console.log('\n[模拟输出]');
    console.log('✓ 登录成功');
  });

// 解析命令行参数
program.parse();

// 如果没有提供参数，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
