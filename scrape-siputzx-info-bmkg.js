#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa BMKG
 * Creator : lmavour
 * Source : https://app.siputzx.my.id/playground
 * Base Web : https://api.siputzx.my.id
 * Type : Scraper
 * Description : Mengambil data gempa terbaru, terkini, dan dirasakan dari BMKG melalui Siputzx.
 * Note : node scrape-siputzx-info-bmkg.js
 */

const { jsonEndpoint } = require('./scraper-utils');
const ENDPOINT = 'https://api.siputzx.my.id/api/info/bmkg';
const { scrape: infoBmkg, cli } = jsonEndpoint(ENDPOINT, { source: 'siputzx', interval: 1300 });

module.exports = { infoBmkg };
if (require.main === module) cli();
