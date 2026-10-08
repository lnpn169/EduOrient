// Tailwind cho TRANG HỌC SINH (hocsinh.html + hocsinh.js).
// preflight: false  -> giữ nguyên hành vi cũ (trước đây cũng tắt preflight khi nạp từ CDN), không đụng CSS riêng của trang.
module.exports = {
  content: ['./hocsinh.html', './hocsinh.js'],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
