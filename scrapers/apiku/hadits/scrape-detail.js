#!/usr/bin/env node
'use strict';

/**
 * Name : Detail Hadits
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil kitab, bab, dan terjemahan satu hadits berdasarkan imam dan nomor.
 * Note : node scrapers/apiku/hadits/scrape-detail.js --imam bukhari --number 1
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/hadits/{imam}/{number}';
const { scrape: haditsDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: {
    imam: { required: true, choices: ['bukhari', 'muslim', 'tirmidzi', 'abudaud', 'nasai', 'ibnumajah', 'ahmad', 'malik', 'darimi'] },
    number: { required: true, min: 1, max: 50000 }
  },
  validateData: (data, { imam, number }) => data?.imam === imam && data.number === number && hasText(data.terjemahan)
});

module.exports = { haditsDetail };
if (require.main === module) cli();
