#!/usr/bin/env node
'use strict';

/**
 * Name : Metadata Stasiun Pesisir NOAA
 * Creator : lmavour
 * Source : https://api.tidesandcurrents.noaa.gov/mdapi/prod
 * Base Web : https://api.tidesandcurrents.noaa.gov
 * Type : Scraper
 * Description : Cari nama, koordinat, dan karakteristik stasiun NOAA CO-OPS berdasarkan ID publiknya.
 * Note : node scrapers/public-data/search/scrape-stasiun-pasang-surut.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/{station}.json';
const { scrape: stasiunPasangSurut, cli } = jsonEndpoint(ENDPOINT, {
  source: 'noaa-coops', interval: 1500,
  params: {
    station: { required: true, maxLength: 10, pattern: new RegExp('^(?!\\.{1,2}$)(?:^[A-Za-z0-9]{4,10}$)') }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['stations']) ? payload : null
});

module.exports = { stasiunPasangSurut };
if (require.main === module) cli();
