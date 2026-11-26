#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian Kode Pos Indonesia
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari kode pos dan informasi wilayah berdasarkan nama lokasi.
 * Note : node scrapers/siputzx/tools/scrape-siputzx-tools-kodepos.js --form "pasiran jaya"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/tools/kodepos';
const { scrape: toolsKodePos, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { form: { required: true } },
  validateData: (data) => Array.isArray(data) && data.some((item) => typeof item?.kodepos === 'string' && /^\d{5}$/.test(item.kodepos))
});

module.exports = { toolsKodePos };
if (require.main === module) cli();
