#!/usr/bin/env node
'use strict';

/**
 * Name : QuickChart QR Code
 * Creator : lmavour
 * Source : https://quickchart.io/documentation/qr-codes/
 * Base Web : https://quickchart.io
 * Type : Scraper
 * Description : Menghasilkan QR PNG Base64; teks dikirim ke penyedia, jangan gunakan data rahasia.
 * Note : node scrapers/kangwifi/info/scrape-qr-api.js --text "Contoh KumpulanScraperv2" --size 200
 */

const { request, text, integer, urlWithParams, imageData, failure, runOptionsCLI } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://quickchart.io/qr';
const SOURCE = 'quickchart';

async function qrCode(options = {}) {
  try {
    const input = text(options.text, 'Teks QR', 400);
    const size = integer(options.size, 200, 80, 600, 'Ukuran');
    const margin = integer(options.margin, 2, 0, 10, 'Margin');
    const payload = await request(urlWithParams(ENDPOINT, { text: input, size, margin, format: 'png' }), {
      timeout: options.timeout, interval: 1000, redirect: 'error', format: 'binary', headers: { Accept: 'image/png' }
    });
    const data = payload.contentType === 'image/png' && imageData(payload);
    if (!data) throw new Error('QuickChart tidak mengembalikan PNG yang valid');
    return { status: true, source: SOURCE, data };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { qrCode };
if (require.main === module) runOptionsCLI(SOURCE, '--text <teks publik> [--size 200] [--margin 2]', qrCode, ['text', 'size', 'margin']);
