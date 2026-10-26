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
