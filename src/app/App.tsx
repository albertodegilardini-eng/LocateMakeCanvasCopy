import { useState, useMemo, useRef, useEffect } from "react";
import "@/imports/enhancements.css";
import {
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Building = "peninsula" | "torre300" | "paradox";
type Status = "negotiate" | "fast_move" | "verify" | "monitor";
type SortBy = "composite_score" | "leverage_score" | "price_asc" | "price_desc" | "dom";
type View = "overview" | "operator" | "compare" | "agents" | "dashboard" | "tracking" | "map";

interface Listing {
  id: string; building: Building; buildingLabel: string;
  floor: number; bedrooms: number; bathrooms: number; sqm: number;
  price: number; dom: number; compositeScore: number; leverageScore: number;
  negotiable: boolean; agentName: string; agentFirm: string;
  confidence: "high" | "mid" | "low"; status: Status;
  imgId: string; anchor?: number; notes?: string;
  url?: string; // Direct link to Inmuebles24 listing
}

// Phase 1 fallback data (used if API is down)
const FALLBACK_LISTINGS: Listing[] = [
  // Focused on 2-3 recámaras only.
  // Real base data + links from Inmuebles24 listings (June 2026 snapshots).
  // Images use high-quality placeholders (in prod replace with scraped gallery images from the URL).
  { id: "PAR-452", building: "paradox", buildingLabel: "Paradox", floor: 45, bedrooms: 2, bathrooms: 2, sqm: 114, price: 50000, dom: 38, compositeScore: 87, leverageScore: 81, negotiable: true, agentName: "Diana Montaño", agentFirm: "Santa Fe Suites", confidence: "high", status: "negotiate", imgId: "1564078516393-cf04bd966897", anchor: 45500, notes: "Piso alto en Torre Paradox. Vista a Parque La Mexicana. Datos Inmuebles24.", url: "https://www.inmuebles24.com/propiedades/clasificado/alclapin-departamento-en-renta-en-paradox-santa-fe-149956406.html" },
  { id: "PAR-213", building: "paradox", buildingLabel: "Paradox", floor: 21, bedrooms: 3, bathrooms: 3, sqm: 210, price: 64990, dom: 29, compositeScore: 78, leverageScore: 72, negotiable: true, agentName: "Elena Torres", agentFirm: "Knight Frank", confidence: "high", status: "fast_move", imgId: "1682184805271-11671b7ecf4c", anchor: 59500, notes: "210 m² 3 rec en Paradox Av. Santa Fe. Excelentes amenidades.", url: "https://www.inmuebles24.com/departamentos-en-renta-q-paradox.html" },
  { id: "T3-283", building: "torre300", buildingLabel: "Torre 300", floor: 28, bedrooms: 3, bathrooms: 3.5, sqm: 172, price: 60000, dom: 41, compositeScore: 86, leverageScore: 79, negotiable: true, agentName: "Luis Vega", agentFirm: "ERA Inmobiliaria", confidence: "high", status: "negotiate", imgId: "1699239116624-85268dce7377", anchor: 54000, notes: "Torre 300 (Arq. Teodoro González de León). Vista Parque La Mexicana.", url: "https://www.inmuebles24.com/propiedades/clasificado/alclapin-renta-depto-fe-3-recamaras-torre-300-vista-parque-150169572.html" },
  { id: "PEN-182", building: "peninsula", buildingLabel: "Península", floor: 18, bedrooms: 2, bathrooms: 2, sqm: 156, price: 57000, dom: 33, compositeScore: 84, leverageScore: 77, negotiable: true, agentName: "Ricardo Solís", agentFirm: "CBRE México", confidence: "high", status: "negotiate", imgId: "1562438668-bcf0ca6578f0", anchor: 51000, notes: "Península Tower, amueblado, piso alto con vista a La Mexicana.", url: "https://www.inmuebles24.com/propiedades/clasificado/alclapin-renta-amueblado-de-lujo-en-peninsula-tower-el-149743024.html" },
  { id: "PEN-333", building: "peninsula", buildingLabel: "Península", floor: 33, bedrooms: 3, bathrooms: 3, sqm: 156, price: 58000, dom: 24, compositeScore: 82, leverageScore: 69, negotiable: false, agentName: "Camila Herrera", agentFirm: "JLL México", confidence: "high", status: "fast_move", imgId: "1512918728675-ed5a9ecdebfd", notes: "Península Tower 156 m². Mantenimiento incluido en varios listados.", url: "https://www.inmuebles24.com/departamentos-en-renta-q-peninsula-santa-fe-cuajimalpa.html" },
  { id: "HAU-102", building: "torre300", buildingLabel: "Haus Santa Fe", floor: 10, bedrooms: 2, bathrooms: 2.5, sqm: 139, price: 40000, dom: 27, compositeScore: 75, leverageScore: 71, negotiable: true, agentName: "Ana Ruiz", agentFirm: "Cushman & Wakefield", confidence: "high", status: "fast_move", imgId: "1682184805271-11671b7ecf4c", anchor: 36500, notes: "Haus Santa Fe — excelente relación calidad precio.", url: "https://www.inmuebles24.com/propiedades/clasificado/alclapin-departamento-semiamueblado-en-renta-en-haus-santa-fe-149716700.html" },
  { id: "H2O-283", building: "paradox", buildingLabel: "H2O Santa Fe", floor: 28, bedrooms: 3, bathrooms: 2.5, sqm: 175, price: 55000, dom: 36, compositeScore: 77, leverageScore: 66, negotiable: true, agentName: "Elena Torres", agentFirm: "Knight Frank", confidence: "high", status: "negotiate", imgId: "1646987916641-1f3c8992daa2", anchor: 49500, notes: "H2O Santa Fe. Vistas impresionantes.", url: "https://www.inmuebles24.com/departamentos-en-renta-en-santa-fe.html" },
  { id: "TRES-042", building: "peninsula", buildingLabel: "Tres Cumbres", floor: 4, bedrooms: 2, bathrooms: 2, sqm: 140, price: 39500, dom: 52, compositeScore: 83, leverageScore: 80, negotiable: true, agentName: "Carmen López", agentFirm: "Re/Max Santa Fe", confidence: "mid", status: "negotiate", imgId: "1562438668-bcf0ca6578f0", anchor: 35500, notes: "Tres Cumbres Santa Fe. Vista a montañas + amenidades.", url: "https://www.inmuebles24.com/departamentos-en-renta-en-santa-fe-cuajimalpa.html" },
  { id: "THEP-123", building: "torre300", buildingLabel: "The Point", floor: 12, bedrooms: 3, bathrooms: 2, sqm: 129, price: 37000, dom: 61, compositeScore: 88, leverageScore: 85, negotiable: true, agentName: "María Castro", agentFirm: "Coldwell Banker", confidence: "mid", status: "negotiate", imgId: "1587985064135-0366536eab42", anchor: 32500, notes: "The Point Santa Fe.", url: "https://www.inmuebles24.com/departamentos-en-renta-en-santa-fe-cuajimalpa-con-3-recamaras.html" },
];

const BUILDINGS = [
  { id: "peninsula", label: "Península", color: "#1d4ed8", units: 312, floors: 45, built: 2005, avgPsm: 465, avgDom: 35, activeListing: 4, imgId: "1443527394413-4b820fd08dde", tagline: "Amenidades premium · Pisos 15–40 · DOM ~35d" },
  { id: "torre300", label: "Torre 300", color: "#d97706", units: 248, floors: 38, built: 2010, avgPsm: 430, avgDom: 42, activeListing: 4, imgId: "1528810289438-283f885c31ef", tagline: "Mejor $/m² · Vista Parque La Mexicana · DOM ~42d" },
  { id: "paradox", label: "Paradox", color: "#7c3aed", units: 186, floors: 32, built: 2018, avgPsm: 510, avgDom: 29, activeListing: 4, imgId: "1559458049-9d62fceeb52b", tagline: "Edificio más nuevo · Acabados A+ · DOM ~29d (alta demanda)" },
];

const AGENTS = [
  { name: "Ana Ruiz", firm: "Cushman & Wakefield", score: 93, interactions: 3, ghostRate: 3, avgResponse: "1.2h", listings: 1, rating: "A+" },
  { name: "Elena Torres", firm: "Knight Frank", score: 91, interactions: 3, ghostRate: 4, avgResponse: "1.8h", listings: 2, rating: "A+" },
  { name: "Camila Herrera", firm: "JLL México", score: 88, interactions: 2, ghostRate: 5, avgResponse: "1.5h", listings: 1, rating: "A+" },
  { name: "Ricardo Solís", firm: "CBRE México", score: 86, interactions: 4, ghostRate: 8, avgResponse: "2.4h", listings: 2, rating: "A" },
  { name: "Luis Vega", firm: "ERA Inmobiliaria", score: 79, interactions: 7, ghostRate: 12, avgResponse: "3.1h", listings: 2, rating: "B+" },
  { name: "María Castro", firm: "Coldwell Banker", score: 74, interactions: 6, ghostRate: 14, avgResponse: "3.8h", listings: 2, rating: "B" },
  { name: "Diego Navarro", firm: "Savills México", score: 71, interactions: 5, ghostRate: 16, avgResponse: "4.2h", listings: 2, rating: "B-" },
  { name: "Carmen López", firm: "Re/Max Santa Fe", score: 65, interactions: 4, ghostRate: 20, avgResponse: "5.4h", listings: 1, rating: "C+" },
  { name: "Carlos Reyes", firm: "Century 21", score: 62, interactions: 5, ghostRate: 22, avgResponse: "5.8h", listings: 1, rating: "C+" },
  { name: "José Morales", firm: "Coldwell Banker", score: 58, interactions: 8, ghostRate: 26, avgResponse: "6.7h", listings: 1, rating: "C" },
];

// ─── Utils ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n);

function img(id: string, w = 600, h = 400) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;
}

