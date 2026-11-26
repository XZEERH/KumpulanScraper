#!/usr/bin/env node
'use strict';

/**
 * Name : Daily Affirmation
 * Source : https://www.affirmations.dev/
 * Base Web : https://www.affirmations.dev
 * Type : Scraper
 * Description : Mengambil satu afirmasi positif acak dalam bahasa Inggris.
 * Note : node scrapers/kangwifi/info/scrape-affirmation.js
 */

const { request, hasText, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://www.affirmations.dev/';
const SOURCE = 'affirmations-dev';

async function affirmation(options = {}) {
  try {
    const payload = await request(ENDPOINT, { timeout: options.timeout, cache: false, interval: 1000, redirect: 'error' });
    if (!hasText(payload?.affirmation)) throw new Error('Afirmasi tidak tersedia');
    return { status: true, source: SOURCE, data: { affirmation: payload.affirmation } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { affirmation };
if (require.main === module) runOptionsCLI(SOURCE, '', affirmation);
