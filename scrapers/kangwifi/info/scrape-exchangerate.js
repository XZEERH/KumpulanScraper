#!/usr/bin/env node
'use strict';

/**
 * Name : ExchangeRate-API Open Access
 * Creator : lmavour
 * Source : https://www.exchangerate-api.com/docs/free
 * Base Web : https://open.er-api.com
 * Type : Scraper
 * Description : Mengonversi satu pasangan mata uang memakai kurs referensi harian.
 * Note : node scrapers/kangwifi/info/scrape-exchangerate.js --base USD --target IDR --amount 10
 */

const { request, text, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://open.er-api.com/v6/latest/';
const SOURCE = 'exchangerate-api';

async function exchangeRate(options = {}) {
  try {
    const base = text(options.base ?? 'USD', 'Mata uang asal', 3).toUpperCase();
    const target = text(options.target ?? 'IDR', 'Mata uang tujuan', 3).toUpperCase();
    if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target)) throw new Error('Mata uang harus berupa kode ISO 3 huruf');
    const rawAmount = options.amount ?? 1;
    const amount = typeof rawAmount === 'number' ? rawAmount : Number(text(rawAmount, 'Jumlah', 30));
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Jumlah harus berupa angka positif atau nol');
    const payload = await request(ENDPOINT + base, {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 3600000, redirect: 'error'
    });
    const rate = payload?.rates?.[target];
    const converted = amount * rate;
    if (payload?.result !== 'success' || payload.base_code !== base || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(converted)) {
      throw new Error('Kurs atau hasil konversi tidak tersedia');
    }
    return { status: true, source: SOURCE, attribution: 'Rates By Exchange Rate API - https://www.exchangerate-api.com', data: {
      base, target, amount, rate, converted, updatedAt: payload.time_last_update_utc ?? null, nextUpdate: payload.time_next_update_utc ?? null
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { exchangeRate };
if (require.main === module) runOptionsCLI(SOURCE, '[--base USD] [--target IDR] [--amount 1]', exchangeRate, ['base', 'target', 'amount']);
