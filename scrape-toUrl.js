/**
 * Name : catbox to url
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://catbox(.)moe
 * Type : Scraper/JSON
 *Method : GET/POST
 * Description : Mengunggah gambar, video, audio, dokumen, atau file apa pun yang diizinkan ke Catbox dan mengembalikan URL langsung.
 * Note : catbox + userhash untuk penyimpanan permanen. Btw Error fix sendiri
 **/

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE_URL = 'https://catbox.moe';
const UPLOAD_URL = `${BASE_URL}/user/api.php`;
const REGISTER_URL = `${BASE_URL}/user/register.php`;
const MAX_BYTES = 200 * 1024 * 1024;
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const BLOCKED_EXTENSIONS = ['.exe', '.scr', '.cpl', '.jar'];

const HTTP_STATUS = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export const ENGINE = Object.freeze({
  provider: 'catbox.moe',
  name: 'Catbox API',
  endpoint: UPLOAD_URL,
  method: 'POST',
  contentType: 'multipart/form-data',
  fileField: 'fileToUpload',
  userhashField: 'userhash',
  maxBytes: MAX_BYTES,
  blockedExtensions: ['.exe', '.scr', '.cpl', '.doc*', '.jar'],
  retention: {
    anonymous: 'No fixed expiry; removed after 2 years of inactivity',
    userhash: 'Permanent',
  },
});

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.apk': 'application/vnd.android.package-archive',
  '.exe': 'application/vnd.microsoft.portable-executable',
};

const EXT_BY_MIME = Object.entries(MIME_BY_EXT).reduce((map, [ext, mime]) => {
  if (!map[mime]) map[mime] = ext;
  return map;
}, {});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scraperError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const sniffMime = (buffer) => {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  const ascii = buffer.subarray(0, 12).toString('latin1');
  if (ascii.startsWith('GIF87a') || ascii.startsWith('GIF89a')) return 'image/gif';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'image/webp';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE') return 'audio/wav';
  if (ascii.startsWith('%PDF-')) return 'application/pdf';
  if (ascii.startsWith('ID3')) return 'audio/mpeg';
  if (ascii.startsWith('OggS')) return 'audio/ogg';
  if (ascii.startsWith('fLaC')) return 'audio/flac';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('latin1') === 'ftyp') {
    return ascii.slice(8, 12).includes('qt') ? 'video/quicktime' : 'video/mp4';
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'video/webm';
  }
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) return 'application/zip';
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  return null;
};

const cleanFilename = (name, mime) => {
  const raw = String(name || '').replace(/\0/g, '').replace(/\\/g, '/');
  const base = path.posix.basename(raw).trim();
  if (base && base !== '.' && base !== '..') return base;
  return `upload${EXT_BY_MIME[mime] || '.bin'}`;
};

const blockedExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) return null;
  if (ext.startsWith('.doc')) return '.doc*';
  return BLOCKED_EXTENSIONS.includes(ext) ? ext : null;
};

const resolveMime = (buffer, filename, explicitMime) => {
  if (explicitMime) return explicitMime;
  const detected = sniffMime(buffer);
  if (detected) return detected;
  return MIME_BY_EXT[path.extname(filename).toLowerCase()] || 'application/octet-stream';
};

const fromBuffer = (input, options = {}) => {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (!buffer.length) throw scraperError('File is empty', 400);
  if (buffer.length > MAX_BYTES) {
    throw scraperError(`File is too large; max ${formatBytes(MAX_BYTES)}`, 413);
  }
  const providedName = String(options.filename || '').trim();
  const mime = resolveMime(buffer, providedName, options.mime);
  const filename = providedName
    ? cleanFilename(providedName, mime)
    : `upload${EXT_BY_MIME[mime] || '.bin'}`;
  const blocked = blockedExtension(filename);
  if (blocked) {
    throw scraperError(`Catbox blocks ${blocked} files; convert to PDF or zip the file first`, 415);
  }
  return { buffer, filename, mime };
};

const fromBase64 = (input, options = {}) => {
  if (typeof input !== 'string') throw scraperError('Base64 input must be a string', 400);
  let source = input.trim();
  let dataMime = null;
  const dataUri = source.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,([\s\S]+)$/i);
  if (dataUri) {
    dataMime = dataUri[1] || null;
    source = dataUri[2];
  }
  source = source.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!source || !/^[A-Za-z0-9+/]*={0,2}$/.test(source)) {
    throw scraperError('Invalid base64 input', 400);
  }
  const buffer = Buffer.from(source, 'base64');
  if (!buffer.length) throw scraperError('Base64 input is empty', 400);
  const mime = options.mime || dataMime;
  const ext = mime ? EXT_BY_MIME[mime] : null;
  return fromBuffer(buffer, {
    ...options,
    mime,
    filename: options.filename || (ext ? `upload${ext}` : undefined),
  });
};

const fromPath = async (filePath, options = {}) => {
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    throw scraperError(`File not found: ${filePath}`, 400);
  }
  if (!stat.isFile()) throw scraperError(`Not a file: ${filePath}`, 400);
  if (!stat.size) throw scraperError(`File is empty: ${filePath}`, 400);
  if (stat.size > MAX_BYTES) {
    throw scraperError(`File is too large; max ${formatBytes(MAX_BYTES)}`, 413);
  }
  const buffer = await fs.readFile(filePath);
  return fromBuffer(buffer, {
    ...options,
    filename: options.filename || path.basename(filePath),
  });
};

