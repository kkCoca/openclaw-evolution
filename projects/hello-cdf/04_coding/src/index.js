/**
 * hello-cdf 核心模块
 * @param {string} [name] - 可选的名字参数
 * @returns {string} 问候语
 */
function hello(name) {
  return `Hello, ${name || 'CDF'}!`;
}

module.exports = { hello };
