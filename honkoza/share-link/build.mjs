// お渡し資料を「タップするだけで開くリンク（中身は暗号化）」にして GitHub Pages で公開する
// 金融AIカレッジ 本講座のひな形（fulfull）
//
// 使い方（share フォルダの中で）:
//   node build.mjs                        src/ のHTMLを暗号化 →「更新」で記録 → GitHubへ送る
//   node build.mjs --no-push              送らずに作るだけ
//   node build.mjs --stop ファイル名.html   その資料の公開をやめる（元のファイルは src/_stopped/ へ）
//   資料を直すときは、src/ の同じファイル名のまま上書きする（名前を変えるとリンクが変わる）
//
// しくみ:
//   - 資料ごとに別の鍵を作る。Aさんのリンクで、Bさんの資料は開かない
//   - 鍵と元のHTMLは src/ の中だけ。src/ は GitHub に上げない（.gitignore はこのファイルが最初に書く）
//   - 公開される場所の名前はランダム（元のファイル名は外に出ない）
//   - シェアしたときに見える題名は <meta name="share-title" content="お金の地図"> で決める。
//     ここは暗号化されないので、お名前・金額・病気などは書かない。書かなければ「お渡し資料」
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, renameSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';

const ROOT = realpathSync(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, 'src');
const PUB = join(ROOT, 'p');
const args = process.argv.slice(2);
const NO_PUSH = args.includes('--no-push');
const STOP = args.includes('--stop') ? args[args.indexOf('--stop') + 1] : null;

// ── 1. いちばん最初に「GitHubに上げない物」の設定を書く（公開するのは ! の物だけ）
writeFileSync(join(ROOT, '.gitignore'), [
  '# build.mjs が書きます。公開するのは ! のついた物だけです',
  '/*', '!/.gitignore', '!/build.mjs', '!/index.html', '!/.nojekyll', '!/p/', '.DS_Store', ''
].join('\n'));
mkdirSync(SRC, { recursive: true });
mkdirSync(PUB, { recursive: true });
writeFileSync(join(ROOT, 'index.html'), '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>お渡し資料</title><p style="font-family:sans-serif;padding:24px;font-size:18px">お送りしたリンクから開いてください。</p>\n');
writeFileSync(join(ROOT, '.nojekyll'), '');

const git = (...a) => execFileSync('git', ['-c', 'core.quotepath=false', ...a], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const OK_PATH = /^(\.gitignore|build\.mjs|index\.html|\.nojekyll|p\/[a-z0-9]+\/index\.html)$/;
let isRepo = false;
try { isRepo = realpathSync(git('rev-parse', '--show-toplevel')) === ROOT; } catch {}
if (isRepo) {
  const bad = git('ls-files').split(/\r?\n/).filter(f => f && !OK_PATH.test(f));
  if (bad.length) {
    console.error('🚨 公開してはいけない物が、記録に入っています:\n  ' + bad.join('\n  ') +
      '\n「git rm -r --cached ファイル名」で記録から外してから、もう一度動かしてください。');
    process.exit(1);
  }
}

// ── 2. 公開先のURL（https://ユーザー名.github.io/リポジトリ名/）
let remote = '';
if (isRepo) { try { remote = git('remote', 'get-url', 'origin'); } catch {} }
function siteUrl() {
  if (process.env.SITE) return process.env.SITE.replace(/\/?$/, '/');
  const m = remote.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
  if (!m) return null;
  const user = m[1].toLowerCase(), repo = m[2];
  return repo.toLowerCase() === `${user}.github.io` ? `https://${user}.github.io/` : `https://${user}.github.io/${repo}/`;
}
const SITE = siteUrl();

// ── 3. 対応表（src/.slugs.json：ファイル名 → 公開の名前と鍵）。src/ の中なので外には出ない
const MAP_FILE = join(SRC, '.slugs.json');
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {};
if (existsSync(MAP_FILE)) writeFileSync(join(SRC, '.slugs.backup.json'), readFileSync(MAP_FILE));
const stopped = new Set();
const rand = (n, abc) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => abc[b % abc.length]).join('');
const newSlug = () => rand(10, 'abcdefghjkmnpqrstuvwxyz23456789');
const newKey = () => rand(24, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789');

if (STOP) {
  if (!map[STOP]) { console.error('その名前の資料が見つかりません: ' + STOP + '\n公開中: ' + (Object.keys(map).join(', ') || 'なし')); process.exit(1); }
  mkdirSync(join(SRC, '_stopped'), { recursive: true });
  if (existsSync(join(SRC, STOP))) renameSync(join(SRC, STOP), join(SRC, '_stopped', STOP));
  stopped.add(map[STOP].slug);
  delete map[STOP];
  console.log('公開をやめます: ' + STOP);
}

const files = readdirSync(SRC).filter(f => f.toLowerCase().endsWith('.html'));
// src から消えた資料があれば止まる（名前を変えたり消したりすると、送ったリンクが開かなくなるため）
const missing = Object.keys(map).filter(f => !files.includes(f));
if (missing.length) {
  console.error('🚨 送ったリンクの元の資料が src/ に見つかりません:\n  ' + missing.join('\n  ') +
    '\nこのままだと、そのリンクが開かなくなります。\n・続けて公開するなら：同じファイル名で src/ に戻してください\n・公開をやめるなら：node build.mjs --stop ファイル名.html');
  process.exit(1);
}
// 対応表にない公開フォルダがあれば止まる（対応表をなくしたときに、全部のリンクが消えないように）
const known = new Set(Object.values(map).map(e => e.slug));
const unknown = readdirSync(PUB).filter(d => !known.has(d) && !stopped.has(d) && !d.startsWith('.'));
if (unknown.length && !args.includes('--yes')) {
  console.error('🚨 対応表（src/.slugs.json）にない公開フォルダが ' + unknown.length + ' 個あります。\n対応表をなくした可能性があります。src/.slugs.backup.json から戻してください。\nそれらのリンクを開かなくしてよい場合だけ、--yes を付けてもう一度動かします。');
  process.exit(1);
}

if (files.length && !SITE) {
  writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
  console.log('準備はできました。まだGitHubにつながっていないので、資料の公開はしていません。');
  process.exit(0);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64 = u8 => Buffer.from(u8).toString('base64');
async function deriveKey(pw, salt, usage) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, [usage]);
}

