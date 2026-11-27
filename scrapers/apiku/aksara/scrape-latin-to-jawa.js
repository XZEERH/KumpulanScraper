#!/usr/bin/env node
'use strict';

/**
 * Name : Latin ke Aksara Jawa
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengubah teks Latin menjadi aksara Jawa, dengan pilihan penggunaan Murda.
 * Note : node scrapers/apiku/aksara/scrape-latin-to-jawa.js --text "Sugeng enjing" --murda false
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/aksara/latin-to-jawa';
const { scrape: latinToJawa, cli } = apikuEndpoint(ENDPOINT, {
  params: { text: { required: true, maxLength: 500, pattern: /[a-z]/i }, murda: { choices: ['false', 'true'] } },
  mapData: ({ output }, { text }) => ({ input: text, output }),
  validateData: (data) => hasText(data.output) && /[\uA980-\uA9DF]/u.test(data.output)
});

module.exports = { latinToJawa };
if (require.main === module) cli();
