#!/usr/bin/env node
'use strict';

/**
 * Name : Cuaca
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Search info cuaca
 * Note : node scrapers/prexzy/search/scrape-cuaca.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/search/cuaca';
const { scrape: prexzySearchCuaca, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  field: 'data',
  params: {
    kota: { required: true }
  }
});

module.exports = { prexzySearchCuaca };
if (require.main === module) cli();
