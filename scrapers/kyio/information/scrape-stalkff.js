#!/usr/bin/env node
'use strict';

/**
 * Name : Free Fire Stalker
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Stalk akun Free Fire terlengkap berdasarkan UID: nickname, region, level, exp, rank realtime BR & CS, tanggal buat, bio, guild, level prime, dan pet.
 * Note : node scrapers/kyio/information/scrape-stalkff.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/stalkff';
const { scrape: informationStalkff, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    uid: { required: true, aliases: ['id', 'q'] },
    id: {}
  }
});

module.exports = { informationStalkff };
if (require.main === module) cli();
