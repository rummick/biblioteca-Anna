import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://ptmartuivivhavzgbnvw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0bWFydHVpdml2aGF2emdibnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MDI1ODMsImV4cCI6MjA1OTI3ODU4M30.s8F3YM7Hn4L9vK2pX1mQwRjNtDcEuAoB6iZlGsPbVYk";
const ANTHROPIC_KEY = ""; // deixar buit — s'usa via proxy de Vercel si es configura

// ── CLOUDINARY ──
const CLOUDINARY_CLOUD = "dyup2h4mh";
const CLOUDINARY_PRESET = "ml_per_defecte";
const uploadToCloudinary = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder", "biblioteca");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Error pujant a Cloudinary");
  const data = await res.json();
  return data.secure_url;
};

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
// Sèries de novel·la negra per color
const SAGA_MAP = {
  // Nesbo — Harry Hole
  'NOR-001': {saga:'Harry Hole', color:'#8b1a1a'},
  'NOR-002': {saga:'Harry Hole', color:'#8b1a1a'},
  'NOR-003': {saga:'Harry Hole', color:'#8b1a1a'},
  'NOR-004': {saga:'Harry Hole', color:'#8b1a1a'},
  'NOR-005': {saga:'Harry Hole', color:'#8b1a1a'},
  'NOR-006': {saga:'Harry Hole', color:'#8b1a1a'},
  // Larsson — Millennium
  'SWE-001': {saga:'Millennium', color:'#1a4a8b'},
  'SWE-002': {saga:'Millennium', color:'#1a4a8b'},
  'SWE-003': {saga:'Millennium', color:'#1a4a8b'},
  // Mankell — Wallander
  'SWE-010': {saga:'Wallander', color:'#2a6a2a'},
  'SWE-011': {saga:'Wallander', color:'#2a6a2a'},
  'SWE-012': {saga:'Wallander', color:'#2a6a2a'},
  // Vargas
  'FRA-001': {saga:'Adamsberg', color:'#6a2a6a'},
  'FRA-002': {saga:'Adamsberg', color:'#6a2a6a'},
  // Redondo — Baztan
  'ESP-001': {saga:'Baztan', color:'#6a4a1a'},
  'ESP-002': {saga:'Baztan', color:'#6a4a1a'},
  'ESP-003': {saga:'Baztan', color:'#6a4a1a'},
  // Montalbán — Pepe Carvalho  
  'ESP-010': {saga:'Carvalho', color:'#8b6a1a'},
  'ESP-011': {saga:'Carvalho', color:'#8b6a1a'},
  'ESP-012': {saga:'Carvalho', color:'#8b6a1a'},
};
// DUMMY per compatibilitat (no s'usa a Anna)


const getSaga = (id_estanteria) => SAGA_MAP[id_estanteria] || null;

const UNIVERS_NOMS = {
  'UNI-PKD-01':'Trilogia VALIS','UNI-PKD-02':'Palmer Eldritch','UNI-PKD-03':'Univers Ubik',
  'UNI-PKD-04':'Androides','UNI-PKD-05':'Suburbi americà','UNI-PKD-06':'Simulacra',
  'UNI-PKD-07':'Temps / Precog','UNI-PKD-08':'Distopies militars','UNI-PKD-09':'Scanner / Drogues',
  'UNI-PKD-10':'Gnosi / Realitat','UNI-LEM-01':'Ijon Tichy','UNI-LEM-02':'Pilot Pirx',
  'UNI-LEM-03':'Trurl i Klapaucius','UNI-LEM-04':'Independent','UNI-ASI-01':'Robots',
  'UNI-ASI-02':'Fundació','UNI-ASI-03':'Galàctic','UNI-ASI-04':'Independent',
};
const AUTORS_RELATS = [
  { id: "AUT001", label: "Christie" },
  { id: "AUT002", label: "Larsson" },
  { id: "AUT003", label: "Nesbø" },
  { id: "AUT004", label: "Läckberg" },
  { id: "AUT005", label: "Vargas" },
  { id: "AUT007", label: "Mankell" },
  { id: "AUT008", label: "Montalbán" },
  { id: "AUT010", label: "Redondo" },
];

// ── PRIMERA EDICIÓ ──
const isPrimeraEdicio = (ed) => {
  if (ed?.primera_edicio === true) return true;
  if (ed?.primera_edicio === false) return false; // correcció manual
  // Auto: any_edicion dins ±1 any de ano_obra
  if (ed?.ano_edicion && ed?.ano_obra) return ed.ano_edicion <= ed.ano_obra + 1;
  return false;
};

// ── OBRA COMPLETA HARDCODED (per autors principals) ──────────
const OBRA_COMPLETA = {
  'NES': [ // Jo Nesbø
    { grup: "Harry Hole", items: [
      {any:1997, titol:"El murciélago"}, {any:1997, titol:"Cucarachas"},
      {any:1998, titol:"El hombre murciélago"}, {any:2000, titol:"Petirrojo"},
      {any:2002, titol:"Némesis"}, {any:2003, titol:"El diablo de Oslo"},
      {any:2005, titol:"El redentor"}, {any:2007, titol:"El muñeco de nieve"},
      {any:2009, titol:"El leopardo"}, {any:2011, titol:"Fantasma"},
      {any:2013, titol:"Policía"}, {any:2015, titol:"Sed"},
      {any:2017, titol:"Cuchillo"}, {any:2021, titol:"Matadero 12"},
    ]},
    { grup: "Standalone", items: [
      {any:2002, titol:"El reino"}, {any:2014, titol:"Sangre"},
    ]},
  ],
  'LAR': [ // Stieg Larsson
    { grup: "Millennium", items: [
      {any:2005, titol:"Los hombres que no amaban a las mujeres"},
      {any:2006, titol:"La chica que soñaba con una cerilla y un bidón de gasolina"},
      {any:2007, titol:"La reina en el palacio de las corrientes de aire"},
    ]},
  ],
  'MAN': [ // Henning Mankell
    { grup: "Wallander", items: [
      {any:1991, titol:"Asesinos sin rostro"}, {any:1992, titol:"Los perros de Riga"},
      {any:1993, titol:"La leona blanca"}, {any:1994, titol:"El hombre sonriente"},
      {any:1995, titol:"La falsa pista"}, {any:1996, titol:"La quinta mujer"},
      {any:1997, titol:"Pisando los talones"}, {any:1998, titol:"Cortafuegos"},
      {any:2002, titol:"Antes de que hiele"}, {any:2009, titol:"El hombre inquieto"},
    ]},
  ],
  'CHR': [ // Agatha Christie
    { grup: "Hèrcules Poirot", items: [
      {any:1920, titol:"El misterioso caso de Styles"}, {any:1926, titol:"El asesinato de Roger Ackroyd"},
      {any:1934, titol:"Asesinato en el Orient Express"}, {any:1936, titol:"Muerte en el Nilo"},
      {any:1939, titol:"Diez negritos"}, {any:1952, titol:"Los testigos mudos"},
    ]},
    { grup: "Miss Marple", items: [
      {any:1930, titol:"El misterio de la guía de ferrocarriles"},
      {any:1942, titol:"El cuerpo en la biblioteca"},
      {any:1950, titol:"Un cadáver en la biblioteca"},
    ]},
  ],
}
};
const AUTORS_RELATS = [
  { id: "AUT013", label: "Dick" },
  { id: "AUT028", label: "Lem" },
  { id: "AUT001", label: "Asimov" },
];

// ── PRIMERA EDICIÓ ──
const isPrimeraEdicio = (ed) => {
  if (ed?.primera_edicio === true) return true;
  if (ed?.primera_edicio === false) return false; // correcció manual
  // Auto: any_edicion dins ±1 any de ano_obra
  if (ed?.ano_edicion && ed?.ano_obra) return ed.ano_edicion <= ed.ano_obra + 1;
  return false;
};

// ── OBRA COMPLETA HARDCODED (per autors principals) ──────────
const OBRA_COMPLETA = {
  'AUT024': [ // Frank Herbert
    { grup: "Sèrie Dune", items: [
      {any:1965, titol:"Dune"}, {any:1969, titol:"El Mesías de Dune"},
      {any:1976, titol:"Hijos de Dune"}, {any:1981, titol:"Dios Emperador de Dune"},
      {any:1984, titol:"Herejes de Dune"}, {any:1985, titol:"Casa Capitular Dune"},
    ]},
    { grup: "Novel·les independents", items: [
      {any:1966, titol:"El Santaroga Barrier"}, {any:1972, titol:"El experimento Dosadi"},
      {any:1977, titol:"El ojo del ojo"}, {any:1979, titol:"Cazadores de sueños"},
    ]},
  ],
  'AUT010': [ // Arthur C. Clarke
    { grup: "Novel·les principals", items: [
      {any:1953, titol:"El fin de la infancia"}, {any:1956, titol:"La ciudad y las estrellas"},
      {any:1968, titol:"2001: Una odisea espacial"}, {any:1973, titol:"Cita con Rama"},
      {any:1979, titol:"Las fuentes del paraíso"}, {any:1986, titol:"2010: Odisea dos"},
      {any:1987, titol:"Cánticos de la lejana Tierra"},
    ]},
  ],
  'AUT050': [ // J.R.R. Tolkien
    { grup: "Terra Mitjana", items: [
      {any:1937, titol:"El Hobbit"}, {any:1954, titol:"El Señor de los Anillos"},
      {any:1977, titol:"El Silmarillion"}, {any:1980, titol:"Cuentos incompletos"},
      {any:1984, titol:"El libro de los cuentos perdidos I"},
      {any:1984, titol:"El libro de los cuentos perdidos II"},
    ]},
    { grup: "Obres curtes", items: [
      {any:1949, titol:"Egidio el granjero de Ham"}, {any:1998, titol:"Roverandom"},
    ]},
  ],
  'AUT033': [ // Ursula K. Le Guin
    { grup: "Cicle de l'Ekumen", items: [
      {any:1966, titol:"El mundo de Rocannon"}, {any:1968, titol:"La mano izquierda de la oscuridad"},
      {any:1974, titol:"Los desposeídos"}, {any:1975, titol:"La palabra de desenterrar"},
    ]},
    { grup: "Terramar", items: [
      {any:1968, titol:"Un mago de Terramar"}, {any:1971, titol:"Las tumbas de Atuan"},
      {any:1972, titol:"En el otro viento"},
    ]},
  ],
  'AUT032': [ // Ray Bradbury
    { grup: "Novel·les i reculls principals", items: [
      {any:1950, titol:"Crónicas marcianas"}, {any:1951, titol:"El hombre ilustrado"},
      {any:1953, titol:"Fahrenheit 451"}, {any:1962, titol:"Something Wicked This Way Comes"},
      {any:1969, titol:"I Sing the Body Electric"},
    ]},
  ],
  'AUT034': [ // George Orwell
    { grup: "Novel·les principals", items: [
      {any:1945, titol:"Rebelión en la granja"}, {any:1949, titol:"1984"},
      {any:1933, titol:"Sin blanca en París y Londres"}, {any:1938, titol:"Homenaje a Cataluña"},
    ]},
  ],
  'AUT035': [ // Aldous Huxley
    { grup: "Novel·les principals", items: [
      {any:1932, titol:"Un mundo feliz"}, {any:1962, titol:"La isla"},
      {any:1936, titol:"Ciego en Gaza"}, {any:1923, titol:"Crudo amarillo"},
    ]},
    { grup: "Assaig", items: [
      {any:1958, titol:"Nueva visita a un mundo feliz"},
    ]},
  ],
  'AUT036': [ // Terry Pratchett
    { grup: "Discworld", items: [
      {any:1983, titol:"El color de la magia"}, {any:1986, titol:"La luz fantástica"},
      {any:1987, titol:"Ritos iguales"}, {any:1987, titol:"Mort"},
      {any:1989, titol:"¡Guardias! ¡Guardias!"}, {any:1991, titol:"Brujas de viaje"},
      {any:1992, titol:"Dioses menores"}, {any:1996, titol:"Hogfather"},
    ]},
  ],
  'AUT013': [ // Philip K. Dick
    { grup: "Novel·les SF principals", items: [
      {any:1955, titol:"Lotería solar"}, {any:1962, titol:"El hombre en el castillo"},
      {any:1964, titol:"Los tres estigmas de Palmer Eldritch"}, {any:1966, titol:"Tiempo de Marte"},
      {any:1968, titol:"¿Sueñan los androides con ovejas eléctricas?"}, {any:1969, titol:"Ubik"},
      {any:1970, titol:"Una mirada a la oscuridad"}, {any:1974, titol:"Fluyan mis lágrimas, dijo el policía"},
      {any:1981, titol:"VALIS"}, {any:1981, titol:"La invasión divina"},
      {any:1982, titol:"La transmigración de Timothy Archer"},
    ]},
    { grup: "Novel·les mainstream", items: [
      {any:1960, titol:"Confesiones de un artista de mierda"}, {any:1975, titol:"Voces desde la calle"},
    ]},
    { grup: "Reculls destacats", items: [
      {any:1987, titol:"Cuentos completos I-V (Minotauro)"}, {any:1987, titol:"The Golden Man"},
    ]},
  ],
  'AUT001': [ // Isaac Asimov
    { grup: "Sèrie Fundació", items: [
      {any:1951, titol:"Fundación"}, {any:1952, titol:"Fundación e Imperio"},
      {any:1953, titol:"Segunda Fundación"}, {any:1982, titol:"Los límites de la Fundación"},
      {any:1986, titol:"Fundación y Tierra"}, {any:1988, titol:"Preludio a la Fundación"},
      {any:1993, titol:"Hacia la Fundación"},
    ]},
    { grup: "Sèrie Robots", items: [
      {any:1950, titol:"Yo, Robot"}, {any:1954, titol:"Las bóvedas de acero"},
      {any:1957, titol:"El sol desnudo"}, {any:1983, titol:"Los robots del amanecer"},
      {any:1985, titol:"Robots e Imperio"},
    ]},
    { grup: "Novel·les independents", items: [
      {any:1955, titol:"El fin de la eternidad"}, {any:1972, titol:"Los propios dioses"},
    ]},
    { grup: "Reculls", items: [
      {any:1974, titol:"Antes de la Edad de Oro"}, {any:1986, titol:"Cuentos paralelos"},
    ]},
  ],
  'AUT028': [ // Stanislaw Lem
    { grup: "Novel·les principals", items: [
      {any:1961, titol:"Solaris"}, {any:1964, titol:"El Invencible"},
      {any:1968, titol:"La voz de su amo"}, {any:1971, titol:"Retorno de las estrellas"},
      {any:1973, titol:"El congreso de futurología"}, {any:1976, titol:"Memorias encontradas en una bañera"},
    ]},
    { grup: "Sèrie Ijon Tichy", items: [
      {any:1957, titol:"Diarios de las estrellas"}, {any:1971, titol:"Las memorias de Ijon Tichy"},
    ]},
    { grup: "Sèrie Pilot Pirx", items: [
      {any:1968, titol:"Relatos del piloto Pirx"}, {any:1973, titol:"Más relatos del piloto Pirx"},
    ]},
    { grup: "Sèrie Trurl i Klapaucius", items: [
      {any:1965, titol:"Ciberiada"}, {any:1967, titol:"El libro de los robots"},
    ]},
    { grup: "Reculls i assaigs", items: [
      {any:1971, titol:"Un valor imaginario"}, {any:1984, titol:"Vacío perfecto"},
    ]},
  ],
};