const links = [];
for (const f of files) {
  if (!map[f]) map[f] = { slug: newSlug(), key: newKey() };
  const { slug, key } = map[f];
  const raw = readFileSync(join(SRC, f), 'utf8');
  const shareTitle = (raw.match(/<meta\s+name="share-title"\s+content="([^"]*)"/i) || [])[1] || 'お渡し資料';

  // 元のHTMLを丸ごと暗号化（開いたら、そのままのページとして書き直す）
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(key, salt, 'encrypt'), new TextEncoder().encode(raw)));
  // 自分で解き直して、元と同じになるか確かめる
  const back = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await deriveKey(key, salt, 'decrypt'), ct));
  if (back !== raw) { console.error('🚨 暗号化の確かめに失敗しました: ' + f); process.exit(1); }
  const data = new Uint8Array(12 + ct.length); data.set(iv); data.set(ct, 12);
  const url = SITE + 'p/' + slug + '/';

  const shell = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="color-scheme" content="light">
<title>${esc(shareTitle)}</title>
<meta property="og:title" content="${esc(shareTitle)}">
<meta property="og:description" content="タップすると開きます">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<style>
body{margin:0}
#gate{min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;background:#F4FAF8;font-family:"Hiragino Maru Gothic ProN","Hiragino Sans",sans-serif}
#gate .in{max-width:420px;width:100%;background:#fff;border:2px solid #C9E2DB;border-top:6px solid #0E7C86;border-radius:20px;padding:28px 22px;text-align:center}
#gate h1{font-size:22px;font-weight:800;color:#17332D;margin:0 0 10px}
#gate p{margin:0;font-size:17px;color:#44605A;line-height:1.8;font-weight:500}
</style>
</head>
<body>
<div id="gate"><div class="in"><h1>${esc(shareTitle)}</h1><p id="msg">開いています…</p></div></div>
<script>
(async function(){
  var m=(location.hash+'&'+location.search).match(/[#?&]k=([A-Za-z0-9]+)/);
  var msg=document.getElementById('msg');
  if(!m||!window.crypto||!crypto.subtle){msg.textContent='お送りしたリンクから、もう一度開いてください。';return}
  try{
    var d=Uint8Array.from(atob("${b64(data)}"),function(c){return c.charCodeAt(0)});
    var salt=Uint8Array.from(atob("${b64(salt)}"),function(c){return c.charCodeAt(0)});
    var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(m[1]),'PBKDF2',false,['deriveKey']);
    var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    var html=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:d.slice(0,12)},key,d.slice(12)));
    document.open();document.write(html);document.close();
  }catch(e){msg.textContent='お送りしたリンクから、もう一度開いてください。'}
})();
</script>
</body></html>
`;
  mkdirSync(join(PUB, slug), { recursive: true });
  writeFileSync(join(PUB, slug, 'index.html'), shell);
  links.push({ f, url: url + '?k=' + key });
}
writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
// 対応表にない公開フォルダ（公開をやめた物）を消す
for (const d of readdirSync(PUB)) if (!Object.values(map).some(e => e.slug === d)) rmSync(join(PUB, d), { recursive: true, force: true });

// 公開フォルダの中は index.html だけにする（写真などを置いても上がらないように）
for (const d of readdirSync(PUB)) for (const x of readdirSync(join(PUB, d))) if (x !== 'index.html') {
  console.log('公開フォルダに置かれた物を外しました（src/_moved/ へ）: ' + x);
  mkdirSync(join(SRC, '_moved'), { recursive: true });
  renameSync(join(PUB, d, x), join(SRC, '_moved', d + '_' + x));
}

// ── 4. 記録して GitHub へ送る（記録の言葉は毎回「更新」だけ。お名前や資料名は書かない）
if (!NO_PUSH && SITE && remote) {
  git('add', '-A');
  const staged = git('diff', '--cached', '--name-only').split(/\r?\n/).filter(f => f && !OK_PATH.test(f));
  if (staged.length) { git('reset', '-q'); console.error('🚨 公開してはいけない物が入りかけたので止めました:\n  ' + staged.join('\n  ')); process.exit(1); }
  if (git('status', '--porcelain')) {
    try { git('commit', '-q', '-m', '更新'); }
    catch (e) { console.error('🚨 記録できませんでした。git の名前とメールを設定してから、もう一度動かしてください。\n' + (e.stderr || '')); process.exit(1); }
  }
  try { git('push', '-q', '-u', 'origin', 'HEAD'); }
  catch (e) { console.error('🚨 GitHubへ送れませんでした:\n' + (e.stderr || e.message)); process.exit(1); }
  console.log('GitHubへ送りました。見られるようになるまで1〜2分（はじめての公開は10分ほど）かかります。');
}

if (links.length) {
  console.log('\n渡すリンク（資料ごとに鍵が違います。最後まで全部コピーして渡します）:');
  for (const l of links) console.log(`  ${l.f}\n  ${l.url}\n`);
} else {
  console.log('src/ にHTMLがまだありません（置き場所の準備だけ行いました）。');
}
