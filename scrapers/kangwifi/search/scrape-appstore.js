#!/usr/bin/env node
'use strict';

/**
 * Name : App Store Search
 * Source : https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 * Base Web : https://itunes.apple.com
 * Type : Scraper
 * Description : Mencari aplikasi iOS dan menampilkan harga, versi, serta tautan App Store.
 * Note : node scrapers/kangwifi/search/scrape-appstore.js --query Keynote --country ID --limit 3
 */

const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://itunes.apple.com/search';
const SOURCE = 'apple-app-store';

async function appstore(options = {}) {
  try {
    const query = text(options.query, 'Nama aplikasi', 150);
    const country = text(options.country ?? 'ID', 'Negara', 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('Negara harus berupa kode ISO 2 huruf');
    const limit = integer(options.limit, 8, 1, 20, 'Limit');
    const payload = await request(urlWithParams(ENDPOINT, { term: query, country, media: 'software', entity: 'software', limit }), {
      timeout: options.timeout, cache: options.cache, interval: 3100, cacheTtl: 600000, redirect: 'error'
    });
    if (!Array.isArray(payload?.results)) throw new Error('Respons App Store bukan daftar aplikasi');
    const results = payload.results.filter((app) => Number.isSafeInteger(app?.trackId) && hasText(app.trackName))
      .slice(0, limit).map((app) => ({
        id: app.trackId, name: app.trackName, publisher: app.sellerName ?? app.artistName ?? null,
        version: app.version ?? null, price: app.formattedPrice ?? null, currency: app.currency ?? null,
        rating: app.averageUserRating ?? null, icon: httpsUrl(app.artworkUrl100)?.href ?? null,
        url: httpsUrl(app.trackViewUrl, ['apps.apple.com', 'itunes.apple.com'])?.href ?? null
      }));
    return { status: true, source: SOURCE, data: { query, country, results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { appstore };
if (require.main === module) runOptionsCLI(SOURCE, '--query <nama aplikasi> [--country ID] [--limit 8]', appstore, ['query', 'country']);
