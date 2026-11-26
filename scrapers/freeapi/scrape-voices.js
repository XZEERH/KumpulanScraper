#!/usr/bin/env node
'use strict';

/**
 * Name : SpeechSter Voice Catalog
 * Creator : lmavour
 * Source : https://freeapi.pro/speech#api
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Menampilkan pilihan suara SpeechSter, dengan filter bahasa opsional.
 * Note : node scrapers/freeapi/scrape-voices.js --language id-ID --limit 5
 */

const { request, text, hasText, integer, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/voices';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-voices.js [--language id-ID] [--limit 5]';

async function freeapiVoices(options = {}) {
  try {
    const language = options.language === undefined ? null : text(options.language, 'Bahasa', 60).toLowerCase();
    const limit = options.limit === undefined ? undefined : integer(options.limit, NaN, 1, 1000, 'Limit');
    const payload = await request(ENDPOINT, { timeout: options.timeout, cache: options.cache, cacheTtl: 300000, interval: 1800, redirect: 'error' });
    if (payload?.success !== true || !Array.isArray(payload.voices)) throw new Error('Katalog suara SpeechSter tidak valid');
    const voices = payload.voices.filter((voice) => Number.isSafeInteger(voice?.index) && voice.index > 0 &&
      hasText(voice.id) && hasText(voice.name) && hasText(voice.language) && hasText(voice.edgeVoice));
    if (!voices.length) throw new Error('Katalog suara SpeechSter kosong');
    const matches = voices.filter((voice) => !language || voice.language.toLowerCase().includes(language) ||
      voice.edgeVoice.toLowerCase().startsWith(`${language}-`));
    const results = matches.slice(0, limit).map(({ index, id, name, language, country, gender, edgeVoice }) =>
      ({ index, id, name, language, country, gender, edgeVoice }));
    return { status: true, source: SOURCE, endpoint: 'voices', data: { total: matches.length, voices: results } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiVoices };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiVoices(args);
}, ['language'], [], { allowEmpty: true });
