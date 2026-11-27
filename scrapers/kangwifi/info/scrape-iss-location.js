#!/usr/bin/env node
'use strict';

/**
 * Name : ISS Location
 * Creator : lmavour
 * Source : https://wheretheiss.at/w/developer
 * Base Web : https://api.wheretheiss.at
 * Type : Scraper
 * Description : Mengambil posisi publik Stasiun Luar Angkasa Internasional.
 * Note : node scrapers/kangwifi/info/scrape-iss-location.js
 */

const { request, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.wheretheiss.at/v1/satellites/25544';
const SOURCE = 'where-the-iss-at';

async function issLocation(options = {}) {
  try {
    const payload = await request(ENDPOINT, { timeout: options.timeout, cache: false, interval: 1100, redirect: 'error' });
    if (payload?.id !== 25544 || !Number.isFinite(payload.latitude) || Math.abs(payload.latitude) > 90 ||
      !Number.isFinite(payload.longitude) || Math.abs(payload.longitude) > 180 || !Number.isSafeInteger(payload.timestamp)) {
      throw new Error('Respons koordinat ISS tidak valid');
    }
    const { latitude, longitude, altitude, velocity, units, timestamp } = payload;
    return { status: true, source: SOURCE, data: { latitude, longitude, altitude, velocity, units, timestamp } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { issLocation };
if (require.main === module) runOptionsCLI(SOURCE, '', issLocation);
