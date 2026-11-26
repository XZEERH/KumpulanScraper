#!/usr/bin/env node
'use strict';

/**
 * Name : DeepSeek R1
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Meminta jawaban teks dari model DeepSeek R1.
 * Note : node scrape-siputzx-ai-deepseekr1.js --prompt "Berapa 2 + 2?"
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/deepseekr1';
const { scrape: aiDeepSeekR1, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: {
    prompt: { required: true, maxLength: 2000 }, system: { maxLength: 1000 },
    temperature: { type: 'number', min: 0, max: 2 }
  },
  validateData: (data) => typeof data?.response === 'string' && Boolean(data.response.trim())
});

module.exports = { aiDeepSeekR1 };
if (require.main === module) cli();
