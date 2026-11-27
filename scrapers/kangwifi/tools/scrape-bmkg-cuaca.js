#!/usr/bin/env node
'use strict';

/**
 * Name : Prakiraan Cuaca BMKG
 * Creator : lmavour
 * Source : https://data.bmkg.go.id/prakiraan-cuaca/
 * Base Web : https://api.bmkg.go.id
 * Type : Scraper
 * Description : Membaca prakiraan cuaca untuk satu kode desa atau kelurahan (adm4).
 * Note : node scrapers/kangwifi/tools/scrape-bmkg-cuaca.js --adm4 31.71.03.1001
 */

const { request, text, hasText, urlWithParams, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';
const SOURCE = 'bmkg';

async function bmkgCuaca(options = {}) {
  try {
    const adm4 = text(options.adm4, 'Kode adm4', 13);
    if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4)) throw new Error('Kode adm4 harus berbentuk NN.NN.NN.NNNN');
    const payload = await request(urlWithParams(ENDPOINT, { adm4 }), {
      timeout: options.timeout, cache: options.cache, interval: 1100, cacheTtl: 300000, redirect: 'error'
    });
    if (payload?.lokasi?.adm4 !== adm4 || !Array.isArray(payload.data)) throw new Error('Wilayah tidak ditemukan dalam respons BMKG');
    const forecasts = payload.data.flatMap((block) => Array.isArray(block?.cuaca) ? block.cuaca.flat() : [])
      .filter((entry) => hasText(entry?.datetime) && hasText(entry.weather_desc) && Number.isFinite(entry.t))
      .map((entry) => ({
        dateTime: entry.datetime, localDateTime: entry.local_datetime ?? null, weather: entry.weather_desc,
        temperatureC: entry.t, humidityPercent: entry.hu ?? null, windSpeedKmh: entry.ws ?? null, windDirection: entry.wd ?? null
      }));
    if (!forecasts.length) throw new Error('Prakiraan BMKG tidak tersedia');
    const { provinsi, kotkab, kecamatan, desa, timezone } = payload.lokasi;
    return {
      status: true, source: SOURCE, attribution: 'BMKG - https://data.bmkg.go.id/prakiraan-cuaca/',
      data: { location: { adm4, provinsi, kotkab, kecamatan, desa, timezone }, forecasts }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { bmkgCuaca };
if (require.main === module) runOptionsCLI(SOURCE, '--adm4 <kode wilayah>', bmkgCuaca, ['adm4']);
