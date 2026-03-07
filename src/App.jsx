import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── helpers ─────────────────────────────────────────────────────────────────
function getDaysLeft(purchaseDate, warrantyMonths) {
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + parseInt(warrantyMonths));
  return Math.floor((expiry - new Date()) / 86400000);
}
function getExpiryDate(purchaseDate, warrantyMonths) {
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + parseInt(warrantyMonths));
  return expiry.toLocaleDateString("cs-CZ");
}
function getExpiryISO(purchaseDate, warrantyMonths) {
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + parseInt(warrantyMonths));
  return expiry.toISOString().split("T")[0];
}
function fromDB(row) {
  return {
    id: row.id, name: row.name, category: row.category,
    price: row.price ? String(row.price) : "",
    serial: row.serial || "", purchaseDate: row.purchase_date,
    warrantyMonths: row.warranty_months, note: row.note || "",
    photoUrl: row.photo_url || null, receiptUrl: row.receipt_url || null,
  };
}
function toDB(item, userId) {
  return {
    user_id: userId, name: item.name, category: item.category,
    price: item.price ? parseFloat(item.price) : null,
    serial: item.serial || null, purchase_date: item.purchaseDate,
    warranty_months: parseInt(item.warrantyMonths) || 24,
    note: item.note || null,
    photo_url: item.photoUrl || null, receipt_url: item.receiptUrl || null,
  };
}

// ─── upload helper ────────────────────────────────────────────────────────────
async function uploadFile(file, userId, folder) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("warranty-files").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("warranty-files").getPublicUrl(path);
  return data.publicUrl;
}

// ─── theme ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f5f5f0", surface: "#ffffff", card: "#fafaf7",
  border: "#e0e0d8", borderGreen: "#c8dfc0",
  yellow: "#e6c000", green: "#2d6a1f", greenLight: "#3a7a28",
  text: "#1a1a1a", muted: "#777", faint: "#aaaaaa",
  red: "#c0392b", redBg: "#fff0ee", redBorder: "#f5c0b8",
  expired: "#ececea", expiredBorder: "#d8d8d4",
  statBg: "#ffffff", sheetBg: "#ffffff",
};
const DARK = {
  bg: "#0f0f0f", surface: "#1a1a1a", card: "#1e1e1e",
  border: "#2a2a2a", borderGreen: "#1e3020",
  yellow: "#e6c000", green: "#2d6a1f", greenLight: "#4a8c30",
  text: "#f0f0f0", muted: "#666", faint: "#3a3a3a",
  red: "#e05555", redBg: "#2a0f0f", redBorder: "#4a2020",
  expired: "#141414", expiredBorder: "#222",
  statBg: "#1a1a1a", sheetBg: "#141414",
};

const FONT = "'Space Mono', monospace";
const CATEGORIES = ["Elektronika", "Počítače", "Nářadí", "Bílá technika", "Nábytek", "Sport", "Ostatní"];

// ─── theme context ────────────────────────────────────────────────────────────
const ThemeCtx = React.createContext({ C: LIGHT, dark: false, toggle: () => {} });
function useTheme() { return React.useContext(ThemeCtx); }

