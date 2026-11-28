#!/usr/bin/env node
'use strict';

/**
 * Name : TVmaze Show Search
 * Creator : lmavour
 * Source : https://www.tvmaze.com/api
 * Base Web : https://api.tvmaze.com
 * Type : Scraper
 * Description : Mencari seri TV beserta genre, rating, dan ringkasan.
 * Note : node scrapers/kangwifi/info/scrape-tv-maze.js --q Sherlock --limit 3
 */

const { load } = require('cheerio');
const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.tvmaze.com/search/shows';
const SOURCE = 'tvmaze';

async function tvMaze(options = {}) {
  try {
    const q = text(options.q, 'Judul seri', 150);
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const payload = await request(urlWithParams(ENDPOINT, { q }), {
      timeout: options.timeout, cache: options.cache, interval: 600, cacheTtl: 300000, redirect: 'error'
    });
    if (!Array.isArray(payload)) throw new Error('Respons TVmaze bukan daftar acara');
    const results = payload.map((item) => item?.show).filter((show) => Number.isSafeInteger(show?.id) && hasText(show.name))
      .slice(0, limit).map((show) => ({
        id: show.id, name: show.name, language: show.language ?? null, genres: show.genres ?? [], premiered: show.premiered ?? null,
        rating: show.rating?.average ?? null, summary: typeof show.summary === 'string' ? load(show.summary, null, false).text().trim() : null,
        image: httpsUrl(show.image?.medium)?.href ?? null, url: `https://www.tvmaze.com/shows/${show.id}`
      }));
    return { status: true, source: SOURCE, attribution: 'TVmaze (CC BY-SA) - https://www.tvmaze.com/api', data: { q, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { tvMaze };
if (require.main === module) runOptionsCLI(SOURCE, '--q <judul seri> [--limit 5]', tvMaze, ['q']);
