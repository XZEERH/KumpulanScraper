#!/usr/bin/env node
'use strict';

/**
 * Name : Lokasi Kode Pos
 * Creator : lmavour
 * Source : https://docs.zippopotam.us/docs/v1
 * Base Web : https://api.zippopotam.us
 * Type : Scraper
 * Description : Cocokkan kode pos dengan kota, wilayah, dan titik pusat perkiraan di negara yang didukung. Data GeoNames melalui Zippopotam.us.
 * Note : node scrapers/public-data/search/scrape-lokasi-kode-pos.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.zippopotam.us/{country}/{postalcode}';
const { scrape: lokasiKodePos, cli } = jsonEndpoint(ENDPOINT, {
  source: 'zippopotam', interval: 1500,
  params: {
    country: { required: true, maxLength: 2, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z]{2}$)') },
    postalcode: { required: true, maxLength: 12, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9][A-Za-z0-9 -]{0,11}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['places']) ? payload : null
});

module.exports = { lokasiKodePos };
if (require.main === module) cli();
