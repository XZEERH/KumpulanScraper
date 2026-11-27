#!/usr/bin/env node
'use strict';

/**
 * Name : Geocoding Kota dan Kode Pos
 * Creator : lmavour
 * Source : https://open-meteo.com/en/docs/geocoding-api
 * Base Web : https://geocoding-api.open-meteo.com
 * Type : Scraper
 * Description : Mencari koordinat dan zona waktu berdasarkan nama lokasi atau kode pos.
 * Note : node scrapers/integrations/scrape-geocoding.js --name Bandung --country ID --limit 3
 */

const { request, text, hasText, integer, urlWithParams, failure, runOptionsCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const SOURCE = 'open-meteo';

async function geocoding(options = {}) {
  try {
    const name = text(options.name, 'Nama lokasi atau kode pos', 120);
    if (name.split(',')[0].trim().length < 2) throw new Error('Nama lokasi atau kode pos minimal 2 karakter');
    const countryCode = options.country === undefined ? undefined : text(options.country, 'Negara', 2).toUpperCase();
    if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) throw new Error('Gunakan kode negara dua huruf');
    const language = text(options.lang ?? 'id', 'Bahasa', 2).toLowerCase();
    if (!/^[a-z]{2}$/.test(language)) throw new Error('Gunakan kode bahasa dua huruf');
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const payload = await request(urlWithParams(ENDPOINT, { name, count: limit, language, countryCode, format: 'json' }), {
      timeout: options.timeout, cache: options.cache, cacheTtl: 3600000, interval: 1000, redirect: 'error'
    });
    const rows = payload?.results === undefined && Number.isFinite(payload?.generationtime_ms) ? [] : payload?.results;
    if (payload?.error || !Array.isArray(rows)) throw new Error('Respons pencarian lokasi tidak valid');
    const results = rows.filter((item) => Number.isSafeInteger(item?.id) && hasText(item.name) &&
      Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90 && Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180 &&
      (countryCode === undefined || item.country_code === countryCode)).slice(0, limit).map((item) => ({
      id: item.id, name: item.name, latitude: item.latitude, longitude: item.longitude, timezone: item.timezone ?? null,
      country: item.country ?? null, countryCode: item.country_code ?? null, admin1: item.admin1 ?? null, admin2: item.admin2 ?? null
    }));
    return { status: true, source: SOURCE, attribution: 'Open-Meteo / GeoNames', data: { name, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { geocoding };
if (require.main === module) runOptionsCLI(SOURCE, '--name <lokasi atau kode pos> [--country ID] [--lang id] [--limit 5]',
  geocoding, ['name', 'country', 'lang']);
