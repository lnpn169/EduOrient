// EduOrient — cổng PHỤ HUYNH (ParentPortal). Chỉ tải khi phụ huynh đăng nhập.
import { fbAuth, fbDb, fbNow, initialsAvatar, safeAvatar } from './app-core.jsx';
import { ATT_STATUS, clampScore, subXp } from './app-shared.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;


        const ParentBadge = ({ icon, text, cover }) => (
            <div className={'inline-flex items-start gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium max-w-full ' + (cover ? '' : 'bg-white/15 backdrop-blur')} style={cover ? { background: 'rgba(15,23,42,.45)' } : undefined}>
                <span className="shrink-0">{icon}</span><span className="min-w-0 break-words">{text}</span>
            </div>
        );


        // ===== GIAO DIỆN SÁNG / TỐI: dùng bộ điều khiển có sẵn trong index.html (window.setThemeMode, khóa eduorient_theme, sự kiện 'eduorient-theme') =====
        const COVER_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/;
        function useThemeMode() {
            const read = () => ({ mode: window.getThemeMode ? window.getThemeMode() : 'system', dark: window.isDarkMode ? window.isDarkMode() : false });
            const [st, setSt] = useState(read);
            useEffect(() => {
                const on = () => setSt(read());
                window.addEventListener('eduorient-theme', on); on();
                return () => window.removeEventListener('eduorient-theme', on);
            }, []);
            return st;
        }

        // Đặt TRÊN ảnh bìa (góc trên bên phải). Máy tính: 3 nút Mặc định / Tối / Sáng. Điện thoại: chỉ nút gạt sáng/tối.
        function ParentThemeControl() {
            const { mode, dark } = useThemeMode();
            const set = (m) => { if (window.setThemeMode) window.setThemeMode(m); };
            const box = dark ? 'rgba(30,41,59,.94)' : 'rgba(255,255,255,.94)';
            return (
                <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 10 }}>
                    <div className="hidden md:flex gap-1 p-1 rounded-2xl shadow-lg" style={{ background: box }} role="group" aria-label="Giao diện">
                        {[['system', 'Mặc định', '🖥️'], ['dark', 'Tối', '🌙'], ['light', 'Sáng', '☀️']].map(([k, l, ic]) => (
                            <button key={k} type="button" onClick={() => set(k)} aria-pressed={mode === k}
                                style={{ width: 66, padding: '6px 0', borderRadius: 12, border: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, lineHeight: 1.2, background: mode === k ? '#4f46e5' : 'transparent', color: mode === k ? '#fff' : (dark ? '#cbd5e1' : '#475569') }}>
                                <span style={{ fontSize: 16 }}>{ic}</span>{l}
                            </button>))}
                    </div>
                    <button type="button" role="switch" aria-checked={dark} aria-label="Chế độ tối" onClick={() => set(dark ? 'light' : 'dark')} className="md:hidden shadow-lg"
                        style={{ position: 'relative', width: 54, height: 30, borderRadius: 15, border: 0, cursor: 'pointer', padding: 0, background: dark ? '#4f46e5' : 'rgba(255,255,255,.94)' }}>
                        <span style={{ position: 'absolute', top: 3, left: dark ? 27 : 3, width: 24, height: 24, borderRadius: 12, background: dark ? '#fff' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'left .18s' }}>{dark ? '🌙' : '☀️'}</span>
                    </button>
                </div>
            );
        }

        // Ảnh bìa: HIỂN THỊ Y HỆT trang học sinh (cùng công thức phủ kín thẻ + dời + phóng to; không làm mờ, không phủ lớp màu)
        function ParentCoverImage({ cover, boxRef }) {
            const [nat, setNat] = useState(null), [box, setBox] = useState({ w: 0, h: 0 });
            useEffect(() => {
                setNat(null); const im = new Image();
                im.onload = () => setNat({ w: im.naturalWidth, h: im.naturalHeight }); im.src = cover.url;
            }, [cover.url]);
            useEffect(() => {
                const el = boxRef.current; if (!el) return;
                const upd = () => setBox({ w: el.clientWidth, h: el.clientHeight }); upd();
                if (window.ResizeObserver) { const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect(); }
                window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd);
            }, []);
            const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
            const pos = cover.pos || { ox: 0, oy: 0, z: 1 }, z = clamp(Number(pos.z) || 1, 1, 2.5);
            let st = { position: 'absolute', left: '50%', top: '50%', width: '100%', height: '100%', backgroundImage: 'url("' + cover.url + '")', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center', transform: 'translate(-50%,-50%)' };
            if (nat && box.w && box.h) {
                const sc = Math.max(box.w / nat.w, box.h / nat.h);
                const mx = Math.max(0, (nat.w * sc * z - box.w) / 2), my = Math.max(0, (nat.h * sc * z - box.h) / 2);
                const tx = clamp((Number(pos.ox) || 0) * box.w, -mx, mx), ty = clamp((Number(pos.oy) || 0) * box.h, -my, my);
                st = { ...st, width: nat.w * sc, height: nat.h * sc, backgroundSize: '100% 100%', transform: 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(' + z + ')' };
            }
            return <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}><div style={st} /></div>;
        }


        // ===== XÁC THỰC PHỤ HUYNH BẰNG MÃ OTP (gọi từ màn hình nhập Mã HS + OTP, rồi truyền kết quả vào <ParentPortal student={...} />) =====
        // Học sinh tạo mã 6 số trong Tài khoản -> Cài đặt (parentOtps/{MÃ HS}, sống 5 phút, dùng 1 lần).
        // 1) Đăng nhập ẩn danh -> 2) gửi mã: update parentOtps {usedBy, tryCode} (rules so khớp mã, hạn, chưa dùng)
        // -> 3) đọc lại parentOtps để lấy studentUid -> 4) ghi parentLinks -> 5) get users/{studentUid} (chỉ được phép sau khi đã liên kết).
        // Không còn tra cứu bảng users: người chưa có OTP không đọc được bất cứ thông tin học sinh nào.
        // Trả về { id, ...dữ liệu users } hoặc null nếu mã không hợp lệ.
        async function lookupStudentForParent(studentIdRaw, otpRaw) {
            const studentId = String(studentIdRaw || '').replace(/\s+/g, '').toUpperCase();   // Mã HS luôn lưu IN HOA
            const code = String(otpRaw || '').replace(/\D/g, '');
            if (!studentId || code.length !== 6) return null;
            if (!fbAuth.currentUser) await fbAuth.signInAnonymously();            // phiên ẩn danh của phụ huynh (cần bật Anonymous trong Firebase Console)
            const uid = fbAuth.currentUser.uid, otpRef = fbDb.collection('parentOtps').doc(studentId);
            let o = null;
            try { const s0 = await otpRef.get(); if (s0.exists) o = s0.data(); } catch (e) { /* chỉ đọc được khi mã đã do chính phiên này dùng */ }
            if (!o || o.usedBy !== uid) {
                try { await otpRef.update({ usedBy: uid, tryCode: code }); }
                catch (err) { if (err && (err.code === 'permission-denied' || err.code === 'not-found')) return null; throw err; }
                o = (await otpRef.get()).data();
            }
            if (!o || o.usedBy !== uid || !o.studentUid) return null;
            await fbDb.collection('parentLinks').doc(uid).set({ studentUid: o.studentUid, studentId: studentId, createdAt: fbNow() });
            const u = await fbDb.collection('users').doc(o.studentUid).get();
            if (!u.exists || u.data().role !== 'student') return null;
            return { id: u.id, ...u.data() };
        }


        // 1) Thẻ hồ sơ học sinh (giống thẻ Hồ sơ cá nhân của học sinh, KHÔNG có nút chỉnh sửa)
        function ParentProfileCard({ student, prof, cover }) {
            const boxRef = useRef(null);
            const name = prof.name || student.name;
            const avatar = safeAvatar(prof.avatar) || initialsAvatar(name, '4361ee');
            const sh = cover ? { textShadow: '0 1px 2px rgba(0,0,0,.85), 0 0 8px rgba(0,0,0,.45)' } : undefined;   // đổ bóng chữ cho dễ đọc, KHÔNG làm mờ ảnh
            const infoBox = cover ? { ...sh, background: 'rgba(15,23,42,.5)', borderRadius: 16, padding: '8px 14px' } : undefined;   // khung tối trong suốt sau thông tin để nổi bật trên ảnh sáng
            const dim = cover ? '' : ' opacity-80';
            return (
                <div ref={boxRef} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 text-white shadow-xl p-5">
                    <style>{'.pp-badges{padding-right:64px}@media(min-width:768px){.pp-badges{padding-right:236px}}'}</style>
                    {cover ? <ParentCoverImage cover={cover} boxRef={boxRef} /> : <div className="absolute -right-4 -bottom-6 text-[110px] opacity-10 -rotate-12 pointer-events-none select-none">🎓</div>}
                    <ParentThemeControl />
                    <div className="relative flex items-center gap-4 mb-4">
                        <img src={avatar} alt="" className="w-[70px] h-[70px] rounded-full object-cover border-[3px] border-white/40 shrink-0" />
                        <div className="min-w-0" style={infoBox}>
                            <p className={'text-[11px] font-bold uppercase tracking-wide' + dim}>Hồ sơ học sinh</p>
                            <h2 className="text-2xl font-extrabold leading-tight break-words">{name}</h2>
                            <p className="text-sm font-bold mt-0.5">🆔 Mã HS: <span className="tracking-wide select-all">{student.studentId}</span></p>
                            <p className={'text-[13px] break-all' + dim}>✉ {student.email}</p>
                        </div>
                    </div>
                    <div className="relative flex flex-wrap gap-2 items-start pp-badges" style={sh}>
                        <ParentBadge cover={!!cover} icon="🎓" text={prof.cls ? (prof.level || 'THPT') + ' • Lớp ' + prof.cls : 'Chưa cập nhật lớp'} />
                        <ParentBadge cover={!!cover} icon="🏫" text={prof.targetSchoolName || 'Chưa chọn trường'} />
                    </div>
                </div>
            );
        }


        // 1b) Định hướng: nguyện vọng Đại học + các ngành học sinh đang aim (đọc từ profiles/{uid}.majors)
        function ParentGoal({ student, prof }) {
            const uni = (student.nguyenVong && student.nguyenVong.name) || prof.uniName || '';
            const majors = Array.isArray(prof.majors) ? prof.majors.filter(Boolean) : [];
            return (
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                    <h2 className="font-bold text-slate-900 text-sm">🎯 Định hướng của học sinh</h2>
                    <div className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-indigo-500 uppercase mb-0.5">Nguyện vọng Đại học</p>
                        <p className="text-sm font-bold text-slate-800 break-words">{uni || 'Học sinh chưa chọn nguyện vọng'}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-violet-500 uppercase mb-1">Ngành học đang hướng tới</p>
                        {majors.length
                            ? <div className="flex flex-wrap gap-1.5">{majors.map((m, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-white text-violet-700 text-xs font-bold border border-violet-200 break-words">{m}</span>)}</div>
                            : <p className="text-sm text-slate-400">Học sinh chưa chọn ngành.</p>}
                    </div>
                </div>
            );
        }


        // 2) Đánh giá của giáo viên + Tổng điểm BXH + Thứ hạng trong lớp
        function ParentEvalRank({ ev, xp, rank }) {
            const loading = xp === null;
            return (
                <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                    <h2 className="font-bold text-slate-900 text-sm">Đánh giá &amp; Thứ hạng</h2>
                    <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">📝 Đánh giá năng lực của Giáo viên</p>
                        {ev && ev.text
                            ? <><p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{ev.text}</p>{ev.teacherName ? <p className="text-[11px] text-slate-400 mt-1">— {ev.teacherName}</p> : null}</>
                            : <p className="text-sm text-slate-400">Giáo viên chưa có đánh giá cho học sinh này.</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-orange-50 rounded-xl p-3">
                            <p className="text-[10px] text-orange-500 uppercase font-bold leading-tight">Tổng điểm BXH</p>
                            <p className="text-2xl font-black text-orange-600">{loading ? '...' : xp.total}<span className="text-xs font-bold"> XP</span></p>
                            {!loading && xp.adj !== 0 && <p className="text-[10px] text-slate-400">gồm {xp.adj > 0 ? '+' : ''}{xp.adj} điều chỉnh của giáo viên</p>}
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-3">
                            <p className="text-[10px] text-indigo-500 uppercase font-bold leading-tight">Thứ hạng trong lớp</p>
                            <p className="text-2xl font-black text-indigo-600">{loading ? '...' : (rank ? '#' + rank.pos : '—')}</p>
                            {!loading && rank && <p className="text-[10px] text-slate-400">trên {rank.n} học sinh</p>}
                        </div>
                    </div>
                </div>
            );
        }


        // 3) Lịch chuyên cần & nề nếp (chỉ dữ liệu của học sinh này)
        function ParentAttendance({ days, notes }) {
            const now = new Date();
            const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });   // m: 0-11
            const loading = days === null;
            const all = days || {};
            const stat = { present: 0, late: 0, excused: 0, unexcused: 0, dayoff: 0 };
            Object.keys(all).forEach((k) => { if (stat[all[k]] !== undefined) stat[all[k]]++; });
            const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;                      // Thứ Hai là cột đầu tiên
            const dim = new Date(ym.y, ym.m + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < lead; i++) cells.push(null);
            for (let d = 1; d <= dim; d++) cells.push(d);
            while (cells.length % 7) cells.push(null);
            const pad = (n) => String(n).padStart(2, '0');
            const keyOf = (d) => ym.y + '-' + pad(ym.m + 1) + '-' + pad(d);
            const todayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
            const go = (delta) => setYm((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
            const hasData = Object.keys(all).length > 0;
            // Mặc định mọi ngày học (Thứ Hai - Thứ Bảy) đã qua mà giáo viên không ghi nhận gì = "Lớp đủ" (có mặt)
            const isDefaultPresent = (d, k) => !all[k] && k <= todayKey && new Date(ym.y, ym.m, d).getDay() !== 0;
            const mp = ym.y + '-' + pad(ym.m + 1) + '-';
            const mcount = { present: 0, late: 0, excused: 0, unexcused: 0, dayoff: 0 };   // số ngày của THÁNG đang xem
            for (let d = 1; d <= dim; d++) { const k = keyOf(d); if (all[k] && mcount[all[k]] !== undefined) mcount[all[k]]++; else if (isDefaultPresent(d, k)) mcount.present++; }
            const monthRows = Object.keys(all).filter((k) => k.indexOf(mp) === 0 && ATT_STATUS[all[k]] && all[k] !== 'present').sort();
            return (
                <div className="bg-white rounded-2xl shadow-sm p-4 w-full h-full flex-1 flex flex-col">
                    <h2 className="font-bold text-slate-900 text-sm mb-3">Lịch chuyên cần &amp; nề nếp</h2>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        {[['late', 'Đi muộn'], ['excused', 'Vắng có phép'], ['unexcused', 'Vắng không phép']].map(([k, l]) => (
                            <div key={k} className={'rounded-xl p-2.5 ' + ATT_STATUS[k].cell}>
                                <p className="text-xl font-black">{loading ? '...' : stat[k]}</p>
                                <p className="text-[10px] font-bold uppercase leading-tight">{l}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-slate-400 -mt-2 mb-3 text-center">Tổng số buổi tích lũy</p>
                    <div className="flex items-center justify-between mb-2">
                        <button type="button" onClick={() => go(-1)} aria-label="Tháng trước" className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">‹</button>
                        <p className="text-sm font-bold text-slate-800">Tháng {ym.m + 1}/{ym.y}</p>
                        <button type="button" onClick={() => go(1)} aria-label="Tháng sau" className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w) => <div key={w} className="text-[10px] font-bold text-slate-400">{w}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((d, i) => {
                            if (d === null) return <div key={i} />;
                            const k = keyOf(d), st = ATT_STATUS[all[k]], dflt = isDefaultPresent(d, k), nt = (notes || {})[k];
                            return <div key={i} title={st ? st.label + (nt ? ': ' + nt : '') : (dflt ? 'Lớp đủ' : '')} className={'aspect-square max-h-12 rounded-lg flex items-center justify-center text-xs font-semibold ' + (st ? st.cell : dflt ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 bg-slate-50') + (k === todayKey ? ' ring-2 ring-indigo-500' : '')}>{d}</div>;
                        })}
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Chú thích • Tháng {ym.m + 1}</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[['present', 'Có mặt', 'bg-emerald-100 border border-emerald-300'], ['late', 'Đi muộn', 'bg-amber-200 border border-amber-300'], ['excused', 'Vắng có phép', 'bg-sky-200 border border-sky-300'], ['unexcused', 'Vắng không phép', 'bg-red-200 border border-red-300'], ['dayoff', 'Ngày nghỉ của lớp', 'bg-purple-200 border border-purple-300']].map(([k, l, c]) => (
                                <div key={k} className={'flex items-center gap-2 bg-white rounded-lg px-2.5 py-2 shadow-sm' + (k === 'dayoff' ? ' col-span-2' : '')}>
                                    <span className={'w-5 h-5 rounded-md shrink-0 ' + c} />
                                    <span className="flex-1 min-w-0 text-xs font-semibold text-slate-700 leading-tight">{l}</span>
                                    <span className="text-sm font-black text-slate-800">{loading ? '…' : mcount[k]}</span>
                                </div>))}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">💡 Ngày giáo viên không ghi nhận vắng / đi muộn mặc định tính là <b className="text-emerald-600">Có mặt</b>. Chủ nhật không tính buổi học.</p>
                    </div>
                    {!loading && monthRows.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-500 uppercase">Chi tiết tháng {ym.m + 1}</p>
                            {monthRows.map((k) => (
                                <div key={k} className={'rounded-lg px-2.5 py-1.5 text-xs ' + ATT_STATUS[all[k]].cell}>
                                    <b>{k.split('-').reverse().join('/')}</b> • {ATT_STATUS[all[k]].label}{(notes || {})[k] ? <span className="block font-normal opacity-90 break-words">📝 {notes[k]}</span> : null}
                                </div>))}
                        </div>)}
                    {!loading && !hasData && <p className="text-xs text-slate-400 mt-3 text-center">Chưa có ghi nhận vắng / đi muộn nào của học sinh này.</p>}
                    {(() => {   // Tỷ lệ đi học của THÁNG đang xem (không tính ngày nghỉ của lớp); đặt cuối thẻ để lấp chỗ trống
                        const tot = mcount.present + mcount.late + mcount.excused + mcount.unexcused, att = mcount.present + mcount.late;
                        const rate = tot ? Math.round(att / tot * 100) : null;
                        return (
                            <div className="mt-auto pt-4">
                                <div className="rounded-xl bg-emerald-50 p-3">
                                    <div className="flex items-end justify-between mb-1.5">
                                        <p className="text-[11px] font-bold text-emerald-700 uppercase">Tỷ lệ đi học • Tháng {ym.m + 1}</p>
                                        <p className="text-xl font-black text-emerald-600 leading-none">{loading ? '...' : rate === null ? '—' : rate + '%'}</p>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-white overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: (rate || 0) + '%' }} /></div>
                                    <p className="text-[11px] text-emerald-700/70 mt-1.5">{loading ? 'Đang tải...' : tot ? 'Có mặt ' + att + '/' + tot + ' buổi' + (mcount.late ? ' (gồm ' + mcount.late + ' buổi đi muộn)' : '') : 'Tháng này chưa có buổi học nào được tính'}</p>
                                </div>
                            </div>);
                    })()}
                </div>
            );
        }


        // 4) Bài tập: thẻ TÓM TẮT gọn (luôn cùng kích thước) + cửa sổ "Tất cả bài tập" có bộ lọc
        function ParentHomework({ rows, scoreText }) {
            const [open, setOpen] = useState(false);
            const [flt, setFlt] = useState('all');
            const [shown, setShown] = useState(10);
            const loading = rows === null;
            const list = rows || [];
            const isGraded = (r) => (r.adminEdited && r.graded) || (r.graded && r.status !== 'timeout');
            const pct = (r) => isGraded(r) ? clampScore(r.score) : r.status === 'timeout' ? 0 : r.status === 'submitted' ? null : clampScore((Number(r.score) || 0) / (r.total || 1) * 100);
            const kind = (r) => r.status === 'timeout' ? 'late' : pct(r) === null ? 'pending' : 'graded';
            const scored = list.map((x) => pct(x.sub)).filter((v) => v !== null);
            const avg = scored.length ? Math.round(scored.reduce((a, v) => a + v, 0) / scored.length * 10) / 10 : null;
            const nPending = list.filter((x) => kind(x.sub) === 'pending').length;
            const KIND = { graded: ['Đã chấm', 'bg-emerald-100 text-emerald-700'], pending: ['Chờ chấm', 'bg-amber-100 text-amber-700'], late: ['Hết giờ', 'bg-red-100 text-red-700'] };
            const filtered = flt === 'all' ? list : list.filter((x) => kind(x.sub) === flt);
            const Row = ({ r }) => (
                <div className="border border-slate-100 rounded-xl p-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 min-w-0 break-words">{r.title}</p>
                        <span className="shrink-0 text-sm font-black text-indigo-600">{scoreText(r.sub)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + KIND[kind(r.sub)][1]}>{KIND[kind(r.sub)][0]}</span>
                        {r.at ? <span className="text-[11px] text-slate-400">Nộp {new Date(r.at).toLocaleDateString('vi-VN')}</span> : null}
                    </div>
                    {r.sub.feedback ? <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded-lg p-2">💬 {r.sub.feedback}</p> : null}
                </div>
            );
            return (
                <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 flex-1">
                    <h2 className="font-bold text-slate-900 text-sm">Bài tập</h2>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-indigo-50 rounded-xl p-2.5"><p className="text-xl font-black text-indigo-600">{loading ? '...' : list.length}</p><p className="text-[10px] font-bold text-indigo-500 uppercase leading-tight">Đã nộp</p></div>
                        <div className="bg-emerald-50 rounded-xl p-2.5"><p className="text-xl font-black text-emerald-600">{loading ? '...' : avg === null ? '—' : avg}</p><p className="text-[10px] font-bold text-emerald-600 uppercase leading-tight">Điểm TB /100</p></div>
                        <div className="bg-amber-50 rounded-xl p-2.5"><p className="text-xl font-black text-amber-600">{loading ? '...' : nPending}</p><p className="text-[10px] font-bold text-amber-600 uppercase leading-tight">Chờ chấm</p></div>
                    </div>
                    {!loading && list.length === 0 && <p className="text-sm text-slate-400 text-center">Học sinh chưa nộp bài tập nào.</p>}
                    {list.length > 0 && <p className="text-[11px] font-bold text-slate-500 uppercase -mb-1">Gần đây nhất</p>}
                    <div className="space-y-2">{list.slice(0, 3).map((r, i) => <Row key={i} r={r} />)}</div>
                    {list.length > 3 && <button type="button" onClick={() => { setFlt('all'); setShown(10); setOpen(true); }} className="w-full mt-auto py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold">Xem tất cả ({list.length} bài) ›</button>}
                    {open && (
                        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
                            <div className="bg-slate-50 w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <div className="p-4 pb-2 flex items-center justify-between">
                                    <h3 className="font-extrabold text-slate-900">Tất cả bài tập <span className="text-xs font-semibold text-slate-400">({list.length})</span></h3>
                                    <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold">✕</button>
                                </div>
                                <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
                                    {[['all', 'Tất cả'], ['graded', 'Đã chấm'], ['pending', 'Chờ chấm'], ['late', 'Hết giờ']].map(([k, l]) => (
                                        <button key={k} type="button" onClick={() => { setFlt(k); setShown(10); }} className={'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ' + (flt === k ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200')}>{l}{k === 'all' ? '' : ' (' + list.filter((x) => kind(x.sub) === k).length + ')'}</button>))}
                                </div>
                                <div className="p-4 pt-2 overflow-y-auto space-y-2">
                                    {filtered.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">Không có bài nào.</p> : filtered.slice(0, shown).map((r, i) => <Row key={i} r={r} />)}
                                    {filtered.length > shown && <button type="button" onClick={() => setShown(shown + 10)} className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-indigo-700 text-sm font-bold">Xem thêm {Math.min(10, filtered.length - shown)} bài (còn {filtered.length - shown})</button>}
                                </div>
                            </div>
                        </div>)}
                </div>
            );
        }


        function ParentPortal({ student, onExit }) {
            const [data, setData] = useState(null);   // null = đang tải
            const [cover, setCover] = useState(null);  // ảnh bìa của học sinh: covers/{uid} (bản công khai cho phụ huynh; tải riêng vì dung lượng lớn)
            const [tab, setTab] = useState('ov');      // chỉ dùng trên điện thoại: 'ov' Tổng quan | 'att' Chuyên cần | 'hw' Bài tập (laptop hiện đủ cả 3)
            useEffect(() => {
                let dead = false;
                (async () => {
                    const uid = student.id;
                    const safe = async (fn, fallback) => { try { return await fn(); } catch (e) { return fallback; } };   // một khối lỗi không làm hỏng cả trang
                    const prof = await safe(async () => { const d = await fbDb.collection('profiles').doc(uid).get(); return d.exists ? d.data() : {}; }, {});
                    const [ev, att, subs, sum, adjOwn] = await Promise.all([
                        safe(async () => { const d = await fbDb.collection('evaluations').doc(uid).get(); return d.exists ? d.data() : null; }, null),
                        safe(async () => { const d = await fbDb.collection('attendance').doc(uid).get(); const x = d.exists ? d.data() : {}; return { days: x.days && typeof x.days === 'object' ? x.days : {}, notes: x.notes && typeof x.notes === 'object' ? x.notes : {} }; }, { days: {}, notes: {} }),
                        safe(async () => (await fbDb.collection('submissions').where('uid', '==', uid).get()).docs.map((d) => d.data()), []),
                        safe(async () => ((await fbDb.collection('bxh').doc('summary').get()).data() || {}).users || {}, {}),
                        safe(async () => { const d = await fbDb.collection('bxhScores').doc(uid).get(); const v = d.exists ? d.data().adjustXp : 0; return typeof v === 'number' ? v : 0; }, 0)
                    ]);
                    // Tổng điểm BXH = tổng XP các bài nộp + adjustXp (không âm) - cùng công thức với BXH của học sinh
                    const base = subs.reduce((a, r) => a + subXp(r), 0), adj = adjOwn;
                    const xp = { base, adj, total: Math.max(0, base + adj) };
                    // Hạng trong lớp = học sinh CÙNG TRƯỜNG + CÙNG LỚP, lấy từ summary (0 lượt đọc thêm)
                    const rank = (() => {
                        const sk = String(prof.targetSchoolId || ''), cl = String(prof.cls || ''); if (!sk || !cl) return null;
                        const tot = (e) => Math.max(0, (Number(e.xp) || 0) + (Number(e.adj) || 0));
                        const mates = Object.keys(sum).filter((id) => id !== uid && sum[id].s === sk && sum[id].c === cl);
                        return { pos: 1 + mates.filter((id) => tot(sum[id]) > xp.total).length, n: mates.length + 1 };
                    })();
                    // Danh sách bài tập đã nộp
                    const titles = {};
                    await Promise.all([...new Set(subs.map((r) => r.hwId))].map((id) => fbDb.collection('assignments').doc(id).get()
                        .then((d) => { titles[id] = d.exists ? (d.data().title || 'Bài tập') : 'Bài tập đã bị xóa'; }).catch(() => { titles[id] = 'Bài tập'; })));
                    const ms = (r) => { const t = r.submittedAt || r.createdAt; return t && typeof t.toMillis === 'function' ? t.toMillis() : 0; };
                    const rows = subs.slice().sort((x, y) => ms(y) - ms(x)).map((r) => ({ title: titles[r.hwId] || 'Bài tập', sub: r, at: ms(r) }));
                    if (!dead) setData({ prof, ev, att, xp, rank, rows });
                })();
                return () => { dead = true; };
            }, [student.id]);

            useEffect(() => {
                let dead = false;
                fbDb.collection('covers').doc(student.id).get().then((d) => {
                    if (dead) return; const x = d.exists ? d.data() : null;
                    setCover(x && typeof x.cover === 'string' && COVER_RE.test(x.cover) ? { url: x.cover, pos: x.coverPos && typeof x.coverPos === 'object' ? x.coverPos : null } : null);
                }).catch(() => {});
                return () => { dead = true; };
            }, [student.id]);

            const scoreText = (r) => (r.adminEdited && r.graded) || (r.graded && r.status !== 'timeout') ? Math.round(clampScore(r.score) * 100) / 100 + '/100'
                : r.status === 'timeout' ? '0/100' : r.status === 'submitted' ? 'Chưa chấm'
                : (r.score + '/' + r.total + (Number(r.total) === 100 ? '' : ' (≈ ' + Math.round(clampScore((Number(r.score) || 0) / (r.total || 1) * 100)) + '/100)'));
            const d = data || {};
            return (
                <div className="min-h-screen bg-slate-50 p-4"><div className="max-w-5xl mx-auto space-y-4">
                    <p className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">Báo cáo dành cho Phụ huynh</p>
                    <ParentProfileCard student={student} prof={d.prof || {}} cover={cover} />
                    <div className="sticky top-0 z-30 md:hidden -mx-1 px-1 py-2 bg-slate-50/90 backdrop-blur">
                        <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1">
                            {[['ov', 'Tổng quan'], ['att', 'Chuyên cần'], ['hw', 'Bài tập' + (data ? ' (' + data.rows.length + ')' : '')]].map(([k, l]) => (
                                <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={'flex-1 py-2 rounded-xl text-xs font-bold transition-colors ' + (tab === k ? 'bg-indigo-600 text-white shadow' : 'text-slate-500')}>{l}</button>))}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 items-stretch">
                        <div className={(tab === 'att' ? 'hidden' : 'flex') + ' md:flex flex-col gap-4'}>
                            <div className={(tab === 'ov' ? 'flex' : 'hidden') + ' md:flex flex-col gap-4'}>
                                <ParentGoal student={student} prof={d.prof || {}} />
                                <ParentEvalRank ev={d.ev} xp={data ? data.xp : null} rank={d.rank} />
                            </div>
                            <div className={(tab === 'hw' ? 'flex' : 'hidden') + ' md:flex flex-col flex-1'}>
                                <ParentHomework rows={data ? data.rows : null} scoreText={scoreText} />
                            </div>
                        </div>
                        <div className={(tab === 'att' ? 'flex' : 'hidden') + ' md:flex flex-col'}>
                            <ParentAttendance days={data ? data.att.days : null} notes={data ? data.att.notes : {}} />
                        </div>
                    </div>
                    <button onClick={onExit} className="w-full max-w-md mx-auto block py-3 rounded-xl bg-slate-200 text-slate-700 text-sm font-bold">Thoát cổng phụ huynh</button>
                </div></div>
            );
        }

        export { ParentPortal, lookupStudentForParent };
