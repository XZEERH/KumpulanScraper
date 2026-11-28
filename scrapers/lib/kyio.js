'use strict';

let sharedApiKey;

function validApiKey(key) {
  if (typeof key !== 'string' || !/^[\x21-\x7e]+$/.test(key.trim())) {
    throw new Error('Atur KYIO_API_KEY atau panggil setKyioApiKey dengan kunci yang valid');
  }
  return key.trim();
}

function setKyioApiKey(key) {
  sharedApiKey = key == null ? undefined : validApiKey(key);
}

function kyioHeaders(url) {
  if (new URL(url).origin !== 'https://api.kyio.web.id') {
    throw new Error('Kunci Kyio hanya boleh dikirim ke api.kyio.web.id');
  }
  return { 'x-api-key': sharedApiKey ?? validApiKey(process.env.KYIO_API_KEY) };
}

module.exports = { kyioHeaders, setKyioApiKey };
