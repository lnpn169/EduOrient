// Chạy tự động ở predeploy (sau `npm run build`):
//  1) Đóng dấu phiên bản nội dung (?v=<hash>) cho các file tĩnh trong index.html / hocsinh.html
//     -> file đổi nội dung thì URL đổi (trình duyệt tải bản mới), file không đổi thì được cache vĩnh viễn.
//  2) Ghi danh sách URL đã đóng dấu vào sw.js (VERSIONED_ASSETS) để Service Worker tải sẵn / dọn bản cũ.
//  3) Đổi CACHE_NAME (cache của HTML) để Service Worker được cập nhật mỗi lần deploy.
const fs = require('fs');
const crypto = require('crypto');

// File tĩnh của app (tên file nằm cùng thư mục gốc). Thêm file mới vào đây là đủ.
const ASSETS = ['app.min.js', 'tailwind.min.css', 'edu-common.js', 'edu-icons.js', 'wrapped-core.js', 'index.css', 'hocsinh.min.js', 'hocsinh.min.css', 'hocsinh-tw.min.css'];
const PAGES = ['index.html', 'hocsinh.html'];
const SW_PATH = './sw.js';

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const newVersion = `eduorient-v${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

// ---- 1) hash nội dung từng file tĩnh
const versioned = {}; // tên file -> '/tên?v=hash'
for (const name of ASSETS) {
  if (!fs.existsSync(name)) {
    console.warn(`⚠️  Không thấy ${name} - bỏ qua (nếu đây là file build, hãy chạy "npm run build" trước)`);
    continue;
  }
  const hash = crypto.createHash('sha1').update(fs.readFileSync(name)).digest('hex').slice(0, 10);
  versioned[name] = `/${name}?v=${hash}`;
}

// ---- 2) cập nhật thẻ <script src> / <link href> trong các trang HTML
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const page of PAGES) {
  if (!fs.existsSync(page)) continue;
  let html = fs.readFileSync(page, 'utf8');
  let changed = 0;
  for (const [name, url] of Object.entries(versioned)) {
    const re = new RegExp(`((?:src|href)=")/?${esc(name)}(?:\\?v=[0-9a-f]+)?(")`, 'g');
    html = html.replace(re, (_, a, b) => { changed++; return `${a}${url.slice(1)}${b}`; });
  }
  fs.writeFileSync(page, html, 'utf8');
  console.log(`   ${page}: đã đóng dấu ${changed} tham chiếu`);
}

// ---- 3) cập nhật sw.js
let sw = fs.readFileSync(SW_PATH, 'utf8');
const list = Object.values(versioned).map((u) => `  '${u}'`).join(',\n');
sw = sw.replace(
  /\/\/ <VERSIONED-ASSETS>[\s\S]*?\/\/ <\/VERSIONED-ASSETS>/,
  `// <VERSIONED-ASSETS> (tự động ghi bởi update-sw.js - đừng sửa tay)\nconst VERSIONED_ASSETS = [\n${list}\n];\n// </VERSIONED-ASSETS>`
);
sw = sw.replace(/const CACHE_NAME = '.*';/, `const CACHE_NAME = '${newVersion}';`);
fs.writeFileSync(SW_PATH, sw, 'utf8');
console.log(`\n✅ [Auto-Version] CACHE_NAME = "${newVersion}" | ${Object.keys(versioned).length} file tĩnh đã đóng dấu\n`);
