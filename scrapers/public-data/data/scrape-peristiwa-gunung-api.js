#!/usr/bin/env node
'use strict';

/**
 * Name : Peristiwa Gunung Api NASA
 * Creator : lmavour
 * Source : https://eonet.gsfc.nasa.gov/docs/v3
 * Base Web : https://eonet.gsfc.nasa.gov
 * Type : Scraper
 * Description : Telusuri hingga lima peristiwa vulkanik dari NASA EONET. Bukan pengganti peringatan resmi setempat.
 * Note : node scrapers/public-data/data/scrape-peristiwa-gunung-api.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=all&limit=5';
const { scrape: peristiwaGunungApi, cli } = jsonEndpoint(ENDPOINT, {
  source: 'nasa-eonet', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['events']) ? payload : null
});

module.exports = { peristiwaGunungApi };
if (require.main === module) cli();