// ── TOUR DE LECTURA — ordre recomanat per secció ─────────────
const TOUR_LECTURA = {
  'HER': [
    { titol:"Dune", nota:"El millor punt d'entrada. Épica total." },
    { titol:"El Mesías de Dune", nota:"Gir fosc. Més filosòfic." },
    { titol:"Hijos de Dune", nota:"La saga s'expandeix." },
    { titol:"Dios Emperador de Dune", nota:"El més dens. Filosofia política." },
    { titol:"Herejes de Dune", nota:"Nou direcció. Molt entretenida." },
    { titol:"Casa Capitular Dune", nota:"Tancament. Final obert." },
  ],
  'CLA': [
    { titol:"El fin de la infancia", nota:"El millor de Clarke. CF filosòfica." },
    { titol:"2001: Una odisea espacial", nota:"Icònic. Llegir abans de veure el film." },
    { titol:"Cita con Rama", nota:"CF dura. Molt visual." },
    { titol:"Cánticos de la lejana Tierra", nota:"Poètic i melancòlic." },
  ],
  'TOL': [
    { titol:"El Hobbit", nota:"El punt d'entrada perfecte." },
    { titol:"El Señor de los Anillos", nota:"L'obra cabdal. Llegir en ordre." },
    { titol:"El Silmarillion", nota:"Per als completistes. Mitologia pura." },
  ],
  'PKD': [
    { titol:"El hombre en el castillo", nota:"El millor punt d'entrada. Hugo 1963." },
    { titol:"¿Sueñan los androides con ovejas eléctricas?", nota:"Base de Blade Runner. CF filosòfica." },
    { titol:"Ubik", nota:"La seva obra més complexa i pertorbadora." },
    { titol:"Los tres estigmas de Palmer Eldritch", nota:"Drogues, realitat alterada, horror còsmic." },
    { titol:"Fluyan mis lágrimas, dijo el policía", nota:"Distopia personal. Molt accessibble." },
    { titol:"Una mirada a la oscuridad", nota:"Autobiogràfica. Drogues i paranoia." },
    { titol:"VALIS", nota:"Inici de la Trilogia. Filosofia i mística." },
    { titol:"La invasión divina", nota:"Trilogia VALIS II." },
    { titol:"La transmigración de Timothy Archer", nota:"Trilogia VALIS III. El més literari." },
  ],
  'ASI': [
    { titol:"Yo, Robot", nota:"Introducció als robots. Relats interconnectats." },
    { titol:"Las bóvedas de acero", nota:"Robot + detectiu. Molt entretingut." },
    { titol:"El sol desnudo", nota:"Continuació de Las bóvedas." },
    { titol:"Fundación", nota:"Inici de l'èpica. Imprescindible." },
    { titol:"Fundación e Imperio", nota:"La saga s'accelera." },
    { titol:"Segunda Fundación", nota:"Tancament magistral de la trilogia clàssica." },
    { titol:"Los propios dioses", nota:"La seva millor novel·la independent. Hugo+Nébula." },
    { titol:"El fin de la eternidad", nota:"Viatge en el temps. Brillant." },
    { titol:"Los límites de la Fundación", nota:"Represa 30 anys després." },
    { titol:"Robots e Imperio", nota:"Unió dels dos universos." },
  ],
  'LEM': [
    { titol:"Solaris", nota:"La seva obra mestra. CF filosòfica pura." },
    { titol:"Ciberiada", nota:"Humor i filosofia. Molt accessible." },
    { titol:"Diarios de las estrellas", nota:"Aventures d'Ijon Tichy. Satírica." },
    { titol:"El Invencible", nota:"CF dura. Molt cinematogràfica." },
    { titol:"Relatos del piloto Pirx", nota:"Humanisme i tecnologia." },
    { titol:"El congreso de futurología", nota:"Distopia satírica. Visionària." },
    { titol:"La voz de su amo", nota:"Contacte extraterrestre. Pessimista i genial." },
  ],
};
const SECCIONS_GRUPS = [
  { grup: "Novel·la Negra", items: [
    { id: "NEG-SCA", label: "Escandinava" }, { id: "NEG-ANG", label: "Anglosaxona" },
    { id: "NEG-ESP", label: "Espanyola" }, { id: "NEG-CAT", label: "Catalana" },
    { id: "NEG-USA", label: "Nord-americana" }, { id: "NEG-FRA", label: "Francesa" },
    { id: "NEG-ITA", label: "Italiana" }, { id: "NEG-ALE", label: "Alemanya" },
    { id: "NEG-LAT", label: "Llatinoamericana" },
  ]},
  { grup: "Thriller / Policial", items: [
    { id: "THR", label: "Thriller" }, { id: "POL", label: "Policial Clàssic" },
    { id: "CRI", label: "Crime Fiction" },
  ]},
  { grup: "Altres", items: [
    { id: "NF", label: "No Ficció" }, { id: "EBOOK", label: "eBooks" },
  ]},
];
const SECCIONS_FLAT = [{ id: "ALL", label: "Tot" }, ...SECCIONS_GRUPS.flatMap(g => g.items)];
// Mantenint compatibilitat amb filtre PKD que agrupa PKD-A/B/C/M
const getSeccioLabel = (id) => {
  if (id === "ALL") return "Tot";
  const found = SECCIONS_FLAT.find(s => s.id === id);
  return found ? found.label : id;
};
const AUTORS_FALTEN = [
  { id: "AUT003", label: "Nesbø" },
  { id: "AUT002", label: "Larsson" },
  { id: "AUT007", label: "Mankell" },
  { id: "AUT001", label: "Christie" },
  { id: "AUT004", label: "Läckberg" },
  { id: "AUT005", label: "Vargas" },
  { id: "AUT008", label: "Montalbán" },
  { id: "AUT010", label: "Redondo" },
];
const LLEGIT_OPTIONS = [
  { val: "no", icon: "○", label: "No llegit", color: "#555" },
  { val: "llegint", icon: "½", label: "Llegint", color: "#8b3a1a" },
  { val: "si", icon: "✓", label: "Llegit", color: "#6ec88e" },
];
const STARS = [1,2,3,4,5];
const APP_VERSION = "1.2.0";

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
      <div style={{ fontSize: 11, color: "#8b3a1a99", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {data.map(d => (
        <div key={d.label} style={{ marginBottom: 6, cursor: onClickBar ? "pointer" : "default" }}
          onClick={() => onClickBar && onClickBar(d)}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 2 }}>
            <span style={{ color: onClickBar ? "#8b3a1a" : "#888" }}>{d.label}</span>
            <span style={{ color: "#8b3a1a" }}>{d.val}</span>
          </div>
          <div style={{ height: 6, background: "#c4b090", borderRadius: 3 }}>
            <div style={{ height: 6, width: `${(d.val/max)*100}%`, background: onClickBar ? "#8b3a1a66" : "#8b3a1a44", borderRadius: 3, transition: "width 0.4s" }} />
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
        <span style={{ color: "#8b3a1a66", textTransform: "uppercase", fontSize: 10, letterSpacing: 1 }}>{label} </span>
        <span style={{ fontSize: 12, color: value ? "#2c1a0a" : "#333" }}>{value || "—"}</span>
      </div>
      <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 11, padding: "0 4px", flexShrink: 0 }}>✎</button>
    </div>
  );
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: "#8b3a1a66", textTransform: "uppercase", fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      {multiline
        ? <textarea value={val} onChange={e => setVal(e.target.value)} rows={4}
            style={{ width: "100%", background: "#ede8de", border: "1px solid #8b3a1a44", color: "#2c1a0a", padding: "8px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, resize: "vertical", boxSizing: "border-box" }} />
        : <input type={type} value={val} onChange={e => setVal(e.target.value)}
            style={{ width: "100%", background: "#ede8de", border: "1px solid #8b3a1a44", color: "#2c1a0a", padding: "7px 10px", fontSize: 12, fontFamily: "Georgia, serif", borderRadius: 2, boxSizing: "border-box" }} />
      }
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={save} style={{ padding: "4px 12px", background: "#8b3a1a22", border: "1px solid #8b3a1a44", color: "#8b3a1a", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }}>Desar</button>
        <button onClick={cancel} style={{ padding: "4px 12px", background: "none", border: "1px solid #1e3060", color: "#555", cursor: "pointer", fontSize: 11, borderRadius: 2, fontFamily: "Georgia, serif" }}>Cancel·lar</button>
      </div>
    </div>
  );
};

