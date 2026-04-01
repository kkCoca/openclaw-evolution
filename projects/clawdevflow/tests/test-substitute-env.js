/**
 * substituteEnvVars() 函数单元测试
 * 
 * 测试环境变量替换功能
 */

const path = require('path');
const fs = require('fs');

// 读取 workflow-executor.js 并提取 substituteEnvVars 函数
const code = fs.readFileSync(path.join(__dirname, '../04_coding/src/workflow-executor.js'), 'utf8');

// 提取函数定义
const startIdx = code.indexOf('function substituteEnvVars(str)');
const endMatch = code.substring(startIdx).match(/^function substituteEnvVars\(str\) \{[\s\S]*?^\}/m);
if (!endMatch) {
  console.error('❌ 无法提取 substituteEnvVars 函数');
  process.exit(1);
}
const funcCode = endMatch[0];

// 执行函数定义
eval(funcCode);

// 测试用例
let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   期望：${JSON.stringify(expected)}`);
    console.log(`   实际：${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   substituteEnvVars() 单元测试                             ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

// 测试 1: 未设置的环境变量
test('未设置的环境变量返回空字符串', substituteEnvVars('${UNDEFINED_VAR}'), '');

// 测试 2: 使用 :- 提供默认值
test(':- 语法提供默认值', substituteEnvVars('${UNDEFINED_VAR:-../../..}'), '../../..');

// 测试 3: 使用 := 提供默认值并设置环境变量
delete process.env.TEST_VAR;
const result = substituteEnvVars('${TEST_VAR:=default_value}');
test(':= 语法返回默认值', result, 'default_value');
test(':= 语法设置环境变量', process.env.TEST_VAR, 'default_value');

// 测试 4: 已设置的环境变量
test('已设置的环境变量', substituteEnvVars('${HOME}'), process.env.HOME);

// 测试 5: 非字符串输入
test('非字符串输入 - 数字', substituteEnvVars(123), 123);
test('非字符串输入 - null', substituteEnvVars(null), null);
test('非字符串输入 - undefined', substituteEnvVars(undefined), undefined);

// 测试 6: 混合字符串
test('混合字符串', substituteEnvVars('prefix-${UNDEFINED:-default}-suffix'), 'prefix-default-suffix');

// 测试 7: 多个环境变量
test('多个环境变量', substituteEnvVars('${A:-1}-${B:-2}'), '1-2');

// 测试 8: 空默认值
test('空默认值', substituteEnvVars('${UNDEFINED:-}'), '');

// 测试 9: 包含特殊字符的默认值
test('特殊字符默认值', substituteEnvVars('${VAR:-/path/to/file}'), '/path/to/file');

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   测试结果汇总                                            ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`✅ 通过：${passed}`);
console.log(`❌ 失败：${failed}`);
console.log(`📊 测试通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('');

if (failed === 0) {
  console.log('✅ 所有测试通过！');
  process.exit(0);
} else {
  console.log('❌ 有测试失败');
  process.exit(1);
}
