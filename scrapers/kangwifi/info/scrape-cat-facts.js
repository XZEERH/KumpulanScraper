#!/usr/bin/env node
'use strict';

/**
 * Name : Cat Facts
 * Creator : lmavour
 * Source : https://catfact.ninja/
 * Base Web : https://catfact.ninja
 * Type : Scraper
 * Description : Membaca sekumpulan fakta singkat tentang kucing dalam bahasa Inggris.
 * Note : node scrapers/kangwifi/info/scrape-cat-facts.js --count 3
 */

const { request, integer, hasText, urlWithParams, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://catfact.ninja/facts';
const SOURCE = 'cat-fact';

async function catFacts(options = {}) {
  try {
    const count = integer(options.count, 3, 1, 10, 'Jumlah fakta');
    const payload = await request(urlWithParams(ENDPOINT, { limit: count }), {
      timeout: options.timeout, cache: options.cache, interval: 1000, redirect: 'error'
    });
    const facts = payload?.data;
    if (!Array.isArray(facts) || !facts.some((row) => hasText(row?.fact))) throw new Error('Respons fakta kucing tidak valid');
    return { status: true, source: SOURCE, data: { facts: facts.map((row) => row?.fact).filter(hasText).slice(0, count) } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { catFacts };
if (require.main === module) runOptionsCLI(SOURCE, '[--count 3]', catFacts, ['count']);
