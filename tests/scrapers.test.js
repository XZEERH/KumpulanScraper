'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const { join, relative, sep } = require('node:path');
const { request, integer, isoDate, imageEndpoint } = require('../scrapers/lib/scraper-utils');

const root = join(__dirname, '..');
const childOptions = { cwd: root, encoding: 'utf8', timeout: 10000 };

const modules = [
  ['scrape-equran.js', 'equran'], ['scrape-aladhan.js', 'aladhan'], ['scrape-anilist.js', 'anilist'],
  ['scrape-frankfurter.js', 'frankfurter'], ['scrape-steam.js', 'steam'],
  ['scrape-openmeteo.js', 'openmeteo'], ['scrape-bluesky.js', 'bluesky'],
  ['scrape-jikan.js', 'jikan'], ['scrape-googlenews.js', 'googleNews'],
  ['scrape-openlibrary.js', 'openlibrary'], ['scrape-itunes.js', 'itunes'],
  ['scrape-mangadex.js', 'mangadex'], ['scrape-githubtrending.js', 'githubTrending'],
  ['scrape-harilibur.js', 'hariLibur'], ['scrape-npm.js', 'npmScraper'],
  ['scrape-hackernews.js', 'hackernews'], ['scrape-openfoodfacts.js', 'openfoodfacts'],
  ['scrape-wayback.js', 'wayback'], ['scrape-gempa-global.js', 'gempaGlobal'], ['scrape-statistik-negara.js', 'statistikNegara'],
  ['scrape-geocoding.js', 'geocoding'], ['scrape-foto-angkasa.js', 'fotoAngkasa'], ['scrape-berita-angkasa.js', 'beritaAngkasa']
].map(([file, name]) => [`scrapers/integrations/${file}`, name]).concat([
  ['scrapers/wilayah/scrape-provinsi.js', 'daftarProvinsi'], ['scrapers/wilayah/scrape-kabupaten.js', 'daftarKabupaten'],
  ['scrapers/wilayah/scrape-kecamatan.js', 'daftarKecamatan'], ['scrapers/wilayah/scrape-desa.js', 'daftarDesa'],
  ['scrapers/freeapi/scrape-voices.js', 'freeapiVoices'],
  ['scrapers/freeapi/scrape-tts.js', 'freeapiTts'],
  ['scrapers/freeapi/scrape-hand.js', 'freeapiHand'],
  ['scrapers/freeapi/scrape-wikipdf.js', 'freeapiWikiPdf'],
  ['scrapers/freeapi/scrape-tti.js', 'freeapiTextToImage'],
  ['scrapers/freeapi/scrape-medster-search.js', 'freeapiMedicineSearch']
], [
  ['search/wikipedia', 'wikipedia'], ['search/appstore', 'appstore'], ['tools/gempa', 'gempa'], ['tools/bmkg-cuaca', 'bmkgCuaca'],
  ['info/arxiv', 'arxiv'], ['info/crossref', 'crossref'], ['info/dictionary', 'dictionary'], ['info/holidays', 'holidays'],
  ['info/dog-ceo', 'dogImages'], ['info/cat-facts', 'catFacts'], ['info/dog-facts', 'dogFacts'], ['info/advice', 'advice'],
  ['info/affirmation', 'affirmation'], ['info/useless-fact', 'uselessFact'], ['info/joke', 'joke'], ['info/pokemon', 'pokemon'],
  ['info/pokemon-list', 'pokemonList'], ['info/rickandmorty', 'rickAndMorty'], ['info/swapi', 'starWars'], ['info/tv-maze', 'tvMaze'],
  ['info/xkcd', 'xkcd'], ['info/exchangerate', 'exchangeRate'], ['info/qr-api', 'qrCode'], ['info/iss-location', 'issLocation']
].map(([route, name]) => {
  const [category, file] = route.split('/');
  return [`scrapers/kangwifi/${category}/scrape-${file}.js`, name];
}));
const siputzxRoot = 'scrapers/siputzx';
const categoryFolders = { d: 'downloader', m: 'maker', r: 'random', s: 'search' };
const siputzxFiles = readdirSync(join(root, siputzxRoot), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap(({ name }) => readdirSync(join(root, siputzxRoot, name))
    .filter((file) => /^scrape-.+\.js$/.test(file))
    .map((file) => `${siputzxRoot}/${name}/${file}`))
  .sort();
const apikuRoot = 'scrapers/apiku';
const apikuFiles = readdirSync(join(root, apikuRoot), { withFileTypes: true, recursive: true })
  .filter((entry) => entry.isFile() && /^scrape-.+\.js$/.test(entry.name))
  .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/')).sort();
const entryPoints = [...modules, ...siputzxFiles.map((file) => [file]), ...apikuFiles.map((file) => [file])];
const api = {};
const nativeFetch = global.fetch;
const networkBlock = 'data:text/javascript,' + encodeURIComponent(
  "let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('NETWORK_DISABLED');}; process.on('beforeExit',()=>{if(calls)process.exitCode=99;});"
);

before(() => {
  global.fetch = async () => { throw new Error('Network disabled in offline tests'); };
  for (const [file, name] of modules) api[name] = require(join(root, file))[name];
});
after(() => { global.fetch = nativeFetch; });

function mockHTTP(t, resolver) {
  const previous = global.fetch;
  const calls = [];
  global.fetch = async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    assert.match(options.headers['User-Agent'], /KumpulanScraperv2/);
    assert.equal(options.headers.Cookie, undefined);
    for (const name of url.searchParams.keys()) assert.doesNotMatch(name, /api_?key|access_token/i);
    if (options.headers.Authorization) {
      assert.equal(url.origin, 'https://world.openfoodfacts.net');
      assert.equal(options.headers.Authorization, `Basic ${Buffer.from('off:off').toString('base64')}`);
    }
    const body = await resolver(url, options);
    return body instanceof Response ? body : new Response(typeof body === 'string' ? body : JSON.stringify(body));
  };
  t.after(() => { global.fetch = previous; });
  return calls;
}

test('all new modules import without requests, output, or automatic CLI execution', () => {
  const code = `for(const file of ${JSON.stringify(entryPoints.map(([file]) => `./${file}`))}) require(file); process.stdout.write('OK');`;
  const child = spawnSync(process.execPath, ['--import', networkBlock, '-e', code], childOptions);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, 'OK');
});

test('CLI treats --help after the -- separator as literal input', () => {
  const code = "process.argv=['node','test','--','--help'];require('./scrapers/lib/scraper-utils').runCLI('test','Usage: test',async args=>({status:true,value:args._[0]}));";
  const child = spawnSync(process.execPath, ['--import', networkBlock, '-e', code], childOptions);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(JSON.parse(child.stdout).value, '--help');
});

for (const [file, name] of entryPoints) {
  test(`${file}: syntax, export, help, and unknown flags`, () => {
    if (name) assert.equal(typeof api[name], 'function');
    else assert.deepEqual(Object.values(require(join(root, file))).map((value) => typeof value), ['function']);
    const checked = spawnSync(process.execPath, ['--check', file], childOptions);
    assert.equal(checked.status, 0, checked.stderr);
    const help = spawnSync(process.execPath, ['--import', networkBlock, file, '--help'], childOptions);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage:/);
    assert.ok(help.stdout.includes(`node ${file}`));
    if (file.startsWith(`${siputzxRoot}/`)) {
      const endpoint = help.stdout.match(/^Endpoint: ([^\r\n]+)$/m)?.[1];
      assert.ok(endpoint);
      const [group, ...segments] = endpoint.split('/');
      const slug = segments.join('-').replace(/_/g, '-').replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      assert.equal(file, `${siputzxRoot}/${categoryFolders[group] ?? group}/scrape-${slug}.js`);
      const code = readFileSync(join(root, file), 'utf8');
      const header = code.match(/\/\*\*([\s\S]*?)\*\//)?.[1];
      assert.ok(header);
      for (const field of ['Name', 'Source', 'Base Web', 'Description']) {
        assert.match(header, new RegExp(`^ \\* ${field} : \\S`, 'm'));
      }
      assert.match(header, /^ \* Creator : lmavour$/m);
      assert.match(header, /^ \* Type : Scraper$/m);
      assert.ok(header.includes(` * Note : node ${file}`));
      assert.ok(code.includes(`const ENDPOINT = 'https://api.siputzx.my.id/api/${endpoint}';`));
      assert.ok(code.includes("require('../../lib/scraper-utils')"));
    } else if (file.startsWith(`${apikuRoot}/`)) {
      const endpoint = help.stdout.match(/^Endpoint: ([^\r\n]+)$/m)?.[1];
      assert.ok(endpoint?.startsWith('v1/'));
      const code = readFileSync(join(root, file), 'utf8');
      assert.ok(code.includes(`const ENDPOINT = 'https://apiku.irengcloud.com/api/${endpoint}';`));
      assert.ok(code.includes(` * Note : node ${file}`));
    }
    const bad = spawnSync(process.execPath, ['--import', networkBlock, file, '--unknown'], childOptions);
    assert.equal(bad.status, 1);
    assert.match(JSON.parse(bad.stdout).message, /Opsi tidak dikenal/);
  });
}

