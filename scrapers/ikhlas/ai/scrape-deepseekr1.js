#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek R1
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Model penalaran tingkat tinggi DeepSeek R1 32B, sangat piawai dalam penalaran analitis, pembuktian matematis, debugging kode rumit, dan sintesis ilmiah.
 * Note : node scrapers/ikhlas/ai/scrape-deepseekr1.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/deepseekr1';
const { scrape: ikhlasAiDeepseekr1, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    prompt: { required: true },
    system: {},
    temperature: {}
  }
});

module.exports = { ikhlasAiDeepseekr1 };
if (require.main === module) cli();
