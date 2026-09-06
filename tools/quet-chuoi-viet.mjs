import fs from 'node:fs';
import path from 'node:path';

/* Đếm chuỗi tiếng Việt người dùng NHÌN THẤY trong mã nguồn.

   Chạy:  npm run i18n-con-lai

   Dùng để biết còn bao nhiêu chuỗi chưa đưa vào `lib/i18n` — con số trong tài
   liệu bàn giao lấy từ đây, nên ai cũng kiểm lại được thay vì phải tin.

   Đừng dùng regex thủ công để bắt chuỗi trong nháy. Bản đầu làm vậy và đếm
   thiếu gần bốn lần (154 thay vì 533) vì regex chỉ bắt được chữ nằm giữa hai
   thẻ JSX. Cách hiện tại: bỏ chú thích rồi duyệt từng ký tự để tách chuỗi
   ('...', "...", `...`) và văn bản JSX. Chậm hơn nhưng đếm đúng.

   Con số này xấp xỉ và sai cả hai chiều, dùng để đo tiến độ chứ đừng dùng để
   chốt khối lượng. Đếm thừa vì lẫn vài chuỗi không hiện ra màn (thông điệp lỗi
   nội bộ, khoá). Đếm thiếu vì chỉ nhận ra chuỗi có dấu: "CLB", "Tham gia",
   "Nam", "Email" trông y hệt tiếng Anh nên máy không phân biệt được. */

const VIET =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁÂĂÈÉÊÌÍÒÓÔƠÙÚƯỲĐ]/;

function boChuThich(src) {
  let ra = '';
  let i = 0;
  while (i < src.length) {
    const hai = src.slice(i, i + 2);
    if (hai === '/*') {
      const het = src.indexOf('*/', i + 2);
      i = het < 0 ? src.length : het + 2;
      continue;
    }
    if (hai === '//') {
      const het = src.indexOf('\n', i);
      i = het < 0 ? src.length : het;
      continue;
    }
    const c = src[i];
    /* Nhảy qua nguyên vẹn một chuỗi để dấu / bên trong không bị coi là chú thích. */
    if (c === "'" || c === '"' || c === '`') {
      const dau = i;
      i += 1;
      while (i < src.length && src[i] !== c) i += src[i] === '\\' ? 2 : 1;
      i += 1;
      ra += src.slice(dau, i);
      continue;
    }
    ra += c;
    i += 1;
  }
  return ra;
}

function chuoiTrongNhay(code) {
  const ra = [];
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === "'" || c === '"' || c === '`') {
      i += 1;
      let than = '';
      while (i < code.length && code[i] !== c) {
        than += code[i] === '\\' ? code[i] + (code[i + 1] ?? '') : code[i];
        i += code[i] === '\\' ? 2 : 1;
      }
      i += 1;
      ra.push(than);
      continue;
    }
    i += 1;
  }
  return ra;
}

function vanBanJsx(code) {
  const ra = [];
  for (const m of code.matchAll(/>([^<>]{2,200})</g)) {
    /* Bỏ phần biểu thức {…}; phần chữ còn lại mới là thứ người dùng đọc. */
    const t = m[1].replace(/\{[^}]*\}/g, ' ').replace(/\s+/g, ' ').trim();
    if (t) ra.push(t);
  }
  return ra;
}

export function quet(dir) {
  const out = new Map();
  const them = (t, p) => {
    const s = t.trim();
    if (s.length < 2 || !VIET.test(s)) return;
    if (!out.has(s)) out.set(s, new Set());
    out.get(s).add(p);
  };
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) {
        const code = boChuThich(fs.readFileSync(p, 'utf8'));
        for (const t of chuoiTrongNhay(code)) them(t, p);
        for (const t of vanBanJsx(code)) them(t, p);
      }
    }
  })(dir);
  return out;
}

if (process.argv[2]) {
  const r = quet(process.argv[2]);
  console.log(`=== ${process.argv[2]} — ${r.size} chuoi ===`);
  if (process.argv[3] === '--liet-ke') {
    for (const [t, files] of [...r.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'))) {
      console.log('  ', JSON.stringify(t), '<-', [...files].map((x) => path.basename(x)).join(', '));
    }
  }
}
