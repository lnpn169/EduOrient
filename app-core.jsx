// EduOrient — phần LÕI dùng ngay ở trang đăng nhập (Firebase, hằng số, AuthGate, các bộ chọn trường/môn...). Được tải cùng app.jsx.
const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

        // Icon rút gọn cho màn hình đăng nhập (chỉ vài icon cần dùng, để gói tải đầu không phải kéo cả bộ app-icons). Cùng nguồn Material Design Icons.
        const CORE_ICONS = { alert: "M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2z", close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z", 'close-circle': "M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z", magnify: "M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.52 6.52 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5" };
        const CoreIcon = ({ name, className = 'ic-inline' }) => (
            <span className="inline-flex items-center justify-center shrink-0 mdi-wrap"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={'mdi-icon ' + className}><path d={CORE_ICONS[name] || ''} /></svg></span>
        );

// ================= FIREBASE =================
// Đăng nhập Google dùng REDIRECT: authDomain phải TRÙNG domain đang phục vụ trang (trình duyệt chặn storage bên thứ ba).
// Firebase Hosting tự phục vụ /__/auth/handler trên mọi domain của nó (web.app, firebaseapp.com, domain riêng). Chạy local thì dùng domain mặc định.
const AUTH_DOMAIN = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? 'eduorient-d06c2.firebaseapp.com' : location.hostname;
// Môi trường: điền FB_STAGING (config project Firebase thử nghiệm) thì localhost và <project-thử-nghiệm>.web.app dùng project đó; còn lại luôn dùng project thật.
const FB_STAGING = null;   // dán đối tượng config của project thử nghiệm vào đây (xem HUONG-DAN-STAGING.md)
const FB_USE_STG = !!FB_STAGING && (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.indexOf(FB_STAGING.projectId) === 0);
firebase.initializeApp(FB_USE_STG ? { ...FB_STAGING, authDomain: location.hostname.indexOf('localhost') === 0 || location.hostname === '127.0.0.1' ? FB_STAGING.authDomain : location.hostname } : {
  apiKey: "AIzaSyDO6B0BHBJkKZ_xiose_q_hv6yqf2l7NHQ",
  authDomain: AUTH_DOMAIN,
  projectId: "eduorient-d06c2",
  storageBucket: "eduorient-d06c2.firebasestorage.app",
  messagingSenderId: "436898406278",
  appId: "1:436898406278:web:7fbaeaaffa36b4cf909607"
});
const fbAuth = firebase.auth(), fbDb = firebase.firestore();
fbAuth.languageCode = 'vi';

const ADMIN_EMAILS = ['iemmchyy@gmail.com', 'lykhoilinh@gmail.com']; // phải khớp isAdmin() trong firestore.rules
const isAdminEmail = (em) => !!em && ADMIN_EMAILS.includes(String(em).trim().toLowerCase()); // so khớp không phân biệt hoa/thường

// ===== ĐIỀU HƯỚNG TRỰC TIẾP (thay cho iframe + postMessage) =====
const PAGE_LOGIN = 'index.html', PAGE_STUDENT = 'hocsinh.html';
const goTo = (page) => { window.location.href = page; };
const fbSignOut = (setU) => { fbAuth.signOut().finally(() => { setU(null); goTo(PAGE_LOGIN); }); };

// Vai trò (tab) người dùng chọn khi bấm "Đăng nhập Google": trang bị tải lại sau redirect nên phải lưu vào sessionStorage (hết hạn sau 10 phút)
const INTENT_KEY = 'eduLoginIntent';
const readIntent = () => { try { const o = JSON.parse(sessionStorage.getItem(INTENT_KEY) || 'null'); if (o && (o.tab === 'student' || o.tab === 'teacher') && Date.now() - o.t < 600000) return o.tab; } catch (e) {} return null; };
const saveIntent = (tab) => { try { sessionStorage.setItem(INTENT_KEY, JSON.stringify({ tab: tab, t: Date.now() })); } catch (e) {} };
const clearIntent = () => { try { sessionStorage.removeItem(INTENT_KEY); } catch (e) {} };

const fbNow = () => firebase.firestore.FieldValue.serverTimestamp();
const fbErr = (e) => ({
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.', 'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.', 'auth/email-already-in-use': 'Email này đã được đăng ký.',
  'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.', 'auth/invalid-email': 'Email không hợp lệ.',
  'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập Google.', 'auth/too-many-requests': 'Thử quá nhiều lần, hãy đợi một lúc rồi thử lại.',
  'auth/missing-email': 'Vui lòng nhập email.', 'auth/network-request-failed': 'Lỗi mạng, hãy kiểm tra kết nối.', 'auth/unauthorized-domain': 'Địa chỉ web này chưa được cho phép trong Firebase (Authorized domains).',
  'auth/operation-not-allowed': 'Chưa bật đăng nhập Ẩn danh (Anonymous) trong Firebase Console > Authentication > Sign-in method.',
  'permission-denied': 'Bạn không có quyền thực hiện thao tác này.',
  'sid-taken': 'Mã học sinh này đã có người sử dụng. Hãy nhập một mã khác.'
}[e && e.code] || ('Lỗi: ' + ((e && e.message) || e)));

// ===================== TỈNH / TRƯỜNG CÔNG TÁC (giáo viên) =====================
// Dữ liệu giống hocsinh.html. Chỉ hiển thị tên thuần: "Lào Cai", "THPT Lý Thường Kiệt"...
const OTHER_SCHOOL = '__other__';
const GROUP_KW = { LC: 'Lào Cai', YB: 'Yên Bái', TPYB: 'Yên Bái' }; // từ khóa tìm kiếm ẩn, không hiển thị
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
// Lào Cai đứng đầu, các tỉnh/thành còn lại xếp theo bảng chữ cái tiếng Việt
const SCHOOL_DB = PROVINCES.map((p) => ({ id: p.id, name: p.name, schools: (p.s || []).map((t) => ({ name: t[0], kw: ((t[2] || '') + ' ' + (GROUP_KW[t[1]] || '')).trim() })) }))
  .sort((a, b) => a.id === 'lao-cai' ? -1 : b.id === 'lao-cai' ? 1 : a.name.replace(/^TP\. /, '').localeCompare(b.name.replace(/^TP\. /, ''), 'vi'));
const foldVN = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

// Đọc + kiểm tra giá trị của SchoolPicker. Trả { ok, msg } hoặc { ok, province, school }
const readSchoolPick = (v) => {
  if (!v.province) return { ok: false, msg: 'Vui lòng chọn trường công tác trong danh sách.' };
  if (!v.school) return { ok: false, msg: 'Vui lòng chọn trường công tác.' };
  const school = v.school === OTHER_SCHOOL ? '' : v.school;
  if (school.length < 3) return { ok: false, msg: 'Vui lòng chọn trường công tác trong danh sách.' };
  return { ok: true, province: v.province, school };
};

// Ô tìm kiếm trường thông minh (Searchable Dropdown / Autocomplete): 1 ô duy nhất, gõ tên trường HOẶC tên tỉnh/thành (không cần dấu)
// value = { province, school, schoolOther }; onChange(patch) nhận phần thay đổi (giữ nguyên API cũ nên các form không phải sửa gì thêm)
const ALL_SCHOOLS = SCHOOL_DB.flatMap((p) => p.schools.map((s) => ({ name: s.name, provId: p.id, provName: p.name, hay: foldVN(s.name + ' ' + s.kw + ' ' + p.name) })));
const SCHOOL_LIST_LIMIT = 1000; // hiện TẤT CẢ trường khi bấm vào ô
const matchAll = (hay, tokens) => tokens.every((t) => hay.includes(t)); // "thpt lao cai", "ly thuong kiet yen bai"... đều khớp

function SchoolPicker({ value, onChange, inp, accent }) {
  const [schoolSearch, setSchoolSearch] = useState(''); // chữ đang hiển thị trong ô input
  const [isSchoolOpen, setIsSchoolOpen] = useState(false); // dropdown đóng/mở
  const [active, setActive] = useState(0); // dòng đang được tô sáng (bàn phím)
  const wrap = useRef(null), inputRef = useRef(null), listRef = useRef(null), otherRef = useRef(null);
  // selectedSchool = trường đã chọn trong danh sách ('' nếu chưa chọn hoặc chọn "trường khác")
  const selectedSchool = value.school && value.school !== OTHER_SCHOOL ? value.school : '';
  const isOther = value.school === OTHER_SCHOOL;
  const prov = SCHOOL_DB.find((p) => p.id === value.province) || null;
  const label = selectedSchool || (isOther && prov ? prov.name : '');
  // Đồng bộ chữ trong ô khi giá trị bị đổi từ bên ngoài (nạp hồ sơ cũ, reset, chọn xong...)
  useEffect(() => { setSchoolSearch(label); }, [value.province, value.school]);
  // Lọc kết quả: ô đang hiện đúng tên đã chọn => cho xem lại cả danh sách
  const kw = foldVN(schoolSearch.trim());
  const tokens = kw && schoolSearch !== label ? kw.split(/\s+/) : [];
  const schools = tokens.length ? ALL_SCHOOLS.filter((s) => matchAll(s.hay, tokens)) : ALL_SCHOOLS;
  const shown = schools.slice(0, SCHOOL_LIST_LIMIT);
  const provRows = []; // đã bỏ "Trường khác (tự nhập tên)": chỉ được chọn trường có sẵn
  const items = [
    ...shown.map((s) => ({ type: 'school', key: s.provId + '|' + s.name, name: s.name, provId: s.provId, provName: s.provName })),
    ...provRows.map((p) => ({ type: 'other', key: 'other|' + p.id, provId: p.id, provName: p.name })),
  ];
  const close = () => { setIsSchoolOpen(false); setSchoolSearch(label); }; // đóng mà chưa chọn => trả lại giá trị đã chọn trước đó
  const pick = (it) => {
    if (it.type === 'school') { onChange({ province: it.provId, school: it.name, schoolOther: '' }); setSchoolSearch(it.name); }
    else { onChange({ province: it.provId, school: OTHER_SCHOOL, schoolOther: '' }); setSchoolSearch(it.provName); setTimeout(() => { if (otherRef.current) otherRef.current.focus(); }, 0); }
    setIsSchoolOpen(false);
  };
  const clearAll = () => {
    onChange({ province: '', school: '', schoolOther: '' });
    setSchoolSearch(''); setActive(0); setIsSchoolOpen(true);
    if (inputRef.current) inputRef.current.focus();
  };
  useEffect(() => { // click ra ngoài / Esc => đóng
    if (!isSchoolOpen) return;
    const out = (e) => { if (wrap.current && !wrap.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', out); document.addEventListener('touchstart', out);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('touchstart', out); };
  }, [isSchoolOpen, label]);
  useEffect(() => { // giữ dòng đang chọn (bàn phím) luôn nằm trong vùng nhìn thấy
    if (!isSchoolOpen || !listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, isSchoolOpen]);
  const onType = (e) => {
    const v = e.target.value;
    setSchoolSearch(v); setActive(0); setIsSchoolOpen(true);
    if (!v.trim() && (value.school || value.province)) onChange({ province: '', school: '', schoolOther: '' }); // xóa hết chữ => bỏ luôn lựa chọn
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!isSchoolOpen) setIsSchoolOpen(true); else setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { if (isSchoolOpen) { e.preventDefault(); if (items[active]) pick(items[active]); } } // đang mở thì Enter = chọn, không submit form
    else if (e.key === 'Escape') { if (isSchoolOpen) { e.preventDefault(); close(); } }
    else if (e.key === 'Tab') { if (isSchoolOpen) close(); }
  };
  const ring = accent === 'indigo' ? 'bg-indigo-50' : 'bg-amber-50';
  const badge = 'shrink-0 max-w-[45%] truncate text-[11px] leading-5 px-2 rounded-full bg-slate-100 text-slate-500';
  const row = 'w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-colors ';
  return (<>
    <div className="relative" ref={wrap}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" aria-hidden="true"><CoreIcon name="magnify" className="ic-inline" /></span>
      <input id="school-search" name="schoolSearch" aria-label="Tìm trường công tác" ref={inputRef} type="text" role="combobox" aria-expanded={isSchoolOpen} aria-autocomplete="list" autoComplete="off"
        className={inp + ' bg-white !pl-10 !pr-9'} placeholder="Nhập tên trường hoặc tỉnh/thành..."
        value={schoolSearch} onChange={onType} onClick={() => setIsSchoolOpen(true)} onFocus={() => setIsSchoolOpen(true)} onKeyDown={onKey} />
      {(schoolSearch || value.school || value.province) && (
        <button type="button" onClick={clearAll} aria-label="Xóa lựa chọn trường"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"><CoreIcon name="close" className="ic-inline" /></button>
      )}
      {isSchoolOpen && (
        <div ref={listRef} role="listbox" className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 max-h-64 overflow-y-auto">
          {!shown.length && <p className="px-3 py-3 text-xs text-slate-400 text-center"><CoreIcon name="close-circle" className="ic-inline" /> Không tìm thấy trường phù hợp</p>}
          {items.map((it, i) => {
            const isActive = i === active;
            if (it.type === 'school') {
              const isSel = selectedSchool === it.name && value.province === it.provId;
              return (
                <button type="button" role="option" aria-selected={isSel} key={it.key} data-active={isActive} onClick={() => pick(it)} onMouseEnter={() => setActive(i)}
                  className={row + (isActive ? 'bg-slate-100 ' : isSel ? ring + ' ' : 'hover:bg-slate-50 ')}>
                  <span className={'truncate ' + (isSel ? 'font-extrabold text-slate-900' : 'font-bold text-slate-800')}>{it.name}</span>
                  <span className={badge}>{it.provName}</span>
                </button>
              );
            }
            return (
              <button type="button" role="option" key={it.key} data-active={isActive} onClick={() => pick(it)} onMouseEnter={() => setActive(i)}
                className={row + 'text-slate-600 ' + (isActive ? 'bg-slate-100 ' : 'hover:bg-slate-50 ') + (it.key === items[shown.length].key ? 'border-t border-slate-100 mt-1' : '')}>
                <span className="truncate">{it.provName}</span>
                <span className={badge}>{it.provName}</span>
              </button>
            );
          })}
          {schools.length > SCHOOL_LIST_LIMIT && <p className="px-3 py-2 text-[11px] text-slate-400 text-center">Còn {schools.length - SCHOOL_LIST_LIMIT} kết quả khác — gõ thêm để thu hẹp.</p>}
        </div>
      )}
    </div>
    {isOther && <input id="school-other" name="schoolOther" aria-label="Tên trường công tác" ref={otherRef} className={inp} placeholder={'Nhập tên trường công tác' + (prov ? ' (' + prov.name + ')' : '')} maxLength={80} value={value.schoolOther} onChange={(e) => onChange({ schoolOther: e.target.value })} />}
  </>);
}

// Ô chọn Môn học giảng dạy (bắt buộc) - dùng danh sách GDPT_SUBJECTS khớp firestore.rules
function SubjectSelect({ value, onChange, inp }) {
  return (
    <select id="subject-select" name="subject" aria-label="Môn học giảng dạy" className={inp + ' bg-white'} value={GDPT_SUBJECTS.includes(value) ? value : ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">Chọn môn học giảng dạy</option>
      {GDPT_SUBJECTS.map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  );
}

// ===== MÃ HỌC SINH (ID) — ĐÃ VÁ: CHỈ GỒM CHỮ (A-Z) VÀ SỐ (0-9) =====
// Viết HOA, tự loại khoảng trắng, dấu tiếng Việt và mọi ký tự đặc biệt (. _ - ...); dài 3-20 ký tự (khớp firestore.rules)
const normStudentId = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// dùng khi đang gõ: tự viết hoa và loại ngay ký tự không phải chữ/số
const upperInput = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const validStudentId = (v) => /^[A-Z0-9]{3,20}$/.test(v);

// Phiên Phụ huynh: lưu lại trên máy để tải lại trang (F5) vẫn ở đúng báo cáo, không bắt nhập lại Email + Mã học sinh.
// Chỉ xóa khi bấm "Thoát cổng phụ huynh", khi có tài khoản thật đăng nhập, hoặc sau 30 ngày. Cổng này chỉ-đọc nên an toàn.
const PARENT_KEY = 'eduorient_parent_session', PARENT_TTL = 30 * 24 * 3600 * 1000;
const loadParentSession = () => { try { const o = JSON.parse(localStorage.getItem(PARENT_KEY)); if (o && o.student && o.student.id && Date.now() - (o.at || 0) < PARENT_TTL) return o.student; localStorage.removeItem(PARENT_KEY); } catch (e) {} return null; };
const saveParentSession = (st) => { try { localStorage.setItem(PARENT_KEY, JSON.stringify({ student: st, at: Date.now() })); } catch (e) {} };
const clearParentSession = () => { try { localStorage.removeItem(PARENT_KEY); } catch (e) {} };

// ===== Chia nhỏ code: các màn hình nặng chỉ được tải khi thật sự cần (esbuild --splitting + import() động) =====
const { Suspense } = React;
const ScreenLoading = () => <div className="min-h-screen flex items-center justify-center"><p className="text-slate-500 text-sm">Đang tải...</p></div>;
const lazyScreen = (loader, name) => React.lazy(() => loader().then((m) => {
  try { sessionStorage.removeItem('eduChunkReload'); } catch (e) {}
  return { default: m[name] };
}).catch((err) => {
  // File chunk cũ không còn trên máy chủ (vừa có bản cập nhật) -> tải lại trang đúng 1 lần để lấy bản mới.
  let tried = false; try { tried = !!sessionStorage.getItem('eduChunkReload'); sessionStorage.setItem('eduChunkReload', '1'); } catch (e) {}
  if (!tried) { location.reload(); return new Promise(() => {}); }
  throw err;
}));
const LazyParentPortal = lazyScreen(() => import('./app-parent.jsx'), 'ParentPortal');
const LazyTeacherApp = lazyScreen(() => import('./app-teacher.jsx'), 'TeacherApp');
const LazyAdminPanel = lazyScreen(() => import('./app-admin.jsx'), 'AdminPanel');

function AuthGate({ onUser }) {
  const [tab, setTab] = useState('student');
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', studentId: '', province: '', school: '', schoolOther: '', subject: '', email: '', password: '' }); // school: tên trường đã chọn (hoặc OTHER_SCHOOL)
  // Mọi thông báo đăng nhập/đăng ký/khôi phục mật khẩu hiển thị bằng SweetAlert2 (eduAlert)
  const notify = (text, icon, title) => eduAlert(text, { icon: icon || 'error', title: title });
  const failIcon = (err) => err && err.code === 'auth/popup-closed-by-user' ? 'info'
    : (err && (err.code === 'auth/too-many-requests' || err.code === 'auth/network-request-failed') ? 'warning' : 'error');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const registering = useRef(false);
  // Tab (student | teacher) mà người dùng đang bấm Đăng nhập: resolve() dùng để kiểm tra đúng vai trò. null = khôi phục phiên cũ / đăng ký mới (không kiểm tra)
  const loginIntent = useRef(readIntent()); // khôi phục vai trò đã chọn nếu vừa quay về từ redirect Google
  // ----- Phụ huynh (PHHS) -----
  const [parentOpen, setParentOpen] = useState(false);
  const [pf, setPf] = useState({ otp: '', sid: '' });
  const [parentBusy, setParentBusy] = useState(false);
  const [parentErr, setParentErr] = useState('');
  const [parentStudent, setParentStudent] = useState(loadParentSession); // { id, name, email, studentId } - học sinh đã xác thực (khôi phục từ máy khi tải lại trang)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const patchF = (patch) => setF((x) => ({ ...x, ...patch })); // dùng cho SchoolPicker / SubjectSelect

  const resolve = async (u) => {
    if (isAdminEmail(u.email)) {
      loginIntent.current = null; clearIntent(); // Quản trị viên bỏ qua màn hình chọn vai trò Học sinh / Giáo viên
      // Làm mới hồ sơ + ép đổi token đăng nhập: rules đọc email_verified từ TOKEN, token cũ (tài khoản từng là Học sinh / chưa xác minh) sẽ bị từ chối quyền
      try { await u.reload(); } catch (x) {}
      let tk = null; try { tk = await u.getIdTokenResult(true); } catch (x) {}
      const diag = { uid: u.uid, providers: (u.providerData || []).map((p) => p.providerId).join(', ') || '?', verified: u.emailVerified === true, tokenVerified: tk ? tk.claims.email_verified === true : null };
      if (u.emailVerified && !(tk && tk.claims.email_verified !== true)) {
        // Tự động cấp quyền: khởi tạo / cập nhật users/{uid} với role 'admin' (không chặn đăng nhập nếu ghi lỗi)
        try { await fbDb.collection('users').doc(u.uid).set({ email: u.email, name: u.displayName || 'Quản trị viên', role: 'admin', status: 'approved', updatedAt: fbNow() }, { merge: true }); }
        catch (x) { console.warn('Không ghi được users/{uid} role=admin (hãy publish firestore.rules mới):', x); }
        onUser({ id: u.uid, email: u.email, name: u.displayName || 'Quản trị viên', role: 'admin', diag }); return;
      }
      try { await u.sendEmailVerification(); } catch (x) {}
      notify('Email quản trị chưa được xác minh. Hãy đăng nhập bằng nút "Đăng nhập bằng Google", hoặc bấm vào liên kết xác minh vừa gửi tới ' + u.email + ' rồi đăng nhập lại.', 'warning', 'Email chưa được xác minh'); await fbAuth.signOut(); setLoading(false); return;
    }
    // ===== KHÔNG PHẢI ADMIN (gồm lnpn169@gmail.com): vai trò lấy từ Firestore users/{uid} =====
    const intent = loginIntent.current; loginIntent.current = null; clearIntent();
    const ref = fbDb.collection('users').doc(u.uid);
    let snap;
    try {
      snap = await ref.get(); // CHỈ ĐỌC
    } catch (e) {
      // Lỗi đọc (mạng / quyền): không đoán vai trò để tránh đẩy giáo viên sang hocsinh.html rồi bị vòng lặp đăng nhập
      console.error('Không đọc được users/' + u.uid, e);
      notify(fbErr(e), 'error', 'Không xác định được vai trò');
      try { await fbAuth.signOut(); } catch (x) {}
      setLoading(false); return;
    }
    const role = snap.exists && snap.data().role === 'teacher' ? 'teacher' : 'student';
    // ===== Kiểm tra vai trò theo Tab đang chọn (Role Validation) =====
    const rejectRole = async (msg) => { notify(msg, 'error', 'Sai vai trò đăng nhập'); try { await fbAuth.signOut(); } catch (x) {} setLoading(false); };
    if (intent === 'teacher' && role !== 'teacher')
      return rejectRole("Tài khoản này không thuộc quyền Giáo viên! Vui lòng chuyển sang Tab 'Học sinh' để đăng nhập.");
    if (intent === 'student' && role === 'teacher')
      return rejectRole("Đây là tài khoản Giáo viên! Vui lòng chọn Tab 'Giáo viên' để đăng nhập.");
    // Chưa có doc -> chỉ TẠO MỚI (không bao giờ ghi đè doc đã tồn tại)
    if (!snap.exists) {
      try {
        await ref.set({ email: u.email, name: u.displayName || u.email.split('@')[0], role: 'student', status: 'approved', createdAt: fbNow() });
        snap = await ref.get();
      } catch (e) { console.warn('Không tạo được users/{uid}:', e); }
    }
    const d = snap.exists ? snap.data() : { role: 'student', status: 'approved' };
    if (role === 'student') goTo(PAGE_STUDENT);
    else if (d.status === 'approved') {
      let pr = {}; try { const ps = await fbDb.collection('profiles').doc(u.uid).get(); pr = ps.exists ? ps.data() : {}; } catch (x) {}
      const tSchool = pr.school || d.school || '', tSubject = pr.subject || d.subject || '', tProvince = pr.province || d.province || '';
      // Giáo viên vừa được duyệt: đưa Trường / Môn / Tỉnh đã đăng ký sang hồ sơ công khai để học sinh thấy (không chặn đăng nhập nếu lỗi)
      if ((!pr.school && d.school) || (!pr.subject && d.subject)) {
        const sync = { name: pr.name || d.name, role: 'teacher', school: tSchool };
        if (tSubject) sync.subject = tSubject;
        if (tProvince) sync.province = tProvince;
        fbDb.collection('profiles').doc(u.uid).set(sync, { merge: true }).catch(() => {});
      }
      onUser({ id: u.uid, email: u.email, name: pr.name || d.name, role: 'teacher', school: tSchool, subject: tSubject, province: tProvince, avatar: safeAvatar(pr.avatar), isPrivate: pr.isPrivate === true });
    }
    else { setPending({ uid: u.uid, status: d.status, name: d.name }); setLoading(false); }
  };

  // Quay về từ redirect Google: onAuthStateChanged tự nhận người dùng, ở đây chỉ để bắt LỖI của lần redirect (vd tài khoản bị khóa, domain chưa được phép)
  useEffect(() => {
    fbAuth.getRedirectResult().catch((err) => {
      loginIntent.current = null; clearIntent(); setBusy(false);
      notify(fbErr(err), failIcon(err), 'Đăng nhập Google thất bại');
    });
    // Bấm Back từ trang Google: trình duyệt khôi phục trang từ bộ nhớ đệm, bỏ trạng thái "đang xử lý"
    const onShow = (e) => { if (e.persisted) { setBusy(false); loginIntent.current = null; clearIntent(); } };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  useEffect(() => fbAuth.onAuthStateChanged(async (u) => {
    // Phiên ẩn danh của Phụ huynh: KHÔNG tải hồ sơ users, KHÔNG onUser/redirect. Chỉ tắt màn hình "Đang tải" (nếu không sẽ treo ở đó khi F5 lúc phụ huynh đang xem báo cáo)
    if (u && u.isAnonymous) { setLoading(false); return; }
    if (registering.current) return;
    if (!u) { // chưa đăng nhập: trả về trạng thái sạch
      // Phiên phụ huynh còn trong localStorage nhưng phiên ẩn danh Firebase đã mất => rules sẽ từ chối mọi lệnh đọc, nên bắt nhập lại Email + Mã HS
      if (loadParentSession()) { clearParentSession(); setParentStudent(null); }
      setPending(null);
      onUser(null);
      setLoading(false);
      return;
    }
    clearParentSession(); // đã có tài khoản thật đăng nhập: bỏ phiên phụ huynh để lần đăng xuất sau không tự vào cổng PHHS
    try {
      await resolve(u); // setLoading(false) do từng nhánh trong resolve gọi SAU khi đã có vai trò
    } catch (e) {
      console.error('Lỗi xác định vai trò:', e);
      notify(fbErr(e), failIcon(e), 'Đăng nhập thất bại');
      setLoading(false);
    }
  }), []);

  useEffect(() => {
    if (!pending || pending.status !== 'pending') return;
    return fbDb.collection('users').doc(pending.uid).onSnapshot((s) => {
      const d = s.data(); if (d && d.status !== 'pending') resolve(fbAuth.currentUser).catch(() => {});
    });
  }, [pending && pending.uid]);

  // Xác thực phụ huynh: lookupStudentForParent (app-parent.jsx) tự đăng nhập ẩn danh, tìm học sinh theo Mã HS rồi gửi mã OTP (do học sinh tạo) + ghi parentLinks trong 1 batch.
  // Dùng import() động (giống LazyParentPortal) để không kéo cả app-parent.jsx vào trang đăng nhập và tránh vòng import app-core <-> app-parent.
  // ===== KHÓA TẠM SAU 5 LẦN NHẬP SAI OTP (giao diện) =====
  // Lưu ở localStorage theo từng Mã HS: { n: số lần sai liên tiếp, until: mốc hết khóa }. Lỗi mạng/quyền KHÔNG tính là nhập sai.
  // Lưu ý: người có kiến thức kỹ thuật vẫn có thể xóa localStorage hoặc gọi thẳng API, nên đây KHÔNG thay thế giới hạn ở máy chủ.
  const PARENT_MAX_FAIL = 5, PARENT_LOCK_MS = 15 * 60 * 1000, PARENT_FAIL_KEY = 'eduorient_parent_fail';
  const parentFailRead = () => { try { return JSON.parse(localStorage.getItem(PARENT_FAIL_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const parentFailWrite = (o) => { try { localStorage.setItem(PARENT_FAIL_KEY, JSON.stringify(o)); } catch (e) {} };
  const parentLockLeftMs = (sid) => { const r = parentFailRead()[sid]; return r && r.until ? Math.max(0, r.until - Date.now()) : 0; };
  const parentFailBump = (sid) => {   // ghi 1 lần sai; trả về số lần còn lại (0 = vừa bị khóa)
    const o = parentFailRead(), r = o[sid] || { n: 0, until: 0 };
    if (r.until && r.until <= Date.now()) { r.n = 0; r.until = 0; }   // hết khóa cũ thì đếm lại từ đầu
    r.n += 1;
    if (r.n >= PARENT_MAX_FAIL) { r.until = Date.now() + PARENT_LOCK_MS; r.n = 0; }
    o[sid] = r; parentFailWrite(o);
    return r.until ? 0 : PARENT_MAX_FAIL - r.n;
  };
  const parentFailClear = (sid) => { const o = parentFailRead(); if (o[sid]) { delete o[sid]; parentFailWrite(o); } };
  const verifyParent = async (e) => {
    if (e) e.preventDefault();
    if (parentBusy) return;
    const otp = String(pf.otp || '').replace(/\D/g, ''), sid = normStudentId(pf.sid); // studentId luôn lưu dạng chữ HOA + số; OTP = 6 chữ số
    if (!sid || otp.length !== 6) { setParentErr('Vui lòng nhập Mã học sinh (ID) và mã OTP gồm 6 chữ số.'); return; }
    // Khóa tạm sau 5 lần nhập sai liên tiếp cho cùng 1 Mã HS (chỉ chặn thao tác thông thường trên giao diện; xem mục 3.6 của báo cáo)
    const lockLeft = parentLockLeftMs(sid);
    if (lockLeft > 0) { setParentErr('Bạn đã nhập sai quá ' + PARENT_MAX_FAIL + ' lần. Hãy thử lại sau khoảng ' + Math.ceil(lockLeft / 60000) + ' phút, hoặc nhờ con tạo mã OTP mới.'); return; }
    setParentBusy(true); setParentErr('');
    try {
      const { lookupStudentForParent } = await import('./app-parent.jsx');
      const d = await lookupStudentForParent(sid, otp); // null nếu sai mã / hết hạn / đã dùng
      if (!d || d.role !== 'student') {
        const left = parentFailBump(sid);   // số lần còn lại trước khi bị khóa
        setParentErr(left > 0
          ? 'Mã OTP không đúng, đã hết hạn (5 phút) hoặc đã được dùng. Hãy nhờ con tạo mã mới. (Còn ' + left + ' lần thử)'
          : 'Bạn đã nhập sai quá ' + PARENT_MAX_FAIL + ' lần. Hãy thử lại sau ' + Math.ceil(PARENT_LOCK_MS / 60000) + ' phút, hoặc nhờ con tạo mã OTP mới.');
      } else {
        parentFailClear(sid);
        const ps = { id: d.id, name: d.name || 'Học sinh', email: d.email, studentId: d.studentId, nguyenVong: d.nguyenVong || null };
        saveParentSession(ps); setParentStudent(ps);
        setParentOpen(false); setPf({ otp: '', sid: '' });
      }
    } catch (err) {
      console.error('Lỗi tra cứu Phụ huynh:', err);
      setParentErr(err && err.code === 'permission-denied' ? 'Chưa có quyền tra cứu. Hãy publish firestore.rules mới.' : fbErr(err));
    }
    setParentBusy(false);
  };
  const exitParent = () => { // xóa phiên đã lưu + đóng phiên ẩn danh (nếu có) để lần sau tra cứu lại từ đầu
    clearParentSession(); setParentStudent(null);
    const cu = fbAuth.currentUser; if (cu && cu.isAnonymous) fbAuth.signOut().catch(() => {});
  };

  const RESET_OK = 'Nếu email này đã đăng ký, bạn sẽ nhận được thư đặt lại mật khẩu trong ít phút. Hãy kiểm tra cả mục Thư rác (Spam). Nếu bạn đăng nhập bằng Google thì không có mật khẩu riêng, hãy dùng nút "Đăng nhập bằng Google".';
  const forgot = async () => {
    if (busy) return;
    const em = f.email.trim();
    if (!em) return notify('Nhập email của bạn vào ô Email rồi bấm "Quên mật khẩu?".', 'warning', 'Chưa nhập email');
    setBusy(true);
    try {
      await fbAuth.sendPasswordResetEmail(em);
      notify(RESET_OK, 'success', 'Đã gửi email khôi phục');
    } catch (err) {
      // Email chưa đăng ký: vẫn báo như thành công để không lộ email nào đã có tài khoản
      if (err && err.code === 'auth/user-not-found') notify(RESET_OK, 'success', 'Đã gửi email khôi phục');
      else notify(fbErr(err), failIcon(err), 'Không gửi được email');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    let cr = null;
    try {
      if (mode === 'login') { loginIntent.current = tab; await fbAuth.signInWithEmailAndPassword(f.email.trim(), f.password); }
      else {
        if (!f.name.trim()) { notify('Vui lòng nhập họ tên.', 'warning', 'Thiếu thông tin'); setBusy(false); return; }
        // Giáo viên BẮT BUỘC chọn Tỉnh, Trường và Môn học giảng dạy (học sinh chọn trường trong hocsinh.html)
        let schoolName = '', extra = {};
        const adminReg = isAdminEmail(f.email); // email Admin: bỏ qua mọi form Học sinh / Giáo viên
        if (tab === 'student' && !adminReg) {
          const sid = normStudentId(f.studentId);
          if (!validStudentId(sid)) { notify('Vui lòng tự đặt Mã học sinh (ID) gồm 3-20 ký tự, chỉ gồm chữ và số, không dấu, không khoảng trắng (VD: HS11A801).', 'warning', 'Mã học sinh chưa hợp lệ'); setBusy(false); return; }
          extra = { studentId: sid };
        }
        if (tab === 'teacher' && !adminReg) {
          const pk = readSchoolPick(f);
          if (!pk.ok) { notify(pk.msg, 'warning', 'Thiếu thông tin'); setBusy(false); return; }
          if (!GDPT_SUBJECTS.includes(f.subject)) { notify('Vui lòng chọn môn học giảng dạy.', 'warning', 'Thiếu thông tin'); setBusy(false); return; }
          schoolName = pk.school; extra = { subject: f.subject, province: pk.province };
        }
        registering.current = true;
        cr = await fbAuth.createUserWithEmailAndPassword(f.email.trim(), f.password);
        if (!isAdminEmail(cr.user.email)) {
          const udoc = { email: cr.user.email, name: f.name.trim(), school: schoolName, ...extra, role: tab, status: tab === 'teacher' ? 'pending' : 'approved', createdAt: fbNow() };
          if (extra.studentId) {
            // Mã học sinh phải DUY NHẤT: kiểm tra rồi ghi sổ đăng ký studentIds/{MÃ} + hồ sơ users trong 1 batch (trùng -> cả batch bị từ chối)
            const regRef = fbDb.collection('studentIds').doc(extra.studentId);
            if ((await regRef.get()).exists) throw { code: 'sid-taken' };
            const b = fbDb.batch(); b.set(regRef, { uid: cr.user.uid }); b.set(fbDb.collection('users').doc(cr.user.uid), udoc);
            try { await b.commit(); } catch (e2) { if (e2 && e2.code === 'permission-denied') throw { code: 'sid-taken' }; throw e2; }
          } else await fbDb.collection('users').doc(cr.user.uid).set(udoc);
        }
        registering.current = false;
        await resolve(cr.user);
      }
    } catch (err) {
      registering.current = false; loginIntent.current = null;
      if (cr) { try { await cr.user.delete(); } catch (x) {} }
      notify(fbErr(err), failIcon(err), mode === 'login' ? 'Đăng nhập thất bại' : 'Đăng ký thất bại');
    }
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    loginIntent.current = tab; saveIntent(tab); // Google ở tab nào thì cũng phải đúng vai trò của tab đó (Quản trị viên được bỏ qua); lưu lại vì trang sẽ tải lại sau redirect
    try { await fbAuth.signInWithRedirect(new firebase.auth.GoogleAuthProvider()); } // chuyển hướng toàn trang -> không còn cảnh báo Cross-Origin-Opener-Policy của popup
    catch (err) { loginIntent.current = null; clearIntent(); notify(fbErr(err), failIcon(err), 'Đăng nhập Google thất bại'); setBusy(false); }
  };

  const box = 'min-h-screen flex items-center justify-center bg-slate-50 p-4';
  const inp = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500';
  if (loading) return <div className={box}><p className="text-slate-500 text-sm">Đang tải...</p></div>;
  if (parentStudent) return <Suspense fallback={<ScreenLoading />}><LazyParentPortal student={parentStudent} onExit={exitParent} /></Suspense>;
  if (pending) return (
    <div className={box}><div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
      <h2 className="text-lg font-bold mb-2">{pending.status === 'pending' ? 'Đang chờ duyệt' : 'Tài khoản chưa được duyệt'}</h2>
      <p className="text-sm text-slate-600 mb-4">{pending.status === 'pending'
        ? 'Tài khoản giáo viên của ' + pending.name + ' đang chờ quản trị viên duyệt. Trang sẽ tự cập nhật khi được duyệt.'
        : 'Quản trị viên đã từ chối hoặc khóa tài khoản này. Vui lòng liên hệ nhà trường.'}</p>
      <button onClick={() => fbAuth.signOut().then(() => { setPending(null); goTo(PAGE_LOGIN); })} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold">Đăng xuất</button>
    </div></div>
  );
  return (
    <div className={box}><UiZoomPopover up style={{ position: 'fixed', zIndex: 40, right: 16, bottom: 16 }} /><div className="bg-white rounded-2xl shadow p-6 md:p-8 w-full max-w-md">
      <div className="flex items-center justify-center gap-2 mb-1"><img src="logo.svg" alt="" className="logo-l w-10 h-10" /><img src="logo-dark.svg" alt="" className="logo-d w-10 h-10" /><h1 className="text-2xl font-extrabold text-indigo-600 text-center">EduOrient</h1></div>
      <p className="text-xs text-slate-500 text-center mb-5">Định hướng học tập &amp; quản lý lớp học</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[['student', 'Học sinh'], ['teacher', 'Giáo viên']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={'py-2 rounded-xl text-sm font-bold ' + (tab === k ? (k === 'teacher' ? 'bg-amber-600' : 'bg-indigo-600') + ' text-white' : 'bg-slate-100 text-slate-600')}>{l}</button>
        ))}
      </div>
      <form id="auth-form" name="auth-form" onSubmit={submit} className="space-y-3">
        {mode === 'register' && <input id="modal-reg-name" name="name" aria-label="Họ và tên" autoComplete="name" className={inp} placeholder="Họ và tên" value={f.name} onChange={set('name')} />}
        {mode === 'register' && tab === 'student' && !isAdminEmail(f.email) && (
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="reg-student-id">Mã học sinh (ID) tự tạo <span className="text-red-500">*</span></label>
            <input name="studentId" id="reg-student-id" className={inp} placeholder="Tự đặt mã của bạn, VD: HS11A801" value={f.studentId} onChange={(e) => setF({ ...f, studentId: upperInput(e.target.value) })} maxLength={20} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
            <p className="text-[11px] text-slate-400 mt-1">Đây là mã do bạn tự đặt (không phải mã nhà trường cấp), không được trùng với người khác. Chỉ gồm chữ cái không dấu và chữ số, từ 3 đến 20 ký tự. Hãy ghi nhớ mã này để phụ huynh dùng xem báo cáo.</p>
          </div>
        )}
        {mode === 'register' && tab === 'teacher' && !isAdminEmail(f.email) && (<>
          <SchoolPicker value={f} onChange={patchF} inp={inp} accent="amber" />
          <SubjectSelect value={f.subject} onChange={(v) => patchF({ subject: v })} inp={inp} />
        </>)}
        <input id="modal-auth-email" name="email" aria-label="Email" autoComplete="email" className={inp} type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input id="modal-auth-password" name="password" aria-label="Mật khẩu" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className={inp} type="password" placeholder="Mật khẩu (từ 6 ký tự)" value={f.password} onChange={set('password')} required />
        {mode === 'login' && <div className="flex justify-between items-center">
          <button type="button" onClick={() => { setParentErr(''); setParentOpen(true); }} className="text-xs font-semibold text-violet-600 hover:underline">Tôi là PHHS?</button>
          <button type="button" onClick={forgot} disabled={busy} className={'text-xs font-semibold hover:underline ' + (tab === 'teacher' ? 'text-amber-600' : 'text-indigo-600')}>Quên mật khẩu?</button>
        </div>}
        <button disabled={busy} className={'w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 ' + (tab === 'teacher' ? 'bg-amber-600' : 'bg-indigo-600')}>
          {busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : (tab === 'teacher' ? 'Đăng ký (chờ duyệt)' : 'Đăng ký')}
        </button>
      </form>
      {tab === 'student' && (<>
        <div className="text-center text-xs text-slate-400 my-3">hoặc</div>
        <button onClick={google} disabled={busy} className="w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50">Đăng nhập bằng Google</button>
        <p className="text-[10px] text-slate-400 mt-2 text-center">Mở link từ Zalo/Messenger? Hãy chọn "Mở bằng Chrome/Safari" để đăng nhập Google.</p>
      </>)}
      <p className="text-xs text-center text-slate-500 mt-4">
        {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
        <button className="text-indigo-600 font-bold" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</button>
      </p>
    </div>
    {parentOpen && (
      <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="parent-title" onClick={() => { if (!parentBusy) setParentOpen(false); }}>
        <form id="parent-verify-form" name="parent-verify-form" onSubmit={verifyParent} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-3">
          <h2 id="parent-title" className="text-lg font-extrabold text-violet-700">Xác thực Phụ huynh</h2>
          <p className="text-xs text-slate-500">Nhập Mã học sinh (ID) mà con đã tự tạo khi đăng ký và mã OTP 6 số của con để xem báo cáo học tập. Con tạo mã OTP trong Tài khoản → Cài đặt → Tạo mã OTP (mã có hiệu lực 5 phút).</p>
          <input id="parent-student-id" name="studentId" aria-label="Mã học sinh" className={inp} placeholder="Mã học sinh (ID), VD: HS11A801" value={pf.sid} onChange={(e) => { setPf({ ...pf, sid: upperInput(e.target.value) }); setParentErr(''); }} maxLength={20} autoCapitalize="characters" autoComplete="off" spellCheck={false} autoFocus required />
          <input id="parent-otp" name="otp" aria-label="Mã OTP 6 số" className={inp} placeholder="Mã OTP (6 chữ số)" value={pf.otp} onChange={(e) => { setPf({ ...pf, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }); setParentErr(''); }} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required />
          {parentErr && <p className="text-xs font-semibold text-red-600">{parentErr}</p>}
          <button disabled={parentBusy} className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-sm disabled:opacity-50">{parentBusy ? 'Đang kiểm tra...' : 'Xem báo cáo'}</button>
          <button type="button" disabled={parentBusy} onClick={() => setParentOpen(false)} className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold">Đóng</button>
        </form>
      </div>
    )}
    </div>
  );
}

// Chỉ chấp nhận avatar là ẢNH Base64 hợp lệ (chặn chuỗi lạ / URL ngoài chèn vào <img>). Phải khớp firestore.rules
// Avatar chữ cái đầu tạo ngay trong trình duyệt (thay ui-avatars.com để không gửi tên học sinh ra bên ngoài)
const initialsAvatar = (name, bg, len, fs) => {
  const words = String(name == null ? '' : name).trim().split(/\s+/).filter(Boolean);
  let t = len > 2 ? words.join('').slice(0, len) : (words.length > 1 ? words[0].charAt(0) + words[words.length - 1].charAt(0) : (words[0] || '?').slice(0, len || 2));
  t = (t || '?').toUpperCase().replace(/[<>&"']/g, '');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#' + (bg || '4361ee') + '"/><text x="32" y="32" dy=".35em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="' + Math.round(64 * (fs || 0.4)) + '" fill="#fff">' + t + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
const safeAvatar = (a) => (typeof a === 'string' && a.length < 60000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(a)) ? a : '';

const GDPT_SUBJECTS = ["Toán", "Ngữ văn", "Tiếng Anh", "Lịch sử", "Địa lí", "Giáo dục kinh tế và pháp luật", "Vật lí", "Hóa học", "Sinh học", "Công nghệ", "Tin học", "Giáo dục thể chất", "Giáo dục quốc phòng và an ninh", "Âm nhạc", "Mỹ thuật", "Hoạt động trải nghiệm, hướng nghiệp", "Giáo dục địa phương"];

// ===================== GIAO DIỆN: thanh chọn 3 chế độ (Mặc định = theo hệ thống / Tối / Sáng) =====================
// Dùng chung khóa localStorage 'eduorient_theme' ('system' | 'dark' | 'light') với trang học sinh.
// index.html đã cài sẵn window.setThemeMode; hàm dưới chỉ dự phòng (vd. trình duyệt còn giữ bản index.html cũ trong cache).
const THEME_KEY = 'eduorient_theme';
const ensureThemeController = () => {
  if (window.setThemeMode) return;
  const root = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const read = () => { try { const s = localStorage.getItem(THEME_KEY); return s === 'dark' || s === 'light' ? s : 'system'; } catch (e) { return 'system'; } };
  const apply = () => {
    const m = read();
    root.classList.toggle('dark', m === 'dark' || (m === 'system' && !!(mq && mq.matches))); // 'system' đọc prefers-color-scheme
    try { window.dispatchEvent(new Event('eduorient-theme')); } catch (e) {}
  };
  window.getThemeMode = read;
  window.isDarkMode = () => root.classList.contains('dark');
  window.setThemeMode = (m) => { m = m === 'dark' || m === 'light' ? m : 'system'; try { localStorage.setItem(THEME_KEY, m); } catch (e) {} apply(); };
  window.setDark = (d) => window.setThemeMode(d ? 'dark' : 'light');
  window.toggleDark = () => window.setDark(!root.classList.contains('dark'));
  if (mq) { const on = () => { if (read() === 'system') apply(); }; if (mq.addEventListener) mq.addEventListener('change', on); else if (mq.addListener) mq.addListener(on); }
  apply();
};
ensureThemeController();

// ===================== CỠ GIAO DIỆN: 3 nút nhanh (80% / 90% / 100%) =====================
// Bộ điều khiển (window.getUiZoom / setUiZoom, khóa 'eduorient_ui_zoom', sự kiện 'eduorient-uizoom') được cài sẵn trong <head> của index.html để áp dụng TRƯỚC khi vẽ trang.
// Dùng ở: màn hình đăng nhập (nút nổi), Giáo viên (Tab Tài khoản), Quản trị (header + menu), Phụ huynh (trên ảnh bìa).
const UI_ZOOM_MIN = 70, UI_ZOOM_MAX = 120;
const UI_ZOOM_PRESETS = [[80, 'Rất nhỏ', 11], [90, 'Nhỏ', 13], [100, 'Chuẩn', 16]];
function useUiZoom() {
  const read = () => (window.getUiZoom ? window.getUiZoom() : 100);
  const [z, setZ] = useState(read);
  useEffect(() => {
    const on = () => setZ(read());
    window.addEventListener('eduorient-uizoom', on); on();
    return () => window.removeEventListener('eduorient-uizoom', on);
  }, []);
  return [z, (v) => { if (window.setUiZoom) window.setUiZoom(v); }];
}
function UiZoomPanel({ label = true }) {
  const [z, set] = useUiZoom();
  if (!window.setUiZoom) return null;
  return (
    <div className="uz-panel">
      {label && <div className="tm-label">Cỡ chữ &amp; giao diện</div>}
      <div className="uz-bar" role="radiogroup" aria-label="Cỡ giao diện">
        {UI_ZOOM_PRESETS.map(([v, lb, fs]) => (
          <button key={v} type="button" role="radio" aria-checked={z === v} onClick={() => set(v)} className={'uz-opt' + (z === v ? ' on' : '')}>
            <span className="uz-aa" style={{ fontSize: fs }}>Aa</span><span>{lb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
// Nút "Aa" mở khung chỉnh cỡ. up=true: khung mở lên trên (dùng cho nút nổi ở đáy màn hình). sm: nút vuông nhỏ cho header.
function UiZoomPopover({ up = false, sm = false, className = '', style }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  if (!window.setUiZoom) return null;
  return (
    <div ref={ref} className={'uz-pop-wrap ' + className} style={style}>
      <button type="button" className={'uz-fab' + (sm ? ' sm' : '')} aria-label="Cỡ chữ và giao diện" title="Cỡ chữ & giao diện" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>Aa</button>
      {open && <div className={'uz-pop ' + (up ? 'up' : 'down')} role="dialog" aria-label="Cỡ chữ và giao diện"><UiZoomPanel /></div>}
    </div>
  );
}

// ===== Chống trang trắng: mọi lỗi lúc render sẽ hiện thông báo + nút tải lại thay vì làm sập cả ứng dụng =====
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error('EduOrient render error:', err, info && info.componentStack); } catch (e) {} }
  render() {
    if (!this.state.err) return this.props.children;
    const msg = String((this.state.err && this.state.err.message) || this.state.err);
    if (this.props.inline) return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 my-3 text-sm text-red-700">
        <p className="font-bold"><CoreIcon name="alert" className="ic-inline" /> Phần này gặp lỗi khi hiển thị.</p>
        <p className="text-xs mt-1 break-words">{msg}</p>
        <button onClick={() => this.setState({ err: null })} className="mt-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold">Thử lại</button>
      </div>);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-2"><CoreIcon name="alert" className="ic-inline" /></div>
          <h1 className="font-extrabold text-lg text-slate-800">Ứng dụng gặp sự cố</h1>
          <p className="text-sm text-slate-500 mt-1">Đã có lỗi khi hiển thị trang. Bạn hãy thử tải lại; nếu vẫn lỗi hãy báo cho quản trị viên.</p>
          <p className="text-[11px] text-red-500 mt-3 break-words">{msg}</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => this.setState({ err: null })} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">Thử lại</button>
            <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">Tải lại trang</button>
          </div>
        </div>
      </div>);
  }
}

export { UiZoomPanel, UiZoomPopover, initialsAvatar, AuthGate, ErrorBoundary, GDPT_SUBJECTS, LazyAdminPanel, LazyTeacherApp, PAGE_LOGIN, PAGE_STUDENT, SCHOOL_DB, SchoolPicker, ScreenLoading, SubjectSelect, Suspense, fbAuth, fbDb, fbErr, fbNow, fbSignOut, foldVN, goTo, isAdminEmail, readSchoolPick, safeAvatar };
