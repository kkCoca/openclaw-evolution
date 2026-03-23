/**
 * HTML 解析器集成测试
 * 
 * 使用真实抓取的 HTML 样本验证解析器功能
 */

const fs = require('fs');
const path = require('path');
const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const { parseDdgDocument, detectDdgBlockingState } = require('../src/parser/ddg-parser.js');
const { extractBingResults } = require('../src/parser/bing-parser.js');

// 加载真实 HTML 样本
function loadFixture(filename) {
  const fixturePath = path.join(__dirname, 'fixtures', filename);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }
  return fs.readFileSync(fixturePath, 'utf8');
}

describe('DDG 解析器集成测试', () => {
  let ddgCaptchaHtml;
  
  before(() => {
    ddgCaptchaHtml = loadFixture('ddg-captcha.html');
  });

  it('验证码页面应检测到 blocking 状态', () => {
    const blockingState = detectDdgBlockingState(ddgCaptchaHtml);
    assert.strictEqual(blockingState.blocked, true);
    assert.strictEqual(blockingState.type, 'captcha_detected');
  });

  it('验证码页面应抛出 SearchError', () => {
    assert.throws(() => parseDdgDocument(ddgCaptchaHtml, 10), (err) => {
      return err instanceof Error && err.type === 'captcha_detected';
    });
  });

  it('验证码检测应覆盖 anomaly-modal 特征', () => {
    assert.ok(ddgCaptchaHtml.toLowerCase().includes('anomaly-modal'));
  });

  it('验证码检测应覆盖 botnet 特征', () => {
    assert.ok(ddgCaptchaHtml.toLowerCase().includes('botnet'));
  });
});

describe('Bing 解析器集成测试', () => {
  let bingNormalHtml;
  
  before(() => {
    bingNormalHtml = loadFixture('bing-normal.html');
  });

  it('正常页面应提取到结果', () => {
    const results = extractBingResults(bingNormalHtml, 10);
    assert.ok(results.length >= 5, `期望结果数 >= 5, 实际：${results.length}`);
  });

  it('结果应包含标题、URL、摘要', () => {
    const results = extractBingResults(bingNormalHtml, 10);
    assert.ok(results[0], '至少有一个结果');
    assert.ok(results[0].hasOwnProperty('title'));
    assert.ok(results[0].hasOwnProperty('url'));
    assert.ok(results[0].hasOwnProperty('snippet'));
    assert.strictEqual(results[0].source, 'bing');
  });

  it('结果 URL 应为有效格式', () => {
    const results = extractBingResults(bingNormalHtml, 10);
    results.forEach(result => {
      assert.ok(/^https?:\/\//.test(result.url), `URL 格式无效：${result.url}`);
    });
  });
});
