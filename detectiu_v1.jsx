import { useState, useEffect, useCallback, useRef } from "react";

// TODO: Canviar per la BD de l'Anna
const SUPABASE_URL = "https://NOVA_BD_ANNA.supabase.co";
const SUPABASE_KEY = "NOVA_CLAU_ANNA";
const ANTHROPIC_KEY = ""; // deixar buit — s'usa via proxy de Vercel si es configura

const supaFetch = async (table, params = "") => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const supaUpdate = async (table, id_field, id_val, data) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${id_field}=eq.${id_val}`, {
    method: "PATCH",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const supaInsert = async (table, data) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const supaDelete = async (table, id_field, id_val) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${id_field}=eq.${id_val}`, {
    method: "DELETE",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
};

const supaRpc = async (fn, params = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ── PORTADES ──
// Contrasenya — canvia-la a Vercel com a variable d'entorn
const APP_PASSWORD = "THX137";

const COVER_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'%3E%3Crect width='80' height='120' fill='%2313131f'/%3E%3Ctext x='40' y='65' text-anchor='middle' fill='%23444' font-size='30'%3E%F0%9F%93%96%3C/text%3E%3C/svg%3E";
const EBOOK_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='120' viewBox='0 0 80 120'%3E%3Crect width='80' height='120' fill='%230d1a2e'/%3E%3Ctext x='40' y='55' text-anchor='middle' fill='%234488cc' font-size='28'%3E%F0%9F%93%B1%3C/text%3E%3Ctext x='40' y='80' text-anchor='middle' fill='%234488cc44' font-size='10'%3Eebook%3C/text%3E%3C/svg%3E";
const isEbook = (ed) => ed?.format === 'ebook' || ed?.id_estanteria === 'EBOOK';
const getFallback = (ed) => isEbook(ed) ? EBOOK_FALLBACK : COVER_FALLBACK;
const getCover = (ed) => {
  if (ed?.portada_custom) return ed.portada_custom;
  if (ed?.portada_ok && ed?.isbn) return `https://covers.openlibrary.org/b/isbn/${ed.isbn.replace(/-/g,'')}-M.jpg`;
  if (ed?.portada_ok && ed?.portada_url) return ed.portada_url;
  if (ed?.portada_url && ed?.portada_ok !== false) return ed.portada_url;
  return getFallback(ed);
};
const buscarPortada = (ed) => {
  const q = encodeURIComponent(`"${ed.titulo_edicion||ed.titulo_original}" ${ed.editorial||''} ${ed.ano_edicion||''} ${ed.isbn||''} book cover`);
  window.open(`https://www.google.com/search?tbm=isch&q=${q}`, '_blank');
};
const buscarPreu = (ed, plataforma = 'iberlibro') => {
  const titol = ed.titulo_edicion || ed.titulo_original || '';
  const q = encodeURIComponent(`${titol} ${ed.editorial||''} ${ed.ano_edicion||''}`);
  const qSimple = encodeURIComponent(titol);
  const urls = {
    iberlibro: `https://www.iberlibro.com/servlet/SearchResults?kn=${q}`,
    wallapop: `https://es.wallapop.com/search?keywords=${qSimple}&category_ids=12467`,
    vinted: `https://www.vinted.es/catalog?search_text=${qSimple}`,
    amazon: `https://www.amazon.es/s?k=${qSimple}&i=stripbooks`,
  };
  window.open(urls[plataforma] || urls.iberlibro, '_blank');
};

// ── RESUMS AUTO ──
const fetchGoogleBooksResum = async (isbn, titol) => {
  try {
    const q = isbn ? `isbn:${isbn.replace(/-/g,'')}` : encodeURIComponent(titol||'');
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&fields=items(volumeInfo(description))&maxResults=1`);
    const data = await res.json();
    return data?.items?.[0]?.volumeInfo?.description || null;
  } catch { return null; }
};
const fetchGoogleBooksCover = async (isbn) => {
  if (!isbn) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn.replace(/-/g,'')}&fields=items(volumeInfo(imageLinks))&maxResults=1`);
    const data = await res.json();
    const img = data?.items?.[0]?.volumeInfo?.imageLinks;
    return img?.large || img?.medium || img?.thumbnail || null;
  } catch { return null; }
};

// ── CONSTANTS ──
const UNIVERS_NOMS = {
  'UNI-PKD-01':'Trilogia VALIS','UNI-PKD-02':'Palmer Eldritch','UNI-PKD-03':'Univers Ubik',
  'UNI-PKD-04':'Androides','UNI-PKD-05':'Suburbi americà','UNI-PKD-06':'Simulacra',
  'UNI-PKD-07':'Temps / Precog','UNI-PKD-08':'Distopies militars','UNI-PKD-09':'Scanner / Drogues',
  'UNI-PKD-10':'Gnosi / Realitat','UNI-LEM-01':'Ijon Tichy','UNI-LEM-02':'Pilot Pirx',
  'UNI-LEM-03':'Trurl i Klapaucius','UNI-LEM-04':'Independent','UNI-ASI-01':'Robots',
  'UNI-ASI-02':'Fundació','UNI-ASI-03':'Galàctic','UNI-ASI-04':'Independent',
};
const AUTORS_RELATS = [];
const SECCIONS = [
  { id: "ALL", label: "Tot" },
  { id: "SCA", label: "Escandinava" },
  { id: "ANG", label: "Anglesa" },
  { id: "ESP", label: "Espanyola" },
  { id: "CAT", label: "Catalana" },
  { id: "USA", label: "Americana" },
  { id: "FRA", label: "Francesa" },
  { id: "ITA", label: "Italiana" },
  { id: "THR", label: "Thriller" },
  { id: "POL", label: "Policial" },
  { id: "ESP-HIS", label: "Espies" },
  { id: "MIS", label: "Misteri" },
  { id: "NEG", label: "Negre dur" },
  { id: "ALT", label: "Altres" },
  { id: "EBOOK", label: "📱 eBook" },
];
const AUTORS_FALTEN = [
  { id: "AUT001", label: "Agatha Christie" },
  { id: "AUT002", label: "Stieg Larsson" },
  { id: "AUT003", label: "Jo Nesbø" },
  { id: "AUT007", label: "Henning Mankell" },
  { id: "AUT010", label: "Donna Leon" },
];
const LLEGIT_OPTIONS = [
  { val: "no", icon: "○", label: "No llegit", color: "#555" },
  { val: "llegint", icon: "½", label: "Llegint", color: "#aa2233" },
  { val: "si", icon: "✓", label: "Llegit", color: "#6ec88e" },
];
const STARS = [1,2,3,4,5];
const APP_VERSION = "1.1.0";

const getGridCols = () => {
  const w = window.innerWidth;
  if (w > 900) return 5;
  if (w > 650) return 4;
  return 3;
};

