#!/usr/bin/env node
'use strict';

/**
 * Name : QwQ 32B
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Arsitektur penalaran mendalam berbasis QwQ 32B yang dilatih khusus untuk memecahkan soal matematika, logika deduktif, dan rekayasa perangkat lunak rumit.
 * Note : node scrapers/ikhlas/ai/scrape-qwq32b.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/qwq32b';
const { scrape: ikhlasAiQwq32b, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    prompt: { required: true },
    system: {},
    temperature: {}
  }
});

module.exports = { ikhlasAiQwq32b };
if (require.main === module) cli();
