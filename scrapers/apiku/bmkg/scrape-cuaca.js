#!/usr/bin/env node
'use strict';

/**
 * Name : Prakiraan Cuaca BMKG via ApiKu
 * Creator : lmavour
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Mengambil prakiraan cuaca BMKG menurut kode administrasi desa atau kelurahan.
 * Note : node scrapers/apiku/bmkg/scrape-cuaca.js --adm4 31.71.03.1001
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/bmkg/cuaca';
const { scrape: cuaca, cli } = apikuEndpoint(ENDPOINT, {
  params: { adm4: { required: true, pattern: /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/ } },
  mapData: ({ data }) => data && { ...data, attribution: 'BMKG - https://data.bmkg.go.id/prakiraan-cuaca/' },
  validateData: (data, { adm4 }) => data.lokasi?.adm4 === adm4 && Array.isArray(data.data) && data.data.some((block) =>
    Array.isArray(block?.cuaca) && block.cuaca.flat().some((entry) => hasText(entry?.datetime) && Number.isFinite(entry.t)))
});

module.exports = { cuaca };
if (require.main === module) cli();
