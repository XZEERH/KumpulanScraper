#!/usr/bin/env node
'use strict';

/**
 * Name : Pencocokan Taksonomi Tanaman GBIF
 * Creator : lmavour
 * Source : https://techdocs.gbif.org/en/openapi/v1/species#/Searching%20names/matchNames
 * Base Web : https://api.gbif.org
 * Type : Scraper
 * Description : Lihat nama ilmiah baku dan klasifikasi untuk pilihan tanaman umum dari GBIF. Tidak memuat rekaman lokasi.
 * Note : node scrapers/public-data/search/scrape-taksonomi-tanaman.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.gbif.org/v2/species/match?kingdom=Plantae&strict=true';
const { scrape: taksonomiTanaman, cli } = jsonEndpoint(ENDPOINT, {
  source: 'gbif', interval: 1500,
  params: {
    scientificName: { required: true, choices: ['Bellis perennis', 'Helianthus annuus', 'Taraxacum officinale', 'Zea mays', 'Quercus robur', 'Acer platanoides'] }
  },
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['classification']) ? payload : null
});

module.exports = { taksonomiTanaman };
if (require.main === module) cli();
