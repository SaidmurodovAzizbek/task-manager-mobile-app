/**
 * generate-icons.js - Ilova ikonkalarini yaratish
 *
 * Loyihadagi assets/*.png fayllari 1x1 piksellik bo'sh rasm edi, ya'ni
 * telefonda ilova ikonkasi buzuq ko'rinardi. Bu skript ularni qaytadan
 * chizadi - hech qanday qo'shimcha kutubxonasiz, faqat Node yordamida.
 *
 * Ishlatish:
 *
 *     node scripts/generate-icons.js
 *
 * Ikonka dizaynini o'zgartirmoqchi bo'lsangiz - pastdagi CONFIG va
 * drawCheck funksiyasiga qarang.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Brend rangi (theme/colors.js dagi primary bilan bir xil)
const BRAND = { r: 0x00, g: 0x52, b: 0xcc };
const WHITE = { r: 0xff, g: 0xff, b: 0xff };

// ---------------------------------------------------------------------------
// PNG yozish
// ---------------------------------------------------------------------------

/**
 * PNG bo'limini (chunk) sarlavha va nazorat yig'indisi bilan o'rash.
 *
 * @param {string} type - Bo'lim turi ('IHDR', 'IDAT', 'IEND')
 * @param {Buffer} data - Bo'lim ma'lumoti
 * @returns {Buffer}
 */
const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(typeAndData) >>> 0, 0);

  return Buffer.concat([length, typeAndData, crc]);
};

/**
 * RGBA piksellar massivini PNG faylga aylantirish.
 *
 * @param {number} size - Rasm o'lchami (kvadrat)
 * @param {Buffer} pixels - size * size * 4 bayt (R, G, B, A)
 * @returns {Buffer} - Tayyor PNG fayl
 */
const encodePng = (size, pixels) => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR: o'lcham, 8 bit, 6 = RGBA
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit chuqurligi
  ihdr[9] = 6;  // rang turi: RGBA
  ihdr[10] = 0; // siqish usuli
  ihdr[11] = 0; // filtr usuli
  ihdr[12] = 0; // interlace yo'q

  // PNG'da har bir qator oldidan filtr bayti turadi (0 = filtrsiz)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// ---------------------------------------------------------------------------
// Chizish
// ---------------------------------------------------------------------------

/**
 * Nuqtadan kesmagacha bo'lgan eng qisqa masofa.
 * Chiziqni "qalinligi bor" qilib chizish uchun kerak.
 */
const distanceToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  // Kesma bo'yicha eng yaqin nuqtaning nisbiy o'rni (0 dan 1 gacha)
  let t = lengthSquared === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const cx = ax + t * dx;
  const cy = ay + t * dy;

  return Math.hypot(px - cx, py - cy);
};

/**
 * Burchaklari yumaloq kvadratgacha bo'lgan masofa (ichkarida manfiy).
 */
const distanceToRoundedSquare = (px, py, half, radius) => {
  const qx = Math.abs(px) - half + radius;
  const qy = Math.abs(py) - half + radius;

  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
};

/**
 * Chekka silliq bo'lishi uchun qoplama darajasi (0 dan 1 gacha).
 * Masofa manfiy bo'lsa - shakl ichidamiz.
 */
const coverage = (distance, edge) => {
  if (distance <= -edge) return 1;
  if (distance >= edge) return 0;
  return (edge - distance) / (2 * edge);
};

/**
 * Bitta ikonka rasmini chizish.
 *
 * @param {Object} options
 * @param {number} options.size - Rasm o'lchami
 * @param {Object|null} options.background - Fon rangi (null = shaffof)
 * @param {Object} options.mark - Belgi (✓) rangi
 * @param {number} options.markScale - Belgining rasmga nisbatan kattaligi
 * @param {number} options.radius - Fon burchaklarining yumaloqligi (0 = o'tkir)
 * @returns {Buffer} - RGBA piksellar
 */
