import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────
const SUPABASE_URL = "https://ptmartuivivhavzgbnvw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWFydHVpdml2aGF2emdibnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzA1MzUsImV4cCI6MjA5MDMwNjUzNX0.hPxV1P-YyIIv4ErA-jEdKLLQTPG2L747WkVsI56gQVs";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Cloudinary ────────────────────────────────────────────
const CLOUDINARY_CLOUD  = "dyup2h4mh";
const CLOUDINARY_PRESET = "ml_per_defecte";
const CLOUDINARY_URL    = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;

// ── Auth ──────────────────────────────────────────────────
const PASSWORD = "NOIR01";

// ── Constants ─────────────────────────────────────────────
const SECCIONS = ["Negre", "Policial", "Thriller", "Nòrdic", "Històric", "Altres"];
const ESTATS   = ["Llegit", "Llegint", "Pendent", "No llegit"];
const FORMATS  = ["Paper", "eBook", "Audiollibre"];
const ORDRES   = [
  { valor: "titol_asc",      label: "Títol A→Z" },
  { valor: "titol_desc",     label: "Títol Z→A" },
  { valor: "autor_asc",      label: "Autor A→Z" },
  { valor: "autor_desc",     label: "Autor Z→A" },
  { valor: "any_desc",       label: "Any ↓" },
  { valor: "any_asc",        label: "Any ↑" },
  { valor: "puntuacio_desc", label: "Puntuació ↓" },
  { valor: "puntuacio_asc",  label: "Puntuació ↑" },
];

const ESTAT_COLORS = {
  "Llegit":    "#c8a96e",
  "Llegint":   "#7a9e7e",
  "Pendent":   "#8a8a6e",
  "No llegit": "#5a5a5a",
};

const getPortadaUrl = (isbn) =>
  isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null;

