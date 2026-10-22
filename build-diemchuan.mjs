// Build ĐIỂM CHUẨN: diemchuan.csv  ->  khối DC_REAL trong hocsinh.js
//
//   node build-diemchuan.mjs --init   Tạo / cập nhật diemchuan.csv: liệt kê MỌI cặp (trường, ngành) mà hocsinh.js đang có.
//                                     Dòng đã điền số liệu được GIỮ NGUYÊN; chỉ thêm các cặp còn thiếu. Không bao giờ ghi đè số bạn đã nhập.
//   node build-diemchuan.mjs          Đọc diemchuan.csv, kiểm tra, rồi ghi bảng vào khối  // <DC_REAL> ... // </DC_REAL>  của hocsinh.js.
//   node build-diemchuan.mjs --check  Chỉ kiểm tra csv + báo cáo độ phủ, KHÔNG ghi hocsinh.js.
//
// Cột của diemchuan.csv:
//   truong_id, nganh_id, truong, nganh, d2023, d2024, d2025, nguon
//   - truong_id / nganh_id : mã dùng trong code (đừng sửa). truong / nganh chỉ để bạn đọc cho dễ.
//   - d2023, d2024, d2025  : điểm chuẩn thang 30 (xét điểm thi tốt nghiệp THPT). Dùng dấu chấm: 25.5. Để trống = chưa có số liệu (app dùng ước tính dự phòng).
//   - nguon                : BẮT BUỘC khi đã điền điểm (link đề án tuyển sinh / thông báo điểm chuẩn của trường). Dòng có điểm mà thiếu nguon sẽ bị báo lỗi.
//
// Chỉ những dòng điền ĐỦ 3 năm mới vào DC_REAL (app yêu cầu đúng 3 con số). Dòng điền thiếu năm -> báo cảnh báo và bỏ qua.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const SRC = 'hocsinh.js', CSV = 'diemchuan.csv';
const YEARS = [2023, 2024, 2025];
const HEADER = ['truong_id', 'nganh_id', 'truong', 'nganh', ...YEARS.map((y) => 'd' + y), 'nguon'];
const argv = new Set(process.argv.slice(2));
const fail = (m) => { console.error('✖ ' + m); process.exit(1); };

if (!existsSync(SRC)) fail('Không thấy ' + SRC + ' (chạy lệnh này ở thư mục gốc dự án).');
const src = readFileSync(SRC, 'utf8');
const lines = src.split('\n');

