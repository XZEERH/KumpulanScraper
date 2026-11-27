#!/usr/bin/env node
'use strict';

/**
 * Name : MangaDex Metadata
 * Creator : lmavour
 * Base Web : https://api.mangadex.org/docs/
 * Description : Metadata manga SFW dan daftar chapter/tautan tanpa API key.
 * Note : Tidak mengambil halaman chapter. Ikuti aturan aplikasi pihak ketiga,
 *        atribusi MangaDex/scanlation group, serta batas penggunaan komersial.
 */

const { request, text, choice, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'mangadex';
const USAGE = 'Usage: node scrapers/integrations/scrape-mangadex.js <search|chapters> "judul|manga-uuid" [--language id] [--limit 10] [--offset 0]';

async function mangadex(target, options = {}) {
  try {
    target = text(target, 'Target');
    const mode = choice(options.mode, 'search', ['search', 'chapters']);
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const offset = integer(options.offset, 0, 0, 9950, 'Offset');
    const language = text(options.language ?? 'id', 'Bahasa', 10).toLowerCase();
    if (!/^[a-z]{2}(?:-[a-z]{2})?$/.test(language)) throw new Error('Kode bahasa tidak valid');
    if (mode === 'chapters' && !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(target)) {
      throw new Error('ID manga harus berupa UUID');
    }
    const base = mode === 'search' ? 'https://api.mangadex.org/manga' : `https://api.mangadex.org/manga/${target}/feed`;
    const params = mode === 'search' ? {
      title: target, 'contentRating[]': 'safe', 'order[relevance]': 'desc',
      'includes[]': ['cover_art', 'author', 'artist']
    } : {
      'translatedLanguage[]': language, 'contentRating[]': 'safe', 'order[chapter]': 'asc',
      'includes[]': 'scanlation_group'
    };
    const payload = await request(urlWithParams(base, { limit, offset, ...params }), {
      ...options, interval: 1000, cacheTtl: 300000
    });
    if (!payload || payload.result !== 'ok' || !Array.isArray(payload.data)) throw new Error('Respons MangaDex tidak valid');
    const results = payload.data.slice(0, limit).map((item) => {
      const attributes = item.attributes;
      if (!attributes || !item.id) throw new Error('Metadata MangaDex tidak lengkap');
      const relationships = item.relationships || [];
      if (mode === 'chapters') return {
        id: item.id, chapter: attributes.chapter, volume: attributes.volume,
        title: attributes.title || null, language: attributes.translatedLanguage,
        pages: attributes.pages, publishedAt: attributes.publishAt,
        url: `https://mangadex.org/chapter/${item.id}`,
        groups: relationships.filter((entry) => entry.type === 'scanlation_group').map((entry) => entry.attributes?.name).filter(Boolean)
      };
      const cover = relationships.find((entry) => entry.type === 'cover_art')?.attributes?.fileName;
      return {
        id: item.id, title: attributes.title?.[language] || attributes.title?.en || Object.values(attributes.title || {})[0] || null,
        description: attributes.description?.[language] || attributes.description?.en || null,
        year: attributes.year, status: attributes.status, contentRating: attributes.contentRating,
        url: `https://mangadex.org/title/${item.id}`,
        cover: cover ? `https://uploads.mangadex.org/covers/${item.id}/${encodeURIComponent(cover)}.256.jpg` : null,
        authors: relationships.filter((entry) => entry.type === 'author' || entry.type === 'artist').map((entry) => entry.attributes?.name).filter(Boolean)
      };
    });
    return { status: true, source: SOURCE, mode, target, offset, available: payload.total, total: results.length, attribution: 'MangaDex and the original creators / scanlation groups', results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { mangadex };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => mangadex(args._.slice(1).join(' '), { ...args, mode: args._[0] }), ['language', 'offset']);
