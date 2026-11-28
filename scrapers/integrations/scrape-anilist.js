#!/usr/bin/env node
'use strict';

/**
 * Name : Pencarian anime/manga via AniList
 * Creator : lmavour
 * Base Web : https://anilist.gitbook.io/anilist-apiv2-docs/docs/guide/graphql
 * Note : Lookup judul sesuai permintaan. Bukan untuk penyimpanan atau pengambilan data massal.
 */

const { request, text, choice, integer, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'anilist';
const USAGE = 'Usage: node scrapers/integrations/scrape-anilist.js "judul" [--type anime|manga] [--limit 1-10]';
const SEARCH = `query SearchMedia($search: String!, $type: MediaType!, $limit: Int!) {
  Page(page: 1, perPage: $limit) {
    media(search: $search, type: $type, isAdult: false, sort: SEARCH_MATCH) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { large }
      siteUrl
      format
      status
      averageScore
      genres
      episodes
      chapters
    }
  }
}`;

async function anilist(query, options = {}) {
  try {
    query = text(query, 'Judul');
    const type = choice(options.type, 'anime', ['anime', 'manga'], 'Tipe');
    const limit = integer(options.limit, 5, 1, 10, 'Limit');
    const payload = await request('https://graphql.anilist.co', {
      timeout: options.timeout, cache: false, interval: 2500,
      jsonBody: { query: SEARCH, variables: { search: query, type: type.toUpperCase(), limit } }
    });
    if (payload?.errors?.length) throw new Error(payload.errors[0]?.message || 'Query AniList gagal');
    const media = payload?.data?.Page?.media;
    if (!Array.isArray(media)) throw new Error('Respons AniList tidak valid');
    const results = media.filter(Boolean).slice(0, limit).map((item) => ({
      id: item.id, title: item.title?.english || item.title?.romaji || item.title?.native || null,
      url: item.siteUrl || null, image: item.coverImage?.large || null,
      format: item.format ?? null, status: item.status ?? null, averageScore: item.averageScore ?? null,
      episodes: item.episodes ?? null, chapters: item.chapters ?? null,
      synopsis: item.description || null, genres: item.genres || []
    }));
    return { status: true, source: SOURCE, query, type, total: results.length, results };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { anilist };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => anilist(args._.join(' '), args), ['type']);
