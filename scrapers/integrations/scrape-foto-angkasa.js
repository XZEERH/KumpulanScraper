#!/usr/bin/env node
'use strict';

/**
 * Name : Katalog Gambar NASA
 * Creator : lmavour
 * Source : https://api.nasa.gov/#images
 * Base Web : https://images.nasa.gov
 * Type : Scraper
 * Description : Mencari metadata dan tautan pratinjau gambar, tanpa mengunduh media.
 * Note : node scrapers/integrations/scrape-foto-angkasa.js --q "Apollo 11" --limit 3
 */

const { request, text, hasText, integer, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://images-api.nasa.gov/search';
const SOURCE = 'nasa-image-library';

async function fotoAngkasa(options = {}) {
  try {
    const q = text(options.q, 'Kata kunci', 150);
    const limit = integer(options.limit, 5, 1, 20, 'Limit');
    const page = integer(options.page, 1, 1, 1000, 'Halaman');
    const payload = await request(urlWithParams(ENDPOINT, { q, media_type: 'image', page_size: limit, page }), {
      timeout: options.timeout, cache: options.cache, cacheTtl: 300000, interval: 1200, redirect: 'error'
    });
    const collection = payload?.collection;
    if (!Array.isArray(collection?.items)) throw new Error('Katalog gambar NASA tidak valid');
    const results = collection.items.flatMap((item) => {
      const entry = item?.data?.[0];
      if (entry?.media_type !== 'image' || !hasText(entry.nasa_id) || !hasText(entry.title)) return [];
      const preview = Array.isArray(item.links) ? item.links.find((link) => link?.render === 'image' &&
        httpsUrl(link.href, ['images-assets.nasa.gov']))?.href : null;
      return [{
        id: entry.nasa_id, title: entry.title, dateCreated: entry.date_created ?? null, center: entry.center ?? null,
        photographer: entry.photographer ?? entry.secondary_creator ?? null,
        url: `https://images.nasa.gov/details/${encodeURIComponent(entry.nasa_id)}`, preview: preview ?? null
      }];
    }).slice(0, limit);
    return { status: true, source: SOURCE, attribution: 'NASA - https://www.nasa.gov/nasa-brand-center/images-and-media/', data: {
      q, page, total: collection.metadata?.total_hits ?? null, results
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { fotoAngkasa };
if (require.main === module) runOptionsCLI(SOURCE, '--q <kata kunci> [--page 1] [--limit 5]', fotoAngkasa, ['q', 'page']);
