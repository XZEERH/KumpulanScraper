#!/usr/bin/env node
'use strict';

/**
 * Name : Aladhan
 * Base Web : https://aladhan.com/prayer-times-api
 * Description : Jadwal salat dan kalender Hijriah berdasarkan kota tanpa API key.
 * Note : Default metode 20 (Kemenag); hasil tetap merupakan perhitungan astronomis.
 */

const { request, text, integer, isoDate, urlWithParams, failure, runCLI } = require('./scraper-utils');
const SOURCE = 'aladhan';
const USAGE = 'Usage: node scrape-aladhan.js "Jakarta" "Indonesia" [--date YYYY-MM-DD] [--method 20]';

async function aladhan(city, country = 'Indonesia', options = {}) {
  try {
    city = text(city, 'Kota', 150);
    country = text(country, 'Negara', 100);
    const method = integer(options.method, 20, 0, 23, 'Metode');
    const date = options.date === undefined ? '' : isoDate(options.date).split('-').reverse().join('-');
    const payload = await request(urlWithParams(`https://api.aladhan.com/v1/timingsByCity${date ? `/${date}` : ''}`, {
      city, country, method
    }), { ...options, interval: 500, cacheTtl: 300000 });
    if (!payload || payload.code !== 200 || !payload.data?.timings || !payload.data?.meta) {
      throw new Error('Jadwal Aladhan tidak valid atau lokasi tidak ditemukan');
    }
    return {
      status: true, source: SOURCE, city, country,
      timezone: payload.data.meta.timezone,
      method: payload.data.meta.method,
      timings: payload.data.timings,
      date: payload.data.date
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { aladhan };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => aladhan(args._[0], args._[1], args), ['date', 'method']);
