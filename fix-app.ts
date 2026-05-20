import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// First, remove ALL inserted alerts
content = content.replace(/alert\('Có lỗi xảy ra, vui lòng thử lại'\);\s*/g, '');

// Now safely insert them ONLY after console.error(...) inside catch blocks or just anywhere since it's asked for API/saves.
// "Tại các khối catch (error) của các hàm gọi API hoặc lưu dữ liệu, thêm một thông báo trực quan alert('Có lỗi xảy ra, vui lòng thử lại'); ngay sau dòng console.error(error);"
// So we will just look for `console.error(error);` or `console.error('...', error);` and append the alert on the next line if it's followed by a newline.

content = content.replace(/(console\.error\([^;]+\);)(\s*)/g, "$1$2alert('Có lỗi xảy ra, vui lòng thử lại');$2");

fs.writeFileSync('src/App.tsx', content, 'utf-8');
