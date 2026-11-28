#!/usr/bin/env node
'use strict';

/**
 * Name : Programming Joke
 * Creator : lmavour
 * Source : https://sv443.net/jokeapi/v2/
 * Base Web : https://v2.jokeapi.dev
 * Type : Scraper
 * Description : Mengambil satu lelucon pemrograman dua bagian dengan safe-mode aktif.
 * Note : node scrapers/kangwifi/info/scrape-joke.js
 */

const { request, hasText, urlWithParams, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://v2.jokeapi.dev/joke/Programming';
const SOURCE = 'jokeapi';

async function joke(options = {}) {
  try {
    const payload = await request(urlWithParams(ENDPOINT, { 'safe-mode': '', type: 'twopart' }), {
      timeout: options.timeout, cache: false, interval: 1000, redirect: 'error'
    });
    if (payload?.error !== false || payload.safe !== true || !hasText(payload.setup) || !hasText(payload.delivery)) {
      throw new Error('Lelucon pemrograman tidak tersedia');
    }
    return { status: true, source: SOURCE, data: { id: payload.id, setup: payload.setup, punchline: payload.delivery } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { joke };
if (require.main === module) runOptionsCLI(SOURCE, '', joke);