const drawIcon = ({ size, background, mark, markScale, radius = 0.115 }) => {
  const pixels = Buffer.alloc(size * size * 4);

  // Chekkalarni silliqlash uchun bir piksel kengligidagi o'tish zonasi
  const edge = 1 / size;

  // Belgi (✓) ning ikki kesmasi - rasm markaziga nisbatan
  const scale = markScale;
  const points = {
    ax: -0.42 * scale, ay: 0.02 * scale,
    bx: -0.12 * scale, by: 0.32 * scale,
    cx: 0.44 * scale, cy: -0.30 * scale,
  };
  const thickness = 0.13 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Piksel markazini -0.5..0.5 oralig'iga keltiramiz
      const px = (x + 0.5) / size - 0.5;
      const py = (y + 0.5) / size - 0.5;

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      // 1) Fon (yumaloq burchakli kvadrat)
      if (background) {
        const bgCoverage = coverage(
          distanceToRoundedSquare(px, py, 0.5, radius),
          edge
        );

        r = background.r;
        g = background.g;
        b = background.b;
        a = bgCoverage;
      }

      // 2) Belgi - ikki kesmadan iborat "galochka"
      const markDistance = Math.min(
        distanceToSegment(px, py, points.ax, points.ay, points.bx, points.by),
        distanceToSegment(px, py, points.bx, points.by, points.cx, points.cy)
      );

      const markCoverage = coverage(markDistance - thickness / 2, edge);

      if (markCoverage > 0) {
        // Belgini fon ustiga qo'yamiz (oddiy alpha aralashtirish)
        const outAlpha = markCoverage + a * (1 - markCoverage);

        if (outAlpha > 0) {
          r = (mark.r * markCoverage + r * a * (1 - markCoverage)) / outAlpha;
          g = (mark.g * markCoverage + g * a * (1 - markCoverage)) / outAlpha;
          b = (mark.b * markCoverage + b * a * (1 - markCoverage)) / outAlpha;
        }

        a = outAlpha;
      }

      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(r);
      pixels[offset + 1] = Math.round(g);
      pixels[offset + 2] = Math.round(b);
      pixels[offset + 3] = Math.round(a * 255);
    }
  }

  return pixels;
};

// ---------------------------------------------------------------------------
// Fayllarni yozish
// ---------------------------------------------------------------------------

/**
 * Yaratiladigan fayllar ro'yxati.
 *
 * - icon: ilova ikonkasi (ko'k fon + oq belgi)
 * - adaptive-icon: Android uchun faqat belgi (fonni tizim o'zi qo'yadi,
 *   shuning uchun belgi kichikroq - chekkalari kesilib ketmasin)
 * - splash: ilova ochilayotgandagi ekran (fon app.json dan olinadi)
 * - favicon: brauzer uchun kichik ikonka
 */
const CONFIG = [
  // iOS burchaklarni o'zi yumaloqlaydi va shaffoflikni qo'llab-quvvatlamaydi,
  // shuning uchun asosiy ikonka - to'liq to'q kvadrat.
  { file: 'icon.png', size: 1024, background: BRAND, mark: WHITE, markScale: 0.68, radius: 0 },
  // Android foni tizim tomonidan qo'yiladi. Belgi kichikroq: tashqi
  // qismi qirqilib ketmasligi uchun markazdagi xavfsiz zonada turadi.
  { file: 'adaptive-icon.png', size: 1024, background: null, mark: WHITE, markScale: 0.5 },
  { file: 'splash.png', size: 512, background: null, mark: WHITE, markScale: 0.75 },
  { file: 'favicon.png', size: 64, background: BRAND, mark: WHITE, markScale: 0.7, radius: 0.15 },
];

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

for (const item of CONFIG) {
  const pixels = drawIcon(item);
  const png = encodePng(item.size, pixels);
  const target = path.join(assetsDir, item.file);

  fs.writeFileSync(target, png);
  console.log(`${item.file.padEnd(20)} ${item.size}x${item.size}  ${png.length} bayt`);
}

console.log('\nIkonkalar yaratildi.');