test('ApiKu files use distinct endpoints and keep the provider name in the folder', () => {
  assert.ok(apikuFiles.length >= 41);
  const endpoints = new Set();
  for (const file of apikuFiles) {
    assert.doesNotMatch(file, /\/scrape-(?:apiku|irengcloud)-/i);
    const endpoint = readFileSync(join(root, file), 'utf8').match(/^const ENDPOINT = '(https:\/\/apiku\.irengcloud\.com\/api\/v1\/[^']+)';$/m)?.[1];
    assert.ok(endpoint);
    assert.ok(!endpoints.has(endpoint), endpoint);
    endpoints.add(endpoint);
  }
});

test('ApiKu validates templated route parameters and does not forward them as query parameters', async (t) => {
  const { haditsDetail } = require('../scrapers/apiku/hadits/scrape-detail');
  const calls = mockHTTP(t, () => ({ success: true, data: { imam: 'bukhari', number: 1, terjemahan: 'Contoh teks.' } }));
  assert.equal((await haditsDetail({ imam: '../books', number: 1 })).status, false);
  assert.equal((await haditsDetail({ imam: 'bukhari', number: '1/2' })).status, false);
  assert.equal(calls.length, 0);
  const result = await haditsDetail({ imam: 'BUKHARI', number: '1', extra: 'not sent' });
  assert.equal(result.status, true);
  assert.equal(result.endpoint, 'v1/hadits/{imam}/{number}');
  assert.equal(result.data.number, 1);
  assert.equal(calls[0].url.href, 'https://apiku.irengcloud.com/api/v1/hadits/bukhari/1');
  assert.equal(calls[0].options.redirect, 'error');
});

test('ApiKu handles both documented success envelopes without trusting an explicit failure', async (t) => {
  const { tvSchedule } = require('../scrapers/apiku/tv/scrape-schedule');
  const { latinToJawa } = require('../scrapers/apiku/aksara/scrape-latin-to-jawa');
  const output = '\ua9b1\ua9b8\ua992\ua9bc\ua981';
  let reject = false;
  const calls = mockHTTP(t, (url) => url.pathname.endsWith('/tv/schedule')
    ? { status: 'success', success: reject ? false : undefined, data: [{ time: '07:30', event: 'Contoh' }] }
    : { success: true, input: 'Sugeng', output });
  assert.equal((await tvSchedule({ channel: 'SCTV', cache: false })).data.programs[0].event, 'Contoh');
  assert.equal(calls[0].url.searchParams.get('channel'), 'sctv');
  assert.deepEqual((await latinToJawa({ text: 'Sugeng', murda: 'false' })).data, { input: 'Sugeng', output });
  assert.equal(calls[1].url.searchParams.get('murda'), 'false');
  reject = true;
  assert.equal((await tvSchedule({ channel: 'SCTV', cache: false })).status, false);
});

test('ApiKu requires a search term and strips tracking from approved URL inputs', async (t) => {
  const { lirikSearch } = require('../scrapers/apiku/lirik/scrape-search');
  const { khutbahDetail } = require('../scrapers/apiku/islami/scrape-khutbah-detail');
  const target = 'https://mui.or.id/baca/khutbah/contoh';
  const calls = mockHTTP(t, (url) => url.pathname.endsWith('/khutbah/detail')
    ? { success: true, data: { title: 'Contoh', url: target, paragraphs: ['Teks contoh.'] } }
    : { success: true, data: [] });
  assert.equal((await lirikSearch({})).status, false);
  assert.equal((await khutbahDetail({ url: 'https://mui.or.id.example.test/baca/khutbah/contoh' })).status, false);
  assert.equal((await khutbahDetail({ url: 'https://mui.or.id/redirect' })).status, false);
  assert.equal(calls.length, 0);
  assert.equal((await khutbahDetail({ url: `${target}?utm_test=1#heading` })).data.paragraphs[0], 'Teks contoh.');
  assert.equal(calls[0].url.searchParams.get('url'), target);
  assert.deepEqual((await lirikSearch({ judul: 'Judul & Contoh' })).data, []);
  assert.equal(calls[1].url.searchParams.get('judul'), 'Judul & Contoh');
});

test('ApiKu returns allowlisted media metadata without fetching assets or dropping video attribution', async (t) => {
  const { tiktok2 } = require('../scrapers/apiku/downloader/scrape-tiktok2');
  const { komikuDetail } = require('../scrapers/apiku/manga/komiku/scrape-detail');
  const watermarkUrl = 'https://f2b.snaptik.fit/demo.mp4';
  const calls = mockHTTP(t, (url) => url.pathname.endsWith('/tiktok2')
    ? { success: true, watermarkUrl, videoUrl: 'https://example.test/unmarked.mp4', author: { privateField: 'fixture' } }
    : { success: true, data: { title: 'Contoh', chapters: [{ url: 'https://example.test/chapter' }], thumb: 'https://example.test/proxy' } });
  const video = await tiktok2({ url: 'https://www.tiktok.com/@demo/video/1' });
  assert.equal(video.status, true);
  assert.equal(video.data.videoUrl, watermarkUrl);
  assert.equal(video.data.author, undefined);
  const comic = await komikuDetail({ slug: 'contoh' });
  assert.equal(comic.data.chapterCount, 1);
  assert.equal(comic.data.chapters, undefined);
  assert.equal(comic.data.thumb, undefined);
  assert.equal(calls.length, 2);
});

