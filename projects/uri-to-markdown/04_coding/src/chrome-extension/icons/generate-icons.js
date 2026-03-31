// 生成简单的 PNG 图标占位符（绿色背景 + 白色 M 字母）
import fs from 'fs';

// 简单的 PNG 生成（1x1 像素绿色）
// 实际使用时请替换为真实图标
function createPlaceholderPng(size) {
  // 这是一个极简的 PNG 文件头（实际应使用完整 PNG）
  // 这里使用 base64 编码的简单绿色方块
  const pngData = Buffer.from(
    `iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9InIiPz4=`,
    'base64'
  );
  
  // 注意：这是一个占位符，实际项目请使用真实图标
  // 可以使用在线工具生成：https://www.icoconverter.com/
  console.log(`Creating placeholder icon: ${size}x${size}`);
  return pngData;
}

// 生成三个尺寸的图标
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const filename = `icon-${size}.png`;
  // 创建占位符文件
  fs.writeFileSync(filename, Buffer.from('PLACEHOLDER_ICON_' + size));
  console.log(`Created: ${filename} (placeholder - replace with real icon)`);
});

console.log('\n⚠️  图标文件是占位符，请替换为真实图标文件');
console.log('建议使用在线工具生成：https://www.icoconverter.com/');
console.log('或使用设计工具创建 16x16, 48x48, 128x128 的 PNG 文件');
