#!/usr/bin/env node
'use strict';

/**
 * Name : Hari Libur Nager.Date
 * Source : https://date.nager.at/Api
 * Base Web : https://date.nager.at
 * Type : Scraper
 * Description : Mencari hari libur publik berdasarkan negara dan tahun.
 * Note : node scrapers/kangwifi/info/scrape-holidays.js --country ID --year 2026
 */

const { request, text, hasText, integer, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://date.nager.at/api/v3/PublicHolidays/';
const SOURCE = 'nager-date';

async function holidays(options = {}) {
  try {
    const country = text(options.country, 'Negara', 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('Negara harus berupa kode ISO 2 huruf');
    const year = integer(options.year, new Date().getFullYear(), 1900, 2100, 'Tahun');
    const payload = await request(`${ENDPOINT}${year}/${country}`, {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 3600000, redirect: 'error'
    });
    if (!Array.isArray(payload)) throw new Error('Respons Nager.Date tidak valid');
    const results = payload.filter((day) => day?.countryCode === country && hasText(day.localName) &&
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) && day.date.startsWith(`${year}-`)).map((day) => ({
      date: day.date, localName: day.localName, name: day.name ?? null, national: day.global === true,
      regions: day.counties ?? [], types: day.types ?? []
    }));
    return { status: true, source: SOURCE, data: { country, year, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { holidays };
if (require.main === module) runOptionsCLI(SOURCE, '--country <kode negara> [--year 2026]', holidays, ['country', 'year']);
