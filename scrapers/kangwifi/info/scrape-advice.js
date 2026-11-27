#!/usr/bin/env node
'use strict';

/**
 * Name : Advice Slip
 * Creator : lmavour
 * Source : https://api.adviceslip.com/
 * Base Web : https://api.adviceslip.com
 * Type : Scraper
 * Description : Membaca satu saran singkat acak atau berdasarkan ID.
 * Note : node scrapers/kangwifi/info/scrape-advice.js
 */

const { request, integer, hasText, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.adviceslip.com/advice';
const SOURCE = 'advice-slip';

async function advice(options = {}) {
  try {
    const id = options.id === undefined ? null : integer(options.id, NaN, 1, 100000, 'ID');
    const payload = await request(id === null ? ENDPOINT : `${ENDPOINT}/${id}`, {
      timeout: options.timeout, cache: id !== null && options.cache !== false, interval: 1000, redirect: 'error'
    });
    const slip = payload?.slip;
    if (!Number.isSafeInteger(slip?.id) || !hasText(slip.advice) || (id !== null && slip.id !== id)) {
      throw new Error('Saran valid tidak ditemukan');
    }
    return { status: true, source: SOURCE, data: { id: slip.id, advice: slip.advice } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { advice };
if (require.main === module) runOptionsCLI(SOURCE, '[--id 42]', advice, ['id']);
