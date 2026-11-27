#!/usr/bin/env node
'use strict';

/**
 * Name : Phi-2
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Model ringkas berkemampuan luar biasa dari Microsoft, sangat cocok untuk tugas penalaran dasar, kalkulasi matematis sederhana, dan ringkasan teks.
 * Note : node scrapers/ikhlas/ai/scrape-phi2.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/phi2';
const { scrape: ikhlasAiPhi2, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    prompt: { required: true },
    system: {},
    temperature: {}
  }
});

module.exports = { ikhlasAiPhi2 };
if (require.main === module) cli();
