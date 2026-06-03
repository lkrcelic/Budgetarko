/**
 * generate-icons.js
 * Creates PWA icon PNGs using only Node.js built-in modules.
 * Run: node scripts/generate-icons.js
 *
 * Icon design: solid #1f8a5b green background + white wallet shape
 *   - wallet body    : rounded rect (19%-81% w, 30%-76% h)
 *   - card slot      : rounded rect (33%-67% w, 20%-36% h) [protrudes above body]
 *   - clasp circle   : green circle carved from body (63.5%, 53.5%, r=5.7%)
 */

const zlib = require('node:zlib')
const fs   = require('node:fs')
const path = require('node:path')

// ── CRC32 (required by the PNG spec) ──────────────────────────────────────────
const crc32Table = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const lenBuf  = Buffer.alloc(4);  lenBuf.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf  = Buffer.alloc(4);  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

// ── Geometry helpers (normalized [0,1] coords) ────────────────────────────────
function inRoundedRect(nx, ny, x1, y1, x2, y2, r) {
  if (nx < x1 || nx > x2 || ny < y1 || ny > y2) return false
  const circ = (cx, cy) => { const dx = nx-cx, dy = ny-cy; return dx*dx+dy*dy <= r*r }
  if (nx < x1+r && ny < y1+r) return circ(x1+r, y1+r)
  if (nx > x2-r && ny < y1+r) return circ(x2-r, y1+r)
  if (nx < x1+r && ny > y2-r) return circ(x1+r, y2-r)
  if (nx > x2-r && ny > y2-r) return circ(x2-r, y2-r)
  return true
}

function inCircle(nx, ny, cx, cy, r) {
  const dx = nx-cx, dy = ny-cy; return dx*dx+dy*dy <= r*r
}

// ── Per-pixel icon logic ──────────────────────────────────────────────────────
function iconPixel(nx, ny) {
  // Green background
  let R = 0x1f, G = 0x8a, B = 0x5b

  const body  = inRoundedRect(nx, ny, 0.19, 0.30, 0.81, 0.76, 0.05)
  const slot  = inRoundedRect(nx, ny, 0.33, 0.20, 0.67, 0.36, 0.04)
  const clasp = inCircle(nx, ny, 0.635, 0.535, 0.057)

  if (body || slot) { R = 0xff; G = 0xff; B = 0xff }  // white wallet
  if (clasp && body) { R = 0x1f; G = 0x8a; B = 0x5b } // green clasp hole

  return [R, G, B]
}

// ── PNG builder ───────────────────────────────────────────────────────────────
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function generatePNG(size) {
  const rowBytes = size * 3 + 1  // filter-byte + RGB per scanline
  const raw = Buffer.alloc(size * rowBytes)

  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0  // filter: None
    for (let x = 0; x < size; x++) {
      const [R, G, B] = iconPixel((x + 0.5) / size, (y + 0.5) / size)
      const i = y * rowBytes + 1 + x * 3
      raw[i] = R; raw[i+1] = G; raw[i+2] = B
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2   // 8-bit RGB

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write all sizes ───────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })

const icons = [
  { size: 64,  name: 'pwa-64.png'          },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'pwa-192.png'          },
  { size: 512, name: 'pwa-512.png'          },
]

for (const { size, name } of icons) {
  const png  = generatePNG(size)
  const out  = path.join(outDir, name)
  fs.writeFileSync(out, png)
  console.log(`✓  ${name.padEnd(24)} ${size}×${size}  ${(png.length/1024).toFixed(1)} KB`)
}

console.log('\nDone — icons written to public/')
