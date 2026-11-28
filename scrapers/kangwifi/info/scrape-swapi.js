#!/usr/bin/env node
'use strict';

/**
 * Name : Star Wars Search
 * Creator : lmavour
 * Source : https://www.swapi.tech/documentation
 * Base Web : https://www.swapi.tech
 * Type : Scraper
 * Description : Mencari karakter, planet, atau kapal Star Wars berdasarkan nama.
 * Note : node scrapers/kangwifi/info/scrape-swapi.js --type people --name "Luke Skywalker"
 */

const { request, text, hasText, choice, integer, urlWithParams, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.swapi.tech/api/';
const SOURCE = 'swapi';

async function starWars(options = {}) {
  try {
    const name = text(options.name, 'Nama', 100);
    const type = choice(options.type, 'people', ['people', 'planets', 'starships'], 'Jenis');
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const payload = await request(urlWithParams(ENDPOINT + type, { name }), {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 600000, redirect: 'error'
    });
    if (!Array.isArray(payload?.result)) throw new Error('Respons SWAPI tidak valid');
    const results = payload.result.filter((item) => typeof item?.uid === 'string' && /^\d+$/.test(item.uid) && hasText(item.properties?.name))
      .slice(0, limit).map((item) => ({ id: item.uid, name: item.properties.name, url: `${ENDPOINT}${type}/${item.uid}` }));
    return { status: true, source: SOURCE, data: { type, name, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { starWars };
if (require.main === module) runOptionsCLI(SOURCE, '--name <nama> [--type people|planets|starships] [--limit 5]', starWars, ['type', 'name']);