const kangwifiFixtures = [
  ['wikipedia', { q: 'Indonesia & Asia' }, 'id.wikipedia.org/w/rest.php/v1/search/page',
    { pages: [{ id: 5, key: 'Indonesia', title: 'Indonesia', excerpt: '<b>Indonesia</b> &amp; Asia' }] },
    (data, url) => {
      assert.equal(data.results[0].excerpt, 'Indonesia & Asia');
      assert.equal(url.searchParams.get('q'), 'Indonesia & Asia');
    }],
  ['appstore', { query: 'Keynote', country: 'id' }, 'itunes.apple.com/search',
    { results: [{ trackId: 1, trackName: 'Keynote', formattedPrice: 'Free', trackViewUrl: 'https://apps.apple.com/id/app/keynote/id1' }] },
    (data, url) => {
      assert.equal(data.results[0].name, 'Keynote');
      assert.equal(url.searchParams.get('media'), 'software');
      assert.equal(url.searchParams.get('country'), 'ID');
    }],
  ['gempa', {}, 'data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
    { Infogempa: { gempa: { DateTime: '2026-11-26T00:00:00Z', Wilayah: 'Contoh', Magnitude: '5.1', Shakemap: 'demo.mmi.jpg' } } },
    (data) => {
      assert.equal(data.magnitude, 5.1);
      assert.equal(data.shakemap, 'https://data.bmkg.go.id/DataMKG/TEWS/demo.mmi.jpg');
    }],
  ['bmkgCuaca', { adm4: '31.71.03.1001' }, 'api.bmkg.go.id/publik/prakiraan-cuaca',
    { lokasi: { adm4: '31.71.03.1001' }, data: [{ cuaca: [[{ datetime: '2026-11-26T00:00:00Z', weather_desc: 'Cerah', t: 27 }]] }] },
    (data, url) => {
      assert.equal(data.forecasts[0].temperatureC, 27);
      assert.equal(url.searchParams.get('adm4'), data.location.adm4);
    }],
  ['arxiv', { q: 'machine learning', limit: 1 }, 'export.arxiv.org/api/query',
    '<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/2601.00001v1</id><title> Demo   paper </title><author><name>A. Example</name></author><link title="pdf" href="https://arxiv.org/pdf/2601.00001v1" /></entry></feed>',
    (data, url) => {
      assert.equal(data.results[0].url, 'https://arxiv.org/abs/2601.00001v1');
      assert.equal(data.results[0].title, 'Demo paper');
      assert.deepEqual(data.results[0].authors, ['A. Example']);
      assert.equal(url.searchParams.get('search_query'), 'all:"machine learning"');
    }],
  ['crossref', { q: 'machine learning' }, 'api.crossref.org/works',
    { status: 'ok', message: { items: [{ DOI: '10.5555/1', title: ['Demo'], published: { 'date-parts': [[2020]] } }] } },
    (data, url) => {
      assert.equal(data.results[0].doi, '10.5555/1');
      assert.deepEqual(data.results[0].published, [2020]);
      assert.equal(url.searchParams.get('query.bibliographic'), 'machine learning');
    }],
  ['dictionary', { word: 'Hello' }, 'api.dictionaryapi.dev/api/v2/entries/en/hello',
    [{ word: 'hello', meanings: [{ partOfSpeech: 'interjection', definitions: [{ definition: 'A greeting.' }] }] }],
    (data) => assert.equal(data.entries[0].meanings[0].definitions[0].text, 'A greeting.')],
  ['holidays', { country: 'id', year: 2026 }, 'date.nager.at/api/v3/PublicHolidays/2026/ID',
    [{ countryCode: 'ID', date: '2026-01-01', localName: 'Tahun Baru', global: true }], (data) => assert.ok(data.results[0].national)],
  ['dogImages', { breed: 'retriever/golden', count: 1 }, 'dog.ceo/api/breed/retriever/golden/images/random/1',
    { status: 'success', message: ['https://images.dog.ceo/demo.jpg', 'https://images.dog.ceo.example.test/fake.jpg'] },
    (data) => assert.deepEqual(data.images, ['https://images.dog.ceo/demo.jpg'])],
  ['catFacts', { count: 1 }, 'catfact.ninja/facts', { data: [{ fact: 'Example fact.' }] },
    (data, url) => {
      assert.deepEqual(data.facts, ['Example fact.']);
      assert.equal(url.searchParams.get('limit'), '1');
    }],
  ['dogFacts', {}, 'dogapi.dog/api/v2/facts', { data: [{ attributes: { body: 'Example fact.' } }] },
    (data) => assert.deepEqual(data.facts, ['Example fact.'])],
  ['advice', { id: 42 }, 'api.adviceslip.com/advice/42', { slip: { id: 42, advice: 'Example advice.' } },
    (data) => assert.equal(data.id, 42)],
  ['affirmation', {}, 'www.affirmations.dev/', { affirmation: 'Example affirmation.' },
    (data) => assert.equal(data.affirmation, 'Example affirmation.')],
  ['uselessFact', { lang: 'de' }, 'uselessfacts.jsph.pl/api/v2/facts/random', { id: '1', text: 'Beispiel.', language: 'de' },
    (data, url) => {
      assert.equal(data.text, 'Beispiel.');
      assert.equal(url.searchParams.get('language'), 'de');
    }],
  ['joke', {}, 'v2.jokeapi.dev/joke/Programming', { error: false, id: 1, safe: true, setup: 'Question?', delivery: 'Answer.' },
    (data, url) => {
      assert.equal(data.punchline, 'Answer.');
      assert.ok(url.searchParams.has('safe-mode'));
    }],
  ['pokemon', { name: 'PIKACHU' }, 'pokeapi.co/api/v2/pokemon/pikachu',
    { id: 25, name: 'pikachu', types: [{ type: { name: 'electric' } }], abilities: [], stats: [{ stat: { name: 'speed' }, base_stat: 90 }] },
    (data) => {
      assert.deepEqual(data.types, ['electric']);
      assert.equal(data.stats.speed, 90);
    }],
  ['pokemonList', { limit: 1, offset: 1 }, 'pokeapi.co/api/v2/pokemon/',
    { count: 200, next: 'https://pokeapi.co/api/v2/pokemon/?offset=2', results: [{ name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' }] },
    (data, url) => {
      assert.equal(data.nextOffset, 2);
      assert.equal(data.results[0].name, 'ivysaur');
      assert.equal(url.searchParams.get('offset'), '1');
    }],
  ['rickAndMorty', { name: 'Rick' }, 'rickandmortyapi.com/api/character',
    { info: { count: 1 }, results: [{ id: 1, name: 'Rick', origin: { name: 'Earth' } }] }, (data) => assert.equal(data.results[0].origin, 'Earth')],
  ['starWars', { type: 'planets', name: 'Tatooine' }, 'www.swapi.tech/api/planets',
    { result: [{ uid: '1', properties: { name: 'Tatooine' } }] }, (data) => assert.equal(data.results[0].name, 'Tatooine')],
  ['tvMaze', { q: 'Sherlock', limit: 1 }, 'api.tvmaze.com/search/shows',
    [{ show: { id: 1, name: 'Sherlock', summary: '<p>Example &amp; text.</p>' } }],
    (data) => assert.equal(data.results[0].summary, 'Example & text.')],
  ['xkcd', { id: 614 }, 'xkcd.com/614/info.0.json', { num: 614, title: 'Demo', img: 'https://imgs.xkcd.com/comics/demo.png' },
    (data) => assert.equal(data.url, 'https://xkcd.com/614/')],
  ['exchangeRate', { base: 'usd', target: 'idr', amount: '3' }, 'open.er-api.com/v6/latest/USD',
    { result: 'success', base_code: 'USD', rates: { IDR: 15000, EUR: 1 } },
    (data) => {
      assert.equal(data.converted, 45000);
      assert.equal(data.rates, undefined);
    }],
  ['qrCode', { text: 'A & B' }, 'quickchart.io/qr',
    () => new Response(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64'),
      { headers: { 'Content-Type': 'image/png' } }), (data, url) => {
    assert.equal(data.mimeType, 'image/png');
    assert.equal(url.searchParams.get('text'), 'A & B');
  }],
  ['issLocation', {}, 'api.wheretheiss.at/v1/satellites/25544', { id: 25544, latitude: 0, longitude: 12, timestamp: 1795700000 },
    (data) => assert.equal(data.latitude, 0)]
];

for (const [name, input, endpoint, payload, verify] of kangwifiFixtures) {
  test(`Kangwifi ${name}: validates the public source response`, async (t) => {
    const calls = mockHTTP(t, () => typeof payload === 'function' ? payload() : payload);
    const result = await api[name]({ ...input, cache: false });
    assert.equal(result.status, true, result.message);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.origin + calls[0].url.pathname, `https://${endpoint}`);
    assert.equal(calls[0].options.redirect, 'error');
    verify(result.data, calls[0].url);
  });
}

test('Kangwifi rejects unknown providers and invalid path, limit, and query inputs without a request', async (t) => {
  const calls = mockHTTP(t, () => assert.fail('Request must not happen'));
  for (const [name, input] of [
    ['wikipedia', { q: 'Example', lang: 'example.org' }], ['pokemon', { name: '../item/1' }],
    ['dogImages', { breed: '../test' }], ['appstore', { query: 'Example', limit: 21 }],
    ['arxiv', { q: '" OR ti:*' }], ['bmkgCuaca', { adm4: '31.71' }], ['qrCode', { text: 'Demo', size: 900 }]
  ]) assert.equal((await api[name](input)).status, false);
  assert.equal(calls.length, 0);
});

for (const [name, path, level, kode, code] of [
  ['daftarProvinsi', 'provinces.json', 1, undefined, '31'],
  ['daftarKabupaten', 'regencies/31.json', 2, '31', '31.71'],
  ['daftarKecamatan', 'districts/31.71.json', 3, '31.71', '31.71.03'],
  ['daftarDesa', 'villages/31.71.03.json', 4, '31.71.03', '31.71.03.1001']
]) {
  test(`Public API ${name}: reads the expected administrative level`, async (t) => {
    const regions = [{ code, name: 'Contoh' }];
    const calls = mockHTTP(t, () => ({ data: regions, meta: { administrative_area_level: level, updated_at: '2025-07-04' } }));
    const result = await api[name]({ kode, cache: false });
    assert.equal(result.status, true, result.message);
    assert.deepEqual(result.data, { regions, updatedAt: '2025-07-04' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.href, `https://wilayah.id/api/${path}`);
  });
}

test('Public API Wilayah.id rejects records from a different parent region', async (t) => {
  mockHTTP(t, () => ({ data: [{ code: '31.71.02.1001', name: 'Other district' }], meta: { administrative_area_level: 4 } }));
  assert.equal((await api.daftarDesa({ kode: '31.71.03', cache: false })).status, false);
});

test('Public API USGS reads longitude, latitude, and depth in GeoJSON order', async (t) => {
  const point = {
    id: 'event', properties: { type: 'earthquake', mag: 5, time: 1795730237000, url: 'https://earthquake.usgs.gov/earthquakes/eventpage/event' },
    geometry: { type: 'Point', coordinates: [107.5, -6.9, 21] }
  };
  const calls = mockHTTP(t, () => ({ type: 'FeatureCollection', features: [{ ...point, geometry: { type: 'Point', coordinates: [200, 0, 0] } }, point] }));
  const result = await api.gempaGlobal({ limit: 1 });
  assert.equal(result.status, true, result.message);
  assert.equal(result.data.events.length, 1);
  const { longitude, latitude, depthKm, dateTime } = result.data.events[0];
  assert.deepEqual([longitude, latitude, depthKm, dateTime], [107.5, -6.9, 21, new Date(point.properties.time).toISOString()]);
  assert.match(calls[0].url.pathname, /\/4\.5_week\.geojson$/);
});

test('Public API World Bank preserves zero and unavailable annual values', async (t) => {
  const row = { indicator: { id: 'SP.POP.TOTL' }, country: { value: 'Indonesia' }, countryiso3code: 'IDN' };
  const calls = mockHTTP(t, () => [{ total: 2 }, [{ ...row, date: '2024', value: 0 }, { ...row, date: '2023', value: null }]]);
  const result = await api.statistikNegara({ country: 'idn', indicator: 'sp.pop.totl', from: 2023, to: 2024, limit: 2 });
  assert.equal(result.status, true, result.message);
  assert.deepEqual(result.data.results, [{ year: 2024, value: 0 }, { year: 2023, value: null }]);
  assert.equal(calls[0].url.pathname, '/v2/country/IDN/indicator/SP.POP.TOTL');
  assert.equal(calls[0].url.searchParams.get('date'), '2023:2024');
  assert.ok(!calls[0].url.searchParams.has('mrnev'));
  await api.statistikNegara({ limit: 2 });
  assert.equal(calls[1].url.searchParams.get('mrnev'), '2');
  assert.ok(!calls[1].url.searchParams.has('date'));
});

test('Public API geocoding keeps coordinates and accepts the documented empty result', async (t) => {
  const calls = mockHTTP(t, (url) => url.searchParams.get('name') === 'Bandung'
    ? { results: [{ id: 1650357, name: 'Kota Bandung', country_code: 'ID', latitude: -6.92, longitude: 107.61, timezone: 'Asia/Jakarta' }] }
    : { generationtime_ms: 0.5 });
  const result = await api.geocoding({ name: 'Bandung', country: 'id', limit: '1' });
  assert.equal(result.status, true, result.message);
  assert.deepEqual(result.data.results.map(({ latitude, longitude, timezone }) => [latitude, longitude, timezone]), [[-6.92, 107.61, 'Asia/Jakarta']]);
  assert.equal(calls[0].url.searchParams.get('countryCode'), 'ID');
  assert.equal(calls[0].url.searchParams.get('count'), '1');
  const empty = await api.geocoding({ name: 'No Match' });
  assert.equal(empty.status, true, empty.message);
  assert.deepEqual(empty.data.results, []);
});

test('Public API NASA returns only NASA preview links, without fetching assets', async (t) => {
  const preview = 'https://images-assets.nasa.gov/image/sample/sample~medium.jpg';
  const calls = mockHTTP(t, () => ({ collection: { items: [{
    data: [{ media_type: 'image', nasa_id: 'sample', title: 'Sample' }], links: [
      { render: 'image', href: 'https://images-assets.nasa.gov.example.test/fake.jpg' }, { render: 'image', href: preview }
    ]
  }] } }));
  const result = await api.fotoAngkasa({ q: 'Moon & Earth', limit: 1 });
  assert.equal(result.status, true, result.message);
  assert.equal(result.data.results[0].preview, preview);
  assert.equal(result.data.results[0].url, 'https://images.nasa.gov/details/sample');
  assert.equal(calls.length, 1);
  assert.deepEqual([...calls[0].url.searchParams], [['q', 'Moon & Earth'], ['media_type', 'image'], ['page_size', '1'], ['page', '1']]);
});

test('Public API Spaceflight News returns original article metadata and a numeric page offset', async (t) => {
  const calls = mockHTTP(t, () => ({ count: 10, next: 'https://api.spaceflightnewsapi.net/v4/articles/?offset=4', results: [
    { id: 1, title: 'Demo launch', url: 'https://example.test/news', news_site: 'Example' }, { id: 2, title: 'Invalid source', url: 'http://example.test/news' }
  ] }));
  const result = await api.beritaAngkasa({ q: 'Lunar launch', limit: 2, offset: 2 });
  assert.equal(result.status, true, result.message);
  assert.equal(result.data.nextOffset, 4);
  assert.deepEqual(result.data.results.map(({ publisher, url }) => [publisher, url]), [['Example', 'https://example.test/news']]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.searchParams.get('search'), 'Lunar launch');
});

test('Public API wrappers validate codes, ranges, limits and pagination before requesting data', async (t) => {
  const calls = mockHTTP(t, () => assert.fail('Request must not happen'));
  for (const [name, input] of [
    ['daftarKabupaten', { kode: '31.71' }], ['daftarKecamatan', { kode: '../31' }], ['daftarDesa', { kode: '31.71' }],
    ['statistikNegara', { from: 2024, to: 2020 }], ['statistikNegara', { from: 2020 }],
    ['gempaGlobal', { limit: 51 }], ['geocoding', { name: 'A, ID' }], ['geocoding', { name: 'Bandung', country: 'IDN' }],
    ['fotoAngkasa', { q: 'Moon', page: 0 }], ['beritaAngkasa', { offset: -1 }]
  ]) assert.equal((await api[name](input)).status, false);
  assert.equal(calls.length, 0);
});

test('FreeAPI voices filters by locale and limits results without sending filter parameters', async (t) => {
  const voice = { index: 1, id: 'voice-1', name: 'Demo', language: 'Indonesian', edgeVoice: 'id-ID-DemoNeural' };
  const calls = mockHTTP(t, () => ({ success: true, voices: [
    voice, { ...voice, index: 2, id: 'voice-2' }, { ...voice, index: 3, id: 'voice-3', language: 'English', edgeVoice: 'en-US-DemoNeural' },
    { index: -1 }
  ] }));
  assert.equal((await api.freeapiVoices({ limit: 0 })).status, false);
  assert.equal(calls.length, 0);
  const result = await api.freeapiVoices({ language: 'ID-id', limit: '1' });
  assert.equal(result.status, true);
  assert.equal(result.data.total, 2);
  assert.deepEqual(result.data.voices.map((item) => item.id), ['voice-1']);
  assert.equal(calls[0].url.href, 'https://freeapi.pro/api/voices');
});

test('FreeAPI TTS checks voice selection, sends JSON, and rejects mislabeled audio', async (t) => {
  const mp3 = Buffer.concat([Buffer.from('49443304000000000000fff364c4', 'hex'), Buffer.alloc(140)]);
  let body = mp3;
  const calls = mockHTTP(t, () => new Response(body, { headers: { 'Content-Type': 'audio/mpeg' } }));
  for (const input of [{}, { voice: 'Demo', voiceIndex: 1 }, { voiceIndex: 1, pitch: 101 }]) {
    assert.equal((await api.freeapiTts({ text: 'Hello', ...input })).status, false);
  }
  assert.equal(calls.length, 0);
  const result = await api.freeapiTts({ text: ' Hello ', voiceIndex: '1', rate: '-10' });
  assert.deepEqual(result.data, { mimeType: 'audio/mpeg', base64: mp3.toString('base64') });
  assert.equal(calls[0].url.href, 'https://freeapi.pro/api/tts');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[0].options.body), { voiceIndex: 1, text: 'Hello', pitch: 0, rate: -10 });
  body = Buffer.from('ID3');
  assert.equal((await api.freeapiTts({ text: 'Hello', voice: 'Demo' })).status, false);
});

test('FreeAPI HandSter requests one PNG page and validates input without uploading on invalid options', async (t) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  const calls = mockHTTP(t, () => new Response(png, { headers: { 'Content-Type': 'image/png' } }));
  assert.equal((await api.freeapiHand({ text: 'Hello', color: 'url(https://example.test)' })).status, false);
  assert.equal((await api.freeapiHand({ text: 'Hello', page: 0 })).status, false);
  assert.equal(calls.length, 0);
  const result = await api.freeapiHand({ text: 'Hello\nWorld', color: '#0055aa', page: 2 });
  assert.deepEqual(result.data, { mimeType: 'image/png', base64: png.toString('base64'), page: 2 });
  assert.equal(calls[0].url.href, 'https://freeapi.pro/api/hand');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    text: 'Hello\nWorld', font: 'neat', color: '#0055aa', size: 34, paper: 'ruled', style: 'neat', page: 2, format: 'png'
  });
});

