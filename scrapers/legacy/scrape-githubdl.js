/**
 * Name : Github Downloader
 * Creator : Razeerh
 * Source : https://whatsapp.com/channel/0029vbCN4sQLo4hhDCk0HX1m
 * Base Web : https://github.com/
 * Type : Scraper
 * Description : Singkat saja untuk mengunduh seluruh source code project dari repository GitHub menjadi file ZIP secara otomatis. Lu pada cukup memasukkan target URL repository, lalu nanti sistem mengambil source project, mengemas atau mengunduh arsip ZIP, dan menyimpannya atau mengirimkannya langsung ke kalian, cocok untuk tambah fitur downloader di bot. Btw Sistem ini menggunakan metode pengunduhan repository, harusnya lu pada udah tau ya
 * Note : error fix sendiri
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TIMEOUT_INFO = 20000;
const TIMEOUT_STREAM_START = 60000;
const STREAM_IDLE_TIMEOUT = 120000;
const API = 'https://api.github.com';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function baseHeaders() {
  return {
    'User-Agent': UA,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  };
}

function parseRepoFromInput(input) {
  if (!input || typeof input !== 'string') return null;
  let raw = input.trim().replace(/\.git$/i, '');
  if (!raw) return null;
  if (/^git@github\.com:/i.test(raw)) raw = 'github.com/' + raw.replace(/^git@github\.com:/i, '');
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    let u;
    try {
      u = new URL(raw);
    } catch (e) {
      return null;
    }
    if (!/(^|\.)github\.com$/i.test(u.hostname)) return null;
    raw = u.pathname.slice(1);
  } else {
    raw = raw.replace(/^(www\.)?github\.com\//i, '');
  }
  const seg = raw
    .split(/[\/#?]/)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return s;
      }
    })
    .filter(Boolean);
  if (seg.length < 2) return null;
  const owner = seg[0];
  const repo = seg[1].replace(/\.git$/i, '');
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
  let branch = null;
  const idx = seg.findIndex((s, i) => i >= 2 && (s === 'tree' || s === 'blob'));
  if (idx !== -1 && seg[idx + 1]) branch = seg[idx + 1];
  return { owner, repo, branch };
}

async function fetchRepoInfoAPI(owner, repo) {
  const res = await axios.get(`${API}/repos/${owner}/${repo}`, {
    headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' },
    timeout: TIMEOUT_INFO,
    validateStatus: () => true
  });
  if (res.status === 200 && res.data && res.data.full_name) {
    return {
      found: true,
      fileId: String(res.data.id),
      owner: res.data.owner ? res.data.owner.login : owner,
      name: res.data.name,
      fullName: res.data.full_name,
      defaultBranch: res.data.default_branch || 'main',
      sizeKB: res.data.size || 0,
      description: res.data.description || null,
      isPrivate: !!res.data.private,
      htmlUrl: res.data.html_url,
      stars: res.data.stargazers_count || 0,
      source: 'github-api'
    };
  }
  if (res.status === 404) return { found: false, reason: 'Repository tidak ditemukan (404). Pastikan url, nama user dan repository benar, atau repo bersifat private.' };
  if (res.status === 403 || res.status === 429) return { rateLimited: true, reason: `API GitHub ${res.status}: rate limit / akses ditolak, mencoba metode scraping HTML fallback...` };
  return { found: false, reason: `API GitHub merespons status ${res.status}` };
}

function extractBranchFromHtml(html) {
  const m = html.match(/"defaultBranch"\s*:\s*"([^"]+)"/);
  if (m && m[1]) return m[1];
  const m2 = html.match(/default[-_]branch[=\s"':]+([A-Za-z0-9._\/-]+)/i);
  return m2 ? m2[1] : null;
}

async function fetchRepoInfoHTML(owner, repo) {
  const url = `https://github.com/${owner}/${repo}`;
  const res = await axios.get(url, { headers: baseHeaders(), timeout: TIMEOUT_INFO, maxRedirects: 5, validateStatus: () => true });
  if (res.status !== 200 || !res.data) {
    return { found: false, reason: res.status === 404 ? 'Repository tidak ditemukan (404)' : `HTTPS GitHub merespons status ${res.status}` };
  }
  const html = res.data;
  if (/this is not the web page you are looking for/i.test(html) || /Page not found/i.test(html)) {
    return { found: false, reason: 'Repository tidak ditemukan (halaman 404 GitHub)' };
  }
  const $ = cheerio.load(html);
  const repId = $('meta[name="octolytics-dimension-repository_id"]').attr('content') || null;
  const nwo = $('meta[name="octolytics-dimension-repository_nwo"]').attr('content') || `${owner}/${repo}`;
  const userLogin = $('meta[name="octolytics-dimension-user_login"]').attr('content') || owner;
  const [nwoOwner, nwoName] = String(nwo).split('/');
  const title = ($('meta[property="og:title"]').attr('content') || $('title').text() || '').trim();
  const desc = ($('meta[name="description"]').attr('content') || '').trim() || null;
  const branch = extractBranchFromHtml(html);
  const isFork = $('meta[name="octolytics-dimension-repository_is_fork"]').attr('content') === 'true';
  const isPrivate = $('meta[name="octolytics-dimension-repository_public"]').attr('content') === 'false';
  if (!nwoName) return { found: false, reason: 'Struktur halaman GitHub berubah, data tidak ditemukan' };
  return {
    found: true,
    fileId: repId,
    owner: nwoOwner || userLogin,
    name: nwoName,
    fullName: nwo,
    defaultBranch: branch || 'main',
    sizeKB: null,
    description: desc,
    isPrivate,
    htmlUrl: `https://github.com/${nwo}`,
    stars: null,
    title,
    source: 'html-scrape'
  };
}

function humanSize(bytes) {
  if (bytes == null || isNaN(bytes)) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n < 10 && n % 1 !== 0 ? n.toFixed(2) : Math.round(n)} ${units[i]}`;
}

function parseContentDisposition(filenameFromHeader) {
  if (!filenameFromHeader) return null;
  const tryExtract = h => {
    let m = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(h);
    if (m) return decodeURIComponent(m[1].replace(/["']/g, '').trim());
    m = /filename="?([^";]+)"?/i.exec(h);
    return m ? m[1].trim() : null;
  };
  return tryExtract(filenameFromHeader);
}

async function downloadZip(zipUrl, outDir, suggestedName) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const res = await axios.get(zipUrl, {
    responseType: 'stream',
    headers: { 'User-Agent': UA, Accept: 'application/zip' },
    timeout: TIMEOUT_STREAM_START,
    maxRedirects: 5,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  const headerName = parseContentDisposition(res.headers['content-disposition']);
  const fileName = headerName || suggestedName || 'repo.zip';
  const tmpFile = path.join(outDir, fileName + '.part');
  const finalFile = path.join(outDir, fileName);
  const stream = res.data;
  let bytes = 0;
  let lastData = Date.now();
  stream.on('data', (c) => { bytes += c.length; lastData = Date.now(); });
  const idle = setInterval(() => {
    if (Date.now() - lastData > STREAM_IDLE_TIMEOUT) {
      const err = new Error(`Stream terhenti lebih dari ${STREAM_IDLE_TIMEOUT / 1000}s`);
      err.code = 'STREAM_IDLE';
      stream.destroy(err);
    }
  }, 10000);
  const ws = fs.createWriteStream(tmpFile);
  stream.pipe(ws);
  try {
    await new Promise((resolve, reject) => {
      ws.on('finish', resolve);
      ws.on('error', (e) => { stream.destroy(); reject(e); });
      stream.on('error', (e) => { ws.destroy(); reject(e); });
    });
  } finally {
    clearInterval(idle);
  }
  if (!bytes || bytes < 512) {
    fs.rm(tmpFile, { force: true }, () => {});
    return { fileName, bytes, ok: false, path: null, error: 'Arsip ZIP kosong atau tidak valid' };
  }
  fs.rmSync(finalFile, { force: true });
  fs.renameSync(tmpFile, finalFile);
  return { fileName, bytes, ok: true, path: finalFile, error: null };
}

async function fetchTree(owner, repo, branch) {
  try {
    const res = await axios.get(`${API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
      headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' },
      timeout: TIMEOUT_INFO,
      validateStatus: () => true
    });
    if (res.status === 200 && res.data && Array.isArray(res.data.tree)) {
      const items = res.data.tree
        .filter((t) => t.path)
        .map((t) => ({ path: t.path, type: t.type === 'tree' ? 'folder' : 'file', size: t.size != null ? t.size : null }));
      const files = items.filter((t) => t.type === 'file');
      const folders = items.filter((t) => t.type === 'folder');
      return {
        totalFiles: files.length,
        totalFolders: folders.length,
        totalBytes: files.reduce((a, f) => a + (f.size || 0), 0),
        truncated: !!res.data.truncated,
        list: items
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function githubDownloader(url, opts = {}) {
  const result = {
    status: true,
    message: 'Berhasil',
    owner: null,
    repo: null,
    branch: null,
    repoUrl: null,
    zipUrl: null,
    fileName: null,
    fileId: null,
    fileSize: null,
    fileSizeBytes: null,
    filePath: null,
    fileStream: null,
    isPrivate: null,
    description: null,
    structure: null,
    error: null
  };
  const parsed = parseRepoFromInput(url);
  if (!parsed) {
    result.status = false;
    result.message = 'Gagal: URL GitHub tidak valid';
    result.error = 'URL tidak valid. Contoh: https://github.com/XZEERH/KumpulanScraper atau XZEERH/KumpulanScraper';
    return result;
  }
  const { owner, repo, branch: branchFromUrl } = parsed;
  result.owner = owner;
  result.repo = repo;
  result.repoUrl = `https://github.com/${owner}/${repo}`;

  let info = { found: false, reason: 'Belum dikirim' };
  try {
    info = await fetchRepoInfoAPI(owner, repo);
  } catch (e) {
    info = { rateLimited: false, reason: `Request API gagal: ${e.message}` };
  }
  if (!info.found) {
    try {
      const htmlInfo = await fetchRepoInfoHTML(owner, repo);
      if (htmlInfo.found) info = htmlInfo;
      else info.reason = info.reason ? info.reason + ' | ' + htmlInfo.reason : htmlInfo.reason;
    } catch (e) {
      info.reason = info.reason ? info.reason + ` | HTML: ${e.message}` : e.message;
    }
  }
  if (!info.found) {
    result.status = false;
    result.message = 'Gagal mengambil data repository';
    result.error = info.reason;
    return result;
  }

  const branch = branchFromUrl || info.defaultBranch;
  result.branch = branch;
  result.fileId = info.fileId;
  result.isPrivate = info.isPrivate;
  result.description = info.description;
  if (info.sizeKB != null) result.repoSizeKB = info.sizeKB;

  result.zipUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`;

  const opt = { outDir: opts.outDir || path.join(process.cwd(), 'downloads'), save: opts.save !== false };
  const safeBranchForName = String(branch || 'main').replace(/[\/\\]/g, '-');
  const fileBase = `${repo}-${safeBranchForName}.zip`;

  if (opt.save) {
    let dl;
    try {
      dl = await downloadZip(result.zipUrl, opt.outDir, fileBase);
    } catch (e) {
      result.status = false;
      result.message = 'Gagal mengunduh arsip ZIP';
      result.error = e.response
        ? `HTTP ${e.response.status} saat mengunduh ZIP`
        : e.code === 'STREAM_IDLE'
          ? e.message
          : e.message;
      return result;
    }
    if (!dl.ok) {
      result.status = false;
      result.message = 'Unduhan tidak valid';
      result.error = dl.error;
      return result;
    }
    result.fileName = dl.fileName;
    result.fileSizeBytes = dl.bytes;
    result.fileSize = humanSize(dl.bytes);
    result.filePath = dl.path;
    result.fileStream = () => fs.createReadStream(dl.path);
  } else {
    result.fileName = fileBase;
    result.filePath = path.join(opt.outDir, fileBase);
    result.fileSizeBytes = null;
    result.fileSize = null;
  }

  const tree = await fetchTree(owner, repo, branch);
  if (tree) {
    result.structure = {
      totalFiles: tree.totalFiles,
      totalFolders: tree.totalFolders,
      sourceSizeBytes: tree.totalBytes,
      sourceSize: humanSize(tree.totalBytes),
      truncated: tree.truncated,
      list: tree.list
    };
  } else {
    result.structure = { note: 'Struktur folder tidak dapat diambil (kemungkinan rate limit API GitHub)', list: [] };
  }

  return result;
}

function printResult(res, opts = {}) {
  const out = { ...res };
  if (typeof out.fileStream === 'function') out.fileStream = `fs.createReadStream('${res.filePath}')`;
  if (opts.line) {
    const SEP = '='.repeat(48);
    console.log(SEP);
    console.log('Username Pemilik repo : ' + (res.owner || '-'));
    console.log('Nama Repo            : ' + (res.repo || '-'));
    console.log('Branch               : ' + (res.branch || '-'));
    console.log('fileSize / ukuran    : ' + (res.fileSize ? `${res.fileSize} (${res.fileSizeBytes} bytes)` : '-'));
    console.log('fileId / id file     : ' + (res.fileId || '-'));
    console.log('URL repo             : ' + (res.repoUrl || '-'));
    console.log('fileStream           : ' + (res.filePath ? `fs.createReadStream('${res.filePath}')` : '-'));
    console.log('Status               : ' + (res.status ? 'OK' : 'GAGAL'));
    console.log('Pesan                : ' + (res.message || '-'));
    if (res.error) console.log('Error                : ' + res.error);
    console.log(SEP);
    console.log('JSON:');
  }
  console.log(JSON.stringify(out, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const flags = { out: null, noSave: false };
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) { flags.out = args[i + 1]; i++; }
    else if (args[i] === '--no-save') flags.noSave = true;
    else rest.push(args[i]);
  }
  const target = rest[0];
  if (!target) {
    console.log('Cara pakai: node scrape-githubdl.js <url-repo-github> [--out DIR] [--no-save]');
    console.log('Contoh    : node scrape-githubdl.js https://github.com/XZEERH/KumpulanScraper');
    process.exit(1);
  }
  try {
    const res = await githubDownloader(target, { outDir: flags.out, save: !flags.noSave });
    printResult(res, { line: true });
    process.exit(res.status ? 0 : 1);
  } catch (e) {
    console.error('Unexpected error:', e && e.message);
    process.exit(1);
  }
}

module.exports = { githubDownloader, printResult, humanSize, parseRepoFromInput };

if (require.main === module) main();
