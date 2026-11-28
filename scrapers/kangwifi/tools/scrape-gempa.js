#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa Terbaru BMKG
 * Creator : lmavour
 * Source : https://data.bmkg.go.id/gempabumi/
 * Base Web : https://data.bmkg.go.id
 * Type : Scraper
 * Description : Membaca gempa terbaru langsung dari data terbuka BMKG.
 * Note : node scrapers/kangwifi/tools/scrape-gempa.js
 */

const { request, hasText, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json';
const SOURCE = 'bmkg';

async function gempa(options = {}) {
  try {
    const payload = await request(ENDPOINT, { timeout: options.timeout, cache: options.cache, interval: 1100, redirect: 'error' });
    const event = payload?.Infogempa?.gempa;
    if (!hasText(event?.Wilayah) || !hasText(event.DateTime) || !hasText(event.Magnitude) || !Number.isFinite(Number(event.Magnitude))) {
      throw new Error('Respons BMKG tidak memuat data gempa terbaru');
    }
    const map = event.Shakemap;
    return {
      status: true, source: SOURCE, attribution: 'BMKG - https://data.bmkg.go.id/gempabumi/',
      data: {
        dateTime: event.DateTime, region: event.Wilayah, magnitude: Number(event.Magnitude), depth: event.Kedalaman ?? null,
        coordinates: event.Coordinates ?? null, potential: event.Potensi ?? null, felt: event.Dirasakan ?? null,
        shakemap: typeof map === 'string' && /^[\w-]+(?:\.[\w-]+)*\.(?:jpe?g|png)$/i.test(map) ? new URL(map, ENDPOINT).href : null
      }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { gempa };
if (require.main === module) runOptionsCLI(SOURCE, '', gempa);
