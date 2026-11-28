#!/usr/bin/env node
'use strict';

/**
 * Name : Aksara Jawa ke Latin
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengubah teks aksara Jawa Unicode menjadi huruf Latin.
 * Note : node scrapers/apiku/aksara/scrape-jawa-to-latin.js --text <aksara-Jawa>
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/aksara/jawa-to-latin';
const { scrape: jawaToLatin, cli } = apikuEndpoint(ENDPOINT, {
  params: { text: { required: true, maxLength: 500, pattern: /[\uA980-\uA9DF]/u } },
  mapData: ({ output }, { text }) => ({ input: text, output }),
  validateData: (data) => hasText(data.output) && /[a-z]/i.test(data.output)
});

module.exports = { jawaToLatin };
if (require.main === module) cli();