test('FreeAPI WikSter encodes the query and rejects a truncated PDF even with the right MIME', async (t) => {
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n');
  let body = pdf;
  const calls = mockHTTP(t, () => new Response(body, { headers: { 'Content-Type': 'application/pdf' } }));
  const result = await api.freeapiWikiPdf({ query: 'Example & Test' });
  assert.equal(result.data.mimeType, 'application/pdf');
  assert.equal(result.data.base64, pdf.toString('base64'));
  assert.match(result.attribution, /Wikipedia/);
  assert.deepEqual([...calls[0].url.searchParams], [['query', 'Example & Test']]);
  body = pdf.subarray(0, -6);
  assert.equal((await api.freeapiWikiPdf({ query: 'Example & Test' })).status, false);
});

test('FreeAPI PixelSter returns only a provider image link without opening it', async (t) => {
  let imageUrl = 'https://access.vheer.com/example.jpg';
  const calls = mockHTTP(t, () => ({ success: true, imageUrl }));
  assert.equal((await api.freeapiTextToImage({ prompt: 'A flower', ratio: '3:17' })).status, false);
  assert.equal(calls.length, 0);
  const result = await api.freeapiTextToImage({ prompt: 'A flower', ratio: '16:9' });
  assert.deepEqual(result.data, { imageUrl, ratio: '16:9' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.href, 'https://freeapi.pro/api/tti');
  assert.deepEqual(JSON.parse(calls[0].options.body), { prompt: 'A flower', ratio: '16:9' });
  imageUrl = 'https://access.vheer.com.example.test/example.jpg';
  assert.equal((await api.freeapiTextToImage({ prompt: 'A flower' })).status, false);
  assert.equal(calls.length, 2);
});

test('FreeAPI MedSter exposes catalog metadata but not clinical instructions', async (t) => {
  const calls = mockHTTP(t, () => ({ success: true, results: [
    { id: 'example', name: 'Example', price: 'Rs. 42', dosage: 'unused fixture' }, { id: '', name: 'Invalid' }
  ] }));
  const result = await api.freeapiMedicineSearch({ q: 'Example & Product' });
  assert.deepEqual(result.data.results, [{ id: 'example', name: 'Example', price: 'Rs. 42' }]);
  assert.match(result.data.note, /bukan .*saran medis/);
  assert.equal(calls[0].url.pathname, '/api/search');
  assert.deepEqual([...calls[0].url.searchParams], [['q', 'Example & Product']]);
});

const rss = '<rss version="2.0"><channel><item><title>Test &amp; News</title><link>https://news.google.com/rss/articles/test</link><pubDate>Tue, 24 Nov 2026 12:00:00 GMT</pubDate><source url="https://example.com">Publisher</source></item></channel></rss>';
const trending = '<article class="Box-row"><h2><a href="/owner/repo">owner / repo</a></h2><p>A test repo</p><span itemprop="programmingLanguage">JavaScript</span><a href="/owner/repo/stargazers">12,000</a><a href="/owner/repo/forks">50</a><span class="float-sm-right">1,200 stars this week</span></article>';
const uuid = '11111111-2222-3333-4444-555555555555';
const successes = [
  { name: 'equran', args: ['surat', { surah: 112, cache: false }], body: { code: 200, data: { nomor: 112, ayat: [] } }, check: (r) => assert.equal(r.data.nomor, 112) },
  { name: 'aladhan', args: ['Jakarta', 'Indonesia', { date: '2026-11-25', cache: false }], body: { code: 200, data: { timings: { Fajr: '04:00' }, meta: { timezone: 'Asia/Jakarta', method: { id: 20 } }, date: {} } }, check: (r, c) => { assert.equal(r.timezone, 'Asia/Jakarta'); assert.equal(c[0].url.searchParams.get('method'), '20'); } },
  { name: 'frankfurter', args: ['usd', 'idr', { amount: 0, cache: false }], body: { base: 'USD', quote: 'IDR', date: '2026-11-24', rate: 16000 }, check: (r) => assert.equal(r.converted, 0) },
  { name: 'steam', args: ['Test Game', { limit: 1, cache: false }], body: { total: 1, items: [{ id: 413150, name: 'Test Game', metascore: 0, price: { currency: 'IDR', initial: 0, final: 0 } }] }, check: (r) => { assert.equal(r.results[0].price.final, 0); assert.equal(r.results[0].metascore, 0); } },
  { name: 'openmeteo', args: [0, 0, { mode: 'air-quality', days: 1, cache: false }], body: { current: { pm2_5: 0 }, latitude: 0, longitude: 0 }, check: (r, c) => { assert.equal(r.mode, 'air-quality'); assert.equal(c[0].url.searchParams.get('latitude'), '0'); } },
  { name: 'bluesky', args: ['https://bsky.app/profile/test.bsky.social', { cache: false }], body: { did: 'did:plc:test', handle: 'test.bsky.social', followersCount: 0, followsCount: 0, postsCount: 0 }, check: (r) => assert.equal(r.profile.followers, 0) },
  { name: 'jikan', args: ['Test Anime', { limit: 1, cache: false }], body: { data: [{ mal_id: 1, title: 'Test Anime', score: 0, genres: [] }], pagination: {} }, check: (r, c) => { assert.equal(r.results[0].score, 0); assert.equal(c[0].url.searchParams.get('sfw'), 'true'); } },
  { name: 'googleNews', args: ['test', { limit: 1, cache: false }], body: rss, check: (r) => { assert.equal(r.results[0].title, 'Test & News'); assert.equal(r.results[0].publisher, 'Publisher'); } },
  { name: 'openlibrary', args: ['Test Book', { limit: 1, cache: false }], body: { numFound: 1, docs: [{ key: '/works/OL1W', title: 'Test Book', author_name: ['Author'], cover_i: 12 }] }, check: (r) => assert.equal(r.results[0].url, 'https://openlibrary.org/works/OL1W') },
  { name: 'itunes', args: ['Test Podcast', { limit: 1, cache: false }], body: { resultCount: 1, results: [{ trackId: 1, trackName: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' }] }, check: (r) => { assert.equal(r.results[0].feedUrl, 'https://example.com/feed.xml'); assert.equal(r.results[0].previewUrl, undefined); } },
  { name: 'mangadex', args: ['Test Manga', { limit: 1, cache: false }], body: { result: 'ok', total: 1, data: [{ id: uuid, attributes: { title: { en: 'Test Manga' }, contentRating: 'safe' }, relationships: [] }] }, check: (r, c) => { assert.equal(r.results[0].title, 'Test Manga'); assert.deepEqual(c[0].url.searchParams.getAll('contentRating[]'), ['safe']); } },
  { name: 'githubTrending', args: ['javascript', { since: 'weekly', limit: 1, cache: false }], body: trending, check: (r) => { assert.equal(r.results[0].stars, 12000); assert.equal(r.results[0].starsInPeriod, 1200); } },
  { name: 'hariLibur', args: [2026, { month: 1, cache: false }], body: { '2026-01-01': { summary: 'Cuti Bersama Test (belum pasti)' }, '2027-01-01': { summary: 'Test' }, info: { updated: '20261123 17:05:40' } }, check: (r) => { assert.equal(r.total, 1); assert.equal(r.results[0].tentative, true); assert.equal(r.results[0].jointHoliday, true); } },
  { name: 'npmScraper', args: ['@test/tools', { mode: 'package', cache: false }], body: { name: '@test/tools', version: '1.0.0', license: 'MIT', dependencies: { example: '^1.0.0' } }, check: (r, c) => { assert.equal(r.package.version, '1.0.0'); assert.match(decodeURIComponent(c[0].url.pathname), /@test\/tools\/latest/); } },
  { name: 'hackernews', args: ['top', { limit: 1, cache: false }], body: (url) => url.pathname.includes('/item/') ? { id: 1001, type: 'story', title: 'Test Story', score: 0, time: 0 } : [1001], check: (r, c) => { assert.equal(r.results[0].score, 0); assert.equal(c.length, 2); } },
  { name: 'openfoodfacts', args: ['3274080005003', { staging: true, cache: false }], body: { product: { product_name: 'Test Product', nutriments: { proteins: 1 } } }, check: (r, c) => { assert.equal(r.environment, 'staging'); assert.equal(c[0].url.origin, 'https://world.openfoodfacts.net'); } },
  { name: 'wayback', args: ['https://example.com/a?x=1&y=2', { timestamp: '20260101', cache: false }], body: { archived_snapshots: { closest: { available: true, url: 'https://web.archive.org/web/20260101000000/https://example.com', timestamp: '20260101000000', status: '200' } } }, check: (r, c) => { assert.equal(r.found, true); assert.equal(c[0].url.searchParams.get('url'), 'https://example.com/a?x=1&y=2'); } }
];

for (const entry of successes) {
  test(`${entry.name}: normalizes a successful response without an API key`, async (t) => {
    const calls = mockHTTP(t, (url, options) => typeof entry.body === 'function' ? entry.body(url, options) : entry.body);
    const result = await api[entry.name](...entry.args);
    assert.equal(result.status, true, JSON.stringify(result));
    assert.equal(typeof result.source, 'string');
    assert.ok(calls.length > 0);
    entry.check(result, calls);
  });
}

const invalid = [
  ['equran', ['surat', { surah: 115 }]], ['aladhan', ['', 'Indonesia']],
  ['equran', ['shalat', { provinsi: 'Jawa Barat', kabkota: 'Kota Bogor', bulan: 13 }]],
  ['anilist', ['Test', { limit: 11 }]],
  ['frankfurter', ['USD', 'IDR', { amount: -1 }]], ['steam', ['Test', { country: 'IND' }]],
  ['openmeteo', [91, 0]], ['bluesky', ['https://example.com/profile/user']],
  ['jikan', ['Test', { type: 'users' }]], ['googleNews', ['Test', { country: 'IND' }]],
  ['openlibrary', ['9780000000000', { mode: 'isbn' }]], ['itunes', ['Test', { type: 'software' }]],
  ['mangadex', ['not-a-uuid', { mode: 'chapters' }]], ['githubTrending', ['../javascript']],
  ['hariLibur', [2026, { date: '2027-01-01' }]], ['npmScraper', ['../../file', { mode: 'package' }]],
  ['hackernews', ['comments']], ['openfoodfacts', ['abc']], ['wayback', ['https://user:password@example.com']]
];
for (const [name, args] of invalid) {
  test(`${name}: rejects invalid input before any request`, async (t) => {
    const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
    const result = await api[name](...args);
    assert.equal(result.status, false);
    assert.equal(typeof result.message, 'string');
    assert.equal(calls.length, 0);
  });
}

test('numeric validation rejects whitespace, arrays, and booleans; dates reject rollover', () => {
  for (const value of [' ', [], [1], true, null]) assert.throws(() => integer(value, 1, 0, 10));
  assert.equal(integer(0, 1, 0, 10), 0);
  assert.throws(() => isoDate('2026-02-30'));
  assert.equal(isoDate('2024-02-29'), '2024-02-29');
});

test('blank conversion amounts and non-HTTP URL schemes never make requests', async (t) => {
  const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
  assert.equal((await api.frankfurter('USD', 'IDR', { amount: ' ' })).status, false);
  assert.equal((await api.wayback('ftp://example.com')).status, false);
  assert.equal(calls.length, 0);
});

test('RSS and HTML parsers reject block pages but accept an empty real feed', () => {
  const { parseNewsRSS } = require('../scrapers/integrations/scrape-googlenews');
  const { parseTrending } = require('../scrapers/integrations/scrape-githubtrending');
  assert.throws(() => parseNewsRSS('<html>Access denied</html>'));
  assert.throws(() => parseTrending('<html>Access denied</html>'));
  assert.deepEqual(parseNewsRSS('<rss><channel></channel></rss>'), []);
  assert.deepEqual(parseTrending('<div class="blankslate">No trending repositories</div>'), []);
});

test('caching avoids duplicate calls, does not share mutable objects, and can be disabled', async (t) => {
  const calls = mockHTTP(t, () => ({ value: 1 }));
  const url = 'https://cache-test.example.test/data';
  const first = await request(url, { interval: 0 });
  first.value = 2;
  assert.equal((await request(url, { interval: 0 })).value, 1);
  assert.equal(calls.length, 1);
  await request(url, { interval: 0, cache: false });
  assert.equal(calls.length, 2);
});

test('HTTP 429 is not retried and stops queued requests to the same origin', async (t) => {
  const calls = mockHTTP(t, () => new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }));
  const results = await Promise.allSettled([
    request('https://rate-test.example.test/first', { interval: 50, cache: false }),
    request('https://rate-test.example.test/queued', { interval: 50, cache: false })
  ]);
  for (const result of results) {
    assert.equal(result.status, 'rejected');
    assert.equal(result.reason.httpStatus, 429);
    assert.equal(result.reason.retryAfter, 2);
  }
  assert.equal(calls.length, 1);
});

test('request timeout aborts the fetch instead of leaving a retry loop', async (t) => {
  const previous = global.fetch;
  global.fetch = (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  t.after(() => { global.fetch = previous; });
  await assert.rejects(request('https://timeout-test.example.test/data', { timeout: 20, interval: 0, cache: false }), /timeout/);
});

test('invalid JSON, server errors, and oversized responses are rejected', async (t) => {
  mockHTTP(t, (url) => url.pathname === '/bad-json' ? 'not json'
    : url.pathname === '/server-error' ? new Response('unavailable', { status: 503 })
      : 'x'.repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(request('https://error-test.example.test/bad-json', { interval: 0, cache: false }), /JSON/);
  await assert.rejects(request('https://error-test.example.test/server-error', { interval: 0, cache: false }), (error) => error.httpStatus === 503);
  await assert.rejects(request('https://error-test.example.test/too-large', { interval: 0, format: 'text', cache: false }), /2 MB/);
});

test('connection failure keeps the network error code instead of claiming empty results', async (t) => {
  mockHTTP(t, () => { throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }); });
  const result = await api.jikan('Network Test', { cache: false });
  assert.equal(result.status, false);
  assert.equal(result.errorCode, 'UND_ERR_CONNECT_TIMEOUT');
});

test('Open Food Facts distinguishes a missing product from a broken API route', async (t) => {
  mockHTTP(t, () => new Response('{"error":"route not found"}', { status: 404 }));
  const result = await api.openfoodfacts('3274080005003', { staging: true, cache: false });
  assert.equal(result.status, false);
});

test('Open Food Facts accepts a real product_not_found response without masking other 404s', async (t) => {
  mockHTTP(t, () => new Response('{"result":{"id":"product_not_found"}}', { status: 404 }));
  const result = await api.openfoodfacts('3274080005003', { staging: true, cache: false });
  assert.equal(result.status, true);
  assert.equal(result.found, false);
});

test('EQuran rejects an empty detail object instead of claiming a successful lookup', async (t) => {
  mockHTTP(t, () => ({ code: 200, data: {} }));
  assert.equal((await api.equran('surat', { surah: 1, cache: false })).status, false);
});

test('EQuran shalat sends JSON POST and caches by location and period', async (t) => {
  const calls = mockHTTP(t, (_, { body }) => ({
    code: 200,
    data: { ...JSON.parse(body), jadwal: [{ tanggal: 1, subuh: '04:35' }] }
  }));
  const period = { bulan: 11, tahun: 2026, provinsi: 'Jawa Barat', kabkota: 'Kota Bogor' };
  const first = await api.equran('shalat', period);
  assert.equal(first.status, true);
  assert.equal(first.data.jadwal[0].subuh, '04:35');
  assert.deepEqual(await api.equran('shalat', period), first);
  assert.equal((await api.equran('shalat', { ...period, kabkota: 'Kota Bandung' })).data.kabkota, 'Kota Bandung');
  assert.equal((await api.equran('shalat', { ...period, bulan: 12 })).data.bulan, 12);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url.href, 'https://equran.id/api/v2/shalat');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].options.body), period);
});

