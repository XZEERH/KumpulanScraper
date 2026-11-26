#!/usr/bin/env node
'use strict';

/**
 * Name : npm Registry
 * Base Web : https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md
 * Description : Cari package, metadata versi terbaru, dan jumlah download tanpa API key.
 * Note : Hanya membaca metadata; tidak menginstal atau menjalankan package target.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'npm';
const USAGE = 'Usage: node scrapers/integrations/scrape-npm.js <search|package|downloads> "target" [--limit 10] [--page 1] [--period last-week]';

async function npmScraper(target, options = {}) {
  try {
    target = text(target, 'Target');
    const mode = choice(options.mode, 'search', ['search', 'package', 'downloads']);
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const page = integer(options.page, 1, 1, 1000, 'Halaman');
    if (mode !== 'search' && !/^(?:@[a-z\d._-]+\/)?[a-z\d._-]+$/i.test(target)) throw new Error('Nama package tidak valid');
    const period = choice(options.period, 'last-week', ['last-day', 'last-week', 'last-month'], 'Periode');
    const url = mode === 'search' ? urlWithParams('https://registry.npmjs.org/-/v1/search', { text: target, size: limit, from: (page - 1) * limit })
      : mode === 'package' ? `https://registry.npmjs.org/${encodeURIComponent(target)}/latest`
        : `https://api.npmjs.org/downloads/point/${period}/${encodeURIComponent(target)}`;
    const payload = await request(url, { ...options, interval: 500, cacheTtl: 300000 });
    if (!payload || payload.error) throw new Error(payload?.error || 'Respons npm tidak valid');
    if (mode === 'downloads') {
      if (!Number.isFinite(payload.downloads)) throw new Error('Data download npm tidak valid');
      return { status: true, source: SOURCE, mode, package: target, period, downloads: payload.downloads, start: payload.start, end: payload.end };
    }
    if (mode === 'package') {
      if (!payload.name || !payload.version) throw new Error('Metadata package npm tidak valid');
      return {
        status: true, source: SOURCE, mode,
        package: { name: payload.name, version: payload.version, description: payload.description || null,
          license: payload.license || null, homepage: payload.homepage || null,
          repository: payload.repository || null, dependencies: payload.dependencies || {},
          url: `https://www.npmjs.com/package/${payload.name}` }
      };
    }
    if (!Array.isArray(payload.objects)) throw new Error('Struktur pencarian npm berubah');
    const results = payload.objects.slice(0, limit).map(({ package: item }) => ({
      name: item.name, version: item.version, description: item.description || null,
      url: item.links?.npm || `https://www.npmjs.com/package/${item.name}`,
      repository: item.links?.repository || null, publishedAt: item.date || null
    }));
    return { status: true, source: SOURCE, mode, query: target, page, available: payload.total, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { npmScraper };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => npmScraper(args._.slice(1).join(' '), { ...args, mode: args._[0] }), ['page', 'period']);
