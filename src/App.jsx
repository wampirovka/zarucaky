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
  return expiry.toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB");
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

// ─── i18n ─────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  cs: {
    appName: "ZÁRUČÁKY", appSubtitle: "SPRÁVA ZÁRUČNÍCH LHŮT",
    login: "PŘIHLÁSIT", register: "REGISTROVAT",
    loginBtn: "PŘIHLÁSIT SE →", registerBtn: "REGISTROVAT →", resetBtn: "ODESLAT RESET →",
    email: "E-MAIL", password: "HESLO", passwordAgain: "HESLO ZNOVU",
    forgotPassword: "Zapomenuté heslo?", backToLogin: "← Zpět na přihlášení",
    connected: "NAPOJENO NA SUPABASE",
    active: "AKTIVNÍCH", expired_s: "VYPRŠELÝCH",
    total: "CELKEM", expiringSoon: "BRZY VYPRŠÍ", expired: "VYPRŠELO",
    byExpiry: "DLE ZÁRUKY", byName: "DLE NÁZVU",
    items: "POLOŽKY", searchPlaceholder: "Hledat položku nebo kategorii…",
    addItem: "+ PŘIDAT PRVNÍ POLOŽKU", noResults: "Žádné výsledky pro",
    addNew: "＋ NOVÁ POLOŽKA", editItem: "✏️ UPRAVIT POLOŽKU",
    itemName: "NÁZEV POLOŽKY", itemNamePlaceholder: "např. Samsung Galaxy S24",
    price: "CENA (Kč)", warrantyMonths: "ZÁRUKA (MĚS.)", serial: "SÉRIOVÉ ČÍSLO",
    purchaseDate: "DATUM NÁKUPU", category: "KATEGORIE", note: "POZNÁMKA",
    notePlaceholder: "Volitelná poznámka…", warrantyExpires: "ZÁRUKA VYPRŠÍ",
    cancel: "ZRUŠIT", saveChanges: "ULOŽIT ZMĚNY →", addItemBtn: "PŘIDAT POLOŽKU →",
    saving: "UKLÁDÁM…",
    photoProduct: "FOTO PRODUKTU", receipt: "ÚČTENKA", noPhoto: "BEZ FOTKY",
    addReceipt: "Přidej účtenku přes Upravit",
    takePhoto: "Vyfotit", takePhotoDesc: "Otevřít fotoaparát",
    fromGallery: "Vybrat z galerie", fromGalleryDesc: "Vybrat existující fotku",
    edit: "✏️ UPRAVIT", delete: "🗑",
    deleteTitle: "Smazat položku?", deleteConfirm: "SMAZAT", deleting: "MAŽU…",
    deleteWarning: "Tato akce je nevratná.",
    stats: "📊 STATISTIKY", totalValue: "CELKOVÁ HODNOTA", activeValue: "HODNOTA V ZÁRUCE",
    activeWarranties: "AKTIVNÍ ZÁRUKY", avgPrice: "PRŮMĚRNÁ CENA",
    soonestExpiry: "NEJBLIŽŠÍ VYPRŠENÍ", byCategory: "PODLE KATEGORIE",
    exportPDF: "📄 EXPORTOVAT DO PDF", days: "dní",
    bought: "KOUPENO", until: "DO",
    priceLabel: "CENA", serialLabel: "SÉRIOVÉ Č.", buyDate: "DATUM NÁKUPU",
    warrantyUntil: "ZÁRUKA DO", warrantyLength: "DÉLKA ZÁRUKY", remaining: "ZBÝVÁ",
    noteLabel: "POZNÁMKA", changePhoto: "ZMĚNIT", addPhoto: "+ PŘIDAT",
    logoutConfirm: "Odhlásit se?", count: "ks",
    emptyTitle: "Zatím žádné záruky", emptyDesc: "Přidej první položku a sleduj záruční lhůty.",
    errLoad: "Chyba načítání: ", errSave: "Chyba ukládání: ", errDelete: "Chyba mazání: ",
    errPhotoUpload: "Chyba uploadu fotky: ", errReceiptUpload: "Chyba uploadu účtenky: ",
    savedOk: "Položka aktualizována ✓", addedOk: "Položka přidána ✓", deletedOk: "Položka smazána",
    badCredentials: "Špatný e-mail nebo heslo",
    fillEmailPass: "Vyplň e-mail a heslo", passMismatch: "Hesla se neshodují",
    passShort: "Heslo musí mít alespoň 6 znaků", fillEmail: "Zadej e-mail",
    registerOk: "Registrace úspěšná! Zkontroluj e-mail.", resetOk: "E-mail pro reset hesla odeslán!",
    categories: ["Elektronika", "Počítače", "Nářadí", "Bílá technika", "Nábytek", "Sport", "Ostatní"],
    exportDate: "Export ze dne", exportTitle: "ZÁRUČÁKY – Export",
    copiedToClipboard: "Zkopírováno do schránky!",
  },
  en: {
    appName: "WARRANTI", appSubtitle: "WARRANTY MANAGEMENT",
    login: "LOGIN", register: "REGISTER",
    loginBtn: "LOG IN →", registerBtn: "REGISTER →", resetBtn: "SEND RESET →",
    email: "E-MAIL", password: "PASSWORD", passwordAgain: "CONFIRM PASSWORD",
    forgotPassword: "Forgot password?", backToLogin: "← Back to login",
    connected: "CONNECTED TO SUPABASE",
    active: "ACTIVE", expired_s: "EXPIRED",
    total: "TOTAL", expiringSoon: "EXPIRING SOON", expired: "EXPIRED",
    byExpiry: "BY EXPIRY", byName: "BY NAME",
    items: "ITEMS", searchPlaceholder: "Search item or category…",
    addItem: "+ ADD FIRST ITEM", noResults: "No results for",
    addNew: "＋ NEW ITEM", editItem: "✏️ EDIT ITEM",
    itemName: "ITEM NAME", itemNamePlaceholder: "e.g. Samsung Galaxy S24",
    price: "PRICE", warrantyMonths: "WARRANTY (MO.)", serial: "SERIAL NUMBER",
    purchaseDate: "PURCHASE DATE", category: "CATEGORY", note: "NOTE",
    notePlaceholder: "Optional note…", warrantyExpires: "WARRANTY EXPIRES",
    cancel: "CANCEL", saveChanges: "SAVE CHANGES →", addItemBtn: "ADD ITEM →",
    saving: "SAVING…",
    photoProduct: "PRODUCT PHOTO", receipt: "RECEIPT", noPhoto: "NO PHOTO",
    addReceipt: "Add receipt via Edit",
    takePhoto: "Take photo", takePhotoDesc: "Open camera",
    fromGallery: "Choose from gallery", fromGalleryDesc: "Pick existing photo",
    edit: "✏️ EDIT", delete: "🗑",
    deleteTitle: "Delete item?", deleteConfirm: "DELETE", deleting: "DELETING…",
    deleteWarning: "This action cannot be undone.",
    stats: "📊 STATISTICS", totalValue: "TOTAL VALUE", activeValue: "VALUE IN WARRANTY",
    activeWarranties: "ACTIVE WARRANTIES", avgPrice: "AVG. PRICE",
    soonestExpiry: "EXPIRING SOONEST", byCategory: "BY CATEGORY",
    exportPDF: "📄 EXPORT TO PDF", days: "days",
    bought: "BOUGHT", until: "UNTIL",
    priceLabel: "PRICE", serialLabel: "SERIAL NO.", buyDate: "PURCHASE DATE",
    warrantyUntil: "WARRANTY UNTIL", warrantyLength: "WARRANTY LENGTH", remaining: "REMAINING",
    noteLabel: "NOTE", changePhoto: "CHANGE", addPhoto: "+ ADD",
    logoutConfirm: "Log out?", count: "pcs",
    emptyTitle: "No warranties yet", emptyDesc: "Add your first item to track warranty periods.",
    errLoad: "Load error: ", errSave: "Save error: ", errDelete: "Delete error: ",
    errPhotoUpload: "Photo upload error: ", errReceiptUpload: "Receipt upload error: ",
    savedOk: "Item updated ✓", addedOk: "Item added ✓", deletedOk: "Item deleted",
    badCredentials: "Wrong email or password",
    fillEmailPass: "Enter email and password", passMismatch: "Passwords don't match",
    passShort: "Password must be at least 6 characters", fillEmail: "Enter your email",
    registerOk: "Registration successful! Check your email.", resetOk: "Password reset email sent!",
    categories: ["Electronics", "Computers", "Tools", "Appliances", "Furniture", "Sports", "Other"],
    exportDate: "Exported on", exportTitle: "WARRANTI – Export",
    copiedToClipboard: "Copied to clipboard!",
  },
};

