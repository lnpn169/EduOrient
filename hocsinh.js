
        const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        // Icon SVG từ bộ sprite edu-icons.js (cùng bộ icon cho toàn trang). ico('trophy') -> <svg>…; thêm màu: ico('medal','#f59e0b')
        function ico(n, c) { return '<svg class=ic aria-hidden=true' + (c ? ' style=color:' + c : '') + '><use href=#i-' + n + '></use></svg>'; }

        // Ảnh đại diện mặc định: vẽ chữ cái đầu bằng SVG ngay trong trình duyệt (không gửi tên học sinh ra trang ngoài, không tốn lượt tải ảnh)
        const AV_CACHE = new Map();
        function initialsAv(name, bg, len) {
            len = len || 2;
            const key = (name || '') + '|' + bg + '|' + len;
            if (AV_CACHE.has(key)) return AV_CACHE.get(key);
            const w = String(name == null ? '?' : name).normalize('NFC').trim().split(/\s+/).filter(Boolean);
            let t;
            if (!w.length) t = '?';
            else if (len <= 2 && w.length >= 2) t = Array.from(w[0])[0] + Array.from(w[w.length - 1])[0];
            else t = Array.from(w[0]).slice(0, len).join('');
            t = t.toUpperCase().replace(/[&<>"']/g, '');
            const fs = t.length >= 4 ? 17 : t.length === 3 ? 21 : 27;
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="' + bg + '"/><text x="32" y="32" dy=".35em" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="' + fs + '" fill="#fff">' + t + '</text></svg>';
            const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
            if (AV_CACHE.size > 300) AV_CACHE.clear();
            AV_CACHE.set(key, uri);
            return uri;
        }
        // ===================== TỈNH / TRƯỜNG THPT & LỚP =====================
// Cấu trúc: PROVINCES = [{ id, name, s: [[tên trường, nhóm, từ khóa tìm kiếm (không bắt buộc)], ...] }]
// Muốn thêm trường cho một tỉnh khác: thêm các dòng ['Tên trường', '', 'từ khóa'] vào mảng s của tỉnh đó.
const OTHER_SCHOOL = '__other__';
const GROUP_KW = { LC: 'Lào Cai', YB: 'Yên Bái', TPYB: 'Yên Bái' };   // từ khóa tìm kiếm ẩn, KHÔNG hiển thị ra giao diện
const PROVINCES = [
    { id: 'lao-cai', name: 'Lào Cai', s: [
        // --- Nhóm trường: Lào Cai ---
        ['THPT Chuyên Lào Cai', 'LC', 'Bắc Cường'], ['THPT Lào Cai', 'LC', 'Cốc Lếu'], ['THPT Cam Đường', 'LC', 'Xuân Tăng'], ['THPT Lê Hồng Phong', 'LC', 'Duyên Hải'],
        ['THPT Lương Thế Vinh', 'LC', 'Cam Đường'], ['PTDTNT THPT Lào Cai', 'LC', 'Kim Tân dân tộc nội trú'], ['THCS&THPT Bắc Cường', 'LC', 'Bắc Cường'], ['TH, THCS&THPT Ardingly Việt Nam', 'LC', 'Bắc Cường'],
        ['THPT số 1 Bảo Thắng', 'LC', 'Phố Lu'], ['THPT số 2 Bảo Thắng', 'LC', 'Xuân Giao'], ['THPT số 3 Bảo Thắng', 'LC', 'Phong Hải'], ['PTDTNT THCS&THPT Bảo Thắng', 'LC', 'Phố Lu dân tộc nội trú'],
        ['THPT số 1 Bảo Yên', 'LC', 'Phố Ràng'], ['THPT số 2 Bảo Yên', 'LC', 'Bảo Hà'], ['THPT số 3 Bảo Yên', 'LC', 'Nghĩa Đô'], ['PTDTNT THCS&THPT Bảo Yên', 'LC', 'Phố Ràng dân tộc nội trú'],
        ['THPT số 1 Bát Xát', 'LC', 'Bát Xát'], ['THPT số 2 Bát Xát', 'LC', 'Bản Vược'], ['THCS&THPT Bát Xát', 'LC', 'Mường Hum'], ['PTDTNT THCS&THPT Bát Xát', 'LC', 'Bát Xát dân tộc nội trú'],
        ['THPT số 1 Bắc Hà', 'LC', 'Bắc Hà'], ['THPT số 2 Bắc Hà', 'LC', 'Bảo Nhai'], ['THCS&THPT Bắc Hà', 'LC', 'Lùng Phình'], ['PTDTNT THCS&THPT Bắc Hà', 'LC', 'Bắc Hà dân tộc nội trú'],
        ['THPT số 1 Mường Khương', 'LC', 'Mường Khương'], ['THPT số 2 Mường Khương', 'LC', 'Bản Lầu'], ['THPT số 3 Mường Khương', 'LC', 'Cao Sơn'], ['PTDTNT THCS&THPT Mường Khương', 'LC', 'Mường Khương dân tộc nội trú'],
        ['THPT số 1 Si Ma Cai', 'LC', 'Si Ma Cai'], ['THPT số 2 Si Ma Cai', 'LC', 'Sín Chéng'], ['PTDTNT THCS&THPT Si Ma Cai', 'LC', 'Si Ma Cai dân tộc nội trú'],
        ['THPT số 1 Văn Bàn', 'LC', 'Khánh Yên'], ['THPT số 2 Văn Bàn', 'LC', 'Võ Lao'], ['THPT số 3 Văn Bàn', 'LC', 'Dương Quỳ'], ['THPT số 4 Văn Bàn', 'LC', 'Khánh Yên Hạ'], ['PTDTNT THCS&THPT Văn Bàn', 'LC', 'Khánh Yên dân tộc nội trú'],
        ['THPT số 1 Sa Pa', 'LC', 'Phan Si Păng'], ['THPT số 2 Sa Pa', 'LC', 'Bản Hồ'], ['PTDTNT THCS&THPT Sa Pa', 'LC', 'Phan Si Păng dân tộc nội trú'], ['THPT Hoàng Liên', 'LC', 'Tả Phìn'],
        // --- Nhóm trường: TP. Yên Bái ---
        ['THPT Chuyên Nguyễn Tất Thành', 'TPYB', 'Văn Phú chuyên'], ['THPT Lý Thường Kiệt', 'TPYB', 'Yên Bái'], ['THPT Nguyễn Huệ', 'TPYB', 'Yên Bái'], ['THPT Hoàng Quốc Việt', 'TPYB', 'Âu Lâu'],
        ['PTDTNT THPT Yên Bái', 'TPYB', 'Văn Phú dân tộc nội trú'], ['TH-THCS&THPT Pasteur', 'TPYB', 'Yên Bái'],
        // --- Nhóm trường: các huyện, thị xã Yên Bái ---
        ['THPT Chu Văn An', 'YB', 'Mậu A Văn Yên'], ['THPT Nguyễn Lương Bằng', 'YB', 'Mậu A Văn Yên'], ['THPT Trần Phú', 'YB', 'Đông Cuông Văn Yên'], ['THPT Lê Quý Đôn', 'YB', 'Trấn Yên'],
        ['THPT Hoàng Văn Thụ', 'YB', 'Lục Yên'], ['THPT Mai Sơn', 'YB', 'Lâm Thượng Lục Yên'], ['THPT Hồng Quang', 'YB', 'Khánh Hòa Lục Yên'], ['THPT Trần Nhật Duật', 'YB', 'Yên Bình'], ['THPT Thác Bà', 'YB', 'Yên Bình'], ['THPT Cảm Ân', 'YB', 'Bảo Ái Yên Bình'], ['THPT Cảm Nhân', 'YB', 'Yên Bình'],
        ['THPT Nghĩa Lộ', 'YB', 'Nghĩa Lộ'], ['THPT Nguyễn Trãi', 'YB', 'Trung Tâm Nghĩa Lộ'], ['PTDTNT THPT Miền Tây', 'YB', 'Nghĩa Lộ dân tộc nội trú'],
        ['THPT Văn Chấn', 'YB', 'Cát Thịnh'], ['THPT Sơn Thịnh', 'YB', 'Văn Chấn'], ['THPT Hưng Khánh', 'YB', 'Trấn Yên'],
        ['THPT Mù Cang Chải', 'YB', 'Mù Cang Chải'], ['THPT Trạm Tấu', 'YB', 'Hạnh Phúc Trạm Tấu'],
        ['THCS&THPT Nậm Búng', 'YB', 'Gia Hội Văn Chấn'], ['THCS&THPT Nghĩa Tâm', 'YB', 'Văn Chấn'], ['THCS&THPT Púng Luông', 'YB', 'Mù Cang Chải']
    ] },
    { id: 'ha-noi', name: 'TP. Hà Nội' }, { id: 'hue', name: 'TP. Huế' }, { id: 'hai-phong', name: 'TP. Hải Phòng' }, { id: 'da-nang', name: 'TP. Đà Nẵng' },
    { id: 'can-tho', name: 'TP. Cần Thơ' }, { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh' },
    { id: 'an-giang', name: 'An Giang' }, { id: 'bac-ninh', name: 'Bắc Ninh' }, { id: 'ca-mau', name: 'Cà Mau' }, { id: 'cao-bang', name: 'Cao Bằng' },
    { id: 'dak-lak', name: 'Đắk Lắk' }, { id: 'dien-bien', name: 'Điện Biên' }, { id: 'dong-nai', name: 'Đồng Nai' }, { id: 'dong-thap', name: 'Đồng Tháp' },
    { id: 'gia-lai', name: 'Gia Lai' }, { id: 'ha-tinh', name: 'Hà Tĩnh' }, { id: 'hung-yen', name: 'Hưng Yên' }, { id: 'khanh-hoa', name: 'Khánh Hòa' },
    { id: 'lai-chau', name: 'Lai Châu' }, { id: 'lam-dong', name: 'Lâm Đồng' }, { id: 'lang-son', name: 'Lạng Sơn' }, { id: 'nghe-an', name: 'Nghệ An' },
    { id: 'ninh-binh', name: 'Ninh Bình' }, { id: 'phu-tho', name: 'Phú Thọ' }, { id: 'quang-ngai', name: 'Quảng Ngãi' }, { id: 'quang-ninh', name: 'Quảng Ninh' },
    { id: 'quang-tri', name: 'Quảng Trị' }, { id: 'son-la', name: 'Sơn La' }, { id: 'tay-ninh', name: 'Tây Ninh' }, { id: 'thai-nguyen', name: 'Thái Nguyên' },
    { id: 'thanh-hoa', name: 'Thanh Hóa' }, { id: 'tuyen-quang', name: 'Tuyên Quang' }, { id: 'vinh-long', name: 'Vĩnh Long' }
];
const slugVN = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const foldVN = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
// Lào Cai đứng đầu, các tỉnh/thành còn lại xếp theo bảng chữ cái tiếng Việt
const SCHOOL_DB = PROVINCES.map((p) => ({ id: p.id, name: p.name, schools: (p.s || []).map((t) => ({ id: p.id + '-' + slugVN(t[0]), name: t[0], kw: ((t[2] || '') + ' ' + (GROUP_KW[t[1]] || '')).trim() })) }))
    .sort((a, b) => a.id === 'lao-cai' ? -1 : b.id === 'lao-cai' ? 1 : a.name.replace(/^TP\. /, '').localeCompare(b.name.replace(/^TP\. /, ''), 'vi'));
const provinceById = (id) => SCHOOL_DB.find((p) => p.id === id) || null;
// Từ targetSchoolId suy ra tỉnh (id có dạng "<id tỉnh>-<slug trường>"). Trả null với id cũ (ví dụ mã đại học "BKA") => coi như chưa chọn trường.
function parseSchoolInfo(id) {
    if (!id || typeof id !== 'string') return null;
    const p = SCHOOL_DB.find((x) => id.indexOf(x.id + '-') === 0);
    return p ? { province: p, school: p.schools.find((s) => s.id === id) || null } : null;
}
const schoolNameOf = (p) => (p && p.targetSchoolName && parseSchoolInfo(p.targetSchoolId)) ? p.targetSchoolName : '';
const cleanSchoolName = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80);
// ===== PHẦN 2: CÁCH LY DỮ LIỆU THEO TRƯỜNG =====
// "Cùng trường" = tên trường trùng (bỏ dấu, không phân biệt hoa/thường) VÀ (nếu cả hai biết tỉnh) cùng tỉnh.
const normSchool = s => foldVN(s).replace(/[^a-z0-9]+/g, ' ').trim();
const provinceOfSchoolName = (name) => { const p = SCHOOL_DB.find((x) => x.schools.some((t) => t.name === name)); return p ? p.id : ''; };
const schoolOfProfile = (p) => {   // giáo viên => school/province; học sinh => targetSchoolName/targetSchoolId
    if (!p) return { name: '', prov: '' };
    if (p.role === 'teacher') { const n = cleanSchoolName(p.school); return { name: n, prov: p.province || provinceOfSchoolName(n) }; }
    const info = parseSchoolInfo(p.targetSchoolId);
    return { name: info ? cleanSchoolName(p.targetSchoolName) : '', prov: info ? info.province.id : '' };   // chưa chọn trường / mã cũ => không thuộc trường nào
};
const sameSchoolOf = (a, b) => !!a.name && !!b.name && normSchool(a.name) === normSchool(b.name) && (!a.prov || !b.prov || a.prov === b.prov);

// ---- Chọn lớp linh hoạt theo loại trường ----
//  Trường Chuyên (tên có từ "Chuyên"): [Khối 10-12] + [Môn chuyên]      => "11 Toán", "10 Anh"
//  Trường thường:                      [Khối 10-12] + [Chữ A-L] + [Số 1-10] => "11A8"
// Mỗi mục: [giá trị lưu trong chuỗi lớp, nhãn hiển thị]
const SPECIAL_SUBJECTS = [['Toán', 'Toán'], ['Tin', 'Tin'], ['Lý', 'Lý'], ['Hóa', 'Hóa'], ['Sinh', 'Sinh'], ['Văn', 'Văn'], ['Sử', 'Sử'], ['Địa', 'Địa'],
    ['Anh', 'Tiếng Anh'], ['Trung', 'Tiếng Trung'], ['Pháp', 'Tiếng Pháp'], ['Không/Cận chuyên', 'Không Chuyên / Cận Chuyên']];
const CLS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L'];
const byId = (id) => document.getElementById(id);
const rangeOpts = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => '<option value="' + (a + i) + '">' + (a + i) + '</option>').join('');
// id các ô chọn trường của 2 form: 'reg' (đăng ký) và 'edit' (modal-edit)
const UNIS = [['ptit', 'Học viện Công nghệ Bưu chính Viễn thông', 'PTIT'], ['hust', 'Đại học Bách khoa Hà Nội', 'HUST'], ['neu', 'Đại học Kinh tế Quốc dân', 'NEU'], ['ftu', 'Đại học Ngoại thương', 'FTU'],
    ['vnu-uet', 'ĐH Quốc gia Hà Nội - ĐH Công nghệ', 'VNU-UET'], ['vnu-ueb', 'ĐH Quốc gia Hà Nội - ĐH Kinh tế', 'VNU-UEB'], ['vnu-hus', 'ĐH Quốc gia Hà Nội - ĐH Khoa học Tự nhiên', 'VNU-HUS'],
    ['vnu-ussh', 'ĐH Quốc gia Hà Nội - ĐH Khoa học Xã hội & Nhân văn', 'VNU-USSH'], ['vnu-ulis', 'ĐH Quốc gia Hà Nội - ĐH Ngoại ngữ', 'VNU-ULIS'],
    ['ba', 'Học viện Ngân hàng', 'BA'], ['aof', 'Học viện Tài chính', 'AOF'], ['hnue', 'Đại học Sư phạm Hà Nội', 'HNUE'], ['hanu', 'Đại học Hà Nội', 'HANU'], ['hmu', 'Đại học Y Hà Nội', 'HMU'],
    ['tmu', 'Đại học Thương mại', 'TMU'], ['utc', 'Đại học Giao thông Vận tải', 'UTC'], ['huce', 'Đại học Xây dựng Hà Nội', 'HUCE'], ['haui', 'Đại học Công nghiệp Hà Nội', 'HaUI'],
    ['ajc', 'Học viện Báo chí và Tuyên truyền', 'AJC'], ['dav', 'Học viện Ngoại giao', 'DAV'], ['ppa', 'Học viện Cảnh sát Nhân dân', 'PPA'], ['annd', 'Học viện An ninh Nhân dân', 'ANND'],
    ['hlu', 'Đại học Luật Hà Nội', 'HLU'], ['hup', 'Đại học Dược Hà Nội', 'HUP'], ['tlu', 'Đại học Thủy lợi', 'TLU'], ['vnua', 'Học viện Nông nghiệp Việt Nam', 'VNUA'],
    ['hou', 'Đại học Mở Hà Nội', 'HOU'], ['hau', 'Đại học Kiến trúc Hà Nội', 'HAU'], ['humg', 'Đại học Mỏ - Địa chất', 'HUMG'], ['fptu', 'Đại học FPT', 'FPTU']
].map((u) => ({ id: u[0], name: u[1], sub: u[2], hay: foldVN(u[1] + ' ' + u[2]) }));   // Top 30 ĐH tại Hà Nội (sửa danh sách tại đây)
const ALL_SCHOOLS = SCHOOL_DB.flatMap((p) => p.schools.map((s) => ({ id: s.id, name: s.name, sub: p.name, pid: p.id, hay: foldVN(s.name + ' ' + s.kw + ' ' + p.name) })));
// Ô chọn 1 input dùng chung (THPT + ĐH): bấm/focus => hiện TẤT CẢ, gõ => lọc không dấu. Chỉ chọn được mục có sẵn.
function makeCombo(inp, items, onChange) {
    const list = document.createElement('div'); list.className = 'combo-list'; inp.after(list);
    const st = { sel: null };
    let cur = items;   // danh sách đang hiển thị; có thể đổi bằng _combo.setItems() (ví dụ lọc theo Tỉnh)
    const show = () => {
        const q = foldVN(inp.value.trim()), shown = (st.sel && inp.value === st.sel.name) || !q ? cur : cur.filter((i) => i.hay.includes(q));
        list._shown = shown; list.style.display = 'block';
        list.innerHTML = shown.length ? shown.map((i, k) => '<div class="combo-item' + (st.sel && st.sel.id === i.id ? ' sel' : '') + '" data-k="' + k + '"><span>' + esc(i.name) + '</span>' + (i.sub ? '<small>' + esc(i.sub) + '</small>' : '') + '</div>').join('') : '<div class="combo-empty"><svg class=ic aria-hidden=true><use href=#i-close-circle></use></svg> Không tìm thấy kết quả phù hợp</div>';
    };
    inp.addEventListener('focus', show); inp.addEventListener('click', show);
    inp.addEventListener('input', () => { if (st.sel) { st.sel = null; if (onChange) onChange(null); } show(); });
    list.addEventListener('mousedown', (e) => {
        const d = e.target.closest('.combo-item'); if (!d) return; e.preventDefault();
        st.sel = list._shown[+d.dataset.k]; inp.value = st.sel.name; list.style.display = 'none'; if (onChange) onChange(st.sel);
    });
    document.addEventListener('mousedown', (e) => { if (e.target !== inp && !list.contains(e.target)) list.style.display = 'none'; });
    inp._combo = { get sel() { return st.sel; }, set(it) { st.sel = it || null; inp.value = it ? it.name : ''; list.style.display = 'none'; }, setItems(arr) { cur = arr || []; list.style.display = 'none'; } };
}
const PICK = { reg: { q: 'reg-school-search' }, edit: { q: 'searchSchoolInput' } };
const isSpecialSchool = (name) => /\bchuyen\b/.test(foldVN(name));   // "THPT Chuyên Lào Cai" => true (không phân biệt hoa/thường, có/không dấu)

function fillClassSelects(prefix) {
    byId(prefix + '-cls-k').innerHTML = '<option value="">Khối</option>' + rangeOpts(10, 12);
    byId(prefix + '-cls-c').innerHTML = '<option value="">Chữ</option>' + CLS_LETTERS.map((c) => '<option value="' + c + '">' + c + '</option>').join('');
    byId(prefix + '-cls-n').innerHTML = '<option value="">Số</option>' + rangeOpts(1, 10);
    byId(prefix + '-cls-sk').innerHTML = '<option value="">Khối</option>' + rangeOpts(10, 12);
    byId(prefix + '-cls-sub').innerHTML = '<option value="">Môn chuyên</option>' + SPECIAL_SUBJECTS.map((x) => '<option value="' + x[0] + '">' + x[1] + '</option>').join('');
}
// Phân tích chuỗi lớp đã lưu: trả { type: 'special'|'normal', ... } hoặc null nếu không đúng định dạng nào
function parseClass(cls) {
    const s = String(cls || '').trim();
    let m = /^(1[0-2])\s+(.+)$/.exec(s);
    if (m) { const sub = SPECIAL_SUBJECTS.find((x) => foldVN(x[0]) === foldVN(m[2].trim())); if (sub) return { type: 'special', k: m[1], sub: sub[0] }; }
    m = /^(1[0-2])([A-Za-z])(\d{1,2})$/.exec(s);
    if (m && CLS_LETTERS.includes(m[2].toUpperCase()) && +m[3] >= 1 && +m[3] <= 10) return { type: 'normal', k: m[1], c: m[2].toUpperCase(), n: String(+m[3]) };
    return null;
}
const classFitsSchool = (cls, schoolName) => { const p = parseClass(cls); return !!p && (p.type === 'special') === isSpecialSchool(schoolName); };
const isSpecialMode = (prefix) => byId(prefix + '-cls-special').style.display !== 'none';
const classHelpMsg = (prefix) => isSpecialMode(prefix) ? 'Hãy chọn đủ Khối và Môn chuyên của lớp (ví dụ: 11 Toán).' : 'Hãy chọn đủ Khối, Chữ và Số của lớp (ví dụ 11 + A + 8 → 11A8).';
function readClass(prefix) {
    const g = (s) => byId(prefix + '-cls-' + s).value;
    if (isSpecialMode(prefix)) { const k = g('sk'), sub = g('sub'); return k && sub ? k + ' ' + sub : ''; }
    const k = g('k'), c = g('c'), n = g('n');
    return k && c && n ? k + c + n : '';
}
// Điền chuỗi lớp cũ vào các ô theo chế độ đang hiển thị; trả true nếu khớp định dạng của chế độ đó (gọi SAU updateClassMode)
function writeClass(prefix, cls) {
    const p = parseClass(cls), ok = !!p && (p.type === 'special') === isSpecialMode(prefix);
    const km = /^(1[0-2])/.exec(String(cls || '').trim()), k = ok ? p.k : (km ? km[1] : '');
    byId(prefix + '-cls-k').value = k; byId(prefix + '-cls-sk').value = k;
    byId(prefix + '-cls-c').value = ok && p.type === 'normal' ? p.c : '';
    byId(prefix + '-cls-n').value = ok && p.type === 'normal' ? p.n : '';
    byId(prefix + '-cls-sub').value = ok && p.type === 'special' ? p.sub : '';
    return ok;
}

// ---- Ô chọn Tỉnh -> Trường dùng chung cho Đăng ký ('reg') và Chỉnh sửa hồ sơ ('edit') ----
function liveSchoolName(prefix) { const s = byId(PICK[prefix].q)._combo.sel; return s ? s.name : ''; }
// Kiểm tra & đọc trường đã chọn. required=false: không chọn gì thì giữ nguyên trường cũ (school: null). KHÔNG cho tự nhập tên trường.
function readSchool(prefix, required) {
    const inp = byId(PICK[prefix].q), c = inp._combo, prov = provinceById(byId(prefix + '-province').value);
    if (c.sel) return { ok: true, school: { id: c.sel.id, name: c.sel.name } };
    if (inp.value.trim()) return { ok: false, msg: 'Hãy chọn trường THPT trong danh sách gợi ý (không thể tự nhập tên trường).' };
    if (prov && !prov.schools.length) {   // tỉnh chưa có danh sách trường: đăng ký phải chờ, còn sửa hồ sơ thì bỏ qua phần trường
        return required ? { ok: false, msg: 'Danh sách trường THPT của ' + prov.name + ' đang được cập nhật nên chưa thể đăng ký. Bạn hãy quay lại sau nhé!' } : { ok: true, school: null };
    }
    if (prov) return { ok: false, msg: 'Hãy chọn Trường THPT của bạn.' };
    return required ? { ok: false, msg: 'Hãy chọn Tỉnh / Thành phố và Trường THPT của bạn.' } : { ok: true, school: null };
}
// Điền danh sách 34 tỉnh/thành vào ô chọn Tỉnh của form 'reg' / 'edit' (Lào Cai đứng đầu, còn lại theo bảng chữ cái)
function fillProvinceSelect(prefix) {
    byId(prefix + '-province').innerHTML = '<option value="">-- Chọn Tỉnh / Thành phố --</option>' + SCHOOL_DB.map((p) => '<option value="' + p.id + '">' + esc(p.name) + '</option>').join('');
}
// Chọn Tỉnh => ô Trường chỉ hiện trường của tỉnh đó. keepSchool=true: giữ trường đang chọn (dùng khi mở form sửa hồ sơ).
// Tỉnh chưa có danh sách trường: khóa ô Trường và hiện ghi chú. Thêm trường cho tỉnh trong PROVINCES (mảng s) là tự mở khóa.
function setProvince(prefix, provId, keepSchool) {
    const inp = byId(PICK[prefix].q), sel = byId(prefix + '-province'), note = byId(prefix + '-province-note'), prov = provinceById(provId);
    const items = prov ? ALL_SCHOOLS.filter((s) => s.pid === prov.id) : [];
    sel.value = prov ? prov.id : '';
    inp._combo.setItems(items);
    if (!keepSchool) inp._combo.set(null);
    inp.disabled = !items.length;
    inp.placeholder = !prov ? 'Hãy chọn Tỉnh / Thành phố trước...' : items.length ? 'Bấm để xem tất cả trường, gõ để lọc...' : 'Chưa có danh sách trường của tỉnh này';
    note.style.display = prov && !items.length ? 'block' : 'none';
    note.innerText = prov && !items.length ? 'Danh sách trường THPT của ' + prov.name + ' đang được cập nhật. Bạn hãy quay lại sau nhé!' : '';
    updateClassMode(prefix);
}
function updateClassMode(prefix) {
    let name = liveSchoolName(prefix);
    if (!name && prefix === 'edit') name = user.targetSchoolName || '';
    const sp = isSpecialSchool(name), was = isSpecialMode(prefix);
    byId(prefix + '-cls-normal').style.display = sp ? 'none' : '';
    byId(prefix + '-cls-special').style.display = sp ? '' : 'none';
    byId(prefix + '-cls-label').innerText = (prefix === 'reg' ? 'Lớp của bạn' : 'Lớp') + (sp ? ' (Khối + Môn chuyên, VD: 11 Toán)' : ' (Khối + Chữ + Số, VD: 11A8)');
    if (sp !== was) {
        byId(prefix + (sp ? '-cls-sk' : '-cls-k')).value = byId(prefix + (sp ? '-cls-k' : '-cls-sk')).value;
        ['c', 'n', 'sub'].forEach((s) => { byId(prefix + '-cls-' + s).value = ''; });
        const nt = byId(prefix + '-cls-note'); if (nt) nt.style.display = 'none';   // form đăng ký không có ô ghi chú này
    }
}
function initPickers() {
    ['reg', 'edit'].forEach(fillClassSelects);
    ['reg', 'edit'].forEach((p) => {
        fillProvinceSelect(p);
        makeCombo(byId(PICK[p].q), ALL_SCHOOLS, () => updateClassMode(p));
        byId(p + '-province').addEventListener('change', (e) => setProvince(p, e.target.value));
        setProvince(p, '');   // ban đầu chưa chọn Tỉnh => ô Trường tạm khóa
    });
    makeCombo(byId('school-search-input'), ALL_SCHOOLS, (it) => { tempSelectedSchool = it; byId('btn-confirm-school').disabled = !it || (!!user.targetSchoolName && chargeState().charges <= 0); });
    makeCombo(byId('asp-school'), ALL_SCHOOLS); makeCombo(byId('asp-uni'), UNIS);
}
function soonFeature() { return eduAlert('Tính năng đang được phát triển, vui lòng quay lại sau!', 'warning'); }

        let user = { 
            name: "", level: "", schoolClass: "", points: 0, 
            targetSchoolId: null, targetSchoolName: null, uniId: null, uniName: null,
            isLocked: true,
            analysisData: null
        };

        // CHỨC NĂNG 1: HỒ SƠ HƯỚNG NGHIỆP
        function openHoSoHuongNghiep() {
            if(!user.analysisData) {
                return eduAlert("Bạn chưa thực hiện phân tích điểm! Hãy sang tab 'Phân Tích' nhập điểm trước.", 'warning');
            }
            let data = user.analysisData;
            let html = `
                <div style="background:#eff6ff; padding:14px; border-radius:12px; margin-bottom:12px; border-left:4px solid var(--primary);">
                    <h3 style="color:var(--primary); font-size:15px; margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-chart-box></use></svg> Thế Mạnh Cá Nhân</h3>
                    <p style="font-size:13px;">Khối thi tối ưu nhất: <b>${data.topKhoi} (${data.monHoc})</b></p>
                    <p style="font-size:13px;">Tổng điểm quy đổi năng lực: <b>${data.diemTong} điểm</b></p>
                </div>

                <div style="background:#f0fdf4; padding:14px; border-radius:12px; margin-bottom:12px; border-left:4px solid var(--green);">
                    <h3 style="color:var(--green); font-size:15px; margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-lightbulb-on></use></svg> Nhóm Ngành Nên Học</h3>
                    <p style="font-size:13px; line-height:1.4;">${data.nganhGoiY}</p>
                </div>

                <div style="background:#fef3c7; padding:14px; border-radius:12px; margin-bottom:12px; border-left:4px solid #d97706;">
                    <h3 style="color:#b45309; font-size:15px; margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-domain></use></svg> Trường Đại Học Phù Hợp</h3>
                    <p style="font-size:13px; margin-bottom:6px;">Trường THPT của bạn: <b>${esc(user.targetSchoolName || 'Chưa chọn trường')}</b></p>
                    <p style="font-size:12px; color:#78350f;">Gợi ý thêm: Đại học Quốc gia Hà Nội, Đại học Bách Khoa, Đại học Kinh tế Quốc dân.</p>
                </div>
            `;
            const dd = user.deepData, sug = uniSuggestHtml();
            if (sug) html = html.replace(/<p style="font-size:12px; color:#78350f;">Gợi ý thêm:[^<]*<\/p>/, '<p style="font-size:12px;color:#78350f;margin-top:6px;">Trường mạnh về các ngành em chọn (điểm an toàn ước tính):</p>' + sug);
            if (dd && dd.dob && dd.q && dd.q.length === QS.length && user.uniId) {
                DEEP = JSON.parse(JSON.stringify(dd)); DEEP.majors = DEEP.majors || [];
                const mn = calcMenh(DEEP.dob), H = HANH[mn.hanh], hol = holScore(), top = Object.keys(hol).sort((a, b) => hol[b] - hol[a]).slice(0, 2).map(c => (HOL.find(x => x[0] === c) || [c, c])[1]).join(' • ');
                const ch = deepRank().filter(r => DEEP.majors.includes(r.k)), hsMb = deepMbti(DEEP);
                html += `<div style="background:#faf5ff;padding:14px;border-radius:12px;margin-bottom:12px;border-left:4px solid #9333ea;">
                    <h3 style="color:#7e22ce;font-size:15px;margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-microscope></use></svg> Phân Tích Chuyên Sâu</h3>
                    <p style="font-size:13px;margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-star-four-points></use></svg> Mệnh: <b>${mn.name} (${mn.canchi})</b></p>
                    <p style="font-size:13px;margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-lightbulb-on></use></svg> Thiên hướng nổi bật: <b>${top}</b></p>
                    ${hsMb.done ? `<p style="font-size:13px;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-brain></use></svg> Tính cách (MBTI): <b>${esc(hsMb.type)}</b></p>` : ''}
                    <p style="font-size:13px;margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-school></use></svg> Ngành đã chọn tại <b>${esc(user.uniName || '')}</b>:</p>
                    ${ch.length ? ch.map(r => `<p style="font-size:13px;margin:2px 0;">• <b>${esc(r.name)}</b> (${khoiFull(r.khoi)}) — cần đạt an toàn <b>${r.dc.safe}</b> điểm${r.pts >= r.dc.safe ? ' <svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg>' : ' (thiếu ' + (r.dc.safe - r.pts).toFixed(1) + ')'}</p>`).join('') : '<p style="font-size:12px;color:#7e22ce;">Em chưa chọn ngành nào trong phần Phân tích chuyên sâu.</p>'}</div>`;
            }
            document.getElementById('career-profile-content').innerHTML = html;
            document.getElementById('modal-ho-so-huong-nghiep').style.display = 'flex';
        }

        // CHỨC NĂNG 3: ORIENT NEW & MESSENGER (openMXHHocTap / nhắn tin: xem phần "Nhắn tin" bên dưới)

        function switchMxhTab(type) {
            const chat = type === 'chat';
            document.getElementById('subtab-feed-btn').classList.toggle('active', !chat);
            document.getElementById('subtab-chat-btn').classList.toggle('active', chat);
            document.getElementById('mxh-feed-section').style.display = chat ? 'none' : 'block';
            document.getElementById('mxh-chat-section').style.display = chat ? 'block' : 'none';
            if (chat) { closeChatRoom(); renderChatList(); }
            else stopRoomListener();
        }

        // BẢNG CHỌN TRƯỜNG (Tỉnh -> Trường) & MODAL GENERAL
        // ===== CƠ CHẾ LƯỢT ĐỔI (cooldown) cho "Đổi trường THPT" và "Đổi nguyện vọng Đại học" =====
        // Tối đa 2 lượt tích trữ, 12 giờ hồi 1 lượt. Lưu trong hồ sơ Firestore: schoolChangeCharges (số lượt) + lastSchoolChangeTime (mốc ms).
        // Tài khoản mới / tài khoản cũ chưa có dữ liệu => mặc định 2 lượt. Lần chọn ĐẦU TIÊN (từ chưa chọn) không tốn lượt.
        const CHANGE_MAX = 2, CHANGE_REGEN_MS = 12 * 3600 * 1000;
        function chargeState(now) {
            now = now || Date.now();
            let c = typeof user.schoolChangeCharges === 'number' ? Math.floor(user.schoolChangeCharges) : CHANGE_MAX;
            let t = Number(user.lastSchoolChangeTime) || 0, gained = 0;
            c = Math.max(0, Math.min(CHANGE_MAX, c));
            if (c < CHANGE_MAX) {
                if (!t || t > now) t = now;   // dữ liệu thiếu / lệch giờ: bắt đầu đếm từ bây giờ
                gained = Math.min(CHANGE_MAX - c, Math.floor((now - t) / CHANGE_REGEN_MS));
                if (gained > 0) { c += gained; t += gained * CHANGE_REGEN_MS; }   // giữ phần dư của chu kỳ 12 giờ đang chạy
            }
            return { charges: c, last: t, gained, nextMs: c < CHANGE_MAX ? Math.max(0, t + CHANGE_REGEN_MS - now) : 0 };
        }
        function fmtWait(ms) { const m = Math.max(1, Math.ceil(ms / 60000)); return Math.floor(m / 60) + ' giờ ' + (m % 60) + ' phút'; }
        // Tự cộng lượt đã hồi, cập nhật user + Firestore (chỉ ghi khi thực sự có lượt mới hồi)
        function applyChargeRegen() {
            const st = chargeState();
            if (st.gained > 0) {
                user.schoolChangeCharges = st.charges; user.lastSchoolChangeTime = st.last;
                try { fbDb.collection('profiles').doc(ME.uid).set({ schoolChangeCharges: st.charges, lastSchoolChangeTime: st.last }, { merge: true }).catch(() => {}); } catch (e) {}
            }
            return st;
        }
        function spendCharge() { const st = chargeState(); user.schoolChangeCharges = Math.max(0, st.charges - 1); user.lastSchoolChangeTime = Date.now(); }
        function noChargePopup(st) {
            return eduAlert('Bạn đã dùng hết lượt đổi khả dụng (Tối đa ' + CHANGE_MAX + ' lượt). Lượt tiếp theo sẽ được hồi sau: ' + fmtWait(st.nextMs) + '.', { icon: 'warning', title: 'Hết lượt đổi' });
        }
        function renderChargeInfo() {
            try {
                const st = chargeState(), zero = st.charges <= 0;
                const txt = 'Lượt đổi còn lại: ' + st.charges + '/' + CHANGE_MAX + (st.charges < CHANGE_MAX ? ' • lượt tiếp theo hồi sau ' + fmtWait(st.nextMs) : '');
                [['bxh-thpt-charges', true], ['bxh-uni-charges', true], ['school-charge-info', false], ['asp-charge-info', false]].forEach(([id, dark]) => {
                    const el = document.getElementById(id); if (!el) return;
                    el.innerText = txt; el.style.color = zero ? (dark ? '#fca5a5' : '#ef4444') : (dark ? '#cbd5e1' : 'var(--text-sub)');
                });
                const b = document.getElementById('btn-asp-save');
                if (b) b.disabled = aspMode === 'uni' && !!user.uniId && zero;
            } catch (e) { console.error(e); }
        }
        setInterval(renderChargeInfo, 30000);

        let tempSelectedSchool = null;
        function openSchoolModal() {
            const had = !!user.targetSchoolName, st = applyChargeRegen();
            tempSelectedSchool = null; byId('school-search-input')._combo.set(null); byId('btn-confirm-school').disabled = true;
            renderChargeInfo();
            byId('school-select-modal').style.display = 'flex';
            if (had && st.charges <= 0) noChargePopup(st);
        }
        // ---- PHẦN 2.1: Chống spam nút "Phân Tích Định Hướng" (cooldown 60 giây, nhớ cả khi F5) ----
        const PT_COOLDOWN_SEC = 60;
        let PT_CD_TIMER = null, PT_CD_END = 0, PT_CD_LABEL = '';
        const ptCdKey = () => 'eduorient_pt_cd_' + (ME ? ME.uid : '');
        function ptCooldownActive() { return PT_CD_END > Date.now(); }
        function ptCooldownStop() {
            if (PT_CD_TIMER) { clearInterval(PT_CD_TIMER); PT_CD_TIMER = null; }
            PT_CD_END = 0;
            try { if (ME) localStorage.removeItem(ptCdKey()); } catch (e) {}
            const btn = document.getElementById('btn-pt-basic');
            if (btn) { btn.disabled = false; if (PT_CD_LABEL) btn.textContent = PT_CD_LABEL; }
        }
        function ptCooldownStart(endAt) {
            const btn = document.getElementById('btn-pt-basic'); if (!btn) return;
            if (PT_CD_TIMER) { clearInterval(PT_CD_TIMER); PT_CD_TIMER = null; }   // không để 2 bộ đếm chạy chồng nhau
            if (!PT_CD_LABEL) PT_CD_LABEL = btn.textContent.trim() || 'Phân Tích Định Hướng';
            PT_CD_END = endAt || (Date.now() + PT_COOLDOWN_SEC * 1000);
            try { if (ME) localStorage.setItem(ptCdKey(), String(PT_CD_END)); } catch (e) {}
            const tick = () => {
                const left = Math.ceil((PT_CD_END - Date.now()) / 1000);   // tính theo giờ thực nên không lệch khi tab bị làm chậm
                if (left <= 0) { ptCooldownStop(); return; }
                btn.disabled = true; btn.textContent = 'Thử lại sau ' + left + 's';
            };
            tick();
            if (PT_CD_END > Date.now()) PT_CD_TIMER = setInterval(tick, 250);
        }
        function ptCooldownResume() {                    // gọi sau khi đăng nhập / F5: còn thời gian thì tiếp tục đếm
            try {
                const end = parseInt(localStorage.getItem(ptCdKey()) || '0', 10);
                if (end > Date.now() && end - Date.now() <= PT_COOLDOWN_SEC * 1000 + 2000) ptCooldownStart(end); else if (end) localStorage.removeItem(ptCdKey());
            } catch (e) {}
        }

        // ---- Đồng hồ 30 giây sau khi có kết quả phân tích: học sinh đọc kết quả -> hết giờ mới bật popup BẮT BUỘC chọn Nguyện vọng ĐH ----
        const ASP_WAIT_SEC = 30;
        let ASP_TIMER = null, ASP_END = 0;
        function stopAspCountdown() {
            const oldTimer = ASP_TIMER;
            if (oldTimer) clearInterval(oldTimer);       // luôn hủy bộ đếm cũ
            ASP_TIMER = null;
            const box = document.getElementById('asp-countdown'); if (box) box.style.display = 'none';
        }
        function startAspCountdown() {
            const oldTimer = ASP_TIMER;
            if (oldTimer) clearInterval(oldTimer);       // BẮT BUỘC hủy bộ đếm cũ trước khi chạy bộ đếm 30s mới (tránh đè nhau => kẹt ở 30s)
            ASP_TIMER = null;
            stopAspCountdown();
            if (user.uniId) return;   // đã có nguyện vọng -> không cần bắt buộc lại
            const box = $('asp-countdown'), sec = $('asp-countdown-sec'), bar = $('asp-countdown-bar');
            ASP_END = Date.now() + ASP_WAIT_SEC * 1000;
            box.style.display = ''; sec.innerText = ASP_WAIT_SEC;
            bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth; bar.style.transition = 'width .9s linear';
            let myTimer = null;
            const tick = () => {
                if (ASP_TIMER !== myTimer) { clearInterval(myTimer); return; }   // bộ đếm này đã bị thay thế => tự hủy, không ghi đè số giây
                const left = Math.max(0, Math.ceil((ASP_END - Date.now()) / 1000));   // tính theo giờ thực nên không lệch khi tab bị trình duyệt làm chậm
                sec.innerText = left; bar.style.width = (left / ASP_WAIT_SEC * 100) + '%';
                if (left > 0) return;
                stopAspCountdown();
                if (!user.uniId && $('modal-asp').style.display !== 'flex') openAsp('post');   // hết giờ: mở popup, bắt buộc chọn
            };
            myTimer = setInterval(tick, 250);
            ASP_TIMER = myTimer;
        }
        // ---- Nguyện vọng Đại học ----
        // Mode 'post'  : BẮT BUỘC, hiện ngay sau khi học sinh phân tích xong (nếu chưa có nguyện vọng). Không có nút đóng.
        // Mode 'uni'   : tự chọn / đổi nguyện vọng ĐH từ Hồ sơ hoặc BXH (chọn lần đầu miễn phí, đổi tốn 1 lượt).
        // Mode 'school': tài khoản cũ chưa có trường THPT -> chỉ chọn trường (KHÔNG bắt buộc nguyện vọng ĐH).
        // Đăng ký mới / mở app KHÔNG còn ép nhập nguyện vọng ĐH.
        let aspMode = 'uni', ACC_DELETING = false;
        function openAsp(mode) {
            aspMode = mode;
            const post = mode === 'post', schoolOnly = mode === 'school';
            const showSchool = schoolOnly || (post && !user.targetSchoolName);
            $('asp-school-row').style.display = showSchool ? '' : 'none';
            $('asp-uni-row').style.display = schoolOnly ? 'none' : '';
            $('asp-close').style.display = (post || schoolOnly) ? 'none' : '';
            $('asp-hint').style.display = post ? '' : 'none';
            $('asp-hint').innerText = 'Dựa trên kết quả phân tích, hãy chọn/nhập Nguyện vọng Đại học mong muốn của bạn.';
            $('asp-title').innerHTML = post ? ico('bullseye-arrow') + ' Chọn Nguyện vọng Đại học' : schoolOnly ? ico('domain') + ' Chọn Trường THPT' : (user.uniId ? 'Đổi nguyện vọng Đại học' : 'Chọn nguyện vọng Đại học');
            $('asp-school')._combo.set(ALL_SCHOOLS.find((s) => s.id === user.targetSchoolId) || null);
            $('asp-uni')._combo.set(UNIS.find((u) => u.id === user.uniId) || null);
            const st = applyChargeRegen(); renderChargeInfo();
            $('modal-asp').style.display = 'flex';
            if (mode === 'uni' && user.uniId && st.charges <= 0) noChargePopup(st);
        }
        function saveAsp() {
            const schoolOnly = aspMode === 'school', needUni = !schoolOnly;
            const withSchool = $('asp-school-row').style.display !== 'none';
            const sc = $('asp-school')._combo.sel, un = $('asp-uni')._combo.sel;
            if (withSchool && !sc) return eduAlert('Hãy chọn Trường THPT đang theo học trong danh sách.', 'warning');
            if (needUni && !un) return eduAlert('Hãy chọn Trường Đại học mục tiêu trong danh sách.', 'warning');
            // Chỉ tốn lượt khi ĐỔI một nguyện vọng đã có sang nguyện vọng khác (lần chọn đầu tiên miễn phí)
            const uniChanged = needUni && !!user.uniId && un.id !== user.uniId;
            if (needUni && !withSchool && !uniChanged && user.uniId) { closeModal('modal-asp'); return eduAlert('Đây đã là nguyện vọng hiện tại của bạn.', 'info'); }
            if (uniChanged) { const st = applyChargeRegen(); if (st.charges <= 0) { renderChargeInfo(); return noChargePopup(st); } }
            const prev = { sid: user.targetSchoolId, sname: user.targetSchoolName, uid: user.uniId, uname: user.uniName, cc: user.schoolChangeCharges, ct: user.lastSchoolChangeTime };
            if (uniChanged) spendCharge();
            if (withSchool) { user.targetSchoolId = sc.id; user.targetSchoolName = sc.name; }
            if (needUni) { user.uniId = un.id; user.uniName = un.name; }
            Promise.resolve(saveProfile()).then((ok) => {
                if (ok === false) { Object.assign(user, { targetSchoolId: prev.sid, targetSchoolName: prev.sname, uniId: prev.uid, uniName: prev.uname, schoolChangeCharges: prev.cc, lastSchoolChangeTime: prev.ct }); renderChargeInfo(); return; }
                // Lưu nguyện vọng vào users/{uid}.nguyenVong (nguồn hiển thị cho Cổng Phụ huynh); profiles.uniId/uniName vẫn dùng cho BXH
                if (needUni) fbDb.collection('users').doc(ME.uid).update({ nguyenVong: { id: un.id, name: un.name } }).catch((e) => console.warn('Chưa ghi được users.nguyenVong (hãy publish firestore.rules mới):', e));
                closeModal('modal-asp'); stopAspCountdown();
                refreshUI(); renderUniBXH(); renderChargeInfo();
                const done = eduAlert(needUni ? un.name : sc.name, { icon: 'success', title: needUni ? 'Đã lưu nguyện vọng Đại học' : 'Đã cập nhật trường' });
                if (withSchool && !classFitsSchool(user.schoolClass, user.targetSchoolName)) done.then(() => eduAlert('Lớp hiện tại "' + (user.schoolClass || '') + '" chưa phù hợp với loại trường vừa chọn. Hãy cập nhật lại lớp của bạn.', 'warning')).then(() => openEdit());
            });
        }
        let activeBxhTab = 'thpt';   // 'thpt' | 'daihoc'
        function switchBXH(w) {
            activeBxhTab = w === 'daihoc' ? 'daihoc' : 'thpt';
            $('bxh-pane-thpt').style.display = activeBxhTab === 'thpt' ? '' : 'none';
            $('bxh-pane-daihoc').style.display = activeBxhTab === 'daihoc' ? '' : 'none';
            ['thpt', 'daihoc'].forEach((k) => { const b = $('bxh-btn-' + k), on = k === activeBxhTab; b.style.background = on ? 'var(--card-bg)' : 'transparent'; b.style.color = on ? 'var(--primary)' : 'var(--text-sub)'; b.style.boxShadow = on ? '0 1px 3px rgba(0,0,0,.12)' : 'none'; });
            // Tab ĐH luôn hiển thị BXH của đúng trường nguyện vọng của chính học sinh (không còn dropdown chọn trường khác)
            try { renderUniBXH(); renderChargeInfo(); } catch (e) { console.error(e); }
        }
        function renderUniBXH() {
            const myUni = user.uniId && UNIS.some((u) => u.id === user.uniId) ? user.uniId : '';
            $('bxh-uni-name').innerText = user.uniName || 'Chưa chọn nguyện vọng';
            if (!myUni) { bxhMe('bxh-me-uni', null); bxhPodium('bxh-podium-uni', null); $('bxh-uni-count').innerText = ''; $('bxh-uni-list').innerHTML = '<p style="font-size:13px;color:var(--text-sub)">Bạn chưa chọn nguyện vọng Đại học. Hãy hoàn thành phần Phân Tích rồi chọn nguyện vọng, hoặc bấm "Đổi nguyện vọng Đại học" để chọn ngay.</p>'; return; }
            const rows = bxhRows(e => e.u === myUni);
            bxhMe('bxh-me-uni', rows); bxhPodium('bxh-podium-uni', rows);
            const nReg = bxhRows(e => e.u === myUni, true).length;   // đếm cả người chưa có XP
            $('bxh-uni-count').innerHTML = ico('school') + ' ' + esc(user.uniName || '') + ' • ' + nReg + ' học sinh đăng ký';
            $('bxh-uni-list').innerHTML = bxhListHtml(rows) || '<p style="font-size:13px;color:var(--text-sub)">' + (nReg ? (BXH_WEEK ? 'Tuần này chưa ai có XP. Hãy làm bài tập để lên bảng xếp hạng!' : 'Chưa ai có XP. Hãy làm bài tập để lên bảng xếp hạng!') : 'Chưa có học sinh nào chọn nguyện vọng này.') + '</p>'; bxhLazyAvatars('bxh-uni-list');
        }
        // ---- Tự xóa tài khoản: xác thực lại -> xóa Firestore -> xóa tài khoản đăng nhập -> đăng xuất ----
        async function selfDeleteAccount() {
            const u = fbAuth.currentUser; if (!u) return;
            if (!(await eduConfirm('Thao tác này sẽ xóa vĩnh viễn dữ liệu tài khoản của bạn và không thể khôi phục.', { title: 'Xóa tài khoản?', confirmText: 'Xóa vĩnh viễn', danger: true }))) return;
            try {
                if (u.providerData.some((p) => p.providerId === 'password')) {
                    const pw = await eduPrompt('Nhập mật khẩu hiện tại để xác nhận xóa tài khoản.', { title: 'Xác nhận danh tính', input: 'password', confirmText: 'Xóa tài khoản', maxLength: 100 });
                    if (!pw) return;
                    await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw));
                } else await u.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
                ACC_DELETING = true;
                detachAllListeners();   // gỡ listener trước khi xóa doc của chính mình (tránh permission-denied)
                const b = fbDb.batch(); ['users', 'profiles', 'privates', 'teacherCards'].forEach((c) => b.delete(fbDb.collection(c).doc(u.uid)));
                if (MY_SID) b.delete(fbDb.collection('studentIds').doc(MY_SID));   // trả lại mã học sinh để người khác dùng được
                await b.commit();
                try { await u.delete(); } catch (e) {}
            } catch (e) {
                ACC_DELETING = false;
                return eduAlert(e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'Mật khẩu không đúng.' : 'Không xóa được tài khoản: ' + (e.message || e), 'error');
            }
            await safeSignOut();
        }

        // ===== MÃ OTP CHO PHỤ HUYNH (Tài khoản -> Cài đặt) =====
        // Học sinh tạo mã 6 số, lưu ở parentOtps/{MÃ HS}. Mã sống 5 phút, dùng 1 lần; tạo mã mới sẽ ghi đè (mã cũ mất hiệu lực).
        // Hạn 5 phút do firestore.rules kiểm tra theo giờ MÁY CHỦ (createdAt); đồng hồ đếm ngược ở đây chỉ để hiển thị.
        let OTP_TIMER = null, OTP_CODE = '', OTP_EXP = 0;
        const OTP_TTL_MS = 5 * 60 * 1000;
        function stopOtpTimer() { if (OTP_TIMER) { clearInterval(OTP_TIMER); OTP_TIMER = null; } }
        function closeOtp() { stopOtpTimer(); OTP_CODE = ''; const m = document.getElementById('modal-otp'); if (m) m.style.display = 'none'; }
        function genOtpCode() { const a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return String(a[0] % 1000000).padStart(6, '0'); }
        function tickOtp() {
            const left = OTP_EXP - Date.now(), cd = $('otp-count'), cv = $('otp-code');
            if (!cd) { stopOtpTimer(); return; }
            if (left <= 0) {
                stopOtpTimer();
                cd.innerHTML = '<b style="color:#ef4444">Mã đã hết hạn.</b> Bấm "Tạo mã mới" để lấy mã khác.';
                if (cv) cv.classList.add('expired');
                return;
            }
            const s = Math.ceil(left / 1000);
            cd.innerHTML = 'Còn hiệu lực: <b>' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + '</b>';
        }
        async function createParentOtp() {
            const box = $('otp-box'); if (!box || !ME) return;
            stopOtpTimer(); OTP_CODE = '';
            box.innerHTML = '<p style="font-size:13px;color:var(--text-sub);text-align:center;margin:18px 0;">Đang tạo mã...</p>';
            const code = genOtpCode();
            try {
                await fbDb.collection('parentOtps').doc(MY_SID).set({ studentUid: ME.uid, code: code, createdAt: NOW() });
            } catch (e) {
                closeOtp();
                return eduAlert(e && e.code === 'permission-denied' ? 'Chưa có quyền tạo mã. Hãy Publish firestore.rules mới (có collection parentOtps).' : 'Không tạo được mã: ' + ((e && e.message) || e), 'error');
            }
            OTP_CODE = code; OTP_EXP = Date.now() + OTP_TTL_MS;
            box.innerHTML = '<p class="otp-note">Đưa mã này cho phụ huynh. Phụ huynh vào trang đăng nhập, chọn <b>Phụ huynh</b>, rồi nhập <b>Mã học sinh</b> của em (<b>' + esc(MY_SID) + '</b>) và mã OTP bên dưới.</p>'
                + '<div class="otp-code" id="otp-code" aria-live="polite">' + code.slice(0, 3) + ' ' + code.slice(3) + '</div>'
                + '<div class="otp-count" id="otp-count"></div>'
                + '<div class="otp-actions"><button type="button" class="btn-primary" onclick="copyOtp()">Sao chép mã</button><button type="button" class="btn-outline" onclick="createParentOtp()">Tạo mã mới</button></div>'
                + '<p class="otp-hint">Mã chỉ dùng được 1 lần. Tạo mã mới sẽ làm mã cũ mất hiệu lực. Không gửi mã cho người lạ.</p>';
            tickOtp(); OTP_TIMER = setInterval(tickOtp, 1000);
        }
        function openParentOtp() {
            if (!ME) return;
            if (!MY_SID) return eduAlert('Tài khoản của em chưa có Mã học sinh (ID). Hãy cập nhật Mã học sinh ở trang Hồ sơ trước khi tạo mã cho phụ huynh.', 'warning');
            $('modal-otp').style.display = 'flex';
            createParentOtp();
        }
        async function copyOtp() {
            if (!OTP_CODE || Date.now() >= OTP_EXP) return;
            try { await navigator.clipboard.writeText(OTP_CODE); }
            catch (e) { try { const t = document.createElement('textarea'); t.value = OTP_CODE; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); } catch (e2) { return; } }
            if (typeof eduToast === 'function') eduToast('Đã sao chép mã OTP', 'success');
        }

        function closeModal(id) {
            if (id === 'modal-hw' && window.EXAM_LOCKED) return;   // đang thi: không được thoát
            document.getElementById(id).style.display = 'none';
        }

        // ===== TÀI KHOẢN (điện thoại/tablet): chuyển giữa 3 mục Hồ sơ | Học tập | Cài đặt =====
        function setProfPane(p, noScroll) {
            if (!['profile', 'study', 'settings'].includes(p)) p = 'profile';
            const t = document.getElementById('tab-profile'); if (!t) return;
            t.dataset.pane = p;
            document.querySelectorAll('.prof-subtabs button').forEach(b => { const on = b.dataset.pane === p; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
            try { sessionStorage.setItem('eduorient_prof_pane', p); } catch (e) {}
            if (!noScroll) { try { window.scrollTo({ top: 0 }); } catch (e) {} }
        }
        (function () { let p = 'profile'; try { p = sessionStorage.getItem('eduorient_prof_pane') || 'profile'; } catch (e) {} setProfPane(p, true); })();

        function switchTab(tabId, element, needsUnlock) {
            if(needsUnlock && user.isLocked) {
                return eduAlert("Ứng dụng đang khóa!\nHãy chọn Trường THPT của bạn để mở khóa (làm ngay ở tab Tài khoản hoặc bấm nút \"Chọn trường ngay\").", 'warning');
            }
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item, .side-item').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            document.querySelectorAll('[data-tab="' + tabId + '"]').forEach(el => el.classList.add('active'));   // đồng bộ Sidebar (desktop) + Bottom Nav (mobile)
            if (element) element.classList.add('active');
            const ttl = document.getElementById('top-title');
            if (ttl) ttl.innerText = { 'tab-phantich': 'Phân Tích', 'tab-baitap': 'Bài Tập', 'tab-ai': 'Chat AI', 'tab-bxh': 'Bảng Xếp Hạng', 'tab-profile': 'Tài Khoản' }[tabId] || '';
            updateFab();
            syncAiLayout(tabId === 'tab-ai');
            if (tabId === 'tab-ai') aiEnsureList();   // lần đầu mở Chat AI mới tải lịch sử
            if (tabId === 'tab-bxh' && ME) loadBxh();   // tự bỏ qua nếu cache < 5 phút
        }

        // Chat AI trên máy tính: khóa cuộn CẢ TRANG (chỉ khung tin nhắn / lịch sử cuộn bên trong) và đo chiều cao thanh tiêu đề
        // để khung chat vừa khít màn hình, không còn vùng trống bên dưới. CSS tương ứng: body.ai-tab-on trong hocsinh.css.
        function syncAiLayout(on) {
            if (typeof on === 'boolean') document.body.classList.toggle('ai-tab-on', on);
            const h = document.querySelector('.app-header');
            document.documentElement.style.setProperty('--app-hdr', (h ? h.offsetHeight : 70) + 'px');
            if (on === true) window.scrollTo(0, 0);
        }
        window.addEventListener('resize', () => syncAiLayout());

        // ===== NÚT NỔI NHẮN TIN (Yêu cầu 7) =====
        // Hiện: chỉ khi đang ở Phân Tích / Bài Tập / BXH VÀ không có modal/giao diện sâu nào đang mở
        // (làm bài, đổi mật khẩu, chỉnh sửa hồ sơ, nhắn tin chi tiết, hồ sơ hướng nghiệp, quiz AI, chọn trường, đăng ký...).
        const FAB_TABS = ['tab-phantich', 'tab-baitap', 'tab-bxh'];
        function updateFab() {
            const fab = document.getElementById('fab-chat');
            if (!fab) return;
            const tab = document.querySelector('.tab-content.active');
            const onMainTab = !!tab && FAB_TABS.includes(tab.id);
            const overlayOpen = Array.from(document.querySelectorAll('.fullscreen-overlay'))
                .some(el => getComputedStyle(el).display !== 'none');
            fab.classList.toggle('fab-hidden', !(onMainTab && !overlayOpen));
        }
        // Mọi chỗ mở/đóng modal đều đổi style.display => theo dõi tự động, không cần sửa từng hàm
        (function initFab() {
            const mo = new MutationObserver(updateFab);
            document.querySelectorAll('.fullscreen-overlay').forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['style', 'class'] }));
            updateFab();
        })();


        const HOLLAND = {
            R: ["Tôi thích sửa chữa, lắp ráp đồ vật hoặc làm việc với máy móc.", "Tôi thích tự tay làm ra sản phẩm thực tế."],
            I: ["Tôi thích tìm hiểu vì sao một hiện tượng xảy ra.", "Tôi thích làm thí nghiệm hoặc giải các bài toán khó."],
            A: ["Tôi thích vẽ, viết, thiết kế hoặc sáng tác.", "Tôi thích nghĩ ra ý tưởng mới và thể hiện cá tính của mình."],
            S: ["Tôi thích giúp đỡ, giảng bài cho bạn bè.", "Tôi thích hoạt động tập thể, cộng đồng."],
            E: ["Tôi thích thuyết trình, thuyết phục người khác.", "Tôi thích làm trưởng nhóm hoặc tổ chức sự kiện."],
            C: ["Tôi thích sắp xếp số liệu, giấy tờ ngăn nắp.", "Tôi thích làm việc theo quy trình rõ ràng, tính toán chính xác."]
        };
        const NGANH = [
            {n:"Công nghệ thông tin",k:["A00","A01","D01"],h:"IR"},{n:"Trí tuệ nhân tạo / Khoa học máy tính",k:["A00","A01"],h:"IC"},
            {n:"Cơ khí - Cơ điện tử",k:["A00","A01"],h:"RI"},{n:"Kiến trúc - Thiết kế",k:["A00","A01","D01"],h:"AR"},
            {n:"Y khoa",k:["B00"],h:"IS"},{n:"Dược học",k:["B00","A00"],h:"IC"},{n:"Công nghệ sinh học",k:["B00","A00"],h:"IR"},
            {n:"Tài chính - Ngân hàng",k:["A00","A01","D01"],h:"EC"},{n:"Kế toán - Kiểm toán",k:["A00","D01"],h:"CE"},
            {n:"Quản trị kinh doanh",k:["A00","D01"],h:"ES"},{n:"Marketing - Truyền thông",k:["D01","C00"],h:"EA"},
            {n:"Luật",k:["C00","D01"],h:"ES"},{n:"Báo chí",k:["C00","D01"],h:"AS"},{n:"Ngôn ngữ Anh",k:["D01"],h:"AS"},
            {n:"Sư phạm",k:["A00","D01","C00"],h:"SA"},{n:"Quan hệ quốc tế",k:["D01","C00"],h:"SE"},{n:"Du lịch - Khách sạn",k:["C00","D01"],h:"ES"}];
        // ===== TAB PHÂN TÍCH TRÊN ĐIỆN THOẠI (< 768px): chia 3 bước cho đỡ dài =====
        //  Bước 1: nhập điểm 8 môn | Bước 2: trắc nghiệm sở thích, mỗi lần 1 câu (chọn xong tự sang câu sau) | Bước 3: kết quả.
        //  Chỉ đổi cách HIỂN THỊ: phanTichGop(), HANS, các ô diem-* giữ nguyên nên cách tính không đổi. Laptop không bị ảnh hưởng.
        var PTW = { step: 1, q: 0, ready: false, touched: false, timer: 0 };
        function ptwMobile() { return window.innerWidth < 768; }
        function ptwIds() { var a = []; for (var j = 0; j < 2; j++) for (var k in HOLLAND) a.push(k + j); return a; }
        function ptwEnsure() {
            var v = document.getElementById('pt-basic-view'); if (!v) return false;
            if (!document.getElementById('ptw-style')) {
                var st = document.createElement('style'); st.id = 'ptw-style';
                st.textContent =
                    '#ptw-steps,#ptw-note,#ptw-nav1,#ptw-nav2,#ptw-redo{display:none}' +
                    '@media (max-width:767px){' +
                    '#pt-basic-view .card-desc{display:none}' +
                    '#ptw-steps{display:flex;align-items:center;gap:6px;margin:10px 0 12px}' +
                    '#ptw-steps .ptw-st{display:flex;align-items:center;gap:6px;flex:0 0 auto;border:0;background:none;padding:0;font-family:inherit;font-size:12px;font-weight:700;color:var(--text-sub);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
                    '#ptw-steps .ptw-st:disabled{cursor:default}' +
                    '#ptw-steps .ptw-st i{font-style:normal;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(127,127,127,.25);font-size:12px;color:inherit}' +
                    '#ptw-steps .ptw-st.on{color:var(--primary)}#ptw-steps .ptw-st.on i{background:var(--primary);color:#fff}' +
                    '#ptw-steps .ptw-st.done i{background:#22c55e;color:#fff}' +
                    '#ptw-steps b{flex:1 1 auto;height:2px;min-width:10px;background:rgba(127,127,127,.3);border-radius:1px}' +
                    '#ptw-note{display:block;font-size:12px;color:var(--text-sub);margin:0 0 10px;line-height:1.45}' +
                    '#ptw-nav1{display:block;margin-top:4px}' +
                    '#ptw-nav2{display:block;margin-top:4px}' +
                    '#ptw-nav2 .ptw-q-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}' +
                    '#ptw-qlab{font-size:13px;font-weight:800;color:#8b5cf6}' +
                    '.ptw-ghost{border:1px solid var(--border);background:rgba(127,127,127,.12);color:var(--text-main);border-radius:999px;padding:9px 16px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
                    '.ptw-link{display:block;margin:8px auto 0;border:0;background:none;color:var(--text-sub);text-decoration:underline;font-family:inherit;font-size:12px;cursor:pointer}' +
                    '#ptw-redo{display:block;margin:0 0 10px}#ptw-redo .ptw-ghost{width:100%}' +
                    '#pt-basic-view .score-grid{gap:8px;margin-bottom:10px}#pt-basic-view .score-grid input{padding:10px}' +
                    /* bước 1: ẩn phần Holland + nút phân tích */
                    '#pt-basic-view.pt-s1 .holland-label,#pt-basic-view.pt-s1 #holland-box,#pt-basic-view.pt-s1 .pt-actions,#pt-basic-view.pt-s1 #ptw-nav2,#pt-basic-view.pt-s1 #ptw-redo,#pt-basic-view.pt-s1 #ketqua-phantich{display:none !important}' +
                    /* bước 2: ẩn điểm, chỉ hiện 1 câu Holland; nút phân tích chỉ hiện khi sẵn sàng */
                    '#pt-basic-view.pt-s2 .score-wrap,#pt-basic-view.pt-s2 #ptw-nav1,#pt-basic-view.pt-s2 #ptw-note,#pt-basic-view.pt-s2 #ptw-redo,#pt-basic-view.pt-s2 #ketqua-phantich{display:none !important}' +
                    '#pt-basic-view.pt-s2 #holland-box .h-card{display:none}#pt-basic-view.pt-s2 #holland-box .h-card.ptw-cur{display:block}' +
                    '#pt-basic-view.pt-s2 .h-q{font-size:15px}#pt-basic-view.pt-s2 .h-dot{height:50px;font-size:16px}' +
                    '#pt-basic-view.pt-s2:not(.ptw-ready) .pt-actions{display:none !important}' +
                    '#pt-basic-view.pt-s2.ptw-ready .ptw-link{display:none}' +
                    '#pt-basic-view.pt-s2 .pt-actions{margin-top:12px}' +
                    /* bước 3: chỉ hiện kết quả + nút sửa */
                    '#pt-basic-view.pt-s3 .score-wrap,#pt-basic-view.pt-s3 .holland-label,#pt-basic-view.pt-s3 #holland-box,#pt-basic-view.pt-s3 .pt-actions,#pt-basic-view.pt-s3 #ptw-nav1,#pt-basic-view.pt-s3 #ptw-nav2,#pt-basic-view.pt-s3 #ptw-note{display:none !important}' +
                    '}@media (max-width:359px){#ptw-steps .ptw-st:not(.on) span{display:none}}';
                document.head.appendChild(st);
            }
            if (document.getElementById('ptw-steps')) return true;
            var card = v.querySelector('.card'), title = card && card.querySelector('.card-title'), desc = card && card.querySelector('.card-desc');
            var sw = v.querySelector('.score-wrap'), hl = v.querySelector('.holland-label'), hb = document.getElementById('holland-box'), kq = document.getElementById('ketqua-phantich');
            if (!card || !sw || !hl || !hb) return false;
            function mk(html, id) { var d = document.createElement('div'); d.id = id; d.innerHTML = html; return d; }
            var steps = mk('<button type="button" class="ptw-st" data-s="1" onclick="ptwGo1()"><i>1</i><span>Điểm số</span></button><b></b>' +
                '<button type="button" class="ptw-st" data-s="2" onclick="ptwGo2()"><i>2</i><span>Sở thích</span></button><b></b>' +
                '<button type="button" class="ptw-st" data-s="3" disabled><i>3</i><span>Kết quả</span></button>', 'ptw-steps');
            card.insertBefore(steps, desc || sw);
            card.insertBefore(mk('Nhập điểm 8 môn theo thang 0–10. Môn không học thì nhập 0.', 'ptw-note'), sw);
            sw.parentNode.insertBefore(mk('<button type="button" class="btn-primary" onclick="ptwGo2()">Tiếp tục: Trắc nghiệm sở thích →</button>', 'ptw-nav1'), hl);
            hb.parentNode.insertBefore(mk('<div class="ptw-q-row"><button type="button" class="ptw-ghost" onclick="ptwQ(-1)">‹ Trước</button><span id="ptw-qlab"></span>' +
                '<button type="button" class="ptw-ghost" id="ptw-qnext" onclick="ptwQ(1)">Sau ›</button></div>' +
                '<button type="button" class="ptw-link" onclick="ptwSkip()">Bỏ qua trắc nghiệm, phân tích theo điểm môn</button>', 'ptw-nav2'), hb.nextSibling);
            if (kq) kq.parentNode.insertBefore(mk('<button type="button" class="ptw-ghost" onclick="ptwRedo()"><svg class=ic aria-hidden=true><use href=#i-pencil></use></svg> Sửa điểm / làm lại</button>', 'ptw-redo'), kq);
            return true;
        }
        function ptwRender() {
            var v = document.getElementById('pt-basic-view'); if (!v) return;
            v.classList.remove('pt-s1', 'pt-s2', 'pt-s3'); v.classList.add('pt-s' + PTW.step); v.classList.toggle('ptw-ready', !!PTW.ready);
            v.querySelectorAll('#ptw-steps .ptw-st').forEach(function (b) {
                var n = +b.getAttribute('data-s'); b.classList.toggle('on', n === PTW.step); b.classList.toggle('done', n < PTW.step);
                b.querySelector('i').textContent = n < PTW.step ? '✓' : String(n);
            });
            v.querySelectorAll('#holland-box .h-card').forEach(function (c, i) { c.classList.toggle('ptw-cur', i === PTW.q); });
            var lab = document.getElementById('ptw-qlab'); if (lab) lab.textContent = 'Câu ' + (PTW.q + 1) + '/12';
            var nx = document.getElementById('ptw-qnext'); if (nx) nx.textContent = PTW.q >= 11 ? 'Xong ✓' : 'Sau ›';
        }
        function ptwSync() { if (ptwEnsure()) ptwRender(); }
        function ptwScrollTop() {
            try { var c = document.querySelector('#pt-basic-view .card'); if (c) window.scrollTo({ top: Math.max(0, c.getBoundingClientRect().top + window.pageYOffset - 90), behavior: 'smooth' }); } catch (e) {}
        }
        function ptwGo1() { PTW.touched = true; PTW.step = 1; ptwRender(); ptwScrollTop(); }
        function ptwGo2() {
            PTW.touched = true;
            var miss = (typeof PT_IDS !== 'undefined' ? PT_IDS : []).some(function (k) { var el = document.getElementById('diem-' + k); return !el || el.value === ''; });
            if (miss) return eduAlert('Hãy điền đủ 8 ô. Nhập 0 cho môn bạn không học!', 'warning');
            var ids = ptwIds(), first = ids.findIndex(function (id) { return !HANS[id]; });
            // đã đủ 12 câu (làm lại) -> bắt đầu từ câu 1; còn dở dang -> tiếp tục từ câu chưa trả lời
            PTW.q = first < 0 ? 0 : first; PTW.ready = first < 0; PTW.step = 2; ptwRender(); ptwScrollTop();
        }
        function ptwQ(d) {
            PTW.touched = true;
            if (d < 0 && PTW.q === 0) return ptwGo1();
            if (d > 0 && PTW.q >= 11) { PTW.ready = true; ptwRender(); return; }
            PTW.q = Math.max(0, Math.min(11, PTW.q + d)); ptwRender();
        }
        function ptwSkip() { PTW.touched = true; PTW.ready = true; ptwRender(); }
        function ptwAfterAnswer() {
            if (!ptwMobile() || PTW.step !== 2) return;
            PTW.touched = true;
            if (Object.keys(HANS).length >= 12) PTW.ready = true;
            var q0 = PTW.q; clearTimeout(PTW.timer);
            if (q0 < 11) PTW.timer = setTimeout(function () { if (PTW.step === 2 && PTW.q === q0) { PTW.q = q0 + 1; ptwRender(); } }, 260);
            else PTW.ready = true;
            ptwRender();
        }
        function ptwRedo() { PTW.touched = true; PTW.step = 1; ptwRender(); ptwScrollTop(); }
        function ptwShowResult(force) {   // force=true: vừa bấm phân tích; false: khôi phục kết quả cũ (chỉ khi người dùng chưa thao tác)
            if (!ptwEnsure()) return;
            if (!force && PTW.touched) return;
            PTW.step = 3; ptwRender();
        }
        let HANS = {};
        function hChon(id, v) { HANS[id] = v; savePtDraft(); renderHolland(); try { ptwAfterAnswer(); } catch (e) {} }
        function renderHolland() {
            const n = Object.keys(HANS).length; let i = 0, out = `<div style="height:6px;background:#e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:6px;"><div style="height:100%;width:${n/12*100}%;background:#8b5cf6;transition:.3s;"></div></div><div style="font-size:11px;color:#94a3b8;margin-bottom:10px;">Đã trả lời ${n}/12</div>`;
            for (let j = 0; j < 2; j++) for (const k in HOLLAND) { const id = k + j; i++;
                out += `<div class="h-card"><div class="h-q"><span class="h-n">${i}</span><span>${esc(HOLLAND[k][j])}</span></div><div class="h-scale">${[1,2,3,4,5].map(v => `<button type="button" class="h-dot ${HANS[id]===v?'on':''}" onclick="hChon('${id}',${v})">${v}</button>`).join("")}</div><div class="h-lbl"><span>Không thích</span><span>Rất thích</span></div></div>`; }
            document.getElementById('holland-box').innerHTML = out;
            try { ptwSync(); } catch (e) {}
        }
        renderHolland();

        const MBTI_AXES = { EI: ['E', 'I', 'Hướng ngoại', 'Hướng nội'], SN: ['S', 'N', 'Thực tế', 'Trực giác'], TF: ['T', 'F', 'Lý trí', 'Cảm xúc'], JP: ['J', 'P', 'Kế hoạch', 'Linh hoạt'] };
        const MBTI_QS = [
            // E / I: nguồn năng lượng
            { id: 'EI0', pole: 'E', t: 'Tôi cảm thấy tràn đầy năng lượng sau khi trò chuyện, sinh hoạt cùng nhiều bạn.' },
            { id: 'EI1', pole: 'I', t: 'Sau một buổi tụ tập đông người, tôi cần thời gian ở một mình để nạp lại năng lượng.' },
            { id: 'EI2', pole: 'E', t: 'Tôi dễ bắt chuyện và làm quen với người lạ.' },
            { id: 'EI3', pole: 'I', t: 'Tôi thích suy nghĩ kỹ trong đầu rồi mới phát biểu.' },
            // S / N: cách tiếp nhận thông tin
            { id: 'SN0', pole: 'S', t: 'Tôi tin vào điều đã được kiểm chứng và ví dụ thực tế hơn là suy đoán.' },
            { id: 'SN1', pole: 'N', t: 'Tôi hay nghĩ về "nếu như..." và những khả năng chưa xảy ra.' },
            { id: 'SN2', pole: 'S', t: 'Khi học, tôi thích làm theo từng bước cụ thể, rõ ràng.' },
            { id: 'SN3', pole: 'N', t: 'Tôi thích tìm mối liên hệ giữa các ý tưởng và nhìn bức tranh tổng thể.' },
            // T / F: cách ra quyết định
            { id: 'TF0', pole: 'T', t: 'Khi quyết định, tôi dựa vào lý lẽ và dữ kiện hơn là cảm xúc.' },
            { id: 'TF1', pole: 'F', t: 'Khi quyết định, tôi để ý đến cảm xúc của những người liên quan.' },
            { id: 'TF2', pole: 'T', t: 'Tôi sẵn sàng góp ý thẳng thắn nếu điều đó giúp công việc tốt hơn.' },
            { id: 'TF3', pole: 'F', t: 'Tôi dễ đồng cảm và muốn giữ hòa khí trong nhóm.' },
            // J / P: cách tổ chức cuộc sống
            { id: 'JP0', pole: 'J', t: 'Tôi thích lập kế hoạch và hoàn thành việc trước hạn.' },
            { id: 'JP1', pole: 'P', t: 'Tôi làm việc tốt khi được linh hoạt, kể cả khi sát hạn nộp.' },
            { id: 'JP2', pole: 'J', t: 'Tôi thích có lịch học, thời khóa biểu rõ ràng và làm đúng theo đó.' },
            { id: 'JP3', pole: 'P', t: 'Tôi sẵn sàng đổi kế hoạch khi có cơ hội mới thú vị hơn.' }
        ];
        // ===== 16 CÂU MBTI = PHẦN 4/4 của Phân tích chuyên sâu: Mobile (< 768px) phân trang 3 câu/trang | Desktop (>= 768px) lưới 2 cột =====
        // Câu trả lời đang làm nằm ở DEEP.m = { EI0: 1..5, ... }; khi hoàn tất được lưu vào user.mbtiScores / privates.mbti (xem deepSave)
        let mbtiPage = 0;                       // trang hiện tại (0-based) - chỉ dùng trên Mobile
        const MBTI_PER_PAGE = 3;                // số câu mỗi trang trên Mobile
        const MBTI_MQ = window.matchMedia ? window.matchMedia('(max-width: 767px)') : null;
        const mbtiIsMobile = () => MBTI_MQ ? MBTI_MQ.matches : window.innerWidth < 768;
        const mbtiTotalPages = () => Math.max(1, Math.ceil(MBTI_QS.length / MBTI_PER_PAGE));
        const mbtiAns = () => (typeof DEEP !== 'undefined' && DEEP && DEEP.m) ? DEEP.m : {};
        const mbtiMissing = () => MBTI_QS.map((q, i) => ({ q: q, i: i })).filter(x => !Number.isInteger(mbtiAns()[x.q.id]));   // các câu chưa trả lời
        function mbtiEnsureCss() {              // CSS phân trang + lưới 2 cột (nạp 1 lần, không cần sửa file CSS)
            if (document.getElementById('mbti-page-css')) return;
            const st = document.createElement('style'); st.id = 'mbti-page-css';
            st.textContent = `
                #mbti-box { width: 100%; max-width: none; }
                #mbti-box .mbti-list { display: block; width: 100%; }
                #mbti-box .mbti-list.grid { display: grid !important; grid-template-columns: minmax(0, 1fr) !important; gap: 14px !important; width: 100% !important; max-width: none !important; align-items: stretch; }
                @media (min-width: 768px) { #mbti-box .mbti-list.grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 16px !important; } }
                #mbti-box .mbti-list .h-card { display: flex !important; flex-direction: column; width: 100% !important; max-width: none !important; min-width: 0; margin: 0 !important; box-sizing: border-box; justify-self: stretch; }
                #mbti-box .mbti-list .h-card .h-q { margin-bottom: 12px; }
                #mbti-box .mbti-list .h-card .h-scale { display: flex; justify-content: space-between; gap: 8px; margin-top: auto; }
                #mbti-box .mbti-list .h-card .h-dot { flex: 1 1 0; min-width: 0; max-width: 64px; }
                #mbti-box .mbti-pager { display: flex; align-items: center; gap: 8px; margin: 14px 0 6px; }
                #mbti-box .mbti-pg-btn { flex: 1 1 0; min-width: 0; border: 0; border-radius: 12px; padding: 12px 8px; font-size: 13px; font-weight: 800; cursor: pointer; transition: transform .15s, opacity .2s; }
                #mbti-box .mbti-pg-prev { color: #334155; background: rgba(148,163,184,.28); }
                #mbti-box .mbti-pg-next { color: #fff; background: linear-gradient(135deg, #0ea5e9, #6366f1); box-shadow: 0 6px 16px rgba(99,102,241,.35); }
                #mbti-box .mbti-pg-btn:active:not(:disabled) { transform: scale(.97); }
                #mbti-box .mbti-pg-btn:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
                #mbti-box .mbti-pg-info { flex: 0 0 auto; padding: 9px 14px; border-radius: 12px; font-size: 13px; font-weight: 800; white-space: nowrap; color: #0369a1; background: rgba(14,165,233,.14); border: 1px solid rgba(14,165,233,.35); }
                html.dark #mbti-box .mbti-pg-prev { color: #f1f5f9; background: rgba(148,163,184,.26); }
                html.dark #mbti-box .mbti-pg-info { color: #e0f2fe; background: rgba(14,165,233,.20); border-color: rgba(125,211,252,.45); }`;
            document.head.appendChild(st);
        }
        const deepScroller = () => document.getElementById('deep-card') || document.getElementById('modal-deep');
        function mChon(id, v) {                 // chọn đáp án 1 câu MBTI (giữ nguyên vị trí cuộn)
            if (!DEEP) return;
            DEEP.m = DEEP.m || {}; DEEP.m[id] = v;
            const sc = deepScroller(), t = sc ? sc.scrollTop : 0;
            deepRender(); if (sc) sc.scrollTop = t;
        }
        function mbtiGoPage(p) {                // chuyển trang + cuộn nhẹ lên đầu khung
            mbtiPage = Math.min(Math.max(0, p), mbtiTotalPages() - 1);
            deepRender();
            const sc = deepScroller();
            if (sc) { try { sc.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { sc.scrollTop = 0; } }
        }
        function mbtiGo(d) { mbtiGoPage(mbtiPage + d); }
        // HTML Phần 4/4: Desktop = 16 câu dạng lưới 2 cột (grid-cols-2) | Mobile = 3 câu/trang + nút "‹ Trang trước" / "Trang sau ›" + "Trang x/6"
        function deepMbtiHtml() {
            mbtiEnsureCss();
            const N = MBTI_QS.length, ans = mbtiAns(), miss = mbtiMissing(), left = miss.length, n = N - left;
            const mobile = mbtiIsMobile(), P = mbtiTotalPages();
            mbtiPage = Math.min(Math.max(0, mbtiPage), P - 1);
            const from = mobile ? mbtiPage * MBTI_PER_PAGE : 0, to = mobile ? Math.min(from + MBTI_PER_PAGE, N) : N;
            let out = `<div id="mbti-box"><div style="font-size:12px;font-weight:700;color:#0ea5e9;margin-bottom:10px;">Đã trả lời ${n}/${N}</div><div class="mbti-list grid grid-cols-1 md:grid-cols-2 gap-4">`;
            for (let i = from; i < to; i++) {
                const q = MBTI_QS[i];
                out += `<div class="h-card"><div class="h-q"><span class="h-n">${i + 1}</span><span>${esc(q.t)}</span></div><div class="h-scale">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="h-dot ${ans[q.id] === v ? 'on' : ''}" onclick="mChon('${q.id}',${v})">${v}</button>`).join('')}</div><div class="h-lbl"><span>Không đúng</span><span>Rất đúng</span></div></div>`;
            }
            out += '</div>';
            if (mobile) out += `<div class="mbti-pager"><button type="button" class="mbti-pg-btn mbti-pg-prev" onclick="mbtiGo(-1)" ${mbtiPage === 0 ? 'disabled' : ''}>‹ Trang trước</button><div class="mbti-pg-info" aria-live="polite">Trang ${mbtiPage + 1}/${P}</div><button type="button" class="mbti-pg-btn mbti-pg-next" onclick="mbtiGo(1)" ${mbtiPage === P - 1 ? 'disabled' : ''}>Trang sau ›</button></div>`;
            return out + '</div>';
        }
        if (MBTI_MQ) {   // xoay màn hình / đổi kích thước qua mốc 768px: vẽ lại đúng chế độ, không vỡ layout
            const onMq = () => { const m = document.getElementById('modal-deep'); if (m && m.style.display === 'flex' && typeof DSTEP !== 'undefined' && DSTEP === 4) deepRender(); };
            if (MBTI_MQ.addEventListener) MBTI_MQ.addEventListener('change', onMq); else if (MBTI_MQ.addListener) MBTI_MQ.addListener(onMq);
        }

        // ---------- 3) Tính kết quả: net > 0 nghiêng về cực đầu, net < 0 nghiêng về cực sau; pct = mức nghiêng (50-100%) ----------
        function mbtiResult(ans) {
            ans = ans || {};
            const detail = {}; let type = '', answered = 0;
            for (const ax in MBTI_AXES) {
                const [a, b] = MBTI_AXES[ax]; let net = 0, cnt = 0;
                MBTI_QS.filter(q => q.id.startsWith(ax)).forEach(q => {
                    const v = ans[q.id]; if (!Number.isInteger(v)) return;
                    cnt++; answered++; net += (q.pole === a ? 1 : -1) * (v - 3);     // v-3 thuộc [-2, 2]
                });
                const max = Math.max(1, cnt * 2), letter = net >= 0 ? a : b;       // hòa (net = 0): lấy cực đầu và coi là "cân bằng"
                detail[ax] = { letter: letter, net: net, balanced: net === 0, pct: Math.round(50 + Math.abs(net) / max * 50) };
                type += letter;
            }
            return { done: answered >= MBTI_QS.length, type: type, detail: detail };
        }
        // Hiển thị: "INTJ (I 75% · N 62% · T 88% · J 56%)"
        function mbtiText(r) {
            return r.type + ' (' + Object.keys(r.detail).map(ax => r.detail[ax].letter + ' ' + r.detail[ax].pct + '%').join(' · ') + ')';
        }

        // ---------- 4) Độ hợp giữa tính cách và nhóm Holland của ngành (heuristic, 0..1) ----------
        // Mỗi nhóm Holland thường gắn với những chữ cái sau; cần trích nguồn nghiên cứu khi đưa vào báo cáo.
        const MBTI_AFF = { R: 'STPI', I: 'INTP', A: 'NFPI', S: 'EFSJ', E: 'ETJS', C: 'SJTI' };
        function mbtiFit(type, hol) {                 // hol: mã Holland của ngành, ví dụ "IR"
            if (!type || !hol) return 0;
            const w = [0.6, 0.4]; let s = 0;
            [...hol].slice(0, 2).forEach((h, i) => { const aff = MBTI_AFF[h] || ''; s += w[i] * ([...type].filter(c => aff.includes(c)).length / 4); });
            return s;                                 // 0..1
        }


        // ===== LƯU NHÁP TAB PHÂN TÍCH (điểm 8 môn + 12 câu sở thích) vào localStorage, theo từng tài khoản =====
        const PT_IDS = ['toan','van','anh','ly','hoa','sinh','su','dia'];
        const ptDraftKey = () => 'eduorient_pt_draft_' + (ME ? ME.uid : '');
        function savePtDraft() {
            if (!ME) return;
            try {
                const scores = {}; PT_IDS.forEach(k => { const el = document.getElementById('diem-' + k); scores[k] = el ? el.value : ''; });
                localStorage.setItem(ptDraftKey(), JSON.stringify({ v: 3, scores: scores, hans: HANS }));
            } catch (e) {}
        }
        function restorePtDraft() {
            if (!ME) return;
            try {
                const d = JSON.parse(localStorage.getItem(ptDraftKey()) || 'null'); if (!d) return;
                PT_IDS.forEach(k => {
                    const el = document.getElementById('diem-' + k), v = d.scores && d.scores[k];
                    if (!el || el.value !== '' || v === undefined || v === '') return;   // không ghi đè ô người dùng đã nhập
                    const n = parseFloat(v); if (!isNaN(n) && n >= 0 && n <= 10) el.value = v;
                });
                if (d.hans && typeof d.hans === 'object') {
                    const ok = {}; for (const k in HOLLAND) for (let j = 0; j < 2; j++) { const v = d.hans[k + j]; if (Number.isInteger(v) && v >= 1 && v <= 5) ok[k + j] = v; }
                    if (Object.keys(HANS).length === 0) { HANS = ok; renderHolland(); }
                }
            } catch (e) {}
        }
        document.addEventListener('input', e => { if (e.target && /^diem-/.test(e.target.id || '')) savePtDraft(); });

        // ===== KHÔI PHỤC KHUNG KẾT QUẢ PHÂN TÍCH sau F5 =====
        // Kết quả đã được lưu sẵn trong user.analysisData (Firestore: privates/{uid}.analysis); chỉ cần vẽ lại khung hiển thị.
        // Không chạy lại phanTichGop(), không bật đếm ngược Nguyện vọng, không cuộn trang.
        const ptResKey = () => 'eduorient_pt_result_' + (ME ? ME.uid : '');
        function renderPtResult(a) {
            if (!a || !a.topKhoi) return false;
            const box = document.getElementById('ketqua-text'), wrap = document.getElementById('ketqua-phantich');
            if (!box || !wrap) return false;
            box.innerHTML = `<svg class=ic aria-hidden=true><use href=#i-fire></use></svg> <b>Khối mạnh nhất:</b> ${esc(a.topKhoi)} (${esc(a.monHoc)}) — <b>${esc(a.diemTong)}/30</b>.<br>` +
                (a.holland ? `<svg class=ic aria-hidden=true><use href=#i-compass></use></svg> <b>Nhóm tính cách nghề nghiệp (Holland):</b> ${esc(a.holland)}<br>` : `<i>Làm đủ 12 câu trắc nghiệm sở thích để kết quả chính xác hơn (hiện chỉ tính theo điểm).</i><br>`) +
                (a.mbti ? `<svg class=ic aria-hidden=true><use href=#i-brain></use></svg> <b>Tính cách (4 chiều):</b> ${esc(a.mbtiText || a.mbti)}<br>` : `<i>Muốn gợi ý sát hơn? Làm “Phân tích chuyên sâu” ở Tài khoản (có 16 câu MBTI).</i><br>`) +
                (a.formula ? `<svg class=ic aria-hidden=true><use href=#i-scale-balance></use></svg> <b>Công thức:</b> ${esc(a.formula)}<br>` : '') + `<br><svg class=ic aria-hidden=true><use href=#i-school></use></svg> <b>Top ngành gợi ý:</b><br>${a.nganhGoiY || ''}`;
            wrap.style.display = 'block';
            try { ptwShowResult(false); } catch (e) {}
            return true;
        }
        function cachePtResult(a) { try { if (ME && a && a.topKhoi) localStorage.setItem(ptResKey(), JSON.stringify(a)); } catch (e) {} }
        function restorePtResultCache() {   // hiện ngay từ bộ nhớ máy, không phải chờ Firestore
            if (!ME) return;
            try { renderPtResult(JSON.parse(localStorage.getItem(ptResKey()) || 'null')); } catch (e) {}
        }

        function gioiHan(el) { if (el.value === '') return; const v = parseFloat(el.value); if (isNaN(v)) return; if (v > 10) el.value = 10; else if (v < 0) el.value = 0; }
        function phanTichGop() {
            if (ptCooldownActive()) return;   // đang trong 60s chờ: bỏ qua mọi lần bấm thêm
            const g = id => parseFloat(document.getElementById(id).value) || 0;
            const m = {T:g('diem-toan'),V:g('diem-van'),A:g('diem-anh'),L:g('diem-ly'),H:g('diem-hoa'),S:g('diem-sinh'),Su:g('diem-su'),D:g('diem-dia')};
            if (['toan','van','anh','ly','hoa','sinh','su','dia'].some(k => document.getElementById('diem-'+k).value === '')) return eduAlert("Hãy điền đủ 8 ô. Nhập 0 cho môn bạn không học!", 'warning');
            if (Object.values(m).some(x => x < 0 || x > 10)) return eduAlert("Điểm phải nằm trong thang 0 - 10!", 'warning');
            const khoi = [
                {id:"A00",mon:"Toán, Lý, Hóa",c:['T','L','H']},{id:"A01",mon:"Toán, Lý, Anh",c:['T','L','A']},
                {id:"B00",mon:"Toán, Hóa, Sinh",c:['T','H','S']},{id:"C00",mon:"Văn, Sử, Địa",c:['V','Su','D']},{id:"D01",mon:"Toán, Văn, Anh",c:['T','V','A']}
            ].filter(k => k.c.every(x => m[x] > 0)).map(k => ({...k, diem: k.c.reduce((a,x) => a + m[x], 0)}));
            if (!khoi.length) return eduAlert("Hãy nhập đủ điểm của ít nhất 3 môn thuộc một khối thi!", 'warning');
            ptCooldownStart();   // dữ liệu hợp lệ: khóa nút 60 giây, hiện "Thử lại sau Xs" ngay trên nút
            khoi.sort((a,b) => b.diem - a.diem);
            const kd = {}; khoi.forEach(k => kd[k.id] = k.diem);
            // Điểm Holland (trung bình 1-5 mỗi nhóm), null nếu chưa làm đủ
            const hs = {}, cnt = {}; Object.entries(HANS).forEach(([id, v]) => { const k = id[0]; hs[k] = (hs[k]||0) + v; cnt[k] = (cnt[k]||0) + 1; });
            const done = Object.values(cnt).reduce((a,b)=>a+b,0) >= 12;
            const ha = {}; for (const k in HOLLAND) ha[k] = cnt[k] ? hs[k]/cnt[k] : 0;
            const mb = mbtiResult(user.mbtiScores || {});   // MBTI làm ở Tab Tài khoản; chưa làm thì tự bỏ qua (không báo lỗi, không bắt buộc)
            // Công thức: có MBTI = 55% Môn + 30% Holland + 15% MBTI; chưa làm MBTI = 65% Môn + 35% Holland
            const rank = ptRank(kd, ha, done, mb);
            const top = khoi[0], topH = Object.keys(ha).sort((a,b) => ha[b]-ha[a]).slice(0,2).join("");
            user.analysisData = { topKhoi: top.id, monHoc: top.mon, diemTong: top.diem.toFixed(1), tatCaKhoi: khoi,
                holland: done ? topH : null,
                mbti: mb.done ? mb.type : null,
                mbtiText: mb.done ? mbtiText(mb) : null,
                formula: ptFormulaLabel(done, mb.done),
                hollandAvg: done ? ha : null,   // lưu để Phân tích chuyên sâu tính lại khi F5 / đổi máy
                nganhGoiY: rank.map(n => `• ${esc(n.n)} — <b>${n.pct}%</b> phù hợp`).join("<br>") };
            document.getElementById('ketqua-text').innerHTML = `<svg class=ic aria-hidden=true><use href=#i-fire></use></svg> <b>Khối mạnh nhất:</b> ${top.id} (${top.mon}) — <b>${top.diem.toFixed(1)}/30</b>.<br>` +
                (done ? `<svg class=ic aria-hidden=true><use href=#i-compass></use></svg> <b>Nhóm tính cách nghề nghiệp (Holland):</b> ${topH}<br>` : `<i>Làm đủ 12 câu trắc nghiệm sở thích để kết quả chính xác hơn (hiện chỉ tính theo điểm).</i><br>`) +
                (mb.done ? `<svg class=ic aria-hidden=true><use href=#i-brain></use></svg> <b>Tính cách (4 chiều):</b> ${esc(mbtiText(mb))}<br>` : `<i>Muốn gợi ý sát hơn? Làm “Phân tích chuyên sâu” ở Tài khoản (có 16 câu MBTI).</i><br>`) +
                `<svg class=ic aria-hidden=true><use href=#i-scale-balance></use></svg> <b>Công thức:</b> ${esc(user.analysisData.formula)}<br>` + `<br><svg class=ic aria-hidden=true><use href=#i-school></use></svg> <b>Top ngành gợi ý:</b><br>${user.analysisData.nganhGoiY}`;
            document.getElementById('ketqua-phantich').style.display = 'block';
            try { ptwShowResult(true); } catch (e) {}
            saveUser();
            // Hiện kết quả ngay để học sinh đọc; 30 giây sau mới bật popup BẮT BUỘC chọn Nguyện vọng ĐH (chỉ khi chưa có; đã có thì đổi ở Hồ sơ / BXH)
            startAspCountdown();   // chưa có nguyện vọng ĐH thì đếm ngược 30s rồi mở popup chọn (đã có thì tự bỏ qua)
            try { document.getElementById('ketqua-phantich').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
        }

        // ===== Công thức xếp hạng dùng chung (cơ bản + chuyên sâu) =====
        // Có Holland + MBTI = 55% Môn + 30% Holland + 15% Tính cách | Holland, chưa làm MBTI = 65% Môn + 35% Holland | chỉ MBTI = 85/15 | không có = 100% điểm
        function ptPct(kd, ha, holDone, mb, khoiArr, hol) {
            const kf = Math.max(0, ...khoiArr.map(x => (kd[x] || 0) / 30));
            const hf = ((ha[hol[0]] || 0) * 0.6 + (ha[hol[1]] || 0) * 0.4) / 5;
            const mf = mb && mb.done ? mbtiFit(mb.type, hol) : 0;
            if (holDone && mb && mb.done) return kf * 55 + hf * 30 + mf * 15;
            if (mb && mb.done) return kf * 85 + mf * 15;
            return holDone ? kf * 65 + hf * 35 : kf * 100;
        }
        function ptFormulaLabel(holDone, mbDone) {
            return holDone && mbDone ? '55% Môn + 30% Holland + 15% Tính cách' : mbDone ? '85% Môn + 15% Tính cách' : holDone ? '65% Môn + 35% Holland' : '100% Điểm môn';
        }
        function ptRank(kd, ha, holDone, mb) {
            return NGANH.map(n => ({ ...n, pct: Math.round(ptPct(kd, ha, holDone, mb, n.k, n.h)) }))
                .filter(n => n.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 5);
        }

        // ===== MBTI (16 câu) nay là PHẦN 4/4 của Phân tích chuyên sâu (không còn popup/card riêng) =====
        // Dữ liệu: user.mbtiScores = { EI0: 1..5, ... } (16 câu) | user.mbtiResult = { type, text, detail }
        // Lưu: Firestore privates/{uid}.mbti = { scores, result: { type, text }, updatedAt } (+ bản sao localStorage) — ghi trong deepSave()
        // Phân Tích Định Hướng (tab Phân tích) vẫn đọc user.mbtiScores: đã làm => 55/30/15, chưa làm => 65/35 (không báo lỗi).
        const MBTI_LS = () => 'eduorient_mbti_' + (ME ? ME.uid : '');
        function cleanMbtiScores(o) {
            const ok = {};
            if (o && typeof o === 'object') MBTI_QS.forEach(q => { const v = o[q.id]; if (Number.isInteger(v) && v >= 1 && v <= 5) ok[q.id] = v; });
            return ok;
        }
        function applyMbti(m) {                          // nạp dữ liệu (Firestore / localStorage): luôn tính lại kết quả từ 16 câu, không tin chuỗi lưu sẵn
            const sc = cleanMbtiScores(m && m.scores);
            if (Object.keys(sc).length === MBTI_QS.length) { const r = mbtiResult(sc); user.mbtiScores = sc; user.mbtiResult = { type: r.type, text: mbtiText(r), detail: r.detail }; }
            else { user.mbtiScores = null; user.mbtiResult = null; }
        }
        function loadMbtiLocal() { try { applyMbti(JSON.parse(localStorage.getItem(MBTI_LS()) || 'null')); } catch (e) {} }
        // Kết quả MBTI của 1 bộ dữ liệu deep: ưu tiên câu trả lời đang làm (D.m), không có thì dùng bản đã lưu (user.mbtiScores)
        function deepMbti(D) {
            D = D || DEEP || {};
            const own = cleanMbtiScores(D.m);
            return mbtiResult(Object.keys(own).length ? own : cleanMbtiScores(user.mbtiScores));
        }

        // ================= PHÂN TÍCH CHUYÊN SÂU (chỉ dựa trên Nguyện vọng Đại học) =================
        // ---- Danh mục ngành: mã -> [tên, khối xét tuyển, mã Holland]. CẬP NHẬT MỖI MÙA TUYỂN SINH tại đây ----
        const MJ = {
            it:['Công nghệ thông tin','A00,A01,D01','IR'], ai:['Trí tuệ nhân tạo - Khoa học dữ liệu','A00,A01','IC'], cs:['An toàn thông tin','A00,A01','IC'], ce:['Kỹ thuật máy tính - Điện tử','A00,A01','RI'],
            me:['Cơ khí - Cơ điện tử','A00,A01','RI'], ee:['Kỹ thuật điện - Tự động hóa','A00,A01','RI'], tel:['Điện tử - Viễn thông','A00,A01','RI'], auto:['Kỹ thuật ô tô','A00,A01','RI'],
            civ:['Kỹ thuật xây dựng','A00,A01','RC'], arc:['Kiến trúc','V00,V01','AR'], trn:['Kỹ thuật giao thông - Vận tải','A00,A01,D01','RE'], log:['Logistics - Chuỗi cung ứng','A00,A01,D01','EC'],
            fin:['Tài chính - Ngân hàng','A00,A01,D01','EC'], acc:['Kế toán - Kiểm toán','A00,D01','CE'], bus:['Quản trị kinh doanh','A00,D01','ES'], mkt:['Marketing','A00,D01','EA'],
            eco:['Kinh tế - Kinh tế quốc tế','A00,A01,D01','EI'], ecom:['Thương mại điện tử','A00,A01,D01','EI'], law:['Luật','C00,D01,A00','ES'], jou:['Báo chí - Truyền thông','C00,D01','AS'],
            pr:['Quan hệ công chúng','C00,D01','EA'], en:['Ngôn ngữ Anh','D01','AS'], lang:['Ngôn ngữ Trung / Nhật / Hàn / Pháp','D01','AS'], int:['Quan hệ quốc tế - Ngoại giao','D01,C00','SE'],
            tour:['Du lịch - Khách sạn','C00,D01','ES'], soc:['Xã hội học - Công tác xã hội','C00,D01','SA'], psy:['Tâm lý học','B00,C00,D01','SI'], edu:['Sư phạm (các môn)','A00,C00,D01','SA'],
            med:['Y khoa','B00','IS'], den:['Răng - Hàm - Mặt','B00','IS'], pha:['Dược học','B00,A00','IC'], nur:['Điều dưỡng - Kỹ thuật y học','B00','SR'],
            bio:['Công nghệ sinh học','B00,A00','IR'], chem:['Kỹ thuật hóa học - Môi trường','A00,B00','IR'], food:['Công nghệ thực phẩm','A00,B00','IR'], agr:['Nông nghiệp - Thú y','A00,B00','RI'],
            water:['Kỹ thuật tài nguyên nước','A00,A01','RI'], geo:['Địa chất - Mỏ - Trắc địa','A00,A01','RI'], math:['Toán - Thống kê','A00,A01','IC'], phy:['Vật lý - Khoa học vật liệu','A00,A01','IR'],
            des:['Thiết kế đồ họa - Đa phương tiện','V00,H00,D01','AR'], mmd:['Truyền thông đa phương tiện','A00,A01,D01','AE'], ind:['Quản lý công nghiệp','A00,A01','CE'], pol:['Nghiệp vụ Cảnh sát','A00,C00','SC'], sec:['Nghiệp vụ An ninh','A00,C00','SC']
        };
        // ---- Ngành của từng trường (id trường trong UNIS -> các mã ngành) ----
        const UNI_MJ = {
            'ptit':'it ai cs ce tel mkt ecom bus acc des mmd', 'hust':'it ai cs ce me ee tel auto civ chem food bio phy math ind eco bus fin acc en', 'neu':'eco fin acc bus mkt log ecom law pr tour ai',
            'ftu':'eco fin bus log int law lang en acc mkt ecom', 'vnu-uet':'it ai cs ce me ee tel auto phy', 'vnu-ueb':'eco fin acc bus ecom', 'vnu-hus':'math phy chem bio geo cs ai',
            'vnu-ussh':'jou soc psy int tour pr lang', 'vnu-ulis':'en lang', 'ba':'fin acc bus eco ecom it cs en law', 'aof':'fin acc eco bus ecom ai', 'hnue':'math phy chem bio psy it soc',
            'hanu':'en lang int it tour bus', 'hmu':'med den pha nur psy', 'tmu':'bus mkt acc fin eco log ecom law tour', 'utc':'civ trn me ee auto it eco log', 'huce':'civ arc geo water chem it',
            'haui':'it ce me ee auto tel acc bus tour lang en food', 'ajc':'jou pr soc mkt mmd', 'dav':'int eco law lang en', 'ppa':'pol', 'annd':'sec', 'hlu':'law int', 'hup':'pha chem bio',
            'tlu':'water civ it ce eco', 'vnua':'agr food bio chem eco bus it', 'hou':'it law bus acc en des arc eco', 'hau':'arc civ des', 'humg':'geo civ it me ee', 'fptu':'it ai cs ce des mmd bus mkt en lang'
        };
        // ---- Ngành bổ sung theo đề án tuyển sinh (chỉ cần ghi TÊN; khối & điểm chuẩn ước tính tự suy ra từ tên, ngành trùng tên với danh mục trên thì dùng lại) ----
        const SP_HNUE = 'Sư phạm Toán học;Sư phạm Tin học;Sư phạm Vật lí;Sư phạm Hóa học;Sư phạm Sinh học;Sư phạm Ngữ văn;Sư phạm Lịch sử;Sư phạm Địa lí;Sư phạm Tiếng Anh;Sư phạm Khoa học tự nhiên;Giáo dục Tiểu học;Giáo dục Mầm non;Giáo dục Chính trị;Giáo dục Công dân;Giáo dục Thể chất;Sư phạm Âm nhạc;Sư phạm Mỹ thuật';
        const UNI_X = {
            'ptit':'Công nghệ tài chính (Fintech);Thiết kế vi mạch;Kỹ thuật điều khiển và tự động hóa;Công nghệ Internet vạn vật (IoT);Báo chí',
            'hust':'Kỹ thuật y sinh;Hệ thống thông tin quản lý;Logistics - Chuỗi cung ứng;Kỹ thuật vi điện tử - Công nghệ nano;Kỹ thuật dệt may - Da giày;Sư phạm kỹ thuật',
            'neu':'Hệ thống thông tin quản lý;Khoa học máy tính;Bất động sản;Toán kinh tế - Thống kê;Quản trị nhân lực;Bảo hiểm;Khởi nghiệp & Phát triển kinh doanh;Kinh doanh nông nghiệp',
            'ftu':'Khoa học dữ liệu;Quản trị khách sạn;Kinh tế chính trị;Hệ thống thông tin;Truyền thông marketing',
            'vnu-uet':'Kỹ thuật Robot;Công nghệ hàng không vũ trụ;Công nghệ nông nghiệp;Thiết kế vi mạch;Kỹ thuật xây dựng - Giao thông', 'vnu-ueb':'Kinh tế phát triển',
            'vnu-hus':'Khoa học máy tính;Hóa học;Sinh học;Khí tượng - Thủy văn - Hải dương học;Địa lý tự nhiên;Quản lý đất đai',
            'vnu-ussh':'Đông phương học;Hán Nôm;Lịch sử;Triết học;Văn học;Ngôn ngữ học;Quản trị văn phòng;Thông tin - Thư viện;Khoa học quản lý;Đông Nam Á học',
            'vnu-ulis':'Sư phạm tiếng Anh;Sư phạm tiếng Nga;Sư phạm tiếng Pháp;Sư phạm tiếng Trung;Sư phạm tiếng Đức;Sư phạm tiếng Nhật;Sư phạm tiếng Hàn;Kinh tế - Tài chính (liên kết);Truyền thông doanh nghiệp;Ngôn ngữ Nga;Ngôn ngữ Đức;Ngôn ngữ Ả Rập',
            'ba':'Hệ thống thông tin quản lý;Logistics - Chuỗi cung ứng;Công nghệ tài chính (Fintech)', 'aof':'Hệ thống thông tin quản lý;Ngôn ngữ Anh',
            'hnue':SP_HNUE+';Quản lý giáo dục;Tâm lý học giáo dục;Việt Nam học;Triết học;Văn học;Lịch sử;Hóa học;Địa lý',
            'hanu':'Quốc tế học;Truyền thông đa phương tiện;Marketing;Tài chính - Ngân hàng;Kế toán;Thương mại điện tử;Ngôn ngữ Nga;Ngôn ngữ Tây Ban Nha;Ngôn ngữ Bồ Đào Nha;Ngôn ngữ Ý',
            'hmu':'Y học cổ truyền;Y học dự phòng;Y tế công cộng;Khúc xạ nhãn khoa;Dinh dưỡng;Hộ sinh;Phục hồi chức năng',
            'tmu':'Hệ thống thông tin quản lý;Quản trị nhân lực;Bất động sản;Ngôn ngữ Anh;Ngôn ngữ Trung',
            'utc':'Quản trị kinh doanh;Kế toán;Quản lý xây dựng;Kỹ thuật môi trường;Toán ứng dụng;Kiến trúc',
            'huce':'Quản lý xây dựng - Kinh tế xây dựng;Kỹ thuật cấp thoát nước;Kỹ thuật vật liệu;Kỹ thuật cơ khí;Kỹ thuật ô tô;Logistics;Kiến trúc cảnh quan;Thiết kế nội thất',
            'haui':'Công nghệ dệt may - Thời trang;Công nghệ kỹ thuật hóa học;Quản trị nhân lực;Marketing;Phân tích dữ liệu;Quản lý công nghiệp',
            'ajc':'Triết học;Kinh tế chính trị;Chủ nghĩa xã hội khoa học;Xây dựng Đảng và Chính quyền nhà nước;Lịch sử;Chính trị học;Quản lý công;Xuất bản',
            'dav':'Truyền thông quốc tế;Kinh doanh quốc tế;Châu Á - Thái Bình Dương học',
            'ppa':'Quản lý nhà nước về ANTT;Thi hành án hình sự;Cảnh sát giao thông;Kỹ thuật hình sự;Ngôn ngữ Anh (chuyên ngành Cảnh sát)',
            'annd':'An toàn thông tin;Công nghệ thông tin;Y khoa (gửi đào tạo);Ngôn ngữ Anh;Ngôn ngữ Trung', 'hlu':'Luật kinh tế;Luật thương mại quốc tế;Ngôn ngữ Anh (tiếng Anh pháp lý)', 'hup':'Hóa dược',
            'tlu':'Quản trị kinh doanh;Kế toán;Logistics;Kỹ thuật ô tô;Cơ khí - Cơ điện tử;Kỹ thuật Robot;Trí tuệ nhân tạo;Ngôn ngữ Anh;Kỹ thuật hóa học',
            'vnua':'Nông học;Chăn nuôi;Thủy sản;Bảo vệ thực vật;Kỹ thuật cơ khí - Máy nông nghiệp;Quản lý đất đai;Kế toán;Ngôn ngữ Anh;Xã hội học',
            'hou':'Thương mại điện tử;Du lịch - Khách sạn;Tài chính - Ngân hàng;Công nghệ sinh học;Công nghệ thực phẩm;Ngôn ngữ Trung',
            'hau':'Quy hoạch vùng và đô thị;Kiến trúc cảnh quan;Thiết kế nội thất;Thiết kế thời trang;Điêu khắc;Kỹ thuật cơ điện công trình;Quản lý xây dựng;Công nghệ thông tin',
            'humg':'Kỹ thuật dầu khí;Kỹ thuật môi trường;Quản lý đất đai;Quản trị kinh doanh;Kế toán;Tài chính - Ngân hàng;Kỹ thuật hóa học', 'fptu':'Quản trị khách sạn;Công nghệ Internet vạn vật (IoT);Kinh doanh quốc tế'
        };
        const ALIAS = {'Kế toán':'acc','Logistics':'log','Logistics - Chuỗi cung ứng':'log','Trí tuệ nhân tạo':'ai','Khoa học dữ liệu':'ai','Kỹ thuật ô tô':'auto','Kiến trúc':'arc','Kỹ thuật hóa học':'chem','Kỹ thuật cơ khí':'me','Thiết kế vi mạch':'ce','Quản lý công nghiệp':'ind','Luật kinh tế':'law','Báo chí':'jou'};
        // Suy ra [khối, Holland, điểm chuẩn nền] từ tên ngành (xét theo thứ tự). Ước tính - nên rà lại nếu cần chính xác
        const SP_RULES = [[/Toán|Tin học|Vật|tự nhiên/, 'A00,A01', 'SI', 26], [/Hóa/, 'A00,B00', 'SI', 25], [/Sinh/, 'B00', 'SI', 24], [/Anh|tiếng|ngoại/, 'D01', 'SA', 26], [/Mầm non|Tiểu học/, 'M00,D01', 'SA', 24], [/Thể chất/, 'T00', 'SR', 21], [/Âm nhạc/, 'N00', 'SA', 22], [/Mỹ thuật/, 'H00', 'SA', 22], [/văn|sử|địa|chính trị|công dân/i, 'C00,D01', 'SA', 26]];
        const MJ_RULES = [[/Y khoa|Răng|Y học|Y tế|Khúc xạ|Hộ sinh|Phục hồi|Dinh dưỡng/, 'B00', 'IS', 24], [/Dược/, 'B00,A00', 'IC', 24], [/Cảnh sát|An ninh|ANTT|Thi hành án|hình sự/, 'A00,C00', 'SC', 23],
            [/Kiến trúc|Thiết kế|Điêu khắc|Quy hoạch|Nội thất/, 'V00,H00', 'AR', 21], [/Hóa học|Hóa dược|Sinh học|Nông|Thủy sản|Chăn nuôi|Bảo vệ thực vật/, 'A00,B00', 'IR', 20],
            [/Marketing|Truyền thông doanh nghiệp|Truyền thông quốc tế/, 'A00,D01', 'EA', 25], [/Kinh tế|Quản trị|Tài chính|Kế toán|Logistics|Bất động sản|Bảo hiểm|Khởi nghiệp|Kinh doanh|Fintech|nhân lực|Hệ thống thông tin/, 'A00,A01,D01', 'EC', 24],
            [/Ngôn ngữ|Châu Á|ngoại ngữ|Quốc tế học|Đông phương|Đông Nam Á|Việt Nam học/, 'D01', 'AS', 24], [/Luật|Báo chí|Truyền thông|Lịch sử|Triết|Văn học|Hán Nôm|Chính trị|Xây dựng Đảng|Chủ nghĩa|Xuất bản|Thư viện|văn phòng|Quản lý công|Khoa học quản lý|Quản lý giáo dục|Tâm lý|Xã hội/, 'C00,D01', 'SA', 24],
            [/Toán|Thống kê|dữ liệu|máy tính|Internet|An toàn|Robot|vi mạch|Công nghệ thông tin|Phân tích/, 'A00,A01', 'IC', 25], [/./, 'A00,A01', 'RI', 20]];
        const hashName = n => { let h = 5381; for (let i = 0; i < n.length; i++) h = ((h << 5) + h + n.charCodeAt(i)) >>> 0; return 'x' + h.toString(36); };
        const NAME2K = {}; Object.keys(MJ).forEach(k => NAME2K[MJ[k][0]] = k);
        function mjKeyOf(name) {
            if (ALIAS[name] || NAME2K[name]) return ALIAS[name] || NAME2K[name];
            const k = hashName(name); if (MJ[k]) return k;
            const r = (/^(Sư phạm|Giáo dục)/.test(name) ? SP_RULES : []).concat(MJ_RULES).find(x => x[0].test(name));
            MJ[k] = [name, r[1], r[2], r[3]]; return k;
        }
        const MJ_CACHE = {};
        const mjOf = uid => MJ_CACHE[uid] || (MJ_CACHE[uid] = [...new Set((UNI_MJ[uid] || '').split(' ').filter(k => MJ[k]).concat((UNI_X[uid] || '').split(';').filter(Boolean).map(mjKeyOf)))]);
        // ---- Mệnh (Nạp âm) theo năm sinh ÂM LỊCH: mùng 1 Tết Dương lịch từng năm ----
        const TET = {2000:'02-05',2001:'01-24',2002:'02-12',2003:'02-01',2004:'01-22',2005:'02-09',2006:'01-29',2007:'02-18',2008:'02-07',2009:'01-26',2010:'02-14',2011:'02-03',2012:'01-23',2013:'02-10',2014:'01-31'};
        const NAPAM = 'Hải Trung Kim,Lư Trung Hỏa,Đại Lâm Mộc,Lộ Bàng Thổ,Kiếm Phong Kim,Sơn Đầu Hỏa,Giản Hạ Thủy,Thành Đầu Thổ,Bạch Lạp Kim,Dương Liễu Mộc,Tuyền Trung Thủy,Ốc Thượng Thổ,Tích Lịch Hỏa,Tùng Bách Mộc,Trường Lưu Thủy,Sa Trung Kim,Sơn Hạ Hỏa,Bình Địa Mộc,Bích Thượng Thổ,Kim Bạch Kim,Phúc Đăng Hỏa,Thiên Hà Thủy,Đại Dịch Thổ,Thoa Xuyến Kim,Tang Đố Mộc,Đại Khê Thủy,Sa Trung Thổ,Thiên Thượng Hỏa,Thạch Lựu Mộc,Đại Hải Thủy'.split(',');
        const CAN = 'Giáp,Ất,Bính,Đinh,Mậu,Kỷ,Canh,Tân,Nhâm,Quý'.split(','), CHI = 'Tý,Sửu,Dần,Mão,Thìn,Tỵ,Ngọ,Mùi,Thân,Dậu,Tuất,Hợi'.split(',');
        const HANH = {
            'Kim': { c:'#b45309', h:'RC', t:'Mệnh Kim: sắc sảo, kỷ luật, thẳng thắn và có chính kiến. Em làm việc có hệ thống, coi trọng chính xác và hiệu quả, hợp với những ngành cần logic, số liệu và sự cẩn trọng. Điểm cần rèn: mềm mỏng hơn khi làm việc nhóm.' },
            'Mộc': { c:'#15803d', h:'SA', t:'Mệnh Mộc: nhân hậu, giàu sáng tạo và luôn muốn phát triển. Em biết lắng nghe, dễ kết nối và hợp với những ngành chăm sóc, giáo dục, sáng tạo. Điểm cần rèn: kiên định hơn khi gặp áp lực.' },
            'Thủy': { c:'#0369a1', h:'IE', t:'Mệnh Thủy: thông minh, linh hoạt, tò mò và thích khám phá. Em thích tìm hiểu tận gốc vấn đề, thích nghi nhanh và hợp với nghiên cứu, công nghệ, kinh doanh. Điểm cần rèn: tập trung vào một mục tiêu đến cùng.' },
            'Hỏa': { c:'#dc2626', h:'EA', t:'Mệnh Hỏa: nhiệt huyết, tự tin, có sức truyền cảm hứng. Em thích dẫn dắt, thể hiện và hợp với những ngành truyền thông, kinh doanh, nghệ thuật. Điểm cần rèn: kiên nhẫn và kiểm soát cảm xúc.' },
            'Thổ': { c:'#a16207', h:'RS', t:'Mệnh Thổ: vững vàng, đáng tin, kiên trì và thực tế. Em là điểm tựa cho tập thể, hợp với những ngành xây dựng, quản lý, y tế, dịch vụ. Điểm cần rèn: chủ động đón nhận thay đổi.' }
        };
        function calcMenh(dob) {                       // dob: 'YYYY-MM-DD'
            const p = dob.split('-').map(Number); let y = p[0];
            if (!TET[y]) return null;
            if (dob.slice(5) < TET[y]) y -= 1;         // sinh trước Tết thì tính năm âm lịch trước
            const idx = ((y - 4) % 60 + 60) % 60, name = NAPAM[Math.floor(idx / 2)];
            return { year: y, canchi: CAN[idx % 10] + ' ' + CHI[idx % 12], name, hanh: name.split(' ').pop() };
        }
        const KHOI = { A00:['toan','ly','hoa'], A01:['toan','ly','anh'], B00:['toan','hoa','sinh'], C00:['van','su','dia'], D01:['toan','van','anh'], V00:['toan','ly','van'], V01:['toan','van','anh'], H00:['van','van','toan'], T00:['toan','sinh','van'], N00:['van','van','van'], M00:['van','toan','van'] };
        const MON = [['toan','Toán'],['van','Văn'],['anh','Anh'],['ly','Lý'],['hoa','Hóa'],['sinh','Sinh'],['su','Sử'],['dia','Địa']];
        const HOL = [['R','Thực hành, máy móc'],['I','Nghiên cứu, tìm tòi'],['A','Sáng tạo, nghệ thuật'],['S','Giúp đỡ, giảng dạy'],['E','Lãnh đạo, kinh doanh'],['C','Số liệu, tổ chức']];
        let DEEP = null, DSTEP = 1;
        let DPF = { q: '', g: '', k: '', ok: false, open: {} }, DPLIST = [];   // bộ lọc chọn ngành (tìm kiếm / nhóm ngành / khối thi / đủ điểm) + danh sách xếp hạng hiện tại
        const KHOI_TEN = { A00:'Toán, Vật lí, Hóa học', A01:'Toán, Vật lí, Tiếng Anh', B00:'Toán, Hóa học, Sinh học', C00:'Ngữ văn, Lịch sử, Địa lí', D01:'Toán, Ngữ văn, Tiếng Anh', V00:'Toán, Vật lí, Vẽ mỹ thuật', V01:'Toán, Ngữ văn, Vẽ mỹ thuật', H00:'Ngữ văn, Năng khiếu vẽ 1, Năng khiếu vẽ 2', T00:'Toán, Sinh học, Năng khiếu TDTT', N00:'Ngữ văn, Năng khiếu âm nhạc 1, 2', M00:'Ngữ văn, Toán, Năng khiếu' };
        const khoiFull = k => k + ': ' + (KHOI_TEN[k] || '') + (/^[VHTNM]\d/.test(k) ? ' (môn năng khiếu thi riêng, điểm ước tính)' : '');
        const kScore = (k, sc) => KHOI[k].reduce((a, m) => a + (Number(sc[m]) || 0), 0);
        // ---- Điểm học lực: chọn mức (không nhập số) -> điểm đại diện ----
        const LEVELS = [['Dưới 5.0', 4.5], ['5.0 - 6.4', 5.75], ['6.5 - 7.9', 7.25], ['8.0 - 8.9', 8.5], ['9.0 - 10', 9.5]];
        // ---- 18 câu trắc nghiệm Holland (mỗi nhóm 3 câu, trả lời 3 mức: 2 / 1 / 0 điểm) ----
        const QS = [['R','Em thích sửa chữa, lắp ráp đồ vật hoặc máy móc.'],['I','Em thích tìm hiểu vì sao một hiện tượng xảy ra.'],['A','Em thích vẽ, viết, thiết kế hoặc chơi nhạc.'],['S','Em thích giúp đỡ, giảng bài cho bạn bè.'],['E','Em thích thuyết trình, thuyết phục người khác.'],['C','Em thích sắp xếp, quản lý số liệu, giấy tờ ngăn nắp.'],
            ['R','Em thích làm việc với dụng cụ, thiết bị hoặc ngoài trời.'],['I','Em thích giải các bài toán, câu đố khó.'],['A','Em thích nghĩ ra ý tưởng mới, khác biệt.'],['S','Em thích lắng nghe và chia sẻ với người khác.'],['E','Em thích làm trưởng nhóm, dẫn dắt mọi người.'],['C','Em thích làm việc theo quy trình rõ ràng.'],
            ['R','Em thích tự tay làm ra sản phẩm thực tế.'],['I','Em thích làm thí nghiệm hoặc nghiên cứu.'],['A','Em thích tự do thể hiện cá tính khi làm việc.'],['S','Em thích hoạt động tập thể, cộng đồng.'],['E','Em thích kinh doanh, bán hàng hoặc tổ chức sự kiện.'],['C','Em thích tính toán chi tiết, chính xác.']];
        const ANS = ['Không thích', 'Bình thường', 'Rất thích'];   // thứ tự nút trái -> phải; chỉ số = điểm lưu: 0 / 1 / 2 (Rất thích = 2, Bình thường = 1, Không thích = 0)
        // ---- Điểm chuẩn 3 năm gần nhất (thang 30). DỮ LIỆU ƯỚC TÍNH - admin thay bằng số liệu chính thức từng năm tại đây ----
        const BASE = {it:25,ai:26,cs:25,ce:24,me:22,ee:23,tel:23,auto:24,civ:20,arc:22,trn:20,log:25,fin:25,acc:24,bus:24,mkt:25,eco:25,ecom:25,law:25,jou:25,pr:26,en:25,lang:25,int:26,tour:23,soc:22,psy:24,edu:24,med:27,den:27,pha:26,nur:21,bio:22,chem:21,food:22,agr:18,water:17,geo:17,math:23,phy:22,des:22,ind:23,pol:24,sec:24,mmd:25};
        const TIER = {top:'hust neu ftu hmu vnu-uet vnu-ueb vnu-ulis dav hup', low:'haui tlu vnua hou hau humg huce fptu'};
        const DC_YEARS = [2023, 2024, 2025];
        function diemChuan(uid, k) {
            const off = TIER.top.split(' ').includes(uid) ? 1.5 : TIER.low.split(' ').includes(uid) ? -1.5 : 0.5, h = (k.charCodeAt(0) + k.length) % 3;
            const ys = [[-0.4, 0.2, 0], [0.3, -0.3, 0.1], [0, 0.4, -0.2]][h].map(d => Math.max(14, Math.min(29.5, Math.round(((BASE[k] ?? MJ[k][3]) + off + d) * 4) / 4)));
            const avg = ys.reduce((a, b) => a + b, 0) / 3;
            return { ys, safe: Math.min(30, Math.round((avg + 0.5) * 4) / 4) };   // điểm an toàn = trung bình 3 năm + 0.5
        }
        // D.qv === 2: giá trị lưu = điểm trực tiếp (0/1/2). Dữ liệu cũ (không có qv) lưu theo chỉ số cũ (0 = Rất thích) -> quy đổi 2 - q
        const holScore = (D = DEEP) => { const r = { R:0, I:0, A:0, S:0, E:0, C:0 }; QS.forEach((q, i) => { const v = D.q[i]; if (v !== undefined && v !== null) r[q[0]] += (D.qv === 2 ? v : 2 - v); }); return r; };
        function deepFresh() { return { dob: (user.deepData && user.deepData.dob) || '', lv: {}, q: [], qv: 2, m: {}, majors: [] }; }
        function openDeep() {
            if (!user.uniId || !UNIS.some(u => u.id === user.uniId)) return eduAlert('Bạn cần chọn Nguyện vọng Đại học trước (mục "Đổi nguyện vọng Đại học").', 'warning');
            // Mỗi lần làm Phân tích chuyên sâu: xóa sạch dữ liệu cũ (điểm học lực, Holland, MBTI, ngành đã chọn, điểm mục tiêu) - CHỈ giữ lại Ngày sinh
            DEEP = deepFresh(); DPF = { q: '', g: '', k: '', ok: false, open: {} }; mbtiPage = 0;
            $('modal-deep').style.display = 'flex';
            DSTEP = 1;   // luôn bắt đầu từ Phần 1 (ngày sinh cũ được điền sẵn)
            deepRender(); deepScroll(0);
        }
        function deepScroll(y) { const sc = deepScroller(); if (sc) sc.scrollTop = y; }
        const dBtn = (t, f, st) => `<button onclick="${f}" style="padding:13px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;${st}">${t}</button>`;
        const DEEP_PARTS = 4;
        // Dải cảnh báo nhỏ gọn ở đáy popup (ngay trên nút "Xem kết quả"), chỉ hiện khi còn câu chưa trả lời
        function deepMbtiWarn() {
            const miss = mbtiMissing(); if (!miss.length) return '';
            const nums = miss.slice(0, 6).map(x => x.i + 1).join(', ') + (miss.length > 6 ? '…' : ''), gp = Math.floor(miss[0].i / MBTI_PER_PAGE);
            const jump = mbtiIsMobile() && gp !== mbtiPage ? ` <a href="javascript:void(0)" onclick="mbtiGoPage(${gp})" style="font-weight:700;text-decoration:underline;color:inherit;">Đến câu thiếu ›</a>` : '';
            return `<div class="deep-foot-note" role="status"><svg class=ic aria-hidden=true><use href=#i-alert></use></svg> Còn thiếu ${miss.length}/${MBTI_QS.length} câu (câu ${nums})${jump}</div>`;
        }
        function deepRender() {
            const el = $('deep-content'), prog = DSTEP <= DEEP_PARTS ? `<div style="display:flex;gap:6px;margin:6px 0 4px;">${[1,2,3,4].map(i => `<div style="flex:1;height:6px;border-radius:3px;background:${i <= DSTEP ? 'var(--primary)' : 'var(--border)'};"></div>`).join('')}</div><div style="height:8px;"></div>` : '';
            let h = prog;
            if (DSTEP === 1) h += `<h3 style="font-size:15px;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-calendar-month></use></svg> Phần 1/4: Ngày sinh</h3><p style="font-size:13px;color:#64748b;margin-bottom:10px;">Dùng để tính mệnh của em (theo năm âm lịch).</p>
                <input name="dp-dob" type="date" id="dp-dob" aria-label="Ngày sinh" value="${esc(DEEP.dob)}" min="2000-01-01" max="2014-12-31" style="width:100%;max-width:420px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;font-size:15px;margin-bottom:16px;display:block;">${dBtn('Tiếp tục ›', 'deepNext()', 'width:100%;max-width:420px;background:var(--primary);color:#fff;')}`;
            else if (DSTEP === 2) h += `<h3 style="font-size:15px;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-note-edit></use></svg> Phần 2/4: Điểm học lực hiện tại</h3><p style="font-size:13px;color:#64748b;margin-bottom:10px;">Chọn mức điểm trung bình học bạ của từng môn (môn nào không học thì chọn "Không học").</p>
                <div class="dp-grid">${MON.map(m => `<div style="margin-bottom:10px;"><div style="font-size:13px;font-weight:700;margin-bottom:4px;">${m[1]}</div><div style="display:flex;gap:5px;flex-wrap:wrap;">${LEVELS.map((l, i) => dBtn(l[0], `deepLv('${m[0]}',${i})`, `flex:1;min-width:64px;padding:9px 4px;font-size:12px;${DEEP.lv[m[0]] === i ? 'background:var(--primary);color:#fff;' : 'background:#fff;color:#334155;border:1px solid #e2e8f0;'}`)).join('') + dBtn('<svg class=ic aria-hidden=true><use href=#i-cancel></use></svg> Không học', `deepLv('${m[0]}',-1)`, `flex:1;min-width:84px;padding:9px 4px;font-size:12px;${DEEP.lv[m[0]] === -1 ? 'background:#64748b;color:#fff;' : 'background:#f8fafc;color:#64748b;border:1px dashed #cbd5e1;'}`)}</div></div>`).join('')}</div>
                <div style="display:flex;gap:8px;margin-top:14px;">${dBtn('‹ Quay lại', 'deepBack()', 'flex:1;background:#e2e8f0;color:#334155;')}${dBtn('Tiếp tục ›', 'deepNext()', 'flex:2;background:var(--primary);color:#fff;')}</div>`;
            else if (DSTEP === 3) h += `<h3 style="font-size:15px;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-compass></use></svg> Phần 3/4: Trắc nghiệm sở thích Holland (18 câu)</h3><p style="font-size:13px;color:#64748b;margin-bottom:10px;">Đã trả lời <b>${DEEP.q.filter(x => x !== undefined && x !== null).length}</b>/18. Không có đáp án đúng sai, hãy chọn theo cảm nhận thật của em.</p>
                <div class="dp-grid">${QS.map((q, i) => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px;margin-bottom:8px;"><div style="font-size:13px;margin-bottom:6px;">${i + 1}. ${q[1]}</div><div style="display:flex;gap:5px;">${ANS.map((a, j) => dBtn(a, `deepAns(${i},${j})`, `flex:1;padding:8px 2px;font-size:12px;${DEEP.q[i] === j ? 'background:var(--primary);color:#fff;' : 'background:#f1f5f9;color:#334155;'}`)).join('')}</div></div>`).join('')}</div>
                <div style="display:flex;gap:8px;margin-top:14px;">${dBtn('‹ Quay lại', 'deepBack()', 'flex:1;background:#e2e8f0;color:#334155;')}${dBtn('Tiếp tục ›', 'deepNext()', 'flex:2;background:var(--primary);color:#fff;')}</div>`;
            else if (DSTEP === 4) h += `<h3 style="font-size:15px;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-brain></use></svg> Phần 4/4: Trắc nghiệm Tính cách MBTI (16 câu)</h3><p style="font-size:13px;color:#64748b;margin-bottom:10px;">Mức độ đúng với em (1 = hoàn toàn không đúng, 5 = rất đúng với em). Không có đáp án đúng sai.</p>
                ${deepMbtiHtml()}
                <div class="deep-foot">${deepMbtiWarn()}<div style="display:flex;gap:8px;">${dBtn('‹ Quay lại', 'deepBack()', 'flex:1;background:#e2e8f0;color:#334155;')}${dBtn('Xem kết quả ›', 'deepNext()', 'flex:2;background:var(--primary);color:#fff;')}</div></div>`;
            else h += deepResultHtml();
            el.innerHTML = h;
        }
        function deepLv(m, i) { DEEP.lv[m] = i; const t = deepScroller().scrollTop; deepRender(); deepScroll(t); }
        function deepAns(i, j) { DEEP.q[i] = j; DEEP.qv = 2; const t = deepScroller().scrollTop; deepRender(); deepScroll(t); }
        function deepRestart() { const dob = DEEP.dob; DEEP = { dob, lv: {}, q: [], qv: 2, m: {}, majors: [] }; DSTEP = 1; DPF = { q: '', g: '', k: '', ok: false, open: {} }; mbtiPage = 0; deepRender(); deepScroll(0); }   // làm lại -> về Phần 1
        // Thoát Phân tích chuyên sâu bất cứ lúc nào (hỏi lại nếu đang làm dở Phần 2 / 3 / 4 để khỏi mất dữ liệu)
        async function deepExit() {
            if (DSTEP >= 2 && DSTEP <= DEEP_PARTS) {
                const yes = await eduConfirm('Các lựa chọn em đang làm dở sẽ không được lưu.', { title: 'Thoát Phân tích chuyên sâu?', confirmText: 'Thoát', cancelText: 'Ở lại', icon: 'warning' });
                if (!yes) return;
            }
            closeModal('modal-deep');
        }
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('modal-deep').style.display === 'flex' && !document.querySelector('.swal2-container')) deepExit(); });
        function deepBack() { DSTEP--; deepRender(); deepScroll(0); }
        function deepNext() {
            if (DSTEP === 1) { const v = $('dp-dob').value; if (!v || !calcMenh(v)) return eduAlert('Hãy chọn ngày sinh hợp lệ (năm 2000-2014).', 'warning'); DEEP.dob = v; }
            if (DSTEP === 2 && (Object.keys(DEEP.lv).length < MON.length || !Object.values(DEEP.lv).some(v => v >= 0))) return eduAlert('Hãy chọn mức điểm cho từng môn (môn không học thì chọn "Không học").', 'warning');
            if (DSTEP === 3 && DEEP.q.filter(x => x !== undefined && x !== null).length < QS.length) return eduAlert('Em còn câu chưa trả lời, hãy làm hết 18 câu nhé.', 'warning');
            if (DSTEP === 4) {
                const miss = mbtiMissing();
                if (miss.length) { if (mbtiIsMobile()) mbtiPage = Math.floor(miss[0].i / MBTI_PER_PAGE); deepRender(); return eduAlert('Em còn ' + miss.length + ' câu MBTI chưa trả lời (câu ' + miss.map(x => x.i + 1).join(', ') + '), hãy làm hết ' + MBTI_QS.length + ' câu nhé.', 'warning'); }
            }
            DSTEP++; if (DSTEP === 4) mbtiPage = 0; if (DSTEP === DEEP_PARTS + 1) deepSave(); deepRender(); deepScroll(0);
        }

        // ---- Hiển thị ngành aim (viết tắt) + Điểm mục tiêu trong tab Tài khoản ----
        const abbrMj = n => { const w = n.replace(/\(.*?\)/g, '').split(/[\s\-–&\/,]+/).filter(x => x && !/^(và|của)$/i.test(x)); return w.length === 1 ? w[0] : w.map(x => x[0].toUpperCase()).join(''); };
        // Máy tính (>=768px): hiện tên ngành đầy đủ. Điện thoại: viết tắt, chạm vào để xem tên đầy đủ
        const isWide = () => window.matchMedia('(min-width: 768px)').matches;
        const mjTag = r => isWide() ? esc(r.name) : `<span onclick="event.stopPropagation();showMjFull('${r.k}')" style="cursor:pointer;border-bottom:1px dotted currentColor;">${esc(abbrMj(r.name))}</span>`;
        function showMjFull(k) { eduAlert(MJ[k][0], 'info'); }
        function chosenRank() { const d = user.deepData; return (d && d.dob && d.q && user.uniId) ? deepRank(d).filter(r => (d.majors || []).includes(r.k)) : []; }
        function renderProfileDeep() {
            const ch = chosenRank(), w = $('profile-majors-wrap'), g = $('goal-box'); if (!w || !g) return;
            w.style.display = g.style.display = ch.length ? '' : 'none'; if (!ch.length) return;
            // Đồng bộ tên ngành đang aim sang profiles/{uid}.majors để Cổng Phụ huynh xem được (privates thì chỉ chủ tài khoản đọc)
            const pubNames = ch.map(r => r.name).slice(0, 3);
            if (ME && user.name && JSON.stringify(pubNames) !== JSON.stringify(user.pubMajors || [])) {
                user.pubMajors = pubNames;
                fbDb.collection('profiles').doc(ME.uid).set({ majors: pubNames }, { merge: true }).catch(e => console.warn('Chưa ghi được profiles.majors (hãy publish firestore.rules mới):', e));
            }
            $('profile-majors').innerHTML = ch.map(mjTag).join(' • ');
            const tg = Number(user.deepData.target) || Math.max(...ch.map(r => r.dc.safe));
            g.innerHTML = `<div class="card-title"><svg class=ic aria-hidden=true><use href=#i-bullseye-arrow></use></svg> Điểm mục tiêu của em</div>
                <div style="display:flex;align-items:center;gap:8px;margin:8px 0;"><input name="goal-input" type="number" id="goal-input" aria-label="Điểm mục tiêu (trên 30)" min="0" max="30" step="0.25" value="${tg}" onchange="goalSet(this.value)" style="width:90px;padding:8px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;font-weight:700;"><span style="font-size:12px;color:#64748b;">/ 30 điểm (em có thể tự chỉnh)</span></div>
                ${ch.map(r => { const d = tg - r.dc.safe, z0 = Math.abs(d) < 0.005; return `<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;padding:6px 0;border-top:1px solid #f1f5f9;"><span><b>${mjTag(r)}</b> <span style="color:#64748b;">(an toàn ${r.dc.safe})</span></span><b style="color:${d > 0 || z0 ? '#16a34a' : '#dc2626'};">${z0 ? '✓ an toàn' : d > 0 ? 'thừa +' + d.toFixed(2).replace(/\.?0+$/, '') : 'thiếu ' + Math.abs(d).toFixed(2).replace(/\.?0+$/, '')}</b></div>`; }).join('')}`;
        }
        function goalSet(v) {
            const n = Math.max(0, Math.min(30, parseFloat(v))); if (isNaN(n) || !user.deepData) return renderProfileDeep();
            user.deepData.target = n; renderProfileDeep();
            if (ME) fbDb.collection('privates').doc(ME.uid).set({ deep: { target: n } }, { merge: true }).catch(() => {});
        }
        window.matchMedia('(min-width: 768px)').addEventListener('change', () => renderProfileDeep());   // đổi cỡ màn hình -> hiển thị lại
        // Trường mạnh cho từng ngành đã chọn: ưu tiên nhóm trường top, rồi theo điểm an toàn
        function uniSuggestHtml() {
            return chosenRank().map(r => { const us = UNIS.filter(u => mjOf(u.id).includes(r.k)).map(u => ({ u, top: TIER.top.split(' ').includes(u.id) ? 1 : 0, sf: diemChuan(u.id, r.k).safe })).sort((a, b) => b.top - a.top || b.sf - a.sf).slice(0, 5);
                return `<p style="font-size:12px;color:#78350f;margin:3px 0;">• <b>${mjTag(r)}</b>: ${us.map(x => esc(x.u.sub) + ' (' + x.sf + ')').join(', ')}</p>`; }).join('');
        }
        function goProfile() { const nav = document.querySelector('.nav-item[onclick*="tab-profile"]'); if (nav) switchTab('tab-profile', nav); window.scrollTo(0, 0); }
        function deepSave(finish) {
            if (!ME) return;
            if (finish && !DEEP.majors.length) return eduAlert('Hãy chọn ít nhất 1 ngành em muốn aim.', 'warning');
            // MBTI: ghi riêng vào privates.mbti (cùng chỗ cũ) để tab Phân tích vẫn đọc được; khối deep không chứa câu trả lời MBTI
            const sc = cleanMbtiScores(DEEP.m), full = Object.keys(sc).length === MBTI_QS.length;
            const deepDoc = clean(DEEP); delete deepDoc.m;
            const payload = { deep: deepDoc }, fields = ['deep'];
            let res = null;
            if (full) { res = mbtiResult(sc); payload.mbti = { scores: sc, result: { type: res.type, text: mbtiText(res) }, updatedAt: Date.now() }; fields.push('mbti'); }
            fbDb.collection('privates').doc(ME.uid).set(payload, { mergeFields: fields }).then(() => {   // mergeFields: GHI ĐÈ cả khối deep (không giữ lại 'target' cũ)
                if (full) {
                    user.mbtiScores = sc; user.mbtiResult = { type: res.type, text: mbtiText(res), detail: res.detail };
                    try { localStorage.setItem(MBTI_LS(), JSON.stringify({ scores: sc })); } catch (e) {}
                }
                user.deepData = deepDoc; renderProfileDeep();
                if (finish) { closeModal('modal-deep'); goProfile(); }   // lưu xong tự quay về Hồ sơ (tab Tài khoản)
            }).catch(() => eduAlert('Chưa lưu được, hãy kiểm tra mạng.', 'error'));
        }
        // Công thức xếp hạng ngành (Phân tích chuyên sâu): 25% Môn học + 25% Điểm an toàn (TB điểm chuẩn 3 năm + 0.5) + 35% Holland + 15% MBTI
        // Thiếu MBTI (dữ liệu cũ): 30% Môn + 30% An toàn + 40% Holland. Mệnh chỉ để tham khảo, không tính điểm.
        const DEEP_FORMULA = '25% Môn học + 25% Điểm an toàn 3 năm + 35% Holland + 15% MBTI';
        function deepRank(D = DEEP) {
            const sc = {}, hol = holScore(D), mb = deepMbti(D);
            Object.keys(D.lv).forEach(m => { if (LEVELS[D.lv[m]]) sc[m] = LEVELS[D.lv[m]][1]; });   // -1 = không học -> bỏ qua
            return mjOf(user.uniId).map(k => {
                const m = MJ[k], ks = m[1].split(',').filter(x => KHOI[x]).map(x => [x, kScore(x, sc)]).sort((a, b) => b[1] - a[1])[0] || ['', 0], dc = diemChuan(user.uniId, k);
                const kf = Math.min(1, ks[1] / 30), sf = Math.min(1, ks[1] / dc.safe);
                const hm = Math.min(1, m[2].split('').reduce((a, c) => a + (hol[c] || 0) / 6, 0) / 2), mf = mb.done ? mbtiFit(mb.type, m[2]) : 0;
                const pct = mb.done ? kf * 25 + sf * 25 + hm * 35 + mf * 15 : kf * 30 + sf * 30 + hm * 40;
                return { k, name: m[0], khoi: ks[0], pts: ks[1], dc, pct: Math.round(pct), parts: { mon: Math.round(kf * 100), safe: Math.round(sf * 100), hol: Math.round(hm * 100), mbti: mb.done ? Math.round(mf * 100) : null } };
            }).sort((a, b) => b.pct - a.pct);
        }
        // ================= CHỌN NGÀNH (Phân tích chuyên sâu): tìm kiếm, nhóm ngành, khối thi, thẻ chi tiết =================
        const MJ_GROUPS = [['it','<svg class=ic aria-hidden=true><use href=#i-laptop></use></svg>','Công nghệ & Dữ liệu'],['eng','<svg class=ic aria-hidden=true><use href=#i-cog></use></svg>','Kỹ thuật & Công nghiệp'],['build','<svg class=ic aria-hidden=true><use href=#i-office-building-cog></use></svg>','Xây dựng & Kiến trúc'],['eco','<svg class=ic aria-hidden=true><use href=#i-briefcase></use></svg>','Kinh tế & Quản lý'],['lang','<svg class=ic aria-hidden=true><use href=#i-translate></use></svg>','Ngôn ngữ & Quốc tế'],['media','<svg class=ic aria-hidden=true><use href=#i-newspaper></use></svg>','Truyền thông & Xã hội'],['law','<svg class=ic aria-hidden=true><use href=#i-scale-balance></use></svg>','Luật & Chính trị'],['edu','<svg class=ic aria-hidden=true><use href=#i-school></use></svg>','Sư phạm & Giáo dục'],['med','<svg class=ic aria-hidden=true><use href=#i-hospital-building></use></svg>','Y dược & Sức khỏe'],['sci','<svg class=ic aria-hidden=true><use href=#i-microscope></use></svg>','Khoa học tự nhiên'],['agr','<svg class=ic aria-hidden=true><use href=#i-sprout></use></svg>','Nông nghiệp & Môi trường'],['design','<svg class=ic aria-hidden=true><use href=#i-palette></use></svg>','Thiết kế & Nghệ thuật'],['sec','<svg class=ic aria-hidden=true><use href=#i-shield-check></use></svg>','Công an & An ninh']];
        // Gán nhóm theo TÊN ngành, xét theo thứ tự (ngành không khớp luật nào => Kỹ thuật & Công nghiệp)
        const MJ_GRULES = [['sec', /Cảnh sát|An ninh|ANTT|Thi hành án|hình sự|Nghiệp vụ/], ['med', /Y khoa|Răng|Y học|Y tế|Khúc xạ|Hộ sinh|Phục hồi|Dinh dưỡng|Dược|Điều dưỡng/], ['edu', /^(Sư phạm|Giáo dục)|giáo dục/i],
            ['law', /Chính trị học|Chủ nghĩa|Xây dựng Đảng|Quản lý nhà nước|Quản lý công|Luật|Triết/], ['build', /xây dựng|Kiến trúc|Quy hoạch|Nội thất|cấp thoát nước|Cảnh quan/i], ['it', /vi mạch|Công nghệ thông tin|máy tính|Trí tuệ|dữ liệu|An toàn thông tin|Internet|Robot|Hệ thống thông tin/],
            ['eco', /Kinh tế|Kinh doanh|Quản trị|Tài chính|Ngân hàng|Kế toán|Kiểm toán|Marketing|Logistics|Thương mại|Bất động sản|Bảo hiểm|Khởi nghiệp|nhân lực|Fintech|Công nghệ tài chính|Quản lý công nghiệp|Du lịch|Khách sạn/], ['media', /Báo chí|Truyền thông|Quan hệ công chúng|Xuất bản|Xã hội|Tâm lý|Thư viện|văn phòng|Lịch sử|Văn học|Khoa học quản lý/],
            ['design', /Thiết kế|Đồ họa|Điêu khắc|Thời trang|Mỹ thuật|Đa phương tiện/], ['lang', /Ngôn ngữ|Châu Á|Quốc tế học|Đông phương|Đông Nam Á|Việt Nam học|Quan hệ quốc tế|ngoại giao|Hán Nôm|tiếng/],
            ['agr', /Nông|Thú y|Thủy sản|Chăn nuôi|Bảo vệ thực vật|thực phẩm|môi trường|đất đai|Địa chất|Mỏ|Trắc địa|tài nguyên nước|dầu khí/i], ['sci', /^Toán|Thống kê|Vật lý|Vật lí|vật liệu|Hóa học|sinh học|Địa lý|Khí tượng/i]];
        const mjGroup = name => (MJ_GRULES.find(x => x[1].test(name)) || ['eng'])[0];
        // Nghề tiêu biểu (chỉ cho các ngành trong danh mục MJ; ngành bổ sung theo tên thì không hiện dòng này)
        const MJ_JOBS = { it:'Lập trình viên, kỹ sư phần mềm, chuyên viên hệ thống', ai:'Kỹ sư AI, nhà khoa học dữ liệu, chuyên viên học máy', cs:'Chuyên gia an ninh mạng, kiểm thử xâm nhập', ce:'Kỹ sư vi mạch, hệ thống nhúng, phần cứng', me:'Kỹ sư cơ khí, cơ điện tử, thiết kế máy', ee:'Kỹ sư điện, tự động hóa, vận hành lưới điện', tel:'Kỹ sư viễn thông, mạng, IoT', auto:'Kỹ sư ô tô, thiết kế và bảo dưỡng xe',
            civ:'Kỹ sư xây dựng, giám sát công trình, thiết kế kết cấu', arc:'Kiến trúc sư, thiết kế quy hoạch', trn:'Kỹ sư cầu đường, quản lý giao thông vận tải', log:'Chuyên viên logistics, quản lý chuỗi cung ứng', fin:'Chuyên viên ngân hàng, phân tích tài chính, đầu tư', acc:'Kế toán, kiểm toán viên, tư vấn thuế', bus:'Quản lý doanh nghiệp, khởi nghiệp, chuyên viên kinh doanh', mkt:'Chuyên viên marketing, quản lý thương hiệu',
            eco:'Phân tích kinh tế, hoạch định chính sách, xuất nhập khẩu', ecom:'Quản lý kinh doanh trực tuyến, chuyên viên thương mại điện tử', law:'Luật sư, thẩm phán, pháp chế doanh nghiệp', jou:'Phóng viên, biên tập viên, sản xuất nội dung', pr:'Chuyên viên truyền thông, quan hệ công chúng, tổ chức sự kiện', en:'Biên phiên dịch, giảng viên, chuyên viên quốc tế', lang:'Biên phiên dịch, hướng dẫn viên, nhân viên doanh nghiệp nước ngoài', int:'Cán bộ ngoại giao, chuyên viên quan hệ quốc tế',
            tour:'Quản lý khách sạn, điều hành tour, hướng dẫn viên', soc:'Công tác xã hội, nghiên cứu xã hội', psy:'Chuyên viên tâm lý, tham vấn học đường', edu:'Giáo viên các cấp, giảng viên, chuyên viên giáo dục', med:'Bác sĩ đa khoa, bác sĩ chuyên khoa', den:'Bác sĩ nha khoa', pha:'Dược sĩ, nghiên cứu và kiểm nghiệm thuốc', nur:'Điều dưỡng viên, kỹ thuật viên xét nghiệm, chẩn đoán hình ảnh', bio:'Nghiên cứu công nghệ sinh học, kỹ thuật viên phòng thí nghiệm',
            chem:'Kỹ sư hóa, môi trường, quản lý chất lượng', food:'Kỹ sư thực phẩm, kiểm định chất lượng', agr:'Kỹ sư nông nghiệp, bác sĩ thú y', water:'Kỹ sư thủy lợi, tài nguyên nước', geo:'Kỹ sư địa chất, trắc địa, khai thác mỏ', math:'Chuyên viên thống kê, phân tích dữ liệu, giảng viên', phy:'Nghiên cứu vật liệu, kỹ sư công nghệ', des:'Nhà thiết kế đồ họa, sáng tạo nội dung số', mmd:'Sản xuất truyền thông, thiết kế đa phương tiện', ind:'Quản lý sản xuất, kỹ sư công nghiệp', pol:'Sĩ quan công an (xét tuyển theo quy định riêng)', sec:'Sĩ quan an ninh (xét tuyển theo quy định riêng)' };
        const dpChipSt = on => 'flex:0 0 auto;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid ' + (on ? 'var(--primary)' : 'var(--border)') + ';background:' + (on ? 'var(--primary)' : 'var(--card-bg,#fff)') + ';color:' + (on ? '#fff' : 'inherit') + ';';
        function dpFiltered(list) {
            const t = foldVN(DPF.q.trim()).split(/\s+/).filter(Boolean);
            return list.filter(r => (!DPF.g || mjGroup(r.name) === DPF.g) && (!DPF.k || MJ[r.k][1].split(',').includes(DPF.k)) && (!DPF.ok || r.pts >= r.dc.safe)
                && (!t.length || t.every(x => foldVN(r.name + ' ' + (MJ_JOBS[r.k] || '') + ' ' + ((MJ_GROUPS.find(g => g[0] === mjGroup(r.name)) || [])[2] || '')).includes(x))));
        }
        function dpTray() {
            return DEEP.majors.length ? '<div style="display:flex;gap:6px;overflow-x:auto;white-space:nowrap;padding:3px 0;scrollbar-width:none;"><span style="font-size:12px;color:#64748b;align-self:center;flex:0 0 auto;">Đã chọn:</span>'
                + DEEP.majors.map(k => `<button type="button" onclick="deepPick('${k}')" style="flex:0 0 auto;max-width:220px;overflow:hidden;text-overflow:ellipsis;padding:6px 10px;border-radius:999px;border:0;background:var(--primary);color:#fff;font-size:12px;cursor:pointer;">${esc(MJ[k][0])} <svg class=ic aria-hidden=true><use href=#i-close></use></svg></button>`).join('') + '</div>' : '';
        }
        function dpControls(list) {
            const gs = MJ_GROUPS.filter(g => list.some(r => mjGroup(r.name) === g[0])), ks = [...new Set(list.flatMap(r => MJ[r.k][1].split(',')))].filter(x => KHOI[x]);
            const chip = (key, val, label) => `<button type="button" data-dpchip="${key}|${val}" onclick="dpSet('${key}','${val}')" style="${dpChipSt(key === 'ok' ? DPF.ok : DPF[key] === val)}">${label}</button>`;
            const row = h => `<div style="display:flex;gap:6px;overflow-x:auto;white-space:nowrap;padding:3px 0;scrollbar-width:none;">${h}</div>`;
            return `<div id="dp-ctl" style="position:sticky;top:0;z-index:5;background:var(--card-bg,#fff);padding:8px 0 6px;">
                <input id="dp-q" type="search" autocomplete="off" aria-label="Tìm ngành" value="${esc(DPF.q)}" oninput="dpSearch(this.value)" placeholder="Tìm ngành hoặc nghề (không cần dấu)..." style="width:100%;padding:11px 14px;border:2px solid var(--border);border-radius:12px;font-size:14px;background:var(--card-bg,#fff);color:inherit;outline:none;">
                ${row(chip('g', '', 'Tất cả nhóm') + gs.map(g => chip('g', g[0], g[1] + ' ' + g[2])).join(''))}
                ${row(chip('k', '', 'Mọi khối') + ks.map(x => chip('k', x, x)).join('') + chip('ok', '1', '<svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg> Đủ điểm an toàn'))}
                <div id="dp-tray">${dpTray()}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">Hiển thị <b id="dp-found">${dpFiltered(list).length}</b>/${list.length} ngành</div></div>`;
        }
        function dpRefresh() {   // chỉ vẽ lại danh sách + chip + khay "Đã chọn" (không vẽ lại cả popup nên ô tìm kiếm giữ nguyên con trỏ)
            const box = document.getElementById('dp-list'); if (!box) return;
            const ls = dpFiltered(DPLIST);
            box.innerHTML = ls.map(mjRow).join('') || '<p style="font-size:13px;color:#64748b;">Không có ngành phù hợp. Thử bỏ bớt bộ lọc hoặc đổi từ khóa.</p>';
            const f = document.getElementById('dp-found'); if (f) f.textContent = ls.length;
            const tr = document.getElementById('dp-tray'); if (tr) tr.innerHTML = dpTray();
            document.querySelectorAll('[data-dpchip]').forEach(b => { const p = b.dataset.dpchip.split('|'); b.style.cssText = dpChipSt(p[0] === 'ok' ? DPF.ok : DPF[p[0]] === p[1]); });
        }
        function dpSearch(v) { DPF.q = v; dpRefresh(); }
        function dpSet(key, val) { if (key === 'ok') DPF.ok = !DPF.ok; else DPF[key] = (val && DPF[key] !== val) ? val : ''; dpRefresh(); }
        function dpToggle(k) { DPF.open[k] = !DPF.open[k]; dpRefresh(); }
        // Mức đánh giá nhanh so với điểm an toàn: đủ = An toàn | thiếu tối đa 1,5 điểm = Cân nhắc | thiếu hơn = Khó (chỉ để tham khảo)
        const mjVerdict = (pts, safe) => pts >= safe ? ['An toàn', '#16a34a'] : pts >= safe - 1.5 ? ['Cân nhắc', '#d97706'] : ['Khó', '#dc2626'];
        const mjRow = r => {
            const on = DEEP.majors.includes(r.k), open = !!DPF.open[r.k], enough = r.pts >= r.dc.safe, jobs = MJ_JOBS[r.k];
            const hol = (MJ[r.k][2] || '').split('').map(c => (HOL.find(x => x[0] === c) || [c, c])[1]).join(' • ');
            return `<div style="background:${on ? 'var(--sel-soft)' : 'var(--card-bg)'};border:2px solid ${on ? 'var(--primary)' : 'var(--border)'};border-radius:14px;padding:10px 12px;">
                <div onclick="deepPick('${r.k}')" style="display:flex;gap:10px;align-items:center;cursor:pointer;min-height:46px;">
                    <span style="flex:0 0 26px;height:26px;border-radius:50%;border:2px solid var(--primary);background:${on ? 'var(--primary)' : 'transparent'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;">${on ? '✓' : ''}</span>
                    <div style="flex:1;min-width:0;font-size:13px;"><b>${esc(r.name)}</b><br><span style="font-size:12px;color:#64748b;">Khối ${esc(r.khoi)} • An toàn <b>${r.dc.safe}</b> • Ước tính <b style="color:${enough ? '#16a34a' : '#dc2626'};">${r.pts.toFixed(1)}</b> <span style="display:inline-block;margin-left:4px;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${mjVerdict(r.pts, r.dc.safe)[1]};">${mjVerdict(r.pts, r.dc.safe)[0]}</span></span></div>
                    <b style="color:var(--primary);font-size:15px;">${r.pct}%</b></div>
                <button type="button" onclick="dpToggle('${r.k}')" style="margin-top:6px;padding:6px 0;border:0;background:none;color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;">${open ? 'Ẩn chi tiết ▴' : 'Xem chi tiết ▾'}</button>
                ${open ? `<div style="margin-top:4px;padding:10px;border-radius:10px;background:var(--bg,#f8fafc);font-size:12px;line-height:1.7;color:#475569;">
                    ${jobs ? `<svg class=ic aria-hidden=true><use href=#i-briefcase></use></svg> <b>Nghề tiêu biểu:</b> ${esc(jobs)}<br>` : ''}<svg class=ic aria-hidden=true><use href=#i-compass></use></svg> <b>Hợp với người:</b> ${esc(hol)}<br><svg class=ic aria-hidden=true><use href=#i-book-multiple></use></svg> <b>Khối phù hợp nhất:</b> ${esc(khoiFull(r.khoi))}<br><svg class=ic aria-hidden=true><use href=#i-note-edit></use></svg> <b>Xét tuyển:</b> ${MJ[r.k][1].split(',').join(' • ')}<br>
                    <svg class=ic aria-hidden=true><use href=#i-chart-line></use></svg> <b>Điểm chuẩn:</b> ${DC_YEARS.map((y, i) => y + ': ' + r.dc.ys[i]).join(' • ')}<br><svg class=ic aria-hidden=true><use href=#i-scale-balance></use></svg> <b>Thành phần:</b> Môn ${r.parts.mon}% • An toàn ${r.parts.safe}% • Holland ${r.parts.hol}%${r.parts.mbti === null ? '' : ' • MBTI ' + r.parts.mbti + '%'}<br>
                    <svg class=ic aria-hidden=true><use href=#i-bullseye-arrow></use></svg> ${enough ? 'Đã đủ điểm an toàn.' : 'Còn thiếu <b>' + (r.dc.safe - r.pts).toFixed(1) + '</b> điểm so với mức an toàn.'}</div>` : ''}</div>`;
        };
        function deepResultHtml() {
            const mn = calcMenh(DEEP.dob), H = HANH[mn.hanh], list = (DPLIST = deepRank()), mb = deepMbti(DEEP), hol = holScore();
            const topH = Object.keys(hol).sort((a, b) => hol[b] - hol[a]).slice(0, 2), holTxt = topH.map(c => (HOL.find(x => x[0] === c) || [c, c])[1]).join(' • ');
            const lvs = MON.filter(m => LEVELS[DEEP.lv[m[0]]]).map(m => [m[1], LEVELS[DEEP.lv[m[0]]][1]]), avg = lvs.length ? lvs.reduce((a, x) => a + x[1], 0) / lvs.length : 0;
            const best = lvs.slice().sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).join(', ');
            const chip = (ic, lb, val, sub, c) => `<div style="background:var(--card-bg,#fff);border:1px solid var(--border,#e2e8f0);border-top:4px solid ${c};border-radius:12px;padding:10px 12px;min-width:0;"><div style="font-size:11px;color:#64748b;">${ic} ${lb}</div><div style="font-size:15px;font-weight:800;margin:2px 0;word-break:break-word;">${val}</div><div style="font-size:11px;color:#64748b;line-height:1.4;">${sub}</div></div>`;
            return `<div style="background:#fff7ed;border-left:4px solid ${H.c};padding:14px;border-radius:12px;margin-bottom:12px;"><h3 style="font-size:15px;color:${H.c};margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-star-four-points></use></svg> Mệnh của em: ${mn.name} (${mn.canchi})</h3><p style="font-size:13px;line-height:1.5;">${H.t}</p></div>
                <div class="deep-sum" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:14px;">
                    ${chip('<svg class=ic aria-hidden=true><use href=#i-star-four-points></use></svg>', 'Mệnh', esc(mn.name), esc(mn.canchi), H.c)}
                    ${chip('<svg class=ic aria-hidden=true><use href=#i-compass></use></svg>', 'Nhóm Holland', esc(topH.join('')), esc(holTxt), '#8b5cf6')}
                    ${chip('<svg class=ic aria-hidden=true><use href=#i-brain></use></svg>', 'Tính cách MBTI', mb.done ? esc(mb.type) : 'Chưa đủ dữ liệu', mb.done ? esc(mbtiText(mb)) : 'Chưa trả lời đủ 16 câu', '#0ea5e9')}
                    ${chip('<svg class=ic aria-hidden=true><use href=#i-note-edit></use></svg>', 'Điểm học lực', lvs.length ? 'TB ≈ ' + avg.toFixed(1) + '/10' : '—', lvs.length ? 'Mạnh: ' + esc(best) : 'Chưa có dữ liệu', '#16a34a')}
                </div>
                <h3 style="font-size:15px;margin-bottom:4px;"><svg class=ic aria-hidden=true><use href=#i-school></use></svg> Ngành tại ${esc(user.uniName)}</h3>
                <p style="font-size:12px;color:#64748b;margin-bottom:4px;">Bấm để chọn tối đa 3 ngành (đã chọn <b id="dp-count">${DEEP.majors.length}</b>/3). Điểm an toàn = trung bình điểm chuẩn 3 năm gần nhất + 0.5.</p>
                <p style="font-size:12px;color:#64748b;margin-bottom:8px;"><svg class=ic aria-hidden=true><use href=#i-scale-balance></use></svg> Xếp hạng theo: <b>${mb.done ? DEEP_FORMULA : '30% Môn học + 30% Điểm an toàn 3 năm + 40% Holland'}</b></p>
                ${dpControls(list)}<div id="dp-list" style="display:flex;flex-direction:column;gap:8px;">${dpFiltered(list).map(mjRow).join('') || '<p style="font-size:13px;color:#64748b;">Không có ngành phù hợp. Thử bỏ bớt bộ lọc hoặc đổi từ khóa.</p>'}</div>
                <div style="display:flex;gap:8px;margin-top:14px;">${dBtn('↺ Làm lại', 'deepRestart()', 'flex:1;background:#e2e8f0;color:#334155;')}${dBtn('<svg class=ic aria-hidden=true><use href=#i-content-save></use></svg> Lưu & về Hồ sơ', 'deepSave(1)', 'flex:2;background:var(--primary);color:#fff;')}</div>`;
        }
        function deepPick(k) {
            const set = new Set(DEEP.majors);
            if (set.has(k)) set.delete(k); else { if (set.size >= 3) return eduAlert('Chỉ chọn tối đa 3 ngành. Hãy bỏ bớt một ngành trước.', 'warning'); set.add(k); }
            DEEP.majors = [...set];
            if (document.getElementById('dp-list')) { dpRefresh(); const c = document.getElementById('dp-count'); if (c) c.textContent = DEEP.majors.length; return; }
            const t = deepScroller().scrollTop; deepRender(); deepScroll(t);
        }

        // ---- BÀI TẬP CỦA GIÁO VIÊN ----
        const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e) { return d; } };
        const ukey = () => user.name + "|" + user.schoolClass;
        let HW_DATA = ls('eduorient_assignments', []), SUBS_DATA = ls('eduorient_subs', {});
        let curHW = null, ans = [];
        // ================= FIREBASE (dùng chung phiên đăng nhập của trang chính) =================
        // Môi trường: nếu điền FB_STAGING (config project Firebase thử nghiệm) thì localhost và <project-thử-nghiệm>.web.app dùng project đó; còn lại luôn dùng project thật.
        const FB_STAGING = null;   // dán đối tượng config của project thử nghiệm vào đây (xem HUONG-DAN-STAGING.md)
        const FB_PROD = {apiKey:"AIzaSyDO6B0BHBJkKZ_xiose_q_hv6yqf2l7NHQ",authDomain:"eduorient-d06c2.firebaseapp.com",projectId:"eduorient-d06c2",storageBucket:"eduorient-d06c2.firebasestorage.app",messagingSenderId:"436898406278",appId:"1:436898406278:web:7fbaeaaffa36b4cf909607"};
        const FB_USE_STG = !!FB_STAGING && (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.indexOf(FB_STAGING.projectId) === 0);
        firebase.initializeApp(FB_USE_STG ? FB_STAGING : FB_PROD);
        const fbAuth = firebase.auth(), fbDb = firebase.firestore(), NOW = () => firebase.firestore.FieldValue.serverTimestamp();
        // ===== ĐIỀU HƯỚNG TRỰC TIẾP (thay cho parent.postMessage) =====
        const PAGE_LOGIN = 'index.html';
        const goTo = (page) => { window.location.href = page; };

        // ===== QUẢN LÝ LISTENER FIRESTORE =====
        // Mọi onSnapshot (doc / collection / query) đều được đăng ký vào FS_LISTENERS để gỡ hàng loạt TRƯỚC khi signOut
        // hoặc khi onAuthStateChanged trả về null -> không còn "Uncaught Error in snapshot listener: permission-denied".
        const FS_LISTENERS = new Set();
        let FS_DETACHED = false;   // true từ lúc bắt đầu đăng xuất: chặn đăng ký listener mới + bỏ qua callback muộn
        function detachAllListeners() {
            FS_DETACHED = true;
            FS_LISTENERS.forEach(un => { try { un(); } catch (e) {} });
            FS_LISTENERS.clear();
            // dọn các tham chiếu cục bộ (các hàm hủy đã được gọi ở trên, gọi lại là vô hại)
            try { if (typeof GROUP_UNSUB !== 'undefined') GROUP_UNSUB = null; } catch (e) {}
            try { if (typeof PREV_UNSUB !== 'undefined') Object.keys(PREV_UNSUB).forEach(k => delete PREV_UNSUB[k]); } catch (e) {}
            try { if (typeof unsubRoom !== 'undefined') unsubRoom = null; } catch (e) {}
        }
        (function patchOnSnapshot() {
            const fs = firebase.firestore;
            [fs.Query, fs.DocumentReference].forEach(C => {
                if (!C || !C.prototype || C.prototype.__edoPatched) return;
                const orig = C.prototype.onSnapshot;
                C.prototype.onSnapshot = function (...args) {
                    if (FS_DETACHED) return () => {};   // đang đăng xuất: không mở thêm luồng nghe
                    let opts = null, i = 0;
                    if (args[0] && typeof args[0] === 'object' && typeof args[0].next !== 'function') { opts = args[0]; i = 1; }
                    let next, err;
                    if (args[i] && typeof args[i] === 'object') { next = args[i].next; err = args[i].error; }
                    else { next = args[i]; err = args[i + 1]; }
                    const onNext = s => { if (!FS_DETACHED && next) next(s); };
                    const onErr = e => {
                        // permission-denied lúc đã đăng xuất / đang đăng xuất là hệ quả bình thường -> bỏ qua êm
                        if (FS_DETACHED || !fbAuth.currentUser) return;
                        if (err) err(e); else console.warn('Firestore listener:', e && e.code, e && e.message);
                    };
                    const un = opts ? orig.call(this, opts, onNext, onErr) : orig.call(this, onNext, onErr);
                    let done = false;
                    const stop = () => { if (done) return; done = true; FS_LISTENERS.delete(stop); try { un(); } catch (e) {} };
                    FS_LISTENERS.add(stop);
                    return stop;
                };
                C.prototype.__edoPatched = true;
            });
        })();
        // Đăng xuất an toàn: gỡ hết listener -> signOut -> chuyển về index.html
        async function safeSignOut() {
            detachAllListeners();
            try { await fbAuth.signOut(); } catch (e) {}
            goTo(PAGE_LOGIN);
        }
        const $ = id => document.getElementById(id);
        let ME = null, MY_SID = '', PROFILES = {}, BXH_ADJ = {}, SUBS_ALL = [], POSTS = [], curChatId = null, pendingAvatar = null;
        // Chỉ chấp nhận avatar là ẢNH Base64 hợp lệ (data:image/jpeg|png|webp;base64,...) - chặn chuỗi lạ / URL ngoài / mã độc chèn vào thẻ <img> (XSS). Phải khớp firestore.rules
        const safeAvatar = a => (typeof a === 'string' && a.length < 60000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(a)) ? a : '';
        const avatarOf = (uid, name) => safeAvatar(PROFILES[uid] && PROFILES[uid].avatar) || initialsAv(name, '#4361ee', 2);
        const clean = o => JSON.parse(JSON.stringify(o === undefined ? null : o));
        // Phần 2: trường của chính học sinh đang đăng nhập + kiểm tra 1 hồ sơ có CÙNG TRƯỜNG hay không
        const mySchool = () => schoolOfProfile({ role: 'student', targetSchoolId: user.targetSchoolId, targetSchoolName: user.targetSchoolName });
        const inMySchool = p => !!p && sameSchoolOf(schoolOfProfile(p), mySchool());

        function saveProfile() {
            if (!ME || !user.name) return;
            fbDb.collection('privates').doc(ME.uid).set({ analysis: clean(user.analysisData) }, { merge: true }).catch(() => {});
            return fbDb.collection('profiles').doc(ME.uid).set({ name: user.name, cls: user.schoolClass, level: user.level || 'THPT', role: 'student', avatar: safeAvatar(user.avatar),
                targetSchoolId: user.targetSchoolId || null, targetSchoolName: user.targetSchoolName || null, uniId: user.uniId || null, uniName: user.uniName || null,
                schoolChangeCharges: typeof user.schoolChangeCharges === 'number' ? user.schoolChangeCharges : CHANGE_MAX, lastSchoolChangeTime: Number(user.lastSchoolChangeTime) || 0,
                majors: Array.isArray(user.pubMajors) ? user.pubMajors : [],
                coverHidden: typeof user.coverHidden === 'boolean' ? user.coverHidden : !!(PROFILES[ME.uid] && PROFILES[ME.uid].coverHidden === true) })
                .then(() => true)
                .catch(e => { eduAlert('Không lưu được hồ sơ: ' + e.message, 'error'); return false; });
        }
        function saveUser() { saveProfile(); }

        // ================= BXH tổng hợp + hồ sơ tải theo nhu cầu =================
        let BXH = {}, BXH_AT = 0, BXH_BUSY = null, reconSig = '';
        const BXH_REF = () => fbDb.collection('bxh').doc('summary');
        const bxhTotal = e => Math.max(0, (Number(e.xp) || 0) + (Number(e.adj) || 0));
        const liteProfile = id => { const e = BXH[id]; return e ? { name: e.n, cls: e.c, role: 'student', targetSchoolId: e.s, targetSchoolName: e.sn } : null; };

        // 1 lượt đọc / 5 phút (KHÔNG dùng onSnapshot cho doc này)
        function loadBxh(force) {
            if (BXH_BUSY) return BXH_BUSY;
            if (!force && BXH_AT && Date.now() - BXH_AT < 300000) return Promise.resolve();
            BXH_BUSY = BXH_REF().get().then(d => { BXH = (d.data() || {}).users || {}; BXH_AT = Date.now(); })
                .catch(e => console.warn('Không tải được BXH:', e))
                .then(() => { BXH_BUSY = null; reconcileSelf(); try { reconcileWeek(); } catch (e) {} try { renderStatCard(); } catch (e) {} if (ME && PROFILES[ME.uid]) refreshUI(); scheduleChatList(); });
            return BXH_BUSY;
        }
        // Tự ghi/chữa entry của CHÍNH MÌNH trong summary: XP tính lại tuyệt đối từ bài nộp của mình => không bao giờ bị cộng dồn
        function reconcileSelf() {
            const p = ME && PROFILES[ME.uid];
            if (!p || !p.cls || !RDY.sub || !BXH_AT) return;
            const cur = BXH[ME.uid] || {};
            // XP thật = bài nộp + XP ôn tập. firestore.rules chỉ cho XP BXH của CHÍNH MÌNH tăng tối đa XP_DAILY_CAP mỗi ngày (chống gian lận
            // sửa XP bằng DevTools); nếu XP thật tăng nhiều hơn (vd GV chấm dồn cả loạt bài) thì ghi từng phần, phần còn lại ghi tiếp ở lần sau.
            const target = SUBS_ALL.reduce((t, x) => t + subXp(x), 0) + reviewXpTotal();
            const oldXp = Number(cur.xp) || 0, today = vnDay(nowMs());
            const used = cur.xd === today ? (Number(cur.xg) || 0) : 0;
            const xp = target > oldXp ? oldXp + Math.min(target - oldXp, Math.max(0, XP_DAILY_CAP - used)) : target;
            const mine = { n: p.name || '', c: p.cls || '', s: p.targetSchoolId || '', sn: p.targetSchoolName || '', u: p.uniId || '', un: p.uniName || '',
                xp: xp, d: SUBS_ALL.length };
            if (xp > oldXp) { mine.xd = today; mine.xg = used + (xp - oldXp); }   // rules kiểm tra: xd = hôm nay, xg = tổng XP đã tăng trong ngày
            if (Object.keys(mine).every(k => cur[k] === mine[k])) return;
            const sig = JSON.stringify(mine); if (sig === reconSig) return; reconSig = sig;
            BXH[ME.uid] = { ...cur, ...mine };
            BXH_REF().set({ users: { [ME.uid]: mine } }, { merge: true }).catch(e => { reconSig = ''; console.warn('Chưa ghi được bxh/summary (hãy Publish rules mới):', e); });
        }

        // Tải hồ sơ theo nhu cầu (avatar, vai trò...) theo lô 30, mỗi uid chỉ xin 1 lần
        const PF_REQ = new Set(); let pfTimer = 0;
        function ensureProfiles(uids) {
            const need = [...new Set(uids)].filter(u => u && !PROFILES[u] && !PF_REQ.has(u));
            if (!need.length) return;
            need.forEach(u => PF_REQ.add(u));
            const A = firebase.firestore.FieldPath.documentId(), jobs = [];
            for (let i = 0; i < need.length; i += 30)
                { const batch = need.slice(i, i + 30); jobs.push(fbDb.collection('profiles').where(A, 'in', batch).get().then(s => s.forEach(d => { PROFILES[d.id] = d.data(); })).catch(() => { batch.forEach(u => PF_REQ.delete(u)); })); }   // lỗi mạng/tạm thời: bỏ đánh dấu để lần mở sau tự thử lại
            Promise.all(jobs).then(() => { clearTimeout(pfTimer); pfTimer = setTimeout(rerenderProfileViews, 150); });
        }
        function rerenderProfileViews() {
            if (!ME) return;
            if ($('modal-mxh').style.display === 'flex') { renderPosts(); if (listVisible()) renderChatList(); refreshRoom(); }
            capNhatBXH();
        }
        // Giáo viên cùng trường: 1 truy vấn khi biết trường (thay cho việc tải toàn bộ profiles)
        let TEACH_KEY = '';
        function loadSchoolTeachers(force) {
            const name = user.targetSchoolName; if (!name) { watchHW(); return; }   // chưa chọn trường: không có bài tập nào hiển thị
            if (!force && TEACH_KEY === user.targetSchoolId) return;
            TEACH_KEY = user.targetSchoolId;
            fbDb.collection('profiles').where('role', '==', 'teacher').where('school', '==', name).get()
                .then(s => { s.forEach(d => { PROFILES[d.id] = d.data(); }); watchHW(); renderHW(); scheduleChatList(); })
                .catch(e => { TEACH_KEY = ''; console.warn(e); watchHW(); });
        }

        // ===== Bài tập: CHỈ nghe bài của giáo viên CÙNG TRƯỜNG (trước đây: 50 bài mới nhất của mọi trường rồi lọc ở client) =====
        // - tiết kiệm lượt đọc: học sinh không còn tải bài (kèm toàn bộ câu hỏi) của trường khác
        // - đúng hơn: bài của trường mình không bị đẩy ra khỏi top 50 bởi bài mới của trường khác
        // Dùng chung index (teacherId + createdAt) mà trang giáo viên đã dùng. Tối đa 30 giáo viên / truy vấn (giới hạn của 'in').
        let HW_UNSUB = [], HW_KEY = '';
        function watchHW() {
            if (!ME || FS_DETACHED) return;
            const ids = Object.keys(PROFILES).filter(id => PROFILES[id] && PROFILES[id].role === 'teacher' && inMySchool(PROFILES[id])).sort();
            const key = ids.join(',');
            if (key === HW_KEY && RDY.hw) return;           // danh sách giáo viên không đổi: giữ nguyên luồng nghe
            HW_KEY = key;
            HW_UNSUB.forEach(f => { try { f(); } catch (e) {} }); HW_UNSUB = [];
            const done = () => { RDY.hw = true; syncLock(); renderHW(); checkExpired(); maybeResume(); };
            if (!ids.length) { HW_DATA = []; done(); return; }
            const ms = x => x.createdAt && typeof x.createdAt.toMillis === 'function' ? x.createdAt.toMillis() : 0;
            const parts = {}, nChunk = Math.ceil(ids.length / 30);
            for (let i = 0; i < ids.length; i += 30) {
                const k = i;
                HW_UNSUB.push(fbDb.collection('assignments').where('teacherId', 'in', ids.slice(i, i + 30)).orderBy('createdAt', 'desc').limit(50).onSnapshot(s => {
                    parts[k] = s.docs.map(d => ({ id: d.id, ...d.data() }));
                    if (Object.keys(parts).length < nChunk) return;   // chờ đủ các lô lần đầu rồi mới hiển thị
                    HW_DATA = [].concat(...Object.values(parts)).sort((a, b) => ms(b) - ms(a)).slice(0, 50);
                    done();
                }, e => { console.warn('assignments:', e && e.code, e && e.message); parts[k] = parts[k] || []; if (Object.keys(parts).length >= nChunk) { HW_DATA = [].concat(...Object.values(parts)); done(); } }));
            }
        }

        // ===== Ảnh bài tự luận: chỉ tải khi mở chi tiết =====
        const photoCountOf = r => typeof r.photoCount === 'number' ? r.photoCount : (r.photos || []).length;   // bài cũ vẫn có mảng photos
        const SUBPH_CACHE = {};
        async function loadSubPhotos(sub) {
            if (Array.isArray(sub.photos) && sub.photos.length) return sub.photos;
            if (!photoCountOf(sub)) return [];
            const id = sub.hwId + '_' + sub.uid;
            if (SUBPH_CACHE[id]) return SUBPH_CACHE[id];
            const d = await fbDb.collection('subPhotos').doc(id).get();
            return (SUBPH_CACHE[id] = d.exists ? (d.data().photos || []) : []);
        }

        function renderStudentId() {   // hiện "🆔 Mã HS: ..." dưới họ tên ở trang Hồ sơ (ẩn nếu chưa có mã)
            $('profile-sid').innerText = MY_SID; $('profile-sid-row').style.display = MY_SID ? '' : 'none';
        }
        function refreshUI() {
            renderStudentId();
            const av = avatarOf(ME.uid, user.name);
            $('user-avatar').src = av; $('profile-avatar-new').src = av;
            $('header-level-badge').innerHTML = `${esc(user.level)} - Lớp ${esc(user.schoolClass)} <span>▼</span>`;
            $('profile-name-new').innerText = user.name; $('profile-email').innerText = ME.email;
            $('profile-class-new').innerText = `${user.level} • Lớp ${user.schoolClass}`;
            $('profile-target-new').innerText = user.targetSchoolName || 'Chưa chọn trường';
            $('profile-uni').innerText = user.uniName || 'Chưa chọn nguyện vọng';
            if (typeof renderProfileDeep === 'function') renderProfileDeep();
            const pts = sumXp(); user.points = pts[ME.uid] || 0;
            user.isLocked = !user.targetSchoolName;
            $('lock-banner').style.display = user.isLocked ? '' : 'none';
            ['nav-baitap','nav-ai','nav-bxh'].forEach(id => $(id).classList.toggle('is-locked', user.isLocked)); ['side-baitap','side-ai','side-bxh'].forEach(id => { const e = $(id); if (e) e.classList.toggle('is-locked', user.isLocked); });   // tab Tài khoản luôn mở được
            capNhatBXH(); renderHW(); renderChargeInfo();
        }
        function onProfiles() {
            if (ACC_DELETING) return;
            const p = PROFILES[ME.uid];
            if (!p || !p.cls) { $('reg-name').value = (p && p.name) || (ME && ME.displayName) || ''; $('register-overlay').style.display = 'flex'; return; }
            $('register-overlay').style.display = 'none';
            const hasSchool = !!schoolNameOf(p);   // id không thuộc danh sách tỉnh/trường mới (ví dụ mã đại học cũ) => chưa chọn trường
            Object.assign(user, { pubMajors: Array.isArray(p.majors) ? p.majors : [], name: p.name, level: p.level || 'THPT', schoolClass: p.cls, targetSchoolId: hasSchool ? p.targetSchoolId : null, targetSchoolName: hasSchool ? p.targetSchoolName : null, avatar: p.avatar || '', uniId: p.uniId || null, uniName: p.uniName || null,
                schoolChangeCharges: typeof p.schoolChangeCharges === 'number' ? p.schoolChangeCharges : CHANGE_MAX, lastSchoolChangeTime: Number(p.lastSchoolChangeTime) || 0 });
            loadSchoolTeachers();   // giáo viên cùng trường (1 truy vấn, chỉ chạy lần đầu cho mỗi trường)
            reconcileSelf();
            refreshUI();
            // Nguyện vọng ĐH KHÔNG còn bắt buộc khi mở app. Tài khoản cũ chưa có trường THPT vẫn phải chọn trường (để mở khóa app)
            if (!user.targetSchoolName && $('modal-asp').style.display !== 'flex') openAsp('school');
            ensureClassGroup();   // Bước 9A: tự khởi tạo / tự tham gia nhóm chat lớp
            if (document.getElementById('modal-mxh').style.display === 'flex') renderChatList();
        }
function processRegister() {
            const n = $('reg-name').value.trim(), l = $('reg-level').value;
            if (!n || !l) return eduAlert('Vui lòng điền đầy đủ thông tin!', 'warning');
            const r = readSchool('reg', true);
            if (!r.ok) return eduAlert(r.msg, 'warning');
            const c = readClass('reg');
            if (!c) return eduAlert(classHelpMsg('reg'), 'warning');
            Object.assign(user, { name: n, level: l, schoolClass: c, targetSchoolId: r.school.id, targetSchoolName: r.school.name });
            $('register-overlay').style.display = 'none'; saveProfile();
        }
        function confirmSchoolSelection() {
            if (!tempSelectedSchool) return;
            const sc = tempSelectedSchool, wasLocked = user.isLocked, hadSchool = !!user.targetSchoolName;
            const changing = hadSchool && sc.id !== user.targetSchoolId;   // đổi trường đã chọn sang trường khác => tốn 1 lượt
            if (hadSchool && !changing) { closeModal('school-select-modal'); return eduAlert('Đây đã là trường hiện tại của bạn.', 'info'); }
            if (changing) { const st = applyChargeRegen(); if (st.charges <= 0) { renderChargeInfo(); return noChargePopup(st); } }
            const prev = { id: user.targetSchoolId, name: user.targetSchoolName, cc: user.schoolChangeCharges, ct: user.lastSchoolChangeTime };
            if (changing) spendCharge();
            user.targetSchoolId = sc.id; user.targetSchoolName = sc.name;
            closeModal('school-select-modal');
            Promise.resolve(saveProfile()).then((ok) => {
                if (ok === false) { Object.assign(user, { targetSchoolId: prev.id, targetSchoolName: prev.name, schoolChangeCharges: prev.cc, lastSchoolChangeTime: prev.ct }); renderChargeInfo(); return; }
                renderChargeInfo();
                const done = eduAlert(sc.name, { icon: 'success', title: wasLocked ? 'Mở khóa thành công!' : 'Đã cập nhật trường' });
                // Đổi sang loại trường khác (Chuyên <-> Thường) thì lớp cũ không còn hợp lệ: mở form chỉnh sửa để chọn lại
                if (!classFitsSchool(user.schoolClass, sc.name)) done.then(() => eduAlert('Lớp hiện tại "' + (user.schoolClass || '') + '" chưa phù hợp với loại trường vừa chọn. Hãy cập nhật lại lớp của bạn.', 'warning')).then(() => openEdit());
            });
        }
        function logout() {
            eduConfirm('Bạn có chắc muốn đăng xuất khỏi EduOrient?', { title: 'Đăng xuất?', confirmText: 'Đăng xuất', cancelText: 'Ở lại', icon: 'question' })
                .then(yes => { if (yes) safeSignOut(); });   // gỡ MỌI listener Firestore -> signOut -> về index.html
        }

        // ---- Bảng xếp hạng thật (tính từ bài đã nộp) ----
        function bxhPodium(id, rows) {   // bục top 3 (chỉ hiện trên desktop)
            const el = $(id); if (!el) return;
            if (!rows || !rows.length) { el.innerHTML = ''; return; }
            const col = (r, n) => r ? '<div class="pd-col r' + n + '" style="cursor:pointer" onclick="openUserCard(\'' + esc(r.id) + '\')">' + (n === 1 ? '<div class="pd-crown"><svg class=ic aria-hidden=true><use href=#i-crown></use></svg></div>' : '') + '<img src="' + esc(avatarOf(r.id, r.p.name)) + '"><div class="pd-name">' + esc(r.p.name) + '</div><div class="pd-xp">' + r.pts + ' XP</div><div class="pd-block">' + n + '</div></div>' : '<div class="pd-col"></div>';
            el.innerHTML = '<div class="bxh-podium-title"><svg class=ic aria-hidden=true><use href=#i-medal></use></svg> Top 3 xuất sắc</div><div class="pd-row">' + col(rows[1], 2) + col(rows[0], 1) + col(rows[2], 3) + '</div>';
        }
        function bxhMe(id, rows) {   // thẻ "Hạng của bạn" (chỉ hiện trên desktop)
            const el = $(id); if (!el || !ME) return;
            const i = rows ? rows.findIndex(r => r.id === ME.uid) : -1;
            el.innerHTML = '<div class="bxh-me-label">Hạng của bạn</div><div class="bxh-me-rank">' + (i >= 0 ? '#' + (i + 1) : '—') + '</div><div class="bxh-me-sub">' + (i >= 0 ? rows[i].pts + ' XP • trên ' + rows.length + ' học sinh' : 'Chưa có thứ hạng • làm bài tập để có XP') + '</div>';
        }
        // Danh sách xếp hạng từ summary; dòng của chính mình luôn dùng số liệu "sống" của máy
        function bxhRows(match, all) {   // all=true: gồm cả người 0 XP (chỉ dùng để đếm); mặc định BXH ẩn người 0 XP
            const mine = { n: user.name, c: user.schoolClass, s: user.targetSchoolId || '', sn: user.targetSchoolName || '', u: user.uniId || '', un: user.uniName || '' };
            const rows = [];
            Object.keys(BXH).forEach(id => { const e = BXH[id]; if (id !== ME.uid && e && match(e)) rows.push({ id, e, pts: BXH_WEEK ? (e.wk === weekStartDay() ? Math.max(0, Number(e.wx) || 0) : 0) : bxhTotal(e) }); });
            if (match(mine)) rows.push({ id: ME.uid, e: mine, pts: BXH_WEEK ? myWeekXp() : sumXp()[ME.uid] });
            return rows.filter(r => all || r.pts > 0).map(r => ({ id: r.id, pts: r.pts, p: { name: r.e.n, cls: r.e.c, role: 'student', targetSchoolId: r.e.s, targetSchoolName: r.e.sn } })).sort((a, b) => b.pts - a.pts);
        }
        // Tải avatar theo nhu cầu cho các dòng BXH đang hiện ra khi cuộn (trước đây chỉ top 10 có avatar, từ #11 trở đi luôn là chữ cái đầu)
        let BXH_IO = null, BXH_IO_T = 0, BXH_IO_Q = new Set();
        function bxhLazyAvatars(listId) {
            const el = $(listId); if (!el || !('IntersectionObserver' in window)) return;
            if (BXH_IO) BXH_IO.disconnect();
            BXH_IO = new IntersectionObserver(es => {
                es.forEach(e => { if (e.isIntersecting) { const u = e.target.getAttribute('data-uid'); if (u && !PROFILES[u]) BXH_IO_Q.add(u); BXH_IO.unobserve(e.target); } });
                clearTimeout(BXH_IO_T); BXH_IO_T = setTimeout(() => { const q = [...BXH_IO_Q]; BXH_IO_Q.clear(); if (q.length) ensureProfiles(q); }, 250);
            }, { root: el, rootMargin: '200px' });
            el.querySelectorAll('[data-uid]').forEach(r => BXH_IO.observe(r));
        }
        function bxhListHtml(rows) {
            ensureProfiles(rows.slice(0, 10).map(r => r.id));          // chỉ tải avatar cho top 10
            try { coverWarm(rows.slice(0, 10).map(r => r.id)); } catch (e) {}   // tải trước ảnh bìa top 10 để bấm vào là hiện ngay
            const mi = rows.findIndex(r => r.id === ME.uid);
            const row = (r, i) => `<div data-uid="${esc(r.id)}" style="display:flex;justify-content:space-between;align-items:center;padding:10px 6px;border-bottom:1px solid #f1f5f9;${r.id === ME.uid ? 'background:#eff6ff;border-radius:8px;' : ''}">
                <div style="display:flex;align-items:center;gap:8px;"><b style="color:var(--primary)">#${i + 1}</b><div style="display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="openUserCard('${esc(r.id)}')" title="Xem trang cá nhân"><img loading="lazy" decoding="async" width="28" height="28" src="${esc(avatarOf(r.id, r.p.name))}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;"><div>${esc(r.p.name)}<br><small style="color:var(--text-sub)">${esc(schoolNameOf(r.p) || 'Chưa chọn trường')}</small></div></div></div>
                <b style="color:var(--primary)">${r.pts} XP</b></div>`;
            return rows.slice(0, 100).map(row).join('') + (mi >= 100 ? '<div style="text-align:center;color:#94a3b8">⋯</div>' + row(rows[mi], mi) : '');
        }
        function capNhatBXH() {
            try { paintBxhMode(); } catch (e) {}
            $('bxh-school-name').innerText = user.targetSchoolName || 'Chưa chọn trường';
            renderUniBXH();
            const rows = bxhRows(e => !!user.targetSchoolId && e.s === user.targetSchoolId);   // cùng trường = cùng schoolId
            bxhMe('bxh-me-thpt', rows); bxhPodium('bxh-podium-thpt', rows);
            $('bxh-list').innerHTML = bxhListHtml(rows) || '<p style="font-size:13px;color:var(--text-sub)">' + (user.targetSchoolName ? (BXH_WEEK ? 'Tuần này chưa ai có XP. Hãy làm bài tập để lên bảng xếp hạng!' : 'Chưa ai có XP. Hãy làm bài tập để lên bảng xếp hạng!') : 'Hãy chọn trường để xem bảng xếp hạng.') + '</p>'; bxhLazyAvatars('bxh-list');
        }

        // ---- Bài tập của giáo viên: đồng bộ, có giờ làm bài, lớp và hạn nộp ----
        let ATT = {}, ATTANS = {}, hwEnd = 0, hwTimer = null, hwLive = null, hwObj = null, SKEW = 0; const busy = {};
        const durOf = h => h.durationMin || parseInt(h.duration) || 0;
        const hwInMySchool = h => inMySchool(PROFILES[h.teacherId]);   // Phần 2: bài tập phải do giáo viên CÙNG TRƯỜNG đăng (chưa rõ trường giáo viên => ẩn)
        const visibleHW = h => h.questions && h.questions.length && hwInMySchool(h) && (!(h.classes && h.classes.length) || h.classes.map(c => String(c).trim().toUpperCase()).includes(String(user.schoolClass || '').trim().toUpperCase()));
        const endOf = (h, st) => Math.min(durOf(h) ? st + durOf(h) * 60000 : Infinity, h.deadlineMs || Infinity);
        const nowMs = () => Date.now() + SKEW;
        // ===== KHÓA MÀN HÌNH THI + KHÔI PHỤC KHI RELOAD =====
        window.EXAM_LOCKED = false;
        const RDY = { hw: false, att: false, sub: false }, rdyAll = () => RDY.hw && RDY.att && RDY.sub;
        const examKey = () => 'eduorient_exam_' + (ME ? ME.uid : '');
        const examEnd = h => endOf(h, ATT[h.id]) + (isEssayHW(h) ? GRACE_MS : 0);          // hết giờ chính thức (+3 phút gia hạn với đề tự luận)
        const isExpired = h => !!ATT[h.id] && SUBS_DATA[h.id] === undefined && durOf(h) > 0 && nowMs() >= examEnd(h);
        const activeExam = () => HW_DATA.find(h => durOf(h) > 0 && ATT[h.id] && SUBS_DATA[h.id] === undefined && nowMs() < examEnd(h));
        function applyLock(on) { window.EXAM_LOCKED = on; document.body.classList.toggle('exam-locked', on); const fb = $('fab-chat'); if (fb && on) fb.classList.add('fab-hidden'); else if (typeof updateFab === 'function') updateFab(); }
        function bootLockFromLS() {   // áp khóa NGAY khi tải trang (trước khi Firestore trả dữ liệu) để không bị lộ thanh điều hướng
            try { const x = JSON.parse(localStorage.getItem(examKey()) || 'null'); if (x && Date.now() < x.startTime + x.durationMin * 60000 + (x.essay ? GRACE_MS : 0) + 60000) applyLock(true); } catch (e) {}
        }
        function syncLock() {   // nguồn sự thật: Firestore (attempts.startedAt) so với giờ máy chủ
            if (!rdyAll()) return; const h = activeExam();
            try { h ? localStorage.setItem(examKey(), JSON.stringify({ hwId: h.id, startTime: ATT[h.id], durationMin: durOf(h), essay: isEssayHW(h) })) : localStorage.removeItem(examKey()); } catch (e) {}
            applyLock(!!h);
        }
        let resuming = false;
        async function maybeResume() {   // vào lại app: còn giờ -> ép quay về màn hình làm bài
            if (!rdyAll() || !PROFILES[ME.uid] || resuming) return; syncLock(); const h = activeExam();
            if (!h || $('modal-hw').style.display === 'flex') return;
            resuming = true; try { await openHW(h.id); } finally { resuming = false; }
        }
        window.addEventListener('beforeunload', e => { if (window.EXAM_LOCKED) { e.preventDefault(); e.returnValue = ''; } });
        // Chữ ký các trạng thái PHỤ THUỘC THỜI GIAN của danh sách bài tập (hết hạn / hết giờ / đang gia hạn).
        // Chỉ khi chữ ký này đổi thì mới cần dựng lại danh sách; còn lại không đụng tới DOM.
        var HW_SIG = '';
        function hwTimeSig() {
            if (!ME) return '';
            const t = nowMs();
            return HW_DATA.filter(visibleHW).map(h => { const r = SUBS_DATA[h.id], st = ATT[h.id];
                const late = !!(h.deadlineMs && t > h.deadlineMs && !st);
                const inGr = !!(isEssayHW(h) && st && r === undefined && endOf(h, st) <= t && t < endOf(h, st) + GRACE_MS);
                const exp = isExpired(h) && !inGr;
                return h.id + ':' + (late ? 1 : 0) + (inGr ? 1 : 0) + (exp ? 1 : 0); }).join('|');
        }
        function renderHW() {
            const el = $('hw-list'); if (!el) return;
            HW_SIG = hwTimeSig();
            const list = HW_DATA.filter(visibleHW);
            el.innerHTML = list.length ? list.map(h => { const r = SUBS_DATA[h.id], st = ATT[h.id], late = h.deadlineMs && nowMs() > h.deadlineMs && !st;
                const inGr = isEssayHW(h) && st && r === undefined && endOf(h, st) <= nowMs() && nowMs() < endOf(h, st) + GRACE_MS;
                const subx = SUBS_ALL.find(x => x.uid === ME.uid && x.hwId === h.id) || {}, exp = isExpired(h) && !inGr;
                const lbl = r !== undefined ? (subx.status === 'timeout' ? '<svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Hết giờ / Xem lại' : 'Xem lại') : exp ? '<svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Hết giờ / Xem lại' : inGr ? '<svg class=ic aria-hidden=true><use href=#i-alert></use></svg> Nộp ảnh ngay' : late ? 'Hết hạn' : st ? 'Làm tiếp' : 'Bắt đầu làm bài';
                return `<div style="padding:12px;border:1px solid var(--border);border-radius:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div><b>${esc(h.title)}</b><br><small style="color:var(--text-sub)">${esc(h.subject || '')} • ${h.questions.length} câu${tagOf(h)}${durOf(h) ? ' • ' + durOf(h) + ' phút' : ''} • ${esc(h.teacherName || '')}</small>
                ${h.deadlineMs ? `<br><small style="color:${late ? '#ef4444' : 'var(--text-sub)'}"><svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Hạn nộp: ${new Date(h.deadlineMs).toLocaleString('vi-VN')}</small>` : ''}
                ${r !== undefined ? doneText(h, r) : exp ? '<br><small style="color:#ef4444"><svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Hết giờ - chưa nộp bài</small>' : st ? '<br><small style="color:#f59e0b">Đang làm dở</small>' : ''}</div>
                <button class="btn-primary" ${late && r === undefined && !exp ? 'disabled style="opacity:.5;width:auto;padding:6px 14px;font-size:12px;"' : 'style="width:auto;padding:6px 14px;font-size:12px;"'} onclick="openHW('${h.id}')">${lbl}</button></div>`; }).join('')
                : "<p style='font-size:13px;color:var(--text-sub);'>Chưa có bài tập nào từ giáo viên.</p>";
        }
        // ===== QUY TẮC XP MỚI =====
        // Trắc nghiệm: mỗi câu ĐÚNG = 5 XP => quizXp = totalCorrect * 5 (score trắc nghiệm = số câu đúng x 10).
        // Tự luận (GV chấm 0-100): essayXp = điểm GV chấm (1 điểm = 1 XP). totalXp = quizXp + essayXp.
        // Tổng XP / BXH luôn tính lại từ các bài nộp (submissions) nên không bao giờ bị cộng dồn trùng khi GV chấm lại.
        const clamp100 = n => Math.min(100, Math.max(0, Number(n) || 0));
        const PT_PER_Q = 10, XP_PER_CORRECT = 5;
        const correctOf = ms => Math.round(Math.max(0, Number(ms) || 0) / PT_PER_Q);
        const quizXpOf = ms => correctOf(ms) * XP_PER_CORRECT;
        const essayXpOf = sc => Math.round(clamp100(sc));
        const subXp = x => (x.adminEdited && x.graded) ? essayXpOf(x.score) : x.status === 'timeout' ? 0 : x.graded ? (typeof x.essayXp === 'number' ? Math.max(0, Math.round(Number(x.quizXp) || 0)) + essayXpOf(x.essayXp) : essayXpOf(x.score)) : quizXpOf(x.score);
        // Tổng XP của CHÍNH MÌNH = XP bài nộp của mình + adjustXp của mình (bxhScores/{uid}). Xếp hạng người khác lấy từ bxh/summary.
        // (cũ: Tổng điểm BXH = computedXP + adjustXp, tính trên toàn bộ học sinh)
        // Bài nộp mới làm computedXP tăng nên tổng tự động cộng dồn trên mốc điểm đã đặt. Không để tổng âm.
        const sumXp = () => ({ [ME.uid]: Math.max(0, SUBS_ALL.reduce((t, x) => t + subXp(x), 0) + reviewXpTotal() + (BXH_ADJ[ME.uid] || 0)) });
        // THANG ĐIỂM TRẮC NGHIỆM: mỗi câu đúng = 10 điểm (score = số_câu_đúng * 10) và = 5 XP.
        const putSub = (h, score, a, auto) => fbDb.collection('submissions').doc(h.id + '_' + ME.uid).set({ uid: ME.uid, hwId: h.id, name: user.name, cls: user.schoolClass, score, total: h.questions.length * PT_PER_Q, answers: a, auto: auto, createdAt: NOW(), quizXp: quizXpOf(score), essayXp: 0, totalXp: quizXpOf(score) });
        // ===== Bài tập TỰ LUẬN: ảnh bài làm + 3 phút gia hạn =====
        const GRACE_MS = 180000, PH_MAX = 6, PH_CHARS = 600000;   // tối đa 6 ảnh, tổng ~600KB để vừa giới hạn 1MB/document
        let PHOTOS = [], PHOTOS_FOR = '', graceT = null, graceEnd = 0, graceH = null;
        const isEssayHW = h => !!h && (h.type === 'essay' || h.type === 'mixed');
        const mcqN = h => h.questions.filter(q => q.kind !== 'essay').length;
        const scoreOf = (h, a) => h.questions.filter((q, i) => q.kind !== 'essay' && a[i] === q.c).length * PT_PER_Q;
        const tagOf = h => h.type === 'essay' ? ' • <svg class=ic aria-hidden=true><use href=#i-draw></use></svg> Tự luận' : h.type === 'mixed' ? ' • <svg class=ic aria-hidden=true><use href=#i-draw></use></svg> TN + Tự luận' : '';
        const photoGrid = list => '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">' + list.map(p => `<img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);">`).join('') + '</div>';
        function doneText(h, r) {
            const sub = SUBS_ALL.find(x => x.uid === ME.uid && x.hwId === h.id) || {};
            if (sub.graded && (sub.status !== 'timeout' || sub.adminEdited)) return `<br><small style="color:var(--green)"><svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg> Đã chấm: ${Math.round(clamp100(sub.score))}/100 (+${subXp(sub)} XP)</small>${sub.feedback ? `<br><small style="color:var(--text-sub)"><svg class=ic aria-hidden=true><use href=#i-chat></use></svg> Nhận xét GV: ${esc(sub.feedback)}</small>` : ''}`;
            if (!isEssayHW(h)) return `<br><small style="color:var(--green)">Đã làm: ${r}/${h.questions.length * PT_PER_Q}</small>`;
            const mc = h.type === 'mixed' ? `Trắc nghiệm: ${r}/${mcqN(h)} • ` : '';
            return sub.status === 'timeout' ? `<br><small style="color:#ef4444">${mc}<svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Hết giờ - không có ảnh bài làm</small>` : `<br><small style="color:var(--green)">${mc}<svg class=ic aria-hidden=true><use href=#i-camera></use></svg> Đã nộp ${photoCountOf(sub)} ảnh - chờ giáo viên chấm</small>`;
        }
        const phHtml = () => `<div style="display:flex;gap:8px;margin-bottom:6px;">
            <button type="button" class="btn-primary" style="padding:10px;font-size:13px;" onclick="document.getElementById('ph-cam').click()"><svg class=ic aria-hidden=true><use href=#i-camera></use></svg> Chụp ảnh</button>
            <button type="button" class="btn-primary" style="padding:10px;font-size:13px;background:#475569;" onclick="document.getElementById('ph-lib').click()"><svg class=ic aria-hidden=true><use href=#i-image></use></svg> Chọn từ thư viện</button></div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">${PHOTOS.map((p, i) => `<div style="position:relative;"><img src="${p}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border);"><button type="button" onclick="delPhoto(${i})" style="position:absolute;top:3px;right:3px;width:22px;height:22px;border:none;border-radius:50%;background:rgba(15,23,42,.75);color:#fff;font-size:12px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-close></use></svg></button></div>`).join('')}</div>
            <p style="font-size:11px;color:var(--text-sub);margin-top:6px;">${PHOTOS.length}/${PH_MAX} ảnh. Chụp rõ nét, đủ sáng, đúng thứ tự các trang.</p>`;
        function refreshPhotos() { document.querySelectorAll('.ph-box').forEach(el => el.innerHTML = phHtml()); }
        function delPhoto(i) { PHOTOS.splice(i, 1); refreshPhotos(); }
        const compressImg = f => new Promise((res, rej) => { const fr = new FileReader();
            fr.onload = () => { const im = new Image();
                im.onload = () => { const k = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
                    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.55)); };
                im.onerror = () => rej(new Error('Không đọc được ảnh này.')); im.src = fr.result; };
            fr.onerror = () => rej(new Error('Không đọc được file.')); fr.readAsDataURL(f); });
        async function addPhotos(inp) {
            const files = [...inp.files]; inp.value = '';
            for (const f of files) {
                if (graceH && nowMs() >= graceEnd) return;
                if (PHOTOS.length >= PH_MAX) { eduAlert('Tối đa ' + PH_MAX + ' ảnh cho mỗi bài.', 'warning'); break; }
                try { const d = await compressImg(f);
                    if (PHOTOS.reduce((t, x) => t + x.length, 0) + d.length > PH_CHARS) { eduAlert('Dung lượng ảnh quá lớn. Hãy xóa bớt ảnh hoặc chụp lại ở độ phân giải thấp hơn.', 'warning'); break; }
                    PHOTOS.push(d); refreshPhotos(); } catch (e) { eduAlert(e.message, 'error'); } }
        }
        const putEssaySub = (h, score, a, status, photos) => {
            const id = h.id + '_' + ME.uid, b = fbDb.batch(), q = status === 'timeout' ? 0 : quizXpOf(score);
            b.set(fbDb.collection('submissions').doc(id), { uid: ME.uid, hwId: h.id, assignmentId: h.id, studentId: ME.uid,
                name: user.name, cls: user.schoolClass, score, total: mcqN(h) * PT_PER_Q, answers: a, auto: status === 'timeout',
                photoCount: photos.length, status, submittedAt: NOW(), createdAt: NOW(), quizXp: q, essayXp: 0, totalXp: q });   // tự luận: essayXp cộng sau khi GV chấm
            if (photos.length) b.set(fbDb.collection('subPhotos').doc(id), { uid: ME.uid, hwId: h.id, photos, createdAt: NOW() });
            return b.commit();
        };
        function closeGrace() { clearInterval(graceT); graceH = null; $('modal-grace').style.display = 'none'; const b = $('hw-body'); b.style.pointerEvents = ''; b.style.opacity = ''; }
        function runGraceTimer() {
            clearInterval(graceT); const el = $('grace-timer');
            const tick = () => { const rem = Math.max(0, Math.ceil((graceEnd - nowMs()) / 1000));
                el.innerText = Math.floor(rem / 60) + ':' + String(rem % 60).padStart(2, '0'); el.style.color = rem <= 30 ? '#dc2626' : 'var(--red-strong)';
                if (rem <= 0) { clearInterval(graceT); $('grace-submit').disabled = true; recordTimeout(graceH); } };
            tick(); graceT = setInterval(tick, 1000);
        }
        // Hết giờ chính thức: khóa đề, hiện cảnh báo, đếm ngược phụ 180 giây
        function enterGrace(h, endMs) {
            if (SUBS_DATA[h.id] !== undefined || busy[h.id]) return;
            clearInterval(hwTimer); clearTimeout(saveT);
            hwLive = h.id; hwObj = h; curHW = h; graceH = h; graceEnd = (endMs || hwEnd) + GRACE_MS;
            if (PHOTOS_FOR !== h.id) { PHOTOS = []; PHOTOS_FOR = h.id; }
            const full = h.questions.map((q, i) => ans[i] === undefined ? -1 : ans[i]);
            fbDb.collection('attempts').doc(h.id + '_' + ME.uid).update({ answers: full }).then(() => { ATTANS[h.id] = full; }).catch(() => {});
            $('hw-submit').style.display = 'none'; const b = $('hw-body'); b.style.pointerEvents = 'none'; b.style.opacity = '.55';
            $('grace-submit').disabled = false; $('modal-grace').style.display = 'flex'; refreshPhotos(); runGraceTimer();
        }
        // Quá 3 phút gia hạn mà chưa nộp: ghi nhận status 'timeout', photos []
        async function recordTimeout(h, open) {
            if (!h || SUBS_DATA[h.id] !== undefined || busy[h.id]) return; busy[h.id] = 1; clearInterval(graceT); clearInterval(hwTimer);
            const a = ATTANS[h.id] || [], score = scoreOf(h, a);
            try { await putEssaySub(h, score, a, 'timeout', []); SUBS_DATA[h.id] = score; hwLive = null; hwObj = null; PHOTOS = []; PHOTOS_FOR = ''; closeGrace(); syncLock();
                eduAlert('Đã quá 3 phút gia hạn. Bài của bạn được ghi nhận là hết giờ, không có ảnh bài làm.', { icon: 'warning', title: 'Hết thời gian nộp ảnh' });
                if ($('modal-hw').style.display === 'flex') openHW(h.id); }
            catch (e) { busy[h.id] = 0; if (open) eduAlert((e && e.message) || e, 'error'); }
        }
        async function nopBaiTuLuan() {
            const h = hwObj || curHW; if (!isEssayHW(h) || SUBS_DATA[h.id] !== undefined || busy[h.id]) return;
            const inGrace = graceH && graceH.id === h.id;
            if (inGrace && nowMs() >= graceEnd) return;   // hết 3 phút: bản ghi 'timeout' sẽ được tạo tự động
            if (!PHOTOS.length) return eduAlert('Hãy chụp hoặc chọn ít nhất 1 ảnh bài làm trước khi nộp.', 'warning');
            if (!inGrace && h.questions.some((q, i) => q.kind !== 'essay' && ans[i] === undefined)) {
                const yes = await eduConfirm('Vẫn nộp bài?', { title: 'Bạn chưa trả lời hết câu trắc nghiệm', confirmText: 'Nộp bài', cancelText: 'Làm tiếp', icon: 'warning' });
                if (!yes || SUBS_DATA[h.id] !== undefined || busy[h.id]) return; }
            if (inGrace && nowMs() >= graceEnd) return;
            busy[h.id] = 1; clearInterval(hwTimer); clearInterval(graceT); clearTimeout(saveT);
            const full = h.questions.map((q, i) => ans[i] === undefined ? -1 : ans[i]), sv = ATTANS[h.id];
            const a = inGrace && sv && sv.length === h.questions.length ? sv : full;
            try { let used = a, score = scoreOf(h, a);
                try { await putEssaySub(h, score, a, 'submitted', PHOTOS.slice()); }
                catch (e) { if (e.code === 'permission-denied' && sv) { used = sv; score = scoreOf(h, sv); await putEssaySub(h, score, sv, 'submitted', PHOTOS.slice()); } else throw e; }
                SUBS_DATA[h.id] = score; hwLive = null; hwObj = null; PHOTOS = []; PHOTOS_FOR = ''; closeGrace(); syncLock();
                await eduAlert('Bài làm của bạn đã được gửi tới giáo viên.' + (quizXpOf(score) ? '\nĐã cộng +' + quizXpOf(score) + ' XP trắc nghiệm (' + correctOf(score) + ' câu đúng x ' + XP_PER_CORRECT + ' XP). XP tự luận sẽ được cộng khi giáo viên chấm.' : '\nXP tự luận sẽ được cộng khi giáo viên chấm điểm.'), { icon: 'success', title: 'Nộp bài thành công!' });
                if ($('modal-hw').style.display === 'flex') openHW(h.id);
            } catch (e) { busy[h.id] = 0;
                if (inGrace) runGraceTimer(); else { const st = ATT[h.id], endAt = st ? endOf(h, st) : 0; if (endAt > nowMs()) startTimer(h, endAt); }
                eduAlert(((e && e.message) || e) + '\nHãy kiểm tra mạng rồi bấm "Nộp bài" lại.', { icon: 'error', title: 'Không nộp được bài' }); }
        }
        let saveT = null;
        function saveAns() {
            if (!curHW || !ATT[curHW.id]) return; const id = curHW.id, a = curHW.questions.map((q, i) => ans[i] === undefined ? -1 : ans[i]);
            clearTimeout(saveT); saveT = setTimeout(() => { fbDb.collection('attempts').doc(id + '_' + ME.uid).update({ answers: a }).then(() => { ATTANS[id] = a; }).catch(() => {}); }, 300);
        }
        function chonDA(el, i, j) {
            if ($('hw-submit').style.display === 'none') return; ans[i] = j;
            document.querySelectorAll(`[data-q="${i}"]`).forEach(e => e.style.background = ''); el.style.background = 'var(--sel-bg)'; saveAns(); hwNavUpdate();
        }
        // ===== Điều hướng câu hỏi: cột số câu (máy tính) / chuyển từng câu (điện thoại) =====
        let HWNAV = null, HWCUR = 0;
        const hwMobile = () => window.matchMedia('(max-width: 767px)').matches;
        function hwQState(i) {
            const q = HWNAV.h.questions[i];
            if (q.kind === 'essay') return 'essay';
            if (HWNAV.done) { const a = HWNAV.my[i]; return (a === undefined || a < 0) ? 'none' : (a === q.c ? 'ok' : 'bad'); }
            return ans[i] === undefined ? 'none' : 'done';
        }
        function hwNavUpdate() {
            if (!HWNAV) return;
            const qs = HWNAV.h.questions; let n = 0, tot = 0;
            $('hwn-grid').innerHTML = qs.map((q, i) => {
                const st = hwQState(i);
                if (st !== 'essay') { tot++; if (st !== 'none') n++; }
                return `<button type="button" class="hwn-btn ${st}${i === HWCUR ? ' cur' : ''}" onclick="hwGo(${i})" aria-label="Câu ${i + 1}">${i + 1}</button>`;
            }).join('');
            $('hwn-count').innerText = (HWNAV.done ? 'Đã trả lời ' : 'Đã làm ') + n + '/' + tot + ' câu trắc nghiệm';
            $('hwm-list').innerHTML = ico('menu') + ' Câu ' + (HWCUR + 1) + '/' + qs.length;
            $('hwm-prev').disabled = HWCUR <= 0; $('hwm-next').disabled = HWCUR >= qs.length - 1;
        }
        function hwShowPage() {   // điện thoại: chỉ hiện đúng 1 câu (CSS ẩn các câu còn lại)
            const qs = HWNAV.h.questions;
            qs.forEach((q, i) => { const el = $('hwq-' + i); if (el) el.classList.toggle('hw-cur', i === HWCUR); });
            $('hw-body').classList.toggle('on-last', HWCUR === qs.length - 1);
            $('hw-body').scrollTop = 0;
        }
        function hwGo(i) {
            if (!HWNAV) return;
            HWCUR = Math.max(0, Math.min(HWNAV.h.questions.length - 1, i));
            if (hwMobile()) { hwShowPage(); hwNavToggle(false); }
            else {   // máy tính: cuộn mượt tới câu đó (chừa chỗ cho đồng hồ dính ở trên)
                const el = $('hwq-' + HWCUR), b = $('hw-body'), tm = $('hw-timer');
                if (el) b.scrollTo({ top: b.scrollTop + el.getBoundingClientRect().top - b.getBoundingClientRect().top - (tm ? tm.offsetHeight + 8 : 0), behavior: 'smooth' });
            }
            hwNavUpdate();
        }
        function hwStep(d) { hwGo(HWCUR + d); }
        function hwNavToggle(open) { const nav = $('hw-nav'); nav.classList.toggle('open', open === undefined ? !nav.classList.contains('open') : open); }
        function hwSetupNav(h, done, my) {
            HWNAV = { h, done, my: my || [] }; HWCUR = 0;
            hwNavToggle(false); hwShowPage(); hwNavUpdate(); $('hw-body').scrollTop = 0;
        }
        (function initHwNav() {
            const body = $('hw-body');
            body.addEventListener('scroll', () => {   // máy tính: tô viền số câu đang xem khi cuộn
                if (!HWNAV || hwMobile()) return;
                const top = body.getBoundingClientRect().top + 60; let cur = 0;
                HWNAV.h.questions.forEach((q, i) => { const el = $('hwq-' + i); if (el && el.getBoundingClientRect().top <= top) cur = i; });
                if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) cur = HWNAV.h.questions.length - 1;
                if (cur !== HWCUR) { HWCUR = cur; hwNavUpdate(); }
            });
            window.matchMedia('(max-width: 767px)').addEventListener('change', () => { if (HWNAV) { hwShowPage(); hwNavToggle(false); hwNavUpdate(); } });
        })();
        function syncClock() {
            if (!ME) return; const ref = fbDb.collection('clock').doc(ME.uid);
            ref.set({ t: NOW() }).then(() => ref.get({ source: 'server' })).then(d => { SKEW = d.data().t.toMillis() - Date.now(); }).catch(() => {});
        }
        async function openHW(id) {
            const h = HW_DATA.find(x => x.id === id); if (!h || (!hwInMySchool(h) && !ATT[id])) return;   // Phần 2: không mở được bài của trường khác
            const done = SUBS_DATA[id] !== undefined; let endAt = Infinity, grace = false;
            if (!done) {
                if (hwLive && hwLive !== id) return eduAlert('Bạn đang làm dở một bài khác. Hãy nộp bài đó trước.', 'warning');
                const needAtt = durOf(h) > 0 || !!h.deadlineMs;
                if (h.deadlineMs && nowMs() > h.deadlineMs && !ATT[id]) return eduAlert('Bài tập này đã hết hạn nộp.', 'warning');
                if (needAtt && !ATT[id]) {
                    if (durOf(h) > 0 && !(await eduConfirm(`Bài này giới hạn ${durOf(h)} phút. Đồng hồ chạy ngay khi bạn bấm "Bắt đầu" và không thể dừng lại. Màn hình sẽ bị KHÓA: bạn không thể chuyển sang tính năng khác cho đến khi nộp bài hoặc hết giờ.`, { title: 'Bắt đầu làm bài?', confirmText: 'Bắt đầu', cancelText: 'Để sau', icon: 'warning' }))) return;
                    try { const ref = fbDb.collection('attempts').doc(id + '_' + ME.uid); await ref.set({ uid: ME.uid, hwId: id, startedAt: NOW(), answers: [] });
                        const sn = await ref.get({ source: 'server' }); ATT[id] = sn.data().startedAt.toMillis(); ATTANS[id] = [];
                        try { localStorage.setItem(examKey(), JSON.stringify({ hwId: id, startTime: ATT[id], durationMin: durOf(h), essay: isEssayHW(h) })); } catch (e) {} }
                    catch (e) { return eduAlert('Không bắt đầu được: ' + e.message, 'error'); }
                }
                endAt = needAtt ? endOf(h, ATT[id]) : Infinity;
                if (endAt <= nowMs()) { if (!isEssayHW(h)) return checkExpired(true);
                    if (nowMs() >= endAt + GRACE_MS) return recordTimeout(h, true);
                    grace = true; }
                if (hwLive !== id) ans = (ATTANS[id] || []).map(x => x < 0 ? undefined : x);
            }
            curHW = h; const live = !done && !grace && isFinite(endAt);
            if (!done && durOf(h) > 0 && ATT[id]) applyLock(true);
            if (PHOTOS_FOR !== id) { PHOTOS = []; PHOTOS_FOR = id; }
            { const b = $('hw-body'); b.style.pointerEvents = ''; b.style.opacity = ''; }
            const mine = SUBS_ALL.find(x => x.uid === ME.uid && x.hwId === id), my = (mine && mine.answers) || [];
            // Đoạn văn dùng chung (h.passages[q.p]): hiện 1 lần phía trên nhóm câu liên tiếp thuộc cùng đoạn
            const psgs = Array.isArray(h.passages) ? h.passages : [];
            const psgBox = (i, q) => { const k = q.p; if (typeof k !== 'number' || typeof psgs[k] !== 'string' || !psgs[k]) return ''; const prev = h.questions[i - 1]; if (prev && prev.p === k) return '';
                const n = h.questions.filter(x => x.p === k).length;
                return `<div class="hw-psg" style="margin-bottom:10px;background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:10px;"><p style="font-weight:800;font-size:12px;color:#b45309;margin-bottom:6px;"><svg class=ic aria-hidden=true><use href=#i-book-open-variant></use></svg> Đoạn văn dùng cho ${n} câu bên dưới</p><div style="font-size:13px;line-height:1.65;white-space:pre-wrap;word-break:break-word;">${esc(psgs[k])}</div></div>`; };
            $('hw-title').innerText = h.title; $('hw-submit').style.display = done || grace ? 'none' : 'block';
            $('hw-body').innerHTML = (live ? '<div id="hw-timer" style="position:sticky;top:-1px;background:#fff;padding:8px 0;font-weight:800;font-size:16px;z-index:2;text-align:center;border-bottom:1px solid #e2e8f0;margin-bottom:10px;"><svg class=ic aria-hidden=true><use href=#i-timer-outline></use></svg></div>' : '') +
                (done && h.type !== 'essay' ? `<p style="text-align:center;font-weight:800;color:var(--primary);margin-bottom:10px;">Điểm trắc nghiệm: ${mine && mine.mcqScore !== undefined ? mine.mcqScore : SUBS_DATA[id]}/${mcqN(h) * PT_PER_Q}${mine && mine.auto ? ' <small style="color:#f59e0b">(tự nộp khi hết giờ)</small>' : ''}${mine && mine.graded && !isEssayHW(h) ? '<br><small style="color:var(--green)"><svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg> Điểm sau khi giáo viên điều chỉnh: ' + Math.round(clamp100(mine.score)) + '/100' + (mine.feedback ? ' — ' + esc(mine.feedback) : '') + '</small>' : ''}</p>` : '') +
                (h.description ? `<p style="font-size:12px;color:var(--text-sub);margin-bottom:10px;">${esc(h.description)}</p>` : '') +
                h.questions.map((q, i) => psgBox(i, q) + (q.kind === 'essay' ? `<div class="hw-q" id="hwq-${i}" style="margin-bottom:14px;background:#eef2ff;border:1px solid #c7d2fe;padding:12px;border-radius:10px;"><p style="font-weight:bold;font-size:13px;white-space:pre-wrap;">Câu ${i + 1} (Tự luận)${q.q ? ': ' + esc(q.q) : ''}</p>${(q.images || []).map(im => `<img src="${im}" style="width:100%;margin-top:8px;border-radius:8px;border:1px solid #c7d2fe;">`).join('')}</div>` : `<div class="hw-q" id="hwq-${i}" style="margin-bottom:14px;background:#f8fafc;padding:12px;border-radius:10px;"><p style="font-weight:bold;font-size:13px;margin-bottom:8px;">Câu ${i + 1}: ${esc(q.q)}</p>` +
                    q.a.map((o, j) => { const wrong = done && my[i] === j && j !== q.c;
                        return `<div class="quiz-option ${done && j === q.c ? 'correct' : ''}" data-q="${i}" style="${!done && ans[i] === j ? 'background:#dbeafe;' : ''}${wrong ? 'background:#fee2e2;border-color:#ef4444;' : ''}" onclick="chonDA(this,${i},${j})">${'ABCD'[j]}. ${esc(o)}${wrong ? ' ✗' : ''}${done && j === q.c ? ' ✓' : ''}</div>`; }).join('') +
                    (done && (q.e || my[i] === undefined || my[i] < 0) ? `<p style="font-size:12px;color:var(--text-sub);margin-top:6px;">${my[i] === undefined || my[i] < 0 ? '<b>Bạn chưa trả lời câu này.</b> ' : ''}${q.e ? '<svg class=ic aria-hidden=true><use href=#i-lightbulb-on></use></svg> ' + esc(q.e) : ''}</p>` : '') + '</div>')).join('');
            if (isEssayHW(h)) {
                if (!done) $('hw-body').insertAdjacentHTML('beforeend', '<div class="hw-photo" style="margin-top:6px;padding:12px;border:1px dashed #6366f1;border-radius:10px;"><b style="font-size:13px;"><svg class=ic aria-hidden=true><use href=#i-camera></use></svg> Ảnh bài làm tự luận</b><p style="font-size:11px;color:var(--text-sub);margin:4px 0 8px;">Làm bài ra giấy, rồi chụp ảnh hoặc chọn ảnh từ thư viện để nộp.</p><div class="ph-box"></div></div>');
                else {
                    $('hw-body').insertAdjacentHTML('afterbegin', mine && mine.status === 'timeout'
                        ? '<p style="text-align:center;color:#ef4444;font-weight:700;font-size:13px;margin-bottom:10px;"><svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Quá thời gian gia hạn: bài không có ảnh bài làm.</p>'
                        : `<div style="margin-bottom:10px;"><b style="font-size:13px;color:var(--green);"><svg class=ic aria-hidden=true><use href=#i-camera></use></svg> Đã nộp ${photoCountOf(mine || {})} ảnh - chờ giáo viên chấm</b><div id="hw-ph-view" style="font-size:12px;color:var(--text-sub);margin-top:6px;">Đang tải ảnh...</div></div>`);
                    if (mine && mine.status !== 'timeout') loadSubPhotos(mine).then(l => { const el = $('hw-ph-view'); if (el) el.innerHTML = l.length ? photoGrid(l) : 'Không tìm thấy ảnh.'; }).catch(() => { const el = $('hw-ph-view'); if (el) el.innerText = 'Không tải được ảnh.'; });
                }
                refreshPhotos();
            }
            if (window.eduTypeset) eduTypeset($('hw-body'));   // vẽ công thức toán trong đề / đáp án / giải thích
            hwSetupNav(h, done, my);
            $('modal-hw').style.display = 'flex';
            if (live) startTimer(h, endAt);
            if (grace) enterGrace(h, endAt);
        }
        // Chỉ cập nhật con số đếm ngược (text + màu) của #hw-timer, KHÔNG dựng lại DOM. Trả về số giây còn lại.
        function paintHwClock() {
            const rem = Math.round((hwEnd - nowMs()) / 1000), el = $('hw-timer');
            if (el) { const m = Math.max(rem, 0), t = '<svg class=ic aria-hidden=true><use href=#i-timer-outline></use></svg> Còn ' + Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
                if (el.textContent !== t) el.textContent = t;
                el.style.color = rem < 60 ? '#ef4444' : 'var(--text-main)'; }
            return rem;
        }
        function startTimer(h, endAt) {
            hwLive = h.id; hwObj = h; hwEnd = endAt; clearInterval(hwTimer);
            const tick = () => { const rem = paintHwClock();
                if (rem <= 0) { clearInterval(hwTimer); if (isEssayHW(h)) enterGrace(h, hwEnd); else nopBai(true); } };
            tick(); hwTimer = setInterval(tick, 1000);
        }
        async function nopBai(auto) {
            const h = hwObj || curHW; if (!h || SUBS_DATA[h.id] !== undefined || busy[h.id]) return;
            if (isEssayHW(h)) return nopBaiTuLuan();
            if (auto !== true && h.questions.some((q, i) => ans[i] === undefined)) {
                const yes = await eduConfirm('Vẫn nộp bài?', { title: 'Bạn chưa trả lời hết', confirmText: 'Nộp bài', cancelText: 'Làm tiếp', icon: 'warning' });
                if (!yes || SUBS_DATA[h.id] !== undefined || busy[h.id]) return;   // kiểm tra lại: trong lúc hỏi, bài có thể đã tự nộp do hết giờ
            }
            busy[h.id] = 1; clearInterval(hwTimer); clearTimeout(saveT); hwLive = null; hwObj = null;
            const sc = a => h.questions.filter((q, i) => a[i] === q.c).length * PT_PER_Q, full = h.questions.map((q, i) => ans[i] === undefined ? -1 : ans[i]);
            let score = sc(full), used = full, isAuto = auto === true;
            try {
                try { await putSub(h, score, full, isAuto); }
                catch (e) { const sv = ATTANS[h.id]; if (e.code === 'permission-denied' && sv) { used = sv; score = sc(sv); isAuto = true; await putSub(h, score, sv, true); } else throw e; }
                SUBS_DATA[h.id] = score; syncLock();
                await eduAlert(`Điểm: ${score}/${h.questions.length * PT_PER_Q} (+${quizXpOf(score)} XP • ${correctOf(score)} câu đúng x ${XP_PER_CORRECT} XP)`, { icon: isAuto ? 'info' : 'success', title: isAuto ? 'Bài đã được nộp tự động' : 'Nộp bài thành công!' });
                if ($('modal-hw').style.display === 'flex') openHW(h.id);
            } catch (e) {
                busy[h.id] = 0;
                // Nộp thất bại (mạng...): nếu bài còn giờ thì khôi phục đồng hồ + trạng thái đang làm để nộp lại được
                const st = ATT[h.id], endAt = st ? endOf(h, st) : Infinity;
                const stillLive = SUBS_DATA[h.id] === undefined && isFinite(endAt) && endAt > nowMs();
                if (stillLive) { startTimer(h, endAt); saveAns(); }
                eduAlert(((e && e.message) || e) + (stillLive ? '\nBài vẫn còn giờ, hãy kiểm tra mạng rồi bấm "Nộp bài" lại.' : (isFinite(endAt) ? '\nĐã hết giờ: bài sẽ tự nộp lại khi có mạng.' : '')), { icon: 'error', title: 'Không nộp được bài' });
            }
        }
        // Bài đã hết giờ/quá hạn mà chưa nộp (ví dụ đã đóng trang): tự chấm các câu đã làm
        function checkExpired(open) {
            if (!ME) return;
            HW_DATA.forEach(h => { const st = ATT[h.id]; if (!st || SUBS_DATA[h.id] !== undefined || busy[h.id] || hwLive === h.id) return;
                if (isEssayHW(h)) { if (nowMs() >= endOf(h, st) + GRACE_MS) recordTimeout(h, open); return; }
                if (endOf(h, st) > nowMs()) return; busy[h.id] = 1;
                const sv = ATTANS[h.id] || [], score = h.questions.filter((q, i) => sv[i] === q.c).length * PT_PER_Q;
                putSub(h, score, sv, true).then(() => { if (open) eduAlert(`Đã hết giờ nên bài được tự động nộp: ${score}/${h.questions.length * PT_PER_Q}`, { icon: 'info', title: 'Hết giờ' }); }).catch(() => { busy[h.id] = 0; }); });
        }
        // Mỗi 15 giây: chỉ cập nhật đồng hồ đếm ngược; danh sách bài tập chỉ dựng lại KHI một bài đổi trạng thái theo thời gian
        // (hết hạn nộp / hết giờ / vào 3 phút gia hạn). Dữ liệu Firestore đổi vẫn gọi renderHW() trực tiếp từ các onSnapshot.
        setInterval(() => {
            if (!ME) return;
            checkExpired(); syncLock();
            if (hwLive) paintHwClock();                  // đồng bộ lại đồng hồ (phòng khi tab bị trình duyệt làm chậm timer)
            if (hwTimeSig() !== HW_SIG) renderHW();      // không đổi trạng thái -> không đụng DOM
        }, 15000);

        // ---- Bước 10A: Orient New - Bảng tin thật (Firestore: collection "posts") ----
        let POSTS_READY = false, POSTS_ERR = '', postBusy = false;
        const POST_MAX = 1000;
        const draftKey = () => 'eduorient_post_draft_' + (ME ? ME.uid : '');
        function loadDraft() { try { return localStorage.getItem(draftKey()) || ''; } catch (e) { return ''; } }
        function saveDraft(v) { try { v ? localStorage.setItem(draftKey(), v) : localStorage.removeItem(draftKey()); } catch (e) {} }
        function postTimeAgo(ts) {
            if (!ts || !ts.toDate) return 'Vừa xong';   // bài vừa đăng, máy chủ chưa gắn giờ
            const d = ts.toDate(), s = Math.floor((Date.now() - d.getTime()) / 1000);
            if (s < 60) return 'Vừa xong';
            if (s < 3600) return Math.floor(s / 60) + ' phút trước';
            if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
            if (s < 7 * 86400) return Math.floor(s / 86400) + ' ngày trước';
            return d.toLocaleDateString('vi-VN');
        }
        // ---- Bước 10B: Thả tim & Bình luận ----
        const OPEN_CMT = new Set();      // các bài đang mở khung bình luận (giữ nguyên khi bảng tin vẽ lại)
        const CMT_DRAFT = {};            // nội dung đang gõ dở trong từng ô bình luận
        const CMT_SCROLL = new Set();    // bài cần cuộn danh sách bình luận xuống cuối sau khi vẽ lại
        const CMT_MAX = 300;
        const agoMs = ms => ms ? postTimeAgo({ toDate: () => new Date(ms) }) : '';
        function postMeta(p) {
            const pr = PROFILES[p.uid] || {}, parts = [];
            if (pr.role === 'teacher') { if (pr.subject) parts.push(pr.subject); if (pr.school) parts.push(pr.school); }
            else { if (pr.cls) parts.push('Lớp ' + pr.cls); if (pr.targetSchoolName) parts.push(pr.targetSchoolName); }
            parts.push(postTimeAgo(p.createdAt));
            return parts.map(esc).join(' · ');
        }
        const commentHtml = c => `<div class="cmt-item"><img loading="lazy" decoding="async" width="32" height="32" class="cmt-av" src="${esc(avatarOf(c.uid, c.name))}" alt=""><div class="cmt-body"><div class="cmt-bubble"><div class="cmt-name">${esc(c.name)}</div><div class="cmt-text">${esc(c.text)}</div></div>${c.at ? `<div class="cmt-time">${esc(agoMs(c.at))}</div>` : ''}</div></div>`;
        // Bảng tin: 40 bài mới nhất kèm bình luận, cập nhật realtime. Chỉ bắt đầu nghe khi mở Orient New lần đầu
        // (trước đây nghe ngay lúc đăng nhập dù học sinh chưa mở), sau đó giữ nguyên để bảng tin luôn mới.
        let POSTS_STARTED = false;
        function startPostsListener() {
            if (POSTS_STARTED || !ME) return;
            POSTS_STARTED = true;
            fbDb.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot(s => {
                POSTS = s.docs.map(d => ({ id: d.id, ...d.data() })); POSTS_READY = true; POSTS_ERR = '';
                ensureProfiles(POSTS.flatMap(p => [p.uid].concat((p.comments || []).map(c => c.uid))));
                if ($('modal-mxh').style.display === 'flex') renderPosts();
            }, e => { POSTS_READY = true; POSTS_ERR = e.message; if ($('modal-mxh').style.display === 'flex') renderPosts(); });
        }
        function renderPosts() {
            if (!ME) return;
            $('composer-avatar').src = avatarOf(ME.uid, user.name);
            const box = $('posts-container');
            if (POSTS_ERR) { box.innerHTML = '<div class="feed-empty"><svg class=ic aria-hidden=true><use href=#i-alert></use></svg> Không tải được bảng tin.<br>' + esc(POSTS_ERR) + '</div>'; return; }
            if (!POSTS_READY) { box.innerHTML = '<div class="feed-empty">Đang tải bảng tin...</div>'; return; }
            if (!POSTS.length) { box.innerHTML = '<div class="feed-empty"><svg class=ic aria-hidden=true><use href=#i-sprout></use></svg> Chưa có bài viết nào.<br>Hãy là người đầu tiên chia sẻ trên Orient New!</div>'; return; }

            // Ghi nhớ ô đang gõ + vị trí cuộn của từng danh sách bình luận để không bị mất khi có cập nhật realtime
            const ae = document.activeElement, focusId = ae && ae.dataset ? ae.dataset.cmt : null;
            const selS = focusId ? ae.selectionStart : 0, selE = focusId ? ae.selectionEnd : 0, scr = {};
            box.querySelectorAll('.cmt-list').forEach(el => scr[el.dataset.id] = el.scrollTop);

            box.innerHTML = POSTS.map(p => {
                const likes = p.likes || [], comments = p.comments || [], liked = likes.includes(ME.uid), open = OPEN_CMT.has(p.id);
                const isT = (PROFILES[p.uid] || {}).role === 'teacher';
                const full = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate().toLocaleString('vi-VN') : '';
                const draft = CMT_DRAFT[p.id] || '';
                return `<div class="post-card" id="post-${p.id}">
                <div class="post-header"><img loading="lazy" decoding="async" width="42" height="42" src="${esc(avatarOf(p.uid, p.name))}" alt=""><div style="flex:1;min-width:0;"><div class="post-author">${esc(p.name)}${isT ? '<span class="post-badge">Giáo viên</span>' : ''}</div><div class="post-time" title="${esc(full)}">${postMeta(p)}</div></div>${p.uid === ME.uid ? `<button type="button" class="post-del" title="Xóa bài viết" aria-label="Xóa bài viết" onclick="deletePost('${p.id}')"><svg class=ic aria-hidden=true><use href=#i-delete></use></svg></button>` : ''}</div>
                <div class="post-content">${esc(p.content)}</div>
                <div class="post-actions">
                    <button type="button" class="post-action-btn ${liked ? 'liked' : ''}" aria-pressed="${liked}" aria-label="${liked ? 'Bỏ thả tim' : 'Thả tim'}" onclick="toggleLike('${p.id}')"><span class="ic">${liked ? '<svg class=ic aria-hidden=true><use href=#i-heart></use></svg>' : '<svg class=ic aria-hidden=true><use href=#i-heart-outline></use></svg>'}</span> ${likes.length} Thích</button>
                    <button type="button" class="post-action-btn ${open ? 'open' : ''}" id="cmt-btn-${p.id}" aria-expanded="${open}" aria-controls="cmt-panel-${p.id}" onclick="toggleComments('${p.id}')"><span class="ic"><svg class=ic aria-hidden=true><use href=#i-chat></use></svg></span> ${comments.length} Bình luận</button>
                </div>
                <div class="cmt-panel" id="cmt-panel-${p.id}" ${open ? '' : 'hidden'}>
                    <div class="cmt-list" id="cmt-list-${p.id}" data-id="${p.id}">${comments.length ? comments.map(commentHtml).join('') : '<div class="cmt-empty">Chưa có bình luận nào. Hãy là người đầu tiên!</div>'}</div>
                    <div class="cmt-form"><img loading="lazy" decoding="async" width="32" height="32" class="cmt-av" src="${esc(avatarOf(ME.uid, user.name))}" alt="">
                        <input name="cmt-input-${p.id}" aria-label="Viết bình luận..." type="text" class="cmt-input" id="cmt-input-${p.id}" data-cmt="${p.id}" maxlength="${CMT_MAX}" placeholder="Viết bình luận..." autocomplete="off" value="${esc(draft)}" oninput="onCmtInput('${p.id}')" onkeydown="onCmtKey(event,'${p.id}')">
                        <button type="button" class="cmt-send" id="cmt-send-${p.id}" ${draft.trim() ? '' : 'disabled'} onclick="sendComment('${p.id}')">Gửi</button></div>
                </div></div>`;
            }).join('');

            box.querySelectorAll('.cmt-list').forEach(el => {
                const id = el.dataset.id;
                if (CMT_SCROLL.has(id)) { el.scrollTop = el.scrollHeight; CMT_SCROLL.delete(id); }
                else if (scr[id]) el.scrollTop = scr[id];
            });
            if (focusId) { const inp = $('cmt-input-' + focusId); if (inp) { inp.focus(); try { inp.setSelectionRange(selS, selE); } catch (e) {} } }
        }
        function openPostModal() {
            if (!ME || !user.name) return eduAlert('Hồ sơ của bạn chưa sẵn sàng, vui lòng thử lại sau giây lát.', 'warning');
            $('pm-avatar').src = avatarOf(ME.uid, user.name); $('pm-name').textContent = user.name;
            $('pm-meta').textContent = [user.schoolClass ? 'Lớp ' + user.schoolClass : '', user.targetSchoolName || ''].filter(Boolean).join(' · ');
            const ta = $('post-modal-input'); if (!ta.value) ta.value = loadDraft();   // khôi phục bản nháp chưa đăng
            onPostInput(); $('modal-create-post').style.display = 'flex';
            setTimeout(() => ta.focus(), 60);
        }
        function closePostModal() { $('modal-create-post').style.display = 'none'; }
        function onPostInput() {
            const v = $('post-modal-input').value, n = v.length;
            $('pm-count').textContent = n + '/' + POST_MAX;
            $('pm-foot').classList.toggle('warn', n >= POST_MAX);
            $('pm-submit').disabled = postBusy || !v.trim();
            saveDraft(v);
        }
        function createPost() {
            if (postBusy || !ME || !user.name) return;
            const ta = $('post-modal-input'), c = ta.value.trim();
            if (!c) return eduAlert('Vui lòng nhập nội dung bài viết!', 'warning');
            postBusy = true; $('pm-submit').disabled = true; $('pm-submit').textContent = 'Đang đăng...';
            // Giữ đúng cấu trúc bài viết cũ để trang giáo viên / admin và luật Firestore vẫn dùng được
            fbDb.collection('posts').add({ uid: ME.uid, name: user.name, content: c.slice(0, POST_MAX), likes: [], comments: [], createdAt: NOW() })
                .then(() => {
                    ta.value = ''; saveDraft(''); closePostModal();
                    const sc = $('mxh-scroll'); if (sc) sc.scrollTop = 0;   // bài mới nằm đầu Bảng tin
                    eduToast('Đã đăng bài viết', 'success');
                })
                .catch(e => eduAlert('Không đăng được bài viết: ' + e.message, 'error'))
                .then(() => { postBusy = false; $('pm-submit').textContent = 'Đăng bài'; onPostInput(); });
        }
        // Thả tim: bấm lần 1 = thả, bấm lần nữa = bỏ. Firestore phát snapshot cục bộ ngay nên số tim đổi tức thì.
        function toggleLike(id) {
            const p = POSTS.find(x => x.id === id); if (!p || !ME) return;
            const has = (p.likes || []).includes(ME.uid), F = firebase.firestore.FieldValue;
            fbDb.collection('posts').doc(id).update({ likes: has ? F.arrayRemove(ME.uid) : F.arrayUnion(ME.uid) })
                .catch(e => eduAlert('Không thả tim được: ' + e.message, 'error'));
        }
        // Mở / đóng khung bình luận (chỉ đổi giao diện, không vẽ lại cả bảng tin)
        function toggleComments(id) {
            const panel = $('cmt-panel-' + id), btn = $('cmt-btn-' + id); if (!panel) return;
            const open = panel.hidden;   // đang ẩn -> sẽ mở
            panel.hidden = !open;
            open ? OPEN_CMT.add(id) : OPEN_CMT.delete(id);
            if (btn) { btn.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); }
            if (open) { const l = $('cmt-list-' + id); if (l) l.scrollTop = l.scrollHeight; const inp = $('cmt-input-' + id); if (inp) setTimeout(() => inp.focus(), 30); }
        }
        function onCmtInput(id) {
            const inp = $('cmt-input-' + id); if (!inp) return;
            CMT_DRAFT[id] = inp.value;
            const b = $('cmt-send-' + id); if (b) b.disabled = !inp.value.trim();
        }
        function onCmtKey(e, id) {
            // Bỏ qua Enter khi đang gõ tiếng Việt bằng bộ gõ (Telex/VNI) để không gửi nhầm
            if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); sendComment(id); }
        }
        // Gửi bình luận: hiện ngay bên dưới bài viết và cập nhật tổng số bình luận
        function sendComment(id) {
            if (!ME || !user.name) return eduAlert('Hồ sơ của bạn chưa sẵn sàng, vui lòng thử lại sau giây lát.', 'warning');
            const inp = $('cmt-input-' + id), text = ((inp ? inp.value : CMT_DRAFT[id]) || '').trim().slice(0, CMT_MAX);
            if (!text) return;
            const c = { uid: ME.uid, name: user.name, text, at: Date.now() };   // 'at' giúp mỗi bình luận là duy nhất và hiển thị được thời gian
            CMT_DRAFT[id] = ''; if (inp) inp.value = '';
            const b = $('cmt-send-' + id); if (b) b.disabled = true;
            CMT_SCROLL.add(id); OPEN_CMT.add(id);
            fbDb.collection('posts').doc(id).update({ comments: firebase.firestore.FieldValue.arrayUnion(c) })
                .catch(e => {
                    CMT_SCROLL.delete(id);
                    const i2 = $('cmt-input-' + id);   // gửi lỗi: trả lại nội dung để người dùng không phải gõ lại
                    if (!CMT_DRAFT[id]) { CMT_DRAFT[id] = text; if (i2 && !i2.value) { i2.value = text; onCmtInput(id); } }
                    eduAlert('Không gửi được bình luận: ' + e.message, 'error');
                });
        }
        function deletePost(id) {
            eduConfirm('Bài viết sẽ bị xóa vĩnh viễn.', { title: 'Xóa bài viết này?', confirmText: 'Xóa', danger: true })
                .then(yes => { if (yes) fbDb.collection('posts').doc(id).delete().catch(e => eduAlert(e.message, 'error')); });
        }

        // ---- Nhắn tin (Yêu cầu 8): danh sách kiểu Messenger + tab "Giáo viên trường tôi" ----
        const chatIdOf = o => o === 'class' ? 'class' : [ME.uid, o].sort().join('_');

        // ---- Bước 9A: Nhóm chat lớp (tự khởi tạo + tự tham gia), lưu ở Firestore: groups/{gid}/msgs ----
        // Mã cuộc trò chuyện của nhóm có dạng "g:<gid>"; gid gắn theo (trường + lớp) để lớp trùng tên ở trường khác không bị lẫn.
        let MY_GROUP = null, groupBusy = '';
        let GROUP_UNSUB = null, GROUP_META_GID = '', ROOM_MSGS = [];   // theo dõi GVCN / Lớp Trưởng của nhóm + tin nhắn đang hiển thị
        const groupFailAt = {};
        const isGroupId = id => String(id).indexOf('g:') === 0;
        const msgsRef = id => isGroupId(id) ? fbDb.collection('groups').doc(String(id).slice(2)).collection('msgs') : fbDb.collection('chats').doc(chatIdOf(id)).collection('msgs');
        const classGroupId = () => 'lop-' + foldVN(user.targetSchoolId).replace(/[^a-z0-9]+/g, '-') + '--' + foldVN(user.schoolClass).replace(/[^a-z0-9]+/g, '');
        const groupAv = cls => initialsAv(cls || 'L', '#4361ee', 4);
        const groupSub = () => (MY_GROUP ? MY_GROUP.n + ' thành viên • ' : '') + 'Chat chung của lớp';
        function ensureClassGroup() {
            if (!ME || !user.schoolClass || !user.targetSchoolId) { MY_GROUP = null; return; }
            const gid = classGroupId();
            if (MY_GROUP && MY_GROUP.gid !== gid) MY_GROUP = null;   // đã đổi lớp/trường
            if ((MY_GROUP && MY_GROUP.gid === gid) || groupBusy === gid || Date.now() - (groupFailAt[gid] || 0) < 30000) return;
            groupBusy = gid;
            const cls = user.schoolClass, schoolId = user.targetSchoolId, ref = fbDb.collection('groups').doc(gid);
            fbDb.runTransaction(async tx => {
                const snap = await tx.get(ref);
                if (!snap.exists) {   // chưa có nhóm của lớp này -> tạo mới, thành viên đầu tiên là tài khoản hiện tại
                    const name = 'Nhóm Chat Lớp ' + cls;
                    tx.set(ref, { type: 'class', name, cls, schoolId, members: [ME.uid], createdAt: NOW() });
                    return { name, n: 1 };
                }
                const d = snap.data(), ms = d.members || [], joined = ms.includes(ME.uid);
                if (!joined) tx.update(ref, { members: firebase.firestore.FieldValue.arrayUnion(ME.uid) });   // đã có nhóm -> tự thêm vào
                return { name: d.name || ('Nhóm Chat Lớp ' + cls), n: joined ? ms.length : ms.length + 1 };
            }).then(r => { MY_GROUP = { id: 'g:' + gid, gid, name: r.name, n: r.n, hr: '', mon: '', hidden: [] }; watchGroupMeta(gid); })
              .catch(e => { groupFailAt[gid] = Date.now(); MY_GROUP = null; console.warn('Nhóm chat lớp:', e.message); })
              .finally(() => { groupBusy = ''; if (listVisible()) renderChatList(); });
        }
        // ---- Phân quyền GVCN & Lớp Trưởng ----
        // Học sinh KHÔNG thấy người bật "Ẩn bản thân" (luôn thấy chính mình; GVCN / giáo viên không bao giờ bị ẩn khỏi học sinh)
        const visibleMembers = ms => {
            const hid = (MY_GROUP && MY_GROUP.hidden) || [], hr = (MY_GROUP && MY_GROUP.hr) || '';
            return (ms || []).filter(u => u === ME.uid || !(hid.includes(u) && u !== hr && (PROFILES[u] || {}).role !== 'teacher'));
        };
        const isHiddenMe = () => !!(MY_GROUP && ME && (MY_GROUP.hidden || []).includes(ME.uid));
        // Nghe realtime tài liệu groups/{gid}: homeroomTeacherUid (GVCN) và monitorUid (Lớp Trưởng) để huy hiệu / nút xóa cập nhật ngay
        function watchGroupMeta(gid) {
            if (GROUP_UNSUB && GROUP_META_GID === gid) return;
            if (GROUP_UNSUB) { GROUP_UNSUB(); GROUP_UNSUB = null; }
            GROUP_META_GID = gid;
            GROUP_UNSUB = fbDb.collection('groups').doc(gid).onSnapshot(d => {
                if (!d.exists || !MY_GROUP || MY_GROUP.gid !== gid) return;
                const g = d.data() || {}, ms = g.members || [];
                MY_GROUP.hr = g.homeroomTeacherUid || '';
                MY_GROUP.mon = g.monitorUid || '';
                MY_GROUP.hidden = Array.isArray(g.hiddenMembers) ? g.hiddenMembers : [];
                MY_GROUP.n = visibleMembers(ms).length;
                if (curChatId === MY_GROUP.id) { $('active-chat-sub').innerText = groupSub(); refreshRoom(); }
                updateChatClearBtn();
                if ($('modal-group-info').style.display === 'flex') renderGroupMembers(ms);
            }, e => { if (e && e.code === 'permission-denied' && MY_GROUP && MY_GROUP.gid === gid && fbAuth.currentUser && ME && fbAuth.currentUser.uid === ME.uid) onRemovedFromGroup(); });   // bị kick -> mất quyền đọc nhóm (đang đăng xuất thì KHÔNG báo)
        }
        // Vẽ lại tin nhắn của nhóm đang mở (giữ nguyên vị trí cuộn nếu người dùng đang đọc tin cũ)
        function refreshRoom() {
            if (!curChatId) return;
            const b = $('chat-messages-body'), top = b.scrollTop, atEnd = b.scrollHeight - top - b.clientHeight < 40;
            b.innerHTML = ROOM_MSGS.length ? renderMsgs(ROOM_MSGS, curChatId === 'class' || isGroupId(curChatId)) : '<div class="chat-empty"><svg class=ic aria-hidden=true><use href=#i-hand-wave></use></svg> Hãy gửi lời chào đầu tiên!</div>';
            b.scrollTop = atEnd ? b.scrollHeight : top;
        }
        // Lớp Trưởng xóa tin nhắn vi phạm trong nhóm (quyền được Firestore rules kiểm tra lại ở máy chủ)
        function deleteGroupMsg(mid) {
            if (!MY_GROUP || !curChatId || !isGroupId(curChatId) || MY_GROUP.mon !== ME.uid) return;
            const ref = msgsRef(curChatId).doc(mid);
            eduConfirm('Tin nhắn sẽ bị xóa vĩnh viễn khỏi nhóm.', { title: 'Xóa tin nhắn vi phạm?', confirmText: 'Xóa', danger: true })
                .then(yes => { if (yes) ref.delete().catch(e => eduAlert(e && e.code === 'permission-denied' ? 'Bạn không còn quyền xóa tin nhắn trong nhóm này (có thể đã bị bãi nhiệm Lớp Trưởng).' : (e && e.message || e), 'error')); });
        }

        // ---- Bước 9B: Cài đặt nhóm chat lớp + thêm Giáo viên bộ môn ----
        let groupInfoBusy = false;
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        const TEACHER_CACHE = {};   // uid -> { name }: tên giáo viên vừa thêm (phòng khi hồ sơ công khai của họ chưa có)
        function setGroupMsg(text, type) {
            const el = $('group-add-msg');
            el.className = 'group-msg' + (type ? ' ' + type : '');
            el.innerText = text || '';
            el.style.display = text ? 'block' : 'none';
        }
        function memberInfo(uid) {
            const p = PROFILES[uid] || {}, c = TEACHER_CACHE[uid];
            const teacher = p.role === 'teacher' || !!c;
            return { uid, teacher, name: p.name || (c && c.name) || (teacher ? 'Giáo viên' : 'Thành viên'), subject: p.subject || '', cls: p.cls || '' };
        }
        function renderGroupMembers(ms) {
            const hr = (MY_GROUP && MY_GROUP.hr) || '', mon = (MY_GROUP && MY_GROUP.mon) || '';
            syncSelfHideToggle();
            const stBox = $('group-student-box'); if (stBox) stBox.style.display = isMonitorMe() ? 'block' : 'none';   // chỉ Lớp Trưởng
            const list = visibleMembers(ms).map(memberInfo).map(m => m.uid === hr ? { ...m, teacher: true } : m).sort((a, b) =>
                ((b.uid === hr) - (a.uid === hr)) || ((b.uid === mon) - (a.uid === mon)) || (b.teacher - a.teacher) || ((b.uid === ME.uid) - (a.uid === ME.uid)) || a.name.localeCompare(b.name, 'vi'));
            $('group-members-title').innerText = 'Thành viên (' + list.length + ')';
            $('group-members-list').innerHTML = list.length ? list.map(m => {
                const sub = m.teacher ? (m.uid === hr ? 'Giáo viên chủ nhiệm' : (m.subject ? 'Môn ' + m.subject : 'Giáo viên bộ môn')) : (m.cls ? 'Lớp ' + m.cls : 'Học sinh');
                const badge = (m.uid === hr ? '<span class="role-badge hr">GVCN</span>' : '') + (m.uid === mon ? '<span class="role-badge mon">Lớp Trưởng</span>' : '') + (m.uid === ME.uid && isHiddenMe() ? '<span class="role-badge hid">Đang ẩn</span>' : '');
                const kickBtn = (isMonitorMe() && !m.teacher && m.uid !== ME.uid && m.uid !== hr && m.uid !== mon)
                    ? `<button type="button" class="mi-kick" data-uid="${esc(m.uid)}" onclick="kickMember(this.dataset.uid)">Kick</button>` : '';
                return `<div class="member-item"><img loading="lazy" decoding="async" width="40" height="40" src="${esc(avatarOf(m.uid, m.name))}" alt=""><div class="mi-main"><div class="mi-name">${esc(m.name)}${badge}${m.uid === ME.uid ? ' <span class="mi-you">(Bạn)</span>' : ''}</div><div class="mi-sub">${esc(sub)}</div></div>${kickBtn}<span class="mi-tag ${m.teacher ? 't' : 's'}">${m.teacher ? 'Giáo viên' : 'Học sinh'}</span></div>`;
            }).join('') : '<div class="chat-empty">Chưa có thành viên nào.</div>';
        }
        // ---- Kick thành viên (CHỈ Lớp Trưởng; GVCN & Admin thao tác bên index.html) ----
        const isMonitorMe = () => !!(MY_GROUP && ME && MY_GROUP.mon === ME.uid);
        let kickBusy = false;
        async function kickMember(uid) {
            if (kickBusy || !isMonitorMe()) return;
            const m = memberInfo(uid);
            if (m.teacher || uid === ME.uid || uid === MY_GROUP.hr || uid === MY_GROUP.mon) return;
            const yes = await eduConfirm('Bạn có chắc muốn xóa ' + m.name + ' khỏi nhóm lớp?', { title: 'Kick khỏi nhóm?', confirmText: 'Xóa khỏi nhóm', danger: true });
            if (!yes) return;
            kickBusy = true;
            const F = firebase.firestore.FieldValue;
            try {
                await fbDb.collection('groups').doc(MY_GROUP.gid).update({ members: F.arrayRemove(uid), lastKickUid: uid });
                eduAlert('Đã xóa ' + m.name + ' khỏi nhóm lớp.', 'success');
                await loadGroupMembers();
            } catch (e) {
                console.error('Lỗi Kick:', e);
                const denied = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
                eduAlert(denied ? 'Không có quyền xóa thành viên. Hãy chắc chắn firestore.rules mới nhất đã được Publish và bạn đang là Lớp Trưởng của nhóm (chỉ xóa được học sinh, không xóa được GVCN / Lớp Trưởng).' : (e && e.message || e), 'error');
            } finally { kickBusy = false; }
        }
        // Bị kick khỏi nhóm: đóng phòng chat, không tự vào lại trong phiên này
        function onRemovedFromGroup() {
            if (!fbAuth.currentUser) return;   // đã đăng xuất / xóa tài khoản: không phải bị kick
            const gid = MY_GROUP && MY_GROUP.gid, wasOpen = !!(MY_GROUP && curChatId === MY_GROUP.id);
            if (GROUP_UNSUB) { GROUP_UNSUB(); GROUP_UNSUB = null; }
            GROUP_META_GID = '';
            if (gid) groupFailAt[gid] = Date.now() + 1e11;
            MY_GROUP = null;
            closeGroupInfo();
            if (wasOpen) closeChatRoom();
            if (listVisible()) renderChatList();
            eduAlert('Bạn đã bị xóa khỏi nhóm chat lớp.', 'warning');
        }
        // ---- Xóa lịch sử tin nhắn: nhóm lớp (chỉ Lớp Trưởng ở trang này) / chat riêng (cả 2 người) ----
        function updateChatClearBtn() {
            const b = $('chat-clear-btn'); if (!b) return;
            const id = curChatId, grp = !!id && isGroupId(id);
            b.style.display = (id && id !== 'class' && (grp ? isMonitorMe() : true)) ? 'flex' : 'none';
        }
        let clearBusy = false;
        async function clearChatHistory() {
            const id = curChatId;
            if (clearBusy || !id || id === 'class') return;
            const grp = isGroupId(id);
            if (grp && !isMonitorMe()) return;
            const yes = await eduConfirm(grp ? 'Toàn bộ tin nhắn của nhóm sẽ bị xóa vĩnh viễn với mọi thành viên.' : 'Toàn bộ tin nhắn của cuộc trò chuyện này sẽ bị xóa vĩnh viễn với CẢ HAI người.',
                { title: grp ? 'Xóa toàn bộ lịch sử nhóm?' : 'Xóa cuộc trò chuyện?', confirmText: 'Xóa', danger: true });
            if (!yes) return;
            clearBusy = true;
            try {
                const col = msgsRef(id);
                let total = 0;
                // Xóa từng đợt 100 tin, mỗi đợt chạy song song 20 lệnh (mỗi lệnh là 1 request riêng nên không vướng giới hạn get() của rules khi batch)
                for (let round = 0; round < 200; round++) {
                    const s = await col.limit(100).get();
                    if (s.empty) break;
                    for (let i = 0; i < s.docs.length; i += 20) await Promise.all(s.docs.slice(i, i + 20).map(d => d.ref.delete()));
                    total += s.size;
                    if (s.size < 100) break;
                }
                eduAlert('Đã xóa ' + total + ' tin nhắn.', 'success');
            } catch (e) {
                console.error('Lỗi xóa lịch sử:', e);
                const denied = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
                eduAlert(denied ? 'Không có quyền xóa lịch sử. Hãy chắc chắn firestore.rules mới nhất đã được Publish.' : (e && e.message || e), 'error');
            } finally { clearBusy = false; }
        }
        // ---- Chế độ ẩn bản thân (Self-Hide Mode): thêm / xóa CHÍNH UID của mình trong groups/{gid}.hiddenMembers ----
        let selfHideBusy = false;
        function setSelfHideMsg(text, type) {
            const el = $('self-hide-msg');
            el.className = 'group-msg' + (type ? ' ' + type : '');
            el.innerText = text || '';
            el.style.display = text ? 'block' : 'none';
        }
        function syncSelfHideToggle() {
            const cb = $('self-hide-toggle');
            if (cb) cb.checked = isHiddenMe();
        }
        async function toggleSelfHide(on) {
            if (selfHideBusy || !MY_GROUP || !ME) { syncSelfHideToggle(); return; }
            if (on === isHiddenMe()) return;   // trạng thái không đổi -> không ghi (rules chỉ chấp nhận thêm / xóa thật sự)
            const gid = MY_GROUP.gid, cb = $('self-hide-toggle'), F = firebase.firestore.FieldValue;
            selfHideBusy = true; cb.disabled = true; setSelfHideMsg('');
            try {
                await fbDb.collection('groups').doc(gid).update({ hiddenMembers: on ? F.arrayUnion(ME.uid) : F.arrayRemove(ME.uid) });
                if (MY_GROUP && MY_GROUP.gid === gid) {
                    const cur = (MY_GROUP.hidden || []).filter(u => u !== ME.uid);
                    MY_GROUP.hidden = on ? cur.concat(ME.uid) : cur;
                }
                setSelfHideMsg(on ? 'Đã bật: các bạn học sinh khác không còn thấy bạn trong danh sách thành viên.' : 'Đã tắt: bạn hiện lại trong danh sách thành viên.', 'ok');
                await loadGroupMembers();   // tải lại danh sách + cập nhật số thành viên
            } catch (e) {
                console.error('Lỗi Ẩn bản thân:', e);
                syncSelfHideToggle();
                const denied = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
                setSelfHideMsg(denied ? 'Không có quyền thực hiện. Hãy chắc chắn firestore.rules mới nhất đã được Publish trên Firebase.' : 'Lỗi: ' + (e && e.message || e), 'err');
            } finally {
                selfHideBusy = false; cb.disabled = false; syncSelfHideToggle();
            }
        }
        // Đọc danh sách thành viên mới nhất từ Firestore, cập nhật số thành viên ở đầu phòng chat
        function loadGroupMembers() {
            const gid = MY_GROUP && MY_GROUP.gid;
            if (!gid) return Promise.resolve(null);
            return fbDb.collection('groups').doc(gid).get().then(d => {
                const gd = d.data() || {}, ms = gd.members || [];
                ensureProfiles(ms);
                if (MY_GROUP && MY_GROUP.gid === gid) {
                    MY_GROUP.hr = gd.homeroomTeacherUid || ''; MY_GROUP.mon = gd.monitorUid || '';
                    MY_GROUP.hidden = Array.isArray(gd.hiddenMembers) ? gd.hiddenMembers : [];
                    MY_GROUP.n = visibleMembers(ms).length;
                    if (curChatId === MY_GROUP.id) $('active-chat-sub').innerText = groupSub();
                    $('group-info-title').innerHTML = ico('cog') + ' ' + esc(MY_GROUP.name);
                }
                renderGroupMembers(ms);
                return ms;
            }).catch(e => {
                $('group-members-list').innerHTML = '<p style="font-size:12px;color:#ef4444;padding:8px;">' + esc(e.message) + '</p>';
                return null;
            });
        }
        function openGroupInfo() {
            if (!MY_GROUP || curChatId !== MY_GROUP.id) return;
            $('group-info-title').innerHTML = ico('cog') + ' ' + esc(MY_GROUP.name);
            $('group-teacher-email').value = '';
            setGroupMsg(''); setSelfHideMsg(''); syncSelfHideToggle();
            $('group-student-email').value = ''; setStudentMsg('');
            $('group-members-title').innerText = 'Thành viên';
            $('group-members-list').innerHTML = '<div class="chat-empty">Đang tải danh sách...</div>';
            $('modal-group-info').style.display = 'flex';
            loadGroupMembers();
        }
        function closeGroupInfo() { const m = $('modal-group-info'); if (m) m.style.display = 'none'; }

        function setStudentMsg(text, type) {
            const el = $('group-student-msg');
            el.className = 'group-msg' + (type ? ' ' + type : '');
            el.innerText = text || '';
            el.style.display = text ? 'block' : 'none';
        }
        // Lớp Trưởng thêm học sinh bằng email: tìm users theo email -> arrayUnion(uid) vào groups/{gid}.members (rules kiểm tra lại quyền ở máy chủ)
        async function addStudentToGroup() {
            if (groupInfoBusy || !MY_GROUP || !isMonitorMe()) return;
            const email = $('group-student-email').value.trim().toLowerCase();
            if (!email) return setStudentMsg('Vui lòng nhập Email học sinh.', 'err');
            if (!EMAIL_RE.test(email)) return setStudentMsg('Email không đúng định dạng. Ví dụ: hocsinh@gmail.com', 'err');
            const gid = MY_GROUP.gid, btn = $('btn-add-student');
            groupInfoBusy = true; btn.disabled = true; btn.innerText = 'Đang kiểm tra...'; setStudentMsg('');
            let step = 'tra cứu email';
            try {
                const q = await fbDb.collection('users').where('email', '==', email).limit(1).get();   // .limit(1) bắt buộc để khớp firestore.rules
                if (q.empty) { setStudentMsg('Email không tồn tại trên hệ thống', 'err'); return eduAlert('Email không tồn tại trên hệ thống', 'error'); }
                if (q.docs[0].data().role !== 'student') return setStudentMsg('Tài khoản này không phải học sinh. Lớp Trưởng chỉ thêm được học sinh.', 'err');
                const uid = q.docs[0].id, nm = q.docs[0].data().name || 'Học sinh';
                const ref = fbDb.collection('groups').doc(gid), ms = ((await ref.get()).data() || {}).members || [];
                if (ms.includes(uid)) { renderGroupMembers(ms); return setStudentMsg(nm + ' đã có trong nhóm rồi.', 'err'); }
                step = 'cập nhật nhóm';
                await ref.update({ members: firebase.firestore.FieldValue.arrayUnion(uid) });
                $('group-student-email').value = '';
                setStudentMsg('Đã thêm ' + nm + ' vào nhóm.', 'ok');
                await loadGroupMembers();
                eduAlert('Đã thêm ' + nm + ' vào ' + (MY_GROUP ? MY_GROUP.name : 'nhóm') + '.', 'success');
            } catch (err) {
                console.error("Lỗi chi tiết:", err);
                const denied = err && (err.code === 'permission-denied' || /permission/i.test(err.message || ''));
                setStudentMsg(denied ? 'Không có quyền thực hiện (bước: ' + step + '). Hãy chắc chắn firestore.rules mới nhất đã được Publish và bạn đang là Lớp Trưởng của nhóm.' : 'Lỗi: ' + (err && err.message || err), 'err');
            } finally {
                groupInfoBusy = false; btn.disabled = false; btn.innerText = 'Thêm vào nhóm';
            }
        }
        async function addTeacherToGroup() {
            if (groupInfoBusy || !MY_GROUP) return;
            const email = $('group-teacher-email').value.trim().toLowerCase();
            if (!email) return setGroupMsg('Vui lòng nhập Email của Giáo viên bộ môn.', 'err');
            if (!EMAIL_RE.test(email)) return setGroupMsg('Email không đúng định dạng. Ví dụ: giaovien@gmail.com', 'err');
            const gid = MY_GROUP.gid, btn = $('btn-add-teacher');
            groupInfoBusy = true; btn.disabled = true; btn.innerText = 'Đang kiểm tra...'; setGroupMsg('');
            try {
                // 1) Email có tồn tại, và là tài khoản Giáo viên đã được duyệt hay không
                const q = await fbDb.collection('users').where('email', '==', email).where('role', '==', 'teacher').where('status', '==', 'approved').limit(1).get();
                if (q.empty) return setGroupMsg('Không tìm thấy tài khoản Giáo viên nào dùng email "' + email + '". Hãy kiểm tra lại email; giáo viên cần đã đăng ký và được quản trị viên duyệt (tài khoản học sinh không thể thêm vào đây).', 'err');
                const tid = q.docs[0].id, t = q.docs[0].data(), tname = t.name || 'Giáo viên';
                // 2) Đã ở trong nhóm chưa
                const ref = fbDb.collection('groups').doc(gid), snap = await ref.get(), ms = (snap.data() || {}).members || [];
                if (ms.includes(tid)) { renderGroupMembers(ms); return setGroupMsg('Giáo viên ' + tname + ' đã có trong nhóm rồi.', 'err'); }
                // 3) Thêm vào danh sách thành viên
                await ref.update({ members: firebase.firestore.FieldValue.arrayUnion(tid) });
                TEACHER_CACHE[tid] = { name: tname };
                $('group-teacher-email').value = '';
                setGroupMsg('Đã thêm Giáo viên ' + tname + ' vào nhóm.', 'ok');
                await loadGroupMembers();
                eduAlert('Đã thêm Giáo viên ' + tname + ' vào ' + (MY_GROUP ? MY_GROUP.name : 'nhóm') + '.', 'success');
            } catch (e) {
                console.error("Lỗi chi tiết:", e);
                const denied = e && (e.code === 'permission-denied' || /permission/i.test(e.message || ''));
                setGroupMsg(denied ? 'Không có quyền thực hiện. Hãy chắc chắn firestore.rules của Bước 9B đã được Publish trên Firebase.' : 'Lỗi: ' + (e && e.message || e), 'err');
            } finally {
                groupInfoBusy = false; btn.disabled = false; btn.innerText = 'Thêm vào nhóm';
            }
        }
        const CLASS_AV = initialsAv('CL', '#8b5cf6', 2);
        // normSchool đã được khai báo ở khối helper Phần 2 (phía trên)
        const tsOf = m => (m && m.createdAt && m.createdAt.toMillis) ? m.createdAt.toMillis() : Date.now();
        const pad2 = x => String(x).padStart(2, '0');
        const fmtShort = ms => { const d = new Date(ms), n = new Date(); return d.toDateString() === n.toDateString() ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1); };
        const fmtFull = ms => { const d = new Date(ms), n = new Date(), hm = pad2(d.getHours()) + ':' + pad2(d.getMinutes()); return d.toDateString() === n.toDateString() ? hm : hm + ', ' + pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1); };
        const GAP_MS = 20 * 60 * 1000, MAX_PREVIEW = 40;
        let chatTab = 'chats', unsubRoom = null, chatListTimer = 0;
        const PREV = {}, PREV_UNSUB = {};   // xem trước tin cuối của từng cuộc trò chuyện (tối đa MAX_PREVIEW nghe cùng lúc)

        // Giáo viên CÙNG TRƯỜNG với học sinh, loại giáo viên đã bật "Ẩn thông tin" (isPrivate)
        function teachersOfMySchool() {
            if (!user.targetSchoolName) return [];
            return Object.entries(PROFILES)
                .filter(([id, p]) => id !== ME.uid && p.role === 'teacher' && p.isPrivate !== true && inMySchool(p))   // Phần 2: so khớp cả tên trường + tỉnh
                .map(([id, p]) => ({ id, p }))
                .sort((a, b) => String(a.p.name || '').localeCompare(String(b.p.name || ''), 'vi'));
        }
        // Danh sách trò chuyện chung: KHÔNG gồm giáo viên (giáo viên nằm riêng ở tab "Giáo viên trường tôi")
        function generalContacts() {
            if (!user.targetSchoolId) return [];
            return Object.keys(BXH).filter(id => id !== ME.uid && BXH[id].s === user.targetSchoolId)
                .map(id => ({ id, p: PROFILES[id] || liteProfile(id) }));
        }
        function watchPreview(id) {
            if (PREV_UNSUB[id] || Object.keys(PREV_UNSUB).length >= MAX_PREVIEW) return;
            PREV_UNSUB[id] = msgsRef(id).orderBy('createdAt', 'desc').limit(1).onSnapshot(s => {
                const m = s.docs[0] && s.docs[0].data();
                PREV[id] = m ? { text: m.text, mine: m.from === ME.uid, name: m.name || '', t: tsOf(m) } : { none: true };
                scheduleChatList();
            }, () => {});
        }
        // Gỡ các listener xem trước khi đóng cửa sổ nhắn tin: nếu để chạy ngầm thì mỗi tin mới trong "Phòng chung"
        // / nhóm lớp sẽ tốn thêm 1 lượt đọc cho MỖI học sinh đang mở trang, dù không ai nhìn thấy danh sách.
        // Mở lại thì renderChatList tự đăng ký lại (dữ liệu xem trước cũ trong PREV vẫn hiện ngay, rồi cập nhật).
        function stopPreviews() {
            Object.keys(PREV_UNSUB).forEach(k => { try { PREV_UNSUB[k](); } catch (e) {} delete PREV_UNSUB[k]; });
        }
        function scheduleChatList() {
            if (chatListTimer) return;
            chatListTimer = setTimeout(() => { chatListTimer = 0; if (listVisible()) renderChatList(); }, 120);
        }
        const listVisible = () => $('modal-mxh').style.display === 'flex' && $('mxh-chat-section').style.display === 'block' && $('chat-room-view').style.display === 'none';

        function switchChatTab(tab) {
            chatTab = tab; $('chat-search').value = ''; renderChatList();
        }
        function previewLine(id, fallback) {
            const v = PREV[id];
            if (!v || v.none) return { html: esc(fallback || 'Nhấn để bắt đầu trò chuyện'), t: 0 };
            const who = v.mine ? 'Bạn: ' : ((id === 'class' || isGroupId(id)) && v.name ? v.name + ': ' : '');
            return { html: esc(who + v.text), t: v.t };
        }
        function chatRowHtml(r) {
            return `<div class="chat-friend-item${r.grp ? ' pin-group' : ''}" onclick="openChat('${r.id}')"><img loading="lazy" decoding="async" width="48" height="48" class="cl-av" src="${esc(r.avatar)}" alt=""${(!r.grp && r.id !== 'class') ? ` onclick="event.stopPropagation();openUserCard('${esc(r.id)}')"` : ''}><div class="cl-main"><div class="cl-top"><span class="cl-name">${esc(r.name)}</span><span class="cl-time">${r.t ? fmtShort(r.t) : ''}</span></div><div class="cl-prev">${r.tag ? `<span class="cl-tag${r.grp ? ' grp' : ''}">${esc(r.tag)}</span>` : ''}${r.prev}</div></div></div>`;
        }
        function renderChatList() {
            const box = $('friends-avatar-list'), note = $('chat-list-note');
            const q = foldVN($('chat-search').value.trim());
            const teachers = teachersOfMySchool();
            $('chat-seg-chats').classList.toggle('active', chatTab === 'chats');
            $('chat-seg-teachers').classList.toggle('active', chatTab === 'teachers');
            const cnt = $('chat-seg-count'); cnt.style.display = teachers.length ? '' : 'none'; cnt.innerText = teachers.length;

            if (chatTab === 'teachers') {
                if (!user.targetSchoolName) {
                    note.innerText = '';
                    box.innerHTML = '<div class="chat-empty"><svg class=ic aria-hidden=true><use href=#i-domain></use></svg> <b>Bạn chưa chọn trường.</b><br>Hãy chọn trường để xem các giáo viên cùng trường với bạn.<br><button type="button" class="btn-primary" onclick="closeMxh(); openSchoolModal();">Chọn trường ngay</button></div>';
                    return;
                }
                note.innerText = 'Giáo viên thuộc ' + user.targetSchoolName + '. Giáo viên bật chế độ "Ẩn thông tin" sẽ không hiển thị.';
                let rows = teachers.map(({ id, p }) => { watchPreview(id); const pv = previewLine(id, 'Giáo viên' + (p.subject ? ' ' + p.subject : ''));
                    return { id, name: p.name || 'Giáo viên', avatar: avatarOf(id, p.name), prev: pv.html, t: pv.t, tag: p.subject || 'GV', key: foldVN((p.name || '') + ' ' + (p.subject || '')) }; });
                if (q) rows = rows.filter(r => r.key.includes(q));
                box.innerHTML = rows.length ? rows.map(chatRowHtml).join('')
                    : '<div class="chat-empty">' + (q ? '<svg class=ic aria-hidden=true><use href=#i-close-circle></use></svg> Không tìm thấy giáo viên phù hợp.' : '<svg class=ic aria-hidden=true><use href=#i-school></use></svg> <b>Chưa có giáo viên nào của trường bạn.</b><br>Giáo viên sẽ hiện ở đây khi đã đăng ký đúng trường của bạn và không bật chế độ Ẩn thông tin.') + '</div>';
                return;
            }

            // Tab Trò chuyện: Cả lớp + bạn bè (không có giáo viên)
            note.innerText = '';
            const myCls = String(user.schoolClass || '').trim().toUpperCase();
            const contacts = generalContacts().sort((a, b) => ((String(b.p.cls || '').trim().toUpperCase() === myCls) - (String(a.p.cls || '').trim().toUpperCase() === myCls)) || String(a.p.name || '').localeCompare(String(b.p.name || ''), 'vi'));
            if (MY_GROUP) watchPreview(MY_GROUP.id);
            watchPreview('class'); contacts.forEach(c => watchPreview(c.id));
            const cls = previewLine('class', 'Phòng trò chuyện chung của mọi người');
            const gp = MY_GROUP ? previewLine(MY_GROUP.id, 'Nhóm chung của cả lớp ' + user.schoolClass) : null;
            let rows = (MY_GROUP ? [{ id: MY_GROUP.id, name: MY_GROUP.name, avatar: groupAv(user.schoolClass), prev: gp.html, t: gp.t, tag: 'Nhóm lớp', grp: true, key: foldVN(MY_GROUP.name), pin: true }] : [])
                .concat([{ id: 'class', name: 'Phòng chung', avatar: CLASS_AV, prev: cls.html, t: cls.t, key: 'phong chung', pin: true }])
                .concat(contacts.map(({ id, p }) => { const pv = previewLine(id, p.cls ? 'Lớp ' + p.cls : ''); return { id, name: p.name || 'Học sinh', avatar: avatarOf(id, p.name), prev: pv.html, t: pv.t, key: foldVN(p.name || '') }; }));
            if (q) rows = rows.filter(r => r.key.includes(q));
            const pinned = rows.filter(r => r.pin), rest = rows.filter(r => !r.pin).sort((a, b) => b.t - a.t);   // người mới nhắn gần đây lên đầu (sort ổn định: giữ thứ tự lớp/tên khi bằng nhau)
            const all = pinned.concat(rest);
            box.innerHTML = all.length ? all.map(chatRowHtml).join('') : '<div class="chat-empty"><svg class=ic aria-hidden=true><use href=#i-close-circle></use></svg> Không tìm thấy kết quả phù hợp.</div>';
        }

        function stopRoomListener() { if (unsubRoom) { unsubRoom(); unsubRoom = null; } }
        function showChatRoom(on) { $('chat-room-view').style.display = on ? 'block' : 'none'; $('chat-list-view').style.display = on ? 'none' : 'block'; }
        function closeChatRoom() { stopRoomListener(); curChatId = null; closeGroupInfo(); showChatRoom(false); if ($('modal-mxh').style.display === 'flex') renderChatList(); }
        function closeMxh() { stopRoomListener(); stopPreviews(); closeGroupInfo(); closeModal('modal-mxh'); }

        function openChat(id) {
            const p = PROFILES[id] || liteProfile(id), isGroup = isGroupId(id);
            if (isGroup && (!MY_GROUP || MY_GROUP.id !== id)) return;
            if (id !== 'class' && !isGroup) {
                if (!p || !inMySchool(p)) return;   // Phần 2: không mở trò chuyện riêng với người khác trường
                if (p.role === 'teacher' && p.isPrivate === true) return eduAlert('Giáo viên này đã ẩn thông tin.', 'warning');
            }
            curChatId = id;
            const isClass = id === 'class';
            $('chat-head-av').src = isGroup ? groupAv(user.schoolClass) : isClass ? CLASS_AV : avatarOf(id, p.name);
            $('chat-head-av').onclick = (isGroup || isClass) ? null : () => openUserCard(id); $('chat-head-av').style.cursor = (isGroup || isClass) ? '' : 'pointer';
            $('active-chat-name').innerText = isGroup ? MY_GROUP.name : isClass ? 'Phòng chung' : (p.name || '');
            $('active-chat-sub').innerText = isGroup ? groupSub() : isClass ? 'Phòng trò chuyện chung của mọi người'
                : (p.role === 'teacher' ? 'Giáo viên' + (p.subject ? ' ' + p.subject : '') + (p.school ? ' • ' + p.school : '') : (p.cls ? 'Lớp ' + p.cls : 'Học sinh'));
            $('chat-messages-body').innerHTML = ''; ROOM_MSGS = [];
            $('chat-info-btn').style.display = isGroup ? 'flex' : 'none';
            updateChatClearBtn();   // Bước 9B: nút Cài đặt nhóm chỉ có ở Nhóm Chat Lớp
            if (id !== 'class' && !isGroup) ensureProfiles([id]);
            showChatRoom(true);
            stopRoomListener();
            if (isGroup) fbDb.collection('groups').doc(MY_GROUP.gid).get().then(d => { const gd = d.data() || {}, ms = gd.members; if (ms && curChatId === id) { MY_GROUP.hidden = Array.isArray(gd.hiddenMembers) ? gd.hiddenMembers : []; MY_GROUP.n = visibleMembers(ms).length; $('active-chat-sub').innerText = groupSub(); } }).catch(() => {});   // cập nhật số thành viên
            unsubRoom = msgsRef(id).orderBy('createdAt').limitToLast(60).onSnapshot(s => {
                ROOM_MSGS = s.docs.map(d => ({ id: d.id, ...d.data() })); ensureProfiles(ROOM_MSGS.map(m => m.from)); const arr = ROOM_MSGS, b = $('chat-messages-body');
                if (arr.length) { const l = arr[arr.length - 1]; PREV[id] = { text: l.text, mine: l.from === ME.uid, name: l.name || '', t: tsOf(l) }; }
                b.innerHTML = arr.length ? renderMsgs(arr, isClass || isGroup) : '<div class="chat-empty"><svg class=ic aria-hidden=true><use href=#i-hand-wave></use></svg> Hãy gửi lời chào đầu tiên!</div>';
                b.scrollTop = b.scrollHeight;
            }, e => { $('chat-messages-body').innerHTML = '<p style="font-size:12px;color:#ef4444;padding:10px;">' + esc(e.message) + '</p>'; });
        }
        function renderMsgs(arr, isClass) {
            const grp = !!(MY_GROUP && curChatId && isGroupId(curChatId));
            const canDel = grp && !!MY_GROUP.mon && MY_GROUP.mon === ME.uid;   // chỉ Lớp Trưởng của nhóm mới thấy nút xóa
            const badge = uid => !grp ? '' : uid === MY_GROUP.hr ? '<span class="role-badge hr">GVCN</span>' : (MY_GROUP.mon && uid === MY_GROUP.mon) ? '<span class="role-badge mon">Lớp Trưởng</span>' : '';
            const delBtn = m => (canDel && m.id) ? `<button type="button" class="msg-del" title="Xóa tin nhắn" aria-label="Xóa tin nhắn" onclick="deleteGroupMsg('${esc(m.id)}')"><svg class=ic aria-hidden=true><use href=#i-delete></use></svg></button>` : '';
            let html = '';
            arr.forEach((m, i) => {
                const prev = arr[i - 1], next = arr[i + 1], t = tsOf(m), mine = m.from === ME.uid;
                const newGroup = !prev || prev.from !== m.from || (t - tsOf(prev)) > GAP_MS;
                const endGroup = !next || next.from !== m.from || (tsOf(next) - t) > GAP_MS;
                if (!prev || (t - tsOf(prev)) > GAP_MS) html += `<div class="chat-time">${fmtFull(t)}</div>`;
                const bubble = `<div class="chat-bubble ${mine ? 'mine' : 'other'}${newGroup ? '' : ' cont-up'}${endGroup ? '' : ' cont-down'}">${esc(m.text)}</div>`;
                const del = delBtn(m);
                if (mine) { html += `<div class="msg-row mine${newGroup ? ' first' : ''}"><div class="msg-col">${del ? `<div class="bubble-row">${del}${bubble}</div>` : bubble}</div></div>`; return; }
                html += `<div class="msg-row other${newGroup ? ' first' : ''}"><img loading="lazy" decoding="async" width="26" height="26" class="msg-av${endGroup ? '' : ' ghost'}" src="${esc(avatarOf(m.from, m.name))}" alt=""${endGroup ? ` onclick="openUserCard('${esc(m.from)}')" style="cursor:pointer"` : ''}><div class="msg-col">${isClass && newGroup ? `<div class="msg-name">${esc(m.name || '')}${badge(m.from)}</div>` : ''}${del ? `<div class="bubble-row">${bubble}${del}</div>` : bubble}</div></div>`;
            });
            return html;
        }
        // ===== THẺ TRANG CÁ NHÂN (bấm vào avatar ở BXH / danh sách chat / tin nhắn) =====
        // Chỉ dùng dữ liệu công khai sẵn có (profiles + BXH). Tuân theo quy tắc nhắn tin: chỉ xem người CÙNG TRƯỜNG, giáo viên bật "Ẩn thông tin" thì không hiện.
        // Công tắc "Chế độ riêng tư": mặc định TẮT (không có trường coverHidden = cho xem). BẬT = coverHidden:true -> người khác xem thẻ chỉ thấy avatar + tên, các thông tin còn lại hiện "Đã ẩn". Lưu coverHidden trong profiles/{uid}.
        function syncCoverShare() {
            const on = !!(user && user.coverHidden === true);
            document.querySelectorAll('.cover-share-cb').forEach(c => { c.checked = on; });
        }
        function setCoverShare(on) {
            if (!ME) return;
            const prev = user.coverHidden === true; user.coverHidden = !!on; syncCoverShare();
            fbDb.collection('profiles').doc(ME.uid).set({ coverHidden: !!on }, { merge: true })
                .then(() => { if (typeof eduToast === 'function') eduToast(on ? 'Đã bật chế độ riêng tư: người khác chỉ thấy ảnh đại diện và tên của bạn.' : 'Đã tắt chế độ riêng tư.', 'success'); })
                .catch(e => { user.coverHidden = prev; syncCoverShare(); eduAlert('Chưa lưu được cài đặt: ' + e.message, 'error'); });
        }
        let UC_ID = '';
        const COVER_CACHE = {};   // uid -> dataURL ảnh bìa (chỉ nhớ lần tải THÀNH CÔNG, lỗi quyền thì lần sau thử lại)
        const COVER_OK = c => (typeof c === 'string' && c.length < 700000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(c)) ? c : '';
        function showUserCover(uid, c, fade) {
            if (UC_ID !== uid) return;
            const b = $('uc-banner'); if (!b) return;
            b.style.backgroundImage = '';
            if (c) b.style.setProperty('--uc-cover', 'linear-gradient(rgba(15,23,42,.12), rgba(15,23,42,.28)), url("' + c + '")'); else b.style.removeProperty('--uc-cover');
            b.classList.toggle('cover-fade', !!c && !!fade);   // chỉ làm hiệu ứng mờ dần khi ảnh về trễ; ảnh đã có sẵn thì hiện ngay
            b.classList.toggle('has-cover', !!c);
        }
        // Tải ảnh bìa (có nhớ + chống tải trùng) và giải mã sẵn để lúc mở thẻ ảnh hiện ngay, không phải chờ ~1 giây
        const COVER_PEND = {};   // uid -> Promise đang tải
        function coverFetch(uid) {
            if (uid in COVER_CACHE) return Promise.resolve(COVER_CACHE[uid]);
            if (COVER_PEND[uid]) return COVER_PEND[uid];
            return COVER_PEND[uid] = fbDb.collection('covers').doc(uid).get().then(d => {
                const c = d.exists ? COVER_OK((d.data() || {}).cover) : ''; COVER_CACHE[uid] = c;
                if (c) { const im = new Image(); im.src = c; if (im.decode) im.decode().catch(() => {}); }
                return c;
            }).catch(() => '').then(c => { delete COVER_PEND[uid]; return c; });
        }
        function coverPrefetch(uid) {
            try {
                if (!ME || !uid || uid === ME.uid || uid in COVER_CACHE || COVER_PEND[uid]) return;
                const p = ucardAllowed(uid); if (!p || p.role === 'teacher' || p.coverHidden === true) return;
                coverFetch(uid);
            } catch (e) {}
        }
        function coverWarm(ids) { (ids || []).forEach((u, i) => setTimeout(() => coverPrefetch(u), 150 * i)); }   // dàn trải để không nghẽn mạng
        ['pointerover', 'touchstart', 'focusin'].forEach(ev => document.addEventListener(ev, e => {   // rê chuột / chạm vào người nào -> tải trước ảnh bìa của người đó
            const el = e.target && e.target.closest && e.target.closest('[onclick*="openUserCard("]'); if (!el) return;
            const m = /openUserCard\(\s*['"]([^'"]+)['"]/.exec(el.getAttribute('onclick') || ''); if (m) coverPrefetch(m[1]);
        }, { passive: true, capture: true }));
        function loadUserCover(uid, teacher) {
            showUserCover(uid, '');
            if (teacher) return;
            if (uid === ME.uid) return showUserCover(uid, COVER_OK(user.cover));
            if (uid in COVER_CACHE) return showUserCover(uid, COVER_CACHE[uid]);
            coverFetch(uid).then(c => showUserCover(uid, c, true));
        }
        function ucardAllowed(uid) {
            if (!ME || !uid || window.EXAM_LOCKED) return null;
            const p = PROFILES[uid] || liteProfile(uid);
            if (!p) return null;
            if (uid !== ME.uid) {
                if (!inMySchool(p)) return null;
                if (p.role === 'teacher' && p.isPrivate === true) return null;
            }
            return p;
        }
        function fillUserCard(uid) {
            const p = ucardAllowed(uid); if (!p) return closeModal('modal-ucard');
            const isMe = uid === ME.uid, teacher = p.role === 'teacher';
            $('uc-av').src = isMe ? avatarOf(uid, user.name) : avatarOf(uid, p.name);
            $('uc-name').innerText = (isMe ? user.name : p.name) || 'Người dùng';
            let tag = teacher ? 'Giáo viên' + (p.subject ? ' ' + p.subject : '') : 'Học sinh', theme = teacher ? 't-teacher' : '';
            if (MY_GROUP && uid === MY_GROUP.hr) { tag = 'GVCN'; theme = 't-hr'; } else if (MY_GROUP && MY_GROUP.mon && uid === MY_GROUP.mon) { tag = 'Lớp Trưởng'; theme = 't-mon'; }
            const priv = !isMe && !teacher && p.coverHidden === true;   // đang bật chế độ riêng tư
            $('uc-role').innerText = priv ? 'Đã ẩn' : tag;
            $('uc-card').className = 'ucard' + (theme ? ' ' + theme : '');
            const stats = [], rows = [];
            if (priv) { let px = null; try { px = BXH[uid] ? bxhTotal(BXH[uid]) : null; } catch (e) {} stats.push(['Đã ẩn', 'Lớp'], [typeof px === 'number' ? String(px) : 'Đã ẩn', 'Điểm XP'], ['Đã ẩn', 'Hạng']); rows.push(['Trường', 'Đã ẩn']); }   // XP vẫn hiện vì BXH đã công khai
            else if (!teacher) {
                const c = isMe ? user.schoolClass : p.cls; if (c) stats.push([String(c), 'Lớp']);
                try {
                    const x = isMe ? sumXp()[ME.uid] : (BXH[uid] ? bxhTotal(BXH[uid]) : null);
                    if (typeof x === 'number') stats.push([String(x), 'Điểm XP']);
                    const rk = bxhRows(e => !!user.targetSchoolId && e.s === user.targetSchoolId), ri = rk.findIndex(r => r.id === uid);
                    if (ri >= 0) stats.push(['#' + (ri + 1), 'Hạng', ri < 3 ? ['#f59e0b', '#94a3b8', '#b45309'][ri] : '']);
                } catch (e) {}
            }
            $('uc-stats').innerHTML = stats.map(s => '<div class="uc-stat"><b>' + (s[2] ? ico('medal', s[2]) + ' ' : '') + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small></div>').join('');
            const sn = teacher ? (p.school || '') : schoolNameOf(isMe ? { role: 'student', targetSchoolId: user.targetSchoolId, targetSchoolName: user.targetSchoolName } : p);
            if (sn && !priv) rows.push(['Trường', sn]);
            $('uc-rows').innerHTML = rows.map(r => '<div class="uc-row"><span>' + (r[0] === 'Trường' ? ico('domain') + ' ' : '') + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>').join('');
            $('uc-private').style.display = priv ? '' : 'none';   // bạn này bật "Chế độ riêng tư"
            $('uc-chat').style.display = isMe ? 'none' : '';
        }
        function openUserCard(uid) {
            if (!ucardAllowed(uid)) return;
            UC_ID = uid; fillUserCard(uid);
            { const pp = ucardAllowed(uid); loadUserCover(uid, !!pp && (pp.role === 'teacher' || (uid !== ME.uid && pp.coverHidden === true))); }
            $('modal-ucard').style.display = 'flex';
            if (uid !== ME.uid && !PROFILES[uid]) {   // chưa tải hồ sơ đầy đủ (avatar...) -> tải rồi vẽ lại thẻ nếu vẫn đang mở
                ensureProfiles([uid]);
                setTimeout(() => { if (UC_ID === uid && $('modal-ucard').style.display === 'flex') fillUserCard(uid); }, 800);
            }
        }
        function ucardChat() {
            const uid = UC_ID; if (!uid || !ucardAllowed(uid) || uid === ME.uid) return;
            closeModal('modal-ucard');
            if ($('modal-mxh').style.display !== 'flex') openNhanTin();
            openChat(uid);
        }
        function sendChatMessage() { const i = $('chat-text-input'), t = i.value.trim(); if (!t || !curChatId) return;
            msgsRef(curChatId).add({ from: ME.uid, name: user.name, text: t.slice(0, 500), createdAt: NOW() }).then(() => i.value = '')
                .catch(e => eduAlert(isGroupId(curChatId) && e && e.code === 'permission-denied' ? 'Bạn không thể gửi tin nhắn trong nhóm này (có thể bạn đã bị xóa khỏi nhóm).' : e.message, 'error')); }
        // Mỗi ô mở riêng 1 trang: Orient New chỉ có Bảng tin, Nhắn tin chỉ có Tin nhắn (ẩn thanh chuyển tab)
        function setMxhScope(scope) {
            $('modal-mxh').classList.toggle('mxh-chat-scope', scope === 'chat');   // chỉ khung Tin nhắn mới phủ gần kín màn hình (desktop)
            $('mxh-tabnav').style.display = 'none';
            $('mxh-title').innerHTML = scope === 'chat' ? '<svg class=ic aria-hidden=true><use href=#i-chat></use></svg> Nhắn tin' : '<svg class=ic aria-hidden=true><use href=#i-compass></use></svg> Orient New';
        }
        function openMXHHocTap() { setMxhScope('feed'); startPostsListener(); renderPosts(); switchMxhTab('feed'); $('modal-mxh').style.display = 'flex'; }
        // Yêu cầu 6: từ Tab Tài khoản mở thẳng mục "Tin Nhắn"
        function openNhanTin() { if (window.EXAM_LOCKED) return; setMxhScope('chat'); $('modal-mxh').style.display = 'flex'; chatTab = 'chats'; switchMxhTab('chat'); }

        // ---- Chỉnh sửa hồ sơ, ảnh đại diện, đổi mật khẩu ----
        function resizeImage(file, size, cb) {
            const r = new FileReader(); r.onload = e => { const img = new Image(); img.onload = () => {
                const c = document.createElement('canvas'), m = Math.min(img.width, img.height); c.width = c.height = size;
                c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size); cb(c.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; r.readAsDataURL(file);
        }
        // ---- Ảnh bìa thẻ hồ sơ: lưu riêng tư ở privates/{uid} = { cover: dataURL, coverPos: { ox, oy, z } } (chỉ chủ tài khoản đọc). ox/oy = độ dời theo tỉ lệ rộng/cao thẻ, z = phóng to 1..2.5 ----
        let coverNat = null, coverEd = null, coverDrag = null, coverUrlShown = '';
        const coverClamp = (v, a, b) => Math.max(a, Math.min(b, v));
        // Bản sao CÔNG KHAI của ảnh bìa: covers/{uid} = { cover, coverPos } (chủ tài khoản ghi; chủ tài khoản + phụ huynh đã liên kết đọc). privates vẫn là bản gốc.
        function mirrorCover(c, p) {
            if (!ME) return; const uid = ME.uid, k = 'eo_cover_mirror_' + uid, d = fbDb.collection('covers').doc(uid);
            if (!c) { d.delete().then(() => { try { localStorage.removeItem(k); } catch (e) {} }).catch(() => {}); return; }
            const data = { cover: c }; if (p) data.coverPos = p;
            const sig = c.length + ':' + JSON.stringify(p || null);
            d.set(data).then(() => { try { localStorage.setItem(k, sig); } catch (e) {} }).catch(() => {});
        }
        function mirrorCoverIfNeeded() {   // ảnh bìa có từ trước khi có tính năng này: tự sao sang covers/ đúng 1 lần
            if (!ME || !user.cover) return; let last = null; try { last = localStorage.getItem('eo_cover_mirror_' + ME.uid); } catch (e) {}
            if (last !== user.cover.length + ':' + JSON.stringify(user.coverPos || null)) mirrorCover(user.cover, user.coverPos);
        }
        function coverBounds(z) {
            const card = $('profile-card'), cw = card.clientWidth, ch = card.clientHeight; let mx = 0, my = 0;
            if (coverNat) { const sc = Math.max(cw / coverNat.w, ch / coverNat.h); mx = Math.max(0, (coverNat.w * sc * z - cw) / 2); my = Math.max(0, (coverNat.h * sc * z - ch) / 2); }
            return { cw, ch, mx, my };
        }
        function coverApply() {
            const img = $('profile-cover-img'), cardEl = $('profile-card');
            // Tab Tài khoản đang ẩn (display:none) thì thẻ rộng 0px -> KHÔNG tính kích thước lúc này (trước đây ảnh bị co về 0px nên load lại web không thấy ảnh bìa). Sẽ tính lại khi thẻ hiện ra.
            if (!img || !cardEl || !cardEl.clientWidth || !cardEl.clientHeight) return;
            const p = user.coverPos || { ox: 0, oy: 0, z: 1 }, z = coverClamp(Number(p.z) || 1, 1, 2.5), b = coverBounds(z);
            const tx = coverClamp((Number(p.ox) || 0) * b.cw, -b.mx, b.mx), ty = coverClamp((Number(p.oy) || 0) * b.ch, -b.my, b.my);
            if (coverNat) {   // phần tử = đúng cỡ ảnh khi đã phủ kín thẻ (cover); dời / phóng to xong vẫn còn ảnh ở mọi mép
                const sc = Math.max(b.cw / coverNat.w, b.ch / coverNat.h);
                img.style.width = coverNat.w * sc + 'px'; img.style.height = coverNat.h * sc + 'px'; img.style.backgroundSize = '100% 100%';
            } else { img.style.width = img.style.height = '100%'; img.style.backgroundSize = 'cover'; }
            img.style.transform = 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(' + z + ')';
        }
        function renderCover() {
            const card = $('profile-card'), img = $('profile-cover-img'); if (!card || !img) return;
            const url = user.cover || '';
            if (url !== coverUrlShown) {
                coverUrlShown = url; coverNat = null; img.style.backgroundImage = url ? 'url("' + url + '")' : 'none';
                if (url) { const im = new Image(); im.onload = () => { if (coverUrlShown === url) { coverNat = { w: im.naturalWidth, h: im.naturalHeight }; coverApply(); } }; im.src = url; }
            }
            card.classList.toggle('has-cover', !!url);
            $('cover-adj').style.display = $('cover-del').style.display = url ? '' : 'none';
            const th = $('cover-thumb'); if (th) th.style.backgroundImage = url ? 'url("' + url + '")' : '';
            coverApply();
        }
        window.addEventListener('resize', () => coverApply());
        // Thẻ hồ sơ vừa hiện ra (đổi sang tab Tài khoản) hoặc đổi cỡ -> căn lại ảnh bìa
        if (window.ResizeObserver && $('profile-card')) new ResizeObserver(() => coverApply()).observe($('profile-card'));
        function pickCover(inp) {
            const f = inp.files && inp.files[0]; inp.value = ''; if (!f || !ME) return;
            if (!/^image\//.test(f.type)) return eduAlert('Hãy chọn một file ảnh.', 'warning');
            const r = new FileReader(); r.onload = e => { const img = new Image(); img.onload = () => {
                let w = Math.min(1600, img.width), q = 0.76, out = '';
                for (let i = 0; i < 5; i++) {
                    const c = document.createElement('canvas'), h = Math.round(img.height * w / img.width); c.width = w; c.height = h;
                    c.getContext('2d').drawImage(img, 0, 0, w, h); out = c.toDataURL('image/jpeg', q);
                    if (out.length <= 600000) break; w = Math.round(w * 0.82); q = Math.max(0.5, q - 0.06);
                }
                const prev = { c: user.cover, p: user.coverPos }; user.cover = out; user.coverPos = null; renderCover();
                fbDb.collection('privates').doc(ME.uid).set({ cover: out, coverPos: firebase.firestore.FieldValue.delete() }, { merge: true })
                    .catch(() => { user.cover = prev.c; user.coverPos = prev.p; renderCover(); eduAlert('Chưa lưu được ảnh bìa, hãy kiểm tra mạng.', 'error'); });
                mirrorCover(out, null);
                coverOpenEditor();   // vừa chọn ảnh xong: mở ngay bảng căn chỉnh với ẢNH GỐC đầy đủ
            }; img.src = e.target.result; }; r.readAsDataURL(f);
        }
        function removeCover() {
            if (!ME || !user.cover) return; const prev = { c: user.cover, p: user.coverPos }; user.cover = ''; user.coverPos = null; renderCover();
            fbDb.collection('privates').doc(ME.uid).set({ cover: firebase.firestore.FieldValue.delete(), coverPos: firebase.firestore.FieldValue.delete() }, { merge: true })
                .catch(() => { user.cover = prev.c; user.coverPos = prev.p; renderCover(); eduAlert('Chưa xóa được ảnh bìa, hãy thử lại.', 'error'); });
            mirrorCover('', null);
        }
        // Căn chỉnh: bảng riêng hiện ẢNH GỐC đầy đủ + khung trắng = phần sẽ hiện trên thẻ. Kéo khung để dời, thanh trượt để phóng to (khung nhỏ lại).
        // Quy đổi: tâm khung so với tâm ảnh (px ảnh) cx = -ox*cw/(z*sc);  ox = -cx*z*sc/cw   (sc = tỉ lệ "cover" của thẻ)
        function coverOpenEditor() {
            if (!user.cover) return;
            const go = () => {
                const card = $('profile-card'), cw = card.clientWidth, ch = card.clientHeight, sc = Math.max(cw / coverNat.w, ch / coverNat.h), p = user.coverPos || {};
                const z = coverClamp(Number(p.z) || 1, 1, 2.5);
                $('modal-cover').style.display = 'flex'; $('cover-stage-img').src = user.cover;
                const st = $('cover-stage'), sw = st.clientWidth, sh = st.clientHeight, d = Math.min(sw / coverNat.w, sh / coverNat.h);
                coverEd = { z, cx: -(Number(p.ox) || 0) * cw / (z * sc), cy: -(Number(p.oy) || 0) * ch / (z * sc), cw, ch, sc, d, il: (sw - coverNat.w * d) / 2, it: (sh - coverNat.h * d) / 2 };
                const im = $('cover-stage-img'); im.style.width = coverNat.w * d + 'px'; im.style.height = coverNat.h * d + 'px'; im.style.left = coverEd.il + 'px'; im.style.top = coverEd.it + 'px';
                $('cover-zoom').value = Math.round(z * 100); coverFrame();
            };
            if (coverNat) go(); else { const im = new Image(); im.onload = () => { coverNat = { w: im.naturalWidth, h: im.naturalHeight }; go(); }; im.src = user.cover; }
        }
        function coverFrame() {
            const e = coverEd; if (!e) return; const fw = e.cw / (e.sc * e.z), fh = e.ch / (e.sc * e.z);
            e.cx = coverClamp(e.cx, -Math.max(0, (coverNat.w - fw) / 2), Math.max(0, (coverNat.w - fw) / 2));
            e.cy = coverClamp(e.cy, -Math.max(0, (coverNat.h - fh) / 2), Math.max(0, (coverNat.h - fh) / 2));
            const f = $('cover-frame'); f.style.width = fw * e.d + 'px'; f.style.height = fh * e.d + 'px';
            f.style.left = e.il + (coverNat.w / 2 + e.cx - fw / 2) * e.d + 'px'; f.style.top = e.it + (coverNat.h / 2 + e.cy - fh / 2) * e.d + 'px';
        }
        function coverDragStart(e) { if (!coverEd) return; coverDrag = { x: e.clientX, y: e.clientY, cx: coverEd.cx, cy: coverEd.cy }; try { $('cover-stage').setPointerCapture(e.pointerId); } catch (x) {} }
        function coverDragMove(e) { if (!coverDrag || !coverEd) return; coverEd.cx = coverDrag.cx + (e.clientX - coverDrag.x) / coverEd.d; coverEd.cy = coverDrag.cy + (e.clientY - coverDrag.y) / coverEd.d; coverFrame(); }
        function coverDragEnd() { coverDrag = null; }
        function coverZoom(v) { if (!coverEd) return; coverEd.z = coverClamp(Number(v) / 100, 1, 2.5); coverFrame(); }
        function coverReset() { if (!coverEd) return; coverEd.z = 1; coverEd.cx = coverEd.cy = 0; $('cover-zoom').value = 100; coverFrame(); }
        function coverCancel() { coverEd = null; coverDrag = null; $('modal-cover').style.display = 'none'; }
        function coverSave() {
            const e = coverEd; if (!e || !ME) return;
            const r4 = n => Math.round(n * 10000) / 10000, np = { ox: r4(-e.cx * e.z * e.sc / e.cw), oy: r4(-e.cy * e.z * e.sc / e.ch), z: r4(e.z) }, prev = user.coverPos;
            user.coverPos = np; coverCancel(); coverApply();
            fbDb.collection('privates').doc(ME.uid).set({ coverPos: np }, { merge: true })
                .catch(() => { user.coverPos = prev; coverApply(); eduAlert('Chưa lưu được vị trí ảnh bìa, hãy kiểm tra mạng.', 'error'); });
            mirrorCover(user.cover, np);
        }
        function pickAvatar(inp) { if (inp.files[0]) resizeImage(inp.files[0], 160, d => { pendingAvatar = d; $('edit-avatar').src = d; }); }
function openEdit() {
            pendingAvatar = null; $('edit-avatar').src = avatarOf(ME.uid, user.name); $('edit-name').value = user.name;
            // 1) Trường trước (quyết định kiểu chọn lớp)
            const curInfo = parseSchoolInfo(user.targetSchoolId);
            setProvince('edit', curInfo ? curInfo.province.id : '', true);   // Tỉnh suy ra từ trường hiện tại (id trường có dạng "<id tỉnh>-<slug>")
            $('searchSchoolInput')._combo.set(ALL_SCHOOLS.find((s) => s.id === user.targetSchoolId) || null); updateClassMode('edit');
            // 2) Rồi tới Lớp, điền theo kiểu của trường
            const clsOk = writeClass('edit', user.schoolClass), note = $('edit-cls-note');
            note.style.display = !clsOk && user.schoolClass ? 'block' : 'none';
            note.innerText = 'Lớp hiện tại "' + (user.schoolClass || '') + '" chưa phù hợp với loại trường. Hãy chọn lại ' + (isSpecialMode('edit') ? 'Khối và Môn chuyên.' : 'Khối, Chữ, Số.');
            $('modal-edit').style.display = 'flex';
        }
        function openPw() {
            const hasPw = ME.providerData.some(p => p.providerId === 'password');
            $('pw-box').innerHTML = hasPw ? '<form id="pw-form" name="pw-form" onsubmit="event.preventDefault();changePw();"><input name="pw-old" aria-label="Mật khẩu cũ" autocomplete="current-password" type="password" id="pw-old" placeholder="Mật khẩu cũ"><input name="pw-new" aria-label="Mật khẩu mới (từ 6 ký tự)" autocomplete="new-password" type="password" id="pw-new" placeholder="Mật khẩu mới (từ 6 ký tự)"><button type="submit" class="btn-primary">Đổi mật khẩu</button></form>'
                : '<p style="font-size:13px;color:var(--text-sub);">Tài khoản này đăng nhập bằng Google nên không có mật khẩu riêng trong EduOrient.</p>';
            $('modal-pw').style.display = 'flex';
        }
function saveEdit() {
            const n = $('edit-name').value.trim();
            if (!n) return eduAlert('Tên không được để trống!', 'warning');
            const r = readSchool('edit', false);   // Trường là tùy chọn, nhưng nếu đã chọn Tỉnh thì phải chọn đủ Trường
            if (!r.ok) return eduAlert(r.msg, 'warning');
            const school = r.school, c = readClass('edit');
            if (!c) return eduAlert(classHelpMsg('edit'), 'warning');
            const schoolChanging = !!school && !!user.targetSchoolName && school.id !== user.targetSchoolId;
            if (schoolChanging) { const st = applyChargeRegen(); if (st.charges <= 0) { renderChargeInfo(); return noChargePopup(st); } }
            const prev = { name: user.name, cls: user.schoolClass, avatar: user.avatar, sid: user.targetSchoolId, sname: user.targetSchoolName, cc: user.schoolChangeCharges, ct: user.lastSchoolChangeTime }, wasLocked = user.isLocked;
            if (schoolChanging) spendCharge();
            user.name = n; user.schoolClass = c; if (pendingAvatar) user.avatar = pendingAvatar;
            if (school) { user.targetSchoolId = school.id; user.targetSchoolName = school.name; }
            Promise.resolve(saveProfile()).then((ok) => {
                if (ok === false) { Object.assign(user, { name: prev.name, schoolClass: prev.cls, avatar: prev.avatar, targetSchoolId: prev.sid, targetSchoolName: prev.sname, schoolChangeCharges: prev.cc, lastSchoolChangeTime: prev.ct }); renderChargeInfo(); return; }
                closeModal('modal-edit');
                if (school && wasLocked) eduAlert(school.name, { icon: 'success', title: 'Mở khóa thành công!' });
                else eduAlert('Đã lưu hồ sơ!', 'success');
            });
        }
        async function changePw() {
            const o = $('pw-old').value, n = $('pw-new').value; if (!o || n.length < 6) return eduAlert('Nhập mật khẩu cũ và mật khẩu mới (từ 6 ký tự).', 'warning');
            try { await ME.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(ME.email, o)); await ME.updatePassword(n); $('pw-old').value = $('pw-new').value = ''; closeModal('modal-pw'); eduAlert('Đổi mật khẩu thành công!', 'success'); }
            catch (e) { eduAlert(e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'Mật khẩu cũ không đúng.' : 'Lỗi: ' + e.message, 'error'); }
        }

        initPickers();
        switchBXH('thpt');

        // ---- Khởi động ----
        // Trang này chỉ dành cho học sinh đã đăng nhập; còn lại đưa về index.html để đăng nhập/điều phối
        // Trả về dữ liệu users/{uid} nếu là tài khoản học sinh, ngược lại trả về null
        async function getStudentAccount(u) {
            if (!u.email) return null;
            try { const snap = await fbDb.collection('users').doc(u.uid).get(); return snap.exists && snap.data().role === 'student' ? snap.data() : null; }
            catch (e) { return null; }
        }

        // ---- Mã học sinh (ID): tài khoản cũ chưa có thì KHÓA màn hình cho đến khi cập nhật thành công ----
        // Quy tắc phải khớp index.html và firestore.rules: bỏ khoảng trắng, viết HOA, 3-20 ký tự [A-Z0-9._-]
        const normStudentId = v => String(v || '').replace(/\s+/g, '').toUpperCase().trim();
        const validStudentId = v => /^[A-Z0-9._-]{3,20}$/.test(v);
        let SID_RESOLVE = null, SID_BUSY = false;
        function requireStudentId(u, acc) {
            if (String(acc.studentId || '').trim()) {   // đã có mã -> vào app bình thường
                const raw = String(acc.studentId).trim(), upperId = normStudentId(raw);
                MY_SID = upperId; renderStudentId();   // hiển thị IN HOA ngay lập tức
                if (validStudentId(upperId)) {   // tài khoản cũ: chuyển IN HOA và/hoặc ghi mã vào sổ đăng ký studentIds (chống trùng) - âm thầm, không chặn app nếu lỗi
                    const reg = fbDb.collection('studentIds').doc(upperId);
                    reg.get().then(ex => {
                        if (ex.exists && ex.data().uid !== u.uid) return console.warn('Mã học sinh này đang bị tài khoản khác giữ (trùng từ trước).');
                        const b = fbDb.batch(); let n = 0;
                        if (!ex.exists) { b.set(reg, { uid: u.uid }); n++; }
                        if (raw !== upperId) { b.update(fbDb.collection('users').doc(u.uid), { studentId: upperId }); n++; }
                        if (n) return b.commit();
                    }).catch(e => { if (FS_DETACHED || !fbAuth.currentUser) return; console.warn('Chưa đồng bộ được Mã học sinh (hãy Publish firestore.rules mới):', e); });
                }
                return Promise.resolve();
            }
            return new Promise(resolve => {
                SID_RESOLVE = resolve;
                $('sid-input').value = ''; $('sid-err').textContent = '';
                $('modal-studentid').style.display = 'flex';
                setTimeout(() => $('sid-input').focus(), 50);
            });
        }
        async function saveStudentId() {
            if (SID_BUSY || !ME || !SID_RESOLVE) return;
            const id = normStudentId($('sid-input').value);
            $('sid-input').value = id;
            if (!validStudentId(id)) { $('sid-err').textContent = 'Mã học sinh gồm 3-20 ký tự: chữ, số hoặc . _ - (VD: HS11A801).'; return; }
            SID_BUSY = true; const btn = $('sid-save'); btn.disabled = true; btn.textContent = 'Đang lưu...';
            try {
                // Mã học sinh phải DUY NHẤT: kiểm tra sổ đăng ký rồi ghi mã + hồ sơ trong 1 batch (trùng -> bị từ chối)
                const reg = fbDb.collection('studentIds').doc(id), ex = await reg.get();
                if (ex.exists && ex.data().uid !== ME.uid) {
                    $('sid-err').textContent = 'Mã học sinh này đã có người sử dụng. Hãy nhập một mã khác.';
                    SID_BUSY = false; btn.disabled = false; btn.textContent = 'Lưu & Tiếp tục'; return;
                }
                const b = fbDb.batch(); if (!ex.exists) b.set(reg, { uid: ME.uid });
                b.update(fbDb.collection('users').doc(ME.uid), { studentId: id });
                await b.commit();
                MY_SID = id; renderStudentId();
                $('modal-studentid').style.display = 'none';
                const done = SID_RESOLVE; SID_RESOLVE = null; done();          // mở khóa: cho phép app khởi động tiếp
            } catch (e) {
                $('sid-err').textContent = 'Không lưu được: ' + (e.code === 'permission-denied' ? 'mã này đã có người sử dụng, hoặc chưa cập nhật firestore.rules.' : (e.message || e));
            }
            SID_BUSY = false; btn.disabled = false; btn.textContent = 'Lưu & Tiếp tục';
        }


        // ===== Phần 4: Lịch chuyên cần của chính học sinh (chỉ đọc) - attendance/{uid} do giáo viên điểm danh ngoại lệ =====
        // Mặc định mọi ngày học (T2-T7) đã qua = "Lớp đủ"; chỉ hiện đi muộn / vắng khi giáo viên có ghi nhận.
        let ATT_DAYS = {}, ATT_NOTES = {}, ATT_YM = { y: new Date().getFullYear(), m: new Date().getMonth() };
        const ATT_LBL = { late: ['Đi muộn', '#fef3c7', '#b45309'], excused: ['Vắng có phép', '#e0f2fe', '#0369a1'], unexcused: ['Vắng không phép', '#fee2e2', '#b91c1c'], dayoff: ['Ngày nghỉ (lớp không đi học)', '#f3e8ff', '#7e22ce'] };
        function attMove(d) { const x = new Date(ATT_YM.y, ATT_YM.m + d, 1); ATT_YM = { y: x.getFullYear(), m: x.getMonth() }; renderAtt(); }
        function renderAtt() {
            const grid = $('att-grid'); if (!grid) return;
            const p2 = n => String(n).padStart(2, '0'), now = new Date();
            const today = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate());
            const lead = (new Date(ATT_YM.y, ATT_YM.m, 1).getDay() + 6) % 7, dim = new Date(ATT_YM.y, ATT_YM.m + 1, 0).getDate();
            $('att-month').textContent = 'Tháng ' + (ATT_YM.m + 1) + '/' + ATT_YM.y;
            let h = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(w => '<div style="font-size:10px;color:#94a3b8;">' + w + '</div>').join('');
            for (let i = 0; i < lead; i++) h += '<div></div>';
            const rows = [];
            for (let d = 1; d <= dim; d++) {
                const k = ATT_YM.y + '-' + p2(ATT_YM.m + 1) + '-' + p2(d), st = ATT_LBL[ATT_DAYS[k]];
                const dflt = !st && k <= today && new Date(ATT_YM.y, ATT_YM.m, d).getDay() !== 0;
                const bg = st ? st[1] : dflt ? '#ecfdf5' : '#f8fafc', fg = st ? st[2] : dflt ? '#059669' : '#94a3b8';
                h += '<div style="aspect-ratio:1;max-height:48px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:' + bg + ';color:' + fg + ';' + (k === today ? 'box-shadow:0 0 0 2px #6366f1;' : '') + (ATT_DAYS[k] === 'dayoff' ? 'border:1px solid #d8b4fe;' : '') + '">' + d + '</div>';
                if (st) rows.push('<div style="background:' + st[1] + ';color:' + st[2] + ';border-radius:8px;padding:6px 8px;margin-top:4px;"><b>' + p2(d) + '/' + p2(ATT_YM.m + 1) + '</b> • ' + st[0] + (ATT_NOTES[k] ? '<br><svg class=ic aria-hidden=true><use href=#i-note-edit></use></svg> ' + String(ATT_NOTES[k]).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])) : '') + '</div>');
            }
            grid.innerHTML = h; $('att-list').innerHTML = rows.join('');
        }

        fbAuth.onAuthStateChanged(async u => {
            if (!u) { detachAllListeners(); goTo(PAGE_LOGIN); return; }   // đã đăng xuất (tab khác / hết phiên): gỡ listener trước khi rời trang
            if (ME) return;
            const acc = await getStudentAccount(u);
            if (!acc) { goTo(PAGE_LOGIN); return; }
            if (ME) return; ME = u;
            restorePtDraft();   // khôi phục điểm / sở thích nhập dở sau khi F5
            restorePtResultCache();   // khôi phục khung kết quả phân tích gần nhất
            ptCooldownResume();   // nút Phân Tích còn trong 60s chờ thì tiếp tục đếm ngược
            loadMbtiLocal();   // kết quả MBTI đã lưu trên máy (Firestore sẽ ghi đè khi về)
            await requireStudentId(u, acc);   // chặn tại đây (popup khóa) cho đến khi có Mã học sinh
            bootLockFromLS(); syncClock(); setInterval(syncClock, 600000);
            // 1) Chỉ nghe HỒ SƠ CỦA MÌNH (trước đây: cả collection profiles)
            fbDb.collection('profiles').doc(ME.uid).onSnapshot(d => {
                if (d.exists) PROFILES[ME.uid] = d.data(); else delete PROFILES[ME.uid];
                user.coverHidden = !!(d.exists && d.data().coverHidden === true); syncCoverShare();
                onProfiles(); reconcileSelf();
            });
            fbDb.collection('privates').doc(ME.uid).onSnapshot(d => { const x = d.data() || {}; user.analysisData = x.analysis || null; if (user.analysisData) { renderPtResult(user.analysisData); cachePtResult(user.analysisData); } if (x.mbti) applyMbti(x.mbti); user.deepData = x.deep || null; user.cover = x.cover || ''; user.coverPos = x.coverPos || null; renderCover(); mirrorCoverIfNeeded(); if (typeof renderProfileDeep === 'function') renderProfileDeep(); });
            fbDb.collection('evaluations').doc(ME.uid).onSnapshot(d => { const e = d.data(); $('eval-box').style.display = e && e.text ? '' : 'none'; $('eval-text').innerText = e ? e.text + (e.teacherName ? ' — ' + e.teacherName : '') : ''; }, () => {});
            fbDb.collection('attendance').doc(ME.uid).onSnapshot(d => { const x = d.data() || {}; ATT_DAYS = x.days || {}; ATT_NOTES = x.notes || {}; { const am = $('att-menu'); if (am) am.style.display = ''; } renderAtt(); }, () => {});
            // 2) Bài tập: giới hạn 50 bài mới nhất (lọc trường/lớp vẫn ở client)
            // (bài tập được nghe trong watchHW(), gọi sau khi biết giáo viên cùng trường - xem loadSchoolTeachers)
            fbDb.collection('attempts').where('uid', '==', ME.uid).onSnapshot(s => { ATT = {}; s.forEach(d => { const x = d.data(); if (x.startedAt) { ATT[x.hwId] = x.startedAt.toMillis(); ATTANS[x.hwId] = x.answers || []; } }); RDY.att = true; syncLock(); renderHW(); checkExpired(); maybeResume(); });
            // 3) Bài nộp: CHỈ của chính mình (trước đây: cả collection submissions)
            fbDb.collection('submissions').where('uid', '==', ME.uid).onSnapshot(s => {
                SUBS_ALL = s.docs.map(d => d.data()); SUBS_DATA = {}; SUBS_ALL.forEach(x => SUBS_DATA[x.hwId] = x.score);
                RDY.sub = true; syncLock(); if (PROFILES[ME.uid]) refreshUI(); renderHW(); checkExpired(); maybeResume(); reconcileSelf(); reconcileWeek(); PET_SYNCED = !(s.metadata && s.metadata.fromCache); try { renderPetCard(); } catch (e) {}
            });
            // 4) Điểm chênh lệch BXH: chỉ doc của mình (trước đây: cả collection bxhScores)
            fbDb.collection('bxhScores').doc(ME.uid).onSnapshot(d => { const v = (d.data() || {}).adjustXp; BXH_ADJ = typeof v === 'number' ? { [ME.uid]: v } : {}; if (PROFILES[ME.uid]) refreshUI(); }, () => {});
            // 5) BXH của mọi người: 1 lượt đọc doc tổng hợp (cache 5 phút)
            loadBxh(true);
            // Bảng tin (posts): không nghe lúc đăng nhập nữa, chỉ bắt đầu khi học sinh mở Orient New lần đầu (xem startPostsListener)
        });
    

// ===== CHAT AI (Cloudflare Worker + Gemini) =====
const AI_URL = 'https://eduorient.iemmchyy.workers.dev';
const AI_HIST = []; let aiBusy = false;
// Chế độ trả lời: 'guide' = Gợi mở từng bước (học sinh bật/tắt, nhớ trên máy); 'simple' = Giải thích dễ hiểu hơn (chỉ áp dụng cho 1 lượt)
let AI_GUIDE = false; try { AI_GUIDE = localStorage.getItem('aiGuide') === '1'; } catch (e) { /* trình duyệt chặn lưu */ }
let aiModeOnce = '';
const aiModeNow = () => aiModeOnce || (AI_GUIDE ? 'guide' : '');
function aiToggleGuide() {
    AI_GUIDE = !AI_GUIDE;
    try { localStorage.setItem('aiGuide', AI_GUIDE ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    aiToolsSync();
}
// Điện thoại: nút mũi tên mở/đóng bảng 2 tùy chọn. Chấm nhỏ trên mũi tên = đang bật Gợi mở từng bước.
function aiMoreSet(open) {
    const m = document.querySelector('#tab-ai .ai-main'); if (!m) return;
    m.classList.toggle('tools-open', !!open);
    const b = document.getElementById('ai-more-btn'); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function aiMoreToggle() { const m = document.querySelector('#tab-ai .ai-main'); aiMoreSet(!(m && m.classList.contains('tools-open'))); }
window.aiMoreToggle = aiMoreToggle;
document.addEventListener('click', function (e) {   // bấm ra ngoài bảng thì tự đóng
    const m = document.querySelector('#tab-ai .ai-main');
    if (!m || !m.classList.contains('tools-open') || !e.target.closest) return;
    if (e.target.closest('.ai-tools, #ai-more-btn')) return;
    aiMoreSet(false);
});
function aiToolsSync() {
    const g = document.getElementById('ai-guide-btn');
    if (g) {
        g.classList.toggle('on', AI_GUIDE); g.setAttribute('aria-pressed', AI_GUIDE ? 'true' : 'false');
        const sw = document.getElementById('ai-guide-sw'); if (sw) sw.textContent = AI_GUIDE ? 'ON' : 'OFF';
    }
    const mb = document.getElementById('ai-more-btn'); if (mb) mb.classList.toggle('on', AI_GUIDE);
    // Nút "Giải thích dễ hiểu hơn": hiện suốt khi cuộc trò chuyện đã có câu trả lời của AI (tạm khóa lúc AI đang trả lời)
    const s = document.getElementById('ai-simple-btn');
    if (s) { s.hidden = !AI_HIST.some(m => m.role === 'assistant'); s.disabled = aiBusy; }
}
// Nút "Giải thích dễ hiểu hơn": nhờ AI giải thích lại câu trả lời gần nhất, không cần gõ lại
function aiExplainSimpler() {
    if (aiBusy || !AI_HIST.some(m => m.role === 'assistant')) return;
    aiMoreSet(false);
    aiSend('Mình chưa hiểu lắm, bạn giải thích lại dễ hiểu hơn giúp mình nhé.', 'simple');
}
window.aiToggleGuide = aiToggleGuide; window.aiExplainSimpler = aiExplainSimpler;
document.addEventListener('DOMContentLoaded', aiToolsSync);
// Chỉ gửi 10 tin cuối và cắt đúng cỡ Worker (user 2000, AI 5000 ký tự) để body không vượt giới hạn khi cuộc trò chuyện dài
const aiPayload = () => AI_HIST.slice(-10).map(m => ({ role: m.role, content: String(m.content || '').slice(0, m.role === 'assistant' ? 5000 : 2000) }));
// AI hay bọc cả câu tiếng Việt / tiếng Anh vào $...$ (vd "$Every ___ (Chủ ngữ) + faces$"). KaTeX đọc là toán nên báo vàng đầy console
// ("Unrecognized Unicode character ữ", "No character metrics") và dòng bị nowrap tràn khỏi bong bóng. Nội dung nào là CHỮ thì bỏ dấu $ và để chữ thường.
function aiIsProse(inner) {
    const t = inner.replace(/\\(?:text|mathrm|textbf|textit|mathbf|operatorname)\{[^}]*\}/g, '').replace(/\\[a-zA-Z]+/g, '');
    return /[\u00C0-\u1EF9]/.test(inner) || /_{3}|(?:\\_){3}/.test(inner) || /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(t);
}
function aiUnmath(inner) {
    const SYM = { cdot: '·', times: '×', le: '≤', leq: '≤', ge: '≥', geq: '≥', pm: '±', neq: '≠', ne: '≠', pi: 'π', to: '→', rightarrow: '→', infty: '∞' };
    inner = inner.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|lim|max|min)\b/g, '$1')
                 .replace(/\\([a-zA-Z]+)/g, (m, n) => SYM[n] || m);
    return inner.replace(/\\(?:text|mathrm|textbf|textit|mathbf|operatorname)\{([^}]*)\}/g, '$1').replace(/\\_/g, '_').replace(/\\[,;: ]/g, ' ').trim();
}
// Đổi markdown đơn giản (**đậm**, `mã`, danh sách, tiêu đề) sang HTML. Escape trước nên không chèn được HTML độc hại.
function aiMd(text) {
    let s = String(text == null ? '' : text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // Cất công thức ($$..$$, \[..\], \(..\), $..$) vào chỗ tạm để các bước markdown bên dưới (*, -, _) không làm hỏng; KaTeX sẽ vẽ sau (eduTypeset)
    const MATH = [];
    s = s.replace(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$/g, m => { const inner = /^(\$\$|\\\[|\\\()/.test(m) ? m.slice(2, -2) : m.slice(1, -1); if (aiIsProse(inner)) return aiUnmath(inner); MATH.push(m); return '\u0001' + (MATH.length - 1) + '\u0002'; });
    s = s.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, (m, c) => '<pre style="margin:6px 0;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.18);overflow-x:auto;white-space:pre">' + c.replace(/\n$/, '') + '</pre>');
    s = s.replace(/^\s{0,3}#{1,6}\s+(.+)$/gm, '<b>$1</b>');
    s = s.replace(/^\s*([-*_])(?:\s*\1){2,}\s*$/gm, '<hr style="border:0;border-top:1px solid rgba(148,163,184,.4);margin:8px 0">');
    s = s.replace(/^\s*[*-]\s+/gm, '• ');
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<i>$2</i>');
    s = s.replace(/`([^`\n]+)`/g, '<code style="padding:1px 5px;border-radius:5px;background:rgba(0,0,0,.18)">$1</code>');
    s = s.replace(/\u0001(\d+)\u0002/g, (m, i) => MATH[+i]);
    return s;
}
function aiBubble(role, text) {
    const box = document.querySelector('.ai-msgs'); if (!box) return null;
    const d = document.createElement('div');
    d.className = 'chat-bubble other';
    d.style.maxWidth = '75%'; d.style.whiteSpace = 'pre-wrap';
    if (role === 'user') { d.style.alignSelf = 'flex-end'; d.style.background = 'var(--primary)'; d.style.color = '#fff'; d.textContent = text; }   // tin của học sinh: textContent
    else { d.style.alignSelf = 'flex-start'; d.innerHTML = aiMd(text); if (window.eduTypeset) eduTypeset(d); }   // trả lời của AI: markdown đã escape + vẽ công thức
    box.appendChild(d); box.scrollTop = box.scrollHeight; return d;
}
// Bong bóng "đang suy nghĩ": 3 chấm nhảy + dòng chữ đổi theo thời gian chờ (Worker có thể mất tới ~26 giây nên học sinh không tưởng bị treo)
const AI_WAIT_TEXTS = [[0, 'Đang suy nghĩ'], [6, 'Đang tìm cách giải thích dễ hiểu nhất'], [14, 'Câu hỏi hơi khó, mình đang soạn kỹ hơn'], [22, 'Hơi lâu một chút, mình vẫn đang làm nhé']];
function aiThinkingBubble() {
    const d = aiBubble('assistant', ''); if (!d) return null;
    d.classList.add('ai-thinking'); d.setAttribute('role', 'status'); d.setAttribute('aria-live', 'polite');
    d.innerHTML = '<span class="ai-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ai-wait-t">Đang suy nghĩ</span>';
    const t = d.querySelector('.ai-wait-t'), t0 = Date.now();
    d._timer = setInterval(() => {
        if (!d.isConnected) return aiThinkingDone(d);   // đã đổi sang cuộc trò chuyện khác -> dừng bộ đếm
        const sec = (Date.now() - t0) / 1000; let txt = AI_WAIT_TEXTS[0][1];
        for (const w of AI_WAIT_TEXTS) if (sec >= w[0]) txt = w[1];
        if (t && t.textContent !== txt) t.textContent = txt;
    }, 1000);
    return d;
}
function aiThinkingDone(d) {
    if (!d) return;
    if (d._timer) { clearInterval(d._timer); d._timer = null; }
    d.classList.remove('ai-thinking'); d.removeAttribute('role'); d.removeAttribute('aria-live');
}
// Rút gọn thông báo lỗi để học sinh không thấy cả khối JSON thô
function aiFriendlyError(msg) {
    if (/abort|timeout|timed out/i.test(msg || '')) return 'Trợ lý AI phản hồi quá lâu. Bạn kiểm tra mạng rồi thử lại nhé.';
    const m = /^AI đang bận \[(\d+)\]/.exec(msg || '');
    if (!m) return msg || 'Không kết nối được AI, thử lại sau.';
    if (m[1] === '429') return 'Trợ lý AI đang nhận quá nhiều câu hỏi (mã 429). Bạn đợi khoảng 1 phút rồi hỏi lại nhé.';
    if (['408', '504', '524'].includes(m[1])) return 'Trợ lý AI phản hồi quá lâu (mã ' + m[1] + '). Bạn thử lại nhé.';
    if (m[1] === '502') return 'Trợ lý AI đang bận (mã 502). Bạn thử lại sau ít giây nhé.';
    if (m[1] === '503') return 'Trợ lý AI đang quá tải (mã 503). Bạn thử lại sau ít giây nhé.';
    return 'Trợ lý AI đang bận (mã ' + m[1] + '). Bạn thử lại sau nhé.';
}
// ---- Chạy chữ thật (streaming) ----
// Cắt bỏ phần đuôi chưa viết xong (công thức $..$ / $$..$$ chưa đóng, **đậm** dở, khối mã dở...) để lúc đang chạy không hiện ký tự thô.
// Phần bị cắt sẽ hiện ra ở mẩu sau, khi đã đóng đủ.
function aiSafeCut(t) {
    const n = t.length; let i = 0, open = null;
    while (i < n) {
        if (!open) {
            if (t.startsWith('```', i)) { open = { c: '```', at: i }; i += 3; }
            else if (t.startsWith('$$', i)) { open = { c: '$$', at: i }; i += 2; }
            else if (t.startsWith('\\[', i)) { open = { c: '\\]', at: i }; i += 2; }
            else if (t.startsWith('\\(', i)) { open = { c: '\\)', at: i }; i += 2; }
            else if (t[i] === '$') { open = { c: '$', at: i, line: true }; i += 1; }
            else if (t.startsWith('**', i)) { open = { c: '**', at: i, line: true }; i += 2; }
            else if (t[i] === '`') { open = { c: '`', at: i, line: true }; i += 1; }
            else i++;
        } else if (t.startsWith(open.c, i)) { i += open.c.length; open = null; }
        else if (open.line && (t[i] === '\n' || i - open.at > 300)) { open = null; }   // không đóng trong cùng dòng -> coi là ký tự thường
        else i++;
    }
    let head = open ? t.slice(0, open.at) : t;
    head = head.replace(/(^|[^`])``$/, '$1').replace(/(^|[^*])\*$/, '$1').replace(/\\$/, '');   // nửa dấu mở đang viết dở
    head = head.replace(/(^|\n)[ ]{0,3}(?:#{1,6}|[-*_]+)[ ]*$/, '$1');                              // dòng cuối mới có "-", "#", "---": chờ thêm chữ
    return head;
}
// Hiệu ứng "mờ dần hiện lên": mỗi lần vẽ lại, phần chữ MỚI so với lần trước được bọc trong <span class="ai-fade"> (CSS: opacity 0 -> 1).
// Vì bong bóng được vẽ lại bằng innerHTML, mỗi đoạn mới ghi nhớ giờ xuất hiện (d._fadeSegs) và được cho animation-delay âm,
// nên đoạn đang mờ dở vẫn mờ tiếp đúng tiến độ chứ không bị khựng hay chạy lại từ đầu. Công thức KaTeX được coi là 1 khối.
const AI_FADE_MS = 650;
function aiFade(d) {
    const now = Date.now();
    let U = 0;
    const count = n => { for (let c = n.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) U += c.data.length; else if (c.nodeType === 1) { if (aiIsMath(c)) U += 1; else count(c); } } };
    count(d);
    if (d._fadeLen == null) d._fadeLen = U;
    else if (U > d._fadeLen) { (d._fadeSegs = d._fadeSegs || []).push({ from: d._fadeLen, to: U, t: now }); d._fadeLen = U; }
    const segs = (d._fadeSegs || (d._fadeSegs = [])).filter(x => now - x.t < AI_FADE_MS);
    d._fadeSegs = segs;
    if (!segs.length) return;
    let pos = 0;
    const span = (seg, block) => { const e = document.createElement('span'); e.className = 'ai-fade'; e.style.animationDelay = '-' + (now - seg.t) + 'ms'; if (block) e.style.display = 'block'; return e; };
    const walk = (n, inFade) => {
        for (let c = n.firstChild; c;) {
            const next = c.nextSibling;
            if (c.nodeType === 3) {
                const a = pos, len = c.data.length; pos += len;
                if (inFade) { c = next; continue; }
                const cuts = [];
                for (const g of segs) { const s0 = Math.max(a, g.from), e0 = Math.min(a + len, g.to); if (e0 > s0) cuts.push([s0 - a, e0 - a, g]); }
                if (cuts.length) {
                    const frag = document.createDocumentFragment(); let cur = 0;
                    for (const [x, y, g] of cuts) {
                        if (x > cur) frag.appendChild(document.createTextNode(c.data.slice(cur, x)));
                        const e = span(g); e.textContent = c.data.slice(x, y); frag.appendChild(e); cur = y;
                    }
                    if (cur < len) frag.appendChild(document.createTextNode(c.data.slice(cur)));
                    c.replaceWith(frag);
                }
            } else if (c.nodeType === 1) {
                if (aiIsMath(c)) {
                    const a = pos; pos += 1;
                    if (!inFade) { const g = segs.find(x => a >= x.from && a < x.to); if (g) { const e = span(g, c.classList.contains('katex-display')); c.replaceWith(e); e.appendChild(c); } }
                } else walk(c, inFade || c.classList.contains('ai-fade'));
            }
            c = next;
        }
    };
    walk(d, false);
}
const aiIsMath = e => e.classList.contains('katex-display') || e.classList.contains('katex');
// Vẽ lại bong bóng AI. Chỉ tự cuộn xuống khi học sinh đang ở sát đáy; cuộn lên đọc lại thì không bị kéo xuống.
function aiPaint(d, text, final) {
    const box = d.parentNode;
    const near = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 90;
    d.innerHTML = aiMd(final ? text : aiSafeCut(text));
    const down = () => { if (near && box) box.scrollTop = box.scrollHeight; };
    down();
    const fade = () => { if (d.isConnected) aiFade(d); down(); };
    if (window.eduTypeset) Promise.resolve(eduTypeset(d)).then(fade); else fade();
}
const AI_STREAM_OK = typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined' && typeof AbortController !== 'undefined';
let aiCtl = null;
window.addEventListener('pagehide', () => { if (aiCtl) { try { aiCtl.abort(); } catch (e) { /* đã dừng */ } } });   // học sinh thoát / tải lại trang -> dừng luồng

// Đường cũ (chờ nhận đủ câu trả lời): dùng khi trình duyệt không hỗ trợ luồng
async function aiAskPlain(token) {
    const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ messages: aiPayload(), mode: aiModeNow() }),
        signal: AbortSignal.timeout(35000)   // Worker tối đa ~26s; quá 35s thì báo lỗi thay vì treo dấu "..."
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'AI đang bận, thử lại sau.');
    if (!data.reply) throw new Error('AI đang bận, thử lại sau.');
    return String(data.reply);
}
// Nếu tại vị trí i bắt đầu một cụm (công thức, **đậm**, `mã`, khối mã) thì cho chữ "nhảy" qua cả cụm một lần thay vì gõ từng ký tự (công thức hiện ra gọn, không bị khựng).
// Trả về: vị trí mới (> i) nếu cụm đã đóng đủ; i nếu là ký tự thường; -1 nếu cụm chưa đến đủ -> chờ thêm chữ.
function aiJump(t, i, finished) {
    const O = [['```', '```', 0], ['$$', '$$', 0], ['\\[', '\\]', 0], ['\\(', '\\)', 0], ['**', '**', 1], ['$', '$', 1], ['`', '`', 1]];
    for (const [a, b, line] of O) {
        if (!t.startsWith(a, i)) continue;
        const j = t.indexOf(b, i + a.length), nl = t.indexOf('\n', i);
        if (line) {
            if (j >= 0 && !(nl >= 0 && nl < j) && j - i <= 300) return j + b.length;
            if (j < 0 && !finished && nl < 0 && t.length - i <= 300) return -1;
            return i;
        }
        if (j >= 0) return j + b.length;
        return (finished || t.length - i > 600) ? i : -1;
    }
    return i;
}
// Đường mới: đọc luồng NDJSON từ Worker. Chữ nhận về được cho vào "bộ đệm", rồi nhỏ giọt ra màn hình đều đặn (kiểu gõ chữ mượt),
// tốc độ tự tăng khi bộ đệm đầy để không bao giờ chậm hơn AI quá lâu. Trả về toàn văn khi đã hiện xong.
// Lỗi ném ra có thể gắn: aiPartial (đã nhận được một phần chữ), aiEarly (đứt ngay khi mới bắt đầu -> thử lại đường cũ), aiGone (bong bóng đã bị bỏ).
async function aiAskStream(token, wait) {
    const ctl = new AbortController(); aiCtl = ctl;
    let timer = 0, ticker = 0, full = '', shown = 0, finished = false, drained = null, started = false, gotStream = false;
    const arm = ms => { clearTimeout(timer); timer = setTimeout(() => ctl.abort(), ms); };
    const tick = () => {
        if (!wait.isConnected) { clearInterval(ticker); ticker = 0; if (drained) drained(); return; }
        const left = full.length - shown;
        if (left > 0) {
            if (document.hidden) shown = full.length;   // tab đang ẩn: không cần hiệu ứng, hiện luôn cho khỏi dồn việc
            else {
                const target = shown + Math.max(1, Math.ceil(left / (finished ? 5 : 16)));   // càng nhiều chữ chờ càng chạy nhanh
                let p = shown;
                while (p < target) { const j = aiJump(full, p, finished); if (j < 0) break; if (j > p) { p = j; break; } p++; }
                if (p === shown) return;   // đang chờ một công thức / đoạn đậm chưa đến đủ
                if (p === target && p < full.length && !/\s/.test(full[p - 1])) {   // gom cho tới hết từ đang gõ dở: chữ hiện theo cụm từ, mờ dần dịu hơn
                    let q = p; while (q < full.length && !/\s/.test(full[q])) q++;
                    if (q < full.length || finished) p = q;
                    else { const ws = full.slice(shown, p).search(/\s\S*$/); if (ws < 0) return; p = shown + ws + 1; }   // từ chưa nhận đủ -> lùi về cuối từ trước
                }
                shown = p;
            }
            aiPaint(wait, full.slice(0, shown), false);
        }
        if (finished && shown >= full.length) { clearInterval(ticker); ticker = 0; if (drained) drained(); }
    };
    try {
        arm(35000);   // chờ chữ đầu tiên (Worker trả phản hồi sau khi đã có chữ đầu)
        const res = await fetch(AI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ messages: aiPayload(), stream: true, mode: aiModeNow() }),
            signal: ctl.signal
        });
        if (!/ndjson/i.test(res.headers.get('Content-Type') || '') || !res.body || !res.body.getReader) {
            // Worker trả JSON thường (lỗi, câu bị chặn an toàn, hoặc Worker bản cũ chưa hỗ trợ luồng)
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'AI đang bận, thử lại sau.');
            if (!data.reply) throw new Error('AI đang bận, thử lại sau.');
            return String(data.reply);
        }
        gotStream = true;
        const rd = res.body.getReader(), dec = new TextDecoder();
        let buf = '', done = false, bad = false;
        arm(20000);
        for (;;) {
            if (!wait.isConnected) { ctl.abort(); const g = new Error('abort'); g.aiGone = true; throw g; }   // đã đổi cuộc trò chuyện / tài khoản
            const r = await rd.read();
            if (r.done) break;
            arm(20000);   // quá 20 giây không có mẩu mới -> coi là đứt
            buf += dec.decode(r.value, { stream: true });
            let nl;
            while ((nl = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
                if (!line) continue;
                let ev; try { ev = JSON.parse(line); } catch (e) { continue; }
                if (typeof ev.t === 'string' && ev.t) {
                    if (!started) { started = true; aiThinkingDone(wait); wait.classList.add('ai-streaming'); wait._fadeLen = 0; wait._fadeSegs = []; ticker = setInterval(tick, 50); }
                    full += ev.t;
                } else if (ev.done) { done = true; }
                else if (ev.err) bad = true;
            }
        }
        if (!done || bad) throw new Error('stream cut');
        finished = true; clearTimeout(timer);
        if (ticker) await new Promise(res => { drained = res; if (shown >= full.length) res(); });   // chờ chữ chạy nốt phần còn lại
        return full;
    } catch (e) {
        if (e && e.aiGone) throw e;
        if (full) { const x = new Error(e && e.message); x.aiPartial = full; throw x; }
        if (gotStream) e.aiEarly = true;
        throw e;
    } finally {
        clearTimeout(timer); clearInterval(ticker);
        if (aiCtl === ctl) aiCtl = null;
    }
}
function sendAi() {
    const inp = document.getElementById('ai-question-input'); if (!inp) return;
    return aiSend(inp.value.trim(), '');
}
async function aiSend(q, once) {
    const inp = document.getElementById('ai-question-input'); if (!inp) return;
    if (!q || aiBusy) return;
    aiMoreSet(false);
    if (window.EXAM_LOCKED) return eduAlert('Đang trong giờ làm bài, chưa dùng được trợ lý AI.', 'warning');
    const cu = fbAuth.currentUser;
    if (!cu) return eduAlert('Bạn cần đăng nhập lại.', 'warning');
    aiBusy = true; aiModeOnce = once || ''; if (!once) inp.value = ''; aiToolsSync();
    const sendBtn = document.querySelector('.ai-in .chat-send'); if (sendBtn) sendBtn.disabled = true;
    AI_HIST.push({ role: 'user', content: q });
    if (AI_HIST.length > 20) AI_HIST.splice(0, AI_HIST.length - 20);
    aiBubble('user', q);
    const wait = aiThinkingBubble();
    if (window.eduTypeset) { const w = document.createElement('span'); w.textContent = '$x$'; eduTypeset(w); }   // tải sẵn KaTeX để công thức vẽ ngay khi chữ chạy tới
    try {
        const token = await cu.getIdToken();
        let reply;
        if (AI_STREAM_OK) {
            try { reply = await aiAskStream(token, wait); }
            catch (e) {
                if (e && e.aiEarly && wait.isConnected) reply = await aiAskPlain(token);   // luồng đứt ngay từ đầu (mạng/proxy chặn luồng) -> thử đường cũ 1 lần
                else throw e;
            }
        } else reply = await aiAskPlain(token);
        if (wait.isConnected) {
            aiThinkingDone(wait); wait.classList.remove('ai-streaming');
            aiPaint(wait, reply, true);
            AI_HIST.push({ role: 'assistant', content: reply });   // chỉ lưu vào lịch sử khi đã chạy xong trọn vẹn
            aiSave();
        }
    } catch (e) {
        if (!(e && e.aiGone)) {
            aiThinkingDone(wait); wait.classList.remove('ai-streaming');
            if (e && e.aiPartial) {
                aiPaint(wait, e.aiPartial, true);
                const note = document.createElement('div');
                note.style.cssText = 'margin-top:6px;font-size:.9em;opacity:.75';
                note.textContent = '(đứt kết nối, thử lại nhé)';
                wait.appendChild(note);
            } else wait.textContent = aiFriendlyError(e && e.message);
            if (AI_HIST.length && AI_HIST[AI_HIST.length - 1].role === 'user') AI_HIST.pop();   // câu hỏi này chưa có trả lời trọn vẹn
        }
    } finally {
        aiBusy = false; aiModeOnce = ''; aiToolsSync();
        if (sendBtn) sendBtn.disabled = false;
        const box = document.querySelector('.ai-msgs');
        if (box && box.scrollHeight - box.scrollTop - box.clientHeight < 90) box.scrollTop = box.scrollHeight;
    }
}
window.sendAi = sendAi;

// ===== LỊCH SỬ TRÒ CHUYỆN AI =====
// Cấu trúc mới (v:2): aiChats/{uid}/items/{id} = { title, updatedAt, v:2 }  (nhẹ, dùng cho danh sách bên cạnh)
//                     aiChats/{uid}/items/{id}/data/msgs = { msgs:[{role,content}], updatedAt }  (chỉ tải khi mở đúng cuộc đó)
// Cuộc cũ (trước v:2) còn để msgs ngay trong tài liệu chính: vẫn mở được; lần nhắn tiếp theo sẽ tự chuyển sang cấu trúc mới.
let AI_CUR = null, AI_LIST = [], AI_UID = '';
const aiEsc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const aiCol = () => fbDb.collection('aiChats').doc(fbAuth.currentUser.uid).collection('items');
function aiResetBox() {
    const box = document.querySelector('.ai-msgs'); if (!box) return;
    box.innerHTML = '';
    const g = document.createElement('div');
    g.className = 'chat-bubble other'; g.style.maxWidth = '70%'; g.style.alignSelf = 'flex-start';
    g.textContent = 'Xin chào! Mình là trợ lý học tập EduOrient AI.';
    box.appendChild(g);
    aiToolsSync();
}
function aiRenderList() {
    try { ensureAiSheet(); aiRenderSheet(); } catch (e) {}
    const box = document.querySelector('.ai-hist'); if (!box) return;
    if (!AI_LIST.length) { box.innerHTML = '<div class="ai-hist-empty">Chưa có cuộc trò chuyện nào.<br>Lịch sử hỏi đáp với trợ lý AI sẽ hiển thị tại đây.</div>'; return; }
    box.innerHTML = AI_LIST.map(c =>
        '<div class="ai-h-item' + (c.id === AI_CUR ? ' active' : '') + '" onclick="aiOpenChat(\'' + aiEsc(c.id) + '\')">' +
        '<span class="ai-h-t">' + aiEsc(c.title || 'Cuộc trò chuyện') + '</span>' +
        '<button type="button" class="ai-h-del" title="Xóa cuộc trò chuyện" aria-label="Xóa" onclick="event.stopPropagation();aiDeleteChat(\'' + aiEsc(c.id) + '\')"><svg class=ic aria-hidden=true><use href=#i-close></use></svg></button></div>'
    ).join('');
}
// ---------- Điện thoại / máy tính bảng (< 1024px): lịch sử chat AI mở bằng nút "🕘 Lịch sử" ở đầu khung chat -> bảng trượt từ dưới lên ----------
// Thay cho hàng chip cuộn ngang (khó thấy, tên bị cắt). CSS + DOM tạo từ JS; laptop giữ nguyên cột bên trái.
var AI_SHEET_Q = '';
function ensureAiSheet() {
    if (!document.getElementById('ais-style')) {
        var st = document.createElement('style'); st.id = 'ais-style';
        st.textContent =
            '.ais-btn{display:flex;align-items:center;gap:5px;flex:0 0 auto;border:1px solid var(--primary,#4361ee);background:rgba(99,102,241,.16);color:var(--primary,#4361ee);border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
            '.ais-btn i{font-style:normal;min-width:18px;height:18px;line-height:18px;padding:0 5px;border-radius:9px;background:var(--primary,#4361ee);color:#fff;font-size:11px;text-align:center;box-sizing:border-box}.ais-btn i:empty{display:none}' +
            '#ais-open{margin-left:auto}.ais-plus{width:36px;height:36px;padding:0;justify-content:center;font-size:18px;margin-left:6px}' +
            '.ais-sheet{position:fixed;inset:0;z-index:5000;background:rgba(15,23,42,.5);display:none;align-items:flex-end;justify-content:center}' +
            '.ais-panel{width:100%;max-width:560px;max-height:80vh;max-height:80dvh;display:flex;flex-direction:column;background:var(--card-bg,#fff);color:var(--text-main,#0f172a);border-radius:22px 22px 0 0;padding:8px 16px calc(16px + env(safe-area-inset-bottom,0px));box-sizing:border-box;box-shadow:0 -8px 30px rgba(0,0,0,.25);animation:aisUp .22s ease-out}' +
            '@keyframes aisUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
            '.ais-grab{width:42px;height:4px;border-radius:2px;background:rgba(127,127,127,.45);margin:0 auto 8px}' +
            '.ais-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:16px}' +
            '.ais-x{border:0;background:rgba(127,127,127,.18);color:inherit;width:32px;height:32px;border-radius:50%;font-size:14px;cursor:pointer}' +
            '.ais-newbtn{width:100%;border:1px dashed var(--primary,#4361ee);background:rgba(99,102,241,.16);color:var(--primary,#4361ee);padding:12px;border-radius:12px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;margin-bottom:10px}' +
            '.ais-q{width:100%;box-sizing:border-box;height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.12);color:inherit;font-size:16px;font-family:inherit;outline:none;margin-bottom:8px}' +
            '.ais-list{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}' +
            '.ais-item{display:flex;align-items:center;gap:10px;padding:11px 10px;margin-bottom:6px;border-radius:12px;border:1px solid transparent;background:rgba(127,127,127,.08);cursor:pointer;text-align:left}' +
            '.ais-item.on{background:rgba(99,102,241,.2);border-color:var(--primary,#4361ee)}' +
            '.ais-ic{font-size:20px;flex:0 0 auto}.ais-tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}' +
            '.ais-tx b{font-size:14px;font-weight:700;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;word-break:break-word}' +
            '.ais-tx small{font-size:11px;color:var(--text-sub,#64748b)}' +
            '.ais-del{flex:0 0 auto;width:36px;height:36px;border:0;border-radius:10px;background:transparent;font-size:16px;cursor:pointer;opacity:.7}.ais-del:active{background:rgba(239,68,68,.2)}' +
            '.ais-empty{text-align:center;color:var(--text-sub,#64748b);font-size:13px;line-height:1.6;padding:28px 10px}' +
            'html.dark .ais-panel{background:#27354f}' +
            'body #tab-ai .ai-side{display:none !important}' +
            '@media (max-width:767px){body.ai-tab-on{overflow:hidden;overscroll-behavior:none;padding-bottom:0 !important}' +
            'body.ai-tab-on #tab-ai.active{display:flex !important;flex-direction:column;box-sizing:border-box;height:calc(100vh - var(--app-hdr,70px) - 75px);height:calc(100dvh - var(--app-hdr,70px) - 75px);padding-bottom:10px !important}' +
            'body.ai-tab-on #tab-ai .ai-dash{flex:1 1 auto;height:auto !important;min-height:0 !important}}' +
            '@media (min-width:1024px){.ais-btn,.ais-sheet{display:none !important}body #tab-ai .ai-side{display:flex !important}}';
        document.head.appendChild(st);
    }
    var head = document.querySelector('#tab-ai .ai-main-head');
    if (head && !document.getElementById('ais-open')) {
        var b = document.createElement('button'); b.type = 'button'; b.id = 'ais-open'; b.className = 'ais-btn';
        b.innerHTML = '<svg class=ic aria-hidden=true><use href=#i-history></use></svg> <span>Lịch sử</span><i id="ais-count"></i>'; b.onclick = function () { aiSheetOpen(); };
        var n = document.createElement('button'); n.type = 'button'; n.id = 'ais-new'; n.className = 'ais-btn ais-plus';
        n.setAttribute('aria-label', 'Cuộc trò chuyện mới'); n.title = 'Cuộc trò chuyện mới'; n.textContent = '＋'; n.onclick = function () { aiNewChat(); };
        head.appendChild(b); head.appendChild(n);
    }
    if (!document.getElementById('ais-sheet')) {
        var sh = document.createElement('div'); sh.id = 'ais-sheet'; sh.className = 'ais-sheet';
        sh.onclick = function (e) { if (e.target === sh) aiSheetClose(); };
        sh.innerHTML = '<div class="ais-panel" role="dialog" aria-label="Lịch sử trò chuyện"><div class="ais-grab"></div>' +
            '<div class="ais-head"><b><svg class=ic aria-hidden=true><use href=#i-history></use></svg> Lịch sử trò chuyện</b><button type="button" class="ais-x" aria-label="Đóng" onclick="aiSheetClose()"><svg class=ic aria-hidden=true><use href=#i-close></use></svg></button></div>' +
            '<button type="button" class="ais-newbtn" onclick="aiSheetNew()">＋ Cuộc trò chuyện mới</button>' +
            '<input id="ais-q" class="ais-q" type="search" placeholder="Tìm cuộc trò chuyện..." autocomplete="off" oninput="aiSheetFilter(this.value)" style="display:none">' +
            '<div id="ais-list" class="ais-list"></div></div>';
        document.body.appendChild(sh);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') aiSheetClose(); });
    }
}
function aiWhen(c) {
    try {
        var u = c.updatedAt, d = u && u.toDate ? u.toDate() : (u && u.seconds ? new Date(u.seconds * 1000) : null);
        if (!d) return '';
        var diff = Math.floor((nowMs() + VN_MS) / 86400000) - Math.floor((d.getTime() + VN_MS) / 86400000);
        if (diff <= 0) return 'Hôm nay'; if (diff === 1) return 'Hôm qua'; if (diff < 7) return diff + ' ngày trước';
        var v = new Date(d.getTime() + VN_MS), p2 = function (x) { return (x < 10 ? '0' : '') + x; };
        return p2(v.getUTCDate()) + '/' + p2(v.getUTCMonth() + 1) + '/' + v.getUTCFullYear();
    } catch (e) { return ''; }
}
function aiRenderSheet() {
    var cnt = document.getElementById('ais-count'); if (cnt) cnt.textContent = AI_LIST.length ? String(AI_LIST.length) : '';
    var list = document.getElementById('ais-list'); if (!list) return;
    var qi = document.getElementById('ais-q'); if (qi) qi.style.display = AI_LIST.length > 5 ? '' : 'none';
    if (!AI_LIST.length) { list.innerHTML = '<div class="ais-empty">Chưa có cuộc trò chuyện nào.<br>Hãy đặt câu hỏi đầu tiên cho trợ lý AI nhé!</div>'; return; }
    var q = (AI_SHEET_Q || '').trim().toLowerCase();
    var items = AI_LIST.filter(function (c) { return !q || String(c.title || '').toLowerCase().indexOf(q) >= 0; });
    if (!items.length) { list.innerHTML = '<div class="ais-empty">Không tìm thấy cuộc trò chuyện nào.</div>'; return; }
    list.innerHTML = items.map(function (c) {
        var id = aiEsc(c.id), w = aiWhen(c);
        return '<div class="ais-item' + (c.id === AI_CUR ? ' on' : '') + '" role="button" tabindex="0" onclick="aiSheetOpenChat(\'' + id + '\')">' +
            '<span class="ais-ic"><svg class=ic aria-hidden=true><use href=#i-chat></use></svg></span><div class="ais-tx"><b>' + aiEsc(c.title || 'Cuộc trò chuyện') + '</b>' + (w ? '<small>' + w + '</small>' : '') + '</div>' +
            '<button type="button" class="ais-del" aria-label="Xóa cuộc trò chuyện" onclick="event.stopPropagation();aiSheetDel(\'' + id + '\')"><svg class=ic aria-hidden=true><use href=#i-delete></use></svg></button></div>';
    }).join('');
}
function aiSheetOpen() {
    ensureAiSheet(); try { aiEnsureList(); } catch (e) {}
    AI_SHEET_Q = ''; var qi = document.getElementById('ais-q'); if (qi) qi.value = '';
    aiRenderSheet(); document.getElementById('ais-sheet').style.display = 'flex';
}
function aiSheetClose() { var sh = document.getElementById('ais-sheet'); if (sh) sh.style.display = 'none'; }
function aiSheetFilter(v) { AI_SHEET_Q = v || ''; aiRenderSheet(); }
function aiSheetNew() { aiSheetClose(); aiNewChat(); }
function aiSheetOpenChat(id) { aiSheetClose(); aiOpenChat(id); }
async function aiSheetDel(id) {
    var yes = true;
    try { yes = await eduConfirm('Cuộc trò chuyện này sẽ bị xóa vĩnh viễn.', { title: 'Xóa cuộc trò chuyện?', confirmText: 'Xóa', cancelText: 'Hủy' }); } catch (e) {}
    if (yes) aiDeleteChat(id);
}
window.aiSheetOpen = aiSheetOpen; window.aiSheetClose = aiSheetClose; window.aiSheetFilter = aiSheetFilter; window.aiSheetNew = aiSheetNew; window.aiSheetOpenChat = aiSheetOpenChat; window.aiSheetDel = aiSheetDel;
let AI_LOADED = false, AI_LOADING = null;
async function aiLoadList() {
    const uid = AI_UID;
    try {
        const u = fbAuth.currentUser; if (!u || u.isAnonymous) return;
        const s = await aiCol().orderBy('updatedAt', 'desc').limit(30).get();
        if (uid !== AI_UID) return;   // trong lúc chờ đã đổi tài khoản: bỏ kết quả của người trước
        const list = s.docs.map(d => ({ id: d.id, ...d.data() }));
        // cuộc trò chuyện vừa lưu trong lúc đang tải (chưa kịp có trong kết quả) thì giữ lại ở đầu danh sách
        const fresh = AI_LIST.filter(x => !list.some(y => y.id === x.id));
        AI_LIST = fresh.concat(list).slice(0, 30);
        AI_LOADED = true;
    } catch (e) { console.warn('Lịch sử AI:', e && e.message); if (uid === AI_UID) AI_LIST = []; }
    aiRenderList();
}
// Chỉ tải lịch sử (30 cuộc kèm toàn bộ tin nhắn) khi học sinh mở tab Chat AI; tải xong một lần thì không tải lại.
// Tải lỗi thì lần mở tab sau sẽ thử lại.
function aiEnsureList() {
    if (AI_LOADED || AI_LOADING || !AI_UID) return;
    const uid = AI_UID;
    AI_LOADING = aiLoadList().finally(() => {
        AI_LOADING = null;
        if (uid !== AI_UID && document.body.classList.contains('ai-tab-on')) aiEnsureList();   // đổi tài khoản khi đang tải: tải cho người mới
    });
}
function aiNewChat() {
    if (aiBusy) return eduAlert('Trợ lý AI đang trả lời, bạn chờ một chút nhé.', 'warning');
    AI_CUR = null; AI_HIST.length = 0; aiResetBox(); aiRenderList();
    const inp = document.getElementById('ai-question-input'); if (inp) inp.focus();
}
let AI_OPENING = false;
function aiRepaint() { aiResetBox(); AI_HIST.forEach(m => aiBubble(m.role, m.content)); }
async function aiOpenChat(id) {
    if (AI_OPENING) return;   // đang tải một cuộc khác: bỏ qua cú bấm thêm
    if (aiBusy) return eduAlert('Trợ lý AI đang trả lời, bạn chờ một chút nhé.', 'warning');
    const c = AI_LIST.find(x => x.id === id); if (!c) return;
    let msgs = Array.isArray(c.msgs) ? c.msgs : null;   // cuộc cũ: có sẵn; cuộc mới (v:2) hoặc chưa mở lần nào: phải tải riêng
    if (!msgs) {
        const uid = AI_UID, sendBtn = document.querySelector('.ai-in .chat-send');
        AI_OPENING = true; aiBusy = true;   // khóa gửi tin / đổi cuộc trong lúc tải để không ghi đè nhầm
        if (sendBtn) sendBtn.disabled = true;
        const box = document.querySelector('.ai-msgs');
        if (box) { box.innerHTML = ''; const g = document.createElement('div'); g.className = 'chat-bubble other'; g.style.alignSelf = 'flex-start'; g.textContent = 'Đang tải cuộc trò chuyện...'; box.appendChild(g); }
        let failed = false;
        try {
            const d = await aiCol().doc(id).collection('data').doc('msgs').get();
            msgs = d.exists && Array.isArray(d.data().msgs) ? d.data().msgs : [];
            c.msgs = msgs;   // nhớ lại để lần mở sau khỏi tải nữa
        } catch (e) { failed = true; console.warn('Không tải được cuộc trò chuyện:', e && e.message); }
        AI_OPENING = false; aiBusy = false;
        if (sendBtn) sendBtn.disabled = false;
        if (uid !== AI_UID) return;   // trong lúc chờ đã đổi tài khoản
        if (failed) { aiRepaint(); return eduAlert('Không mở được cuộc trò chuyện, thử lại sau.', 'warning'); }
    }
    AI_CUR = id; AI_HIST.length = 0;
    msgs.forEach(m => AI_HIST.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }));
    aiRepaint();
    aiRenderList();
}
async function aiSave() {
    try {
        const u = fbAuth.currentUser; if (!u || u.isAnonymous || !AI_HIST.length) return;
        const msgs = AI_HIST.slice(-40).map(m => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
        if (!AI_CUR) AI_CUR = aiCol().doc().id;
        const id = AI_CUR;
        const first = (AI_HIST.find(m => m.role === 'user') || {}).content || 'Cuộc trò chuyện';
        const old = AI_LIST.find(x => x.id === id);
        const title = old ? old.title : first.replace(/\s+/g, ' ').slice(0, 60);
        // Ghi nguyên tử 2 tài liệu: tiêu đề (nhẹ) + tin nhắn. Ghi đè tài liệu chính cũng bỏ luôn trường msgs của cuộc cũ (tự chuyển sang v:2).
        const ref = aiCol().doc(id), batch = fbDb.batch();
        batch.set(ref, { title, updatedAt: NOW(), v: 2 });
        batch.set(ref.collection('data').doc('msgs'), { msgs, updatedAt: NOW() });
        await batch.commit();
        AI_LIST = [{ id, title, msgs }].concat(AI_LIST.filter(x => x.id !== id)).slice(0, 30);
        aiRenderList();
    } catch (e) { console.warn('Không lưu được lịch sử AI:', e && e.message); }
}
async function aiDeleteChat(id) {
    if (aiBusy) return eduAlert('Trợ lý AI đang trả lời, bạn chờ một chút nhé.', 'warning');
    try {
        // Xóa cả tài liệu tin nhắn con (xóa tài liệu chính KHÔNG tự xóa tài liệu con); cuộc cũ không có tài liệu con thì lệnh xóa vô hại
        const ref = aiCol().doc(id), batch = fbDb.batch();
        batch.delete(ref.collection('data').doc('msgs')); batch.delete(ref);
        await batch.commit();
        AI_LIST = AI_LIST.filter(x => x.id !== id);
        if (AI_CUR === id) { AI_CUR = null; AI_HIST.length = 0; aiResetBox(); }
        aiRenderList();
    } catch (e) { eduAlert('Không xóa được cuộc trò chuyện, thử lại sau.', 'warning'); }
}
// Đăng nhập / đổi tài khoản: tải lại lịch sử, xóa nội dung của người trước
fbAuth.onAuthStateChanged(u => {
    const uid = u && !u.isAnonymous ? u.uid : '';
    if (uid === AI_UID) return;
    AI_UID = uid; AI_CUR = null; AI_LIST = []; AI_LOADED = false; AI_HIST.length = 0; aiResetBox(); aiRenderList();
    // Không tải lịch sử ngay lúc đăng nhập; chỉ tải khi mở tab Chat AI (nếu tab đang mở sẵn thì tải luôn)
    if (uid && document.body.classList.contains('ai-tab-on')) aiEnsureList();
});
window.aiNewChat = aiNewChat; window.aiOpenChat = aiOpenChat; window.aiDeleteChat = aiDeleteChat;

// =====================================================================================
// CHUỖI HỌC + THÚ CƯNG | BXH TUẦN | SỔ CÂU SAI
//  - Chuỗi học: tính từ ngày nộp bài (createdAt của submissions, giờ Việt Nam), không cần lưu thêm gì.
//  - Thú cưng: lưu ở privates/{uid}.pet = { type, name } (chỉ chủ tài khoản đọc/ghi) + bản sao localStorage.
//  - BXH tuần: mỗi học sinh ghi thêm wk (ngày bắt đầu tuần) + wx (XP tuần) vào bxh/summary -> CẦN thêm 'wk','wx' vào rules.
//  - Sổ câu sai: dựng từ bài đã nộp (answers) + đề (HW_DATA), không lưu thêm gì.
// =====================================================================================
var VN_MS = 7 * 3600 * 1000;
function vnDay(ms) { return Math.floor((ms + VN_MS) / 86400000); }
function subMs(x) { var t = x && (x.createdAt || x.submittedAt); return t && typeof t.toMillis === 'function' ? t.toMillis() : (typeof t === 'number' ? t : 0); }
function weekStartDay() { var d = vnDay(nowMs()); return d - ((d + 3) % 7); }   // 1/1/1970 là thứ Năm -> (d+3)%7 = 0 vào thứ Hai

// ---------- Chuỗi học (tính theo NGÀY ĐĂNG NHẬP vào web) ----------
// Mỗi ngày (giờ Việt Nam) chỉ cần mở web khi đã đăng nhập là được tính 1 ngày. Lưu ở privates/{uid}.loginDays = [số ngày VN, ...]
// (chỉ chủ tài khoản đọc/ghi - rules hiện tại đã cho phép) + bản sao localStorage. Ngày nộp bài vẫn được cộng thêm để không mất chuỗi cũ.
var LOGIN_DAYS = new Set(), LOGIN_UID = '';
function loginKey() { return 'eduorient_login_' + (ME ? ME.uid : ''); }
function saveLoginLocal() {
    try { localStorage.setItem(loginKey(), JSON.stringify(Array.from(LOGIN_DAYS).sort(function (a, b) { return a - b; }).slice(-400))); } catch (e) {}
}
function markLoginToday() {
    if (!ME || LOGIN_UID !== ME.uid) return;
    var t = vnDay(nowMs());
    if (LOGIN_DAYS.has(t)) return;
    LOGIN_DAYS.add(t); saveLoginLocal();
    fbDb.collection('privates').doc(ME.uid).set({ loginDays: firebase.firestore.FieldValue.arrayUnion(t) }, { merge: true })
        .catch(function (e) { console.warn('Chưa lưu được ngày đăng nhập lên máy chủ:', e); });
}
function reRenderStreak() {
    try { renderSidePet(); } catch (e) {}
    try { renderPetCard(true); } catch (e) {}
    try { renderStatCard(); } catch (e) {}
}
function loadLoginDays() {
    if (!ME || LOGIN_UID === ME.uid) return;
    LOGIN_UID = ME.uid; LOGIN_DAYS = new Set();
    try { (JSON.parse(localStorage.getItem(loginKey()) || '[]') || []).forEach(function (d) { if (isFinite(d)) LOGIN_DAYS.add(Number(d)); }); } catch (e) {}
    try { RESTORES = JSON.parse(localStorage.getItem(restoreKey()) || '{}') || {}; } catch (e) { RESTORES = {}; }
    try { RWIN = JSON.parse(localStorage.getItem(restoreWinKey()) || 'null'); } catch (e) { RWIN = null; }
    LOGIN_SYNCED = false;
    markLoginToday();   // ghi ngay hôm nay (local + máy chủ)
    var uid = ME.uid;
    fbDb.collection('privates').doc(uid).get().then(function (d) {
        if (!ME || ME.uid !== uid) return;
        var arr = d.exists ? (d.data() || {}).loginDays : null;
        if (Array.isArray(arr)) arr.forEach(function (x) { if (isFinite(x)) LOGIN_DAYS.add(Number(x)); });
        try { loadReview(); mergeReview(d.exists ? (d.data() || {}).review : null); } catch (e) {}
        var rs = d.exists ? (d.data() || {}).restores : null;
        if (rs && typeof rs === 'object') Object.keys(rs).forEach(function (k) { var v = Number(rs[k]) || 0; if (v > (Number(RESTORES[k]) || 0)) RESTORES[k] = v; });   // lấy số lớn hơn: tránh dùng quá lượt khi mất đồng bộ
        try { localStorage.setItem(restoreKey(), JSON.stringify(RESTORES)); } catch (e) {}
        var sw = d.exists ? (d.data() || {}).restoreWin : null;   // cùng 1 lần đứt: giữ mốc sớm hơn (không kéo dài hạn); khác lần: lấy lần mới hơn
        if (sw && isFinite(sw.k) && isFinite(sw.t) && (!RWIN || sw.k > RWIN.k || (sw.k === RWIN.k && sw.t < RWIN.t))) { RWIN = { k: Number(sw.k), t: Number(sw.t) }; saveRWin(); }
        LOGIN_SYNCED = true;
        saveLoginLocal(); ensureRestoreWindow(); reRenderStreak(); notifyRestore();
    }).catch(function () {});
}
// Mở web qua đêm (qua 0h giờ VN) rồi quay lại tab -> tính ngày mới
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && ME && LOGIN_UID === ME.uid && !LOGIN_DAYS.has(vnDay(nowMs()))) { markLoginToday(); reRenderStreak(); }
});
// ---------- Khôi phục chuỗi ----------
// Mỗi tháng (giờ VN) được khôi phục: 3 lượt; nếu chuỗi cũ (trước chỗ đứt) từ 100 ngày trở lên: 5 lượt. 1 lượt = vá lại 1 ngày bị bỏ lỡ.
// Chỉ vá được khoảng đứt GẦN NHẤT, vá trọn khoảng (đủ lượt mới vá), và chuỗi cũ phải từ 3 ngày. Lưu: privates/{uid}.restores = { 'YYYY-MM': số lượt đã dùng }
var RESTORES = {}, RWIN = null, LOGIN_SYNCED = false, RESTORE_HOURS = 24;   // RWIN = { k: ngày bắt đầu chuỗi mới, t: ms lúc phát hiện chuỗi đứt }
function restoreKey() { return 'eduorient_restore_' + (ME ? ME.uid : ''); }
function restoreWinKey() { return 'eduorient_restorewin_' + (ME ? ME.uid : ''); }
function saveRWin() { try { localStorage.setItem(restoreWinKey(), JSON.stringify(RWIN)); } catch (e) {} }
function monthKeyOf(day) { var d = new Date(day * 86400000); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2); }
function allActiveDays() {
    var days = new Set(LOGIN_DAYS);
    SUBS_ALL.forEach(function (x) { if (x.status === 'timeout') return; var ms = subMs(x); if (ms) days.add(vnDay(ms)); });
    return days;
}
function restoreInfo() {
    var days = allActiveDays(), today = vnDay(nowMs()), ym = monthKeyOf(today), used = Number(RESTORES[ym]) || 0;
    var start = days.has(today) ? today : (days.has(today - 1) ? today - 1 : null), cur = 0, d, i;
    if (start !== null) { d = start; while (days.has(d)) { cur++; d--; } } else d = today - 1;
    var runStart = start !== null ? d + 1 : null;
    // d = ngày đầu tiên bị bỏ lỡ ngay trước chuỗi hiện tại; đếm khoảng đứt rồi chuỗi cũ nằm trước nó
    var missing = [], guard = 0;
    while (!days.has(d) && guard < 60) { missing.push(d); d--; guard++; }
    var prev = 0; if (days.has(d)) { while (days.has(d)) { prev++; d--; } } else missing = [];
    var quota = (missing.length ? prev : cur) >= 100 ? 5 : 3, left = Math.max(0, quota - used);
    var win = RWIN && runStart !== null && RWIN.k === runStart ? RWIN.t : null, msLeft = win ? win + RESTORE_HOURS * 3600000 - nowMs() : 0;
    var broken = missing.length > 0 && prev >= 3, expired = broken && win !== null && msLeft <= 0, open = broken && win !== null && msLeft > 0;
    var ok = open && missing.length <= left;
    return { runStart: runStart, broken: broken, expired: expired, msLeft: msLeft, can: ok, gap: missing.length, missing: missing, prev: prev, cur: cur, quota: quota, used: used, left: left, ym: ym, tooLong: open && missing.length > left };
}
function notifyRestore() {
    if (!ME) return;
    var r = restoreInfo(), key = 'eduorient_restorenote_' + ME.uid, today = vnDay(nowMs());
    if (!r.can || localStorage.getItem(key) === String(today)) return;
    try { localStorage.setItem(key, String(today)); } catch (e) {}
    setTimeout(function () { eduToast('Chuỗi ' + r.prev + ' ngày vừa đứt ' + r.gap + ' ngày. Vào Tài khoản → Thành tích để khôi phục trong ' + fmtLeft(r.msLeft) + ' tới (còn ' + r.left + '/' + r.quota + ' lượt tháng này).', 'warning'); }, 2500);
}
// Chuỗi vừa đứt (và chuỗi cũ >= 3 ngày) -> bắt đầu đồng hồ 24h tính từ lần đăng nhập đầu tiên sau khi đứt
function ensureRestoreWindow() {
    if (!ME || !LOGIN_SYNCED || !RDY.sub) return;
    var r = restoreInfo();
    if (!r.broken || r.runStart === null || (RWIN && RWIN.k === r.runStart)) return;
    RWIN = { k: r.runStart, t: nowMs() }; saveRWin();
    fbDb.collection('privates').doc(ME.uid).set({ restoreWin: RWIN }, { merge: true }).catch(function () {});
    notifyRestore();
}
function restoreStreak() {
    var r = restoreInfo(); if (!ME || !r.can) return;
    var after = r.prev + r.gap + r.cur;
    eduConfirm('Dùng ' + r.gap + ' lượt khôi phục (còn ' + fmtLeft(r.msLeft) + ') để nối lại chuỗi ' + r.prev + ' ngày? Chuỗi sau khi nối: ' + after + ' ngày. Tháng này còn ' + (r.left - r.gap) + '/' + r.quota + ' lượt.',
        { title: 'Khôi phục chuỗi?', confirmText: 'Khôi phục', cancelText: 'Để sau', icon: 'question' }).then(function (yes) {
        if (!yes) return;
        var r2 = restoreInfo(); if (!r2.can) return;
        r2.missing.forEach(function (x) { LOGIN_DAYS.add(x); }); saveLoginLocal();
        RESTORES[r2.ym] = r2.used + r2.gap;
        try { localStorage.setItem(restoreKey(), JSON.stringify(RESTORES)); } catch (e) {}
        var upd = { loginDays: firebase.firestore.FieldValue.arrayUnion.apply(firebase.firestore.FieldValue, r2.missing), restores: {} }; upd.restores[r2.ym] = RESTORES[r2.ym];
        fbDb.collection('privates').doc(ME.uid).set(upd, { merge: true }).catch(function (e) { console.warn('Chưa lưu được lượt khôi phục:', e); });
        reRenderStreak();
        eduToast('Đã khôi phục! Chuỗi hiện tại: ' + (r2.prev + r2.gap + r2.cur) + ' ngày.', 'success');
    });
}
function streakInfo() {
    var days = allActiveDays();
    var today = vnDay(nowMs()), cur = 0, d = days.has(today) ? today : today - 1;
    while (days.has(d)) { cur++; d--; }
    var arr = Array.from(days).sort(function (a, b) { return a - b; }), best = 0, run = 0, prev = null;
    arr.forEach(function (v) { run = (prev !== null && v === prev + 1) ? run + 1 : 1; if (run > best) best = run; prev = v; });
    return { cur: cur, best: best, doneToday: days.has(today), alive: days.has(today) || days.has(today - 1) };
}

// ---------- Thú cưng ----------
// ---------- Hình thú cưng vẽ bằng SVG (thay emoji: mọi thiết bị hiển thị giống nhau) ----------
// petArt(loài, { mood: normal|happy|sad|sleep, hat, eyes, acc }) -> chuỗi <svg>. Đồ đeo vẽ theo toạ độ đầu thú (viewBox 200x205).
var PETART_UID = 0;
function paUniq(s) { var u = '-' + (++PETART_UID); return s.replace(/ id="(\w+)"/g, ' id="$1' + u + '"').replace(/url\(#(\w+)\)/g, 'url(#$1' + u + ')'); }   // id gradient riêng cho từng hình, tránh trùng giữa nhiều svg
function pmir(s) { return '<g transform="translate(200 0) scale(-1 1)">' + s + '</g>'; }
var PA_SP = {
    cat: { f: ['#ffe5b8', '#ffb866', '#e3822f'], b: ['#fffaf0', '#ffe3bd'], ear: 'cat', ei: '#f9a8c4', mk: 'stripe', tail: 'curl', muz: 1, wh: 1, nose: '#f2678f' },
    dog: { f: ['#fbe7c2', '#e1ad6b', '#b07a3e'], b: ['#fff6e6', '#f6dcb2'], d: ['#b9824a', '#7a4a22'], ear: 'dog', mk: 'patch', tail: 'wag', muz: 1, bn: 1 },
    rabbit: { f: ['#ffffff', '#f6edf1', '#dccad4'], b: ['#ffffff', '#fde8ef'], ear: 'rabbit', ei: '#f9b4cd', tail: 'puff', muz: 1, nose: '#f2678f' },
    chick: { f: ['#fff7ae', '#ffd93b', '#f0a800'], b: ['#fffbd0', '#ffe98a'], ear: 'tuft', beak: 1, arm: 'url(#fur)', paw: '#fb923c', br: '#d99a00' },
    fox: { f: ['#ffb985', '#f4772e', '#c2491d'], b: ['#fffaf3', '#ffe4cc'], d: ['#5a3320', '#2a160c'], ear: 'fox', mk: 'cheek', tail: 'bush', muz: 1, bn: 1 },
    panda: { f: ['#ffffff', '#f1f5f9', '#cbd5e1'], b: ['#ffffff', '#e8eef5'], d: ['#4b5563', '#111827'], ear: 'panda', mk: 'eyep', bn: 1, arm: 'url(#dk)', paw: 'url(#dk)', ac: '#fff', br: '#64748b', ec: '#0b0b0d' }
};
var PA_EARB = {
    cat: function (c) { var l = '<path d="M46 80Q40 34 62 26Q74 30 94 54Z" fill="url(#fur)"/><path d="M56 70Q53 44 64 38Q73 42 85 56Z" fill="' + c.ei + '"/>'; return l + pmir(l); },
    fox: function () { var l = '<path d="M44 84Q36 28 58 12Q78 28 94 56Z" fill="url(#fur)"/><path d="M52 72Q50 38 60 24Q72 38 84 56Z" fill="url(#dk)"/>'; return l + pmir(l); },
    rabbit: function (c) { var l = '<g transform="rotate(-12 70 70)"><ellipse cx="68" cy="34" rx="14" ry="36" fill="url(#fur)"/><ellipse cx="68" cy="36" rx="7" ry="26" fill="' + c.ei + '"/></g>'; return l + pmir(l); },
    panda: function () { var l = '<circle cx="52" cy="58" r="18" fill="url(#dk)"/>'; return l + pmir(l); }
};
var PA_EARF = {
    dog: function () { var l = '<g transform="rotate(14 46 90)"><ellipse cx="42" cy="98" rx="15" ry="32" fill="url(#dk)"/></g>'; return l + pmir(l); },
    tuft: function (c) { return '<path d="M100 52Q93 36 97 26Q103 38 100 52ZM101 52Q108 34 117 30Q112 45 101 52ZM99 53Q88 42 79 40Q88 51 99 53Z" fill="' + c.f[2] + '"/>'; }
};
var PA_TAIL = {
    curl: function (c) { return '<g class="pa-tail"><path d="M140 172Q184 172 178 128" fill="none" stroke="' + c.f[2] + '" stroke-width="16" stroke-linecap="round"/><path d="M140 170Q180 168 175 130" fill="none" stroke="url(#fur)" stroke-width="11" stroke-linecap="round"/></g>'; },
    wag: function () { return '<g class="pa-tail"><path d="M142 172Q172 164 168 138" fill="none" stroke="url(#dk)" stroke-width="14" stroke-linecap="round"/></g>'; },
    puff: function () { return '<g class="pa-tail"><circle cx="150" cy="176" r="15" fill="url(#belly)" stroke="#e5d3dc" stroke-width="1.5"/></g>'; },
    bush: function () { return '<g class="pa-tail"><path d="M138 178Q198 194 192 128Q176 142 150 152Z" fill="url(#fur)"/><ellipse cx="186" cy="136" rx="9" ry="13" transform="rotate(20 186 136)" fill="#fff"/></g>'; }
};
var PA_DEFS = '<radialGradient id="gold" cx=".4" cy=".25" r=".9"><stop offset="0" stop-color="#fff3a8"/><stop offset=".6" stop-color="#fbbf24"/><stop offset="1" stop-color="#b7791f"/></radialGradient>' +
    '<radialGradient id="pink" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffc2dd"/><stop offset="1" stop-color="#ec4899"/></radialGradient>' +
    '<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#475569"/><stop offset="1" stop-color="#0f172a"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="3"/></filter>';
// Đồ đeo: [x, y, rộng, cao] của khung hiển thị khi vẽ riêng làm icon cửa hàng + mã SVG
var PA_ITEMS = {
    hat_cap: [[58, 14, 106, 52], '<path d="M64 56Q62 20 100 20Q138 20 136 56Q100 46 64 56Z" fill="#ef4444"/><path d="M70 40Q84 26 104 26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35" fill="none"/><path d="M120 53Q152 46 160 60Q142 64 118 58Z" fill="#b91c1c"/><circle cx="100" cy="21" r="4" fill="#b91c1c"/>'],
    hat_straw: [[30, 12, 140, 54], '<ellipse cx="100" cy="54" rx="66" ry="13" fill="#f6d28b" stroke="#d9a441" stroke-width="2"/><path d="M70 52Q68 18 100 18Q132 18 130 52Q100 60 70 52Z" fill="#f2c46a" stroke="#d9a441" stroke-width="2"/><path d="M70 46Q100 56 130 46L131 38Q100 48 69 38Z" fill="#ec4899"/>'],
    hat_grad: [[40, 12, 120, 68], '<path d="M72 46V62Q100 74 128 62V46L100 56Z" fill="#1f2937"/><path d="M100 18L156 38L100 58L44 38Z" fill="#111827"/><path d="M100 22L146 38L100 54Z" fill="#fff" opacity=".1"/><path d="M100 38L144 44V66" fill="none" stroke="#fbbf24" stroke-width="2.4" stroke-linecap="round"/><rect x="140" y="64" width="9" height="12" rx="3" fill="#fbbf24"/><circle cx="100" cy="38" r="3.4" fill="#fbbf24"/>'],
    hat_top: [[50, 4, 100, 58], '<ellipse cx="100" cy="54" rx="46" ry="9" fill="#111827"/><path d="M75 54V14Q75 8 82 8H118Q125 8 125 14V54Z" fill="#1f2937"/><path d="M75 42H125V49H75Z" fill="#dc2626"/><path d="M82 14V40" stroke="#fff" stroke-width="3" opacity=".18" stroke-linecap="round"/>'],
    hat_crown: [[64, 12, 72, 46], '<path d="M70 54L74 24L90 40L100 18L110 40L126 24L130 54Z" fill="url(#gold)" stroke="#b7791f" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="42" r="4" fill="#ef4444"/><circle cx="82" cy="46" r="3" fill="#38bdf8"/><circle cx="118" cy="46" r="3" fill="#38bdf8"/><path d="M78 34L84 44" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>'],
    eyes_glass: [[46, 82, 108, 38], '<g fill="#bae6fd" fill-opacity=".28" stroke="#334155" stroke-width="3"><circle cx="80" cy="101" r="15"/><circle cx="120" cy="101" r="15"/></g><path d="M95 99Q100 94 105 99" fill="none" stroke="#334155" stroke-width="3"/><path d="M65 99L52 94M135 99L148 94" stroke="#334155" stroke-width="3" stroke-linecap="round"/><path d="M71 94Q75 90 80 90" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>'],
    eyes_sun: [[60, 84, 80, 30], '<rect x="64" y="88" width="30" height="22" rx="10" fill="url(#glass)"/><rect x="106" y="88" width="30" height="22" rx="10" fill="url(#glass)"/><path d="M94 96H106" stroke="#0f172a" stroke-width="3"/><path d="M70 93Q76 91 84 93M112 93Q118 91 126 93" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55" fill="none"/>'],
    acc_bow: [[36, 42, 56, 36], '<path d="M64 62L44 50Q40 66 52 72Z" fill="url(#pink)"/><path d="M64 62L82 46Q88 62 74 70Z" fill="url(#pink)"/><circle cx="64" cy="62" r="7" fill="#be185d"/><circle cx="62" cy="60" r="2.4" fill="#fff" opacity=".7"/>'],
    acc_star: [[130, 36, 46, 44], '<path d="M152 40L157 52L170 53L160 61L163 74L152 67L141 74L144 61L134 53L147 52Z" fill="url(#gold)" stroke="#b7791f" stroke-width="1.6" stroke-linejoin="round"/>'],
    acc_medal: [[68, 124, 64, 64], '<path d="M78 130L100 166L122 130" fill="none" stroke="#3b82f6" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="100" cy="174" r="12" fill="url(#gold)" stroke="#b7791f" stroke-width="2"/><path d="M100 167l2.6 5.2 5.8.8-4.2 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.2-4 5.8-.8Z" fill="#fff" opacity=".85"/>']
};
function paFace(m, c) {
    var ec = c.ec || '#2b1b17', ac = c.ac || '#2b1b17', br = c.br || '#b9753b', mo = c.mo || '#7a3b2e', mouth = !c.beak;
    var smile = mouth ? '<path d="M93 122Q100 128 107 122" fill="none" stroke="' + mo + '" stroke-width="2.6" stroke-linecap="round"/>' : '';
    if (m === 'happy') return '<g class="pa-eyes"><path d="M70 104Q80 90 90 104M110 104Q120 90 130 104" fill="none" stroke="' + ac + '" stroke-width="4.5" stroke-linecap="round"/></g>' + (mouth ? '<path d="M90 119Q100 136 110 119Z" fill="#8c2f39" stroke="' + mo + '" stroke-width="2" stroke-linejoin="round"/><path d="M95 127Q100 133 105 127Q100 124 95 127Z" fill="#f2678f"/>' : '');
    if (m === 'sleep') return '<path d="M70 100Q80 108 90 100M110 100Q120 108 130 100" fill="none" stroke="' + ac + '" stroke-width="4.5" stroke-linecap="round"/>' + smile + '<text class="pa-tw" x="144" y="52" font-size="20" font-weight="700" fill="#a5b4fc">z</text><text class="pa-tw" style="animation-delay:.9s" x="160" y="34" font-size="14" font-weight="700" fill="#a5b4fc">z</text>';
    var e = (m === 'sad' ? 102 : 100), hl = (m === 'sad' ? 98.5 : 96.5);
    var s = '<g class="pa-eyes"><ellipse cx="80" cy="' + e + '" rx="7" ry="9" fill="' + ec + '"/><ellipse cx="120" cy="' + e + '" rx="7" ry="9" fill="' + ec + '"/><circle cx="77.5" cy="' + hl + '" r="3" fill="#fff"/><circle cx="117.5" cy="' + hl + '" r="3" fill="#fff"/></g>';
    if (m === 'sad') return s + '<path d="M68 90L88 84M112 84L132 90" stroke="' + br + '" stroke-width="3.4" stroke-linecap="round"/>' + (mouth ? '<path d="M93 128Q100 120 107 128" fill="none" stroke="' + mo + '" stroke-width="2.6" stroke-linecap="round"/>' : '') + '<path d="M88 112Q85 120 88 124Q91 120 88 112Z" fill="#7dd3fc"/>';
    return s + smile;
}
function petArt(type, o) {
    o = o || {};
    var c = PA_SP[type] || PA_SP.cat, d = c.d || ['#555', '#222'], x = '';
    x += '<defs><radialGradient id="fur" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="' + c.f[0] + '"/><stop offset=".55" stop-color="' + c.f[1] + '"/><stop offset="1" stop-color="' + c.f[2] + '"/></radialGradient>' +
        '<radialGradient id="belly" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="' + c.b[0] + '"/><stop offset="1" stop-color="' + c.b[1] + '"/></radialGradient>' +
        '<radialGradient id="dk" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="' + d[0] + '"/><stop offset="1" stop-color="' + d[1] + '"/></radialGradient>' + PA_DEFS + '</defs>';
    x += '<ellipse cx="100" cy="196" rx="54" ry="8" fill="#000" opacity=".22" filter="url(#blur)"/>';
    if (c.tail) x += PA_TAIL[c.tail](c);
    x += '<ellipse cx="100" cy="158" rx="46" ry="36" fill="url(#fur)"/><ellipse cx="100" cy="168" rx="27" ry="22" fill="url(#belly)"/>';
    if (c.arm) { var a = '<ellipse cx="58" cy="156" rx="12" ry="26" transform="rotate(18 58 156)" fill="' + c.arm + '"' + (c.beak ? ' stroke="' + c.f[2] + '" stroke-width="1.5"' : '') + '/>'; x += a + pmir(a); }
    var pw = c.paw || 'url(#belly)'; x += '<ellipse cx="76" cy="188" rx="15" ry="9" fill="' + pw + '"/><ellipse cx="124" cy="188" rx="15" ry="9" fill="' + pw + '"/>';
    if (PA_EARB[c.ear]) x += PA_EARB[c.ear](c);
    x += '<ellipse cx="100" cy="100" rx="58" ry="50" fill="url(#fur)"/>';
    if (c.mk === 'stripe') x += '<g stroke="#d9772b" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M100 53V65M89 55L91 65M111 55L109 65"/></g>';
    if (c.mk === 'patch') x += '<ellipse cx="124" cy="96" rx="17" ry="20" fill="url(#dk)" opacity=".85"/>';
    if (c.mk === 'cheek') { var ch = '<path d="M42 100Q62 98 82 124Q64 142 46 128Q38 114 42 100Z" fill="url(#belly)"/>'; x += ch + pmir(ch); }
    if (c.mk === 'eyep') { var ep = '<ellipse cx="80" cy="102" rx="13" ry="17" transform="rotate(22 80 102)" fill="#1f2937"/>'; x += ep + pmir(ep); }
    if (c.muz) x += '<ellipse cx="100" cy="118" rx="22" ry="15" fill="url(#belly)"/>';
    x += '<ellipse cx="66" cy="115" rx="10" ry="6" fill="#ff8fb1" opacity=".55"/><ellipse cx="134" cy="115" rx="10" ry="6" fill="#ff8fb1" opacity=".55"/>';
    x += '<ellipse cx="80" cy="70" rx="24" ry="10" fill="#fff" opacity=".28" transform="rotate(-22 80 70)"/>';
    if (PA_EARF[c.ear]) x += PA_EARF[c.ear](c);
    x += paFace(o.mood || 'normal', c);
    if (c.beak) x += '<path d="M89 107Q100 100 111 107Q109 120 100 124Q91 120 89 107Z" fill="#fb923c"/><path d="M93 110Q100 106 107 110" stroke="#fdba74" stroke-width="2" fill="none" stroke-linecap="round"/>';
    else if (c.bn) x += '<ellipse cx="100" cy="109" rx="8" ry="5.5" fill="#1f2937"/><ellipse cx="98" cy="107.5" rx="2.6" ry="1.4" fill="#fff" opacity=".6"/>';
    else x += '<path d="M96 110Q100 106 104 110Q100 115 96 110Z" fill="' + c.nose + '"/>';
    if (c.wh) x += '<g stroke="#b9753b" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M72 118L52 114M72 122L53 126M128 118L148 114M128 122L147 126"/></g>';
    ['eyes', 'hat', 'acc'].forEach(function (k) { if (o[k] && PA_ITEMS[o[k]]) x += PA_ITEMS[o[k]][1]; });
    return paUniq('<svg viewBox="0 0 200 205" role="img" aria-label="Thú cưng" style="display:block;width:100%;height:auto;overflow:visible">' + x + '</svg>');
}
// Icon đồ đeo (cửa hàng): chỉ cắt đúng vùng món đồ
function paItemIcon(id, px) {
    var it = PA_ITEMS[id]; if (!it) return '';
    var b = it[0];
    return paUniq('<svg viewBox="' + b.join(' ') + '" width="' + px + '" height="' + px + '" aria-hidden="true" style="display:block;overflow:visible"><defs>' + PA_DEFS + '</defs>' + it[1] + '</svg>');
}
// ---- Nền có trang trí cho thú cưng ----
var PA_SEED = 7;
function paR() { PA_SEED = (PA_SEED * 9301 + 49297) % 233280; return PA_SEED / 233280; }
function paStar(x, y, s, fill, tw) { return '<path ' + (tw ? 'class="pa-tw" style="animation-delay:' + (paR() * 3).toFixed(1) + 's" ' : '') + 'transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 -6Q0 0 6 0Q0 0 0 6Q0 0 -6 0Q0 0 0 -6Z" fill="' + fill + '"/>'; }
function paPts(n, fn) { PA_SEED = 7; var s = ''; for (var i = 0; i < n; i++) s += fn(i); return s; }
function paTw(cx, cy, r, extra) { return '<circle class="pa-tw" style="animation-delay:' + (paR() * 3).toFixed(1) + 's" cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' + extra + '/>'; }
function paPine(x, y, k, col) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><rect x="-4" y="22" width="8" height="14" fill="#7c4a21"/><path d="M0 -50L22 -14H-22Z" fill="' + col + '"/><path d="M0 -36L26 4H-26Z" fill="' + col + '"/><path d="M0 -20L30 24H-30Z" fill="' + col + '"/></g>'; }
function paLolly(x, y, col) { return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-2" y="12" width="4" height="48" rx="2" fill="#f8fafc"/><circle r="19" fill="#fff"/><circle r="13" fill="none" stroke="' + col + '" stroke-width="5"/><circle r="4" fill="' + col + '"/></g>'; }
var PA_SCENES = {
    bg_candy: function () {
        var cols = ['#f472b6', '#38bdf8', '#facc15', '#a78bfa', '#34d399'];
        return paLolly(36, 70, '#ec4899') + paLolly(264, 96, '#8b5cf6') + paPts(26, function (i) { var x = (paR() * 290 + 5).toFixed(0), y = (paR() * 190 + 8).toFixed(0); return '<rect x="' + x + '" y="' + y + '" width="9" height="3.4" rx="1.7" fill="' + cols[i % 5] + '" transform="rotate(' + (paR() * 180).toFixed(0) + ' ' + x + ' ' + y + ')"/>'; }) +
            '<path d="M0 236Q25 220 50 236T100 236T150 236T200 236T250 236T300 236V270H0Z" fill="#fff" opacity=".9"/><circle cx="40" cy="244" r="6" fill="#ef4444"/><circle cx="262" cy="248" r="6" fill="#ef4444"/>';
    },
    bg_ocean: function () {
        return '<path d="M50 0L100 0L170 270L80 270Z M170 0L205 0L270 270L215 270Z" fill="#fff" opacity=".08"/>' + paPts(14, function () { return paTw((paR() * 290 + 5).toFixed(0), (paR() * 220 + 10).toFixed(0), (2 + paR() * 5).toFixed(1), 'fill="none" stroke="#fff" stroke-width="1.5"'); }) +
            '<g transform="translate(250 96)"><ellipse rx="13" ry="8" fill="#fbbf24"/><path d="M11 0L22 -8V8Z" fill="#f59e0b"/><circle cx="-6" cy="-2" r="1.7" fill="#111"/></g><g transform="translate(46 150) scale(-1 1)"><ellipse rx="10" ry="6" fill="#fb7185"/><path d="M9 0L18 -6V6Z" fill="#e11d48"/><circle cx="-5" cy="-1.5" r="1.5" fill="#111"/></g>' +
            '<path d="M22 270Q10 240 22 220Q34 200 22 180" fill="none" stroke="#16a34a" stroke-width="6" stroke-linecap="round"/><path d="M280 270Q292 244 280 224Q268 206 282 190" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>' +
            '<path d="M0 236Q40 220 80 236T160 236T240 236T300 236V270H0Z" fill="#0ea5e9" opacity=".5"/><path d="M0 250Q50 238 100 250T200 250T300 250V270H0Z" fill="#0369a1" opacity=".55"/>';
    },
    bg_forest: function () {
        return '<circle cx="250" cy="42" r="30" fill="#fef9c3" opacity=".75"/><circle cx="250" cy="42" r="18" fill="#fef08a"/>' + paPine(32, 190, 1.1, '#166534') + paPine(268, 186, 1.2, '#14532d') + paPine(70, 214, .8, '#15803d') + paPine(236, 216, .8, '#166534') +
            '<ellipse cx="150" cy="292" rx="230" ry="66" fill="#15803d"/><ellipse cx="60" cy="280" rx="100" ry="30" fill="#166534"/>' + paPts(12, function () { return paTw((paR() * 280 + 10).toFixed(0), (paR() * 190 + 30).toFixed(0), 2.4, 'fill="#fde047"'); }) +
            '<g transform="translate(86 244)"><path d="M-10 0Q0 -16 10 0Z" fill="#ef4444"/><circle cx="-3" cy="-5" r="1.6" fill="#fff"/><circle cx="3" cy="-7" r="1.3" fill="#fff"/><rect x="-3" y="0" width="6" height="8" fill="#fef3c7"/></g>';
    },
    bg_sunset: function () {
        return '<circle cx="150" cy="196" r="62" fill="#fef08a"/><circle cx="150" cy="196" r="82" fill="#fde047" opacity=".25"/><g fill="#fff" opacity=".75"><ellipse cx="56" cy="60" rx="28" ry="9"/><ellipse cx="76" cy="51" rx="17" ry="9"/><ellipse cx="236" cy="96" rx="26" ry="8"/><ellipse cx="252" cy="88" rx="15" ry="8"/></g>' +
            '<path d="M196 54q6-8 12 0q6-8 12 0M226 74q5-6 10 0q5-6 10 0" stroke="#7c2d12" fill="none" stroke-width="2" stroke-linecap="round"/>' +
            '<path d="M0 226Q70 196 150 222T300 210V270H0Z" fill="#9d174d" opacity=".85"/><path d="M0 248Q80 230 160 250T300 240V270H0Z" fill="#581c87"/>';
    },
    bg_space: function () {
        return paPts(40, function () { return paTw((paR() * 296 + 2).toFixed(0), (paR() * 260 + 4).toFixed(0), (0.6 + paR() * 1.4).toFixed(1), 'fill="#fff"'); }) + paStar(60, 130, 1.3, '#fde68a', 1) + paStar(246, 168, 1.1, '#fff', 1) + paStar(150, 28, .9, '#c7d2fe', 1) +
            '<defs><radialGradient id="pl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fca5a5"/><stop offset="1" stop-color="#7c3aed"/></radialGradient><linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
            '<g transform="translate(244 62)"><ellipse rx="36" ry="8" fill="none" stroke="#fcd34d" stroke-width="3" opacity=".6" transform="rotate(-20)"/><circle r="22" fill="url(#pl)"/><path d="M-34 4Q0 16 34 -6" fill="none" stroke="#fcd34d" stroke-width="3" transform="rotate(-20)" opacity=".9"/></g>' +
            '<path d="M48 38a20 20 0 1 0 22 26a16 16 0 1 1 -22 -26z" fill="#fde68a"/><path d="M96 40L150 62" stroke="url(#sh)" stroke-width="2.4" stroke-linecap="round"/><circle cx="52" cy="226" r="9" fill="#38bdf8" opacity=".85"/><circle cx="49" cy="223" r="3" fill="#fff" opacity=".5"/>';
    }
};
function paSceneSvg(bgId) {
    var f = PA_SCENES[bgId]; if (!f) return '';
    return paUniq('<svg viewBox="0 0 300 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="position:absolute;left:0;top:0;width:100%;height:100%;display:block">' + f() + '</svg>');
}
function paSceneHtml(bgIt) { return bgIt ? '<span style="position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;overflow:hidden;pointer-events:none;">' + paSceneSvg(bgIt.id) + '</span>' : ''; }
function paSlotIcon(slot) {   // icon nhỏ cho tab cửa hàng
    var h;
    if (slot === 'bg') h = '<span style="position:relative;display:block;width:22px;height:22px;border-radius:50%;overflow:hidden;background:#312e81;">' + paSceneSvg('bg_space') + '</span>';
    else h = paItemIcon({ hat: 'hat_top', eyes: 'eyes_sun', acc: 'acc_bow' }[slot], 22);
    return '<span style="display:inline-block;vertical-align:middle;margin-right:2px;">' + h + '</span>';
}
// Thú cưng hiện tại (theo tâm trạng + đồ đang đeo). Cấp từ "Vương giả" trở lên tự đội vương miện nếu chưa đội mũ.
function petArtNow() {
    var s = streakInfo(), st = petStageOf(s.cur), h = shopEq('hat'), e = shopEq('eyes'), a = shopEq('acc');
    return petArt(PET && PET.type, { mood: s.doneToday ? 'happy' : (s.alive ? 'sad' : 'sleep'), hat: h ? h.id : (st >= 3 ? 'hat_crown' : ''), eyes: e ? e.id : '', acc: a ? a.id : '' });
}
var PET_TYPES = [['cat', '🐱', 'Mèo'], ['dog', '🐶', 'Cún'], ['rabbit', '🐰', 'Thỏ'], ['chick', '🐥', 'Gà con'], ['fox', '🦊', 'Cáo'], ['panda', '🐼', 'Gấu trúc']];
var PET_STAGES = [['Bé con', 0], ['Lớn lên', 3], ['Chăm chỉ', 7], ['Vương giả', 14], ['Huyền thoại', 30]];
var PET = null, PET_UID = '', PET_PICK = 'cat';
function petKey() { return 'eduorient_pet_' + (ME ? ME.uid : ''); }
function cleanPet(p) {
    if (!p || typeof p !== 'object' || !PET_TYPES.some(function (t) { return t[0] === p.type; })) return null;
    return { type: p.type, name: String(p.name || '').slice(0, 16) };
}
function loadPet() {
    loadLoginDays();
    if (!ME || PET_UID === ME.uid) return;
    PET_UID = ME.uid; PET = null;
    SHOP = { owned: [], eq: {} }; try { SHOP = cleanShop(JSON.parse(localStorage.getItem(shopKey()) || 'null')) || SHOP; } catch (e) {}
    try { PET = cleanPet(JSON.parse(localStorage.getItem(petKey()) || 'null')); } catch (e) {}
    fbDb.collection('privates').doc(ME.uid).get().then(function (d) {
        var p = d.exists ? cleanPet((d.data() || {}).pet) : null;
        if (p) { PET = p; try { localStorage.setItem(petKey(), JSON.stringify(p)); } catch (e) {} }
        var sh = d.exists ? cleanShop((d.data() || {}).shop) : null;
        if (sh) { SHOP = sh; try { localStorage.setItem(shopKey(), JSON.stringify(sh)); } catch (e) {} }
        renderPetCard(true);
    }).catch(function () {});
}
function savePet() {
    try { localStorage.setItem(petKey(), JSON.stringify(PET)); } catch (e) {}
    fbDb.collection('privates').doc(ME.uid).set({ pet: PET }, { merge: true }).catch(function (e) { console.warn('Chưa lưu được thú cưng lên máy chủ:', e); });
}
function petPick(id) {
    var inp = document.getElementById('pet-name-input'), v = inp ? inp.value : '';
    PET_PICK = id; renderPetCard(true);
    var i2 = document.getElementById('pet-name-input'); if (i2) i2.value = v;
}
function adoptPet() {
    var inp = document.getElementById('pet-name-input'), nm = inp ? inp.value.trim().slice(0, 16) : '';
    if (!nm) { eduAlert('Hãy đặt tên cho thú cưng nhé.', 'warning'); return; }
    PET = { type: PET_PICK, name: nm }; savePet(); renderPetCard(true);
}
function petRename() {
    if (!PET || typeof eduPrompt !== 'function') return;
    eduPrompt('Tên mới cho thú cưng của bạn (tối đa 16 ký tự):', { title: 'Đổi tên thú cưng', input: 'text', placeholder: PET.name, maxLength: 16, confirmText: 'Lưu' }).then(function (nm) {
        nm = String(nm || '').trim().slice(0, 16); if (!nm || !PET) return;
        PET.name = nm; savePet(); renderPetCard(true);
    });
}
function goBaiTap() { var nav = document.querySelector('.nav-item[onclick*="tab-baitap"]'); if (nav) switchTab('tab-baitap', nav, true); }
function petEmoji() { return (PET_TYPES.find(function (t) { return t[0] === (PET && PET.type); }) || PET_TYPES[0])[1]; }
function petStageOf(n) { var st = 0; PET_STAGES.forEach(function (x, i) { if (n >= x[1]) st = i; }); return st; }
// Widget nhỏ ở Sidebar (laptop), nằm ngay trên nút Tin nhắn
function renderSidePet() {
    try { goalCheck(); } catch (e) {}
    try { ensureRestoreWindow(); } catch (e) {}
    try { renderSideStreak(); } catch (e) {}
    try { renderMobilePS(); } catch (e) {}
    var el = document.getElementById('side-pet'); if (!el) return;
    if (!ME || !RDY.sub) { el.style.display = 'none'; return; }
    el.style.display = '';
    if (!PET) { el.innerHTML = '<span class="sp-emo"><svg class=ic aria-hidden=true><use href=#i-paw></use></svg></span><div class="sp-txt"><b>Nhận nuôi thú cưng</b><small>Học đều để bé lớn lên</small></div>'; return; }
    var s = streakInfo(), msg = s.doneToday ? 'Đang vui' : s.alive ? 'Đang đói' : 'Đang ngủ';
    el.innerHTML = '<span class="sp-emo pa" style="' + (s.doneToday ? 'animation:petBounce 1.6s ease-in-out infinite;' : (s.alive ? 'animation:petFloat 3s ease-in-out infinite;' : 'animation:petBreath 3.6s ease-in-out infinite;')) + '">' + petArtNow() + '</span>' +
        '<div class="sp-txt"><b>' + esc(PET.name) + '</b><small><svg class=ic aria-hidden=true><use href=#i-fire></use></svg> ' + s.cur + ' ngày • ' + msg + '</small></div>';
}
// ---------- Điện thoại / máy tính bảng (< 1024px): sidebar bị ẩn nên ngọn lửa + thú cưng hiện ở THANH TRÊN và THẺ ĐẦU TRANG CHỦ ----------
// Toàn bộ CSS + DOM được tạo từ JS (không cần sửa hocsinh.html). Dùng lại dữ liệu streakInfo()/PET như sidebar.
function ensureMobilePS() {
    if (!document.getElementById('mps-style')) {
        var st = document.createElement('style'); st.id = 'mps-style';
        st.textContent =
            '.m-streak-chip{display:flex;align-items:center;gap:2px;margin-left:auto;margin-right:12px;padding:2px 8px;border-radius:999px;cursor:pointer;border:1px solid var(--border,#e2e8f0);background:rgba(127,127,127,.10);font-weight:800;font-size:16px;line-height:1;color:var(--text-main,inherit);-webkit-tap-highlight-color:transparent}' +
            '.m-streak-chip .mc-flame{width:40px;height:50px;flex:0 0 auto;display:block;transform-origin:50% 100%}' +
            '.m-ps-card{display:flex;align-items:center;gap:14px;margin:0 0 12px;padding:8px 14px;border-radius:18px;border:1px solid var(--border,#e2e8f0);cursor:pointer;box-sizing:border-box;width:100%;color:var(--text-main,inherit);-webkit-tap-highlight-color:transparent}' +
            '.m-ps-card .mp-flame{width:68px;height:85px;flex:0 0 auto;display:block;transform-origin:50% 100%}' +
            '.m-ps-card .mp-info{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px}' +
            '.m-ps-card .mp-days{font-size:15px;font-weight:800}' +
            '.m-ps-card .mp-sub{font-size:12px;font-weight:600;line-height:1.35}' +
            '.m-ps-card .mp-pet{display:flex;align-items:center;gap:10px;margin-top:6px;padding:6px 10px;border-radius:14px;background:rgba(127,127,127,.12)}' +
            '.m-ps-card .mp-emo{font-size:30px;line-height:1;flex:0 0 auto;display:inline-block}' +
            '.m-ps-card .mp-pt{min-width:0;display:flex;flex-direction:column;line-height:1.3}' +
            '.m-ps-card .mp-pt b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
            '.m-ps-card .mp-pt small{font-size:12px;color:var(--text-sub,#64748b)}' +
            '@media (min-width:1024px){.m-streak-chip,.m-ps-card{display:none !important}}' +
            'body.exam-locked .m-streak-chip,body.exam-locked .m-ps-card{display:none !important}';
        document.head.appendChild(st);
    }
    var chip = document.getElementById('m-streak-chip');
    if (!chip) {
        var hdr = document.querySelector('.app-header'), av = document.getElementById('user-avatar');
        if (hdr) {
            chip = document.createElement('div'); chip.id = 'm-streak-chip'; chip.className = 'm-streak-chip';
            chip.setAttribute('role', 'button'); chip.setAttribute('tabindex', '0'); chip.title = 'Chuỗi học liên tiếp';
            chip.onclick = function () { goPet(); };
            chip.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goPet(); } };
            if (av && av.parentNode === hdr) hdr.insertBefore(chip, av); else hdr.appendChild(chip);
        }
    }
    var card = document.getElementById('m-ps-card');
    if (!card) {
        var tab = document.getElementById('tab-phantich'), lb = document.getElementById('lock-banner');
        if (tab) {
            card = document.createElement('div'); card.id = 'm-ps-card'; card.className = 'm-ps-card';
            card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
            card.onclick = function () { goPet(); };
            card.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goPet(); } };
            if (lb && lb.parentNode === tab) tab.insertBefore(card, lb.nextSibling); else tab.insertBefore(card, tab.firstChild);
        }
    }
    return { chip: chip, card: card };
}
function renderMobilePS() {
    var o = ensureMobilePS(), chip = o.chip, card = o.card;
    if (!ME || !RDY.sub) { if (chip) chip.style.display = 'none'; if (card) card.style.display = 'none'; return; }
    var s = streakInfo(), alive = s.alive, tier = flameTier(s.cur, alive), c = FLAME_PAL[tier], glow = c[5];
    var live = alive && s.cur > 0;
    var anim = s.doneToday ? 'flameFlicker 1.3s ease-in-out infinite' : (live ? 'flameFlicker 2.4s ease-in-out infinite' : 'none');
    var shadow = glow ? 'filter:drop-shadow(0 0 ' + (s.doneToday ? 8 : 4) + 'px rgba(' + glow + ',.85));' : '';
    var dim = (alive && !s.doneToday) ? 'opacity:.85;' : '';
    // Thanh trên: ngọn lửa nhỏ + số ngày (số cũng nằm trong lửa nên chỉ cần ngọn lửa; thêm số lớn bên cạnh cho dễ đọc)
    if (chip) {
        chip.style.display = '';
        chip.innerHTML = '<div class="mc-flame" style="animation:' + anim + ';' + shadow + dim + '">' + flameSvg(s.cur, c, live, 'mcf') + '</div>';
        chip.setAttribute('aria-label', s.cur + ' ngày liên tiếp');
    }
    if (card) {
        var hour = Math.floor(((nowMs() + VN_MS) % 86400000) / 3600000), sub, subColor = 'var(--text-sub)';
        if (s.doneToday) { sub = '✓ Hôm nay đã giữ lửa'; subColor = '#22c55e'; }
        else if (live) { sub = hour >= 19 ? '<svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Sắp tắt! Vào học ngay' : 'Đăng nhập mỗi ngày để giữ lửa'; subColor = hour >= 19 ? '#f97316' : 'var(--text-sub)'; }
        else sub = 'Đăng nhập mỗi ngày để thắp lửa';
        var rr = restoreInfo(); if (rr.can) { sub = '<svg class=ic aria-hidden=true><use href=#i-heart-broken></use></svg> Khôi phục chuỗi ' + rr.prev + ' ngày'; subColor = '#f97316'; }
        var pet;
        if (!PET) pet = '<div class="mp-pet"><span class="mp-emo"><svg class=ic aria-hidden=true><use href=#i-paw></use></svg></span><div class="mp-pt"><b>Nhận nuôi thú cưng</b><small>Học đều để bé lớn lên</small></div></div>';
        else {
            var msg = s.doneToday ? 'Đang vui' : alive ? 'Đang đói' : 'Đang ngủ';
            pet = '<div class="mp-pet"><span class="mp-emo pa" style="' + (s.doneToday ? 'animation:petBounce 1.6s ease-in-out infinite;' : (alive ? 'animation:petFloat 3s ease-in-out infinite;' : 'animation:petBreath 3.6s ease-in-out infinite;')) + '">' + petArtNow() + '</span>' +
                '<div class="mp-pt"><b>' + esc(PET.name) + '</b><small>' + msg + '</small></div></div>';
        }
        card.style.display = '';
        card.style.background = glow ? 'radial-gradient(circle at 18% 45%,rgba(' + glow + ',.22),rgba(' + glow + ',0) 62%),rgba(127,127,127,.07)' : 'rgba(127,127,127,.08)';
        card.innerHTML = '<div class="mp-flame" style="animation:' + anim + ';' + (glow ? 'filter:drop-shadow(0 0 ' + (s.doneToday ? 12 : 6) + 'px rgba(' + glow + ',.85));' : '') + dim + '">' + flameSvg(s.cur, c, live, 'mpf') + '</div>' +
            '<div class="mp-info"><div class="mp-days">ngày liên tiếp</div><div class="mp-sub" style="color:' + subColor + ';">' + sub + '</div>' + goalBarHtml('mob') + pet + '</div>';
    }
}
function goPet() {
    var nav = (window.innerWidth < 1024 && document.getElementById('nav-profile')) || document.getElementById('side-profile'); if (nav) switchTab('tab-profile', nav, false);
    setTimeout(function () { var c = document.getElementById('pet-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 250);
}
// Thông báo thú cưng (toast trong app): lên cấp, chuỗi sắp đứt / đã đứt, nhắc học mỗi ngày. Trạng thái nhớ trong localStorage để không báo lặp.
var PET_SYNCED = false;   // chỉ báo khi dữ liệu bài nộp đã lấy từ máy chủ (tránh báo nhầm khi mới có bản cache)
function petNotify(s, stage) {
    if (!PET || !ME || !PET_SYNCED || typeof eduToast !== 'function') return;
    var key = 'eduorient_petnote_' + ME.uid, st = {};
    try { st = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { st = {}; }
    var today = vnDay(nowMs()), hour = Math.floor(((nowMs() + VN_MS) % 86400000) / 3600000), msgs = [];
    if (typeof st.stage === 'number' && stage > st.stage) msgs.push(['success', '' + PET.name + ' đã lên cấp “' + PET_STAGES[stage][0] + '”! Chuỗi ' + s.cur + ' ngày.']);
    if (typeof st.cur === 'number' && st.cur >= 3 && s.cur === 0) msgs.push(['warning', 'Chuỗi ' + st.cur + ' ngày đã đứt. ' + PET.name + ' đang ngủ, hãy đăng nhập mỗi ngày để bắt đầu lại nhé!']);
    if (!s.doneToday && s.alive && s.cur > 0) {
        if (st.hungryDay !== today) { msgs.push(['info', '' + PET.name + ' đang đói! Hãy đăng nhập hôm nay để giữ chuỗi ' + s.cur + ' ngày.']); st.hungryDay = today; }
        else if (hour >= 19 && st.lateDay !== today) { msgs.push(['warning', 'Chuỗi ' + s.cur + ' ngày sắp đứt! Hãy đăng nhập trước nửa đêm nhé.']); st.lateDay = today; }
    }
    st.stage = stage; st.cur = s.cur;
    try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {}
    msgs.forEach(function (m, k) { setTimeout(function () { eduToast(m[1], m[0]); }, k * 3200); });
}
function renderPetCard(force) {
    var box = document.getElementById('pet-card'); if (!box || !ME || !RDY.sub) return;
    loadPet(); renderSidePet(); try { renderStatCard(); } catch (e) {}
    if (!PET && !force && box.dataset.mode === 'pick') return;   // đang chọn thú: không vẽ lại để khỏi mất chữ đang gõ
    if (!PET) {
        box.dataset.mode = 'pick';
        box.innerHTML = '<div class="card-title"><svg class=ic aria-hidden=true><use href=#i-paw></use></svg> Thú cưng của bạn</div>' +
            '<p style="font-size:13px;color:var(--text-sub);margin:4px 0 10px;">Nhận nuôi một bé thú cưng. Học đều mỗi ngày để bé vui và lớn lên cùng bạn!</p>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">' + PET_TYPES.map(function (t) {
                var on = t[0] === PET_PICK;
                return '<button type="button" onclick="petPick(\'' + t[0] + '\')" aria-label="' + t[2] + '" style="flex:0 0 auto;width:60px;height:60px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:14px;cursor:pointer;border:2px solid ' + (on ? 'var(--primary)' : 'var(--border)') + ';background:' + (on ? 'var(--sel-soft,#eef2ff)' : 'var(--card-bg)') + ';"><span style="display:block;width:46px;">' + petArt(t[0], { mood: 'happy' }) + '</span></button>';
            }).join('') + '</div>' +
            '<input id="pet-name-input" maxlength="16" placeholder="Đặt tên cho bé..." style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--border);border-radius:10px;font-size:14px;margin-bottom:8px;background:var(--card-bg);color:inherit;">' +
            '<button type="button" class="btn-primary" onclick="adoptPet()">Nhận nuôi</button>';
        return;
    }
    box.dataset.mode = 'pet';
    var s = streakInfo(), emoji = petEmoji(), stage = petStageOf(s.cur);
    petNotify(s, stage);
    var next = PET_STAGES[stage + 1], size = 64 + stage * 8;
    var mood, glow, anim, badge;
    if (s.doneToday) { mood = 'Hôm nay bạn đã ghé thăm rồi, bé đang rất vui!'; glow = '250,204,21'; anim = 'petBounce 1.6s ease-in-out infinite'; badge = '✨'; }
    else if (s.alive) { mood = 'Bé đang đói. Đăng nhập hôm nay để giữ chuỗi ' + s.cur + ' ngày nhé!'; glow = '249,115,22'; anim = 'petFloat 3s ease-in-out infinite'; badge = '🍖'; }
    else { mood = 'Bé đang ngủ. Đăng nhập mỗi ngày để đánh thức bé và bắt đầu chuỗi mới!'; glow = '99,102,241'; anim = 'petBreath 3.6s ease-in-out infinite'; badge = '💤'; }
    if (todayXp() >= DAILY_GOAL) mood = 'Bạn đã đạt mục tiêu XP hôm nay, bé no nê và rất tự hào!';
    var ring = 'background:radial-gradient(circle at 50% 55%,rgba(' + glow + ',.40) 0%,rgba(' + glow + ',.14) 58%,rgba(' + glow + ',0) 74%);box-shadow:inset 0 0 0 2px rgba(' + glow + ',.35);';
    var bgIt = shopEq('bg'); if (bgIt) ring = 'background:' + bgIt.g + ';box-shadow:inset 0 0 0 2px rgba(' + glow + ',.55);';
    var prog = next
        ? '<div style="height:8px;background:rgba(127,127,127,.22);border-radius:8px;overflow:hidden;margin:10px 0 4px;"><div style="height:100%;width:' + Math.max(4, Math.min(100, Math.round(s.cur / next[1] * 100))) + '%;background:linear-gradient(90deg,#f59e0b,#ef4444);border-radius:8px;"></div></div><div style="font-size:11px;color:var(--text-sub);">Còn ' + Math.max(0, next[1] - s.cur) + ' ngày nữa để lên “' + esc(next[0]) + '”</div>'
        : '<div style="font-size:11px;color:var(--text-sub);margin-top:10px;">Bé đã đạt cấp cao nhất!</div>';
    box.innerHTML = '<div class="card-title"><svg class=ic aria-hidden=true><use href=#i-paw></use></svg> Thú cưng của bạn</div>' +
        '<div style="display:flex;gap:18px;align-items:center;margin-top:10px;flex-wrap:wrap;">' +
        '<div style="position:relative;flex:0 0 auto;width:132px;height:132px;border-radius:50%;display:flex;align-items:center;justify-content:center;' + ring + '">' +
        paSceneHtml(bgIt) +
        '<div style="position:relative;width:' + (100 + stage * 7) + 'px;animation:' + anim + ';">' + petArtNow() + '</div>' +
        '<div style="position:absolute;right:6px;top:8px;font-size:22px;line-height:1;">' + badge + '</div></div>' +
        '<div style="flex:1;min-width:200px;">' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><b style="font-size:20px;">' + esc(PET.name) + '</b>' +
        '<span style="padding:2px 10px;border-radius:999px;background:var(--primary);color:#fff;font-size:11px;font-weight:700;">' + esc(PET_STAGES[stage][0]) + '</span>' +
        '<button type="button" onclick="petRename()" aria-label="Đổi tên" style="border:0;background:none;cursor:pointer;font-size:14px;padding:0;"><svg class=ic aria-hidden=true><use href=#i-pencil></use></svg></button></div>' +
        '<div style="font-size:13px;color:var(--text-sub);margin:4px 0 8px;line-height:1.45;">' + esc(mood) + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;"><span class="pet-pill pet-pill-streak"><svg class=ic aria-hidden=true><use href=#i-fire></use></svg> <b>' + s.cur + '</b> ngày liên tiếp</span><span class="pet-pill"><svg class=ic aria-hidden=true><use href=#i-medal></use></svg> kỷ lục <b>' + s.best + '</b> ngày</span></div>' + prog + '</div></div>' +
        shopBtnHtml() +
        '<div class="pet-mission" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:14px;padding:9px 12px;border-radius:12px;background:rgba(127,127,127,.12);font-size:13px;">' +
        '<span>' + (s.doneToday ? '<svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg>' : '<svg class=ic aria-hidden=true><use href=#i-checkbox-blank-outline></use></svg>') + ' Nhiệm vụ hôm nay: đăng nhập vào web</span>' +
        (s.doneToday ? '' : '<button type="button" onclick="goBaiTap()" style="border:0;background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">Đến Bài tập</button>') + '</div>' + goalRowHtml();
}
// ---------- Cửa hàng thú cưng ----------
// Lưu: privates/{uid}.shop = { owned: [id...], eq: { hat, eyes, acc, bg } } (chỉ chủ tài khoản đọc/ghi) + bản sao localStorage.
// Số dư = XP trên BXH - tổng giá đồ đã mua. Tiêu XP KHÔNG làm tụt hạng BXH (BXH vẫn tính tổng XP kiếm được).
// st = cấp thú cưng tối thiểu (0 Bé con, 1 Lớn lên, 2 Chăm chỉ, 3 Vương giả, 4 Huyền thoại): thú lên cấp (giữ chuỗi học) thì mới mở khóa món xịn.
var SHOP_SLOTS = [['hat', '🎩', 'Mũ'], ['eyes', '🕶️', 'Kính'], ['acc', '🎀', 'Phụ kiện'], ['bg', '🌌', 'Nền']];
var SHOP_ITEMS = [
    { id: 'hat_cap', slot: 'hat', e: '🧢', n: 'Mũ lưỡi trai', p: 60, st: 0 },
    { id: 'hat_straw', slot: 'hat', e: '👒', n: 'Nón rộng vành', p: 100, st: 0 },
    { id: 'hat_grad', slot: 'hat', e: '🎓', n: 'Mũ cử nhân', p: 120, st: 1 },
    { id: 'hat_top', slot: 'hat', e: '🎩', n: 'Mũ chóp', p: 150, st: 1 },
    { id: 'hat_crown', slot: 'hat', e: '👑', n: 'Vương miện', p: 300, st: 3 },
    { id: 'eyes_glass', slot: 'eyes', e: '👓', n: 'Kính cận', p: 60, st: 0 },
    { id: 'eyes_sun', slot: 'eyes', e: '🕶️', n: 'Kính râm', p: 90, st: 0 },
    { id: 'acc_bow', slot: 'acc', e: '🎀', n: 'Nơ hồng', p: 70, st: 0 },
    { id: 'acc_star', slot: 'acc', e: '⭐', n: 'Ngôi sao', p: 110, st: 1 },
    { id: 'acc_medal', slot: 'acc', e: '🏅', n: 'Huy chương', p: 160, st: 2 },
    { id: 'bg_candy', slot: 'bg', e: '🍬', n: 'Kẹo ngọt', p: 100, st: 0, g: 'radial-gradient(circle at 50% 55%,#fbcfe8 0%,#f9a8d4 60%,#c4b5fd 100%)' },
    { id: 'bg_ocean', slot: 'bg', e: '🌊', n: 'Đại dương', p: 140, st: 0, g: 'radial-gradient(circle at 50% 55%,#67e8f9 0%,#38bdf8 55%,#1d4ed8 100%)' },
    { id: 'bg_forest', slot: 'bg', e: '🌲', n: 'Rừng xanh', p: 140, st: 1, g: 'radial-gradient(circle at 50% 55%,#bbf7d0 0%,#4ade80 55%,#166534 100%)' },
    { id: 'bg_sunset', slot: 'bg', e: '🌇', n: 'Hoàng hôn', p: 180, st: 1, g: 'radial-gradient(circle at 50% 55%,#fde68a 0%,#fb923c 55%,#be185d 100%)' },
    { id: 'bg_space', slot: 'bg', e: '🌌', n: 'Vũ trụ', p: 250, st: 2, g: 'radial-gradient(circle at 50% 55%,#6366f1 0%,#312e81 55%,#020617 100%)' }
];
var SHOP = { owned: [], eq: {} }, SHOP_TAB = 'hat';
function shopItem(id) { return SHOP_ITEMS.find(function (x) { return x.id === id; }) || null; }
function shopKey() { return 'eduorient_shop_' + (ME ? ME.uid : ''); }
function cleanShop(x) {
    if (!x || typeof x !== 'object') return null;
    var owned = [], eq = {};
    (Array.isArray(x.owned) ? x.owned : []).forEach(function (id) { if (shopItem(id) && owned.indexOf(id) < 0) owned.push(id); });
    SHOP_SLOTS.forEach(function (sl) {
        var id = x.eq && x.eq[sl[0]], it = id && shopItem(id);
        if (it && it.slot === sl[0] && owned.indexOf(id) >= 0) eq[sl[0]] = id;   // chỉ đeo món đã sở hữu, đúng ô
    });
    return { owned: owned, eq: eq };
}
function saveShop() {
    try { localStorage.setItem(shopKey(), JSON.stringify(SHOP)); } catch (e) {}
    if (ME) fbDb.collection('privates').doc(ME.uid).set({ shop: SHOP }, { merge: true }).catch(function (e) { console.warn('Chưa lưu được cửa hàng thú cưng lên máy chủ:', e); });
}
function shopEq(slot) { return SHOP.eq[slot] ? shopItem(SHOP.eq[slot]) : null; }
function shopSpent() { return SHOP.owned.reduce(function (t, id) { var it = shopItem(id); return t + (it ? it.p : 0); }, 0); }
function shopXpTotal() {
    var cur = ME && BXH[ME.uid];
    if (cur && typeof cur.xp === 'number') return bxhTotal(cur);
    try { return Math.max(0, SUBS_ALL.reduce(function (t, x) { return t + subXp(x); }, 0) + reviewXpTotal()); } catch (e) { return 0; }
}
function shopBalance() { return Math.max(0, shopXpTotal() - shopSpent()); }
function shopTab(slot) { SHOP_TAB = slot; shopRender(); }
function shopClick(id) {
    var it = shopItem(id); if (!it || !ME || !PET) return;
    if (SHOP.owned.indexOf(id) >= 0) {   // đã có: bấm để đeo / bỏ ra
        if (SHOP.eq[it.slot] === id) delete SHOP.eq[it.slot]; else SHOP.eq[it.slot] = id;
        saveShop(); shopRender(); return;
    }
    var stage = petStageOf(streakInfo().cur);
    if (stage < it.st) return eduAlert('Cần thú cưng đạt cấp “' + PET_STAGES[it.st][0] + '” mới mua được món này. Học đều mỗi ngày để ' + PET.name + ' lên cấp nhé!', 'warning');
    var bal = shopBalance();
    if (bal < it.p) return eduAlert('Bạn có ' + bal + ' XP, cần ' + it.p + ' XP để mua “' + it.n + '”. Làm thêm bài tập hoặc ôn câu sai để kiếm XP nhé!', 'warning');
    eduConfirm('Mua “' + it.n + '” cho ' + PET.name + ' với ' + it.p + ' XP?\nSố dư sau khi mua: ' + (bal - it.p) + ' XP. Điểm trên BXH của bạn không bị trừ.', { title: 'Mua vật phẩm', confirmText: 'Mua' }).then(function (ok) {
        if (!ok || SHOP.owned.indexOf(id) >= 0 || shopBalance() < it.p) return;
        SHOP.owned.push(id); SHOP.eq[it.slot] = id; saveShop(); shopRender();
        if (typeof eduToast === 'function') eduToast('' + PET.name + ' đã có “' + it.n + '”!', 'success');
    });
}
// Đồ đeo vẽ chồng lên con thú (đơn vị em theo cỡ chữ của thú nên tự co giãn khi thú lớn lên)
function shopOverlay() {
    var h = shopEq('hat'), e = shopEq('eyes'), a = shopEq('acc'), t = '';
    if (h) t += '<span style="position:absolute;left:50%;top:-.40em;transform:translateX(-50%);font-size:.55em;line-height:1;pointer-events:none;">' + h.e + '</span>';
    if (e) t += '<span style="position:absolute;left:50%;top:.27em;transform:translateX(-50%);font-size:.5em;line-height:1;pointer-events:none;">' + e.e + '</span>';
    if (a) t += '<span style="position:absolute;right:-.12em;bottom:-.04em;font-size:.4em;line-height:1;pointer-events:none;">' + a.e + '</span>';
    return t;
}
// Nút trong thẻ thú cưng: bấm mới mở cửa hàng (cửa sổ nổi), thẻ thú cưng không bị dài ra
function shopBtnHtml() {
    return '<button type="button" class="shop-cta" onclick="shopOpen()" aria-label="Mở cửa hàng thú cưng">' +
        '<span class="shop-cta-ic"><svg class=ic aria-hidden=true><use href=#i-cart></use></svg></span>' +
        '<span class="shop-cta-tx"><b>Cửa hàng thú cưng</b><small>Mua mũ, kính, nền cho bé bằng XP</small></span>' +
        '<span class="shop-cta-bal"><svg class=ic aria-hidden=true><use href=#i-cash></use></svg> <b>' + shopBalance() + '</b> XP</span>' +
        '<span class="shop-cta-go">›</span></button>';
}
function shopPreviewHtml() {
    var stage = petStageOf(streakInfo().cur), size = 56 + stage * 6, bg = shopEq('bg');
    var back = bg ? bg.g : 'radial-gradient(circle at 50% 55%,rgba(99,102,241,.40) 0%,rgba(99,102,241,.14) 58%,rgba(99,102,241,0) 74%)';
    var crown = paSceneHtml(bg);
    return '<div style="position:relative;flex:0 0 auto;width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:' + back + ';box-shadow:inset 0 0 0 2px rgba(99,102,241,.4);">' + crown +
        '<div style="position:relative;width:' + (84 + stage * 6) + 'px;">' + petArtNow() + '</div></div>';
}
function shopBodyHtml() {
    var bal = shopBalance(), stage = petStageOf(streakInfo().cur);
    var tabs = SHOP_SLOTS.map(function (sl) {
        var on = sl[0] === SHOP_TAB;
        return '<button type="button" onclick="shopTab(\'' + sl[0] + '\')" style="flex:0 0 auto;border:1px solid ' + (on ? 'var(--primary)' : 'var(--border,rgba(127,127,127,.4))') + ';background:' + (on ? 'var(--primary)' : 'transparent') + ';color:' + (on ? '#fff' : 'inherit') + ';padding:6px 14px;border-radius:999px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;">' + paSlotIcon(sl[0]) + ' ' + sl[2] + '</button>';
    }).join('');
    var items = SHOP_ITEMS.filter(function (it) { return it.slot === SHOP_TAB; }).map(function (it) {
        var own = SHOP.owned.indexOf(it.id) >= 0, on = SHOP.eq[it.slot] === it.id, locked = !own && stage < it.st, poor = !own && !locked && bal < it.p;
        var label = on ? '✔ Đang dùng' : own ? 'Đã có' : locked ? 'Cấp ' + PET_STAGES[it.st][0] : it.p + ' XP';
        var icon = it.g ? '<span style="display:block;position:relative;flex:0 0 auto;width:38px;height:38px;border-radius:50%;overflow:hidden;background:' + it.g + ';">' + paSceneSvg(it.id) + '</span>' : '<span style="display:block;width:38px;height:38px;">' + paItemIcon(it.id, 38) + '</span>';
        return '<button type="button" onclick="shopClick(\'' + it.id + '\')" style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:0;padding:10px 6px;border-radius:12px;cursor:pointer;text-align:center;font:inherit;color:inherit;font-size:12px;border:2px solid ' + (on ? 'var(--primary)' : 'var(--border,rgba(127,127,127,.4))') + ';background:' + (on ? 'rgba(99,102,241,.18)' : 'rgba(127,127,127,.08)') + ';opacity:' + (locked || poor ? '.55' : '1') + ';">' +
            icon + '<b style="display:block;margin-top:6px;line-height:1.25;">' + esc(it.n) + '</b><span style="display:block;margin-top:auto;padding-top:6px;opacity:.85;line-height:1.25;">' + (locked && !on && !own ? ico('lock') + ' ' : '') + esc(label) + '</span></button>';
    }).join('');
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px;"><b style="font-size:17px;"><svg class=ic aria-hidden=true><use href=#i-cart></use></svg> Cửa hàng thú cưng</b>' +
        '<button type="button" onclick="shopClose()" aria-label="Đóng" style="border:0;background:rgba(127,127,127,.18);color:inherit;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-close></use></svg></button></div>' +
        '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px;">' + shopPreviewHtml() +
        '<div style="flex:1;min-width:160px;"><b style="font-size:16px;">' + esc(PET.name) + '</b> <span style="padding:2px 10px;border-radius:999px;background:var(--primary);color:#fff;font-size:11px;font-weight:700;">' + esc(PET_STAGES[stage][0]) + '</span>' +
        '<div style="margin:8px 0;"><span class="pet-pill" title="XP kiếm được trừ XP đã tiêu. Tiêu XP không làm tụt hạng BXH."><svg class=ic aria-hidden=true><use href=#i-cash></use></svg> <b>' + bal + '</b> XP để tiêu</span></div>' +
        '<div style="font-size:12px;opacity:.75;line-height:1.4;">Tiêu XP không làm tụt hạng BXH. Thú lên cấp (giữ chuỗi học) sẽ mở khóa thêm món xịn.</div></div></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' + tabs + '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px;align-items:stretch;">' + items + '</div>' +
        '<div style="font-size:11px;opacity:.7;margin-top:10px;">Bấm món đã có để đeo hoặc bỏ ra.</div>';
}
// Cửa sổ cửa hàng (tạo bằng JS, không cần sửa hocsinh.html). Bấm nền tối / nút ✕ / phím Esc để đóng.
function shopEsc(e) { if (e.key === 'Escape') shopClose(); }
function shopOpen() { if (!PET || !ME) return; shopRender(); }
function shopClose() {
    var m = document.getElementById('shop-modal'); if (m) m.remove();
    document.removeEventListener('keydown', shopEsc);
}
function shopRender() {   // vẽ (hoặc vẽ lại) cửa sổ cửa hàng + cập nhật thẻ thú cưng phía sau
    var m = document.getElementById('shop-modal');
    if (!m) {
        m = document.createElement('div'); m.id = 'shop-modal';
        m.style.cssText = 'position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.55);';
        m.addEventListener('click', function (e) { if (e.target === m) shopClose(); });
        document.body.appendChild(m); document.addEventListener('keydown', shopEsc);
    }
    var keep = m.firstChild ? m.firstChild.scrollTop : 0;
    m.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Cửa hàng thú cưng" style="width:100%;max-width:560px;max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;border-radius:18px;padding:16px;background:var(--card-bg,#1e293b);color:inherit;border:1px solid var(--border,rgba(127,127,127,.3));box-shadow:0 20px 60px rgba(0,0,0,.5);">' + shopBodyHtml() + '</div>';
    if (keep) m.firstChild.scrollTop = keep;
    try { renderPetCard(true); } catch (e) {}
}
// ---------- Cân 2 cột trang Tài khoản (máy tính >= 1024px) ----------
// "Nhận xét của giáo viên" ở lại cột trái; thẻ cuối mỗi cột được giãn (.prof-fill) để hai cột bằng chiều cao. Cột trái (thú cưng, thành tích...) thường cao hơn cột phải (2 nhóm menu) nên bên phải bị trống. Hai thẻ nhỏ "Nhận xét của giáo viên" và
// "Chế độ riêng tư" được chuyển sang cuối cột phải khi cột trái cao hơn đủ nhiều, và trả về cột trái khi ngược lại (có độ trễ để không nhảy qua nhảy lại).
// Màn nhỏ (< 1024px) luôn trả về chỗ cũ vì các tab con trên điện thoại dựa vào cấu trúc cũ.
(function () {
    var IDS = ['eval-box', 'cover-share-card'], mq = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : null, raf = 0;
    function cols() { var tab = document.getElementById('tab-profile'); return tab ? { l: tab.querySelector('.prof-left'), r: tab.querySelector('.prof-right') } : null; }
    function putLeft(c, l) {   // trả về đúng thứ tự gốc trong cột trái ("Nhận xét" ở ĐẦU cột trái)
        if (c.id === 'eval-box') { l.insertBefore(c, l.firstChild); return; }
        var idx = IDS.indexOf(c.id), ref = null;
        for (var k = 0; k < l.children.length; k++) { var j = IDS.indexOf(l.children[k].id); if (j > idx) { ref = l.children[k]; break; } }
        l.insertBefore(c, ref);
    }
    function markFill(col, off) {   // đánh dấu phần tử HIỆN cuối cùng của cột là .prof-fill (CSS cho nó giãn); off=true: gỡ hết (màn nhỏ)
        var last = null;
        if (!off) for (var k = col.children.length - 1; k >= 0; k--) { if (col.children[k].offsetHeight) { last = col.children[k]; break; } }
        for (var i = 0; i < col.children.length; i++) col.children[i].classList.toggle('prof-fill', col.children[i] === last);
    }
    function balance() {
        raf = 0;
        var cc = cols(); if (!cc || !cc.l || !cc.r) return;
        var cards = IDS.map(function (id) { return document.getElementById(id); }).filter(Boolean);
        if (!mq || !mq.matches) { cards.forEach(function (c) { if (c.parentNode !== cc.l) putLeft(c, cc.l); }); markFill(cc.l, true); markFill(cc.r, true); return; }
        var ev = document.getElementById('eval-box');   // "Nhận xét của giáo viên": luôn ở cột trái (không còn chuyển sang phải)
        if (ev && ev.parentNode !== cc.l) putLeft(ev, cc.l);
        markFill(cc.l); markFill(cc.r);   // thẻ cuối mỗi cột giãn ra để 2 cột cao bằng nhau
        var L = cc.l.offsetHeight, R = cc.r.offsetHeight;
        if (!L || !R) return;   // tab đang ẩn
        for (var n = 0; n < cards.length; n++) {
            if (cards[n].id === 'eval-box') continue;   // đã ghim ở đầu cột phải, không cân bằng nữa
            var c = cards[n], h = c.offsetHeight + 16;
            if (!c.offsetHeight) continue;   // thẻ đang ẩn (vd chưa có nhận xét)
            if (c.parentNode === cc.l && L - R > h + 24) { cc.r.appendChild(c); return schedule(); }
            if (c.parentNode === cc.r && R - L > h + 24) { putLeft(c, cc.l); return schedule(); }
        }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(balance); }
    function init() {
        var cc = cols(); if (!cc) return;
        if (window.ResizeObserver) { var ro = new ResizeObserver(schedule); ro.observe(cc.l); ro.observe(cc.r); }
        window.addEventListener('resize', schedule);
        if (mq && mq.addEventListener) mq.addEventListener('change', schedule);
        [300, 1500, 4000].forEach(function (ms) { setTimeout(schedule, ms); });   // nội dung (thành tích, thú cưng) được vẽ muộn
        schedule();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
setInterval(function () { try { renderPetCard(); } catch (e) {} }, 60000);

// ---------- BXH tuần ----------
var BXH_WEEK = false, weekSig = '', weekFail = false;
function myWeekXp() {
    var w = weekStartDay();
    return SUBS_ALL.reduce(function (t, x) { var ms = subMs(x); return t + (ms && vnDay(ms) >= w ? subXp(x) : 0); }, 0) + reviewXpSince(w);
}
// Ghi XP tuần của mình vào bxh/summary (tách riêng khỏi ghi XP tổng để lỗi rules KHÔNG làm hỏng việc ghi XP tổng)
function reconcileWeek() {
    if (!ME || !RDY.sub || !BXH_AT || weekFail) return;
    var cur = BXH[ME.uid]; if (!cur || typeof cur.xp !== 'number') return;   // chờ entry chính được ghi trước
    var wk = weekStartDay(), wx = Math.min(myWeekXp(), cur.xp, 21000);   // rules: wx <= xp và <= 21000
    if (cur.wk === wk && cur.wx === wx) return;
    var sig = wk + ':' + wx; if (sig === weekSig) return; weekSig = sig;
    BXH[ME.uid] = Object.assign({}, cur, { wk: wk, wx: wx });
    BXH_REF().set({ users: { [ME.uid]: { wk: wk, wx: wx } } }, { merge: true }).catch(function (e) { weekFail = true; console.warn('Chưa ghi được XP tuần (hãy thêm wk, wx vào rules bxh/summary):', e); });
}
function paintBxhMode() {
    [['all', !BXH_WEEK], ['week', BXH_WEEK]].forEach(function (p) {
        var b = document.getElementById('bxh-mode-' + p[0]); if (!b) return;
        b.style.cssText = 'flex:1;padding:8px 6px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid ' + (p[1] ? 'var(--primary)' : 'var(--border)') + ';background:' + (p[1] ? 'var(--primary)' : 'var(--card-bg)') + ';color:' + (p[1] ? '#fff' : 'var(--text-sub)') + ';';
    });
    var n = document.getElementById('bxh-mode-note'); if (n) n.style.display = BXH_WEEK ? '' : 'none';
}
function setBxhMode(w) { BXH_WEEK = !!w; paintBxhMode(); try { capNhatBXH(); } catch (e) { console.error(e); } }

// ---------- Sổ câu sai ----------
function wrongBookData() {
    var out = [];
    SUBS_ALL.forEach(function (x) {
        var h = HW_DATA.find(function (k) { return k.id === x.hwId; }); if (!h || !Array.isArray(h.questions) || !Array.isArray(x.answers)) return;
        h.questions.forEach(function (q, i) {
            if (q.kind === 'essay' || !Array.isArray(q.a) || typeof q.c !== 'number') return;
            var my = x.answers[i];
            if (my === q.c) return;
            out.push({ hwId: h.id, k: h.id + ':' + i, ok: reviewOk(h.id + ':' + i), title: h.title || h.name || 'Bài tập', ms: subMs(x), i: i, q: q, my: (typeof my === 'number' && my >= 0) ? my : -1 });
        });
    });
    return out.sort(function (a, b) { return b.ms - a.ms || a.i - b.i; });
}
var WRONG_LIST = [];
function openWrongBook() {
    WRONG_LIST = wrongBookData();
    var body = document.getElementById('wrong-body'); if (!body) return;
    if (!WRONG_LIST.length) {
        body.innerHTML = '<p style="text-align:center;color:var(--text-sub);padding:24px 8px;">' + (SUBS_ALL.length ? '<svg class=ic aria-hidden=true><use href=#i-party-popper></use></svg> Bạn chưa có câu trắc nghiệm nào làm sai. Giữ vững phong độ nhé!' : 'Bạn chưa nộp bài tập nào. Làm bài xong, những câu sai sẽ được gom lại ở đây để ôn tập.') + '</p>';
    } else {
        var last = '';
        var need = WRONG_LIST.filter(function (w) { return w.ok < REVIEW_MASTERED; }).length, doneN = WRONG_LIST.length - need;
        body.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;"><p style="font-size:12px;color:var(--text-sub);margin:0;">' + need + ' câu cần ôn' + (doneN ? ' • ' + doneN + ' câu đã nắm vững' : '') + ' (không gồm câu tự luận).</p>' +
            (need ? '<button type="button" onclick="startReview()" style="border:0;background:var(--primary);color:#fff;padding:7px 14px;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-repeat></use></svg> Ôn nhanh ' + Math.min(REVIEW_BATCH, need) + ' câu (+' + REVIEW_XP_EACH + ' XP/câu đúng)</button>' : '') + '</div>' + WRONG_LIST.map(function (w, k) {
            var head = w.title !== last ? '<h4 style="font-size:13px;margin:14px 0 6px;color:var(--primary);"><svg class=ic aria-hidden=true><use href=#i-book></use></svg> ' + esc(w.title) + '</h4>' : ''; last = w.title;
            return head + '<div style="border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:var(--card-bg);">' +
                '<div style="font-size:13px;font-weight:700;white-space:pre-wrap;">Câu ' + (w.i + 1) + ': ' + esc(w.q.q || '') + (w.ok >= REVIEW_MASTERED ? ' <span style="color:#16a34a;font-size:11px;"><svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg> đã nắm</span>' : '') + '</div>' +
                '<div style="font-size:13px;margin-top:6px;">' + (w.my >= 0 ? '<span style="color:#dc2626;">✗ Bạn chọn: ' + 'ABCD'[w.my] + '. ' + esc(w.q.a[w.my] || '') + '</span><br>' : '<span style="color:#dc2626;">✗ Bạn chưa trả lời câu này</span><br>') +
                '<span style="color:#16a34a;">✓ Đáp án đúng: ' + 'ABCD'[w.q.c] + '. ' + esc(w.q.a[w.q.c] || '') + '</span></div>' +
                (w.q.e ? '<div style="font-size:12px;color:var(--text-sub);margin-top:6px;"><svg class=ic aria-hidden=true><use href=#i-lightbulb-on></use></svg> ' + esc(w.q.e) + '</div>' : '') +
                '<button type="button" onclick="askAiWrong(' + k + ')" style="margin-top:8px;border:0;background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-robot></use></svg> Nhờ AI giải thích</button></div>';
        }).join('');
    }
    document.getElementById('modal-wrong').style.display = 'flex';
}
function askAiWrong(k) {
    var w = WRONG_LIST[k]; if (!w) return;
    var text = 'Giải thích giúp mình câu trắc nghiệm này:\n' + (w.q.q || '') + '\n' + w.q.a.map(function (o, j) { return 'ABCD'[j] + '. ' + o; }).join('\n') + '\nĐáp án đúng là ' + 'ABCD'[w.q.c] + (w.my >= 0 ? ', mình đã chọn ' + 'ABCD'[w.my] : ', mình chưa trả lời') + '. Vì sao đáp án đó đúng và mình sai ở đâu?';
    closeModal('modal-wrong');
    var nav = document.querySelector('.nav-item[onclick*="tab-ai"]'); if (nav) switchTab('tab-ai', nav, true);
    setTimeout(function () { var inp = document.getElementById('ai-question-input'); if (inp) { inp.value = text; inp.focus(); } }, 150);   // chỉ điền sẵn câu hỏi, học sinh bấm Gửi
}
function openAtt() { try { renderAtt(); } catch (e) {} document.getElementById('modal-att').style.display = 'flex'; }

// ---------- Thẻ "Thành tích của bạn" (tab Tài khoản, cột trái) ----------
function myTotalRank() {
    if (!ME || !user.targetSchoolId || !BXH_AT) return null;
    var keep = BXH_WEEK; BXH_WEEK = false;
    try {
        var rows = bxhRows(function (e) { return e.s === user.targetSchoolId; });
        var i = rows.findIndex(function (r) { return r.id === ME.uid; });
        return i >= 0 ? { rank: i + 1, of: rows.length } : null;
    } catch (e) { return null; } finally { BXH_WEEK = keep; }
}
function goBxh() { var nav = document.querySelector('.nav-item[onclick*="tab-bxh"]'); if (nav) switchTab('tab-bxh', nav, true); }
function renderStatCard() {
    var box = document.getElementById('stat-card'); if (!box || !ME || !RDY.sub) return;
    var fmt = function (n) { return Number(n || 0).toLocaleString('vi-VN'); };
    var rk = myTotalRank(), wrong = 0; try { wrong = reviewPool().length; } catch (e) {}
    var tiles = [
        ['<svg class=ic aria-hidden=true><use href=#i-star></use></svg>', fmt(sumXp()[ME.uid]), 'XP tổng', '#f59e0b', 'goBxh()'],
        ['<svg class=ic aria-hidden=true><use href=#i-calendar-month></use></svg>', fmt(myWeekXp()), 'XP tuần này', '#0ea5e9', 'setBxhMode(true);goBxh()'],
        ['<svg class=ic aria-hidden=true><use href=#i-trophy></use></svg>', rk ? '#' + rk.rank : '—', rk ? 'Hạng / ' + rk.of + ' bạn' : 'Hạng trong trường', '#8b5cf6', 'setBxhMode(false);goBxh()'],
        ['<svg class=ic aria-hidden=true><use href=#i-fire></use></svg>', String(streakInfo().cur), 'Ngày liên tiếp', '#ef4444', 'goPet()'],
        ['<svg class=ic aria-hidden=true><use href=#i-note-edit></use></svg>', fmt(SUBS_ALL.length), 'Bài đã nộp', '#16a34a', 'goBaiTap()'],
        ['<svg class=ic aria-hidden=true><use href=#i-book-alert></use></svg>', fmt(wrong), 'Câu cần ôn', '#dc2626', 'openWrongBook()']
    ];
    box.innerHTML = '<div class="card-title"><svg class=ic aria-hidden=true><use href=#i-medal></use></svg> Thành tích của bạn</div><div class="stat-grid">' + tiles.map(function (t) {
        return '<div role="button" tabindex="0" class="stat-tile" style="border-top-color:' + t[3] + ';" onclick="' + t[4] + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();' + t[4] + '}"><span class="stat-ic">' + t[0] + '</span><b class="stat-num" style="color:' + t[3] + ';">' + esc(t[1]) + '</b><span class="stat-lb">' + esc(t[2]) + '</span></div>';
    }).join('') + '</div>' + restoreRowHtml();
}
function fmtLeft(ms) { var m = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(m / 60); return h > 0 ? h + ' giờ ' + (m % 60) + ' phút' : m + ' phút'; }
function restoreRowHtml() {
    var r = restoreInfo(), msg, btn = '';
    if (r.can) { msg = '<svg class=ic aria-hidden=true><use href=#i-heart-broken></use></svg> Chuỗi ' + r.prev + ' ngày bị đứt ' + r.gap + ' ngày. Khôi phục tốn ' + r.gap + ' lượt (còn ' + r.left + '/' + r.quota + ' tháng này). <svg class=ic aria-hidden=true><use href=#i-timer-sand></use></svg> Còn ' + fmtLeft(r.msLeft) + ' để khôi phục.'; btn = '<button type="button" onclick="restoreStreak()" style="border:0;background:#f97316;color:#fff;padding:7px 14px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">Khôi phục</button>'; }
    else if (r.tooLong) msg = '<svg class=ic aria-hidden=true><use href=#i-heart-broken></use></svg> Chuỗi ' + r.prev + ' ngày bị đứt ' + r.gap + ' ngày nhưng tháng này chỉ còn ' + r.left + ' lượt khôi phục.';
    else if (r.expired) msg = '<svg class=ic aria-hidden=true><use href=#i-timer-sand-complete></use></svg> Chuỗi cũ ' + r.prev + ' ngày đã hết hạn khôi phục (' + RESTORE_HOURS + ' giờ). Lượt tháng này còn <b>' + r.left + '/' + r.quota + '</b> cho lần sau.';
    else msg = '<svg class=ic aria-hidden=true><use href=#i-lifebuoy></use></svg> Lượt khôi phục tháng này: <b>' + r.left + '/' + r.quota + '</b> (từ 100 ngày liên tiếp được 5 lượt/tháng)';
    return '<div class="restore-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;padding:9px 12px;border-radius:12px;background:rgba(127,127,127,.12);font-size:12px;line-height:1.45;"><span>' + msg + '</span>' + btn + '</div>';
}

// ---------- Ngọn lửa chuỗi học (kiểu TikTok) ở Sidebar: số ngày nằm TRONG ngọn lửa ----------
var FLAME_PAL = {   // [ngoài-trên, ngoài-giữa, ngoài-dưới, trong-trên, trong-dưới, màu tỏa sáng]
    dead: ['#cbd5e1', '#94a3b8', '#64748b', '#f1f5f9', '#cbd5e1', ''],
    fire: ['#fde047', '#fb923c', '#ef4444', '#fef08a', '#fb923c', '249,115,22'],
    hot: ['#fdba74', '#f97316', '#dc2626', '#fde68a', '#f97316', '239,68,68'],
    blue: ['#7dd3fc', '#38bdf8', '#2563eb', '#e0f2fe', '#60a5fa', '56,189,248'],
    purple: ['#e9d5ff', '#c084fc', '#7c3aed', '#fae8ff', '#c084fc', '168,85,247'],
    emerald: ['#a7f3d0', '#34d399', '#047857', '#ecfdf5', '#6ee7b7', '52,211,153']
};
function flameTier(n, alive) { return !alive || n <= 0 ? 'dead' : n >= 365 ? 'emerald' : n >= 100 ? 'purple' : n >= 30 ? 'blue' : n >= 3 ? 'hot' : 'fire'; }
function flameShade(hex, f) {   // làm tối (f<1) / sáng (f>1) một màu #rrggbb
    var h = hex.replace('#', ''), r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    function k(v) { v = Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1)); return Math.max(0, Math.min(255, v)); }
    return 'rgb(' + k(r) + ',' + k(g) + ',' + k(b) + ')';
}
// Ngọn lửa 3D: thân tô gradient hình cầu (lõi sáng, rìa tối), lớp lõi mờ, vệt bóng kính, viền sáng bên phải,
// số ngày dạng khối nổi (xếp 3 lớp lệch xuống), bóng đổ dưới đáy và vài đốm tàn lửa bay lên.
function flameSvg(n, c, alive, pfx) {
    var t = String(n), fs = t.length >= 4 ? 19 : t.length === 3 ? 26 : 36, ty = t.length >= 4 ? 80 : 82;
    var dark = flameShade(c[2], .55), deep = flameShade(c[2], .38), numDark = alive ? 'rgba(88,28,8,1)' : 'rgba(51,65,85,1)';
    var body = 'M40 6C43 20 73 30 74 63C75 85 59 97 40 97C21 97 5 85 6 63C7 50 15 43 20 34C22 42 28 47 32 47C29 32 34 17 40 6Z';
    var core = 'M40 46C43 57 62 62 62 76C62 88 52 94 40 94C28 94 18 88 18 76C18 65 33 60 40 46Z';
    function num(dy, fill, stroke, sw) {
        return '<text x="40" y="' + (ty + dy) + '" text-anchor="middle" font-size="' + fs + '" font-weight="900" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round" paint-order="stroke" font-family="Inter,Arial,sans-serif">' + t + '</text>';
    }
    var embers = alive ? '<circle class="sk-ember e1" cx="22" cy="40" r="1.8" fill="' + c[0] + '"/><circle class="sk-ember e2" cx="60" cy="48" r="1.5" fill="' + c[1] + '"/><circle class="sk-ember e3" cx="48" cy="30" r="1.2" fill="' + c[3] + '"/>' : '';
    var svg = '<svg viewBox="0 0 80 100" width="100%" height="100%" overflow="visible" aria-hidden="true">' +
        '<defs>' +
        '<radialGradient id="fgB" cx=".5" cy=".78" r=".72" fx=".5" fy=".85"><stop offset="0" stop-color="' + c[3] + '"/><stop offset=".3" stop-color="' + c[1] + '"/><stop offset=".72" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + dark + '"/></radialGradient>' +
        '<linearGradient id="fgT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '" stop-opacity=".95"/><stop offset=".5" stop-color="' + c[0] + '" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="fgC" cx=".5" cy=".72" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="' + c[3] + '"/><stop offset="1" stop-color="' + c[4] + '"/></radialGradient>' +
        '<linearGradient id="fgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="fgN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient>' +
        '<filter id="fgBl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
        '<filter id="fgSh" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
        '</defs>' +
        '<ellipse cx="40" cy="98" rx="28" ry="3.2" fill="' + deep + '" opacity=".38" filter="url(#fgSh)"/>' +
        '<path d="' + body + '" fill="url(#fgB)"/>' +
        '<path d="M40 6C43 20 73 30 74 63C75 85 59 97 40 97C21 97 5 85 6 63C7 50 15 43 20 34C22 42 28 47 32 47C29 32 34 17 40 6Z" fill="url(#fgT)" opacity=".55"/>' +
        '<path d="M70 56C72 73 66 88 51 95C63 88 68 75 67 60Z" fill="' + c[0] + '" opacity=".38" filter="url(#fgBl)"/>' +
        '<path d="' + core + '" fill="url(#fgC)" filter="url(#fgBl)" opacity=".95"/>' +
        '<path d="M14 62C12 52 16 45 21 40C20 46 22 50 26 53C20 54 16 58 14 62Z" fill="url(#fgG)" opacity=".8"/>' +
        '<ellipse cx="24" cy="66" rx="3.5" ry="8" fill="#fff" opacity=".35" transform="rotate(14 29 62)" filter="url(#fgBl)"/>' +
        embers +
        num(3, numDark, numDark, 5) + num(1.6, numDark, numDark, 5) +
        num(0, 'url(#fgN)', numDark, 4) +
        '</svg>';
    return pfx ? svg.replace(/(id="|url\(#)fg/g, '$1' + pfx) : svg;   // id gradient/filter phải khác nhau giữa các ngọn lửa (sidebar bị display:none sẽ làm hỏng bản trùng id)
}
function renderSideStreak() {
    var el = document.getElementById('side-streak'); if (!el) return;
    if (!ME || !RDY.sub) { el.style.display = 'none'; return; }
    el.style.display = '';
    var s = streakInfo(), alive = s.alive, tier = flameTier(s.cur, alive), c = FLAME_PAL[tier];
    var hour = Math.floor(((nowMs() + VN_MS) % 86400000) / 3600000), sub, subColor = 'var(--text-sub)';
    if (s.doneToday) { sub = '✓ Hôm nay đã giữ lửa'; subColor = '#22c55e'; }
    else if (alive && s.cur > 0) { sub = hour >= 19 ? '<svg class=ic aria-hidden=true><use href=#i-alarm></use></svg> Sắp tắt! Vào học ngay' : 'Đăng nhập mỗi ngày để giữ lửa'; subColor = hour >= 19 ? '#f97316' : 'var(--text-sub)'; }
    else sub = 'Đăng nhập mỗi ngày để thắp lửa';
    var rr = restoreInfo(); if (rr.can) { sub = '<svg class=ic aria-hidden=true><use href=#i-heart-broken></use></svg> Khôi phục chuỗi ' + rr.prev + ' ngày'; subColor = '#f97316'; }
    var glow = c[5], anim = s.doneToday ? 'flameFlicker 1.3s ease-in-out infinite' : (alive && s.cur > 0 ? 'flameFlicker 2.4s ease-in-out infinite' : 'none');
    el.style.background = glow ? 'radial-gradient(circle at 50% 35%,rgba(' + glow + ',.20),rgba(' + glow + ',0) 72%),rgba(127,127,127,.07)' : 'rgba(127,127,127,.08)';
    el.innerHTML = '<div class="sk-flame" style="animation:' + anim + ';' + (glow ? 'filter:drop-shadow(0 0 ' + (s.doneToday ? 12 : 6) + 'px rgba(' + glow + ',.85));' : '') + (alive && !s.doneToday ? 'opacity:.82;' : '') + '">' + flameSvg(s.cur, c, alive && s.cur > 0) + '</div>' +
        '<div class="sk-title">ngày liên tiếp</div><div class="sk-sub" style="color:' + subColor + ';">' + sub + '</div>' + goalBarHtml('side');
}

// =====================================================================================
// MỤC TIÊU XP MỖI NGÀY + ÔN NHANH TỪ SỔ CÂU SAI + HẠN MỨC XP CHỐNG GIAN LẬN
//  - XP_DAILY_CAP: BXH chỉ cho XP của chính mình tăng tối đa số này mỗi ngày (phải KHỚP số 3000 trong selfOnlyEntry() ở firestore.rules).
//  - DAILY_GOAL: mục tiêu XP mỗi ngày (giờ VN). Thanh tiến độ hiện ở thẻ ngọn lửa (sidebar + điện thoại) và thẻ thú cưng.
//  - Ôn nhanh: bốc tối đa 5 câu từ Sổ câu sai (câu ít được ôn đúng thì ưu tiên hơn). Ôn ĐÚNG được REVIEW_XP_EACH XP (tối đa
//    REVIEW_XP_DAILY_CAP XP/ngày); đúng REVIEW_MASTERED lần thì coi là đã nắm, không bốc ra nữa; ôn SAI thì đếm lại từ 0.
//    Lưu ở privates/{uid}.review = { xp: { 'số ngày VN': XP }, ok: { 'hwId:số câu': số lần đúng } } + bản sao localStorage.
// =====================================================================================
var XP_DAILY_CAP = 3000;
var DAILY_GOAL = 50;
var REVIEW_XP_EACH = 2, REVIEW_XP_DAILY_CAP = 20, REVIEW_MASTERED = 3, REVIEW_BATCH = 5;
var REVIEW = { xp: {}, ok: {} }, REVIEW_UID = '';

function reviewLocalKey() { return 'eduorient_review_' + (ME ? ME.uid : ''); }
function cleanReview(r) {
    var out = { xp: {}, ok: {} };
    if (!r || typeof r !== 'object') return out;
    if (r.xp && typeof r.xp === 'object') Object.keys(r.xp).forEach(function (k) {
        var v = Number(r.xp[k]); if (isFinite(k) && isFinite(v) && v > 0) out.xp[k] = Math.min(REVIEW_XP_DAILY_CAP, Math.round(v));
    });
    if (r.ok && typeof r.ok === 'object') Object.keys(r.ok).forEach(function (k) {
        var v = Number(r.ok[k]); if (k.length <= 80 && isFinite(v) && v > 0) out.ok[k] = Math.min(9, Math.round(v));
    });
    return out;
}
function loadReview() {
    if (!REVIEW || !REVIEW.xp) REVIEW = { xp: {}, ok: {} };
    if (!ME || REVIEW_UID === ME.uid) return;
    REVIEW_UID = ME.uid; REVIEW = { xp: {}, ok: {} };
    try { REVIEW = cleanReview(JSON.parse(localStorage.getItem(reviewLocalKey()) || 'null')); } catch (e) {}
}
function saveReviewLocal() { try { localStorage.setItem(reviewLocalKey(), JSON.stringify(REVIEW)); } catch (e) {} }
function mergeReview(srv) {   // bản trên máy chủ + bản trong máy: mỗi khóa lấy số LỚN HƠN (không mất dữ liệu khi mất đồng bộ)
    var s = cleanReview(srv);
    Object.keys(s.xp).forEach(function (k) { if (s.xp[k] > (REVIEW.xp[k] || 0)) REVIEW.xp[k] = s.xp[k]; });
    Object.keys(s.ok).forEach(function (k) { if (s.ok[k] > (REVIEW.ok[k] || 0)) REVIEW.ok[k] = s.ok[k]; });
    saveReviewLocal();
}
function saveReview() {
    saveReviewLocal();
    if (ME) fbDb.collection('privates').doc(ME.uid).set({ review: REVIEW }, { merge: true })
        .catch(function (e) { console.warn('Chưa lưu được tiến độ ôn tập lên máy chủ:', e); });
}
function reviewXpTotal() { loadReview(); var t = 0; Object.keys(REVIEW.xp).forEach(function (k) { t += REVIEW.xp[k]; }); return t; }
function reviewXpSince(day) { loadReview(); var t = 0; Object.keys(REVIEW.xp).forEach(function (k) { if (Number(k) >= day) t += REVIEW.xp[k]; }); return t; }
function reviewXpToday() { loadReview(); return REVIEW.xp[vnDay(nowMs())] || 0; }
function reviewOk(k) { loadReview(); return REVIEW.ok[k] || 0; }

// ---------- Mục tiêu XP mỗi ngày ----------
function todayXp() {
    var t = vnDay(nowMs()), s = 0;
    SUBS_ALL.forEach(function (x) { var ms = subMs(x); if (ms && vnDay(ms) === t) s += subXp(x); });
    return s + reviewXpToday();
}
function ensureGoalStyle() {
    if (document.getElementById('goal-style')) return;
    var st = document.createElement('style'); st.id = 'goal-style';
    st.textContent =
        '.xg-wrap{width:100%;box-sizing:border-box;margin-top:8px}' +
        '.xg-top{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:11px;font-weight:700;margin-bottom:3px;color:var(--text-main,inherit)}' +
        '.xg-bar{height:8px;border-radius:8px;background:rgba(127,127,127,.22);overflow:hidden}' +
        '.xg-bar i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#f59e0b,#ef4444);transition:width .5s ease}' +
        '.xg-wrap.done .xg-bar i{background:linear-gradient(90deg,#22c55e,#16a34a)}' +
        '.rv-opt{display:block;width:100%;text-align:left;padding:10px 12px;margin-top:8px;border-radius:12px;border:1.5px solid var(--border,#e2e8f0);background:var(--card-bg,transparent);color:inherit;font-size:14px;line-height:1.4;cursor:pointer}' +
        '.rv-opt:disabled{cursor:default}' +
        '.rv-opt.ok{border-color:#16a34a;background:rgba(34,197,94,.16)}' +
        '.rv-opt.bad{border-color:#dc2626;background:rgba(239,68,68,.14)}';
    document.head.appendChild(st);
}
function goalBarHtml(variant) {
    ensureGoalStyle();
    var x = todayXp(), g = DAILY_GOAL, done = x >= g, pct = Math.min(100, Math.round(x / g * 100));
    return '<div class="xg-wrap' + (done ? ' done' : '') + ' xg-' + variant + '" role="progressbar" aria-valuemin="0" aria-valuemax="' + g + '" aria-valuenow="' + Math.min(x, g) + '" aria-label="Mục tiêu XP hôm nay">' +
        '<div class="xg-top"><span>' + (done ? '<svg class=ic aria-hidden=true><use href=#i-bullseye-arrow></use></svg> Đạt mục tiêu hôm nay!' : '<svg class=ic aria-hidden=true><use href=#i-bullseye-arrow></use></svg> Hôm nay') + '</span><span>' + x + '/' + g + ' XP</span></div>' +
        '<div class="xg-bar"><i style="width:' + pct + '%"></i></div></div>';
}
function goalRowHtml() {
    var x = todayXp(), done = x >= DAILY_GOAL, need = reviewPool().length;
    var cta = need
        ? '<button type="button" onclick="startReview()" style="border:0;background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;"><svg class=ic aria-hidden=true><use href=#i-repeat></use></svg> Ôn nhanh</button>'
        : (done ? '' : '<button type="button" onclick="goBaiTap()" style="border:0;background:var(--primary);color:#fff;padding:6px 12px;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">Đến Bài tập</button>');
    return '<div style="margin-top:8px;padding:9px 12px;border-radius:12px;background:rgba(127,127,127,.12);font-size:13px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><span>' + (done ? '<svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg>' : '<svg class=ic aria-hidden=true><use href=#i-checkbox-blank-outline></use></svg>') + ' Mục tiêu XP hôm nay (mỗi ngày ' + DAILY_GOAL + ' XP)</span>' + cta + '</div>' +
        goalBarHtml('pet') + '</div>';
}
var GOAL_PREV = null, GOAL_KEY = '';
function goalCheck() {   // báo 1 lần khi VỪA đạt mục tiêu trong phiên này (không báo lại lúc mở web nếu đã đạt từ trước)
    if (!ME || !RDY.sub || !PET_SYNCED) return;
    var key = ME.uid + ':' + vnDay(nowMs()), x = todayXp();
    if (GOAL_KEY !== key) { GOAL_KEY = key; GOAL_PREV = x; return; }
    if (GOAL_PREV < DAILY_GOAL && x >= DAILY_GOAL && typeof eduToast === 'function') eduToast('Tuyệt vời! Bạn đã đạt mục tiêu ' + DAILY_GOAL + ' XP hôm nay.', 'success');
    GOAL_PREV = x;
}

// ---------- Ôn nhanh ----------
function reviewPool() { return wrongBookData().filter(function (w) { return w.ok < REVIEW_MASTERED; }); }
function pickReview(pool, n) {   // bốc ngẫu nhiên có trọng số: càng ít lần ôn đúng càng dễ được chọn
    var items = pool.slice(), out = [];
    while (out.length < n && items.length) {
        var tot = 0, ws = items.map(function (w) { var v = 1 / Math.pow(1 + w.ok, 2); tot += v; return v; });
        var r = Math.random() * tot, idx = 0;
        for (; idx < ws.length - 1; idx++) { r -= ws[idx]; if (r <= 0) break; }
        out.push(items.splice(idx, 1)[0]);
    }
    return out;
}
var RV = null;
function startReview() {
    if (!ME) return;
    var pool = reviewPool();
    if (!pool.length) { if (typeof eduToast === 'function') eduToast('Bạn không còn câu sai nào cần ôn!', 'success'); return; }
    RV = { items: pickReview(pool, REVIEW_BATCH), i: 0, right: 0, xp: 0, locked: false, mastered: 0 };
    try { closeModal('modal-wrong'); } catch (e) {}
    ensureGoalStyle();
    renderReview();
    document.getElementById('modal-review').style.display = 'flex';
}
function renderReview() {
    var body = document.getElementById('review-body'); if (!body || !RV) return;
    var n = RV.items.length;
    if (RV.i >= n) {
        var more = reviewPool().length, msg = RV.right === n ? 'Xuất sắc! Đúng hết rồi <svg class=ic aria-hidden=true><use href=#i-party-popper></use></svg>' : RV.right >= Math.ceil(n / 2) ? 'Khá tốt, ôn thêm là nhớ lâu!' : 'Không sao, câu sai sẽ được ưu tiên ôn lại.';
        body.innerHTML = '<div style="text-align:center;padding:12px 4px;">' +
            '<div style="font-size:44px;line-height:1;">' + (RV.right === n ? '<svg class=ic aria-hidden=true><use href=#i-trophy></use></svg>' : '<svg class=ic aria-hidden=true><use href=#i-arm-flex></use></svg>') + '</div>' +
            '<div style="font-size:20px;font-weight:800;margin-top:8px;">Đúng ' + RV.right + '/' + n + ' câu</div>' +
            '<div style="font-size:13px;color:var(--text-sub);margin:6px 0;">' + msg + '</div>' +
            '<div style="font-size:15px;font-weight:700;color:#d97706;">' + (RV.xp > 0 ? '+' + RV.xp + ' XP ôn tập' : (RV.right > 0 ? 'Hôm nay bạn đã đạt giới hạn ' + REVIEW_XP_DAILY_CAP + ' XP ôn tập' : 'Chưa có XP lần này')) + '</div>' +
            (RV.mastered ? '<div style="font-size:13px;color:#16a34a;margin-top:4px;"><svg class=ic aria-hidden=true><use href=#i-star-four-points></use></svg> ' + RV.mastered + ' câu đã được nắm vững</div>' : '') +
            '<div style="margin-top:12px;">' + goalBarHtml('rv') + '</div>' +
            '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px;">' +
            (more ? '<button type="button" onclick="startReview()" style="border:0;background:var(--primary);color:#fff;padding:9px 16px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-repeat></use></svg> Ôn tiếp ' + Math.min(REVIEW_BATCH, more) + ' câu</button>' : '') +
            '<button type="button" onclick="closeReview()" style="border:1px solid var(--border);background:var(--card-bg);color:inherit;padding:9px 16px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">Xong</button></div></div>';
        return;
    }
    var w = RV.items[RV.i], q = w.q, answered = typeof w.picked === 'number';
    var opts = q.a.map(function (o, j) {
        var cls = answered ? (j === q.c ? ' ok' : (j === w.picked ? ' bad' : '')) : '';
        return '<button type="button" class="rv-opt' + cls + '"' + (answered ? ' disabled' : ' onclick="answerReview(' + j + ')"') + '>' +
            '<b>' + 'ABCD'[j] + '.</b> ' + esc(o) + (answered && j === q.c ? ' ✓' : '') + (answered && j === w.picked && j !== q.c ? ' ✗' : '') + '</button>';
    }).join('');
    var fb = '';
    if (answered) {
        fb = '<div style="margin-top:10px;font-size:13px;font-weight:700;color:' + (w.right ? '#16a34a' : '#dc2626') + ';">' +
            (w.right ? '<svg class=ic aria-hidden=true><use href=#i-check-circle></use></svg> Chính xác!' + (w.gain > 0 ? ' +' + w.gain + ' XP' : ' (đã đạt giới hạn XP ôn tập hôm nay)') : '<svg class=ic aria-hidden=true><use href=#i-close-circle></use></svg> Chưa đúng. Đáp án đúng là ' + 'ABCD'[q.c] + '.') + '</div>' +
            (q.e ? '<div style="font-size:12px;color:var(--text-sub);margin-top:6px;line-height:1.5;"><svg class=ic aria-hidden=true><use href=#i-lightbulb-on></use></svg> ' + esc(q.e) + '</div>' : '') +
            '<button type="button" onclick="nextReview()" style="margin-top:12px;border:0;background:var(--primary);color:#fff;padding:9px 16px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">' + (RV.i + 1 >= n ? 'Xem kết quả' : 'Câu tiếp →') + '</button>';
    }
    body.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sub);margin-bottom:6px;"><span>Câu ' + (RV.i + 1) + '/' + n + '</span><span>+' + REVIEW_XP_EACH + ' XP mỗi câu đúng</span></div>' +
        '<div class="xg-bar" style="margin-bottom:12px;"><i style="width:' + Math.round(RV.i / n * 100) + '%"></i></div>' +
        '<h4 style="font-size:12px;margin:0 0 6px;color:var(--primary);"><svg class=ic aria-hidden=true><use href=#i-book></use></svg> ' + esc(w.title) + ' • câu ' + (w.i + 1) + '</h4>' +
        '<div style="font-size:15px;font-weight:700;white-space:pre-wrap;line-height:1.5;">' + esc(q.q || '') + '</div>' + opts + fb;
}
function answerReview(j) {
    if (!RV || RV.locked) return;
    var w = RV.items[RV.i]; if (!w) return;
    RV.locked = true; w.picked = j; w.right = (j === w.q.c); w.gain = 0;
    loadReview();
    if (w.right) {
        var day = vnDay(nowMs()), used = REVIEW.xp[day] || 0, g = Math.max(0, Math.min(REVIEW_XP_EACH, REVIEW_XP_DAILY_CAP - used));
        REVIEW.ok[w.k] = Math.min(9, (REVIEW.ok[w.k] || 0) + 1);
        if (g > 0) REVIEW.xp[day] = used + g;
        w.gain = g; RV.right++; RV.xp += g;
        if (REVIEW.ok[w.k] === REVIEW_MASTERED) RV.mastered++;
    } else if (REVIEW.ok[w.k]) { delete REVIEW.ok[w.k]; }   // sai thì đếm lại từ đầu để câu này xuất hiện nhiều hơn
    saveReview();
    renderReview();
    reviewChanged();
}
function nextReview() { if (!RV) return; RV.i++; RV.locked = false; renderReview(); var m = document.querySelector('#modal-review .modal-body'); if (m) m.scrollTop = 0; }
function closeReview() { document.getElementById('modal-review').style.display = 'none'; RV = null; reviewChanged(); }
function reviewChanged() {   // XP ôn tập đổi => cập nhật BXH của mình, thanh mục tiêu, thẻ thành tích
    try { reconcileSelf(); } catch (e) {}
    try { reconcileWeek(); } catch (e) {}
    try { renderPetCard(true); } catch (e) {}
    try { goalCheck(); } catch (e) {}
}

// =====================================================================================
// TUẦN CỦA BẠN (thẻ tổng kết tuần) - lõi vẽ thẻ/ảnh nằm ở wrapped-core.js (dùng chung với bản preview)
//  - Dữ liệu tuần: XP, ngày giữ lửa (allActiveDays), bài nộp, thú cưng. Không cần lưu thêm gì cho các số này.
//  - Tăng/giảm hạng: app không lưu hạng tuần trước, nên mỗi tuần ghi 1 "bản chụp hạng" vào privates/{uid}.weekRanks = { 'ngày bắt đầu tuần': hạng }
//    (chỉ chủ tài khoản đọc/ghi - rules privates hiện tại đã cho phép) + bản sao localStorage. Tuần đầu chưa có bản chụp tuần trước -> chỉ hiện hạng, không hiện tăng/giảm.
//  - Tự mở 1 lần vào Chủ nhật (giờ VN) cho tuần hiện tại; có thể mở bất cứ lúc nào bằng nút "Tuần của bạn" ở thẻ Thành tích.
// =====================================================================================
var WR_RANKS = {}, WR_UID = '', WR_READY = false, WR_SIG = '', WR_CUR = null;
function wrKey() { return 'eduorient_weekranks_' + (ME ? ME.uid : ''); }
function wrClean(o) {
    var out = {}; if (!o || typeof o !== 'object') return out;
    Object.keys(o).forEach(function (k) { var v = Number(o[k]); if (isFinite(Number(k)) && v > 0 && v < 100000) out[k] = Math.round(v); });
    return out;
}
function wrLoad() {
    if (!ME || WR_UID === ME.uid) return;
    var uid = ME.uid; WR_UID = uid; WR_READY = false; WR_RANKS = {};
    try { WR_RANKS = wrClean(JSON.parse(localStorage.getItem(wrKey()) || '{}')); } catch (e) {}
    fbDb.collection('privates').doc(uid).get().then(function (d) {
        if (!ME || ME.uid !== uid) return;
        var srv = wrClean(d.exists ? (d.data() || {}).weekRanks : null);
        WR_RANKS = Object.assign({}, srv, WR_RANKS); WR_READY = true;   // bản trên máy (mới hơn) ưu tiên
        try { renderStatCard(); } catch (e) {}
    }).catch(function () { WR_READY = true; });
}
// Hạng tuần này trong trường (cùng cách tính với BXH tuần); null nếu chưa có XP tuần hoặc chưa chọn trường
function wrWeekRank() {
    if (!ME || !user.targetSchoolId || !BXH_AT) return null;
    var keep = BXH_WEEK; BXH_WEEK = true;
    try {
        var rows = bxhRows(function (e) { return e.s === user.targetSchoolId; });
        var i = rows.findIndex(function (r) { return r.id === ME.uid; });
        return i >= 0 ? i + 1 : null;
    } catch (e) { return null; } finally { BXH_WEEK = keep; }
}
// Ghi bản chụp hạng của tuần hiện tại khi hạng đổi (giữ 10 tuần gần nhất)
function wrSnapshot() {
    if (!ME || !WR_READY || !RDY.sub || !BXH_AT) return;
    var wk = weekStartDay(), r = wrWeekRank(); if (!r) return;
    var sig = wk + ':' + r; if (sig === WR_SIG || WR_RANKS[wk] === r) { WR_SIG = sig; return; } WR_SIG = sig;
    WR_RANKS[wk] = r;
    Object.keys(WR_RANKS).sort(function (a, b) { return b - a; }).slice(10).forEach(function (k) { delete WR_RANKS[k]; });
    try { localStorage.setItem(wrKey(), JSON.stringify(WR_RANKS)); } catch (e) {}
    var upd = { weekRanks: {} }; upd.weekRanks[wk] = r;
    fbDb.collection('privates').doc(ME.uid).set(upd, { merge: true }).catch(function (e) { console.warn('Chưa lưu được hạng tuần:', e); });
}
function wrXpBetween(a, b) {   // XP trong các ngày VN [a, b)
    var t = 0;
    SUBS_ALL.forEach(function (x) { var ms = subMs(x), d = ms ? vnDay(ms) : -1; if (d >= a && d < b) t += subXp(x); });
    try { loadReview(); Object.keys(REVIEW.xp).forEach(function (k) { if (Number(k) >= a && Number(k) < b) t += REVIEW.xp[k]; }); } catch (e) {}
    return t;
}
function wrRaw(start) {
    var cur = start === weekStartDay(), act = allActiveDays(), days = 0, first = Infinity, subs = 0, i;
    for (i = 0; i < 7; i++) if (act.has(start + i)) days++;
    SUBS_ALL.forEach(function (x) { var ms = subMs(x), d = ms ? vnDay(ms) : -1; if (d >= 0 && d < first) first = d; if (d >= start && d < start + 7 && x.status !== 'timeout') subs++; });
    act.forEach(function (d) { if (d < first) first = d; });
    var pet = (typeof PET !== 'undefined' && PET) ? { emoji: petEmoji(), name: PET.name } : null;
    return {
        name: (user && user.name) || '', startDay: start, xp: cur ? myWeekXp() : wrXpBetween(start, start + 7),
        prevXp: first < start ? wrXpBetween(start - 7, start) : null, days: days, subs: subs,
        rank: cur ? wrWeekRank() : (WR_RANKS[start] || null), prevRank: WR_RANKS[start - 7] || null, pet: pet
    };
}
function wrEnsureModal() {
    if (document.getElementById('modal-wrapped')) return;
    var m = document.createElement('div'); m.id = 'modal-wrapped'; m.className = 'fullscreen-overlay'; m.style.display = 'none';
    m.innerHTML = '<div class="modal-card" style="max-width:420px;"><div class="modal-header"><div class="modal-title"><svg class=ic aria-hidden=true><use href=#i-chart-box></use></svg> Tuần của bạn</div><button class="modal-close" onclick="closeModal(\'modal-wrapped\')"><svg class=ic aria-hidden=true><use href=#i-close></use></svg></button></div>' +
        '<div class="modal-body" id="wrapped-body" style="overflow-y:auto;"></div></div>';
    document.body.appendChild(m);
}
function openWrapped(start) {
    if (!ME || !RDY.sub || !window.WrappedCore) { try { eduToast && eduToast('Dữ liệu đang tải, thử lại sau giây lát nhé.'); } catch (e) {} return; }
    wrEnsureModal();
    WR_CUR = WrappedCore.compose(wrRaw(typeof start === 'number' ? start : weekStartDay()));
    document.getElementById('wrapped-body').innerHTML = WrappedCore.html(WR_CUR) +
        '<button type="button" onclick="saveWrapped()" style="width:100%;margin-top:12px;border:0;background:var(--primary);color:#fff;padding:12px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;"><svg class=ic aria-hidden=true><use href=#i-camera></use></svg> Lưu ảnh để khoe</button>';
    document.getElementById('modal-wrapped').style.display = 'flex';
}
function saveWrapped() { if (WR_CUR && window.WrappedCore) { try { WrappedCore.save(WR_CUR); } catch (e) { console.error(e); eduAlert('Chưa lưu được ảnh. Hãy thử lại hoặc chụp màn hình nhé.', 'warning'); } } }
function wrWeekdayIdx() { return (vnDay(nowMs()) + 3) % 7; }   // 0 = thứ Hai ... 6 = Chủ nhật
// Tự mở thẻ 1 lần vào Chủ nhật cho tuần hiện tại (không mở khi đang thi, hoặc khi dữ liệu mới chỉ là bản cache)
function wrMaybeAuto() {
    if (!ME || !RDY.sub || !WR_READY || !PET_SYNCED || window.EXAM_LOCKED || wrWeekdayIdx() !== 6) return;
    if (!BXH_AT && user.targetSchoolId) return;   // chờ có hạng để thẻ đầy đủ
    var wk = weekStartDay(), key = 'eduorient_wrapped_seen_' + ME.uid;
    try { if (localStorage.getItem(key) === String(wk)) return; localStorage.setItem(key, String(wk)); } catch (e) { return; }
    if (!myWeekXp() && !allActiveDays().has(vnDay(nowMs()))) return;   // tuần trống hoàn toàn thì không làm phiền
    setTimeout(function () { try { openWrapped(wk); } catch (e) {} }, 1200);
}
// Gắn vào thẻ Thành tích: nút xem + (nếu cần) tự mở
(function () {
    var orig = renderStatCard;
    renderStatCard = function () {
        orig.apply(this, arguments);
        try {
            wrLoad(); wrSnapshot();
            var box = document.getElementById('stat-card');
            if (box && ME && RDY.sub && !box.querySelector('.wr-open-btn')) {
                var b = document.createElement('button'); b.type = 'button'; b.className = 'wr-open-btn'; b.onclick = function () { openWrapped(); };
                b.style.cssText = 'width:100%;margin-top:12px;border:0;color:#fff;padding:11px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(90deg,#7c3aed,#db2777,#f97316);';
                b.textContent = 'Xem "Tuần của bạn"'; box.appendChild(b);
            }
            wrMaybeAuto();
        } catch (e) { console.warn('Tuần của bạn:', e); }
    };
})();
