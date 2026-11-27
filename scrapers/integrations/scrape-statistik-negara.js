#!/usr/bin/env node
'use strict';

/**
 * Name : Statistik Negara Bank Dunia
 * Source : https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
 * Base Web : https://api.worldbank.org
 * Type : Scraper
 * Description : Membaca seri tahunan satu indikator World Development Indicators (WDI).
 * Note : node scrapers/integrations/scrape-statistik-negara.js --country IDN --indicator SP.POP.TOTL --from 2020 --to 2024 --limit 5
 */

const { request, text, integer, urlWithParams, failure, runOptionsCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://api.worldbank.org/v2/country/';
const SOURCE = 'world-bank';

async function statistikNegara(options = {}) {
  try {
    const country = text(options.country ?? 'IDN', 'Kode negara', 3).toUpperCase();
    const indicator = text(options.indicator ?? 'SP.POP.TOTL', 'Kode indikator', 70).toUpperCase();
    if (!/^[A-Z]{3}$/.test(country)) throw new Error('Gunakan kode negara tiga huruf, misalnya IDN');
    if (!/^[A-Z0-9]+(?:[._-][A-Z0-9]+)*$/.test(indicator)) throw new Error('Kode indikator WDI tidak valid');
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const params = { format: 'json', source: 2, per_page: limit };
    if (options.from === undefined && options.to === undefined) params.mrnev = limit;
    else {
      const from = integer(options.from, NaN, 1900, 2100, 'Tahun awal');
      const to = integer(options.to, NaN, from, 2100, 'Tahun akhir');
      params.date = `${from}:${to}`;
    }

    const payload = await request(urlWithParams(`${ENDPOINT}${country}/indicator/${indicator}`, params), {
      timeout: options.timeout, cache: options.cache, cacheTtl: 3600000, interval: 1000, redirect: 'error'
    });
    const [meta, rows] = Array.isArray(payload) ? payload : [];
    const total = meta?.total;
    if (!Number.isSafeInteger(total) || total < 0 || !(Array.isArray(rows) || (rows === null && total === 0))) {
      throw new Error('Negara atau indikator WDI tidak ditemukan, atau respons tidak valid');
    }
    const selected = (rows ?? []).filter((row) => row?.indicator?.id === indicator && row.countryiso3code === country &&
      /^\d{4}$/.test(row.date) && (row.value === null || Number.isFinite(row.value))).slice(0, limit);
    if (total && !selected.length) throw new Error('Respons WDI tidak memuat seri tahunan yang valid');
    return { status: true, source: SOURCE, attribution: 'World Bank - World Development Indicators', data: {
      country, countryName: selected[0]?.country?.value ?? null, indicator, indicatorName: selected[0]?.indicator?.value ?? null,
      total, lastUpdated: meta.lastupdated ?? null, results: selected.map(({ date, value }) => ({ year: Number(date), value }))
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { statistikNegara };
if (require.main === module) runOptionsCLI(SOURCE, '[--country IDN] [--indicator SP.POP.TOTL] [--from 2020 --to 2024] [--limit 10]',
  statistikNegara, ['country', 'indicator', 'from', 'to']);
