'use strict';

const { isIP } = require('node:net');
const { failure, hasText, httpsUrl, imageData, request, runOptionsCLI, text, urlWithParams } = require('./scraper-utils');

const SOURCE = 'nexray';
const ORIGIN = 'https://api.nexray.eu.cc';
const SUCCESS = [true, 'true', 'ok', 'success', 200, '200'];
const ERROR_TEXT = /^(?:error|gagal|internal server error|not found|no results? (?:found|available)|tidak ada hasil|invalid (?:request|input|url)|fetch failed|service unavailable|access denied)\b/i;

function jsonResult(payload) {
  const status = payload?.status;
  if (payload?.error || payload?.success === false || (status != null && !SUCCESS.includes(status))) return null;
  const data = payload?.result;
  if (data == null || data === false || data.error || data.success === false || data.status === false) return null;
  if (typeof data === 'string' && !hasText(data)) return null;
  if ([payload?.message, data, data?.message, data?.text, data?.response, data?.answer].some(
    value => typeof value === 'string' && ERROR_TEXT.test(value.trim())
  )) return null;
  return data;
}

function nexrayEndpoint(url, { params = {}, format = 'json' } = {}) {
  const target = new URL(url);
  if (target.origin !== ORIGIN || target.username || target.password || target.search || target.hash) {
    throw new Error('Endpoint NexRay tidak valid');
  }
  const endpoint = target.pathname.slice(1);
  const parameters = Object.entries(params);

  async function scrape(options = {}) {
    try {
      const query = {};
      for (const [name, rule] of parameters) {
        const input = options[name];
        if (input === undefined && !rule.required) continue;
        const value = text(typeof input === 'number' && Number.isFinite(input) ? String(input) : input, name, rule.url ? 2000 : 4000);
        if (rule.choices && !rule.choices.includes(value)) throw new Error(`${name} harus salah satu: ${rule.choices.join(', ')}`);
        if (rule.url) {
          const link = httpsUrl(value, rule.hosts);
          const host = link?.hostname.replace(/\.$/, '');
          if (!host || !host.includes('.') || isIP(host) || /\.(?:localhost|local|localdomain|internal|invalid|test|home|lan|onion)$/i.test(host)) {
            throw new Error(`${name} harus berupa URL HTTPS publik`);
          }
          if (!rule.preserveFragment) link.hash = '';
          query[name] = link.href;
        } else query[name] = value;
      }

      const response = await request(urlWithParams(target, query), {
        timeout: options.timeout, maxBytes: options.maxBytes, interval: 3200, cache: false,
        format, redirect: 'error', headers: { Accept: '*/*' }
      });
      const data = format === 'binary' ? imageData(response) : jsonResult(response);
      if (data === null) throw new Error('NexRay tidak mengembalikan hasil yang valid');
      return { status: true, source: SOURCE, endpoint, data };
    } catch (error) { return failure(SOURCE, error); }
  }

  function cli() {
    const flags = parameters.map(([name, rule]) => {
      const label = rule.choices?.join('|') ?? (rule.url ? 'URL HTTPS publik' : 'nilai');
      const flag = `--${name} <${label}>`;
      return rule.required ? flag : `[${flag}]`;
    });
    return runOptionsCLI(SOURCE, [...flags, '[--maxBytes <byte>]'].join(' '), scrape,
      [...parameters.map(([name]) => name), 'maxBytes'], endpoint);
  }

  return { scrape, cli };
}

module.exports = { nexrayEndpoint };
