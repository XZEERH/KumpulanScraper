#!/usr/bin/env node
'use strict';

/**
 * Name : Bible AI
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Eksplorasi ayat, tafsir, dan penjelasan tematik seputar Alkitab dalam puluhan bahasa dan versi terjemahan resmi.
 * Note : node scrapers/ikhlas/ai/scrape-bibleai.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/bibleai';
const { scrape: ikhlasAiBibleai, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    question: { required: true },
    translation: { choices: ['IRVBen', 'CUV', 'nld1939', 'NBG', 'ESV', 'NASB20', 'ASV14', 'KJV11', 'LSG', 'LUT', 'IRVHin', 'PaBa', 'TB', 'DB1885', 'NR06', 'polUBG', 'AA', 'RVR09', 'SKB', 'SV1917', 'KJV', 'IRVUrd', 'DGV', 'ERVVI'] }
  }
});

module.exports = { ikhlasAiBibleai };
if (require.main === module) cli();
