#!/usr/bin/env node
'use strict';

/**
 * Name : Wikidata Entity Record
 * Creator : lmavour
 * Source : https://www.wikidata.org/wiki/Wikidata:Data_access#Linked_Data_Interface_(URI)
 * Base Web : https://www.wikidata.org
 * Type : Scraper
 * Description : Retrieve a Wikidata item by QID, including multilingual labels, statements, and sitelinks.
 * Note : node scrapers/public-data/search/scrape-wikidata-entity.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.wikidata.org/wiki/Special:EntityData/{id}.json';
const { scrape: wikidataEntity, cli } = jsonEndpoint(ENDPOINT, {
  source: 'wikidata', interval: 1500,
  params: {
    id: { required: true, maxLength: 13, pattern: new RegExp('^(?!\\.{1,2}$)(?:^Q[1-9][0-9]{0,11}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && payload?.['entities'] != null && typeof payload?.['entities'] === 'object' && !Array.isArray(payload?.['entities']) ? payload : null
});

module.exports = { wikidataEntity };
if (require.main === module) cli();
