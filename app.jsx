// EduOrient — điểm vào (entry) của trang đăng nhập. Chỉ chứa vỏ App + lệnh render; màn hình Giáo viên / Quản trị / Phụ huynh nằm ở app-teacher / app-admin / app-parent và được tải theo nhu cầu.
import { AuthGate, ErrorBoundary, LazyAdminPanel, LazyTeacherApp, PAGE_STUDENT, ScreenLoading, Suspense, fbSignOut, goTo } from './app-core.jsx';

        const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;


        // App (vỏ mỏng): chỉ chứa màn hình đăng nhập; Giáo viên / Quản trị được tải riêng theo vai trò sau khi đăng nhập.
        // Học sinh đăng nhập xong được chuyển sang hocsinh.html nên không phải tải code của giáo viên / quản trị.
        function App() {
            const [user, setUser] = useState(null); // Current logged in user object
            useEffect(() => { if (user && user.role === 'student') goTo(PAGE_STUDENT); }, [user]);
            if (user && user.role === 'student') return null; // đang chuyển sang hocsinh.html
            if (!user) return <AuthGate onUser={setUser} />;
            if (user.role === 'admin') return <Suspense fallback={<ScreenLoading />}><LazyAdminPanel user={user} onLogout={() => fbSignOut(setUser)} /></Suspense>;
            return <Suspense fallback={<ScreenLoading />}><LazyTeacherApp user={user} setUser={setUser} /></Suspense>;
        }


        try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<ErrorBoundary><App /></ErrorBoundary>);
        } catch (e) {
            console.error(e);
            document.getElementById('root').innerHTML = '<div style="padding:24px;font-family:sans-serif;text-align:center"><h2>Không khởi động được ứng dụng</h2><p style="color:#64748b;font-size:14px">' + String((e && e.message) || e).replace(/</g, '&lt;') + '</p><button onclick="location.reload()" style="margin-top:12px;padding:10px 18px;border:0;border-radius:10px;background:#4361ee;color:#fff;font-weight:700">Tải lại trang</button></div>';
        }
