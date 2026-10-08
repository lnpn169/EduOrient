// Build trang HỌC SINH: hocsinh.js -> hocsinh.min.js, hocsinh.css -> hocsinh.min.css (nén gọn, giống cách app.min.js đã làm).
//   Chạy:  node build-hocsinh.mjs        (được gọi tự động trong `npm run build` và firebase predeploy)
//
// QUAN TRỌNG: hocsinh.js là script thường (không phải module) và hocsinh.html gọi hàm bằng thuộc tính onclick="logout()"...
// nên tên hàm cấp cao nhất PHẢI giữ nguyên. Không bật bundle / format nên esbuild chỉ rút gọn khoảng trắng,
// cú pháp và tên biến CỤC BỘ, còn tên hàm/biến toàn cục giữ nguyên. Sau khi build, script tự kiểm tra lại điều này.
// File nguồn hocsinh.js / hocsinh.css vẫn là file bạn sửa tay; chỉ deploy (và HTML trỏ tới) bản .min.
import { build } from 'esbuild';
import { readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const JOBS = [
    { src: 'hocsinh.js',  out: 'hocsinh.min.js',  js: true  },
    { src: 'hocsinh.css', out: 'hocsinh.min.css', js: false },
];

const fail = (msg) => { console.error('✖ ' + msg); process.exit(1); };
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

for (const j of JOBS) {
    if (!existsSync(j.src)) fail('Không thấy ' + j.src);
    rmSync(j.out, { force: true });
    await build({
        entryPoints: [j.src],
        outfile: j.out,
        bundle: false,                  // KHÔNG gộp / không bọc IIFE: giữ nguyên biến & hàm toàn cục
        minify: true,
        legalComments: 'none',
        logLevel: 'warning',
        ...(j.js ? { target: 'es2019', platform: 'browser' } : {}),
    });
}

// ---- Kiểm tra 1: mọi hàm cấp cao nhất của hocsinh.js còn nguyên tên trong bản min (nếu không, onclick="..." sẽ hỏng)
{
    const src = readFileSync('hocsinh.js', 'utf8'), out = readFileSync('hocsinh.min.js', 'utf8');
    // hocsinh.js thụt lề 8 khoảng trắng (hoặc 0) cho code cấp cao nhất; hàm lồng bên trong thụt sâu hơn nên không bị tính
    const names = new Set([...src.matchAll(/^(?: {8})?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map((m) => m[1]));
    const missing = [...names].filter((n) => !new RegExp('function\\s+' + n.replace(/\$/g, '\\$') + '\\s*\\(').test(out));
    if (missing.length) fail('Các hàm toàn cục bị đổi tên/mất trong hocsinh.min.js: ' + missing.join(', ') + '. KHÔNG deploy bản này.');
    console.log('✔ Giữ nguyên tên ' + names.size + ' hàm toàn cục (onclick="..." vẫn hoạt động)');
}

// ---- Kiểm tra 2: hocsinh.html phải trỏ tới bản .min (không còn trỏ file nguồn)
{
    const html = readFileSync('hocsinh.html', 'utf8');
    if (/(?:src|href)="\/?hocsinh\.(?:js|css)(?:\?|")/.test(html)) fail('hocsinh.html còn trỏ tới hocsinh.js / hocsinh.css (nguồn). Phải là hocsinh.min.js / hocsinh.min.css.');
    for (const j of JOBS) if (!html.includes(j.out)) fail('hocsinh.html chưa tham chiếu ' + j.out);
}

// ---- Báo cáo dung lượng
for (const j of JOBS) {
    const a = statSync(j.src).size, b = statSync(j.out).size;
    const g = gzipSync(readFileSync(j.out)).length, g0 = gzipSync(readFileSync(j.src)).length;
    console.log(`  ${j.out}: ${kb(a)} -> ${kb(b)}  (gzip: ${kb(g0)} -> ${kb(g)})`);
}
console.log('✔ Build trang học sinh xong');
