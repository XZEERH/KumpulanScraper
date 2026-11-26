#!/usr/bin/env node
'use strict';

/**
 * Name : English Dictionary
 * Source : https://dictionaryapi.dev/
 * Base Web : https://api.dictionaryapi.dev
 * Type : Scraper
 * Description : Mencari definisi bahasa Inggris, kelas kata, dan contoh penggunaan.
 * Note : node scrapers/kangwifi/info/scrape-dictionary.js --word hello
 */

const { request, text, hasText, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const SOURCE = 'free-dictionary';

async function dictionary(options = {}) {
  try {
    const word = text(options.word, 'Kata', 80).toLowerCase();
    if (!/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)) throw new Error('Masukkan kata atau frasa bahasa Inggris');
    const payload = await request(ENDPOINT + encodeURIComponent(word), {
      timeout: options.timeout, cache: options.cache, interval: 1000, cacheTtl: 600000, redirect: 'error'
    });
    if (!Array.isArray(payload)) throw new Error('Respons kamus tidak valid');
    const entries = payload.filter((item) => hasText(item?.word) && Array.isArray(item.meanings)).map((item) => ({
      word: item.word, phonetic: item.phonetic ?? null,
      meanings: item.meanings.filter((meaning) => hasText(meaning?.partOfSpeech) && Array.isArray(meaning.definitions)).map((meaning) => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.filter((d) => hasText(d?.definition)).map((d) => ({ text: d.definition, example: d.example ?? null }))
      })).filter((meaning) => meaning.definitions.length > 0),
      sources: Array.isArray(item.sourceUrls) ? item.sourceUrls.map((url) => httpsUrl(url)?.href).filter(Boolean) : [],
      license: item.license ?? null
    })).filter((entry) => entry.meanings.length > 0);
    if (!entries.length) throw new Error('Definisi tidak ditemukan');
    return { status: true, source: SOURCE, data: { word, entries } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { dictionary };
if (require.main === module) runOptionsCLI(SOURCE, '--word <kata bahasa Inggris>', dictionary, ['word']);