// ── STYLES ──
const S = {
  app: { minHeight: "100vh", background: "#f5f0e8", color: "#2c1a0a", fontFamily: "Georgia, serif", maxWidth: "100%", fontSize: 16 },
  header: { padding: "14px 16px 0", background: "#f5f0e8", borderBottom: "1px solid #1a2540", position: "sticky", top: 0, zIndex: 100 },
  headerTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 17, fontWeight: "bold", letterSpacing: 3, color: "#8b3a1a", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center" },
  headerRight: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: { background: "none", border: "1px solid #2a3a5a", color: "#7a5a3a", cursor: "pointer", fontSize: 13, padding: "3px 9px", borderRadius: 12, fontFamily: "Georgia, serif" },
  nav: { display: "flex" },
  navBtn: (a) => ({ flex: 1, padding: "9px 4px", background: "none", color: a ? "#8b3a1a" : "#8a6a4a", border: "none", borderBottom: `2px solid ${a ? "#8b3a1a" : "transparent"}`, cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif", letterSpacing: 1, textTransform: "uppercase" }),
  searchWrap: { padding: "10px 16px", background: "#f5f0e8", borderBottom: "1px solid #1a2540", position: "sticky", top: 83, zIndex: 99 },
  input: { width: "100%", background: "#ede8de", border: "1px solid #2a3a5a", color: "#2c1a0a", padding: "9px 12px", fontSize: 15, fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box", borderRadius: 2 },
  pills: { display: "flex", gap: 6, overflowX: "auto", padding: "8px 16px", scrollbarWidth: "none", borderBottom: "1px solid #1a2540" },
  pill: (a) => ({ padding: "4px 10px", background: a ? "#8b3a1a18" : "transparent", color: a ? "#8b3a1a" : "#8a6a4a", border: `1px solid ${a ? "#8b3a1a55" : "#d4c4a0"}`, cursor: "pointer", fontSize: 11, whiteSpace: "nowrap", fontFamily: "Georgia, serif", borderRadius: 2 }),
  statsBar: { padding: "6px 16px", fontSize: 13, color: "#8a6a4a", borderBottom: "1px solid #111", background: "#e8e2d4" },
  viewToggle: { display: "flex", gap: 4 },
  viewBtn: (a) => ({ padding: "3px 8px", background: a ? "#8b3a1a22" : "transparent", color: a ? "#8b3a1a" : "#8a6a4a", border: `1px solid ${a ? "#8b3a1a44" : "#d4c4a0"}`, cursor: "pointer", fontSize: 11, borderRadius: 2 }),
  grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, padding: 2 }),
  card: { position: "relative", aspectRatio: "2/3", overflow: "hidden", cursor: "pointer", background: "#ede8de" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.92))", padding: "18px 6px 6px" },
  cardTitle: { fontSize: 9, color: "#2c1a0a", lineHeight: 1.3, fontWeight: "bold" },
  cardShelf: { fontSize: 8, color: "#8b3a1a", marginTop: 2 },
  cardLlegit: { position: "absolute", top: 5, left: 5, fontSize: 12, textShadow: "0 0 4px black" },
  multiDot: { position: "absolute", top: 5, right: 5, background: "#8b3a1a", color: "#f5f0e8", fontSize: 8, fontWeight: "bold", padding: "1px 5px", borderRadius: 8 },
  listItem: { display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid #131f35", cursor: "pointer", alignItems: "center" },
  listImg: { width: 38, height: 57, objectFit: "cover", background: "#ede8de", flexShrink: 0 },
  listInfo: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 16, color: "#2c1a0a", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  listMeta: { fontSize: 13, color: "#8a6a4a" },
  listShelf: { fontSize: 12, color: "#8b3a1a", fontFamily: "monospace", flexShrink: 0 },
  listLlegit: { fontSize: 14, flexShrink: 0 },
  loader: { textAlign: "center", padding: 60, color: "#8a6a4a", fontSize: 12, letterSpacing: 3 },
  empty: { textAlign: "center", padding: 40, color: "#8a6a4a", fontSize: 14 },
  errMsg: { textAlign: "center", padding: 30, color: "#c44", fontSize: 13, lineHeight: 1.5 },
  detall: { padding: 20 },
  backBtn: { background: "none", border: "none", color: "#8b3a1a", cursor: "pointer", fontSize: 14, fontFamily: "Georgia, serif", padding: "0 0 14px 0" },
  edTabs: { display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" },
  edTab: (a) => ({ padding: "5px 12px", background: a ? "#8b3a1a18" : "transparent", color: a ? "#8b3a1a" : "#8a6a4a", border: `1px solid ${a ? "#8b3a1a55" : "#d4c4a0"}`, cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", borderRadius: 2 }),
  detallImgWrap: { position: "relative", marginBottom: 12 },
  detallImg: { width: "100%", maxHeight: 280, objectFit: "contain", background: "#ede8de", display: "block" },
  coverBtns: { display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 },
  coverBtn: (color) => ({ background: "none", border: `1px solid ${color}55`, color, cursor: "pointer", fontSize: 11, padding: "4px 10px", borderRadius: 2, fontFamily: "Georgia, serif" }),
  detallTitle: { fontSize: 24, color: "#d4b878", marginBottom: 6, lineHeight: 1.3, fontWeight: "bold" },
  detallOrig: { fontSize: 16, color: "#7a5a3a", fontStyle: "italic", marginBottom: 10 },
  resum: { fontSize: 15, color: "#4a3520", lineHeight: 1.7, marginBottom: 12, padding: "14px 16px", background: "#ede8de", borderLeft: "3px solid #8b3a1a55" },
  llegitRow: { display: "flex", gap: 6, alignItems: "center", marginBottom: 16, padding: "10px 14px", background: "#ede8de", borderRadius: 2, flexWrap: "wrap" },
  llegitBtn: (active, color) => ({ padding: "5px 12px", background: active ? color + "22" : "transparent", color: active ? color : "#8a6a4a", border: `1px solid ${active ? color + "66" : "#d4c4a0"}`, cursor: "pointer", fontSize: 13, borderRadius: 2, fontFamily: "Georgia, serif" }),
  starsRow: { display: "flex", gap: 4, alignItems: "center", marginLeft: "auto" },
  star: (active) => ({ fontSize: 18, cursor: "pointer", color: active ? "#8b3a1a" : "#d4c4a0" }),
  sectionTitle: { fontSize: 13, color: "#8b3a1acc", letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 10px", borderBottom: "1px solid #2a3a5a", paddingBottom: 6 },
  badge: { display: "inline-block", padding: "3px 8px", background: "#8b3a1a12", border: "1px solid #8b3a1a44", color: "#8b3a1a", fontSize: 13, marginRight: 4, marginBottom: 4, letterSpacing: 0.5, borderRadius: 2 },
  notesArea: { width: "100%", background: "#ede8de", border: "1px solid #2a3a5a", color: "#2c1a0a", padding: "10px 12px", fontSize: 13, fontFamily: "Georgia, serif", borderRadius: 2, resize: "vertical", boxSizing: "border-box", minHeight: 80 },
  deleteBtn: { width: "100%", marginTop: 24, padding: "10px", background: "none", border: "1px solid #c4444455", color: "#dd4444", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, borderRadius: 2 },
  selectorRow: { display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid #1a2540" },
  selBtn: (a) => ({ padding: "5px 10px", background: a ? "#8b3a1a" : "transparent", color: a ? "#f5f0e8" : "#7a5a3a", border: `1px solid ${a ? "#8b3a1a" : "#d4c4a0"}`, cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif", borderRadius: 2 }),
  faltenList: { padding: "0 16px" },
  faltenItem: { padding: "12px 0", borderBottom: "1px solid #1a2540", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  faltenTitle: { fontSize: 14, color: "#2c1a0a", marginBottom: 2 },
  faltenCast: { fontSize: 12, color: "#8b3a1a99", fontStyle: "italic", marginBottom: 2 },
  faltenYear: { fontSize: 13, color: "#8a6a4a" },
  tipusBadge: { fontSize: 10, color: "#8b3a1a", border: "1px solid #8b3a1a55", padding: "2px 7px", whiteSpace: "nowrap", borderRadius: 2, flexShrink: 0 },
  relatItem: { padding: "14px 16px", borderBottom: "1px solid #1a2540" },
  relatTitle: { fontSize: 14, color: "#2c1a0a", marginBottom: 4, fontStyle: "italic" },
  relatMeta: { fontSize: 12, color: "#8a6a4a", marginBottom: 5 },
  relatResum: { fontSize: 12, color: "#6a5040", lineHeight: 1.6, marginBottom: 6 },
  relatBooks: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 },
  relatBook: { fontSize: 10, color: "#7a5030", border: "1px solid #8899cc44", padding: "2px 7px", borderRadius: 2 },
  relatNoDisp: { fontSize: 10, color: "#c44", border: "1px solid #c4444433", padding: "2px 7px", borderRadius: 2, display: "inline-block", marginTop: 4 },
  univers: { display: "inline-block", fontSize: 9, color: "#8b3a1a99", border: "1px solid #8b3a1a22", padding: "1px 6px", marginLeft: 6, borderRadius: 2 },
  prestSection: { padding: "14px 16px 5px", borderBottom: "1px solid #1a2540" },
  prestSectionTitle: { fontSize: 13, color: "#8b3a1a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  prestItem: { padding: "12px 16px", borderBottom: "1px solid #131f35", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" },
  prestShelf: { fontSize: 12, color: "#8b3a1a", minWidth: 110, fontFamily: "monospace" },
  prestTitle: { fontSize: 15, color: "#2c1a0a", flex: 1 },
  prestLlegit: { fontSize: 15 },
  statsPage: { padding: 20 },
  statsTitle: { fontSize: 15, color: "#8b3a1a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20, marginTop: 0 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 },
  statCard: { background: "#ede8de", border: "1px solid #1a2540", borderRadius: 4, padding: "14px 16px", cursor: "pointer" },
  statNum: { fontSize: 28, color: "#8b3a1a", fontWeight: "bold", lineHeight: 1 },
  statLabel: { fontSize: 13, color: "#8a6a4a", marginTop: 4 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" },
  modal: { background: "#ede8de", border: "1px solid #2a3a5a", borderRadius: 6, padding: 24, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 16, color: "#8b3a1a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16, marginTop: 0 },
  modalRow: { fontSize: 15, color: "#aab0c0", marginBottom: 8, display: "flex", justifyContent: "space-between" },
  modalVal: { color: "#2c1a0a", fontWeight: "bold" },
  modalClose: { width: "100%", marginTop: 8, padding: "10px", background: "none", border: "1px solid #2a3a5a", color: "#7a5a3a", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 12, borderRadius: 2 },
  modalDivider: { borderTop: "1px solid #1a2540", margin: "14px 0" },
  modalSmall: { fontSize: 10, color: "#8a6a4a", textAlign: "center", marginTop: 8 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 12, color: "#8b3a1aaa", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 },
  formInput: { width: "100%", background: "#f5f0e8", border: "1px solid #2a3a5a", color: "#2c1a0a", padding: "8px 10px", fontSize: 15, fontFamily: "Georgia, serif", borderRadius: 2, boxSizing: "border-box", outline: "none" },
  formBtn: { width: "100%", padding: "11px", background: "#8b3a1a22", border: "1px solid #8b3a1a55", color: "#8b3a1a", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, borderRadius: 2, marginTop: 8 },
  addBtn: { position: "fixed", bottom: 20, right: 20, background: "#8b3a1a", color: "#f5f0e8", border: "none", borderRadius: "50%", width: 52, height: 52, fontSize: 26, cursor: "pointer", zIndex: 150, boxShadow: "0 4px 16px rgba(200,169,110,0.4)", display: "flex", alignItems: "center", justifyContent: "center" },
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
      const eds = await supaFetch("edicion", `?id_estanteria=ilike.${encodeURIComponent(prefix + '-%')}&select=id_estanteria&order=id_estanteria.desc&limit=50`);
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

    // ── Anti-duplicat: comprovar si l'ISBN ja existeix a la BD ──
    try {
      const existing = await supaFetch("edicion", `?isbn=eq.${clean}&select=edicion_id,titulo_edicion,id_estanteria&limit=1`);
      if (existing.length) {
        setErr(`⚠ ISBN ja registrat: "${existing[0].titulo_edicion}" (${existing[0].id_estanteria})`);
        return;
      }
    } catch {}

    let found = false;

    // 1. Intentem Google Books
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}&maxResults=1`);
      const data = await res.json();
      const info = data?.items?.[0]?.volumeInfo;
      if (info && info.title) {
        const autorDetectat = info.authors?.[0] || '';
        const estSuggerida = await suggerirEstanteria(autorDetectat);
        const lang = info.language || '';
        const idiomaDetectat = lang === 'en' ? 'anglès' : lang === 'ca' ? 'català' : lang === 'fr' ? 'francès' : null;
        // Detectar idioma per editorial
        const pub = (info.publisher || '').toLowerCase();
        const idiomaEditorial = pub.includes('gollancz') || pub.includes('vintage') || pub.includes('panther') || pub.includes('pocket') ? 'anglès' : null;
        setForm(f => ({
          ...f,
          titulo_edicion: info.title || f.titulo_edicion,
          titulo_original: info.title || f.titulo_original,
          autor_nom: autorDetectat || f.autor_nom,
          editorial: info.publisher || f.editorial,
          ano_edicion: info.publishedDate ? info.publishedDate.substring(0,4) : f.ano_edicion,
          id_estanteria: estSuggerida || f.id_estanteria,
          idioma: idiomaDetectat || idiomaEditorial || f.idioma,
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
              <button style={{ padding:"6px 10px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:2, fontSize:11 }}
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
                  <div style={{ position:"absolute", top:"50%", left:"10%", right:"10%", height:2, background:"#8b3a1a88", boxShadow:"0 0 8px #8b3a1a" }} />
                  <div style={{ position:"absolute", top:"30%", left:"10%", right:"10%", bottom:"30%", border:"2px solid #8b3a1a44", borderRadius:4 }} />
                </div>
                <div style={{ padding:"6px 12px", background:"rgba(0,0,0,0.7)", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#8b3a1a", marginBottom:4 }}>📷 Apunta el codi de barres al requadre</div>
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
                <button key={f} style={{ flex:1, padding:"6px", background: form.format===f?"#8b3a1a22":"transparent", border:`1px solid ${form.format===f?"#8b3a1a44":"#c8b898"}`, color: form.format===f?"#8b3a1a":"#555", cursor:"pointer", fontSize:11, borderRadius:2, fontFamily:"Georgia, serif" }}
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
            <button style={{ background: "none", border: "1px solid #8b3a1a33", color: "#8b3a1a88", cursor: "pointer", fontSize: 10, padding: "2px 8px", borderRadius: 2, fontFamily: "Georgia, serif" }}
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverInputVal, setCoverInputVal] = useState("");
  const [showNouLlibre, setShowNouLlibre] = useState(false);
  const [showSeccioMenu, setShowSeccioMenu] = useState(false);
  const [showAutorModal, setShowAutorModal] = useState(false);
  const [autorModal, setAutorModal] = useState(null);
  const [showRevisioPreus, setShowRevisioPreus] = useState(false);
  const [showManteniment, setShowManteniment] = useState(false);
  const [omnibusMap, setOmnibusMap] = useState({});
  const [showTour, setShowTour] = useState(false);
  const [tourSeccio, setTourSeccio] = useState("PKD");
  const [revisioPreusSaving, setRevisioPreusSaving] = useState({});
  const [revisioPreusVals, setRevisioPreusVals] = useState({}); // {autor_id, autor, bio, curiositats, anys, pais}
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

  useEffect(() => {
    if (!showSeccioMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-seccio-menu]')) setShowSeccioMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSeccioMenu]);

  const loadEdicions = useCallback(() => {
    setLoading(true); setError(null);
    Promise.all([
      supaFetch("edicion", "?select=edicion_id,titulo_edicion,titulo_original,ano_obra,editorial,coleccion,ano_edicion,idioma,isbn,tipo,id_estanteria,portada_url,portada_ok,portada_custom,portada_preferida,autor_id,obra_id,resum,traduccion,ilustrador,format,pagines,origen,preu_pagat,preu_mercat,preu_mercat_anterior,preu_mercat_data,preu_mercat_anterior_data,estat,estat_exemplar,preu_venut,data_venda,venut_a,data_adquisicio,llegit,valoracio,edicio_numero,edicio_especial,numeracio,llengua_original,notes_personals,data_lectura,wishlist,prestat_a,prestat_data,primera_edicio&order=id_estanteria&limit=300"),
      supaFetch("omnibus_obra", "?select=edicion_id,obra_id&limit=100"),
    ])
      .then(([data, omnibusData]) => {
        setEdicions(data);
        const groups = {};
        data.forEach(ed => {
          if (!groups[ed.obra_id]) groups[ed.obra_id] = [];
          groups[ed.obra_id].push(ed);
        });
        setObraGroups(groups);
        setFiltered(data);
        // Mapa obra_id → edicion_id de l'omnibus que la conté
        const omnibusMap = {};
        const edicionIds = new Set(data.map(e => e.edicion_id));
        (omnibusData||[]).forEach(row => {
          if (edicionIds.has(row.edicion_id)) {
            omnibusMap[row.obra_id] = row.edicion_id;
          }
        });
        setOmnibusMap(omnibusMap);
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
    // Top lectures — llegits amb valoració alta
    const topLectures = [...edicions]
      .filter(e => e.llegit==="si" && e.valoracio >= 4)
      .sort((a,b) => (b.valoracio||0)-(a.valoracio||0) || (b.data_lectura||"").localeCompare(a.data_lectura||""))
      .slice(0,10);
    // Lectures per mes (any actual i anterior)
    const perMes = {};
    const anyActual = new Date().getFullYear();
    edicions.filter(e => e.data_lectura).forEach(e => {
      const d = new Date(e.data_lectura);
      if (d.getFullYear() >= anyActual - 1) {
        const key = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}`;
        perMes[key] = (perMes[key]||0)+1;
      }
    });
    const lecturesMesBars = Object.entries(perMes).sort((a,b)=>a[0].localeCompare(b[0])).map(([label,val])=>({label:label.split("/")[1]+"/"+label.split("/")[0].slice(2),val}));
    const topValor = [...edicions].filter(e => e.preu_mercat).sort((a,b) => (b.preu_mercat||0)-(a.preu_mercat||0)).slice(0,15);
    const prestats = edicions.filter(e => e.prestat_a);
    const totalEbooks = edicions.filter(e => isEbook(e)).length;
    const totalPaper = edicions.filter(e => !isEbook(e)).length;
    // Vendes
    const venuts = edicions.filter(e => e.estat_exemplar === "venut");
    const regalats = edicions.filter(e => e.estat_exemplar === "regalat");
    const totalVenut = venuts.reduce((s,e) => s + (parseFloat(e.preu_venut)||0), 0);
    // Incorporacions per any
    const perAnyAdq = {};
    edicions.filter(e => e.data_adquisicio).forEach(e => {
      const any = new Date(e.data_adquisicio).getFullYear();
      perAnyAdq[any] = (perAnyAdq[any]||0) + 1;
    });
    const adquisiciosBars = Object.entries(perAnyAdq).sort((a,b)=>a[0]-b[0]).map(([label,val])=>({label,val}));
    return { total: edicions.length, llegits, llegint, nollegits: edicions.length-llegits-llegint, mitjaVal, ambPortada, totalPagat, totalMercat, idiomesBars, tipusBars, decadesBars, seccBars, lecturesBars, lecturesMesBars, topLectures, topValor, prestats, totalEbooks, totalPaper, venuts: venuts.length, regalats: regalats.length, totalVenut, adquisiciosBars };
  })();

  // Grid items
  const gridItems = (() => {
    let res = [...filtered];
    if (seccio !== "ALL") {
      if (seccio === "PKD") res = res.filter(e => e.id_estanteria && (e.id_estanteria.startsWith("PKD-A") || e.id_estanteria.startsWith("PKD-B") || e.id_estanteria.startsWith("PKD-C")));
      else if (["LIT-CAT","LIT-ESP","LIT-UNI"].includes(seccio)) res = res.filter(e => e.id_estanteria && e.id_estanteria.startsWith(seccio));
      else if (seccio === "DIS") res = res.filter(e => e.id_estanteria && (e.id_estanteria.startsWith("HUX") || e.id_estanteria.startsWith("ORW")));
      else res = res.filter(e => e.id_estanteria && e.id_estanteria.startsWith(seccio));
    }
    if (filtreExtra) {
      if (filtreExtra.camp === "tipo") res = res.filter(e => e.tipo === filtreExtra.valor);
      if (filtreExtra.camp === "decada") res = res.filter(e => e.ano_edicion && Math.floor(e.ano_edicion/10)*10 === filtreExtra.valor);
      if (filtreExtra.camp === "idioma") res = res.filter(e => e.idioma === filtreExtra.valor);
      if (filtreExtra.camp === "seccio") res = res.filter(e => (e.id_estanteria||"").replace(/[-]?\d+[ab-z]?$/i,'').replace(/-$/,'') === filtreExtra.valor);
      if (filtreExtra.camp === "llegit") res = res.filter(e => e.llegit === "si");
      if (filtreExtra.camp === "llegit_rapide") res = res.filter(e => e.llegit === filtreExtra.valor);
    }
    if (cerca.trim()) {
      const q = cerca.toLowerCase();
      res = res.filter(e => (e.titulo_edicion||"").toLowerCase().includes(q) || (e.titulo_original||"").toLowerCase().includes(q) || (e.editorial||"").toLowerCase().includes(q) || (e.traduccion||"").toLowerCase().includes(q) || (e.notes_personals||"").toLowerCase().includes(q));
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
      res = res.filter(e => (e.titulo_edicion||"").toLowerCase().includes(q) || (e.titulo_original||"").toLowerCase().includes(q) || (e.editorial||"").toLowerCase().includes(q) || (e.traduccion||"").toLowerCase().includes(q) || (e.notes_personals||"").toLowerCase().includes(q));
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

  const openAutorModal = async (autor_id) => {
    if (!autor_id) return;
    try {
      const data = await supaFetch("autor", `?autor_id=eq.${autor_id}&select=*&limit=1`);
      if (data.length) setAutorModal(data[0]);
      else setAutorModal({ autor_id, autor: autor_id });
    } catch { setAutorModal({ autor_id, autor: autor_id }); }
    setShowAutorModal(true);
  };

  const handleCloudinaryUpload = async (file, edicion_id) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("folder", "biblioteca");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Error ${res.status}`);
      const url = data.secure_url;
      await supaUpdate("edicion", "edicion_id", edicion_id, { portada_custom: url, portada_ok: true });
      setEdicions(prev => prev.map(e => e.edicion_id === edicion_id ? { ...e, portada_custom: url, portada_ok: true } : e));
      setSelectedObra(prev => prev ? prev.map(e => e.edicion_id === edicion_id ? { ...e, portada_custom: url, portada_ok: true } : e) : prev);
    } catch (e) {
      alert("Error pujant la imatge: " + e.message);
    }
    setUploadingCover(false);
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
          <svg width="200" height="50" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" style={{display:"block"}}>
            <circle cx="22" cy="50" r="18" fill="#1a3a6e"/>
            <ellipse cx="22" cy="50" rx="26" ry="5" fill="none" stroke="#4488cc" strokeWidth="1.5" opacity="0.7"/>
            <path d="M58 8 L48 38 L55 38 L43 72 L68 32 L60 32 L72 8 Z" fill="#f5c842" opacity="0.88"/>
            <path d="M58 8 L48 38 L55 38 L43 72 L68 32 L60 32 L72 8 Z" fill="none" stroke="#c8963b" strokeWidth="1"/>
            <line x1="85" y1="15" x2="85" y2="85" stroke="#8b3a1a44" strokeWidth="1"/>
            <text x="100" y="48" fontFamily="Georgia, serif" fontSize="28" fontWeight="bold" fill="#8b3a1a" letterSpacing="4">BIBLIOTECA</text>
            <g transform="rotate(-12, 290, 72)">
              <text x="290" y="72" fontFamily="'Brush Script MT', 'Comic Sans MS', cursive" fontSize="22" fontWeight="bold" fill="#f5c842" opacity="0.9">Novel·la Negra</text>
            </g>
            <line x1="100" y1="55" x2="395" y2="55" stroke="#8b3a1a44" strokeWidth="0.5"/>
            <rect x="100" y="65" width="8" height="22" rx="1" fill="#cc2222"/>
            <rect x="110" y="68" width="6" height="19" rx="1" fill="#1a6644"/>
            <rect x="118" y="62" width="9" height="25" rx="1" fill="#1155aa"/>
            <rect x="129" y="66" width="7" height="21" rx="1" fill="#c8963b"/>
            <rect x="138" y="70" width="6" height="17" rx="1" fill="#882255"/>
            <rect x="146" y="63" width="11" height="24" rx="1" fill="#334466"/>
            <rect x="159" y="67" width="7" height="20" rx="1" fill="#cc5511"/>
            <rect x="168" y="71" width="5" height="16" rx="1" fill="#226633"/>
            <rect x="175" y="61" width="9" height="26" rx="1" fill="#0a2255"/>
            <rect x="186" y="68" width="7" height="19" rx="1" fill="#551188"/>
            <rect x="195" y="64" width="10" height="23" rx="1" fill="#9a7420"/>
            <line x1="100" y1="88" x2="210" y2="88" stroke="#8b3a1a" strokeWidth="2"/>
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
          {[{id:"biblioteca",label:"Llibres"},{id:"prestatge",label:"Prestatge"},{id:"falten",label:"Falten"},{id:"relats",label:"Relats"},{id:"wishlist",label:"♡ Wishlist"}].map(v => (
            <button key={v.id} style={S.navBtn(view===v.id||(view==="detall"&&v.id==="biblioteca"))} onClick={() => navTo(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* MODAL MANTENIMENT */}
      {showManteniment && (() => {
        // Anàlisi de la col·lecció
        const duplicatsIsbn = {};
        edicions.forEach(e => {
          if (e.isbn) {
            if (!duplicatsIsbn[e.isbn]) duplicatsIsbn[e.isbn] = [];
            duplicatsIsbn[e.isbn].push(e);
          }
        });
        const isbnDups = Object.entries(duplicatsIsbn).filter(([,eds]) => eds.length > 1);

        const sensePreu = edicions.filter(e => !isEbook(e) && !e.preu_mercat);
        const sensePagines = edicions.filter(e => !isEbook(e) && !e.pagines);
        const senseTraductor = edicions.filter(e => !isEbook(e) && e.idioma !== 'anglès' && e.lingua_original !== e.idioma && !e.traduccion);
        const senseIsbn = edicions.filter(e => !isEbook(e) && !e.isbn);
        const estatRaro = edicions.filter(e => e.estat_exemplar && e.estat_exemplar !== 'actiu' && !e.preu_venut && e.estat_exemplar === 'venut');

        return (
          <div style={S.modalOverlay} onClick={() => setShowManteniment(false)}>
            <div style={{...S.modal, maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
                <h2 style={{...S.modalTitle, margin:0}}>🔧 Manteniment BD</h2>
                <button style={{background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16}} onClick={()=>setShowManteniment(false)}>✕</button>
              </div>

              {/* Resum */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16}}>
                {[
                  {label:"📸 Sense preu", val:sensePreu.length, color: sensePreu.length>0?"#8b3a1a":"#6ec88e"},
                  {label:"📄 Sense pàgines", val:sensePagines.length, color: sensePagines.length>50?"#c44":"#8b3a1a"},
                  {label:"🔤 Sense traductor", val:senseTraductor.length, color:"#7a5030"},
                  {label:"🔢 Sense ISBN", val:senseIsbn.length, color:"#8a6a4a"},
                  {label:"⚠️ ISBN duplicats", val:isbnDups.length, color: isbnDups.length>0?"#c44":"#6ec88e"},
                  {label:"💰 Venuts sense preu", val:estatRaro.length, color: estatRaro.length>0?"#c44":"#6ec88e"},
                ].map(s => (
                  <div key={s.label} style={{background:"#e8e2d4", border:`1px solid ${s.color}44`, borderRadius:4, padding:"10px 12px"}}>
                    <div style={{fontSize:20, color:s.color, fontWeight:"bold"}}>{s.val}</div>
                    <div style={{fontSize:11, color:"#8a6a4a", marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Duplicats ISBN */}
              {isbnDups.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11, color:"#c4444499", letterSpacing:2, textTransform:"uppercase", marginBottom:8}}>⚠️ ISBN duplicats</div>
                  {isbnDups.map(([isbn, eds]) => (
                    <div key={isbn} style={{padding:"6px 0", borderBottom:"1px solid #1a2540"}}>
                      <div style={{fontSize:11, color:"#c44", marginBottom:2}}>ISBN: {isbn}</div>
                      {eds.map(e => <div key={e.edicion_id} style={{fontSize:12, color:"#bbb", paddingLeft:8}}>· {e.titulo_edicion} ({e.id_estanteria})</div>)}
                    </div>
                  ))}
                </div>
              )}

              {/* Venuts sense preu */}
              {estatRaro.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11, color:"#c4444499", letterSpacing:2, textTransform:"uppercase", marginBottom:8}}>💰 Venuts sense preu registrat</div>
                  {estatRaro.map(e => (
                    <div key={e.edicion_id} style={{fontSize:12, color:"#bbb", padding:"4px 0", borderBottom:"1px solid #1a2540"}}>
                      {e.titulo_edicion} · {e.id_estanteria}
                    </div>
                  ))}
                </div>
              )}

              <div style={{fontSize:11, color:"#444", textAlign:"center", marginTop:8, fontStyle:"italic"}}>
                Anàlisi basada en les dades carregades · {edicions.length} edicions
              </div>
              <button style={{...S.modalClose, marginTop:12}} onClick={()=>setShowManteniment(false)}>Tancar</button>
            </div>
          </div>
        );
      })()}

      {/* MODAL TOUR DE LECTURA */}
      {showTour && (() => {
        const tourActual = TOUR_LECTURA[tourSeccio] || [];
        const titolsBD = edicions
          .filter(e => e.autor_id === {NES:"AUT003",LAR:"AUT002",MAN:"AUT007",CHR:"AUT001"}[tourSeccio])
          .map(e => (e.titulo_edicion||"").toLowerCase());
        const llegits = edicions
          .filter(e => e.autor_id === {NES:"AUT003",LAR:"AUT002",MAN:"AUT007",CHR:"AUT001"}[tourSeccio] && e.llegit==="si")
          .map(e => (e.titulo_edicion||"").toLowerCase());

        return (
          <div style={S.modalOverlay} onClick={() => setShowTour(false)}>
            <div style={{...S.modal, maxWidth:500}} onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h2 style={{...S.modalTitle, margin:0}}>🗺 Tour de lectura</h2>
                <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16 }} onClick={()=>setShowTour(false)}>✕</button>
              </div>
              {/* Selector secció */}
              <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                {[{id:"NES",label:"Nesbø"},{id:"LAR",label:"Larsson"},{id:"MAN",label:"Mankell"},{id:"CHR",label:"Christie"}].map(s => (
                  <button key={s.id}
                    style={{ flex:1, padding:"6px", background:tourSeccio===s.id?"#8b3a1a18":"transparent", border:`1px solid ${tourSeccio===s.id?"#8b3a1a55":"#c8b898"}`, color:tourSeccio===s.id?"#8b3a1a":"#555", cursor:"pointer", fontSize:12, fontFamily:"Georgia, serif", borderRadius:2 }}
                    onClick={()=>setTourSeccio(s.id)}>{s.label}</button>
                ))}
              </div>
              {/* Llista ordre recomanat */}
              {tourActual.map((item, i) => {
                const tinc = titolsBD.some(t => t.includes(item.titol.toLowerCase().substring(0,15)));
                const llegit = llegits.some(t => t.includes(item.titol.toLowerCase().substring(0,15)));
                return (
                  <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid #1a2540", opacity: llegit ? 0.5 : 1 }}>
                    <div style={{ flexShrink:0, width:22, height:22, borderRadius:"50%", background: llegit?"#6ec88e22":tinc?"#8b3a1a18":"#c4b090", border:`1px solid ${llegit?"#6ec88e":tinc?"#8b3a1a":"#333"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:llegit?"#6ec88e":tinc?"#8b3a1a":"#555" }}>
                      {llegit ? "✓" : i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color: llegit?"#555":tinc?"#2c1a0a":"#888", marginBottom:2 }}>{item.titol}</div>
                      <div style={{ fontSize:10, color:"#444", fontStyle:"italic" }}>{item.nota}</div>
                    </div>
                    <div style={{ flexShrink:0, fontSize:10, color: llegit?"#6ec88e":tinc?"#8b3a1a":"#444" }}>
                      {llegit ? "Llegit" : tinc ? "Tens" : "—"}
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize:10, color:"#333", textAlign:"center", marginTop:12, fontStyle:"italic" }}>Ordre recomanat per descobrir l'autor</div>
              <button style={{...S.modalClose, marginTop:12}} onClick={()=>setShowTour(false)}>Tancar</button>
            </div>
          </div>
        );
      })()}

      {/* MODAL REVISIÓ PREUS */}
      {showRevisioPreus && (() => {
        const ara = new Date();
        const unAnyEnrere = new Date(ara.getFullYear()-1, ara.getMonth(), ara.getDate());
        const sensePreu = edicions.filter(e => !isEbook(e) && !e.preu_mercat).sort((a,b)=>(a.id_estanteria||"").localeCompare(b.id_estanteria||""));
        const preuAntic = edicions.filter(e => !isEbook(e) && e.preu_mercat && e.preu_mercat_data && new Date(e.preu_mercat_data) < unAnyEnrere).sort((a,b)=>new Date(a.preu_mercat_data)-new Date(b.preu_mercat_data));

        const saveNouPreu = async (edicion_id, nouPreu) => {
          if (!nouPreu || isNaN(parseFloat(nouPreu))) return;
          setRevisioPreusSaving(s => ({...s, [edicion_id]: true}));
          const prev = edicions.find(e=>e.edicion_id===edicion_id)?.preu_mercat;
          await supaUpdate("edicion","edicion_id",edicion_id,{
            preu_mercat: parseFloat(nouPreu),
            preu_mercat_anterior: prev || null,
            preu_mercat_anterior_data: edicions.find(e=>e.edicion_id===edicion_id)?.preu_mercat_data || null,
            preu_mercat_data: ara.toISOString().split("T")[0],
          });
          setEdicions(prev => prev.map(e => e.edicion_id===edicion_id ? {...e, preu_mercat:parseFloat(nouPreu), preu_mercat_data:ara.toISOString().split("T")[0]} : e));
          setRevisioPreusVals(v => ({...v, [edicion_id]: ""}));
          setRevisioPreusSaving(s => ({...s, [edicion_id]: false}));
        };

        const ItemPreu = ({ed, seccio}) => {
          const val = revisioPreusVals[ed.edicion_id] || "";
          const saving = revisioPreusSaving[ed.edicion_id];
          const dataStr = ed.preu_mercat_data ? new Date(ed.preu_mercat_data).toLocaleDateString("ca-ES",{year:"numeric",month:"short"}) : null;
          return (
            <div style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:"1px solid #1a2540" }}>
              <img src={getCover(ed)} style={{ width:28, height:42, objectFit:"cover", flexShrink:0, background:"#ede8de" }} onError={e=>{e.target.src=COVER_FALLBACK;}} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:"#2c1a0a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ed.titulo_edicion||ed.titulo_original}</div>
                <div style={{ fontSize:10, color:"#555" }}>
                  {ed.id_estanteria}
                  {ed.preu_mercat && <span style={{ color:"#8b3a1a88", marginLeft:6 }}>{ed.preu_mercat}€</span>}
                  {dataStr && <span style={{ color:"#444", marginLeft:4 }}>· {dataStr}</span>}
                </div>
              </div>
              <button style={{ padding:"3px 7px", background:"#ede8de", border:"1px solid #1e3060", color:"#666", cursor:"pointer", fontSize:9, borderRadius:2, flexShrink:0 }}
                onClick={() => buscarPreu(ed, "iberlibro")}>🔍</button>
              <input
                type="text"
                inputMode="decimal"
                placeholder={ed.preu_mercat ? ed.preu_mercat.toString() : "0.00"}
                value={val}
                onChange={e => setRevisioPreusVals(v=>({...v,[ed.edicion_id]:e.target.value}))}
                onKeyDown={e => { e.stopPropagation(); if (e.key==="Enter") saveNouPreu(ed.edicion_id, val); }}
                style={{ width:65, background:"#f5f0e8", border:"1px solid #1e3060", color:"#2c1a0a", padding:"4px 6px", fontSize:11, fontFamily:"Georgia, serif", borderRadius:2, textAlign:"right" }} />
              <button
                style={{ padding:"3px 8px", background: val?"#8b3a1a22":"transparent", border:`1px solid ${val?"#8b3a1a44":"#c8b898"}`, color:val?"#8b3a1a":"#333", cursor:"pointer", fontSize:11, borderRadius:2, flexShrink:0 }}
                onClick={() => saveNouPreu(ed.edicion_id, val)}
                disabled={saving||!val}>
                {saving ? "…" : "✓"}
              </button>
            </div>
          );
        };

        return (
          <div style={S.modalOverlay} onClick={() => setShowRevisioPreus(false)}>
            <div style={{...S.modal, maxWidth:520}} onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <h2 style={{...S.modalTitle, margin:0}}>💰 Revisió de preus</h2>
                <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16 }} onClick={()=>setShowRevisioPreus(false)}>✕</button>
              </div>

              {/* Preus antics */}
              {preuAntic.length > 0 && <>
                <div style={{ fontSize:10, color:"#8b3a1a66", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>
                  Preu antic +1 any ({preuAntic.length})
                </div>
                {preuAntic.map(ed => <ItemPreu key={ed.edicion_id} ed={ed} />)}
              </>}

              {/* Sense preu */}
              {sensePreu.length > 0 && <>
                <div style={{ fontSize:10, color:"#8b3a1a66", letterSpacing:2, textTransform:"uppercase", margin:"16px 0 8px" }}>
                  Sense preu ({sensePreu.length})
                </div>
                {sensePreu.map(ed => <ItemPreu key={ed.edicion_id} ed={ed} />)}
              </>}

              {preuAntic.length===0 && sensePreu.length===0 && (
                <div style={S.empty}>✅ Tots els preus estan al dia!</div>
              )}

              <button style={{...S.modalClose, marginTop:16}} onClick={()=>setShowRevisioPreus(false)}>Tancar</button>
            </div>
          </div>
        );
      })()}

      {/* MODAL ABOUT */}
      {showAbout && (
        <div style={S.modalOverlay} onClick={() => setShowAbout(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <h2 style={S.modalTitle}>📚 Sobre la Biblioteca</h2>
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
            <button style={{...S.modalClose, color: "#8b3a1a66", borderColor: "#8b3a1a22"}} onClick={exportCSV}>📤 Exportar CSV</button>
            <button style={{...S.modalClose, color: "#7a5030", borderColor: "#8899cc44", marginBottom:4}} onClick={() => { setShowAbout(false); setShowTour(true); }}>🗺 Tour de lectura</button>
            {autenticat && <button style={{...S.modalClose, color: "#8b3a1a", borderColor: "#8b3a1a44", marginBottom:4}} onClick={() => { setShowAbout(false); setShowRevisioPreus(true); }}>💰 Revisar preus</button>}
            {autenticat && <button style={{...S.modalClose, color: "#dd6644", borderColor: "#dd664444", marginBottom:4}} onClick={() => { setShowAbout(false); setShowManteniment(true); }}>🔧 Manteniment BD</button>}
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

      {/* MODAL AUTOR */}
      {showAutorModal && autorModal && (
        <div style={S.modalOverlay} onClick={() => setShowAutorModal(false)}>
          <div style={{ ...S.modal, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            {/* Capçalera */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:18, color:"#8b3a1a", fontWeight:"bold", letterSpacing:1 }}>{autorModal.autor}</div>
                {autorModal.anys && <div style={{ fontSize:12, color:"#666", marginTop:2 }}>{autorModal.anys} · {autorModal.pais}</div>}
              </div>
              <button style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:16 }} onClick={() => setShowAutorModal(false)}>✕</button>
            </div>

            {/* Bio */}
            {autorModal.bio
              ? <p style={{ fontSize:12, color:"#bbb", lineHeight:1.7, marginBottom:14, padding:"10px 12px", background:"#ede8de", borderLeft:"2px solid #8b3a1a44" }}>{autorModal.bio}</p>
              : <div style={{ fontSize:11, color:"#444", fontStyle:"italic", marginBottom:14 }}>Bio no disponible</div>
            }

            {/* Curiositats */}
            {autorModal.curiositats && (
              <div style={{ marginBottom:16 }}>
                {autorModal.curiositats.split("\n").filter(Boolean).map((c,i) => (
                  <div key={i} style={{ fontSize:11, color:"#888", marginBottom:4 }}>★ {c}</div>
                ))}
              </div>
            )}

            {/* Edit bio — només si autenticat */}
            {autenticat && (
              <EditField label="Bio (editable)" value={autorModal.bio} multiline
                onSave={async v => {
                  await supaUpdate("autor","autor_id",autorModal.autor_id,{bio:v});
                  setAutorModal(a => ({...a, bio:v}));
                }} />
            )}

            <div style={S.modalDivider} />

            {/* Obra completa */}
            <div style={{ fontSize:11, color:"#8b3a1a99", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Obra completa</div>
            {OBRA_COMPLETA[autorModal.autor_id]
              ? OBRA_COMPLETA[autorModal.autor_id].map(g => {
                  // titols que tenim a la BD per aquest autor
                  const titolsBD = edicions
                    .filter(e => e.autor_id === autorModal.autor_id)
                    .map(e => (e.titulo_edicion||"").toLowerCase());
                  return (
                    <div key={g.grup} style={{ marginBottom:14 }}>
                      <div style={{ fontSize:10, color:"#8b3a1a55", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{g.grup}</div>
                      {g.items.map(item => {
                        const tinc = titolsBD.some(t => t.includes(item.titol.toLowerCase().substring(0,12)));
                        return (
                          <div key={item.titol} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderBottom:"1px solid #1a254008" }}>
                            <span style={{ fontSize:13, color: tinc ? "#6ec88e" : "#333", flexShrink:0, width:14 }}>{tinc ? "✓" : "■"}</span>
                            <span style={{ fontSize:12, color: tinc ? "#2c1a0a" : "#555" }}>{item.titol}</span>
                            <span style={{ fontSize:10, color:"#333", marginLeft:"auto", flexShrink:0 }}>{item.any}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              : <div style={{ fontSize:12, color:"#444", fontStyle:"italic" }}>Obra completa no disponible per aquest autor</div>
            }

            <button style={S.modalClose} onClick={() => setShowAutorModal(false)}>Tancar</button>
          </div>
        </div>
      )}

      {/* FORMULARI NOU LLIBRE */}
      {showNouLlibre && (
        <FormNouLlibre onClose={() => setShowNouLlibre(false)} onSaved={() => { setShowNouLlibre(false); loadEdicions(); }} />
      )}

      {/* BIBLIOTECA */}
      {view === "biblioteca" && <>
        {/* BARRA ÚNICA: dropdown + cerca + filtres lectura */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderBottom:"1px solid #1a2540", position:"sticky", top:83, zIndex:98, background:"#f5f0e8", overflow:"visible" }}>

          {/* Selector secció — dropdown */}
          <div data-seccio-menu style={{ position:"relative", flexShrink:0, zIndex:500 }}>
            <button
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background: seccio!=="ALL" ? "#8b3a1a18" : "transparent", border:`1px solid ${seccio!=="ALL" ? "#8b3a1a55" : "#c8b898"}`, color: seccio!=="ALL" ? "#8b3a1a" : "#666", cursor:"pointer", fontSize:11, fontFamily:"Georgia, serif", borderRadius:2, whiteSpace:"nowrap" }}
              onClick={() => setShowSeccioMenu(m => !m)}>
              {getSeccioLabel(seccio)}
              <span style={{ fontSize:9, opacity:0.6 }}>{showSeccioMenu ? "▲" : "▼"}</span>
            </button>
            {showSeccioMenu && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"#ede8de", border:"1px solid #1e3060", borderRadius:4, zIndex:500, minWidth:220, boxShadow:"0 8px 24px rgba(0,0,0,0.6)", padding:"6px 0" }}
                onClick={e => e.stopPropagation()}>
                <button style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 14px", background: seccio==="ALL" ? "#8b3a1a18" : "none", color: seccio==="ALL" ? "#8b3a1a" : "#aaa", border:"none", cursor:"pointer", fontSize:12, fontFamily:"Georgia, serif" }}
                  onClick={() => { setSeccio("ALL"); setFiltreExtra(null); setShowSeccioMenu(false); }}>
                  Tot
                </button>
                <div style={{ borderTop:"1px solid #1a2540", margin:"4px 0" }} />
                {SECCIONS_GRUPS.map(g => (
                  <div key={g.grup}>
                    <div style={{ padding:"5px 14px 3px", fontSize:9, color:"#8b3a1a55", letterSpacing:2, textTransform:"uppercase" }}>{g.grup}</div>
                    {g.items.map(s => (
                      <button key={s.id}
                        style={{ display:"block", width:"100%", textAlign:"left", padding:"6px 14px 6px 22px", background: seccio===s.id ? "#8b3a1a18" : "none", color: seccio===s.id ? "#8b3a1a" : "#888", border:"none", cursor:"pointer", fontSize:12, fontFamily:"Georgia, serif" }}
                        onClick={() => { setSeccio(s.id); setFiltreExtra(null); setShowSeccioMenu(false); }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cerca — ocupa l'espai restant */}
          <input
            style={{ flex:1, background:"#ede8de", border:"1px solid #1e3060", color:"#2c1a0a", padding:"6px 10px", fontSize:12, fontFamily:"Georgia, serif", outline:"none", borderRadius:2, minWidth:0 }}
            placeholder="Cerca títol, editorial, traductor..."
            value={cerca}
            onChange={e => setCerca(e.target.value)} />

          {/* Filtres lectura */}
          {[
            {val:"no",     label:"○", title:"Per llegir"},
            {val:"llegint",label:"½", title:"Llegint"},
            {val:"si",     label:"✓", title:"Llegits"},
          ].map(f => {
            const active = filtreExtra?.camp==="llegit_rapide" && filtreExtra?.valor===f.val;
            return (
              <button key={f.val} title={f.title}
                style={{ padding:"4px 8px", background: active ? "#8b3a1a18" : "transparent", border:`1px solid ${active ? "#8b3a1a55" : "#c8b898"}`, color: active ? "#8b3a1a" : "#555", cursor:"pointer", fontSize:13, borderRadius:2, flexShrink:0 }}
                onClick={() => {
                  if (active) setFiltreExtra(null);
                  else { setFiltreExtra({camp:"llegit_rapide", valor:f.val}); setSeccio("ALL"); }
                }}>{f.label}</button>
            );
          })}
        </div>
        <div style={{ ...S.statsBar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            {gridItems.length} obres
            {filtreExtra && <span style={{ color: "#8b3a1a", marginLeft: 8 }}>· {filtreExtra.valor} <button onClick={() => setFiltreExtra(null)} style={{ background: "none", border: "none", color: "#c44", cursor: "pointer", fontSize: 10 }}>✕</button></span>}
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
                  <div key={ed.obra_id} style={{...S.listItem, borderLeft: getSaga(ed.id_estanteria) ? `3px solid ${getSaga(ed.id_estanteria).color}` : "3px solid transparent"}} onClick={() => openObra(ed)}>
                    <img src={getCover(ed)} alt="" style={S.listImg} onError={e=>{e.target.src=COVER_FALLBACK;}} />
                    <div style={S.listInfo}>
                      <div style={S.listTitle}>{ed.titulo_edicion||ed.titulo_original}</div>
                      <div style={S.listMeta}>{ed.editorial}{ed.ano_edicion && ` · ${ed.ano_edicion}`}{ed.idioma && ` · ${ed.idioma}`}{numEds > 1 && ` · ${numEds} ed.`}{ed.prestat_a && ` · 🔄 ${ed.prestat_a}`}</div>
                    </div>
                    {getSaga(ed.id_estanteria) && (
                      <div style={{ flexShrink:0, width:80, textAlign:"center", fontSize:11, color:getSaga(ed.id_estanteria).color, fontWeight:"bold" }}>
                        {getSaga(ed.id_estanteria).saga}
                      </div>
                    )}
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      {isPrimeraEdicio(ed) && <span style={{ fontSize:8, background:"#8b3a1a", color:"#f5f0e8", padding:"1px 4px", fontWeight:"bold", borderRadius:1 }}>1ª</span>}
                      <div style={S.listShelf}>{ed.id_estanteria}</div>
                    </div>
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
                      {ed.prestat_a && <div style={{ position:"absolute", top:5, left:5, fontSize:10, background:"rgba(0,0,0,0.7)", color:"#8b3a1a", padding:"1px 4px", borderRadius:2 }}>🔄</div>}
                      {isEbook(ed) && <div style={{ position:"absolute", bottom:24, right:4, fontSize:9, background:"rgba(0,30,60,0.85)", color:"#4488cc", padding:"1px 4px", borderRadius:2 }}>📱</div>}
                      {ed.estat_exemplar==="venut" && <div style={{ position:"absolute", top:5, right:5, fontSize:9, background:"rgba(200,169,110,0.9)", color:"#f5f0e8", padding:"1px 5px", borderRadius:2, fontWeight:"bold" }}>💰</div>}
                      {ed.estat_exemplar==="regalat" && <div style={{ position:"absolute", top:5, right:5, fontSize:9, background:"rgba(136,153,204,0.9)", color:"#f5f0e8", padding:"1px 5px", borderRadius:2, fontWeight:"bold" }}>🎁</div>}
                      {isPrimeraEdicio(ed) && (
                        <div style={{ position:"absolute", inset:0, border:"2px solid #8b3a1a", pointerEvents:"none", borderRadius:0, zIndex:2 }} />
                      )}
                      {isPrimeraEdicio(ed) && (
                        <div style={{ position:"absolute", bottom:38, left:4, background:"#8b3a1a", color:"#f5f0e8", fontSize:7, fontWeight:"bold", padding:"2px 5px", letterSpacing:0.5, zIndex:3, borderRadius:1 }}>1ª ED</div>
                      )}
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

          {/* LAYOUT: dues columnes en ordinador, una en mòbil */}
          <div style={{ display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap" }}>

            {/* COL ESQUERRA — Portada */}
            <div style={{ flexShrink:0, width:"min(240px, 100%)" }}>
              <div style={S.detallImgWrap}>
                <img key={activeEd.portada_custom||activeEd.portada_url||activeEd.edicion_id} src={getCover(activeEd)} alt={activeEd.titulo_edicion} style={{...S.detallImg, maxHeight:300}} onError={e=>{e.target.src=COVER_FALLBACK;}} />
                {isPrimeraEdicio(activeEd) && <div style={{ position:"absolute", top:0, right:0, background:"#8b3a1a", color:"#f5f0e8", fontSize:9, fontWeight:"bold", padding:"3px 7px" }}>1ª ED</div>}
              </div>
              <div style={S.coverBtns}>
                {getCover(activeEd) !== COVER_FALLBACK && <button style={S.coverBtn("#6ec88e")} onClick={() => autenticat ? handleConfirmCover(activeEd.edicion_id) : null}>✓ OK</button>}
                {autenticat && <>
                  {getCover(activeEd) !== COVER_FALLBACK && <button style={S.coverBtn("#c44")} onClick={() => handleRejectCover(activeEd.edicion_id)}>✕ Incorrecta</button>}
                  <button style={S.coverBtn("#7a5030")} onClick={() => handleAutoFindCover(activeEd)} disabled={autoFindLoading}>{autoFindLoading?"⏳":"🔎 Auto"}</button>
                  <button style={S.coverBtn("#7799aa")} onClick={() => buscarPortada(activeEd)}>🌐 Google</button>
                  <button style={S.coverBtn("#8b3a1a")} onClick={() => setShowCoverInput(!showCoverInput)}>🔗 URL</button>
                </>}
                {autenticat && (
                  <label style={{...S.coverBtn("#6ec88e"), cursor:"pointer", display:"inline-block"}}>
                    {uploadingCover?"⏳ Pujant...":"📷 Foto"}
                    <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                      onChange={e => e.target.files[0] && handleCloudinaryUpload(e.target.files[0], activeEd.edicion_id)} />
                  </label>
                )}
              </div>
              {showCoverInput && (
                <div style={{display:"flex", gap:6, marginBottom:12}}>
                  <input style={{...S.input, flex:1, padding:"6px 10px", fontSize:13}} placeholder="Enganxa URL..." value={coverInputVal} onChange={e => setCoverInputVal(e.target.value)} />
                  <button style={{padding:"6px 12px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:2}} onClick={() => handleSaveCustomCover(activeEd.edicion_id, coverInputVal)}>✓</button>
                </div>
              )}
            </div>

            {/* COL DRETA — Info */}
            <div style={{flex:1, minWidth:240}}>
              <div style={S.detallTitle}>{activeEd.titulo_edicion||activeEd.titulo_original}</div>
              {activeEd.titulo_original && activeEd.titulo_original !== activeEd.titulo_edicion && <div style={S.detallOrig}>{activeEd.titulo_original}</div>}
              {activeEd.prestat_a && <div style={{background:"#8b3a1a11", border:"1px solid #8b3a1a33", padding:"6px 12px", borderRadius:2, fontSize:13, color:"#8b3a1a", marginBottom:10}}>🔄 Prestat a <strong>{activeEd.prestat_a}</strong>{activeEd.prestat_data && ` · des de ${new Date(activeEd.prestat_data).toLocaleDateString('ca-ES')}`}</div>}

              {activeEd.resum && <div style={S.resum}>{activeEd.resum}</div>}
              {!showResumPreview && (
                <button style={{background:"none", border:"1px solid #8b3a1a22", color:"#8b3a1a66", cursor:"pointer", fontSize:12, padding:"4px 12px", borderRadius:2, fontFamily:"Georgia, serif", marginBottom:12}}
                  onClick={() => handleAutoResum(activeEd)} disabled={autoResumLoading}>
                  {autoResumLoading?"⏳ Buscant...":"✨ "+(activeEd.resum?"Actualitzar resum":"Generar resum")}
                </button>
              )}
              {showResumPreview && autoResumPreview && (
                <div style={{background:"#e8e2d4", border:"1px solid #8b3a1a33", padding:14, borderRadius:4, marginBottom:12}}>
                  <div style={{fontSize:12, color:"#8b3a1a66", letterSpacing:1, textTransform:"uppercase", marginBottom:8}}>✨ Resum suggerit</div>
                  <div style={{fontSize:14, color:"#bbb", lineHeight:1.6, marginBottom:10}}>{autoResumPreview}</div>
                  <div style={{display:"flex", gap:8}}>
                    <button style={{flex:1, padding:"8px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", fontSize:13, borderRadius:2, fontFamily:"Georgia, serif"}} onClick={() => handleAcceptResum(activeEd.edicion_id, autoResumPreview)}>✓ Acceptar</button>
                    <button style={{flex:1, padding:"8px", background:"none", border:"1px solid #2a3a5a", color:"#8a6a4a", cursor:"pointer", fontSize:13, borderRadius:2, fontFamily:"Georgia, serif"}} onClick={() => setShowResumPreview(false)}>✕ Descartar</button>
                  </div>
                </div>
              )}

              {/* Llegit + Valoració */}
              <div style={S.llegitRow}>
                {LLEGIT_OPTIONS.map(opt => (
                  <button key={opt.val} style={S.llegitBtn(activeEd.llegit===opt.val, opt.color)} onClick={() => requireAuth(() => handleLlegit(activeEd.edicion_id, opt.val))} disabled={savingLlegit}>{opt.icon} {opt.label}</button>
                ))}
                <div style={S.starsRow}>
                  {STARS.map(n => <span key={n} style={S.star(activeEd.valoracio >= n)} onClick={() => requireAuth(() => handleValoració(activeEd.edicion_id, n))}>★</span>)}
                </div>
              </div>

              {/* Badges */}
              <div style={{marginBottom:12}}>
                {activeEd.tipo && <span style={S.badge}>{activeEd.tipo}</span>}
                {activeEd.idioma && <span style={S.badge}>{activeEd.idioma}</span>}
                {isEbook(activeEd) ? <span style={{...S.badge, color:"#4488cc", borderColor:"#4488cc44"}}>📱 eBook</span> : activeEd.id_estanteria && <span style={S.badge}>📚 {activeEd.id_estanteria}</span>}
                {activeEd.data_lectura && <span style={S.badge}>📖 {new Date(activeEd.data_lectura).toLocaleDateString('ca-ES',{year:'numeric',month:'short'})}</span>}
              </div>

              {/* Saga */}
              {getSaga(activeEd.id_estanteria) && (
                <div style={{marginBottom:12}}>
                  <span style={{display:"inline-block", padding:"4px 12px", background:`${getSaga(activeEd.id_estanteria).color}33`, border:`1px solid ${getSaga(activeEd.id_estanteria).color}66`, color:getSaga(activeEd.id_estanteria).color, fontSize:13, borderRadius:2}}>
                    ◆ {getSaga(activeEd.id_estanteria).saga}
                  </span>
                </div>
              )}

              {/* Info bibliogràfica */}
              {activeEd.autor_id && (
                <div style={{fontSize:15, color:"#3a2510", marginBottom:7}}>
                  <span style={{color:"#8b3a1acc", fontSize:13, letterSpacing:1, textTransform:"uppercase"}}>Autor </span>
                  <button style={{background:"none", border:"none", color:"#8b3a1a", cursor:"pointer", fontSize:14, fontFamily:"Georgia, serif", padding:0, textDecoration:"underline dotted"}}
                    onClick={() => openAutorModal(activeEd.autor_id)}>
                    {[...AUTORS_RELATS, ...AUTORS_FALTEN].find(a=>a.id===activeEd.autor_id)?.label || activeEd.autor_id}
                  </button>
                </div>
              )}
              {activeEd.editorial && <div style={{fontSize:15, color:"#3a2510", marginBottom:7}}><span style={{color:"#8b3a1acc", fontSize:13, letterSpacing:1, textTransform:"uppercase"}}>Editorial </span>{activeEd.editorial}{activeEd.coleccion && ` · ${activeEd.coleccion}`}</div>}
              {(activeEd.ano_edicion||activeEd.ano_obra) && <div style={{fontSize:15, color:"#3a2510", marginBottom:7}}><span style={{color:"#8b3a1acc", fontSize:13, letterSpacing:1, textTransform:"uppercase"}}>Edició </span>{activeEd.ano_edicion||"—"}{activeEd.ano_obra && ` · Obra: ${activeEd.ano_obra}`}</div>}
              {(activeEd.edicio_numero||activeEd.edicio_especial||activeEd.numeracio) && (
                <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
                  {activeEd.edicio_numero && <span style={{fontSize:12, background:"#8b3a1a18", border:"1px solid #8b3a1a33", color:"#8b3a1a", padding:"2px 8px", borderRadius:2}}>#{activeEd.edicio_numero}ª edició</span>}
                  {activeEd.edicio_especial && <span style={{fontSize:12, background:"#8899cc18", border:"1px solid #8899cc33", color:"#7a5030", padding:"2px 8px", borderRadius:2}}>✦ {activeEd.edicio_especial}</span>}
                  {activeEd.numeracio && <span style={{fontSize:12, background:"#8b3a1a18", border:"1px solid #8b3a1a33", color:"#8b3a1a99", padding:"2px 8px", borderRadius:2}}>Nº {activeEd.numeracio}</span>}
                </div>
              )}

              {/* Valor mercat */}
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", margin:"16px 0 8px", padding:"14px 16px", background:"#ede8de", borderRadius:4}}>
                <div>
                  <div style={{fontSize:12, color:"#8b3a1acc", letterSpacing:1, textTransform:"uppercase", marginBottom:4}}>Valor mercat</div>
                  <div style={{fontSize:28, color:"#8b3a1a", fontWeight:"bold"}}>{activeEd.preu_mercat?`${activeEd.preu_mercat}€`:"—"}</div>
                  {activeEd.preu_mercat_anterior && <div style={{fontSize:12, color:"#8a6a4a"}}>Anterior: {activeEd.preu_mercat_anterior}€</div>}
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:8}}>
                  <button style={{padding:"10px 16px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:4, fontFamily:"Georgia, serif", fontSize:14}}
                    onClick={() => requireAuth(() => setShowRevaluar(true))}>💰 Revaluar</button>
                  <button style={{padding:"10px 16px", background:"none", border:"1px solid #2a3a5a", color:"#7a5a3a", cursor:"pointer", borderRadius:4, fontFamily:"Georgia, serif", fontSize:14}}
                    onClick={() => setShowPreuMenu(!showPreuMenu)}>🔍 Buscar preu</button>
                </div>
              </div>
              {showRevaluar && (
                <div style={{display:"flex", gap:8, marginBottom:12}}>
                  <input type="text" inputMode="decimal" placeholder="Nou preu €" value={nouPreu} onChange={e => setNouPreu(e.target.value)}
                    style={{flex:1, background:"#f5f0e8", border:"1px solid #2a3a5a", color:"#2c1a0a", padding:"8px 12px", fontSize:14, fontFamily:"Georgia, serif", borderRadius:2}} />
                  <button style={{padding:"8px 14px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:2, fontFamily:"Georgia, serif"}}
                    onClick={() => handleRevaluar(activeEd.edicion_id, nouPreu)} disabled={savingPreu}>{savingPreu?"...":"✓"}</button>
                  <button style={{padding:"8px 12px", background:"none", border:"1px solid #2a3a5a", color:"#8a6a4a", cursor:"pointer", borderRadius:2}}
                    onClick={() => setShowRevaluar(false)}>✕</button>
                </div>
              )}
              {showPreuMenu && (
                <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:12}}>
                  {[{label:"📚 Iberlibro",plat:"iberlibro"},{label:"🏷️ Wallapop",plat:"wallapop"},{label:"👗 Vinted",plat:"vinted"},{label:"📦 Amazon",plat:"amazon"}].map(p => (
                    <button key={p.plat} style={{padding:"8px 12px", background:"#ede8de", border:"1px solid #2a3a5a", color:"#7a5a3a", cursor:"pointer", fontSize:13, borderRadius:2, fontFamily:"Georgia, serif"}}
                      onClick={() => buscarPreu(activeEd, p.plat)}>{p.label}</button>
                  ))}
                </div>
              )}

              {/* Botons acció — grans i llegibles */}
              <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:16}}>
                <button style={{padding:"14px 18px", background:"#ede8de", border:"1px solid #2a3a5a", color:"#c8d8ee", cursor:"pointer", borderRadius:6, fontFamily:"Georgia, serif", fontSize:15, textAlign:"left", display:"flex", alignItems:"center", gap:10}}
                  onClick={() => requireAuth(() => setShowPrestat(!showPrestat))}>
                  <span style={{fontSize:20}}>🔄</span>
                  <span>{activeEd.prestat_a?`Prestat a ${activeEd.prestat_a}`:"Marcar com a prestat"}</span>
                </button>
                {showPrestat && (
                  <div style={{display:"flex", gap:8, marginBottom:4}}>
                    <input placeholder="Nom de la persona..." value={prestatNom} onChange={e => setPrestatNom(e.target.value)}
                      style={{flex:1, background:"#f5f0e8", border:"1px solid #2a3a5a", color:"#2c1a0a", padding:"8px 12px", fontSize:14, fontFamily:"Georgia, serif", borderRadius:2}} />
                    <button style={{padding:"8px 14px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:2, fontFamily:"Georgia, serif"}}
                      onClick={() => handlePrestar(activeEd.edicion_id, prestatNom)}>✓</button>
                    {activeEd.prestat_a && <button style={{padding:"8px 12px", background:"none", border:"1px solid #c4444433", color:"#c44", cursor:"pointer", borderRadius:2}}
                      onClick={() => handleRetornar(activeEd.edicion_id)}>Retornat</button>}
                  </div>
                )}
                <button style={{padding:"14px 18px", background:"#ede8de", border:"1px solid #2a3a5a", color:"#c8d8ee", cursor:"pointer", borderRadius:6, fontFamily:"Georgia, serif", fontSize:15, textAlign:"left", display:"flex", alignItems:"center", gap:10}}
                  onClick={() => requireAuth(() => { setShowEdit(!showEdit); setShowExtra(false); })}>
                  <span style={{fontSize:18}}>✎</span>
                  <span>{showEdit?"Tancar edició":"Editar camps"}</span>
                </button>
                <button style={{padding:"14px 18px", background:"#ede8de", border:"1px solid #2a3a5a", color:"#c8d8ee", cursor:"pointer", borderRadius:6, fontFamily:"Georgia, serif", fontSize:15, textAlign:"left", display:"flex", alignItems:"center", gap:10}}
                  onClick={() => { setShowExtra(!showExtra); setShowEdit(false); }}>
                  <span style={{fontSize:16}}>{showExtra?"▲":"▼"}</span>
                  <span>{showExtra?"Menys informació":"Més informació"}</span>
                </button>
              </div>


            </div>{/* fi col dreta */}
          </div>{/* fi layout */}

          {/* EDITAR CAMPS */}
          {showEdit && (
            <div style={{ background: "#e8e2d4", padding: 14, borderRadius: 4, marginBottom: 12 }}>
              <EditField label="Títol edició" value={activeEd.titulo_edicion} onSave={v => updateEd(activeEd.edicion_id, { titulo_edicion: v })} />
              <EditField label="Títol original" value={activeEd.titulo_original} onSave={v => updateEd(activeEd.edicion_id, { titulo_original: v })} />
              <EditField label="Editorial" value={activeEd.editorial} onSave={v => updateEd(activeEd.edicion_id, { editorial: v })} />
              <EditField label="Col·lecció" value={activeEd.coleccion} onSave={v => updateEd(activeEd.edicion_id, { coleccion: v })} />
              <EditField label="Any edició" value={activeEd.ano_edicion?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { ano_edicion: parseInt(v)||null })} />
              <EditField label="ISBN" value={activeEd.isbn} onSave={v => updateEd(activeEd.edicion_id, { isbn: v })} />
              <EditField label="Estanteria" value={activeEd.id_estanteria} onSave={v => updateEd(activeEd.edicion_id, { id_estanteria: v.toUpperCase() })} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <EditField label="Nº edició" value={activeEd.edicio_numero?.toString()} type="text"
              onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{edicio_numero:v?parseInt(v):null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,edicio_numero:v?parseInt(v):null}:ed)))} />
            <EditField label="Numeració exemplar" value={activeEd.numeracio} type="text"
              onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{numeracio:v||null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,numeracio:v||null}:ed)))} />
          </div>
          <EditField label="Edició especial (ex: Numerada, Limitada, Deluxe...)" value={activeEd.edicio_especial}
            onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{edicio_especial:v||null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,edicio_especial:v||null}:ed)))} />
          <EditField label="Traductor" value={activeEd.traduccion} onSave={v => updateEd(activeEd.edicion_id, { traduccion: v })} />
              <EditField label="Pàgines" value={activeEd.pagines?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { pagines: parseInt(v)||null })} />
              <EditField label="Preu pagat (€)" value={activeEd.preu_pagat?.toString()} type="number" onSave={v => updateEd(activeEd.edicion_id, { preu_pagat: v === "" ? null : parseFloat(v) })} />
              <EditField label="Data lectura (AAAA-MM-DD)" value={activeEd.data_lectura} onSave={v => updateEd(activeEd.edicion_id, { data_lectura: v||null })} />
              <EditField label="Resum" value={activeEd.resum} multiline onSave={v => updateEd(activeEd.edicion_id, { resum: v })} />
            </div>
          )}

          {/* MÉS INFORMACIÓ */}

          {showExtra && (
            <div style={{ marginBottom: 12, padding: "12px 14px", background: "#e8e2d4", borderRadius: 2 }}>
              {activeEd.traduccion && <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Traducció </span>{activeEd.traduccion}</div>}
              {activeEd.isbn && <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>ISBN </span>{activeEd.isbn}</div>}
              {activeEd.pagines && <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Pàgines </span>{activeEd.pagines}</div>}
              {activeEd.origen && <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Origen </span>{activeEd.origen}</div>}
              {activeEd.preu_pagat && <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>Preu pagat </span>{activeEd.preu_pagat} €</div>}
              <div style={{ fontSize: 15, color: "#3a2510", marginBottom: 7 }}><span style={{ color: "#8b3a1acc", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>ID </span>{activeEd.edicion_id}</div>
            </div>
          )}

          {/* NOTES */}
          <div style={S.sectionTitle}>📝 Notes personals</div>
          <textarea style={S.notesArea} value={notesVal} onChange={e => setNotesVal(e.target.value)} placeholder="Les teves impressions, on el vas comprar..." />
          <button style={{ ...S.iconBtn, marginTop: 6, fontSize: 11 }} onClick={() => requireAuth(handleSaveNotes)} disabled={savingNotes}>{savingNotes ? "Desant..." : "💾 Desar notes"}</button>

          {/* RELATS */}
          {relatsDeLlibre.length > 0 && (
            <div style={{ marginTop: 20, borderTop: "1px solid #1a2540", paddingTop: 16 }}>
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
          {/* ── GESTIÓ EXEMPLAR ── */}
          <div style={S.sectionTitle}>Exemplar</div>
          <div style={{ marginBottom:14 }}>
            <div style={S.formLabel}>Estat</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[
                {val:"actiu",   label:"✓ Actiu",    color:"#6ec88e"},
                {val:"venut",   label:"💰 Venut",    color:"#8b3a1a"},
                {val:"regalat", label:"🎁 Regalat",  color:"#7a5030"},
                {val:"perdut",  label:"✕ Perdut",    color:"#c44"},
              ].map(e => {
                const active = (activeEd.estat_exemplar||"actiu") === e.val;
                return (
                  <button key={e.val}
                    style={{ padding:"7px 14px", background:active?e.color+"22":"transparent", border:`1px solid ${active?e.color+"66":"#c8b898"}`, color:active?e.color:"#555", cursor:"pointer", fontSize:11, borderRadius:2, fontFamily:"Georgia, serif" }}
                    onClick={() => autenticat && supaUpdate("edicion","edicion_id",activeEd.edicion_id,{estat_exemplar:e.val}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,estat_exemplar:e.val}:ed)))}>
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>
          {(activeEd.estat_exemplar==="venut"||activeEd.estat_exemplar==="regalat") && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <EditField label="Preu venut (€)" value={activeEd.preu_venut?.toString()} type="number"
                onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{preu_venut:v?parseFloat(v):null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,preu_venut:parseFloat(v)||null}:ed)))} />
              <EditField label="Data venda" value={activeEd.data_venda} type="date"
                onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{data_venda:v||null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,data_venda:v||null}:ed)))} />
            </div>
          )}
          {activeEd.estat_exemplar==="venut" && (
            <EditField label="Venut a" value={activeEd.venut_a}
              onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{venut_a:v||null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,venut_a:v||null}:ed)))} />
          )}
          {/* Primera edició toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #1a2540", marginBottom:8 }}>
            <div>
              <span style={{ fontSize:10, color:"#8b3a1a66", textTransform:"uppercase", letterSpacing:1 }}>Primera edició </span>
              {isPrimeraEdicio(activeEd) && <span style={{ fontSize:9, background:"#8b3a1a", color:"#f5f0e8", padding:"1px 5px", fontWeight:"bold", marginLeft:6 }}>1ª ED</span>}
            </div>
            <button
              style={{ padding:"4px 12px", background: activeEd.primera_edicio===true?"#8b3a1a22": activeEd.primera_edicio===false?"#c4444422":"transparent", border:`1px solid ${activeEd.primera_edicio===true?"#8b3a1a55":activeEd.primera_edicio===false?"#c4444444":"#c8b898"}`, color: activeEd.primera_edicio===true?"#8b3a1a":activeEd.primera_edicio===false?"#c44":"#555", cursor:"pointer", fontSize:10, borderRadius:2, fontFamily:"Georgia, serif" }}
              onClick={() => {
                if (!autenticat) return;
                // Cicle: null→true→false→null
                const current = activeEd.primera_edicio;
                const next = current === true ? false : current === false ? null : true;
                supaUpdate("edicion","edicion_id",activeEd.edicion_id,{primera_edicio:next})
                  .then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,primera_edicio:next}:ed)));
              }}>
              {activeEd.primera_edicio===true ? "✓ Confirmada" : activeEd.primera_edicio===false ? "✕ Descartada" : "○ Auto"}
            </button>
          </div>

          <EditField label="Data adquisició" value={activeEd.data_adquisicio} type="date"
            onSave={v => supaUpdate("edicion","edicion_id",activeEd.edicion_id,{data_adquisicio:v||null}).then(()=>setEdicions(prev=>prev.map(ed=>ed.edicion_id===activeEd.edicion_id?{...ed,data_adquisicio:v||null}:ed)))} />

   {!deleteConfirm
            ? <button style={S.deleteBtn} onClick={() => requireAuth(() => setDeleteConfirm(true))}>🗑 Eliminar aquest llibre</button>
            : <div style={{ marginTop: 24, padding: 14, background: "#1a0a0a", border: "1px solid #c4444433", borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: "#c44", marginBottom: 10 }}>Segur que vols eliminar <strong>{activeEd.titulo_edicion}</strong>?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "8px", background: "#c4222222", border: "1px solid #c44", color: "#c44", cursor: "pointer", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 12 }} onClick={handleDelete}>Eliminar</button>
                  <button style={{ flex: 1, padding: "8px", background: "none", border: "1px solid #1e3060", color: "#666", cursor: "pointer", borderRadius: 2, fontFamily: "Georgia, serif", fontSize: 12 }} onClick={() => setDeleteConfirm(false)}>Cancel·lar</button>
                </div>
              </div>
          }
        </div>
      )}

      {/* PRESTATGE */}
      {view === "prestatge" && <>
        <div style={{...S.statsBar, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span>{edicions.length} llibres per prestatge</span>
          <span style={{ fontSize:10, color:"#8a6a4a" }}>● color = saga</span>
        </div>
        {loading ? <div style={S.loader}>CARREGANT · · ·</div>
          : Object.entries(prestatge).map(([prefix, eds]) => (
            <div key={prefix}>
              <div style={S.prestSection}><div style={S.prestSectionTitle}>── {prefix} ({eds.length})</div></div>
              {eds.map(ed => (
                <div key={ed.edicion_id}
                  style={{...S.prestItem,
                    background: getSaga(ed.id_estanteria) ? `${getSaga(ed.id_estanteria).color}44` : "transparent",
                    borderLeft: getSaga(ed.id_estanteria) ? `4px solid ${getSaga(ed.id_estanteria).color}` : "4px solid transparent",
                  }}
                  onClick={() => openObra(ed)}>
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
                    {falten.map(o => {
                      const omnibusEdId = omnibusMap[o.obra_id];
                      const cobertPerOmnibus = !!omnibusEdId;
                      const omnibusInfo = cobertPerOmnibus ? edicions.find(e => e.edicion_id === omnibusEdId) : null;
                      return (
                      <div key={o.obra_id} style={{...S.faltenItem, opacity: cobertPerOmnibus ? 0.65 : 1}}>
                        <div style={{ flex: 1 }}>
                          <div style={S.faltenTitle}>{o.titulo_original}</div>
                          {o.titulo_cast && <div style={S.faltenCast}>{o.titulo_cast}</div>}
                          <div style={S.faltenYear}>{o.ano_obra}</div>
                          {cobertPerOmnibus && omnibusInfo && (
                            <div style={{ fontSize:11, color:"#6ec88e", marginTop:3 }}>
                              ✓ inclòs a: {omnibusInfo.titulo_edicion}
                            </div>
                          )}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                          <span style={S.tipusBadge}>{o.tipo}</span>
                          <button style={{ background:"none", border:"1px solid #8b3a1a33", color:"#8b3a1a66", cursor:"pointer", fontSize:9, padding:"2px 6px", borderRadius:2, fontFamily:"Georgia, serif" }}
                            onClick={() => addFaltaToWishlist(o)}>♡ Wishlist</button>
                        </div>
                      </div>
                    );
                    })}
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
            <button style={{ background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", fontSize:11, padding:"3px 10px", borderRadius:2, fontFamily:"Georgia, serif" }}
              onClick={() => requireAuth(() => setShowWishlistForm(!showWishlistForm))}>+ Afegir</button>
          </div>

          {/* Formulari afegir */}
          {showWishlistForm && (
            <div style={{ padding:"14px 16px", background:"#e8e2d4", borderBottom:"1px solid #1a2540" }}>
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
                  <button key={p.v} style={{ flex:1, padding:"5px", background:wishlistForm.prioritat===p.v?"#8b3a1a22":"transparent", border:`1px solid ${wishlistForm.prioritat===p.v?"#8b3a1a44":"#c8b898"}`, color:wishlistForm.prioritat===p.v?"#8b3a1a":"#555", cursor:"pointer", fontSize:10, borderRadius:2, fontFamily:"Georgia, serif" }}
                    onClick={() => setWishlistForm(f=>({...f,prioritat:p.v}))}>{p.label}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button style={{ flex:1, padding:"8px", background:"#8b3a1a22", border:"1px solid #8b3a1a44", color:"#8b3a1a", cursor:"pointer", borderRadius:2, fontFamily:"Georgia, serif", fontSize:12 }}
                  onClick={handleAddWishlist} disabled={savingWishlist}>{savingWishlist?"Desant...":"✓ Afegir a la wishlist"}</button>
                <button style={{ padding:"8px 12px", background:"none", border:"1px solid #1e3060", color:"#555", cursor:"pointer", borderRadius:2 }}
                  onClick={() => setShowWishlistForm(false)}>✕</button>
              </div>
            </div>
          )}

          {/* Llista wishlist */}
          {wishlistItems.length === 0
            ? <div style={S.empty}>Cap llibre a la wishlist 🙂</div>
            : wishlistItems.map(w => {
                const prioritatColor = w.prioritat===1?"#c44":w.prioritat===3?"#6ec88e":"#8b3a1a";
                const showBuscar = wishlistBuscarId === w.wishlist_id;
                return (
                  <div key={w.wishlist_id} style={{ padding:"14px 16px", borderBottom:"1px solid #1a2540" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, color:"#2c1a0a", marginBottom:2 }}>{w.titulo}</div>
                        {w.autor && <div style={{ fontSize:11, color:"#8b3a1a88", marginBottom:2 }}>{w.autor}{w.editorial && ` · ${w.editorial}`}{w.any_aprox && ` · ${w.any_aprox}`}</div>}
                        {w.notes && <div style={{ fontSize:11, color:"#555", fontStyle:"italic" }}>{w.notes}</div>}
                        <div style={{ fontSize:9, color:"#333", marginTop:4 }}>Afegit: {w.data_afegit}</div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end", flexShrink:0 }}>
                        <span style={{ fontSize:9, color:prioritatColor, border:`1px solid ${prioritatColor}44`, padding:"1px 6px", borderRadius:2 }}>
                          {w.prioritat===1?"🔴 Alta":w.prioritat===3?"🟢 Baixa":"🟡 Normal"}
                        </span>
                        <button style={{ background:"none", border:"1px solid #8899cc33", color:"#7a5030", cursor:"pointer", fontSize:9, padding:"2px 6px", borderRadius:2, fontFamily:"Georgia, serif" }}
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
                          <button key={p.plat} style={{ padding:"4px 8px", background:"#ede8de", border:"1px solid #1e3060", color:"#888", cursor:"pointer", fontSize:10, borderRadius:2, fontFamily:"Georgia, serif" }}
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
              {stats.totalEbooks > 0 && <div style={{...S.statCard, border: "1px solid #4488cc33"}} onClick={() => filtrarPerStat("format","ebook")}><div style={{...S.statNum, color:"#4488cc"}}>{stats.totalEbooks}</div><div style={S.statLabel}>📱 eBooks</div></div>}
              {stats.venuts > 0 && <div style={{...S.statCard, border:"1px solid #8b3a1a33"}}><div style={{...S.statNum, color:"#8b3a1a"}}>{stats.venuts}</div><div style={S.statLabel}>💰 Venuts</div></div>}
              {stats.regalats > 0 && <div style={{...S.statCard, border:"1px solid #8899cc33"}}><div style={{...S.statNum, color:"#7a5030"}}>{stats.regalats}</div><div style={S.statLabel}>🎁 Regalats</div></div>}
              {stats.totalVenut > 0 && <div style={{...S.statCard, border:"1px solid #8b3a1a33"}}><div style={{...S.statNum, color:"#8b3a1a"}}>{stats.totalVenut.toFixed(0)}€</div><div style={S.statLabel}>💸 Recaptat vendes</div></div>}
            </div>

            {/* Portades dashboard */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
              {[
                { label: "✅ Amb portada", val: stats.ambPortada, color: "#6ec88e" },
                { label: "❌ Sense portada", val: stats.total - stats.ambPortada, color: "#c44" },
                { label: "📌 Customs", val: edicions.filter(e => e.portada_custom).length, color: "#8b3a1a" },
              ].map(s => (
                <div key={s.label} style={{ background: "#ede8de", border: `1px solid ${s.color}33`, borderRadius: 4, padding: "10px 12px", textAlign: "center" }}>
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
            {stats.lecturesMesBars?.length > 0 && <BarChart data={stats.lecturesMesBars} title="📖 Lectures per mes (últims 2 anys)" />}
            {stats.adquisiciosBars?.length > 0 && <BarChart data={stats.adquisiciosBars} title="📦 Incorporacions per any" />}
            {stats.topLectures?.length > 0 && (
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, color:"#8b3a1a99", letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>⭐ Top lectures (valoració ≥ 4)</div>
                {stats.topLectures.map((e,i) => (
                  <div key={e.edicion_id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #111", cursor:"pointer" }} onClick={() => openObra(e)}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ color:"#8b3a1a44", marginRight:8, fontSize:11 }}>#{i+1}</span>
                      <span style={{ fontSize:12, color:"#bbb" }}>{e.titulo_edicion||e.titulo_original}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                      <span style={{ fontSize:11, color:"#8b3a1a" }}>{"★".repeat(e.valoracio)}</span>
                      {e.data_lectura && <span style={{ fontSize:10, color:"#444" }}>{new Date(e.data_lectura).getFullYear()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Top valor */}
            {stats.topValor?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, color: "#8b3a1a99", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>💎 Top valor estimat</div>
                {stats.topValor.map((e, i) => (
                  <div key={e.edicion_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #111", cursor: "pointer" }} onClick={() => openObra(e)}>
                    <span style={{ fontSize: 12, color: "#bbb" }}><span style={{ color: "#8b3a1a44", marginRight: 8 }}>#{i+1}</span>{e.titulo_edicion}</span>
                    <span style={{ fontSize: 12, color: "#8b3a1a", flexShrink: 0 }}>{e.preu_mercat}€</span>
                  </div>
                ))}
              </div>
            )}

            {/* Prestats */}
            {stats.prestats?.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#8b3a1a99", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>🔄 Llibres prestats ({stats.prestats.length})</div>
                {stats.prestats.map(e => (
                  <div key={e.edicion_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #111", cursor: "pointer" }} onClick={() => openObra(e)}>
                    <span style={{ fontSize: 12, color: "#bbb" }}>{e.titulo_edicion}</span>
                    <span style={{ fontSize: 11, color: "#8b3a1a" }}>{e.prestat_a}</span>
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
