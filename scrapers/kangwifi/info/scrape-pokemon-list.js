#!/usr/bin/env node
'use strict';

/**
 * Name : Pokemon List
 * Source : https://pokeapi.co/api/v2/pokemon/
 * Base Web : https://pokeapi.co
 * Type : Scraper
 * Description : Membaca satu halaman katalog nama Pokemon dari PokeAPI.
 * Note : node scrapers/kangwifi/info/scrape-pokemon-list.js --limit 5 --offset 0
 */

const { request, integer, hasText, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://pokeapi.co/api/v2/pokemon/';
const SOURCE = 'pokeapi';

async function pokemonList(options = {}) {
  try {
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const offset = integer(options.offset, 0, 0, 100000, 'Offset');
    const payload = await request(urlWithParams(ENDPOINT, { limit, offset }), {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 3600000, redirect: 'error'
    });
    if (!Number.isSafeInteger(payload?.count) || !Array.isArray(payload.results)) throw new Error('Katalog Pokemon tidak valid');
    const results = payload.results.flatMap((item) => {
      const url = httpsUrl(item?.url, ['pokeapi.co']);
      return url && /^\/api\/v2\/pokemon\/\d+\/$/.test(url.pathname) && hasText(item.name)
        ? [{ name: item.name, url: url.href }] : [];
    }).slice(0, limit);
    return { status: true, source: SOURCE, data: { total: payload.count, offset, nextOffset: payload.next ? offset + limit : null, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { pokemonList };
if (require.main === module) runOptionsCLI(SOURCE, '[--limit 10] [--offset 0]', pokemonList, ['offset']);
