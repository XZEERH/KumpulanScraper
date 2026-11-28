#!/usr/bin/env node
'use strict';

/**
 * Name : Pokemon Details
 * Creator : lmavour
 * Source : https://pokeapi.co/docs/v2#pokemon
 * Base Web : https://pokeapi.co
 * Type : Scraper
 * Description : Mengambil tipe, statistik, kemampuan, dan sprite Pokemon berdasarkan nama atau ID.
 * Note : node scrapers/kangwifi/info/scrape-pokemon.js --name pikachu
 */

const { request, text, hasText, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://pokeapi.co/api/v2/pokemon/';
const SOURCE = 'pokeapi';

async function pokemon(options = {}) {
  try {
    const name = text(options.name, 'Nama atau ID', 60).toLowerCase();
    if (!/^(?:[a-z][a-z\d-]*|[1-9]\d{0,7})$/.test(name)) throw new Error('Gunakan nama slug atau ID Pokemon');
    const payload = await request(ENDPOINT + name, {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 3600000, redirect: 'error'
    });
    if (!Number.isSafeInteger(payload?.id) || !hasText(payload.name) || !Array.isArray(payload.types) ||
      !Array.isArray(payload.stats) || !Array.isArray(payload.abilities)) throw new Error('Respons Pokemon tidak valid');
    return { status: true, source: SOURCE, data: {
      id: payload.id, name: payload.name,
      types: payload.types.map((item) => item?.type?.name).filter(hasText),
      abilities: payload.abilities.map((item) => item?.ability?.name).filter(hasText),
      stats: Object.fromEntries(payload.stats.filter((item) => hasText(item?.stat?.name) && Number.isFinite(item.base_stat))
        .map((item) => [item.stat.name, item.base_stat])),
      sprite: httpsUrl(payload.sprites?.front_default)?.href ?? null
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { pokemon };
if (require.main === module) runOptionsCLI(SOURCE, '--name <nama atau ID>', pokemon, ['name']);
