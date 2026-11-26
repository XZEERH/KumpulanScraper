#!/usr/bin/env node
'use strict';

/**
 * Name : xkcd Comic
 * Source : https://xkcd.com/json.html
 * Base Web : https://xkcd.com
 * Type : Scraper
 * Description : Membaca metadata komik xkcd terbaru atau berdasarkan nomor.
 * Note : node scrapers/kangwifi/info/scrape-xkcd.js --id 614
 */

const { request, integer, hasText, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const BASE = 'https://xkcd.com';
const SOURCE = 'xkcd';

async function xkcd(options = {}) {
  try {
    const id = options.id === undefined ? null : integer(options.id, NaN, 1, 1000000, 'Nomor komik');
    const payload = await request(`${BASE}${id === null ? '' : `/${id}`}/info.0.json`, {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: id === null ? 300000 : 3600000, redirect: 'error'
    });
    const image = httpsUrl(payload?.img, ['imgs.xkcd.com']);
    if (!Number.isSafeInteger(payload?.num) || (id !== null && payload.num !== id) || !hasText(payload.title) || !image) {
      throw new Error('Respons komik xkcd tidak valid');
    }
    return { status: true, source: SOURCE, attribution: 'xkcd - https://xkcd.com/license.html', data: {
      id: payload.num, title: payload.title, alt: payload.alt ?? null, image: image.href, url: `${BASE}/${payload.num}/`
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { xkcd };
if (require.main === module) runOptionsCLI(SOURCE, '[--id 614]', xkcd, ['id']);
