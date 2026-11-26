#!/usr/bin/env node
'use strict';

/**
 * Name : Phi-2
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengirim pertanyaan ke Phi-2 dan memvalidasi jawaban teks.
 * Note : node scrapers/siputzx/ai/scrape-siputzx-ai-phi2.js --prompt "Berapa 2 + 2? Jawab singkat." --temperature 0.7
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/phi2';
const { scrape: aiPhi2, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 45000, cache: false,
  params: {
    prompt: { required: true, maxLength: 2000 }, system: { maxLength: 1000 },
    temperature: { type: 'number', min: 0, max: 2 }
  },
  validateData: (data) => hasText(data?.response)
});

module.exports = { aiPhi2 };
if (require.main === module) cli();
