"use client";

/**
 * Jadvalni CSV qilib yuklab beradi.
 *
 * Ajratgich — nuqtali vergul: Excel o'zbek/rus lokalida vergulli CSV'ni bitta
 * ustunga tiqib qo'yadi. Fayl boshidagi BOM ham Excel uchun — usiz o'zbekcha
 * harflar (o', g', ʼ) buzilib ko'rinadi.
 */
export function downloadCsv(
  fileName: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
