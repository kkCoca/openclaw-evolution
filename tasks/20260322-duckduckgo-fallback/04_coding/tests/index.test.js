/**
 * DDGFallback unit tests
 */

const DDGFallback = require('../src/index.js');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
    passCount++;
  } catch (error) {
    console.log(`FAIL ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

test('creates an instance', () => {
  const fallback = new DDGFallback();
  assert(fallback instanceof DDGFallback, 'instance creation failed');
  assert(fallback.maxRetries === 3, 'default maxRetries should be 3');
});

test('shouldFallback recognizes 429', () => {
  const fallback = new DDGFallback();
  const error = { code: 429 };
  assert(fallback.shouldFallback(error) === true, 'should recognize 429');
});

test('shouldFallback recognizes 503', () => {
  const fallback = new DDGFallback();
  const error = { code: 503 };
  assert(fallback.shouldFallback(error) === true, 'should recognize 503');
});

test('shouldFallback recognizes timeout', () => {
  const fallback = new DDGFallback();
  const error = { message: 'timeout' };
  assert(fallback.shouldFallback(error) === true, 'should recognize timeout');
});

console.log('\n========================================');
console.log(`Test result: ${passCount} passed, ${failCount} failed`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
