const { hello } = require('../src');

let passed = 0;
let failed = 0;

function test(name, actual, expected) {
  if (actual === expected) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   期望：${expected}`);
    console.log(`   实际：${actual}`);
    failed++;
  }
}

console.log('Running hello-cdf tests...\n');

// 测试用例
test('hello() 无参数', hello(), 'Hello, CDF!');
test('hello("Alice")', hello('Alice'), 'Hello, Alice!');
test('hello("Bob")', hello('Bob'), 'Hello, Bob!');
test('hello("") 空字符串', hello(''), 'Hello, CDF!');
test('hello(null)', hello(null), 'Hello, CDF!');
test('hello(undefined)', hello(undefined), 'Hello, CDF!');

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