// ---------- 1. Lấy danh sách trường + ngành thật từ hocsinh.js (chạy đúng đoạn code khai báo dữ liệu, không đụng tới DOM) ----------
function loadCatalog() {
    const iU = lines.findIndex((l) => /^const UNIS\s*=/.test(l));
    if (iU < 0) fail('Không tìm thấy "const UNIS = [" trong ' + SRC);
    let eU = iU; while (eU < lines.length && !/^\]\.map\(/.test(lines[eU])) eU++;   // UNIS kết thúc bằng dòng "].map((u) => ({...}))"
    if (eU >= lines.length) fail('Không tìm thấy dòng kết thúc "].map(" của UNIS trong ' + SRC);
    const iM = lines.findIndex((l) => /^\s*const MJ\s*=\s*\{/.test(l));
    const iO = lines.findIndex((l) => /^\s*const mjOf\s*=/.test(l));
    if (iM < 0 || iO < 0 || iO < iM) fail('Không tìm thấy khối MJ ... mjOf trong ' + SRC + ' (cấu trúc file đã đổi?).');
    const code = lines.slice(iU, eU + 1).join('\n') + '\n' + lines.slice(iM, iO + 1).join('\n') +
        '\n;globalThis.__out = { UNIS, MJ, mjOf };';
    const ctx = vm.createContext({ foldVN: (s) => s });   // foldVN chỉ dùng để tạo trường tìm kiếm, không ảnh hưởng mã trường/ngành
    try { vm.runInContext(code, ctx, { filename: SRC, timeout: 5000 }); }
    catch (e) { fail('Không đọc được dữ liệu trường/ngành từ ' + SRC + ': ' + e.message); }
    const { UNIS, MJ, mjOf } = ctx.__out;
    const unis = new Map(UNIS.map((u) => [u.id, u.name]));
    const pairs = [];
    for (const [uid, uname] of unis) for (const k of mjOf(uid)) pairs.push({ uid, k, uname, mname: MJ[k][0] });
    return { unis, pairs, MJ };
}

// ---------- 2. CSV (RFC 4180 đơn giản: hỗ trợ dấu ngoặc kép, dấu phẩy và xuống dòng trong ô) ----------
function parseCsv(text) {
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
        else if (c === '"') q = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some((x) => x.trim() !== '')) rows.push(row); row = []; }
        else cur += c;
    }
    row.push(cur); if (row.some((x) => x.trim() !== '')) rows.push(row);
    return rows;
}
const csvCell = (v) => { v = String(v ?? ''); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCsv = (rows) => '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';   // BOM + CRLF để Excel mở đúng tiếng Việt

function readExisting() {
    if (!existsSync(CSV)) return new Map();
    const rows = parseCsv(readFileSync(CSV, 'utf8'));
    if (!rows.length) return new Map();
    const h = rows[0].map((x) => x.trim().toLowerCase()), col = (n) => h.indexOf(n);
    for (const n of ['truong_id', 'nganh_id', ...YEARS.map((y) => 'd' + y), 'nguon']) if (col(n) < 0) fail(CSV + ' thiếu cột "' + n + '". Cột bắt buộc: ' + HEADER.join(', '));
    const m = new Map();
    rows.slice(1).forEach((r, i) => {
        const get = (n) => (r[col(n)] ?? '').trim();
        m.set(get('truong_id') + '|' + get('nganh_id'), { line: i + 2, uid: get('truong_id'), k: get('nganh_id'), ys: YEARS.map((y) => get('d' + y)), nguon: get('nguon') });
    });
    return m;
}

const { unis, pairs, MJ } = loadCatalog();

// ---------- 3. --init: sinh / bổ sung diemchuan.csv ----------
if (argv.has('--init')) {
    const old = readExisting();
    const out = [HEADER];
    let kept = 0, added = 0;
    for (const p of pairs) {
        const e = old.get(p.uid + '|' + p.k);
        if (e) kept++; else added++;
        out.push([p.uid, p.k, p.uname, p.mname, ...(e ? e.ys : ['', '', '']), e ? e.nguon : '']);
    }
    // giữ lại dòng cũ không còn khớp cặp nào trong code (đề phòng bạn đổi tên mã) - để cuối file, không xóa dữ liệu của bạn
    const live = new Set(pairs.map((p) => p.uid + '|' + p.k));
    let orphan = 0;
    for (const [key, e] of old) if (!live.has(key)) { orphan++; out.push([e.uid, e.k, unis.get(e.uid) || '(không có trong code)', MJ[e.k] ? MJ[e.k][0] : '(không có trong code)', ...e.ys, e.nguon]); }
    writeFileSync(CSV, toCsv(out));
    console.log('✔ Đã ghi ' + CSV + ': ' + pairs.length + ' cặp (trường, ngành) — giữ ' + kept + ' dòng cũ, thêm ' + added + ' dòng mới' + (orphan ? ', ' + orphan + ' dòng cũ không còn khớp code (xếp cuối file, hãy kiểm tra)' : '') + '.');
    console.log('  Mở bằng Excel / Google Sheets, điền d2023, d2024, d2025 và nguon, rồi chạy:  node build-diemchuan.mjs');
    process.exit(0);
}

// ---------- 4. Build: csv -> DC_REAL ----------
if (!existsSync(CSV)) {
    console.warn('⚠ Chưa có ' + CSV + ' -> bỏ qua bước điểm chuẩn (app vẫn dùng số ước tính dự phòng). Tạo file mẫu bằng:  node build-diemchuan.mjs --init');
    process.exit(0);
}
const rows = readExisting();
const errors = [], warns = [], real = {};
let used = 0, empty = 0;
for (const e of rows.values()) {
    const where = CSV + ' dòng ' + e.line + ' (' + e.uid + ' / ' + e.k + '): ';
    const filled = e.ys.filter((x) => x !== '').length;
    if (filled === 0) { empty++; continue; }
    if (!unis.has(e.uid)) { errors.push(where + 'truong_id không tồn tại trong hocsinh.js'); continue; }
    if (!MJ[e.k]) { errors.push(where + 'nganh_id không tồn tại trong hocsinh.js'); continue; }
    if (filled < YEARS.length) { warns.push(where + 'mới điền ' + filled + '/' + YEARS.length + ' năm -> bỏ qua (cần đủ 3 năm ' + YEARS.join(', ') + ')'); continue; }
    const nums = e.ys.map((x) => Number(x.replace(',', '.')));
    if (nums.some((n) => !Number.isFinite(n) || n < 10 || n > 30)) { errors.push(where + 'điểm phải là số trong khoảng 10 - 30 (thang 30), đang là: ' + e.ys.join(' | ')); continue; }
    if (!e.nguon) { errors.push(where + 'có điểm nhưng thiếu cột "nguon" (ghi link / tên văn bản của trường)'); continue; }
    (real[e.uid] ||= {})[e.k] = nums; used++;
}
warns.forEach((w) => console.warn('⚠ ' + w));
if (errors.length) { errors.forEach((x) => console.error('✖ ' + x)); fail(errors.length + ' lỗi trong ' + CSV + ' — chưa ghi hocsinh.js.'); }

const total = pairs.length;
console.log('✔ ' + CSV + ': ' + used + ' cặp hợp lệ, ' + empty + ' dòng còn trống. Độ phủ: ' + used + '/' + total + ' (' + (total ? (used / total * 100).toFixed(1) : 0) + '%)');
if (argv.has('--check')) process.exit(0);

// Ghi khối DC_REAL (giữ đúng thụt lề 8 khoảng trắng như file nguồn; sắp xếp để diff gọn)
const body = Object.keys(real).sort().map((u) => '            ' + JSON.stringify(u) + ': { ' + Object.keys(real[u]).sort().map((k) => JSON.stringify(k) + ': ' + JSON.stringify(real[u][k])).join(', ') + ' }').join(',\n');
const block = '        const DC_REAL = {' + (body ? '\n' + body + '\n        ' : '') + '};';
const iS = lines.findIndex((l) => l.includes('// <DC_REAL>')), iE = lines.findIndex((l) => l.includes('// </DC_REAL>'));
if (iS < 0 || iE < 0 || iE < iS) fail('Không thấy cặp dấu "// <DC_REAL>" ... "// </DC_REAL>" trong ' + SRC + '.');
const next = lines.slice(0, iS + 1).concat(block, lines.slice(iE)).join('\n');
if (next === src) console.log('✔ DC_REAL không đổi — ' + SRC + ' giữ nguyên.');
else { writeFileSync(SRC, next); console.log('✔ Đã ghi DC_REAL vào ' + SRC + ' (' + used + ' cặp). Nhớ chạy build-hocsinh.mjs để cập nhật hocsinh.min.js (npm run build làm sẵn).'); }
