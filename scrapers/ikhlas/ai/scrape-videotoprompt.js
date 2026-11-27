#!/usr/bin/env node
'use strict';

/**
 * Name : Video to Prompt
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Menganalisis video (via URL YouTube atau file) untuk menghasilkan deskripsi teks mendetail yang dapat digunakan sebagai prompt AI.
 * Note : node scrapers/ikhlas/ai/scrape-videotoprompt.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/videotoprompt';
const { scrape: ikhlasAiVideotoprompt, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    input: { required: true, url: true },
    instructions: {},
    multiScene: {}
  }
});

module.exports = { ikhlasAiVideotoprompt };
if (require.main === module) cli();
