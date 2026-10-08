    (function () {
        var nativeAlert = window.alert.bind(window), nativeConfirm = window.confirm.bind(window), nativePrompt = window.prompt.bind(window);
        var C = { primary: '#4361ee', danger: '#ef4444', cancel: '#94a3b8' };
        var TITLES = { success: 'Thành công', error: 'Có lỗi xảy ra', warning: 'Lưu ý', info: 'Thông báo', question: 'Xác nhận' };
        var ready = function () { return !!(window.Swal && typeof window.Swal.fire === 'function'); };
        var esc = function (x) { return String(x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
        // Xếp hàng: các hộp thoại hiện lần lượt, cái sau không đè mất cái trước (giống alert gốc)
        var chain = Promise.resolve();
        function queue(fn) { var p = chain.then(fn); chain = p.then(function () {}, function () {}); return p; }
        function guess(m) {
            if (/^(✅|🎉|Đã |Đổi mật khẩu thành công)|thành công/i.test(m)) return 'success';
            if (/^(❌|Lỗi|Không )|không (hợp lệ|đúng|có quyền)|thất bại/i.test(m)) return 'error';
            if (/^(🔒|⚠)|^(Vui lòng|Hãy|Cần|Nhập|Bạn chưa)/i.test(m)) return 'warning';
            return 'info';
        }
        // Dòng đầu (nếu có xuống dòng) làm tiêu đề, phần còn lại làm nội dung; bỏ emoji đầu dòng vì đã có icon
        function parts(message, icon, title) {
            var m = String(message == null ? '' : message).trim(), nl = m.indexOf('\n');
            if (title) return { title: title, text: m };
            if (nl > 0) return { title: m.slice(0, nl).replace(/^[^\p{L}\p{N}]+/u, '').trim() || TITLES[icon], text: m.slice(nl + 1).trim() };
            return { title: TITLES[icon], text: m };
        }
        var norm = function (o, d) { return typeof o === 'string' ? { icon: o } : (o || d || {}); };

        // eduAlert('nội dung', 'success' | 'error' | 'warning' | 'info')  hoặc  eduAlert('nội dung', { icon, title, confirmText })
        // Trả về Promise: dùng  await eduAlert(...)  hoặc  .then(...)  khi cần chạy tiếp SAU khi người dùng bấm OK.
        window.eduAlert = function (message, o) {
            o = norm(o);
            var icon = o.icon || guess(String(message == null ? '' : message));
            if (!ready()) { nativeAlert(String(message)); return Promise.resolve(); }
            return queue(function () {
                var p = parts(message, icon, o.title);
                return Swal.fire({ icon: icon, title: esc(p.title), text: p.text, confirmButtonText: o.confirmText || 'OK', confirmButtonColor: C.primary, heightAuto: false });
            }).then(function () {});
        };
        // eduConfirm('nội dung', { title, confirmText, cancelText, icon, danger })  →  Promise<boolean>
        window.eduConfirm = function (message, o) {
            o = norm(o);
            if (!ready()) return Promise.resolve(nativeConfirm(String(message)));
            return queue(function () {
                var icon = o.icon || (o.danger ? 'warning' : 'question'), p = parts(message, icon, o.title);
                return Swal.fire({ icon: icon, title: esc(p.title), text: p.text, showCancelButton: true, reverseButtons: true, focusCancel: !!o.danger,
                    confirmButtonText: o.confirmText || 'Đồng ý', cancelButtonText: o.cancelText || 'Hủy',
                    confirmButtonColor: o.danger ? C.danger : C.primary, cancelButtonColor: C.cancel, heightAuto: false });
            }).then(function (r) { return !!(r && r.isConfirmed); });
        };
        // eduPrompt('nội dung', { title, placeholder, confirmText, maxLength })  →  Promise<string | null>  (null = bấm Hủy)
        window.eduPrompt = function (message, o) {
            o = o || {};
            if (!ready()) return Promise.resolve(nativePrompt(String(message)));
            return queue(function () {
                return Swal.fire({ title: esc(o.title || message), text: o.title ? String(message) : undefined, input: o.input || 'textarea', inputPlaceholder: o.placeholder || '',
                    inputAttributes: { maxlength: o.maxLength || 300 }, showCancelButton: true, reverseButtons: true,
                    confirmButtonText: o.confirmText || 'Gửi', cancelButtonText: 'Hủy', confirmButtonColor: C.primary, cancelButtonColor: C.cancel, heightAuto: false });
            }).then(function (r) { return r && r.isConfirmed ? String(r.value || '') : null; });
        };
        // eduToast('Đã xóa', 'success') — thông báo nhỏ tự tắt, không chặn thao tác
        window.eduToast = function (message, icon) {
            if (!ready()) return Promise.resolve();
            return queue(function () {
                return Swal.fire({ toast: true, position: 'top', icon: icon || 'success', title: esc(message), showConfirmButton: false, timer: 2200, timerProgressBar: true });
            }).then(function () {});
        };
        // Lưới an toàn: alert() sót lại ở đâu cũng không còn hiện hộp "127.0.0.1:5500 cho biết"
        window.alert = function (m) { window.eduAlert(m); };
    })();
    
