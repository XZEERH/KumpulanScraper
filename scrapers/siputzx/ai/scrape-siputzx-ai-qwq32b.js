#!/usr/bin/env node
'use strict';

/**
 * Name : QwQ 32B
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Meminta jawaban teks dari model QwQ 32B.
 * Note : node scrapers/siputzx/ai/scrape-siputzx-ai-qwq32b.js --prompt "Halo, siapa kamu?" --temperature 0.7
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/qwq32b';
const { scrape: aiQwq32b, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: {
    prompt: { required: true, maxLength: 2000 }, system: { maxLength: 1000 },
    temperature: { type: 'number', min: 0, max: 2 }
  },
  validateData: (data) => typeof data?.response === 'string' && Boolean(data.response.trim())
});

module.exports = { aiQwq32b };
if (require.main === module) cli();