// ─── global styles ────────────────────────────────────────────────────────────
function GlobalStyles({ dark }) {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: ${dark ? "#0f0f0f" : "#f5f5f0"}; transition: background 0.2s; }
      input:focus, select:focus, textarea:focus {
        border-color: #e6c000 !important;
        box-shadow: 0 0 0 3px #e6c00022 !important;
      }
      input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      .item-card:hover { transform: translateY(-1px); box-shadow: 0 4px 16px #0000002a; }
      .item-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
      button:active { opacity: 0.85; transform: scale(0.98); }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${dark ? "#333" : "#ddd"}; border-radius: 2px; }
      option { background: ${dark ? "#1a1a1a" : "#fff"}; color: ${dark ? "#f0f0f0" : "#1a1a1a"}; }
    `}</style>
  );
}

// ─── PhotoUpload ──────────────────────────────────────────────────────────────
function PhotoUpload({ url, onFile, label = "FOTO PRODUKTU", height = 130, accept = "image/*" }) {
  const { C } = useTheme();
  const ref = React.useRef();
  const [preview, setPreview] = React.useState(url || null);
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFile(file);
  };
  return (
    <div onClick={() => ref.current.click()}
      style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8, height, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, position: "relative", overflow: "hidden", cursor: "pointer" }}>
      {preview
        ? <img src={preview} alt="náhled" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontSize: height > 100 ? 28 : 22 }}>📷</div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: FONT, letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
          </div>
      }
      <div style={{ position: "absolute", top: 8, right: 8, background: C.yellow, color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 2, fontFamily: FONT, pointerEvents: "none" }}>
        {preview ? "ZMĚNIT" : "+ PŘIDAT"}
      </div>
      <input ref={ref} type="file" accept={accept} capture="environment" onChange={handleChange} style={{ display: "none" }} />
    </div>
  );
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────
function Badge({ text, color }) {
  return <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 2, background: color + "22", color, border: `1px solid ${color}44`, fontFamily: FONT }}>{text}</span>;
}

function WarrantyBar({ daysLeft, isExpired }) {
  const { C } = useTheme();
  if (isExpired) return <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 8 }} />;
  const pct = Math.min(100, Math.max(0, (daysLeft / 730) * 100));
  const color = daysLeft < 60 ? C.yellow : daysLeft < 180 ? "#a8d060" : C.green;
  return (
    <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}88`, transition: "width 0.6s ease" }} />
    </div>
  );
}

