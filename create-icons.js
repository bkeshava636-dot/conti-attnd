const fs = require('fs');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth: 8
  ihdrData.writeUInt8(6, 9); // color type: 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression method
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace method
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each with 1 filter byte (0) + width * 4 bytes (RGBA)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // filter type 0: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw a nice rounded box / stylized 'C'
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.hypot(x - cx, y - cy);
      const radius = width * 0.44;

      if (dist <= radius) {
        // Deep emerald teal gradient
        const t = y / height;
        rawData[pxOffset + 0] = Math.round(16 + t * 20); // R
        rawData[pxOffset + 1] = Math.round(185 - t * 40); // G
        rawData[pxOffset + 2] = Math.round(129 + t * 40); // B
        rawData[pxOffset + 3] = 255; // Alpha
      } else {
        rawData[pxOffset + 0] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(length, 0);
  header.write(type, 4, 4, 'ascii');

  const toCrc = Buffer.concat([header.subarray(4, 8), data]);
  const crc = crc32(toCrc);
  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crc, 0);

  return Buffer.concat([header, data, footer]);
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

[16, 32, 48, 128].forEach(size => {
  const pngBuf = createPNG(size, size, 16, 185, 129);
  fs.writeFileSync(`extension/icons/icon-${size}.png`, pngBuf);
  console.log(`Generated icon-${size}.png`);
});
