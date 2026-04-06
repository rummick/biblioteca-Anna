import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ptmartuivivhavzgbnvw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWFydHVpdml2aGF2emdibnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzA1MzUsImV4cCI6MjA5MDMwNjUzNX0.hPxV1P-YyIIv4ErA-jEdKLLQTPG2L747WkVsI56gQVs";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CLOUDINARY_CLOUD  = "dyup2h4mh";
const CLOUDINARY_PRESET = "ml_per_defecte";
const CLOUDINARY_UPLOAD = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
const PASSWORD          = "NOIR01";

const SECCIONS = ["Negre", "Policial", "Thriller", "Nòrdic", "Històric", "Altres"];
const ESTATS   = ["Llegit", "Llegint", "Pendent", "No llegit"];
const FORMATS  = ["Paper", "eBook", "Audiollibre"];
const ORDRES   = [
  { valor:"titol_asc",      label:"Títol A→Z" },
  { valor:"titol_desc",     label:"Títol Z→A" },
  { valor:"autor_asc",      label:"Autor A→Z" },
  { valor:"autor_desc",     label:"Autor Z→A" },
  { valor:"any_desc",       label:"Any ↓" },
  { valor:"any_asc",        label:"Any ↑" },
  { valor:"puntuacio_desc", label:"Puntuació ↓" },
  { valor:"puntuacio_asc",  label:"Puntuació ↑" },
];
const ESTAT_COLORS = {
  "Llegit":"#c8a96e", "Llegint":"#7a9e7e",
  "Pendent":"#8a8a6e", "No llegit":"#5a5a5a",
};

const getOpenLibraryUrl = (isbn) =>
  isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null;

// ── Logo SVG ──────────────────────────────────────────────
const LogoSVG = () => (
  <svg width="100%" height="100%" viewBox="0 0 680 170" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
    <circle cx="30" cy="20" r="1" fill="#e8d5b0" opacity="0.4"/>
    <circle cx="80" cy="12" r="1.5" fill="#e8d5b0" opacity="0.3"/>
    <circle cx="150" cy="8" r="1" fill="#e8d5b0" opacity="0.35"/>
    <circle cx="220" cy="18" r="1" fill="#e8d5b0" opacity="0.25"/>
    <circle cx="640" cy="15" r="1" fill="#e8d5b0" opacity="0.3"/>
    <circle cx="660" cy="40" r="1.5" fill="#e8d5b0" opacity="0.25"/>
    <g transform="translate(28,22)">
      <circle cx="38" cy="38" r="36" fill="#2a1e0e" stroke="#c8a96e" strokeWidth="2.5"/>
      <circle cx="38" cy="38" r="29" fill="#1a1208"/>
      <path d="M24 24 Q30 19 38 21" stroke="#c8a96e" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round"/>
      <line x1="62" y1="62" x2="84" y2="88" stroke="#c8a96e" strokeWidth="8" strokeLinecap="round"/>
      <line x1="62" y1="62" x2="84" y2="88" stroke="#8a6030" strokeWidth="4" strokeLinecap="round"/>
    </g>
    <g transform="translate(125,15)" opacity="0.88">
      <path d="M28 22 L16 140 L52 140 L40 22 Z" fill="#4a4038"/>
      <path d="M28 22 L20 46 L30 38 L38 46 L40 22 Z" fill="#5a5048"/>
      <path d="M18 42 L4 110 L14 114 L26 52 Z" fill="#4a4038"/>
      <path d="M40 42 L54 110 L44 114 L32 52 Z" fill="#4a4038"/>
      <rect x="14" y="88" width="40" height="6" rx="2" fill="#c8a96e"/>
      <rect x="29" y="85" width="10" height="12" rx="1.5" fill="#c8a96e" opacity="0.8"/>
      <ellipse cx="34" cy="20" rx="26" ry="6" fill="#2e2820"/>
      <path d="M18 20 Q34 4 50 20 Z" fill="#3a3228"/>
      <rect x="16" y="16" width="36" height="6" rx="2" fill="#2e2820"/>
    </g>
    <g transform="translate(204,52) rotate(-20)">
      <rect x="0" y="4" width="54" height="14" rx="3" fill="#7a7060"/>
      <rect x="36" y="0" width="18" height="9" rx="2" fill="#6a6050"/>
      <rect x="6" y="17" width="16" height="20" rx="2.5" fill="#6a6050"/>
    </g>
    <g fill="#9b1a1a">
      <ellipse cx="275" cy="72" rx="4" ry="6"/>
      <path d="M275 66 Q278 61 275 57 Q272 61 275 66 Z"/>
      <ellipse cx="286" cy="90" rx="3" ry="4.5"/>
      <path d="M286 85 Q289 81 286 78 Q283 81 286 85 Z"/>
    </g>
    <rect x="300" y="128" width="195" height="8" rx="3" fill="#c8a96e"/>
    {[
      [303,62,18,68,"#7a1a1a","#5a1010"],[325,72,15,58,"#1a4a2a","#123520"],
      [344,56,19,74,"#2a3a5a","#1a2a4a"],[367,66,16,64,"#6a5020","#4a3810"],
      [387,52,18,78,"#4a2a5a","#331a40"],[409,68,14,62,"#3a3a4a","#2a2a3a"],
      [427,58,17,72,"#6a3010","#4a2008"],[448,70,15,60,"#3a4a1a","#283410"],
      [467,62,16,68,"#5a2a1a","#3a1a08"],[487,74,14,56,"#1a3a4a","#102a3a"],
    ].map(([x,y,w,h,f,s],i)=>(
      <g key={i}><rect x={x} y={y} width={w} height={h} rx="2" fill={f}/><rect x={x} y={y} width="3" height={h} fill={s}/></g>
    ))}
    <text x="510" y="122" fontFamily="Georgia,'Times New Roman',serif" fontSize="68" fontWeight="700" fill="#c8a96e" letterSpacing="6" opacity="0.95">NOIR</text>
  </svg>
);