function scoreColor(s: number) {
  if (s >= 85) return "#1d4ed8";
  if (s >= 70) return "#b86a0a";
  return "#d4183d";
}

const BLDG_COLOR: Record<Building, string> = { peninsula: "#1d4ed8", torre300: "#d97706", paradox: "#7c3aed" };
const STATUS_LABEL: Record<Status, string> = { negotiate: "Negociar", fast_move: "Mov. Rápido", verify: "Verificar", monitor: "Monitorear" };
const STATUS_COLOR: Record<Status, string> = { negotiate: "#1d4ed8", fast_move: "#b86a0a", verify: "#1d4ed8", monitor: "#64748b" };
const STATUS_BG: Record<Status, string> = { negotiate: "rgba(29,78,216,0.1)", fast_move: "rgba(184,106,10,0.1)", verify: "rgba(29,78,216,0.1)", monitor: "rgba(100,116,139,0.1)" };
const CONF_COLOR: Record<string, string> = { high: "#1d4ed8", mid: "#b86a0a", low: "#d4183d" };

function ScoreBar({ val, max = 100 }: { val: number; max?: number }) {
  return (
    <div className="card-score-bar-track">
      <div className="card-score-bar-fill" style={{ width: `${(val / max) * 100}%`, background: scoreColor(val) }} />
    </div>
  );
}

// ─── ListingDetailPanel ───────────────────────────────────────────────────────

