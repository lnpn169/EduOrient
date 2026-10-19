// =====================================================================================
// "TUẦN CỦA BẠN" - thẻ tổng kết tuần (HTML) + ảnh để khoe (canvas). File thuần JS, không phụ thuộc thư viện.
// Dùng chung cho app thật (hocsinh.js) và bản preview, nên preview luôn đúng với thứ chạy thật.
//   WrappedCore.compose(raw) -> data     raw = { name, startDay, xp, prevXp|null, days, rank|null, prevRank|null, subs, pet:{emoji,name}|null }
//   WrappedCore.html(data)   -> chuỗi HTML của thẻ
//   WrappedCore.canvas(data) -> <canvas> 1080x1350
//   WrappedCore.save(data)   -> tải ảnh PNG
// =====================================================================================
(function (root) {
    'use strict';
    var GRAD = ['#6d28d9', '#db2777', '#f97316'];   // tím -> hồng -> cam
    var FONT = "'Be Vietnam Pro','Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";   // nháy đơn: được nhúng vào style="..." 

    function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function fmt(n) { return Number(n || 0).toLocaleString('vi-VN'); }
    function dm(day) { var d = new Date(day * 86400000); return d.getUTCDate() + '/' + (d.getUTCMonth() + 1); }   // day = số ngày theo giờ VN
    function pick(arr, seed) { return arr[Math.abs(seed | 0) % arr.length]; }

    function compose(r) {
        var xp = Math.max(0, Math.round(r.xp || 0)), days = Math.max(0, Math.min(7, r.days | 0)), subs = r.subs | 0;
        var xpDelta = (typeof r.prevXp === 'number') ? xp - r.prevXp : null;
        var rank = (typeof r.rank === 'number' && r.rank > 0) ? r.rank : null;
        var rankDelta = (rank && typeof r.prevRank === 'number' && r.prevRank > 0) ? r.prevRank - rank : null;   // dương = tăng hạng
        var xpLine = null;
        if (xpDelta !== null) xpLine = xpDelta > 0 ? { t: 'up', s: '▲ +' + fmt(xpDelta) + ' so với tuần trước' } : xpDelta < 0 ? { t: 'down', s: '▼ ' + fmt(xpDelta) + ' so với tuần trước' } : { t: 'same', s: '＝ Bằng tuần trước' };
        var rankLine = null;
        if (rank) rankLine = rankDelta === null ? { t: 'same', s: 'trong tuần này' } : rankDelta > 0 ? { t: 'up', s: '▲ tăng ' + rankDelta + ' hạng' } : rankDelta < 0 ? { t: 'down', s: '▼ giảm ' + (-rankDelta) + ' hạng' } : { t: 'same', s: '＝ giữ nguyên hạng' };

        var pet = r.pet ? { emoji: r.pet.emoji, name: r.pet.name } : null, quote;
        if (pet) {
            var gom = ' Bạn gom được ' + fmt(xp) + ' XP!';
            if (days >= 7) quote = '"Tuần này ngày nào mình cũng được ăn no. Bạn là chủ nhân tuyệt nhất!"';
            else if (days >= 5) quote = '"Mình được ăn no ' + days + ' bữa tuần này. Mình vẫn còn hơi đói đó!"';
            else if (days >= 3) quote = '"Mình được ăn ' + days + ' bữa tuần này. Tuần sau mình mong nhiều hơn nhé!"';
            else if (days >= 1) quote = '"Tuần này mình chỉ được ăn ' + days + ' bữa thôi. Mình nhớ bạn lắm!"';
            else quote = '"Tuần này mình đói meo vì chưa thấy bạn đâu. Quay lại với mình nhé!"';
            quote += (xp > 0 ? gom : '');
        } else {
            quote = days >= 5 ? 'Bạn đã học rất đều tuần này! Nhận nuôi một thú cưng để có bạn đồng hành nhé.' : 'Nhận nuôi một thú cưng ở trang Tài khoản để có bạn đồng hành mỗi tuần nhé.';
        }
        var footer = (xpDelta !== null && xpDelta > 0) || days >= 5 ? 'Tiến bộ đều mỗi ngày sẽ tạo nên khác biệt lớn. Cố lên! 💪' : pick(['Mỗi ngày một chút, tuần sau sẽ khác. Cố lên! 💪', 'Bắt đầu lại luôn được, tuần mới đang chờ bạn! 🚀'], xp + days);
        return {
            name: r.name || 'Bạn', range: 'Tuần ' + dm(r.startDay) + ' – ' + dm(r.startDay + 6), xp: xp, xpLine: xpLine,
            days: days, rank: rank, rankLine: rankLine, subs: subs, pet: pet, quote: quote, footer: footer
        };
    }

    // ---------- HTML ----------
    var COL = { up: '#bbf7d0', down: '#fecaca', same: 'rgba(255,255,255,.85)' };
    function html(d) {
        var tile = function (ic, big, label, line) {
            return '<div style="flex:1;min-width:0;background:rgba(255,255,255,.18);border-radius:16px;padding:12px 4px;text-align:center;">' +
                '<div style="font-size:24px;line-height:1.1;">' + ic + '</div><div style="font-size:24px;font-weight:800;line-height:1.2;margin-top:2px;">' + esc(big) + '</div>' +
                '<div style="font-size:11px;opacity:.92;margin-top:2px;">' + esc(label) + '</div>' +
                (line ? '<div style="font-size:11px;font-weight:700;margin-top:2px;color:' + COL[line.t] + ';">' + esc(line.s) + '</div>' : '') + '</div>';
        };
        return '<div class="wr-card" style="font-family:' + FONT + ';color:#fff;border-radius:26px;padding:22px 18px 20px;background:linear-gradient(155deg,' + GRAD.join(',') + ');box-shadow:0 12px 32px rgba(0,0,0,.28);box-sizing:border-box;">' +
            '<div style="text-align:center;"><div style="font-size:13px;font-weight:800;letter-spacing:.22em;opacity:.95;">TUẦN CỦA BẠN</div>' +
            '<div style="font-size:12px;opacity:.9;margin-top:2px;">' + esc(d.range) + '</div>' +
            '<div style="font-size:19px;font-weight:700;margin-top:8px;">' + esc(d.name) + '</div>' +
            '<div style="font-size:64px;font-weight:900;line-height:1.05;margin-top:2px;">' + fmt(d.xp) + '</div>' +
            '<div style="font-size:13px;opacity:.95;">XP tuần này</div>' +
            (d.xpLine ? '<div style="font-size:12px;font-weight:700;margin-top:4px;color:' + COL[d.xpLine.t] + ';">' + esc(d.xpLine.s) + '</div>' : '') + '</div>' +
            '<div style="display:flex;gap:8px;margin-top:16px;">' +
            tile('🔥', d.days + '/7', 'ngày giữ lửa') +
            tile('🏆', d.rank ? '#' + d.rank : '—', d.rank ? '' : 'chưa có hạng', d.rankLine) +
            tile('📝', String(d.subs), 'bài đã nộp') + '</div>' +
            '<div style="display:flex;gap:12px;align-items:center;margin-top:12px;background:rgba(255,255,255,.18);border-radius:16px;padding:12px;">' +
            '<div style="font-size:46px;line-height:1;flex:0 0 auto;">' + (d.pet ? d.pet.emoji : '🐾') + '</div>' +
            '<div style="font-size:13px;font-weight:600;line-height:1.45;">' + (d.pet ? '<span style="opacity:.8;font-size:11px;">' + esc(d.pet.name) + ' nói:</span><br>' : '') + esc(d.quote) + '</div></div>' +
            '<div style="text-align:center;font-size:12px;font-weight:700;margin-top:14px;">' + esc(d.footer) + '</div></div>';
    }

    // ---------- Canvas ----------
    function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function wrap(c, text, x, y, maxW, lh) {   // xuống dòng theo từ; trả về y sau dòng cuối
        var words = String(text).split(' '), line = '', yy = y;
        for (var i = 0; i < words.length; i++) {
            var t = line ? line + ' ' + words[i] : words[i];
            if (c.measureText(t).width > maxW && line) { c.fillText(line, x, yy); line = words[i]; yy += lh; } else line = t;
        }
        if (line) { c.fillText(line, x, yy); yy += lh; }
        return yy;
    }
    function canvas(d) {
        var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        var c = cv.getContext('2d');
        var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, GRAD[0]); g.addColorStop(.55, GRAD[1]); g.addColorStop(1, GRAD[2]);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.arc(W - 80, 120, 260, 0, 7); c.fill(); c.beginPath(); c.arc(60, H - 160, 300, 0, 7); c.fill();
        c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
        var f = function (w, s) { c.font = w + ' ' + s + 'px ' + FONT; };
        f(800, 34); if ('letterSpacing' in c) c.letterSpacing = '8px'; c.fillText('TUẦN CỦA BẠN', W / 2, 120); if ('letterSpacing' in c) c.letterSpacing = '0px';
        f(500, 32); c.globalAlpha = .9; c.fillText(d.range, W / 2, 170); c.globalAlpha = 1;
        f(700, 48); c.fillText(d.name, W / 2, 245);
        f(900, 230); c.fillText(fmt(d.xp), W / 2, 460);
        f(500, 36); c.globalAlpha = .95; c.fillText('XP tuần này', W / 2, 515); c.globalAlpha = 1;
        if (d.xpLine) { f(700, 34); c.fillStyle = COL[d.xpLine.t]; c.fillText(d.xpLine.s, W / 2, 570); c.fillStyle = '#fff'; }
        // 3 ô
        var tiles = [['🔥', d.days + '/7', 'ngày giữ lửa', null], ['🏆', d.rank ? '#' + d.rank : '—', d.rank ? '' : 'chưa có hạng', d.rankLine], ['📝', String(d.subs), 'bài đã nộp', null]];
        var tw = 290, gap = 25, x0 = (W - (tw * 3 + gap * 2)) / 2, ty = 640, th = 270;
        tiles.forEach(function (t, i) {
            var x = x0 + i * (tw + gap);
            c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, x, ty, tw, th, 36); c.fill();
            c.fillStyle = '#fff'; f(500, 64); c.fillText(t[0], x + tw / 2, ty + 85);
            f(800, 66); c.fillText(t[1], x + tw / 2, ty + 160);
            f(500, 28); c.globalAlpha = .92; c.fillText(t[2], x + tw / 2, ty + 202); c.globalAlpha = 1;
            if (t[3]) { f(700, 28); c.fillStyle = COL[t[3].t]; c.fillText(t[3].s, x + tw / 2, ty + (t[2] ? 240 : 205)); c.fillStyle = '#fff'; }
        });
        // thú cưng
        var by = 950, bh = 230, bx = 70, bw = W - 140;
        c.fillStyle = 'rgba(255,255,255,.18)'; rr(c, bx, by, bw, bh, 40); c.fill();
        c.fillStyle = '#fff'; f(500, 110); c.fillText(d.pet ? d.pet.emoji : '🐾', bx + 100, by + bh / 2 + 38);
        c.textAlign = 'left'; var tx = bx + 190, ty2 = by + 62;
        if (d.pet) { f(500, 26); c.globalAlpha = .8; c.fillText(d.pet.name + ' nói:', tx, ty2); c.globalAlpha = 1; ty2 += 40; }
        f(600, 32); wrap(c, d.quote, tx, ty2, bw - 230, 44);
        c.textAlign = 'center'; f(700, 32); c.fillText(d.footer, W / 2, 1255);
        f(500, 26); c.globalAlpha = .75; c.fillText('EduOrient', W / 2, 1310); c.globalAlpha = 1;
        return cv;
    }
    function save(d) {
        var cv = canvas(d), name = 'tuan-cua-ban-' + String(d.range).replace(/[^\d]+/g, '-').replace(/^-|-$/g, '') + '.png';
        var done = function (blob) {
            if (!blob) return;
            var a = document.createElement('a'), u = URL.createObjectURL(blob);
            a.href = u; a.download = name; document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500);
        };
        if (cv.toBlob) cv.toBlob(done, 'image/png'); else { var a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = name; a.click(); }
    }
    root.WrappedCore = { compose: compose, html: html, canvas: canvas, save: save };
})(typeof window !== 'undefined' ? window : this);