// ── Estils globals ────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #0f0f0f;
    --bg2:        #1a1a1a;
    --bg3:        #242424;
    --border:     #333333;
    --gold:       #c8a96e;
    --gold-dim:   #8a7050;
    --text:       #e8e0d0;
    --text-dim:   #888880;
    --text-muted: #555550;
    --red:        #c0392b;
    --green:      #7a9e7e;
    --radius:     8px;
    --shadow:     0 4px 24px rgba(0,0,0,0.6);
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  /* Login */
  .login-screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    background: var(--bg);
  }
  .login-title {
    font-family: 'Playfair Display', serif;
    font-size: 52px;
    color: var(--gold);
    letter-spacing: 8px;
    margin-bottom: 8px;
  }
  .login-sub {
    font-size: 12px;
    color: var(--text-muted);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 48px;
  }
  .login-input {
    width: 100%;
    max-width: 280px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px 16px;
    color: var(--text);
    font-size: 18px;
    text-align: center;
    letter-spacing: 4px;
    outline: none;
    margin-bottom: 12px;
  }
  .login-input:focus { border-color: var(--gold-dim); }
  .login-btn {
    width: 100%;
    max-width: 280px;
    background: var(--gold);
    color: #000;
    border: none;
    border-radius: var(--radius);
    padding: 14px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
  }
  .login-error { color: var(--red); font-size: 12px; margin-top: 10px; }

  /* Header */
  .header {
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    padding: 16px 20px 12px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .app-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    color: var(--gold);
    letter-spacing: 3px;
  }
  .header-actions { display: flex; gap: 8px; align-items: center; }
  .btn-add {
    width: 38px; height: 38px;
    background: var(--gold);
    color: #000;
    border: none;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700;
  }
  .btn-logout {
    width: 32px; height: 32px;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }

  .search-input {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 9px 14px;
    color: var(--text);
    font-size: 14px;
    outline: none;
    margin-bottom: 10px;
  }
  .search-input::placeholder { color: var(--text-muted); }
  .search-input:focus { border-color: var(--gold-dim); }

  .estat-filters {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
    margin-bottom: 8px;
  }
  .estat-filters::-webkit-scrollbar { display: none; }
  .estat-btn {
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .estat-btn.active {
    background: var(--gold);
    color: #000;
    border-color: var(--gold);
    font-weight: 500;
  }

  .filters-row { display: flex; gap: 8px; }
  .filter-select {
    flex: 1;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 7px 10px;
    color: var(--text);
    font-size: 13px;
    outline: none;
    cursor: pointer;
    min-width: 0;
  }
  .filter-select:focus { border-color: var(--gold-dim); }

  /* Stats */
  .stats-bar {
    display: flex;
    gap: 16px;
    padding: 10px 20px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
  }
  .stat-item { display: flex; flex-direction: column; align-items: center; }
  .stat-num { font-size: 18px; font-weight: 600; color: var(--gold); line-height: 1; }
  .stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

  .results-count { padding: 6px 16px 0; font-size: 11px; color: var(--text-muted); }

  /* Llista */
  .books-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .book-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: background 0.15s;
  }
  .book-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gold);
    opacity: 0.5;
  }
  .book-card:active { background: var(--bg3); }

  .book-cover {
    width: 52px; height: 72px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--bg3);
  }
  .book-cover-placeholder {
    width: 52px; height: 72px;
    border-radius: 4px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    color: var(--text-muted);
    background: var(--bg3);
  }

  .book-info { flex: 1; min-width: 0; }
  .book-titol {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--text);
    line-height: 1.3;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .book-autor {
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .book-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .tag {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
    background: var(--bg3);
    color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .tag-estat { font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .stars { color: var(--gold); font-size: 11px; letter-spacing: 1px; }

  .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    z-index: 200;
    display: flex;
    align-items: flex-end;
  }
  .modal {
    background: var(--bg2);
    border-top: 1px solid var(--border);
    border-radius: 16px 16px 0 0;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    max-height: 92dvh;
    overflow-y: auto;
    padding: 24px 20px 40px;
  }
  .modal-handle {
    width: 36px; height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 0 auto 20px;
  }
  .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    color: var(--gold);
    margin-bottom: 20px;
  }

  /* Form */
  .form-group { margin-bottom: 14px; }
  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }
  .form-input, .form-select, .form-textarea {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 12px;
    color: var(--text);
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--gold-dim); }
  .form-textarea { min-height: 80px; resize: vertical; }
  .form-row { display: flex; gap: 10px; }
  .form-row .form-group { flex: 1; }

  /* ISBN row */
  .isbn-row { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
  .isbn-row input { flex: 1; }
  .btn-scan {
    height: 42px; width: 42px;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--gold);
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .btn-lookup {
    height: 42px;
    padding: 0 12px;
    background: var(--gold-dim);
    border: none;
    border-radius: var(--radius);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .lookup-badge {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 6px;
    margin-bottom: 10px;
    display: inline-block;
  }
  .lookup-ok  { background: #1a3a1a; color: var(--green); }
  .lookup-err { background: #3a1a1a; color: #e07070; }

  /* Scanner */
  .scanner-overlay {
    position: fixed; inset: 0;
    background: #000;
    z-index: 400;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  #scanner-container {
    width: 100%;
    max-width: 480px;
    position: relative;
  }
  #scanner-container video { width: 100%; display: block; }
  #scanner-container canvas { display: none; }
  .scanner-frame {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 260px; height: 120px;
    border: 2px solid var(--gold);
    border-radius: 8px;
    pointer-events: none;
  }
  .scanner-label { color: var(--gold); font-size: 13px; margin-top: 20px; letter-spacing: 1px; }
  .btn-cancel-scan {
    margin-top: 24px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    padding: 10px 24px;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 14px;
  }

  /* Foto */
  .foto-row { display: flex; gap: 10px; align-items: center; }
  .foto-preview {
    width: 60px; height: 84px;
    border-radius: 4px; object-fit: cover;
    background: var(--bg3);
    border: 1px solid var(--border);
    flex-shrink: 0;
  }
  .foto-preview-placeholder {
    width: 60px; height: 84px;
    border-radius: 4px;
    background: var(--bg3);
    border: 1px dashed var(--border);
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: var(--text-muted);
  }
  .foto-btns { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .btn-foto {
    padding: 10px;
    background: var(--bg3);
    border: 1px dashed var(--gold-dim);
    border-radius: var(--radius);
    color: var(--gold);
    font-size: 13px;
    cursor: pointer;
    text-align: center;
    width: 100%;
  }
  .btn-foto-secondary {
    padding: 7px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 12px;
    cursor: pointer;
    text-align: center;
    width: 100%;
  }

  /* Resum */
  .resum-box {
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 12px;
    font-size: 12px; color: var(--text-dim);
    line-height: 1.6; font-style: italic;
    margin-bottom: 6px;
  }
  .btn-esborrar-resum {
    font-size: 11px; color: var(--text-muted);
    background: none; border: none; cursor: pointer;
    margin-bottom: 14px;
  }

  /* Stars */
  .stars-input { display: flex; gap: 6px; margin-top: 4px; }
  .star-btn { background: none; border: none; cursor: pointer; font-size: 22px; padding: 2px; transition: transform 0.1s; }
  .star-btn:active { transform: scale(1.2); }

  /* Btns */
  .btn-row { display: flex; gap: 10px; margin-top: 20px; }
  .btn { flex: 1; padding: 13px; border-radius: var(--radius); border: none; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-primary  { background: var(--gold); color: #000; }
  .btn-secondary { background: var(--bg3); color: var(--text); border: 1px solid var(--border); }
  .btn-danger   { background: var(--red); color: #fff; }

  /* Detail */
  .detail-cover { width: 100px; height: 140px; border-radius: 6px; object-fit: cover; margin: 0 auto 16px; display: block; box-shadow: var(--shadow); }
  .detail-cover-placeholder { width: 100px; height: 140px; background: var(--bg3); border-radius: 6px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
  .detail-titol { font-family: 'Playfair Display', serif; font-size: 22px; color: var(--gold); text-align: center; margin-bottom: 4px; line-height: 1.3; }
  .detail-autor { font-size: 14px; color: var(--text-dim); text-align: center; margin-bottom: 16px; }
  .detail-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 16px; }
  .detail-tag { padding: 4px 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; font-size: 12px; color: var(--text-dim); }
  .detail-stars { text-align: center; font-size: 20px; color: var(--gold); margin-bottom: 16px; }
  .detail-section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 4px; }
  .detail-resum { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; font-size: 12px; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px; }
  .detail-notes { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; font-size: 13px; color: var(--text-dim); line-height: 1.6; margin-bottom: 16px; font-style: italic; }
  .detail-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }

  /* Toast */
  .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--gold); color: #000; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 999; white-space: nowrap; box-shadow: var(--shadow); animation: fadeInOut 2.5s ease forwards; }
  @keyframes fadeInOut {
    0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
    15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
    75%  { opacity: 1; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
  }

  /* Confirm */
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .confirm-box { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px 20px; max-width: 320px; width: 100%; text-align: center; }
  .confirm-box p { font-size: 15px; color: var(--text); margin-bottom: 20px; line-height: 1.5; }
  .confirm-row { display: flex; gap: 10px; }
`;

// ── Helpers ───────────────────────────────────────────────
const Stars = ({ n }) => {
  if (!n) return null;
  return <span className="stars">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
};

const ordenarBooks = (books, ordre) => {
  const parts = ordre.split("_");
  const dir   = parts.pop();
  const camp  = parts.join("_");
  const key   = camp === "any" ? "any_publicacio" : camp;
  return [...books].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string") va = va.toLowerCase();
    if (typeof vb === "string") vb = vb.toLowerCase();
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
};

// ── App ───────────────────────────────────────────────────
export default function App() {
  const [logat, setLogat]       = useState(false);
  const [pwd, setPwd]           = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [books, setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [cerca, setCerca]               = useState("");
  const [filtreEstat, setFiltreEstat]   = useState("Tots");
  const [filtreSeccio, setFiltreSeccio] = useState("Totes");
  const [ordre, setOrdre]               = useState("titol_asc");

  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(false);
  const [portadaError, setPortadaError] = useState(false);

  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookupMsg, setLookupMsg]       = useState("");
  const [scanning, setScanning]         = useState(false);
  const scannerRef  = useRef(null);
  const quaggaRef   = useRef(null);
  const fotoInputRef = useRef(null);

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // Auth
  const login = () => {
    if (pwd === PASSWORD) { setLogat(true); setPwdError(false); }
    else { setPwdError(true); setPwd(""); }
  };

  // Fetch
  const fetchBooks = useCallback(async () => {
    const { data, error } = await supabase.from("books").select("*");
    if (!error) setBooks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (logat) fetchBooks(); }, [logat, fetchBooks]);

  // Filtrat
  const booksFiltrats = ordenarBooks(
    books.filter((b) => {
      const q = cerca.toLowerCase();
      const matchCerca  = !cerca || b.titol?.toLowerCase().includes(q) || b.autor?.toLowerCase().includes(q);
      const matchEstat  = filtreEstat === "Tots" || b.estat === filtreEstat;
      const matchSeccio = filtreSeccio === "Totes" || b.seccio === filtreSeccio;
      return matchCerca && matchEstat && matchSeccio;
    }),
    ordre
  );

  const total   = books.length;
  const llegits = books.filter(b => b.estat === "Llegit").length;
  const llegint = books.filter(b => b.estat === "Llegint").length;

  // Form
  const formBuit = { titol:"", autor:"", any_publicacio:"", seccio:"Negre", estat:"No llegit", puntuacio:null, isbn:"", format:"Paper", notes:"", resum:"", foto_url:"" };

  const obrirAfegir = () => { setForm(formBuit); setLookupStatus(null); setModal("add"); };
  const obrirDetall = (b) => { setSelected(b); setPortadaError(false); setModal("detail"); };
  const obrirEditar = () => { setForm({...selected}); setLookupStatus(null); setModal("edit"); };
  const tancar = () => { setModal(null); setSelected(null); setForm({}); setLookupStatus(null); stopScanner(); };

  // ISBN lookup
  const lookupISBN = async (isbnVal) => {
    const isbn = (isbnVal || form.isbn || "").trim();
    if (!isbn) return;
    setLookupStatus(null);
    try {
      const res  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await res.json();
      if (!data.items?.length) { setLookupStatus("err"); setLookupMsg("No s'ha trobat cap resultat"); return; }
      const info = data.items[0].volumeInfo;
      setForm(f => ({
        ...f, isbn,
        titol:          info.title        || f.titol,
        autor:          info.authors?.[0] || f.autor,
        any_publicacio: info.publishedDate?.substring(0,4) || f.any_publicacio,
        resum:          info.description  ? info.description.substring(0,400) : f.resum,
      }));
      setLookupStatus("ok");
      setLookupMsg(`Trobat: ${info.title}`);
    } catch {
      setLookupStatus("err");
      setLookupMsg("Error de connexió");
    }
  };

  // Scanner
  const loadQuagga = () => new Promise((resolve, reject) => {
    if (window.Quagga) { resolve(window.Quagga); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/quagga2@1.2.6/dist/quagga.min.js";
    s.onload = () => resolve(window.Quagga);
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const startScanner = async () => {
    setScanning(true);
    try {
      const Quagga = await loadQuagga();
      quaggaRef.current = Quagga;
      await new Promise((res, rej) => {
        Quagga.init({
          inputStream: { type:"LiveStream", target:scannerRef.current, constraints:{ facingMode:"environment" } },
          decoder: { readers:["ean_reader","ean_8_reader"] },
          locate: true,
        }, err => err ? rej(err) : res());
      });
      Quagga.start();
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        stopScanner();
        setForm(f => ({...f, isbn: code}));
        lookupISBN(code);
      });
    } catch { setScanning(false); showToast("No s'ha pogut accedir a la càmera"); }
  };

  const stopScanner = () => {
    if (quaggaRef.current) { try { quaggaRef.current.stop(); } catch {} quaggaRef.current = null; }
    setScanning(false);
  };

  // Cloudinary
  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      const res  = await fetch(CLOUDINARY_URL, { method:"POST", body:fd });
      const data = await res.json();
      if (data.secure_url) { setForm(f => ({...f, foto_url: data.secure_url})); showToast("Foto pujada ✓"); }
      else showToast("Error pujant la foto");
    } catch { showToast("Error pujant la foto"); }
    setUploadingFoto(false);
    e.target.value = "";
  };

  // CRUD
  const desar = async () => {
    if (!form.titol?.trim() || !form.autor?.trim()) { showToast("Títol i autor són obligatoris"); return; }
    setSaving(true);
    const payload = {
      titol: form.titol.trim(), autor: form.autor.trim(),
      any_publicacio: form.any_publicacio ? parseInt(form.any_publicacio) : null,
      seccio: form.seccio, estat: form.estat,
      puntuacio: form.puntuacio || null,
      isbn: form.isbn?.trim() || null,
      format: form.format,
      notes: form.notes?.trim() || null,
      resum: form.resum?.trim() || null,
      foto_url: form.foto_url?.trim() || null,
    };

    if (modal === "add") {
      if (payload.isbn) {
        const { data: dup } = await supabase.from("books").select("id,titol").eq("isbn", payload.isbn).maybeSingle();
        if (dup) { showToast(`ISBN duplicat: "${dup.titol}"`); setSaving(false); return; }
      }
      const { error } = await supabase.from("books").insert([payload]);
      if (!error) { showToast("Llibre afegit ✓"); fetchBooks(); tancar(); }
      else showToast("Error en desar");
    } else {
      const { error } = await supabase.from("books").update(payload).eq("id", selected.id);
      if (!error) { showToast("Canvis desats ✓"); fetchBooks(); setSelected({...selected,...payload}); setModal("detail"); }
      else showToast("Error en desar");
    }
    setSaving(false);
  };

  const eliminar = async () => {
    setConfirm(false);
    const { error } = await supabase.from("books").delete().eq("id", selected.id);
    if (!error) { showToast("Llibre eliminat"); fetchBooks(); tancar(); }
    else showToast("Error en eliminar");
  };

  const getPortadaEfectiva = (b) => {
    if (!b) return null;
    if (b.foto_url) return b.foto_url;
    return getPortadaUrl(b.isbn);
  };

  // ── Render login ──────────────────────────────────────────
  if (!logat) return (
    <>
      <style>{styles}</style>
      <div className="login-screen">
        <div className="login-title">NOIR</div>
        <div className="login-sub">Col·lecció de novel·la negra</div>
        <input className="login-input" type="password" placeholder="·····"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()} autoFocus />
        <button className="login-btn" onClick={login}>Entrar</button>
        {pwdError && <div className="login-error">Contrasenya incorrecta</div>}
      </div>
    </>
  );

  // ── Render form ───────────────────────────────────────────
  const renderForm = () => (
    <>
      <div className="modal-handle" />
      <div className="modal-title">{modal === "add" ? "Afegir llibre" : "Editar llibre"}</div>

      <div className="form-group">
        <label className="form-label">ISBN</label>
        <div className="isbn-row">
          <input className="form-input" value={form.isbn || ""}
            onChange={e => setForm(f => ({...f, isbn: e.target.value}))}
            placeholder="9788432228773" />
          <button className="btn-scan" onClick={startScanner} title="Escanejar">📷</button>
          <button className="btn-lookup" onClick={() => lookupISBN()}>Buscar</button>
        </div>
        {lookupStatus && <div className={`lookup-badge lookup-${lookupStatus}`}>{lookupMsg}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Títol *</label>
        <input className="form-input" value={form.titol || ""}
          onChange={e => setForm(f => ({...f, titol: e.target.value}))}
          placeholder="Títol del llibre" />
      </div>
      <div className="form-group">
        <label className="form-label">Autor *</label>
        <input className="form-input" value={form.autor || ""}
          onChange={e => setForm(f => ({...f, autor: e.target.value}))}
          placeholder="Nom de l'autor/a" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Any</label>
          <input className="form-input" type="number" value={form.any_publicacio || ""}
            onChange={e => setForm(f => ({...f, any_publicacio: e.target.value}))} placeholder="Any" />
        </div>
        <div className="form-group">
          <label className="form-label">Format</label>
          <select className="form-select" value={form.format || "Paper"}
            onChange={e => setForm(f => ({...f, format: e.target.value}))}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Secció</label>
          <select className="form-select" value={form.seccio || "Negre"}
            onChange={e => setForm(f => ({...f, seccio: e.target.value}))}>
            {SECCIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Estat</label>
          <select className="form-select" value={form.estat || "No llegit"}
            onChange={e => setForm(f => ({...f, estat: e.target.value}))}>
            {ESTATS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Puntuació</label>
        <div className="stars-input">
          {[1,2,3,4,5].map(n => (
            <button key={n} className="star-btn"
              onClick={() => setForm(f => ({...f, puntuacio: f.puntuacio === n ? null : n}))}>
              {(form.puntuacio || 0) >= n ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Foto portada</label>
        <div className="foto-row">
          {form.foto_url
            ? <img src={form.foto_url} alt="portada" className="foto-preview" />
            : <div className="foto-preview-placeholder">📷</div>
          }
          <div className="foto-btns">
            <button className="btn-foto" onClick={() => fotoInputRef.current?.click()}
              disabled={uploadingFoto}>
              {uploadingFoto ? "Pujant..." : "📷 Fer foto / triar imatge"}
            </button>
            {form.foto_url && (
              <button className="btn-foto-secondary"
                onClick={() => setForm(f => ({...f, foto_url:""}))}>
                Treure foto
              </button>
            )}
          </div>
        </div>
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment"
          style={{display:"none"}} onChange={handleFotoChange} />
      </div>

      {form.resum ? (
        <div className="form-group">
          <label className="form-label">Resum (Google Books)</label>
          <div className="resum-box">{form.resum}</div>
          <button className="btn-esborrar-resum"
            onClick={() => setForm(f => ({...f, resum:""}))}>Esborrar resum</button>
        </div>
      ) : null}

      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" value={form.notes || ""}
          onChange={e => setForm(f => ({...f, notes: e.target.value}))}
          placeholder="Impressions, cites, comentaris..." />
      </div>

      <div className="btn-row">
        <button className="btn btn-secondary" onClick={tancar}>Cancel·lar</button>
        <button className="btn btn-primary" onClick={desar} disabled={saving}>
          {saving ? "Desant..." : "Desar"}
        </button>
      </div>
    </>
  );

  // ── Render detail ─────────────────────────────────────────
  const renderDetail = () => {
    const b = selected;
    if (!b) return null;
    const portada     = getPortadaEfectiva(b);
    const estatColor  = ESTAT_COLORS[b.estat] || "#5a5a5a";
    return (
      <>
        <div className="modal-handle" />
        {portada && !portadaError
          ? <img src={portada} alt={b.titol} className="detail-cover" onError={() => setPortadaError(true)} />
          : <div className="detail-cover-placeholder">🔍</div>
        }
        <div className="detail-titol">{b.titol}</div>
        <div className="detail-autor">{b.autor}{b.any_publicacio ? ` · ${b.any_publicacio}` : ""}</div>
        <div className="detail-tags">
          <span className="detail-tag">{b.seccio}</span>
          <span className="detail-tag">{b.format}</span>
          <span className="detail-tag" style={{color: estatColor, borderColor: estatColor}}>{b.estat}</span>
          {b.isbn && <span className="detail-tag">ISBN {b.isbn}</span>}
        </div>
        {b.puntuacio && <div className="detail-stars"><Stars n={b.puntuacio} /></div>}
        {b.resum && (
          <>
            <div className="detail-section-label">Resum</div>
            <div className="detail-resum">{b.resum}</div>
          </>
        )}
        {b.notes && <div className="detail-notes">"{b.notes}"</div>}
        <hr className="detail-divider" />
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={tancar}>Tancar</button>
          <button className="btn btn-secondary" onClick={obrirEditar}>Editar</button>
          <button className="btn btn-danger" onClick={() => setConfirm(true)}>Eliminar</button>
        </div>
      </>
    );
  };

  // ── Render principal ──────────────────────────────────────
  return (
    <>
      <style>{styles}</style>
      <div className="app">

        <header className="header">
          <div className="header-top">
            <span className="app-title">NOIR</span>
            <div className="header-actions">
              <button className="btn-add" onClick={obrirAfegir}>+</button>
              <button className="btn-logout" onClick={() => setLogat(false)} title="Sortir">↩</button>
            </div>
          </div>
          <input className="search-input" placeholder="Cercar per títol o autor..."
            value={cerca} onChange={e => setCerca(e.target.value)} />
          <div className="estat-filters">
            {["Tots", ...ESTATS].map(e => (
              <button key={e} className={`estat-btn${filtreEstat === e ? " active" : ""}`}
                onClick={() => setFiltreEstat(e)}>{e}</button>
            ))}
          </div>
          <div className="filters-row">
            <select className="filter-select" value={filtreSeccio}
              onChange={e => setFiltreSeccio(e.target.value)}>
              <option value="Totes">Totes les seccions</option>
              {SECCIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={ordre}
              onChange={e => setOrdre(e.target.value)}>
              {ORDRES.map(o => <option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
          </div>
        </header>

        <div className="stats-bar">
          <div className="stat-item"><span className="stat-num">{total}</span><span className="stat-label">Total</span></div>
          <div className="stat-item"><span className="stat-num">{llegits}</span><span className="stat-label">Llegits</span></div>
          <div className="stat-item"><span className="stat-num">{llegint}</span><span className="stat-label">Llegint</span></div>
          <div className="stat-item"><span className="stat-num">{total - llegits}</span><span className="stat-label">Pendents</span></div>
        </div>

        {(cerca || filtreEstat !== "Tots" || filtreSeccio !== "Totes") && (
          <div className="results-count">
            {booksFiltrats.length} {booksFiltrats.length === 1 ? "resultat" : "resultats"}
          </div>
        )}

        <div className="books-list">
          {loading ? (
            <div className="empty"><div className="empty-icon">⏳</div></div>
          ) : booksFiltrats.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">
                {books.length === 0 ? "Encara no hi ha llibres. Afegeix el primer!" : "Cap resultat per a aquesta cerca"}
              </div>
            </div>
          ) : booksFiltrats.map(b => {
            const portada    = getPortadaEfectiva(b);
            const estatColor = ESTAT_COLORS[b.estat] || "#5a5a5a";
            return (
              <div key={b.id} className="book-card" onClick={() => obrirDetall(b)}>
                {portada
                  ? <img src={portada} alt={b.titol} className="book-cover"
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  : null
                }
                <div className="book-cover-placeholder" style={{display: portada ? "none" : "flex"}}>🔍</div>
                <div className="book-info">
                  <div className="book-titol">{b.titol}</div>
                  <div className="book-autor">{b.autor}{b.any_publicacio ? ` · ${b.any_publicacio}` : ""}</div>
                  <div className="book-meta">
                    <span className="tag">{b.seccio}</span>
                    <span className="tag-estat" style={{color: estatColor}}>● {b.estat}</span>
                    {b.puntuacio && <Stars n={b.puntuacio} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {modal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) tancar(); }}>
            <div className="modal">
              {modal === "detail" ? renderDetail() : renderForm()}
            </div>
          </div>
        )}

        {confirm && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <p>Eliminar <strong>"{selected?.titol}"</strong>?<br/>Aquesta acció no es pot desfer.</p>
              <div className="confirm-row">
                <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancel·lar</button>
                <button className="btn btn-danger" onClick={eliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {scanning && (
          <div className="scanner-overlay">
            <div id="scanner-container" ref={scannerRef}>
              <div className="scanner-frame" />
            </div>
            <div className="scanner-label">Apunta al codi de barres del llibre</div>
            <button className="btn-cancel-scan" onClick={stopScanner}>Cancel·lar</button>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