function ListingDetailPanel({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const psm = Math.round(listing.price / listing.sqm);
  const agentObj = AGENTS.find((a: any) => a.name === listing.agentName);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const copyScript = () => {
    const scriptText = `He revisado ${FALLBACK_LISTINGS.filter((l: any) => l.building === listing.building && l.id !== listing.id).length} comparables activos en ${listing.buildingLabel}. Con ${listing.dom} días en mercado, el rango actual justifica una apertura de ${fmt(listing.anchor!)}. ¿Están abiertos a trabajar dentro de ese rango?`;
    navigator.clipboard?.writeText(scriptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <>
      <div className="drawer-overlay active" onClick={onClose} aria-hidden="true" />
      <div className="listing-detail-drawer">

        {/* Header */}
        <div className="detail-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: BLDG_COLOR[listing.building] + "18", color: BLDG_COLOR[listing.building], border: `1px solid ${BLDG_COLOR[listing.building]}30` }}>{listing.buildingLabel}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: STATUS_BG[listing.status], color: STATUS_COLOR[listing.status] }}>{STATUS_LABEL[listing.status]}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.1 }}>{listing.id} · Piso {listing.floor}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>{listing.bedrooms} rec · {listing.bathrooms} ba · {listing.sqm} m² · {listing.dom} días en mercado</div>
          </div>
          <button onClick={onClose} className="detail-close-btn" aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Hero image */}
        <div className="detail-hero">
          <img src={img(listing.imgId, 480, 210)} alt={`Interior ${listing.id}`} className="detail-hero-img" />
          <div className="detail-hero-content">
            <div className="detail-price">{(window as any).__formatPrice ? (window as any).__formatPrice(listing.price) : '$' + listing.price}<span className="detail-price-unit">/mes</span></div>
            <div className="detail-meta">{(window as any).__formatPrice ? (window as any).__formatPrice(psm) : '$' + psm}/m² · {listing.buildingLabel} Piso {listing.floor}</div>
          </div>
        </div>

        <div className="detail-body">
          {/* Negotiation band */}
          {listing.negotiable && listing.anchor && (
            <div>
              <div className="detail-section-title">Banda de Negociación</div>
              <div className="negotiation-band">
                <div className="negotiation-grid">
                  {[
                    { label: "Apertura", val: fmt(listing.anchor), highlight: true },
                    { label: "Lista", val: fmt(listing.price) },
                    { label: "Espacio", val: fmt(listing.price - listing.anchor) },
                  ].map(({ label, val, highlight }) => (
                    <div key={label} className="neg-item">
                      <div className="neg-label" style={{ color: highlight ? "var(--color-primary)" : undefined }}>{label}</div>
                      <div className={`neg-value ${highlight ? "highlight" : ""}`}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scores */}
          <div>
            <div className="detail-section-title">Scores de Inteligencia</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { label: "Oportunidad composite", val: listing.compositeScore },
                { label: "Poder de leverage", val: listing.leverageScore },
              ].map(({ label, val }) => (
                <div key={label} className="detail-score-row">
                  <span className="detail-score-label">{label}</span>
                  <ScoreBar val={val} />
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right", color: scoreColor(val) }}>{val}</span>
                </div>
              ))}
              <div className="detail-metrics-grid" style={{ marginTop: 6 }}>
                <div className="detail-metric">
                  <div className="detail-metric-label">Confianza</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CONF_COLOR[listing.confidence], marginTop: 1, textTransform: "capitalize" }}>{listing.confidence}</div>
                </div>
                <div className="detail-metric">
                  <div className="detail-metric-label">DOM</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: listing.dom > 50 ? "#1d4ed8" : "var(--color-text)", marginTop: 1, fontFamily: "var(--font-mono)" }}>{listing.dom} días</div>
                </div>
                <div className="detail-metric">
                  <div className="detail-metric-label">$/m²</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginTop: 1, fontFamily: "var(--font-mono)" }}>{fmt(psm)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Intel notes */}
          {listing.notes && (
            <div>
              <div className="detail-section-title">Lectura de mercado</div>
              <div className="detail-notes">{listing.notes}</div>
            </div>
          )}

          {/* Agent */}
          <div>
            <div className="detail-section-title">Agente</div>
            <div className="detail-agent">
              <div className="detail-agent-avatar">
                {listing.agentName.split(" ").map(p => p[0]).join("").slice(0, 2)}
              </div>
              <div className="detail-agent-info">
                <div className="detail-agent-name">{listing.agentName}</div>
                <div className="detail-agent-firm">{listing.agentFirm}</div>
              </div>
              {agentObj && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor(agentObj.score) }}>{agentObj.rating}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>ghost {agentObj.ghostRate}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Opening script with copy action */}
          {listing.anchor && (
            <div>
              <div className="detail-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Script de apertura
                <button onClick={copyScript} className={`detail-action-btn ${copied ? "copied" : ""}`} style={{ marginTop: 0, fontSize: "10.5px", padding: "4px 10px" }}>
                  {copied ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
              <div className="detail-script">
                "He revisado {FALLBACK_LISTINGS.filter((l: any) => l.building === listing.building && l.id !== listing.id).length} comparables activos en {listing.buildingLabel}. Con {listing.dom} días en mercado, el rango actual justifica una apertura de {fmt(listing.anchor)}. ¿Están abiertos a trabajar dentro de ese rango?"
              </div>
            </div>
          )}

          {listing.url && (
            <a 
              href={listing.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="detail-action-btn" 
              style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 8 }}
            >
              Ver anuncio original en Inmuebles24 ↗
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MarketPulseBar ───────────────────────────────────────────────────────────

function MarketPulseBar({ listings, formatPrice }: { listings: Listing[]; formatPrice: (n: number) => string }) {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const prices = [...listings].map(l => l.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] || 0;
  const psms = listings.map(l => Math.round(l.price / l.sqm)).sort((a, b) => a - b);
  const medPsm = psms[Math.floor(psms.length / 2)] || 0;
  const neg = listings.filter(l => l.negotiable).length;

  return (
    <div className="market-pulse-bar">
      <div className="pulse-left">
        <span className="pulse-dot" style={{ background: "#22c55e" }} />
        <span className="pulse-label">SF·CI</span>
        <span className="data-status" style={{ background: "rgba(29,78,216,0.12)", color: "#1d4ed8" }}>En vivo</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat">{listings.length} listados</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat pulse-mono">$/m² {formatPrice(medPsm)}</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat">{neg} negociables</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat pulse-mono">mediana {formatPrice(median)}</span>
      </div>
      <div className="pulse-right">
        <span className="pulse-time pulse-mono">{time.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} · Abr 2026</span>
        <button className="pulse-refresh-btn" title="Actualizar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ activeView, onNav, theme, onTheme, onBot, onGuide, search, onSearch, lang, onLangToggle, currency, onCurrencyToggle, formatPrice, t }: {
  activeView: View; onNav: (v: View) => void; theme: string; onTheme: () => void;
  onBot: () => void; onGuide: () => void; search: string; onSearch: (s: string) => void;
  lang: 'es' | 'en'; onLangToggle: () => void;
  currency: 'MXN' | 'USD'; onCurrencyToggle: () => void;
  formatPrice: (n: number) => string; t: (es: string, en: string) => string;
}) {
  const NAV: { id: View; label: string; icon: JSX.Element }[] = [
    { id: "overview", label: "Vista", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "operator", label: "Operador", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id: "compare", label: "Comparar", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
    { id: "agents", label: "Agentes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "dashboard", label: "Dashboard", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="8" height="8" rx="1"/><rect x="14" y="3" width="8" height="8" rx="1"/><rect x="2" y="13" width="8" height="8" rx="1"/><path d="M14 17h8M18 13v8"/></svg> },
    { id: "map", label: "Mapa", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
    { id: "tracking", label: "Fuentes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo" role="button" tabIndex={0} onClick={() => onNav("overview")} onKeyDown={e => e.key === "Enter" && onNav("overview")}>
          <svg className="logo-mark" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}>
            <defs>
              <linearGradient id="logoGrad" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="#0a3f41" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="24" height="24" rx="5" stroke="url(#logoGrad)" strokeWidth="2"/>
            <path d="M9 18.5C9 18.5 10.5 20 13.5 20C16.5 20 18 18.5 18 16.5C18 14 15.5 13.5 13.5 13C11.5 12.5 10 11.5 10 9.5C10 7.5 11.5 8 13.5 8C15.5 8 17 9 17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="13.5" cy="13.5" r="2.5" fill="currentColor" opacity="0.15"/>
            <line x1="10" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <div className="logo-text-wrap">
            <span className="logo-text">Santa Fe<span className="logo-accent"> CI</span></span>
            <span className="logo-tagline">Market Intelligence</span>
          </div>
        </div>
      </div>
      <div className="header-center">
        <div className="search-wrapper">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar por ID, edificio, agente…" aria-label="Buscar listados" />
          <span className="search-kbd-hint">⌘K</span>
          {search && (
            <button onClick={() => onSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-faint)", display: "flex", padding: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>
      <div className="header-right">
        <nav className="header-nav" aria-label="Navegación principal">
          {NAV.map(n => (
            <button key={n.id} className={"nav-btn" + (activeView === n.id ? " active" : "")} onClick={() => onNav(n.id)} style={{ position: "relative" }}>
              {n.icon}<span>{n.label}</span>
              {n.id === "tracking" && <span className="nav-alert-dot" style={{ display: "block" }} />}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          {/* Language toggle */}
          <button 
            onClick={onLangToggle} 
            className="icon-btn" 
            title={t("Cambiar idioma", "Change language")}
            style={{ fontSize: 11, fontWeight: 600, minWidth: 34 }}
          >
            {lang.toUpperCase()}
          </button>

          {/* Currency toggle (global + dashboard) */}
          <button 
            onClick={onCurrencyToggle} 
            className="icon-btn" 
            title={t("Cambiar moneda", "Change currency")}
            style={{ fontSize: 10, fontWeight: 700, minWidth: 42 }}
          >
            {currency}
          </button>

          <button className="sf-bot-header-btn" onClick={onBot} title={t("Asistente SF·CI (⌘/)", "SF·CI Assistant (⌘/)")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {t("Preguntar", "Ask")}
          </button>
          <button className="help-btn" onClick={onGuide} title={t("Modo guiado", "Guided mode")}>?</button>
          <button className="export-snapshot-btn" title={t("Exportar snapshot", "Export snapshot")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {t("Export", "Export")}
          </button>
          <button className="icon-btn" onClick={onTheme} aria-label={t("Cambiar tema", "Toggle theme")} title={t("Cambiar tema", "Toggle theme")}>
            {theme === "dark"
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

function ListingCard({ l, onClick, formatPrice }: { l: Listing; onClick: () => void; formatPrice: (n: number) => string }) {
  const psm = Math.round(l.price / l.sqm);
  const bc = BLDG_COLOR[l.building];
  return (
    <div className="listing-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick()} style={{ cursor: "pointer" }}>
      <div className="listing-card-media" style={{ position: "relative" }}>
        <img className="listing-card-img" src={img(l.imgId, 400, 220)} alt={`Interior ${l.id}`} loading="lazy" decoding="async" />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${bc}44 0%, transparent 60%)`, zIndex: 1 }} />
        <span className="building-card-img-badge" style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: bc + "cc" }}>{l.buildingLabel}</span>
        {l.negotiable && (
          <span className="card-status" style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(29,78,216,0.9)", color: "#fff" }}>Negociar</span>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{l.id} · Piso {l.floor}</div>
        <div className="card-price-row">
          <span className="card-price">{formatPrice(l.price)}</span>
          <span className="card-price-unit">/mes</span>
          <span className="card-sqm-price">{formatPrice(psm)}/m²</span>
        </div>
        <div className="card-features">
          <span className="card-feature"><span className="card-feature-key">Rec</span> {l.bedrooms}</span>
          <span className="card-feature"><span className="card-feature-key">Ba</span> {l.bathrooms}</span>
          <span className="card-feature"><span className="card-feature-key">M²</span> {l.sqm}</span>
          <span className="card-feature"><span className="card-feature-key">DOM</span> {l.dom}d</span>
          <span className="card-feature" style={{ background: CONF_COLOR[l.confidence] + "18", borderColor: CONF_COLOR[l.confidence] + "40", color: CONF_COLOR[l.confidence] }}>
            <span className="card-feature-key">Conf</span> {l.confidence}
          </span>
        </div>
        <div className="card-scores">
          {[{ label: "Oportunidad", val: l.compositeScore }, { label: "Leverage", val: l.leverageScore }].map(({ label, val }) => (
            <div className="card-score-row" key={label}>
              <span style={{ minWidth: 76, fontSize: 10.5 }}>{label}</span>
              <ScoreBar val={val} />
              <span className="card-score-value" style={{ color: scoreColor(val) }}>{val}</span>
            </div>
          ))}
        </div>
        {l.anchor && (
          <div className="card-anchor-band" style={{ marginTop: 10, padding: "7px 10px", borderRadius: 7, background: "var(--color-primary-muted)", border: "1px solid var(--color-primary-border)", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-primary)" }}>Anchor</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-text)" }}>{fmt(l.anchor)}</span>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: "auto" }}>espacio {fmt(l.price - l.anchor)}</span>
          </div>
        )}
        <div className="card-footer-hint">Ver inteligencia completa →</div>
        {l.url && (
          <a 
            href={l.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="card-external-link"
            style={{ fontSize: '10px', color: 'var(--color-primary)', marginTop: '6px', display: 'inline-block' }}
          >
            Ver en Inmuebles24 ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── OverviewView ─────────────────────────────────────────────────────────────

function OverviewView({ listings, allListings, filter, onFilter, onSelect, sortBy, onSort, formatPrice, t }: {
  listings: Listing[]; allListings: Listing[]; filter: string; onFilter: (f: string) => void;
  onSelect: (l: Listing) => void; sortBy: SortBy; onSort: (s: SortBy) => void;
  formatPrice: (n: number) => string; t: (es: string, en: string) => string;
}) {
  const [chartTab, setChartTab] = useState<"price_distribution" | "dom_distribution" | "score_distribution">("price_distribution");
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const src = allListings;
    const prices = src.map(l => l.price).sort((a, b) => a - b);
    const psms = src.map(l => Math.round(l.price / l.sqm)).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)] || 0;
    const medPsm = psms[Math.floor(psms.length / 2)] || 0;
    const avgDom = Math.round(src.reduce((s, l) => s + l.dom, 0) / (src.length || 1));
    const avgScore = Math.round(src.reduce((s, l) => s + l.compositeScore, 0) / (src.length || 1));
    const neg = src.filter(l => l.negotiable).length;
    const best = listings.slice().sort((a, b) => b.compositeScore - a.compositeScore)[0];
    return { median, medPsm, avgDom, avgScore, neg, best, total: src.length, filtered: listings.length };
  }, [listings, allListings]);

  const chartData = useMemo(() => {
    if (chartTab === "price_distribution") {
      const b: Record<string, number> = { "<35k": 0, "35–50k": 0, "50–65k": 0, "65–80k": 0, ">80k": 0 };
      allListings.forEach(l => {
        if (l.price < 35000) b["<35k"]++;
        else if (l.price < 50000) b["35–50k"]++;
        else if (l.price < 65000) b["50–65k"]++;
        else if (l.price < 80000) b["65–80k"]++;
        else b[">80k"]++;
      });
      return Object.entries(b).map(([name, value]) => ({ name, value }));
    }
    if (chartTab === "dom_distribution") {
      const b: Record<string, number> = { "0–15d": 0, "16–30d": 0, "31–45d": 0, "46–60d": 0, ">60d": 0 };
      allListings.forEach(l => {
        if (l.dom <= 15) b["0–15d"]++;
        else if (l.dom <= 30) b["16–30d"]++;
        else if (l.dom <= 45) b["31–45d"]++;
        else if (l.dom <= 60) b["46–60d"]++;
        else b[">60d"]++;
      });
      return Object.entries(b).map(([name, value]) => ({ name, value }));
    }
    const b: Record<string, number> = { "60–69": 0, "70–79": 0, "80–89": 0, "90+": 0 };
    allListings.forEach(l => {
      const s = l.compositeScore;
      if (s < 70) b["60–69"]++;
      else if (s < 80) b["70–79"]++;
      else if (s < 90) b["80–89"]++;
      else b["90+"]++;
    });
    return Object.entries(b).map(([name, value]) => ({ name, value }));
  }, [allListings, chartTab]);

  const FILTERS = [
    { id: "all", label: "Todos" }, { id: "peninsula", label: "Península" },
    { id: "torre300", label: "Torre 300" }, { id: "paradox", label: "Paradox" },
    { id: "negotiate", label: "Negociar" }, { id: "1bed", label: "1 Rec" },
    { id: "2bed", label: "2 Rec" }, { id: "3bed", label: "3+ Rec" },
  ];

  const KPIS = [
    { label: "Activos", value: stats.total, display: String(stats.total), sub: "listados en mercado", delta: +2 },
    { label: "Renta mediana", value: stats.median, display: fmt(stats.median), sub: "MXN/mes", delta: -1.4 },
    { label: "$/m² mediano", value: stats.medPsm, display: fmt(stats.medPsm), sub: "precio por metro", delta: +0.8 },
    { label: "Para negociar", value: stats.neg, display: String(stats.neg), sub: `${Math.round(stats.neg / stats.total * 100)}% del universo`, delta: 0 },
    { label: "DOM promedio", value: stats.avgDom, display: `${stats.avgDom}d`, sub: "días en mercado", delta: +3.2 },
    { label: "Score medio", value: stats.avgScore, display: String(stats.avgScore), sub: "índice oportunidad", delta: +1.1 },
  ];

  const EVENTS = [
    { dot: "#d4183d", text: "T3-2807 en Torre 300 — 172 m² 3 rec a $60k (datos Inmuebles24). Alta demanda." },
    { dot: "#b86a0a", text: "PAR-1145 Paradox 114 m² piso 45 — $50k (mant. ~$5.1k). Verificar disponibilidad." },
    { dot: "#1d4ed8", text: "PEN-1809 Peninsula amueblado 156 m² — $57k vista La Mexicana (Inmuebles24 real)." },
    { dot: "#1d4ed8", text: "Nuevo comp disponible en Paradox 210 m² a $64.9k — actualizado desde fuente primaria." },
    { dot: "#64748b", text: "Torre 300 y Península: precios $/m² mediano ~$430-465 (snapshot real listings)." },
  ];

  const decisionSummary = stats.best
    ? `${stats.neg} unidades con leverage verificado. Máxima oportunidad: ${stats.best.id} (score ${stats.best.compositeScore}, DOM ${stats.best.dom}d). Apertura sugerida: ${stats.best.anchor ? fmt(stats.best.anchor) : "—"}.`
    : "Cargando inteligencia de mercado…";

  return (
    <div id="overviewView" className="view active">
      {/* Hero */}
      <div className="overview-hero" role="img" aria-label="Vista aérea Santa Fe CDMX">
        <img className="overview-hero-img" src={img("1632854987458-d4950f98da3f", 1600, 720)} alt="Santa Fe CDMX vista nocturna" loading="eager" decoding="async" />
        <div className="overview-hero-overlay" />
        <div className="overview-hero-badge"><span className="hero-live-dot" /><span>Santa Fe CI · Abril 2026</span></div>
        <div className="overview-hero-content">
          <div className="overview-hero-title">Panorama operativo Santa Fe</div>
          <div className="overview-hero-sub">Arrendamiento residencial de alto valor en CDMX · Península, Torre 300 y Paradox</div>
        </div>
        <div className="overview-hero-panel" aria-label="Resumen ejecutivo del mercado">
          <div className="hero-panel-kicker">Resumen ejecutivo</div>
          <div className="hero-panel-metric-row">
            <div className="hero-panel-metric"><span className="hero-panel-label">Activos</span><strong>{stats.total} listados</strong></div>
            <div className="hero-panel-metric"><span className="hero-panel-label">{t("Renta mediana", "Median rent")}</span><strong>{formatPrice(stats.median)}</strong></div>
          </div>
          <div className="hero-panel-divider" />
          <div className="hero-panel-highlight">
            <span className="hero-panel-label">Señal principal</span>
            <strong>{stats.best?.id} — Score {stats.best?.compositeScore}</strong>
            <p>{stats.neg} unidades con leverage verificado. DOM medio: {stats.avgDom}d. $/m² mediano: {fmt(stats.medPsm)}.</p>
          </div>
        </div>
      </div>

      {/* View header */}
      <div className="view-header">
        <div className="view-title-block">
          <h1>{t("Arrendamiento premium en Santa Fe", "Premium rentals in Santa Fe")}</h1>
          <p className="subtitle">
            {stats.filtered < stats.total ? `${stats.filtered} de ${stats.total} listados` : `${stats.total} listados activos`}
            {" "}· {stats.neg} negociables · $/m² mediano {formatPrice(stats.medPsm)}
          </p>
        </div>
        <div className="filter-row" role="group" aria-label="Filtrar listados">
          {FILTERS.map(f => (
            <button key={f.id} className={"filter-chip" + (filter === f.id ? " active" : "")} onClick={() => onFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Decision engine */}
      <div className="decision-engine-banner">
        <span className="decision-engine-eyebrow">Motor de decisión</span>
        <div className="decision-engine-sep" />
        <span className="decision-engine-summary">{decisionSummary}</span>
        <button className="decision-engine-cta" onClick={() => setShowFilters(v => !v)}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          {showFilters ? "Cerrar" : "Filtros"}
        </button>
      </div>

      {showFilters && (
        <div className="adv-filter-details" style={{ marginBottom: "var(--space-3)" }}>
          <div className="adv-filter-body">
            <div className="adv-filter-group">
              <label className="adv-filter-label">Torre</label>
              <select className="adv-filter-select" value={["peninsula","torre300","paradox"].includes(filter) ? filter : "all"} onChange={e => onFilter(e.target.value)}>
                <option value="all">Todas las torres</option>
                <option value="peninsula">Península</option>
                <option value="torre300">Torre 300</option>
                <option value="paradox">Paradox</option>
              </select>
            </div>
            <div className="adv-filter-group">
              <label className="adv-filter-label">Recámaras</label>
              <select className="adv-filter-select" value={["1bed","2bed","3bed"].includes(filter) ? filter : "all"} onChange={e => onFilter(e.target.value)}>
                <option value="all">Todas</option>
                <option value="1bed">1 recámara</option>
                <option value="2bed">2 recámaras</option>
                <option value="3bed">3+ recámaras</option>
              </select>
            </div>
            <div className="adv-filter-group">
              <label className="adv-filter-label">&nbsp;</label>
              <label className="adv-filter-checkbox-row">
                <input type="checkbox" checked={filter === "negotiate"} onChange={e => onFilter(e.target.checked ? "negotiate" : "all")} />
                Solo negociables
              </label>
            </div>
          </div>
          <div className="adv-filter-actions">
            <button className="adv-filter-apply-btn" onClick={() => setShowFilters(false)}>Aplicar</button>
            <button className="adv-filter-reset-btn" onClick={() => { onFilter("all"); setShowFilters(false); }}>Restablecer</button>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="kpi-strip" role="region" aria-label="Indicadores clave">
        {KPIS.map((k, i) => (
          <div className="kpi-card" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className={"kpi-value" + (i >= 2 ? " mono" : "")}>{k.display}</div>
            <div className="kpi-sub">{k.sub}</div>
            <div className="kpi-delta">
              {k.delta > 0 ? <span style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 10 }}>↑ {k.delta}%</span>
                : k.delta < 0 ? <span style={{ color: "#d4183d", fontWeight: 700, fontSize: 10 }}>↓ {Math.abs(k.delta)}%</span>
                : <span style={{ color: "var(--color-text-faint)", fontSize: 10 }}>— sin cambio</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Intel gallery */}
      <section className="intel-gallery" aria-label="Visual intelligence Santa Fe">
        <article className="intel-gallery-hero">
          <img src={img("1680844844384-9781180278b7", 1000, 600)} alt="Vista aérea corredor Santa Fe" loading="lazy" decoding="async" />
          <div className="intel-gallery-overlay" />
          <div className="intel-gallery-copy">
            <span className="intel-gallery-kicker">Lectura visual</span>
            <h2>Santa Fe premium en una sola lectura</h2>
            <p>Península, Torre 300 y Paradox — posicionamiento, acabados y percepción premium del corredor CDMX.</p>
          </div>
        </article>
        <article className="intel-gallery-card">
          <img src={img("1564078516393-cf04bd966897", 500, 400)} alt="Interior sala residencia alto valor" loading="lazy" decoding="async" />
          <div className="intel-gallery-card-body"><span className="intel-gallery-label">Interior referencia</span><strong>Sala, luz natural y calidad de acabados</strong></div>
        </article>
        <article className="intel-gallery-card">
          <img src={img("1682184805271-11671b7ecf4c", 500, 400)} alt="Interior premium residencia ejecutiva" loading="lazy" decoding="async" />
          <div className="intel-gallery-card-body"><span className="intel-gallery-label">Señal premium</span><strong>Acabado ejecutivo y posicionamiento visual</strong></div>
        </article>
      </section>

      {/* Building cards */}
      <div className="buildings-strip" role="region" aria-label="Edificios">
        {BUILDINGS.map((b: any) => {
          const bl = allListings.filter(l => l.building === b.id);
          const bestB = bl.slice().sort((a, c) => c.compositeScore - a.compositeScore)[0];
          return (
            <div className="building-card" key={b.id} style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: b.color, borderRadius: "calc(var(--radius-lg) + 2px) calc(var(--radius-lg) + 2px) 0 0", zIndex: 1 }} />
              <div className="building-card-img-wrap">
                <img className="building-card-img" src={img(b.imgId, 600, 240)} alt={b.label} loading="lazy" decoding="async" />
                <span className="building-card-img-badge">{b.label}</span>
              </div>
              <div className="building-card-body">
                <div className="building-card-name">{b.label}</div>
                <div className="building-card-zone">{b.tagline}</div>
                <div className="building-card-stats">
                  {[{ v: String(b.activeListing), l: "Activos" }, { v: `${b.floors}p`, l: "Pisos" }, { v: fmt(b.avgPsm), l: "$/m²" }, { v: `${b.avgDom}d`, l: "DOM" }].map(({ v, l }) => (
                    <div className="building-stat" key={l}><span className="building-stat-value">{v}</span><span className="building-stat-label">{l}</span></div>
                  ))}
                </div>
                {bestB && (
                  <div className="building-best-value">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/></svg>
                    <span>Mejor: {bestB.id} · Score {bestB.compositeScore}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Market charts */}
      <div className="market-charts-panel">
        <div className="panel-header">
          <span className="panel-title">Distribución de Mercado</span>
          <div className="panel-tabs">
            {(["price_distribution", "dom_distribution", "score_distribution"] as const).map((t, i) => (
              <button key={t} className={"panel-tab" + (chartTab === t ? " active" : "")} onClick={() => setChartTab(t)}>
                {["Precio/m²", "Días en Mercado", "Score Valor"][i]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={({ payload, label }) => payload?.length ? <div className="sf-tooltip"><strong>{label}</strong>: {payload[0].value} listados</div> : null} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="var(--color-primary)" opacity={0.82} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events */}
      <details className="events-panel">
        <summary className="events-summary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Eventos recientes</span>
          <span className="events-count-badge">{EVENTS.length}</span>
        </summary>
        <div className="events-list">
          {EVENTS.map((e, i) => (
            <div className="event-item" key={i}>
              <div className="event-dot" style={{ background: e.dot }} />
              <span>{e.text}</span>
            </div>
          ))}
        </div>
      </details>

      {/* Listings */}
      <div className="listings-section-header">
        <span className="listings-section-title">Listados</span>
        <span className="listings-count" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-faint)" }}>
          {listings.length} resultado{listings.length !== 1 ? "s" : ""}
        </span>
        <div className="sort-controls">
          <label className="sort-label" htmlFor="sortSelect">Ordenar:</label>
          <select id="sortSelect" className="sort-select" value={sortBy} onChange={e => onSort(e.target.value as SortBy)}>
            <option value="composite_score">Oportunidad</option>
            <option value="leverage_score">Leverage</option>
            <option value="price_asc">Precio ↑</option>
            <option value="price_desc">Precio ↓</option>
            <option value="dom">Mayor antigüedad</option>
          </select>
        </div>
      </div>

      {listings.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 32px", gap: 12, color: "var(--color-text-faint)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span style={{ fontSize: 14 }}>Sin resultados para esta búsqueda</span>
          <button className="filter-chip" onClick={() => onFilter("all")} style={{ marginTop: 4 }}>Limpiar filtros</button>
        </div>
      ) : (
        <div className="listings-grid" role="list">
          {listings.map(l => <ListingCard key={l.id} l={l} onClick={() => onSelect(l)} formatPrice={formatPrice} />)}
        </div>
      )}
    </div>
  );
}

// ─── OperatorView ─────────────────────────────────────────────────────────────

function OperatorView({ listings, onSelect, formatPrice, t }: { listings: Listing[]; onSelect: (l: Listing) => void; formatPrice: (n: number) => string; t: (es: string, en: string) => string }) {
  const [opFilter, setOpFilter] = useState<string>("all");
  const actionListings = useMemo(() =>
    listings.filter(l => opFilter === "all" || l.status === opFilter).sort((a, b) => b.compositeScore - a.compositeScore),
    [listings, opFilter]
  );

  return (
    <div>
      <div className="negotiation-decision-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <div className="decision-banner-text">
          <div className="decision-banner-label" style={{ color: "#1d4ed8" }}>Negotiation Workbench — Lista de acción</div>
          <div className="decision-banner-desc">Unidades ordenadas por score composite. "Negociar" = oportunidad verificada con anchor, opening script y battle card listos.</div>
        </div>
      </div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Negotiation Workbench — Hoy</h1>
          <p className="subtitle">Argumentos, banda operativa y guión de cierre · {actionListings.length} unidades · Ordenado por oportunidad</p>
        </div>
      </div>
      <div className="op-filter-bar">
        {[{ id: "all", label: "Todos" }, { id: "negotiate", label: "Negociar" }, { id: "fast_move", label: "Mov. Rápido" }, { id: "verify", label: "Verificar" }, { id: "monitor", label: "Monitorear" }].map(f => (
          <button key={f.id} className={"op-filter-btn" + (opFilter === f.id ? " active" : "")} onClick={() => setOpFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      {actionListings.map((l, i) => (
        <div className="operator-card" key={l.id} onClick={() => onSelect(l)} style={{ cursor: "pointer" }}>
          <div className="op-rank">#{i + 1}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "var(--color-text)" }}>{l.id}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: STATUS_BG[l.status], color: STATUS_COLOR[l.status] }}>{STATUS_LABEL[l.status]}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Piso {l.floor} · {l.bedrooms} rec · {l.sqm} m²</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: l.notes ? 8 : 0, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{formatPrice(l.price)}</span>
              {l.anchor && <span style={{ fontSize: 12, color: "var(--color-primary)" }}>→ Anchor: <strong>{fmt(l.anchor)}</strong></span>}
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>DOM {l.dom}d</span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{l.agentName} · {l.agentFirm}</span>
            </div>
            {l.notes && <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.55 }}>{l.notes}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: scoreColor(l.compositeScore) }}>{l.compositeScore}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-faint)" }}>Score</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CompareView ──────────────────────────────────────────────────────────────

function CompareView({ listings, formatPrice, t }: { listings: Listing[]; formatPrice: (n: number) => string; t: (es: string, en: string) => string }) {
  const [metric, setMetric] = useState<"psm" | "dom" | "score" | "price">("score");

  const byBuilding = useMemo(() => BUILDINGS.map((b: any) => {
    const bl = listings.filter(l => l.building === b.id);
    const avgPsm = bl.length ? Math.round(bl.reduce((s, l) => s + l.price / l.sqm, 0) / bl.length) : 0;
    const avgDom = bl.length ? Math.round(bl.reduce((s, l) => s + l.dom, 0) / bl.length) : 0;
    const avgScore = bl.length ? Math.round(bl.reduce((s, l) => s + l.compositeScore, 0) / bl.length) : 0;
    const avgPrice = bl.length ? Math.round(bl.reduce((s, l) => s + l.price, 0) / bl.length) : 0;
    return { ...b, avgPsm, avgDom, avgScore, avgPrice, count: bl.length, neg: bl.filter(l => l.negotiable).length };
  }), [listings]);

  const chartData = byBuilding.map(b => ({
    name: b.label,
    value: metric === "psm" ? b.avgPsm : metric === "dom" ? b.avgDom : metric === "score" ? b.avgScore : Math.round(b.avgPrice / 1000),
    color: b.color,
  }));

  const METRICS = [{ id: "score" as const, label: "Score Composite" }, { id: "psm" as const, label: "$/m² promedio" }, { id: "dom" as const, label: "Días en mercado" }, { id: "price" as const, label: "Precio (k MXN)" }];

  return (
    <div>
      <div className="compare-decision-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
        <div className="decision-banner-text">
          <div className="decision-banner-label">Comparative matrix — Benchmark operativo</div>
          <div className="decision-banner-desc">Análisis lado a lado: $/m², días en mercado, leverage y score composite por edificio.</div>
        </div>
      </div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Comparative Matrix — Benchmark por Torre</h1>
          <p className="subtitle">$/m² · Días en mercado · Leverage · Score composite por edificio</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {METRICS.map(m => <button key={m.id} className={"filter-chip" + (metric === m.id ? " active" : "")} onClick={() => setMetric(m.id)}>{m.label}</button>)}
      </div>
      <div className="market-charts-panel" style={{ marginBottom: "var(--space-5)" }}>
        <div className="panel-header"><span className="panel-title">{METRICS.find(m => m.id === metric)?.label} por Torre</span></div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
            <Tooltip content={({ payload, label }) => payload?.length ? <div className="sf-tooltip"><strong>{label}</strong>: {payload[0].value}{metric === "dom" ? "d" : metric === "price" ? "k" : ""}</div> : null} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="dash-chart-card" style={{ overflowX: "auto" }}>
        <table className="compare-table" style={{ width: "100%" }}>
          <thead><tr><th>Torre</th><th>Activos</th><th>$/m² prom.</th><th>Precio prom.</th><th>DOM prom.</th><th>Score prom.</th><th>Negociables</th></tr></thead>
          <tbody>
            {byBuilding.map(b => (
              <tr key={b.id}>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color, display: "inline-block" }} /><strong style={{ color: "var(--color-text)", fontSize: 13 }}>{b.label}</strong></span></td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-text)" }}>{b.count}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{formatPrice(b.avgPsm)}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{formatPrice(b.avgPrice)}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{b.avgDom}d</td>
                <td><span style={{ fontWeight: 700, color: scoreColor(b.avgScore) }}>{b.avgScore}</span></td>
                <td><span style={{ background: "rgba(29,78,216,0.1)", color: "#1d4ed8", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{b.neg}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AgentsView ───────────────────────────────────────────────────────────────

function AgentsView({ t }: { t: (es: string, en: string) => string }) {
  return (
    <div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Directorio de Agentes</h1>
          <p className="subtitle">Credibilidad · ghost rate · tiempo de respuesta · historial de interacciones</p>
        </div>
      </div>
      <div className="scorecards-grid">
        {AGENTS.map((a: any) => (
          <div key={a.name} className="agent-card">
            <div className="agent-avatar">{a.name.split(" ").map(p => p[0]).join("").slice(0, 2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", color: "var(--color-text)", marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 8 }}>{a.firm}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[{ l: "Ghost", v: `${a.ghostRate}%`, bad: a.ghostRate > 15 }, { l: "Resp.", v: a.avgResponse, bad: parseFloat(a.avgResponse) > 4 }, { l: "Deals", v: String(a.listings), bad: false }, { l: "Interac.", v: String(a.interactions), bad: false }].map(({ l, v, bad }) => (
                  <span key={l} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-faint)" }}>{l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)", color: bad ? "#d4183d" : "var(--color-text)" }}>{v}</span>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span className="agent-rating" style={{ color: scoreColor(a.score) }}>{a.rating}</span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", color: scoreColor(a.score) }}>{a.score}</span>
              <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-faint)" }}>Score</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DashboardView ────────────────────────────────────────────────────────────

function DashboardView({ listings, currency, setCurrency, formatPrice, t }: { listings: Listing[]; currency: 'MXN'|'USD'; setCurrency: (c: 'MXN'|'USD') => void; formatPrice: (n: number) => string; t: (es: string, en: string) => string; }) {
  const domData = listings.map(l => ({ id: l.id, dom: l.dom, score: l.compositeScore }));
  const psmData = BUILDINGS.map((b: any) => {
    const bl = listings.filter(l => l.building === b.id);
    return { name: b.label, psm: bl.length ? Math.round(bl.reduce((s, l) => s + l.price / l.sqm, 0) / bl.length) : 0, color: b.color };
  });
  const scoreData = listings.slice().sort((a, b) => b.compositeScore - a.compositeScore).map(l => ({ name: l.id, value: l.compositeScore, color: scoreColor(l.compositeScore) }));
  const areaData = [
    { mes: "Ene", peninsula: 64000, torre300: 51000, paradox: 58000 },
    { mes: "Feb", peninsula: 66000, torre300: 52500, paradox: 59000 },
    { mes: "Mar", peninsula: 67000, torre300: 53000, paradox: 60500 },
    { mes: "Abr", peninsula: 68000, torre300: 55000, paradox: 62000 },
  ];

  const DASH_KPIS = [
    { label: t("Score promedio", "Avg score"), value: Math.round(listings.reduce((s, l) => s + l.compositeScore, 0) / listings.length), suffix: "/100", color: "var(--color-primary)" },
    { label: t("DOM máximo", "Max DOM"), value: Math.max(...listings.map(l => l.dom)), suffix: t("días", "days"), color: "#d4183d" },
    { label: t("Mejor anchor", "Best anchor"), value: formatPrice(Math.min(...listings.filter(l => l.anchor).map(l => l.anchor!))), suffix: t("apertura", "opening"), color: "#1d4ed8" },
    { label: t("Ghost alto", "High ghost"), value: AGENTS.filter((a: any) => a.ghostRate > 15).length, suffix: t("agentes", "agents"), color: "#b86a0a" },
  ];

  return (
    <div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>{t("Dashboard — Santa Fe AI", "Dashboard — Santa Fe AI")}</h1>
          <p className="subtitle">{t("Métricas clave · tendencias · distribución de mercado", "Key metrics · trends · market distribution")}</p>
        </div>
        {/* Currency switcher on Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t("Moneda", "Currency")}:</span>
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
            {(['MXN','USD'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} style={{ 
                padding: '4px 14px', fontSize: 12, fontWeight: 600,
                background: currency === c ? 'var(--color-primary)' : 'transparent',
                color: currency === c ? '#fff' : 'var(--color-text-muted)',
                border: 'none', cursor: 'pointer'
              }}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="dash-kpi-row">
        {DASH_KPIS.map(k => (
          <div className="dash-chart-card" key={k.label} style={{ padding: "14px 16px" }}>
            <div className="dash-chart-unit">{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: k.color, lineHeight: 1.1, marginTop: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-faint)", marginTop: 2 }}>{k.suffix}</div>
          </div>
        ))}
      </div>
      <div className="dash-charts-grid">
        <div className="dash-chart-card">
          <div className="dash-chart-title">Evolución de precio por torre</div>
          <div className="dash-chart-unit">MXN/mes promedio · Ene–Abr 2026</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [formatPrice(v), ""]} contentStyle={{ fontSize: 11, fontFamily: "var(--font-body)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 6 }} />
              <Area type="monotone" dataKey="peninsula" stroke="#1d4ed8" fill="#1d4ed820" strokeWidth={2} />
              <Area type="monotone" dataKey="torre300" stroke="#d97706" fill="#d9770620" strokeWidth={2} />
              <Area type="monotone" dataKey="paradox" stroke="#7c3aed" fill="#7c3aed20" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <div className="dash-chart-title">Score Composite por Listado</div>
          <div className="dash-chart-unit">Índice 0–100 · todos los activos</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <Tooltip content={({ payload, label }) => payload?.length ? <div className="sf-tooltip"><strong>{label}</strong>: {payload[0].value}</div> : null} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>{scoreData.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <div className="dash-chart-title">Precio por m² — por Torre</div>
          <div className="dash-chart-unit">MXN/m² promedio</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={psmData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <Tooltip content={({ payload, label }) => payload?.length ? <div className="sf-tooltip"><strong>{label}</strong>: {fmt(payload[0].value as number)}/m²</div> : null} />
              <Bar dataKey="psm" radius={[4, 4, 0, 0]}>{psmData.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-card">
          <div className="dash-chart-title">Leverage vs. Días en Mercado</div>
          <div className="dash-chart-unit">Correlación de poder negociador</div>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
              <XAxis dataKey="dom" type="number" name="DOM" tick={{ fontSize: 9, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="score" type="number" name="Score" tick={{ fontSize: 9, fill: "var(--color-text-faint)" }} axisLine={false} tickLine={false} />
              <Tooltip content={({ payload }) => payload?.length ? <div className="sf-tooltip"><strong>{(payload[0].payload as { id: string }).id}</strong><br />DOM: {(payload[0].payload as { dom: number }).dom}d · Score: {(payload[0].payload as { score: number }).score}</div> : null} />
              <Scatter data={domData} fill="var(--color-primary)" opacity={0.75} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── TrackingView ─────────────────────────────────────────────────────────────

function TrackingView({ t }: { t: (es: string, en: string) => string }) {
  const [tab, setTab] = useState("alerts");
  const ALERTS = [
    { severity: "#d4183d", id: "PAR-3001", msg: "Penthouse 300 m² a $120k — verificar si sigue activo (Inmuebles24)", time: "hace 1h" },
    { severity: "#b86a0a", id: "T3-2807", msg: "Torre 300 172 m² 3 rec @ $60k — alta rotación, confirmar piso", time: "hace 2h" },
    { severity: "#b86a0a", id: "PEN-1809", msg: "Península 156 m² amueblado $57k actualizado hoy", time: "hace 3h" },
    { severity: "#1d4ed8", id: "PAR-1145", msg: "Paradox piso 45 $50k (114 m²) — datos reales Inmuebles24", time: "hace 5h" },
    { severity: "#1d4ed8", id: "Benchmark", msg: "Inmuebles24 + Lamudi: ~246 + 109 departamentos Santa Fe activos", time: "hace 1h" },
    { severity: "#64748b", id: "Haus", msg: "Haus Santa Fe 139 m² @ $40k apareció en feed", time: "hace 4h" },
  ];
  const SNAPSHOTS = [
    { url: "inmuebles24.com/santa-fe-cuajimalpa", status: "ok", listings: 246, changed: 8, ts: "hace 1h" },
    { url: "lamudi.com.mx/santa-fe-cuajimalpa", status: "ok", listings: 109, changed: 4, ts: "hace 2h" },
    { url: "vivanuncios.com.mx/santa-fe", status: "ok", listings: 583, changed: 12, ts: "hace 3h" },
    { url: "inmuebles24.com/paradox", status: "ok", listings: 10, changed: 1, ts: "hace 4h" },
    { url: "inmuebles24.com/torre-300", status: "warn", listings: 6, changed: 0, ts: "hace 6h" },
  ];
  const SC = { ok: "#1d4ed8", warn: "#b86a0a", error: "#d4183d" };

  return (
    <div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Verificación de Fuentes</h1>
          <p className="subtitle">Estado de fuentes monitoreadas — cambios detectados · alertas activas · capturas</p>
        </div>
        <button className="collect-run-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Verificar ahora
        </button>
      </div>
      <div className="tracking-kpi-row">
        {[{ label: "Alertas activas", value: ALERTS.length, color: "#d4183d" }, { label: "Fuentes ok", value: SNAPSHOTS.filter(s => s.status === "ok").length, color: "#1d4ed8" }, { label: "Cambios 24h", value: SNAPSHOTS.reduce((s, x) => s + x.changed, 0), color: "#b86a0a" }, { label: "Error/warn", value: SNAPSHOTS.filter(s => s.status !== "ok").length, color: "#d4183d" }].map(k => (
          <div className="kpi-card" key={k.label} style={{ minHeight: "auto", padding: "12px 14px" }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: "1.4rem", color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div className="tracking-tabs" role="tablist">
        {[{ id: "alerts", label: "Alertas activas" }, { id: "snapshots", label: "Capturas de fuente" }].map(t => (
          <button key={t.id} className={"tracking-tab" + (tab === t.id ? " active" : "")} role="tab" onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "alerts" && (
        <div><div className="tracking-section-header"><span className="tracking-section-title">Cambios que requieren atención</span></div>
          {ALERTS.map((a, i) => (
            <div className="tracking-item" key={i}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.severity, flexShrink: 0, marginTop: 3 }} />
              <div style={{ flex: 1 }}><span style={{ fontWeight: 700, color: "var(--color-text)", marginRight: 8 }}>{a.id}</span><span style={{ color: "var(--color-text-muted)" }}>{a.msg}</span></div>
              <span style={{ fontSize: 10, color: "var(--color-text-faint)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "snapshots" && (
        <div><div className="tracking-section-header"><span className="tracking-section-title">Capturas de fuente</span><span className="tracking-section-sub">Última lectura por URL</span></div>
          {SNAPSHOTS.map((s, i) => (
            <div className="tracking-item" key={i}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: SC[s.status as keyof typeof SC], flexShrink: 0, marginTop: 3 }} />
              <div style={{ flex: 1 }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text)", marginRight: 8 }}>{s.url}</span><span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{s.listings} listados · {s.changed} cambios</span></div>
              <span style={{ fontSize: 10, color: "var(--color-text-faint)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{s.ts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MapView ──────────────────────────────────────────────────────────────────

function MapView() {
  const [selected, setSelected] = useState<string | null>(null);

  const locations = [
    { id: "peninsula", name: "Península", lat: 19.36, lng: -99.27, color: "#1d4ed8", desc: "Av. Santa Fe · Torre icónica" },
    { id: "torre300", name: "Torre 300", lat: 19.362, lng: -99.265, color: "#d97706", desc: "Av. Santa Fe · Vista La Mexicana" },
    { id: "paradox", name: "Paradox", lat: 19.365, lng: -99.262, color: "#7c3aed", desc: "Av. Santa Fe 546 · Exclusivo" },
  ];

  return (
    <div>
      <div className="view-header">
        <div className="view-title-block"><h1>Mapa — Santa Fe CDMX</h1><p className="subtitle">Distribución geográfica de listados por torre (datos aproximados)</p></div>
      </div>

      <div className="map-enhanced" style={{
        background: 'linear-gradient(135deg, #0f1620 0%, #1a2434 100%)',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 420,
        border: '1px solid var(--color-border)'
      }}>
        {/* Stylized map background */}
        <svg width="100%" height="340" viewBox="0 0 800 340" style={{ opacity: 0.9 }}>
          {/* Simplified Santa Fe area roads / park */}
          <rect x="40" y="40" width="720" height="260" rx="12" fill="#111b24" stroke="#22303f" strokeWidth="2"/>
          
          {/* Parque La Mexicana approx */}
          <ellipse cx="420" cy="170" rx="120" ry="70" fill="#0e2a1f" opacity="0.7"/>
          <text x="420" y="175" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="600">PARQUE LA MEXICANA</text>

          {/* Main avenue */}
          <line x1="80" y1="160" x2="720" y2="155" stroke="#334155" strokeWidth="18" strokeLinecap="round"/>
          <text x="400" y="130" textAnchor="middle" fill="#64748b" fontSize="10">AV. SANTA FE</text>

          {/* Building markers */}
          {locations.map((loc, i) => {
            const x = 160 + i * 240;
            const y = 120 + (i % 2) * 40;
            const isSel = selected === loc.id;
            return (
              <g key={loc.id} onClick={() => setSelected(isSel ? null : loc.id)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isSel ? 18 : 14} fill={loc.color} opacity={isSel ? 0.95 : 0.85} stroke="#fff" strokeWidth="3"/>
                <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">{loc.name.split(' ')[0]}</text>
                {isSel && <text x={x} y={y + 30} textAnchor="middle" fill="var(--color-text)" fontSize="11">{loc.desc}</text>}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(40, 300)">
            {BUILDINGS.map((b: any, idx: number) => (
              <g key={idx}>
                <circle cx={idx * 180 + 20} cy="8" r="6" fill={b.color} />
                <text x={idx * 180 + 34} y="12" fill="var(--color-text-muted)" fontSize="11">{b.label}</text>
              </g>
            ))}
          </g>
        </svg>

        <div style={{ position: 'absolute', bottom: 16, right: 24, fontSize: 11, color: 'var(--color-text-faint)' }}>
          Ubicaciones aproximadas · Haz clic en los marcadores
        </div>

        {/* Quick info cards */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {BUILDINGS.map((b: any) => {
            const listingCount = FALLBACK_LISTINGS.filter((l: any) => l.building === b.id && (l.bedrooms === 2 || l.bedrooms === 3)).length;
            return (
              <div key={b.id} style={{ background: 'var(--color-surface)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border)', minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color }} />
                  <strong>{b.label}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {listingCount} listados 2-3 rec · {b.tagline}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── BotPanel ─────────────────────────────────────────────────────────────────

function BotPanel({ open, onClose, listings }: { open: boolean; onClose: () => void; listings: Listing[] }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", text: "Hola. Soy el asistente SF·CI. Puedo analizar el mercado, comparar unidades y preparar estrategias de negociación." }]);
  const messagesRef = useRef<HTMLDivElement>(null);

  const STARTERS = ["¿Cuál es la mejor oportunidad hoy?", "Compara las 3 torres", "¿Qué unidades tienen más leverage?", "Anchor para PEN-1502"];

  const send = (text: string) => {
    if (!text.trim()) return;
    const next = [...messages, { role: "user", text }];
    const best = listings.slice().sort((a, b) => b.compositeScore - a.compositeScore)[0];
    const neg = listings.filter(l => l.negotiable);
    let reply = "";
    if (text.toLowerCase().includes("mejor") || text.toLowerCase().includes("oportunidad")) {
      reply = `La mejor oportunidad es **${best?.id}** (${best?.buildingLabel}, piso ${best?.floor}): score ${best?.compositeScore}/100, leverage ${best?.leverageScore}, DOM ${best?.dom}d. Apertura sugerida: ${best?.anchor ? fmt(best.anchor) : "—"}.`;
    } else if (text.toLowerCase().includes("leverage")) {
      const top = neg.sort((a, b) => b.leverageScore - a.leverageScore).slice(0, 3);
      reply = `Top 3 por leverage: ${top.map(l => `**${l.id}** (${l.leverageScore}pts, ${l.dom}d)`).join(" · ")}. Mayor DOM = menor resistencia del agente.`;
    } else if (text.toLowerCase().includes("compar") || text.toLowerCase().includes("torr")) {
      reply = `Benchmark — $/m² mediano: **Paradox $492** · Península $468 · Torre 300 $422. Score promedio: Paradox 79 · Península 77 · Torre 300 74. Mayor leverage activo: Torre 300, 2 unidades con DOM >50.`;
    } else if (text.toLowerCase().includes("pen-1809") || text.toLowerCase().includes("anchor") || text.toLowerCase().includes("peninsula")) {
      const l = listings.find(x => x.id === "PEN-1809");
      reply = l ? `PEN-1809 — Anchor: **${fmt(l.anchor!)}**. Espacio: ${fmt(l.price - l.anchor!)}. Score ${l.compositeScore}/100. Script: "Revisamos comparables activos en Península — el mercado justifica una apertura de ${fmt(l.anchor!)}."` : "Listado no encontrado en el filtro actual.";
    } else {
      const med = listings.map(l => l.price).sort((a, b) => a - b)[Math.floor(listings.length / 2)];
      reply = `Universo actual: **${listings.length} listados** · mediana ${fmt(med)} · ${neg.length} negociables · DOM promedio ${Math.round(listings.reduce((s, l) => s + l.dom, 0) / listings.length)}d.`;
    }
    setMessages([...next, { role: "bot", text: reply }]);
    setInput("");
    setTimeout(() => messagesRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
  };

  if (!open) return null;

  return (
    <div className="sf-bot-panel" style={{ display: "flex" }}>
      <div className="sf-bot-header">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div><div className="sf-bot-header-name">Asistente SF·CI</div><div className="sf-bot-header-sub">Motor de decisión · datos en vivo</div></div>
        <button className="sf-bot-close-btn" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="sf-bot-messages" ref={messagesRef}>
        {messages.map((m, i) => (
          <div key={i} className={"sf-bot-message sf-bot-message--" + m.role}>
            {m.text.split("**").map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </div>
        ))}
      </div>
      {messages.length === 1 && (
        <div className="sf-bot-starters">
          {STARTERS.map(s => <button key={s} className="sf-bot-starter-chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}
      <div className="sf-bot-input-row">
        <input className="sf-bot-input" placeholder="Pregunta sobre el mercado…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} />
        <button className="sf-bot-send-btn" onClick={() => send(input)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}

// ─── GuidedDialog ─────────────────────────────────────────────────────────────

function GuidedDialog({ onClose }: { onClose: () => void }) {
  const STEPS = [
    { label: "Filtrar el universo", desc: "Usa las fichas rápidas (torre, recámaras) o busca por ID/agente. Abre filtros avanzados para precio mínimo y m²." },
    { label: "Inspeccionar unidades", desc: "Haz clic en cualquier listado para ver el score composite, banda de negociación, perfil del agente y script de apertura." },
    { label: "Comparar hasta 3 torres", desc: "Ve a 'Comparar' para análisis lado a lado de $/m², DOM y leverage. Ideal antes de decidir." },
    { label: "Ejecutar el operador", desc: "Usa 'Operador' para la lista de acción del día: anchor, opening script y battle card por unidad." },
  ];
  useEffect(() => {
    const el = document.getElementById("guidedDialog") as HTMLDialogElement | null;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog id="guidedDialog" className="guided-dialog-bp" aria-labelledby="guidedDialogTitle">
      <div className="guided-card-bp">
        <div className="guided-eyebrow">Modo guiado</div>
        <h2 className="guided-title" id="guidedDialogTitle">Flujo de trabajo recomendado</h2>
        <p className="guided-subtitle">Motor de decisión para transacciones de alto valor en Santa Fe CDMX.</p>
        <ol className="guided-steps">
          {STEPS.map((s, i) => (
            <li className="guided-step" key={i}>
              <div className="guided-step-num">{i + 1}</div>
              <div className="guided-step-text">
                <div className="guided-step-label">{s.label}</div>
                <div className="guided-step-desc">{s.desc}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="guided-actions"><button className="guided-close-btn" onClick={onClose}>Entendido</button></div>
      </div>
    </dialog>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [botOpen, setBotOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("composite_score");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Phase 1: Load data from the new Santa Fe CI API
  const [listings, setListings] = useState<Listing[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const API = 'http://localhost:3000';

    async function loadData() {
      try {
        const [listingsRes, buildingsRes, agentsRes] = await Promise.all([
          fetch(`${API}/listings`),
          fetch(`${API}/buildings`),
          fetch(`${API}/agents`),
        ]);

        if (listingsRes.ok) setListings(await listingsRes.json());
        if (buildingsRes.ok) setBuildings(await buildingsRes.json());
        if (agentsRes.ok) setAgents(await agentsRes.json());
      } catch (e) {
        console.warn('API not available, using fallback data', e);
        // Fallback to original hardcoded data if server not running
        // (we'll keep the original consts below as fallback)
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, []);

  // Translation + Currency (global)
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [currency, setCurrency] = useState<'MXN' | 'USD'>('MXN');
  const EXCHANGE_RATE = 18.5; // MXN per 1 USD (approx)

  const t = (es: string, en: string) => (lang === 'es' ? es : en);

  function formatPrice(n: number) {
    const val = currency === 'USD' ? n / EXCHANGE_RATE : n;
    const prefix = currency === 'USD' ? 'US$ ' : '$';
    return prefix + new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-MX', { maximumFractionDigits: 0 }).format(Math.round(val));
  }

  // Expose for components defined outside (detail panel etc)
  (window as any).__formatPrice = formatPrice;

  const currentListings = listings.length > 0 ? listings : (typeof FALLBACK_LISTINGS !== 'undefined' ? FALLBACK_LISTINGS : [] as Listing[]);
  const currentBuildings = buildings.length > 0 ? buildings : (typeof BUILDINGS !== 'undefined' ? BUILDINGS : []);
  const currentAgents = agents.length > 0 ? agents : (typeof AGENTS !== 'undefined' ? AGENTS : []);

  const filteredListings = useMemo(() => {
    let list = currentListings.filter(l => {
      if (filter === "peninsula" || filter === "torre300" || filter === "paradox") return l.building === filter;
      if (filter === "negotiate") return l.negotiable;
      if (filter === "1bed") return l.bedrooms === 1;
      if (filter === "2bed") return l.bedrooms === 2;
      if (filter === "3bed") return l.bedrooms >= 3;
      return true;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.buildingLabel.toLowerCase().includes(q) ||
        l.agentName.toLowerCase().includes(q) ||
        l.agentFirm.toLowerCase().includes(q) ||
        String(l.price).includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortBy === "composite_score") return b.compositeScore - a.compositeScore;
      if (sortBy === "leverage_score") return b.leverageScore - a.leverageScore;
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "dom") return b.dom - a.dom;
      return 0;
    });
  }, [filter, search, sortBy, currentListings]);

  const TICKER = currentListings.length > 0 
    ? currentListings.slice(0, 4).map(l => `${l.id} · $${l.price / 1000}k · ${l.buildingLabel}`)
    : [
        "PAR-452 · $50k · Paradox 114m²", "T3-283 · $60k · Torre 300 172m²",
        "PEN-182 · $57k · Península amueblado", "PAR-213 · $65k · 210m² Paradox",
      ];

  return (
    <div className="sf-app" data-theme={theme}>
      <MarketPulseBar listings={filteredListings} formatPrice={formatPrice} />
      <Header 
        activeView={activeView} 
        onNav={setActiveView} 
        theme={theme} 
        onTheme={() => setTheme(t => t === "light" ? "dark" : "light")} 
        onBot={() => setBotOpen(v => !v)} 
        onGuide={() => setGuidedOpen(true)} 
        search={search} 
        onSearch={setSearch}
        lang={lang}
        onLangToggle={() => setLang(l => l === 'es' ? 'en' : 'es')}
        currency={currency}
        onCurrencyToggle={() => setCurrency(c => c === 'MXN' ? 'USD' : 'MXN')}
        formatPrice={formatPrice}
        t={t}
      />

      <main className="app-main" id="appMain">
        {activeView === "overview" && <OverviewView listings={filteredListings} allListings={currentListings} filter={filter} onFilter={setFilter} onSelect={setSelectedListing} sortBy={sortBy} onSort={setSortBy} formatPrice={formatPrice} t={t} />}
        {activeView === "operator" && <OperatorView listings={currentListings} onSelect={setSelectedListing} formatPrice={formatPrice} t={t} />}
        {activeView === "compare" && <CompareView listings={currentListings} formatPrice={formatPrice} t={t} />}
        {activeView === "agents" && <AgentsView t={t} />}
        {activeView === "dashboard" && <DashboardView listings={currentListings} currency={currency} setCurrency={setCurrency} formatPrice={formatPrice} t={t} />}
        {activeView === "tracking" && <TrackingView t={t} />}
        {activeView === "map" && <MapView />}
      </main>

      <footer className="app-footer">
        <div className="ticker-scroll-wrap" aria-label="Pulso de mercado">
          <div className="ticker-scroll-track">
            {[...TICKER, ...TICKER].map((item, i) => (
              <span key={i} style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-primary)", flexShrink: 0 }} />
                <span className="pulse-mono">{item}</span>
              </span>
            ))}
          </div>
        </div>
        <span className="pulse-mono" style={{ flexShrink: 0, whiteSpace: "nowrap", color: "var(--color-text-faint)", fontSize: 10 }}>SF·CI · Abr 2026</span>
      </footer>

      <BotPanel open={botOpen} onClose={() => setBotOpen(false)} listings={currentListings} />
      {selectedListing && <ListingDetailPanel listing={selectedListing} onClose={() => setSelectedListing(null)} />}
      {guidedOpen && <GuidedDialog onClose={() => setGuidedOpen(false)} />}
    </div>
  );
}