const lang = navigator.language?.startsWith("cs") || navigator.language?.startsWith("sk") ? "cs" : "en";
const T = TRANSLATIONS[lang];

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
const CATEGORIES = T.categories;

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
function PhotoUpload({ url, onFile, label = T.photoProduct, height = 130, accept = "image/*" }) {
  const { C } = useTheme();
  const refCamera = React.useRef();
  const refGallery = React.useRef();
  const [preview, setPreview] = React.useState(url || null);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFile(file);
    setShowMenu(false);
  };

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      {/* hlavní plocha */}
      <div onClick={() => setShowMenu(m => !m)}
        style={{ background: C.surface, border: `1px dashed ${showMenu ? C.yellow : C.border}`, borderRadius: 8, height, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: "pointer" }}>
        {preview
          ? <img src={preview} alt="náhled" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: height > 100 ? 28 : 22 }}>📷</div>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: FONT, letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
            </div>
        }
        <div style={{ position: "absolute", top: 8, right: 8, background: C.yellow, color: "#000", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 2, fontFamily: FONT, pointerEvents: "none" }}>
          {preview ? T.changePhoto : T.addPhoto}
        </div>
      </div>

      {/* výběr zdroje */}
      {showMenu && (
        <div style={{ position: "absolute", top: height + 4, left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 10, overflow: "hidden", boxShadow: "0 4px 20px #0002" }}>
          <div onClick={() => refCamera.current.click()}
            style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 20 }}>📷</span>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.text }}>{T.takePhoto}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{T.takePhotoDesc}</div>
            </div>
          </div>
          <div onClick={() => refGallery.current.click()}
            style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🖼️</span>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: C.text }}>{T.fromGallery}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{T.fromGalleryDesc}</div>
            </div>
          </div>
        </div>
      )}

      {/* backdrop pro zavření menu */}
      {showMenu && <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowMenu(false)} />}

      {/* skryté inputy */}
      <input ref={refCamera} type="file" accept={accept} capture="camera" onChange={handleChange} style={{ display: "none" }} />
      <input ref={refGallery} type="file" accept={accept} onChange={handleChange} style={{ display: "none" }} />
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
        <td style="color:${expired ? "#aaa" : days < 60 ? "#e6a000" : "#2d6a1f"}">${expired ? T.expired : days + " " + T.days}</td>
        <td>${item.serial || "—"}</td>
      </tr>`;
  }).join("");

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const activeCount = items.filter(i => getDaysLeft(i.purchaseDate, i.warrantyMonths) > 0).length;
  const now = new Date().toLocaleDateString("cs-CZ");

  const html = `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8">
  <title>${T.exportTitle}</title>
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
  <h1>⬛ ${T.appName}</h1>
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
— ${T.appName} (PasysDev)`;

  if (navigator.share) {
    navigator.share({ title: item.name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert(T.copiedToClipboard));
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
          { label: T.totalValue, value: totalValue.toLocaleString("cs-CZ") + " Kč", color: C.text },
          { label: T.activeValue, value: activeValue.toLocaleString("cs-CZ") + " Kč", color: C.greenLight },
          { label: T.activeWarranties, value: active.length, color: C.greenLight },
          { label: T.expired, value: expired.length, color: C.muted },
          { label: T.expiringSoon, value: expiring.length, color: C.yellow },
          { label: T.avgPrice, value: items.length ? Math.round(totalValue / items.length).toLocaleString("cs-CZ") + " Kč" : "—", color: C.text },
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
                <span style={{ fontSize: 10, color: C.muted, fontFamily: FONT }}>{x.count} {T.count} · {x.value ? x.value.toLocaleString("cs-CZ") + " Kč" : "—"}</span>
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
            {urgency && <Badge text={T.expiringSoon} color={C.yellow} />}
            {isExpired && <Badge text={T.expired} color={C.muted} />}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: isExpired ? C.muted : C.yellow }}>{priceStr}</div>
          <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{isExpired ? "—" : `${days} dní`}</div>
        </div>
      </div>
      <WarrantyBar daysLeft={days} isExpired={isExpired} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: C.faint, fontFamily: FONT }}>
        <span>{T.bought} {new Date(item.purchaseDate).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB")}</span>
        <span>{T.until} {getExpiryDate(item.purchaseDate, item.warrantyMonths)}</span>
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
    { label: T.priceLabel, value: priceStr },
    { label: T.serialLabel, value: item.serial || "—" },
    { label: T.buyDate, value: new Date(item.purchaseDate).toLocaleDateString(lang === "cs" ? "cs-CZ" : "en-GB") },
    { label: T.warrantyUntil, value: getExpiryDate(item.purchaseDate, item.warrantyMonths) },
    { label: T.warrantyLength, value: item.warrantyMonths + (lang === "cs" ? " měs." : " mo.") },
    { label: T.remaining, value: isExpired ? T.expired : days + " " + T.days },
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
          <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 3 }}>{T.noteLabel}</div>
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
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{T.addReceipt}</div>
            </div>
          </div>
      }
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={() => { onClose(); onEdit(item); }} style={{ flex: 1 }}>{T.edit}</Btn>
        <Btn onClick={() => { onClose(); onDelete(item); }} variant="danger">🗑</Btn>
      </div>
    </Sheet>
  );
}

// ─── OCR helper ───────────────────────────────────────────────────────────────
async function ocrReceipt(file) {
  const toBase64 = f => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
  const b64 = await toBase64(file);
  const mediaType = file.type || "image/jpeg";

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
          { type: "text", text: `Analyze this receipt/invoice image. Extract ONLY these fields and respond with ONLY valid JSON, no markdown:
{"name":"product name or store name","price":"amount as number string without currency","date":"YYYY-MM-DD format or empty string if not found"}
If you cannot find a field, use empty string. Date must be in YYYY-MM-DD format.` }
        ]
      }]
    })
  });
  const data = await resp.json();
  const text = data.content?.[0]?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {};
  }
}

// ─── AddEditSheet ─────────────────────────────────────────────────────────────
const EMPTY = { name: "", price: "", serial: "", purchaseDate: new Date().toISOString().split("T")[0], warrantyMonths: "24", category: "Elektronika", note: "" };

function AddEditSheet({ item, onClose, onSave, loading }) {
  const { C } = useTheme();
  const [form, setForm] = useState(item && item.id ? { ...item, warrantyMonths: String(item.warrantyMonths ?? 24), price: String(item.price ?? "") } : { ...EMPTY });
  const [photoFile, setPhotoFile] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const isEdit = !!item;

  const handleReceiptFile = async (file) => {
    setReceiptFile(file);
    setOcrLoading(true);
    try {
      const result = await ocrReceipt(file);
      setForm(f => ({
        ...f,
        name: result.name && !f.name ? result.name : f.name,
        price: result.price && !f.price ? result.price : f.price,
        purchaseDate: result.date && result.date.match(/^\d{4}-\d{2}-\d{2}$/) ? result.date : f.purchaseDate,
      }));
    } catch (e) {
      // OCR selhalo tiše — formulář zůstane prázdný
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <Sheet onClose={onClose} maxHeight="96vh">
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: "0.1em", marginBottom: 16 }}>{isEdit ? T.editItem : T.addNew}</div>
      <PhotoUpload url={form.photoUrl} onFile={setPhotoFile} label={T.photoProduct} height={110} />
      <div style={{ position: "relative" }}>
        <PhotoUpload url={form.receiptUrl} onFile={handleReceiptFile} label={T.receipt} height={70} accept="image/*,application/pdf" />
        {ocrLoading && (
          <div style={{ position: "absolute", inset: 0, background: C.surface + "cc", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.yellow}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <span style={{ fontFamily: FONT, fontSize: 10, color: C.muted }}>🤖 {lang === "cs" ? "Čtu účtenku…" : "Reading receipt…"}</span>
          </div>
        )}
        {!ocrLoading && receiptFile && (
          <div style={{ marginTop: -10, marginBottom: 14, background: C.bg, border: `1px solid ${C.borderGreen}`, borderRadius: 5, padding: "6px 10px", fontSize: 9, color: C.greenLight, fontFamily: FONT }}>
            ✓ {lang === "cs" ? "AI přečetlo účtenku" : "AI read the receipt"}
          </div>
        )}
      </div>
      <FInput label={T.itemName} required value={form.name} onChange={set("name")} placeholder={T.itemNamePlaceholder} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <FInput label={T.price} value={form.price} onChange={set("price")} type="number" placeholder="0" />
        <FInput label={T.warrantyMonths} value={form.warrantyMonths} onChange={set("warrantyMonths")} type="number" placeholder="24" />
      </div>
      <FInput label={T.serial} value={form.serial} onChange={set("serial")} placeholder="SN-XXXXX" />
      <FInput label={T.purchaseDate} value={form.purchaseDate} onChange={set("purchaseDate")} type="date" />
      <FSelect label={T.category} value={form.category} onChange={set("category")} options={CATEGORIES} />
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>{T.noteLabel}</div>
        <textarea value={form.note} onChange={set("note")} placeholder={T.notePlaceholder} rows={3}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
      </div>
      {form.purchaseDate && form.warrantyMonths && (
        <div style={{ background: C.bg, border: `1px solid ${C.borderGreen}`, borderRadius: 5, padding: "8px 12px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.1em" }}>{T.warrantyExpires}</span>
          <span style={{ fontSize: 11, color: C.greenLight, fontFamily: FONT, fontWeight: 700 }}>{getExpiryISO(form.purchaseDate, form.warrantyMonths)}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }} disabled={loading}>{T.cancel}</Btn>
        <Btn onClick={async () => { if (form.name.trim() && !loading) await onSave(form, photoFile, receiptFile); }}
          disabled={!form.name.trim() || loading} style={{ flex: 2 }}>
          {loading ? T.saving : isEdit ? T.saveChanges : T.addItemBtn}
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
        <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>{T.deleteTitle}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{item.name}</div>
        <div style={{ fontSize: 10, color: C.faint, marginBottom: 28 }}>{T.deleteWarning}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={onClose} variant="ghost" style={{ flex: 1 }} disabled={loading}>{T.cancel}</Btn>
          <Btn onClick={() => onConfirm(item.id)} variant="danger" style={{ flex: 1 }} disabled={loading}>{loading ? T.deleting : T.deleteConfirm}</Btn>
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
      <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: C.muted, marginBottom: 8 }}>{T.emptyTitle}</div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 28 }}>{T.emptyDesc}</div>
      <Btn onClick={onAdd}>{T.addItem}</Btn>
    </div>
  );
}

// ─── HouseholdSheet ───────────────────────────────────────────────────────────
function HouseholdSheet({ onClose, userId }) {
  const { C } = useTheme();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("ok");

  const showMsg = (t, type = "ok") => { setMsg(t); setMsgType(type); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    // Najdi domácnost kde jsem člen nebo vlastník
    const { data: memberRows } = await supabase.from("household_members").select("household_id").eq("user_id", userId);
    const { data: ownedRows } = await supabase.from("households").select("*").eq("owner_id", userId);

    let hh = ownedRows?.[0] || null;
    if (!hh && memberRows?.length) {
      const { data } = await supabase.from("households").select("*").eq("id", memberRows[0].household_id).single();
      hh = data;
    }
    setHousehold(hh);

    if (hh) {
      const { data: mems } = await supabase.from("household_members").select("user_id, role, joined_at").eq("household_id", hh.id);
      setMembers(mems || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const createHousehold = async () => {
    if (!householdName.trim()) return showMsg(lang === "cs" ? "Zadej název domácnosti" : "Enter household name", "error");
    setCreating(true);
    const { data: hh, error } = await supabase.from("households").insert({ name: householdName.trim(), owner_id: userId }).select().single();
    if (error) { showMsg(error.message, "error"); setCreating(false); return; }
    await supabase.from("household_members").insert({ household_id: hh.id, user_id: userId, role: "owner" });
    setCreating(false);
    showMsg(lang === "cs" ? "Domácnost vytvořena!" : "Household created!");
    load();
  };

  const joinHousehold = async () => {
    if (!inviteCode.trim()) return showMsg(lang === "cs" ? "Zadej kód pozvánky" : "Enter invite code", "error");
    setJoining(true);
    const { data: hh, error } = await supabase.from("households").select("*").eq("invite_code", inviteCode.trim().toUpperCase()).single();
    if (error || !hh) { showMsg(lang === "cs" ? "Neplatný kód" : "Invalid code", "error"); setJoining(false); return; }
    const { error: e2 } = await supabase.from("household_members").insert({ household_id: hh.id, user_id: userId, role: "member" });
    if (e2) { showMsg(lang === "cs" ? "Už jsi členem" : "Already a member", "error"); setJoining(false); return; }
    setJoining(false);
    showMsg(lang === "cs" ? "Přidán do domácnosti!" : "Joined household!");
    load();
  };

  const leaveHousehold = async () => {
    if (!window.confirm(lang === "cs" ? "Opustit domácnost?" : "Leave household?")) return;
    await supabase.from("household_members").delete().eq("household_id", household.id).eq("user_id", userId);
    if (household.owner_id === userId) await supabase.from("households").delete().eq("id", household.id);
    setHousehold(null);
    setMembers([]);
    showMsg(lang === "cs" ? "Opustil jsi domácnost" : "Left household");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(household.invite_code);
    showMsg(lang === "cs" ? "Kód zkopírován!" : "Code copied!");
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.yellow, letterSpacing: "0.1em", marginBottom: 20 }}>🏠 {lang === "cs" ? "SDÍLENÍ DOMÁCNOSTI" : "HOUSEHOLD SHARING"}</div>

      {msg && <div style={{ background: msgType === "error" ? C.redBg : "#eef6eb", border: `1px solid ${msgType === "error" ? C.redBorder : C.borderGreen}`, color: msgType === "error" ? C.red : C.green, borderRadius: 5, padding: "8px 12px", fontFamily: FONT, fontSize: 11, marginBottom: 14 }}>{msg}</div>}

      {loading ? <Spinner /> : household ? (
        <>
          {/* Info o domácnosti */}
          <div style={{ background: C.surface, border: `1px solid ${C.borderGreen}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 4 }}>{lang === "cs" ? "DOMÁCNOST" : "HOUSEHOLD"}</div>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 10 }}>{household.name}</div>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.12em", marginBottom: 6 }}>{lang === "cs" ? "KÓD POZVÁNKY" : "INVITE CODE"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.yellow, letterSpacing: "0.2em" }}>{household.invite_code}</div>
              <Btn onClick={copyCode} variant="ghost" style={{ padding: "6px 12px", fontSize: 10 }}>📋 {lang === "cs" ? "Kopírovat" : "Copy"}</Btn>
            </div>
          </div>

          {/* Členové */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 8, color: C.faint, fontFamily: FONT, letterSpacing: "0.15em", marginBottom: 10 }}>{lang === "cs" ? `ČLENOVÉ (${members.length})` : `MEMBERS (${members.length})`}</div>
            {members.map(m => (
              <div key={m.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, marginBottom: 6 }}>
                <span style={{ fontFamily: FONT, fontSize: 11, color: C.text }}>👤 {m.user_id === userId ? (lang === "cs" ? "Ty" : "You") : m.user_id.slice(0, 8) + "…"}</span>
                <span style={{ fontSize: 9, color: m.role === "owner" ? C.yellow : C.muted, fontFamily: FONT, fontWeight: 700 }}>{m.role.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <Btn onClick={leaveHousehold} variant="danger" style={{ width: "100%" }}>
            {household.owner_id === userId ? (lang === "cs" ? "🗑 Smazat domácnost" : "🗑 Delete household") : (lang === "cs" ? "← Opustit domácnost" : "← Leave household")}
          </Btn>
        </>
      ) : (
        <>
          {/* Vytvořit */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.15em", marginBottom: 12 }}>{lang === "cs" ? "VYTVOŘIT NOVOU DOMÁCNOST" : "CREATE NEW HOUSEHOLD"}</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>{lang === "cs" ? "NÁZEV" : "NAME"}</div>
              <input value={householdName} onChange={e => setHouseholdName(e.target.value)} placeholder={lang === "cs" ? "např. Rodina Novákových" : "e.g. Smith Family"}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
            </div>
            <Btn onClick={createHousehold} disabled={creating} style={{ width: "100%" }}>{creating ? "…" : (lang === "cs" ? "VYTVOŘIT →" : "CREATE →")}</Btn>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 9, color: C.faint, fontFamily: FONT }}>{lang === "cs" ? "NEBO" : "OR"}</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Připojit */}
          <div>
            <div style={{ fontSize: 9, color: C.faint, fontFamily: FONT, letterSpacing: "0.15em", marginBottom: 12 }}>{lang === "cs" ? "PŘIPOJIT SE KÓD EM" : "JOIN WITH CODE"}</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 5, fontFamily: FONT }}>{lang === "cs" ? "KÓD POZVÁNKY" : "INVITE CODE"}</div>
              <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="AB12CD34" maxLength={8}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, padding: "11px 13px", color: C.text, fontSize: 16, fontFamily: FONT, outline: "none", boxSizing: "border-box", letterSpacing: "0.3em", textAlign: "center" }} />
            </div>
            <Btn onClick={joinHousehold} disabled={joining} style={{ width: "100%" }}>{joining ? "…" : (lang === "cs" ? "PŘIPOJIT SE →" : "JOIN →")}</Btn>
          </div>
        </>
      )}
    </Sheet>
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
    if (!email || !pass) return showMsg(T.fillEmailPass, "error");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) return showMsg(error.message === "Invalid login credentials" ? T.badCredentials : error.message, "error");
  };
  const handleRegister = async () => {
    if (!email || !pass) return showMsg(T.fillEmailPass, "error");
    if (pass !== pass2) return showMsg(T.passMismatch, "error");
    if (pass.length < 6) return showMsg(T.passShort, "error");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) return showMsg(error.message, "error");
    showMsg(T.registerOk);
    setMode("login");
  };
  const handleReset = async () => {
    if (!email) return showMsg(T.fillEmail, "error");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) return showMsg(error.message, "error");
    showMsg(T.resetOk);
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
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.25em" }}>{T.appSubtitle}</div>
      </div>

      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", marginBottom: 24, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          {[["login",T.login], ["register",T.register]].map(([k, label]) => (
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
          {loading ? "…" : mode === "login" ? T.loginBtn : mode === "register" ? T.registerBtn : T.resetBtn}
        </button>

        {mode === "login" && <div style={{ textAlign: "center" }}><span onClick={() => setMode("reset")} style={{ fontSize: 10, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>{T.forgotPassword}</span></div>}
        {mode === "reset" && <div style={{ textAlign: "center" }}><span onClick={() => setMode("login")} style={{ fontSize: 10, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>{T.backToLogin}</span></div>}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, justifyContent: "center" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          <span style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em" }}>{T.connected}</span>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 9, color: C.faint }}>© PasysDev</div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ items, loading, onAdd, onSelect, onLogout, userEmail, onToggleTheme, userId }) {
  const { C, dark } = useTheme();
  const [sort, setSort] = useState("expiry");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHousehold, setShowHousehold] = useState(false);

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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#000", letterSpacing: "0.05em" }}>{T.appName}</span>
            </div>
            <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.15em" }}>{active.length} {T.active} · {expired.length} {T.expired_s}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div onClick={() => { setShowSearch(s => !s); if (showSearch) setSearch(""); }}
              style={{ width: 34, height: 34, background: showSearch ? C.yellow : C.surface, border: `1px solid ${showSearch ? C.yellow : C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>🔍</div>
            <div onClick={() => setShowStats(true)}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>📊</div>
            <div onClick={() => setShowHousehold(true)}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>🏠</div>
            <div onClick={onToggleTheme}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>{dark ? "☀️" : "🌙"}</div>
            <div onClick={() => { if (window.confirm(`${T.logoutConfirm}\n${userEmail}`)) onLogout(); }}
              style={{ width: 34, height: 34, background: C.surface, border: `1px solid ${C.borderGreen}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }} title={userEmail}>👤</div>
          </div>
        </div>

        {showSearch && (
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={T.searchPlaceholder} autoFocus
            style={{ width: "100%", background: C.surface, border: `1px solid ${C.yellow}66`, borderRadius: 4, padding: "9px 12px", color: C.text, fontSize: 12, fontFamily: FONT, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {[{ key: "expiry", label: T.byExpiry }, { key: "name", label: T.byName }].map(s => (
            <button key={s.key} onClick={() => setSort(s.key)}
              style={{ background: sort === s.key ? C.yellow : C.surface, color: sort === s.key ? "#000" : C.muted, border: `1px solid ${sort === s.key ? C.yellow : C.border}`, borderRadius: 3, padding: "5px 12px", fontSize: 9, fontFamily: FONT, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "14px 16px" }}>
        {[{ label: T.total, value: items.length, color: C.text }, { label: T.expiringSoon, value: expiring.length, color: C.yellow }, { label: T.expired, value: expired.length, color: C.muted }].map(s => (
          <div key={s.label} style={{ background: C.statBg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.12em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* list */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontSize: 8, color: C.faint, letterSpacing: "0.2em", marginBottom: 12 }}>
          POLOŽKY — {sort === "expiry" ? T.byExpiry : T.byName}{search ? ` · "${search}"` : ""}
        </div>
        {loading ? <Spinner />
          : items.length === 0 ? <EmptyState onAdd={onAdd} />
          : sorted.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: 11 }}>{T.noResults} „{search}"</div>
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
      {showHousehold && <HouseholdSheet onClose={() => setShowHousehold(false)} userId={userId} />}
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
    if (error) return showToast(T.errLoad + error.message, "error");
    setItems((data || []).map(fromDB));
  }, [session]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async (form, photoFile, receiptFile) => {
    if (!session) return;
    setSavingItem(true);
    try {
      let photoUrl = form.photoUrl || null;
      let receiptUrl = form.receiptUrl || null;
      if (photoFile) { try { photoUrl = await uploadFile(photoFile, session.user.id, "photos"); } catch (e) { showToast(T.errPhotoUpload + e.message, "error"); return; } }
      if (receiptFile) { try { receiptUrl = await uploadFile(receiptFile, session.user.id, "receipts"); } catch (e) { showToast(T.errReceiptUpload + e.message, "error"); return; } }
      const isEdit = !!form.id && items.find(i => i.id === form.id);
      const payload = toDB({ ...form, photoUrl, receiptUrl }, session.user.id);
      let error;
      if (isEdit) { ({ error } = await supabase.from("items").update(payload).eq("id", form.id)); }
      else { ({ error } = await supabase.from("items").insert(payload)); }
      if (error) { showToast(T.errSave + error.message, "error"); return; }
      showToast(isEdit ? T.savedOk : T.addedOk);
      setEditing(null);
      fetchItems();
    } finally { setSavingItem(false); }
  };

  const handleDelete = async (id) => {
    if (!session) return;
    setDeletingItem(true);
    const { error } = await supabase.from("items").delete().eq("id", id);
    setDeletingItem(false);
    if (error) return showToast(T.errDelete + error.message, "error");
    showToast(T.deletedOk);
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
            <Dashboard items={items} loading={loadingItems} onAdd={() => setEditing(false)} onSelect={setSelected} onLogout={handleLogout} userEmail={session.user.email} onToggleTheme={toggleTheme} userId={session.user.id} />
            {selected && <DetailSheet item={selected} onClose={() => setSelected(null)} onEdit={item => { setSelected(null); setEditing(item); }} onDelete={item => { setSelected(null); setDeleting(item); }} />}
            {editing !== null && <AddEditSheet item={editing || null} onClose={() => setEditing(null)} onSave={handleSave} loading={savingItem} />}
            {deleting && <DeleteSheet item={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deletingItem} />}
          </>
      }
    </ThemeCtx.Provider>
  );
}
