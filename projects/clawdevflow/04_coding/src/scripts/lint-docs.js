/**
 * lint-docs.js - 文档一致性检查
 * 
 * ClawDevFlow (CDF) 文档 lint 工具
 * 校验文档与代码的一致性
 * 
 * @version 3.4.0
 * @author openclaw-ouyp
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.join(__dirname, '..');
let errors = [];

console.log('=== lint:docs 开始 ===\n');

// 1. package.json.version == SKILL.md version
console.log('[1/6] 检查版本一致性...');
const pkg = require('../package.json');
const skillPath = path.join(ROOT, 'SKILL.md');

if (fs.existsSync(skillPath)) {
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  const versionMatch = skillContent.match(/^version:\s*(.+)$/m);
  if (versionMatch) {
    const skillVersion = versionMatch[1].trim();
    if (pkg.version !== skillVersion) {
      errors.push(`版本不一致：package.json=${pkg.version}, SKILL.md=${skillVersion}`);
      console.log(`  ❌ 版本不一致：package.json=${pkg.version}, SKILL.md=${skillVersion}`);
    } else {
      console.log(`  ✅ 版本一致：${pkg.version}`);
    }
  } else {
    errors.push('SKILL.md 未找到 version 字段');
    console.log('  ❌ SKILL.md 未找到 version 字段');
  }
} else {
  console.log('  ⚠️ SKILL.md 不存在，跳过版本检查');
}

// 2. constants.STAGE_SEQUENCE 在 README 出现
console.log('[2/6] 检查阶段序列...');
const constants = require('../cdf-orchestrator/constants');
const readmePath = path.join(ROOT, '../../README.md');

if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const missingStages = [];
  
  for (const stage of constants.STAGE_SEQUENCE) {
    if (!readme.includes(stage)) {
      missingStages.push(stage);
    }
  }
  
  if (missingStages.length > 0) {
    errors.push(`README 未包含阶段：${missingStages.join(', ')}`);
    console.log(`  ❌ README 未包含阶段：${missingStages.join(', ')}`);
  } else {
    console.log(`  ✅ README 包含所有 8 个阶段`);
  }
} else {
  console.log('  ⚠️ README.md 不存在，跳过阶段检查');
}

// 3. config/config.yaml 可解析
console.log('[3/6] 检查配置文件...');
const configPath = path.join(ROOT, 'config/config.yaml');

if (fs.existsSync(configPath)) {
  try {
    const yamlContent = fs.readFileSync(configPath, 'utf8');
    const config = YAML.parse(yamlContent);
    
    if (!config.stages) {
      errors.push('config.yaml 缺少 stages 字段');
      console.log('  ❌ config.yaml 缺少 stages 字段');
    } else {
      console.log(`  ✅ config.yaml 解析成功，包含 ${Object.keys(config.stages).length} 个阶段`);
    }
  } catch (error) {
    errors.push(`config.yaml 解析失败：${error.message}`);
    console.log(`  ❌ config.yaml 解析失败：${error.message}`);
  }
} else {
  errors.push('config/config.yaml 不存在');
  console.log('  ❌ config/config.yaml 不存在');
}

// 4. stages 包含 testing/precommit/releasing 且输出文件名匹配
console.log('[4/6] 检查阶段输出...');
const stagesPath = path.join(ROOT, '../../docs/stages.md');

if (fs.existsSync(stagesPath)) {
  const stages = fs.readFileSync(stagesPath, 'utf8');
  const requiredOutputs = ['TEST-REPORT.md', 'PRECOMMIT-CHECKLIST.md', 'RELEASE-NOTES.md'];
  const missingOutputs = [];
  
  for (const output of requiredOutputs) {
    if (!stages.includes(output)) {
      missingOutputs.push(output);
    }
  }
  
  if (missingOutputs.length > 0) {
    errors.push(`stages.md 未包含输出文件：${missingOutputs.join(', ')}`);
    console.log(`  ❌ stages.md 未包含输出文件：${missingOutputs.join(', ')}`);
  } else {
    console.log(`  ✅ stages.md 包含所有必需输出文件`);
  }
} else {
  console.log('  ⚠️ docs/stages.md 不存在，跳过输出检查');
}

// 5. auto-review 路由使用 reviewer.review(ctx)
console.log('[5/6] 检查 auto-review 路由...');
const autoReviewPath = path.join(ROOT, 'review-orchestrator/auto-review/index.js');
if (fs.existsSync(autoReviewPath)) {
  const autoReviewContent = fs.readFileSync(autoReviewPath, 'utf8');
  if (!autoReviewContent.includes('reviewer.review(ctx)')) {
    errors.push('auto-review 路由未调用 reviewer.review(ctx)');
    console.log('  ❌ auto-review 路由未调用 reviewer.review(ctx)');
  } else {
    console.log('  ✅ auto-review 路由调用 reviewer.review(ctx)');
  }
} else {
  errors.push('auto-review/index.js 不存在');
  console.log('  ❌ auto-review/index.js 不存在');
}

// 6. CDF_IO_SPEC 目录一致性检查
console.log('[6/6] 检查 CDF_IO_SPEC 目录...');
const ioSpecPath = path.join(ROOT, '../../docs/CDF_IO_SPEC.md');
if (fs.existsSync(ioSpecPath)) {
  const ioSpec = fs.readFileSync(ioSpecPath, 'utf8');
  const missingDirs = [];
  if (!ioSpec.includes('06_testing')) {
    missingDirs.push('06_testing');
  }
  if (!ioSpec.includes('08_releasing')) {
    missingDirs.push('08_releasing');
  }
  if (missingDirs.length > 0) {
    errors.push(`CDF_IO_SPEC.md 缺少目录声明：${missingDirs.join(', ')}`);
    console.log(`  ❌ CDF_IO_SPEC.md 缺少目录声明：${missingDirs.join(', ')}`);
  } else {
    console.log('  ✅ CDF_IO_SPEC.md 目录声明一致');
  }
} else {
  console.log('  ⚠️ docs/CDF_IO_SPEC.md 不存在，跳过目录检查');
}

// 总结
console.log('\n=== lint:docs 结果 ===');
if (errors.length === 0) {
  console.log('✅ 所有检查通过\n');
  process.exit(0);
} else {
  console.log(`❌ 发现 ${errors.length} 个错误：`);
  errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  console.log('');
  process.exit(1);
}
