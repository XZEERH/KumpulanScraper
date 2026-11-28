#!/usr/bin/env node
'use strict';

/**
 * Name : MedSter Medicine Catalog Search
 * Creator : lmavour
 * Source : https://freeapi.pro/medster
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Mencari nama dan harga katalog obat dari penyedia, bukan saran medis.
 * Note : node scrapers/freeapi/scrape-medster-search.js --q panadol
 */

const { request, text, hasText, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/search';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-medster-search.js --q <nama obat>';

async function freeapiMedicineSearch(options = {}) {
  try {
    const query = text(options.q, 'Nama obat', 100);
    const payload = await request(urlWithParams(ENDPOINT, { q: query }), {
      timeout: options.timeout, cache: options.cache, interval: 1800, redirect: 'error'
    });
    if (payload?.success !== true || !Array.isArray(payload.results)) throw new Error('Katalog MedSter tidak valid');
    const results = payload.results.filter((item) => hasText(item?.id) && hasText(item.name))
      .map(({ id, name, price }) => ({ id, name, price: hasText(price) ? price : null }));
    if (payload.results.length && !results.length) throw new Error('Data katalog MedSter tidak valid');
    return {
      status: true, source: SOURCE, endpoint: 'search',
      data: { query, results, note: 'Harga dari katalog penyedia, bukan harga lokal atau saran medis.' }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiMedicineSearch };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiMedicineSearch(args);
}, ['q']);
