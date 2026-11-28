'use strict';

const { openAsBlob } = require('node:fs');
const { basename, extname } = require('node:path');
const { failure, hasText, request, runOptionsCLI } = require('./scraper-utils');

const FILE_TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.heic': 'image/heic', '.heif': 'image/heif', '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
  '.opus': 'audio/opus', '.aac': 'audio/aac', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.pdf': 'application/pdf', '.zip': 'application/zip', '.txt': 'text/plain'
};

function httpEndpoint(url, { source, headers, methods = ['GET'], params = {}, fileParam, disabled = false }) {
  const endpoint = new URL(url).pathname.replace(/^\/(?:api\/)?/, '');
  const parameters = Object.entries(params);

  async function scrape(options = {}) {
    try {
      if (disabled) throw new Error('Endpoint ini dinonaktifkan oleh penyedia');
      if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('Parameter endpoint harus berupa objek');
      }
      const { timeout, maxBytes, cache, method: requestedMethod, ...values } = options;
      for (const [name, { aliases = [] }] of parameters) {
        for (const alias of aliases) {
          if (Object.hasOwn(params, alias) || !Object.hasOwn(values, alias)) continue;
          if (!Object.hasOwn(values, name)) values[name] = values[alias];
          delete values[alias];
        }
      }

      const file = fileParam ? values[fileParam] : undefined;
      const method = String(requestedMethod ?? (file == null ? methods[0] : 'POST')).toUpperCase();
      if (!methods.includes(method)) throw new Error(`Metode harus salah satu: ${methods.join(', ')}`);
      const target = new URL(url);
      let formData;
      if (file != null) {
        if (method !== 'POST' || !(file instanceof Blob)) {
          throw new Error(`Unggahan ${fileParam} harus berupa Blob atau File dan memakai POST`);
        }
        formData = new FormData();
        formData.append(fileParam, file);
        delete values[fileParam];
      }
      const fields = formData ?? (method === 'GET' ? target.searchParams : undefined);
      if (fields) {
        for (const [name, input] of Object.entries(values)) {
          for (const value of [].concat(input)) {
            if (value != null) fields.append(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        }
      }

      const { buffer, contentType } = await request(target.href, {
        timeout, maxBytes,
        format: 'binary', cache: false, redirect: 'error',
        headers: { Accept: '*/*', ...headers?.(url) },
        ...(formData ? { formData } : method === 'POST' ? { jsonBody: values } : {})
      });
      let data;
      if (contentType === 'application/json' || contentType?.endsWith('+json')) {
        try { data = JSON.parse(buffer.toString('utf8')); }
        catch { throw new Error('Layanan tidak mengembalikan JSON yang valid'); }
      } else if (contentType?.startsWith('text/')) {
        data = buffer.toString('utf8');
      } else {
        data = { mimeType: contentType ?? 'application/octet-stream', base64: buffer.toString('base64') };
      }
      return { status: true, source, endpoint, data };
    } catch (error) { return failure(source, error); }
  }

  function cli() {
    const flags = ['method', 'params', 'maxBytes'];
    const help = parameters.map(([name, { required, aliases = [] }]) => {
      flags.push(name, ...aliases);
      const flag = `--${name} <${name === fileParam ? 'path' : 'nilai'}>`;
      return required ? flag : `[${flag}]`;
    });
    if (methods.length > 1) help.push(`[--method ${methods.join('|')}]`);
    help.push('[--params <JSON>]', '[--maxBytes <byte>]');
    return runOptionsCLI(source, help.join(' '), async ({ _, params: json, ...options }) => {
      let values = {};
      if (json !== undefined) {
        try { values = JSON.parse(json); }
        catch { throw new Error('--params harus berupa objek JSON'); }
        if (!values || typeof values !== 'object' || Array.isArray(values)) {
          throw new Error('--params harus berupa objek JSON');
        }
      }
      if (fileParam && options[fileParam] !== undefined) {
        const path = options[fileParam];
        if (!hasText(path)) throw new Error(`--${fileParam} harus berupa path file`);
        const type = FILE_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
        options[fileParam] = new File([await openAsBlob(path, { type })], basename(path), { type });
      }
      return scrape({ ...values, ...options });
    }, flags, `${endpoint} (${methods.join(', ')})`);
  }

  return { scrape, cli };
}

module.exports = { httpEndpoint };
