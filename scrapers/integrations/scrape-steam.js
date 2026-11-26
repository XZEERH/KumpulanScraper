#!/usr/bin/env node
'use strict';

/**
 * Name : Steam Store Search
 * Base Web : https://store.steampowered.com/
 * Description : Pencarian game, metadata, gambar, dan harga regional tanpa API key.
 * Note : Endpoint web internal dapat berubah; tidak mengunduh game.
 */

const { request, text, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'steam';
const USAGE = 'Usage: node scrapers/integrations/scrape-steam.js "Stardew Valley" [--country ID] [--limit 10]';

async function steam(query, options = {}) {
  try {
    query = text(query, 'Kata kunci');
    const country = text(options.country ?? 'ID', 'Negara', 2).toLowerCase();
    if (!/^[a-z]{2}$/.test(country)) throw new Error('Negara harus berupa kode ISO 2 huruf');
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const payload = await request(urlWithParams('https://store.steampowered.com/api/storesearch/', {
      term: query, cc: country, l: 'english'
    }), { ...options, interval: 1000, cacheTtl: 300000 });
    if (!payload || !Array.isArray(payload.items)) throw new Error('Struktur respons Steam berubah');
    const results = payload.items.slice(0, limit).map((item) => ({
      id: item.id, name: item.name, type: item.type,
      url: `https://store.steampowered.com/app/${item.id}/`,
      image: item.tiny_image || null,
      platforms: item.platforms || {},
      metascore: item.metascore ?? null,
      price: item.price ? {
        currency: item.price.currency,
        initial: item.price.initial / 100,
        final: item.price.final / 100,
        discountPercent: item.price.initial > 0 ? Math.round((1 - item.price.final / item.price.initial) * 100) : 0
      } : null
    }));
    return { status: true, source: SOURCE, query, country: country.toUpperCase(), available: payload.total, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { steam };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => steam(args._.join(' '), args), ['country']);
