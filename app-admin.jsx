// EduOrient — màn hình QUẢN TRỊ (AdminPanel). Chỉ tải khi đăng nhập bằng tài khoản quản trị.
import { ErrorBoundary, SCHOOL_DB, UiZoomPanel, UiZoomPopover, fbDb, fbErr, fbNow, foldVN, isAdminEmail } from './app-core.jsx';
import { BxhScoreEditor, EMPTY_LIST, GroupSettingsModal, Icon, LIcon, bxhBumpXp, clampScore, keepList, keepMap, subXp, wipeMsgs } from './app-shared.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

        // Dựng lại bxh/summary từ đầu (chạy 1 lần để di chuyển dữ liệu cũ, và khi muốn đối soát)
        // Giữ lại trường k (tổ hợp) cũ của từng học sinh: k không tính được từ submissions, mất k thì phải đồng bộ lại toàn bộ.
        async function rebuildBxhSummary() {
            const [ps, ss, bs, old] = await Promise.all([fbDb.collection('profiles').where('role', '==', 'student').get(), fbDb.collection('submissions').get(), fbDb.collection('bxhScores').get(), fbDb.collection('bxh').doc('summary').get()]);
            const oldUsers = (old.exists && (old.data() || {}).users) || {};
            const xp = {}, cnt = {}, adj = {};
            ss.forEach((d) => { const x = d.data(); xp[x.uid] = (xp[x.uid] || 0) + subXp(x); cnt[x.uid] = (cnt[x.uid] || 0) + 1; });
            bs.forEach((d) => { const v = (d.data() || {}).adjustXp; if (typeof v === 'number') adj[d.id] = v; });
            const users = {};
            ps.forEach((d) => { const p = d.data(); const kOld = (oldUsers[d.id] || {}).k; users[d.id] = { n: p.name || '', c: p.cls || '', s: p.targetSchoolId || '', sn: p.targetSchoolName || '', u: p.uniId || '', un: p.uniName || '', xp: xp[d.id] || 0, d: cnt[d.id] || 0, adj: adj[d.id] || 0, ...(typeof kOld === 'string' && kOld ? { k: kOld } : {}) }; });
            await fbDb.collection('bxh').doc('summary').set({ users });   // ghi đè toàn bộ (đã giữ lại k)
            return Object.keys(users).length;
        }

        // ===== BẮT ĐẦU KHỐI DÙNG CHUNG: tính "tổ hợp" của 1 tài khoản (hàm THUẦN, không phụ thuộc biến nào khác) =====
        // Copy NGUYÊN khối này (từ dòng BẮT ĐẦU tới dòng KẾT THÚC) sang app-admin.jsx ở giai đoạn 3B để app học sinh và admin cho CÙNG kết quả.
        // Vào : sc = { toan: 9, van: 8.5, anh: 7, ... } (điểm 0..10; thiếu khóa hoặc <= 0 nghĩa là KHÔNG học -> bỏ qua; học sinh cũ chưa có tin/cn/ktpl => tự coi là 0)
        // Ra  : chuỗi môn đã sắp xếp A-Z nối bằng "+", ví dụ "hoa+ly+toan"; trả '' nếu không tính được (thiếu Toán hoặc Văn, hoặc < 2 môn còn lại có điểm).
        // Quy tắc: (1) Toán + Văn bắt buộc; (2) lấy thêm 2 môn điểm cao nhất trong các môn còn lại (chỉ môn > 0) => 4 môn; (3) tổ hợp = 3 môn có tổng cao nhất trong 4 môn đó (tức bỏ môn thấp nhất).
        // Khi HÒA (chọn 2 môn, hoặc chọn môn bỏ): ưu tiên tổ hợp theo K_UU_TIEN (D01 > A00 > A01 > B00 > C00), rồi tới thứ tự môn cố định K_THU_TU_MON. Chỉ để kết quả ỔN ĐỊNH mỗi lần tính lại, KHÔNG có ý nghĩa khoa học.
        // Lưu ý: chỉ lưu chuỗi môn, KHÔNG lưu mã khối (A00, D01...) để dữ liệu không phụ thuộc bảng KHOI; phía hiển thị tự tra mã khối từ bảng.
        const K_THU_TU_MON = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'tin', 'cn', 'ktpl'];
        const K_UU_TIEN = ['anh+toan+van' /* D01 */, 'hoa+ly+toan' /* A00 */, 'anh+ly+toan' /* A01 */, 'hoa+sinh+toan' /* B00 */, 'dia+su+van' /* C00 */];
        function tinhToHopK(sc) {
            sc = sc || {};
            const v = m => { const x = Math.round(Number(sc[m]) * 10); return x > 0 ? x : 0; };   // nhân 10 làm tròn: so sánh số nguyên, không bị sai số số thực khi hòa điểm
            if (!(v('toan') > 0 && v('van') > 0)) return '';
            const others = K_THU_TU_MON.filter(m => m !== 'toan' && m !== 'van' && v(m) > 0);
            if (others.length < 2) return '';
            // Bước 1: các cặp môn tự chọn có tổng cao nhất (nhiều cặp nếu hòa điểm)
            let bestPair = -1, pairs = [];
            for (let i = 0; i < others.length; i++) for (let j = i + 1; j < others.length; j++) {
                const t = v(others[i]) + v(others[j]);
                if (t > bestPair) { bestPair = t; pairs = []; }
                if (t === bestPair) pairs.push([others[i], others[j]]);
            }
            // Bước 2: với mỗi cặp, thử bỏ lần lượt từng môn trong 4 môn; chọn bộ 3 tổng cao nhất, hòa thì theo K_UU_TIEN rồi theo thứ tự môn
            const cmpOrd = (x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
            const tot = (c, b) => c.sum !== b.sum ? c.sum > b.sum : c.rank !== b.rank ? c.rank < b.rank : cmpOrd(c.ord, b.ord) < 0;   // true nếu c "tốt hơn" b
            let best = null;
            pairs.forEach(p => {
                const four = ['toan', 'van', p[0], p[1]];
                four.forEach(drop => {
                    const tri = four.filter(m => m !== drop), key = tri.slice().sort().join('+'), pr = K_UU_TIEN.indexOf(key);
                    const c = { key: key, sum: tri.reduce((a, m) => a + v(m), 0), rank: pr < 0 ? K_UU_TIEN.length : pr, ord: tri.map(m => K_THU_TU_MON.indexOf(m)).sort((x, y) => x - y) };
                    if (!best || tot(c, best)) best = c;
                });
            });
            return best ? best.key : '';
        }
        // ===== KẾT THÚC KHỐI DÙNG CHUNG =====

        // Điều kiện "đã làm bài định hướng" PHẢN CHIẾU dhLDone() + dhQDone() ở hocsinh.js (app học sinh chỉ ghi k khi đủ điều kiện này, admin phải cùng quy tắc):
        // đủ 18 câu hỏi (K_SO_CAU = QS.length) + có điểm đủ ít nhất 1 trong 5 khối A00/A01/B00/C00/D01. Đổi số câu hỏi ở hocsinh.js thì phải đổi K_SO_CAU.
        // Trả: null = không có dh.sc (chưa làm / dữ liệu quá cũ) => bỏ qua, không đụng k; '' = chưa đủ điều kiện hoặc không tính được => k phải để trống; chuỗi = giá trị k.
        const K_SO_CAU = 18;
        const K_KHOI5 = [['toan', 'ly', 'hoa'], ['toan', 'ly', 'anh'], ['toan', 'hoa', 'sinh'], ['van', 'su', 'dia'], ['toan', 'van', 'anh']];
        function kTuPrivate(data) {
            const dh = (data || {}).dh;
            if (!dh || !dh.sc || typeof dh.sc !== 'object') return null;
            const sc = dh.sc, co = (m) => Math.round(Number(sc[m]) * 10) > 0;
            const dayDuCau = typeof dh.q === 'string' && new RegExp('^[012]{' + K_SO_CAU + '}$').test(dh.q);
            return dayDuCau && K_KHOI5.some((ms) => ms.every(co)) ? tinhToHopK(sc) : '';
        }

        // Nút "Đồng bộ tổ hợp": đọc privates/{uid}.dh của học sinh THEO LÔ (150 em/lô), tính k bằng tinhToHopK, ghi k vào bxh/summary mỗi lô (dừng giữa chừng vẫn giữ phần đã ghi).
        // Chi phí đọc = 1 lượt đọc / học sinh được xử lý + 1 lượt đọc bxh/summary. Mặc định bỏ qua em đã có k; tick "đọc lại cả em đã có k" để đối soát.
        function AdminKSync() {
            const [run, setRun] = useState(null);
            const [again, setAgain] = useState(false);
            const stopRef = useRef(false);
            const busy = !!run && !run.fin;
            const start = async () => {
                let us;
                try { us = ((await fbDb.collection('bxh').doc('summary').get()).data() || {}).users || {}; } catch (e) { eduAlert(fbErr(e), 'error'); return; }
                const ids = Object.keys(us).filter((id) => again || !us[id].k);
                if (!ids.length) { eduToast('Mọi học sinh trong BXH đã có tổ hợp.', 'success'); return; }
                if (!(await eduConfirm('Sẽ đọc dữ liệu riêng của ' + ids.length + ' học sinh (' + ids.length + ' lượt đọc Firestore), chia lô 150 em, có thể bấm Dừng bất cứ lúc nào. Em chưa làm xong bài định hướng sẽ không có tổ hợp và được đọc lại ở lần chạy sau.', { title: 'Đồng bộ tổ hợp?', confirmText: 'Chạy' }))) return;
                stopRef.current = false;
                const st = { done: 0, total: ids.length, wrote: 0, del: 0, skip: 0, fin: false, stopped: false, err: '' };
                setRun({ ...st });
                const A = firebase.firestore.FieldPath.documentId();
                try {
                    for (let i = 0; i < ids.length; i += 150) {
                        if (stopRef.current) { st.stopped = true; break; }
                        const lo = ids.slice(i, i + 150), chunks = [];
                        for (let j = 0; j < lo.length; j += 30) chunks.push(lo.slice(j, j + 30));
                        const snaps = await Promise.all(chunks.map((ch) => fbDb.collection('privates').where(A, 'in', ch).get()));
                        const got = {}; snaps.forEach((sn) => sn.forEach((d) => { got[d.id] = d.data(); }));
                        const patch = {};
                        lo.forEach((id) => {
                            const k = got[id] ? kTuPrivate(got[id]) : null, cur = us[id].k || '';
                            if (k === null) { st.skip++; return; }
                            if (k === cur) return;
                            if (k) { patch[id] = { k }; st.wrote++; } else if (cur) { patch[id] = { k: firebase.firestore.FieldValue.delete() }; st.del++; }
                        });
                        if (Object.keys(patch).length) await fbDb.collection('bxh').doc('summary').set({ users: patch }, { merge: true });
                        st.done += lo.length; setRun({ ...st });
                    }
                } catch (e) { st.err = fbErr(e); }
                st.fin = true; setRun({ ...st });
            };
            return (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={start} disabled={busy} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg disabled:opacity-50">Đồng bộ tổ hợp</button>
                        {busy && <button type="button" onClick={() => { stopRef.current = true; }} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Dừng</button>}
                        <label className="text-[11px] text-slate-500 flex items-center gap-1"><input type="checkbox" checked={again} disabled={busy} onChange={(e) => setAgain(e.target.checked)} />Đọc lại cả em đã có tổ hợp</label>
                    </div>
                    {run && (<div className="mt-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: Math.round(run.done / run.total * 100) + '%' }}></div></div>
                        <p className="text-[11px] text-slate-500 mt-1">Đã đọc {run.done}/{run.total} em • ghi mới/đổi {run.wrote} • xóa {run.del} • chưa có dữ liệu điểm {run.skip}
                            {run.fin ? (run.err ? <b className="text-red-600"> • Lỗi: {run.err} (phần đã ghi vẫn được giữ)</b> : run.stopped ? <b className="text-amber-600"> • Đã dừng (phần đã ghi vẫn được giữ)</b> : <b className="text-emerald-600"> • Xong</b>) : ' • đang chạy...'}</p>
                    </div>)}
                </div>);
        }

        // ===================== TÊN TRƯỜNG THEO schoolId (dùng cho Nhóm lớp & Chỉnh sửa điểm BXH) =====================
        // schoolId (targetSchoolId của học sinh, cũng là groups.schoolId và bxh/summary.users[uid].s) có dạng "<id tỉnh>-<slug trường>".
        // Thứ tự lấy tên: (1) danh sách trường chuẩn SCHOOL_DB (cùng quy tắc slug với hocsinh.js) -> (2) tên sn đã lưu trong bxh/summary -> (3) làm đẹp slug.
        // Ưu tiên danh sách chuẩn vì sn là chữ do học sinh tự ghi, không được rules kiểm tra nội dung.
        const NO_SCHOOL = '';   // học sinh / nhóm chưa có trường (hoặc mã cũ không còn đúng định dạng)
        const slugOfSchool = (s) => foldVN(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const SCHOOL_BY_ID = {};
        SCHOOL_DB.forEach((p) => p.schools.forEach((t) => { SCHOOL_BY_ID[p.id + '-' + slugOfSchool(t.name)] = { name: t.name, prov: p.name }; }));
        const prettySlug = (slug) => String(slug || '').split('-').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        function schoolInfoOf(id, sn) {
            id = String(id || '');
            if (!id) return { name: '', prov: '' };
            const hit = SCHOOL_BY_ID[id];
            if (hit) return { name: hit.name, prov: hit.prov };
            const p = SCHOOL_DB.find((x) => id.indexOf(x.id + '-') === 0);
            const nm = String(sn || '').replace(/\s+/g, ' ').trim().slice(0, 80);
            return { name: nm || prettySlug(p ? id.slice(p.id.length + 1) : id), prov: p ? p.name : '' };
        }
        // Nhãn hiển thị cho danh sách schoolId: { id: nhãn }. Hai trường trùng tên (khác tỉnh) thì thêm tên tỉnh để không bị lẫn.
        function buildSchoolLabels(entries) {   // entries: [{ id, sn }]
            const info = {}, byName = {};
            entries.forEach((e) => {
                const id = String(e.id || '');
                if (!id || info[id]) return;
                info[id] = schoolInfoOf(id, e.sn);
                const k = foldVN(info[id].name); byName[k] = (byName[k] || 0) + 1;
            });
            const out = {};
            Object.keys(info).forEach((id) => {
                const i = info[id], dup = byName[foldVN(i.name)] > 1;
                out[id] = dup ? i.name + (i.prov ? ' (' + i.prov + ')' : ' (' + id + ')') : i.name;
            });
            return out;
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
                            <button disabled={!!delKey} onClick={() => run('c' + p.id + '_' + i, () => fbDb.collection('posts').doc(p.id).update({ comments: firebase.firestore.FieldValue.arrayRemove(c) }), 'Đã xóa bình luận.')} className={'text-red-500 text-xs shrink-0' + dis}><Icon name="close" className="ic-inline" /></button></div>))}
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
        function GroupHomeroomRowImpl({ g, teacher, onMembers, onDelete, deleting, schoolLabel }) {
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
                    setEmail(''); setMsg({ t: 'ok', s: '' + tname + ' đã là GVCN của ' + (g.name || 'nhóm lớp') + '.' });
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
                            <p className="text-[11px] text-slate-400 truncate">{schoolLabel || g.schoolId || 'Chưa rõ trường'} • {(g.members || []).length} thành viên{g.monitorUid ? ' • có Lớp Trưởng' : ''}{(g.hiddenMembers || []).length ? ' • ' + g.hiddenMembers.length + ' đang ẩn' : ''}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                            <span className={'px-2 py-1 rounded-lg text-[10px] font-bold ' + (has ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500')}>{has ? 'Đã có GVCN' : 'Chưa có GVCN'}</span>
                            {onDelete && <button type="button" onClick={() => onDelete(g)} disabled={deleting} title="Xóa lớp" className={'px-2 py-1 rounded-lg text-[11px] font-bold border ' + (deleting ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100')}>{deleting ? 'Đang xóa...' : 'Xóa lớp'}</button>}
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-600">GVCN hiện tại: {has ? <b>{teacher ? (teacher.name + ' • ' + teacher.email) : ('(uid ' + g.homeroomTeacherUid.slice(0, 8) + '…)')}</b> : <span className="text-slate-400">chưa có</span>}</p>
                    <div className="flex gap-2 mt-2">
                        <input id="homeroom-email" name="homeroomEmail" aria-label="Email GVCN" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && assign()} placeholder="Nhập Email GVCN..." autoComplete="off" className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button onClick={assign} disabled={busy} className={'shrink-0 px-3 py-2 rounded-xl text-white text-xs font-bold ' + (busy ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700')}>{busy ? 'Đang xử lý...' : (has ? 'Đổi GVCN' : 'Xác nhận GVCN')}</button>
                    </div>
                    {msg && <p className={'text-xs mt-2 ' + (msg.t === 'ok' ? 'text-emerald-600' : 'text-red-600')}>{msg.s}</p>}
                    <button onClick={() => onMembers(g.id)} className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"><Icon name="account-group" className="ic-inline" /> Thành viên & Lớp Trưởng</button>
                </div>
            );
        }


        function AdminGroupsImpl({ teachers, user }) {
            const [groups, setGroups] = useState(null);
            const [profiles, setProfiles] = useState({});
            const [openId, setOpenId] = useState('');
            const [err, setErr] = useState('');
            const [kw, setKw] = useState('');
            const [sch, setSch] = useState('all');   // 'all' = Tất cả trường; còn lại = schoolId ('' = nhóm chưa rõ trường)
            const [snMap, setSnMap] = useState({});  // schoolId -> tên lấy từ bxh/summary (chỉ tải khi có nhóm mà danh sách trường chuẩn không biết)
            const [snTried, setSnTried] = useState(false);
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
            // Tên trường: ưu tiên danh sách chuẩn (không tốn lượt đọc). Chỉ khi có schoolId lạ mới đọc bxh/summary đúng 1 lần để lấy tên sn.
            const needSn = useMemo(() => (groups || []).some((g) => g.schoolId && !SCHOOL_BY_ID[g.schoolId]), [groups]);
            useEffect(() => {
                if (!needSn || snTried) return;
                setSnTried(true);
                fbDb.collection('bxh').doc('summary').get().then((d) => {
                    const us = (d.data() || {}).users || {}, m = {};
                    Object.keys(us).forEach((id) => { const e = us[id] || {}; if (e.s && e.sn && !m[e.s]) m[e.s] = String(e.sn); });
                    setSnMap(m);
                }).catch(() => {});   // không đọc được thì dùng slug làm đẹp
            }, [needSn, snTried]);
            const labels = useMemo(() => buildSchoolLabels((groups || []).map((g) => ({ id: g.schoolId, sn: snMap[g.schoolId] }))), [groups, snMap]);
            const labelOf = (g) => (g.schoolId ? labels[g.schoolId] : '') || '';
            // Danh sách trường cho ô chọn: sắp xếp theo tên, kèm số nhóm
            const schoolOpts = useMemo(() => {
                const cnt = {};
                (groups || []).forEach((g) => { const k = g.schoolId || ''; cnt[k] = (cnt[k] || 0) + 1; });
                return Object.keys(cnt).map((id) => ({ id, label: id ? (labels[id] || id) : 'Chưa rõ trường', n: cnt[id] }))
                    .sort((a, b) => (a.id === '' ? 1 : b.id === '' ? -1 : a.label.localeCompare(b.label, 'vi')));
            }, [groups, labels]);
            const schSel = sch !== 'all' && schoolOpts.some((o) => o.id === sch) ? sch : 'all';   // trường đang chọn bị xóa hết nhóm => quay về Tất cả
            const scoped = useMemo(() => (groups || []).filter((g) => schSel === 'all' || (g.schoolId || '') === schSel), [groups, schSel]);
            const rows = useMemo(() => scoped.filter((g) => {
                if (!kw.trim()) return true;
                const t = byId[g.homeroomTeacherUid] || {};
                return (norm(g.name) + ' ' + norm(g.cls) + ' ' + norm(g.schoolId) + ' ' + norm(labelOf(g)) + ' ' + norm(t.name) + ' ' + norm(t.email)).includes(norm(kw.trim()));
            }).sort((a, b) => labelOf(a).localeCompare(labelOf(b), 'vi') || String(a.schoolId || '').localeCompare(String(b.schoolId || '')) || String(a.cls || '').localeCompare(String(b.cls || ''), 'vi', { numeric: true })), [scoped, kw, byId, labels]);
            const withHr = scoped.filter((g) => g.homeroomTeacherUid).length;
            return (
                <div>
                    {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                        <h2 className="font-bold text-sm">Quản lý Nhóm Lớp & GVCN</h2>
                        <p className="text-[11px] text-slate-400 mt-1">Nhóm chat lớp do học sinh tự khởi tạo. Mỗi lớp chỉ có 1 GVCN; GVCN được tự thêm vào nhóm, có huy hiệu "GVCN", được xóa mọi tin nhắn vi phạm và phong / bãi nhiệm Lớp Trưởng.</p>
                        <select id="assign-school" name="schoolFilter" aria-label="Chọn trường" value={schSel} onChange={(e) => setSch(e.target.value)} className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="all">Tất cả trường{groups ? ' (' + groups.length + ' nhóm)' : ''}</option>
                            {schoolOpts.map((o) => <option key={'s:' + o.id} value={o.id}>{o.label} ({o.n} nhóm)</option>)}
                        </select>
                        <input id="assign-search" name="keyword" aria-label="Tìm kiếm" value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm theo lớp, trường, tên / email GVCN..." className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" />
                        {groups && <p className="text-[11px] text-slate-500 mt-2">{scoped.length} nhóm • {withHr} nhóm đã có GVCN</p>}
                    </div>
                    {groups === null && !err && <p className="text-xs text-slate-400">Đang tải danh sách nhóm...</p>}
                    {groups && rows.length === 0 && <p className="text-xs text-slate-400">{groups.length === 0 ? 'Chưa có nhóm chat lớp nào được khởi tạo.' : 'Không có nhóm phù hợp.'}</p>}
                    {rows.map((g) => <GroupHomeroomRow key={g.id} g={g} teacher={byId[g.homeroomTeacherUid]} onMembers={setOpenId} onDelete={deleteGroup} deleting={deletingId === g.id} schoolLabel={labelOf(g)} />)}
                    {openId && (groups || []).find((g) => g.id === openId) && <GroupSettingsModal group={(groups || []).find((g) => g.id === openId)} profiles={profiles} user={user || {}} isAdmin={true} onClose={closeOpenId} />}
                </div>
            );
        }


        // ===================== TAB "TỔ HỢP THEO TRƯỜNG" (Giai đoạn 4 - phần 1: khung, bộ lọc trường, dòng tổng kết) =====================
        // CHỈ đọc bxh/summary (1 lượt đọc khi mở tab, thêm 1 lượt mỗi lần bấm "Tải lại"). KHÔNG đọc privates.
        // y = số học sinh của trường trong bxh/summary; x = số em có k (đã làm bài định hướng và tính được tổ hợp).
        // Phần biểu đồ (cột ngang, "Khác", 5/10 cột theo isWide, chú giải KHOI_TEN) sẽ làm ở phần sau, gắn vào chỗ đánh dấu cuối component.
        // Bảng tra mã khối cho biểu đồ. CHỈ gồm khối thuần 3 môn học (không có môn năng khiếu/vẽ) nên tra được từ chuỗi môn k.
        // Đây là bản SAO của KHOI trong hocsinh.js (admin và app học sinh là 2 bundle riêng, không import chung được): thêm/sửa khối ở hocsinh.js thì sửa cả ở đây.
        // Đã đối chiếu với bảng mã tổ hợp xét tuyển 2026 (Bộ GD&ĐT, qua thuvienphapluat.vn): chỉ các tổ hợp 3 môn nằm trong 11 môn của app; 'cn' = Công nghệ công nghiệp (các mã Công nghệ nông nghiệp như X04, X08, X12... không đưa vào).
        // Khối năng khiếu (V00, V01, H00, T00, N00, M00) cố ý không đưa vào: chúng không suy ra được từ điểm 3 môn học.
        const KHOI_HIEN = { A00: ['toan', 'ly', 'hoa'], A01: ['toan', 'ly', 'anh'], B00: ['toan', 'hoa', 'sinh'], C00: ['van', 'su', 'dia'], D01: ['toan', 'van', 'anh'],
            X25: ['toan', 'anh', 'ktpl'], X26: ['toan', 'anh', 'tin'], X27: ['toan', 'cn', 'anh'], C14: ['van', 'toan', 'ktpl'], D84: ['toan', 'ktpl', 'anh'], D66: ['van', 'anh', 'ktpl'], C19: ['van', 'su', 'ktpl'], C20: ['van', 'dia', 'ktpl'],
            A02: ['toan', 'ly', 'sinh'], A03: ['toan', 'ly', 'su'], A04: ['toan', 'ly', 'dia'], A05: ['toan', 'hoa', 'su'], A06: ['toan', 'hoa', 'dia'], A07: ['toan', 'su', 'dia'], A08: ['toan', 'su', 'ktpl'], A09: ['toan', 'dia', 'ktpl'], A10: ['toan', 'ly', 'ktpl'], A11: ['toan', 'hoa', 'ktpl'], B02: ['toan', 'sinh', 'dia'], B03: ['toan', 'sinh', 'van'], B04: ['toan', 'sinh', 'ktpl'], B08: ['toan', 'sinh', 'anh'], C01: ['van', 'toan', 'ly'], C02: ['van', 'toan', 'hoa'], C03: ['van', 'toan', 'su'], C04: ['van', 'toan', 'dia'], C05: ['van', 'ly', 'hoa'], C08: ['van', 'hoa', 'sinh'], C09: ['van', 'ly', 'dia'], C10: ['van', 'hoa', 'su'], C11: ['van', 'hoa', 'dia'], C12: ['van', 'su', 'sinh'], C13: ['van', 'sinh', 'dia'], C18: ['van', 'sinh', 'ktpl'], X17: ['toan', 'su', 'ktpl'], X18: ['toan', 'su', 'tin'], X19: ['toan', 'su', 'cn'], X21: ['toan', 'dia', 'ktpl'], X22: ['toan', 'dia', 'tin'], X23: ['toan', 'dia', 'cn'], X53: ['toan', 'ktpl', 'tin'], X54: ['toan', 'ktpl', 'cn'], X58: ['van', 'ly', 'ktpl'], X59: ['van', 'ly', 'tin'], X60: ['van', 'ly', 'cn'], X62: ['van', 'hoa', 'ktpl'], X63: ['van', 'hoa', 'tin'], X64: ['van', 'hoa', 'cn'], X66: ['van', 'sinh', 'ktpl'], X67: ['van', 'sinh', 'tin'], X68: ['van', 'sinh', 'cn'], X71: ['van', 'su', 'tin'], X72: ['van', 'su', 'cn'], X75: ['van', 'dia', 'tin'], X76: ['van', 'dia', 'cn'], X79: ['van', 'anh', 'tin'], X80: ['van', 'anh', 'cn'], Y07: ['van', 'ktpl', 'tin'], Y08: ['van', 'ktpl', 'cn'], Y10: ['van', 'tin', 'cn'], C16: ['van', 'ly', 'ktpl'], C17: ['van', 'hoa', 'ktpl'], D07: ['toan', 'hoa', 'anh'], D08: ['toan', 'sinh', 'anh'], D09: ['toan', 'su', 'anh'], D10: ['toan', 'dia', 'anh'], D11: ['van', 'ly', 'anh'], D12: ['van', 'hoa', 'anh'], D13: ['van', 'sinh', 'anh'], D14: ['van', 'su', 'anh'], D15: ['van', 'dia', 'anh'], X06: ['toan', 'ly', 'tin'], X07: ['toan', 'ly', 'cn'], X01: ['van', 'toan', 'ktpl'], X02: ['toan', 'van', 'tin'], X03: ['toan', 'van', 'cn'], X05: ['toan', 'ly', 'ktpl'], X09: ['toan', 'hoa', 'ktpl'], X10: ['toan', 'hoa', 'tin'], X11: ['toan', 'hoa', 'cn'], X13: ['toan', 'sinh', 'ktpl'], X14: ['toan', 'sinh', 'tin'], X15: ['toan', 'sinh', 'cn'], X56: ['toan', 'tin', 'cn'], X70: ['van', 'su', 'ktpl'], X74: ['van', 'dia', 'ktpl'], X78: ['van', 'ktpl', 'anh'], B01: ['toan', 'su', 'sinh'], C06: ['van', 'ly', 'sinh'], C07: ['van', 'su', 'ly'] };
        // chuỗi môn đã sắp xếp (đúng dạng tinhToHopK trả về) -> danh sách mã khối. Có thể >1 mã cho cùng 1 bộ môn (ví dụ X25 và D84 cùng Toán-Anh-KTPL).
        const KHOI_THEO_K = {};
        Object.keys(KHOI_HIEN).forEach((c) => { const key = KHOI_HIEN[c].slice().sort().join('+'); (KHOI_THEO_K[key] = KHOI_THEO_K[key] || []).push(c); });
        const K_VIET_TAT = { toan: 'T', van: 'V', anh: 'Anh', ly: 'Lý', hoa: 'Hóa', sinh: 'Sinh', su: 'Sử', dia: 'Địa', tin: 'Tin', cn: 'CN', ktpl: 'KTPL' };
        // Nhãn cột: có mã khối thì chỉ ghi mã (nhiều mã nối bằng "/"); không có thì tên môn viết gọn, ví dụ "T-Lý-Tin"
        function nhanTuK(k) {
            const hit = KHOI_THEO_K[k];
            if (hit) return hit.join('/');
            return k.split('+').sort((a, b) => K_THU_TU_MON.indexOf(a) - K_THU_TU_MON.indexOf(b)).map((m) => K_VIET_TAT[m] || m).join('-');
        }
        // ---- Hiển thị khối: mã (nhiều mã nối " / ") + tên môn đầy đủ, ví dụ "D01" + "Toán, Văn, Anh"; nhóm màu theo chữ cái đầu mã, riêng khối có môn mới (Tin/CN/KTPL) gom thành 1 nhóm ----
        const K_TEN_MON = { toan: 'Toán', van: 'Văn', anh: 'Anh', ly: 'Lý', hoa: 'Hóa', sinh: 'Sinh', su: 'Sử', dia: 'Địa', tin: 'Tin học', cn: 'Công nghệ', ktpl: 'KTPL' };
        const K_MON_MOI = ['tin', 'cn', 'ktpl'];
        const NHOM_KHOI = {
            A: { t: 'Khối A', c: '#3b82f6' }, B: { t: 'Khối B', c: '#22c55e' }, C: { t: 'Khối C', c: '#f59e0b' }, D: { t: 'Khối D', c: '#8b5cf6' },
            M: { t: 'Có môn mới (Tin, CN, KTPL)', c: '#14b8a6' }, K: { t: 'Chưa có mã khối', c: '#94a3b8' } };
        function thongTinK(k) {
            const codes = KHOI_THEO_K[k] || [], mons = k.split('+');
            const order = codes.length ? KHOI_HIEN[codes[0]] : mons.slice().sort((x, z) => K_THU_TU_MON.indexOf(x) - K_THU_TU_MON.indexOf(z));
            const moi = mons.some((m) => K_MON_MOI.indexOf(m) >= 0), l = codes.length ? codes[0].charAt(0) : '';
            const g = moi ? 'M' : (l && 'ABCD'.indexOf(l) >= 0 ? l : 'K');
            return { codes, mon: order.map((m) => K_TEN_MON[m] || m).join(', '), moi, g };
        }
        const COMBO_TOP_MOBILE = 5, COMBO_TOP_WIDE = 10;   // số cột hiện ban đầu (chưa tính cột "Khác"); ngưỡng máy tính = 768px (biến wide của AdminPanel)

        function AdminComboBySchoolImpl({ wide }) {
            const [users, setUsers] = useState(null);   // null = chưa tải; object = bxh/summary.users
            const [loading, setLoading] = useState(false);
            const [err, setErr] = useState('');
            const [sch, setSch] = useState('all');      // 'all' = Tất cả trường; còn lại = schoolId ('' = học sinh chưa chọn trường)
            const [openRest, setOpenRest] = useState(false);   // true = đang mở rộng cột "Khác"
            const isWide = wide !== false;                        // >= 768px (cùng ngưỡng với menu admin)
            const load = useCallback(async () => {
                setLoading(true); setErr('');
                try {
                    const d = await fbDb.collection('bxh').doc('summary').get();
                    setUsers((d.data() || {}).users || {});
                } catch (e) { setErr(fbErr(e)); }
                setLoading(false);
            }, []);
            useEffect(() => { load(); }, [load]);
            // Danh sách học sinh rút gọn từ summary: chỉ giữ trường cần dùng
            const students = useMemo(() => Object.keys(users || {}).map((id) => {
                const e = users[id] || {};
                return { id, s: String(e.s || ''), sn: e.sn || '', k: typeof e.k === 'string' ? e.k : '' };
            }), [users]);
            const labels = useMemo(() => buildSchoolLabels(students.filter((x) => x.s).map((x) => ({ id: x.s, sn: x.sn }))), [students]);
            // Ô chọn trường: sắp xếp theo tên (tiếng Việt), "Chưa rõ trường" để cuối; kèm số học sinh
            const schoolOpts = useMemo(() => {
                const cnt = {};
                students.forEach((x) => { cnt[x.s] = (cnt[x.s] || 0) + 1; });
                return Object.keys(cnt).map((id) => ({ id, label: id ? (labels[id] || id) : 'Chưa rõ trường', n: cnt[id] }))
                    .sort((a, b) => (a.id === '' ? 1 : b.id === '' ? -1 : a.label.localeCompare(b.label, 'vi')));
            }, [students, labels]);
            const schSel = sch !== 'all' && schoolOpts.some((o) => o.id === sch) ? sch : 'all';   // trường đang chọn không còn trong dữ liệu mới => về Tất cả
            const scoped = useMemo(() => students.filter((x) => schSel === 'all' || x.s === schSel), [students, schSel]);
            const y = scoped.length;
            const x = useMemo(() => scoped.filter((e) => e.k).length, [scoped]);
            const pct = y ? Math.round(x / y * 1000) / 10 : 0;
            // Dữ liệu biểu đồ: đếm theo k, xếp nhiều -> ít (hòa thì theo nhãn cho ổn định). Tổng các cột luôn = x.
            const combos = useMemo(() => {
                const cnt = {};
                scoped.forEach((e) => { if (e.k) cnt[e.k] = (cnt[e.k] || 0) + 1; });
                return Object.keys(cnt).map((k) => ({ k, label: nhanTuK(k), info: thongTinK(k), n: cnt[k] }))
                    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, 'vi'));
            }, [scoped]);
            const topN = isWide ? COMBO_TOP_WIDE : COMBO_TOP_MOBILE;
            const top = combos.slice(0, topN), rest = combos.slice(topN);
            const restN = rest.reduce((t, c) => t + c.n, 0);
            const maxN = Math.max(1, top.length ? top[0].n : 0, restN);   // thang chiều dài cột (cột "Khác" cũng nằm trong thang này)
            const pOf = (n) => (x ? Math.round(n / x * 1000) / 10 : 0);
            const groups = useMemo(() => {
                const s = {};
                combos.forEach((c) => { s[c.info.g] = (s[c.info.g] || 0) + c.n; });
                return ['A', 'B', 'C', 'D', 'M', 'K'].filter((g) => s[g]).map((g) => ({ g, n: s[g], t: NHOM_KHOI[g].t, c: NHOM_KHOI[g].c }));
            }, [combos]);
            const labW = isWide ? 'w-60 xl:w-72 2xl:w-80' : 'w-36';
            // Donut theo nhóm khối (SVG thuần, không cần thư viện)
            const donut = (() => {
                const R = 52, C = 2 * Math.PI * R; let off = 0;
                return (
                    <svg viewBox="0 0 140 140" className="w-36 h-36 sm:w-40 sm:h-40 xl:w-48 xl:h-48 shrink-0 -rotate-90" role="img" aria-label="Cơ cấu theo nhóm khối">
                        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(148,163,184,.25)" strokeWidth="18" />
                        {groups.map((g) => { const len = g.n / x * C, d = Math.max(0, len - 1.5); const el = <circle key={g.g} cx="70" cy="70" r={R} fill="none" stroke={g.c} strokeWidth="18" strokeDasharray={d + ' ' + (C - d)} strokeDashoffset={-off}><title>{g.t + ': ' + g.n + ' em'}</title></circle>; off += len; return el; })}
                    </svg>);
            })();
            const labelOf = (c) => (
                <>
                    {c.info.codes.length
                        ? <><b className="text-slate-800">{c.info.codes.join(' / ')}</b> <span className="text-slate-500">({c.info.mon})</span></>
                        : <b className="text-slate-800">{c.info.mon}</b>}
                    {c.info.moi && <span className="ml-1.5 px-1.5 py-px rounded text-[9px] font-bold text-white align-middle" style={{ background: NHOM_KHOI.M.c }}>mới</span>}
                </>);
            const numOf = (n) => <><b className="text-[13px] text-slate-800">{n}</b> <span className="text-slate-400">·</span> {pOf(n)}%</>;
            const barRow = (c, sub, rank) => {
                const tip = (c.info.codes.join(' / ') || 'Chưa có mã khối') + ' (' + c.info.mon + ')';
                const fill = { width: Math.max(2, Math.round(c.n / maxN * 100)) + '%', background: 'linear-gradient(90deg,' + NHOM_KHOI[c.info.g].c + 'b3,' + NHOM_KHOI[c.info.g].c + ')', opacity: sub ? 0.65 : 1 };
                if (!isWide) return (   // ĐIỆN THOẠI: dòng 1 = hạng + nhãn (tự xuống dòng) + số liệu; dòng 2 = thanh dài full chiều rộng
                    <li key={c.k} className={'rounded-lg px-2 py-2 ' + (sub ? 'ml-3' : '')}>
                        <div className="flex items-start gap-2">
                            <span className="w-4 shrink-0 text-right text-[11px] font-semibold text-slate-400 tabular-nums leading-snug">{sub ? '' : rank}</span>
                            <span className="flex-1 min-w-0 text-[13px] leading-snug break-words" title={tip}>{labelOf(c)}</span>
                            <span className="shrink-0 text-right text-[12px] text-slate-500 tabular-nums leading-snug">{numOf(c.n)}</span>
                        </div>
                        <div className="ml-6 mt-1.5 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={fill} /></div>
                    </li>);
                return (
                    <li key={c.k} className={'flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 ' + (sub ? 'ml-6' : '')}>
                        <span className="w-5 shrink-0 text-right text-[11px] font-semibold text-slate-400 tabular-nums">{sub ? '' : rank}</span>
                        <span className={labW + ' shrink-0 min-w-0 truncate text-[13px] leading-tight'} title={tip}>{labelOf(c)}</span>
                        <span className="flex-1 min-w-0 h-3 rounded-full bg-slate-100 overflow-hidden"><span className="block h-full rounded-full transition-all duration-500" style={fill} /></span>
                        <span className="w-24 shrink-0 text-right text-[12px] text-slate-500 tabular-nums">{numOf(c.n)}</span>
                    </li>);
            };
            return (
                <div>
                    {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                    <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h2 className="font-bold text-sm">Tổ hợp môn theo trường</h2>
                                <p className="text-[11px] text-slate-400 mt-1">Thống kê tổ hợp môn của học sinh sau bài định hướng, lấy từ bảng tổng hợp BXH (không đọc dữ liệu riêng của học sinh).</p>
                            </div>
                            <button type="button" onClick={load} disabled={loading} title="Tải lại bảng tổng hợp (1 lượt đọc)" className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg disabled:opacity-50">{loading ? 'Đang tải...' : 'Tải lại'}</button>
                        </div>
                        <select id="combo-school" name="comboSchool" aria-label="Chọn trường" value={schSel} onChange={(e) => { setSch(e.target.value); setOpenRest(false); }} disabled={!users} className="w-full mt-3 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-indigo-400 disabled:opacity-60">
                            <option value="all">Tất cả trường{users ? ' (' + students.length + ' HS)' : ''}</option>
                            {schoolOpts.map((o) => <option key={'s:' + o.id} value={o.id}>{o.label} ({o.n} HS)</option>)}
                        </select>
                        {users === null && !err && <p className="text-xs text-slate-400 mt-3">Đang tải dữ liệu...</p>}
                        {users && y === 0 && <p className="text-xs text-slate-400 mt-3">Chưa có học sinh nào trong bảng tổng hợp BXH.</p>}
                        {users && y > 0 && <p className="text-sm text-slate-700 mt-3"><b>{x}/{y}</b> em đã làm bài định hướng <span className="text-slate-400">({pct}%)</span></p>}
                        {users && y > 0 && <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-2"><div className="h-full rounded-full" style={{ width: pct + '%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} /></div>}
                    </div>
                    {users && y > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-4">
                            <h3 className="font-bold text-sm">Các tổ hợp, từ nhiều đến ít</h3>
                            {x === 0 && <p className="text-xs text-slate-400 mt-2">Chưa có em nào có tổ hợp. Bấm "Đồng bộ tổ hợp" ở tab "Quản lý & Chỉnh sửa Điểm" để điền cho học sinh cũ, rồi bấm "Tải lại".</p>}
                            {x > 0 && (<>
                                <p className="text-[11px] text-slate-400 mt-1">Số em và tỉ lệ tính trên {x} em đã làm bài{isWide ? '' : ' • hiện ' + COMBO_TOP_MOBILE + ' tổ hợp nhiều nhất'}.</p>
                                <div className="mt-4 flex flex-col lg:flex-row gap-4 lg:gap-8 min-w-0">
                                    <div className="lg:w-64 xl:w-72 min-w-0 lg:shrink-0 flex flex-col sm:flex-row lg:flex-col items-center gap-3 sm:gap-4 lg:gap-3 lg:pr-6 lg:border-r border-slate-100">
                                        <div className="relative shrink-0">
                                            {donut}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><b className="text-2xl text-slate-800 leading-none">{x}</b><span className="text-[11px] text-slate-400 mt-1">em có tổ hợp</span></div>
                                        </div>
                                        <ul className="w-full sm:flex-1 min-w-0 lg:w-full space-y-1.5">
                                            {groups.map((g) => <li key={g.g} className="flex items-center gap-2 text-[12px] text-slate-600"><span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: g.c }} /><span className="flex-1 min-w-0 leading-tight">{g.t}</span><b className="text-slate-800 tabular-nums">{g.n}</b><span className="w-12 text-right text-slate-400 tabular-nums">{pOf(g.n)}%</span></li>)}
                                        </ul>
                                    </div>
                                    <ul className="flex-1 min-w-0 w-full space-y-0.5">
                                        {top.map((c, i) => barRow(c, false, i + 1))}
                                        {rest.length > 0 && (
                                            <li>
                                                <button type="button" onClick={() => setOpenRest((o) => !o)} aria-expanded={openRest} title={openRest ? 'Thu gọn' : 'Xem ' + rest.length + ' tổ hợp còn lại'} className={'w-full text-left rounded-lg px-2 hover:bg-slate-50 ' + (isWide ? 'flex items-center gap-3 py-1.5' : 'py-2')}>
                                                    {isWide ? (<>
                                                        <span className="w-5 shrink-0" />
                                                        <span className={labW + ' shrink-0 truncate text-[13px] leading-tight'}><b className="text-slate-600">Khác {openRest ? '▾' : '▸'}</b> <span className="text-slate-500">({rest.length} tổ hợp{openRest ? '' : ', bấm để xem'})</span></span>
                                                        <span className="flex-1 min-w-0 h-3 rounded-full bg-slate-100 overflow-hidden"><span className="block h-full rounded-full" style={{ width: Math.max(2, Math.round(restN / maxN * 100)) + '%', background: 'repeating-linear-gradient(45deg,#94a3b8,#94a3b8 6px,#a8b4c6 6px,#a8b4c6 12px)' }} /></span>
                                                        <span className="w-24 shrink-0 text-right text-[12px] text-slate-500 tabular-nums">{numOf(restN)}</span>
                                                    </>) : (<>
                                                        <span className="flex items-start gap-2">
                                                            <span className="w-4 shrink-0" />
                                                            <span className="flex-1 min-w-0 text-[13px] leading-snug break-words"><b className="text-slate-600">Khác {openRest ? '▾' : '▸'}</b> <span className="text-slate-500">({rest.length} tổ hợp{openRest ? '' : ', bấm để xem'})</span></span>
                                                            <span className="shrink-0 text-right text-[12px] text-slate-500 tabular-nums leading-snug">{numOf(restN)}</span>
                                                        </span>
                                                        <span className="block ml-6 mt-1.5 h-2.5 rounded-full bg-slate-100 overflow-hidden"><span className="block h-full rounded-full" style={{ width: Math.max(2, Math.round(restN / maxN * 100)) + '%', background: 'repeating-linear-gradient(45deg,#94a3b8,#94a3b8 6px,#a8b4c6 6px,#a8b4c6 12px)' }} /></span>
                                                    </>)}
                                                </button>
                                            </li>)}
                                        {openRest && rest.map((c) => barRow(c, true, 0))}
                                    </ul>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">Tổng các cột: <b>{top.reduce((t, c) => t + c.n, 0) + restN}</b> em</p>
                            </>)}
                            {/* CHỖ DÀNH CHO CHÚ GIẢI (sau này): tra KHOI_TEN trong hocsinh.js theo mã khối của từng cột. CHƯA hiện ở đợt này. */}
                        </div>)}
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
                    const list = Object.keys(us).map((id) => ({ id, name: us[id].n || 'Học sinh', cls: us[id].c || '', school: us[id].s || '', sn: us[id].sn || '', xp: Math.max(0, (Number(us[id].xp) || 0) + (Number(us[id].adj) || 0)) }))
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

            // Danh sách học sinh cho bộ chỉnh điểm BXH: kèm mã trường (school) và tên trường (schoolName) để chọn Trường -> Lớp -> Học sinh
            const edStudents = useMemo(() => {
                const labels = buildSchoolLabels((board || []).map((x) => ({ id: x.school, sn: x.sn })));
                return (board || []).map((x) => ({ id: x.id, name: x.name, class: String(x.cls || '?').trim().toUpperCase(), xp: x.xp, rank: x.rank, school: x.school || NO_SCHOOL, schoolName: x.school ? (labels[x.school] || '') : '' }));
            }, [board]);
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

                    <ErrorBoundary inline><BxhScoreEditor user={user} students={edStudents} withSchool onSaved={loadBoard} /></ErrorBoundary>

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
                        <AdminKSync />
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
            const privBtn = (t) => <button onClick={() => togglePriv(t)} title={priv[t.id] ? 'Bỏ ẩn danh: giáo viên hiện lại trong danh sách tìm kiếm' : 'Ẩn danh: giáo viên không hiện trong danh sách tìm kiếm của học sinh / giáo viên khác'} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (priv[t.id] ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700')}>{priv[t.id] ? 'Bỏ ẩn' : 'Ẩn danh'}</button>;
            const privBadge = <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"><Icon name="lock" className="ic-inline" /> Ẩn danh</span>;
            const STATUS = [['pending', 'Chờ duyệt', ''], ['approved', 'Đã duyệt', ''], ['rejected', 'Từ chối', ' / Khóa']];   // phần thứ 3 chỉ hiện từ màn hình sm trở lên
            const NAV = [['teachers', 'Duyệt giáo viên', 'user-check'], ['users', 'Quản lý người dùng', 'users'], ['mod', 'Kiểm duyệt bài đăng', 'shield-check'], ['groups', 'Nhóm lớp & GVCN', 'graduation-cap'], ['scores', 'Quản lý & Chỉnh sửa Điểm', 'bar-chart'], ['combo', 'Tổ hợp theo trường', 'pie-chart']];
            const [navOpen, setNavOpen] = useState(false);
            // Drawer menu (< md): theo dõi breakpoint md (768px) để tự đóng khi xoay ngang/phóng to, và để ẩn drawer khỏi bàn phím khi đang đóng
            const hasMQ = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
            const [wide, setWide] = useState(() => (hasMQ ? window.matchMedia('(min-width: 768px)').matches : true));
            useEffect(() => {
                if (!hasMQ) return;
                const mq = window.matchMedia('(min-width: 768px)');
                const on = () => { setWide(mq.matches); if (mq.matches) setNavOpen(false); };
                if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
                return () => { if (mq.removeEventListener) mq.removeEventListener('change', on); else mq.removeListener(on); };
            }, []);
            // Khi drawer mở: Esc để đóng + khóa cuộn nền (tránh trang phía sau cuộn theo)
            useEffect(() => {
                if (!navOpen) return;
                const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
                document.addEventListener('keydown', onKey);
                const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
                return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
            }, [navOpen]);
            const drawerHidden = !wide && !navOpen;     // drawer đang nằm ngoài màn hình: không cho Tab vào
            const navTab = drawerHidden ? -1 : undefined;
            const [st, setSt] = useState('approved');     // bộ lọc trạng thái của bảng giáo viên
            const [tq, setTq] = useState('');             // ô tìm kiếm trong bảng giáo viên
            const counts = useMemo(() => { const c = { pending: 0, approved: 0, rejected: 0 }; list.forEach((x) => { if (c[x.status] !== undefined) c[x.status]++; }); return c; }, [list]);
            const tRows = useMemo(() => list.filter((x) => x.status === st && (!tq.trim() || foldVN((x.name || '') + ' ' + (x.email || '') + ' ' + (x.subject || '') + ' ' + (x.school || '')).includes(foldVN(tq.trim())))), [list, st, tq]);
            const cur = NAV.find((n) => n[0] === tab) || NAV[0];
            const goTab = (k) => { setTab(k); setNavOpen(false); };
            const btnBase = 'inline-flex items-center justify-center gap-1 rounded-lg text-xs font-bold whitespace-nowrap';
            const btn = btnBase + ' px-2.5 py-1.5';      // bảng (md+)
            const btnM = btnBase + ' px-3 py-2';         // thẻ trên mobile: nút to hơn, dễ bấm
            // Cụm nút thao tác của 1 giáo viên — dùng chung cho bảng (compact: Thẻ/Ẩn danh chỉ còn icon dưới xl) và thẻ mobile (đủ nhãn)
            const rowActions = (x, compact) => {
                const b = compact ? btn : btnM, lbl = compact ? 'hidden xl:inline' : '';
                return (<>
                    <button type="button" onClick={() => showCard(x.id)} title="Xem thẻ giáo viên" aria-label="Xem thẻ giáo viên" className={b + ' bg-slate-100 text-slate-700'}><LIcon n="id-card" className="w-3.5 h-3.5" /><span className={lbl}>Thẻ</span></button>
                    <button type="button" onClick={() => togglePriv(x)} aria-label={priv[x.id] ? 'Bỏ ẩn danh' : 'Ẩn danh'} title={priv[x.id] ? 'Bỏ ẩn danh: giáo viên hiện lại trong danh sách tìm kiếm' : 'Ẩn danh: giáo viên không hiện trong danh sách tìm kiếm của học sinh / giáo viên khác'} className={b + (priv[x.id] ? ' bg-indigo-50 text-indigo-700' : ' bg-slate-100 text-slate-700')}><LIcon n={priv[x.id] ? 'eye' : 'eye-off'} className="w-3.5 h-3.5" /><span className={lbl}>{priv[x.id] ? 'Bỏ ẩn' : 'Ẩn danh'}</span></button>
                    {st !== 'approved' && <button type="button" onClick={() => setStatus(x.id, 'approved')} className={b + ' bg-emerald-600 text-white'}>Duyệt</button>}
                    {st !== 'rejected' && <button type="button" onClick={() => eduConfirm('Bạn có thể duyệt lại tài khoản này sau.', { title: 'Từ chối / khóa tài khoản này?', confirmText: st === 'approved' ? 'Khóa' : 'Từ chối', danger: true }).then((yes) => yes && setStatus(x.id, 'rejected'))} className={b + ' bg-red-50 text-red-600'}>{st === 'approved' ? 'Khóa' : 'Từ chối'}</button>}
                    <button type="button" onClick={() => delUser(x)} title="Xóa tài khoản" aria-label="Xóa tài khoản" className={b + ' bg-red-50 text-red-600'}><LIcon n="trash" className="w-3.5 h-3.5" />{!compact && 'Xóa'}</button>
                </>);
            };
            return (
                <div className="min-h-screen bg-slate-50 md:flex">
                    {/* Lớp phủ (< md): luôn được mount để mờ dần khi mở/đóng; chỉ nhận click khi menu mở. z-30 < sidebar z-40 < modal z-50 */}
                    <div aria-hidden="true" onClick={() => setNavOpen(false)} style={{ opacity: navOpen ? 1 : 0 }}
                        className={'fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-all duration-200 md:hidden ' + (navOpen ? '' : 'pointer-events-none')} />
                    <aside id="admin-nav" aria-label="Menu quản trị" aria-hidden={drawerHidden ? 'true' : undefined} className={'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:translate-x-0 ' + (navOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')}>
                        <div className="h-16 shrink-0 px-5 flex items-center justify-between border-b border-slate-200">
                            <span className="flex items-center gap-2 text-lg font-extrabold text-indigo-600"><img src="logo.svg" alt="" className="logo-l w-8 h-8" /><img src="logo-dark.svg" alt="" className="logo-d w-8 h-8" />EduOrient</span>
                            <button type="button" tabIndex={navTab} onClick={() => setNavOpen(false)} aria-label="Đóng menu" className="md:hidden w-10 h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"><LIcon n="x" className="w-5 h-5" /></button>
                        </div>
                        <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1">
                            {NAV.map(([k, l, ic]) => (
                                <button key={k} type="button" tabIndex={navTab} onClick={() => goTab(k)} aria-current={tab === k ? 'page' : undefined}
                                    className={'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left font-semibold ' + (tab === k ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100')}>
                                    <LIcon n={ic} className="w-[18px] h-[18px] shrink-0" />
                                    <span className="flex-1 min-w-0">{l}</span>
                                    {k === 'teachers' && counts.pending > 0 && <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{counts.pending}</span>}
                                </button>))}
                        </nav>
                        {/* Mobile: công tắc giao diện chuyển từ header vào đây cho header đỡ chật */}
                        <div className="md:hidden shrink-0 border-t border-slate-200 p-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-slate-500">Giao diện</span>
                            <AdminThemeSwitch tabIndex={navTab} />
                        </div>
                        <div className="md:hidden shrink-0 border-t border-slate-200 p-3"><UiZoomPanel /></div>
                    </aside>
                    <div className="flex-1 min-w-0 overflow-x-clip">
                        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 px-4 md:px-8 flex items-center gap-3">
                            <button type="button" onClick={() => setNavOpen(true)} aria-label="Mở menu" aria-expanded={navOpen} aria-controls="admin-nav" className="md:hidden relative shrink-0 w-11 h-11 inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700">
                                <LIcon n="menu" className="w-6 h-6" />
                                {counts.pending > 0 && <span className="absolute top-0.5 right-2 w-3 h-3 rounded-full bg-amber-400" />}
                            </button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-base md:text-lg font-extrabold text-slate-900 truncate">{cur[1]}</h1>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                            <div className="hidden md:block shrink-0"><AdminThemeSwitch /></div>
                            <div className="hidden md:block shrink-0"><UiZoomPopover sm /></div>
                            <button type="button" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất" className="shrink-0 inline-flex items-center justify-center gap-1.5 w-11 h-11 sm:w-auto sm:p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"><LIcon n="log-out" className="w-4 h-4" /><span className="hidden sm:inline">Đăng xuất</span></button>
                        </header>
                        <main className={'p-4 md:p-8 ' + (tab === 'combo' ? 'w-full max-w-none' : 'max-w-6xl')}>
                            {user.diag && <p className="text-[10px] text-slate-400 mb-3">Đăng nhập: {user.diag.providers} • email đã xác minh: {user.diag.tokenVerified === null ? (user.diag.verified ? 'có' : 'chưa') : (user.diag.tokenVerified ? 'có' : 'CHƯA (token)')}</p>}
                            {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
                            {tab === 'mod' && <AdminModeration />}
                            {tab === 'groups' && <ErrorBoundary inline><AdminGroups teachers={list} user={user} /></ErrorBoundary>}
                            {tab === 'scores' && <ErrorBoundary inline><AdminScoreEditor user={user} /></ErrorBoundary>}
                            {tab === 'combo' && <ErrorBoundary inline><AdminComboBySchool wide={wide} /></ErrorBoundary>}
                            {tab === 'users' && (<div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                                <div className="flex gap-2 mb-3">
                                    <input id="user-search" name="userSearch" aria-label="Tìm theo tên hoặc email" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc email..." className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                                    <button onClick={() => setUsersTick((t) => t + 1)} title="Tải lại danh sách (1 lượt đọc / tài khoản)" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border text-xs font-semibold"><LIcon n="refresh" className="w-3.5 h-3.5" />Tải lại</button>
                                </div>
                                {allShown.length === 0 && <p className="text-xs text-slate-400">Không có người dùng.</p>}
                                {allShown.map((u) => (<div key={u.id} className="flex flex-wrap items-center gap-2 py-2 border-t border-slate-100">
                                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold truncate">{u.name} <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span>{u.role === 'teacher' && priv[u.id] && privBadge}</p><p className="text-xs text-slate-500 truncate">{u.email}</p></div>
                                    <div className="flex flex-wrap justify-end gap-2 shrink-0 w-full sm:w-auto">{u.role === 'teacher' && privBtn(u)}<button onClick={() => delUser(u)} title="Xóa tài khoản" className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold inline-flex items-center gap-1"><LIcon n="trash" className="w-3.5 h-3.5" /> Xóa</button></div>
                                </div>))}
                            </div>)}
                            {card && (<div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4" onClick={() => setCard(null)}>
                                {card === 'none' ? <div className="bg-white rounded-2xl p-6 text-sm">Giáo viên này chưa tải ảnh thẻ.</div> : <img src={card} className="max-h-[85vh] max-w-full rounded-xl" />}</div>)}
                            {tab === 'teachers' && (
                                <div className="bg-white rounded-2xl shadow-sm">
                                    <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-3 border-b border-slate-100">
                                        <div role="tablist" aria-label="Trạng thái giáo viên" className="flex w-full lg:w-auto gap-1 p-1 rounded-xl bg-slate-100">
                                            {STATUS.map(([k, l, more]) => (
                                                <button key={k} type="button" role="tab" aria-selected={st === k} onClick={() => setSt(k)}
                                                    className={'flex-1 px-2 py-1.5 rounded-lg text-xs font-bold text-center leading-tight whitespace-nowrap ' + (st === k ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600')}>
                                                    <span className="block sm:inline whitespace-nowrap">{l}{more && <span className="hidden sm:inline">{more}</span>}</span>{' '}
                                                    <span className="block sm:inline">({counts[k]})</span>
                                                </button>))}
                                        </div>
                                        <div className="relative lg:ml-auto lg:w-80">
                                            <LIcon n="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input id="teacher-search" name="teacherSearch" aria-label="Tìm giáo viên" value={tq} onChange={(e) => setTq(e.target.value)} placeholder="Tìm theo tên, email, môn, trường..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                    </div>
                                    {/* Mobile (< md): mỗi giáo viên là 1 thẻ — thấy đủ thông tin và nút thao tác, không phải cuộn ngang */}
                                    <ul className="md:hidden">
                                        {tRows.length === 0 && <li className="px-4 py-10 text-center text-xs text-slate-400">{tq.trim() ? 'Không có giáo viên phù hợp.' : 'Không có ai.'}</li>}
                                        {tRows.map((x) => (
                                            <li key={x.id} className="p-4 border-b border-slate-100 last:border-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{x.name || '—'}</p>
                                                        <p className="text-xs text-slate-500 truncate">{x.email}</p>
                                                    </div>
                                                    {priv[x.id] && <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"><LIcon n="eye-off" className="w-3 h-3" />Ẩn danh</span>}
                                                </div>
                                                <p className="mt-1.5 text-xs text-slate-600 break-words">{[x.subject, x.school].filter(Boolean).join(' • ') || '—'}</p>
                                                <div className="mt-3 flex flex-wrap gap-1.5">{rowActions(x, false)}</div>
                                            </li>))}
                                    </ul>
                                    {/* md+: bảng dữ liệu (cuộn ngang trong khung nếu màn hình hẹp) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full min-w-[640px] text-sm text-left">
                                            <thead>
                                                <tr className="text-xs text-slate-500 border-b border-slate-100">
                                                    <th scope="col" className="px-4 py-3 font-semibold">Họ tên</th>
                                                    <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                                                    <th scope="col" className="px-4 py-3 font-semibold">Môn</th>
                                                    <th scope="col" className="px-4 py-3 font-semibold">Trường</th>
                                                    <th scope="col" className="px-4 py-3 font-semibold text-right">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tRows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-400">{tq.trim() ? 'Không có giáo viên phù hợp.' : 'Không có ai.'}</td></tr>}
                                                {tRows.map((x) => (
                                                    <tr key={x.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px]"><span className="block truncate">{x.name || '—'}</span>{priv[x.id] && <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"><LIcon n="eye-off" className="w-3 h-3" />Ẩn danh</span>}</td>
                                                        <td className="px-4 py-3 text-slate-600 max-w-[220px]"><span className="block truncate">{x.email}</span></td>
                                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{x.subject || '—'}</td>
                                                        <td className="px-4 py-3 text-slate-600 max-w-[200px]"><span className="block truncate">{x.school || '—'}</span></td>
                                                        <td className="px-4 py-3"><div className="flex justify-end gap-1.5">{rowActions(x, true)}</div></td>
                                                    </tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-100">Hiển thị {tRows.length} / {counts[st]} giáo viên.</p>
                                </div>)}
                        </main>
                    </div>
                </div>
            );
        }


        // Công tắc giao diện Mặc định / Tối / Sáng ở header. Dùng chung controller + khóa 'eduorient_theme' với ThemeModeBar (window.getThemeMode / setThemeMode).
        // Icon là SVG nhúng (LIcon) nên không còn lỗi hiện tên icon thành chữ.
        const ADMIN_THEME_OPTS = [['system', 'monitor', 'Mặc định'], ['dark', 'moon', 'Tối'], ['light', 'sun', 'Sáng']];
        const AdminThemeSwitch = ({ tabIndex }) => {
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
                <div role="radiogroup" aria-label="Chế độ giao diện" className="shrink-0 flex gap-0.5 p-0.5 rounded-xl bg-slate-100">
                    {ADMIN_THEME_OPTS.map(([k, ic, lb]) => (
                        <button key={k} type="button" tabIndex={tabIndex} role="radio" aria-checked={mode === k} aria-label={lb} title={k === 'system' ? 'Theo hệ thống (Mặc định)' : 'Giao diện ' + lb.toLowerCase()} onClick={() => pick(k)}
                            className={'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ' + (mode === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900')}>
                            <LIcon n={ic} className="w-4 h-4" /><span className="hidden xl:inline">{lb}</span>
                        </button>
                    ))}
                </div>
            );
        };

        const AdminModeration = memo(AdminModerationImpl);

        const GroupHomeroomRow = memo(GroupHomeroomRowImpl);

        const AdminGroups = memo(AdminGroupsImpl);

        const AdminScoreEditor = memo(AdminScoreEditorImpl);

        const AdminComboBySchool = memo(AdminComboBySchoolImpl);

        export { AdminPanel };