test('AniList searches by GraphQL variables without caching results', async (t) => {
  const calls = mockHTTP(t, () => ({
    data: { Page: { media: [{ id: 30013, title: { romaji: 'ONE PIECE' }, chapters: null, averageScore: 92 }] } }
  }));
  const query = 'One Piece "test"';
  const options = { type: 'manga', limit: 1, cache: true };
  const result = await api.anilist(query, options);
  assert.equal(result.status, true);
  assert.equal(result.results[0].title, 'ONE PIECE');
  assert.equal(result.results[0].chapters, null);
  assert.equal(result.results[0].averageScore, 92);
  assert.deepEqual(await api.anilist(query, options), result);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.origin, 'https://graphql.anilist.co');
  assert.equal(calls[0].options.method, 'POST');
  const payload = JSON.parse(calls[0].options.body);
  assert.match(payload.query, /isAdult: false/);
  assert.ok(!payload.query.includes(query));
  assert.deepEqual(payload.variables, { search: query, type: 'MANGA', limit: 1 });
});

test('AniList does not treat GraphQL errors as empty search results', async (t) => {
  mockHTTP(t, () => ({ data: { Page: { media: [] } }, errors: [{ message: 'Query failed' }] }));
  const result = await api.anilist('Test Anime');
  assert.equal(result.status, false);
  assert.equal(result.message, 'Query failed');
});

