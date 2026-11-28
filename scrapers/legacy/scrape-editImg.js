/**
 * Name : scrape-editimg
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps : https://unwatermark(.)ai/
 * Type : Scraper/JSON
 * Method : GET/POST
 * Description : Hanya mengambil data AI foto editor (edit image)
 * Note: Klien API Unwatermark.ai AI Photo Editor (tunggal + fusi) yang direkayasa ulang dengan katalog model, masukan base64/file/URL, metode masukan GET/POST, rotasi kuota request menggunakan proxy cadangan publik disertakan. Saran gw klo ada proxy sendiri Gantikan dengan milik kamu sendiri, soalnya ini proxy publik siapa tahu proxy udah habis/diblokir. Btw Error fix sendiri
 **/

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';

const SITE = 'https://unwatermark.ai';
const API_BASE = 'https://api.unwatermark.ai/api';
const PRODUCT_CODE = '067003';
const ENGINE = 'unwatermark.ai AI Photo Editor';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const DEFAULT_SINGLE_PROMPT = 'Remove original background, replace with beautiful sunset beach with palm trees, seamless compositing, clean edges, professional';
const DEFAULT_FUSION_PROMPT = 'Merge all people from uploaded images into one natural group photo, consistent lighting and perspective, seamless composition, professional photography';
const MAX_PROMPT_LENGTH = 1000;
const RATIOS = ['match_input_image', '1:1', '3:2', '2:3', '9:16', '16:9', '3:4', '4:3'];

const BUILTIN_PROXIES = [
  'http://103.237.102.191:11111',
  'http://20.98.234.24:8080',
  'http://180.180.217.53:80',
  'http://43.242.241.47:8080',
  'http://103.46.186.126:8080',
  'http://174.75.34.109:80'
];

