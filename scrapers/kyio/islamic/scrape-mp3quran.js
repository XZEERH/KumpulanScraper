#!/usr/bin/env node
'use strict';

/**
 * Name : MP3 Quran & Murottal Audio
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Layanan audio murottal Al-Quran dari 200+ qari dunia, 114 surah, riwayat bacaan, dan streaming radio langsung dari mp3quran.net.
 * Note : node scrapers/kyio/islamic/scrape-mp3quran.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/islamic/mp3quran';
const { scrape: islamicMp3quran, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    mode: {},
    reciter: {},
    surah: {},
    language: {}
  }
});

module.exports = { islamicMp3quran };
if (require.main === module) cli();
