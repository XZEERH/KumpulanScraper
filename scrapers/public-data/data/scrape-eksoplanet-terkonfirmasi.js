#!/usr/bin/env node
'use strict';

/**
 * Name : Eksoplanet Terkonfirmasi NASA
 * Creator : lmavour
 * Source : https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html
 * Base Web : https://exoplanetarchive.ipac.caltech.edu
 * Type : Scraper
 * Description : Tampilkan delapan eksoplanet yang baru tercatat menurut tahun penemuan, berikut bintang induk, periode orbit dalam hari, dan radius dalam satuan Bumi.
 * Note : node scrapers/public-data/data/scrape-eksoplanet-terkonfirmasi.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=SELECT%20TOP%208%20pl_name%2Chostname%2Cdisc_year%2Cpl_orbper%2Cpl_rade%20FROM%20pscomppars%20WHERE%20pl_orbper%20%3E%200%20AND%20pl_rade%20%3E%200%20ORDER%20BY%20disc_year%20DESC%2C%20pl_name';
const { scrape: eksoplanetTerkonfirmasi, cli } = jsonEndpoint(ENDPOINT, {
  source: 'nasa-exoplanets', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload) ? payload : null
});

module.exports = { eksoplanetTerkonfirmasi };
if (require.main === module) cli();
