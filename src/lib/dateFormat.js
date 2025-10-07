// src/utils/formatYmd.js
export function formatYmd(ymd, fmt = 'MM/DD/YYYY') {
    if (!ymd || typeof ymd !== 'string') return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
    if (!m) return '';
    const [, y, mm, dd] = m;
    return fmt === 'DD/MM/YYYY' ? `${dd}/${mm}/${y}` : `${mm}/${dd}/${y}`;
  }
  