// ── Estils ────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0f0f0f;--bg2:#1a1a1a;--bg3:#242424;--border:#333;
    --gold:#c8a96e;--gold-dim:#8a7050;
    --text:#e8e0d0;--text-dim:#888880;--text-muted:#555550;
    --red:#c0392b;--green:#7a9e7e;--purple:#9b7ec8;--radius:8px;
    --shadow:0 4px 24px rgba(0,0,0,0.6);
  }
  html,body,#root{height:100%;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;font-size:15px;-webkit-font-smoothing:antialiased;}
  .app{width:100%;min-height:100dvh;display:flex;flex-direction:column;background:var(--bg);}

  .login-screen{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 32px;}
  .login-logo{width:min(380px,90vw);margin-bottom:32px;}
  .login-sub{font-size:11px;color:var(--text-muted);letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;}
  .login-input{width:100%;max-width:260px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;color:var(--text);font-size:18px;text-align:center;letter-spacing:4px;outline:none;margin-bottom:12px;}
  .login-input:focus{border-color:var(--gold-dim);}
  .login-btn{width:100%;max-width:260px;background:var(--gold);color:#000;border:none;border-radius:var(--radius);padding:14px;font-size:14px;font-weight:700;letter-spacing:2px;cursor:pointer;text-transform:uppercase;}
  .login-error{color:var(--red);font-size:12px;margin-top:10px;}

  .header{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 20px 10px;position:sticky;top:0;z-index:100;}
  .header-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:12px;}
  .header-logo{flex:1;max-width:280px;height:44px;}
  .header-actions{display:flex;gap:8px;align-items:center;flex-shrink:0;}
  .btn-add{width:38px;height:38px;background:var(--gold);color:#000;border:none;border-radius:50%;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;}
  .btn-logout{width:32px;height:32px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:50%;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .search-input{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:9px 14px;color:var(--text);font-size:14px;outline:none;margin-bottom:10px;}
  .search-input::placeholder{color:var(--text-muted);}
  .search-input:focus{border-color:var(--gold-dim);}
  .estat-filters{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;margin-bottom:8px;}
  .estat-filters::-webkit-scrollbar{display:none;}
  .estat-btn{padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:12px;cursor:pointer;white-space:nowrap;transition:all 0.15s;}
  .estat-btn.active{background:var(--gold);color:#000;border-color:var(--gold);font-weight:500;}
  .filters-row{display:flex;gap:8px;}
  .filter-select{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:7px 10px;color:var(--text);font-size:13px;outline:none;cursor:pointer;min-width:0;}
  .filter-select:focus{border-color:var(--gold-dim);}

  .stats-bar{display:flex;gap:16px;padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--border);}
  .stat-item{display:flex;flex-direction:column;align-items:center;}
  .stat-num{font-size:18px;font-weight:600;color:var(--gold);line-height:1;}
  .stat-label{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
  .results-count{padding:8px 20px 0;font-size:11px;color:var(--text-muted);}

  .books-grid{flex:1;padding:16px 20px;display:grid;gap:16px;align-content:start;}
  .book-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;overflow:hidden;display:flex;flex-direction:column;transition:border-color 0.15s,transform 0.1s;position:relative;}
  .book-card:hover{border-color:var(--gold-dim);transform:translateY(-2px);}
  .book-card:active{transform:translateY(0);}
  .book-card-cover{width:100%;aspect-ratio:2/3;object-fit:cover;background:var(--bg3);display:block;}
  .book-card-cover-ph{width:100%;aspect-ratio:2/3;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:36px;color:var(--text-muted);}
  .book-card-body{padding:10px;flex:1;display:flex;flex-direction:column;gap:4px;}
  .book-card-titol{font-family:'Playfair Display',serif;font-size:13px;color:var(--text);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .book-card-autor{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .book-card-serie{font-size:10px;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .book-card-meta{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:2px;}
  .tag-mini{padding:1px 6px;border-radius:8px;font-size:9px;font-weight:500;background:var(--bg3);color:var(--text-muted);border:1px solid var(--border);}
  .stars-mini{color:var(--gold);font-size:9px;letter-spacing:0.5px;}
  .estat-badge{position:absolute;top:6px;left:6px;padding:2px 7px;border-radius:8px;font-size:9px;font-weight:600;background:rgba(15,15,15,0.85);}

  .book-card-list{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);display:flex;gap:12px;padding:12px;cursor:pointer;position:relative;overflow:hidden;transition:background 0.15s;}
  .book-card-list::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--gold);opacity:0.5;}
  .book-card-list:active{background:var(--bg3);}
  .book-cover-sm{width:52px;height:72px;border-radius:4px;object-fit:cover;flex-shrink:0;background:var(--bg3);}
  .book-cover-sm-ph{width:52px;height:72px;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--text-muted);background:var(--bg3);}
  .book-info{flex:1;min-width:0;}
  .book-titol{font-family:'Playfair Display',serif;font-size:15px;color:var(--text);line-height:1.3;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .book-serie-tag{font-size:11px;color:var(--purple);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .book-autor{font-size:12px;color:var(--text-dim);margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .book-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
  .tag{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:500;background:var(--bg3);color:var(--text-dim);border:1px solid var(--border);}
  .tag-estat{font-weight:600;font-size:10px;padding:2px 8px;border-radius:10px;}
  .stars{color:var(--gold);font-size:11px;letter-spacing:1px;}

  .empty{text-align:center;padding:60px 20px;color:var(--text-muted);grid-column:1/-1;}
  .empty-icon{font-size:48px;margin-bottom:12px;}
  .empty-text{font-size:14px;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
  .modal{background:var(--bg2);border-top:1px solid var(--border);border-radius:16px 16px 0 0;width:100%;max-width:560px;max-height:92dvh;overflow-y:auto;padding:24px 20px 40px;}
  .modal-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 20px;}
  .modal-title{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold);margin-bottom:20px;}

  .form-group{margin-bottom:14px;}
  .form-label{display:block;font-size:11px;font-weight:500;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;}
  .form-input,.form-select,.form-textarea{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;color:var(--text);font-size:14px;font-family:'Inter',sans-serif;outline:none;}
  .form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--gold-dim);}
  .form-textarea{min-height:80px;resize:vertical;}
  .form-row{display:flex;gap:10px;}
  .form-row .form-group{flex:1;}

  .isbn-row{display:flex;gap:8px;align-items:center;margin-bottom:6px;}
  .isbn-row input{flex:1;}
  .btn-scan{height:42px;width:42px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--gold);font-size:18px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
  .btn-lookup{height:42px;padding:0 12px;background:var(--gold-dim);border:none;border-radius:var(--radius);color:#fff;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;white-space:nowrap;}
  .lookup-badge{font-size:11px;padding:4px 10px;border-radius:6px;margin-bottom:10px;display:inline-block;}
  .lookup-ok{background:#1a3a1a;color:var(--green);}
  .lookup-err{background:#3a1a1a;color:#e07070;}

  .scanner-wrapper{position:relative;width:100%;background:#000;border-radius:var(--radius);overflow:hidden;margin-bottom:14px;}
  .scanner-wrapper video{width:100%;display:block;max-height:280px;object-fit:cover;}
  .scanner-frame-inner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220px;height:90px;border:2px solid var(--gold);border-radius:8px;pointer-events:none;}
  .scanner-hint{font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:10px;}
  .btn-stop-scan{width:100%;padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);color:var(--text-dim);font-size:13px;cursor:pointer;margin-bottom:14px;}

  .stars-input{display:flex;gap:6px;margin-top:4px;}
  .star-btn{background:none;border:none;cursor:pointer;font-size:22px;padding:2px;transition:transform 0.1s;}
  .star-btn:active{transform:scale(1.2);}

  /* Resum IA */
  .resum-row{display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;}
  .resum-box{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--text-dim);line-height:1.6;font-style:italic;}
  .btn-ia{padding:8px 12px;background:#2a1a3a;border:1px solid var(--purple);border-radius:var(--radius);color:var(--purple);font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background 0.15s;}
  .btn-ia:hover{background:#3a2a4a;}
  .btn-ia:disabled{opacity:0.5;cursor:wait;}
  .btn-ia-inline{display:block;width:100%;padding:9px;background:#2a1a3a;border:1px solid var(--purple);border-radius:var(--radius);color:var(--purple);font-size:12px;cursor:pointer;text-align:center;margin-bottom:14px;}
  .btn-ia-inline:disabled{opacity:0.5;cursor:wait;}

  /* Sèrie */
  .serie-tag{display:inline-block;padding:3px 10px;background:#1a1a2e;border:1px solid var(--purple);border-radius:12px;font-size:11px;color:var(--purple);margin-bottom:12px;}

  /* Portada botons (detall) */
  .portada-btns{display:flex;gap:8px;justify-content:center;margin-bottom:16px;flex-wrap:wrap;}
  .portada-btn{padding:6px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:20px;color:var(--text-dim);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:border-color 0.15s,color 0.15s;}
  .portada-btn:hover{border-color:var(--gold-dim);color:var(--gold);}
  .portada-btn:disabled{opacity:0.5;cursor:wait;}
  .url-input-row{display:flex;gap:8px;margin-bottom:12px;}
  .url-input-row input{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:8px 12px;color:var(--text);font-size:13px;outline:none;}
  .url-input-row input:focus{border-color:var(--gold-dim);}
  .url-input-row button{padding:8px 14px;background:var(--gold-dim);border:none;border-radius:var(--radius);color:#fff;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}

  .foto-row{display:flex;gap:10px;align-items:center;}
  .foto-preview{width:60px;height:84px;border-radius:4px;object-fit:cover;background:var(--bg3);border:1px solid var(--border);flex-shrink:0;}
  .foto-preview-ph{width:60px;height:84px;border-radius:4px;background:var(--bg3);border:1px dashed var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--text-muted);}
  .foto-btns{flex:1;display:flex;flex-direction:column;gap:6px;}
  .btn-foto{padding:10px;background:var(--bg3);border:1px dashed var(--gold-dim);border-radius:var(--radius);color:var(--gold);font-size:13px;cursor:pointer;text-align:center;width:100%;}
  .btn-foto-sec{padding:7px;background:transparent;border:1px solid var(--border);border-radius:var(--radius);color:var(--text-muted);font-size:12px;cursor:pointer;text-align:center;width:100%;}

  .btn-row{display:flex;gap:10px;margin-top:20px;}
  .btn{flex:1;padding:13px;border-radius:var(--radius);border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
  .btn-primary{background:var(--gold);color:#000;}
  .btn-secondary{background:var(--bg3);color:var(--text);border:1px solid var(--border);}
  .btn-danger{background:var(--red);color:#fff;}

  .detail-cover{width:120px;height:168px;border-radius:6px;object-fit:cover;margin:0 auto 12px;display:block;box-shadow:var(--shadow);}
  .detail-cover-ph{width:120px;height:168px;background:var(--bg3);border-radius:6px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:48px;}
  .detail-titol{font-family:'Playfair Display',serif;font-size:22px;color:var(--gold);text-align:center;margin-bottom:4px;line-height:1.3;}
  .detail-autor{font-size:14px;color:var(--text-dim);text-align:center;margin-bottom:8px;}
  .detail-serie{text-align:center;margin-bottom:14px;}
  .detail-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;}
  .detail-tag{padding:4px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;font-size:12px;color:var(--text-dim);}
  .detail-stars{text-align:center;font-size:20px;color:var(--gold);margin-bottom:16px;}
  .detail-sec-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:4px;}
  .detail-resum{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:12px;color:var(--text-muted);line-height:1.6;margin-bottom:8px;}
  .detail-notes{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-size:13px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;font-style:italic;}
  .detail-divider{border:none;border-top:1px solid var(--border);margin:16px 0;}

  .toast{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--gold);color:#000;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:999;white-space:nowrap;box-shadow:var(--shadow);animation:fadeInOut 2.5s ease forwards;}
  @keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(10px);}15%{opacity:1;transform:translateX(-50%) translateY(0);}75%{opacity:1;}100%{opacity:0;transform:translateX(-50%) translateY(-4px);}}

  .confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;}
  .confirm-box{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px 20px;max-width:320px;width:100%;text-align:center;}
  .confirm-box p{font-size:15px;color:var(--text);margin-bottom:20px;line-height:1.5;}
  .confirm-row{display:flex;gap:10px;}

  /* Diagnòstic */
  .btn-diag{width:32px;height:32px;background:transparent;color:var(--text-muted);border:1px solid var(--border);border-radius:50%;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.15s,border-color 0.15s;}
  .btn-diag:hover{color:var(--gold);border-color:var(--gold-dim);}
  .diag-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;}
  .diag-stat{background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;}
  .diag-stat-num{font-size:28px;font-weight:700;line-height:1;}
  .diag-stat-num.ok{color:var(--green);}
  .diag-stat-num.warn{color:#e8a020;}
  .diag-stat-num.err{color:var(--red);}
  .diag-stat-label{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px;}
  .diag-section{margin-bottom:18px;}
  .diag-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
  .diag-section-title.err{color:var(--red);}
  .diag-section-title.warn{color:#e8a020;}
  .diag-item{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:9px 12px;margin-bottom:6px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:border-color 0.15s;}
  .diag-item:hover{border-color:var(--gold-dim);}
  .diag-item-titol{font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
  .diag-item-autor{font-size:11px;color:var(--text-muted);flex-shrink:0;margin-left:8px;}
  .diag-empty{font-size:12px;color:var(--green);padding:6px 0;}
  .diag-divider{border:none;border-top:1px solid var(--border);margin:16px 0;}
`;

const Stars = ({ n, mini }) => {
  if (!n) return null;
  return <span className={mini?"stars-mini":"stars"}>{"★".repeat(n)}{"☆".repeat(5-n)}</span>;
};

const ordenarBooks = (books, ordre) => {
  const parts = ordre.split("_");
  const dir   = parts.pop();
  const key   = parts.join("_") === "any" ? "any_publicacio" : parts.join("_");
  return [...books].sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va==null&&vb==null) return 0;
    if (va==null) return 1; if (vb==null) return -1;
    if (typeof va==="string") va=va.toLowerCase();
    if (typeof vb==="string") vb=vb.toLowerCase();
    if (va<vb) return dir==="asc"?-1:1;
    if (va>vb) return dir==="asc"?1:-1;
    return 0;
  });
};

// ── Generar resum IA via Claude API ───────────────────────
const generarResumIA = async (titol, autor, serie, numSerie) => {
  const context = [
    titol && `Títol: ${titol}`,
    autor && `Autor/a: ${autor}`,
    serie && `Sèrie: ${serie}${numSerie ? ` (núm. ${numSerie})` : ""}`,
  ].filter(Boolean).join("\n");

  const prompt = `Ets un expert en novel·la negra i literatura de gènere. Escriu un resum breu (màxim 3 frases, uns 80-100 paraules) d'aquest llibre en català. Ha de ser informatiu, sense revelar el desenllaç, i capturar l'atmosfera noir. Respon NOMÉS amb el resum, sense títol ni explicacions addicionals.\n\n${context}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || null;
};

export default function App() {
  const [logat, setLogat]       = useState(false);
  const [pwd, setPwd]           = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cerca, setCerca]               = useState("");
  const [filtreEstat, setFiltreEstat]   = useState("Tots");
  const [filtreSeccio, setFiltreSeccio] = useState("Totes");
  const [ordre, setOrdre]               = useState("titol_asc");
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [confirm, setConfirm]   = useState(false);
  const [portadaKey, setPortadaKey] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal]   = useState("");
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [lookupMsg, setLookupMsg]       = useState("");
  const [scanning, setScanning]         = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [generantResum, setGenerantResum] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [toast, setToast] = useState(null);
  const [cols, setCols]   = useState(1);

  const videoRef        = useRef(null);
  const streamRef       = useRef(null);
  const rafRef          = useRef(null);
  const fotoInputRef    = useRef(null);
  const isbnInputRef    = useRef(null);
  const portadaInputRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w>=1200) setCols(4); else if (w>=900) setCols(3);
      else if (w>=600) setCols(2); else setCols(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null),2600); };

  const login = () => {
    if (pwd===PASSWORD) { setLogat(true); setPwdError(false); }
    else { setPwdError(true); setPwd(""); }
  };

  const fetchBooks = useCallback(async () => {
    const {data,error} = await supabase.from("books").select("*");
    if (!error) setBooks(data||[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (logat) fetchBooks(); }, [logat,fetchBooks]);

  const booksFiltrats = ordenarBooks(
    books.filter(b => {
      const q = cerca.toLowerCase();
      return (!cerca||b.titol?.toLowerCase().includes(q)||b.autor?.toLowerCase().includes(q)||b.serie?.toLowerCase().includes(q))
          && (filtreEstat==="Tots"||b.estat===filtreEstat)
          && (filtreSeccio==="Totes"||b.seccio===filtreSeccio);
    }), ordre
  );

  const total   = books.length;
  const llegits = books.filter(b=>b.estat==="Llegit").length;
  const llegint = books.filter(b=>b.estat==="Llegint").length;

  const formBuit = {titol:"",autor:"",any_publicacio:"",seccio:"Negre",estat:"No llegit",puntuacio:null,isbn:"",format:"Paper",notes:"",resum:"",foto_url:"",serie:"",num_serie:""};

  const obrirAfegir = () => { setForm(formBuit); setLookupStatus(null); setModal("add"); };
  const obrirDetall = (b) => { setSelected(b); setShowUrlInput(false); setUrlInputVal(""); setModal("detail"); };
  const obrirEditar = () => { setForm({...selected, num_serie: selected.num_serie||""}); setLookupStatus(null); setModal("edit"); };
  const tancar = () => { stopScanner(); setModal(null); setSelected(null); setForm({}); setLookupStatus(null); setShowUrlInput(false); };

  // ── ISBN Lookup ───────────────────────────────────────────
  const lookupISBN = async (isbnVal) => {
    const isbn = (isbnVal||form.isbn||"").trim();
    if (!isbn) return;
    setLookupStatus(null); setLookupMsg("Buscant...");

    // 1) Google Books
    try {
      const res  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await res.json();
      if (data.items?.length) {
        const info = data.items[0].volumeInfo;
        // Intentem extreure sèrie del títol (ex: "Wallander 3: El guerrer blanc")
        const serieMatch = info.title?.match(/^(.+?)\s*[\d]+[:·]/);
        const serie = info.seriesInfo?.bookDisplayNumber
          ? info.seriesInfo.canonicalVolumeLink
          : (serieMatch?.[1] || "");
        const numSerie = info.seriesInfo?.bookDisplayNumber || "";
        setForm(f=>({
          ...f, isbn,
          titol:          info.title                         || f.titol,
          autor:          info.authors?.[0]                  || f.autor,
          any_publicacio: info.publishedDate?.substring(0,4) || f.any_publicacio,
          resum:          info.description?.substring(0,400) || f.resum,
          serie:          serie || f.serie,
          num_serie:      numSerie || f.num_serie,
        }));
        setLookupStatus("ok"); setLookupMsg(`Google Books: ${info.title}`);
        return;
      }
    } catch {}

    // 2) OpenLibrary
    try {
      const res  = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await res.json();
      const key  = `ISBN:${isbn}`;
      if (data[key]) {
        const info  = data[key];
        const autor = info.authors?.[0]?.name || "";
        const any   = info.publish_date?.match(/\d{4}/)?.[0] || "";
        const resum = typeof info.excerpts?.[0]?.text === "string" ? info.excerpts[0].text.substring(0,400) : "";
        const serie = info.subjects?.find(s=>s.name?.toLowerCase().includes("series"))?.name || "";
        setForm(f=>({
          ...f, isbn,
          titol:          info.title || f.titol,
          autor:          autor      || f.autor,
          any_publicacio: any        || f.any_publicacio,
          resum:          resum      || f.resum,
          serie:          serie      || f.serie,
        }));
        setLookupStatus("ok"); setLookupMsg(`OpenLibrary: ${info.title}`);
        return;
      }
    } catch {}

    setLookupStatus("err"); setLookupMsg("No s'ha trobat cap resultat");
  };

  // ── Resum IA ──────────────────────────────────────────────
  const handleGenerarResum = async () => {
    const titol = form.titol || selected?.titol;
    const autor = form.autor || selected?.autor;
    if (!titol || !autor) { showToast("Cal tenir títol i autor per generar el resum"); return; }
    setGenerantResum(true);
    try {
      const resum = await generarResumIA(titol, autor, form.serie||selected?.serie, form.num_serie||selected?.num_serie);
      if (resum) {
        if (modal === "detail") {
          // Desa directament a BD des del detall
          await supabase.from("books").update({resum}).eq("id", selected.id);
          const updated = {...selected, resum};
          setSelected(updated);
          setBooks(bs=>bs.map(b=>b.id===selected.id?updated:b));
          showToast("Resum generat ✓");
        } else {
          setForm(f=>({...f, resum}));
        }
      } else showToast("No s'ha pogut generar el resum");
    } catch { showToast("Error generant el resum"); }
    setGenerantResum(false);
  };

  // ── Scanner ───────────────────────────────────────────────
  const stopScanner = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current=null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t=>t.stop()); streamRef.current=null; }
    setScanning(false);
  };

  const startScanner = async () => {
    if (!("BarcodeDetector" in window)) { isbnInputRef.current?.click(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
      streamRef.current = stream; setScanning(true);
      await new Promise(r=>setTimeout(r,120));
      if (!videoRef.current) { stopScanner(); return; }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]});
      const tick = async () => {
        if (!videoRef.current||!streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length>0) { const code=barcodes[0].rawValue; stopScanner(); setForm(f=>({...f,isbn:code})); lookupISBN(code); return; }
        } catch {}
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch { showToast("No s'ha pogut accedir a la càmera"); setScanning(false); }
  };

  const handleIsbnPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!("BarcodeDetector" in window)) { showToast("Scanner no disponible"); return; }
    try {
      const img = new Image(); img.src = URL.createObjectURL(file);
      await new Promise(r=>{img.onload=r;});
      const detector = new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e"]});
      const barcodes = await detector.detect(img);
      if (barcodes.length>0) { const code=barcodes[0].rawValue; setForm(f=>({...f,isbn:code})); lookupISBN(code); }
      else showToast("No s'ha detectat cap ISBN");
    } catch { showToast("Error processant la imatge"); }
    e.target.value="";
  };

  // ── Cloudinary ────────────────────────────────────────────
  const uploadToCloudinary = async (file) => {
    const fd = new FormData();
    fd.append("file",file); fd.append("upload_preset",CLOUDINARY_PRESET);
    const res  = await fetch(CLOUDINARY_UPLOAD,{method:"POST",body:fd});
    const data = await res.json();
    return data.secure_url||null;
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFoto(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) { setForm(f=>({...f,foto_url:url})); showToast("Foto pujada ✓"); }
      else showToast("Error pujant la foto");
    } catch { showToast("Error pujant la foto"); }
    setUploadingFoto(false); e.target.value="";
  };

  // ── Portada des de detall ─────────────────────────────────
  const portadaGoogleBooks = async () => {
    const isbn = selected?.isbn; if (!isbn) { showToast("Aquest llibre no té ISBN"); return; }
    try {
      const res  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const data = await res.json();
      const imgUrl = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace("http://","https://")
                  || data.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail?.replace("http://","https://");
      if (!imgUrl) { showToast("No s'ha trobat portada"); return; }
      const {error} = await supabase.from("books").update({foto_url:imgUrl}).eq("id",selected.id);
      if (!error) {
        const updated={...selected,foto_url:imgUrl};
        setSelected(updated); setBooks(bs=>bs.map(b=>b.id===selected.id?updated:b));
        setPortadaKey(k=>k+1); showToast("Portada actualitzada ✓");
      }
    } catch { showToast("Error buscant portada"); }
  };

  const portadaURL = async () => {
    const url = urlInputVal.trim(); if (!url) return;
    setUploadingPortada(true);
    const {error} = await supabase.from("books").update({foto_url:url}).eq("id",selected.id);
    if (!error) {
      const updated={...selected,foto_url:url};
      setSelected(updated); setBooks(bs=>bs.map(b=>b.id===selected.id?updated:b));
      setPortadaKey(k=>k+1); setShowUrlInput(false); setUrlInputVal(""); showToast("Portada actualitzada ✓");
    }
    setUploadingPortada(false);
  };

  const handlePortadaFoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPortada(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        const {error} = await supabase.from("books").update({foto_url:url}).eq("id",selected.id);
        if (!error) {
          const updated={...selected,foto_url:url};
          setSelected(updated); setBooks(bs=>bs.map(b=>b.id===selected.id?updated:b));
          setPortadaKey(k=>k+1); showToast("Foto pujada ✓");
        }
      } else showToast("Error pujant la foto");
    } catch { showToast("Error pujant la foto"); }
    setUploadingPortada(false); e.target.value="";
  };

  // ── CRUD ──────────────────────────────────────────────────
  const desar = async () => {
    if (!form.titol?.trim()||!form.autor?.trim()) { showToast("Títol i autor són obligatoris"); return; }
    setSaving(true);
    const payload = {
      titol:form.titol.trim(), autor:form.autor.trim(),
      any_publicacio:form.any_publicacio?parseInt(form.any_publicacio):null,
      seccio:form.seccio, estat:form.estat, puntuacio:form.puntuacio||null,
      isbn:form.isbn?.trim()||null, format:form.format,
      notes:form.notes?.trim()||null, resum:form.resum?.trim()||null,
      foto_url:form.foto_url?.trim()||null,
      serie:form.serie?.trim()||null,
      num_serie:form.num_serie?parseInt(form.num_serie):null,
    };
    if (modal==="add") {
      if (payload.isbn) {
        const {data:dup} = await supabase.from("books").select("id,titol").eq("isbn",payload.isbn).maybeSingle();
        if (dup) { showToast(`ISBN duplicat: "${dup.titol}"`); setSaving(false); return; }
      }
      const {error} = await supabase.from("books").insert([payload]);
      if (!error) { showToast("Llibre afegit ✓"); fetchBooks(); tancar(); } else showToast("Error en desar");
    } else {
      const {error} = await supabase.from("books").update(payload).eq("id",selected.id);
      if (!error) { showToast("Canvis desats ✓"); fetchBooks(); setSelected({...selected,...payload}); setModal("detail"); }
      else showToast("Error en desar");
    }
    setSaving(false);
  };

  const eliminar = async () => {
    setConfirm(false);
    const {error} = await supabase.from("books").delete().eq("id",selected.id);
    if (!error) { showToast("Llibre eliminat"); fetchBooks(); tancar(); } else showToast("Error en eliminar");
  };

  const getPortada = (b) => { if (!b) return null; if (b.foto_url) return b.foto_url; return getOpenLibraryUrl(b.isbn); };

  const formatSerie = (b) => {
    if (!b?.serie) return null;
    return b.num_serie ? `${b.serie} #${b.num_serie}` : b.serie;
  };

  // ── Login ─────────────────────────────────────────────────
  if (!logat) return (
    <>
      <style>{styles}</style>
      <div className="login-screen">
        <div className="login-logo"><LogoSVG/></div>
        <div className="login-sub">Col·lecció de novel·la negra</div>
        <input className="login-input" type="password" placeholder="·····" value={pwd}
          onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} autoFocus/>
        <button className="login-btn" onClick={login}>Entrar</button>
        {pwdError&&<div className="login-error">Contrasenya incorrecta</div>}
      </div>
    </>
  );

  // ── Form ──────────────────────────────────────────────────
  const renderForm = () => (
    <>
      <div className="modal-handle"/>
      <div className="modal-title">{modal==="add"?"Afegir llibre":"Editar llibre"}</div>

      {/* ISBN */}
      <div className="form-group">
        <label className="form-label">ISBN</label>
        <div className="isbn-row">
          <input className="form-input" value={form.isbn||""} onChange={e=>setForm(f=>({...f,isbn:e.target.value}))} placeholder="9788432228773"/>
          <button className="btn-scan" onClick={startScanner}>📷</button>
          <button className="btn-lookup" onClick={()=>lookupISBN()}>Buscar</button>
        </div>
        {lookupStatus&&<div className={`lookup-badge lookup-${lookupStatus}`}>{lookupMsg}</div>}
        {scanning&&(
          <>
            <div className="scanner-hint">Centra el codi de barres dins del rectangle</div>
            <div className="scanner-wrapper">
              <video ref={videoRef} playsInline muted autoPlay style={{width:"100%",display:"block",maxHeight:"280px",objectFit:"cover"}}/>
              <div className="scanner-frame-inner"/>
            </div>
            <button className="btn-stop-scan" onClick={stopScanner}>Aturar scanner</button>
          </>
        )}
        <input ref={isbnInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleIsbnPhoto}/>
      </div>

      <div className="form-group"><label className="form-label">Títol *</label><input className="form-input" value={form.titol||""} onChange={e=>setForm(f=>({...f,titol:e.target.value}))} placeholder="Títol del llibre"/></div>
      <div className="form-group"><label className="form-label">Autor *</label><input className="form-input" value={form.autor||""} onChange={e=>setForm(f=>({...f,autor:e.target.value}))} placeholder="Nom de l'autor/a"/></div>

      {/* Sèrie */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Sèrie</label>
          <input className="form-input" value={form.serie||""} onChange={e=>setForm(f=>({...f,serie:e.target.value}))} placeholder="Ex: Wallander"/>
        </div>
        <div className="form-group" style={{maxWidth:"90px"}}>
          <label className="form-label">Núm.</label>
          <input className="form-input" type="number" min="1" value={form.num_serie||""} onChange={e=>setForm(f=>({...f,num_serie:e.target.value}))} placeholder="#"/>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group"><label className="form-label">Any</label><input className="form-input" type="number" value={form.any_publicacio||""} onChange={e=>setForm(f=>({...f,any_publicacio:e.target.value}))} placeholder="Any"/></div>
        <div className="form-group"><label className="form-label">Format</label><select className="form-select" value={form.format||"Paper"} onChange={e=>setForm(f=>({...f,format:e.target.value}))}>{FORMATS.map(f=><option key={f}>{f}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Secció</label><select className="form-select" value={form.seccio||"Negre"} onChange={e=>setForm(f=>({...f,seccio:e.target.value}))}>{SECCIONS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Estat</label><select className="form-select" value={form.estat||"No llegit"} onChange={e=>setForm(f=>({...f,estat:e.target.value}))}>{ESTATS.map(s=><option key={s}>{s}</option>)}</select></div>
      </div>
      <div className="form-group">
        <label className="form-label">Puntuació</label>
        <div className="stars-input">{[1,2,3,4,5].map(n=><button key={n} className="star-btn" onClick={()=>setForm(f=>({...f,puntuacio:f.puntuacio===n?null:n}))}>{(form.puntuacio||0)>=n?"★":"☆"}</button>)}</div>
      </div>

      {/* Foto */}
      <div className="form-group">
        <label className="form-label">Foto portada</label>
        <div className="foto-row">
          {form.foto_url?<img src={form.foto_url} alt="portada" className="foto-preview"/>:<div className="foto-preview-ph">📷</div>}
          <div className="foto-btns">
            <button className="btn-foto" onClick={()=>fotoInputRef.current?.click()} disabled={uploadingFoto}>{uploadingFoto?"Pujant...":"📷 Fer foto / triar imatge"}</button>
            {form.foto_url&&<button className="btn-foto-sec" onClick={()=>setForm(f=>({...f,foto_url:""}))}>Treure foto</button>}
          </div>
        </div>
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFotoChange}/>
      </div>

      {/* Resum */}
      <div className="form-group">
        <label className="form-label">Resum</label>
        <div className="resum-row">
          {form.resum
            ? <div className="resum-box">{form.resum}</div>
            : <div className="resum-box" style={{color:"var(--text-muted)",fontStyle:"normal"}}>Sense resum</div>
          }
          <button className="btn-ia" onClick={handleGenerarResum} disabled={generantResum}>
            {generantResum?"...":"✨ IA"}
          </button>
        </div>
        {form.resum&&<button style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer"}} onClick={()=>setForm(f=>({...f,resum:""}))}>Esborrar resum</button>}
      </div>

      <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Impressions, cites, comentaris..."/></div>
      <div className="btn-row">
        <button className="btn btn-secondary" onClick={tancar}>Cancel·lar</button>
        <button className="btn btn-primary" onClick={desar} disabled={saving}>{saving?"Desant...":"Desar"}</button>
      </div>
    </>
  );

  // ── Detail ────────────────────────────────────────────────
  const renderDetail = () => {
    const b = selected; if (!b) return null;
    const portada = getPortada(b);
    const ec = ESTAT_COLORS[b.estat]||"#5a5a5a";
    const serieLabel = formatSerie(b);
    return (
      <>
        <div className="modal-handle"/>
        {portada?<img key={portadaKey} src={portada} alt={b.titol} className="detail-cover" onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>:null}
        <div className="detail-cover-ph" style={{display:portada?"none":"flex"}}>🔍</div>

        {/* Botons portada */}
        <div className="portada-btns">
          <button className="portada-btn" onClick={portadaGoogleBooks} disabled={uploadingPortada}>🔍 Google</button>
          <button className="portada-btn" onClick={()=>{setShowUrlInput(v=>!v);setUrlInputVal("");}}>🔗 URL</button>
          <button className="portada-btn" onClick={()=>portadaInputRef.current?.click()} disabled={uploadingPortada}>📷 {uploadingPortada?"Pujant...":"Foto"}</button>
          {b.foto_url&&<button className="portada-btn" style={{color:"var(--red)"}} onClick={async()=>{
            await supabase.from("books").update({foto_url:null}).eq("id",b.id);
            const u={...b,foto_url:null}; setSelected(u); setBooks(bs=>bs.map(x=>x.id===b.id?u:x)); setPortadaKey(k=>k+1); showToast("Foto eliminada");
          }}>✕ Treure</button>}
        </div>
        {showUrlInput&&<div className="url-input-row"><input value={urlInputVal} onChange={e=>setUrlInputVal(e.target.value)} placeholder="https://..." onKeyDown={e=>e.key==="Enter"&&portadaURL()}/><button onClick={portadaURL}>OK</button></div>}
        <input ref={portadaInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePortadaFoto}/>

        <div className="detail-titol">{b.titol}</div>
        <div className="detail-autor">{b.autor}{b.any_publicacio?` · ${b.any_publicacio}`:""}</div>
        {serieLabel&&<div className="detail-serie"><span className="serie-tag">📚 {serieLabel}</span></div>}

        <div className="detail-tags">
          <span className="detail-tag">{b.seccio}</span>
          <span className="detail-tag">{b.format}</span>
          <span className="detail-tag" style={{color:ec,borderColor:ec}}>{b.estat}</span>
          {b.isbn&&<span className="detail-tag">ISBN {b.isbn}</span>}
        </div>
        {b.puntuacio&&<div className="detail-stars"><Stars n={b.puntuacio}/></div>}

        {/* Resum + botó IA */}
        <div className="detail-sec-label">Resum</div>
        {b.resum
          ? <div className="detail-resum">{b.resum}</div>
          : <div className="detail-resum" style={{color:"var(--text-muted)",fontStyle:"normal"}}>Sense resum</div>
        }
        <button className="btn-ia-inline" onClick={handleGenerarResum} disabled={generantResum}>
          {generantResum?"✨ Generant resum...":"✨ Generar resum amb IA"}
        </button>

        {b.notes&&<><div className="detail-sec-label">Notes</div><div className="detail-notes">"{b.notes}"</div></>}
        <hr className="detail-divider"/>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={tancar}>Tancar</button>
          <button className="btn btn-secondary" onClick={obrirEditar}>Editar</button>
          <button className="btn btn-danger" onClick={()=>setConfirm(true)}>Eliminar</button>
        </div>
      </>
    );
  };

  // ── Targetes ──────────────────────────────────────────────
  const renderCard = (b) => {
    const portada = getPortada(b);
    const ec = ESTAT_COLORS[b.estat]||"#5a5a5a";
    const serieLabel = formatSerie(b);

    if (cols===1) return (
      <div key={b.id} className="book-card-list" onClick={()=>obrirDetall(b)}>
        {portada?<img src={portada} alt={b.titol} className="book-cover-sm" onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>:null}
        <div className="book-cover-sm-ph" style={{display:portada?"none":"flex"}}>🔍</div>
        <div className="book-info">
          <div className="book-titol">{b.titol}</div>
          {serieLabel&&<div className="book-serie-tag">📚 {serieLabel}</div>}
          <div className="book-autor">{b.autor}{b.any_publicacio?` · ${b.any_publicacio}`:""}</div>
          <div className="book-meta">
            <span className="tag">{b.seccio}</span>
            <span className="tag-estat" style={{color:ec}}>● {b.estat}</span>
            {b.puntuacio&&<Stars n={b.puntuacio}/>}
          </div>
        </div>
      </div>
    );

    return (
      <div key={b.id} className="book-card" onClick={()=>obrirDetall(b)}>
        <span className="estat-badge" style={{color:ec}}>● {b.estat}</span>
        {portada?<img src={portada} alt={b.titol} className="book-card-cover" onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>:null}
        <div className="book-card-cover-ph" style={{display:portada?"none":"flex"}}>🔍</div>
        <div className="book-card-body">
          <div className="book-card-titol">{b.titol}</div>
          {serieLabel&&<div className="book-card-serie">📚 {serieLabel}</div>}
          <div className="book-card-autor">{b.autor}</div>
          <div className="book-card-meta">
            <span className="tag-mini">{b.seccio}</span>
            {b.puntuacio&&<Stars n={b.puntuacio} mini/>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header className="header">
          <div className="header-top">
            <div className="header-logo"><LogoSVG/></div>
            <div className="header-actions">
              <button className="btn-diag" onClick={()=>setShowDiag(true)} title="Diagnòstic">🔧</button>
              <button className="btn-add" onClick={obrirAfegir}>+</button>
              <button className="btn-logout" onClick={()=>setLogat(false)}>↩</button>
            </div>
          </div>
          <input className="search-input" placeholder="Cercar per títol, autor o sèrie..." value={cerca} onChange={e=>setCerca(e.target.value)}/>
          <div className="estat-filters">
            {["Tots",...ESTATS].map(e=><button key={e} className={`estat-btn${filtreEstat===e?" active":""}`} onClick={()=>setFiltreEstat(e)}>{e}</button>)}
          </div>
          <div className="filters-row">
            <select className="filter-select" value={filtreSeccio} onChange={e=>setFiltreSeccio(e.target.value)}>
              <option value="Totes">Totes les seccions</option>
              {SECCIONS.map(s=><option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={ordre} onChange={e=>setOrdre(e.target.value)}>
              {ORDRES.map(o=><option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
          </div>
        </header>

        <div className="stats-bar">
          <div className="stat-item"><span className="stat-num">{total}</span><span className="stat-label">Total</span></div>
          <div className="stat-item"><span className="stat-num">{llegits}</span><span className="stat-label">Llegits</span></div>
          <div className="stat-item"><span className="stat-num">{llegint}</span><span className="stat-label">Llegint</span></div>
          <div className="stat-item"><span className="stat-num">{total-llegits}</span><span className="stat-label">Pendents</span></div>
        </div>

        {(cerca||filtreEstat!=="Tots"||filtreSeccio!=="Totes")&&(
          <div className="results-count">{booksFiltrats.length} {booksFiltrats.length===1?"resultat":"resultats"}</div>
        )}

        <div className="books-grid" style={{gridTemplateColumns:`repeat(${cols},1fr)`}}>
          {loading?(<div className="empty"><div className="empty-icon">⏳</div></div>)
          :booksFiltrats.length===0?(<div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">{books.length===0?"Encara no hi ha llibres. Afegeix el primer!":"Cap resultat"}</div></div>)
          :booksFiltrats.map(b=>renderCard(b))}
        </div>

        {modal&&(
          <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)tancar();}}>
            <div className="modal">{modal==="detail"?renderDetail():renderForm()}</div>
          </div>
        )}

        {confirm&&(
          <div className="confirm-overlay">
            <div className="confirm-box">
              <p>Eliminar <strong>"{selected?.titol}"</strong>?<br/>Aquesta acció no es pot desfer.</p>
              <div className="confirm-row">
                <button className="btn btn-secondary" onClick={()=>setConfirm(false)}>Cancel·lar</button>
                <button className="btn btn-danger" onClick={eliminar}>Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal diagnòstic */}
        {showDiag && (() => {
          // Càlculs
          const sensePor  = books.filter(b => !b.foto_url && !b.isbn);
          const senseIsbn = books.filter(b => !b.isbn);
          const senseRes  = books.filter(b => !b.resum);
          // Duplicats per ISBN
          const isbnCount = {};
          books.forEach(b => { if (b.isbn) isbnCount[b.isbn] = (isbnCount[b.isbn]||0)+1; });
          const duplicats = books.filter(b => b.isbn && isbnCount[b.isbn] > 1);
          // Duplicats per títol+autor
          const titolCount = {};
          books.forEach(b => {
            const k = `${b.titol?.toLowerCase().trim()}||${b.autor?.toLowerCase().trim()}`;
            titolCount[k] = (titolCount[k]||0)+1;
          });
          const dupTitol = books.filter(b => {
            const k = `${b.titol?.toLowerCase().trim()}||${b.autor?.toLowerCase().trim()}`;
            return titolCount[k] > 1;
          });
          const totalProblemes = duplicats.length + dupTitol.length + sensePor.length + senseRes.length;

          const anarA = (b) => { setShowDiag(false); obrirDetall(b); };

          return (
            <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowDiag(false);}}>
              <div className="modal">
                <div className="modal-handle"/>
                <div className="modal-title">🔧 Diagnòstic</div>

                {/* Resum numèric */}
                <div className="diag-summary">
                  <div className="diag-stat">
                    <div className={`diag-stat-num ${duplicats.length+dupTitol.length>0?"err":"ok"}`}>
                      {duplicats.length+dupTitol.length}
                    </div>
                    <div className="diag-stat-label">Duplicats</div>
                  </div>
                  <div className="diag-stat">
                    <div className={`diag-stat-num ${senseIsbn.length>0?"warn":"ok"}`}>
                      {senseIsbn.length}
                    </div>
                    <div className="diag-stat-label">Sense ISBN</div>
                  </div>
                  <div className="diag-stat">
                    <div className={`diag-stat-num ${sensePor.length>0?"warn":"ok"}`}>
                      {sensePor.length}
                    </div>
                    <div className="diag-stat-label">Sense portada</div>
                  </div>
                  <div className="diag-stat">
                    <div className={`diag-stat-num ${senseRes.length>0?"warn":"ok"}`}>
                      {senseRes.length}
                    </div>
                    <div className="diag-stat-label">Sense resum</div>
                  </div>
                </div>

                {totalProblemes === 0 && (
                  <div style={{textAlign:"center",color:"var(--green)",padding:"12px 0 20px",fontSize:"14px"}}>
                    ✓ Tot correcte! Cap problema detectat.
                  </div>
                )}

                {/* Duplicats ISBN */}
                {duplicats.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title err">🔴 Duplicats per ISBN ({duplicats.length})</div>
                    {duplicats.map(b=>(
                      <div key={b.id} className="diag-item" onClick={()=>anarA(b)}>
                        <span className="diag-item-titol">{b.titol}</span>
                        <span className="diag-item-autor">ISBN {b.isbn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Duplicats títol */}
                {dupTitol.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title err">🔴 Duplicats per títol+autor ({dupTitol.length})</div>
                    {dupTitol.map(b=>(
                      <div key={b.id} className="diag-item" onClick={()=>anarA(b)}>
                        <span className="diag-item-titol">{b.titol}</span>
                        <span className="diag-item-autor">{b.autor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sense ISBN */}
                {senseIsbn.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title warn">🟡 Sense ISBN ({senseIsbn.length})</div>
                    {senseIsbn.map(b=>(
                      <div key={b.id} className="diag-item" onClick={()=>anarA(b)}>
                        <span className="diag-item-titol">{b.titol}</span>
                        <span className="diag-item-autor">{b.autor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sense portada */}
                {sensePor.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title warn">🟡 Sense portada ni ISBN ({sensePor.length})</div>
                    {sensePor.map(b=>(
                      <div key={b.id} className="diag-item" onClick={()=>anarA(b)}>
                        <span className="diag-item-titol">{b.titol}</span>
                        <span className="diag-item-autor">{b.autor}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sense resum */}
                {senseRes.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title warn">🟡 Sense resum ({senseRes.length})</div>
                    {senseRes.map(b=>(
                      <div key={b.id} className="diag-item" onClick={()=>anarA(b)}>
                        <span className="diag-item-titol">{b.titol}</span>
                        <span className="diag-item-autor">{b.autor}</span>
                      </div>
                    ))}
                  </div>
                )}

                <hr className="diag-divider"/>
                <button className="btn btn-secondary" style={{width:"100%"}} onClick={()=>setShowDiag(false)}>Tancar</button>
              </div>
            </div>
          );
        })()}

        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
