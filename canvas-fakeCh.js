/**
 * Name : Canvas fake channel WhatsApp versi android
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : -
 * Type : Canvas
 * Description : Canvas fake channel lah intinya. 
 * Note : nama|jumlah pengikut|deskripsi|tanggal pembuatan (tanggal/bulan/tahun)|jumlah pengunjung insight|jumlah pengikut bersih inshigt ,  kyk gitu perintah nya ya. GK sesuai? wajar pemula, tinggal sesuaikan sendiri aja
 **/

#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const W = 760;
const H = 1600;
const FONT = 'Roboto, "Noto Sans", "Open Sans", "DejaVu Sans", Arial, sans-serif';
const COLOR = {
  bg: '#090a0c',
  name: '#ffffff',
  text: '#e9edef',
  muted: '#a4a8ac',
  green: '#25d366',
};
const TEMPLATE_NAMES = ['canvasChannel.jpg', 'channelWhatsApp.jpg'];
const REQUEST_TIMEOUT = 15000;

function parseArgs(argv) {
  let fields;

  if (argv.length === 1 && argv[0].includes('|')) {
    fields = argv[0].split('|');
  } else if (argv.length >= 7) {
    // Format argumen terpisah: "file", "nama", "pengikut", ... (koma di luar tanda kutip)
    fields = argv.slice(0, 7).map((v) => v.replace(/,\s*$/, ''));
  } else {
    throw new Error(
      'Format: "foto|nama|pengikut|deskripsi|dd-mm-yyyy|akun_dijangkau|pengikut_bersih"'
    );
  }

  fields = fields.map((v) => String(v).trim());
  if (fields.length < 7) {
    throw new Error('Data kurang. Butuh 7 bagian: foto, nama, pengikut, deskripsi, tanggal, dijangkau, bersih.');
  }

  const [profile, name, followers, description, created, reached, clean] = fields;
  if (!profile) throw new Error('Path/nama foto profil kosong.');
  if (!name) throw new Error('Nama channel kosong.');

  return {
    profile,
    name,
    followers: toNumber(followers, 'jumlah pengikut'),
    description,
    created: parseDate(created),
    reached: toNumber(reached, 'akun dijangkau'),
    clean: toNumber(clean, 'pengikut bersih'),
  };
}

