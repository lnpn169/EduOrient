// EduOrient — code dùng chung cho các màn hình tải theo nhu cầu (Giáo viên / Quản trị / Phụ huynh). KHÔNG nằm trong gói tải ban đầu.
import { fbAuth, fbDb, fbErr, fbNow, initialsAvatar, safeAvatar } from './app-core.jsx';
import { Icon } from './app-icons.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;


        // ===== Tối ưu render: giữ NGUYÊN THAM CHIẾU cho dữ liệu không đổi giữa 2 lần snapshot Firestore =====
        // onSnapshot luôn trả về object/mảng mới -> nếu setState thẳng thì mọi component con (kể cả đã React.memo) đều render lại.
        // keepList/keepMap so sánh nội dung và trả về đúng object cũ khi không đổi, nên memo/useMemo bên dưới mới có tác dụng.
        const EMPTY_LIST = [];

        const sameJSON = (a, b) => { if (a === b) return true; try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } };

        const keepList = (prev, next, keyOf) => {
            if (!prev || !prev.length) return (next.length || !prev) ? next : prev;
            const old = new Map(); prev.forEach((x) => old.set(keyOf(x), x));
            let same = prev.length === next.length;
            const out = next.map((x, i) => { const o = old.get(keyOf(x)); const r = (o !== undefined && sameJSON(o, x)) ? o : x; if (r !== prev[i]) same = false; return r; });
            return same ? prev : out;
        };

        const keepMap = (prev, next) => {
            const pv = prev || {}, nk = Object.keys(next);
            let same = Object.keys(pv).length === nk.length;
            const out = {};
            nk.forEach((k) => { const o = pv[k]; const r = (o !== undefined && sameJSON(o, next[k])) ? o : next[k]; if (r !== o) same = false; out[k] = r; });
            return same ? pv : out;
        };


        // Cộng/trừ XP gốc của học sinh trong bxh/summary (atomic). Lỗi thì bỏ qua: học sinh sẽ tự chữa lại khi mở app.
        const bxhBumpXp = (uid, delta) => (!uid || !delta) ? Promise.resolve()
            : fbDb.collection('bxh').doc('summary').update({ ['users.' + uid + '.xp']: firebase.firestore.FieldValue.increment(delta) }).catch(() => {});


        // ===================== PHẦN 3: CỔNG PHỤ HUYNH - BÁO CÁO HỌC SINH =====================
        // Phụ huynh xác thực bằng Email + Mã học sinh, truy vấn Firestore trực tiếp (KHÔNG dùng Firebase Auth, chỉ đọc). Mọi dữ liệu đều lấy theo uid của DUY NHẤT học sinh đã xác thực.
        // Chuyên cần lưu ở attendance/{uid} = { days: { 'YYYY-MM-DD': 'late' | 'excused' | 'unexcused' | 'dayoff' (ngày nghỉ của lớp) }, notes: { 'YYYY-MM-DD': 'ghi chú' }, updatedBy, updatedAt }
        // (bản sao theo học sinh, được đồng bộ tự động từ attendances/{classId_date} mà giáo viên lưu - xem TeacherAttendance)
        const ATT_STATUS = {
            present:   { label: 'Có mặt',          cell: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
            late:      { label: 'Đi muộn',         cell: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
            excused:   { label: 'Vắng có phép',    cell: 'bg-sky-100 text-sky-700',         dot: 'bg-sky-500' },
            unexcused: { label: 'Vắng không phép', cell: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
            dayoff:    { label: 'Ngày nghỉ (lớp không đi học)', cell: 'bg-purple-100 text-purple-700 border border-purple-300', dot: 'bg-purple-500' }
        };

        const avatarUrl = (p) => (p && safeAvatar(p.avatar)) || initialsAvatar(p && p.name, 'd97706');

        // Ràng buộc điểm: luôn ép kiểu số và giới hạn 0 - 100
        const clampScore = (score) => { const numericScore = Number(score); return Math.min(100, Math.max(0, Number.isFinite(numericScore) ? numericScore : 0)); };

        // ===== QUY TẮC XP MỚI =====
        // Trắc nghiệm: mỗi câu ĐÚNG = 5 XP  =>  quizXp = totalCorrect * 5   (score trắc nghiệm = số câu đúng x 10)
        // Tự luận (GV chấm 0-100): essayXp = teacherScore (1 điểm = 1 XP)   =>  totalXp = quizXp + essayXp
        // XP luôn tính lại từ các bài nộp => sửa điểm không bao giờ bị cộng dồn (newTotalXP = currentTotalXP - oldXP + newXP).
        const PT_PER_Q = 10, XP_PER_CORRECT = 5;

        const correctOf = (mcqScore) => Math.round(Math.max(0, Number(mcqScore) || 0) / PT_PER_Q);
          // số câu đúng
        const quizXpOf = (mcqScore) => correctOf(mcqScore) * XP_PER_CORRECT;
                                // quizXp = totalCorrect * 5
        const essayXpOf = (teacherScore) => Math.round(clampScore(teacherScore));
                            // essayXp = teacherScore
        const subXp = (r) => (r.adminEdited && r.graded) ? essayXpOf(r.score)                               // Admin ghi đè thủ công: điểm = XP
            : r.status === 'timeout' ? 0
            : r.graded ? (typeof r.essayXp === 'number' ? Math.max(0, Math.round(Number(r.quizXp) || 0)) + Math.round(clampScore(r.essayXp)) : essayXpOf(r.score))   // bài cũ chưa có essayXp: giữ cách tính cũ
            : quizXpOf(r.score);


        // Xóa toàn bộ tin nhắn của 1 phòng: từng đợt 100 tin, mỗi đợt 20 lệnh delete() song song (mỗi lệnh là 1 request riêng nên không vướng giới hạn get() của rules khi batch)
        async function wipeMsgs(col) {
            let total = 0;
            for (let round = 0; round < 200; round++) {
                const s = await col.limit(100).get();
                if (s.empty) break;
                for (let i = 0; i < s.docs.length; i += 20) await Promise.all(s.docs.slice(i, i + 20).map((d) => d.ref.delete()));
                total += s.size;
                if (s.size < 100) break;
            }
            return total;
        }


        // ===== Cài đặt Nhóm Chat Lớp (Admin / GVCN): thành viên, thêm bằng Email, Kick, Lớp Trưởng, xóa lịch sử =====
        function GroupSettingsModalImpl({ group, profiles, user, isAdmin, onClose }) {
            const [busy, setBusy] = useState('');
            const [email, setEmail] = useState('');
            const [addMsg, setAddMsg] = useState(null);
            const hr = group.homeroomTeacherUid || '', mon = group.monitorUid || '';
            const hidden = Array.isArray(group.hiddenMembers) ? group.hiddenMembers : [];   // học sinh bật "Ẩn bản thân": GV / Admin vẫn thấy, kèm nhãn "Đang ẩn"
            const isHR = !isAdmin && hr === user.id;
            const canPromote = isAdmin || isHR;   // Phong / đổi / bãi nhiệm Lớp Trưởng: GVCN và Admin
            const canManage = isAdmin || isHR;     // Thêm bằng email, Kick, xóa lịch sử: Admin và GVCN (Lớp Trưởng thao tác ở hocsinh.html)
            const F = firebase.firestore.FieldValue;
            const info = (uid) => { const p = profiles[uid] || {}; return { uid, name: p.name || 'Thành viên', teacher: p.role === 'teacher' || uid === hr, cls: p.cls || '', subject: p.subject || '' }; };
            const rows = (group.members || []).map(info).sort((x, y) =>
                ((y.uid === hr) - (x.uid === hr)) || ((y.uid === mon) - (x.uid === mon)) || (y.teacher - x.teacher) || x.name.localeCompare(y.name, 'vi'));
            // Khi bị từ chối quyền: đọc lại nhóm + hồ sơ của chính mình để chỉ ra ĐÚNG điều kiện của firestore.rules đang không thỏa
            const diagnose = async (ctx) => {
                const hints = [];
                try {
                    const m = ctx.m, fresh = (await fbDb.collection('groups').doc(group.id).get()).data() || {};
                    const members = fresh.members || [];
                    if (isAdmin) {
                        const cu = fbAuth.currentUser;
                        if (!cu || !cu.emailVerified) hints.push('Tài khoản Admin chưa được xác minh email (đăng nhập bằng nút Google).');
                    } else {
                        const me = (await fbDb.collection('users').doc(user.id).get()).data() || {};
                        if (me.role !== 'teacher' || me.status !== 'approved') hints.push('Tài khoản của bạn chưa phải giáo viên ở trạng thái "đã duyệt".');
                        if (fresh.homeroomTeacherUid !== user.id && !members.includes(user.id)) hints.push('Bạn không phải GVCN và không nằm trong danh sách thành viên của nhóm này.');
                    }
                    if (!members.includes(m.uid)) hints.push(m.name + ' không còn trong nhóm.');
                    if (m.uid === user.id) hints.push('Không thể tự thao tác lên chính mình.');
                    if (ctx.kind === 'kick') {
                        if (!isAdmin && fresh.homeroomTeacherUid !== user.id) hints.push('Chỉ GVCN của nhóm hoặc Admin mới được xóa thành viên.');
                        if (m.uid === (fresh.monitorUid || '')) hints.push(m.name + ' đang là Lớp Trưởng: hãy bãi nhiệm trước khi xóa khỏi nhóm.');
                        if (m.uid === (fresh.homeroomTeacherUid || '')) hints.push(m.name + ' là GVCN, không thể bị xóa khỏi nhóm.');
                    }
                } catch (e2) { console.error('Lỗi chẩn đoán quyền:', e2); }
                return hints;
            };
            const fail = async (e, ctx) => {
                console.error(ctx && ctx.kind === 'kick' ? 'Lỗi Kick:' : 'Lỗi Lớp Trưởng:', e);   // xem F12 > Console: e.code / e.message cho nguyên nhân chính xác
                if (!(e && e.code === 'permission-denied')) return eduAlert(fbErr(e), 'error');
                const hints = ctx ? await diagnose(ctx) : [];
                eduAlert(hints.length
                    ? 'Không có quyền thực hiện. Nguyên nhân có thể:\n• ' + hints.join('\n• ')
                    : 'Firestore từ chối ghi dù các điều kiện trên màn hình đều hợp lệ. Gần như chắc chắn firestore.rules đang chạy trên Firebase chưa phải bản mới nhất: hãy Publish lại rồi tải lại trang (Ctrl+F5).', 'error');
            };
            const setMonitor = async (m, remove) => {
                if (busy || !canPromote) return;
                const yes = await eduConfirm(
                    remove ? m.name + ' sẽ mất quyền xóa tin nhắn trong nhóm.' : (mon ? 'Lớp Trưởng hiện tại sẽ được thay bằng ' + m.name + '. Mỗi lớp chỉ có 1 Lớp Trưởng.' : m.name + ' sẽ có quyền xóa tin nhắn vi phạm trong nhóm.'),
                    { title: remove ? 'Bãi nhiệm Lớp Trưởng?' : 'Phong ' + m.name + ' làm Lớp Trưởng?', confirmText: remove ? 'Bãi nhiệm' : 'Xác nhận', danger: remove });
                if (!yes) return;
                setBusy('m' + m.uid);
                try {
                    await fbDb.collection('groups').doc(group.id).update({ monitorUid: remove ? '' : m.uid });
                    eduToast(remove ? 'Đã bãi nhiệm Lớp Trưởng.' : 'Đã phong ' + m.name + ' làm Lớp Trưởng.', 'success');
                } catch (e) { fail(e, { kind: 'monitor', m, remove }); } finally { setBusy(''); }
            };
            // Kick: Admin hoặc GVCN (rules kiểm tra lại ở máy chủ). Không kick GVCN / Lớp Trưởng / chính mình.
            const canKick = canManage;
            const kick = async (m) => {
                if (busy || !canKick) return;
                const yes = await eduConfirm('Bạn có chắc muốn xóa ' + m.name + ' khỏi nhóm lớp?', { title: 'Kick khỏi nhóm?', confirmText: 'Xóa khỏi nhóm', danger: true });
                if (!yes) return;
                setBusy('k' + m.uid);
                try {
                    await fbDb.collection('groups').doc(group.id).update({ members: F.arrayRemove(m.uid), lastKickUid: m.uid });
                    eduToast('Đã xóa ' + m.name + ' khỏi nhóm lớp.', 'success');
                } catch (e) { fail(e, { kind: 'kick', m }); } finally { setBusy(''); }
            };
            // Thêm thành viên bằng email (Admin / GVCN): tìm trong 'users' -> học sinh trước, nếu không có thì thử giáo viên đã duyệt -> arrayUnion(uid) vào members
            const addByEmail = async () => {
                const em = email.trim().toLowerCase();
                if (busy || !canManage) return;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { setAddMsg({ t: 'err', s: 'Email không đúng định dạng. Ví dụ: ten@gmail.com' }); return; }
                setBusy('add'); setAddMsg(null);
                let step = '';
                try {
                    step = 'tra cứu email';
                    const snap = await fbDb.collection('users').where('email', '==', em).limit(1).get();   // .limit(1) bắt buộc để khớp firestore.rules
                    if (snap.empty) { setAddMsg({ t: 'err', s: 'Email không tồn tại trên hệ thống' }); eduAlert('Email không tồn tại trên hệ thống', 'error'); return; }
                    const d = snap.docs[0], u = d.data(), nm = u.name || em;
                    if (!(u.role === 'student' || (u.role === 'teacher' && u.status === 'approved'))) { setAddMsg({ t: 'err', s: 'Tài khoản "' + em + '" chưa ở trạng thái được duyệt (hoặc không phải học sinh / giáo viên) nên chưa thể thêm vào nhóm.' }); return; }
                    if ((group.members || []).includes(d.id)) { setAddMsg({ t: 'err', s: nm + ' đã có trong nhóm rồi.' }); return; }
                    if (u.role === 'student' && (profiles[d.id] || {}).cls && group.cls && profiles[d.id].cls !== group.cls) {
                        const ok = await eduConfirm(nm + ' đang thuộc lớp ' + profiles[d.id].cls + ', khác với lớp ' + group.cls + ' của nhóm. Vẫn thêm vào nhóm?', { title: 'Khác lớp', confirmText: 'Vẫn thêm' });
                        if (!ok) return;
                    }
                    step = 'cập nhật nhóm';
                    await fbDb.collection('groups').doc(group.id).update({ members: F.arrayUnion(d.id) });
                    setEmail(''); setAddMsg({ t: 'ok', s: 'Đã thêm ' + nm + ' vào nhóm.' });
                    eduAlert('Đã thêm ' + nm + ' vào nhóm.', 'success');
                } catch (err) {
                    console.error("Lỗi chi tiết:", err);
                    setAddMsg({ t: 'err', s: err && err.code === 'permission-denied' ? 'Không có quyền thêm thành viên (bước: ' + step + '). Hãy chắc chắn firestore.rules mới nhất đã được Publish, rồi tải lại trang (Ctrl+F5). Mở F12 > Console để xem lỗi chi tiết.' : fbErr(err) });
                } finally { setBusy(''); }
            };
            // Xóa toàn bộ lịch sử tin nhắn nhóm (Admin / GVCN)
            const wipeAll = async () => {
                if (busy || !canManage) return;
                const yes = await eduConfirm('Toàn bộ tin nhắn của nhóm sẽ bị xóa vĩnh viễn với mọi thành viên.', { title: 'Xóa toàn bộ lịch sử nhóm?', confirmText: 'Xóa', danger: true });
                if (!yes) return;
                setBusy('wipe');
                try { const n = await wipeMsgs(fbDb.collection('groups').doc(group.id).collection('msgs')); eduToast('Đã xóa ' + n + ' tin nhắn.', 'success'); }
                catch (e) { console.error('Lỗi xóa lịch sử:', e); fail(e); } finally { setBusy(''); }
            };
            const btn = 'shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ';
            return (
                <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-3" onClick={onClose}>
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm truncate"><Icon name="cog" className="ic-inline" /> {group.name || 'Nhóm lớp'}</h3>
                            <button onClick={onClose} className="text-slate-400 text-lg ml-2"><Icon name="close" className="ic-inline" /></button>
                        </div>
                        <div className="overflow-y-auto p-4">
                            <p className="text-[11px] text-slate-500 mb-3">{canManage ? (isAdmin ? 'Bạn đang quản lý nhóm với quyền Quản trị viên: ' : 'Bạn là GVCN của nhóm này: ') + 'thêm học sinh bằng email, xóa thành viên, xóa lịch sử chat và phong 1 học sinh làm Lớp Trưởng (tối đa 1 người; muốn xóa Lớp Trưởng khỏi nhóm, hãy bãi nhiệm trước). Học sinh có nhãn "Đang ẩn" đã tự ẩn mình khỏi danh sách của các bạn, nhưng bạn vẫn thấy đầy đủ.' : 'Bạn đang xem danh sách thành viên nhóm. Chỉ Admin, GVCN và Lớp Trưởng mới quản lý được nhóm.'}</p>
                            {canManage && <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3">
                                <p className="text-xs font-bold text-slate-700 mb-1"><Icon name="plus" className="ic-inline" /> Thêm học sinh vào nhóm bằng Email</p>
                                <p className="text-[10px] text-slate-500 mb-2">Nhập email tài khoản học sinh (cũng thêm được giáo viên bộ môn đã được duyệt).</p>
                                <div className="flex gap-2">
                                    <input id="add-student-email" name="studentEmail" aria-label="Email học sinh" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setAddMsg(null); }} onKeyDown={(e) => e.key === 'Enter' && addByEmail()} placeholder="Nhập Email học sinh..." className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500" />
                                    <button disabled={!!busy} onClick={addByEmail} className="shrink-0 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold">{busy === 'add' ? '...' : 'Thêm vào nhóm'}</button>
                                </div>
                                {addMsg && <p className={'text-[11px] mt-2 ' + (addMsg.t === 'err' ? 'text-red-600' : 'text-emerald-700')}>{addMsg.s}</p>}
                            </div>}
                            {canManage && <button disabled={!!busy} onClick={wipeAll} className="w-full mb-3 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold">{busy === 'wipe' ? 'Đang xóa...' : 'Xóa toàn bộ lịch sử tin nhắn nhóm'}</button>}
                            <p className="text-xs font-bold text-slate-700 mb-1">Thành viên ({rows.length})</p>
                            {rows.map((m) => {
                                const student = !m.teacher;
                                return (
                                    <div key={m.uid} className="flex items-center gap-2 py-2 border-t border-slate-100">
                                        <img src={avatarUrl(profiles[m.uid] || { name: m.name })} className="w-9 h-9 rounded-full object-cover shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold truncate">{m.name}{m.uid === user.id ? ' (Bạn)' : ''}
                                                {m.uid === hr && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold align-middle">GVCN</span>}
                                                {m.uid === mon && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-extrabold align-middle">Lớp Trưởng</span>}
                                                {hidden.includes(m.uid) && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-violet-600 text-white text-[9px] font-extrabold align-middle">Đang ẩn</span>}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{m.teacher ? (m.uid === hr ? 'Giáo viên chủ nhiệm' : (m.subject ? 'Giáo viên • Môn ' + m.subject : 'Giáo viên bộ môn')) : (m.cls ? 'Học sinh • Lớp ' + m.cls : 'Học sinh')}</p>
                                        </div>
                                        {student && canPromote && (
                                            <div className="flex flex-col gap-1 items-stretch">
                                                {m.uid === mon
                                                    ? <button disabled={!!busy} onClick={() => setMonitor(m, true)} className={btn + 'bg-red-50 text-red-600'}>{busy === 'm' + m.uid ? '...' : 'Bãi nhiệm'}</button>
                                                    : <button disabled={!!busy} onClick={() => setMonitor(m, false)} className={btn + 'bg-amber-50 text-amber-700 border border-amber-200'}>{busy === 'm' + m.uid ? '...' : (mon ? 'Đổi Lớp Trưởng' : 'Phong Lớp Trưởng')}</button>}
                                            </div>)}
                                        {canKick && m.uid !== hr && m.uid !== mon && m.uid !== user.id && (
                                            <button disabled={!!busy} onClick={() => kick(m)} className={btn + 'bg-red-50 text-red-600 border border-red-200 self-center'}>{busy === 'k' + m.uid ? '...' : 'Kick khỏi nhóm'}</button>)}
                                    </div>);
                            })}
                        </div>
                    </div>
                </div>
            );
        }


        // ===================== ADMIN + GIÁO VIÊN: ĐẶT LẠI ĐIỂM BXH BẰNG ĐIỂM CHÊNH LỆCH (adjustXp) =====================
        // Tổng điểm BXH = (Tổng XP từ tất cả bài nộp = computedXP) + adjustXp.
        // Khi GV/Admin nhập điểm mới targetScore:  adjustXp = targetScore - computedXP.
        // adjustXp lưu đồng bộ ở users/{uid} (nguồn gốc) và bxhScores/{uid} (bản sao công khai để BXH của mọi người đọc được).
        // Bài nộp MỚI về sau làm computedXP tăng => tổng BXH tự động cộng dồn trên mốc đã đặt. "Hủy chỉnh tay" => adjustXp = 0.
        function BxhScoreEditorImpl({ user, students, onSaved }) {
            const [cls, setCls] = useState('');
            const [stuId, setStuId] = useState('');
            const [base, setBase] = useState(0);         // Điểm bài làm gốc (computedXP)
            const [adjust, setAdjust] = useState(0);     // Điểm chênh lệch (adjustXp)
            const [loadingCur, setLoadingCur] = useState(false);
            const [input, setInput] = useState('');
            const [saving, setSaving] = useState(false);
            const [adjDocs, setAdjDocs] = useState({});    // uid -> { adjustXp, updatedAt } của các học sinh đã bị chỉnh tay (bxhScores)
            const [showEdited, setShowEdited] = useState(true);

            // Theo dõi realtime bxhScores: học sinh nào có adjustXp ≠ 0 = đã được Admin / Giáo viên chỉnh điểm
            useEffect(() => fbDb.collection('bxhScores').where('adjustXp', '!=', 0).onSnapshot((snap) => {
                const ids = new Set(students.map((s) => s.id)), m = {};
                snap.forEach((d) => { const v = d.data() || {}; if (ids.has(d.id) && typeof v.adjustXp === 'number') m[d.id] = { adjustXp: v.adjustXp, updatedAt: v.updatedAt && v.updatedAt.toMillis ? v.updatedAt.toMillis() : 0, updatedBy: v.updatedBy || '' }; });
                setAdjDocs(m);
            }, () => {}), [students.length]);

            const classOptions = [...new Set(students.map((s) => s.class).filter((c) => c && c !== '?'))].sort();
            if (students.some((s) => s.class === '?')) classOptions.push('?');
            const studentsOfClass = cls ? students.filter((s) => s.class === cls).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi')) : [];
            const student = studentsOfClass.find((s) => s.id === stuId) || null;
            const total = Math.max(0, base + adjust);   // Tổng điểm BXH hiện tại

            // Đọc mới nhất từ Firestore: computedXP (cộng XP mọi bài nộp) + adjustXp (bxhScores/{uid}, mọi người đăng nhập đều đọc được)
            const loadState = async (id) => {
                const [ss, bd] = await Promise.all([fbDb.collection('submissions').where('uid', '==', id).get(), fbDb.collection('bxhScores').doc(id).get()]);
                let computed = 0; ss.forEach((d) => { computed += subXp(d.data()); });
                const a = bd.exists ? Number((bd.data() || {}).adjustXp) : 0;
                return { computed, adjust: Number.isFinite(a) ? a : 0 };
            };

            useEffect(() => {
                setBase(0); setAdjust(0); setInput('');
                if (!stuId) return;
                let dead = false; setLoadingCur(true);
                (async () => {
                    try { const st = await loadState(stuId); if (!dead) { setBase(st.computed); setAdjust(st.adjust); } }
                    catch (e) { if (!dead) eduAlert(fbErr(e), 'error'); }
                    if (!dead) setLoadingCur(false);
                })();
                return () => { dead = true; };
            }, [stuId]);

            const pickClass = (v) => { setCls(v); setStuId(''); };
            const permMsg = (e) => (e && e.code === 'permission-denied' ? 'Không có quyền ghi điểm BXH. Hãy Publish firestore.rules mới (có nhánh adjustXp) và đăng nhập đúng tài khoản Admin / Giáo viên đã duyệt.' : fbErr(e));
            const writeAdjust = (id, adj) => {
                const batch = fbDb.batch();
                batch.update(fbDb.collection('users').doc(id), { adjustXp: adj, updatedBy: user.id, updatedAt: fbNow() });
                batch.set(fbDb.collection('bxhScores').doc(id), { adjustXp: adj, updatedBy: user.id, updatedAt: fbNow() });   // set (ghi đè) => xóa luôn trường "score" của bản cũ
                batch.set(fbDb.collection('bxh').doc('summary'), { users: { [id]: { adj } } }, { merge: true });               // phản chiếu vào BXH tổng hợp
                return batch.commit();
            };

            const raw = String(input).trim();
            const targetOk = /^\d+$/.test(raw) && Number(raw) <= 1000000;
            const previewAdj = targetOk ? Number(raw) - base : null;   // adjustXp sẽ lưu = targetScore - computedXP

            const save = async () => {
                if (saving || !student) return;
                if (raw === '') { eduAlert('Vui lòng nhập điểm BXH mới.', 'warning'); return; }
                if (!/^\d+$/.test(raw)) { eduAlert('Điểm BXH phải là số nguyên không âm (VD: 850).', 'warning'); return; }
                const targetScore = Number(raw);
                if (targetScore > 1000000) { eduAlert('Điểm BXH tối đa là 1.000.000.', 'warning'); return; }
                setSaving(true);
                try {
                    const st = await loadState(student.id);               // tính lại computedXP ngay lúc lưu để không bị lệch số
                    const adj = targetScore - st.computed;                // adjustXp = targetScore - computedXP
                    const cur = Math.max(0, st.computed + st.adjust);
                    const yes = await eduConfirm(student.name + ' (Lớp ' + (student.class === '?' ? '?' : student.class) + ')\nĐiểm bài làm gốc: ' + st.computed + ' XP\nĐiểm BXH: ' + cur + ' → ' + targetScore + ' XP\nĐiểm chênh lệch (adjustXp): ' + st.adjust + ' → ' + adj + '\nBài nộp mới về sau vẫn được cộng dồn bình thường.', { title: 'Lưu điểm BXH?', confirmText: 'Lưu thay đổi', cancelText: 'Hủy', icon: 'question' });
                    if (!yes) { setBase(st.computed); setAdjust(st.adjust); return; }
                    await writeAdjust(student.id, adj);
                    setBase(st.computed); setAdjust(adj); setInput('');
                    eduToast('Đã lưu điểm BXH: ' + targetScore + ' XP (adjustXp = ' + adj + ')', 'success');
                    if (onSaved) onSaved();                               // làm mới BXH ngay
                } catch (e) { eduAlert(permMsg(e), 'error'); }
                finally { setSaving(false); }
            };

            const reset = async () => {
                if (saving || !student) return;
                const yes = await eduConfirm('Hủy chỉnh tay của ' + student.name + ' (đặt adjustXp = 0) và quay về tính thuần túy theo các bài nộp?', { title: 'Hủy chỉnh tay?', confirmText: 'Hủy chỉnh tay', cancelText: 'Giữ nguyên', icon: 'question' });
                if (!yes) return;
                setSaving(true);
                try {
                    await writeAdjust(student.id, 0);
                    const st = await loadState(student.id);
                    setBase(st.computed); setAdjust(st.adjust); setInput('');
                    eduToast('Đã hủy chỉnh tay (adjustXp = 0).', 'success');
                    if (onSaved) onSaved();
                } catch (e) { eduAlert(permMsg(e), 'error'); }
                finally { setSaving(false); }
            };

            const selCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400';
            const fmtAdj = (n) => (n > 0 ? '+' + n : String(n));
            const editedList = Object.keys(adjDocs).map((id) => {
                const st = students.find((x) => x.id === id), a = adjDocs[id];
                return { id, name: st ? st.name : 'Học sinh', cls: st ? st.class : '?', adjust: a.adjustXp, total: st ? st.xp : null, at: a.updatedAt };
            }).sort((x, y) => (y.at || 0) - (x.at || 0));
            const fmtAt = (ms) => { if (!ms) return ''; const d = new Date(ms); return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
            return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                    <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><Icon name="trophy" className="w-4 h-4 text-amber-500" /> Chỉnh sửa điểm tổng BXH</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Đặt lại điểm BXH của học sinh bằng <b>điểm chênh lệch (adjustXp)</b>: <code>Tổng BXH = XP từ bài nộp + adjustXp</code>. Bài làm mới về sau của học sinh vẫn được cộng dồn bình thường trên mốc điểm mới. Chọn lớp, rồi chọn học sinh.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="block min-w-0">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Lớp</span>
                            <select id="xp-class" name="className" value={cls} onChange={(e) => pickClass(e.target.value)} className={selCls + ' mt-1'}>
                                <option value="">-- Chọn lớp --</option>
                                {classOptions.map((c) => <option key={c} value={c}>{c === '?' ? 'Chưa cập nhật lớp' : 'Lớp ' + c}</option>)}
                            </select>
                        </label>
                        <label className="block min-w-0">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Học sinh</span>
                            <select id="xp-student" name="studentId" value={stuId} onChange={(e) => setStuId(e.target.value)} disabled={!cls} className={selCls + ' mt-1'}>
                                <option value="">{cls ? '-- Chọn học sinh (' + studentsOfClass.length + ') --' : '-- Chọn lớp trước --'}</option>
                                {studentsOfClass.map((s) => <option key={s.id} value={s.id}>{(adjDocs[s.id] ? '✎ ' : '') + (s.name || 'Học sinh')}</option>)}
                            </select>
                        </label>
                    </div>
                    {classOptions.length === 0 && <p className="text-xs text-slate-400">Chưa có danh sách học sinh để chọn.</p>}
                    {student && (
                        <div className="border border-slate-100 rounded-xl p-3 space-y-3">
                            <div className="min-w-0"><p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
                                <p className="text-[11px] text-slate-400">{adjust !== 0 ? 'Đang được chỉnh tay (adjustXp ≠ 0)' : 'Đang tính thuần túy theo các bài nộp'}{student.rank ? ' • Hạng #' + student.rank : ''}</p></div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 rounded-xl p-2"><p className="text-[10px] text-slate-400 uppercase font-bold leading-tight">Điểm bài làm gốc</p>
                                    <p className="text-base font-black text-slate-700">{loadingCur ? '...' : base + ' XP'}</p></div>
                                <div className="bg-slate-50 rounded-xl p-2"><p className="text-[10px] text-slate-400 uppercase font-bold leading-tight">Điểm chênh lệch (adjustXp)</p>
                                    <p className={'text-base font-black ' + (adjust < 0 ? 'text-red-600' : adjust > 0 ? 'text-emerald-600' : 'text-slate-700')}>{loadingCur ? '...' : fmtAdj(adjust)}</p></div>
                                <div className="bg-orange-50 rounded-xl p-2"><p className="text-[10px] text-orange-500 uppercase font-bold leading-tight">Tổng điểm BXH hiện tại</p>
                                    <p className="text-base font-black text-orange-600">{loadingCur ? '...' : total + ' XP'}</p></div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <input id="xp-target-score" name="targetScore" aria-label="Điểm BXH mới" type="number" inputMode="numeric" min="0" max="1000000" step="1" value={input} disabled={saving || loadingCur}
                                    onChange={(e) => setInput(e.target.value)} placeholder="Điểm BXH mới (targetScore), VD: 50"
                                    className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" />
                                <button type="button" onClick={save} disabled={saving || loadingCur || raw === ''}
                                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 flex items-center gap-1.5"><Icon name="save" className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                            </div>
                            {previewAdj !== null && <p className="text-[11px] text-slate-500">Sau khi lưu: adjustXp = {Number(raw)} − {base} = <b>{fmtAdj(previewAdj)}</b>. Bài nộp mới +10 XP sẽ cho tổng <b>{Math.max(0, Number(raw) + 10)} XP</b>.</p>}
                            {adjust !== 0 && <button type="button" onClick={reset} disabled={saving} className="text-[11px] font-bold text-red-600 underline disabled:opacity-40">Hủy chỉnh tay (đặt adjustXp = 0, tính thuần túy theo bài nộp)</button>}
                        </div>
                    )}
                    {/* Danh sách học sinh đã được chỉnh điểm (adjustXp ≠ 0) */}
                    <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-3">
                        <button type="button" onClick={() => setShowEdited(!showEdited)} aria-expanded={showEdited} className="w-full flex items-center justify-between text-left">
                            <span className="text-sm font-bold text-slate-800"><Icon name="pencil" className="ic-inline" /> Học sinh đã được chỉnh điểm <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px]">{editedList.length}</span></span>
                            <span className="text-[11px] font-semibold text-slate-500">{showEdited ? 'Thu gọn' : 'Mở ra'}</span>
                        </button>
                        {showEdited && (editedList.length === 0
                            ? <p className="text-xs text-slate-400 mt-2">Chưa có học sinh nào bị chỉnh điểm (adjustXp = 0 với tất cả).</p>
                            : <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                                {editedList.map((e) => (
                                    <button key={e.id} type="button" onClick={() => { if (e.cls) { setCls(e.cls); setStuId(e.id); } }} className="w-full flex items-center gap-2 bg-white border border-slate-100 hover:border-indigo-300 rounded-lg px-3 py-2 text-left">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 truncate">{e.name}</p>
                                            <p className="text-[11px] text-slate-400">{e.cls === '?' ? 'Chưa cập nhật lớp' : 'Lớp ' + e.cls}{e.at ? ' • ' + fmtAt(e.at) : ''}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={'text-sm font-black ' + (e.adjust < 0 ? 'text-red-600' : 'text-emerald-600')}>{fmtAdj(e.adjust)} XP</p>
                                            {e.total !== null && <p className="text-[11px] text-slate-500">Tổng BXH: <b>{e.total}</b></p>}
                                        </div>
                                    </button>
                                ))}
                            </div>)}
                        <p className="text-[10px] text-slate-400 mt-2">Bấm vào một học sinh để chọn và chỉnh lại / hủy chỉnh tay. Danh sách tự cập nhật ngay khi có thay đổi.</p>
                    </div>
                </div>
            );
        }



        // Icon nét mảnh kiểu Lucide, nhúng thẳng SVG (không phụ thuộc font/CDN) -> không bao giờ hiện thành chữ. Dùng: <LIcon n="moon" className="w-4 h-4" />
        const LUCIDE = {
            monitor: <><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8M12 17v4" /></>,
            moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
            sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
            'user-check': <><path d="m16 11 2 2 4-4" /><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
            users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
            'shield-check': <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
            'graduation-cap': <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
            'bar-chart': <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
            menu: <path d="M4 6h16M4 12h16M4 18h16" />,
            x: <path d="M18 6 6 18M6 6l12 12" />,
            search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
            'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
            trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
            'id-card': <><rect width="20" height="14" x="2" y="5" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M14 10h4M14 14h4M5 17c.5-1.5 1.7-2 3-2s2.5.5 3 2" /></>,
            'eye-off': <><path d="M10.7 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a15 15 0 0 1-2.2 3M6.6 6.6A14.8 14.8 0 0 0 2.5 12S6 19 12 19a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
            eye: <><path d="M2.06 12.35a1 1 0 0 1 0-.7C3.42 8.1 7.36 5 12 5s8.58 3.1 9.94 6.65a1 1 0 0 1 0 .7C20.58 15.9 16.64 19 12 19s-8.58-3.1-9.94-6.65z" /><circle cx="12" cy="12" r="3" /></>,
            refresh: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" /></>,
        };
        const LIcon = ({ n, className = 'w-4 h-4' }) => (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={'shrink-0 ' + className}>{LUCIDE[n] || null}</svg>
        );

        const THEME_OPTS = [['system', 'monitor', 'Mặc định'], ['dark', 'weather-night', 'Tối'], ['light', 'white-balance-sunny', 'Sáng']];

        const GroupSettingsModal = memo(GroupSettingsModalImpl);

        const BxhScoreEditor = memo(BxhScoreEditorImpl);

        export { ATT_STATUS, BxhScoreEditor, EMPTY_LIST, GroupSettingsModal, Icon, LIcon, THEME_OPTS, avatarUrl, bxhBumpXp, clampScore, essayXpOf, keepList, keepMap, quizXpOf, subXp, wipeMsgs };
