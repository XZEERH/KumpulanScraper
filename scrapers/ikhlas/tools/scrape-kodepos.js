#!/usr/bin/env node
'use strict';

/**
 * Name : Cek Kode Pos
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Mencari rincian kode pos, nama kelurahan, desa, kecamatan, kota/kabupaten, dan provinsi di seluruh wilayah Indonesia dari basis data geografis resmi.
 * Note : node scrapers/ikhlas/tools/scrape-kodepos.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/tools/kodepos';
const { scrape: ikhlasToolsKodepos, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    form: { required: true }
  }
});

module.exports = { ikhlasToolsKodepos };
if (require.main === module) cli();