function FInput({ label, value, onChange, type = "text", placeholder, required }) {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>{label}{required && " *"}</div>
      <input value={value} onChange={onChange} type={type} placeholder={placeholder}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function FSelect({ label, value, onChange, options }) {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>{label}</div>
      <select value={value} onChange={onChange}
        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box", appearance: "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style: ex = {} }) {
  const { C } = useTheme();
  const s = {
    primary: { background: disabled ? C.border : C.yellow, color: disabled ? C.muted : "#000", border: "none" },
    ghost: { background: C.surface, color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}` },
  }[variant];
  return <button onClick={onClick} disabled={disabled} style={{ borderRadius: 4, padding: "12px 16px", fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", cursor: disabled ? "default" : "pointer", ...s, ...ex }}>{children}</button>;
}

function Sheet({ onClose, children, maxHeight = "92vh" }) {
  const { C } = useTheme();
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 430, background: C.sheetBg, borderTop: `2px solid ${C.yellow}`, borderRadius: "16px 16px 0 0", padding: "20px 20px 40px", maxHeight, overflowY: "auto", animation: "slideUp 0.28s ease" }}>
        <div style={{ width: 40, height: 3, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        {children}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function Spinner() {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.yellow}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Toast({ msg, type }) {
  const { C } = useTheme();
  if (!msg) return null;
  const bg = type === "error" ? C.redBg : C.bg;
  const color = type === "error" ? C.red : C.green;
  const border = type === "error" ? C.redBorder : C.borderGreen;
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: bg, border: `1px solid ${border}`, color, borderRadius: 6, padding: "10px 18px", fontFamily: FONT, fontSize: 11, fontWeight: 700, zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 16px #0003", animation: "fadeIn 0.2s ease" }}>
      {msg}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportPDF(items) {
  const rows = items.map(item => {
    const days = getDaysLeft(item.purchaseDate, item.warrantyMonths);
    const expired = days <= 0;
    return `
      <tr style="opacity:${expired ? 0.5 : 1}">
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.price ? parseFloat(item.price).toLocaleString("cs-CZ") + " Kč" : "—"}</td>
        <td>${new Date(item.purchaseDate).toLocaleDateString("cs-CZ")}</td>
        <td>${getExpiryDate(item.purchaseDate, item.warrantyMonths)}</td>
        <td style="color:${expired ? "#aaa" : days < 60 ? "#e6a000" : "#2d6a1f"}">${expired ? "VYPRŠELO" : days + " dní"}</td>
        <td>${item.serial || "—"}</td>
      </tr>`;
  }).join("");

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const activeCount = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) > 0).length;
  const now = new Date().toLocaleDateString("cs-CZ");

  const html = `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8">
  <title>Záručáky – Export</title>
  <style>
    body { font-family: monospace; padding: 32px; color: #1a1a1a; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #999; font-size: 11px; margin-bottom: 24px; }
    .stats { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { background: #f5f5f0; padding: 12px 16px; border-radius: 6px; }
    .stat-val { font-size: 20px; font-weight: bold; }
    .stat-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.1em; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #e6c000; font-size: 9px; letter-spacing: 0.1em; color: #999; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 32px; font-size: 10px; color: #ccc; text-align: center; }
  </style></head><body>
  <h1>⬛ ZÁRUČÁKY</h1>
  <div class="meta">Export ze dne ${now}</div>
  <div class="stats">
    <div class="stat"><div class="stat-val">${items.length}</div><div class="stat-label">Celkem položek</div></div>
    <div class="stat"><div class="stat-val">${activeCount}</div><div class="stat-label">Aktivních záruk</div></div>
    <div class="stat"><div class="stat-val">${totalValue.toLocaleString("cs-CZ")} Kč</div><div class="stat-label">Celková hodnota</div></div>
  </div>
  <table>
    <thead><tr>
      <th>NÁZEV</th><th>KATEGORIE</th><th>CENA</th><th>KOUPENO</th><th>ZÁRUKA DO</th><th>ZBÝVÁ</th><th>SÉRIOVÉ Č.</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">© PasysDev</div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) setTimeout(() => w.print(), 600);
}

// ─── Share ────────────────────────────────────────────────────────────────────
function shareItem(item) {
  const days = getDaysLeft(item.purchaseDate, item.warrantyMonths);
  const expired = days <= 0;
  const text = `📦 ${item.name}
Kategorie: ${item.category}
${item.price ? `Cena: ${parseFloat(item.price).toLocaleString("cs-CZ")} Kč\n` : ""}Koupeno: ${new Date(item.purchaseDate).toLocaleDateString("cs-CZ")}
Záruka do: ${getExpiryDate(item.purchaseDate, item.warrantyMonths)}
Stav: ${expired ? "⚠️ VYPRŠELO" : `✅ zbývá ${days} dní`}
${item.serial ? `S/N: ${item.serial}` : ""}
— Záručáky (PasysDev)`;

  if (navigator.share) {
    navigator.share({ title: item.name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert("Zkopírováno do schránky!"));
  }
}

// ─── StatsSheet ───────────────────────────────────────────────────────────────
function StatsSheet({ items, onClose }) {
  const { C } = useTheme();
  const active = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) > 0);
  const expired = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) <= 0);
  const expiring = items.filter(i => { const d = getDaysLeft(i.purchaseDate, i.warrantyMonths); return d > 0 && d < 180; });
  const totalValue = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const activeValue = active.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  const byCat = CATEGORIES.map(cat => ({
    cat,
    count: items.filter(i => i.category === cat).length,
    value: items.filter(i => i.category === cat).reduce((s, i) => s + (parseFloat(i.price) || 0), 0),
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count);

  const soonest = [...active].sort((a, b) => getDaysLeft(a.purchaseDate, a.warrantyMonths) - getDaysLeft(b.purchaseDate, b.warrantyMonths)).slice(0, 3);

  return (
    <Sheet onClose={onClose} maxHeight="92vh">
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: "0.1em", marginBottom: 20 }}>📊 STATISTIKY</div>

      {/* hlavní čísla */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {[
          { label: "CELKOVÁ HODNOTA", value: totalValue.toLocaleString("cs-CZ") + " Kč", color: C.text },
          { label: "HODNOTA V ZÁRUCE", value: activeValue.toLocaleString("cs-CZ") + " Kč", color: C.greenLight },
          { label: "AKTIVNÍ ZÁRUKY", value: active.length, color: C.greenLight },
          { label: "VYPRŠELO", value: expired.length, color: C.muted },
          { label: "BRZY VYPRŠÍ", value: expiring.length, color: C.yellow },
          { label: "PRŮMĚRNÁ CENA", value: items.length ? Math.round(totalValue / items.length).toLocaleString("cs-CZ") + " Kč" : "—", color: C.text },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: FONT }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* brzy vyprší */}
      {soonest.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.15em", marginBottom: 10 }}>NEJBLIŽŠÍ VYPRŠENÍ</div>
          {soonest.map(item => {
            const d = getDaysLeft(item.purchaseDate, item.warrantyMonths);
            const color = d < 60 ? C.yellow : C.greenLight;
            return (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.text, fontFamily: FONT }}>{item.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: FONT }}>{d} dní</span>
              </div>
            );
          })}
        </div>
      )}

      {/* podle kategorie */}
      {byCat.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.15em", marginBottom: 10 }}>PODLE KATEGORIE</div>
          {byCat.map(x => (
            <div key={x.cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: C.text, fontFamily: FONT }}>{x.cat}</span>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>{x.count} ks · {x.value ? x.value.toLocaleString("cs-CZ") + " Kč" : "—"}</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(x.count / items.length) * 100}%`, height: "100%", background: C.greenLight, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Btn onClick={() => exportPDF(items)} style={{ width: "100%" }}>📄 EXPORTOVAT DO PDF</Btn>
    </Sheet>
  );
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onSelect }) {
  const { C } = useTheme();
  const days = getDaysLeft(item.purchaseDate, item.warrantyMonths);
  const isExpired = days <= 0;
  const urgency = !isExpired && days < 60;
  const priceStr = item.price ? parseFloat(item.price).toLocaleString("cs-CZ") + " Kč" : "—";

  return (
    <div className="item-card" onClick={() => onSelect(item)}
      style={{ background: isExpired ? C.expired : C.card, border: `1px solid ${isExpired ? C.expiredBorder : urgency ? C.yellow + "44" : C.borderGreen}`, borderRadius: 6, padding: "14px 16px", marginBottom: 10, cursor: "pointer", opacity: isExpired ? 0.5 : 1, filter: isExpired ? "grayscale(0.6)" : "none", position: "relative", overflow: "hidden" }}>
      {urgency && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${C.yellow},transparent)` }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: isExpired ? C.muted : C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            <Badge text={item.category} color={isExpired ? C.muted : C.greenLight} />
            {urgency && <Badge text="BRZY VYPRŠÍ" color={C.yellow} />}
            {isExpired && <Badge text="VYPRŠELO" color={C.muted} />}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: isExpired ? C.muted : C.yellow }}>{priceStr}</div>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{isExpired ? "—" : `${days} dní`}</div>
        </div>
      </div>
      <WarrantyBar daysLeft={days} isExpired={isExpired} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: C.faint, fontFamily: FONT }}>
        <span>KOUPENO {new Date(item.purchaseDate).toLocaleDateString("cs-CZ")}</span>
        <span>DO {getExpiryDate(item.purchaseDate, item.warrantyMonths)}</span>
      </div>
    </div>
  );
}

