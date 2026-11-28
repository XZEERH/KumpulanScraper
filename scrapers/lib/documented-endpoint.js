'use strict';

const { isIP } = require('node:net');
const { failure, hasText, httpsUrl, imageData, request, runOptionsCLI, text, urlWithParams } = require('./scraper-utils');

const ORIGINS = {
  ikhlas: 'https://ikhlasapi.web.id',
  azbry: 'https://api.azbry.com',
  prexzy: 'https://prexzyapis.com'
};
const ERROR_TEXT = /^(?:error|failed|gagal|invalid (?:request|input|url)|unauthori[sz]ed|forbidden|access denied|not found|service unavailable|too many requests)\b/i;

function publicUrl(value) {
  const url = httpsUrl(value);
  const host = url?.hostname.replace(/\.$/, '');
  return host && host.includes('.') && !isIP(host) && !/\.(?:localhost|local|localdomain|internal|invalid|test|home|lan|onion)$/i.test(host) ? url : null;
}

function failedPayload(payload) {
  const status = payload?.status ?? payload?.statusCode;
  return payload?.success === false || payload?.ok === false || !!payload?.error ||
    /^(?:false|error|failed|failure|fail|[45]\d\d)$/i.test(String(status).trim()) ||
    (typeof payload?.message === 'string' && ERROR_TEXT.test(payload.message.trim()));
}

function documentedEndpoint(url, { source, params = {}, format = 'json', field } = {}) {
  const target = publicUrl(url);
  if (!target || target.origin !== ORIGINS[source] || target.search || target.hash || !['json', 'image', 'text'].includes(format)) {
    throw new Error('Endpoint publik tidak valid');
  }
  const endpoint = target.pathname.slice(1);
  const parameters = Object.entries(params);

  async function scrape(options = {}) {
    try {
      const query = {};
      for (const [name, rule] of parameters) {
        const input = options[name];
        if (input === undefined && !rule.required) continue;
        const scalar = typeof input === 'boolean' || (typeof input === 'number' && Number.isFinite(input)) ? String(input) : input;
        const value = text(scalar, name, rule.url ? 2000 : 4000);
        if (rule.choices && !rule.choices.includes(value)) throw new Error(`${name} harus salah satu: ${rule.choices.join(', ')}`);
        if (rule.url) {
          const link = publicUrl(value);
          if (!link) throw new Error(`${name} harus berupa URL HTTPS publik`);
          link.hash = '';
          query[name] = link.href;
        } else query[name] = value;
      }

      const payload = await request(urlWithParams(target, query), {
        timeout: options.timeout, maxBytes: options.maxBytes, interval: 2500, cache: false,
        format: format === 'json' ? 'json' : 'binary', redirect: 'error', headers: { Accept: '*/*' }
      });
      let data = null;
      if (format === 'image') data = imageData(payload);
      else if (format === 'text' && payload.contentType === 'text/plain') data = payload.buffer.toString('utf8');
      else if (format === 'json' && !failedPayload(payload)) {
        data = field ? payload?.[field] : payload;
        if (failedPayload(data)) data = null;
      }
      if (data == null || data === false ||
          (typeof data === 'string' && (!hasText(data) || ERROR_TEXT.test(data.trim()) || /^\s*<(?:!doctype|html)\b/i.test(data)))) {
        throw new Error('Layanan tidak mengembalikan data yang valid');
      }
      return { status: true, source, endpoint, data };
    } catch (error) { return failure(source, error); }
  }

  function cli() {
    const flags = parameters.map(([name, rule]) => {
      const label = rule.choices?.join('|') ?? (rule.url ? 'URL HTTPS publik' : 'nilai');
      const flag = `--${name} <${label}>`;
      return rule.required ? flag : `[${flag}]`;
    });
    return runOptionsCLI(source, [...flags, '[--maxBytes <byte>]'].join(' '), scrape,
      [...parameters.map(([name]) => name), 'maxBytes'], endpoint);
  }

  return { scrape, cli };
}

module.exports = { documentedEndpoint };
