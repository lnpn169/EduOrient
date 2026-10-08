// EduOrient — màn hình QUẢN TRỊ (AdminPanel). Chỉ tải khi đăng nhập bằng tài khoản quản trị.
import { ErrorBoundary, fbDb, fbErr, fbNow, foldVN, isAdminEmail } from './app-core.jsx';
import { BxhScoreEditor, EMPTY_LIST, GroupSettingsModal, Icon, THEME_OPTS, bxhBumpXp, clampScore, keepList, keepMap, subXp, wipeMsgs } from './app-shared.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

        // Dựng lại bxh/summary từ đầu (chạy 1 lần để di chuyển dữ liệu cũ, và khi muốn đối soát)
        async function rebuildBxhSummary() {
            const [ps, ss, bs] = await Promise.all([fbDb.collection('profiles').where('role', '==', 'student').get(), fbDb.collection('submissions').get(), fbDb.collection('bxhScores').get()]);
            const xp = {}, cnt = {}, adj = {};
            ss.forEach((d) => { const x = d.data(); xp[x.uid] = (xp[x.uid] || 0) + subXp(x); cnt[x.uid] = (cnt[x.uid] || 0) + 1; });
            bs.forEach((d) => { const v = (d.data() || {}).adjustXp; if (typeof v === 'number') adj[d.id] = v; });
            const users = {};
            ps.forEach((d) => { const p = d.data(); users[d.id] = { n: p.name || '', c: p.cls || '', s: p.targetSchoolId || '', sn: p.targetSchoolName || '', u: p.uniId || '', un: p.uniName || '', xp: xp[d.id] || 0, d: cnt[d.id] || 0, adj: adj[d.id] || 0 }; });
            await fbDb.collection('bxh').doc('summary').set({ users });   // ghi đè toàn bộ
            return Object.keys(users).length;
        }



        function AdminModerationImpl() {
            const [posts, setPosts] = useState([]);
            const [msgs, setMsgs] = useState([]);
            const [err, setErr] = useState('');
            const [delKey, setDelKey] = useState('');
            useEffect(() => {
                const a = fbDb.collection('posts').orderBy('createdAt', 'desc').limit(50).onSnapshot((s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => setErr(fbErr(e)));
                const b = fbDb.collection('chats').doc('class').collection('msgs').orderBy('createdAt', 'desc').limit(50).onSnapshot((s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => setErr(fbErr(e)));
                return () => { a(); b(); };
            }, []);
            const PERM = 'Không có quyền xóa. Hãy đăng nhập bằng nút Google với tài khoản quản trị (email đã xác minh) và bấm Publish lại firestore.rules.';
            const run = async (key, fn, okMsg) => {
                if (delKey) return;
                const yes = await eduConfirm('Nội dung sẽ bị xóa vĩnh viễn và không khôi phục được.', { title: 'Xóa nội dung này?', confirmText: 'Xóa', danger: true });
                if (!yes) return;
                setErr(''); setDelKey(key);
                fn().then(() => eduToast(okMsg, 'success'))
                    .catch((e) => eduAlert(e && e.code === 'permission-denied' ? PERM : fbErr(e), { icon: 'error', title: 'Không xóa được' }))
                    .finally(() => setDelKey(''));
            };
            const when = (x) => (x.createdAt && x.createdAt.toDate) ? x.createdAt.toDate().toLocaleString('vi-VN') : '';
            const dis = delKey ? ' opacity-50 pointer-events-none' : '';
            return (<div>
                {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                    <h2 className="font-bold text-sm mb-3">Bảng tin ({posts.length})</h2>
                    {posts.length === 0 && <p className="text-xs text-slate-400">Chưa có bài viết.</p>}
                    {posts.map((p) => (<div key={p.id} className="py-3 border-t border-slate-100">
                        <div className="flex justify-between gap-2"><div className="min-w-0"><p className="text-xs font-bold">{p.name} <span className="font-normal text-slate-400">• {when(p)}</span></p>
                            <p className="text-sm whitespace-pre-wrap break-words">{p.content}</p></div>
                            <button disabled={!!delKey} onClick={() => run('p' + p.id, () => fbDb.collection('posts').doc(p.id).delete(), 'Đã xóa bài viết.')} className={'shrink-0 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold h-fit' + dis}>{delKey === 'p' + p.id ? 'Đang xóa...' : 'Xóa bài'}</button></div>
                        {(p.comments || []).map((c, i) => (<div key={i} className="flex justify-between gap-2 mt-1 ml-3 bg-slate-50 rounded-lg px-2 py-1"><p className="text-xs break-words"><b>{c.name}:</b> {c.text}</p>
                            <button disabled={!!delKey} onClick={() => run('c' + p.id + '_' + i, () => fbDb.collection('posts').doc(p.id).update({ comments: firebase.firestore.FieldValue.arrayRemove(c) }), 'Đã xóa bình luận.')} className={'text-red-500 text-xs shrink-0' + dis}>✕</button></div>))}
                    </div>))}
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    <h2 className="font-bold text-sm mb-3">Chat cả lớp ({msgs.length} tin gần nhất)</h2>
                    {msgs.length === 0 && <p className="text-xs text-slate-400">Chưa có tin nhắn.</p>}
                    {msgs.map((m) => (<div key={m.id} className="flex justify-between gap-2 py-2 border-t border-slate-100">
                        <p className="text-xs break-words min-w-0"><b>{m.name}</b> <span className="text-slate-400">{when(m)}</span><br />{m.text}</p>
                        <button disabled={!!delKey} onClick={() => run('m' + m.id, () => fbDb.collection('chats').doc('class').collection('msgs').doc(m.id).delete(), 'Đã xóa tin nhắn.')} className={'shrink-0 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold h-fit' + dis}>{delKey === 'm' + m.id ? 'Đang xóa...' : 'Xóa'}</button></div>))}
                    <p className="text-[11px] text-slate-400 mt-3">Tin nhắn riêng giữa hai người không hiển thị ở đây để bảo vệ riêng tư.</p>
                </div>
            </div>);
        }


        // ===== Quản lý Nhóm Lớp & GVCN (Admin) =====
        function GroupHomeroomRowImpl({ g, teacher, onMembers, onDelete, deleting }) {
            const [email, setEmail] = useState('');
            const [busy, setBusy] = useState(false);
            const [msg, setMsg] = useState(null);   // { t: 'ok' | 'err', s: string }
            const has = !!g.homeroomTeacherUid;
            const assign = async () => {
                if (busy) return;
                const mail = email.trim().toLowerCase();
                if (!mail) return setMsg({ t: 'err', s: 'Vui lòng nhập Email giáo viên.' });
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return setMsg({ t: 'err', s: 'Email không đúng định dạng. Ví dụ: giaovien@gmail.com' });
                setBusy(true); setMsg(null);
                try {
                    // 1) Email phải tồn tại và là tài khoản Giáo viên ĐÃ DUYỆT
                    const q = await fbDb.collection('users').where('email', '==', mail).where('role', '==', 'teacher').where('status', '==', 'approved').limit(1).get();
                    if (q.empty) { setMsg({ t: 'err', s: 'Không tìm thấy giáo viên đã được duyệt nào dùng email "' + mail + '". Tài khoản học sinh hoặc giáo viên chưa duyệt / bị khóa không thể làm GVCN.' }); return; }
                    const tid = q.docs[0].id, tname = q.docs[0].data().name || mail;
                    if (tid === g.homeroomTeacherUid) { setMsg({ t: 'err', s: tname + ' đang là GVCN của lớp này rồi.' }); return; }
                    if (has) {
                        const yes = await eduConfirm('GVCN hiện tại (' + (teacher ? teacher.name : 'chưa rõ') + ') sẽ được thay bằng ' + tname + '. Mỗi lớp chỉ có 1 GVCN. GVCN cũ vẫn ở lại nhóm với vai trò thành viên (giáo viên bộ môn).', { title: 'Đổi GVCN của ' + (g.name || 'nhóm lớp') + '?', confirmText: 'Đổi GVCN' });
                        if (!yes) return;
                    }
                    // 2) Cập nhật homeroomTeacherUid (thay GVCN cũ) + 3) tự thêm GVCN mới vào members nếu chưa có (arrayUnion)
                    await fbDb.collection('groups').doc(g.id).update({ homeroomTeacherUid: tid, members: firebase.firestore.FieldValue.arrayUnion(tid) });
                    setEmail(''); setMsg({ t: 'ok', s: '✅ ' + tname + ' đã là GVCN của ' + (g.name || 'nhóm lớp') + '.' });
                    eduToast('Đã gán GVCN: ' + tname, 'success');
                } catch (e) {
                    setMsg({ t: 'err', s: e && e.code === 'permission-denied' ? 'Không có quyền. Hãy đăng nhập Google bằng tài khoản quản trị (email đã xác minh) và Publish lại firestore.rules mới.' : fbErr(e) });
                } finally { setBusy(false); }
            };
            return (
                <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{g.name || ('Nhóm Chat Lớp ' + (g.cls || ''))}</p>
                            <p className="text-[11px] text-slate-400 truncate">{g.schoolId || ''} • {(g.members || []).length} thành viên{g.monitorUid ? ' • có Lớp Trưởng' : ''}{(g.hiddenMembers || []).length ? ' • ' + g.hiddenMembers.length + ' đang ẩn' : ''}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                            <span className={'px-2 py-1 rounded-lg text-[10px] font-bold ' + (has ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500')}>{has ? 'Đã có GVCN' : 'Chưa có GVCN'}</span>
                            {onDelete && <button type="button" onClick={() => onDelete(g)} disabled={deleting} title="Xóa lớp" className={'px-2 py-1 rounded-lg text-[11px] font-bold border ' + (deleting ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100')}>{deleting ? 'Đang xóa...' : '🗑️ Xóa lớp'}</button>}
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-600">GVCN hiện tại: {has ? <b>{teacher ? (teacher.name + ' • ' + teacher.email) : ('(uid ' + g.homeroomTeacherUid.slice(0, 8) + '…)')}</b> : <span className="text-slate-400">chưa có</span>}</p>
                    <div className="flex gap-2 mt-2">
                        <input id="homeroom-email" name="homeroomEmail" aria-label="Email GVCN" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && assign()} placeholder="Nhập Email GVCN..." autoComplete="off" className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={assign} disabled={busy} className={'shrink-0 px-3 py-2 rounded-xl text-white text-xs font-bold ' + (busy ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700')}>{busy ? 'Đang xử lý...' : (has ? 'Đổi GVCN' : 'Xác nhận GVCN')}</button>
                    </div>
                    {msg && <p className={'text-xs mt-2 ' + (msg.t === 'ok' ? 'text-emerald-600' : 'text-red-600')}>{msg.s}</p>}
                    <button onClick={() => onMembers(g.id)} className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">👥 Thành viên & Lớp Trưởng</button>
                </div>
            );
        }


        function AdminGroupsImpl({ teachers, user }) {
            const [groups, setGroups] = useState(null);
            const [profiles, setProfiles] = useState({});
            const [openId, setOpenId] = useState('');
            const [err, setErr] = useState('');
            const [kw, setKw] = useState('');
            const [deletingId, setDeletingId] = useState('');
            const closeOpenId = useCallback(() => setOpenId(''), []);
            // Admin xóa nhóm lớp: xác nhận -> xóa toàn bộ tin nhắn (subcollection msgs) -> xóa document nhóm. Danh sách tự cập nhật nhờ onSnapshot.
            const deleteGroup = useCallback(async (g) => {
                if (deletingId) return;
                const label = g.name || ('Nhóm Chat Lớp ' + (g.cls || ''));
                const yes = await eduConfirm('Bạn có chắc chắn muốn xóa nhóm lớp ' + label + '? Hành động này sẽ xóa lớp khỏi hệ thống.', { title: 'Xóa nhóm lớp?', confirmText: 'Đồng ý, xóa lớp', cancelText: 'Hủy', danger: true });
                if (!yes) return;
                setDeletingId(g.id);
                try {
                    const ref = fbDb.collection('groups').doc(g.id);
                    await wipeMsgs(ref.collection('msgs'));
                    await ref.delete();
                    if (openId === g.id) setOpenId('');
                    eduToast('Đã xóa ' + label, 'success');
                } catch (e) {
                    eduAlert(e && e.code === 'permission-denied' ? 'Không có quyền xóa nhóm. Hãy đăng nhập bằng tài khoản quản trị (email đã xác minh) và Publish lại firestore.rules mới (đã cho phép Admin xóa nhóm).' : fbErr(e), 'error');
                } finally { setDeletingId(''); }
            }, [deletingId, openId]);
            useEffect(() => fbDb.collection('groups').onSnapshot(
                (s) => { const g = s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => x.type === 'class'); setGroups((prev) => keepList(prev || EMPTY_LIST, g, (x) => x.id)); },
                (e) => setErr(fbErr(e))), []);
            // TỐI ƯU ĐỌC: trước đây nghe CẢ collection profiles (mọi học sinh + giáo viên) chỉ để hiện tên thành viên.
            // Giờ chỉ tải hồ sơ của các thành viên trong nhóm ĐANG MỞ (get theo lô 30 id), và chỉ tải lại khi danh sách thành viên đổi.
            const openGroupDoc = (groups || []).find((g) => g.id === openId);
            const memKey = openGroupDoc ? (openGroupDoc.members || []).join(',') : '';
            useEffect(() => {
                if (!memKey) return;
                let dead = false;
                const ids = memKey.split(','), A = firebase.firestore.FieldPath.documentId();
                Promise.all(ids.reduce((a, c, i) => (i % 30 ? a : a.concat([ids.slice(i, i + 30)])), []).map((ch) => fbDb.collection('profiles').where(A, 'in', ch).get()))
                    .then((snaps) => { if (dead) return; const m = {}; snaps.forEach((s) => s.forEach((d) => { m[d.id] = d.data(); })); setProfiles((prev) => keepMap(prev, { ...prev, ...m })); })
                    .catch(() => {});
                return () => { dead = true; };
            }, [memKey]);
            const byId = useMemo(() => { const m = {}; (teachers || []).forEach((t) => { m[t.id] = t; }); return m; }, [teachers]);
            const norm = (x) => String(x || '').toLowerCase();
            const rows = useMemo(() => (groups || []).filter((g) => {
                if (!kw.trim()) return true;
                const t = byId[g.homeroomTeacherUid] || {};
                return (norm(g.name) + ' ' + norm(g.cls) + ' ' + norm(g.schoolId) + ' ' + norm(t.name) + ' ' + norm(t.email)).includes(norm(kw.trim()));
            }).sort((a, b) => String(a.schoolId || '').localeCompare(String(b.schoolId || '')) || String(a.cls || '').localeCompare(String(b.cls || ''), 'vi', { numeric: true })), [groups, kw, byId]);
            const withHr = (groups || []).filter((g) => g.homeroomTeacherUid).length;
            return (
                <div>
                    {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                        <h2 className="font-bold text-sm">Quản lý Nhóm Lớp & GVCN</h2>
                        <p className="text-[11px] text-slate-400 mt-1">Nhóm chat lớp do học sinh tự khởi tạo. Mỗi lớp chỉ có 1 GVCN; GVCN được tự thêm vào nhóm, có huy hiệu "GVCN", được xóa mọi tin nhắn vi phạm và phong / bãi nhiệm Lớp Trưởng.</p>
                        <input id="assign-search" name="keyword" aria-label="Tìm kiếm" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm theo lớp, trường, tên / email GVCN..." className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                        {groups && <p className="text-[11px] text-slate-500 mt-2">{groups.length} nhóm • {withHr} nhóm đã có GVCN</p>}
                    </div>
                    {groups === null && !err && <p className="text-xs text-slate-400">Đang tải danh sách nhóm...</p>}
                    {groups && rows.length === 0 && <p className="text-xs text-slate-400">{groups.length === 0 ? 'Chưa có nhóm chat lớp nào được khởi tạo.' : 'Không có nhóm phù hợp.'}</p>}
                    {rows.map((g) => <GroupHomeroomRow key={g.id} g={g} teacher={byId[g.homeroomTeacherUid]} onMembers={setOpenId} onDelete={deleteGroup} deleting={deletingId === g.id} />)}
                    {openId && (groups || []).find((g) => g.id === openId) && <GroupSettingsModal group={(groups || []).find((g) => g.id === openId)} profiles={profiles} user={user || {}} isAdmin={true} onClose={closeOpenId} />}
                </div>
            );
        }


        // ===================== PHẦN 3: ADMIN - QUẢN LÝ & CHỈNH SỬA ĐIỂM THEO EMAIL =====================
        // XP KHÔNG lưu cộng dồn: luôn tính lại từ các bài nộp (subXp) nên sửa điểm nhiều lần cũng không bị cộng dồn.
        // Công thức tương đương: newTotalXP = currentTotalXP - oldXP + newXP.
        function AdminScoreEditorImpl({ user }) {
            const [email, setEmail] = useState('');
            const [loading, setLoading] = useState(false);
            const [msg, setMsg] = useState('');
            const [student, setStudent] = useState(null);     // { id, name, email, cls, school }
            const [rows, setRows] = useState([]);             // mỗi dòng: { hwId, title, sub }
            const [inputs, setInputs] = useState({});         // hwId -> điểm mới (chuỗi)
            const [savingId, setSavingId] = useState('');
            const [board, setBoard] = useState(null);         // null = chưa tải; mảng = Top BXH
            const [boardLoading, setBoardLoading] = useState(false);

            const totalXp = rows.reduce((t, r) => t + subXp(r.sub), 0);
            const tsText = (t) => { try { const d = t && typeof t.toDate === 'function' ? t.toDate() : null; return d ? d.toLocaleString('vi-VN') : '-'; } catch (e) { return '-'; } };
            const statusOf = (s) => (s.adminEdited && s.graded) ? ['Admin đã sửa', 'bg-violet-50 text-violet-700']
                : s.status === 'timeout' ? ['Quá hạn (0đ)', 'bg-red-50 text-red-600']
                : s.graded ? ['Đã chấm', 'bg-emerald-50 text-emerald-700']
                : s.status === 'submitted' ? ['Chờ chấm', 'bg-amber-50 text-amber-700']
                : ['Đã nộp (trắc nghiệm)', 'bg-indigo-50 text-indigo-700'];
            const scoreOf = (s) => (s.adminEdited && s.graded) || (s.graded && s.status !== 'timeout') ? Math.round(clampScore(s.score) * 100) / 100 + '/100'
                : s.status === 'timeout' ? '0/100' : s.status === 'submitted' ? 'Chưa chấm' : (s.score + '/' + s.total + ' (≈ ' + Math.round(clampScore((Number(s.score) || 0) / (s.total || 1) * 100)) + '/100)');

            const loadBoard = async () => {
                setBoardLoading(true);
                try {
                    const d = await fbDb.collection('bxh').doc('summary').get();
                    const us = (d.data() || {}).users || {};
                    const list = Object.keys(us).map((id) => ({ id, name: us[id].n || 'Học sinh', cls: us[id].c || '', xp: Math.max(0, (Number(us[id].xp) || 0) + (Number(us[id].adj) || 0)) }))
                        .sort((a, b) => b.xp - a.xp).map((x, i) => ({ ...x, rank: i + 1 }));
                    setBoard(list);
                } catch (e) { eduAlert(fbErr(e), 'error'); }
                setBoardLoading(false);
            };

            useEffect(() => { loadBoard(); }, []);   // tải sẵn BXH để dropdown lớp / học sinh có dữ liệu

            const loadSubs = async (uid) => {
                const snap = await fbDb.collection('submissions').where('uid', '==', uid).get();
                const subs = snap.docs.map((d) => d.data());
                const titles = {};
                await Promise.all([...new Set(subs.map((s) => s.hwId))].map((id) => fbDb.collection('assignments').doc(id).get()
                    .then((d) => { titles[id] = d.exists ? (d.data().title || 'Bài tập') : 'Bài tập đã bị xóa'; }).catch(() => { titles[id] = 'Bài tập (' + id.slice(0, 6) + '…)'; })));
                const ms = (s) => { const t = s.submittedAt || s.createdAt; return t && typeof t.toMillis === 'function' ? t.toMillis() : 0; };
                setRows(subs.sort((a, b) => ms(b) - ms(a)).map((s) => ({ hwId: s.hwId, title: titles[s.hwId], sub: s })));
            };

            const search = async (e) => {
                if (e && e.preventDefault) e.preventDefault();
                const em = email.trim();
                if (!em) { setMsg('Vui lòng nhập email học sinh.'); return; }
                setLoading(true); setMsg(''); setStudent(null); setRows([]); setInputs({});
                try {
                    let snap = await fbDb.collection('users').where('email', '==', em).limit(1).get();
                    if (snap.empty && em.toLowerCase() !== em) snap = await fbDb.collection('users').where('email', '==', em.toLowerCase()).limit(1).get();
                    if (snap.empty) { setMsg('Không tìm thấy tài khoản nào với email này.'); setLoading(false); return; }
                    const u = { id: snap.docs[0].id, ...snap.docs[0].data() };
                    if (u.role !== 'student') { setMsg('Tài khoản này không phải học sinh (vai trò: ' + (u.role === 'teacher' ? 'Giáo viên' : u.role) + ').'); setLoading(false); return; }
                    let p = {}; try { const pd = await fbDb.collection('profiles').doc(u.id).get(); p = pd.exists ? pd.data() : {}; } catch (e2) {}
                    setStudent({ id: u.id, name: p.name || u.name || 'Học sinh', email: u.email, cls: p.cls || '', school: p.targetSchoolName || '' });
                    await loadSubs(u.id);
                } catch (e3) { setMsg(fbErr(e3)); }
                setLoading(false);
            };

            const save = async (r) => {
                if (savingId) return;
                const raw = String(inputs[r.hwId] === undefined ? '' : inputs[r.hwId]).trim().replace(',', '.');
                if (raw === '') { eduAlert('Vui lòng nhập điểm mới từ 0 đến 100.', 'warning'); return; }
                if (!/^\d+(\.\d{1,2})?$/.test(raw)) { eduAlert('Điểm phải là số không âm (tối đa 2 chữ số thập phân).', 'warning'); return; }
                const numericScore = Number(raw);                                                   // ép kiểu số bắt buộc
                if (numericScore > 100) { eduAlert('Điểm tối đa là 100.', 'warning'); return; }
                const newScore = Math.round(Math.min(100, Math.max(0, numericScore)) * 100) / 100;  // giới hạn 0 - 100
                const oldXp = subXp(r.sub), newXp = Math.round(newScore);                           // 1 điểm = 1 XP, KHÔNG nhân hệ số
                const newTotalXp = totalXp - oldXp + newXp;                                       // newTotalXP = currentTotalXP - oldXP + newXP
                const yes = await eduConfirm('Bài "' + r.title + '" của ' + student.name + ':\nĐiểm ' + scoreOf(r.sub) + ' → ' + newScore + '/100\nTổng XP: ' + totalXp + ' → ' + newTotalXp + ' XP', { title: 'Cập nhật điểm?', confirmText: 'Cập nhật', cancelText: 'Hủy', icon: 'question' });
                if (!yes) return;
                setSavingId(r.hwId);
                try {
                    const s = r.sub;
                    await fbDb.collection('submissions').doc(r.hwId + '_' + student.id).update({
                        score: newScore, graded: true, adminEdited: true, gradedAt: fbNow(), gradedBy: user.id,
                        quizXp: 0, essayXp: newXp, totalXp: newXp,                                  // Admin ghi đè: điểm = XP (1:1)
                        ...(s.mcqScore === undefined && !s.graded && s.status !== 'timeout' ? { mcqScore: s.score } : {}),   // giữ điểm trắc nghiệm gốc
                        ...(s.autoZero ? { autoZero: false } : {})
                    });
                    bxhBumpXp(student.id, newXp - oldXp);              // phản chiếu chênh lệch XP vào bxh/summary
                    await loadSubs(student.id);                       // tải lại danh sách + tổng XP từ Firestore
                    setInputs((m) => { const n = { ...m }; delete n[r.hwId]; return n; });
                    if (board) loadBoard();                           // làm mới BXH
                    eduToast('Đã cập nhật: ' + newScore + ' điểm = ' + newXp + ' XP', 'success');
                } catch (e) { eduAlert(e && e.code === 'permission-denied' ? 'Không có quyền sửa điểm. Hãy đăng nhập bằng tài khoản Admin (email đã xác minh) và Publish lại firestore.rules mới.' : fbErr(e), 'error'); }
                setSavingId('');
            };

            const myRank = board && student ? board.find((x) => x.id === student.id) : null;
            return (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1"><Icon name="clipboard-edit" className="w-4 h-4 text-indigo-600" /> Quản lý &amp; Chỉnh sửa Điểm</h3>
                        <p className="text-[11px] text-slate-500 mb-3">Nhập email học sinh để xem tất cả bài đã làm và sửa điểm (thang 0 - 100). Quy đổi: <b>tự luận 1 điểm = 1 XP</b> (tối đa 100 XP), <b>trắc nghiệm đúng 1 câu = 5 XP</b>.</p>
                        <form id="student-lookup-form" name="student-lookup-form" onSubmit={search} className="flex gap-2">
                            <input id="lookup-student-email" name="studentEmail" aria-label="Email học sinh" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email học sinh, VD: hocsinh@gmail.com" className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="submit" disabled={loading} className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5"><Icon name="search" className="w-4 h-4" />{loading ? 'Đang tìm...' : 'Tìm kiếm'}</button>
                        </form>
                        {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
                    </div>

                    {student && (
                        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                            <div className="flex flex-wrap justify-between items-start gap-2">
                                <div className="min-w-0"><p className="font-bold text-slate-900 truncate">{student.name}{student.cls ? <span className="ml-1 text-xs font-semibold text-slate-400">• Lớp {student.cls}</span> : null}</p>
                                    <p className="text-xs text-slate-500 truncate">{student.email}{student.school ? ' • ' + student.school : ''}</p></div>
                                <div className="text-right"><p className="text-[10px] text-slate-400 uppercase font-bold">Tổng XP</p><p className="text-xl font-black text-orange-600">{totalXp} XP</p>
                                    {myRank && <p className="text-[10px] text-slate-500">Hạng #{myRank.rank}/{board.length} toàn hệ thống</p>}</div>
                            </div>
                            {rows.length === 0 && <p className="text-xs text-slate-400">Học sinh này chưa nộp bài tập nào.</p>}
                            {rows.length > 0 && (
                                <div className="overflow-x-auto -mx-1">
                                    <table className="w-full text-xs min-w-[640px]">
                                        <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                                            <th className="py-2 px-1 font-bold">Tên bài tập</th><th className="py-2 px-1 font-bold">Ngày nộp</th><th className="py-2 px-1 font-bold">Trạng thái</th>
                                            <th className="py-2 px-1 font-bold">Điểm hiện tại</th><th className="py-2 px-1 font-bold">Điểm mới (0-100)</th><th className="py-2 px-1 font-bold"></th></tr></thead>
                                        <tbody>{rows.map((r) => { const [lb, cls] = statusOf(r.sub); const busy = savingId === r.hwId; return (
                                            <tr key={r.hwId} className="border-b border-slate-100 align-middle">
                                                <td className="py-2 px-1 font-semibold text-slate-800 max-w-[160px]"><span className="line-clamp-2">{r.title}</span></td>
                                                <td className="py-2 px-1 text-slate-500 whitespace-nowrap">{tsText(r.sub.submittedAt || r.sub.createdAt)}</td>
                                                <td className="py-2 px-1"><span className={'text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ' + cls}>{lb}</span></td>
                                                <td className="py-2 px-1 font-bold text-slate-800 whitespace-nowrap">{scoreOf(r.sub)}<span className="block text-[10px] font-semibold text-orange-600">{subXp(r.sub)} XP</span></td>
                                                <td className="py-2 px-1"><input id={`lookup-score-${r.hwId}`} name={`score-${r.hwId}`} aria-label="Điểm bài tập" type="number" inputMode="decimal" min="0" max="100" step="0.25" value={inputs[r.hwId] === undefined ? '' : inputs[r.hwId]} disabled={busy}
                                                    onChange={(e) => setInputs((m) => ({ ...m, [r.hwId]: e.target.value }))} placeholder="VD: 80" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50" /></td>
                                                <td className="py-2 px-1"><button type="button" onClick={() => save(r)} disabled={!!savingId || (inputs[r.hwId] === undefined || String(inputs[r.hwId]).trim() === '')}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 whitespace-nowrap"><Icon name="save" className="w-3.5 h-3.5" />{busy ? 'Đang lưu...' : 'Cập nhật'}</button></td>
                                            </tr>); })}</tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <ErrorBoundary inline><BxhScoreEditor user={user} students={(board || []).map((x) => ({ id: x.id, name: x.name, class: String(x.cls || '?').trim().toUpperCase(), xp: x.xp, rank: x.rank }))} onSaved={loadBoard} /></ErrorBoundary>

                    <div className="bg-white rounded-2xl shadow-sm p-4">
                        <div className="flex justify-between items-center gap-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><Icon name="trophy" className="w-4 h-4 text-amber-500" /> Bảng xếp hạng XP (Top 10)</h3>
                            <div className="flex gap-2 flex-wrap justify-end">
                                <button type="button" onClick={async () => {
                                    if (!(await eduConfirm('Thao tác đọc toàn bộ bài nộp một lần để dựng lại BXH tổng hợp. Chỉ nên chạy khi di chuyển dữ liệu hoặc cần đối soát.', { title: 'Dựng lại BXH tổng hợp?', confirmText: 'Chạy' }))) return;
                                    try { const n = await rebuildBxhSummary(); eduToast('Đã dựng BXH cho ' + n + ' học sinh', 'success'); loadBoard(); } catch (e) { eduAlert(fbErr(e), 'error'); }
                                }} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">Dựng lại BXH tổng hợp</button>
                            <button type="button" onClick={loadBoard} disabled={boardLoading} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1"><Icon name="refresh-cw" className="w-3.5 h-3.5" />{boardLoading ? 'Đang tải...' : board ? 'Làm mới' : 'Xem BXH'}</button>
                            </div>
                        </div>
                        {board && board.length === 0 && <p className="text-xs text-slate-400 mt-2">Chưa có học sinh.</p>}
                        {board && board.slice(0, 10).map((x) => (
                            <div key={x.id} className={'flex justify-between items-center py-2 border-t border-slate-100 text-sm ' + (student && x.id === student.id ? 'bg-indigo-50 rounded-lg px-2' : '')}>
                                <span className="min-w-0 truncate"><b className="text-indigo-600 mr-2">#{x.rank}</b>{x.name}{x.cls ? <span className="text-xs text-slate-400"> • {x.cls}</span> : null}</span>
                                <b className="shrink-0 text-orange-600 text-xs">{x.xp} XP</b>
                            </div>))}
                        {board && <p className="text-[10px] text-slate-400 mt-2">BXH tính từ điểm các bài nộp, trừ học sinh đã được chỉnh tay điểm tổng BXH (lấy theo điểm chỉnh tay).</p>}
                    </div>
                </div>
            );
        }


        function AdminPanel({ user, onLogout }) {
            const [list, setList] = useState([]);
            const [err, setErr] = useState('');
            const [card, setCard] = useState(null);
            const [tab, setTab] = useState('teachers');
            const [all, setAll] = useState([]), [q, setQ] = useState('');
            // TỐI ƯU ĐỌC: get() 1 lần khi mở tab (tối đa 500 tài khoản) + nút "Tải lại", thay cho onSnapshot cả collection users (mỗi thay đổi của bất kỳ ai đều tính lại lượt đọc).
            const [usersTick, setUsersTick] = useState(0);
            useEffect(() => {
                if (tab !== 'users') return;
                let dead = false;
                fbDb.collection('users').limit(500).get().then((s) => { if (!dead) setAll(s.docs.map((d) => ({ id: d.id, ...d.data() }))); }).catch((e) => { if (!dead) setErr(fbErr(e)); });
                return () => { dead = true; };
            }, [tab, usersTick]);
            const allShown = all.filter((u) => !isAdminEmail(u.email) &&  (!q.trim() || foldVN((u.name || '') + ' ' + (u.email || '')).includes(foldVN(q.trim()))));
            const delUser = (u) => eduConfirm('Thao tác này sẽ xóa vĩnh viễn dữ liệu tài khoản ' + (u.email || u.name) + ' khỏi hệ thống.', { title: 'Xóa tài khoản này?', confirmText: 'Xóa vĩnh viễn', danger: true }).then((yes) => {
                if (!yes) return; const b = fbDb.batch(); ['users', 'profiles', 'privates', 'teacherCards'].forEach((c) => b.delete(fbDb.collection(c).doc(u.id)));
                return b.commit().then(() => { setUsersTick((t) => t + 1); eduAlert('Đã xóa tài khoản.', 'success'); }).catch((e) => setErr(fbErr(e)));
            });
            const showCard = (id) => fbDb.collection('teacherCards').doc(id).get().then((d) => setCard(d.exists ? d.data().img : 'none')).catch((e) => setErr(fbErr(e)));
                        useEffect(() => fbDb.collection('users').where('role', '==', 'teacher').onSnapshot(
                (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => setErr(fbErr(e))), []);
            const setStatus = (id, status) => fbDb.collection('users').doc(id).update({ status }).catch((e) => setErr(fbErr(e)));
            const [priv, setPriv] = useState({});   // uid giáo viên đang bật "Ẩn khỏi danh sách tìm kiếm" (admin vẫn thấy đầy đủ)
            useEffect(() => fbDb.collection('profiles').where('role', '==', 'teacher').where('isPrivate', '==', true).onSnapshot((s) => { const m = {}; s.forEach((d) => { m[d.id] = true; }); setPriv(m); }, () => {}), []);   // chỉ đọc hồ sơ đang ẩn danh (trước đây đọc mọi hồ sơ giáo viên)
            // Admin bật/tắt "ẩn danh" cho giáo viên: ghi isPrivate vào profiles/{uid} (rules chỉ cho admin sửa ĐÚNG trường này)
            const togglePriv = (t) => { const to = !priv[t.id]; fbDb.collection('profiles').doc(t.id).update({ isPrivate: to }).then(() => eduToast((to ? 'Đã ẩn danh: ' : 'Đã bỏ ẩn danh: ') + (t.name || t.email), 'success')).catch((e) => eduAlert(e && e.code === 'not-found' ? 'Giáo viên này chưa có hồ sơ công khai (chưa đăng nhập lần nào).' : e && e.code === 'permission-denied' ? 'Không có quyền. Hãy Publish bản firestore.rules mới (cho phép admin sửa trường isPrivate).' : fbErr(e), 'error')); };
            const privBtn = (t) => <button onClick={() => togglePriv(t)} title={priv[t.id] ? 'Bỏ ẩn danh: giáo viên hiện lại trong danh sách tìm kiếm' : 'Ẩn danh: giáo viên không hiện trong danh sách tìm kiếm của học sinh / giáo viên khác'} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (priv[t.id] ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700')}>{priv[t.id] ? '👁 Bỏ ẩn' : '🔒 Ẩn danh'}</button>;
            const privBadge = <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">🔒 Ẩn danh</span>;
            const groups = [['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối / Khóa']];
            return (
                <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div><h1 className="text-xl font-extrabold text-indigo-600">Quản trị EduOrient</h1><p className="text-xs text-slate-500">{user.email}</p>
                            {user.diag && <p className="text-[10px] text-slate-400 mt-0.5">Đăng nhập: {user.diag.providers} • email đã xác minh: {user.diag.tokenVerified === null ? (user.diag.verified ? 'có' : 'chưa') : (user.diag.tokenVerified ? 'có' : 'CHƯA (token)')}</p>}</div>
                        <button onClick={onLogout} className="px-3 py-2 rounded-xl bg-white border text-xs font-semibold">Đăng xuất</button>
                    </div>
                    {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">{[['teachers', 'Duyệt giáo viên'], ['users', 'Quản lý người dùng'], ['mod', 'Kiểm duyệt bài đăng'], ['groups', 'Nhóm lớp & GVCN'], ['scores', 'Quản lý & Chỉnh sửa Điểm']].map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)} className={'py-2 rounded-xl text-sm font-bold ' + (tab === k ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600')}>{l}</button>))}
                        <AdminThemeSwitch /></div>
                    {tab === 'mod' && <AdminModeration />}
                    {tab === 'groups' && <ErrorBoundary inline><AdminGroups teachers={list} user={user} /></ErrorBoundary>}
                    {tab === 'scores' && <ErrorBoundary inline><AdminScoreEditor user={user} /></ErrorBoundary>}
                    {tab === 'users' && (<div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                        <div className="flex gap-2 mb-3">
                            <input id="user-search" name="userSearch" aria-label="Tìm theo tên hoặc email" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm theo tên hoặc email..." className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button onClick={() => setUsersTick((t) => t + 1)} title="Tải lại danh sách (1 lượt đọc / tài khoản)" className="shrink-0 px-3 py-2 rounded-xl bg-white border text-xs font-semibold">↻ Tải lại</button>
                        </div>
                        {allShown.length === 0 && <p className="text-xs text-slate-400">Không có người dùng.</p>}
                        {allShown.map((u) => (<div key={u.id} className="flex items-center justify-between gap-2 py-2 border-t border-slate-100">
                            <div className="min-w-0"><p className="text-sm font-semibold truncate">{u.name} <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span>{u.role === 'teacher' && priv[u.id] && privBadge}</p><p className="text-xs text-slate-500 truncate">{u.email}</p></div>
                            <div className="flex flex-wrap justify-end gap-2 shrink-0">{u.role === 'teacher' && privBtn(u)}<button onClick={() => delUser(u)} title="Xóa tài khoản" className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🗑 Xóa</button></div>
                        </div>))}
                    </div>)}
                    {card && (<div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4" onClick={() => setCard(null)}>
                        {card === 'none' ? <div className="bg-white rounded-2xl p-6 text-sm">Giáo viên này chưa tải ảnh thẻ.</div> : <img src={card} className="max-h-[85vh] max-w-full rounded-xl" />}</div>)}
                    {tab === 'teachers' && groups.map(([st, label]) => {
                        const rows = list.filter((x) => x.status === st);
                        return (
                            <div key={st} className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                                <h2 className="font-bold text-sm mb-3">{label} ({rows.length})</h2>
                                {rows.length === 0 && <p className="text-xs text-slate-400">Không có ai.</p>}
                                {rows.map((x) => (
                                    <div key={x.id} className="flex items-center justify-between gap-2 py-2 border-t border-slate-100">
                                        <div className="min-w-0"><p className="text-sm font-semibold truncate">{x.name}{priv[x.id] && privBadge}</p><p className="text-xs text-slate-500 truncate">{x.email}{x.subject ? ' • Môn ' + x.subject : ''}{x.school ? ' • ' + x.school : ''}</p></div>
                                        <div className="flex flex-wrap justify-end gap-2 shrink-0">
                                            {privBtn(x)}
                                            <button onClick={() => showCard(x.id)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Xem thẻ</button>
                                            <button onClick={() => delUser(x)} title="Xóa tài khoản" className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🗑</button>
                                            {st !== 'approved' && <button onClick={() => setStatus(x.id, 'approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">Duyệt</button>}
                                            {st !== 'rejected' && <button onClick={() => eduConfirm('Bạn có thể duyệt lại tài khoản này sau.', { title: 'Từ chối / khóa tài khoản này?', confirmText: st === 'approved' ? 'Khóa' : 'Từ chối', danger: true }).then((yes) => yes && setStatus(x.id, 'rejected'))} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">{st === 'approved' ? 'Khóa' : 'Từ chối'}</button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                    </div></div>
            );
        }


        // Công tắc Sáng / Tối gọn cho trang Quản trị: nằm trong ô trống của lưới tab. Dùng chung controller + khóa 'eduorient_theme' với ThemeModeBar.
        // Chỉ dùng class Tailwind có sẵn (bg-white / border / text-slate-600 / bg-indigo-600) nên tự đổi màu theo html.dark giống các nút tab bên cạnh.
        const AdminThemeSwitch = () => {
            const get = () => (window.getThemeMode ? window.getThemeMode() : 'system');
            const [mode, setModeState] = useState(get);
            useEffect(() => {
                const sync = () => setModeState(get());
                window.addEventListener('eduorient-theme', sync);
                window.addEventListener('storage', sync);
                return () => { window.removeEventListener('eduorient-theme', sync); window.removeEventListener('storage', sync); };
            }, []);
            const pick = (m) => { if (window.setThemeMode) window.setThemeMode(m); setModeState(m); };
            return (
                <div role="radiogroup" aria-label="Chế độ giao diện" className="flex rounded-xl border bg-white overflow-hidden">
                    {THEME_OPTS.map(([k, ic, lb]) => (
                        <button key={k} type="button" role="radio" aria-checked={mode === k} aria-label={lb} title={k === 'system' ? 'Theo hệ thống (Mặc định)' : 'Giao diện ' + lb.toLowerCase()} onClick={() => pick(k)}
                            className={'flex-1 flex items-center justify-center gap-1 py-2 text-sm font-bold ' + (mode === k ? 'bg-indigo-600 text-white' : 'text-slate-600')}>
                            <span>{ic}</span><span className="hidden sm:inline">{lb}</span>
                        </button>
                    ))}
                </div>
            );
        };

        const AdminModeration = memo(AdminModerationImpl);

        const GroupHomeroomRow = memo(GroupHomeroomRowImpl);

        const AdminGroups = memo(AdminGroupsImpl);

        const AdminScoreEditor = memo(AdminScoreEditorImpl);

        export { AdminPanel };
