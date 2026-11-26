#!/usr/bin/env node
'use strict';

/**
 * Name : iTunes Search
 * Base Web : https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 * Description : Metadata musik, podcast, film, dan buku serta tautan toko tanpa API key.
 * Note : Artwork/preview mengikuti ketentuan promosi Apple; tidak menyimpan atau mengunduh preview audio.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'itunes';
const USAGE = 'Usage: node scrapers/integrations/scrape-itunes.js "podcast Indonesia" [--type podcast|music|movie|ebook] [--country ID] [--limit 10]';

async function itunes(query, options = {}) {
  try {
    query = text(query, 'Kata kunci');
    const type = choice(options.type, 'podcast', ['podcast', 'music', 'movie', 'ebook'], 'Tipe');
    const entity = { podcast: 'podcast', music: 'song', movie: 'movie', ebook: 'ebook' }[type];
    const country = text(options.country ?? 'ID', 'Negara', 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('Negara harus berupa kode ISO 2 huruf');
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const payload = await request(urlWithParams('https://itunes.apple.com/search', {
      term: query, country, media: type, entity, limit, explicit: 'No'
    }), { ...options, interval: 3100, cacheTtl: 300000 });
    if (!payload || !Array.isArray(payload.results)) throw new Error('Respons iTunes tidak valid');
    const results = payload.results.slice(0, limit).map((item) => ({
      id: item.trackId || item.collectionId, title: item.trackName || item.collectionName,
      author: item.artistName || null, kind: item.kind || item.wrapperType,
      url: item.trackViewUrl || item.collectionViewUrl || null,
      artwork: item.artworkUrl100 || item.artworkUrl60 || null,
      feedUrl: item.feedUrl || null, genre: item.primaryGenreName || null,
      releasedAt: item.releaseDate || null, durationMs: item.trackTimeMillis ?? null,
      price: item.trackPrice ?? item.collectionPrice ?? null, currency: item.currency || null
    }));
    return { status: true, source: SOURCE, query, type, country, attribution: 'Metadata provided courtesy of iTunes; penggunaan aset mengikuti ketentuan Apple', total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { itunes };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => itunes(args._.join(' '), args), ['type', 'country']);
