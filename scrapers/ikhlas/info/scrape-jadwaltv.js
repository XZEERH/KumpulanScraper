#!/usr/bin/env node
'use strict';

/**
 * Name : Jadwal TV Nasional
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mengambil jadwal penayangan program dan acara televisi nasional Indonesia (SCTV, RCTI, Indosiar, Trans TV, Trans7, Metro TV, TV One, dll). Masukkan nama channel spesifik atau kosongkan parameter channel untuk melihat seluruh tayangan terkini.
 * Note : node scrapers/ikhlas/info/scrape-jadwaltv.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/info/jadwaltv';
const { scrape: ikhlasInfoJadwaltv, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    channel: {}
  }
});

module.exports = { ikhlasInfoJadwaltv };
if (require.main === module) cli();