// ─── DetailSheet ──────────────────────────────────────────────────────────────
function DetailSheet({ item, onClose, onEdit, onDelete }) {
  const { C } = useTheme();
  const days = getDaysLeft(item.purchaseDate, item.warrantyMonths);
  const isExpired = days <= 0;
  const priceStr = item.price ? parseFloat(item.price).toLocaleString("cs-CZ") + " Kč" : "—";
  const fields = [
    { label: "CENA", value: priceStr },
    { label: "SÉRIOVÉ Č.", value: item.serial || "—" },
    { label: "DATUM NÁKUPU", value: new Date(item.purchaseDate).toLocaleDateString("cs-CZ") },
    { label: "ZÁRUKA DO", value: getExpiryDate(item.purchaseDate, item.warrantyMonths) },
    { label: "DÉLKA ZÁRUKY", value: item.warrantyMonths + " měs." },
    { label: "ZBÝVÁ", value: isExpired ? "VYPRŠELO" : days + " dní" },
  ];
  return (
    <Sheet onClose={onClose}>
      <div style={{ marginBottom: 18, filter: isExpired ? "grayscale(0.7)" : "none" }}>
        <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 6 }}>FOTO PRODUKTU</div>
        {item.photoUrl
          ? <img src={item.photoUrl} alt="foto" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8, display: "block" }} />
          : <div style={{ background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 8, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>📷</div><div style={{ fontSize: 9, color: C.muted, fontFamily: FONT, letterSpacing: "0.1em", marginTop: 4 }}>BEZ FOTKY</div></div>
            </div>
        }
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: isExpired ? C.muted : C.text, marginBottom: 6 }}>{item.name}</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <Badge text={item.category} color={isExpired ? C.muted : C.greenLight} />
        <div onClick={() => shareItem(item)} style={{ marginLeft: "auto", cursor: "pointer", fontSize: 18 }} title="Sdílet">🔗</div>
      </div>
      <WarrantyBar daysLeft={days} isExpired={isExpired} />
      <div style={{ height: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {fields.map(f => (
          <div key={f.label} style={{ background: C.bg, borderRadius: 5, padding: "10px 12px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: isExpired ? C.muted : C.text, fontFamily: FONT, fontWeight: 700 }}>{f.value}</div>
          </div>
        ))}
      </div>
      {item.note && (
        <div style={{ background: C.bg, borderRadius: 5, padding: "10px 12px", border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 3 }}>POZNÁMKA</div>
          <div style={{ fontSize: 11, color: C.muted }}>{item.note}</div>
        </div>
      )}
      {item.receiptUrl
        ? <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 6 }}>ÚČTENKA</div>
            <img src={item.receiptUrl} alt="účtenka" style={{ width: "100%", borderRadius: 6, display: "block", cursor: "pointer" }} onClick={() => window.open(item.receiptUrl, "_blank")} />
          </div>
        : <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 5, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>🧾</span>
            <div>
              <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em" }}>ÚČTENKA</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Přidej účtenku přes Upravit</div>
            </div>
          </div>
      }
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => { onClose(); onEdit(item); }} style={{ flex: 1 }}>✏️ UPRAVIT</Btn>
        <Btn onClick={() => { onClose(); onDelete(item); }} variant="danger">🗑</Btn>
      </div>
    </Sheet>
  );
}

