#!/usr/bin/env node
'use strict';

/**
 * Name : GPT OSS 120B
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Meminta jawaban teks dari model GPT OSS 120B.
 * Note : node scrapers/siputzx/ai/scrape-gptoss120b.js --prompt "Apa itu JavaScript?"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/gptoss120b';
const { scrape: aiGptOss120b, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: {
    prompt: { required: true, maxLength: 2000 }, system: { maxLength: 1000 },
    temperature: { type: 'number', min: 0, max: 2 }
  },
  validateData: (data) => typeof data?.response === 'string' && Boolean(data.response.trim())
});

module.exports = { aiGptOss120b };
if (require.main === module) cli();
