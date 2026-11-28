#!/usr/bin/env node
'use strict';

/**
 * Name : WikSter Wikipedia to PDF
 * Creator : lmavour
 * Source : https://freeapi.pro/wikipdf#api
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Mengambil PDF Base64 dari judul artikel Wikipedia bahasa Inggris.
 * Note : node scrapers/freeapi/scrape-wikipdf.js --query "Example.com"
 */

const { request, text, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/wikipdf';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-wikipdf.js --query <judul artikel>';

async function freeapiWikiPdf(options = {}) {
  try {
    const query = text(options.query, 'Judul artikel', 200);
    const { buffer, contentType } = await request(urlWithParams(ENDPOINT, { query }), {
      timeout: options.timeout ?? 45000, interval: 1800, format: 'binary', headers: { Accept: 'application/pdf' }, redirect: 'error'
    });
    if (contentType !== 'application/pdf' || !/^%PDF-[12]\.\d[\r\n]/.test(buffer.toString('latin1', 0, 9)) ||
      !buffer.subarray(-1024).toString('latin1').trimEnd().endsWith('%%EOF')) {
      throw new Error('WikSter tidak mengembalikan PDF yang valid');
    }
    return {
      status: true, source: SOURCE, endpoint: 'wikipdf', attribution: 'Wikipedia; ikuti lisensi pada artikel dan medianya',
      data: { query, mimeType: contentType, base64: buffer.toString('base64') }
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiWikiPdf };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiWikiPdf(args);
}, ['query']);