test('Siputzx uses standalone files and the no-argument CLI fetches only its own route', () => {
  assert.ok(siputzxFiles.length >= 114);
  assert.ok(!readdirSync(root).some((file) => /^scrape-.+\.js$/.test(file)));
  assert.throws(() => require.resolve('../scrapers/siputzx/scrape-siputzx'), { code: 'MODULE_NOT_FOUND' });
  assert.throws(() => require.resolve('../scrapers/lib/siputzx-utils'), { code: 'MODULE_NOT_FOUND' });
  const mock = 'data:text/javascript,' + encodeURIComponent(`globalThis.fetch=async url=>{
    if(url !== 'https://api.siputzx.my.id/api/berita/antara') throw new Error('Wrong route');
    return Response.json({status:true,data:[{title:'Test article'}]});
  };`);
  const child = spawnSync(process.execPath, [
    '--import', mock, 'scrapers/siputzx/berita/scrape-antara.js'
  ], childOptions);
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assert.deepEqual(JSON.parse(child.stdout), {
    status: true, source: 'siputzx', endpoint: 'berita/antara', timestamp: null, data: [{ title: 'Test article' }]
  });
});

test('Siputzx rejects missing and out-of-range endpoint parameters offline', async (t) => {
  const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
  const { toolsCountryInfo } = require('../scrapers/siputzx/tools/scrape-country-info');
  const { gamesCerdasCermat } = require('../scrapers/siputzx/games/scrape-cc-sd');
  const { gamesMaths } = require('../scrapers/siputzx/games/scrape-maths');
  for (const [scrape, options] of [
    [toolsCountryInfo], [gamesCerdasCermat, { matapelajaran: 'matematika', jumlahsoal: 20 }],
    [gamesMaths, { level: 'invalid' }]
  ]) {
    assert.equal((await scrape(options)).status, false);
  }
  assert.equal(calls.length, 0);
});

