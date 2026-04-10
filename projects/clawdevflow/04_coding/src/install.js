#!/usr/bin/env node

/**
 * OpenClaw Research Workflow Skill 安装脚本 (Node.js 跨平台)
 * 版本：1.0.0
 * 支持：Windows, Linux, macOS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色定义
const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[0;34m',
    green: '\x1b[0;32m',
    yellow: '\x1b[1;33m',
    red: '\x1b[0;31m'
};

function printInfo(msg) {
    console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

function printSuccess(msg) {
    console.log(`${colors.green}✅  ${msg}${colors.reset}`);
}

function printWarning(msg) {
    console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

function printError(msg) {
    console.log(`${colors.red}❌  ${msg}${colors.reset}`);
}

// 递归复制目录
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 主流程
function main() {
    console.log('');
    printInfo('🚀 开始安装 OpenClaw Research Workflow Skill...');
    console.log('');

    // 1. 检查环境
    printInfo('📋 检查环境...');
    
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        printSuccess(`Node.js 已安装 (${nodeVersion})`);
    } catch (e) {
        printError('Node.js 未安装，请先安装 Node.js');
        printInfo('安装方法：');
        printInfo('  Ubuntu/Debian: sudo apt install nodejs npm');
        printInfo('  macOS: brew install node');
        printInfo('  Windows: 下载 https://nodejs.org/');
        process.exit(1);
    }

    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        printSuccess(`npm 已安装 (${npmVersion})`);
    } catch (e) {
        printError('npm 未安装，请先安装 npm');
        process.exit(1);
    }

    // 2. 确定 OpenClaw skills 目录
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const skillsDir = path.join(homeDir, '.openclaw', 'skills');
    
    if (!fs.existsSync(skillsDir)) {
        printError(`OpenClaw skills 目录不存在：${skillsDir}`);
        printInfo('请先安装 OpenClaw: npm install -g openclaw');
        process.exit(1);
    }
    printSuccess(`OpenClaw skills 目录：${skillsDir}`);

    // 3. 获取脚本所在目录
    const scriptDir = __dirname;
    const skillName = 'clawdevflow';
    const targetDir = path.join(skillsDir, skillName);

    // 4. 检查是否已安装
    if (fs.existsSync(targetDir)) {
        printWarning(`已检测到现有安装：${targetDir}`);
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            readline.question('是否覆盖安装？(y/N): ', (answer) => {
                readline.close();
                if (!answer.toLowerCase().startsWith('y')) {
                    printInfo('取消安装');
                    process.exit(0);
                }
                printInfo('删除现有安装...');
                fs.rmSync(targetDir, { recursive: true, force: true });
                continueInstall();
            });
        });
    } else {
        continueInstall();
    }

    function continueInstall() {
        // 5. 复制主 skill
        printInfo('📦 复制主 skill...');
        copyDir(scriptDir, targetDir);
        printSuccess('复制完成');

        // 6. 设置执行权限（仅 Unix-like 系统）
        if (process.platform !== 'win32') {
            printInfo('🔧 设置执行权限...');
            try {
                fs.chmodSync(path.join(targetDir, 'install.sh'), '755');
                fs.chmodSync(path.join(targetDir, 'install.js'), '755');
                printSuccess('权限设置完成');
            } catch (e) {
                printWarning('设置执行权限失败，可手动设置');
            }
        }

        // 7. 验证安装
        printInfo('✅ 验证安装...');
        
        const requiredFiles = [
            'SKILL.md',
            'workflow-executor.js',
            'README.md',
            'install.sh',
            'install.bat',
            'install.js'
        ];

        const missingFiles = [];
        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(targetDir, file))) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            printError('缺少必要文件：');
            missingFiles.forEach(file => console.log(`  - ${file}`));
            process.exit(1);
        }

        // 检查 bundled-skills 目录
        if (!fs.existsSync(path.join(targetDir, 'bundled-skills'))) {
            printError('bundled-skills 目录不存在');
            process.exit(1);
        }

        // 检查 bundled skills
        const bundledSkills = ['designing', 'roadmapping', 'detailing', 'coding', 'testing', 'reviewing', 'precommit', 'releasing'];
        const missingSkills = [];
        for (const skill of bundledSkills) {
            if (!fs.existsSync(path.join(targetDir, 'bundled-skills', skill))) {
                missingSkills.push(skill);
            }
        }

        if (missingSkills.length > 0) {
            printError('缺少 bundled skills：');
            missingSkills.forEach(skill => console.log(`  - ${skill}`));
            process.exit(1);
        }

        printSuccess('所有文件验证通过');

        // 8. 完成
        console.log('');
        printSuccess('🎉 安装成功！');
        console.log('');
        printInfo(`📍 安装位置：${targetDir}`);
        console.log('');
        printInfo('使用方法:');
        console.log('  /sessions_spawn clawdevflow');
        console.log('');
        printInfo('查看文档:');
        console.log(`  cat ${path.join(targetDir, 'README.md')}`);
        console.log('');
        printInfo('示例:');
        console.log(`  cat ${path.join(targetDir, 'examples', 'example-1-new-feature.md')}`);
        console.log('');
    }
}

// 执行主流程
main().catch(err => {
    printError(`安装失败：${err.message}`);
    process.exit(1);
});