const loadInput = async (input, options = {}) => {
  if (options.base64) return fromBase64(input, options);
  if (Buffer.isBuffer(input)) return fromBuffer(input, options);
  if (input && typeof input === 'object') {
    if (input.base64) return fromBase64(input.base64, { ...options, ...input, base64: false });
    if (input.buffer) return fromBuffer(input.buffer, { ...options, ...input });
    if (input.path) return fromPath(input.path, { ...options, ...input });
    throw scraperError('Input object must contain path, buffer, or base64', 400);
  }
  if (typeof input === 'string') {
    if (input.startsWith('data:')) return fromBase64(input, options);
    return fromPath(input, options);
  }
  throw scraperError('Input must be a file path, Buffer, or base64 string', 400);
};

const request = async (url, init = {}, retries = 1) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'user-agent': USER_AGENT,
          'accept-language': 'en-US,en;q=0.9',
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(120000),
      });
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        lastError = scraperError(`HTTP ${response.status}`, response.status);
        await delay(1000 * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) throw error;
      await delay(1000 * (attempt + 1));
    }
  }
  throw lastError;
};

const resolveUserhash = (value) => {
  const userhash = String(value ?? process.env.CATBOX_USERHASH ?? '').trim();
  if (!userhash) return '';
  if (!/^[a-f0-9]{64}$/i.test(userhash)) {
    throw scraperError('userhash must be a 64-character hex string', 400);
  }
  return userhash;
};

const uploadFile = async (file, userhash) => {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([file.buffer], { type: file.mime }), file.filename);
  if (userhash) form.append('userhash', userhash);

  const response = await request(UPLOAD_URL, {
    method: 'POST',
    headers: {
      accept: 'text/plain, text/html;q=0.9, */*;q=0.8',
      origin: BASE_URL,
      referer: `${BASE_URL}/`,
    },
    body: form,
  });

  const text = await response.text();
  const message = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const directUrl = text.match(/https:\/\/files\.catbox\.moe\/[^\s"'<>]+/)?.[0] || null;

  if (!response.ok || !directUrl) {
    if (/too large/i.test(message)) throw scraperError(`Upload failed: ${message}`, 413);
    if (/not allowed|blocked/i.test(message)) throw scraperError(`Upload failed: ${message}`, 415);
    if (/not signed in|invalid userhash|userhash|account/i.test(message)) {
      throw scraperError(`Upload failed: ${message}; check CATBOX_USERHASH or --userhash`, 401);
    }
    throw scraperError(`Upload failed: ${message || `HTTP ${response.status}`}`, response.status >= 400 ? response.status : 502);
  }

  return {
    status: response.status,
    directUrl,
  };
};

export async function toUrl(input, options = {}) {
  try {
    const userhash = resolveUserhash(options.userhash);
    const file = await loadInput(input, options);
    const upload = await uploadFile(file, userhash);

    const data = {
      engine: ENGINE,
      file: {
        name: file.filename,
        mime: file.mime,
        size: file.buffer.length,
        sizeText: formatBytes(file.buffer.length),
      },
      directUrl: upload.directUrl,
      retention: userhash ? ENGINE.retention.userhash : ENGINE.retention.anonymous,
      expiresIn: userhash ? null : ENGINE.retention.anonymous,
      expiresAt: null,
      uploadStatus: upload.status,
    };

    return [
      {
        status: 200,
        response: HTTP_STATUS[200],
      },
      {
        data: [data],
      },
    ];
  } catch (error) {
    const status = error?.name === 'TimeoutError' ? 504 : Number(error?.status) || 500;
    const response = HTTP_STATUS[status] || 'Error';
    return [
      {
        status,
        response,
        error: `ERROR ${status} ${response}: ${error?.message || 'Unknown error'}`,
      },
      {
        data: [],
      },
    ];
  }
}

const USAGE = `Usage:
  node scrape-toUrl.js <file> [--userhash <hash>] [--out result.json]
  node scrape-toUrl.js --base64 <base64|data-uri> [--name tes.png] [--mime image/png]

Options:
  --userhash <hash>  Catbox account userhash for permanent retention
  --out <file>       JSON output path (default: result.json)
  --name <file>      Filename for base64 input
  --mime <type>      MIME type override
  --base64           Decode input as base64 or data URI
  -h, --help         Show this help

Environment:
  CATBOX_USERHASH    Default Catbox userhash

Anonymous uploads have no fixed expiry but are removed after 2 years of inactivity.
Register and get a userhash: ${REGISTER_URL}`;

const parseArgs = (argv) => {
  const options = {
    input: null,
    out: 'result.json',
    base64: false,
    filename: null,
    mime: null,
    userhash: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') options.help = true;
    else if (arg === '--base64') options.base64 = true;
    else if (arg.startsWith('--base64=')) {
      options.base64 = true;
      options.input = arg.slice('--base64='.length);
    } else if (arg === '--userhash') options.userhash = argv[++index];
    else if (arg === '--out') options.out = argv[++index];
    else if (arg === '--name') options.filename = argv[++index];
    else if (arg === '--mime') options.mime = argv[++index];
    else if (arg.startsWith('--userhash=')) options.userhash = arg.slice('--userhash='.length);
    else if (arg.startsWith('--out=')) options.out = arg.slice('--out='.length);
    else if (arg.startsWith('--name=')) options.filename = arg.slice('--name='.length);
    else if (arg.startsWith('--mime=')) options.mime = arg.slice('--mime='.length);
    else if (!options.input) options.input = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const main = async () => {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  if (args.help || !args.input) {
    console.log(USAGE);
    process.exitCode = args.help ? 0 : 1;
    return;
  }

  const result = await toUrl(args.input, args);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  await fs.writeFile(path.resolve(args.out), output, 'utf8');
  process.stdout.write(output);
  if (result[0].status >= 400) process.exitCode = 1;
};

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) await main();

export default toUrl;
