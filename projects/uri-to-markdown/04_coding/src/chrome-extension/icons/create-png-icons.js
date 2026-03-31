// 生成有效的 PNG 图标文件（绿色背景 + 白色 M 字母）
import fs from 'fs';
import zlib from 'zlib';

/**
 * 创建 PNG 文件
 * @param {number} size - 图标尺寸（如 16, 48, 128）
 * @returns {Buffer} PNG 文件数据
 */
function createPngIcon(size) {
  // PNG 文件结构：Signature + IHDR + IDAT + IEND
  
  // 1. PNG 签名 (8 字节)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // 2. IHDR 数据块（图像头）
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);        // 宽度
  ihdrData.writeUInt32BE(size, 4);        // 高度
  ihdrData.writeUInt8(8, 8);              // 位深度 (8-bit)
  ihdrData.writeUInt8(2, 9);              // 颜色类型 (2 = RGB)
  ihdrData.writeUInt8(0, 10);             // 压缩方法 (0 = deflate)
  ihdrData.writeUInt8(0, 11);             // 滤镜方法 (0 = adaptive)
  ihdrData.writeUInt8(0, 12);             // 隔行扫描方法 (0 = non-interlaced)
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // 3. 图像数据（绿色背景 + 白色 M）
  const rawData = createImageData(size);
  const compressed = zlib.deflateSync(rawData);
  
  const idatChunk = createChunk('IDAT', compressed);
  
  // 4. IEND 数据块（图像结束）
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  // 合并所有部分
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * 创建 PNG 数据块
 */
function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

/**
 * 创建图像数据（绿色背景 + 白色 M 字母）
 */
function createImageData(size) {
  // 每行需要 1 字节滤镜类型 + RGB 数据
  const rowSize = 1 + size * 3;
  const rawData = Buffer.alloc(rowSize * size);
  
  // 绿色背景 (RGB: 76, 175, 80)
  const green = [76, 175, 80];
  // 白色 (RGB: 255, 255, 255)
  const white = [255, 255, 255];
  
  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // 滤镜类型：None
    
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      
      // 判断是否在 M 字母区域内
      if (isInLetterM(x, y, size)) {
        rawData[pixelOffset] = white[0];
        rawData[pixelOffset + 1] = white[1];
        rawData[pixelOffset + 2] = white[2];
      } else {
        rawData[pixelOffset] = green[0];
        rawData[pixelOffset + 1] = green[1];
        rawData[pixelOffset + 2] = green[2];
      }
    }
  }
  
  return rawData;
}

/**
 * 判断坐标是否在字母 M 区域内
 */
function isInLetterM(x, y, size) {
  const margin = Math.floor(size * 0.2);
  const width = size - 2 * margin;
  const height = size - 2 * margin;
  
  // 归一化坐标 (0-1)
  const nx = (x - margin) / width;
  const ny = (y - margin) / height;
  
  if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return false;
  
  // M 字母的简单形状
  const strokeWidth = Math.max(1, Math.floor(width * 0.12));
  
  // 左竖线
  if (nx < strokeWidth / width) return true;
  
  // 右竖线
  if (nx > 1 - strokeWidth / width) return true;
  
  // 顶部横线
  if (ny < strokeWidth / height) return true;
  
  // V 形中间部分
  const leftX = strokeWidth / width;
  const rightX = 1 - strokeWidth / width;
  const middleX = 0.5;
  const middleBottom = 1 - strokeWidth / height;
  
  // 左斜线 (从左上到中间底部)
  const leftSlope = (middleBottom - 0) / (middleX - leftX);
  const leftLineY = leftSlope * (nx - leftX);
  if (nx >= leftX && nx <= middleX && ny >= leftLineY && ny <= leftLineY + strokeWidth / height) return true;
  
  // 右斜线 (从中间底部到右上)
  const rightSlope = (0 - middleBottom) / (rightX - middleX);
  const rightLineY = rightSlope * (nx - middleX) + middleBottom;
  if (nx >= middleX && nx <= rightX && ny >= rightLineY && ny <= rightLineY + strokeWidth / height) return true;
  
  return false;
}

/**
 * CRC32 计算（PNG 标准）
 */
function crc32(data) {
  let crc = 0xffffffff;
  const table = getCrcTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  
  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  return crcTable;
}

// 主程序
const sizes = [16, 48, 128];
const outputDir = new URL('.', import.meta.url).pathname;

console.log('生成 PNG 图标...\n');

sizes.forEach(size => {
  const filename = `icon-${size}.png`;
  const filepath = outputDir + filename;
  
  const pngData = createPngIcon(size);
  fs.writeFileSync(filepath, pngData);
  
  console.log(`✅ ${filename} (${pngData.length} bytes)`);
});

console.log('\n🎉 图标生成完成！');