function toNumber(value, label) {
  const n = parseInt(String(value).replace(/[.,\s]/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Nilai ${label} tidak valid: "${value}"`);
  return n;
}

function parseDate(value) {
  const raw = String(value).trim();
  let day, month, year;

  // ISO: 2026-08-20
  let m = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) {
    year = m[1];
    month = m[2];
    day = m[3];
  } else {
    // Indonesia: 20-8-2026, 20/08/26, 20.08.2026
    m = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) throw new Error(`Tanggal tidak valid: "${value}". Contoh: 20-8-2026 atau 08/8/26`);
    day = m[1];
    month = m[2];
    year = m[3];
  }

  const fullYear = year.length === 2 ? 2000 + Number(year) : Number(year);
  const d = Number(day);
  const mo = Number(month);
  const check = new Date(Date.UTC(fullYear, mo - 1, d));

  if (
    check.getUTCFullYear() !== fullYear ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d
  ) {
    throw new Error(`Tanggal tidak ada di kalender: "${value}"`);
  }

  return {
    day: String(d).padStart(2, '0'),
    month: String(mo).padStart(2, '0'),
    year: String(fullYear).slice(-2),
  };
}

function formatCount(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatShort(n) {
  const unit = (value, suffix) => {
    const rounded = Math.round(value * 10) / 10;
    return String(rounded).replace('.', ',') + suffix;
  };

  if (n >= 1e9) return unit(n / 1e9, 'M');
  if (n >= 1e6) {
    const value = Math.round(n / 1e5) / 10;
    return value >= 1000 ? unit(n / 1e9, 'M') : unit(n / 1e6, 'Jt');
  }
  if (n >= 1e3) {
    const value = Math.round(n / 1e2) / 10;
    return value >= 1000 ? unit(n / 1e6, 'Jt') : unit(n / 1e3, 'Rb');
  }
  return String(n);
}

function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) {
    out = out.slice(0, -1).trimEnd();
  }
  return out + '…';
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  return lines.map((line) =>
    ctx.measureText(line).width > maxWidth ? ellipsize(ctx, line, maxWidth) : line
  );
}

function fillBg(ctx, x, y, w, h) {
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(x, y, w, h);
}

function drawCover(ctx, image, cx, cy, radius) {
  const size = radius * 2;
  const scale = Math.max(size / image.width, size / image.height);
  const w = image.width * scale;
  const h = image.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

function findTemplate() {
  for (const name of TEMPLATE_NAMES) {
    const file = path.join(__dirname, name);
    if (fs.existsSync(file)) return file;
  }
  throw new Error(`Template tidak ditemukan. Letakkan salah satu: ${TEMPLATE_NAMES.join(' / ')}`);
}

async function loadProfile(source, baseDir) {
  if (Buffer.isBuffer(source)) return loadImage(source);

  if (/^https?:\/\//i.test(source)) {
    let res;
    try {
      res = await fetch(source, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) });
    } catch (err) {
      const reason = err.name === 'TimeoutError'
        ? `timeout ${REQUEST_TIMEOUT / 1000} detik`
        : err.message;
      throw new Error(`Gagal mengambil foto profil: ${reason}`);
    }
    if (!res.ok) throw new Error(`Gagal mengambil foto profil: HTTP ${res.status}`);
    return loadImage(Buffer.from(await res.arrayBuffer()));
  }

  let file = path.isAbsolute(source) ? source : path.resolve(baseDir, source);
  if (!fs.existsSync(file) && !path.isAbsolute(source)) {
    file = path.resolve(__dirname, source);
  }
  if (!fs.existsSync(file)) throw new Error(`Foto profil tidak ditemukan: ${file}`);
  return loadImage(file);
}

async function renderChannel(options) {
  const {
    profile,
    name,
    followers = 0,
    description = '',
    created,
    reached = 0,
    clean = 0,
  } = options;

  if (!profile) throw new Error('Foto profil wajib diisi.');
  if (!name) throw new Error('Nama channel wajib diisi.');
  if (!created) throw new Error('Tanggal dibuat wajib diisi.');

  const followerCount = Number(followers);
  const reachedCount = Number(reached);
  const cleanCount = Number(clean);
  if (![followerCount, reachedCount, cleanCount].every((n) => Number.isFinite(n) && n >= 0)) {
    throw new Error('Jumlah pengikut/dijangkau/bersih harus berupa angka.');
  }

  const date = typeof created === 'string' ? parseDate(created) : created;
  const template = await loadImage(findTemplate());
  const profileImage = await loadProfile(profile, process.cwd());

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0, W, H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // 1. Foto profil (menutup bulatan placeholder)
  drawCover(ctx, profileImage, 380, 202, 126.5);

  // 2. Nama dan jumlah pengikut
  fillBg(ctx, 30, 338, 700, 100);

  let nameSize = 46;
  ctx.font = `600 ${nameSize}px ${FONT}`;
  while (nameSize > 28 && ctx.measureText(String(name)).width > 650) {
    nameSize -= 1;
    ctx.font = `600 ${nameSize}px ${FONT}`;
  }
  const nameText = ellipsize(ctx, String(name), 650);
  ctx.fillStyle = COLOR.name;
  ctx.textAlign = 'center';
  ctx.fillText(nameText, 380, 381);

  let followerSize = 30;
  const followerText = `Saluran · ${formatCount(followerCount)} pengikut`;
  ctx.font = `400 ${followerSize}px ${FONT}`;
  while (followerSize > 22 && ctx.measureText(followerText).width > 660) {
    followerSize -= 1;
    ctx.font = `400 ${followerSize}px ${FONT}`;
  }
  ctx.fillStyle = COLOR.muted;
  ctx.fillText(followerText, 380, 423);

  // 3. Deskripsi dan tanggal dibuat
  fillBg(ctx, 30, 642, 700, 132);
  ctx.textAlign = 'left';

  const descriptionText = String(description || '').replace(/\s+/g, ' ').trim();
  let descLines = [];
  let truncated = false;

  if (descriptionText) {
    ctx.font = `400 30px ${FONT}`;
    const allLines = wrapText(ctx, descriptionText, 688);
    truncated = allLines.length > 2;
    descLines = truncated ? allLines.slice(0, 2) : allLines;
  }

  const descBaselines = descLines.length === 2 ? [670, 704] : [704];
  let readMore = '';

  if (truncated && descLines.length) {
    const link = 'Baca selengkapnya';
    const tail = '… ';
    let last = descLines[1];

    while (last && ctx.measureText(`${last} ${tail}${link}`).width > 688) {
      last = last.replace(/\s+\S+$/, '');
    }

    descLines[1] = last;
    readMore = tail + link;
  }

  ctx.fillStyle = COLOR.text;
  descLines.forEach((line, i) => {
    ctx.fillText(line, 36, descBaselines[i]);
  });

  if (readMore) {
    const last = descLines[1];
    ctx.fillStyle = COLOR.green;
    ctx.fillText(readMore, 36 + (last ? ctx.measureText(`${last} `).width : 0), 704);
  }

  ctx.font = `400 30px ${FONT}`;
  ctx.fillStyle = COLOR.muted;
  ctx.fillText(`Dibuat pada ${date.day}/${date.month}/${date.year}`, 37, 752);

  // 4. Insight: akun dijangkau dan pengikut bersih
  fillBg(ctx, 58, 938, 292, 48);
  fillBg(ctx, 414, 938, 302, 48);

  ctx.font = `400 32px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(formatShort(reachedCount), 68, 973);
  ctx.fillText(formatShort(cleanCount), 424, 973);

  return canvas.encode('jpeg', 92);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'output';
}

async function main() {
  const data = parseArgs(process.argv.slice(2));
  const buffer = await renderChannel(data);
  const output = path.resolve(process.cwd(), `channel-${slugify(data.name)}.jpg`);

  fs.writeFileSync(output, buffer);
  console.log(`Canvas tersimpan: ${output}`);
}

module.exports = { renderChannel };

if (require.main === module) {
  main().catch((err) => {
    console.error(`Gagal membuat canvas: ${err.message}`);
    process.exit(1);
  });
}
