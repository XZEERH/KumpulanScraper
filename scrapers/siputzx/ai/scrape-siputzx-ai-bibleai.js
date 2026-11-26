#!/usr/bin/env node
'use strict';

/**
 * Name : Bible AI
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Menanyakan isi Alkitab dan mengembalikan jawaban serta rujukan yang tersedia.
 * Note : node scrapers/siputzx/ai/scrape-siputzx-ai-bibleai.js --question "Where is the parable of the mustard seed?" --translation ESV
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/ai/bibleai';
const { scrape: aiBibleAI, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1500, timeout: 40000, cache: false,
  params: {
    question: { required: true, maxLength: 2000 },
    translation: { choices: [
      'IRVBen', 'CUV', 'nld1939', 'NBG', 'ESV', 'NASB20', 'ASV14', 'KJV11', 'LSG', 'LUT', 'IRVHin',
      'PaBa', 'TB', 'DB1885', 'NR06', 'polUBG', 'AA', 'RVR09', 'SKB', 'SV1917', 'KJV', 'IRVUrd', 'DGV', 'ERVVI'
    ] }
  },
  validateData: (data) => typeof data?.results?.answer === 'string' && Boolean(data.results.answer.trim())
});

module.exports = { aiBibleAI };
if (require.main === module) cli();