test('Siputzx forwards only the documented query fields and preserves HTTP denial', async (t) => {
  const { toolsTranslate } = require('../scrapers/siputzx/tools/scrape-translate');
  const { infoBmkg } = require('../scrapers/siputzx/info/scrape-bmkg');
  const calls = mockHTTP(t, (url) => url.pathname.endsWith('/tools/translate')
    ? { status: true, data: { translatedText: 'Satu & Dua' }, timestamp: '2026-11-26' }
    : new Response('forbidden', { status: 403 }));
  const result = await toolsTranslate({ text: 'One & Two', source: 'en', target: 'id', endpoint: 'other/route', extra: 'ignored' });
  assert.equal(result.status, true);
  assert.equal(result.data.translatedText, 'Satu & Dua');
  assert.equal(calls[0].url.origin, 'https://api.siputzx.my.id');
  assert.deepEqual([...calls[0].url.searchParams], [['text', 'One & Two'], ['source', 'en'], ['target', 'id']]);
  assert.equal(calls[0].url.pathname, '/api/tools/translate');
  const denied = await infoBmkg();
  assert.equal(denied.status, false);
  assert.equal(denied.httpStatus, 403);
  assert.equal(calls.length, 2);
});

test('Siputzx does not cache randomized quiz responses', async (t) => {
  const { gamesCakLontong } = require('../scrapers/siputzx/games/scrape-caklontong');
  let number = 0;
  const calls = mockHTTP(t, () => ({ status: true, data: { soal: ++number } }));
  assert.equal((await gamesCakLontong()).data.soal, 1);
  assert.equal((await gamesCakLontong()).data.soal, 2);
  assert.equal(calls.length, 2);
});

test('Siputzx QwQ accepts fractional temperature, skips caching, and rejects empty answers', async (t) => {
  const { aiQwq32b } = require('../scrapers/siputzx/ai/scrape-qwq32b');
  let answer = 'Halo!';
  const calls = mockHTTP(t, () => ({ status: true, data: { response: answer } }));
  for (const temperature of [-0.1, 2.1, ' ', false]) {
    assert.equal((await aiQwq32b({ prompt: 'Halo', temperature })).status, false);
  }
  assert.equal((await aiQwq32b()).status, false);
  assert.equal(calls.length, 0);

  const input = { prompt: 'Satu & dua?', system: 'Jawab singkat', temperature: '0.7', cache: true, cookie: 'ignored' };
  assert.equal((await aiQwq32b(input)).data.response, 'Halo!');
  answer = '   ';
  assert.equal((await aiQwq32b(input)).status, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.pathname, '/api/ai/qwq32b');
  assert.deepEqual([...calls[0].url.searchParams], [['prompt', input.prompt], ['system', input.system], ['temperature', '0.7']]);
  assert.equal(calls[0].options.redirect, 'error');
});

test('Siputzx preserves text and structured AI replies and canonical translation codes', async (t) => {
  const { aiGita } = require('../scrapers/siputzx/ai/scrape-gita');
  const { aiBibleAI } = require('../scrapers/siputzx/ai/scrape-bibleai');
  const { aiMetaAI } = require('../scrapers/siputzx/ai/scrape-metaai');
  const bible = { results: { answer: 'A test answer', sources: ['Test reference'] } };
  const calls = mockHTTP(t, (url) => ({ status: true, data: url.pathname.endsWith('/bibleai') ? bible : 'A text reply' }));
  assert.equal((await aiGita({ q: 'What is the Bhagavad Gita?' })).data, 'A text reply');
  assert.deepEqual((await aiBibleAI({ question: 'What is a parable?', translation: 'esv' })).data, bible);
  assert.equal((await aiMetaAI({ query: 'Hello' })).data, 'A text reply');
  assert.deepEqual(calls.map(({ url }) => [...url.searchParams.keys()]), [['q'], ['question', 'translation'], ['query']]);
  assert.equal(calls[1].url.searchParams.get('translation'), 'ESV');
});

test('Siputzx Brat returns verified PNG/GIF bytes as Base64 and rejects a mismatched body', async (t) => {
  const { makeBrat } = require('../scrapers/siputzx/maker/scrape-brat');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const calls = mockHTTP(t, (url) => {
    const animated = url.searchParams.get('isAnimated') === 'true';
    const body = url.searchParams.get('text') === 'wrong' ? 'not a PNG' : animated ? gif : png;
    return new Response(body, { headers: { 'Content-Type': animated ? 'image/gif' : 'image/png' } });
  });
  assert.equal((await makeBrat({ text: 'Halo', isAnimated: 'invalid' })).status, false);
  assert.equal((await makeBrat({ text: 'Halo', delay: 99 })).status, false);
  assert.equal(calls.length, 0);
  assert.deepEqual((await makeBrat({ text: 'Halo' })).data, { mimeType: 'image/png', base64: png.toString('base64') });
  assert.deepEqual((await makeBrat({ text: 'Halo dunia', isAnimated: true, delay: 500 })).data,
    { mimeType: 'image/gif', base64: gif.toString('base64') });
  assert.equal(calls[1].url.pathname, '/api/m/brat');
  assert.equal(calls[1].url.searchParams.get('delay'), '500');
  assert.equal((await makeBrat({ text: 'wrong' })).status, false);
});

test('image endpoints accept public image sources and verify the returned format without caching', async (t) => {
  const { scrape } = imageEndpoint('https://image-endpoint-test.example.test/api/canvas/example', {
    source: 'test', interval: 0, params: { image: { required: true, type: 'image-url' } }
  });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  let responseType = 'image/png';
  const calls = mockHTTP(t, () => new Response(png, { headers: { 'Content-Type': responseType } }));
  for (const input of ['http://placehold.co/test.png', 'https://127.0.0.1/test.png', 'https://placehold.co.example.test/test.png']) {
    assert.equal((await scrape({ image: input })).status, false);
  }
  assert.equal(calls.length, 0);
  const image = 'https://placehold.co/400x300.png?tracking=omit#fragment';
  const result = await scrape({ image });
  assert.deepEqual(result.data, { mimeType: 'image/png', base64: png.toString('base64') });
  assert.equal(result.timestamp, null);
  assert.equal(calls[0].url.searchParams.get('image'), 'https://placehold.co/400x300.png');
  assert.equal(calls[0].options.redirect, 'error');
  responseType = 'image/jpeg';
  assert.equal((await scrape({ image })).status, false);
  assert.equal(calls.length, 2);
});

