// Build app.jsx -> app.min.js + các chunk tải theo nhu cầu (chunks/*.js)
//   Cài một lần:  npm i -D esbuild
//   Build:        node build-app.mjs          (thêm --watch để tự build lại khi sửa file)
//
// app.jsx là điểm vào; app-core / app-shared được gộp vào app.min.js (hoặc chunk dùng chung),
// còn app-teacher / app-admin / app-parent được tách thành chunks/*.js nhờ import() động.
// Trang chỉ cần: <script type="module" src="app.min.js?v=..."></script>
//
// SAU KHI BUILD, script tự kiểm tra: không file .js nào được phép còn tham chiếu tới "*.jsx".
// Nếu còn -> build báo lỗi và dừng (không để bản hỏng lọt lên hosting).
import { build, context } from 'esbuild';
import { rmSync, readdirSync, readFileSync, existsSync } from 'node:fs';

rmSync('chunks', { recursive: true, force: true });   // xóa chunk cũ
rmSync('app.min.js', { force: true });                // xóa bản build cũ để không lẫn file lỗi thời

const options = {
    entryPoints: { 'app.min': 'app.jsx' },
    outdir: '.',                        // -> ./app.min.js và ./chunks/*.js
    chunkNames: 'chunks/[name]-[hash]',
    bundle: true,                       // BẮT BUỘC: gộp mọi import './app-*.jsx' vào output, kể cả import() động
    splitting: true,                    // bắt buộc đi cùng format 'esm'
    format: 'esm',
    platform: 'browser',
    loader: { '.jsx': 'jsx' },
    jsx: 'transform',                   // React.createElement (React nạp qua CDN, biến toàn cục)
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    minify: true,
    target: 'es2019',
    legalComments: 'none',
    metafile: true,
    logLevel: 'info',
};

// Kiểm tra output: không còn tham chiếu .jsx, và có đủ chunk giáo viên / quản trị / phụ huynh
function verify() {
    const files = ['app.min.js'];
    if (existsSync('chunks')) for (const f of readdirSync('chunks')) if (f.endsWith('.js')) files.push('chunks/' + f);
    const bad = [];
    for (const f of files) {
        const src = readFileSync(f, 'utf8');
        if (/["'`][^"'`\s]*\.jsx["'`]/.test(src)) bad.push(f);
    }
    if (!existsSync('app.min.js')) { console.error('✖ Không thấy app.min.js'); process.exit(1); }
    if (bad.length) {
        console.error('✖ Output còn tham chiếu tới file .jsx: ' + bad.join(', '));
        console.error('  -> Kiểm tra lại: có bật bundle:true không? Có đang deploy nhầm app.jsx / app-*.jsx không?');
        process.exit(1);
    }
    const chunkCount = files.length - 1;
    if (chunkCount < 3) console.warn('⚠ Chỉ có ' + chunkCount + ' chunk (mong đợi >= 3: teacher/admin/parent). Kiểm tra splitting.');
    console.log('✔ Build hợp lệ: app.min.js + ' + chunkCount + ' chunk, không còn tham chiếu .jsx');
}

if (process.argv.includes('--watch')) {
    options.plugins = [{ name: 'verify', setup(b) { b.onEnd(() => { try { verify(); } catch (e) {} }); } }];
    await (await context(options)).watch();
} else {
    await build(options);
    verify();
}
