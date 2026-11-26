#!/usr/bin/env node
'use strict';

/**
 * Name : Dog API Facts
 * Source : https://dogapi.dog/docs/api-v2
 * Base Web : https://dogapi.dog
 * Type : Scraper
 * Description : Mengambil fakta acak tentang anjing dari Dog API v2.
 * Note : node scrapers/kangwifi/info/scrape-dog-facts.js --count 2
 */

const { request, integer, hasText, urlWithParams, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://dogapi.dog/api/v2/facts';
const SOURCE = 'dog-api';

async function dogFacts(options = {}) {
  try {
    const count = integer(options.count, 2, 1, 5, 'Jumlah fakta');
    const payload = await request(urlWithParams(ENDPOINT, { limit: count }), {
      timeout: options.timeout, cache: false, interval: 1000, redirect: 'error'
    });
    const facts = Array.isArray(payload?.data) ? payload.data.map((row) => row?.attributes?.body).filter(hasText).slice(0, count) : [];
    if (!facts.length) throw new Error('Respons fakta anjing tidak valid');
    return { status: true, source: SOURCE, data: { facts } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { dogFacts };
if (require.main === module) runOptionsCLI(SOURCE, '[--count 2]', dogFacts, ['count']);