test('Siputzx image modules reject unapproved screenshot destinations and sanitize leaderboard input', async (t) => {
  const { toolsScreenshot } = require('../scrapers/siputzx/tools/scrape-ssweb');
  const { canvasTop } = require('../scrapers/siputzx/canvas/scrape-top');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  const calls = mockHTTP(t, () => new Response(png, { headers: { 'Content-Type': 'image/png' } }));
  for (const url of ['https://localhost', 'https://example.com.example.test/', 'https://example.com/not-a-demo']) {
    assert.equal((await toolsScreenshot({ url })).status, false);
  }
  const background = 'https://placehold.co/400x300.png';
  assert.equal((await canvasTop({ background, usersData: '[{"avatar":"https://unapproved.example.test/avatar"}]' })).status, false);
  assert.equal(calls.length, 0);
  const usersData = JSON.stringify([{ top: 1, avatar: `${background}?tracking=ignored#ignored`, tag: 'Demo', score: 10, extra: 'ignored' }]);
  assert.equal((await canvasTop({ background, usersData })).status, true);
  const query = calls[0].url.searchParams;
  assert.deepEqual(JSON.parse(query.get('usersData')), [{ top: 1, avatar: background, tag: 'Demo', score: 10 }]);
});

test('Siputzx public-profile module drops private profiles and excludes upstream account identifiers', async (t) => {
  const { stalkTikTok } = require('../scrapers/siputzx/stalk/scrape-tiktok');
  const data = {
    found: true, handle: 'example', url: 'https://www.tiktok.com/@example',
    user: { privateAccount: false, nickname: 'Demo', verified: false, secUid: 'fixture', email: 'example@example.test' },
    stats: { followers: 42, videos: 6 }
  };
  const calls = mockHTTP(t, () => ({ status: true, data }));
  assert.equal((await stalkTikTok({ username: 'example/other' })).status, false);
  assert.equal(calls.length, 0);
  const publicProfile = await stalkTikTok({ username: '@example', cache: false });
  assert.equal(publicProfile.status, true);
  assert.equal(publicProfile.data.followers, 42);
  assert.equal(publicProfile.data.user, undefined);
  assert.doesNotMatch(JSON.stringify(publicProfile), /secUid|@example\.test/);
  assert.equal(calls[0].url.searchParams.get('username'), 'example');
  data.user.privateAccount = true;
  assert.equal((await stalkTikTok({ username: 'example', cache: false })).status, false);
});

test('Siputzx downloaders reject invalid or unsupported public URLs before making a request', async (t) => {
  const { downloadGithub } = require('../scrapers/siputzx/downloader/scrape-github');
  const { downloadFastDL } = require('../scrapers/siputzx/downloader/scrape-fastdl');
  const { downloadTikTok } = require('../scrapers/siputzx/downloader/scrape-tiktok');
  const { download9xBuddy } = require('../scrapers/siputzx/downloader/scrape-9xbuddy');
  const calls = mockHTTP(t, () => assert.fail('Request must not happen'));
  for (const url of [undefined, 'http://github.com/owner/repo', 'https://github.com.example.test/owner/repo',
    'https://user@github.com/owner/repo', 'https://github.com:8443/owner/repo', 'https://github.com/owner/repo/issues']) {
    assert.equal((await downloadGithub({ url })).status, false);
  }
  assert.equal((await downloadFastDL({ url: 'https://www.instagram.com/stories/user/123' })).status, false);
  assert.equal((await downloadTikTok({ url: 'https://www.tiktok.com/explore' })).status, false);
  assert.equal((await download9xBuddy({ url: 'https://www.youtube.com/watch' })).status, false);
  assert.equal((await download9xBuddy({ url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&v=invalid' })).status, false);
  assert.equal(calls.length, 0);
});

test('Siputzx GitHub returns only after finding an archive link and never fetches that link itself', async (t) => {
  const { downloadGithub } = require('../scrapers/siputzx/downloader/scrape-github');
  const downloadUrl = 'https://github.com/owner/repo/archive/refs/heads/main.zip';
  let data = { owner: 'owner', repo: 'repo', download_url: downloadUrl };
  const calls = mockHTTP(t, () => ({ status: true, data }));
  const input = { url: 'https://github.com/owner/repo?tracking=ignore#readme', cookie: 'ignored', cache: true };
  assert.equal((await downloadGithub(input)).data.download_url, downloadUrl);
  data = { download_url: 'https://example.test/repo.zip' };
  assert.equal((await downloadGithub(input)).status, false);
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.equal(url.origin + url.pathname, 'https://api.siputzx.my.id/api/d/github');
    assert.deepEqual([...url.searchParams], [['url', 'https://github.com/owner/repo']]);
    assert.equal(options.redirect, 'error');
  }
});

test('Siputzx 9xbuddy keeps the video ID and returns only valid direct video formats', async (t) => {
  const { download9xBuddy } = require('../scrapers/siputzx/downloader/scrape-9xbuddy');
  const url = 'https://video-test.googlevideo.com/videoplayback?signature=sample';
  const calls = mockHTTP(t, () => ({ status: true, data: {
    ok: true, title: 'Test Video', duration: '5s', formats: [
      { external: true, type: 'video', url },
      { external: false, type: 'video', url: 'https://googlevideo.com.example.test/videoplayback' },
      { external: false, type: 'video', url, ext: 'mp4', quality: '360p', size: '1 MB' }
    ]
  } }));
  const result = await download9xBuddy({ url: 'https://www.youtube.com/watch?tracking=ignore&v=aqz-KE-bpKQ#t=5' });
  assert.equal(result.status, true);
  assert.deepEqual(result.data.formats, [{ url, ext: 'mp4', quality: '360p', size: '1 MB' }]);
  assert.equal(calls[0].url.pathname, '/api/d/9xbuddy');
  assert.deepEqual([...calls[0].url.searchParams], [['url', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ']]);
  assert.equal(calls.length, 1);
});

test('Siputzx Lahelu projects only public post metadata instead of forwarding the raw payload', async (t) => {
  const { downloadLahelu } = require('../scrapers/siputzx/downloader/scrape-lahelu');
  const media = 'https://cache.lahelu.com/example.webp';
  const calls = mockHTTP(t, (url) => ({ status: true, data: {
    status: true, sensitive: url.searchParams.get('url').endsWith('/PTest2'), post_id: 'PTest1', title: 'Cat',
    media, create_time: '2026-11-26T00:00:00Z', raw: { userInfo: { email: 'fixture@example.test' } }
  } }));
  const result = await downloadLahelu({ url: 'https://lahelu.com/post/PTest1' });
  assert.equal(result.status, true);
  assert.deepEqual(result.data, { postId: 'PTest1', title: 'Cat', media, createdAt: '2026-11-26T00:00:00Z' });
  assert.equal((await downloadLahelu({ url: 'https://lahelu.com/post/PTest2' })).status, false);
  assert.equal(calls.length, 2);
});

test('valid ISBN, chapter feed, and npm search/download modes use the correct endpoint', async (t) => {
  const calls = mockHTTP(t, (url) => {
    if (url.hostname === 'openlibrary.org') return { docs: [], numFound: 0 };
    if (url.hostname === 'api.mangadex.org') return { result: 'ok', total: 1, data: [{ id: uuid, attributes: { chapter: '1', translatedLanguage: 'id', pages: 20 }, relationships: [] }] };
    if (url.hostname === 'registry.npmjs.org') return { objects: [], total: 0 };
    return { downloads: 0, start: '2026-11-01', end: '2026-11-07' };
  });
  assert.equal((await api.openlibrary('978-0-306-40615-7', { mode: 'isbn', cache: false })).status, true);
  assert.equal((await api.mangadex(uuid, { mode: 'chapters', cache: false })).results[0].chapter, '1');
  assert.equal((await api.npmScraper('test', { mode: 'search', cache: false })).total, 0);
  assert.equal((await api.npmScraper('@test/tools', { mode: 'downloads', cache: false })).downloads, 0);
  assert.equal(calls[0].url.searchParams.get('isbn'), '9780306406157');
  assert.equal(calls[1].url.searchParams.get('translatedLanguage[]'), 'id');
});
