#!/usr/bin/env node
'use strict';

/**
 * Name : Penerjemah Teks
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menerjemahkan teks dengan pilihan bahasa asal dan tujuan.
 * Note : node scrapers/siputzx/tools/scrape-translate.js --text "Good morning" --source en --target id
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/tools/translate';
const { scrape: toolsTranslate, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1300,
  params: { text: { required: true }, source: { maxLength: 20 }, target: { maxLength: 20 } }
});

module.exports = { toolsTranslate };
if (require.main === module) cli();