// ── COMPONENTS ──
const BarChart = ({ data, title, onClickBar }) => {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#aa223399", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {data.map(d => (
        <div key={d.label} style={{ marginBottom: 6, cursor: onClickBar ? "pointer" : "default" }}
          onClick={() => onClickBar && onClickBar(d)}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 2 }}>
            <span style={{ color: onClickBar ? "#aa2233" : "#888" }}>{d.label}</span>
            <span style={{ color: "#aa2233" }}>{d.val}</span>
          </div>
          <div style={{ height: 6, background: "#1a1a22", borderRadius: 3 }}>
            <div style={{ height: 6, width: `${(d.val/max)*100}%`, background: onClickBar ? "#aa223366" : "#aa223344", borderRadius: 3, transition: "width 0.4s" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const EditField = ({ label, value, onSave, multiline = false, type = "text" }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || "");
  const save = () => { onSave(val); setEditing(false); };
  const cancel = () => { setVal(value || ""); setEditing(false); };
  if (!editing) return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
      <div style={{ flex: 1 }}>
        <span style={{ color: "#aa223366", textTransform: "uppercase", fontSize: 10, letterSpacing: 1 }}>{label} </span>
        <span style={{ fontSize: 12, color: value ? "#e8e0d0" : "#333" }}>{value || "—"}</span>
      </div>
      <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 11, padding: "0 4px", flexShrink: 0 }}>✎</button>
    </div>
  );
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: "#aa223366", textTransform: "uppercase", fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {multiline
        ? <textarea value={val} onChange={e => setVal(e.target.value)} rows={4}
            style={{ width: "100%", background: "#111118", border: "1px solid #aa223344", color: "#e8e0d0", padding: "8px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, resize: "vertical", boxSizing: "border-box" }} />
        : <input type={type} value={val} onChange={e => setVal(e.target.value)}
            style={{ width: "100%", background: "#111118", border: "1px solid #aa223344", color: "#e8e0d0", padding: "7px 10px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, boxSizing: "border-box" }} />
      }
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={save} style={{ padding: "4px 12px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }}>Desar</button>
        <button onClick={cancel} style={{ padding: "4px 12px", background: "none", border: "1px solid #2a2a35", color: "#555", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }}>Cancel·lar</button>
      </div>
    </div>
  );
};

// ── STYLES ──
const S = {
  app: { minHeight: "100vh", background: "#0a0a0f", color: "#e8e0d0", fontFamily: "Georgia, serif", maxWidth: "100%" },
  header: { padding: "14px 16px 0", background: "#0a0a0f", borderBottom: "1px solid #1a1a22", position: "sticky", top: 0, zIndex: 100 },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 17, fontWeight: "bold", letterSpacing: 3, color: "#aa2233", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: { background: "none", border: "1px solid #2a2a35", color: "#666", cursor: "pointer", fontSize: 13, padding: "3px 9px", borderRadius: 12, fontFamily: "Georgia, serif" },
  nav: { display: "flex" },
  navBtn: (a) => ({ flex: 1, padding: "9px 4px", background: "none", color: a ? "#aa2233" : "#555", border: "none", borderBottom: `2px solid ${a ? "#aa2233" : "transparent"}`, cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", letterSpacing: 1, textTransform: "uppercase" }),
  searchWrap: { padding: "10px 16px", background: "#0a0a0f", borderBottom: "1px solid #1a1a22", position: "sticky", top: 83, zIndex: 99 },
  input: { width: "100%", background: "#111118", border: "1px solid #2a2a35", color: "#e8e0d0", padding: "9px 12px", fontSize: 13, fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", borderRadius: 2 },
  pills: { display: "flex", gap: 6, overflowX: "auto", padding: "8px 16px", scrollbarWidth: "none", borderBottom: "1px solid #1a1a22" },
  pill: (a) => ({ padding: "4px 10px", background: a ? "#aa223318" : "transparent", color: a ? "#aa2233" : "#555", border: `1px solid ${a ? "#aa223355" : "#2a2a35"}`, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", fontFamily: "Georgia, serif", borderRadius: 2 }),
  statsBar: { padding: "6px 16px", fontSize: 11, color: "#444", borderBottom: "1px solid #111", background: "#0d0d12" },
  viewToggle: { display: "flex", gap: 4 },
  viewBtn: (a) => ({ padding: "3px 8px", background: a ? "#aa223322" : "transparent", color: a ? "#aa2233" : "#444", border: `1px solid ${a ? "#aa223344" : "#2a2a35"}`, cursor: "pointer", fontSize: 11, borderRadius: 2 }),
  grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 2 }),
  card: { position: "relative", aspectRatio: "2/3", overflow: "hidden", cursor: "pointer", background: "#111118" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.92))", padding: "18px 6px 6px" },
  cardTitle: { fontSize: 9, color: "#e8e0d0", lineHeight: 1.3, fontWeight: "bold" },
  cardShelf: { fontSize: 8, color: "#aa2233", marginTop: 2 },
  cardLlegit: { position: "absolute", top: 5, left: 5, fontSize: 12, textShadow: "0 0 4px black" },
  multiDot: { position: "absolute", top: 5, right: 5, background: "#aa2233", color: "#0a0a0f", fontSize: 8, fontWeight: "bold", padding: "1px 5px", borderRadius: 8 },
  listItem: { display: "flex", gap: 12, padding: "10px 16px", borderBottom: "1px solid #111", cursor: "pointer", alignItems: "center" },
  listImg: { width: 36, height: 54, objectFit: "cover", background: "#111118", flexShrink: 0 },
  listInfo: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 13, color: "#e8e0d0", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  listMeta: { fontSize: 10, color: "#555" },
  listShelf: { fontSize: 10, color: "#aa2233", fontFamily: "monospace", flexShrink: 0 },
  listLlegit: { fontSize: 13, flexShrink: 0 },
  loader: { textAlign: "center", padding: 60, color: "#333", fontSize: 12, letterSpacing: 3 },
  empty: { textAlign: "center", padding: 40, color: "#444", fontSize: 13 },
  errMsg: { textAlign: "center", padding: 30, color: "#c44", fontSize: 12, lineHeight: 1.5 },
  detall: { padding: 20 },
  backBtn: { background: "none", border: "none", color: "#aa2233", cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif", padding: "0 0 14px 0" },
  edTabs: { display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" },
  edTab: (a) => ({ padding: "5px 12px", background: a ? "#aa223318" : "transparent", color: a ? "#aa2233" : "#555", border: `1px solid ${a ? "#aa223355" : "#2a2a35"}`, cursor: "pointer", fontSize: 10, fontFamily: "Georgia, serif", borderRadius: 2 }),
  detallImgWrap: { position: "relative", marginBottom: 12 },
  detallImg: { width: "100%", maxHeight: 260, objectFit: "contain", background: "#111118", display: "block" },
  coverBtns: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 },
  coverBtn: (color) => ({ background: "none", border: `1px solid ${color}44`, color, cursor: "pointer", fontSize: 10, padding: "3px 8px", borderRadius: 2, fontFamily: "Georgia, serif" }),
  detallTitle: { fontSize: 19, color: "#aa2233", marginBottom: 4, lineHeight: 1.3 },
  detallOrig: { fontSize: 13, color: "#666", fontStyle: "italic", marginBottom: 10 },
  resum: { fontSize: 13, color: "#bbb", lineHeight: 1.65, marginBottom: 12, padding: "12px 14px", background: "#111118", borderLeft: "2px solid #aa223344" },
  llegitRow: { display: "flex", gap: 6, alignItems: "center", marginBottom: 16, padding: "10px 14px", background: "#111118", borderRadius: 2, flexWrap: "wrap" },
  llegitBtn: (active, color) => ({ padding: "4px 10px", background: active ? color + "22" : "transparent", color: active ? color : "#444", border: `1px solid ${active ? color + "66" : "#2a2a35"}`, cursor: "pointer", fontSize: 12, borderRadius: 2, fontFamily: "Georgia, serif" }),
  starsRow: { display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" },
  star: (active) => ({ fontSize: 16, cursor: "pointer", color: active ? "#aa2233" : "#2a2a35" }),
  sectionTitle: { fontSize: 11, color: "#aa223366", letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 10px", borderBottom: "1px solid #1a1a22", paddingBottom: 6 },
  badge: { display: "inline-block", padding: "3px 8px", background: "#aa223312", border: "1px solid #aa223333", color: "#aa2233", fontSize: 10, marginRight: 4, marginBottom: 4, letterSpacing: 0.5, borderRadius: 2 },
  notesArea: { width: "100%", background: "#111118", border: "1px solid #2a2a35", color: "#e8e0d0", padding: "10px 12px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, resize: "vertical", boxSizing: "border-box", minHeight: 80 },
  deleteBtn: { width: "100%", marginTop: 24, padding: "8px", background: "none", border: "1px solid #c4444433", color: "#c44", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 11, borderRadius: 2 },
  selectorRow: { display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #1a1a22" },
  selBtn: (a) => ({ padding: "5px 10px", background: a ? "#aa2233" : "transparent", color: a ? "#0a0a0f" : "#666", border: `1px solid ${a ? "#aa2233" : "#2a2a35"}`, cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", borderRadius: 2 }),
  faltenList: { padding: "0 16px" },
  faltenItem: { padding: "12px 0", borderBottom: "1px solid #1a1a22", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  faltenTitle: { fontSize: 14, color: "#e8e0d0", marginBottom: 2 },
  faltenCast: { fontSize: 11, color: "#aa223388", fontStyle: "italic", marginBottom: 2 },
  faltenYear: { fontSize: 11, color: "#555" },
  tipusBadge: { fontSize: 10, color: "#aa2233", border: "1px solid #aa223344", padding: "2px 7px", whiteSpace: "nowrap", borderRadius: 2, flexShrink: 0 },
  relatItem: { padding: "14px 16px", borderBottom: "1px solid #1a1a22" },
  relatTitle: { fontSize: 13, color: "#e8e0d0", marginBottom: 4, fontStyle: "italic" },
  relatMeta: { fontSize: 11, color: "#555", marginBottom: 5 },
  relatResum: { fontSize: 11, color: "#999", lineHeight: 1.55, marginBottom: 6 },
  relatBooks: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  relatBook: { fontSize: 9, color: "#8899cc", border: "1px solid #8899cc33", padding: "2px 7px", borderRadius: 2 },
  relatNoDisp: { fontSize: 9, color: "#c44", border: "1px solid #c4444433", padding: "2px 7px", borderRadius: 2, display: "inline-block", marginTop: 4 },
  univers: { display: "inline-block", fontSize: 9, color: "#aa223399", border: "1px solid #aa223322", padding: "1px 6px", marginLeft: 6, borderRadius: 2 },
  prestSection: { padding: "12px 16px 4px", borderBottom: "1px solid #1a1a22" },
  prestSectionTitle: { fontSize: 11, color: "#aa2233", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  prestItem: { padding: "8px 16px", borderBottom: "1px solid #111", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" },
  prestShelf: { fontSize: 10, color: "#aa2233", minWidth: 100, fontFamily: "monospace" },
  prestTitle: { fontSize: 12, color: "#e8e0d0", flex: 1 },
  prestLlegit: { fontSize: 12 },
  statsPage: { padding: 20 },
  statsTitle: { fontSize: 15, color: "#aa2233", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20, marginTop: 0 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 },
  statCard: { background: "#111118", border: "1px solid #1a1a22", borderRadius: 4, padding: "14px 16px", cursor: "pointer" },
  statNum: { fontSize: 28, color: "#aa2233", fontWeight: "bold", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#555", marginTop: 4 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" },
  modal: { background: "#111118", border: "1px solid #2a2a35", borderRadius: 4, padding: 24, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 16, color: "#aa2233", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, marginTop: 0 },
  modalRow: { fontSize: 13, color: "#999", marginBottom: 8, display: "flex", justifyContent: "space-between" },
  modalVal: { color: "#e8e0d0", fontWeight: "bold" },
  modalClose: { width: "100%", marginTop: 8, padding: "8px", background: "none", border: "1px solid #2a2a35", color: "#666", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, borderRadius: 2 },
  modalDivider: { borderTop: "1px solid #1a1a22", margin: "14px 0" },
  modalSmall: { fontSize: 10, color: "#444", textAlign: "center", marginTop: 8 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 10, color: "#aa223366", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 },
  formInput: { width: "100%", background: "#0a0a0f", border: "1px solid #2a2a35", color: "#e8e0d0", padding: "8px 10px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, boxSizing: "border-box", outline: "none" },
  formBtn: { width: "100%", padding: "10px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, borderRadius: 2, marginTop: 8 },
  addBtn: { position: "fixed", bottom: 20, right: 20, background: "#aa2233", color: "#0a0a0f", border: "none", borderRadius: "50%", width: 50, height: 50, fontSize: 24, cursor: "pointer", zIndex: 150, boxShadow: "0 4px 12px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
};

// ── FORMULARI NOU LLIBRE ──
const FormNouLlibre = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    titulo_edicion: "", titulo_original: "", editorial: "",
    ano_edicion: "", isbn: "", idioma: "castellano", tipo: "novela",
    id_estanteria: "", llegit: "no", autor_nom: "", format: "paper",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [resumPreview, setResumPreview] = useState(null);
  const [loadingResum, setLoadingResum] = useState(false);
  const [scanning, setScanning] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Mapa autor → prefix estanteria
  const AUTOR_SECCIO = {
    'asimov': 'ASI', 'isaac asimov': 'ASI',
    'dick': 'PKD-A', 'philip k. dick': 'PKD-A', 'philip dick': 'PKD-A',
    'lem': 'LEM', 'stanislaw lem': 'LEM',
    'herbert': 'HER', 'frank herbert': 'HER',
    'clarke': 'CLA', 'arthur c. clarke': 'CLA', 'arthur clarke': 'CLA',
    'tolkien': 'TOL', 'j.r.r. tolkien': 'TOL',
    'huxley': 'HUX', 'aldous huxley': 'HUX',
    'le guin': 'LEG', 'ursula k. le guin': 'LEG',
    'bradbury': 'BRA', 'ray bradbury': 'BRA',
    'orwell': 'ORW', 'george orwell': 'ORW',
    'pratchett': 'PRA', 'terry pratchett': 'PRA',
  };

  const suggerirEstanteria = async (autorNom) => {
    if (!autorNom) return null;
    const key = autorNom.toLowerCase().trim();
    let prefix = null;
    for (const [k, v] of Object.entries(AUTOR_SECCIO)) {
      if (key.includes(k)) { prefix = v; break; }
    }
    if (!prefix) return null;
    // Buscar el següent número lliure
    try {
      const eds = await supaFetch("edicion", `?id_estanteria=ilike.${prefix}-%&select=id_estanteria&order=id_estanteria.desc&limit=50`);
      if (!eds.length) return `${prefix}-001`;
      // Trobar el número més alt
      let maxNum = 0;
      eds.forEach(e => {
        const match = e.id_estanteria?.match(/(\d+)[ab]?\s*$/);
        if (match) { const n = parseInt(match[1]); if (n > maxNum) maxNum = n; }
      });
      // Assegurar que el número té almenys 3 dígits
      return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
    } catch { return `${prefix}-001`; }
  };

  const fetchBookData = async (isbn) => {
    if (!isbn) return;
    const clean = isbn.replace(/-/g,'').trim();
    if (clean.length < 10) return;

    let found = false;

    // 1. Intentem Google Books
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}&maxResults=1`);
      const data = await res.json();
      const info = data?.items?.[0]?.volumeInfo;
      if (info && info.title) {
        const autorDetectat = info.authors?.[0] || '';
        const estSuggerida = await suggerirEstanteria(autorDetectat);
        setForm(f => ({
          ...f,
          titulo_edicion: info.title || f.titulo_edicion,
          titulo_original: info.title || f.titulo_original,
          autor_nom: autorDetectat || f.autor_nom,
          editorial: info.publisher || f.editorial,
          ano_edicion: info.publishedDate ? info.publishedDate.substring(0,4) : f.ano_edicion,
          id_estanteria: estSuggerida || f.id_estanteria,
        }));
        if (info.description) setResumPreview(info.description.substring(0, 600));
        found = true;
      }
    } catch {}

    // 2. Fallback: Open Library (molt bona cobertura d'edicions espanyoles)
    if (!found) {
      try {
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`);
        const data = await res.json();
        const book = data[`ISBN:${clean}`];
        if (book && book.title) {
          const autorOL = book.authors?.[0]?.name || '';
          const estOL = await suggerirEstanteria(autorOL);
          setForm(f => ({
            ...f,
            titulo_edicion: book.title || f.titulo_edicion,
            titulo_original: book.title || f.titulo_original,
            autor_nom: autorOL || f.autor_nom,
            editorial: book.publishers?.[0]?.name || f.editorial,
            ano_edicion: book.publish_date ? book.publish_date.slice(-4) : f.ano_edicion,
            id_estanteria: estOL || f.id_estanteria,
          }));
          if (book.notes) setResumPreview(typeof book.notes === 'string' ? book.notes.substring(0,600) : '');
          found = true;
        }
      } catch {}
    }

    // 3. Fallback: isbndb via proxy públic
    if (!found) {
      try {
        const res = await fetch(`https://openlibrary.org/isbn/${clean}.json`);
        const data = await res.json();
        if (data && data.title) {
          setForm(f => ({
            ...f,
            titulo_edicion: data.title || f.titulo_edicion,
            editorial: data.publishers?.[0] || f.editorial,
            ano_edicion: data.publish_date ? data.publish_date.slice(-4) : f.ano_edicion,
          }));
          found = true;
        }
      } catch {}
    }
  };

  const startScan = async () => {
    setScanning(true);
    // Carregar Quagga2 — millor suport per codis de barres lineals (ISBN)
    if (!window.Quagga) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    try {
      await new Promise((resolve, reject) => {
        window.Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.getElementById('scanner-container'),
            constraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          locator: { patchSize: "medium", halfSample: true },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "code_128_reader"],
          },
          locate: true,
        }, (err) => {
          if (err) { reject(err); return; }
          resolve();
        });
      });
      window.Quagga.start();
      window.Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        const clean = code.replace(/-/g,'');
        // Acceptar EAN-13 (ISBN-13 comença per 978 o 979) o ISBN-10
        if ((clean.length === 13 && (clean.startsWith('978') || clean.startsWith('979'))) ||
            clean.length === 10) {
          set("isbn", code);
          fetchBookData(code);
          stopScan();
        }
      });
    } catch (e) {
      console.error('Scanner error:', e);
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (window.Quagga) {
      try { window.Quagga.stop(); } catch {}
    }
    setScanning(false);
  };

  const autoResum = async () => {
    setLoadingResum(true);
    const r = await fetchGoogleBooksResum(form.isbn, form.titulo_original || form.titulo_edicion);
    setResumPreview(r || "No s'ha trobat resum automàtic.");
    setLoadingResum(false);
  };

  const handleSave = async () => {
    if (!form.titulo_edicion.trim()) { setErr("Cal un títol"); return; }
    if (form.format !== 'ebook' && !form.id_estanteria.trim()) { setErr("Cal una estanteria (ex: CF-025)"); return; }
    setSaving(true); setErr(null);
    try {
      let autor_id = null;
      if (form.autor_nom.trim()) {
        const autorsExistents = await supaFetch("autor", `?autor=ilike.*${encodeURIComponent(form.autor_nom.trim())}*&limit=1`);
        if (autorsExistents.length) autor_id = autorsExistents[0].autor_id;
      }
      const edicions = await supaFetch("edicion", "?select=edicion_id&order=edicion_id.desc&limit=1");
      const lastId = edicions[0]?.edicion_id || "EDI0000";
      const nextNum = parseInt(lastId.replace("EDI", ""), 10) + 1;
      const edicion_id = `EDI${String(nextNum).padStart(4, "0")}`;
      let obra_id = null;
      if (form.titulo_original.trim()) {
        const obresEx = await supaFetch("obra", `?titulo_original=ilike.${encodeURIComponent(form.titulo_original.trim())}&limit=1`);
        if (obresEx.length) obra_id = obresEx[0].obra_id;
      }
      if (!obra_id) {
        const obres = await supaFetch("obra", "?select=obra_id&order=obra_id.desc&limit=1");
        const lastObraId = obres[0]?.obra_id || "OBR000";
        const nextObraNum = parseInt(lastObraId.replace("OBR", ""), 10) + 1;
        obra_id = `OBR${String(nextObraNum).padStart(3, "0")}`;
        await supaInsert("obra", {
          obra_id, titulo_original: form.titulo_original.trim() || form.titulo_edicion.trim(),
          ano_obra: form.ano_edicion ? parseInt(form.ano_edicion) : null,
          tipo: form.tipo, autor_id,
        });
      }
      let portada_url = null;
      if (form.isbn.trim()) {
        const coverUrl = await fetchGoogleBooksCover(form.isbn);
        portada_url = coverUrl || `https://covers.openlibrary.org/b/isbn/${form.isbn.replace(/-/g,'')}-M.jpg`;
      }
      await supaInsert("edicion", {
        edicion_id, obra_id, autor_id,
        titulo_edicion: form.titulo_edicion.trim(),
        titulo_original: form.titulo_original.trim() || null,
        editorial: form.editorial.trim() || null,
        ano_edicion: form.ano_edicion ? parseInt(form.ano_edicion) : null,
        isbn: form.isbn.trim() || null,
        idioma: form.idioma, tipo: form.tipo,
        id_estanteria: form.id_estanteria.trim().toUpperCase(),
        llegit: form.llegit,
        portada_url,
        resum: resumPreview && resumPreview !== "No s'ha trobat resum automàtic." ? resumPreview : null,
      });
      if (form.format !== 'ebook') {
        await supaInsert("ejemplar", {
          ejemplar_id: edicion_id.replace("EDI", "EJ"),
          edicion_id,
          id_estanteria: form.id_estanteria.trim().toUpperCase(),
        });
      }
      onSaved(edicion_id);
    } catch (e) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <h2 style={S.modalTitle}>+ Nou Llibre</h2>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Títol *</label>
          <input style={S.formInput} value={form.titulo_edicion} onChange={e => set("titulo_edicion", e.target.value)} placeholder="Títol de l'edició" />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Títol original</label>
          <input style={S.formInput} value={form.titulo_original} onChange={e => set("titulo_original", e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Autor</label>
          <input style={S.formInput} value={form.autor_nom} onChange={e => set("autor_nom", e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={S.formGroup}><label style={S.formLabel}>Editorial</label><input style={S.formInput} value={form.editorial} onChange={e => set("editorial", e.target.value)} /></div>
          <div style={S.formGroup}><label style={S.formLabel}>Any</label><input style={S.formInput} type="number" value={form.ano_edicion} onChange={e => set("ano_edicion", e.target.value)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={S.formGroup}>
            <label style={S.formLabel}>ISBN</label>
            <div style={{ display:"flex", gap:6 }}>
              <input style={{...S.formInput, flex:1}} value={form.isbn}
                onChange={e => { set("isbn", e.target.value); if (e.target.value.replace(/-/g,'').length >= 10) fetchBookData(e.target.value); }} />
              <button style={{ padding:"6px 10px", background:"#aa223322", border:"1px solid #aa223344", color:"#aa2233", cursor:"pointer", borderRadius:2, fontSize:11 }}
                onClick={scanning ? stopScan : startScan} title="Escanejar amb càmera">
                {scanning ? "⏹" : "📷"}
              </button>
            </div>
            {scanning && (
              <div style={{ marginTop:8, position:"relative", background:"#000", borderRadius:8, overflow:"hidden" }}>
                <div id="scanner-container" style={{ width:"100%", height:260, background:"#000", position:"relative", overflow:"hidden", borderRadius:4 }}>
                  {/* CSS injectat per forçar Quagga a omplir el contenidor */}
                  <style>{`
                    #scanner-container video,
                    #scanner-container canvas.drawingBuffer {
                      width: 100% !important;
                      height: 260px !important;
                      object-fit: cover !important;
                      position: absolute !important;
                      top: 0 !important;
                      left: 0 !important;
                    }
                  `}</style>
                </div>
                {/* Línia de scan animada */}
                <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, pointerEvents:"none" }}>
                  <div style={{ position:"absolute", top:"50%", left:"10%", right:"10%", height:2, background:"#aa223388", boxShadow:"0 0 8px #aa2233" }} />
                  <div style={{ position:"absolute", top:"30%", left:"10%", right:"10%", bottom:"30%", border:"2px solid #aa223344", borderRadius:4 }} />
                </div>
                <div style={{ padding:"6px 12px", background:"rgba(0,0,0,0.7)", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#aa2233", marginBottom:4 }}>📷 Apunta el codi de barres al requadre</div>
                  <button style={{ background:"none", border:"1px solid #c4444444", color:"#c44", cursor:"pointer", fontSize:10, padding:"3px 10px", borderRadius:2, fontFamily:"Georgia, serif" }}
                    onClick={stopScan}>⏹ Tancar càmera</button>
                </div>
              </div>
            )}
          </div>
          <div style={S.formGroup}>
            <label style={S.formLabel}>Format</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["paper","ebook"].map(f => (
                <button key={f} style={{ flex:1, padding:"6px", background: form.format===f?"#aa223322":"transparent", border:`1px solid ${form.format===f?"#aa223344":"#2a2a35"}`, color: form.format===f?"#aa2233":"#555", cursor:"pointer", fontSize:11, borderRadius:2, fontFamily:"Georgia, serif" }}
                  onClick={() => set("format", f)}>{f==="paper"?"📚 Paper":"📱 eBook"}</button>
              ))}
            </div>
          </div>
        {form.format === "paper" && <div style={S.formGroup}><label style={S.formLabel}>Estanteria *</label><input style={S.formInput} value={form.id_estanteria} onChange={e => set("id_estanteria", e.target.value)} placeholder="CF-025" /></div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={S.formGroup}>
            <label style={S.formLabel}>Idioma</label>
            <select style={{...S.formInput, cursor: "pointer"}} value={form.idioma} onChange={e => set("idioma", e.target.value)}>
              <option value="castellano">castellano</option>
              <option value="català">català</option>
              <option value="anglès">anglès</option>
              <option value="francès">francès</option>
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.formLabel}>Tipus</label>
            <select style={{...S.formInput, cursor: "pointer"}} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
              <option value="novela">novela</option>
              <option value="relatos">relatos</option>
              <option value="antologia">antologia</option>
              <option value="omnibus">omnibus</option>
              <option value="assaig">assaig</option>
              <option value="comic">comic</option>
            </select>
          </div>
          <div style={S.formGroup}>
            <label style={S.formLabel}>Llegit</label>
            <select style={{...S.formInput, cursor: "pointer"}} value={form.llegit} onChange={e => set("llegit", e.target.value)}>
              <option value="no">No llegit</option>
              <option value="llegint">Llegint</option>
              <option value="si">Llegit</option>
            </select>
          </div>
        </div>

        {/* Auto-resum en formulari nou */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={S.formLabel}>Resum</label>
            <button style={{ background: "none", border: "1px solid #aa223333", color: "#aa223388", cursor: "pointer", fontSize: 10, padding: "2px 8px", borderRadius: 2, fontFamily: "Georgia, serif" }}
              onClick={autoResum} disabled={loadingResum}>
              {loadingResum ? "⏳" : "✨ Auto"}
            </button>
          </div>
          <textarea style={{...S.formInput, minHeight: 60, resize: "vertical"}}
            value={resumPreview || ""} onChange={e => setResumPreview(e.target.value)}
            placeholder="Resum del llibre..." />
        </div>

        {err && <div style={{ color: "#c44", fontSize: 11, marginBottom: 8 }}>⚠ {err}</div>}
        <button style={S.formBtn} onClick={handleSave} disabled={saving}>
          {saving ? "Desant..." : "✓ Afegir llibre"}
        </button>
        <button style={S.modalClose} onClick={onClose}>Cancel·lar</button>
      </div>
    </div>
  );
};

// ── APP PRINCIPAL ──
export default function Biblioteca() {
  const [view, setView] = useState("biblioteca");
  const [listView, setListView] = useState(false);
  const [autenticat, setAutenticat] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const pendingActionRef = useRef(null); // Ref per accedir al valor actual dins de closures
  const scrollPosRef = useRef(0); // Guarda posició scroll per restaurar en tornar
  const [edicions, setEdicions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [obraGroups, setObraGroups] = useState({});
  const [cerca, setCerca] = useState("");
  const [seccio, setSeccio] = useState("ALL");
  const [filtreExtra, setFiltreExtra] = useState(null); // {camp, valor} per filtres des d'stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedObra, setSelectedObra] = useState(null);
  const [selectedEdIdx, setSelectedEdIdx] = useState(0);
  const [showExtra, setShowExtra] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [falten, setFalten] = useState([]);
  const [autorFalta, setAutorFalta] = useState("AUT013");
  const [relats, setRelats] = useState([]);
  const [relatEdicions, setRelatEdicions] = useState({});
  const [relatSearch, setRelatSearch] = useState("");
  const [autorRelats, setAutorRelats] = useState("AUT013");
  const [savingLlegit, setSavingLlegit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [gridCols, setGridCols] = useState(getGridCols());
  const [relatsDeLlibre, setRelatsDeLlibre] = useState([]);
  const [showCoverInput, setShowCoverInput] = useState(false);
  const [coverInputVal, setCoverInputVal] = useState("");
  const [showNouLlibre, setShowNouLlibre] = useState(false);
  const [notesVal, setNotesVal] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [autoResumLoading, setAutoResumLoading] = useState(false);
  const [autoResumPreview, setAutoResumPreview] = useState(null);
  const [showResumPreview, setShowResumPreview] = useState(false);
  const [autoFindLoading, setAutoFindLoading] = useState(false);
  // Revaluar preu
  const [showRevaluar, setShowRevaluar] = useState(false);
  const [nouPreu, setNouPreu] = useState("");
  const [savingPreu, setSavingPreu] = useState(false);
  // Prestat
  const [showPrestat, setShowPrestat] = useState(false);
  const [prestatNom, setPrestatNom] = useState("");
  const [showPreuMenu, setShowPreuMenu] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [showWishlistForm, setShowWishlistForm] = useState(false);
  const [wishlistForm, setWishlistForm] = useState({ titulo:"", autor:"", editorial:"", any_aprox:"", isbn:"", notes:"", prioritat:2 });
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [wishlistBuscarId, setWishlistBuscarId] = useState(null);

  useEffect(() => {
    const onResize = () => setGridCols(getGridCols());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadEdicions = useCallback(() => {
    setLoading(true); setError(null);
    supaFetch("edicion", "?select=edicion_id,titulo_edicion,titulo_original,ano_obra,editorial,coleccion,ano_edicion,idioma,isbn,tipo,id_estanteria,portada_url,portada_ok,portada_custom,portada_preferida,autor_id,obra_id,resum,traduccion,ilustrador,format,pagines,origen,preu_pagat,preu_mercat,preu_mercat_anterior,preu_mercat_data,preu_mercat_anterior_data,estat,llegit,valoracio,edicio_numero,llengua_original,notes_personals,data_lectura,wishlist,prestat_a,prestat_data&order=id_estanteria&limit=300")
      .then(data => {
        setEdicions(data);
        const groups = {};
        data.forEach(ed => {
          if (!groups[ed.obra_id]) groups[ed.obra_id] = [];
          groups[ed.obra_id].push(ed);
        });
        setObraGroups(groups);
        setFiltered(data);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => { loadEdicions(); }, [loadEdicions]);

  // Stats
  const stats = (() => {
    if (!edicions.length) return null;
    const llegits = edicions.filter(e => e.llegit === "si").length;
    const llegint = edicions.filter(e => e.llegit === "llegint").length;
    const valorats = edicions.filter(e => e.valoracio);
    const mitjaVal = valorats.length ? (valorats.reduce((s,e) => s + e.valoracio, 0) / valorats.length).toFixed(1) : "—";
    const ambPortada = edicions.filter(e => getCover(e) !== COVER_FALLBACK).length;
    const totalPagat = edicions.reduce((s,e) => s + (parseFloat(e.preu_pagat)||0), 0);
    const totalMercat = edicions.reduce((s,e) => s + (parseFloat(e.preu_mercat)||0), 0);
    const idiomes = {};
    edicions.forEach(e => { const k = e.idioma||"—"; idiomes[k] = (idiomes[k]||0)+1; });
    const idiomesBars = Object.entries(idiomes).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,val])=>({label,val}));
    const tipus = {};
    edicions.forEach(e => { const k = e.tipo||"—"; tipus[k] = (tipus[k]||0)+1; });
    const tipusBars = Object.entries(tipus).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,val])=>({label,val}));
    const decades = {};
    edicions.forEach(e => { if (e.ano_edicion) { const d = Math.floor(e.ano_edicion/10)*10; decades[d] = (decades[d]||0)+1; } });
    const decadesBars = Object.entries(decades).sort((a,b)=>a[0]-b[0]).map(([label,val])=>({label:`${label}s`,val}));
    const seccions = {};
    edicions.forEach(e => { const s = (e.id_estanteria||"").replace(/[-]?\d+[ab-z]?$/i,'').replace(/-$/,'') || "—"; seccions[s] = (seccions[s]||0)+1; });
    const seccBars = Object.entries(seccions).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([label,val])=>({label,val}));
    const perAny = {};
    edicions.filter(e => e.data_lectura).forEach(e => { const any = new Date(e.data_lectura).getFullYear(); perAny[any] = (perAny[any]||0)+1; });
    const lecturesBars = Object.entries(perAny).sort((a,b)=>a[0]-b[0]).map(([label,val])=>({label,val}));
    const topValor = [...edicions].filter(e => e.preu_mercat).sort((a,b) => (b.preu_mercat||0)-(a.preu_mercat||0)).slice(0,15);
    const prestats = edicions.filter(e => e.prestat_a);
    const totalEbooks = edicions.filter(e => isEbook(e)).length;
    const totalPaper = edicions.filter(e => !isEbook(e)).length;
    return { total: edicions.length, llegits, llegint, nollegits: edicions.length-llegits-llegint, mitjaVal, ambPortada, totalPagat, totalMercat, idiomesBars, tipusBars, decadesBars, seccBars, lecturesBars, topValor, prestats, totalEbooks, totalPaper };
  })();

  // Grid items
  const gridItems = (() => {
    let res = [...filtered];
    if (seccio !== "ALL") {
      res = res.filter(e => e.id_estanteria && e.id_estanteria.startsWith(seccio));
    }
    if (filtreExtra) {
      if (filtreExtra.camp === "tipo") res = res.filter(e => e.tipo === filtreExtra.valor);
      if (filtreExtra.camp === "decada") res = res.filter(e => e.ano_edicion && Math.floor(e.ano_edicion/10)*10 === filtreExtra.valor);
      if (filtreExtra.camp === "idioma") res = res.filter(e => e.idioma === filtreExtra.valor);
      if (filtreExtra.camp === "seccio") res = res.filter(e => (e.id_estanteria||"").replace(/[-]?\d+[ab-z]?$/i,'').replace(/-$/,'') === filtreExtra.valor);
      if (filtreExtra.camp === "llegit") res = res.filter(e => e.llegit === "si");
    }
    if (cerca.trim()) {
      const q = cerca.toLowerCase();
      res = res.filter(e => (e.titulo_edicion||"").toLowerCase().includes(q) || (e.titulo_original||"").toLowerCase().includes(q) || (e.editorial||"").toLowerCase().includes(q) || (e.traduccion||"").toLowerCase().includes(q));
    }
    const obraMap = {};
    res.forEach(e => {
      if (!obraMap[e.obra_id]) { obraMap[e.obra_id] = e; }
      else {
        if (e.portada_preferida && !obraMap[e.obra_id].portada_preferida) obraMap[e.obra_id] = e;
        else if (!obraMap[e.obra_id].portada_preferida && !e.portada_preferida) {
          if ((e.ano_edicion||9999) < (obraMap[e.obra_id].ano_edicion||9999)) obraMap[e.obra_id] = e;
        }
      }
    });
    return Object.values(obraMap);
  })();

  useEffect(() => {
    let res = [...edicions];
    if (cerca.trim()) {
      const q = cerca.toLowerCase();
      res = res.filter(e => (e.titulo_edicion||"").toLowerCase().includes(q) || (e.titulo_original||"").toLowerCase().includes(q) || (e.editorial||"").toLowerCase().includes(q) || (e.traduccion||"").toLowerCase().includes(q));
    }
    setFiltered(res);
  }, [cerca, edicions]);

  const loadWishlist = useCallback(() => {
    supaFetch("wishlist", "?select=*&order=prioritat,data_afegit")
      .then(data => setWishlistItems(data))
      .catch(() => {});
  }, []);
  useEffect(() => { if (view === "wishlist") loadWishlist(); }, [view, loadWishlist]);

  const handleAddWishlist = async () => {
    if (!wishlistForm.titulo.trim()) return;
    setSavingWishlist(true);
    const items = await supaFetch("wishlist", "?select=wishlist_id&order=wishlist_id.desc&limit=1").catch(() => []);
    const lastId = items[0]?.wishlist_id || "WSH000";
    const nextNum = parseInt(lastId.replace("WSH",""),10) + 1;
    const wishlist_id = `WSH${String(nextNum).padStart(3,"0")}`;
    await supaInsert("wishlist", {
      wishlist_id,
      titulo: wishlistForm.titulo.trim(),
      autor: wishlistForm.autor.trim() || null,
      editorial: wishlistForm.editorial.trim() || null,
      any_aprox: wishlistForm.any_aprox ? parseInt(wishlistForm.any_aprox) : null,
      isbn: wishlistForm.isbn.trim() || null,
      notes: wishlistForm.notes.trim() || null,
      prioritat: wishlistForm.prioritat,
      data_afegit: new Date().toISOString().split("T")[0],
    });
    setWishlistForm({ titulo:"", autor:"", editorial:"", any_aprox:"", isbn:"", notes:"", prioritat:2 });
    setShowWishlistForm(false);
    loadWishlist();
    setSavingWishlist(false);
  };

  const handleDeleteWishlist = async (wishlist_id) => {
    await supaDelete("wishlist", "wishlist_id", wishlist_id);
    setWishlistItems(prev => prev.filter(w => w.wishlist_id !== wishlist_id));
  };

  const buscarWishlist = (item, plataforma = 'iberlibro') => {
    const q = encodeURIComponent(`${item.titulo} ${item.autor||''} ${item.editorial||''}`);
    const qS = encodeURIComponent(`${item.titulo} ${item.autor||''}`);
    const urls = {
      iberlibro: `https://www.iberlibro.com/servlet/SearchResults?kn=${q}`,
      wallapop: `https://es.wallapop.com/search?keywords=${qS}&category_ids=12467`,
      vinted: `https://www.vinted.es/catalog?search_text=${qS}`,
      amazon: `https://www.amazon.es/s?k=${qS}&i=stripbooks`,
    };
    window.open(urls[plataforma], '_blank');
  };

  // Afegir obra de "Em falten" a wishlist
  const addFaltaToWishlist = async (obra) => {
    setSavingWishlist(true);
    const items = await supaFetch("wishlist", "?select=wishlist_id&order=wishlist_id.desc&limit=1").catch(() => []);
    const lastId = items[0]?.wishlist_id || "WSH000";
    const nextNum = parseInt(lastId.replace("WSH",""),10) + 1;
    const wishlist_id = `WSH${String(nextNum).padStart(3,"0")}`;
    await supaInsert("wishlist", {
      wishlist_id,
      titulo: obra.titulo_cast || obra.titulo_original,
      autor: null,
      obra_id: obra.obra_id,
      prioritat: 2,
      data_afegit: new Date().toISOString().split("T")[0],
    });
    loadWishlist();
    setSavingWishlist(false);
  };

  const loadFalten = useCallback((autorId) => {
    setLoading(true); setError(null);
    supaRpc("obres_que_falten", { p_autor_id: autorId })
      .then(data => { setFalten(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);
  useEffect(() => { if (view === "falten") loadFalten(autorFalta); }, [view, autorFalta, loadFalten]);

  const loadRelats = useCallback((autorId) => {
    setLoading(true); setError(null);
    Promise.all([
      supaFetch("relat", `?select=relat_id,titulo_original,ano_publicacio,tipus,premi,resum,univers_id&autor_id=eq.${autorId}&order=ano_publicacio&limit=200`),
      supaFetch("relat_edicion", "?select=relat_id,edicion_id,idioma&limit=700"),
    ]).then(([relatsData, reData]) => {
      setRelats(relatsData);
      const ediMap = {};
      edicions.forEach(e => { ediMap[e.edicion_id] = e.titulo_edicion; });
      const map = {};
      reData.forEach(re => {
        if (!map[re.relat_id]) map[re.relat_id] = [];
        map[re.relat_id].push({ ...re, titolLlibre: ediMap[re.edicion_id] || re.edicion_id });
      });
      setRelatEdicions(map);
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  }, [edicions]);
  useEffect(() => { if (view === "relats") loadRelats(autorRelats); }, [view, autorRelats, loadRelats]);

  const relatsFiltrats = relats.filter(r => {
    if (!relatSearch.trim()) return true;
    const q = relatSearch.toLowerCase();
    return (r.titulo_original||"").toLowerCase().includes(q) || (r.resum||"").toLowerCase().includes(q);
  });

  const prestatge = (() => {
    const sorted = [...edicions].sort((a,b) => (a.id_estanteria||"ZZZ").localeCompare(b.id_estanteria||"ZZZ", undefined, { numeric: true }));
    const sections = {};
    sorted.forEach(ed => {
      const s = ed.id_estanteria || "";
      const prefix = s.replace(/[-]?\d+[ab-z]?$/i,'').replace(/-$/,'');
      if (!sections[prefix]) sections[prefix] = [];
      sections[prefix].push(ed);
    });
    return sections;
  })();

  const openObra = (ed) => {
    scrollPosRef.current = window.scrollY; // Guardem posició actual
    const group = obraGroups[ed.obra_id] || [ed];
    setSelectedObra(group);
    setSelectedEdIdx(0);
    setShowExtra(false); setShowEdit(false); setDeleteConfirm(false);
    setShowCoverInput(false); setCoverInputVal("");
    setRelatsDeLlibre([]);
    setNotesVal(ed.notes_personals || "");
    setAutoResumPreview(null); setShowResumPreview(false);
    setShowRevaluar(false); setNouPreu("");
    setShowPrestat(false); setPrestatNom(ed.prestat_a || "");
    setView("detall");
    const edIds = group.map(e => e.edicion_id);
    supaFetch("relat_edicion", `?edicion_id=in.(${edIds.join(',')})&select=relat_id,edicion_id`)
      .then(reData => {
        if (!reData.length) return null;
        const relatIds = [...new Set(reData.map(r => r.relat_id))];
        return supaFetch("relat", `?relat_id=in.(${relatIds.join(',')})&select=relat_id,titulo_original,ano_publicacio,autor_id&order=ano_publicacio`);
      })
      .then(rData => { if (rData) setRelatsDeLlibre(rData); })
      .catch(() => {});
  };

  // Comprova autenticació abans d'una acció protegida
  const requireAuth = (action) => {
    if (autenticat) { action(); return; }
    pendingActionRef.current = action; // Guardem al ref (accés sincrò, sense closure issues)
    setPendingAction({ fn: action });
    setShowLoginModal(true);
    setLoginPassword("");
    setLoginError(false);
  };

  const handleLogin = () => {
    if (loginPassword === APP_PASSWORD) {
      setAutenticat(true);
      setShowLoginModal(false);
      setLoginError(false);
      // Usem el ref que sempre té el valor actual (no pateix del problema de closure)
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setPendingAction(null);
      if (action) action();
    } else {
      setLoginError(true);
    }
  };

  const navTo = (v) => {
    setView(v); setSelectedObra(null); setCerca(""); setRelatSearch("");
    setShowExtra(false); setShowEdit(false); setDeleteConfirm(false);
    setWishlistBuscarId(null);
    if (v !== "biblioteca") setFiltreExtra(null);
  };

  const activeEd = selectedObra ? selectedObra[selectedEdIdx] : null;
  const getLlegitIcon = (val) => LLEGIT_OPTIONS.find(o => o.val === val) || LLEGIT_OPTIONS[0];

  const updateEd = async (edicion_id, data) => {
    await supaUpdate("edicion", "edicion_id", edicion_id, data);
    setEdicions(prev => prev.map(e => e.edicion_id === edicion_id ? { ...e, ...data } : e));
    setSelectedObra(prev => prev ? prev.map(e => e.edicion_id === edicion_id ? { ...e, ...data } : e) : prev);
  };

  const handleLlegit = async (edicion_id, val) => {
    setSavingLlegit(true);
    await updateEd(edicion_id, { llegit: val });
    setSavingLlegit(false);
  };
  const handleValoració = async (edicion_id, val) => {
    const newVal = activeEd?.valoracio === val ? null : val;
    await updateEd(edicion_id, { valoracio: newVal });
  };
  const handleRejectCover = async (edicion_id) => {
    await updateEd(edicion_id, { portada_url: null, portada_ok: false, portada_custom: null });
  };
  const handleConfirmCover = async (edicion_id) => {
    const obra_id = selectedObra?.find(e => e.edicion_id === edicion_id)?.obra_id;
    if (!obra_id) return;
    for (const ed of (obraGroups[obra_id] || [])) {
      await supaUpdate("edicion", "edicion_id", ed.edicion_id, { portada_preferida: ed.edicion_id === edicion_id });
    }
    setEdicions(prev => prev.map(e =>
      (obraGroups[obra_id]||[]).some(g => g.edicion_id === e.edicion_id)
        ? { ...e, portada_preferida: e.edicion_id === edicion_id } : e
    ));
  };
  const handleSaveCustomCover = async (edicion_id, url) => {
    if (!url.trim()) return;
    await updateEd(edicion_id, { portada_custom: url.trim(), portada_ok: true });
    setShowCoverInput(false); setCoverInputVal("");
  };
  const handleAutoFindCover = async (ed) => {
    if (!ed.isbn) { buscarPortada(ed); return; }
    setAutoFindLoading(true);
    const url = await fetchGoogleBooksCover(ed.isbn);
    if (url) await updateEd(ed.edicion_id, { portada_custom: url, portada_ok: true });
    else buscarPortada(ed);
    setAutoFindLoading(false);
  };
  const handleAutoResum = async (ed) => {
    setAutoResumLoading(true);
    setShowResumPreview(false);
    const resum = await fetchGoogleBooksResum(ed.isbn, ed.titulo_original || ed.titulo_edicion);
    if (resum) { setAutoResumPreview(resum); setShowResumPreview(true); }
    setAutoResumLoading(false);
  };
  const handleAcceptResum = async (edicion_id, resum) => {
    await updateEd(edicion_id, { resum });
    setShowResumPreview(false); setAutoResumPreview(null);
  };

  // 💰 Revaluar preu mercat
  const handleRevaluar = async (edicion_id, nouPreuVal) => {
    if (!nouPreuVal || isNaN(parseFloat(nouPreuVal))) return;
    setSavingPreu(true);
    const avui = new Date().toISOString().split('T')[0];
    const preuActual = activeEd?.preu_mercat;
    await updateEd(edicion_id, {
      preu_mercat: parseFloat(nouPreuVal),
      preu_mercat_data: avui,
      preu_mercat_anterior: preuActual || null,
      preu_mercat_anterior_data: activeEd?.preu_mercat_data || null,
    });
    setShowRevaluar(false); setNouPreu("");
    setSavingPreu(false);
  };

  // 🔄 Prestat
  const handlePrestar = async (edicion_id, nom) => {
    const avui = new Date().toISOString().split('T')[0];
    await updateEd(edicion_id, { prestat_a: nom || null, prestat_data: nom ? avui : null });
    setShowPrestat(false);
  };

  const handleSaveNotes = async () => {
    if (!activeEd) return;
    setSavingNotes(true);
    await updateEd(activeEd.edicion_id, { notes_personals: notesVal });
    setSavingNotes(false);
  };

  const handleDelete = async () => {
    if (!activeEd) return;
    try { await supaDelete("relat_edicion", "edicion_id", activeEd.edicion_id); } catch {}
    try { await supaDelete("ejemplar", "edicion_id", activeEd.edicion_id); } catch {}
    await supaDelete("edicion", "edicion_id", activeEd.edicion_id);
    setEdicions(prev => prev.filter(e => e.edicion_id !== activeEd.edicion_id));
    navTo("biblioteca");
  };

  const exportCSV = () => {
    const headers = ['edicion_id','titulo_edicion','titulo_original','editorial','ano_edicion','idioma','isbn','tipo','id_estanteria','llegit','valoracio','preu_pagat','preu_mercat','data_lectura'];
    const rows = edicions.map(e => headers.map(h => {
      const v = e[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return v;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'biblioteca.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Filtrar des d'estadístiques
  const filtrarPerStat = (camp, valor) => {
    setFiltreExtra({ camp, valor });
    setSeccio("ALL"); setCerca("");
    setView("biblioteca");
  };

  return (
    <div style={S.app}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <svg width="210" height="50" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
            <circle cx="32" cy="46" r="22" fill="none" stroke="#aa2233" strokeWidth="3"/>
            <circle cx="32" cy="46" r="16" fill="#111118"/>
            <path d="M22 36 Q28 30 34 33" fill="none" stroke="#ffffff18" strokeWidth="2" strokeLinecap="round"/>
            <line x1="49" y1="63" x2="66" y2="80" stroke="#aa2233" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="72" cy="20" r="3.5" fill="#aa2233"/>
            <path d="M72 23.5 Q70 30 72 34 Q74 30 72 23.5" fill="#aa2233"/>
            <line x1="88" y1="15" x2="88" y2="85" stroke="#aa223344" strokeWidth="1"/>
            <text x="102" y="42" fontFamily="Georgia, serif" fontSize="26" fontWeight="bold" fill="#e8e0d0" letterSpacing="2">BIBLIOTECA</text>
            <text x="102" y="62" fontFamily="Georgia, serif" fontSize="14" fill="#aa2233" letterSpacing="8">de l'Anna</text>
            <line x1="102" y1="70" x2="395" y2="70" stroke="#aa223333" strokeWidth="0.5"/>
            <rect x="102" y="76" width="7" height="18" rx="1" fill="#1a0a0a"/>
            <rect x="102" y="76" width="2" height="18" fill="#aa2233"/>
            <rect x="111" y="79" width="5" height="15" rx="1" fill="#0a0a1a"/>
            <rect x="118" y="74" width="8" height="20" rx="1" fill="#150808"/>
            <rect x="118" y="74" width="2" height="20" fill="#882244"/>
            <rect x="128" y="78" width="6" height="16" rx="1" fill="#0a1008"/>
            <rect x="136" y="76" width="5" height="18" rx="1" fill="#aa2233"/>
            <line x1="102" y1="94" x2="145" y2="94" stroke="#aa2233" strokeWidth="1.5"/>
            <text x="355" y="85" fontFamily="Georgia, serif" fontSize="70" fontWeight="bold" fill="#aa223318">?</text>
          </svg>
          <div style={S.headerRight}>
            <button style={S.iconBtn} onClick={() => navTo("stats")}>📊</button>
            <button style={S.iconBtn} onClick={() => setShowAbout(true)}>ⓘ</button>
            {autenticat
              ? <button style={{...S.iconBtn, color: "#6ec88e", borderColor: "#6ec88e44"}} onClick={() => setAutenticat(false)} title="Tancar sessió">🔓</button>
              : <button style={{...S.iconBtn, color: "#555"}} onClick={() => { setPendingAction(null); setShowLoginModal(true); setLoginPassword(""); setLoginError(false); }} title="Iniciar sessió">🔐</button>
            }
          </div>
        </div>
        <div style={S.nav}>
          {[{id:"biblioteca",label:"Llibres"},{id:"prestatge",label:"Prestatge"},{id:"falten",label:"Falten"},{id:"wishlist",label:"♡ Wishlist"}].map(v => (
            <button key={v.id} style={S.navBtn(view===v.id||(view==="detall"&&v.id==="biblioteca"))} onClick={() => navTo(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* MODAL ABOUT */}
      {showAbout && (
        <div style={S.modalOverlay} onClick={() => setShowAbout(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>🔍 Sobre la Biblioteca de l'Anna</h2>
            <div style={S.modalRow}><span>Versió</span><span style={S.modalVal}>v{APP_VERSION}</span></div>
            <div style={S.modalDivider}/>
            {stats && <>
              <div style={S.modalRow}><span>📖 Total edicions</span><span style={S.modalVal}>{stats.total}</span></div>
              <div style={S.modalRow}><span>✅ Llegits</span><span style={S.modalVal}>{stats.llegits}</span></div>
              <div style={S.modalRow}><span>½ Llegint</span><span style={S.modalVal}>{stats.llegint}</span></div>
              <div style={S.modalRow}><span>○ Per llegir</span><span style={S.modalVal}>{stats.nollegits}</span></div>
              <div style={S.modalRow}><span>⭐ Valoració mitja</span><span style={S.modalVal}>{stats.mitjaVal}</span></div>
              <div style={S.modalRow}><span>🖼️ Amb portada</span><span style={S.modalVal}>{stats.ambPortada} / {stats.total}</span></div>
              <div style={S.modalDivider}/>
              {stats.totalPagat > 0 && <div style={S.modalRow}><span>💸 Total invertit</span><span style={S.modalVal}>{stats.totalPagat.toFixed(2)} €</span></div>}
              {stats.totalMercat > 0 && <div style={S.modalRow}><span>💰 Valor mercat</span><span style={S.modalVal}>{stats.totalMercat.toFixed(0)} €</span></div>}
              {stats.prestats?.length > 0 && <div style={S.modalRow}><span>🔄 Prestats</span><span style={S.modalVal}>{stats.prestats.length}</span></div>}
              {wishlistItems.length > 0 && <div style={S.modalRow}><span>♡ Wishlist</span><span style={S.modalVal}>{wishlistItems.length}</span></div>}
            </>}
            <div style={S.modalDivider}/>
            <div style={S.modalSmall}>Fet amb ❤️ · React + Supabase + Vercel</div>
            <button style={{...S.modalClose, color: "#aa223366", borderColor: "#aa223322"}} onClick={exportCSV}>📤 Exportar CSV</button>
            <button style={S.modalClose} onClick={() => setShowAbout(false)}>Tancar</button>
          </div>
        </div>
      )}

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div style={S.modalOverlay} onClick={() => setShowLoginModal(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>🔐 Accés d'edició</h2>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              Introdueix la contrasenya per modificar la biblioteca.
            </div>
            <input
              type="password"
              placeholder="Contrasenya..."
              value={loginPassword}
              onChange={e => { setLoginPassword(e.target.value); setLoginError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
              style={{ ...S.input, marginBottom: 8 }}
            />
            {loginError && (
              <div style={{ color: "#c44", fontSize: 12, marginBottom: 8 }}>⚠ Contrasenya incorrecta</div>
            )}
            <button style={S.formBtn} onClick={handleLogin}>✓ Accedir</button>
            <button style={S.modalClose} onClick={() => setShowLoginModal(false)}>Cancel·lar</button>
            <div style={{ fontSize: 10, color: "#333", textAlign: "center", marginTop: 12 }}>
              La biblioteca es pot consultar sense contrasenya
            </div>
          </div>
        </div>
      )}

      {/* FORMULARI NOU LLIBRE */}
      {showNouLlibre && (
        <FormNouLlibre onClose={() => setShowNouLlibre(false)} onSaved={() => { setShowNouLlibre(false); loadEdicions(); }} />
      )}

      {/* BIBLIOTECA */}
      {view === "biblioteca" && <>
        <div style={S.searchWrap}>
          <input style={S.input} placeholder="Cerca per títol, editorial, traductor..." value={cerca} onChange={e => setCerca(e.target.value)} />
        </div>
        <div style={S.pills}>
          {SECCIONS.map(s => <button key={s.id} style={S.pill(seccio===s.id)} onClick={() => { setSeccio(s.id); setFiltreExtra(null); }}>{s.label}</button>)}
        </div>
        <div style={{ ...S.statsBar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {gridItems.length} obres
            {filtreExtra && <span style={{ color: "#aa2233", marginLeft: 8 }}>· {filtreExtra.valor} <button onClick={() => setFiltreExtra(null)} style={{ background: "none", border: "none", color: "#c44", cursor: "pointer", fontSize: 10 }}>✕</button></span>}
          </span>
          <div style={S.viewToggle}>
            <button style={S.viewBtn(!listView)} onClick={() => setListView(false)}>▦</button>
            <button style={S.viewBtn(listView)} onClick={() => setListView(true)}>≡</button>
          </div>
        </div>
        {loading ? <div style={S.loader}>CARREGANT · · ·</div>
          : error ? <div style={S.errMsg}>{error}</div>
          : gridItems.length === 0 ? <div style={S.empty}>Cap resultat</div>
          : listView
            ? gridItems.map(ed => {
                const numEds = (obraGroups[ed.obra_id]||[]).length;
                const llegit = getLlegitIcon(ed.llegit);
                return (
                  <div key={ed.obra_id} style={S.listItem} onClick={() => openObra(ed)}>
                    <img src={getCover(ed)} alt="" style={S.listImg} onError={e=>{e.target.src=COVER_FALLBACK;}} />
                    <div style={S.listInfo}>
                      <div style={S.listTitle}>{ed.titulo_edicion||ed.titulo_original}</div>
                      <div style={S.listMeta}>{ed.editorial}{ed.ano_edicion && ` · ${ed.ano_edicion}`}{ed.idioma && ` · ${ed.idioma}`}{numEds > 1 && ` · ${numEds} ed.`}{ed.prestat_a && ` · 🔄 ${ed.prestat_a}`}</div>
                    </div>
                    <div style={S.listShelf}>{ed.id_estanteria}</div>
                    <div style={{...S.listLlegit, color: llegit.color}}>{ed.llegit==="si"?"✓":ed.llegit==="llegint"?"½":"○"}</div>
                  </div>
                );
              })
            : <div style={S.grid(gridCols)}>
                {gridItems.map(ed => {
                  const numEds = (obraGroups[ed.obra_id]||[]).length;
                  return (
                    <div key={ed.obra_id} style={S.card} onClick={() => openObra(ed)}>
                      <img src={getCover(ed)} alt={ed.titulo_edicion} style={S.cardImg} onError={e=>{e.target.src=COVER_FALLBACK;}} />
                      <div style={S.cardLlegit}>{ed.llegit==="si"?"✓":ed.llegit==="llegint"?"½":""}</div>
                      {numEds > 1 && <div style={S.multiDot}>{numEds}</div>}
                      {ed.prestat_a && <div style={{ position:"absolute", top:5, left:5, fontSize:10, background:"rgba(0,0,0,0.7)", color:"#aa2233", padding:"1px 4px", borderRadius:2 }}>🔄</div>}
                      {isEbook(ed) && <div style={{ position:"absolute", bottom:24, right:4, fontSize:9, background:"rgba(0,30,60,0.85)", color:"#aa2233", padding:"1px 4px", borderRadius:2 }}>📱</div>}
                      <div style={S.cardOverlay}>
                        <div style={S.cardTitle}>{ed.titulo_edicion||ed.titulo_original}</div>
                        <div style={S.cardShelf}>{ed.id_estanteria}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
        }
        <button style={S.addBtn} onClick={() => requireAuth(() => setShowNouLlibre(true))}>+</button>
      </>}

      {/* DETALL */}
      {view === "detall" && selectedObra && activeEd && (
        <div style={S.detall}>
          <button style={S.backBtn} onClick={() => { 
            setView("biblioteca"); 
            setSelectedObra(null); 
            setTimeout(() => window.scrollTo(0, scrollPosRef.current), 50);
          }}>← Tornar</button>

          {selectedObra.length > 1 && (
            <div style={S.edTabs}>
              {selectedObra.map((ed, i) => (
                <button key={ed.edicion_id} style={S.edTab(selectedEdIdx===i)}
                  onClick={() => { setSelectedEdIdx(i); setShowExtra(false); setShowEdit(false); setNotesVal(ed.notes_personals||""); setShowRevaluar(false); setShowPrestat(false); }}>
                  {ed.editorial} {ed.ano_edicion||""}
                </button>
              ))}
            </div>
          )}

          {/* PORTADA */}
          <div style={S.detallImgWrap}>
            <img src={getCover(activeEd)} alt={activeEd.titulo_edicion} style={S.detallImg} onError={e=>{e.target.src=COVER_FALLBACK;}} />
          </div>
          <div style={S.coverBtns}>
            {getCover(activeEd) !== COVER_FALLBACK && <button style={S.coverBtn("#6ec88e")} onClick={() => handleConfirmCover(activeEd.edicion_id)}>✓ Correcta</button>}
            {getCover(activeEd) !== COVER_FALLBACK && <button style={S.coverBtn("#c44")} onClick={() => handleRejectCover(activeEd.edicion_id)}>✕ Incorrecta</button>}
            <button style={S.coverBtn("#8899cc")} onClick={() => handleAutoFindCover(activeEd)} disabled={autoFindLoading}>{autoFindLoading ? "⏳" : "🔎 Auto"}</button>
            <button style={S.coverBtn("#7799aa")} onClick={() => buscarPortada(activeEd)}>🌐 Google</button>
            <button style={S.coverBtn("#aa2233")} onClick={() => setShowCoverInput(!showCoverInput)}>🔗 URL</button>
          </div>
          {showCoverInput && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input style={{...S.input, flex: 1, padding: "6px 10px", fontSize: 11}} placeholder="Enganxa URL..." value={coverInputVal} onChange={e => setCoverInputVal(e.target.value)} />
              <button style={{ padding: "6px 12px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", borderRadius: 2 }} onClick={() => handleSaveCustomCover(activeEd.edicion_id, coverInputVal)}>✓</button>
            </div>
          )}

          {/* TÍTOL */}
          <div style={S.detallTitle}>{activeEd.titulo_edicion||activeEd.titulo_original}</div>
          {activeEd.titulo_original && activeEd.titulo_original !== activeEd.titulo_edicion && <div style={S.detallOrig}>{activeEd.titulo_original}</div>}
          {activeEd.prestat_a && <div style={{ background: "#aa223311", border: "1px solid #aa223333", padding: "6px 12px", borderRadius: 2, fontSize: 11, color: "#aa2233", marginBottom: 10 }}>🔄 Prestat a <strong>{activeEd.prestat_a}</strong>{activeEd.prestat_data && ` · desde ${new Date(activeEd.prestat_data).toLocaleDateString('ca-ES')}`}</div>}

          {/* RESUM */}
          {activeEd.resum && <div style={S.resum}>{activeEd.resum}</div>}
          {!showResumPreview && (
            <button style={{ background: "none", border: "1px solid #aa223322", color: "#aa223355", cursor: "pointer", fontSize: 10, padding: "3px 10px", borderRadius: 2, fontFamily: "Georgia, serif", marginBottom: 12 }}
              onClick={() => handleAutoResum(activeEd)} disabled={autoResumLoading}>
              {autoResumLoading ? "⏳ Buscant..." : "✨ " + (activeEd.resum ? "Actualitzar resum" : "Generar resum")}
            </button>
          )}
          {showResumPreview && autoResumPreview && (
            <div style={{ background: "#0d0d12", border: "1px solid #aa223333", padding: 14, borderRadius: 4, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#aa223366", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>✨ Resum suggerit</div>
              <div style={{ fontSize: 12, color: "#bbb", lineHeight: 1.6, marginBottom: 10 }}>{autoResumPreview}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, padding: "6px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }} onClick={() => handleAcceptResum(activeEd.edicion_id, autoResumPreview)}>✓ Acceptar</button>
                <button style={{ flex: 1, padding: "6px", background: "none", border: "1px solid #2a2a35", color: "#555", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }} onClick={() => setShowResumPreview(false)}>✕ Descartar</button>
              </div>
            </div>
          )}

          {/* LLEGIT + VALORACIÓ */}
          <div style={S.llegitRow}>
            {LLEGIT_OPTIONS.map(opt => (
              <button key={opt.val} style={S.llegitBtn(activeEd.llegit===opt.val, opt.color)} onClick={() => requireAuth(() => handleLlegit(activeEd.edicion_id, opt.val))} disabled={savingLlegit}>{opt.icon} {opt.label}</button>
            ))}
            <div style={S.starsRow}>
              {STARS.map(n => <span key={n} style={S.star(activeEd.valoracio >= n)} onClick={() => requireAuth(() => handleValoració(activeEd.edicion_id, n))}>★</span>)}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            {activeEd.tipo && <span style={S.badge}>{activeEd.tipo}</span>}
            {activeEd.idioma && <span style={S.badge}>{activeEd.idioma}</span>}
            {isEbook(activeEd) 
              ? <span style={{...S.badge, color: "#aa2233", borderColor: "#aa223344"}}>📱 eBook</span>
              : activeEd.id_estanteria && <span style={S.badge}>📚 {activeEd.id_estanteria}</span>
            }
            {activeEd.data_lectura && <span style={S.badge}>📖 {new Date(activeEd.data_lectura).toLocaleDateString('ca-ES',{year:'numeric',month:'short'})}</span>}
          </div>

          {activeEd.editorial && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Editorial </span>{activeEd.editorial}{activeEd.coleccion && ` · ${activeEd.coleccion}`}</div>}
          {(activeEd.ano_edicion||activeEd.ano_obra) && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Edició </span>{activeEd.ano_edicion||"—"}{activeEd.ano_obra && ` · Obra: ${activeEd.ano_obra}`}</div>}

          {/* PREU MERCAT + REVALUAR */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "10px 14px", background: "#0d0d12", borderRadius: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: "#aa223366", textTransform: "uppercase", letterSpacing: 1 }}>Valor mercat</div>
              <div style={{ fontSize: 18, color: "#aa2233", fontWeight: "bold" }}>{activeEd.preu_mercat ? `${activeEd.preu_mercat}€` : "—"}</div>
              {activeEd.preu_mercat_anterior && (
                <div style={{ fontSize: 10, color: "#555" }}>
                  Anterior: {activeEd.preu_mercat_anterior}€
                  {activeEd.preu_mercat_anterior_data && ` · ${new Date(activeEd.preu_mercat_anterior_data).toLocaleDateString('ca-ES',{year:'numeric',month:'short'})}`}
                </div>
              )}
              {activeEd.preu_mercat_data && <div style={{ fontSize: 10, color: "#444" }}>Actualitzat: {new Date(activeEd.preu_mercat_data).toLocaleDateString('ca-ES',{year:'numeric',month:'short'})}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button style={{ background: "none", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", fontSize: 10, padding: "4px 8px", borderRadius: 2, fontFamily: "Georgia, serif" }} onClick={() => requireAuth(() => setShowRevaluar(!showRevaluar))}>💰 Revaluar</button>
              <button style={{ background: "none", border: "1px solid #7799aa44", color: "#7799aa", cursor: "pointer", fontSize: 10, padding: "4px 8px", borderRadius: 2, fontFamily: "Georgia, serif" }} onClick={() => setShowPreuMenu(!showPreuMenu)}>🔍 Buscar preu</button>
            </div>
          </div>
          {showPreuMenu && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { label: "📚 Iberlibro", plat: "iberlibro" },
                { label: "🏷️ Wallapop", plat: "wallapop" },
                { label: "👗 Vinted", plat: "vinted" },
                { label: "📦 Amazon", plat: "amazon" },
              ].map(p => (
                <button key={p.plat} style={{ padding: "5px 10px", background: "#111118", border: "1px solid #2a2a35", color: "#888", cursor: "pointer", fontSize: 10, borderRadius: 2, fontFamily: "Georgia, serif" }}
                  onClick={() => { buscarPreu(activeEd, p.plat); setShowPreuMenu(false); }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          {showRevaluar && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input style={{...S.input, flex: 1, padding: "6px 10px", fontSize: 12}} type="number" placeholder="Nou preu (€)" value={nouPreu} onChange={e => setNouPreu(e.target.value)} />
              <button style={{ padding: "6px 12px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", borderRadius: 2, fontFamily: "Georgia, serif" }} onClick={() => handleRevaluar(activeEd.edicion_id, nouPreu)} disabled={savingPreu}>✓</button>
              <button style={{ padding: "6px 8px", background: "none", border: "1px solid #2a2a35", color: "#555", cursor: "pointer", borderRadius: 2 }} onClick={() => setShowRevaluar(false)}>✕</button>
            </div>
          )}

          {/* PRESTAT */}
          <div style={{ marginBottom: 12 }}>
            <button style={{ background: "none", border: `1px solid ${activeEd.prestat_a ? "#aa223355" : "#2a2a35"}`, color: activeEd.prestat_a ? "#aa2233" : "#555", cursor: "pointer", fontSize: 10, padding: "4px 10px", borderRadius: 2, fontFamily: "Georgia, serif" }}
              onClick={() => setShowPrestat(!showPrestat)}>
              🔄 {activeEd.prestat_a ? `Prestat a ${activeEd.prestat_a}` : "Marcar com a prestat"}
            </button>
            {activeEd.prestat_a && (
              <button style={{ background: "none", border: "none", color: "#c44", cursor: "pointer", fontSize: 10, marginLeft: 8, fontFamily: "Georgia, serif" }} onClick={() => handlePrestar(activeEd.edicion_id, null)}>✕ Retornat</button>
            )}
          </div>
          {showPrestat && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <input style={{...S.input, flex: 1, padding: "6px 10px", fontSize: 12}} placeholder="Nom de la persona..." value={prestatNom} onChange={e => setPrestatNom(e.target.value)} />
              <button style={{ padding: "6px 12px", background: "#aa223322", border: "1px solid #aa223344", color: "#aa2233", cursor: "pointer", borderRadius: 2 }} onClick={() => handlePrestar(activeEd.edicion_id, prestatNom)}>✓</button>
            </div>
          )}

          {/* EDITAR CAMPS */}
          <button style={{ ...S.iconBtn, width: "100%", marginBottom: 12, fontSize: 11 }} onClick={() => requireAuth(() => setShowEdit(!showEdit))}>
            {showEdit ? "▲ Tancar edició" : "✎ Editar camps"}
          </button>
          {showEdit && (
            <div style={{ background: "#0d0d12", padding: 14, borderRadius: 4, marginBottom: 12 }}>
              <EditField label="Títol edició" value={activeEd.titulo_edicion} onSave={v => updateEd(activeEd.edicion_id, { titulo_edicion: v })} />
              <EditField label="Títol original" value={activeEd.titulo_original} onSave={v => updateEd(activeEd.edicion_id, { titulo_original: v })} />
              <EditField label="Editorial" value={activeEd.editorial} onSave={v => updateEd(activeEd.edicion_id, { editorial: v })} />
              <EditField label="Col·lecció" value={activeEd.coleccion} onSave={v => updateEd(activeEd.edicion_id, { coleccion: v })} />
              <EditField label="Any edició" value={activeEd.ano_edicion?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { ano_edicion: parseInt(v)||null })} />
              <EditField label="ISBN" value={activeEd.isbn} onSave={v => updateEd(activeEd.edicion_id, { isbn: v })} />
              <EditField label="Estanteria" value={activeEd.id_estanteria} onSave={v => updateEd(activeEd.edicion_id, { id_estanteria: v.toUpperCase() })} />
              <EditField label="Traductor" value={activeEd.traduccion} onSave={v => updateEd(activeEd.edicion_id, { traduccion: v })} />
              <EditField label="Pàgines" value={activeEd.pagines?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { pagines: parseInt(v)||null })} />
              <EditField label="Preu pagat (€)" value={activeEd.preu_pagat?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { preu_pagat: v === "" ? null : parseFloat(v) })} />
              <EditField label="Data lectura (AAAA-MM-DD)" value={activeEd.data_lectura} onSave={v => updateEd(activeEd.edicion_id, { data_lectura: v||null })} />
              <EditField label="Resum" value={activeEd.resum} multiline onSave={v => updateEd(activeEd.edicion_id, { resum: v })} />
            </div>
          )}

          {/* MÉS INFORMACIÓ */}
          <button style={{ background: "none", border: "1px solid #2a2a35", color: "#666", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", padding: "6px 14px", marginBottom: 12, borderRadius: 2, width: "100%" }} onClick={() => setShowExtra(!showExtra)}>
            {showExtra ? "▲ Menys" : "▼ Més informació"}
          </button>
          {showExtra && (
            <div style={{ marginBottom: 12, padding: "12px 14px", background: "#0d0d12", borderRadius: 2 }}>
              {activeEd.traduccion && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Traducció </span>{activeEd.traduccion}</div>}
              {activeEd.isbn && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>ISBN </span>{activeEd.isbn}</div>}
              {activeEd.pagines && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Pàgines </span>{activeEd.pagines}</div>}
              {activeEd.origen && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Origen </span>{activeEd.origen}</div>}
              {activeEd.preu_pagat && <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Preu pagat </span>{activeEd.preu_pagat} €</div>}
              <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}><span style={{ color: "#aa223366", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>ID </span>{activeEd.edicion_id}</div>
            </div>
          )}

          {/* NOTES */}
          <div style={S.sectionTitle}>📝 Notes personals</div>
          <textarea style={S.notesArea} value={notesVal} onChange={e => setNotesVal(e.target.value)} placeholder="Les teves impressions, on el vas comprar..." />
          <button style={{ ...S.iconBtn, marginTop: 6, fontSize: 11 }} onClick={() => requireAuth(handleSaveNotes)} disabled={savingNotes}>{savingNotes ? "Desant..." : "💾 Desar notes"}</button>

          {/* RELATS */}
          {relatsDeLlibre.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid #1a1a22", paddingTop: 16 }}>
              <div style={S.sectionTitle}>📖 Relats en aquest recull ({relatsDeLlibre.length})</div>
              {relatsDeLlibre.map(r => (
                <div key={r.relat_id} style={{ padding: "6px 0", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => { setAutorRelats(r.autor_id); setView("relats"); setRelatSearch(r.titulo_original); }}>
                  <span style={{ fontSize: 12, color: "#bbb", fontStyle: "italic" }}>{r.titulo_original}</span>
                  <span style={{ fontSize: 10, color: "#555" }}>{r.ano_publicacio}</span>
                </div>
              ))}
            </div>
          )}

          {/* ELIMINAR */}
          {!deleteConfirm
            ? <button style={S.deleteBtn} onClick={() => requireAuth(() => setDeleteConfirm(true))}>🗑 Eliminar aquest llibre</button>
            : <div style={{ marginTop: 24, padding: 14, background: "#1a0a0a", border: "1px solid #c4444433", borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: "#c44", marginBottom: 10 }}>Segur que vols eliminar <strong>{activeEd.titulo_edicion}</strong>?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "8px", background: "#c4222222", border: "1px solid #c44", color: "#c44", cursor: "pointer", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 12 }} onClick={handleDelete}>Eliminar</button>
                  <button style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #2a2a35", color: "#666", cursor: "pointer", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 12 }} onClick={() => setDeleteConfirm(false)}>Cancel·lar</button>
                </div>
              </div>
          }
        </div>
      )}

      {/* PRESTATGE */}
      {view === "prestatge" && <>
        <div style={S.statsBar}>{edicions.length} llibres per prestatge</div>
        {loading ? <div style={S.loader}>CARREGANT · · ·</div>
          : Object.entries(prestatge).map(([prefix, eds]) => (
            <div key={prefix}>
              <div style={S.prestSection}><div style={S.prestSectionTitle}>── {prefix} ({eds.length})</div></div>
              {eds.map(ed => (
                <div key={ed.edicion_id} style={S.prestItem} onClick={() => openObra(ed)}>
                  <div style={S.prestShelf}>{ed.id_estanteria}</div>
                  <div style={S.prestTitle}>{ed.titulo_edicion||ed.titulo_original}{ed.prestat_a && ` 🔄`}</div>
                  <div style={{...S.prestLlegit, color: getLlegitIcon(ed.llegit).color}}>{ed.llegit==="si"?"✓":ed.llegit==="llegint"?"½":"○"}</div>
                </div>
              ))}
            </div>
          ))
        }
      </>}

      {/* EM FALTEN */}
      {view === "falten" && <>
        <div style={S.selectorRow}>
          {AUTORS_FALTEN.map(a => <button key={a.id} style={S.selBtn(autorFalta===a.id)} onClick={() => setAutorFalta(a.id)}>{a.label}</button>)}
        </div>
        {loading ? <div style={S.loader}>CARREGANT · · ·</div>
          : error ? <div style={S.errMsg}>{error}</div>
          : <>
              <div style={S.statsBar}>{falten.length} obres que no tens</div>
              {falten.length === 0 ? <div style={S.empty}>Tens tota l'obra! 🎉</div>
                : <div style={S.faltenList}>
                    {falten.map(o => (
                      <div key={o.obra_id} style={S.faltenItem}>
                        <div style={{ flex: 1 }}>
                          <div style={S.faltenTitle}>{o.titulo_original}</div>
                          {o.titulo_cast && <div style={S.faltenCast}>{o.titulo_cast}</div>}
                          <div style={S.faltenYear}>{o.ano_obra}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                          <span style={S.tipusBadge}>{o.tipo}</span>
                          <button style={{ background:"none", border:"1px solid #aa223333", color:"#aa223366", cursor:"pointer", fontSize:9, padding:"2px 6px", borderRadius:2, fontFamily:"Georgia, serif" }}
                            onClick={() => addFaltaToWishlist(o)}>♡ Wishlist</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </>
        }
      </>}

      {/* RELATS */}
      {view === "relats" && <>
        <div style={S.selectorRow}>
          {AUTORS_RELATS.map(a => <button key={a.id} style={S.selBtn(autorRelats===a.id)} onClick={() => setAutorRelats(a.id)}>{a.label}</button>)}
        </div>
        <div style={S.searchWrap}>
          <input style={S.input} placeholder="Cerca per títol o resum..." value={relatSearch} onChange={e => setRelatSearch(e.target.value)} />
        </div>
        <div style={S.statsBar}>{relatsFiltrats.length} relats · {AUTORS_RELATS.find(a=>a.id===autorRelats)?.label}</div>
        {loading ? <div style={S.loader}>CARREGANT · · ·</div>
          : error ? <div style={S.errMsg}>{error}</div>
          : relatsFiltrats.map(r => {
              const llibres = relatEdicions[r.relat_id] || [];
              return (
                <div key={r.relat_id} style={S.relatItem}>
                  <div style={S.relatTitle}>
                    {r.titulo_original}
                    {r.univers_id && UNIVERS_NOMS[r.univers_id] && <span style={S.univers}>{UNIVERS_NOMS[r.univers_id]}</span>}
                  </div>
                  <div style={S.relatMeta}>{r.ano_publicacio||"—"}{r.tipus && ` · ${r.tipus}`}{r.premi && ` · 🏆 ${r.premi}`}</div>
                  {r.resum && <div style={S.relatResum}>{r.resum}</div>}
                  {llibres.length === 0
                    ? <span style={S.relatNoDisp}>No disponible físicament</span>
                    : <div style={S.relatBooks}>
                        {[...new Map(llibres.map(l=>[l.edicion_id,l])).values()].map(l => (
                          <span key={l.edicion_id} style={{...S.relatBook, cursor: "pointer"}}
                            onClick={() => { const ed = edicions.find(e => e.edicion_id === l.edicion_id); if (ed) openObra(ed); }}>
                            📖 {l.titolLlibre}{l.idioma==='anglès'?' 🇬🇧':''}
                          </span>
                        ))}
                      </div>
                  }
                </div>
              );
            })
        }
      </>}

      {/* WISHLIST */}
      {view === "wishlist" && (
        <div>
          <div style={{ ...S.statsBar, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span>♡ {wishlistItems.length} llibres desitjats</span>
            <button style={{ background:"#aa223322", border:"1px solid #aa223344", color:"#aa2233", cursor:"pointer", fontSize:11, padding:"3px 10px", borderRadius:2, fontFamily:"Georgia, serif" }}
              onClick={() => requireAuth(() => setShowWishlistForm(!showWishlistForm))}>+ Afegir</button>
          </div>

          {/* Formulari afegir */}
          {showWishlistForm && (
            <div style={{ padding:"14px 16px", background:"#0d0d12", borderBottom:"1px solid #1a1a22" }}>
              <input style={{...S.input, marginBottom:8}} placeholder="Títol *" value={wishlistForm.titulo} onChange={e => setWishlistForm(f=>({...f,titulo:e.target.value}))} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <input style={S.input} placeholder="Autor" value={wishlistForm.autor} onChange={e => setWishlistForm(f=>({...f,autor:e.target.value}))} />
                <input style={S.input} placeholder="Editorial" value={wishlistForm.editorial} onChange={e => setWishlistForm(f=>({...f,editorial:e.target.value}))} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <input style={S.input} placeholder="Any aprox." type="number" value={wishlistForm.any_aprox} onChange={e => setWishlistForm(f=>({...f,any_aprox:e.target.value}))} />
                <input style={S.input} placeholder="ISBN" value={wishlistForm.isbn} onChange={e => setWishlistForm(f=>({...f,isbn:e.target.value}))} />
              </div>
              <input style={{...S.input, marginBottom:8}} placeholder="Notes (edició, col·lecció...)" value={wishlistForm.notes} onChange={e => setWishlistForm(f=>({...f,notes:e.target.value}))} />
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {[{v:1,label:"🔴 Alta"},{v:2,label:"🟡 Normal"},{v:3,label:"🟢 Baixa"}].map(p => (
                  <button key={p.v} style={{ flex:1, padding:"5px", background:wishlistForm.prioritat===p.v?"#aa223322":"transparent", border:`1px solid ${wishlistForm.prioritat===p.v?"#aa223344":"#2a2a35"}`, color:wishlistForm.prioritat===p.v?"#aa2233":"#555", cursor:"pointer", fontSize:10, borderRadius:2, fontFamily:"Georgia, serif" }}
                    onClick={() => setWishlistForm(f=>({...f,prioritat:p.v}))}>{p.label}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ flex:1, padding:"8px", background:"#aa223322", border:"1px solid #aa223344", color:"#aa2233", cursor:"pointer", borderRadius:2, fontFamily:"Georgia, serif", fontSize:12 }}
                  onClick={handleAddWishlist} disabled={savingWishlist}>{savingWishlist?"Desant...":"✓ Afegir a la wishlist"}</button>
                <button style={{ padding:"8px 12px", background:"none", border:"1px solid #2a2a35", color:"#555", cursor:"pointer", borderRadius:2 }}
                  onClick={() => setShowWishlistForm(false)}>✕</button>
              </div>
            </div>
          )}

          {/* Llista wishlist */}
          {wishlistItems.length === 0
            ? <div style={S.empty}>Cap llibre a la wishlist 🙂</div>
            : wishlistItems.map(w => {
                const prioritatColor = w.prioritat===1?"#c44":w.prioritat===3?"#6ec88e":"#aa2233";
                const showBuscar = wishlistBuscarId === w.wishlist_id;
                return (
                  <div key={w.wishlist_id} style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a22" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:"#e8e0d0", marginBottom:2 }}>{w.titulo}</div>
                        {w.autor && <div style={{ fontSize:11, color:"#aa223388", marginBottom:2 }}>{w.autor}{w.editorial && ` · ${w.editorial}`}{w.any_aprox && ` · ${w.any_aprox}`}</div>}
                        {w.notes && <div style={{ fontSize:11, color:"#555", fontStyle:"italic" }}>{w.notes}</div>}
                        <div style={{ fontSize:9, color:"#333", marginTop:4 }}>Afegit: {w.data_afegit}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end", flexShrink:0 }}>
                        <span style={{ fontSize:9, color:prioritatColor, border:`1px solid ${prioritatColor}44`, padding:"1px 6px", borderRadius:2 }}>
                          {w.prioritat===1?"🔴 Alta":w.prioritat===3?"🟢 Baixa":"🟡 Normal"}
                        </span>
                        <button style={{ background:"none", border:"1px solid #8899cc33", color:"#8899cc", cursor:"pointer", fontSize:9, padding:"2px 6px", borderRadius:2, fontFamily:"Georgia, serif" }}
                          onClick={() => setWishlistBuscarId(showBuscar ? null : w.wishlist_id)}>🔍 Buscar</button>
                        <button style={{ background:"none", border:"none", color:"#c44", cursor:"pointer", fontSize:10 }}
                          onClick={() => handleDeleteWishlist(w.wishlist_id)}>🗑</button>
                      </div>
                    </div>
                    {showBuscar && (
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
                        {[
                          {label:"📚 Iberlibro", plat:"iberlibro"},
                          {label:"🏷️ Wallapop", plat:"wallapop"},
                          {label:"👗 Vinted", plat:"vinted"},
                          {label:"📦 Amazon", plat:"amazon"},
                        ].map(p => (
                          <button key={p.plat} style={{ padding:"4px 8px", background:"#111118", border:"1px solid #2a2a35", color:"#888", cursor:"pointer", fontSize:10, borderRadius:2, fontFamily:"Georgia, serif" }}
                            onClick={() => buscarWishlist(w, p.plat)}>{p.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ESTADÍSTIQUES */}
      {view === "stats" && (
        <div style={S.statsPage}>
          <h2 style={S.statsTitle}>📊 Estadístiques</h2>
          {!stats ? <div style={S.loader}>CARREGANT · · ·</div> : <>
            <div style={S.statGrid}>
              <div style={S.statCard} onClick={() => filtrarPerStat("llegit","si")}><div style={S.statNum}>{stats.total}</div><div style={S.statLabel}>Total edicions</div></div>
              <div style={S.statCard} onClick={() => filtrarPerStat("llegit","si")}><div style={S.statNum}>{stats.llegits}</div><div style={S.statLabel}>✅ Llegits</div></div>
              <div style={S.statCard}><div style={S.statNum}>{stats.llegint}</div><div style={S.statLabel}>½ Llegint ara</div></div>
              <div style={S.statCard}><div style={S.statNum}>{stats.nollegits}</div><div style={S.statLabel}>○ Per llegir</div></div>
              <div style={S.statCard}><div style={S.statNum}>{stats.mitjaVal}</div><div style={S.statLabel}>⭐ Valoració mitja</div></div>
              <div style={S.statCard}><div style={S.statNum}>{stats.ambPortada}</div><div style={S.statLabel}>🖼️ Amb portada</div></div>
              {stats.totalPagat > 0 && <div style={S.statCard}><div style={S.statNum}>{stats.totalPagat.toFixed(0)}€</div><div style={S.statLabel}>💸 Invertit</div></div>}
              {stats.totalMercat > 0 && <div style={S.statCard}><div style={S.statNum}>{stats.totalMercat.toFixed(0)}€</div><div style={S.statLabel}>💰 Valor mercat</div></div>}
              {stats.totalEbooks > 0 && <div style={{...S.statCard, border: "1px solid #aa223333"}} onClick={() => filtrarPerStat("format","ebook")}><div style={{...S.statNum, color:"#aa2233"}}>{stats.totalEbooks}</div><div style={S.statLabel}>📱 eBooks</div></div>}
            </div>

            {/* Portades dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
              {[
                { label: "✅ Amb portada", val: stats.ambPortada, color: "#6ec88e" },
                { label: "❌ Sense portada", val: stats.total - stats.ambPortada, color: "#c44" },
                { label: "📌 Customs", val: edicions.filter(e => e.portada_custom).length, color: "#aa2233" },
              ].map(s => (
                <div key={s.label} style={{ background: "#111118", border: `1px solid ${s.color}33`, borderRadius: 4, padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, color: s.color, fontWeight: "bold" }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Barres clicables */}
            <BarChart data={stats.seccBars} title="Per secció" onClickBar={d => filtrarPerStat("seccio", d.label)} />
            <BarChart data={stats.tipusBars} title="Per tipus" onClickBar={d => filtrarPerStat("tipo", d.label)} />
            <BarChart data={stats.idiomesBars} title="Per idioma" onClickBar={d => filtrarPerStat("idioma", d.label)} />
            <BarChart data={stats.decadesBars} title="Per dècada d'edició" onClickBar={d => filtrarPerStat("decada", parseInt(d.label))} />
            {stats.lecturesBars?.length > 0 && <BarChart data={stats.lecturesBars} title="📖 Lectures per any" />}

            {/* Top valor */}
            {stats.topValor?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#aa223399", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>💎 Top valor estimat</div>
                {stats.topValor.map((e, i) => (
                  <div key={e.edicion_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #111", cursor: "pointer" }} onClick={() => openObra(e)}>
                    <span style={{ fontSize: 12, color: "#bbb" }}><span style={{ color: "#aa223344", marginRight: 8 }}>#{i+1}</span>{e.titulo_edicion}</span>
                    <span style={{ fontSize: 12, color: "#aa2233", flexShrink: 0 }}>{e.preu_mercat}€</span>
                  </div>
                ))}
              </div>
            )}

            {/* Prestats */}
            {stats.prestats?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#aa223399", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>🔄 Llibres prestats ({stats.prestats.length})</div>
                {stats.prestats.map(e => (
                  <div key={e.edicion_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #111", cursor: "pointer" }} onClick={() => openObra(e)}>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{e.titulo_edicion}</span>
                    <span style={{ fontSize: 11, color: "#aa2233" }}>{e.prestat_a}</span>
                  </div>
                ))}
              </div>
            )}
          </>}
        </div>
      )}
    </div>
  );
}
