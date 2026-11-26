#!/usr/bin/env node
'use strict';

/**
 * Name : Jikan Search
 * Base Web : https://docs.api.jikan.moe/
 * Description : Pencarian metadata anime, manga, dan karakter MyAnimeList tanpa API key.
 * Note : Konten anime/manga memakai filter SFW; jeda request berlaku per proses.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('./scraper-utils');
const SOURCE = 'jikan';
const USAGE = 'Usage: node scrape-jikan.js "Naruto" [--type anime|manga|characters] [--page 1] [--limit 10]';

async function jikan(query, options = {}) {
  try {
    query = text(query, 'Kata kunci');
    const type = choice(options.type, 'anime', ['anime', 'manga', 'characters'], 'Tipe');
    const limit = integer(options.limit, 10, 1, 25, 'Limit');
    const page = integer(options.page, 1, 1, 1000, 'Halaman');
    const payload = await request(urlWithParams(`https://api.jikan.moe/v4/${type}`, {
      q: query, limit, page, ...(type === 'characters' ? {} : { sfw: true })
    }), { ...options, interval: 1000, cacheTtl: 300000 });
    if (!payload || !Array.isArray(payload.data)) throw new Error('Respons Jikan tidak valid');
    const results = payload.data.slice(0, limit).map((item) => ({
      id: item.mal_id, title: item.title || item.name, url: item.url,
      image: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || null,
      type: item.type || type, score: item.score ?? null,
      episodes: item.episodes ?? null, chapters: item.chapters ?? null,
      status: item.status || null, synopsis: item.synopsis || item.about || null,
      genres: (item.genres || []).map((genre) => genre.name)
    }));
    return { status: true, source: SOURCE, query, type, page, total: results.length, pagination: payload.pagination || null, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { jikan };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => jikan(args._.join(' '), args), ['type', 'page']);
