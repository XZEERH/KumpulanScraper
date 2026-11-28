#!/usr/bin/env node
'use strict';

/**
 * Name : Rick and Morty Characters
 * Creator : lmavour
 * Source : https://rickandmortyapi.com/documentation
 * Base Web : https://rickandmortyapi.com
 * Type : Scraper
 * Description : Mencari karakter Rick and Morty dan menampilkan spesies serta asalnya.
 * Note : node scrapers/kangwifi/info/scrape-rickandmorty.js --name Rick --page 1
 */

const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://rickandmortyapi.com/api/character';
const SOURCE = 'rick-and-morty-api';

async function rickAndMorty(options = {}) {
  try {
    const name = options.name === undefined ? undefined : text(options.name, 'Nama', 80);
    const page = integer(options.page, 1, 1, 1000, 'Halaman');
    const payload = await request(urlWithParams(ENDPOINT, { name, page }), {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 600000, redirect: 'error'
    });
    if (!Array.isArray(payload?.results)) throw new Error('Respons karakter tidak valid');
    const results = payload.results.filter((item) => Number.isSafeInteger(item?.id) && hasText(item.name)).map((item) => ({
      id: item.id, name: item.name, status: item.status ?? null, species: item.species ?? null, origin: item.origin?.name ?? null,
      image: httpsUrl(item.image, ['rickandmortyapi.com'])?.href ?? null
    }));
    return { status: true, source: SOURCE, data: { page, total: payload.info?.count ?? null, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { rickAndMorty };
if (require.main === module) runOptionsCLI(SOURCE, '[--name Rick] [--page 1]', rickAndMorty, ['name', 'page']);
