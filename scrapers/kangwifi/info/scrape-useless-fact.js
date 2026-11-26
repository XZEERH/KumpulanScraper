#!/usr/bin/env node
'use strict';

/**
 * Name : Useless Facts
 * Source : https://uselessfacts.jsph.pl/
 * Base Web : https://uselessfacts.jsph.pl
 * Type : Scraper
 * Description : Mengambil fakta acak dalam bahasa Inggris atau Jerman.
 * Note : node scrapers/kangwifi/info/scrape-useless-fact.js --lang en
 */

const { request, choice, hasText, urlWithParams, httpsUrl, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://uselessfacts.jsph.pl/api/v2/facts/random';
const SOURCE = 'useless-facts';

async function uselessFact(options = {}) {
  try {
    const lang = choice(options.lang, 'en', ['en', 'de'], 'Bahasa');
    const payload = await request(urlWithParams(ENDPOINT, { language: lang }), {
      timeout: options.timeout, cache: false, interval: 1000, redirect: 'error'
    });
    if (!hasText(payload?.id) || !hasText(payload.text) || payload.language !== lang) throw new Error('Respons fakta acak tidak valid');
    return { status: true, source: SOURCE, data: {
      id: payload.id, text: payload.text, lang, citation: payload.source ?? null, url: httpsUrl(payload.permalink)?.href ?? null
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { uselessFact };
if (require.main === module) runOptionsCLI(SOURCE, '[--lang en|de]', uselessFact, ['lang']);
