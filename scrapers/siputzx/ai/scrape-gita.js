#!/usr/bin/env node
'use strict';

/**
 * Name : Gita AI
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menanyakan topik seputar Bhagavad Gita dan mengembalikan jawaban teks.
 * Note : node scrapers/siputzx/ai/scrape-gita.js --q "What is the Bhagavad Gita?"
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/gita';
const { scrape: aiGita, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: { q: { required: true, maxLength: 2000 } },
  validateData: (data) => typeof data === 'string' && Boolean(data.trim())
});

module.exports = { aiGita };
if (require.main === module) cli();