// ─── AddEditSheet ─────────────────────────────────────────────────────────────
const EMPTY = { name: "", price: "", serial: "", purchaseDate: new Date().toISOString().split("T")[0], warrantyMonths: "24", category: "Elektronika", note: "" };

function AddEditSheet({ item, onClose, onSave, loading }) {
  const { C } = useTheme();
  const [form, setForm] = useState(item && item.id ? { ...item, warrantyMonths: String(item.warrantyMonths ?? 24), price: String(item.price ?? "") } : { ...EMPTY });
  const [photoFile, setPhotoFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const isEdit = !!item;

  return (
    <Sheet onClose={onClose} maxHeight="96vh">
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: "0.1em", marginBottom: 16 }}>{isEdit ? "✏️ UPRAVIT POLOŽKU" : "＋ NOVÁ POLOŽKA"}</div>
      <PhotoUpload url={form.photoUrl} onFile={setPhotoFile} label="FOTO PRODUKTU" height={110} />
      <PhotoUpload url={form.receiptUrl} onFile={setReceiptFile} label="ÚČTENKA" height={70} accept="image/*,application/pdf" />
      <FInput label="NÁZEV POLOŽKY" required value={form.name} onChange={set("name")} placeholder="např. Samsung Galaxy S24" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FInput label="CENA (Kč)" value={form.price} onChange={set("price")} type="number" placeholder="0" />
        <FInput label="ZÁRUKA (MĚS.)" value={form.warrantyMonths} onChange={set("warrantyMonths")} type="number" placeholder="24" />
      </div>
      <FInput label="SÉRIOVÉ ČÍSLO" value={form.serial} onChange={set("serial")} placeholder="SN-XXXXX" />
      <FInput label="DATUM NÁKUPU" value={form.purchaseDate} onChange={set("purchaseDate")} type="date" />
      <FSelect label="KATEGORIE" value={form.category} onChange={set("category")} options={CATEGORIES} />
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>POZNÁMKA</div>
        <textarea value={form.note} onChange={set("note")} placeholder="Volitelná poznámka…" rows={3}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
      </div>
      {form.purchaseDate && form.warrantyMonths && (
        <div style={{ background: C.bg, border: `1px solid ${C.borderGreen}`, borderRadius: 5, padding: "8px 12px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.1em" }}>ZÁRUKA VYPRŠÍ</span>
          <span style={{ fontSize: 11, color: C.greenLight, fontFamily: FONT, fontWeight: 700 }}>{getExpiryISO(form.purchaseDate, form.warrantyMonths)}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }} disabled={loading}>ZRUŠIT</Btn>
        <Btn onClick={async () => { if (form.name.trim() && !loading) await onSave(form, photoFile, receiptFile); }}
          disabled={!form.name.trim() || loading} style={{ flex: 2 }}>
          {loading ? "UKLÁDÁM…" : isEdit ? "ULOŽIT ZMĚNY →" : "PŘIDAT POLOŽKU →"}
        </Btn>
      </div>
    </Sheet>
  );
}

