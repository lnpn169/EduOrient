// Thêm SRI (integrity + crossorigin) cho các <script src="https://..."> tải từ CDN trong hocsinh.html và index.html.
//   Chạy MỘT LẦN trên máy có mạng:   npm run sri          (hoặc: node add-sri.mjs)
//   Đã có integrity thì bỏ qua; muốn tính lại (vd. sau khi đổi phiên bản thư viện):  node add-sri.mjs --force
// Script tải đúng file mà trình duyệt sẽ tải, tính SHA-384 rồi ghi vào thẻ <script>. Nếu CDN bị sửa / bị thay file,
// trình duyệt sẽ từ chối chạy thay vì chạy mã lạ. CHỈ áp dụng cho URL có số phiên bản cố định (URL "latest" sẽ bị bỏ qua).
// KHÔNG gắn vào `npm run build`, vì cần mạng. Sau khi chạy, deploy như bình thường (nhớ mở thử trang học sinh và trang đăng nhập).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PAGES = ['hocsinh.html', 'index.html'];
const HOSTS = ['https://www.gstatic.com/firebasejs/', 'https://cdn.jsdelivr.net/npm/', 'https://cdnjs.cloudflare.com/ajax/libs/'];
const FORCE = process.argv.includes('--force');
const TAG = /<script\b[^>]*\bsrc="(https:\/\/[^"]+)"[^>]*>/g;
const hasVersion = (u) => /@\d+\.\d+\.\d+/.test(u) || /\/\d+\.\d+(\.\d+)?\//.test(u);

const cache = new Map();
async function sri(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' khi tải ' + url);
  const hash = 'sha384-' + createHash('sha384').update(Buffer.from(await res.arrayBuffer())).digest('base64');
  cache.set(url, hash);
  return hash;
}

let failed = 0;
for (const page of PAGES) {
  if (!existsSync(page)) continue;
  const html0 = readFileSync(page, 'utf8');
  let html = html0, changed = 0;
  for (const m of [...html0.matchAll(TAG)]) {
    const tag = m[0], url = m[1];
    if (!HOSTS.some((h) => url.startsWith(h))) continue;
    if (!hasVersion(url)) { console.warn('⚠️  Bỏ qua (URL không gắn số phiên bản cố định): ' + url); continue; }
    if (/\sintegrity=/.test(tag) && !FORCE) continue;
    try {
      const hash = await sri(url);
      const next = tag.replace(/\s+integrity="[^"]*"/, '').replace(/\s+crossorigin(?:="[^"]*")?/, '')
        .replace('src="' + url + '"', 'src="' + url + '" integrity="' + hash + '" crossorigin="anonymous"');
      html = html.replace(tag, next); changed++;
      console.log('  ' + page + ': ' + url.split('/').slice(-2).join('/') + '  ' + hash.slice(0, 18) + '...');
    } catch (e) { failed++; console.error('✖ ' + e.message); }
  }
  if (html !== html0) writeFileSync(page, html, 'utf8');
  console.log(page + ': đã gắn SRI cho ' + changed + ' thẻ');
}
if (failed) { console.error('✖ ' + failed + ' thẻ lỗi (kiểm tra mạng rồi chạy lại). Các thẻ còn lại đã được ghi.'); process.exit(1); }
console.log('✔ Xong. Mở thử hocsinh.html và index.html (Ctrl+Shift+R) để chắc chắn Firebase / SweetAlert2 vẫn nạp được.');
