'use strict';

// Explicit opt-in through npm run test:live. Public lookups and generation; no publishing, uploads, or account creation.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const options = { timeout: 25000, cache: false, limit: 1 };
const chat = { prompt: 'Balas dengan salam Halo dalam satu kalimat.', system: 'Jawab singkat dalam bahasa Indonesia.', temperature: 0.7 };
const instagram = 'https://www.instagram.com/reel/C7g8V7lKDLw/'; // NPS / Alex Cohen, public domain per NPS usage notice.
const tiktok = 'https://www.tiktok.com/@nasa/video/7699974130153590029';
const checks = [
  ['EQuran', () => require('./scrape-equran').equran('surat', { ...options, surah: 112 })],
  ['EQuran shalat', () => require('./scrape-equran').equran('shalat', { ...options, provinsi: 'Jawa Barat', kabkota: 'Kota Bogor', bulan: 11, tahun: 2026 }),
    (result) => { assert.equal(result.data.kabkota, 'Kota Bogor'); assert.equal(result.data.jadwal.length, 30); }],
  ['AniList anime', () => require('./scrape-anilist').anilist('Naruto', options),
    (result) => assert.match(result.results[0].title, /^naruto$/i)],
  ['AniList manga', () => require('./scrape-anilist').anilist('One Piece', { ...options, type: 'manga' }),
    (result) => assert.match(result.results[0].title, /^one piece$/i)],
  ['Aladhan', () => require('./scrape-aladhan').aladhan('Jakarta', 'Indonesia', options)],
  ['Frankfurter', () => require('./scrape-frankfurter').frankfurter('USD', 'IDR', options)],
  ['Steam', () => require('./scrape-steam').steam('Stardew Valley', options)],
  ['Open-Meteo', () => require('./scrape-openmeteo').openmeteo(-6.1754, 106.8272, { ...options, mode: 'air-quality', days: 1 })],
  ['Bluesky', () => require('./scrape-bluesky').bluesky('bsky.app', options)],
  ['Jikan', () => require('./scrape-jikan').jikan('Naruto', options)],
  ['Google News RSS', () => require('./scrape-googlenews').googleNews('teknologi Indonesia', options)],
  ['Open Library', () => require('./scrape-openlibrary').openlibrary('Dune', options)],
  ['iTunes', () => require('./scrape-itunes').itunes('BBC Global News', { ...options, type: 'podcast', country: 'US' })],
  ['MangaDex', () => require('./scrape-mangadex').mangadex('One Piece', options)],
  ['GitHub Trending', () => require('./scrape-githubtrending').githubTrending('javascript', options)],
  ['Hari Libur', () => require('./scrape-harilibur').hariLibur(new Date().getFullYear(), options)],
  ['npm', () => require('./scrape-npm').npmScraper('cheerio', { ...options, mode: 'package' })],
  ['Hacker News', () => require('./scrape-hackernews').hackernews('top', options)],
  ['Open Food Facts staging', () => require('./scrape-openfoodfacts').openfoodfacts('3274080005003', { ...options, staging: true })],
  ['Wayback', () => require('./scrape-wayback').wayback('https://example.com', options)],
  ['Siputzx Antara', () => require('./scrape-siputzx-berita-antara').beritaAntara(options),
    (result) => assert.ok(result.data[0]?.title)],
  ['Siputzx BMKG', () => require('./scrape-siputzx-info-bmkg').infoBmkg(options),
    (result) => assert.ok(result.data.auto)],
  ['Siputzx tebak logo', () => require('./scrape-siputzx-games-tebaklogo').gamesTebakLogo(options),
    (result) => assert.ok(Object.keys(result.data.data ?? {}).length > 0)],
  ['Siputzx maths', () => require('./scrape-siputzx-games-maths').gamesMaths({ ...options, level: 'easy' }),
    (result) => assert.ok(result.data.str)],
  ['Siputzx AI QwQ', () => require('./scrape-siputzx-ai-qwq32b').aiQwq32b({
    prompt: 'Halo, siapa kamu?', system: 'You are a helpful assistant.', temperature: 0.7
  }), (result) => assert.ok(result.data.response.trim())],
  ['Siputzx AI GPT OSS', () => require('./scrape-siputzx-ai-gptoss120b').aiGptOss120b(chat),
    (result) => assert.ok(result.data.response.trim())],
  ['Siputzx AI GLM', () => require('./scrape-siputzx-ai-glm47flash').aiGlm47Flash(chat),
    (result) => assert.ok(result.data.response.trim())],
  ['Siputzx AI DeepSeek', () => require('./scrape-siputzx-ai-deepseekr1').aiDeepSeekR1({
    ...chat, prompt: 'Berapa 2 + 2? Jawab dengan satu angka saja.'
  }), (result) => assert.ok(result.data.response.trim())],
  ['Siputzx AI Gita', () => require('./scrape-siputzx-ai-gita').aiGita({ q: 'What is the Bhagavad Gita?' }),
    (result) => assert.ok(result.data.trim())],
  ['Siputzx AI Bible', () => require('./scrape-siputzx-ai-bibleai').aiBibleAI({
    question: 'Where is the parable of the mustard seed?', translation: 'ESV'
  }), (result) => assert.ok(result.data.results.answer.trim())],
  ['Siputzx AI Meta', () => require('./scrape-siputzx-ai-metaai').aiMetaAI({ query: 'Berapa 2 + 2? Jawab dengan satu angka saja.' }),
    (result) => assert.ok(result.data.trim())],
  ['Siputzx Brat PNG', () => require('./scrape-siputzx-m-brat').makeBrat({ text: 'Halo' }),
    (result) => assert.equal(result.data.mimeType, 'image/png')],
  ['Siputzx Brat GIF', () => require('./scrape-siputzx-m-brat').makeBrat({ text: 'Halo dunia', isAnimated: true, delay: 500 }),
    (result) => assert.equal(result.data.mimeType, 'image/gif')],
  ['Siputzx Downloader GitHub', () => require('./scrape-siputzx-d-github').downloadGithub({ url: 'https://github.com/sindresorhus/is-png' }),
    (result) => assert.equal(result.data.repo, 'is-png')],
  ['Siputzx Downloader FastDL', () => require('./scrape-siputzx-d-fastdl').downloadFastDL({ url: instagram })],
  ['Siputzx Downloader SSSInstagram', () => require('./scrape-siputzx-d-sssinstagram').downloadSSSInstagram({ url: instagram })],
  ['Siputzx Downloader iGram', () => require('./scrape-siputzx-d-igram').downloadIGram({ url: instagram })],
  ['Siputzx Downloader Ummy', () => require('./scrape-siputzx-d-ummy').downloadUmmy({ url: instagram })],
  ['Siputzx Downloader TikTok', () => require('./scrape-siputzx-d-tiktok').downloadTikTok({ url: tiktok })],
  ['Siputzx Downloader TikTok V2', () => require('./scrape-siputzx-d-tiktok-v2').downloadTikTokV2({ url: tiktok })],
  ['Siputzx Downloader Douyin', () => require('./scrape-siputzx-d-douyin').downloadDouyin({ url: tiktok })],
  ['Siputzx Downloader 9xbuddy', () => require('./scrape-siputzx-d-9xbuddy').download9xBuddy({
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' // Big Buck Bunny, Blender Foundation, CC BY.
  }), (result) => assert.match(result.data.title, /Big Buck Bunny/i)],
  ['Siputzx Downloader Lahelu', () => require('./scrape-siputzx-d-lahelu').downloadLahelu({ url: 'https://lahelu.com/post/PhuP6LKpL' }),
    (result) => assert.equal(result.data.postId, 'PhuP6LKpL')]
];

