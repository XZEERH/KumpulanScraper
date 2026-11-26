#!/usr/bin/env node
'use strict';

/**
 * Name : Meta AI
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengirim pertanyaan ke Meta AI dan mengembalikan jawaban teks.
 * Note : node scrapers/siputzx/ai/scrape-metaai.js --query "Berapa 2 + 2?"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/metaai';
const { scrape: aiMetaAI, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: { query: { required: true, maxLength: 2000 } },
  validateData: (data) => typeof data === 'string' && Boolean(data.trim())
});

module.exports = { aiMetaAI };
if (require.main === module) cli();
