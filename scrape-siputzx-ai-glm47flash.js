#!/usr/bin/env node
'use strict';

/**
 * Name : GLM 4.7 Flash
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Meminta jawaban teks dari model GLM 4.7 Flash.
 * Note : node scrape-siputzx-ai-glm47flash.js --prompt "Jelaskan apa itu RSS."
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/glm47flash';
const { scrape: aiGlm47Flash, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: {
    prompt: { required: true, maxLength: 2000 }, system: { maxLength: 1000 },
    temperature: { type: 'number', min: 0, max: 2 }
  },
  validateData: (data) => typeof data?.response === 'string' && Boolean(data.response.trim())
});

module.exports = { aiGlm47Flash };
if (require.main === module) cli();
