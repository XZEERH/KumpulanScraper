#!/usr/bin/env node
'use strict';

/**
 * Name : Cuaca BMKG via Siputzx
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mencari wilayah Indonesia dan mengambil prakiraan cuaca bersumber dari BMKG.
 * Note : node scrapers/siputzx/info/scrape-cuaca.js --q "pasiran jaya"
 */

const { jsonEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/info/cuaca';
const { scrape: infoCuaca, cli } = jsonEndpoint(ENDPOINT, {
  source: 'siputzx', interval: 1650, timeout: 35000, params: { q: { required: true } },
  validateData: (data) => hasText(data?.wilayah?.kode) && Array.isArray(data.weather) && data.weather.some((item) =>
    Array.isArray(item?.cuaca) && item.cuaca.some((period) => Array.isArray(period) && period.length > 0))
});

module.exports = { infoCuaca };
if (require.main === module) cli();
