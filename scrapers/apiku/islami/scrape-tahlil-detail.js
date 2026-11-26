#!/usr/bin/env node
'use strict';

/**
 * Name : Detail Bacaan Tahlil
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil satu butir bacaan tahlil beserta transliterasi dan terjemahan.
 * Note : node scrapers/apiku/islami/scrape-tahlil-detail.js --number 1
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/tahlil/{number}';
const { scrape: tahlilDetail, cli } = apikuEndpoint(ENDPOINT, {
  params: { number: { required: true, min: 1, max: 56 } },
  validateData: (data, { number }) => data?.verse?.number === number && hasText(data.verse.arabic)
});

module.exports = { tahlilDetail };
if (require.main === module) cli();
