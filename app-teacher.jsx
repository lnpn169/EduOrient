// EduOrient — màn hình GIÁO VIÊN (TeacherApp). Chỉ tải khi đăng nhập bằng tài khoản giáo viên.
import { ErrorBoundary, GDPT_SUBJECTS, PAGE_LOGIN, SCHOOL_DB, SchoolPicker, SubjectSelect, fbAuth, fbDb, fbErr, fbNow, fbSignOut, foldVN, goTo, readSchoolPick, safeAvatar } from './app-core.jsx';
import { ATT_STATUS, BxhScoreEditor, EMPTY_LIST, GroupSettingsModal, Icon, THEME_OPTS, avatarUrl, bxhBumpXp, clampScore, essayXpOf, keepList, keepMap, quizXpOf, subXp, wipeMsgs } from './app-shared.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;


        // Pre-loaded subjects
        const SUBJECTS = [
            "Toán Học", "Vật Lý", "Hóa Học", "Ngữ Văn", 
            "Tiếng Anh", "Lịch Sử", "Địa Lý", "Sinh Học", "GDCD / Tin Học"
        ];


        // Demo Database for Teachers
        const INITIAL_TEACHERS = [
            {
                id: "gv-001",
                email: "gv_toan@edu.vn",
                password: "123",
                name: "Thầy Nguyễn Văn Minh",
                subject: "Toán Học",
                school: "THPT Chuyên Hà Nội - Amsterdam",
                teacherCardUrl: "https://placehold.co/400x250/4361ee/ffffff?text=THE+GIAO+VIEN+MINH",
                status: "approved", // approved | pending
                registeredAt: "10/05/2026",
                bio: "10 năm kinh nghiệm luyện thi ĐH khối A, A01. Thủ khoa Sư phạm Toán."
            },
            {
                id: "gv-002",
                email: "gv_ly@edu.vn",
                password: "123",
                name: "Cô Trần Thị Thu",
                subject: "Vật Lý",
                school: "THPT Chuyên Chu Văn An",
                teacherCardUrl: "https://placehold.co/400x250/10b981/ffffff?text=THE+GIAO+VIEN+THU",
                status: "pending",
                registeredAt: "28/09/2026",
                bio: "Giáo viên giỏi cấp Thành phố, chuyên đề Lý 12."
            }
        ];


        // Demo Database for Students
        const INITIAL_STUDENTS = [
            { id: "st-101", name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", class: "12A1", targetSchool: "ĐH Bách Khoa Hà Nội (HUST)", xp: 480, rank: 1, gpa: 9.2, evaluation: "Học giỏi Tư duy Toán & Lý, cần duy trì phong độ." },
            { id: "st-102", name: "Trần Thị Bảo", email: "bao.tran@gmail.com", class: "12A2", targetSchool: "ĐH Kinh Tế Quốc Dân (NEU)", xp: 410, rank: 2, gpa: 8.8, evaluation: "Năng lực Toán đại số tốt, cần rèn luyện thêm bài tập tổng hợp." },
            { id: "st-103", name: "Lê Hoàng Cường", email: "cuong.le@gmail.com", class: "12A1", targetSchool: "ĐH Quốc Gia Hà Nội (VNU)", xp: 350, rank: 3, gpa: 8.1, evaluation: "Chăm chỉ, hoàn thành bài tập đầy đủ." }
        ];


        // Demo Database for Homework Assignments posted by Teachers
        const INITIAL_ASSIGNMENTS = [
            {
                id: "hw-1",
                title: "Bộ đề ôn thi Đại Học 2026 - Chuyên đề Hàm Số & Cực Trị",
                subject: "Toán Học",
                teacherName: "Thầy Nguyễn Văn Minh",
                teacherId: "gv-001",
                duration: "90 phút",
                totalQuestions: 50,
                status: "approved", // pending | approved
                createdAt: "25/09/2026",
                description: "Bài tập rèn luyện kỹ năng giải nhanh câu hỏi phân hóa từ 8+ đến 10 điểm.",
                submissionsCount: 24,
                questions: [
                    { q: "Đạo hàm của hàm số y = x^2 là?", a: ["2x", "x", "2", "x^2"], c: 0 },
                    { q: "Hàm số y = -x^3 + 3x có cực đại tại x bằng?", a: ["-1", "0", "1", "3"], c: 2 }
                ]
            },
            {
                id: "hw-2",
                title: "Kiểm tra Định kỳ 45p - Dòng điện xoay chiều & Dao động",
                subject: "Vật Lý",
                teacherName: "Thầy Nguyễn Văn Minh",
                teacherId: "gv-001",
                duration: "45 phút",
                totalQuestions: 40,
                status: "approved",
                createdAt: "27/09/2026",
                description: "Đề thi thử gồm các dạng bài tập thực tế và lý thuyết trọng tâm.",
                submissionsCount: 18
            }
        ];


        // Mỗi dòng: Câu hỏi | A | B | C | D | Đáp án đúng (A/B/C/D)
        function parseQuestions(txt) {
            return (txt || '').split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p.length >= 4)
                .map(p => ({ q: p[0], a: p.slice(1, -1), c: 'ABCDEF'.indexOf((p[p.length-1] || 'A').toUpperCase()) }))
                .filter(x => x.c >= 0 && x.c < x.a.length);
        }
   // bỏ dấu để tìm "ly thuong kiet"
        const slugVN = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // id trường của giáo viên, cùng quy ước với targetSchoolId của học sinh: "<id tỉnh>-<slug tên trường>"
        const schoolIdOfTeacher = (u) => (u && u.province && u.school) ? u.province + '-' + slugVN(u.school) : '';


        const photoCountOf = (r) => typeof r.photoCount === 'number' ? r.photoCount : (r.photos || []).length;

        const SUBPH_CACHE = {};

        async function loadSubPhotos(sub) {
            if (Array.isArray(sub.photos) && sub.photos.length) return sub.photos;
            if (!photoCountOf(sub)) return [];
            const id = sub.hwId + '_' + sub.uid;
            if (SUBPH_CACHE[id]) return SUBPH_CACHE[id];
            const d = await fbDb.collection('subPhotos').doc(id).get();
            return (SUBPH_CACHE[id] = d.exists ? (d.data().photos || []) : []);
        }

        const cleanSchoolName = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 80);

        // Tìm tỉnh theo tên trường đã lưu (trường tự nhập => không có trong danh sách)
        const provinceOfSchool = (name) => { const p = SCHOOL_DB.find((x) => x.schools.some((t) => t.name === name)); return p ? p.id : ''; };

        // ===== PHẦN 2: CÁCH LY DỮ LIỆU THEO TRƯỜNG =====
        // Hai người "cùng trường" khi tên trường (bỏ dấu, không phân biệt hoa/thường) trùng nhau
        // VÀ (nếu cả hai đều biết tỉnh) cùng tỉnh - tránh nhầm các trường trùng tên ở tỉnh khác.
        const normSchool = (s) => foldVN(s).replace(/[^a-z0-9]+/g, ' ').trim();

        const provinceOfSchoolId = (id) => {   // targetSchoolId dạng "<id tỉnh>-<slug trường>"; mã đại học cũ (BKA, NEU...) => ''
            if (!id || typeof id !== 'string') return '';
            const p = SCHOOL_DB.filter((x) => id.indexOf(x.id + '-') === 0).sort((a, b) => b.id.length - a.id.length)[0];
            return p ? p.id : '';
        };

        // Trường của 1 hồ sơ: giáo viên => school/province; học sinh => targetSchoolName/targetSchoolId
        const schoolOfProfile = (p) => {
            if (!p) return { name: '', prov: '' };
            if (p.role === 'teacher') { const n = cleanSchoolName(p.school); return { name: n, prov: p.province || provinceOfSchool(n) }; }
            const prov = provinceOfSchoolId(p.targetSchoolId);
            return { name: prov ? cleanSchoolName(p.targetSchoolName) : '', prov };   // chưa chọn trường / mã cũ => không thuộc trường nào
        };

        const sameSchool = (a, b) => !!a.name && !!b.name && normSchool(a.name) === normSchool(b.name) && (!a.prov || !b.prov || a.prov === b.prov);

        const sameSchoolProfile = (p, q) => sameSchool(schoolOfProfile(p), schoolOfProfile(q));

        // Từ dữ liệu đã lưu của giáo viên => giá trị ban đầu cho SchoolPicker
        const pickerFromUser = (u) => {
            const name = cleanSchoolName(u && u.school), prov = (u && u.province) || provinceOfSchool(name);
            const inList = !!name && !!(SCHOOL_DB.find((p) => p.id === prov) || { schools: [] }).schools.some((t) => t.name === name);
            return { province: inList ? prov : '', school: inList ? name : '', schoolOther: '' };   // trường tự nhập cũ (không có trong danh sách) => phải chọn lại
        };


        // ===== Nhập đề trắc nghiệm từ file Word (.docx): tự tách câu hỏi, 4 đáp án A-D, đáp án đúng, giải thích =====
        // Nhận diện đáp án đúng theo thứ tự ưu tiên: (1) Bảng/dòng "ĐÁP ÁN" ở cuối đề, (2) dòng "Đáp án: C" ngay dưới câu,
        // (3) định dạng trong đề: dấu * trước đáp án, gạch chân, chữ đỏ / tô màu, hoặc in đậm đúng 1 phương án.
        const DOCX_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

        // JSZip chỉ được tải khi giáo viên bấm "Nhập đề từ file Word (.docx)" (trước đây nạp sẵn trong index.html cho mọi người dùng).
        // Gọi nhiều lần vẫn chỉ tải 1 lần; nếu tải lỗi thì lần sau tự thử lại.
        const loadJSZip = (() => {
            const URL_JSZIP = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            let pending = null;
            return () => {
                if (window.JSZip) return Promise.resolve(window.JSZip);
                if (pending) return pending;
                pending = new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = URL_JSZIP; s.async = true;
                    s.onload = () => (window.JSZip ? resolve(window.JSZip) : (pending = null, reject(new Error('Không tải được thư viện đọc file Word. Hãy thử lại.'))));
                    s.onerror = () => { pending = null; s.remove(); reject(new Error('Không tải được thư viện đọc file Word. Hãy kiểm tra kết nối mạng rồi thử lại.')); };
                    document.head.appendChild(s);
                });
                return pending;
            };
        })();

        async function readDocxLines(buf) {
            const JSZip = await loadJSZip();
            let zip; try { zip = await JSZip.loadAsync(buf); } catch (e) { throw new Error('Không mở được file. Hãy chọn file Word đuôi .docx (file .doc cũ: mở bằng Word rồi Lưu thành .docx).'); }
            const entry = zip.file('word/document.xml');
            if (!entry) throw new Error('File này không phải file Word .docx hợp lệ.');
            const xml = new DOMParser().parseFromString(await entry.async('string'), 'application/xml');
            const kid = (el, n) => { for (const c of el.children) if (c.localName === n) return c; return null; };
            const attr = (el, n) => el.getAttributeNS(DOCX_W, n) || el.getAttribute('w:' + n);
            const flagsOf = (r) => {
                let pr = kid(r, 'rPr'); if (pr && kid(pr, 'rPr')) pr = kid(pr, 'rPr');
                const fl = { b: false, u: false, red: false };
                if (!pr) return fl;
                const on = (n) => { const e = kid(pr, n); if (!e) return false; const v = attr(e, 'val'); return v !== '0' && v !== 'false' && v !== 'none'; };
                fl.b = on('b'); fl.u = on('u'); fl.red = on('highlight');
                const ce = kid(pr, 'color'), cv = ce && attr(ce, 'val');
                if (cv && /^[0-9a-f]{6}$/i.test(cv)) { const R = parseInt(cv.slice(0, 2), 16), G = parseInt(cv.slice(2, 4), 16), B = parseInt(cv.slice(4, 6), 16); if (R > 170 && G < 110 && B < 110) fl.red = true; }
                return fl;
            };
            const lines = [];
            for (const p of xml.getElementsByTagNameNS(DOCX_W, 'p')) {
                let cur = [];
                const flush = () => { if (cur.some((x) => x.c.trim())) lines.push(cur); cur = []; };
                const walk = (n) => {
                    for (const c of n.children) {
                        const ln = c.localName;
                        if (ln === 'pPr' || ln === 'rPr') continue;
                        if (ln === 'r') {
                            const fl = flagsOf(c);
                            for (const t of c.children) {
                                if (t.localName === 't') for (const ch of t.textContent) cur.push({ c: ch, b: fl.b, u: fl.u, red: fl.red });
                                else if (t.localName === 'tab') cur.push({ c: ' ', b: false, u: false, red: false });
                                else if (t.localName === 'br' && attr(t, 'type') !== 'page') flush();
                            }
                        } else walk(c);
                    }
                };
                walk(p); flush();
            }
            return lines.map((arr) => ({ text: arr.map((x) => x.c).join('').replace(/\u00a0/g, ' '), fl: arr }));
        }


        function parseQuizLines(lines) {
            // "Question 13:" / "Câu 13." được nhận là câu mới KỂ CẢ khi sau dấu : chưa có chữ (đề nằm ở các dòng dưới, hoặc là chỗ trống trong đoạn văn)
            const Q_RE = /^\s*(?:(?:câu|bài|question)\s*)?(\d{1,3})\s*[.:)]\s*(?=\S|$)/i;
            const ANS_RE = /^\s*(?:đáp\s*án(?:\s*đúng)?|answer|key)\s*[:：.\-]?\s*(?:là\s*)?\(?([A-Da-d])\)?(?![A-Za-zÀ-ỹ0-9])/i;
            const KEY_HEAD_RE = /^\s*(?:bảng\s*)?đáp\s*án\b/i;
            const EXP_RE = /^\s*(?:giải\s*thích|hướng\s*dẫn(?:\s*giải)?|lời\s*giải|explanation)\s*(?:chi\s*tiết)?\s*[:：.]?\s*/i;
            const SKIP_RE = /^\s*(?:phần|part|đề|môn|họ\s*(?:và\s*)?tên|thời\s*gian|trường|sở\s*gd|kiểm\s*tra)\b/i;
            const STRAY_RE = /^\s*(?:\d{1,3}|[A-Da-d])\s*$/;
            // Dòng hướng dẫn mở đầu một nhóm câu / một đoạn văn: "Read the following passage...", "Mark the letter...", "Đọc đoạn văn sau..."
            const INSTR_RE = /^\s*(?:read\s+(?:the|this|these)\b|mark\s+the\s+letter|choose\s+(?:the|one)\b|circle\s+the|(?:fill\s+in|complete)\s+the|(?:listen|look)\s+(?:to|at)\b|rearrange|đọc\s+(?:đoạn|bài|văn\s*bản|các|kỹ|hiểu)|dựa\s+(?:vào|theo)\s+(?:đoạn|bài|văn\s*bản|thông\s*tin)|căn\s*cứ\s+(?:vào|theo)\s+(?:đoạn|bài|văn\s*bản)|chọn\s+(?:đáp\s*án|phương\s*án)\s+(?:đúng|phù\s*hợp)|điền\s+(?:vào|từ))/i;
            const END_RE = /^\s*(?:[-–—_=*~.\s]{3,}|[-–—_=*~.\s]*(?:the\s*end|hết|end)[-–—_=*~.\s]*)$/i;   // "----- The end -----"
            const NEWQ_RE = /^\s*(?:câu|bài|question)\s*\d/i, LONG_LINE = 100;
            const ratio = (fl, a, b, k) => { let t = 0, m = 0; for (let i = a; i < b; i++) { if (!fl[i].c.trim()) continue; t++; if (fl[i][k]) m++; } return t ? m / t : 0; };

            // Tìm chuỗi nhãn A, B, C, D nối tiếp nhau trong 1 dòng
            const findOpts = (text, expect, atStartOnly) => {
                const re = /(^|\s)(\*?)([A-Da-d])\s*[.)]\s*/g, found = []; let m, want = expect;
                while ((m = re.exec(text))) {
                    const letter = m[3], atStart = m.index === 0 || !text.slice(0, m.index).trim();
                    if (letter.toUpperCase() !== want) continue;
                    if (letter !== letter.toUpperCase() && !atStart) continue;
                    const labelIdx = m.index + m[1].length + m[2].length;
                    found.push({ L: want, star: !!m[2], labelIdx, from: m.index + m[1].length, textStart: m.index + m[0].length });
                    want = String.fromCharCode(want.charCodeAt(0) + 1); if (want > 'D') break;
                }
                if (!found.length) return found;
                if (expect === 'A' && !(found[0].from === 0 || !text.slice(0, found[0].from).trim()) && found.length < 2) return [];
                if (atStartOnly && found[0].from !== 0 && text.slice(0, found[0].from).trim()) return [];
                return found;
            };
            // Phía sau (trong cùng câu) có dòng đáp án "A." VIẾT HOA không? Dùng để phân biệt dòng "a. ... b. ..." (các câu cần sắp xếp, thuộc phần đề) với đáp án viết thường.
            const upperAAhead = (from) => {
                for (let j = from + 1; j < lines.length; j++) {
                    const t = lines[j].text;
                    if (NEWQ_RE.test(t) || INSTR_RE.test(t)) return false;
                    if (/(^|\s)\*?A\s*[.)]\s*\S/.test(t)) return true;
                }
                return false;
            };

            const qs = []; let cur = null, mode = 'stem', keyMode = false, lastNum = 0; const keyLines = [];
            const passages = []; let curP = -1, block = null;   // block: các dòng của đoạn văn / hướng dẫn đang gom, chưa gặp câu hỏi đầu tiên của nhóm
            const closeBlock = () => { if (block) { const t = block.join('\n').trim(); if (t) { passages.push(t); curP = passages.length - 1; } block = null; } };
            const fin = () => { if (cur) { qs.push(cur); cur = null; } };
            const addOpts = (line, found) => {
                found.forEach((o, i) => {
                    const end = i + 1 < found.length ? found[i + 1].from : line.text.length;
                    cur.opts.push({ L: o.L, star: o.star, text: line.text.slice(o.textStart, end).replace(/\s+/g, ' ').trim(), line, labelIdx: o.labelIdx, s: o.from, e: end });
                });
                cur.nextL = String.fromCharCode(cur.opts[cur.opts.length - 1].L.charCodeAt(0) + 1);
                mode = 'opts';
            };

            for (let li = 0; li < lines.length; li++) {
                const line = lines[li], text = line.text;
                if (keyMode) { keyLines.push(text.trim()); continue; }
                let qm = Q_RE.exec(text);
                // "1." / "2." không có chữ "Câu" chỉ tính là câu mới khi đúng số thứ tự kế tiếp (tránh nhầm với danh sách ý trong đề)
                if (qm && !/^\s*(?:câu|bài|question)/i.test(text) && !(lastNum === 0 ? parseInt(qm[1], 10) === 1 : parseInt(qm[1], 10) === lastNum + 1)) qm = null;
                const am = cur && !block && ANS_RE.exec(text);
                // Tiêu đề "ĐÁP ÁN" độc lập (không phải "Đáp án: C" của 1 câu) => các dòng sau là bảng đáp án
                if (KEY_HEAD_RE.test(text) && !am) { closeBlock(); fin(); keyMode = true; keyLines.push(text.replace(KEY_HEAD_RE, '').trim()); continue; }
                if (qm) {
                    closeBlock(); fin(); lastNum = parseInt(qm[1], 10);
                    const rest = text.slice(qm[0].length);
                    cur = { num: parseInt(qm[1], 10), stem: '', opts: [], ans: -1, exp: '', nextL: 'A', p: curP };
                    const found = findOpts(rest, 'A', false);
                    if (found.length) {
                        cur.stem = rest.slice(0, found[0].from).trim();
                        const shifted = { text: text, fl: line.fl }, off = qm[0].length;
                        addOpts(shifted, found.map((o) => ({ ...o, labelIdx: o.labelIdx + off, from: o.from + off, textStart: o.textStart + off })));
                    } else { cur.stem = rest.trim(); mode = 'stem'; }
                    continue;
                }
                // Đang gom đoạn văn của nhóm mới: mọi dòng cho tới câu hỏi đầu tiên đều là đoạn văn
                if (block) {
                    if (END_RE.test(text) || STRAY_RE.test(text) || (SKIP_RE.test(text) && text.trim().length < 60)) continue;
                    block.push(text.trim()); continue;
                }
                if (END_RE.test(text)) continue;
                if (!cur) { if (INSTR_RE.test(text) || text.trim().length >= LONG_LINE) block = [text.trim()]; continue; }
                if (am) { cur.ans = 'ABCD'.indexOf(am[1].toUpperCase()); continue; }
                if (EXP_RE.test(text)) { mode = 'exp'; const t = text.replace(EXP_RE, '').trim(); if (t) cur.exp += (cur.exp ? ' ' : '') + t; continue; }
                // Sau phần đáp án: dòng hướng dẫn ("Read the following...") hoặc một đoạn dài => mở nhóm / đoạn văn mới, KHÔNG nối vào đáp án D
                if (mode === 'opts' || mode === 'exp') {
                    if (INSTR_RE.test(text) || (mode === 'opts' && cur.nextL === 'E' && text.trim().length >= LONG_LINE)) { fin(); block = [text.trim()]; continue; }
                }
                if (mode !== 'exp') {
                    const found = findOpts(text, cur.nextL, false);
                    if (found.length && (cur.opts.length || found[0].L === 'A')) {
                        const ch = text.charAt(found[0].labelIdx);
                        // "a. ... b. ..." viết thường nằm trong phần đề (câu sắp xếp) khi phía sau còn dòng đáp án "A." viết hoa
                        if (!cur.opts.length && ch && ch === ch.toLowerCase() && upperAAhead(li)) { cur.stem += (cur.stem ? '\n' : '') + text.trim(); continue; }
                        addOpts(line, found); continue;
                    }
                }
                if (SKIP_RE.test(text) || STRAY_RE.test(text)) continue;
                if (mode === 'exp') cur.exp += (cur.exp ? ' ' : '') + text.trim();
                else if (mode === 'opts') { const last = cur.opts[cur.opts.length - 1]; last.text = (last.text + ' ' + text.trim()).trim(); }
                else cur.stem += (cur.stem ? '\n' : '') + text.trim();
            }
            fin();

            // Bảng đáp án cuối đề
            const key = {};
            if (keyLines.length) {
                const kt = keyLines.join(' '), toks = kt.split(/\s+/).filter(Boolean);
                const nums = toks.filter((t) => /^\d{1,3}$/.test(t)), lets = toks.filter((t) => /^[A-Da-d]$/.test(t));
                if (nums.length >= 2 && nums.length === lets.length && !/\d\s*[-.:)=]+\s*[A-Da-d](?![A-Za-zÀ-ỹ])/.test(kt)) nums.forEach((n, i) => { key[parseInt(n, 10)] = 'ABCD'.indexOf(lets[i].toUpperCase()); });
                else for (const m of kt.matchAll(/(\d{1,3})\s*[-.:)=]*\s*([A-Da-d])(?![A-Za-zÀ-ỹ0-9])/g)) key[parseInt(m[1], 10)] = 'ABCD'.indexOf(m[2].toUpperCase());
            }
            const nums = qs.map((q) => q.num), uniqueNums = new Set(nums).size === nums.length;

            const out = [], noAnswer = [], incomplete = []; let essays = 0, fromKey = 0;
            qs.forEach((q, idx) => {
                const label = idx + 1;
                if (!q.stem && !q.opts.length) return;
                if (!q.opts.length) { out.push({ kind: 'essay', q: q.stem, images: [], pi: q.p }); essays++; return; }
                let c = -1;
                const k = uniqueNums ? key[q.num] : key[label];
                if (k !== undefined && k >= 0) { c = k; fromKey++; }
                else if (q.ans >= 0) c = q.ans;
                else {
                    // Định dạng trong đề: dấu *, gạch chân, chữ đỏ/tô màu, in đậm (đúng 1 phương án)
                    const pick = (test) => { const hit = q.opts.filter(test); return hit.length === 1 ? 'ABCD'.indexOf(hit[0].L) : -1; };
                    const mark = (k2) => (o) => o.line.fl[o.labelIdx] && o.line.fl[o.labelIdx][k2] || ratio(o.line.fl, o.s, o.e, k2) >= 0.5;
                    c = pick((o) => o.star);
                    if (c < 0) c = pick(mark('u'));
                    if (c < 0) c = pick(mark('red'));
                    if (c < 0) c = pick(mark('b'));
                }
                const a = ['', '', '', '']; q.opts.forEach((o) => { a['ABCD'.indexOf(o.L)] = o.text; });
                const bad = c < 0, missing = a.some((x) => !x);
                if (bad) noAnswer.push(label); if (missing) incomplete.push(label);
                // Câu điền chỗ trống: đề trống vì chỗ trống nằm trong đoạn văn => tự ghi "chỗ trống (N)" nếu đoạn văn có (N)
                let stem = q.stem;
                if (!stem && q.p >= 0) stem = new RegExp('\\(\\s*' + q.num + '\\s*\\)').test(passages[q.p] || '') ? 'Chọn đáp án đúng cho chỗ trống (' + q.num + ').' : 'Chọn đáp án đúng nhất dựa vào đoạn văn.';
                out.push({ kind: 'mcq', q: stem || '(Chưa có nội dung câu hỏi)', a, c: bad ? 0 : c, e: q.exp.trim(), needCheck: bad || missing, pi: q.p });
            });
            // Chỉ giữ các đoạn văn có câu dùng tới, đánh số lại 0..n-1 (pi = -1: câu không thuộc đoạn văn nào)
            const used = [], map = {};
            out.forEach((x) => { if (x.pi >= 0) { if (map[x.pi] === undefined) { map[x.pi] = used.length; used.push(passages[x.pi]); } x.pi = map[x.pi]; } else x.pi = -1; });
            return { qs: out, noAnswer, incomplete, essays, fromKey, passages: used };
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
                                const b = fbDb.batch(); ['users', 'profiles', 'privates', 'teacherCards'].forEach((c) => b.delete(fbDb.collection(c).doc(u.uid)));
                await b.commit();
                try { await u.delete(); } catch (e) {}
            } catch (e) {
                return eduAlert(e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'Mật khẩu không đúng.' : 'Không xóa được tài khoản: ' + (e.message || e), 'error');
            }
            try { await fbAuth.signOut(); } catch (e) {}
            goTo(PAGE_LOGIN);
        }
 // Các môn học Chương trình GDPT 2018 (THPT)
        function resizeFit(file, maxW, cb) {
            const r = new FileReader(); r.onload = (e) => { const img = new Image(); img.onload = () => {
                const k = Math.min(1, maxW / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.7)); }; img.src = e.target.result; }; r.readAsDataURL(file);
        }

        function resizeImg(file, size, cb) {
            const r = new FileReader(); r.onload = (e) => { const img = new Image(); img.onload = () => {
                const c = document.createElement('canvas'), m = Math.min(img.width, img.height); c.width = c.height = size;
                c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size); cb(c.toDataURL('image/jpeg', 0.8)); }; img.src = e.target.result; }; r.readAsDataURL(file);
        }


        // (Đã bỏ 2 nút nổi góc phải dưới; Sửa hồ sơ / Đổi mật khẩu mở từ tab "Tài khoản" qua setToolModal)

        function HwEditImpl({ hw, classList, onClose }) {
            const toLocal = (ms) => { if (!ms) return ''; const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
            const [v, setV] = useState({ title: hw.title, description: hw.description || '', durMin: hw.durationMin || 45, deadline: toLocal(hw.deadlineMs), classes: hw.classes || [] });
            const inp = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500';
            const [saving, setSaving] = useState(false);
            const save = async () => {
                if (saving) return;
                if (!v.title.trim()) return eduAlert('Tiêu đề không được để trống.', 'warning');
                const durMin = Math.min(180, Math.max(5, parseInt(v.durMin, 10) || 45)), deadlineMs = v.deadline ? new Date(v.deadline).getTime() : 0;
                if (v.deadline && !Number.isFinite(deadlineMs)) return eduAlert('Hạn nộp không hợp lệ.', 'warning');
                if (deadlineMs && deadlineMs < Date.now() && !(await eduConfirm('Học sinh chưa làm sẽ không làm được nữa.', { title: 'Hạn nộp này đã qua', confirmText: 'Vẫn lưu', cancelText: 'Chỉnh lại', icon: 'warning' }))) return;
                const classes = [...new Set(v.classes.map((c) => String(c).trim().toUpperCase()).filter(Boolean))];
                setSaving(true);
                fbDb.collection('assignments').doc(hw.id).update({ title: v.title.trim(), description: v.description.trim(), duration: durMin + ' phút', durationMin: durMin, durationMinutes: durMin, deadlineMs, classes })
                    .then(() => { onClose(); eduToast('Đã lưu thay đổi bài tập', 'success'); }).catch((e) => { setSaving(false); eduAlert(fbErr(e), 'error'); });
            };
            const toggle = (c) => setV({ ...v, classes: v.classes.includes(c) ? v.classes.filter((x) => x !== c) : [...v.classes, c] });
            return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-3 shadow-2xl">
                        <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">Sửa bài tập</h3><button onClick={onClose} className="text-slate-400 text-lg">✕</button></div>
                        <input id="edit-hw-title" name="title" aria-label="Tiêu đề" className={inp} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Tiêu đề" />
                        <textarea id="edit-hw-description" name="description" aria-label="Mô tả / hướng dẫn" rows="2" className={inp} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Mô tả / hướng dẫn" />
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Thời gian làm bài (phút, 5–180)</label>
                            <input id="edit-hw-duration" name="durMin" aria-label="Thời gian làm bài (phút)" type="number" min="5" max="180" className={inp} value={v.durMin} onChange={(e) => setV({ ...v, durMin: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Hạn nộp bài (để trống = không có hạn)</label>
                            <input id="edit-hw-deadline" name="deadline" aria-label="Hạn nộp bài" type="datetime-local" className={inp} value={v.deadline} onChange={(e) => setV({ ...v, deadline: e.target.value })} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Giao cho lớp</label>
                            <div className="flex flex-wrap gap-2">
                                <label className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 cursor-pointer"><input id="edit-hw-all-classes" name="allClasses" type="checkbox" className="accent-amber-600" checked={v.classes.length === 0} onChange={() => setV({ ...v, classes: [] })} /> Tất cả các lớp</label>
                                {[...new Set([...classList, ...v.classes])].sort().map((c) => (<label key={c} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-200 cursor-pointer"><input id={`edit-hw-class-${c}`} name="classes" type="checkbox" className="accent-amber-600" checked={v.classes.includes(c)} onChange={() => toggle(c)} /> {c}</label>))}
                            </div></div>
                        <p className="text-[10px] text-slate-400">Chỉ sửa được cài đặt, không sửa câu hỏi khi đã có học sinh làm. Đổi giờ làm bài sẽ áp dụng cho cả những bạn đang làm dở.</p>
                        <button onClick={save} disabled={saving} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                    </div>
                </div>
            );
        }

        // ===================== PHẦN 2: CHẤM BÀI TỰ LUẬN (GIÁO VIÊN) =====================
        const isEssayHw = (hw) => !!hw && (hw.type === 'essay' || hw.type === 'mixed');

        const ESSAY_TIMEOUT_NOTE = 'Tự động chấm 0đ do quá hạn 3 phút nộp ảnh';

        // Quy đổi điểm 1 bài nộp về thang 10 (null = chưa có điểm). Quá hạn luôn = 0 (trừ khi Admin đã sửa); đã chấm: score/100*10.
        const subScore10 = (r) => (r.adminEdited && r.graded) ? clampScore(r.score) / 10 : r.status === 'timeout' ? 0 : r.graded ? clampScore(r.score) / 10 : (r.total ? (Number(r.score) || 0) / r.total * 10 : null);
                                                                              // chưa chấm: trắc nghiệm đúng x 5 (tự luận chờ chấm = 0)
        // Kiểm tra điểm nhập vào: chỉ nhận số từ 0 đến 100 (tối đa 2 chữ số thập phân)
        const validateEssayScore = (s) => {
            const t = String(s).trim().replace(',', '.');
            if (t === '') return 'Vui lòng nhập điểm từ 0 đến 100.';
            if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'Điểm phải là số không âm (tối đa 2 chữ số thập phân).';
            const n = Number(t);
            if (n < 0 || n > 100) return 'Điểm phải nằm trong khoảng từ 0 đến 100.';
            return '';
        };


        // Modal xem ảnh bài làm + chấm điểm: xoay 90°, phóng to/thu nhỏ/reset, kéo để di chuyển, chuyển ảnh
        function EssayPhotoViewerImpl({ hw, row, canGrade, user, onClose, onSaved }) {
            const [photos, setPhotos] = useState(Array.isArray(row.photos) ? row.photos : []);
            const [phLoading, setPhLoading] = useState(!(Array.isArray(row.photos) && row.photos.length) && photoCountOf(row) > 0);
            useEffect(() => {
                let dead = false;
                if (phLoading) loadSubPhotos(row).then((l) => { if (!dead) { setPhotos(l); setPhLoading(false); } }).catch(() => { if (!dead) setPhLoading(false); });
                return () => { dead = true; };
            }, []);
            const V0 = { rot: 0, z: 1, x: 0, y: 0 };
            const [idx, setIdx] = useState(0);
            const [views, setViews] = useState({});          // trạng thái xoay / zoom riêng cho từng ảnh
            const [dragging, setDragging] = useState(false);
            const dragRef = useRef(null);
            const [scoreIn, setScoreIn] = useState(row.graded && row.score !== undefined ? String(row.score) : '');
            const [feedback, setFeedback] = useState(row.feedback || '');
            const [touched, setTouched] = useState(false);
            const [saving, setSaving] = useState(false);
            const v = views[idx] || V0;
            const setV = (patch) => setViews((m) => ({ ...m, [idx]: { ...(m[idx] || V0), ...patch } }));
            const zoomTo = (z) => setV({ z: Math.min(5, Math.max(0.5, Math.round(z * 100) / 100)) });
            const go = (d) => { if (photos.length > 1) setIdx((i) => (i + d + photos.length) % photos.length); };
            useEffect(() => {
                const h = (e) => {
                    if (e.key === 'Escape') return onClose();
                    const t = e.target && e.target.tagName;
                    if (t === 'INPUT' || t === 'TEXTAREA') return;
                    if (e.key === 'ArrowLeft') go(-1);
                    if (e.key === 'ArrowRight') go(1);
                };
                window.addEventListener('keydown', h);
                return () => window.removeEventListener('keydown', h);
            });
            const err = (touched || scoreIn !== '') ? validateEssayScore(scoreIn) : '';
            const inpBase = 'w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400';
            const tb = 'h-9 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1 disabled:opacity-40';
            const save = async () => {
                if (!canGrade || saving) return;
                setTouched(true);
                if (validateEssayScore(scoreIn)) return;
                const numericScore = Number(String(scoreIn).trim().replace(',', '.'));   // ép kiểu số
                const score = Math.round(Math.min(100, Math.max(0, numericScore)) * 100) / 100;   // giới hạn 0 - 100
                setSaving(true);
                try {
                    const quizXp = hw.type === 'mixed' ? quizXpOf(row.mcqScore !== undefined ? row.mcqScore : row.score) : 0;   // XP trắc nghiệm = số câu đúng x 5
                    const essayXp = essayXpOf(score);                                                                           // essayXp = teacherScore (0-100)
                    const totalXp = quizXp + essayXp;                                                                           // totalXp = quizXp + essayXp
                    const oldXp = subXp(row);   // XP cũ, tính trước khi ghi
                    // Cập nhật 1 lần duy nhất vào submissions/{hwId_uid}. Tổng XP & BXH của học sinh tự cập nhật (tính lại từ submissions => chấm lại không bị cộng dồn).
                    await fbDb.collection('submissions').doc(row.hwId + '_' + row.uid).update({
                        score, feedback: feedback.trim().slice(0, 1000), graded: true, gradedAt: fbNow(), gradedBy: user.id,
                        quizXp, essayXp, totalXp,
                        ...(hw.type === 'mixed' && row.mcqScore === undefined ? { mcqScore: row.score } : {})   // giữ lại điểm trắc nghiệm tự chấm
                    });
                    bxhBumpXp(row.uid, totalXp - oldXp);   // phản chiếu chênh lệch XP vào bxh/summary
                    setSaving(false);
                    eduToast('Đã lưu điểm cho ' + row.name + ' (' + score + ' điểm = ' + essayXp + ' XP' + (quizXp ? ' + ' + quizXp + ' XP trắc nghiệm' : '') + ')', 'success');
                    onSaved(row.uid);
                } catch (e) { setSaving(false); eduAlert(fbErr(e), 'error'); }
            };
            return (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4">
                    <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col lg:flex-row overflow-hidden shadow-2xl">
                        {/* Khu vực xem ảnh */}
                        <div className="flex-1 min-h-0 flex flex-col bg-slate-900">
                            <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-white/10">
                                <button type="button" onClick={() => go(-1)} disabled={photos.length < 2} className={tb} title="Ảnh trước" aria-label="Ảnh trước"><Icon name="chevron-left" className="w-4 h-4" /></button>
                                <span className="text-xs font-semibold text-white px-1 whitespace-nowrap">Ảnh {photos.length ? idx + 1 : 0}/{photos.length}</span>
                                <button type="button" onClick={() => go(1)} disabled={photos.length < 2} className={tb} title="Ảnh sau" aria-label="Ảnh sau"><Icon name="chevron-right" className="w-4 h-4" /></button>
                                <span className="w-px h-6 bg-white/20 mx-1"></span>
                                <button type="button" onClick={() => setV({ rot: (v.rot + 90) % 360 })} className={tb} title="Xoay ảnh 90°"><Icon name="rotate-cw" className="w-4 h-4" /><span className="hidden sm:inline text-xs font-semibold">Xoay ảnh</span></button>
                                <button type="button" onClick={() => zoomTo(v.z - 0.25)} className={tb} title="Thu nhỏ" aria-label="Thu nhỏ"><Icon name="zoom-out" className="w-4 h-4" /></button>
                                <span className="text-xs font-semibold text-white w-11 text-center">{Math.round(v.z * 100)}%</span>
                                <button type="button" onClick={() => zoomTo(v.z + 0.25)} className={tb} title="Phóng to" aria-label="Phóng to"><Icon name="zoom-in" className="w-4 h-4" /></button>
                                <button type="button" onClick={() => setV({ z: 1, x: 0, y: 0 })} className={tb} title="Đặt lại zoom"><Icon name="maximize" className="w-4 h-4" /><span className="hidden sm:inline text-xs font-semibold">Reset</span></button>
                            </div>
                            <div className={'flex-1 min-h-0 overflow-hidden flex items-center justify-center touch-none select-none overscroll-contain ' + (dragging ? 'cursor-grabbing' : 'cursor-grab')}
                                onPointerDown={(e) => { dragRef.current = { sx: e.clientX, sy: e.clientY, ox: v.x, oy: v.y }; setDragging(true); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) {} }}
                                onPointerMove={(e) => { const d = dragRef.current; if (d) setV({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }); }}
                                onPointerUp={() => { dragRef.current = null; setDragging(false); }}
                                onPointerCancel={() => { dragRef.current = null; setDragging(false); }}
                                onWheel={(e) => zoomTo(v.z + (e.deltaY < 0 ? 0.25 : -0.25))}>
                                {photos.length === 0
                                    ? <p className="text-sm text-slate-400">{phLoading ? 'Đang tải ảnh bài làm...' : 'Bài nộp này không có ảnh.'}</p>
                                    : <img src={photos[idx]} alt={'Bài làm của ' + row.name + ' - trang ' + (idx + 1)} draggable="false"
                                        className="max-w-full max-h-full object-contain"
                                        style={{ transform: 'translate(' + v.x + 'px, ' + v.y + 'px) rotate(' + v.rot + 'deg) scale(' + v.z + ')', transition: dragging ? 'none' : 'transform .15s ease' }} />}
                            </div>
                            {photos.length > 1 && (
                                <div className="flex gap-2 p-2 overflow-x-auto border-t border-white/10">
                                    {photos.map((p, i) => (
                                        <button key={i} type="button" onClick={() => setIdx(i)} className={'shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ' + (i === idx ? 'border-amber-400' : 'border-transparent opacity-60 hover:opacity-100')}>
                                            <img src={p} alt={'Trang ' + (i + 1)} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 px-3 py-1.5 border-t border-white/10">Cuộn chuột để zoom • Kéo để di chuyển • Phím ← → để chuyển ảnh</p>
                        </div>
                        {/* Khu vực chấm điểm */}
                        <div className="lg:w-80 shrink-0 max-h-[45%] lg:max-h-none border-t lg:border-t-0 lg:border-l border-slate-200 p-4 space-y-3 overflow-y-auto">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0"><h3 className="font-bold text-slate-900 text-sm break-words">{row.name}</h3><p className="text-xs text-slate-500 break-words">Lớp {row.cls} • {hw.title}</p></div>
                                <button type="button" onClick={onClose} className="text-slate-400 text-lg" aria-label="Đóng">✕</button>
                            </div>
                            {hw.type === 'mixed' && (row.mcqScore !== undefined || !row.graded) && (
                                <p className="text-[11px] bg-slate-50 rounded-lg px-2 py-1.5 text-slate-600">Trắc nghiệm (tự chấm): <b>{row.mcqScore !== undefined ? row.mcqScore : row.score}/{row.total}</b></p>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Điểm bài tự luận (0 – 100)</label>
                                <input id="essay-score" name="score" aria-label="Điểm bài tự luận" type="number" inputMode="decimal" min="0" max="100" step="0.25" disabled={!canGrade || saving} value={scoreIn} placeholder="VD: 85"
                                    onChange={(e) => setScoreIn(e.target.value)} onBlur={() => setTouched(true)}
                                    onKeyDown={(e) => { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); if (e.key === 'Enter') save(); }}
                                    className={inpBase + (err ? ' border-red-400 focus:ring-red-400' : ' border-slate-200 focus:ring-amber-500')} />
                                {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Lời phê / Nhận xét</label>
                                <textarea id="essay-feedback" name="feedback" aria-label="Lời phê / Nhận xét" rows="5" maxLength="1000" disabled={!canGrade || saving} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Nhận xét về bài làm, điểm cần sửa, lời khuyên cho học sinh..."
                                    className={inpBase + ' border-slate-200 focus:ring-amber-500'} />
                                <p className="text-[10px] text-slate-400 text-right">{feedback.length}/1000</p>
                            </div>
                            {canGrade
                                ? <button type="button" onClick={save} disabled={saving || !!validateEssayScore(scoreIn)} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"><Icon name="save" className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu điểm'}</button>
                                : <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5">Chỉ giáo viên đăng bài tập này mới chấm điểm được.</p>}
                        </div>
                    </div>
                </div>
            );
        }



        // Ngưỡng cảnh báo: câu có hơn 70% học sinh làm sai
        const HARD_WRONG_PCT = 70;

        // Modal xem chi tiết bài làm của 1 học sinh: trắc nghiệm trước, tự luận sau
        function SubDetailModal({ hw, row, rateMap, canGrade, onOpenPhotos, onClose }) {
            const qs = hw.questions || [];
            const my = row.answers || [];
            const psgs = Array.isArray(hw.passages) ? hw.passages : [];
            const mcq = [], essayQs = [];
            qs.forEach((q, i) => (q.kind === 'essay' ? essayQs : mcq).push({ q, i }));
            const state = (i, q) => { const a = my[i]; return (a === undefined || a === null || a < 0) ? 'none' : (a === q.c ? 'ok' : 'bad'); };
            const okN = mcq.filter(({ q, i }) => state(i, q) === 'ok').length;
            const noneN = mcq.filter(({ q, i }) => state(i, q) === 'none').length;
            const hasPh = photoCountOf(row) > 0;
            const shownPsg = new Set();
            const tint = (rgb, a) => 'rgba(' + rgb + ',' + a + ')';   // màu trong suốt: hiển thị tốt ở cả chế độ sáng/tối
            const RGB = { ok: '16,185,129', bad: '239,68,68', none: '245,158,11', essay: '99,102,241' };
            const wrongTag = (i) => {
                const pc = rateMap[i];
                if (pc === undefined) return null;
                const wrong = 100 - pc;
                return wrong > HARD_WRONG_PCT ? <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">({wrong}% học sinh sai)</span> : null;
            };
            const psgBox = (q) => {
                const k = q.p;
                if (typeof k !== 'number' || typeof psgs[k] !== 'string' || !psgs[k] || shownPsg.has(k)) return null;
                shownPsg.add(k);
                return (<div key={'psg' + k} className="mb-2 bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-[11px] font-bold text-amber-700 mb-1">📖 Đoạn văn dùng chung</p><div className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{psgs[k]}</div></div>);
            };
            useEffect(() => {
                const h = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
                window.addEventListener('keydown', h, true);
                return () => window.removeEventListener('keydown', h, true);
            }, []);
            return (
                <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 60 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
                    <div className="bg-white rounded-2xl w-full max-w-3xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-slate-100 flex justify-between items-start gap-3">
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{row.name} <span className="text-xs font-normal text-slate-400">• {row.cls}</span></h4>
                                <p className="text-xs text-slate-500 mt-0.5">Trắc nghiệm: <b className="text-emerald-700">{okN}/{mcq.length}</b> đúng{noneN > 0 && <> • <span className="text-amber-600">{noneN} câu bỏ trống</span></>}{essayQs.length > 0 && <> • {essayQs.length} câu tự luận</>}</p>
                            </div>
                            <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg" aria-label="Đóng">✕</button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4 space-y-3">
                            {mcq.length > 0 && <p className="text-xs font-bold text-slate-700">Phần trắc nghiệm ({mcq.length} câu)</p>}
                            {mcq.map(({ q, i }) => {
                                const st = state(i, q);
                                return (
                                    <React.Fragment key={i}>
                                        {psgBox(q)}
                                        <div className="rounded-xl border p-3" style={{ background: tint(RGB[st], 0.08), borderColor: tint(RGB[st], 0.45) }}>
                                            <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap break-words">Câu {i + 1}: {q.q} {wrongTag(i)}</p>
                                            <div className="mt-2 space-y-1">
                                                {(q.a || []).map((o, j) => {
                                                    const chosen = my[i] === j, right = j === q.c;
                                                    return (
                                                        <div key={j} className={'text-xs px-2.5 py-1.5 rounded-lg border ' + (right || chosen ? 'font-semibold' : 'bg-white border-slate-200 text-slate-600')} style={right ? { background: tint(RGB.ok, 0.22), borderColor: tint(RGB.ok, 0.7) } : chosen ? { background: tint(RGB.bad, 0.22), borderColor: tint(RGB.bad, 0.7) } : undefined}>
                                                            {'ABCD'[j]}. {o}{right && ' ✓'}{chosen && !right && ' ✗ (HS chọn)'}{chosen && right && ' (HS chọn)'}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {st === 'none' && <p className="text-[11px] font-bold text-amber-600 mt-1.5">Học sinh chưa trả lời câu này.</p>}
                                            {q.e && <p className="text-[11px] text-slate-500 mt-1.5">💡 {q.e}</p>}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {essayQs.length > 0 && (
                                <div className="pt-2 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-700">Phần tự luận ({essayQs.length} câu)</p>
                                        {hasPh
                                            ? <button type="button" onClick={onOpenPhotos} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg">📷 Xem {photoCountOf(row)} ảnh bài làm{canGrade ? ' & chấm' : ''}</button>
                                            : <span className="text-[11px] text-slate-400">Học sinh không có ảnh bài làm</span>}
                                    </div>
                                    {essayQs.map(({ q, i }) => (
                                        <div key={i}>
                                            {psgBox(q)}
                                            <div className="rounded-xl border p-3" style={{ background: tint(RGB.essay, 0.08), borderColor: tint(RGB.essay, 0.4) }}>
                                                <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap break-words">Câu {i + 1} (Tự luận){q.q ? ': ' + q.q : ''} {wrongTag(i)}</p>
                                                {(q.images || []).map((im, k) => <img key={k} src={im} alt="" className="w-full mt-2 rounded-lg border border-indigo-200" />)}
                                            </div>
                                        </div>
                                    ))}
                                    {row.graded && <p className="text-xs rounded-lg px-3 py-2" style={{ background: tint(RGB.ok, 0.12) }}>Điểm đã chấm: <b>{Number(row.score) || 0}/100</b>{row.feedback ? ' — ' + row.feedback : ''}</p>}
                                </div>
                            )}
                            {qs.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Bài tập không có câu hỏi.</p>}
                        </div>
                    </div>
                </div>
            );
        }

        function HwResultsImpl({ hw, subs, students, user, onClose }) {
            const essay = isEssayHw(hw);
            const canGrade = essay && !!user && hw.teacherId === user.id;
            const [viewUid, setViewUid] = useState(null);
            const [detailUid, setDetailUid] = useState(null);   // học sinh đang xem chi tiết bài làm
            const [filter, setFilter] = useState('all');
            const [q, setQ] = useState('');
            const zeroed = useRef(new Set());
            const needsGrade = (r) => r.status === 'submitted' && !r.graded;
            const isLate = (r) => r.status === 'timeout' && !r.adminEdited;
            const rows = subs.filter((x) => x.hwId === hw.id).sort((a, b) => essay
                ? ((needsGrade(b) ? 1 : 0) - (needsGrade(a) ? 1 : 0)) || String(a.name || '').localeCompare(String(b.name || ''), 'vi')   // bài chờ chấm lên đầu
                : b.score - a.score);
            const target = students.filter((s) => !(hw.classes && hw.classes.length) || hw.classes.map((c) => String(c).toUpperCase()).includes(s.class));
            const done = new Set(rows.map((r) => r.uid));
            const missing = target.filter((s) => !done.has(s.id));
            const scored = rows.map(subScore10).filter((x) => x !== null);
            const avg = scored.length ? (scored.reduce((a, x) => a + x, 0) / scored.length).toFixed(1) : '-';
            const pending = rows.filter(needsGrade).length;
            const cLate = rows.filter(isLate).length;
            const cDone = rows.length - pending - cLate;
            const pct = target.length ? Math.min(100, Math.round(rows.length / target.length * 100)) : 0;
            const sel = viewUid ? rows.find((r) => r.uid === viewUid) : null;
            const qn = q.trim().toLowerCase();
            const match = (name, cls) => !qn || (String(name || '') + ' ' + String(cls || '')).toLowerCase().includes(qn);
            const shown = rows.filter((r) => match(r.name, r.cls) && (filter === 'all' || (filter === 'pending' && needsGrade(r)) || (filter === 'late' && isLate(r)) || (filter === 'done' && !needsGrade(r) && !isLate(r))));
            const shownMissing = missing.filter((s) => match(s.name, s.class));
            const chips = [['all', 'Tất cả', rows.length]].concat(essay ? [['pending', 'Chờ chấm', pending]] : [], [['done', essay ? 'Đã chấm' : 'Đã nộp', cDone], ['late', 'Quá hạn', cLate], ['missing', 'Chưa nộp', missing.length]]);
            const qRates = (hw.type !== 'essay' && (hw.questions || []).length > 0 && rows.length > 0)
                ? hw.questions.map((qq, i) => (qq.kind === 'essay' ? null : { i, pc: Math.round(rows.filter((r) => r.answers && r.answers[i] === qq.c).length / rows.length * 100) })).filter(Boolean)
                : [];
            const rateMap = {}; qRates.forEach(({ i, pc }) => { rateMap[i] = pc; });
            const detailRow = detailUid ? rows.find((r) => r.uid === detailUid) : null;
            // Bài 'timeout' => tự động ghi score: 0 vào Firestore (chỉ giáo viên đăng bài thực hiện; hiển thị luôn là 0đ)
            useEffect(() => {
                if (!canGrade) return;
                rows.filter((r) => r.status === 'timeout' && !r.adminEdited && !(r.graded && Number(r.score) === 0) && !zeroed.current.has(r.uid)).forEach((r) => {
                    zeroed.current.add(r.uid);
                    fbDb.collection('submissions').doc(r.hwId + '_' + r.uid).update({
                        score: 0, graded: true, autoZero: true, gradedAt: fbNow(), gradedBy: user.id,
                        quizXp: 0, essayXp: 0, totalXp: 0,
                        ...(hw.type === 'mixed' && r.mcqScore === undefined ? { mcqScore: r.score } : {})
                    }).catch(() => {});
                });
            }, [rows.map((r) => r.uid + ':' + r.status + ':' + r.graded + ':' + r.score).join('|')]);
            // Phím Esc đóng bảng kết quả (khi đang mở ảnh chấm bài thì Esc chỉ đóng ảnh)
            useEffect(() => {
                const h = (e) => { if (e.key === 'Escape' && !viewUid && !detailUid) onClose(); };
                window.addEventListener('keydown', h);
                return () => window.removeEventListener('keydown', h);
            }, [viewUid, detailUid]);
            const afterSave = (uid) => { const nx = rows.find((r) => r.uid !== uid && needsGrade(r) && photoCountOf(r) > 0); setViewUid(nx ? nx.uid : null); };
            // Quyền riêng: chỉ giáo viên đăng bài tập mới xem được kết quả của bài đó
            if (!user || hw.teacherId !== user.id) return null;
            const gridCls = 'grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_72px_minmax(0,220px)_96px] items-center gap-x-3';
            const badges = (r, timeout) => {
                const n = photoCountOf(r);
                return (<>
                    {timeout
                        ? <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Quá hạn 3p (0đ)</span>
                        : <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Đã nộp</span>}
                    {!timeout && n > 0 && <span className="text-[10px] font-bold text-indigo-600">📷 {n} ảnh</span>}
                    {!timeout && essay && r.graded && <span className="text-[10px] font-bold text-emerald-600">• Đã chấm</span>}
                    {!timeout && r.auto && <span className="text-[10px] text-slate-400">• tự nộp</span>}
                    {!timeout && (hw.questions || []).length > 0 && <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setDetailUid(r.uid); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDetailUid(r.uid); } }} className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded cursor-pointer">Xem chi tiết</span>}
                </>);
            };
            const statCard = 'rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 min-w-0';
            return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !sel && !detailRow) onClose(); }}>
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] lg:h-[88vh] flex flex-col overflow-hidden shadow-2xl">
                        {/* Đầu bảng: tiêu đề + số liệu tổng quan */}
                        <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 space-y-3">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words">{hw.title}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{hw.classesText || 'Tất cả các lớp'} • {(hw.questions || []).length} câu{canGrade ? ' • Bạn là giáo viên đăng bài này' : ''}</p>
                                </div>
                                <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg" aria-label="Đóng">✕</button>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                <div className={statCard}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Đã nộp</p>
                                    <p className="text-lg font-black text-slate-800 leading-tight">{rows.length}<span className="text-sm font-semibold text-slate-400">/{target.length}</span></p>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-full bg-orange-500" style={{ width: pct + '%' }}></div></div>
                                </div>
                                <div className={statCard}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Điểm trung bình</p>
                                    <p className="text-lg font-black text-slate-800 leading-tight">{avg}<span className="text-sm font-semibold text-slate-400">/10</span></p>
                                </div>
                                <div className={statCard}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{essay ? 'Chờ chấm' : 'Chưa nộp'}</p>
                                    <p className={'text-lg font-black leading-tight ' + ((essay ? pending : missing.length) > 0 ? 'text-amber-600' : 'text-slate-800')}>{essay ? pending : missing.length}</p>
                                </div>
                                <div className={statCard}>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Quá hạn (0đ)</p>
                                    <p className={'text-lg font-black leading-tight ' + (cLate > 0 ? 'text-red-500' : 'text-slate-800')}>{cLate}</p>
                                </div>
                            </div>
                        </div>
                        {/* Thân bảng: danh sách bên trái, thống kê từng câu bên phải (laptop) */}
                        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
                            <div className="flex-1 min-w-0 flex flex-col lg:min-h-0">
                                <div className="shrink-0 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2 border-b border-slate-100">
                                    <input id="student-search" name="studentSearch" aria-label="Tìm tên hoặc lớp" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên hoặc lớp..." className="w-full sm:w-56 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                    <div className="flex flex-wrap gap-1.5">
                                        {chips.map(([k, label, n]) => (
                                            <button key={k} type="button" onClick={() => setFilter(k)}
                                                className={'px-2.5 py-1 rounded-full text-[11px] font-bold border transition ' + (filter === k ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}>
                                                {label} <span className={filter === k ? 'text-orange-100' : 'text-slate-400'}>{n}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
                                    <div className={gridCls + ' hidden md:grid sticky top-0 z-10 bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-2 text-[10px] font-bold text-slate-400 uppercase'}>
                                        <span>Học sinh</span><span>Lớp</span><span>Trạng thái</span><span className="text-right">Điểm</span>
                                    </div>
                                    {filter !== 'missing' && shown.length === 0 && <p className="px-6 py-8 text-center text-xs text-slate-400">{rows.length === 0 ? 'Chưa có học sinh nộp bài.' : 'Không có bài nộp nào khớp bộ lọc.'}</p>}
                                    {filter !== 'missing' && shown.map((r) => {
                                        const timeout = isLate(r);
                                        const hasPh = photoCountOf(r) > 0;
                                        const Row = 'div';
                                        const scoreText = timeout ? '0đ' : r.graded ? (Number(r.score) || 0) + '/100' : essay ? 'Chờ chấm' : r.score + '/' + r.total;
                                        const scoreCls = timeout ? 'text-red-500' : r.graded ? 'text-emerald-700' : 'text-amber-700';
                                        return (
                                            <Row key={r.uid} role={hasPh ? 'button' : undefined} tabIndex={hasPh ? 0 : undefined} onKeyDown={hasPh ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) setViewUid(r.uid); } : undefined} onClick={hasPh ? () => setViewUid(r.uid) : undefined}
                                                className={gridCls + ' w-full px-4 sm:px-6 py-2.5 border-b border-slate-100 text-sm text-left ' + (hasPh ? 'hover:bg-amber-50 cursor-pointer ' : '') + (needsGrade(r) ? 'bg-amber-50/40' : '')}>
                                                <span className="min-w-0">
                                                    <span className="block font-medium text-slate-800 truncate">{r.name}<span className="md:hidden text-xs font-normal text-slate-400"> • {r.cls}</span></span>
                                                    {timeout && <span className="block text-[10px] text-red-500">{ESSAY_TIMEOUT_NOTE}</span>}
                                                    <span className="md:hidden flex flex-wrap items-center gap-1 mt-0.5">{badges(r, timeout)}</span>
                                                </span>
                                                <span className="hidden md:block text-xs text-slate-500">{r.cls}</span>
                                                <span className="hidden md:flex flex-wrap items-center gap-1">{badges(r, timeout)}{hasPh && canGrade && !r.graded && <span className="text-[10px] text-slate-400">• bấm để chấm</span>}</span>
                                                <b className={'text-right ' + scoreCls}>{scoreText}</b>
                                            </Row>
                                        );
                                    })}
                                    {filter === 'missing' && shownMissing.length === 0 && <p className="px-6 py-8 text-center text-xs text-slate-400">{missing.length === 0 ? 'Tất cả học sinh đã nộp bài.' : 'Không có học sinh nào khớp tìm kiếm.'}</p>}
                                    {filter === 'missing' && shownMissing.map((s) => (
                                        <div key={s.id} className={gridCls + ' px-4 sm:px-6 py-2.5 border-b border-slate-100 text-sm'}>
                                            <span className="min-w-0 font-medium text-slate-800 truncate">{s.name}<span className="md:hidden text-xs font-normal text-slate-400"> • {s.class}</span></span>
                                            <span className="hidden md:block text-xs text-slate-500">{s.class}</span>
                                            <span className="hidden md:block"><span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Chưa nộp</span></span>
                                            <b className="text-right text-slate-300">–</b>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {qRates.length > 0 && (
                                <aside className="lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/60 p-4 lg:overflow-y-auto custom-scrollbar">
                                    <p className="text-xs font-bold text-slate-700">Tỉ lệ làm đúng từng câu</p>
                                    <p className="text-[10px] text-slate-400 mb-2">Câu dưới 50% màu đỏ — cần ôn lại. Chữ đỏ đậm: hơn {HARD_WRONG_PCT}% học sinh sai</p>
                                    {qRates.map(({ i, pc }) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px] mb-1.5"><span className={'w-10 shrink-0 ' + (100 - pc > HARD_WRONG_PCT ? 'text-red-600 font-bold' : '')}>Câu {i + 1}</span>
                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div style={{ width: pc + '%' }} className={'h-full ' + (pc < 50 ? 'bg-red-400' : 'bg-emerald-500')}></div></div>
                                            <span className="w-9 text-right font-semibold">{pc}%</span></div>
                                    ))}
                                </aside>
                            )}
                        </div>
                    </div>
                    {detailRow && !sel && <SubDetailModal hw={hw} row={detailRow} rateMap={rateMap} canGrade={canGrade} onOpenPhotos={() => setViewUid(detailRow.uid)} onClose={() => setDetailUid(null)} />}
                    {sel && <EssayPhotoViewer key={sel.uid} hw={hw} row={sel} canGrade={canGrade} user={user} onClose={() => setViewUid(null)} onSaved={afterSave} />}
                </div>
            );
        }


        // ===================== BẮT BUỘC CHỌN TRƯỜNG (giáo viên cũ chưa có trường công tác) =====================
        function TeacherSchoolGate({ user, setUser, onLogout }) {
            const [f, setF] = useState({ province: '', school: '', schoolOther: '', subject: GDPT_SUBJECTS.includes(user.subject) ? user.subject : '' });
            const [busy, setBusy] = useState(false);
            const patchF = (patch) => setF((x) => ({ ...x, ...patch }));
            // Không cho đóng bằng phím Esc (chỉ chặn phím, không ảnh hưởng ô nhập)
            useEffect(() => {
                const block = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } };
                window.addEventListener('keydown', block, true);
                const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
                return () => { window.removeEventListener('keydown', block, true); document.body.style.overflow = prev; };
            }, []);
            const inp = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:text-slate-400';
            const save = async () => {
                if (busy) return;
                const pk = readSchoolPick(f);
                if (!pk.ok) return eduAlert(pk.msg, 'warning');
                if (!GDPT_SUBJECTS.includes(f.subject)) return eduAlert('Vui lòng chọn môn học giảng dạy.', 'warning');
                const schoolName = pk.school;
                setBusy(true);
                try {
                    // merge: giữ nguyên ảnh đại diện, quyền riêng tư... đã có; role/name để qua được firestore.rules khi hồ sơ chưa tồn tại
                    const data = { name: user.name, role: 'teacher', school: schoolName, province: pk.province, subject: f.subject };
                    await fbDb.collection('profiles').doc(user.id).set(data, { merge: true });
                    // Đồng bộ thêm vào tài khoản (users) để quản trị viên thấy; lỗi ở bước này không chặn mở khóa
                    fbDb.collection('users').doc(user.id).update({ school: schoolName, province: pk.province, subject: f.subject }).catch(() => {});
                    setUser({ ...user, school: schoolName, province: pk.province, subject: f.subject });   // chỉ mở khóa sau khi lưu thành công
                } catch (e) { setBusy(false); eduAlert(fbErr(e), 'error'); }
            };
            return (
                <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="gate-title">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="text-center space-y-1">
                            <div className="text-3xl">🏫</div>
                            <h3 id="gate-title" className="font-bold text-slate-900">Cập nhật thông tin công tác</h3>
                            <p className="text-xs text-slate-500">Xin chào {user.name}. Tài khoản của bạn chưa có thông tin trường công tác / môn giảng dạy. Vui lòng chọn để tiếp tục sử dụng EduOrient.</p>
                        </div>
                        <SchoolPicker value={f} onChange={patchF} inp={inp} accent="amber" />
                        <SubjectSelect value={f.subject} onChange={(v) => patchF({ subject: v })} inp={inp} />
                        <button onClick={save} disabled={busy} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl">{busy ? 'Đang lưu...' : 'Lưu thông tin'}</button>
                        <button onClick={onLogout} disabled={busy} className="w-full text-xs text-slate-400 hover:text-red-600 font-medium">Đăng xuất</button>
                    </div>
                </div>
            );
        }


        function TeacherToolsImpl({ user, setUser, open, setOpen }) {
            const [f, setF] = useState({ name: '', subject: '', avatar: '', isPrivate: false, province: '', school: '', schoolOther: '' });
            const [pw, setPw] = useState({ o: '', n: '' });
            const [card, setCard] = useState('');
            const [cardDirty, setCardDirty] = useState(false);
            const [saving, setSaving] = useState(false);
            useEffect(() => {
                if (open === 'prof') {
                    setF({ name: user.name, subject: user.subject || '', avatar: user.avatar || '', isPrivate: user.isPrivate === true, ...pickerFromUser(user) }); setCard(''); setCardDirty(false);
                    fbDb.collection('teacherCards').doc(user.id).get().then((d) => { if (d.exists) setCard(d.data().img || ''); }).catch(() => {});
                }
                if (open === 'pw') setPw({ o: '', n: '' });
            }, [open]);
            const inp = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500';
            const save = () => {
                if (saving) return;
                if (!f.name.trim()) return eduAlert('Tên không được để trống.', 'warning');
                const pk = readSchoolPick(f);
                if (!pk.ok) return eduAlert(pk.msg, 'warning');
                if (!GDPT_SUBJECTS.includes(f.subject)) return eduAlert('Hãy chọn môn dạy trong danh sách (Chương trình GDPT 2018).', 'warning');
                setSaving(true);
                const jobs = [fbDb.collection('profiles').doc(user.id).set({ name: f.name.trim(), subject: f.subject, school: pk.school, province: pk.province, role: 'teacher', avatar: safeAvatar(f.avatar), isPrivate: f.isPrivate === true })];
                if (cardDirty && card) jobs.push(fbDb.collection('teacherCards').doc(user.id).set({ img: card }));
                Promise.all(jobs).then(() => {
                    // Đồng bộ sang tài khoản (users) để quản trị viên thấy thông tin mới; lỗi ở bước này không chặn lưu hồ sơ
                    fbDb.collection('users').doc(user.id).update({ school: pk.school, province: pk.province, subject: f.subject }).catch(() => {});
                    setUser({ ...user, name: f.name.trim(), subject: f.subject, school: pk.school, province: pk.province, avatar: f.avatar, isPrivate: f.isPrivate === true }); setSaving(false); setOpen(null); eduToast('Đã lưu hồ sơ', 'success');
                }).catch((e) => { setSaving(false); eduAlert(fbErr(e), 'error'); });
            };
            const change = async () => {
                const u = fbAuth.currentUser; if (!pw.o || pw.n.length < 6) return eduAlert('Nhập mật khẩu cũ và mật khẩu mới (từ 6 ký tự).', 'warning');
                try { await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, pw.o)); await u.updatePassword(pw.n); setOpen(null); eduAlert('Đổi mật khẩu thành công!', 'success'); }
                catch (e) { eduAlert(e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' ? 'Mật khẩu cũ không đúng.' : fbErr(e), 'error'); }
            };
            const shell = (title, body, opts = {}) => (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
                    <div className={'bg-white rounded-2xl w-full shadow-2xl max-h-[92vh] flex flex-col overflow-hidden ' + (opts.wide ? 'max-w-sm md:max-w-3xl' : 'max-w-sm')}>
                        <div className="shrink-0 flex justify-between items-center px-5 md:px-6 py-3.5 border-b border-slate-100"><h3 className="font-bold text-slate-900">{title}</h3><button type="button" onClick={() => setOpen(null)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg" aria-label="Đóng">✕</button></div>
                        <div className="flex-1 min-h-0 overflow-y-auto px-5 md:px-6 py-4 space-y-3">{body}</div>
                        {opts.footer && <div className="shrink-0 px-5 md:px-6 py-3 border-t border-slate-100 bg-slate-50/60">{opts.footer}</div>}
                    </div>
                </div>);
            return (<>
                {open === 'prof' && shell('Chỉnh sửa hồ sơ', (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-3 min-w-0">
                            <div className="flex items-center gap-4">
                                <img src={avatarUrl(f)} className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shrink-0" />
                                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-700 hover:bg-amber-50 cursor-pointer">📷 Đổi ảnh đại diện<input id="avatar-upload" name="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && resizeImg(e.target.files[0], 160, (d) => setF((x) => ({ ...x, avatar: d })))} /></label>
                            </div>
                            <label className="block"><span className="text-[11px] font-bold text-slate-500 uppercase">Họ và tên</span>
                                <input id="profile-name" name="name" autoComplete="name" className={inp + ' mt-1'} placeholder="Tên giáo viên" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
                            <div><span className="text-[11px] font-bold text-slate-500 uppercase">Trường công tác</span>
                                <div className="mt-1"><SchoolPicker value={f} onChange={(patch) => setF((x) => ({ ...x, ...patch }))} inp={inp} accent="amber" /></div></div>
                            <div><span className="text-[11px] font-bold text-slate-500 uppercase">Môn dạy</span>
                                <div className="mt-1"><SubjectSelect value={f.subject} onChange={(v) => setF((x) => ({ ...x, subject: v }))} inp={inp} /></div></div>
                        </div>
                        <div className="space-y-4 min-w-0">
                            <div className="rounded-xl border border-slate-200 p-3">
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input id="profile-private" name="isPrivate" type="checkbox" className="sr-only peer" checked={f.isPrivate} onChange={(e) => setF({ ...f, isPrivate: e.target.checked })} />
                                    <span className="relative mt-0.5 w-10 h-6 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"></span>
                                    <span className="min-w-0">
                                        <b className="block text-xs text-slate-700">🔒 Ẩn khỏi danh sách tìm kiếm</b>
                                        <span className="block text-[11px] text-slate-400 mt-0.5">Khi bật, hồ sơ của bạn không xuất hiện trong danh sách bạn bè / nhắn tin của học sinh và giáo viên khác. Quản trị viên vẫn xem được tài khoản này và có thể bật/tắt chế độ ẩn này.</span>
                                    </span>
                                </label>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                                <b className="text-xs text-slate-700">Ảnh thẻ giáo viên (để xác minh)</b>
                                {card ? <img src={card} className="w-full h-36 md:h-40 object-cover rounded-xl border border-slate-200" /> : <p className="text-[11px] text-slate-400">Chưa tải ảnh thẻ.</p>}
                                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-700 hover:bg-amber-50 cursor-pointer">📷 {card ? 'Đổi ảnh thẻ' : 'Tải ảnh thẻ'}<input id="card-upload" name="cardImage" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && resizeFit(e.target.files[0], 720, (d) => { setCard(d); setCardDirty(true); })} /></label>
                                <p className="text-[10px] text-slate-400">Chỉ quản trị viên xem được ảnh thẻ, học sinh không thấy.</p>
                            </div>
                        </div>
                    </div>
                ), { wide: true, footer: (
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setOpen(null)} disabled={saving} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-xl disabled:opacity-50">Hủy</button>
                        <button type="button" onClick={save} disabled={saving} className="flex-1 md:flex-none md:min-w-[160px] px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
                    </div>) })}
                {open === 'pw' && shell('Đổi mật khẩu', (<>
                    <form id="change-password-form" name="change-password-form" onSubmit={(e) => { e.preventDefault(); change(); }} className="space-y-3">
<input id="pw-old" name="oldPassword" aria-label="Mật khẩu cũ" autoComplete="current-password" className={inp} type="password" placeholder="Mật khẩu cũ" value={pw.o} onChange={(e) => setPw({ ...pw, o: e.target.value })} />
                    <input id="pw-new" name="newPassword" aria-label="Mật khẩu mới" autoComplete="new-password" className={inp} type="password" placeholder="Mật khẩu mới (từ 6 ký tự)" value={pw.n} onChange={(e) => setPw({ ...pw, n: e.target.value })} />
                    <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl">Đổi mật khẩu</button>
</form>
                </>))}
            </>);
        }


        // Orient New của giáo viên: xem bảng tin + nhắn tin với học sinh
        function TeacherSocialImpl({ user, peer, onClose }) {
            const me = user.name + ' (GV)';
            const [tab, setTab] = useState(peer ? 'chat' : 'feed');
            const [profiles, setProfiles] = useState({});
            const [posts, setPosts] = useState([]);
            const [text, setText] = useState('');
            const [cur, setCur] = useState(peer || 'class');
            const [msgs, setMsgs] = useState([]);
            const [last, setLast] = useState({});
            const [input, setInput] = useState('');
            const bodyRef = useRef(null);
            const cid = (o) => o === 'class' ? 'class' : [user.id, o].sort().join('_');
            const isG = (id) => String(id).indexOf('g:') === 0;   // phòng nhóm lớp có mã "g:<gid>"
            const msgsOf = (id) => isG(id) ? fbDb.collection('groups').doc(String(id).slice(2)).collection('msgs') : fbDb.collection('chats').doc(cid(id)).collection('msgs');
            const [groups, setGroups] = useState([]);
            const [showGroup, setShowGroup] = useState(false);
            useEffect(() => {
                // TỐI ƯU ĐỌC: trước đây nghe CẢ collection profiles (mọi trường). Giờ chỉ get() 1 lần hồ sơ CÙNG TRƯỜNG:
                //  giáo viên (role + school) và học sinh (targetSchoolId) - đúng tập mà danh sách "others" bên dưới lọc ra.
                let dead = false;
                const tid = schoolIdOfTeacher(user), qs = [];
                if (user.school) qs.push(fbDb.collection('profiles').where('role', '==', 'teacher').where('school', '==', user.school).get());
                if (tid) qs.push(fbDb.collection('profiles').where('targetSchoolId', '==', tid).get());
                Promise.all(qs.map((q) => q.catch(() => null))).then((snaps) => {
                    if (dead) return; const m = {};
                    snaps.forEach((s) => s && s.forEach((d) => { m[d.id] = d.data(); }));
                    setProfiles((prev) => keepMap(prev, { ...prev, ...m }));
                });
                const u2 = fbDb.collection('posts').orderBy('createdAt', 'desc').limit(40).onSnapshot((s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
                const u3 = fbDb.collection('groups').where('members', 'array-contains', user.id).onSnapshot((s) => { const g = s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.type === 'class'); setGroups((prev) => keepList(prev, g, (x) => x.id)); }, () => {});
                return () => { dead = true; u2(); u3(); };
            }, []);
            const meSchool = useMemo(() => ({ role: 'teacher', school: user.school, province: user.province }), [user.school, user.province]);
            const others = useMemo(() => Object.entries(profiles).filter(([id, p]) => id !== user.id && p.isPrivate !== true && sameSchoolProfile(p, meSchool)).map(([id, p]) => ({ id, ...p })), [profiles, user.id, meSchool]);   // Phần 2: chỉ người cùng trường
            const key = others.map((o) => o.id).join(',');
            const groupRooms = useMemo(() => groups.map((g) => ({ id: 'g:' + g.id, name: g.name || ('Nhóm Chat Lớp ' + (g.cls || '')), isGroup: true, g })), [groups]);
            const gKey = groups.map((g) => g.id).join(',');
            useEffect(() => {
                const offs = groupRooms.concat(others).concat([{ id: 'class' }]).map((o) => msgsOf(o.id).orderBy('createdAt', 'desc').limit(1)
                    .onSnapshot((s) => { const d = s.docs[0]; setLast((l) => ({ ...l, [o.id]: d ? d.data() : null })); }, () => {}));
                return () => offs.forEach((f) => f());
            }, [key, gKey]);
            useEffect(() => msgsOf(cur).orderBy('createdAt').limitToLast(80).onSnapshot((s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), [cur]);
            useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, tab]);

            const post = () => { if (!text.trim()) return; fbDb.collection('posts').add({ uid: user.id, name: me, content: text.trim().slice(0, 1000), likes: [], comments: [], createdAt: fbNow() }).then(() => setText('')).catch((e) => eduAlert(fbErr(e), 'error')); };
            const like = (p) => { const has = (p.likes || []).includes(user.id), F = firebase.firestore.FieldValue; fbDb.collection('posts').doc(p.id).update({ likes: has ? F.arrayRemove(user.id) : F.arrayUnion(user.id) }); };
            const comment = (p) => { eduPrompt('Viết bình luận của bạn', { title: 'Bình luận', placeholder: 'Nhập bình luận...', maxLength: 300 }).then((t) => { if (!t || !t.trim()) return; fbDb.collection('posts').doc(p.id).update({ comments: firebase.firestore.FieldValue.arrayUnion({ uid: user.id, name: me, text: t.trim().slice(0, 300) }) }).catch((e) => eduAlert(fbErr(e), 'error')); }); };
            const send = () => { if (!input.trim()) return; msgsOf(cur).add({ from: user.id, name: me, text: input.trim().slice(0, 500), createdAt: fbNow() }).then(() => setInput('')).catch((e) => eduAlert(fbErr(e), 'error')); };
            const curGroup = isG(cur) ? (groups.find((g) => 'g:' + g.id === cur) || null) : null;
            const isHR = !!curGroup && curGroup.homeroomTeacherUid === user.id;   // GVCN của nhóm đang mở
            const curName = curGroup ? (curGroup.name || 'Nhóm lớp') : cur === 'class' ? 'Cả lớp' : ((profiles[cur] || {}).name || '');
            const delMsg = (m) => eduConfirm('Tin nhắn sẽ bị xóa vĩnh viễn khỏi nhóm.', { title: 'Xóa tin nhắn vi phạm?', confirmText: 'Xóa', danger: true })
                .then((yes) => yes && msgsOf(cur).doc(m.id).delete().catch((e) => eduAlert(fbErr(e), 'error')));

            // Xóa lịch sử: nhóm lớp -> chỉ GVCN của nhóm; chat riêng 1-1 -> cả 2 người; phòng chung 'Cả lớp' -> không có nút
            const canClear = cur !== 'class' && (curGroup ? isHR : true);
            const clearChat = async () => {
                if (!canClear) return;
                const yes = await eduConfirm(curGroup ? 'Toàn bộ tin nhắn của nhóm sẽ bị xóa vĩnh viễn với mọi thành viên.' : 'Toàn bộ tin nhắn của cuộc trò chuyện này sẽ bị xóa vĩnh viễn với CẢ HAI người.',
                    { title: curGroup ? 'Xóa toàn bộ lịch sử nhóm?' : 'Xóa cuộc trò chuyện?', confirmText: 'Xóa', danger: true });
                if (!yes) return;
                try { const n = await wipeMsgs(msgsOf(cur)); eduToast('Đã xóa ' + n + ' tin nhắn.', 'success'); }
                catch (e) { console.error('Lỗi xóa lịch sử:', e); eduAlert(e && e.code === 'permission-denied' ? 'Không có quyền xóa lịch sử. Hãy chắc chắn firestore.rules mới nhất đã được Publish.' : fbErr(e), 'error'); }
            };

            return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl w-full max-w-3xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">Orient New</h3>
                            <div className="flex items-center gap-2">
                                {[['feed', 'Bảng tin'], ['chat', 'Tin nhắn']].map(([k, l]) => (<button key={k} onClick={() => setTab(k)} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (tab === k ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600')}>{l}</button>))}
                                <button onClick={onClose} className="text-slate-400 text-lg ml-2">✕</button>
                            </div>
                        </div>
                        {tab === 'feed' && (<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                <textarea id="post-text" name="postText" aria-label="Nội dung bài đăng" rows="2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Đăng thông báo hoặc chia sẻ với lớp..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                <button onClick={post} className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg">Đăng</button>
                            </div>
                            {posts.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Chưa có bài viết nào.</p>}
                            {posts.map((p) => (<div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <img src={avatarUrl(profiles[p.uid] || { name: p.name })} className="w-8 h-8 rounded-full object-cover" />
                                    <div className="flex-1"><p className="text-xs font-bold">{p.name}</p><p className="text-[10px] text-slate-400">{p.createdAt ? p.createdAt.toDate().toLocaleString('vi-VN') : 'Vừa xong'}</p></div>
                                    {p.uid === user.id && <button onClick={() => eduConfirm('Bài viết sẽ bị xóa vĩnh viễn.', { title: 'Xóa bài viết này?', confirmText: 'Xóa', danger: true }).then((yes) => yes && fbDb.collection('posts').doc(p.id).delete().catch((e) => eduAlert(fbErr(e), 'error')))} className="text-[11px] text-red-500">Xóa</button>}
                                </div>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{p.content}</p>
                                <div className="flex gap-4 text-xs text-slate-500">
                                    <button onClick={() => like(p)} className={(p.likes || []).includes(user.id) ? 'text-red-500 font-bold' : ''}>{(p.likes || []).includes(user.id) ? '❤️' : '🤍'} {(p.likes || []).length} Thích</button>
                                    <button onClick={() => comment(p)}>💬 Bình luận ({(p.comments || []).length})</button>
                                </div>
                                {(p.comments || []).map((c, i) => (<p key={i} className="text-xs bg-slate-50 rounded-lg px-2 py-1"><b>{c.name}:</b> {c.text}</p>))}
                            </div>))}
                        </div>)}
                        {tab === 'chat' && (<div className="flex-1 flex min-h-0">
                            <div className="w-2/5 md:w-1/3 border-r border-slate-100 overflow-y-auto">
                                {[...groupRooms, { id: 'class', name: 'Cả lớp' }, ...others].map((o) => { const l = last[o.id], unread = l && l.from !== user.id; return (
                                    <div key={o.id} onClick={() => setCur(o.id)} className={'flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-slate-50 ' + (cur === o.id ? 'bg-amber-50' : 'hover:bg-slate-50')}>
                                        <img src={o.isGroup ? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(o.g.cls || 'L') + '&length=4&font-size=0.34&background=4361ee&color=fff&bold=true' : o.id === 'class' ? 'https://ui-avatars.com/api/?name=CL&background=f59e0b&color=fff' : avatarUrl(o)} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                        <div className="min-w-0 flex-1"><p className={'text-xs truncate ' + (unread ? 'font-extrabold' : 'font-semibold')}>{o.name}{o.role === 'teacher' ? ' (GV)' : ''}{o.isGroup && o.g.homeroomTeacherUid === user.id ? ' • GVCN' : ''}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{l ? (l.from === user.id ? 'Bạn: ' : '') + l.text : 'Chưa có tin nhắn'}</p></div>
                                        {unread && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                                    </div>); })}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="px-3 py-2 border-b border-slate-100 text-sm font-bold flex items-center justify-between gap-2">
                                    <span className="truncate">💬 {curName}{isHR && <span className="ml-2 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold align-middle">GVCN</span>}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {canClear && <button onClick={clearChat} title="Xóa lịch sử tin nhắn" className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold">🗑️ Xóa lịch sử</button>}
                                        {curGroup && <button onClick={() => setShowGroup(true)} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">⚙️ Quản lý nhóm</button>}
                                    </div>
                                </div>
                                <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
                                    {msgs.length === 0 && <p className="text-xs text-slate-400 text-center">Chưa có tin nhắn.</p>}
                                    {msgs.map((m, i) => {
                                        const mine = m.from === user.id;
                                        const tag = curGroup ? (m.from === curGroup.homeroomTeacherUid ? 'GVCN' : (curGroup.monitorUid && m.from === curGroup.monitorUid) ? 'Lớp Trưởng' : '') : '';
                                        const canDel = !!curGroup && !!m.id && (isHR || mine);   // GVCN xóa mọi tin vi phạm; ai cũng xóa được tin của chính mình
                                        const del = canDel ? <button onClick={() => delMsg(m)} title="Xóa tin nhắn" className="shrink-0 px-1 text-sm opacity-60 hover:opacity-100">🗑️</button> : null;
                                        return (<div key={m.id || i} className={'flex items-center gap-1 ' + (mine ? 'justify-end' : '')}>
                                            {mine && del}
                                            <div className={'max-w-[80%] px-3 py-2 rounded-2xl text-xs break-words ' + (mine ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200')}>
                                                {!mine && (cur === 'class' || curGroup) && <b className="block text-[10px] opacity-70">{m.name}{tag && <span className={'ml-1 px-1.5 py-0.5 rounded-md text-white text-[9px] font-extrabold ' + (tag === 'GVCN' ? 'bg-rose-600' : 'bg-amber-500')}>{tag}</span>}</b>}{m.text}</div>
                                            {!mine && del}
                                        </div>);
                                    })}
                                </div>
                                <div className="flex gap-2 p-2 border-t border-slate-100">
                                    <input id="chat-message" name="message" aria-label="Tin nhắn" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Nhập tin nhắn..." className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                    <button onClick={send} className="px-4 bg-amber-600 text-white text-xs font-bold rounded-xl">Gửi</button>
                                </div>
                            </div>
                        </div>)}
                    </div>
                    {showGroup && curGroup && <GroupSettingsModal group={curGroup} profiles={profiles} user={user} isAdmin={false} onClose={() => setShowGroup(false)} />}
                </div>
            );
        }


        // ===================== PHẦN 4: GIÁO VIÊN - LỊCH ĐIỂM DANH & NỀ NẾP (chỉ ghi nhận NGOẠI LỆ) =====================
        // Mặc định mọi ngày học = "Lớp đủ". Giáo viên chỉ nhấp vào ngày có học sinh đi muộn / vắng -> chọn học sinh + trạng thái + ghi chú -> Lưu.
        // Lưu: attendances/{classId_date} = { classId, date, statuses: {uid: status}, notes: {uid: text}, studentUids: [uid], updatedBy, updatedAt }
        // Đồng thời đồng bộ sang attendance/{uid} (days + notes) để Lịch Chuyên cần của Phụ huynh / Học sinh hiện ngay (cổng Phụ huynh chỉ đọc được đúng document của 1 học sinh).
        const ATT_EXC = [['late', 'Đi muộn'], ['excused', 'Vắng có phép'], ['unexcused', 'Vắng không phép']];

        function TeacherAttendanceImpl({ user, classStudents, classList, onClose }) {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const todayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
            const [cls, setCls] = useState(classList[0] || '');
            const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
            const [byDate, setByDate] = useState({});        // 'YYYY-MM-DD' -> dữ liệu attendances của lớp trong tháng đang xem
            const [loadErr, setLoadErr] = useState('');
            const [sel, setSel] = useState('');              // ngày đang chọn
            const [draft, setDraft] = useState({});          // uid -> { status, note } của ngày đang chọn (chưa lưu)
            const [pickUid, setPickUid] = useState('');
            const [pickSt, setPickSt] = useState('late');
            const [pickNote, setPickNote] = useState('');
            const [busy, setBusy] = useState(false);
            const [dayOff, setDayOff] = useState(false);   // ngày đang chọn có phải NGÀY NGHỈ (isDayOff) không

            // Khóa cuộn nền khi mở Modal -> tránh scrollbar kép trên điện thoại
            useEffect(() => { const o = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = o; }; }, []);

            // classId = <tên trường rút gọn>-<lớp>; chỉ gồm a-z 0-9 và dấu '-'
            const slug = (s) => normSchool(s).replace(/\s+/g, '-');
            const classId = cls ? (slug(user.school) + '-' + slug(cls)).slice(0, 120) : '';
            const students = classStudents.filter((s) => s.class === cls).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
            const nameOf = (uid) => { const s = classStudents.find((x) => x.id === uid); return s ? s.name : 'Học sinh (đã rời lớp)'; };
            const keyOf = (d) => ym.y + '-' + pad(ym.m + 1) + '-' + pad(d);

            // Nghe dữ liệu của lớp trong tháng (khoảng documentId -> không cần index phức hợp)
            useEffect(() => {
                setByDate({}); setLoadErr('');
                if (!classId) return;
                const A = firebase.firestore.FieldPath.documentId();
                const lo = classId + '_' + ym.y + '-' + pad(ym.m + 1) + '-01', hi = classId + '_' + ym.y + '-' + pad(ym.m + 1) + '-31';
                return fbDb.collection('attendances').where(A, '>=', lo).where(A, '<=', hi).onSnapshot((s) => {
                    const m = {}; s.forEach((d) => { const x = d.data(); if (x && x.date) m[x.date] = x; }); setByDate(m);
                }, (e) => setLoadErr(fbErr(e)));
            }, [classId, ym.y, ym.m]);

            const openDay = (k) => {
                const cur = byDate[k] || {}, d = {};
                Object.keys(cur.statuses || {}).forEach((uid) => { d[uid] = { status: cur.statuses[uid], note: (cur.notes || {})[uid] || '' }; });
                setSel(k); setDraft(d); setDayOff(!!cur.isDayOff); setPickUid(''); setPickSt('late'); setPickNote('');
            };
            const changeClass = (v) => { setCls(v); setSel(''); setDraft({}); setDayOff(false); };
            const go = (delta) => { setSel(''); setDraft({}); setDayOff(false); setYm((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; }); };

            const addEntry = () => {
                if (!pickUid) { eduAlert('Hãy chọn học sinh.', 'warning'); return; }
                setDraft((d) => ({ ...d, [pickUid]: { status: pickSt, note: pickNote.trim().slice(0, 120) } }));
                setPickUid(''); setPickNote('');
            };
            const removeEntry = (uid) => setDraft((d) => { const n = { ...d }; delete n[uid]; return n; });

            const save = async () => {
                if (busy || !sel || !classId) return;
                const prev = byDate[sel] || null;
                const prevAll = [...Object.keys((prev && prev.statuses) || {}), ...((prev && prev.isDayOff && prev.studentUids) || [])];
                const statuses = {}, notes = {};
                let uids = [], toSync;
                if (dayOff) {
                    // NGÀY NGHỈ: bỏ qua danh sách vắng/muộn, đánh dấu cả lớp nghỉ
                    uids = students.map((s) => s.id);
                    toSync = [...new Set(uids.concat(prevAll))];
                } else {
                    Object.keys(draft).forEach((uid) => { statuses[uid] = draft[uid].status; const n = String(draft[uid].note || '').trim().slice(0, 120); if (n) notes[uid] = n; });
                    uids = Object.keys(statuses);
                    toSync = [...new Set(uids.concat(prevAll))];
                }
                setBusy(true);
                try {
                    const ref = fbDb.collection('attendances').doc(classId + '_' + sel);
                    if (dayOff) await ref.set({ classId, date: sel, isDayOff: true, statuses: {}, notes: {}, studentUids: uids, updatedBy: user.id, updatedAt: fbNow() });
                    else if (!uids.length) { if (prev) await ref.delete(); }
                    else await ref.set({ classId, date: sel, statuses, notes, studentUids: uids, updatedBy: user.id, updatedAt: fbNow() });
                    // Đồng bộ sang attendance/{uid}: chia nhóm nhỏ (rules giới hạn số lần truy cập tài liệu mỗi batch)
                    const DEL = firebase.firestore.FieldValue.delete();
                    let syncFail = false;
                    for (let i = 0; i < toSync.length; i += 8) {
                        const b = fbDb.batch();
                        toSync.slice(i, i + 8).forEach((uid) => {
                            const val = dayOff ? (uids.indexOf(uid) >= 0 ? 'dayoff' : DEL) : (statuses[uid] || DEL);
                            b.set(fbDb.collection('attendance').doc(uid), {
                                days: { [sel]: val },
                                notes: { [sel]: dayOff ? DEL : (notes[uid] || DEL) },
                                updatedBy: user.id, updatedAt: fbNow()
                            }, { merge: true });
                        });
                        try { await b.commit(); } catch (e) { syncFail = true; console.error('Đồng bộ lịch chuyên cần lỗi:', e); }
                    }
                    const dTxt = sel.split('-').reverse().join('/');
                    if (syncFail) eduAlert('Đã lưu điểm danh của lớp nhưng chưa đồng bộ hết sang lịch của phụ huynh. Hãy bấm "Lưu điểm danh" lần nữa.', 'warning');
                    else if (dayOff) eduAlert('Đã đánh dấu ngày ' + dTxt + ' là NGÀY NGHỈ của lớp ' + cls + '. Phụ huynh sẽ thấy ngày này màu tím.', 'success');
                    else eduAlert(uids.length ? 'Đã lưu điểm danh ngày ' + dTxt + ' (' + uids.length + ' học sinh có ghi nhận).' : 'Ngày ' + dTxt + ': Lớp đủ.', 'success');
                    setSel(''); setDraft({}); setDayOff(false);
                } catch (e) { eduAlert(fbErr(e), 'error'); }
                setBusy(false);
            };

            const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;   // Thứ Hai là cột đầu tiên
            const dim = new Date(ym.y, ym.m + 1, 0).getDate();
            const cells = []; for (let i = 0; i < lead; i++) cells.push(null); for (let d = 1; d <= dim; d++) cells.push(d); while (cells.length % 7) cells.push(null);
            const free = students.filter((s) => !draft[s.id]);
            const monthTotals = { late: 0, excused: 0, unexcused: 0, off: 0 };
            Object.keys(byDate).forEach((k) => { if (byDate[k].isDayOff) { monthTotals.off++; return; } Object.values(byDate[k].statuses || {}).forEach((st) => { if (monthTotals[st] !== undefined) monthTotals[st]++; }); });

            return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
                    <div className="bg-white w-[95%] max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl shadow-2xl p-4 space-y-2.5 sm:space-y-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">📅 Lịch Điểm Danh &amp; Nề Nếp</h3>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug">Mặc định mọi ngày là <b>Lớp đủ</b>. Chỉ nhấp vào ngày có học sinh đi muộn / vắng để ghi nhận.</p>
                            </div>
                            <button type="button" onClick={onClose} aria-label="Đóng" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
                        </div>

                        {classList.length === 0 ? <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 text-center">Chưa có lớp nào (học sinh cùng trường chưa khai báo lớp).</p> : <>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-500 shrink-0">Lớp</label>
                                <select id="attendance-class" name="className" aria-label="Lớp" value={cls} onChange={(e) => changeClass(e.target.value)} className="flex-1 min-w-0 border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-white">
                                    {classList.map((c) => <option key={c} value={c}>{c} ({classStudents.filter((s) => s.class === c).length} HS)</option>)}
                                </select>
                            </div>

                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => go(-1)} aria-label="Tháng trước" className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">‹</button>
                                <p className="text-sm font-bold text-slate-800">Tháng {ym.m + 1}/{ym.y}</p>
                                <button type="button" onClick={() => go(1)} aria-label="Tháng sau" className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">›</button>
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => <div key={w} className="text-[10px] font-bold text-slate-400">{w}</div>)}
                                {cells.map((d, i) => {
                                    if (d === null) return <div key={i} />;
                                    const k = keyOf(d), rec = byDate[k], n = rec ? Object.keys(rec.statuses || {}).length : 0;
                                    const isSun = new Date(ym.y, ym.m, d).getDay() === 0;
                                    const past = k <= todayKey && !isSun;
                                    const isOff = !!(rec && rec.isDayOff);
                                    const cn = isOff ? 'bg-purple-100 text-purple-700 border border-purple-300' : n > 0 ? 'bg-amber-100 text-amber-800' : past ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400';
                                    return (
                                        <button type="button" key={i} onClick={() => openDay(k)} title={isOff ? 'Ngày nghỉ' : n > 0 ? n + ' học sinh có ghi nhận' : 'Lớp đủ'}
                                            className={'relative w-full h-9 sm:h-11 p-1 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center ' + cn + (k === todayKey ? ' ring-2 ring-indigo-500' : '') + (k === sel ? ' outline outline-2 outline-orange-500' : '')}>
                                            {d}{!isOff && n > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] leading-[14px] font-bold">{n}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                                <span><i className="w-2 h-2 rounded-full inline-block bg-emerald-400 mr-1" />Lớp đủ (mặc định)</span>
                                <span><i className="w-2 h-2 rounded-full inline-block bg-amber-400 mr-1" />Có học sinh đi muộn / vắng</span>
                                <span><i className="w-2 h-2 rounded-full inline-block bg-purple-400 mr-1" />Ngày nghỉ</span>
                                <span className="w-full text-right">Tháng này: muộn {monthTotals.late} • có phép {monthTotals.excused} • không phép {monthTotals.unexcused} • nghỉ {monthTotals.off}</span>
                            </div>
                            {loadErr && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{loadErr}</p>}

                            {sel && (
                                <div className={'border rounded-2xl p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 ' + (dayOff ? 'border-purple-200 bg-purple-50/50' : 'border-orange-200 bg-orange-50/40')}>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="min-w-0 text-xs sm:text-sm font-bold text-slate-800 leading-snug">Ngày {sel.split('-').reverse().join('/')} • Lớp {cls}</p>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className={'text-[11px] font-bold leading-tight text-right ' + (dayOff ? 'text-purple-700' : 'text-slate-500')}>Ngày nghỉ<span className="block font-medium text-[10px] opacity-80">Không đi học</span></span>
                                            <button type="button" role="switch" aria-checked={dayOff} aria-label="Ngày nghỉ / Không đi học" disabled={busy} onClick={() => setDayOff((v) => !v)}
                                                className={'relative w-10 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ' + (dayOff ? 'bg-purple-500' : 'bg-slate-300')}>
                                                <span className={'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ' + (dayOff ? 'translate-x-4' : 'translate-x-0')} />
                                            </button>
                                        </div>
                                    </div>

                                    {dayOff
                                        ? <div className="text-xs text-purple-700 bg-purple-100 border border-purple-200 rounded-lg p-2.5 font-semibold leading-snug">🏖️ Ngày nghỉ — lớp không đi học. Danh sách vắng / đi muộn của ngày này đã được khóa. Phụ huynh sẽ thấy ngày này màu tím trong Báo cáo.</div>
                                        : <>
                                    {Object.keys(draft).length === 0
                                        ? <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 font-semibold">✔ Lớp đủ — chưa có học sinh nào đi muộn / vắng.</p>
                                        : <div className="space-y-1.5">{Object.keys(draft).map((uid) => (
                                            <div key={uid} className="flex items-start gap-2 bg-white rounded-xl border border-slate-100 p-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{nameOf(uid)}</p>
                                                    <span className={'inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ' + ATT_STATUS[draft[uid].status].cell}>{ATT_STATUS[draft[uid].status].label}</span>
                                                    {draft[uid].note ? <p className="text-xs text-slate-500 mt-0.5 break-words">📝 {draft[uid].note}</p> : null}
                                                </div>
                                                <button type="button" onClick={() => removeEntry(uid)} aria-label="Bỏ ghi nhận" className="shrink-0 text-red-500 text-sm px-1">🗑</button>
                                            </div>))}</div>}

                                    <div className="space-y-2 bg-white rounded-xl border border-slate-100 p-2 sm:p-2.5">
                                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Thêm học sinh đi muộn / vắng</p>
                                        <select id="attendance-student" name="studentUid" aria-label="Học sinh đi muộn / vắng" value={pickUid} onChange={(e) => setPickUid(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-white">
                                            <option value="">— Chọn học sinh —</option>
                                            {free.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <div className="grid grid-cols-3 gap-1">
                                            {ATT_EXC.map(([k, l]) => (
                                                <button type="button" key={k} onClick={() => setPickSt(k)} className={'rounded-lg py-1.5 px-0.5 text-[10px] sm:text-[11px] font-bold leading-tight border ' + (pickSt === k ? ATT_STATUS[k].cell + ' border-current' : 'bg-white text-slate-500 border-slate-200')}>{l}</button>
                                            ))}
                                        </div>
                                        <input id="attendance-note" name="note" aria-label="Ghi chú" value={pickNote} onChange={(e) => setPickNote(e.target.value)} maxLength={120} placeholder="Ghi chú ngắn (vd: ốm, xin phép, đến lúc 7h20)" className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm" />
                                        <button type="button" onClick={addEntry} disabled={!pickUid} className="w-full min-h-[40px] bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl disabled:opacity-40">＋ Thêm vào danh sách</button>
                                    </div>
                                        </>}

                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => { setSel(''); setDraft({}); setDayOff(false); }} disabled={busy} className="min-h-[40px] bg-white border border-slate-200 text-slate-600 text-xs sm:text-sm font-semibold rounded-xl">Hủy</button>
                                        <button type="button" onClick={save} disabled={busy} className={'min-h-[40px] text-white text-xs sm:text-sm font-semibold rounded-xl shadow disabled:opacity-60 ' + (dayOff ? 'bg-purple-600' : 'bg-orange-500')}>{busy ? 'Đang lưu...' : (dayOff ? 'Lưu ngày nghỉ' : 'Lưu điểm danh')}</button>
                                    </div>
                                </div>
                            )}
                        </>}
                    </div>
                </div>
            );
        }


        // ===================== GIÁO VIÊN: QUẢN LÝ & SỬA ĐIỂM THEO LỚP =====================
        // Chọn Lớp -> chọn Học sinh trong lớp (dropdown, lấy từ hồ sơ học sinh trên Firestore, KHÔNG cần nhập email)
        // -> hiện các bài đã nộp + điểm hiện tại -> nhập lại điểm (thang 0 - 100) + nhận xét -> ghi thẳng vào collection "submissions".
        // Firestore rules: chỉ giáo viên ĐÃ ĐĂNG bài tập đó mới sửa được bài nộp của bài tập đó (các bài khác chỉ xem).
        function TeacherScoreManagerImpl({ user, classStudents, classList, assignments, subsAll }) {
            const [cls, setCls] = useState('');
            const [stuId, setStuId] = useState('');
            const [inputs, setInputs] = useState({});     // hwId -> điểm mới (chuỗi)
            const [notes, setNotes] = useState({});       // hwId -> nhận xét mới
            const [savingId, setSavingId] = useState('');
            const [stSubs, setStSubs] = useState([]);
            const [reload, setReload] = useState(0);
            useEffect(() => {
                if (!stuId) { setStSubs([]); return; }
                let dead = false;
                fbDb.collection('submissions').where('uid', '==', stuId).get().then((s) => { if (!dead) setStSubs(s.docs.map((d) => d.data())); }).catch(() => {});
                return () => { dead = true; };
            }, [stuId, reload]);

            const hasNoClass = classStudents.some((s) => s.class === '?');
            const classOptions = hasNoClass ? [...classList, '?'] : classList;
            const studentsOfClass = cls
                ? classStudents.filter((s) => s.class === cls).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'))
                : [];
            const student = studentsOfClass.find((s) => s.id === stuId) || null;

            const hwById = {}; assignments.forEach((a) => { hwById[a.id] = a; });
            const ms = (s) => { const t = s.submittedAt || s.createdAt; return t && typeof t.toMillis === 'function' ? t.toMillis() : 0; };
            const allSubs = student ? stSubs : [];
            // Quyền riêng: chỉ hiện bài nộp thuộc đề do CHÍNH giáo viên này đăng
            const rows = allSubs.map((s) => ({ hwId: s.hwId, hw: hwById[s.hwId] || null, sub: s })).filter((r) => r.hw && r.hw.teacherId === user.id).sort((a, b) => ms(b.sub) - ms(a.sub));
            const totalXp = allSubs.reduce((t, s) => t + subXp(s), 0);   // tổng XP thật của học sinh (mọi bài) để tính lại khi sửa

            const tsText = (t) => { try { const d = t && typeof t.toDate === 'function' ? t.toDate() : null; return d ? d.toLocaleString('vi-VN') : '-'; } catch (e) { return '-'; } };
            const statusOf = (s) => (s.adminEdited && s.graded) ? ['Admin đã sửa', 'bg-violet-50 text-violet-700']
                : s.status === 'timeout' ? ['Quá hạn (0đ)', 'bg-red-50 text-red-600']
                : s.graded ? ['Đã chấm / đã sửa', 'bg-emerald-50 text-emerald-700']
                : s.status === 'submitted' ? ['Chờ chấm', 'bg-amber-50 text-amber-700']
                : ['Đã nộp (trắc nghiệm)', 'bg-indigo-50 text-indigo-700'];
            const scoreOf = (s) => (s.adminEdited && s.graded) || (s.graded && s.status !== 'timeout') ? Math.round(clampScore(s.score) * 100) / 100 + '/100'
                : s.status === 'timeout' ? '0/100'
                : s.status === 'submitted' ? 'Chưa chấm'
                : (s.score + '/' + s.total + (Number(s.total) === 100 ? '' : ' (≈ ' + Math.round(clampScore((Number(s.score) || 0) / (s.total || 1) * 100)) + '/100)'));

            const pickClass = (v) => { setCls(v); setStuId(''); setInputs({}); setNotes({}); };
            const pickStudent = (v) => { setStuId(v); setInputs({}); setNotes({}); };

            const save = async (r) => {
                if (savingId || !student) return;
                const s = r.sub;
                const raw = String(inputs[r.hwId] === undefined ? '' : inputs[r.hwId]).trim().replace(',', '.');
                if (raw === '') { eduAlert('Vui lòng nhập điểm mới từ 0 đến 100.', 'warning'); return; }
                if (!/^\d+(\.\d{1,2})?$/.test(raw)) { eduAlert('Điểm phải là số không âm (tối đa 2 chữ số thập phân).', 'warning'); return; }
                const numericScore = Number(raw);
                if (numericScore > 100) { eduAlert('Điểm tối đa là 100.', 'warning'); return; }
                const newScore = Math.round(Math.min(100, Math.max(0, numericScore)) * 100) / 100;
                if (s.status === 'timeout' && newScore !== 0) { eduAlert('Bài nộp quá hạn chỉ có thể ghi 0 điểm.', 'warning'); return; }
                const note = String(notes[r.hwId] === undefined ? (s.feedback || '') : notes[r.hwId]).trim().slice(0, 1000);
                const isEssayKind = !!(r.hw && (r.hw.type === 'essay' || r.hw.type === 'mixed'));
                const newQuizXp = (r.hw && r.hw.type === 'mixed') ? quizXpOf(s.mcqScore !== undefined ? s.mcqScore : s.score) : (isEssayKind ? 0 : Math.round(newScore));   // TN trong bài hỗn hợp: đúng x 5
                const newEssayXp = isEssayKind ? essayXpOf(newScore) : 0;                                                                                        // tự luận: XP = điểm GV chấm
                const oldXp = subXp(s), newXp = newQuizXp + newEssayXp;
                const newTotalXp = totalXp - oldXp + newXp;
                const yes = await eduConfirm('Bài "' + (r.hw ? r.hw.title : r.hwId) + '" của ' + student.name + ':\nĐiểm ' + scoreOf(s) + ' → ' + newScore + '/100\nTổng XP: ' + totalXp + ' → ' + newTotalXp + ' XP', { title: 'Cập nhật điểm?', confirmText: 'Cập nhật', cancelText: 'Hủy', icon: 'question' });
                if (!yes) return;
                setSavingId(r.hwId);
                try {
                    await fbDb.collection('submissions').doc(r.hwId + '_' + student.id).update({
                        score: newScore, feedback: note, graded: true, gradedAt: fbNow(), gradedBy: user.id,
                        quizXp: newQuizXp, essayXp: newEssayXp, totalXp: newXp,                       // totalXp = quizXp + essayXp
                        ...(s.mcqScore === undefined && !s.graded && s.status !== 'timeout' && !(r.hw && r.hw.type === 'essay') ? { mcqScore: s.score } : {}),   // giữ lại điểm trắc nghiệm tự chấm gốc
                        ...(s.autoZero ? { autoZero: false } : {})
                    });
                    bxhBumpXp(student.id, newXp - oldXp);              // phản chiếu chênh lệch XP vào bxh/summary
                    setReload((n) => n + 1);                           // tải lại bài nộp của học sinh
                    setInputs((m) => { const n = { ...m }; delete n[r.hwId]; return n; });
                    setNotes((m) => { const n = { ...m }; delete n[r.hwId]; return n; });
                    eduToast('Đã cập nhật: ' + newScore + ' điểm = ' + newXp + ' XP', 'success');   // danh sách tự làm mới nhờ onSnapshot
                } catch (e) { eduAlert(e && e.code === 'permission-denied' ? 'Không có quyền sửa bài này (chỉ giáo viên đăng bài tập mới sửa được). Hãy chắc chắn đã Publish firestore.rules mới.' : fbErr(e), 'error'); }
                setSavingId('');
            };

            const selCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400';
            return (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Icon name="clipboard-edit" className="w-4 h-4 text-indigo-600" /> Quản lý &amp; Sửa điểm học sinh</h3>
                            <p className="text-[11px] text-slate-500 mt-1">Chọn lớp, chọn học sinh trong lớp để xem các bài đã nộp và nhập lại điểm (thang 0 - 100). XP: <b>trắc nghiệm đúng 1 câu = 5 XP</b>, <b>tự luận 1 điểm = 1 XP</b>. Ví dụ: đặt về 0 điểm nếu phát hiện gian lận.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="block min-w-0">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Lớp</span>
                                <select id="grade-class" name="className" value={cls} onChange={(e) => pickClass(e.target.value)} className={selCls + ' mt-1'}>
                                    <option value="">-- Chọn lớp --</option>
                                    {classOptions.map((c) => <option key={c} value={c}>{c === '?' ? 'Chưa cập nhật lớp' : 'Lớp ' + c}</option>)}
                                </select>
                            </label>
                            <label className="block min-w-0">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Học sinh</span>
                                <select id="grade-student" name="studentId" value={stuId} onChange={(e) => pickStudent(e.target.value)} disabled={!cls} className={selCls + ' mt-1'}>
                                    <option value="">{cls ? '-- Chọn học sinh (' + studentsOfClass.length + ') --' : '-- Chọn lớp trước --'}</option>
                                    {studentsOfClass.map((s) => <option key={s.id} value={s.id}>{s.name || 'Học sinh'}</option>)}
                                </select>
                            </label>
                        </div>
                        {classOptions.length === 0 && <p className="text-xs text-slate-400">Chưa có học sinh nào cùng trường với bạn.</p>}
                    </div>

                    {student && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{student.name}<span className="ml-1 text-xs font-semibold text-slate-400">• {student.class === '?' ? 'Chưa có lớp' : 'Lớp ' + student.class}</span></p>
                                    <p className="text-xs text-slate-500">Đã nộp {rows.length} bài tập của bạn</p>
                                </div>
                                <div className="text-right"><p className="text-[10px] text-slate-400 uppercase font-bold">Tổng XP</p><p className="text-xl font-black text-orange-600">{totalXp} XP</p></div>
                            </div>
                            {rows.length === 0 && <p className="text-xs text-slate-400">Học sinh này chưa nộp bài nào trong các bài tập của bạn.</p>}
                            {rows.map((r) => {
                                const s = r.sub, [lb, bcls] = statusOf(s), busy = savingId === r.hwId;
                                const editable = !!r.hw && r.hw.teacherId === user.id;
                                const scoreVal = inputs[r.hwId] === undefined ? '' : inputs[r.hwId];
                                const noteVal = notes[r.hwId] === undefined ? (s.feedback || '') : notes[r.hwId];
                                return (
                                    <div key={r.hwId} className="border border-slate-100 rounded-xl p-3 space-y-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm break-words">{r.hw ? r.hw.title : 'Bài tập đã bị xóa'}</p>
                                                <p className="text-[11px] text-slate-400">Nộp lúc {tsText(s.submittedAt || s.createdAt)}</p>
                                            </div>
                                            <span className={'shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ' + bcls}>{lb}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 text-xs">
                                            <span className="text-slate-500">Điểm hiện tại</span>
                                            <b className="text-slate-800">{scoreOf(s)}<span className="ml-2 text-orange-600">{subXp(s)} XP</span></b>
                                        </div>
                                        {s.feedback ? <p className="text-[11px] text-slate-500 break-words">Nhận xét hiện tại: {s.feedback}</p> : null}
                                        {editable ? (
                                            <div className="space-y-2">
                                                <div className="flex gap-2 items-center">
                                                    <input id={`grade-score-${r.hwId}`} name={`score-${r.hwId}`} aria-label="Điểm mới" type="number" inputMode="decimal" min="0" max="100" step="0.25" value={scoreVal} disabled={busy}
                                                        onChange={(e) => setInputs((m) => ({ ...m, [r.hwId]: e.target.value }))} placeholder="Điểm mới (0 - 100)"
                                                        className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" />
                                                    <button type="button" disabled={busy} onClick={() => setInputs((m) => ({ ...m, [r.hwId]: '0' }))}
                                                        className="shrink-0 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl disabled:opacity-50">Về 0 điểm</button>
                                                </div>
                                                <textarea id={`grade-note-${r.hwId}`} name={`note-${r.hwId}`} aria-label="Nhận xét / lý do sửa điểm" rows={2} maxLength={1000} value={noteVal} disabled={busy}
                                                    onChange={(e) => setNotes((m) => ({ ...m, [r.hwId]: e.target.value }))} placeholder="Nhận xét / lý do sửa điểm (VD: Phát hiện gian lận)"
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" />
                                                <button type="button" onClick={() => save(r)} disabled={!!savingId || String(scoreVal).trim() === ''}
                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"><Icon name="save" className="w-4 h-4" />{busy ? 'Đang lưu...' : 'Lưu điểm & nhận xét'}</button>
                                            </div>
                                        ) : (
                                            <p className="text-[11px] italic text-slate-400">{r.hw ? 'Bài này do giáo viên khác đăng nên bạn chỉ xem được.' : 'Bài tập đã bị xóa nên không thể sửa điểm.'}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }



        // ===================== GVCN / GVBM: phân công giáo viên bộ môn theo lớp =====================
        // Firestore: classes/{gid}  (gid = id nhóm lớp 'lop-<trường>--<lớp>', trùng groups/{gid})
        //   { gvcnUid, cls, schoolId, gvbmUids: [uid...], updatedAt }   — GVCN = groups/{gid}.homeroomTeacherUid (Admin gán)
        const normCls = (c) => String(c || '').trim().toUpperCase();


        function Modal({ title, onClose, children }) {
            return (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-3" onClick={onClose}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-slate-800 text-base break-words min-w-0">{title}</h3>
                            <button type="button" onClick={onClose} className="shrink-0 w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold" aria-label="Đóng">✕</button>
                        </div>
                        {children}
                    </div>
                </div>
            );
        }


        // Modal "Quản lý Giáo viên Bộ môn" + modal chọn giáo viên cùng trường để thêm
        // - Danh sách gợi ý (candidates) CHỈ gồm GV cùng trường và isPrivate !== true (đã lọc ở schoolTeachers).
        // - Ô nhập Email: tìm đúng tài khoản GV (role 'teacher', đã duyệt) và thêm làm GVBM, kể cả khi GV đó bật isPrivate.
        function GvbmManagerImpl({ cls, classDoc, user, teachers, allTeachers, onClose }) {
            const [picker, setPicker] = useState(false);
            const [busy, setBusy] = useState('');
            const [email, setEmail] = useState('');
            const [extra, setExtra] = useState({});   // GV vừa thêm qua email (phòng khi chưa có trong profiles)
            const ids = ((classDoc && classDoc.gvbmUids) || []).filter((x) => x !== user.id);
            const byId = { ...extra };
            (teachers || []).forEach((t) => { byId[t.id] = t; });
            (allTeachers || []).forEach((t) => { byId[t.id] = { id: t.id, name: t.name || 'Giáo viên', subject: t.subject || '' }; });   // gồm cả GV đang ẩn thông tin => vẫn hiện đúng tên/môn trong danh sách GVBM
            const docRef = fbDb.collection('classes').doc(cls.gid);
            const FV = firebase.firestore.FieldValue;
            const base = { gvcnUid: user.id, cls: cls.name, schoolId: cls.schoolId || '', updatedAt: FV.serverTimestamp() };
            const saveGvbm = async (t) => {   // ghi Firestore (ném lỗi lên cho nơi gọi xử lý)
                await docRef.set({ ...base, gvbmUids: FV.arrayUnion(t.id) }, { merge: true });   // merge: giữ nguyên mọi dữ liệu khác
                fbDb.collection('groups').doc(cls.gid).update({ members: FV.arrayUnion(t.id) }).catch(() => {});   // best-effort: cho GVBM vào nhóm chat lớp
                eduToast('Đã thêm ' + t.name + ' vào lớp ' + cls.name, 'success');
            };
            const add = async (t) => {   // thêm từ danh sách gợi ý
                if (busy) return; setBusy(t.id);
                try { await saveGvbm(t); setPicker(false); }
                catch (e) { eduAlert(fbErr(e), 'error'); } finally { setBusy(''); }
            };
            const addByEmail = async () => {   // thêm trực tiếp bằng email (không phụ thuộc isPrivate)
                if (busy) return;
                const mail = email.trim().toLowerCase();
                if (!mail) { eduAlert('Vui lòng nhập email của giáo viên.', 'error'); return; }
                setBusy('email');
                try {
                    // role + status + limit(1) bắt buộc để khớp firestore.rules (users: allow list)
                    const q = (m) => fbDb.collection('users').where('email', '==', m).where('role', '==', 'teacher').where('status', '==', 'approved').limit(1).get();
                    let snap = await q(mail);
                    const raw = email.trim();
                    if (snap.empty && raw !== mail) snap = await q(raw);   // email lưu có chữ hoa
                    if (snap.empty) { eduAlert('Không tìm thấy tài khoản Giáo viên nào với email này!', 'error'); return; }
                    const d = snap.docs[0]; const u = d.data() || {};
                    if (u.role !== 'teacher') { eduAlert('Không tìm thấy tài khoản Giáo viên nào với email này!', 'error'); return; }
                    if (d.id === user.id) { eduAlert('Bạn là giáo viên chủ nhiệm của lớp này rồi.', 'error'); return; }
                    if (ids.includes(d.id)) { eduAlert('Giáo viên này đã là giáo viên bộ môn của lớp ' + cls.name + '.', 'error'); return; }
                    const known = byId[d.id] || {};
                    const t = { id: d.id, name: known.name || u.name || 'Giáo viên', subject: known.subject || u.subject || '' };
                    await saveGvbm(t);
                    setExtra((x) => ({ ...x, [t.id]: t })); setEmail(''); setPicker(false);
                } catch (e) { eduAlert(fbErr(e), 'error'); } finally { setBusy(''); }
            };
            const remove = async (uid) => {
                const t = byId[uid] || {};
                const yes = await eduConfirm('Giáo viên này sẽ không còn thấy lớp ' + cls.name + ' trong danh sách của họ.', { title: 'Gỡ ' + (t.name || 'giáo viên') + '?', confirmText: 'Gỡ', danger: true });
                if (!yes) return;
                try { await docRef.set({ ...base, gvbmUids: FV.arrayRemove(uid) }, { merge: true }); }
                catch (e) { eduAlert(fbErr(e), 'error'); }
            };
            const candidates = teachers.filter((t) => t.id !== user.id && !ids.includes(t.id));   // teachers đã loại isPrivate === true
            return (
                <>
                    <Modal title={'Giáo viên Bộ môn — lớp ' + cls.name} onClose={onClose}>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-800 truncate">{user.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{user.subject || 'Chưa chọn môn'}</div>
                                </div>
                                <span className="text-[11px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">GVCN</span>
                            </div>
                            {ids.map((uid) => { const t = byId[uid] || { name: 'Giáo viên', subject: '' }; return (
                                <div key={uid} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-slate-800 truncate">{t.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{t.subject || 'Chưa chọn môn'}</div>
                                    </div>
                                    <button type="button" onClick={() => remove(uid)} className="shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">Gỡ</button>
                                </div>); })}
                            {ids.length === 0 && <p className="text-xs text-slate-400 text-center py-1">Chưa có giáo viên bộ môn nào khác được thêm.</p>}
                        </div>
                        <button type="button" onClick={() => setPicker(true)} className="touch w-full bg-orange-500 text-white font-semibold rounded-xl">+ Thêm Giáo viên Bộ môn</button>
                    </Modal>
                    {picker && (
                        <Modal title="Chọn giáo viên cùng trường" onClose={() => setPicker(false)}>
                            {/* Thêm trực tiếp bằng Email (kể cả giáo viên đang ẩn thông tin) */}
                            <div className="bg-orange-50 rounded-xl p-3 space-y-2">
                                <p className="text-xs font-semibold text-slate-700">Thêm trực tiếp bằng Email</p>
                                <div className="flex gap-2">
                                    <input id="teacher-email" name="teacherEmail" aria-label="Email giáo viên" type="email" value={email} disabled={!!busy} autoComplete="off"
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByEmail(); } }}
                                        placeholder="Nhập chính xác Email của giáo viên..."
                                        className="min-w-0 flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-50" />
                                    <button type="button" disabled={!!busy || !email.trim()} onClick={addByEmail}
                                        className="shrink-0 bg-orange-500 text-white text-sm font-semibold px-3 rounded-xl disabled:opacity-50">
                                        {busy === 'email' ? 'Đang tìm...' : 'Thêm qua Email'}
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pt-1">Hoặc chọn từ danh sách cùng trường</p>
                            {candidates.length === 0 && <p className="text-sm text-slate-500 text-center py-3">Không có giáo viên nào cùng trường để gợi ý. Hãy nhập email của giáo viên ở trên.</p>}
                            <div className="space-y-2">
                                {candidates.map((t) => (
                                    <button key={t.id} type="button" disabled={!!busy} onClick={() => add(t)} className="w-full text-left bg-slate-50 hover:bg-orange-50 rounded-xl p-3 disabled:opacity-50">
                                        <div className="font-semibold text-slate-800 truncate">{t.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{t.subject || 'Chưa chọn môn'}</div>
                                    </button>
                                ))}
                            </div>
                        </Modal>
                    )}
                </>
            );
        }


        // Tab Quản lý Lớp học: gom theo lớp (accordion, mặc định thu gọn)
        function TeacherClassListImpl({ user, classStudents, hrClasses, assignedClasses, classDocs, teachers, allTeachers, onAttendance, onEvaluate, onChat }) {
            const [open, setOpen] = useState({});
            const [gvbmFor, setGvbmFor] = useState(null);
            const rows = [];
            const seen = new Set();
            hrClasses.forEach((c) => { if (!seen.has(c.name)) { seen.add(c.name); rows.push({ ...c, hr: true }); } });
            assignedClasses.forEach((c) => { if (!seen.has(c.name)) { seen.add(c.name); rows.push({ ...c, hr: false }); } });
            rows.sort((a, b) => (b.hr - a.hr) || a.name.localeCompare(b.name, 'vi', { numeric: true }));
            const total = rows.reduce((n, r) => n + classStudents.filter((s) => s.class === r.name).length, 0);
            return (
                <div className="space-y-3">
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-slate-800 leading-snug break-words">Danh Sách Lớp Học ({rows.length} lớp • {total} học sinh)</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Nhấn vào một lớp để xem danh sách học sinh</p>
                    </div>
                    {rows.length === 0 && (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Bạn chưa được phân công lớp nào. Lớp sẽ hiện ở đây khi Admin hoặc giáo viên chủ nhiệm phân công bạn.</div>
                    )}
                    {rows.map((r) => {
                        const sts = classStudents.filter((s) => s.class === r.name);
                        const isOpen = !!open[r.name];
                        return (
                            <div key={r.name} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-w-0 max-w-full">
                                <button type="button" onClick={() => setOpen({ ...open, [r.name]: !isOpen })} aria-expanded={isOpen} className="w-full flex items-center gap-3 p-3 sm:p-4 text-left">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0">{r.name}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-800 truncate">Lớp {r.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{sts.length} học sinh{r.hr ? '' : ' • Môn ' + (user.subject || '')}</div>
                                    </div>
                                    {r.hr && <span className="text-[11px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0">GVCN</span>}
                                    <span className={'text-slate-400 transition-transform shrink-0 ' + (isOpen ? 'rotate-180' : '')}>▾</span>
                                </button>
                                {isOpen && (
                                    <div className="border-t border-slate-100 p-3 sm:p-4 space-y-3">
                                        {r.hr && (
                                            <div className="flex flex-col gap-2">
                                                <button type="button" onClick={() => setGvbmFor(r)} className="touch w-full bg-white text-blue-700 border border-blue-300 text-sm font-semibold px-3 rounded-xl">Quản lý Giáo viên Bộ môn</button>
                                                <button type="button" onClick={() => onAttendance(r.name)} className="touch w-full bg-white text-orange-700 border border-orange-300 text-sm font-semibold px-3 rounded-xl"><TdIc n="cal" /> Điểm danh</button>
                                            </div>
                                        )}
                                        {sts.length === 0 && <p className="text-sm text-slate-500 text-center py-2">Lớp này chưa có học sinh nào.</p>}
                                        {sts.map((st) => (
                                            <div key={st.id} className="bg-slate-50 rounded-2xl p-3 space-y-3 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg shrink-0">{(String(st.name || '?').trim().split(' ').pop() || '?').charAt(0).toUpperCase()}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-slate-800 truncate">{st.name}</div>
                                                        <div className="text-xs text-slate-500 truncate">Đã nộp {st.done} bài</div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="text-sm font-bold text-orange-600">{st.xp} XP</div>
                                                        <div className="text-xs font-semibold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap"><TdIc n="trophy" /> Hạng #{st.rank}</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm space-y-1.5 bg-white rounded-xl p-3 break-words">
                                                    <div><span className="text-slate-500">Nguyện vọng: </span><span className="font-medium text-slate-700">{st.uni}</span></div>
                                                    <div><span className="text-slate-500">Đánh giá GV: </span>
                                                        {st.evaluation ? <span className="font-medium text-slate-700">{st.evaluation}</span> : <span className="italic text-slate-400">Chưa có đánh giá</span>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button type="button" onClick={() => onEvaluate(st)} className="touch bg-orange-500 text-white font-semibold rounded-xl"><TdIc n="star" /> Đánh Giá</button>
                                                    <button type="button" onClick={() => onChat(st)} className="touch bg-blue-50 text-blue-700 font-semibold rounded-xl"><TdIc n="chat" /> Nhắn tin</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {gvbmFor && <GvbmManager cls={gvbmFor} classDoc={classDocs[gvbmFor.gid]} user={user} teachers={teachers} allTeachers={allTeachers} onClose={() => setGvbmFor(null)} />}
                </div>
            );
        }


        // ===================== GIAO DIỆN GIÁO VIÊN MỚI (từ gvien.html) — component thuần hiển thị =====================
        const TD_EMOJI = { plus:"＋", shield:"🛡️", ok:"✔", cal:"📅", clock:"⏱", q:"❓", users:"👥", chart:"📊", link:"🔗", bull:"📣", trophy:"🏆", star:"⭐", chat:"💬", pen:"✏️", lock:"🔒", eye:"👁", file:"📝", user:"👤", calok:"🗓", edit:"✎", trash:"🗑", school:"🏫", out:"🚪" };

        const TdIc = memo(({ n, c = "" }) => <span className={"inline-block text-center " + c}>{TD_EMOJI[n]}</span>);

        const TdStat = memo(({ icon, label, value, color }) => (
            <div className="bg-white rounded-2xl p-2 sm:p-3 text-center shadow-sm border border-slate-100 min-w-0">
                <div className={"w-9 h-9 mx-auto rounded-full flex items-center justify-center " + color}><TdIc n={icon} /></div>
                <div className="text-sm sm:text-lg font-bold text-slate-800 mt-2 leading-tight break-words">{value}</div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{label}</div>
            </div>
        ));

        const TdInfo = ({ icon, children }) => (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 min-w-0"><TdIc n={icon} c="w-4 shrink-0" /><span className="min-w-0 break-words">{children}</span></div>
        );

        // danger: đỏ cố định ở cả giao diện sáng và tối (inline style không bị html.dark ghi đè)
        const TdBtn = ({ icon, onClick, primary, danger, children }) => (
            <button type="button" onClick={onClick} className={"touch w-full flex items-center justify-center gap-2 font-semibold rounded-xl " + (danger ? "td-danger" : primary ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700")}
                style={danger ? { background: '#dc2626', color: '#ffffff' } : undefined}><TdIc n={icon} />{children}</button>
        );

        const ThemeModeBar = () => {
            const get = () => (window.getThemeMode ? window.getThemeMode() : 'system');
            const sysDark = () => !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            const [mode, setModeState] = useState(get);
            useEffect(() => {
                const sync = () => setModeState(get());
                window.addEventListener('eduorient-theme', sync);
                window.addEventListener('storage', sync);
                return () => { window.removeEventListener('eduorient-theme', sync); window.removeEventListener('storage', sync); };
            }, []);
            const pick = (m) => { if (window.setThemeMode) window.setThemeMode(m); setModeState(m); };
            return (
                <div>
                    <div className="tm-label">Giao diện</div>
                    <div className="tm-bar" role="radiogroup" aria-label="Chế độ giao diện">
                        {THEME_OPTS.map(([k, ic, lb]) => (
                            <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => pick(k)} className={'tm-opt touch' + (mode === k ? ' on' : '')}>
                                <span>{ic}</span><span>{lb}</span>
                            </button>
                        ))}
                    </div>
                    {mode === 'system' && <p className="tm-hint">Đang theo hệ thống: hiện là giao diện {sysDark() ? 'tối' : 'sáng'}.</p>}
                </div>
            );
        };


        // ===== Thẻ đề của giáo viên: React.memo -> chỉ render lại khi chính đề đó (hoặc số liệu của nó) đổi =====
        const AssignmentCard = memo(function AssignmentCard({ hw, submitted, total, pend, mine, onResults, onCopy, onEdit, onDelete }) {
            const nowMs = Date.now();
            const pct = total > 0 ? Math.min(100, submitted / total * 100) : 0;
            const dl = Number(hw.deadlineMs) || 0, remain = dl ? dl - nowMs : 0;
            const dlTxt = !dl ? 'Không có hạn' : remain <= 0 ? 'Đã hết hạn' : remain < 3600000 ? 'Còn ' + Math.max(1, Math.round(remain / 60000)) + ' phút' : remain < 86400000 ? 'Còn ' + Math.round(remain / 3600000) + ' giờ' : 'Còn ' + Math.round(remain / 86400000) + ' ngày';
            const dlCls = !dl ? 'text-slate-600' : remain <= 0 ? 'text-red-600' : remain < 86400000 ? 'text-amber-600' : 'text-slate-700';
            const dlDate = dl ? new Date(dl).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
            const typeLabel = hw.type === 'essay' ? 'Tự luận' : hw.type === 'mixed' ? 'Hỗn hợp' : 'Trắc nghiệm';
            return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 flex flex-col gap-3 min-w-0 max-w-full">
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{hw.subject}</span>
                                                                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{typeLabel}</span>
                                                                            {pend > 0 && <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Chờ chấm {pend}</span>}
                                                                        </div>
                                                                        <span className="text-xs text-slate-400">Đăng: {hw.createdAt}</span>
                                                                    </div>
                                                                    <h3 className="font-bold text-slate-800 leading-snug break-words">{hw.title}</h3>
                                                                    {hw.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2 break-words">{hw.description}</p>}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="col-span-2"><TdInfo icon="cal"><span className={'font-semibold ' + dlCls}>{dlTxt}</span>{dl ? <span className="text-slate-400"> • {dlDate}</span> : null}</TdInfo></div>
                                                                    <TdInfo icon="clock">{hw.duration}</TdInfo>
                                                                    <TdInfo icon="q">{hw.totalQuestions} câu</TdInfo>
                                                                    <TdInfo icon="ok">{total > 0 ? (submitted + '/' + total) : submitted} đã nộp</TdInfo>
                                                                    <TdInfo icon="users">{hw.classesText}</TdInfo>
                                                                </div>
                                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: pct + "%" }}></div></div>
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-auto pt-1">
                                                                    <button type="button" onClick={() => onResults(hw)} className="touch bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl px-2"><TdIc n="chart" /> Kết quả</button>
                                                                    <button type="button" onClick={() => onCopy(hw)} className="touch bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-2" title="Sao chép thông báo bài tập để gửi cho học sinh"><TdIc n="link" /> Sao chép</button>
                                                                    {mine && <button type="button" onClick={() => onEdit(hw)} className="touch bg-white hover:bg-orange-50 text-orange-700 border border-orange-300 text-sm font-semibold rounded-xl px-2"><TdIc n="edit" /> Sửa</button>}
                                                                    {mine && <button type="button" onClick={() => onDelete(hw)} className="touch bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl px-2"><TdIc n="trash" /> Xóa</button>}
                                                                </div>
                                                            </div>
            );
        });


        // ===== React.memo: chỉ render lại khi props THỰC SỰ đổi (props được ổn định bằng useMemo/useCallback trong App) =====
        const EssayPhotoViewer = memo(EssayPhotoViewerImpl);

        const HwResults = memo(HwResultsImpl);

        const HwEdit = memo(HwEditImpl);

        const TeacherTools = memo(TeacherToolsImpl);

        const TeacherSocial = memo(TeacherSocialImpl);

        const TeacherAttendance = memo(TeacherAttendanceImpl);

        const TeacherScoreManager = memo(TeacherScoreManagerImpl);

        const TeacherClassList = memo(TeacherClassListImpl);

        const GvbmManager = memo(GvbmManagerImpl);


        // Màn hình Giáo viên (trước đây là phần thân của App). Chỉ được tải sau khi đăng nhập bằng tài khoản giáo viên.
        function TeacherApp({ user, setUser }) {
            // App state
            const [role, setRole] = useState('student'); // 'student' | 'teacher'
            const [regMethod, setRegMethod] = useState('approval'); // 'approval' (Cách 2 - gửi thẻ 24h) | 'code' (Cách 1)
            const [isLogin, setIsLogin] = useState(true);

            // Database state
            const [teachersList, setTeachersList] = useState(() => { try { return JSON.parse(localStorage.getItem('eduorient_teachers')) || INITIAL_TEACHERS; } catch(e) { return INITIAL_TEACHERS; } });
            useEffect(() => { try { localStorage.setItem('eduorient_teachers', JSON.stringify(teachersList)); } catch(e){} }, [teachersList]);
            const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS);
            const [assignmentsAll, setAssignments] = useState([]);   // Phần 2: dữ liệu thô; bản đã lọc theo trường là `assignments` (khai báo bên dưới)

            // Teacher Dashboard Active Tab (3 Ô)
            // 1: 'post_assignment' (Đăng bài tập)
            // 2: 'class_management' (Quản lý lớp học)
            // 3: 'profile' (Tài khoản cá nhân)
            const [teacherTab, setTeacherTab] = useState('post_assignment');

            // Student Active Tab
            const [studentTab, setStudentTab] = useState('assignments'); // 'assignments' | 'leaderboard' | 'profile'

            // Registration Form Inputs (Cách 2)
            const [regForm, setRegForm] = useState({
                name: '',
                subject: 'Toán Học',
                email: '',
                password: '',
                teacherCardFile: null,
                teacherCardPreview: '',
                code: ''
            });

            // Login Form Inputs
            const [loginForm, setLoginForm] = useState({ email: '', password: '' });

            // UI Messages & Modals
            const [errorMessage, setErrorMessage] = useState('');
            const [successMessage, setSuccessMessage] = useState('');
            const [showAdminModal, setShowAdminModal] = useState(false);
            
            // Teacher Tab 1: New Assignment Modal / Form State
            const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
            const [assignmentForm, setAssignmentForm] = useState({
                title: '',
                subject: 'Toán Học',
                duration: '60 phút',
                totalQuestions: '40',
                description: '', qs: [{ kind: 'mcq', q: '', a: ['', '', '', ''], c: 0 }], classes: [], deadline: '', durMin: 45, ps: []
            });
            // Bố cục form đăng bài: thẻ câu thu gọn / nhóm đoạn văn thu gọn / đoạn văn xem đầy đủ
            const [qClosed, setQClosed] = useState({});
            const [qCountDraft, setQCountDraft] = useState(null);   // giá trị đang gõ trong ô "Số câu hỏi"
            const [psClosed, setPsClosed] = useState({});
            const [psFull, setPsFull] = useState({});
            const [chkCur, setChkCur] = useState(-1);

            const creatingRef = useRef(false);

            // Teacher Tab 2: Class Management State
            const setClassStudents = () => {};
            const [newStudentInput, setNewStudentInput] = useState('');
            const [selectedStudentForEval, setSelectedStudentForEval] = useState(null);
            const [evalCommentInput, setEvalCommentInput] = useState('');

            // Teacher Profile View Modal for Students
            const [viewTeacherModal, setViewTeacherModal] = useState(null);
            const [social, setSocial] = useState(null);
            const [showAtt, setShowAtt] = useState(false);   // Phần 4: Lịch Điểm Danh & Nề Nếp
            const [resHw, setResHw] = useState(null);
            const [editHw, setEditHw] = useState(null);      // {peer} khi đang mở Orient New
            const [toolModal, setToolModal] = useState(null);  // 'prof' | 'pw'
            const [studentsRaw, setStudentsRaw] = useState([]);
            const [teachersRaw, setTeachersRaw] = useState([]);   // Phần 2: hồ sơ giáo viên (để biết bài tập thuộc trường nào)
            const [subsRaw, setSubsAll] = useState([]);
            const [evals, setEvals] = useState({});
            const [hwLimit, setHwLimit] = useState(10);   // phân trang bài tập: 10 bài mới nhất, bấm "Xem thêm" để +10
            const [bxhSum, setBxhSum] = useState({});     // users trong bxh/summary
            const [myGroups, setMyGroups] = useState([]);       // nhóm lớp mà GV là thành viên (để biết lớp chủ nhiệm)
            const [classDocsHr, setClassDocsHr] = useState({}); // classes/{gid} do mình làm GVCN
            const [classDocsAs, setClassDocsAs] = useState({}); // classes/{gid} mình được phân công GVBM
            const [attCls, setAttCls] = useState('');           // lớp đang mở điểm danh
            useEffect(() => {
                if (!user || user.role !== 'teacher') return;
                const toMap = (s) => { const m = {}; s.forEach((d) => { m[d.id] = { id: d.id, ...d.data() }; }); return m; };
                const u7 = fbDb.collection('groups').where('members', 'array-contains', user.id).onSnapshot((s) => { const g = s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.type === 'class'); setMyGroups((prev) => keepList(prev, g, (x) => x.id)); }, () => {});
                const u8 = fbDb.collection('classes').where('gvcnUid', '==', user.id).onSnapshot((s) => setClassDocsHr((prev) => keepMap(prev, toMap(s))), () => {});
                const u9 = fbDb.collection('classes').where('gvbmUids', 'array-contains', user.id).onSnapshot((s) => setClassDocsAs((prev) => keepMap(prev, toMap(s))), () => {});
                return () => { u7(); u8(); u9(); };
            }, [user && user.id]);
            // (1) Bài tập CỦA MÌNH, phân trang. Lần đầu Firestore sẽ báo cần index (teacherId + createdAt): bấm link trong Console để tạo.
            useEffect(() => {
                if (!user || user.role !== 'teacher') return;
                return fbDb.collection('assignments').where('teacherId', '==', user.id).orderBy('createdAt', 'desc').limit(hwLimit)
                    .onSnapshot((s) => setAssignments((prev) => keepList(prev, s.docs.map((d) => { const x = d.data();
                        return { id: d.id, ...x, duration: x.duration || '', totalQuestions: (x.questions || []).length, createdAt: x.createdAt && typeof x.createdAt.toDate === 'function' ? x.createdAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong', status: 'approved',
                            classesText: (x.classes && x.classes.length) ? x.classes.join(', ') : 'Tất cả các lớp', deadlineText: x.deadlineMs ? new Date(x.deadlineMs).toLocaleString('vi-VN') : 'Không có hạn' }; }), (x) => x.id)), () => {});
            }, [user && user.id, hwLimit]);

            // (2) Bài nộp: CHỈ của các bài tập đang tải (hwId in [...], tối đa 30 / lô). Doc không còn ảnh nên rất nhẹ.
            const hwIdsKey = assignmentsAll.map((a) => a.id).join(',');
            useEffect(() => {
                if (!user || user.role !== 'teacher') return;
                const ids = assignmentsAll.map((a) => a.id);
                if (!ids.length) { setSubsAll([]); return; }
                const parts = {}, offs = [];
                for (let i = 0; i < ids.length; i += 30) {
                    const k = i;
                    offs.push(fbDb.collection('submissions').where('hwId', 'in', ids.slice(i, i + 30)).onSnapshot((s) => {
                        parts[k] = s.docs.map((d) => d.data()); const all = [].concat(...Object.values(parts)); setSubsAll((prev) => keepList(prev, all, (x) => x.hwId + '_' + x.uid));
                    }, () => {}));
                }
                return () => offs.forEach((f) => f());
            }, [hwIdsKey, user && user.id]);
            // ===== PHẦN 2 (đã refactor): truy vấn đã lọc theo trường + lớp ngay ở Firestore =====
            const isTeacherUser = !!user && user.role === 'teacher';
            const mySchoolProfile = useMemo(() => ({ role: 'teacher', school: isTeacherUser ? user.school : '', province: isTeacherUser ? user.province : '' }), [isTeacherUser, user && user.school, user && user.province]);

            // (3) Học sinh: chỉ ĐÚNG TRƯỜNG + ĐÚNG CÁC LỚP mình phụ trách (GVCN / GVBM)
            const tSchoolId = isTeacherUser ? schoolIdOfTeacher(user) : '';
            const rawClsList = useMemo(() => [...new Set([].concat(myGroups.map((g) => g.cls), Object.values(classDocsAs).map((c) => c.cls), Object.values(classDocsHr).map((c) => c.cls)).filter(Boolean))], [myGroups, classDocsAs, classDocsHr]);
            // classes/{gid}.cls được lưu dạng IN HOA; hồ sơ học sinh lưu nguyên gốc ("11 Toán") => thêm cả 2 dạng vào truy vấn
            const clsQuery = useMemo(() => [...new Set(rawClsList.concat(rawClsList.map(normCls)))].sort(), [rawClsList]);
            const clsKey = clsQuery.join('|');
            useEffect(() => {
                if (!tSchoolId || !clsQuery.length) { setStudentsRaw([]); return; }
                let dead = false;
                Promise.all(clsQuery.reduce((a, c, i) => (i % 30 ? a : a.concat([clsQuery.slice(i, i + 30)])), [])
                    .map((chunk) => fbDb.collection('profiles').where('targetSchoolId', '==', tSchoolId).where('cls', 'in', chunk).get()))
                    .then((snaps) => { if (!dead) setStudentsRaw([].concat(...snaps.map((s) => s.docs.map((d) => ({ id: d.id, ...d.data() }))))); })
                    .catch(() => {});
                return () => { dead = true; };
            }, [tSchoolId, clsKey]);

            // (4) Nhận xét: chỉ của học sinh đang quản lý (get theo lô, không nghe cả collection)
            const stuKey = studentsRaw.map((s) => s.id).sort().join(',');
            useEffect(() => {
                if (!user || user.role !== 'teacher' || !stuKey) { setEvals({}); return; }
                const ids = stuKey.split(','), A = firebase.firestore.FieldPath.documentId();
                Promise.all(ids.reduce((a, c, i) => (i % 30 ? a : a.concat([ids.slice(i, i + 30)])), []).map((ch) => fbDb.collection('evaluations').where(A, 'in', ch).get()))
                    .then((snaps) => { const m = {}; snaps.forEach((s) => s.forEach((d) => { m[d.id] = (d.data() || {}).text; })); setEvals(m); }).catch(() => {});
            }, [stuKey]);

            // (5) Giáo viên cùng trường (cho "Thêm GV bộ môn") + BXH tổng hợp: get(), tự làm mới mỗi 5 phút
            const loadBxhSum = useCallback(() => fbDb.collection('bxh').doc('summary').get().then((d) => setBxhSum((prev) => keepMap(prev, (d.data() || {}).users || {}))).catch(() => {}), []);
            useEffect(() => {
                if (!user || user.role !== 'teacher') return;
                if (user.school) fbDb.collection('profiles').where('role', '==', 'teacher').where('school', '==', user.school).get()
                    .then((s) => setTeachersRaw(s.docs.map((d) => ({ id: d.id, ...d.data() })))).catch(() => {});
                loadBxhSum(); const t = setInterval(loadBxhSum, 300000); return () => clearInterval(t);
            }, [user && user.id]);

            const schoolStudentsRaw = isTeacherUser ? studentsRaw : EMPTY_LIST;            // đã lọc theo trường + lớp ngay ở truy vấn
            const schoolStudentIds = useMemo(() => new Set(schoolStudentsRaw.map((s) => s.id)), [schoolStudentsRaw]);
            const subsAll = useMemo(() => subsRaw.filter((x) => schoolStudentIds.has(x.uid)), [subsRaw, schoolStudentIds]);    // chỉ điểm của học sinh thuộc lớp mình phụ trách
            const assignments = assignmentsAll;                                     // đã là bài của chính mình
            const LEGACY_UNI_IDS = ['QHQ', 'BKA', 'NEU', 'FTU', 'YHB', 'NTH', 'BTT', 'KHA', 'SPH'];   // mã đại học của bản cũ: coi như chưa chọn trường THPT
            // XP / số bài lấy từ summary (vì subsAll giờ chỉ là các bài đang tải, không còn là toàn bộ lịch sử)
            const classStudents = useMemo(() => schoolStudentsRaw.map((s) => { const e = bxhSum[s.id] || {};
                return { id: s.id, name: s.name, class: String(s.cls || '?').trim().toUpperCase(), uni: s.uniName || 'Chưa chọn nguyện vọng',
                    xp: Math.max(0, (Number(e.xp) || 0) + (Number(e.adj) || 0)), done: e.d || 0, evaluation: evals[s.id] || '' }; })
                .sort((a, b) => b.xp - a.xp).map((s, i) => ({ ...s, rank: i + 1 })), [schoolStudentsRaw, bxhSum, evals]);
            const classList = useMemo(() => [...new Set(classStudents.map((s) => s.class).filter((c) => c && c !== '?'))].sort(), [classStudents]);
            // ===== GVCN / GVBM: lớp chủ nhiệm (Admin gán trong groups) + lớp được phân công dạy bộ môn (classes.gvbmUids) =====
            const hrClasses = useMemo(() => isTeacherUser ? myGroups.filter((g) => g.homeroomTeacherUid === user.id && g.cls).map((g) => ({ gid: g.id, name: normCls(g.cls), schoolId: g.schoolId || '' })) : EMPTY_LIST, [isTeacherUser, myGroups, user && user.id]);
            const assignedClasses = useMemo(() => { const hrGids = new Set(hrClasses.map((c) => c.gid)); return Object.values(classDocsAs).filter((c) => !hrGids.has(c.id) && c.cls).map((c) => ({ gid: c.id, name: normCls(c.cls), schoolId: c.schoolId || '' })); }, [hrClasses, classDocsAs]);
            const classDocs = useMemo(() => ({ ...classDocsAs, ...classDocsHr }), [classDocsAs, classDocsHr]);
            const schoolTeachers = useMemo(() => isTeacherUser ? teachersRaw.filter((t) => t.id !== user.id && t.isPrivate !== true && sameSchoolProfile(t, mySchoolProfile)).map((t) => ({ id: t.id, name: t.name || 'Giáo viên', subject: t.subject || '' })).sort((a, b) => a.name.localeCompare(b.name, 'vi')) : EMPTY_LIST, [isTeacherUser, teachersRaw, user && user.id, mySchoolProfile]);

            // ===== Số liệu cho danh sách đề của giáo viên: tính 1 lần bằng useMemo, thẻ đề (AssignmentCard) là React.memo =====
            const myAssignments = useMemo(() => user ? assignments.filter((a) => a.teacherId === user.id) : EMPTY_LIST, [assignments, user && user.id]);
            const hwStats = useMemo(() => {
                const ids = new Set(myAssignments.map((a) => a.id)), submitted = {}, pending = {}; let pendingTotal = 0;
                subsAll.forEach((x) => {
                    submitted[x.hwId] = (submitted[x.hwId] || 0) + 1;
                    if (ids.has(x.hwId) && x.status === 'submitted' && !x.graded) { pending[x.hwId] = (pending[x.hwId] || 0) + 1; pendingTotal++; }
                });
                return { submitted, pending, pendingTotal };
            }, [subsAll, myAssignments]);
            // Số học sinh được giao = học sinh thuộc các lớp của đề (hoặc cả trường nếu đề giao "Tất cả các lớp")
            const hwTotals = useMemo(() => {
                const out = {};
                myAssignments.forEach((hw) => { const cls = (hw.classes || []).map((c) => String(c).trim().toUpperCase()); out[hw.id] = cls.length ? classStudents.filter((st) => cls.includes(st.class)).length : classStudents.length; });
                return out;
            }, [myAssignments, classStudents]);
            // Sao chép thông báo bài tập (để dán vào nhóm lớp) - thật sự copy vào clipboard
            const copyHwNotice = useCallback((hw) => {
                const link = (window.location.origin && window.location.origin !== 'null') ? window.location.origin + window.location.pathname : window.location.href;
                const text = '📚 Bài tập mới: ' + hw.title + '\nMôn: ' + hw.subject + ' • ' + hw.totalQuestions + ' câu • ' + hw.duration + '\nHạn nộp: ' + hw.deadlineText + '\nLớp: ' + hw.classesText + '\nVào EduOrient để làm bài: ' + link;
                const ok = () => eduToast('Đã sao chép thông báo bài tập', 'success');
                const fallback = () => { try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); ok(); } catch (e) { eduAlert('Không sao chép được, hãy thử lại.', 'error'); } };
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback();
            }, []);
            const deleteHw = useCallback((hw) => { eduConfirm('Học sinh sẽ không còn thấy bài này.', { title: 'Xóa bài tập này?', confirmText: 'Xóa', danger: true }).then((yes) => yes && fbDb.collection('assignments').doc(hw.id).delete().catch((e) => eduAlert(fbErr(e), 'error'))); }, []);
            const closeRes = useCallback(() => setResHw(null), []);
            const closeEdit = useCallback(() => setEditHw(null), []);
            const closeSocial = useCallback(() => setSocial(null), []);
            const closeAtt = useCallback(() => { setShowAtt(false); setAttCls(''); }, []);
            const openAtt = useCallback((c) => { setAttCls(c); setShowAtt(true); }, []);
            const evalStudent = useCallback((st) => { setSelectedStudentForEval(st); setEvalCommentInput(st.evaluation || ''); }, []);
            const chatStudent = useCallback((st) => setSocial({ peer: st.id }), []);
            const attClassList = useMemo(() => attCls ? [attCls] : classList, [attCls, classList]);

            // Sync user assignment subject default
            useEffect(() => {
                if (user && user.role === 'teacher') {
                    setAssignmentForm(prev => ({ ...prev, subject: user.subject || 'Toán Học' }));
                }
            }, [user]);

            // Handle registration form submit
            const handleRegister = (e) => {
                e.preventDefault();
                setErrorMessage('');
                setSuccessMessage('');

                if (!regForm.email || !regForm.password || !regForm.name) {
                    setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
                    return;
                }

                if (role === 'teacher') {
                    if (regMethod === 'approval') {
                        // CÁCH 2: Điền thông tin, thẻ giáo viên, đăng ký email/pass -> Chờ duyệt 24h
                        if (!regForm.teacherCardPreview) {
                            setErrorMessage('Vui lòng tải lên ảnh Thẻ giáo viên / Minh chứng công tác.');
                            return;
                        }

                        const newTeacher = {
                            id: `gv-${Date.now()}`,
                            email: regForm.email,
                            password: regForm.password,
                            name: regForm.name,
                            subject: regForm.subject,
                            school: "THPT Quốc Gia",
                            teacherCardUrl: regForm.teacherCardPreview,
                            status: "pending", // Đợi duyệt
                            registeredAt: new Date().toLocaleDateString('vi-VN'),
                            bio: `Giáo viên bộ môn ${regForm.subject}.`
                        };

                        setTeachersList([newTeacher, ...teachersList]);
                        setSuccessMessage('Hồ sơ của bạn đã được gửi thành công! Hệ thống đang kiểm tra thẻ giáo viên. Yêu cầu xét duyệt sẽ hoàn tất chậm nhất trong 24 giờ. Vui lòng quay lại đăng nhập sau.');
                        setIsLogin(true);
                    } else {
                        // CÁCH 1: Dùng mã xác thực tức thì
                        if (regForm.code !== "GV2026") {
                            setErrorMessage('Mã xác thực Giáo viên không hợp lệ (Thử: GV2026).');
                            return;
                        }
                        const newTeacher = {
                            id: `gv-${Date.now()}`,
                            email: regForm.email,
                            password: regForm.password,
                            name: regForm.name,
                            subject: regForm.subject,
                            school: "THPT Quốc Gia",
                            teacherCardUrl: "https://placehold.co/400x250/4361ee/ffffff?text=THE+GIAO+VIEN",
                            status: "approved",
                            registeredAt: new Date().toLocaleDateString('vi-VN'),
                            bio: `Giáo viên bộ môn ${regForm.subject}.`
                        };
                        setTeachersList([newTeacher, ...teachersList]);
                        setSuccessMessage('Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.');
                        setIsLogin(true);
                    }
                } else {
                    // Đăng ký Học sinh
                    const accs = JSON.parse(localStorage.getItem('eduorient_students') || '[]');
                    if (accs.some(a => a.email.toLowerCase() === regForm.email.toLowerCase())) { setErrorMessage('Email này đã được đăng ký.'); return; }
                    const acc = { id: `st-${Date.now()}`, email: regForm.email, password: regForm.password, name: regForm.name, role: 'student' };
                    localStorage.setItem('eduorient_students', JSON.stringify([...accs, acc]));
                    setUser(acc);
                }
            };

            // Handle Login
            const handleLogin = (e) => {
                e.preventDefault();
                setErrorMessage('');
                setSuccessMessage('');

                if (role === 'teacher') {
                    const foundTeacher = teachersList.find(
                        t => t.email.toLowerCase() === loginForm.email.toLowerCase() && t.password === loginForm.password
                    );

                    if (!foundTeacher) {
                        setErrorMessage('Tài khoản hoặc mật khẩu Giáo viên không chính xác.');
                        return;
                    }

                    if (foundTeacher.status === 'pending') {
                        setErrorMessage('Tài khoản của bạn ĐANG CHỜ ADMIN XÉT DUYỆT THẺ GIÁO VIÊN (chậm nhất 24h). Vui lòng thử lại sau hoặc dùng nút "Giả lập Admin duyệt nhanh" để kiểm tra.');
                        return;
                    }

                    setUser({ ...foundTeacher, role: 'teacher' });
                } else {
                    // Đăng nhập Học sinh
                    const accs = JSON.parse(localStorage.getItem('eduorient_students') || '[]');
                    const st = accs.find(a => a.email.toLowerCase() === loginForm.email.toLowerCase() && a.password === loginForm.password);
                    if (!st) { setErrorMessage('Email hoặc mật khẩu Học sinh không chính xác.'); return; }
                    setUser(st);
                }
            };

            // Simulated File Upload handler for Teacher Card
            const handleImageUpload = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setRegForm(prev => ({
                            ...prev,
                            teacherCardFile: file,
                            teacherCardPreview: reader.result
                        }));
                    };
                    reader.readAsDataURL(file);
                }
            };

            // Admin instant approve simulation
            const approveTeacherInstantly = (teacherId) => {
                setTeachersList(prev => prev.map(t => t.id === teacherId ? { ...t, status: 'approved' } : t));
                setSuccessMessage('Đã duyệt tài khoản giáo viên thành công! Bây giờ bạn có thể đăng nhập.');
            };

            // ===== Bài tập tự luận (Phần 1): nhận diện loại đề =====
            const ESSAY_IMG_MAX = 6, ESSAY_IMG_CHARS = 700000;   // tối đa 6 ảnh / câu, tổng ~700KB Base64 để vừa giới hạn 1MB/document
            const isBlankQ = (x) => !x.q.trim() && (x.kind === 'essay' ? !(x.images || []).length : x.a.every((o) => !o.trim()));
            const isBadQ = (x) => !!x.needCheck || (x.kind !== 'essay' && !isBlankQ(x) && x.a.some((o) => !o.trim()));
            const compressQImg = (f) => new Promise((res, rej) => { const fr = new FileReader();
                fr.onload = () => { const im = new Image();
                    im.onload = () => { const k = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
                        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.6)); };
                    im.onerror = () => rej(new Error('Không đọc được ảnh này.')); im.src = fr.result; };
                fr.onerror = () => rej(new Error('Không đọc được file.')); fr.readAsDataURL(f); });
            const detectType = (qs) => { const nE = qs.filter((x) => x.kind === 'essay').length, nM = qs.length - nE; return nE === 0 ? 'quiz' : nM === 0 ? 'essay' : 'mixed'; };

            // Teacher Action 1: Create New Assignment
            const handleCreateAssignment = (e) => {
                e.preventDefault();
                if (creatingRef.current) return;
                const f = assignmentForm; if (!f.title.trim()) return eduAlert('Hãy nhập tiêu đề bài tập.', 'warning');
                if (!user.subject) return eduAlert('Hãy chọn môn dạy trong "Chỉnh sửa hồ sơ" trước khi đăng bài.', 'warning');
                const half = f.qs.findIndex((x) => !isBlankQ(x) && !x.q.trim() && !(x.kind === 'essay' && (x.images || []).length));
                if (half >= 0) return eduAlert('Câu ' + (half + 1) + ' đã có đáp án nhưng chưa có nội dung câu hỏi. Hãy nhập nội dung hoặc xóa câu này.', 'warning');
                const qs = f.qs.filter((x) => x.q.trim() || (x.kind === 'essay' && (x.images || []).length));   // câu để trống hoàn toàn tự bị loại
                if (!qs.length) return eduAlert('Cần ít nhất 1 câu hỏi.', 'warning');
                if (qs.reduce((t, x) => t + (x.images || []).reduce((n, im) => n + im.length, 0), 0) > ESSAY_IMG_CHARS) return eduAlert('Tổng dung lượng ảnh đề bài quá lớn. Hãy xóa bớt ảnh hoặc chọn ảnh có độ phân giải thấp hơn.', 'warning');
                if (qs.length > 100) return eduAlert('Mỗi bài tối đa 100 câu hỏi.', 'warning');
                if (qs.some((x) => x.kind !== 'essay' && x.a.some((o) => !o.trim()))) return eduAlert('Mỗi câu trắc nghiệm cần điền đủ 4 đáp án A, B, C, D.', 'warning');
                // Đoạn văn dùng chung: chỉ lưu các đoạn có câu dùng tới; mỗi câu ghi chỉ số p của đoạn (không lặp lại chữ ở từng câu)
                const psAll = (f.ps || []).filter((x) => (x.text || '').trim());
                const usedPs = []; qs.forEach((x) => { if (x.pid && psAll.some((y) => y.id === x.pid) && !usedPs.includes(x.pid)) usedPs.push(x.pid); });
                const passages = usedPs.map((id) => psAll.find((y) => y.id === id).text.trim());
                if (passages.length > 30) return eduAlert('Mỗi bài tối đa 30 đoạn văn.', 'warning');
                if (passages.reduce((n, t) => n + t.length, 0) > 300000) return eduAlert('Tổng độ dài các đoạn văn quá lớn. Hãy rút gọn bớt.', 'warning');
                const pOf = (x) => { const k = x.pid ? usedPs.indexOf(x.pid) : -1; return k >= 0 ? { p: k } : {}; };
                const type = detectType(qs);   // 'quiz' | 'essay' | 'mixed' (tự động)
                const durMin = Math.min(180, Math.max(5, parseInt(f.durMin, 10) || 45));   // số nguyên (phút)
                const deadlineMs = f.deadline ? new Date(f.deadline).getTime() : 0;        // số nguyên (mili giây), 0 = không có hạn
                if (f.deadline && !Number.isFinite(deadlineMs)) return eduAlert('Hạn nộp không hợp lệ.', 'warning');
                if (deadlineMs && deadlineMs < Date.now()) return eduAlert('Hạn nộp phải ở tương lai.', 'warning');
                const classes = [...new Set((f.classes || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean))];   // mảng chữ hoa
                creatingRef.current = true;
                fbDb.collection('assignments').add({ title: f.title.trim(), subject: user.subject, description: (f.description || '').trim() || 'Bài tập do Giáo viên biên soạn.',
                    duration: durMin + ' phút', durationMin: durMin, durationMinutes: durMin, type, classes, deadlineMs, teacherId: user.id, teacherName: user.name,
                    questions: qs.map((x) => x.kind === 'essay' ? { kind: 'essay', q: x.q.trim(), images: x.images || [], ...pOf(x) } : { kind: 'mcq', q: x.q.trim(), a: x.a.map((o) => o.trim()), c: x.c, e: (x.e || '').trim(), ...pOf(x) }), ...(passages.length ? { passages } : {}), createdAt: fbNow() })
                    .then(() => { setShowNewAssignmentModal(false); setQClosed({}); setPsClosed({}); setPsFull({}); setChkCur(-1); setAssignmentForm({ title: '', subject: user.subject, duration: '45 phút', totalQuestions: '40', description: '', qs: [{ kind: 'mcq', q: '', a: ['', '', '', ''], c: 0 }], classes: [], deadline: '', durMin: 45, ps: [] }); eduAlert('Đã đăng bài tập! Học sinh sẽ thấy ngay.', 'success'); })
                    .catch((err) => eduAlert(fbErr(err), 'error'))
                    .finally(() => { creatingRef.current = false; });
            };



            // Teacher Action 2: Add Student to Class
            const handleAddStudentToClass = (e) => {
                e.preventDefault();
                if (!newStudentInput.trim()) return;

                const foundInGlobal = studentsList.find(s => s.email.toLowerCase() === newStudentInput.trim().toLowerCase() || s.name.toLowerCase().includes(newStudentInput.trim().toLowerCase()));

                const studentToAdd = foundInGlobal || {
                    id: `st-${Date.now()}`,
                    name: newStudentInput.split('@')[0],
                    email: newStudentInput.includes('@') ? newStudentInput : `${newStudentInput.toLowerCase()}@gmail.com`,
                    class: "12A1",
                    targetSchool: "Đại Học Kinh Tế Quốc Dân",
                    xp: 200,
                    rank: classStudents.length + 1,
                    gpa: 8.0,
                    evaluation: "Mới thêm vào lớp. Đang theo dõi tiến độ."
                };

                if (classStudents.some(s => s.email.toLowerCase() === studentToAdd.email.toLowerCase())) {
                    eduAlert('Học sinh này đã có trong danh sách lớp học!', 'warning');
                    return;
                }

                setClassStudents([...classStudents, studentToAdd]);
                setNewStudentInput('');
            };

            // Save Teacher Evaluation for Student
            const handleSaveEvaluation = () => {
                if (!selectedStudentForEval) return;
                fbDb.collection('evaluations').doc(selectedStudentForEval.id).set({ text: evalCommentInput.trim(), teacherId: user.id, teacherName: user.name, updatedAt: fbNow() }).catch((e) => eduAlert(fbErr(e), 'error'));
                setEvals((m) => ({ ...m, [selectedStudentForEval.id]: evalCommentInput.trim() }));
                setSelectedStudentForEval(null);
                setEvalCommentInput('');
            };

            if (user.role === 'teacher' && !String(user.school || '').trim()) return <TeacherSchoolGate user={user} setUser={setUser} onLogout={() => fbSignOut(setUser)} />;
            return (
                <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-clip bg-slate-50">
                    {/* Header Bar */}
                    <header className="bg-white border-b border-slate-200 px-3 sm:px-8 py-2.5 sm:py-3.5 shadow-sm sticky top-0 z-40 w-full max-w-full">
                        <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                                    <Icon name="compass" className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight block leading-tight">EduOrient</span>
                                    <span className="text-[10px] text-slate-500 font-medium block truncate">Hệ Thống Giáo Dục & Định Hướng</span>
                                </div>
                            </div>

                            {user ? (
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
                                    {/* Desktop / tablet: badge + tên */}
                                    <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 min-w-0">
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${user.role === 'teacher' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'}`}>
                                            {user.role === 'teacher' ? `Giáo Viên (${user.subject || 'Bộ Môn'})` : 'Học Sinh'}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800 max-w-[16rem] truncate">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={() => fbSignOut(setUser)}
                                        className="touch text-xs text-slate-500 hover:text-red-600 font-medium transition flex items-center justify-center gap-1 bg-slate-100 hover:bg-red-50 px-3 rounded-xl shrink-0"
                                        title="Đăng xuất"
                                    >
                                        <Icon name="log-out" className="w-4 h-4" />
                                        <span className="hidden sm:inline">Đăng xuất</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAdminModal(true)}
                                    className="touch text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 rounded-xl border border-indigo-200 transition flex items-center gap-1.5 shrink-0"
                                >
                                    <Icon name="shield-check" className="w-4 h-4" /> <span className="hidden sm:inline">Bảng Giả Lập Admin</span><span className="sm:hidden">Admin</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile: hàng thứ 2 — badge vai trò + tên (truncate, không tràn lề phải) */}
                        {user && (
                            <div className="sm:hidden mt-2 flex items-center gap-2 min-w-0 w-full">
                                <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full max-w-[60%] truncate ${user.role === 'teacher' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'}`}>
                                    {user.role === 'teacher' ? `GV (${user.subject || 'Bộ Môn'})` : 'Học Sinh'}
                                </span>
                                <span className="text-sm font-semibold text-slate-800 truncate min-w-0 flex-1">{user.name}</span>
                            </div>
                        )}
                    </header>

                    {/* MAIN CONTENT AREA */}
                    <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 md:p-8 min-w-0">
                        {!user ? (
                            /* --- LOGIN & REGISTRATION SCREEN --- */
                            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-4">
                                {/* Role Selector */}
                                <div className="bg-slate-100 p-1.5 flex rounded-t-2xl gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => { setRole('student'); setErrorMessage(''); setSuccessMessage(''); }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <Icon name="user" className="w-4 h-4" /> Học Sinh
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setRole('teacher'); setErrorMessage(''); setSuccessMessage(''); }}
                                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${role === 'teacher' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <Icon name="graduation-cap" className="w-4 h-4" /> Giáo Viên
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Subtitle Header */}
                                    <div className="text-center mb-5">
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {isLogin ? 'Đăng Nhập Tài Khoản' : (role === 'teacher' ? 'Đăng Ký Tài Khoản Giáo Viên' : 'Đăng Ký Tài Khoản Học Sinh')}
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {role === 'teacher' 
                                                ? 'Cổng thông tin giảng dạy & quản lý bài tập EduOrient' 
                                                : 'Hệ thống trắc nghiệm định hướng nghề nghiệp & ôn thi'}
                                        </p>
                                    </div>

                                    {/* Teacher Registration Methods Selector (Cách 2 vs Cách 1) */}
                                    {role === 'teacher' && !isLogin && (
                                        <div className="mb-5 bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                                            <label className="block text-xs font-bold text-amber-900 mb-2">Phương thức đăng ký Giáo viên:</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRegMethod('approval')}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition text-left flex items-start gap-1.5 ${regMethod === 'approval' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <Icon name="file-badge" className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div>Cách 2: Gửi Thẻ GV</div>
                                                        <div className="text-[10px] opacity-80 font-normal">Chờ duyệt (chậm nhất 24h)</div>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegMethod('code')}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition text-left flex items-start gap-1.5 ${regMethod === 'code' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <Icon name="key-round" className="w-4 h-4 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div>Cách 1: Mã Kích Hoạt</div>
                                                        <div className="text-[10px] opacity-80 font-normal">Kích hoạt nhanh</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    {errorMessage && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2">
                                            <Icon name="alert-circle" className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                                            <span className="leading-relaxed">{errorMessage}</span>
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-start gap-2">
                                            <Icon name="check-circle-2" className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                                            <span className="leading-relaxed">{successMessage}</span>
                                        </div>
                                    )}

                                    {/* FORM */}
                                    <form id="main-auth-form" name="main-auth-form" onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                                        {!isLogin && (
                                            <>
                                                {/* Full Name */}
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {role === 'teacher' ? 'Họ và tên Giáo viên' : 'Họ và tên Học sinh'} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input id="reg-name" name="name" aria-label="Họ và tên" autoComplete="name" 
                                                        type="text"
                                                        required
                                                        placeholder="VD: Nguyễn Văn Minh"
                                                        value={regForm.name}
                                                        onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>

                                                {/* Teacher Subject selection */}
                                                {role === 'teacher' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                                            Môn học đang giảng dạy <span className="text-red-500">*</span>
                                                        </label>
                                                        <select id="reg-subject" name="subject" aria-label="Môn giảng dạy"
                                                            value={regForm.subject}
                                                            onChange={(e) => setRegForm({...regForm, subject: e.target.value})}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                                                        >
                                                            {SUBJECTS.map((sub) => (
                                                                <option key={sub} value={sub}>{sub}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {/* CÁCH 2: Upload Teacher ID Card / Proof */}
                                                {role === 'teacher' && regMethod === 'approval' && (
                                                    <div className="p-3 bg-slate-50 border border-dashed border-amber-300 rounded-xl space-y-2">
                                                        <label className="block text-xs font-bold text-amber-900 flex items-center justify-between">
                                                            <span>Thẻ Giáo Viên / Minh Chứng Công Tác <span className="text-red-500">*</span></span>
                                                            <span className="text-[10px] text-amber-700 font-normal">Xét duyệt 24h</span>
                                                        </label>
                                                        
                                                        {regForm.teacherCardPreview ? (
                                                            <div className="relative rounded-lg overflow-hidden border border-amber-200">
                                                                <img src={regForm.teacherCardPreview} alt="Preview Thẻ GV" className="w-full h-32 object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRegForm({...regForm, teacherCardPreview: '', teacherCardFile: null})}
                                                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700"
                                                                >
                                                                    <Icon name="x" className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-amber-50/50 transition">
                                                                <Icon name="upload-cloud" className="w-6 h-6 text-amber-600 mb-1" />
                                                                <span className="text-xs font-medium text-slate-600">Bấm để tải ảnh Thẻ GV hoặc Giấy xác nhận</span>
                                                                <span className="text-[10px] text-slate-400 mt-0.5">Định dạng JPG, PNG</span>
                                                                <input id="reg-avatar" name="avatar" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                            </label>
                                                        )}
                                                    </div>
                                                )}

                                                {/* CÁCH 1: Teacher Code */}
                                                {role === 'teacher' && regMethod === 'code' && (
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                                                            <span>Mã kích hoạt Giáo viên <span className="text-red-500">*</span></span>
                                                            <span className="text-[10px] text-amber-600 font-semibold">Mã mẫu: GV2026</span>
                                                        </label>
                                                        <input id="reg-teacher-code" name="teacherCode" aria-label="Mã giáo viên" 
                                                            type="text"
                                                            placeholder="Nhập GV2026..."
                                                            value={regForm.code}
                                                            onChange={(e) => setRegForm({...regForm, code: e.target.value.toUpperCase()})}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Username / Email */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Tên tài khoản / Email <span className="text-red-500">*</span>
                                            </label>
                                            <input id="auth-email" name="email" aria-label="Email" autoComplete="email" 
                                                type="email"
                                                required
                                                placeholder={role === 'teacher' ? "VD: gv_toan@edu.vn" : "VD: hocsinh@gmail.com"}
                                                value={isLogin ? loginForm.email : regForm.email}
                                                onChange={(e) => isLogin ? setLoginForm({...loginForm, email: e.target.value}) : setRegForm({...regForm, email: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                Mật khẩu <span className="text-red-500">*</span>
                                            </label>
                                            <input id="auth-password" name="password" aria-label="Mật khẩu" autoComplete={isLogin ? 'current-password' : 'new-password'} 
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={isLogin ? loginForm.password : regForm.password}
                                                onChange={(e) => isLogin ? setLoginForm({...loginForm, password: e.target.value}) : setRegForm({...regForm, password: e.target.value})}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Submit Button */}
                                        <button 
                                            type="submit"
                                            className={`w-full text-white font-bold py-3 rounded-xl transition shadow-lg text-sm flex items-center justify-center gap-2 mt-2 ${role === 'teacher' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                                        >
                                            {isLogin ? (
                                                <>
                                                    <Icon name="log-in" className="w-4 h-4" /> Đăng Nhập {role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'}
                                                </>
                                            ) : (
                                                role === 'teacher' && regMethod === 'approval' 
                                                    ? 'Gửi Thẻ & Đăng Ký Xét Duyệt (24h)' 
                                                    : 'Tạo Tài Khoản Ngay'
                                            )}
                                        </button>
                                    </form>

                                    {/* Toggle Switch */}
                                    <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                                        <button 
                                            type="button"
                                            onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); setSuccessMessage(''); }}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                        >
                                            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại Đăng nhập'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : user.role === 'teacher' ? (
                            /* --- TEACHER DASHBOARD (UI mới từ gvien.html — dữ liệu thật từ Firestore) --- */
                            (() => {
                                const visibleAssignments = myAssignments;   // Quyền riêng: giáo viên chỉ thấy & quản lý đề do CHÍNH MÌNH đăng
                                const tabs = [
                                    { key: 'post_assignment', label: '1. Đăng Bài Tập', icon: 'file' },
                                    { key: 'class_management', label: '2. Quản Lý Lớp Học', icon: 'users' },
                                    { key: 'score_management', label: '3. Quản Lý Điểm', icon: 'chart' },
                                    { key: 'profile', label: '4. Tài Khoản', icon: 'user' },
                                ];
                                // ===== Số liệu cho dải thông tin & thẻ đề: chờ chấm, sắp hết hạn =====
                                const nowMs = Date.now();
                                const pendingTotal = hwStats.pendingTotal;
                                const dueSoon = myAssignments.filter((a) => a.deadlineMs && a.deadlineMs > nowMs && a.deadlineMs - nowMs <= 48 * 3600 * 1000).length;
                                const topStats = [['Đã đăng', myAssignments.length, 'text-slate-800'], ['Chờ chấm', pendingTotal, pendingTotal > 0 ? 'text-amber-600' : 'text-slate-800'], ['Sắp hết hạn', dueSoon, dueSoon > 0 ? 'text-red-500' : 'text-slate-800']];
                                return (
                                    <div className="w-full max-w-3xl lg:max-w-5xl mx-auto pb-24 md:pb-8 min-w-0">
                                        {/* Dải thông tin giáo viên (gọn) */}
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                                            <div className="flex items-center gap-3 min-w-0 lg:flex-1">
                                                <div className="w-11 h-11 shrink-0 rounded-full bg-orange-100 text-orange-600 font-bold text-lg flex items-center justify-center overflow-hidden">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : String(user.name || '?').charAt(0)}</div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] text-slate-400 leading-tight">Xin chào,</p>
                                                    <h1 className="font-extrabold text-slate-800 leading-tight break-words">{user.name}</h1>
                                                    <p className="text-xs text-slate-500 break-words">{user.school || 'Trường THPT Quốc Gia'} • Môn {user.subject}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {topStats.map(([label, n, cls]) => (
                                                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-center lg:min-w-[96px]">
                                                        <p className={'text-lg font-black leading-tight ' + cls}>{n}</p>
                                                        <p className="text-[10px] font-semibold text-slate-500">{label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" onClick={() => setShowNewAssignmentModal(true)} className="touch w-full lg:w-auto bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 rounded-xl shadow"><TdIc n="plus" /> Tạo Đề Thi Mới</button>
                                        </div>

                                        {/* Thanh chuyển Tab (desktop) */}
                                        <div className="hidden md:flex gap-2 mt-4 mb-4">
                                            {tabs.map((t) => (
                                                <button key={t.key} type="button" onClick={() => setTeacherTab(t.key)} className={"touch flex-1 font-semibold rounded-xl " + (teacherTab === t.key ? "bg-orange-500 text-white shadow" : "bg-white text-slate-600 border border-slate-200")}>{t.label}</button>
                                            ))}
                                        </div>

                                        <div className="mt-4 md:mt-0">
                                            {/* TAB 1: ĐĂNG BÀI TẬP */}
                                            {teacherTab === 'post_assignment' && (
                                                <div className="space-y-4">
                                                    <div className="min-w-0">
                                                        <h2 className="text-base sm:text-xl font-bold text-slate-800 leading-snug break-words">Quản Lý Bài Tập &amp; Đề Kiểm Tra ({myAssignments.length})</h2>
                                                        <p className="text-xs text-slate-500 mt-0.5">Bài tập sau khi đăng sẽ xuất hiện trực tiếp ở phần Bài Tập của Học sinh</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {visibleAssignments.length === 0 && (
                                                        <div className="lg:col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Chưa có bài tập nào. Bấm “Tạo Đề Thi Mới” để đăng bài đầu tiên.</div>
                                                    )}
                                                    {visibleAssignments.map((hw) => (
                                                        <AssignmentCard key={hw.id} hw={hw} submitted={hwStats.submitted[hw.id] || 0} total={hwTotals[hw.id] || 0} pend={hwStats.pending[hw.id] || 0}
                                                            mine={hw.teacherId === user.id} onResults={setResHw} onCopy={copyHwNotice} onEdit={setEditHw} onDelete={deleteHw} />
                                                    ))}
                                                    {assignmentsAll.length >= hwLimit && (
                                                        <button type="button" onClick={() => setHwLimit(hwLimit + 10)} className="touch lg:col-span-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl">Xem thêm bài tập cũ hơn</button>
                                                    )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* TAB 2: QUẢN LÝ LỚP HỌC — gom theo lớp (accordion) + GVCN/GVBM */}
                                            {teacherTab === 'class_management' && (
                                                <div className="space-y-4">
                                                    <button type="button" onClick={() => setSocial({ peer: null })} className="touch w-full sm:w-auto bg-orange-500 text-white text-sm font-semibold px-4 rounded-xl shadow"><TdIc n="bull" /> Orient New &amp; Tin Nhắn</button>
                                                    <ErrorBoundary inline><TeacherClassList user={user} classStudents={classStudents} hrClasses={hrClasses} assignedClasses={assignedClasses} classDocs={classDocs} teachers={schoolTeachers} allTeachers={teachersRaw}
                                                        onAttendance={openAtt} onEvaluate={evalStudent} onChat={chatStudent} /></ErrorBoundary>
                                                </div>
                                            )}

                                            {/* TAB 3: QUẢN LÝ & SỬA ĐIỂM THEO LỚP */}
                                            {teacherTab === 'score_management' && (
                                                <div className="space-y-4">
                                                    <ErrorBoundary inline><BxhScoreEditor user={user} students={classStudents} onSaved={loadBxhSum} /></ErrorBoundary>
                                                    <ErrorBoundary inline><TeacherScoreManager user={user} classStudents={classStudents} classList={classList} assignments={myAssignments} subsAll={subsAll} /></ErrorBoundary>
                                                </div>
                                            )}

                                            {/* TAB 4: TÀI KHOẢN */}
                                            {teacherTab === 'profile' && (
                                                <div className="space-y-4">
                                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
                                                        <div className="w-20 h-20 mx-auto overflow-hidden rounded-full bg-orange-100 text-orange-600 text-3xl font-bold flex items-center justify-center">
                                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : String(user.name || '?').charAt(0)}
                                                        </div>
                                                        <div className="mt-3 font-bold text-base sm:text-lg text-slate-800 break-words">{user.name}</div>
                                                        <div className="text-sm text-slate-500 break-words">GV {user.subject} - {user.school || 'THPT Quốc Gia'}</div>
                                                        {user.email && <div className="text-xs text-slate-400 mt-0.5 break-all">{user.email}</div>}
                                                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full"><TdIc n="ok" />Thẻ Giáo Viên Đã Xác Minh</span>
                                                        {user.isPrivate && <p className="text-[11px] font-bold text-slate-500 mt-2"><TdIc n="lock" /> Đang ẩn khỏi danh sách tìm kiếm</p>}
                                                        <div className="space-y-2 mt-5">
                                                            <TdBtn icon="pen" primary onClick={() => setToolModal('prof')}>Chỉnh sửa hồ sơ</TdBtn>
                                                            <TdBtn icon="lock" onClick={() => setToolModal('pw')}>Đổi mật khẩu</TdBtn>
                                                            <TdBtn icon="eye" onClick={() => setViewTeacherModal(user)}>Xem Giao Diện Học Sinh Thấy</TdBtn>
                                                            <ThemeModeBar />
                                                            <TdBtn icon="out" onClick={async () => { if (await eduConfirm('Bạn có chắc muốn đăng xuất khỏi tài khoản này?', { title: 'Đăng xuất?', confirmText: 'Đăng xuất', cancelText: 'Ở lại' })) fbSignOut(setUser); }}>Đăng xuất</TdBtn>
                                                            {/* Tách riêng nút nguy hiểm khỏi nút Đăng xuất để tránh bấm nhầm */}
                                                            <div className="pt-3 mt-1 border-t border-slate-100">
                                                                <TdBtn icon="trash" danger onClick={selfDeleteAccount}>Xóa tài khoản</TdBtn>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <TdStat icon="file" label="Bài Tập Đã Đăng" value={myAssignments.length} color="bg-orange-100" />
                                                        <TdStat icon="users" label="Học Sinh Quản Lý" value={(() => { const mine = new Set([...hrClasses, ...assignedClasses].map((c) => c.name)); return classStudents.filter((s) => mine.has(s.class)).length; })()} color="bg-blue-100" />
                                                        <TdStat icon="calok" label="Ngày Gia Nhập" value={user.registeredAt || '2026'} color="bg-green-100" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Navigation (mobile) */}
                                        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
                                            <div className="grid grid-cols-4">
                                                {tabs.map((t) => (
                                                    <button key={t.key} type="button" onClick={() => setTeacherTab(t.key)} className={"flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] min-w-0 " + (teacherTab === t.key ? "text-orange-600 border-t-2 border-orange-500" : "text-slate-400 border-t-2 border-transparent")}>
                                                        <TdIc n={t.icon} c="text-lg" />
                                                        <span className="text-[10px] sm:text-[11px] font-semibold leading-tight text-center px-0.5 max-w-full truncate">{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </nav>
                                    </div>
                                );
                            })()
                        ) : (
                            /* --- STUDENT DASHBOARD --- */
                            <div className="space-y-6">
                                {/* Student Banner */}
                                <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg flex justify-between items-center">
                                    <div>
                                        <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Học Sinh Lớp {user.class}</span>
                                        <h1 className="text-2xl font-black mt-1">Xin chào, {user.name}!</h1>
                                        <p className="text-xs text-indigo-100 mt-0.5">🎯 Nguyện vọng trường: {user.targetSchool}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-amber-300">{user.xp || 320} XP</div>
                                        <div className="text-xs text-indigo-200 font-semibold">Xếp Hạng #{user.rank || 4}</div>
                                    </div>
                                </div>

                                {/* Student Tabs */}
                                <div className="flex bg-slate-200 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setStudentTab('assignments')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${studentTab === 'assignments' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                                    >
                                        📝 Bài Tập Từ Giáo Viên
                                    </button>
                                    <button 
                                        onClick={() => setStudentTab('leaderboard')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${studentTab === 'leaderboard' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
                                    >
                                        🏆 Bảng Xếp Hạng & Lớp Học
                                    </button>
                                </div>

                                {studentTab === 'assignments' && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                                        <h2 className="font-bold text-slate-900 text-base">Danh Sách Bài Tập Đã Đăng Bởi Giáo Viên</h2>
                                        <div className="space-y-3">
                                            {assignments.map((hw) => (
                                                <div key={hw.id} className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 transition flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{hw.subject}</span>
                                                            <span className="text-xs font-bold text-indigo-600">Giáo viên: {hw.teacherName}</span>
                                                        </div>
                                                        <h3 className="font-bold text-slate-900 text-sm mt-1">{hw.title}</h3>
                                                        <p className="text-xs text-slate-500 mt-0.5">{hw.duration} • {hw.totalQuestions} câu hỏi</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => eduAlert(`Bắt đầu làm bài tập "${hw.title}"!`, 'info')}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                                                    >
                                                        Làm Bài Ngay
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {studentTab === 'leaderboard' && (
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                                        <h2 className="font-bold text-slate-900 text-base">Bảng Xếp Hạng Lớp Học & Nhận Xét Của Giáo Viên</h2>
                                        <div className="space-y-2">
                                            {classStudents.map((st, idx) => (
                                                <div key={st.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-xs flex items-center justify-center">#{idx + 1}</span>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-xs">{st.name}</div>
                                                            <div className="text-[10px] text-slate-500">Nguyện vọng: {st.uni}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-amber-600 text-xs">{st.xp} XP</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>

                    {}
                    {/* MODAL 1: GIẢ LẬP BẢNG DUYỆT ADMIN (Để test duyệt nhanh tài khoản Giáo viên Cách 2) */}
                    {showAdminModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                        <Icon name="shield-check" className="w-5 h-5 text-indigo-600" />
                                        Bảng Xét Duyệt Thẻ Giáo Viên Admin
                                    </h3>
                                    <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <Icon name="x" className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-xs text-slate-500">
                                    Các tài khoản Giáo viên đăng ký bằng <b>Cách 2 (Thẻ giáo viên / Minh chứng)</b> sẽ nằm ở danh sách này chờ Admin duyệt trong vòng 24 giờ.
                                </p>

                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                                    {teachersList.filter(t => t.status === 'pending').length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                                            Không có tài khoản giáo viên nào đang chờ duyệt.
                                        </div>
                                    ) : (
                                        teachersList.filter(t => t.status === 'pending').map((t) => (
                                            <div key={t.id} className="p-3 border border-amber-200 bg-amber-50/50 rounded-xl space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-xs text-slate-900">{t.name}</div>
                                                        <div className="text-[10px] text-amber-800 font-semibold">Môn: {t.subject} • Email: {t.email}</div>
                                                        <div className="text-[10px] text-slate-400">Gửi lúc: {t.registeredAt}</div>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Chờ duyệt (24h)</span>
                                                </div>
                                                {t.teacherCardUrl && (
                                                    <img src={t.teacherCardUrl} alt="Thẻ GV" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                                                )}
                                                <button 
                                                    onClick={() => approveTeacherInstantly(t.id)}
                                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                                                >
                                                    ✓ Duyệt Ngay Tài Khoản Này
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button 
                                    onClick={() => setShowAdminModal(false)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}

                    <TeacherTools user={user} setUser={setUser} open={toolModal} setOpen={setToolModal} />
                    {resHw && <HwResults hw={resHw} subs={subsAll} students={classStudents} user={user} onClose={closeRes} />}
                    {editHw && <HwEdit hw={editHw} classList={classList} onClose={closeEdit} />}
                    {social && <TeacherSocial user={user} peer={social.peer} onClose={closeSocial} />}
                    {showAtt && <ErrorBoundary inline><TeacherAttendance user={user} classStudents={classStudents} classList={attClassList} onClose={closeAtt} /></ErrorBoundary>}
                    {/* MODAL 2: TẠO BÀI TẬP MỚI (Dành cho Giáo viên Ô 1) */}
                    {showNewAssignmentModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
<div className="eo-hw-modal" style={{ background: 'var(--eo-surface,#fff)', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)' }}>
                                <style>{`
.eo-hw-modal{width:100%;max-width:1240px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
.eo-hw-body{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column}
.eo-hw-opts{display:grid;grid-template-columns:1fr;gap:6px}
.eo-sec{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--eo-line,#e2e8f0);border-radius:14px;background:var(--eo-sec-bg,#f8fafc)}
.eo-sec-t{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--eo-text3,#64748b)}
.eo-f{display:flex;flex-direction:column;gap:6px;min-width:0}
.eo-lb{font-size:12px;font-weight:700;color:var(--eo-text2,#334155)}
.eo-in{width:100%;box-sizing:border-box;padding:9px 12px;border:1px solid var(--eo-line2,#cbd5e1);border-radius:12px;font-size:13px;outline:none}
.eo-in:focus,.eo-step:focus-within{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.45)}
.eo-hint{font-size:10.5px;line-height:1.4;color:var(--eo-text3,#94a3b8);margin:0}
.eo-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start}
@media(max-width:400px){.eo-row2{grid-template-columns:1fr}}
.eo-unit{position:relative}
.eo-unit .eo-in{padding-right:46px}
.eo-unit span{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:11px;font-weight:700;color:var(--eo-text3,#64748b);pointer-events:none}
.eo-step{display:flex;align-items:stretch;border:1px solid var(--eo-line2,#cbd5e1);border-radius:12px;overflow:hidden}
.eo-step button{width:36px;flex:none;border:0;cursor:pointer;font-size:17px;font-weight:700;line-height:1;color:var(--eo-text2,#334155);background:var(--eo-chip,#f1f5f9)}
.eo-step button:hover{background:var(--eo-chip-h,#e2e8f0)}
.eo-step input{flex:1;min-width:0;width:100%;border:0;border-radius:0;text-align:center;font-size:13px;font-weight:700;padding:9px 0;outline:none;-moz-appearance:textfield;appearance:textfield}
.eo-step input::-webkit-outer-spin-button,.eo-step input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.eo-chips{display:flex;flex-wrap:wrap;gap:6px}
.eo-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--eo-line2,#cbd5e1);border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;color:var(--eo-text2,#334155)}
.eo-chip:has(input:checked){border-color:#d97706;background:rgba(245,158,11,.14);color:var(--eo-chip-on,#92400e)}
.eo-only-desk{display:none}
.eo-only-mob{display:block}
@media(min-width:560px){.eo-hw-opts{grid-template-columns:1fr 1fr}}
@media(min-width:1024px){
.eo-hw-modal{height:92vh}
.eo-hw-body{flex-direction:row;overflow:hidden}
.eo-hw-left{width:360px;flex:none;overflow-y:auto;border-right:1px solid var(--eo-line,#f1f5f9)}
.eo-hw-right{flex:1;min-width:0;overflow-y:auto}
.eo-only-desk{display:block}
.eo-only-mob{display:none}
}`}</style>
                                <div className="flex justify-between items-center" style={{ padding: '16px 24px', borderBottom: '1px solid var(--eo-line,#f1f5f9)', flex: 'none' }}>
                                    <h3 className="font-bold text-slate-900 text-base">Đăng Bài Tập / Đề Kiểm Tra Mới</h3>
                                    <button onClick={() => setShowNewAssignmentModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <Icon name="x" className="w-5 h-5" />
                                    </button>
                                </div>
                                <form id="assignment-form" name="assignment-form" onSubmit={handleCreateAssignment} className="eo-hw-body">
                                {(() => {
                                    const qs = assignmentForm.qs, psList = assignmentForm.ps || [];
                                    const upd = (i, patch) => setAssignmentForm((f) => ({ ...f, qs: f.qs.map((x, j) => j === i ? { ...x, ...patch, ...('c' in patch ? { needCheck: false } : {}) } : x) }));
                                    const real = qs.filter((x) => !isBlankQ(x)), detected = detectType(real);
                                    const addQ = (kind, pid) => setAssignmentForm((f) => ({ ...f, qs: [...(f.qs.length === 1 && isBlankQ(f.qs[0]) ? [] : f.qs), { ...(kind === 'essay' ? { kind: 'essay', q: '', images: [] } : { kind: 'mcq', q: '', a: ['', '', '', ''], c: 0 }), ...(pid ? { pid } : {}) }] }));
                                    const delQ = (i) => { setAssignmentForm((f) => ({ ...f, qs: f.qs.filter((x, j) => j !== i) })); setQClosed((m) => { const n = {}; Object.keys(m).forEach((k) => { const kk = +k; if (kk < i) n[kk] = m[k]; else if (kk > i) n[kk - 1] = m[k]; }); return n; }); };
                                    const badge = { quiz: ['Đề trắc nghiệm', 'bg-amber-100 text-amber-700'], essay: ['Đề tự luận', 'bg-indigo-100 text-indigo-700'], mixed: ['Đề hỗn hợp (TN + TL)', 'bg-emerald-100 text-emerald-700'] }[detected];
                                    const importDocx = async (e) => {
                                        const file = e.target.files[0]; e.target.value = ''; if (!file) return;
                                        if (!/\.docx$/i.test(file.name)) return eduAlert('Hãy chọn file Word đuôi .docx. File .doc cũ: mở bằng Word rồi chọn Lưu thành → .docx.', { icon: 'warning', title: 'Sai định dạng file' });
                                        let res;
                                        try { res = parseQuizLines(await readDocxLines(await file.arrayBuffer())); } catch (err) { return eduAlert(err.message || 'Không đọc được file Word này.', { icon: 'error', title: 'Không đọc được file' }); }
                                        if (!res.qs.length) return eduAlert('Mỗi câu cần bắt đầu bằng "Câu 1." (hoặc "1."), các đáp án bắt đầu bằng A. B. C. D. Hãy kiểm tra lại file rồi thử lại.', { icon: 'warning', title: 'Không nhận diện được câu hỏi nào' });
                                        const keep = qs.filter((x) => !isBlankQ(x)), room = 100 - keep.length, off = keep.length;
                                        const stamp = Date.now(), cut = res.qs.slice(0, Math.max(0, room));
                                        const usedIdx = [...new Set(cut.map((x) => x.pi).filter((k) => k >= 0))].sort((a, b) => a - b);
                                        const newPs = usedIdx.map((k) => ({ id: 'p' + stamp + '_' + k, text: res.passages[k] }));
                                        const list = cut.map(({ pi, ...x }) => (pi >= 0 ? { ...x, pid: 'p' + stamp + '_' + pi } : x));
                                        setAssignmentForm((f) => ({ ...f, title: f.title.trim() ? f.title : file.name.replace(/\.docx$/i, ''), ps: [...(f.ps || []), ...newPs], qs: [...f.qs.filter((x) => !isBlankQ(x)), ...list] }));
                                        const oldIdx = []; qs.forEach((x, i0) => { if (!isBlankQ(x)) oldIdx.push(i0); });
                                        setQClosed((m) => { const n = {}; oldIdx.forEach((o, ni) => { if (m[o]) n[ni] = true; }); list.forEach((x, j) => { if (!x.needCheck && (x.kind === 'essay' || (x.a || []).every((o) => (o || '').trim()))) n[off + j] = true; }); return n; });
                                        const lab = (arr) => arr.filter((n) => n <= list.length).map((n) => n + off).join(', ');
                                        let msg = 'Đã nhập ' + list.length + ' câu từ file "' + file.name + '".' + (newPs.length ? '\nNhận diện ' + newPs.length + ' đoạn văn dùng chung (xem mục "Đoạn văn" bên dưới, sửa được nếu cần).' : '');
                                        if (res.qs.length > list.length) msg += '\nMỗi bài tối đa 100 câu nên ' + (res.qs.length - list.length) + ' câu cuối chưa được nhập.';
                                        if (res.noAnswer.length) msg += '\nChưa nhận diện được đáp án đúng ở câu: ' + lab(res.noAnswer) + ' (đang tạm chọn A, được đánh dấu đỏ). Hãy chọn lại.';
                                        if (res.incomplete.length) msg += '\nThiếu đáp án A-D ở câu: ' + lab(res.incomplete) + '. Hãy điền thêm trước khi đăng.';
                                        if (res.essays) msg += '\n' + res.essays + ' câu không có đáp án A-D được nhập thành câu tự luận.';
                                        msg += '\nHãy xem lại các câu bên dưới trước khi đăng.';
                                        eduAlert(msg, { icon: res.noAnswer.length || res.incomplete.length ? 'warning' : 'success', title: 'Nhập đề từ Word' });
                                    };
                                    const setQCount = (raw) => {
                                        setQCountDraft(null);
                                        let n = parseInt(raw, 10); if (!Number.isFinite(n)) return;
                                        n = Math.min(100, Math.max(1, n));
                                        const cur = qs.length; if (n === cur) return;
                                        if (n > cur) {
                                            const add = Array.from({ length: n - cur }, () => ({ kind: 'mcq', q: '', a: ['', '', '', ''], c: 0 }));
                                            setAssignmentForm((f) => ({ ...f, qs: [...f.qs, ...add] }));
                                            setQClosed((m) => { const c = { ...m }; for (let k = cur; k < n; k++) c[k] = true; return c; });
                                        } else {
                                            let keep = cur; while (keep > n && isBlankQ(qs[keep - 1])) keep--;
                                            if (keep > n) eduAlert('Chỉ tự xóa được các câu trống ở cuối đề. Đã giữ lại ' + keep + ' câu vì còn câu có nội dung (dùng nút "Xóa câu" nếu muốn bỏ câu đó).', 'warning');
                                            if (keep < cur) { setAssignmentForm((f) => ({ ...f, qs: f.qs.slice(0, keep) })); setQClosed((m) => { const c = {}; Object.keys(m).forEach((k) => { if (+k < keep) c[k] = m[k]; }); return c; }); }
                                        }
                                    };
                                    const isShut = (i) => !!qClosed[i] && !qs[i].needCheck;
                                    const anyOpen = qs.some((x, i) => !isShut(i));
                                    const nChk = qs.filter(isBadQ).length;
                                    const jumpTo = (i) => { const q = qs[i]; setQClosed((m) => ({ ...m, [i]: false })); if (q.pid) setPsClosed((m) => ({ ...m, [q.pid]: false })); setChkCur(i); setTimeout(() => { const el = document.getElementById('q-card-' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); };
                                    const nextBad = () => { const bad = qs.map((x, i) => isBadQ(x) ? i : -1).filter((i) => i >= 0); if (!bad.length) return; const nx = bad.find((i) => i > chkCur); jumpTo(nx === undefined ? bad[0] : nx); };
                                    const toggleAll = () => { if (anyOpen) { const m = {}; qs.forEach((x, i) => { m[i] = true; }); setQClosed(m); } else setQClosed({}); };
                                    const snip = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);
                                    const pSelect = (q, i) => psList.length > 0 && <select id={`q-passage-${i}`} name={`passage-${i}`} aria-label="Câu này thuộc đoạn văn nào" value={q.pid || ''} onChange={(e) => upd(i, { pid: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"><option value="">Không thuộc đoạn văn nào</option>{psList.map((pp, k) => <option key={pp.id} value={pp.id}>{'Đoạn văn ' + (k + 1) + ': ' + snip(pp.text, 40)}</option>)}</select>;
                                    const shutRow = (q, i) => (
                                        <button type="button" key={i} id={'q-card-' + i} onClick={() => setQClosed((m) => ({ ...m, [i]: false }))} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '8px 12px', border: '1px solid var(--eo-line2,#e2e8f0)', background: 'var(--eo-surface,#fff)', borderRadius: 12, cursor: 'pointer', fontSize: 12 }}>
                                            <b style={{ color: 'var(--eo-text,#0f172a)', whiteSpace: 'nowrap' }}>Câu {i + 1}</b>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--eo-text2,#475569)', whiteSpace: 'nowrap' }}>{isBlankQ(q) ? '• chưa nhập' : '• ' + (q.kind === 'essay' ? 'tự luận' : 'đáp án ' + ('ABCD'[q.c] || '?')) + ' • ✓'}</span>
                                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--eo-text3,#94a3b8)' }}>{snip(q.q, 80)}</span>
                                            <span style={{ color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap' }}>Mở ▾</span>
                                        </button>);
                                    const collapseBtn = (i) => <button type="button" onClick={() => setQClosed((m) => ({ ...m, [i]: true }))} className="text-[11px] text-slate-500 font-semibold">Thu gọn ▴</button>;
                                    const renderQ = (q, i) => {
                                        if (isShut(i)) return shutRow(q, i);
                                        return q.kind === 'essay' ? (
                                            <div key={i} id={'q-card-' + i} className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-3 space-y-2">
                                                <div className="flex justify-between items-center"><b className="text-xs text-slate-800">Câu {i + 1} <span className="text-indigo-600">(Tự luận)</span></b>
                                                    <span style={{ display: 'flex', gap: 12 }}>{collapseBtn(i)}{qs.length > 1 && <button type="button" onClick={() => delQ(i)} className="text-[11px] text-red-500 font-semibold">Xóa câu</button>}</span></div>
                                                {pSelect(q, i)}
                                                <textarea id={`essay-question-${i}`} name={`question-${i}`} aria-label="Nội dung bài tự luận" rows="4" placeholder="Nội dung / yêu cầu bài tự luận (có thể bỏ trống nếu đã tải ảnh đề)..." value={q.q} onChange={(e) => upd(i, { q: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                                                {(q.images || []).length > 0 && <div className="grid grid-cols-3 gap-2">{q.images.map((im, k) => (
                                                    <div key={k} className="relative"><img src={im} alt="" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                                                        <button type="button" onClick={() => upd(i, { images: q.images.filter((_, m) => m !== k) })} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] font-bold leading-5">×</button></div>))}</div>}
                                                <label className="flex items-center justify-center gap-2 py-2 border border-dashed border-indigo-400 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-50">
                                                    <Icon name="image-plus" className="w-4 h-4" />Tải lên ảnh đề bài
                                                    <input id={`essay-images-${i}`} name={`images-${i}`} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                                                        const files = [...e.target.files]; e.target.value = ''; let cur = q.images || [];
                                                        for (const file of files) {
                                                            if (cur.length >= ESSAY_IMG_MAX) { eduAlert('Tối đa ' + ESSAY_IMG_MAX + ' ảnh cho mỗi câu.', 'warning'); break; }
                                                            try { const d = await compressQImg(file); cur = [...cur, d]; upd(i, { images: cur }); } catch (err) { eduAlert(err.message, 'error'); }
                                                        }
                                                    }} /></label>
                                                <p className="text-[10px] text-slate-400">Nhập văn bản và/hoặc tải ảnh đề (chọn được nhiều ảnh). Học sinh làm bài ra giấy, chụp ảnh và tải lên khi nộp.</p>
                                            </div>
                                        ) : (
                                            <div key={i} id={'q-card-' + i} className={'border rounded-xl p-3 space-y-2 ' + (q.needCheck ? 'border-red-300 bg-red-50/40' : 'border-amber-200 bg-amber-50/40')}>
                                                <div className="flex justify-between items-center"><b className="text-xs text-slate-800">Câu {i + 1}</b>
                                                    <span style={{ display: 'flex', gap: 12 }}>{!q.needCheck && collapseBtn(i)}{qs.length > 1 && <button type="button" onClick={() => delQ(i)} className="text-[11px] text-red-500 font-semibold">Xóa câu</button>}</span></div>
                                                {q.needCheck && <p className="text-[10px] font-semibold text-red-600 bg-red-50 rounded-lg px-2 py-1.5">⚠ Cần kiểm tra: chưa nhận diện được đáp án đúng hoặc thiếu đáp án. Hãy bấm nút tròn bên trái đáp án đúng.</p>}
                                                {pSelect(q, i)}
                                                <textarea id={`mcq-question-${i}`} name={`question-${i}`} aria-label="Nội dung câu hỏi" rows="2" placeholder="Nội dung câu hỏi..." value={q.q} onChange={(e) => upd(i, { q: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                                <div className="eo-hw-opts">
                                                    {['A', 'B', 'C', 'D'].map((L, k) => (
                                                        <div key={k} className="flex items-center gap-2">
                                                            <input id={`mcq-correct-${i}-${k}`} aria-label="Đáp án đúng" type="radio" name={'ans' + i} checked={q.c === k} title="Đáp án đúng" className="accent-amber-600" onChange={() => upd(i, { c: k })} />
                                                            <span className="text-xs font-bold w-4">{L}</span>
                                                            <input id={`mcq-option-${i}-${k}`} name={`option-${i}-${k}`} aria-label={`Đáp án ${L}`} type="text" placeholder={'Đáp án ' + L} value={q.a[k]} onChange={(e) => upd(i, { a: q.a.map((o, m) => m === k ? e.target.value : o) })} style={{ minWidth: 0 }} className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                                        </div>))}
                                                </div>
                                                <input id={`mcq-explain-${i}`} name={`explain-${i}`} aria-label="Giải thích đáp án" type="text" placeholder="Giải thích đáp án (không bắt buộc)" value={q.e || ''} onChange={(e) => upd(i, { e: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                                <p className="text-[10px] text-slate-400">Bấm nút tròn bên trái để đánh dấu đáp án đúng.</p>
                                            </div>);
                                    };
                                    // Gom câu theo đoạn văn: câu không có đoạn văn hiện riêng lẻ, câu cùng đoạn nằm ngay dưới đoạn đó
                                    const seen = {}, items = [];
                                    qs.forEach((q, i) => {
                                        const pp = q.pid && psList.find((y) => y.id === q.pid);
                                        if (!pp) { items.push({ t: 'q', i }); return; }
                                        if (seen[pp.id]) return; seen[pp.id] = 1;
                                        items.push({ t: 'g', pp, k: psList.indexOf(pp), idx: qs.map((x, j) => x.pid === pp.id ? j : -1).filter((j) => j >= 0) });
                                    });
                                    psList.forEach((pp, k) => { if (!seen[pp.id]) items.push({ t: 'g', pp, k, idx: [] }); });
                                    const renderGroup = ({ pp, k, idx }) => {
                                        const shut = !!psClosed[pp.id], full = !!psFull[pp.id];
                                        const setP = (patch) => setAssignmentForm((f) => ({ ...f, ps: f.ps.map((y) => y.id === pp.id ? { ...y, ...patch } : y) }));
                                        const bad = idx.filter((j) => qs[j].needCheck).length;
                                        return (
                                            <div key={'g' + pp.id} style={{ border: '1px solid var(--eo-ind-line,#c7d2fe)', borderRadius: 14, overflow: 'hidden', background: 'var(--eo-surface,#fff)' }}>
                                                <div style={{ background: 'var(--eo-ind-bg,#eef2ff)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <div className="flex justify-between items-center" style={{ gap: 8, flexWrap: 'wrap' }}>
                                                        <b className="text-xs text-slate-800">Đoạn văn {k + 1} <span className="text-indigo-600">• {idx.length} câu{bad ? ' • ' + bad + ' câu cần kiểm tra' : ''}</span></b>
                                                        <span style={{ display: 'flex', gap: 12 }}>
                                                            <button type="button" onClick={() => setPsClosed((m) => ({ ...m, [pp.id]: !m[pp.id] }))} className="text-[11px] text-indigo-700 font-semibold">{shut ? 'Mở nhóm ▾' : 'Thu gọn nhóm ▴'}</button>
                                                            <button type="button" onClick={() => setAssignmentForm((f) => ({ ...f, ps: f.ps.filter((y) => y.id !== pp.id), qs: f.qs.map((x) => x.pid === pp.id ? { ...x, pid: '' } : x) }))} className="text-[11px] text-red-500 font-semibold">Xóa đoạn văn</button>
                                                        </span>
                                                    </div>
                                                    {shut
                                                        ? <p style={{ margin: 0, fontSize: 12, color: 'var(--eo-text3,#64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snip(pp.text, 120) || '(đoạn văn trống)'}</p>
                                                        : <>
                                                            <textarea id={`passage-text-${k}`} name={`passage-text-${k}`} aria-label={`Nội dung đoạn văn ${k + 1}`} rows={full ? 14 : 3} placeholder="Nội dung đoạn văn..." value={pp.text} onChange={(e) => setP({ text: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" style={{ resize: 'vertical' }} />
                                                            <button type="button" onClick={() => setPsFull((m) => ({ ...m, [pp.id]: !m[pp.id] }))} className="text-[11px] text-indigo-700 font-semibold" style={{ alignSelf: 'flex-start' }}>{full ? 'Thu gọn đoạn văn ▴' : 'Xem đầy đủ đoạn văn ▾'}</button>
                                                        </>}
                                                </div>
                                                {!shut && <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {idx.length === 0 && <p style={{ margin: 0, fontSize: 11, color: 'var(--eo-text3,#94a3b8)' }}>Chưa có câu nào thuộc đoạn văn này.</p>}
                                                    {idx.map((j) => renderQ(qs[j], j))}
                                                    <button type="button" onClick={() => addQ('mcq', pp.id)} className="w-full py-2 border border-dashed border-amber-500 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50">+ Thêm câu vào đoạn văn này</button>
                                                </div>}
                                            </div>);
                                    };
                                    return (<>
                                        <div className="eo-hw-left" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <label onClick={() => { loadJSZip().catch(() => {}); }} className="flex items-center justify-center gap-2 py-2.5 border border-dashed border-emerald-500 text-emerald-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-50">
                                                    <Icon name="file-up" className="w-4 h-4" />Nhập đề từ file Word (.docx)
                                                    <input id="hw-import-docx" name="docxFile" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={importDocx} /></label>
                                                <details className="text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1.5"><summary className="cursor-pointer font-semibold text-slate-600">Cách soạn file Word để nhập tự động</summary>
                                                <div className="mt-1 space-y-0.5"><p>• Mỗi câu bắt đầu bằng <b>Câu 1.</b> (hoặc <b>1.</b>), các đáp án bắt đầu bằng <b>A.</b> <b>B.</b> <b>C.</b> <b>D.</b> (mỗi đáp án 1 dòng hoặc cả 4 trên cùng 1 dòng).</p>
                                                    <p>• Đáp án đúng nhận diện bằng 1 trong các cách: <b>gạch chân</b> / <b>chữ đỏ</b> / <b>in đậm</b> đáp án đúng, thêm dấu <b>*</b> trước đáp án (*A.), dòng <b>Đáp án: C</b> dưới câu, hoặc <b>bảng ĐÁP ÁN</b> ở cuối đề (1.A 2.B ...).</p>
                                                    <p>• Dòng <b>Giải thích:</b> dưới câu sẽ được nhập thành phần giải thích. Ảnh và công thức trong Word chưa được nhập, hãy bổ sung sau nếu cần.</p>
                                                    <p>• Bài đọc hiểu / điền từ: dòng hướng dẫn (ví dụ <b>Read the following passage...</b>, <b>Đọc đoạn văn sau...</b>) và đoạn văn bên dưới tự được nhận là <b>đoạn văn dùng chung</b> cho các câu liền sau. Có thể sửa ngay phía trên các câu của đoạn đó.</p></div></details>
                                            </div>

                                            <div className="eo-sec">
                                                <div className="eo-f">
                                                    <label className="eo-lb" htmlFor="hw-title">Tiêu đề bài tập <span className="text-red-500">*</span></label>
                                                    <input id="hw-title" name="title" aria-label="Tiêu đề bài tập" type="text" required placeholder="VD: Đề ôn tập thi HK1 môn Toán..." value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} className="eo-in" />
                                                </div>
                                                <div className="eo-f">
                                                    <label className="eo-lb" htmlFor="hw-description">Mô tả / Hướng dẫn học sinh</label>
                                                    <textarea id="hw-description" name="description" aria-label="Ghi chú hướng dẫn" rows="3" placeholder="Nhập ghi chú hướng dẫn..." value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} className="eo-in" style={{ resize: 'vertical' }}></textarea>
                                                </div>
                                            </div>

                                            <div className="eo-sec">
                                                <div className="eo-sec-t">Thiết lập bài làm</div>
                                                <div className="eo-row2">
                                                    <div className="eo-f">
                                                        <label className="eo-lb" htmlFor="hw-duration">Thời gian làm bài</label>
                                                        <div className="eo-unit">
                                                            <input id="hw-duration" name="durMin" aria-label="Thời gian làm bài (phút)" type="number" min="5" max="180" value={assignmentForm.durMin} onChange={(e) => setAssignmentForm({ ...assignmentForm, durMin: e.target.value })} className="eo-in" />
                                                            <span>phút</span>
                                                        </div>
                                                        <p className="eo-hint">Từ 5 đến 180 phút.</p>
                                                    </div>
                                                    <div className="eo-f">
                                                        <label className="eo-lb" htmlFor="hw-qcount">Số câu hỏi</label>
                                                        <div className="eo-step">
                                                            <button type="button" aria-label="Giảm 1 câu" onClick={() => setQCount(qs.length - 1)}>−</button>
                                                            <input id="hw-qcount" name="qCount" aria-label="Số câu hỏi" type="number" inputMode="numeric" min="1" max="100" value={qCountDraft === null ? qs.length : qCountDraft}
                                                                onChange={(e) => setQCountDraft(e.target.value)} onBlur={(e) => setQCount(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setQCount(e.currentTarget.value); } }} />
                                                            <button type="button" aria-label="Tăng 1 câu" onClick={() => setQCount(qs.length + 1)}>+</button>
                                                        </div>
                                                        <p className="eo-hint">Tối đa 100 câu.</p>
                                                    </div>
                                                </div>
                                                <p className="eo-hint">Nhập số câu để tạo sẵn các ô trống. Câu nào để trống hoàn toàn sẽ tự bị xóa khi đăng bài.</p>
                                            </div>

                                            <div className="eo-sec">
                                                <div className="eo-sec-t">Giao cho lớp</div>
                                                <div className="eo-chips">
                                                    <label className="eo-chip"><input id="hw-all-classes" name="allClasses" type="checkbox" className="accent-amber-600" checked={assignmentForm.classes.length === 0} onChange={() => setAssignmentForm({ ...assignmentForm, classes: [] })} /> Tất cả các lớp</label>
                                                    {classList.map((c) => (<label key={c} className="eo-chip"><input id={`hw-class-${c}`} name="classes" type="checkbox" className="accent-amber-600" checked={assignmentForm.classes.includes(c)}
                                                        onChange={() => setAssignmentForm({ ...assignmentForm, classes: assignmentForm.classes.includes(c) ? assignmentForm.classes.filter((x) => x !== c) : [...assignmentForm.classes, c] })} /> {c}</label>))}
                                                </div>
                                                {classList.length === 0 && <p className="eo-hint">Chưa có học sinh nào đăng ký lớp.</p>}
                                            </div>

                                            <div className="eo-sec">
                                                <div className="eo-f">
                                                    <label className="eo-lb" htmlFor="hw-deadline">Hạn nộp bài <span style={{ fontWeight: 500, color: 'var(--eo-text3,#94a3b8)' }}>(không bắt buộc)</span></label>
                                                    <input id="hw-deadline" name="deadline" aria-label="Hạn nộp bài" type="datetime-local" value={assignmentForm.deadline} onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })} className="eo-in" />
                                                    <p className="eo-hint">Hết giờ làm bài hoặc quá hạn nộp, bài của học sinh tự động được nộp và tính điểm.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="eo-hw-right">
                                            <div style={{ padding: '0 20px 20px' }}>
                                                <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--eo-surface,#fff)', padding: '12px 0', borderBottom: '1px solid var(--eo-line,#f1f5f9)', marginBottom: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                    <div className="flex items-center gap-2"><label className="block text-xs font-bold text-slate-700">Câu hỏi <span className="text-red-500">*</span></label>
                                                        <span className={'text-[10px] font-bold px-2 py-1 rounded-full ' + badge[1]}>{badge[0]}</span></div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                        {nChk > 0 && <button type="button" onClick={nextBad} className="text-[11px] font-bold text-red-600 px-2 py-1 border border-red-200 rounded-lg hover:bg-red-50">Tới câu cần kiểm tra tiếp theo</button>}
                                                        <button type="button" onClick={toggleAll} className="text-[11px] font-bold text-indigo-700 px-2 py-1 border border-indigo-200 rounded-lg hover:bg-indigo-50">{anyOpen ? 'Thu tất cả' : 'Mở tất cả'}</button>
                                                    </div>
                                                    <div style={{ flexBasis: '100%', display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 84, overflowY: 'auto' }}>
                                                        {qs.map((x, i) => { const bad = isBadQ(x), emp = !bad && isBlankQ(x); return <button type="button" key={i} onClick={() => jumpTo(i)} title={bad ? 'Câu ' + (i + 1) + ': cần kiểm tra' : emp ? 'Câu ' + (i + 1) + ': chưa nhập' : 'Câu ' + (i + 1) + ': đã ổn'} style={{ width: 28, height: 24, fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: 'pointer', background: emp ? 'rgba(148,163,184,.18)' : bad ? '#fee2e2' : '#dcfce7', color: emp ? 'var(--eo-text3,#64748b)' : bad ? '#991b1b' : '#166534', border: '1px solid ' + (emp ? 'rgba(148,163,184,.5)' : bad ? '#fca5a5' : '#86efac'), outline: i === chkCur ? '2px solid #6366f1' : 'none' }}>{i + 1}</button>; })}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    {detected === 'essay' && <p className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 rounded-lg px-2 py-1.5">Đề thuần tự luận: không có ô đáp án trắc nghiệm. Hãy đặt thời gian làm bài ở cột bên trái.</p>}
                                                    {items.map((it) => it.t === 'q' ? renderQ(qs[it.i], it.i) : renderGroup(it))}
                                                    <button type="button" onClick={() => setAssignmentForm((f) => ({ ...f, ps: [...(f.ps || []), { id: 'p' + Date.now() + '_' + (f.ps || []).length, text: '' }] }))} className="w-full py-2 border border-dashed border-indigo-500 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50">+ Thêm đoạn văn dùng chung (bài đọc hiểu, điền từ...)</button>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button type="button" onClick={() => addQ('mcq')} className="py-2 border border-dashed border-amber-500 text-amber-700 text-xs font-bold rounded-xl hover:bg-amber-50">+ Thêm câu trắc nghiệm</button>
                                                        <button type="button" onClick={() => addQ('essay')} className="py-2 border border-dashed border-indigo-500 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-50">+ Thêm câu hỏi tự luận</button>
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                        </div>
                                    </>);
                                })()}
                                </form>
                                <div style={{ flex: 'none', borderTop: '1px solid var(--eo-line2,#e2e8f0)', background: 'var(--eo-surface,#fff)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    {(() => { const nq = assignmentForm.qs.filter((x) => !isBlankQ(x)).length, nb = assignmentForm.qs.filter(isBadQ).length; return <span style={{ fontSize: 12, fontWeight: 700, color: nb ? '#dc2626' : 'var(--eo-text2,#475569)' }}>{nq} câu • {(assignmentForm.ps || []).length} đoạn văn • {nb} câu cần kiểm tra</span>; })()}
                                    <button type="submit" form="assignment-form" className="py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md" style={{ padding: '12px 24px' }}>Đăng Lên Cho Học Sinh Làm Bài</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL 3: ĐÁNH GIÁ HỌC LỰC HỌC SINH (Giáo viên Ô 2) */}
                    {selectedStudentForEval && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-900 text-base">Đánh Giá Học Lực: {selectedStudentForEval.name}</h3>
                                    <button onClick={() => setSelectedStudentForEval(null)} className="text-slate-400 hover:text-slate-600">
                                        <Icon name="x" className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900 space-y-1">
                                    <div><b>Nguyện vọng:</b> {selectedStudentForEval.uni}</div>
                                    <div><b>Điểm BXH:</b> {selectedStudentForEval.xp} XP (Hạng #{selectedStudentForEval.rank})</div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nhận xét & Nhắc nhở của Giáo viên:</label>
                                    <textarea id="eval-comment" name="evalComment" aria-label="Nhận xét đánh giá học sinh" 
                                        rows="4"
                                        value={evalCommentInput}
                                        onChange={(e) => setEvalCommentInput(e.target.value)}
                                        placeholder="VD: Học sinh có tư duy tốt môn Toán, cần rèn thêm kỹ năng làm bài trắc nghiệm..."
                                        className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                    ></textarea>
                                </div>

                                <button 
                                    onClick={handleSaveEvaluation}
                                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition"
                                >
                                    Lưu Nhận Xét
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODAL 4: VIEW TEACHER PROFILE (Dành cho Học sinh / Preview) */}
                    {viewTeacherModal && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-900 text-base">Hồ Sơ Giáo Viên (Giao diện Học sinh)</h3>
                                    <button onClick={() => setViewTeacherModal(null)} className="text-slate-400 hover:text-slate-600">
                                        <Icon name="x" className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 bg-amber-500 text-white rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl">
                                        {viewTeacherModal.name.charAt(0)}
                                    </div>
                                    <h2 className="font-bold text-lg text-slate-900">{viewTeacherModal.name}</h2>
                                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                                        Bộ môn: {viewTeacherModal.subject}
                                    </span>
                                    <p className="text-xs text-slate-500">{viewTeacherModal.bio}</p>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                    <h4 className="font-bold text-xs text-slate-800 mb-2">Bài tập đã đăng bởi Giáo viên này:</h4>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {assignments.filter(a => a.teacherId === viewTeacherModal.id).map(a => (
                                            <div key={a.id} className="p-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex justify-between">
                                                <span>• {a.title}</span>
                                                <span className="text-[10px] text-amber-600 font-bold">{a.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setViewTeacherModal(null)}
                                    className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                                >
                                    Đóng Xem Trước
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        export { TeacherApp };