const demoImage = 'https://upload.wikimedia.org/wikipedia/commons/7/70/Example.png';
const demoBackground = 'https://placehold.co/400x300.png';
const demoAvatar = { username: 'Demo', avatar: demoImage };
const demoGuild = { ...demoAvatar, background: demoBackground, guildName: 'Demo Server', memberCount: 12 };
const demoCard = { backgroundURL: demoBackground, avatarURL: demoImage, name: 'Demo' };
const demoBirth = { tgl: 15, bln: 5, thn: 1995 };
const demoPartners = { nama1: 'Budi', tgl1: 15, bln1: 5, thn1: 1995, nama2: 'Sari', tgl2: 20, bln2: 6, thn2: 1996 };
const siputzxAdditions = {
  'sticker/combot-search': { q: 'cat', page: 1 },
  'info/cuaca': { q: 'pasiran jaya' },
  'tools/kodepos': { form: 'pasiran jaya' },
  'tools/ssweb': { url: 'https://example.com/', device: 'desktop', theme: 'light', fullPage: 'false' },
  's/8font': { query: 'cartoon', page: 1 }, 's/applemusic': { query: 'duka', region: 'id' },
  's/duckduckgo': { query: 'Node.js documentation' }, 's/mcpedl': { q: 'shaders' }, 's/otakotaku': { query: 'mahiru' },
  's/pinterest': { query: 'batik pattern', type: 'image' }, 's/resep': { query: 'nasi goreng' },
  's/youtube': { query: 'Big Buck Bunny Blender Foundation' },
  'stalk/github': { user: 'nodejs' }, 'stalk/pinterest': { q: 'nasa' }, 'stalk/tiktok': { username: 'nasa' }, 'stalk/twitter': { user: 'NASA' },
  'r/lahelu': {}, 'berita/tribunnews': {}, 'berita/cnbcindonesia': {},
  'anime/oploverz-ongoing': {}, 'anime/oploverz-search': { query: 'One Piece' },
  'ai/phi2': { prompt: 'Berapa 2 + 2? Jawab singkat.', temperature: 0.7 },
  'primbon/nomorhoki': { phoneNumber: '12025550123' }, 'primbon/artinama': { nama: 'Budi' },
  'primbon/zodiak': { zodiak: 'aries' }, 'primbon/kecocokan_nama_pasangan': { nama1: 'Budi', nama2: 'Sari' },
  'primbon/rejeki_hoki_weton': demoBirth, 'primbon/sifat_usaha_bisnis': demoBirth,
  'primbon/ramalanjodoh': demoPartners, 'primbon/ramalanjodohbali': demoPartners,
  ...Object.fromEntries('affect beautiful blur circle delete facepalm greyscale invert'.split(' ').map((name) => [`canvas/${name}`, { image: demoImage }])),
  'canvas/batslap': { image1: demoImage, image2: demoImage }, 'canvas/kiss': { image1: demoImage, image2: demoImage },
  'canvas/darkness': { image: demoImage, amount: 50 }, 'canvas/captcha': { background: demoBackground, captchaKey: 'DEMO12' },
  'canvas/gay': { nama: 'Demo', avatar: demoImage, num: 87 },
  'canvas/security': { avatar: demoImage, background: demoBackground, createdTimestamp: 1672531200000, suspectTimestamp: 604800000, locale: 'en' },
  'canvas/profile': { ...demoCard, rankName: 'Bronze', rankId: '0', exp: 500, requireExp: 1000, level: 3 },
  'canvas/level-up': { ...demoCard, fromLevel: '0', toLevel: '1' },
  'canvas/ship': { avatar1: demoImage, avatar2: demoImage, background: demoBackground, persen: 20 },
  'canvas/spotify': { title: 'Demo Track', artist: 'Demo Artist', start: 15000, end: 200000, image: demoImage },
  'canvas/sertifikat-tolol': { text: 'DEMO' },
  'canvas/top': { background: demoBackground, usersData: JSON.stringify([{ top: 1, avatar: demoImage, tag: 'Demo', score: 10 }]) },
  'canvas/welcomev1': { ...demoGuild, guildIcon: demoImage }, 'canvas/welcomev2': demoGuild, 'canvas/welcomev3': demoAvatar,
  'canvas/welcomev4': { avatar: demoImage, background: demoBackground, description: 'Selamat Datang!' }, 'canvas/welcomev5': demoGuild,
  'canvas/goodbyev1': { ...demoGuild, guildIcon: demoImage }, 'canvas/goodbyev2': demoGuild,
  'canvas/goodbyev4': { avatar: demoImage, background: demoBackground, title: 'Sampai jumpa', description: 'Terima kasih!' }, 'canvas/goodbyev5': demoGuild
};
for (const [route, input] of Object.entries(siputzxAdditions)) {
  checks.push([`Siputzx Tambahan ${route}`, () => {
    const slug = route.replace(/[/_]/g, '-');
    const [scrape] = Object.values(require(`./scrape-siputzx-${slug}`));
    return scrape({ ...input, cache: false });
  }, (result) => {
    assert.equal(result.endpoint, route);
    if (route.startsWith('canvas/') || route === 'tools/ssweb') {
      assert.match(result.data.mimeType, /^image\/(?:png|jpeg|gif|webp)$/);
      assert.ok(Buffer.from(result.data.base64, 'base64').length > 0);
    }
  }]);
}

for (const [name, check, verify] of checks) {
  test(name, { timeout: 60000 }, async () => {
    const result = await check();
    assert.equal(result.status, true, JSON.stringify(result));
    if (result.total !== undefined) assert.ok(result.total > 0, 'Contoh seharusnya menghasilkan setidaknya satu item');
    if (name === 'Open Food Facts staging') assert.equal(result.found, true);
    if (name === 'Wayback') assert.equal(result.found, true);
    verify?.(result);
  });
}