// ─── DeleteSheet ──────────────────────────────────────────────────────────────
function DeleteSheet({ item, onClose, onConfirm, loading }) {
  const { C } = useTheme();
  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 38, marginBottom: 14 }}>🗑️</div>
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>Smazat položku?</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{item.name}</div>
        <div style={{ fontSize: 10, color: C.faint, marginBottom: 28 }}>Tato akce je nevratná.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }} disabled={loading}>ZRUŠIT</Btn>
          <Btn onClick={() => onConfirm(item.id)} variant="danger" style={{ flex: 1 }} disabled={loading}>{loading ? "MAŽU…" : "SMAZAT"}</Btn>
        </div>
      </div>
    </Sheet>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  const { C } = useTheme();
  return (
    <div style={{ textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 8 }}>Zatím žádné záruky</div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 28 }}>Přidej první položku a sleduj záruční lhůty.</div>
      <Btn onClick={onAdd}>+ PŘIDAT PRVNÍ POLOŽKU</Btn>
    </div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen() {
  const { C, dark } = useTheme();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("ok");

  const showMsg = (text, type = "ok") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(null), 3500); };

  const handleLogin = async () => {
    if (!email || !pass) return showMsg("Vyplň e-mail a heslo", "error");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) return showMsg(error.message === "Invalid login credentials" ? "Špatný e-mail nebo heslo" : error.message, "error");
  };
  const handleRegister = async () => {
    if (!email || !pass) return showMsg("Vyplň e-mail a heslo", "error");
    if (pass !== pass2) return showMsg("Hesla se neshodují", "error");
    if (pass.length < 6) return showMsg("Heslo musí mít alespoň 6 znaků", "error");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) return showMsg(error.message, "error");
    showMsg("Registrace úspěšná! Zkontroluj e-mail.");
    setMode("login");
  };
  const handleReset = async () => {
    if (!email) return showMsg("Zadej e-mail", "error");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) return showMsg(error.message, "error");
    showMsg("E-mail pro reset hesla odeslán!");
    setMode("login");
  };

  const handle = mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleReset;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <Toast msg={msg} type={msgType} />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${C.yellow}88,transparent)` }} />

      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.yellow, padding: "10px 20px", marginBottom: 14 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "#000", letterSpacing: "0.04em" }}>ZÁRUČ<span style={{ color: "#1a3a10" }}>ÁKY</span></span>
        </div>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.25em" }}>SPRÁVA ZÁRUČNÍCH LHŮT</div>
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", marginBottom: 24, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          {[["login","PŘIHLÁSIT"], ["register","REGISTROVAT"]].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{ flex: 1, padding: "9px 0", background: mode === k ? C.yellow : C.surface, color: mode === k ? "#000" : C.muted, border: "none", fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 6 }}>E-MAIL</div>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="vas@email.cz" onKeyDown={e => e.key === "Enter" && handle()}
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
        </div>
        {mode !== "reset" && (
          <div style={{ marginBottom: mode === "register" ? 14 : 28 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 6 }}>HESLO</div>
            <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        {mode === "register" && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 6 }}>HESLO ZNOVU</div>
            <input value={pass2} onChange={e => setPass2(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
          </div>
        )}

        <button onClick={handle} disabled={loading}
          style={{ width: "100%", background: loading ? C.border : C.yellow, color: loading ? C.muted : "#000", border: "none", borderRadius: 4, padding: "14px", fontFamily: FONT, fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", cursor: loading ? "default" : "pointer", marginBottom: 14 }}>
          {loading ? "…" : mode === "login" ? "PŘIHLÁSIT SE →" : mode === "register" ? "REGISTROVAT →" : "ODESLAT RESET →"}
        </button>

        {mode === "login" && <div style={{ textAlign: "center" }}><span onClick={() => setMode("reset")} style={{ fontSize: 10, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>Zapomenuté heslo?</span></div>}
        {mode === "reset" && <div style={{ textAlign: "center" }}><span onClick={() => setMode("login")} style={{ fontSize: 10, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>← Zpět na přihlášení</span></div>}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, justifyContent: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em" }}>NAPOJENO NA SUPABASE</span>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 9, color: C.faint }}>© PasysDev</div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ items, loading, onAdd, onSelect, onLogout, userEmail, onToggleTheme }) {
  const { C, dark } = useTheme();
  const [sort, setSort] = useState("expiry");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const dA = getDaysLeft(a.purchaseDate, a.warrantyMonths);
    const dB = getDaysLeft(b.purchaseDate, b.warrantyMonths);
    const expA = dA <= 0, expB = dB <= 0;
    if (expA !== expB) return expA ? 1 : -1;
    if (sort === "name") return a.name.localeCompare(b.name, "cs");
    if (expA) return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    return dA - dB;
  });

  const active = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) > 0);
  const expiring = items.filter(i => { const d = getDaysLeft(i.purchaseDate, i.warrantyMonths); return d > 0 && d < 180; });
  const expired = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) <= 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", fontFamily: FONT, paddingBottom: 100 }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* header */}
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ display: "inline-block", background: C.yellow, padding: "2px 8px", marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#000", letterSpacing: "0.05em" }}>ZÁRUČÁKY</span>
            </div>
            <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.15em" }}>{active.length} AKTIVNÍCH · {expired.length} VYPRŠELÝCH</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(""); }}
              style={{ width: 34, height: 34, background: showSearch ? C.yellow : C.surface, border: `1px solid ${showSearch ? C.yellow : C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>🔍</div>
            <div onClick={() => setShowStats(true)}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>📊</div>
            <div onClick={onToggleTheme}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>{dark ? "☀️" : "🌙"}</div>
            <div onClick={() => { if (window.confirm(`Odhlásit se?\n${userEmail}`)) onLogout(); }}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.borderGreen}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }} title={userEmail}>👤</div>
          </div>
        </div>

        {showSearch && (
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat položku nebo kategorii…" autoFocus
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.yellow}66`, borderRadius: 4, padding: "9px 12px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {[{ key: "expiry", label: "DLE ZÁRUKY" }, { key: "name", label: "DLE NÁZVU" }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              style={{ background: sort === s.key ? C.yellow : C.surface, color: sort === s.key ? "#000" : C.muted, border: `1px solid ${sort === s.key ? C.yellow : C.border}`, borderRadius: 3, padding: "5px 12px", fontSize: 9, fontFamily: FONT, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "14px 16px" }}>
        {[{ label: "CELKEM", value: items.length, color: C.text }, { label: "BRZY VYPRŠÍ", value: expiring.length, color: C.yellow }, { label: "VYPRŠELO", value: expired.length, color: C.muted }].map(s => (
          <div key={s.label} style={{ background: C.statBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.12em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* list */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.2em", marginBottom: 12 }}>
          POLOŽKY — {sort === "expiry" ? "DLE ZÁRUKY" : "DLE NÁZVU"}{search ? ` · "${search}"` : ""}
        </div>
        {loading ? <Spinner />
          : items.length === 0 ? <EmptyState onAdd={onAdd} />
          : sorted.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 11 }}>Žádné výsledky pro „{search}"</div>
          : sorted.map(item => <ItemCard key={item.id} item={item} onSelect={onSelect} />)
        }
      </div>

      {/* footer copyright */}
      <div style={{ textAlign: "center", padding: "20px 0 8px", fontSize: 9, color: C.faint, fontFamily: FONT }}>
        © PasysDev
      </div>

      {/* FAB */}
      <div onClick={onAdd} style={{ position: "fixed", bottom: 28, right: 20, width: 52, height: 52, background: C.yellow, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 28px ${C.yellow}88`, zIndex: 60, color: "#000", userSelect: "none" }}>+</div>

      {showStats && <StatsSheet items={items} onClose={() => setShowStats(false)} />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("zarucaky-theme") === "dark");
  const C = dark ? DARK : LIGHT;
  const toggleTheme = () => setDark(d => { const n = !d; localStorage.setItem("zarucaky-theme", n ? "dark" : "light"); return n; });

  const [session, setSession] = useState(undefined);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchItems = useCallback(async () => {
    if (!session) return;
    setLoadingItems(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    setLoadingItems(false);
    if (error) return showToast("Chyba načítání: " + error.message, "error");
    setItems((data || []).map(fromDB));
  }, [session]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async (form, photoFile, receiptFile) => {
    if (!session) return;
    setSavingItem(true);
    try {
      let photoUrl = form.photoUrl || null;
      let receiptUrl = form.receiptUrl || null;
      if (photoFile) { try { photoUrl = await uploadFile(photoFile, session.user.id, "photos"); } catch (e) { showToast("Chyba uploadu fotky: " + e.message, "error"); return; } }
      if (receiptFile) { try { receiptUrl = await uploadFile(receiptFile, session.user.id, "receipts"); } catch (e) { showToast("Chyba uploadu účtenky: " + e.message, "error"); return; } }
      const isEdit = !!form.id && items.find(i => i.id === form.id);
      const payload = toDB({ ...form, photoUrl, receiptUrl }, session.user.id);
      let error;
      if (isEdit) { ({ error } = await supabase.from("items").update(payload).eq("id", form.id)); }
      else { ({ error } = await supabase.from("items").insert(payload)); }
      if (error) { showToast("Chyba ukládání: " + error.message, "error"); return; }
      showToast(isEdit ? "Položka aktualizována ✓" : "Položka přidána ✓");
      setEditing(null);
      fetchItems();
    } finally { setSavingItem(false); }
  };

  const handleDelete = async (id) => {
    if (!session) return;
    setDeletingItem(true);
    const { error } = await supabase.from("items").delete().eq("id", id);
    setDeletingItem(false);
    if (error) return showToast("Chyba mazání: " + error.message, "error");
    showToast("Položka smazána");
    setDeleting(null);
    fetchItems();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setItems([]); };

  if (session === undefined) return (
    <ThemeCtx.Provider value={{ C, dark, toggle: toggleTheme }}>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <Spinner />
      </div>
    </ThemeCtx.Provider>
  );

  return (
    <ThemeCtx.Provider value={{ C, dark, toggle: toggleTheme }}>
      <GlobalStyles dark={dark} />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {!session
        ? <LoginScreen />
        : <>
            <Dashboard items={items} loading={loadingItems} onAdd={() => setEditing(false)} onSelect={setSelected} onLogout={handleLogout} userEmail={session.user.email} onToggleTheme={toggleTheme} />
            {selected && <DetailSheet item={selected} onClose={() => setSelected(null)} onEdit={item => { setSelected(null); setEditing(item); }} onDelete={item => { setSelected(null); setDeleting(item); }} />}
            {editing !== null && <AddEditSheet item={editing || null} onClose={() => setEditing(null)} onSave={handleSave} loading={savingItem} />}
            {deleting && <DeleteSheet item={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deletingItem} />}
          </>
      }
    </ThemeCtx.Provider>
  );
}