const HTTP_STATUS = {
  200: 'OK',
  301: 'Moved Permanently',
  302: 'Found',
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

class CliError extends Error {
  constructor(message) {
    super(message);
    this.httpStatus = 400;
  }
}

const CODES = {
  SUCCESS: 100000,
  CREATED: 300000,
  PROCESSING: 300006,
  FAILED: 300008,
  NO_FREE: 300017,
  SUSPENDED: 400000,
  LIMIT: 400101,
  TIMEOUT: 400201,
  NOT_FOUND: 400202,
  PARAM: 400301,
  LOGIN_LIMIT: 200008
};

const ROTATE_CODES = new Set([CODES.NO_FREE, CODES.LIMIT, CODES.LOGIN_LIMIT]);

function statusForCode(code, fallback = 400) {
  if (code === CODES.NO_FREE || code === CODES.LIMIT || code === CODES.LOGIN_LIMIT) return 429;
  if (code === CODES.SUSPENDED) return 403;
  if (code === CODES.NOT_FOUND) return 404;
  if (code === CODES.TIMEOUT) return 504;
  if (code === CODES.FAILED) return 502;
  return fallback;
}

const MODELS = {
  flux_kontext: {
    id: 'flux_kontext',
    name: 'Flux Kontext',
    credits: 1,
    free: true,
    fusion: false,
    available: true,
    create: '/web/v1/photo-editor-flux-kontext/create-job',
    get: '/web/v1/photo-editor-flux-kontext/get-job'
  },
  nano_banana: {
    id: 'nano_banana',
    name: 'Nano Banana',
    credits: 5,
    free: true,
    fusion: true,
    available: true,
    create: '/web/v1/photo-editor-nano-banana/create-job',
    get: '/web/v1/photo-editor-nano-banana/get-job'
  },
  seedream: {
    id: 'seedream',
    name: 'Seedream',
    credits: 3,
    free: false,
    fusion: true,
    available: true,
    create: '/web/v1/photo-editor-seedream/create-job',
    get: '/web/v1/photo-editor-seedream/get-job'
  },
  flux_2_pro: {
    id: 'flux_2_pro',
    name: 'Flux 2 Pro',
    credits: 5,
    free: false,
    fusion: true,
    available: true,
    create: '/web/v1/photo-editor-flux-2-pro/create-job',
    get: '/web/v1/photo-editor-flux-2-pro/get-job'
  },
  nano_banana_pro: {
    id: 'nano_banana_pro',
    name: 'Nano Banana Pro',
    credits: 20,
    free: false,
    fusion: true,
    available: true,
    create: '/web/v1/photo-editor-nano-banana-pro/create-job',
    get: '/web/v1/photo-editor-nano-banana-pro/get-job'
  },
  p_image_edit: {
    id: 'p_image_edit',
    name: 'P Image Edit',
    credits: null,
    free: false,
    fusion: false,
    available: false,
    reason: 'The current model has been temporarily suspended',
    create: '/web/v1/photo-editor-p-image-edit/create-job',
    get: '/web/v1/photo-editor-p-image-edit/get-job'
  }
};

const EXT_BY_TYPE = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp'
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ProxyAgent extends https.Agent {
  constructor(proxy) {
    super({ keepAlive: false });
    this.proxy = new URL(proxy);
  }

  createConnection(options, callback) {
    const proxy = this.proxy;
    const host = options.host || options.hostname;
    const port = options.port || 443;
    const transport = proxy.protocol === 'https:' ? https : http;
    const headers = { host: `${host}:${port}` };
    if (proxy.username) {
      const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
      headers['proxy-authorization'] = `Basic ${Buffer.from(auth).toString('base64')}`;
    }
    const req = transport.request({
      host: proxy.hostname,
      port: proxy.port || (proxy.protocol === 'https:' ? 443 : 80),
      method: 'CONNECT',
      path: `${host}:${port}`,
      headers,
      timeout: 20000
    });
    req.on('connect', (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        callback(new Error(`Proxy CONNECT ${res.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect({ socket, servername: host }, () => callback(null, tlsSocket));
      tlsSocket.on('error', callback);
    });
    req.on('error', callback);
    req.on('timeout', () => req.destroy(new Error('Proxy timeout')));
    req.end();
  }
}

function request(url, { method = 'GET', headers = {}, body = null, proxy = null, timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'http:' ? http : https;
    const options = {
      method,
      headers: { 'accept-encoding': 'identity', ...headers },
      timeout
    };
    if (proxy && parsed.protocol === 'https:') options.agent = new ProxyAgent(proxy);
    const req = transport.request(parsed, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

function apiHeaders(serial, token) {
  return {
    origin: SITE,
    referer: `${SITE}/`,
    'user-agent': UA,
    'Product-Serial': serial,
    'Product-Code': PRODUCT_CODE,
    ...(token ? { authorization: token } : {})
  };
}

function parseJson(buffer) {
  const text = buffer.toString('utf8').trim();
  try {
    return JSON.parse(text);
  } catch {
    return { code: null, message: text.slice(0, 300) || 'Empty response' };
  }
}

function apiMessage(json) {
  if (!json) return 'Unknown API error';
  const message = json.message;
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') return message.en || message.zh || message.id || JSON.stringify(message);
  if (json.detail) return JSON.stringify(json.detail);
  return 'Unknown API error';
}

function sniffType(buffer, name = '') {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString() === 'GIF') return 'image/gif';
  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) return 'image/bmp';
  const ext = path.extname(name).toLowerCase();
  const byExt = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
  return byExt[ext] || 'application/octet-stream';
}

function decodeBase64(value, index) {
  const match = value.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s);
  const raw = match ? match[2] : value;
  const data = Buffer.from(raw.replace(/\s+/g, ''), 'base64');
  if (!data.length) throw new CliError('Invalid base64 input');
  const type = match?.[1]?.startsWith('image/') ? match[1] : sniffType(data);
  const ext = EXT_BY_TYPE[type] || 'png';
  return { name: `input_${index}.${ext}`, type, data };
}

function buildMultipart(files, fields) {
  const boundary = `----unwatermark${crypto.randomBytes(8).toString('hex')}`;
  const chunks = [];
  for (const file of files) {
    const name = String(file.name).replace(/["\r\n]/g, '_');
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="target_images"; filename="${name}"\r\nContent-Type: ${file.type}\r\n\r\n`));
    chunks.push(file.data);
    chunks.push(Buffer.from('\r\n'));
  }
  for (const [key, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function download(url, timeout, redirects = 5) {
  const res = await request(url, { headers: { 'user-agent': UA }, timeout });
  if (res.status >= 300 && res.status < 400 && res.headers.location && redirects > 0) {
    return download(new URL(res.headers.location, url).toString(), timeout, redirects - 1);
  }
  if (res.status !== 200) {
    const error = new Error(`Download failed HTTP ${res.status}: ${url}`);
    error.httpStatus = res.status >= 400 && res.status < 500 ? res.status : 502;
    throw error;
  }
  const headerType = String(res.headers['content-type'] || '').split(';')[0].trim();
  const type = headerType.startsWith('image/') ? headerType : sniffType(res.body, url);
  return { data: res.body, type };
}

async function loadInputs(rawInputs, cli) {
  const inputs = [];
  for (let i = 0; i < rawInputs.length; i++) {
    const value = rawInputs[i];
    if (cli.base64 && !value.startsWith('@') && !value.startsWith('data:')) {
      if (/^https?:\/\//i.test(value) || fs.existsSync(value)) {
        throw new CliError('--base64 accepts base64 strings, data URIs, or @file.txt only');
      }
    }
    if (cli.base64 || value.startsWith('data:') || value.startsWith('@')) {
      let text = value;
      if (value.startsWith('@')) {
        const file = value.slice(1);
        if (!fs.existsSync(file)) throw new CliError(`Base64 file not found: ${file}`);
        text = fs.readFileSync(file, 'utf8').trim();
      }
      inputs.push(decodeBase64(text, i + 1));
      continue;
    }
    if (/^https?:\/\//i.test(value)) {
      const file = await download(value, Math.min(cli.timeout, 60000));
      const ext = EXT_BY_TYPE[file.type] || 'png';
      inputs.push({ name: `input_${i + 1}.${ext}`, type: file.type, data: file.data });
      continue;
    }
    if (fs.existsSync(value)) {
      const data = fs.readFileSync(value);
      inputs.push({ name: path.basename(value), type: sniffType(data, value), data });
      continue;
    }
    if (value.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
      inputs.push(decodeBase64(value, i + 1));
      continue;
    }
    throw new CliError(`Input not found or unsupported: ${value}`);
  }
  return inputs;
}

function normalizeModel(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();
  const id = raw.replace(/[\s-]+/g, '_');
  if (MODELS[id]) return id;
  const byName = Object.values(MODELS).find((model) => model.name.toLowerCase() === raw);
  return byName ? byName.id : null;
}

function parseArgs(argv) {
  const cli = {
    mode: null,
    model: null,
    method: 'auto',
    prompt: null,
    ratio: 'match_input_image',
    token: process.env.UNWATERMARK_TOKEN || null,
    proxies: [],
    noProxy: false,
    base64: false,
    info: false,
    help: false,
    job: null,
    timeout: 180000,
    out: 'result.json',
    inputs: []
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') {
      cli.inputs.push(...argv.slice(i + 1));
      break;
    }
    if (arg === '--single' || arg === '--multi' || arg === '--fusion') {
      cli.mode = arg === '--single' ? 'single' : 'fusion';
      continue;
    }
    if (arg === '--info' || arg === '--models') {
      cli.info = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      cli.help = true;
      continue;
    }
    if (arg === '--base64') {
      cli.base64 = true;
      continue;
    }
    if (arg === '--no-proxy') {
      cli.noProxy = true;
      continue;
    }
    if (arg === '--method') {
      cli.method = String(argv[++i] || 'auto').toLowerCase();
      continue;
    }
    if (arg === '--model') {
      cli.model = argv[++i];
      continue;
    }
    if (arg === '--prompt') {
      cli.prompt = argv[++i];
      continue;
    }
    if (arg === '--ratio') {
      cli.ratio = argv[++i];
      continue;
    }
    if (arg === '--token') {
      cli.token = argv[++i];
      continue;
    }
    if (arg === '--proxy') {
      cli.proxies.push(...String(argv[++i] || '').split(',').map((item) => item.trim()).filter(Boolean));
      continue;
    }
    if (arg === '--job') {
      cli.job = argv[++i];
      continue;
    }
    if (arg === '--timeout') {
      const value = Number(argv[++i]);
      if (Number.isFinite(value) && value > 0) cli.timeout = value * 1000;
      continue;
    }
    if (arg === '--out') {
      cli.out = argv[++i] || 'result.json';
      continue;
    }
    if (arg.startsWith('--') && arg.includes('=')) {
      const index = arg.indexOf('=');
      const key = arg.slice(2, index);
      const value = arg.slice(index + 1);
      if (key === 'single' || key === 'multi' || key === 'fusion') {
        cli.mode = key === 'single' ? 'single' : 'fusion';
      } else if (key === 'model') {
        cli.model = value;
      } else if (key === 'prompt') {
        cli.prompt = value;
      } else if (key === 'ratio') {
        cli.ratio = value;
      } else if (key === 'token') {
        cli.token = value;
      } else if (key === 'proxy') {
        cli.proxies.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
      } else if (key === 'job') {
        cli.job = value;
      } else if (key === 'timeout') {
        const seconds = Number(value);
        if (Number.isFinite(seconds) && seconds > 0) cli.timeout = seconds * 1000;
      } else if (key === 'out') {
        cli.out = value;
      } else {
        throw new CliError(`Unknown option: --${key}`);
      }
      continue;
    }
    if (arg.startsWith('-')) throw new CliError(`Unknown option: ${arg}`);
    if (arg.toLowerCase() === 'edit' && cli.mode) continue;
    if (/^data:/i.test(arg) || arg.startsWith('@')) cli.inputs.push(arg);
    else cli.inputs.push(...arg.split(',').map((item) => item.trim()).filter(Boolean));
  }
  if (!['auto', 'get', 'post'].includes(cli.method)) throw new CliError('--method must be get or post');
  return cli;
}

function buildAttempts(cli) {
  if (cli.noProxy) return [null];
  if (cli.proxies.length) return cli.proxies;
  const env = process.env.UNWATERMARK_PROXIES || process.env.PROXY_LIST;
  const fallback = env ? env.split(',').map((item) => item.trim()).filter(Boolean) : BUILTIN_PROXIES;
  return [null, ...fallback];
}

async function createJob(model, files, prompt, ratio, opts) {
  const multipart = buildMultipart(files, { prompt, ratio });
  const res = await request(API_BASE + model.create, {
    method: 'POST',
    headers: {
      ...apiHeaders(opts.serial, opts.token),
      'content-type': multipart.contentType,
      'content-length': String(multipart.body.length)
    },
    body: multipart.body,
    proxy: opts.proxy,
    timeout: opts.requestTimeout
  });
  return { status: res.status, json: parseJson(res.body) };
}

async function pollJob(model, jobId, opts) {
  const deadline = Date.now() + opts.timeout;
  const attempts = opts.attempts.length ? opts.attempts : [null];
  let index = 0;
  let lastError = null;
  while (Date.now() < deadline) {
    await delay(2000);
    const proxy = attempts[index++ % attempts.length];
    try {
      const res = await request(`${API_BASE}${model.get}/${jobId}`, {
        headers: apiHeaders(opts.serial || crypto.randomBytes(16).toString('hex'), opts.token),
        proxy,
        timeout: opts.requestTimeout
      });
      const json = parseJson(res.body);
      if (json.code === CODES.SUCCESS && json.result?.output_url?.length) {
        return { ...json.result, proxy };
      }
      if (json.code === CODES.FAILED || json.code === CODES.TIMEOUT || json.code === CODES.NOT_FOUND) {
        const error = new Error(apiMessage(json));
        error.code = json.code;
        error.httpStatus = statusForCode(json.code);
        error.jobId = jobId;
        error.result = json.result;
        throw error;
      }
      if (json.code !== CODES.PROCESSING && json.code !== CODES.SUCCESS && !ROTATE_CODES.has(json.code)) {
        const error = new Error(apiMessage(json));
        error.code = json.code;
        error.httpStatus = statusForCode(json.code);
        error.jobId = jobId;
        throw error;
      }
    } catch (error) {
      if ([CODES.FAILED, CODES.TIMEOUT, CODES.NOT_FOUND].includes(error.code)) throw error;
      lastError = error;
    }
  }
  const error = new Error(`Polling timed out after ${Math.round(opts.timeout / 1000)}s (job_id: ${jobId})`);
  error.httpStatus = 504;
  error.jobId = jobId;
  error.cause = lastError;
  throw error;
}

function successPayload(model, cli, proxy, created, job, prompt, ratio, started) {
  const outputUrls = Array.isArray(job.output_url) ? job.output_url : job.output_url ? [job.output_url] : [];
  return [
    {
      status: 200,
      response: 'OK',
      engine: ENGINE,
      api: API_BASE,
      site: SITE,
      mode: cli.mode,
      model: model.id,
      method: cli.method,
      proxy: proxy || 'direct',
      prompt,
      ratio,
      job_id: job.job_id || cli.job || null,
      elapsed_ms: Date.now() - started
    },
    {
      data: [
        {
          job_id: job.job_id || cli.job || null,
          status: job.status,
          input_url: job.input_url || null,
          output_url: outputUrls,
          credits_cost: job.credits_cost ?? created.credits_cost ?? null,
          remaining_free_times: job.remaining_free_times ?? created.remaining_free_times ?? null,
          refresh_seconds: job.refresh_seconds ?? created.refresh_seconds ?? null
        }
      ]
    }
  ];
}

function errorPayload(error, cli, extra = {}) {
  const status = error.httpStatus || 500;
  return [
    {
      status,
      response: HTTP_STATUS[status] || 'Error',
      engine: ENGINE,
      api: API_BASE,
      site: SITE,
      mode: cli.mode || null,
      model: cli.model || null,
      method: cli.method || null,
      code: error.code || null,
      error: `ERROR ${error.code || status} ${HTTP_STATUS[status] || 'Error'}: ${error.message}`,
      ...(extra.proxy ? { proxy: extra.proxy } : {}),
      ...(error.jobId ? { job_id: error.jobId } : {})
    },
    {
      data: []
    }
  ];
}

async function runEdit(model, inputs, cli) {
  const started = Date.now();
  const prompt = cli.prompt;
  const attempts = buildAttempts(cli);
  const requestTimeout = Math.min(cli.timeout, 60000);
  let lastError = null;
  let lastProxy = null;
  for (let i = 0; i < attempts.length; i++) {
    const proxy = attempts[i];
    lastProxy = proxy;
    const serial = crypto.randomBytes(16).toString('hex');
    try {
      const created = await createJob(model, inputs, prompt, cli.ratio, { ...cli, proxy, serial, requestTimeout });
      const code = created.json?.code;
      if (code === CODES.CREATED && created.json.result?.job_id) {
        const job = await pollJob(model, created.json.result.job_id, { ...cli, proxy, serial, attempts, requestTimeout });
        return successPayload(model, cli, proxy, created.json.result, job, prompt, cli.ratio, started);
      }
      if (ROTATE_CODES.has(code) || created.status === 403 || created.status === 429) {
        lastError = new Error(apiMessage(created.json));
        lastError.code = code;
        lastError.httpStatus = statusForCode(code, created.status >= 400 ? created.status : 429);
        await delay(1000);
        continue;
      }
      lastError = new Error(apiMessage(created.json));
      lastError.code = code;
      lastError.httpStatus = statusForCode(code, created.status >= 400 ? created.status : 400);
      return errorPayload(lastError, cli, { proxy });
    } catch (error) {
      if (error.jobId || [CODES.FAILED, CODES.TIMEOUT, CODES.NOT_FOUND].includes(error.code)) {
        return errorPayload(error, cli, { proxy });
      }
      lastError = error;
      await delay(1000);
    }
  }
  const error = lastError || new Error('All attempts failed');
  if (!error.httpStatus) error.httpStatus = 502;
  return errorPayload(error, cli, { proxy: lastProxy });
}

function infoPayload() {
  return [
    {
      status: 200,
      response: 'OK',
      engine: ENGINE,
      api: API_BASE,
      site: SITE,
      source: `${SITE}/ai-photo-editor`,
      sources: [`${SITE}/ai-photo-editor`, `${SITE}/nano-banana-editor`],
      note: 'Reverse-engineered from the Nuxt frontend. No browser required.'
    },
    {
      data: [
        {
          engine: ENGINE,
          api: API_BASE,
          modes: [
            {
              id: 'single',
              name: 'Single Image Edit',
              min_images: 1,
              max_images: 1,
              field: 'target_images',
              create_job: 'POST {model.create_job}',
              get_job: 'GET {model.get_job}/{job_id}'
            },
            {
              id: 'fusion',
              name: 'Multi Image Edit / Fusion',
              min_images: 2,
              max_images: 5,
              field: 'target_images',
              create_job: 'POST {model.create_job}',
              get_job: 'GET {model.get_job}/{job_id}'
            }
          ],
          upload: {
            type: 'multipart/form-data',
            field: 'target_images',
            multiple: true,
            fields: {
              prompt: {
                type: 'string',
                required: true,
                max_length: MAX_PROMPT_LENGTH,
                default_single: DEFAULT_SINGLE_PROMPT,
                default_fusion: DEFAULT_FUSION_PROMPT
              },
              ratio: RATIOS
            },
            prompt_flag: '--prompt',
            base64: 'Supported via --base64, data URI, or @file.txt',
            url_input: 'Supported via GET download before multipart upload'
          },
          models: Object.values(MODELS).map((model) => ({
            id: model.id,
            name: model.name,
            credits: model.credits,
            free_quota: model.free,
            fusion: model.fusion,
            available: model.available,
            ...(model.reason ? { reason: model.reason } : {}),
            create_job: `${API_BASE}${model.create}`,
            get_job: `${API_BASE}${model.get}/{job_id}`
          })),
          response_codes: {
            100000: 'Task completed successfully',
            300000: 'Task created successfully',
            300006: 'Task is processing',
            300008: 'Task processing failed',
            300017: 'Insufficient free usage / login or plan required',
            200008: 'Free usage limit reached (not logged in)',
            400000: 'Model temporarily suspended',
            400101: 'Usage limit reached',
            400201: 'Task timeout',
            400202: 'Task not found',
            400301: 'Parameter error'
          },
          examples: [
            'node scrape-editimg.js --info',
            'node scrape-editimg.js "https://example.com/a.jpg" --single edit --model flux_kontext',
            'node scrape-editimg.js "a.jpg" --single edit --model nano_banana --method post',
            'node scrape-editimg.js "https://example.com/a.jpg, https://example.com/b.jpg" --multi edit --model nano_banana',
            'node scrape-editimg.js "a.jpg" "b.jpg" --multi edit --model nano_banana --method post',
            'node scrape-editimg.js "data:image/png;base64,..." --single edit --model flux_kontext --base64',
            'node scrape-editimg.js "@a.b64" --single edit --model flux_kontext --base64',
            'node scrape-editimg.js "a.jpg" --single edit --model flux_kontext --prompt "replace background with a sunset beach" --method post',
            'node scrape-editimg.js "a.jpg" "b.jpg" --multi edit --model nano_banana --prompt "merge them into one group photo at the beach" --method post',
            'node scrape-editimg.js --job <job_id> --model nano_banana'
          ]
        }
      ]
    }
  ];
}

function printHelp() {
  console.log(`Usage:
  node scrape-editimg.js --info
  node scrape-editimg.js <url|file|base64> --single edit --model <model>
  node scrape-editimg.js "<url1>, <url2>" --multi edit --model <model>
  node scrape-editimg.js <file1> <file2> --multi edit --model <model> --method post
  node scrape-editimg.js <file> --single edit --model <model> --prompt "replace background with a sunset beach"

Options:
  --single | --multi       Edit mode (fusion = multi image edit)
  --model <id|name>        Model id or display name
  --method get|post        Input method (default: auto)
  --prompt <text>          Describe how to edit the photo (max 1000 chars)
  --ratio <ratio>          match_input_image | 1:1 | 3:2 | 2:3 | 9:16 | 16:9 | 3:4 | 4:3
  --base64                 Inputs are base64 strings, data URIs, or @file.txt
  --token <token>          Authorization token for paid models
  --proxy <url>            Force proxy (repeatable or comma-separated)
  --no-proxy               Disable proxy rotation
  --job <job_id>           Poll an existing job (requires --model)
  --timeout <seconds>      Request/poll timeout (default: 180)
  --out <path>             Result JSON path (default: result.json)
  --info                   Print engine, API, endpoints and all models
  --help                   Show this help

Models:
  flux_kontext (free, single) | nano_banana (free, single + fusion)
  seedream (credits) | flux_2_pro (credits) | nano_banana_pro (credits)
  p_image_edit (suspended)

Prompt:
  Default single: ${DEFAULT_SINGLE_PROMPT}
  Default fusion: ${DEFAULT_FUSION_PROMPT}
  Example: --prompt "change the background to a cyberpunk city at night"`);
}

function writeResult(payload, outPath) {
  const text = JSON.stringify(payload, null, 2);
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${text}\n`);
  console.log(text);
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  if (cli.help) {
    printHelp();
    return;
  }
  if (cli.info) {
    writeResult(infoPayload(), cli.out);
    return;
  }
  if (!cli.inputs.length && !cli.job) {
    printHelp();
    throw new CliError('No input provided');
  }
  if (!cli.mode && !cli.job) {
    cli.mode = cli.inputs.length > 1 ? 'fusion' : 'single';
  }
  if (cli.prompt !== null || !cli.job) {
    const fallback = cli.mode === 'fusion' ? DEFAULT_FUSION_PROMPT : DEFAULT_SINGLE_PROMPT;
    cli.prompt = String(cli.prompt ?? fallback).trim();
    if (!cli.prompt) throw new CliError('Prompt is required');
    if (cli.prompt.length > MAX_PROMPT_LENGTH) {
      throw new CliError(`Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`);
    }
  }

  const modelId = normalizeModel(cli.model || (cli.mode === 'fusion' ? 'nano_banana' : 'flux_kontext'));
  if (!modelId) throw new CliError(`Unknown model: ${cli.model}`);
  const model = MODELS[modelId];
  cli.model = modelId;
  if (!model.available) throw new CliError(`${model.name} is unavailable: ${model.reason}`);
  if (cli.mode === 'fusion' && !model.fusion) {
    const available = Object.values(MODELS).filter((item) => item.fusion && item.available).map((item) => item.id);
    throw new CliError(`${model.name} does not support fusion. Use: ${available.join(', ')}`);
  }
  if (!model.free && !cli.token) throw new CliError(`${model.name} requires login/credits. Pass --token.`);
  if (!RATIOS.includes(cli.ratio)) throw new CliError(`Invalid ratio. Use: ${RATIOS.join(', ')}`);

  if (cli.job) {
    const started = Date.now();
    const attempts = buildAttempts(cli);
    const serial = crypto.randomBytes(16).toString('hex');
    const job = await pollJob(model, cli.job, { ...cli, attempts, serial, requestTimeout: Math.min(cli.timeout, 60000) });
    writeResult(successPayload(model, cli, job.proxy, {}, job, cli.prompt, cli.ratio, started), cli.out);
    return;
  }

  if (cli.method === 'get' && cli.inputs.some((item) => !/^https?:\/\//i.test(item))) {
    throw new CliError('--method get requires URL inputs');
  }
  if (cli.method === 'post' && cli.inputs.some((item) => /^https?:\/\//i.test(item))) {
    throw new CliError('--method post requires local file or base64 inputs; use --method get for URLs');
  }

  const inputs = await loadInputs(cli.inputs, cli);
  if (cli.mode === 'fusion' && (inputs.length < 2 || inputs.length > 5)) {
    throw new CliError('Fusion requires 2-5 images');
  }
  if (cli.mode === 'single' && inputs.length !== 1) {
    throw new CliError('Single mode requires exactly 1 image');
  }
  const payload = await runEdit(model, inputs, cli);
  writeResult(payload, cli.out);
  if (payload[0]?.error) process.exitCode = 1;
}

main().catch((error) => {
  const cli = { mode: null, model: null, method: null, out: 'result.json' };
  try {
    Object.assign(cli, parseArgs(process.argv.slice(2)));
  } catch {}
  const payload = errorPayload(error, cli);
  try {
    writeResult(payload, cli.out);
  } catch {
    console.error(`ERROR: ${error.message}`);
  }
  process.exitCode = 1;
});
