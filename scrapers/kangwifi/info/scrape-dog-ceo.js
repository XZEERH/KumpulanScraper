#!/usr/bin/env node
'use strict';

/**
 * Name : Dog CEO Images
 * Creator : lmavour
 * Source : https://dog.ceo/dog-api/documentation/
 * Base Web : https://dog.ceo
 * Type : Scraper
 * Description : Mengambil tautan gambar anjing acak dengan filter ras opsional.
 * Note : node scrapers/kangwifi/info/scrape-dog-ceo.js --breed retriever/golden --count 2
 */

const { request, text, integer, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const BASE = 'https://dog.ceo/api';
const SOURCE = 'dog-ceo';

async function dogImages(options = {}) {
  try {
    const breed = options.breed === undefined ? null : text(options.breed, 'Ras', 60).toLowerCase();
    if (breed && !/^[a-z]+(?:\/[a-z]+)?$/.test(breed)) throw new Error('Ras harus berbentuk breed atau breed/sub-breed');
    const count = integer(options.count, 1, 1, 10, 'Jumlah gambar');
    const endpoint = breed ? `${BASE}/breed/${breed}/images/random/${count}` : `${BASE}/breeds/image/random/${count}`;
    const payload = await request(endpoint, { timeout: options.timeout, cache: false, interval: 1000, redirect: 'error' });
    if (payload?.status !== 'success' || !Array.isArray(payload.message)) throw new Error('Respons Dog CEO tidak valid');
    const images = payload.message.map((url) => httpsUrl(url, ['images.dog.ceo'])?.href).filter(Boolean).slice(0, count);
    if (!images.length) throw new Error('Tidak ada tautan gambar Dog CEO yang valid');
    return { status: true, source: SOURCE, data: { breed, images } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { dogImages };
if (require.main === module) runOptionsCLI(SOURCE, '[--breed retriever/golden] [--count 1]', dogImages, ['breed', 'count']);
