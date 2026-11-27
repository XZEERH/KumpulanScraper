#!/usr/bin/env node
'use strict';

/**
 * Name : Terjemahan Teks
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Layanan terjemahan teks multi-bahasa instan berbasis mesin penerjemah pintar Google Translate. Mendukung deteksi bahasa asal secara otomatis.
 * Note : node scrapers/ikhlas/tools/scrape-translate.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/tools/translate';
const { scrape: ikhlasToolsTranslate, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    text: { required: true },
    source: {},
    target: {}
  }
});

module.exports = { ikhlasToolsTranslate };
if (require.main === module) cli();
