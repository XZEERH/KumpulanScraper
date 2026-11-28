#!/usr/bin/env node
'use strict';

/**
 * Name : SpeechSter Text to Speech
 * Creator : lmavour
 * Source : https://freeapi.pro/speech#api
 * Base Web : https://freeapi.pro
 * Type : Scraper
 * Description : Mengubah satu potongan teks menjadi MP3 Base64 untuk penggunaan nonkomersial.
 * Note : node scrapers/freeapi/scrape-tts.js --text "Hello, world!" --voiceIndex 1
 */

const { request, text, integer, failure, runCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://freeapi.pro/api/tts';
const SOURCE = 'freeapi';
const USAGE = 'Usage: node scrapers/freeapi/scrape-tts.js --text <teks> (--voiceIndex <indeks> | --voice <id/nama>) [--pitch 0] [--rate 0]';

function hasMp3Frame(buffer) {
  let offset = 0;
  if (buffer.toString('ascii', 0, 3) === 'ID3') {
    if (buffer.length < 10) return false;
    const size = buffer.subarray(6, 10);
    if (size.some((byte) => byte > 127)) return false;
    offset = 10 + size.reduce((value, byte) => (value << 7) | byte, 0);
    if (buffer[3] === 4 && (buffer[5] & 16)) offset += 10;
  }
  const [first, second, third] = buffer.subarray(offset, offset + 3);
  return buffer.length > offset + 4 && first === 0xff && (second & 0xe6) === 0xe2 && (second & 0x18) !== 0x08 &&
    (third & 0xf0) !== 0 && (third & 0xf0) !== 0xf0 && (third & 0x0c) !== 0x0c;
}

async function freeapiTts(options = {}) {
  try {
    const input = text(options.text, 'Teks', 1950);
    if ((options.voice === undefined) === (options.voiceIndex === undefined)) {
      throw new Error('Tentukan salah satu dari voiceIndex atau voice');
    }
    const voice = options.voice === undefined
      ? { voiceIndex: integer(options.voiceIndex, NaN, 1, Number.MAX_SAFE_INTEGER, 'voiceIndex') }
      : { voice: text(options.voice, 'Suara', 100) };
    const pitch = integer(options.pitch, 0, -100, 100, 'Pitch');
    const rate = integer(options.rate, 0, -100, 100, 'Rate');
    const { buffer, contentType } = await request(ENDPOINT, {
      timeout: options.timeout ?? 45000, format: 'binary', headers: { Accept: 'audio/mpeg' }, interval: 1800,
      jsonBody: { ...voice, text: input, pitch, rate }
    });
    if (contentType !== 'audio/mpeg' || !hasMp3Frame(buffer)) throw new Error('SpeechSter tidak mengembalikan MP3 yang valid');
    return { status: true, source: SOURCE, endpoint: 'tts', data: { mimeType: contentType, base64: buffer.toString('base64') } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { freeapiTts };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => {
  if (args._.length) throw new Error(USAGE);
  return freeapiTts(args);
}, ['text', 'voiceIndex', 'voice', 'pitch', 'rate']);
