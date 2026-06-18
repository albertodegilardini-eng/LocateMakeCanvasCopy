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
}

// ─── Data ────────────────────────────────────────────────────────────────────

const LISTINGS: Listing[] = [
  { id: "PEN-2201", building: "peninsula", buildingLabel: "Península", floor: 22, bedrooms: 2, bathrooms: 2, sqm: 145, price: 68000, dom: 47, compositeScore: 84, leverageScore: 78, negotiable: true, agentName: "Ricardo Solís", agentFirm: "CBRE México", confidence: "high", status: "negotiate", imgId: "1564078516393-cf04bd966897", anchor: 61500, notes: "47 días en mercado. Precio bajado 2 veces. Anchor $61,500 — soportado por 4 comps activos en Península pisos 18–26." },
  { id: "PEN-3401", building: "peninsula", buildingLabel: "Península", floor: 34, bedrooms: 3, bathrooms: 3, sqm: 195, price: 89000, dom: 28, compositeScore: 76, leverageScore: 64, negotiable: false, agentName: "Camila Herrera", agentFirm: "JLL México", confidence: "high", status: "fast_move", imgId: "1587985064135-0366536eab42", anchor: 85000 },
  { id: "PEN-1502", building: "peninsula", buildingLabel: "Península", floor: 15, bedrooms: 1, bathrooms: 1, sqm: 82, price: 38500, dom: 62, compositeScore: 91, leverageScore: 88, negotiable: true, agentName: "José Morales", agentFirm: "Coldwell Banker", confidence: "mid", status: "negotiate", imgId: "1562438668-bcf0ca6578f0", anchor: 34000, notes: "Mayor leverage del universo. 62 días sin movimiento. Apertura agresiva completamente válida — agente tiene historial de conceder 11–14% bajo lista después de DOM>55." },
  { id: "PEN-2803", building: "peninsula", buildingLabel: "Península", floor: 28, bedrooms: 2, bathrooms: 2, sqm: 152, price: 72000, dom: 19, compositeScore: 68, leverageScore: 52, negotiable: false, agentName: "Ana Ruiz", agentFirm: "Cushman & Wakefield", confidence: "high", status: "monitor", imgId: "1646987916641-1f3c8992daa2" },
  { id: "PEN-4001", building: "peninsula", buildingLabel: "Península", floor: 40, bedrooms: 3, bathrooms: 3.5, sqm: 220, price: 105000, dom: 34, compositeScore: 79, leverageScore: 71, negotiable: true, agentName: "Ricardo Solís", agentFirm: "CBRE México", confidence: "high", status: "fast_move", imgId: "1512918728675-ed5a9ecdebfd", anchor: 98000 },
  { id: "T3-1801", building: "torre300", buildingLabel: "Torre 300", floor: 18, bedrooms: 2, bathrooms: 2, sqm: 128, price: 55000, dom: 52, compositeScore: 87, leverageScore: 82, negotiable: true, agentName: "Luis Vega", agentFirm: "ERA Inmobiliaria", confidence: "high", status: "negotiate", imgId: "1699239116624-85268dce7377", anchor: 49500, notes: "52 días. Mejor $/m² activo en Torre 300. Anchor $49,500 — benchmark de corredor soporta margen de $5,500." },
  { id: "T3-2402", building: "torre300", buildingLabel: "Torre 300", floor: 24, bedrooms: 1, bathrooms: 1, sqm: 75, price: 32000, dom: 38, compositeScore: 74, leverageScore: 69, negotiable: true, agentName: "María Castro", agentFirm: "Coldwell Banker", confidence: "mid", status: "fast_move", imgId: "1682184805271-11671b7ecf4c", anchor: 29000 },
  { id: "T3-1103", building: "torre300", buildingLabel: "Torre 300", floor: 11, bedrooms: 3, bathrooms: 2, sqm: 168, price: 78000, dom: 71, compositeScore: 89, leverageScore: 84, negotiable: true, agentName: "Luis Vega", agentFirm: "ERA Inmobiliaria", confidence: "mid", status: "negotiate", imgId: "1587985064135-0366536eab42", anchor: 70000, notes: "71 días — record DOM del universo. Máxima posición de leverage. Apertura $70,000 con cierre objetivo $72,000. Luis Vega ha concedido promedio 9.2% en listados Torre 300 >60d." },
  { id: "T3-3201", building: "torre300", buildingLabel: "Torre 300", floor: 32, bedrooms: 2, bathrooms: 2, sqm: 136, price: 59500, dom: 14, compositeScore: 61, leverageScore: 44, negotiable: false, agentName: "Carmen López", agentFirm: "Re/Max Santa Fe", confidence: "high", status: "monitor", imgId: "1564078516393-cf04bd966897" },
  { id: "T3-2004", building: "torre300", buildingLabel: "Torre 300", floor: 20, bedrooms: 1, bathrooms: 1, sqm: 68, price: 29500, dom: 44, compositeScore: 78, leverageScore: 73, negotiable: true, agentName: "María Castro", agentFirm: "Coldwell Banker", confidence: "low", status: "negotiate", imgId: "1562438668-bcf0ca6578f0", anchor: 27000 },
  { id: "PAR-1501", building: "paradox", buildingLabel: "Paradox", floor: 15, bedrooms: 2, bathrooms: 2, sqm: 118, price: 62000, dom: 31, compositeScore: 72, leverageScore: 65, negotiable: false, agentName: "Diego Navarro", agentFirm: "Savills México", confidence: "high", status: "fast_move", imgId: "1682184805271-11671b7ecf4c", anchor: 58000 },
  { id: "PAR-0801", building: "paradox", buildingLabel: "Paradox", floor: 8, bedrooms: 1, bathrooms: 1, sqm: 71, price: 34000, dom: 55, compositeScore: 82, leverageScore: 76, negotiable: true, agentName: "Elena Torres", agentFirm: "Knight Frank", confidence: "high", status: "negotiate", imgId: "1562438668-bcf0ca6578f0", anchor: 30500, notes: "55 días en mercado. Edificio más nuevo del corredor — prima de precio moderada. Anchor $30,500 en corrección sostenible por comparables Paradox pisos 6–10." },
  { id: "PAR-2201", building: "paradox", buildingLabel: "Paradox", floor: 22, bedrooms: 3, bathrooms: 3, sqm: 188, price: 95000, dom: 22, compositeScore: 69, leverageScore: 58, negotiable: false, agentName: "Diego Navarro", agentFirm: "Savills México", confidence: "high", status: "monitor", imgId: "1646987916641-1f3c8992daa2" },
  { id: "PAR-1102", building: "paradox", buildingLabel: "Paradox", floor: 11, bedrooms: 2, bathrooms: 2, sqm: 125, price: 58500, dom: 41, compositeScore: 85, leverageScore: 79, negotiable: true, agentName: "Elena Torres", agentFirm: "Knight Frank", confidence: "high", status: "negotiate", imgId: "1699239116624-85268dce7377", anchor: 53000, notes: "41 días. Score composite líder en bloque Paradox 2 rec. Apertura $53,000 — espacio de negociación $5,500." },
  { id: "PAR-0602", building: "paradox", buildingLabel: "Paradox", floor: 6, bedrooms: 1, bathrooms: 1, sqm: 65, price: 31000, dom: 67, compositeScore: 88, leverageScore: 83, negotiable: true, agentName: "Carlos Reyes", agentFirm: "Century 21", confidence: "mid", status: "negotiate", imgId: "1512918728675-ed5a9ecdebfd", anchor: 27500, notes: "67 días — segunda oportunidad más fuerte del universo. Confianza media: verificar disponibilidad antes de agendar visita. Anchor $27,500 con margen hasta $28,500." },
];

const BUILDINGS = [
  { id: "peninsula", label: "Península", color: "#1d4ed8", units: 312, floors: 45, built: 2005, avgPsm: 468, avgDom: 38, activeListing: 5, imgId: "1443527394413-4b820fd08dde", tagline: "Amenidades premium · Pisos 15–40 · DOM 38d" },
  { id: "torre300", label: "Torre 300", color: "#d97706", units: 248, floors: 38, built: 2010, avgPsm: 422, avgDom: 44, activeListing: 5, imgId: "1528810289438-283f885c31ef", tagline: "Mejor $/m² · Vista corredor · DOM 44d" },
  { id: "paradox", label: "Paradox", color: "#7c3aed", units: 186, floors: 32, built: 2018, avgPsm: 492, avgDom: 43, activeListing: 5, imgId: "1559458049-9d62fceeb52b", tagline: "Edificio más nuevo · Acabados A+ · DOM 43d" },
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
  if (s >= 85) return "#1a7a38";
  if (s >= 70) return "#b86a0a";
  return "#d4183d";
}

const BLDG_COLOR: Record<Building, string> = { peninsula: "#1d4ed8", torre300: "#d97706", paradox: "#7c3aed" };
const STATUS_LABEL: Record<Status, string> = { negotiate: "Negociar", fast_move: "Mov. Rápido", verify: "Verificar", monitor: "Monitorear" };
const STATUS_COLOR: Record<Status, string> = { negotiate: "#1a7a38", fast_move: "#b86a0a", verify: "#1d4ed8", monitor: "#64748b" };
const STATUS_BG: Record<Status, string> = { negotiate: "rgba(26,122,56,0.1)", fast_move: "rgba(184,106,10,0.1)", verify: "rgba(29,78,216,0.1)", monitor: "rgba(100,116,139,0.1)" };
const CONF_COLOR: Record<string, string> = { high: "#1a7a38", mid: "#b86a0a", low: "#d4183d" };

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
  const agentObj = AGENTS.find(a => a.name === listing.agentName);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay active" onClick={onClose} aria-hidden="true" />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480, zIndex: 400,
        background: "var(--color-surface)", borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column",
        overflowY: "auto", animation: "slideInRight 180ms cubic-bezier(0.16,1,0.3,1)"
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--color-divider)", display: "flex", alignItems: "flex-start", gap: 12, flexShrink: 0, background: "var(--color-surface-2)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: BLDG_COLOR[listing.building] + "18", color: BLDG_COLOR[listing.building], border: `1px solid ${BLDG_COLOR[listing.building]}30` }}>{listing.buildingLabel}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: STATUS_BG[listing.status], color: STATUS_COLOR[listing.status] }}>{STATUS_LABEL[listing.status]}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-text)", lineHeight: 1.1 }}>{listing.id} · Piso {listing.floor}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>{listing.bedrooms} rec · {listing.bathrooms} ba · {listing.sqm} m² · {listing.dom} días en mercado</div>
          </div>
          <button onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0, transition: "background 120ms" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--color-surface-offset)")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Hero image */}
        <div style={{ height: 200, overflow: "hidden", position: "relative", flexShrink: 0 }}>
          <img src={img(listing.imgId, 480, 200)} alt={`Interior ${listing.id}`} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.52) saturate(0.75) contrast(1.08)" }} />
          <div style={{ position: "absolute", inset: "auto 0 0 0", padding: "20px 20px 16px", background: "linear-gradient(to top, rgba(4,7,10,0.9) 0%, transparent 100%)" }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmt(listing.price)}<span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7, marginLeft: 4 }}>/mes</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{fmt(psm)}/m² · {listing.buildingLabel} Piso {listing.floor}</div>
          </div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Negotiation band */}
          {listing.negotiable && listing.anchor && (
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(18,104,108,0.07)", border: "1px solid rgba(18,104,108,0.2)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-primary)", marginBottom: 10 }}>Banda de Negociación</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Apertura", val: fmt(listing.anchor), highlight: true },
                  { label: "Lista", val: fmt(listing.price) },
                  { label: "Espacio", val: fmt(listing.price - listing.anchor) },
                ].map(({ label, val, highlight }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: highlight ? "var(--color-primary)" : "var(--color-text-faint)", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: highlight ? "var(--color-primary)" : "var(--color-text)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: 10 }}>Scores de Inteligencia</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Oportunidad composite", val: listing.compositeScore },
                { label: "Poder de leverage", val: listing.leverageScore },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "140px 1fr 32px", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{label}</span>
                  <ScoreBar val={val} />
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right", color: scoreColor(val) }}>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: "var(--color-surface-2)", border: "1px solid var(--color-divider)" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-faint)" }}>Confianza</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CONF_COLOR[listing.confidence], marginTop: 2, textTransform: "capitalize" }}>{listing.confidence}</div>
                </div>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: "var(--color-surface-2)", border: "1px solid var(--color-divider)" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-faint)" }}>DOM</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: listing.dom > 50 ? "#1a7a38" : "var(--color-text)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{listing.dom} días</div>
                </div>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 7, background: "var(--color-surface-2)", border: "1px solid var(--color-divider)" }}>
                  <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-faint)" }}>$/m²</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{fmt(psm)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Intel notes */}
          {listing.notes && (
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: 6 }}>Lectura de mercado</div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{listing.notes}</p>
            </div>
          )}

          {/* Agent */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: 10 }}>Agente</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-primary-muted)", border: "1px solid var(--color-primary-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "var(--color-primary)", flexShrink: 0 }}>
                {listing.agentName.split(" ").map(p => p[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{listing.agentName}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{listing.agentFirm}</div>
              </div>
              {agentObj && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor(agentObj.score) }}>{agentObj.rating}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-faint)", fontFamily: "var(--font-mono)" }}>ghost {agentObj.ghostRate}%</div>
                </div>
              )}
            </div>
          </div>

          {/* Opening script */}
          {listing.anchor && (
            <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-text-faint)", marginBottom: 8 }}>Script de apertura</div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.65, fontStyle: "italic" }}>
                "He revisado {LISTINGS.filter(l => l.building === listing.building && l.id !== listing.id).length} comparables activos en {listing.buildingLabel}. Con {listing.dom} días en mercado, el rango actual justifica una apertura de {fmt(listing.anchor)}. ¿Están abiertos a trabajar dentro de ese rango?"
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MarketPulseBar ───────────────────────────────────────────────────────────

function MarketPulseBar({ listings }: { listings: Listing[] }) {
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
        <span className="data-status" style={{ background: "rgba(26,122,56,0.12)", color: "#1a7a38" }}>En vivo</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat">{listings.length} listados</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat pulse-mono">$/m² {fmt(medPsm)}</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat">{neg} negociables</span>
        <span className="pulse-sep">·</span>
        <span className="pulse-stat pulse-mono">mediana {fmt(median)}</span>
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

function Header({ activeView, onNav, theme, onTheme, onBot, onGuide, search, onSearch }: {
  activeView: View; onNav: (v: View) => void; theme: string; onTheme: () => void;
  onBot: () => void; onGuide: () => void; search: string; onSearch: (s: string) => void;
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
          <svg className="logo-mark" width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 17.5C8 17.5 9.5 19 12.5 19C15.5 19 17 17.5 17 15.5C17 13 14.5 12.5 12.5 12C10.5 11.5 9 10.5 9 8.5C9 6.5 10.5 7 12.5 7C14.5 7 16 8 16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="9" y1="13" x2="15.5" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45"/>
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
          <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar por ID, edificio, agente… (⌘K)" aria-label="Buscar listados" />
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
          <button className="sf-bot-header-btn" onClick={onBot} title="Asistente SF·CI (⌘/)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Preguntar
          </button>
          <button className="help-btn" onClick={onGuide} title="Modo guiado">?</button>
          <button className="export-snapshot-btn" title="Exportar snapshot">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button className="icon-btn" onClick={onTheme} aria-label="Cambiar tema" title="Cambiar tema">
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

function ListingCard({ l, onClick }: { l: Listing; onClick: () => void }) {
  const psm = Math.round(l.price / l.sqm);
  const bc = BLDG_COLOR[l.building];
  return (
    <div className="listing-card" role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick()} style={{ cursor: "pointer" }}>
      <div className="listing-card-media" style={{ position: "relative" }}>
        <img className="listing-card-img" src={img(l.imgId, 400, 220)} alt={`Interior ${l.id}`} loading="lazy" decoding="async" />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${bc}44 0%, transparent 60%)`, zIndex: 1 }} />
        <span className="building-card-img-badge" style={{ position: "absolute", top: 10, left: 10, zIndex: 2, background: bc + "cc" }}>{l.buildingLabel}</span>
        {l.negotiable && (
          <span className="card-status" style={{ position: "absolute", top: 10, right: 10, zIndex: 2, background: "rgba(26,122,56,0.9)", color: "#fff" }}>Negociar</span>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{l.id} · Piso {l.floor}</div>
        <div className="card-price-row">
          <span className="card-price">{fmt(l.price)}</span>
          <span className="card-price-unit">/mes</span>
          <span className="card-sqm-price">{fmt(psm)}/m²</span>
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
          <div style={{ marginTop: 10, padding: "7px 10px", borderRadius: 7, background: "rgba(18,104,108,0.07)", border: "1px solid rgba(18,104,108,0.18)", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-primary)" }}>Anchor</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-text)" }}>{fmt(l.anchor)}</span>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)", marginLeft: "auto" }}>espacio {fmt(l.price - l.anchor)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OverviewView ─────────────────────────────────────────────────────────────

function OverviewView({ listings, allListings, filter, onFilter, onSelect, sortBy, onSort }: {
  listings: Listing[]; allListings: Listing[]; filter: string; onFilter: (f: string) => void;
  onSelect: (l: Listing) => void; sortBy: SortBy; onSort: (s: SortBy) => void;
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
    { dot: "#d4183d", text: "T3-1103 alcanza 71 días en mercado — record DOM, máximo leverage activo" },
    { dot: "#b86a0a", text: "PAR-0602 sin actualización 67d — verificar disponibilidad antes de visita" },
    { dot: "#1d4ed8", text: "PEN-1502: agente redujo precio 3.1% hace 48h" },
    { dot: "#1a7a38", text: "T3-1801: disponibilidad inmediata confirmada por agente" },
    { dot: "#64748b", text: "5 nuevos comps Torre 300 indexados — benchmark $/m² actualizado" },
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
            <div className="hero-panel-metric"><span className="hero-panel-label">Renta mediana</span><strong>{fmt(stats.median)}</strong></div>
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
          <h1>Arrendamiento premium en Santa Fe</h1>
          <p className="subtitle">
            {stats.filtered < stats.total ? `${stats.filtered} de ${stats.total} listados` : `${stats.total} listados activos`}
            {" "}· {stats.neg} negociables · $/m² mediano {fmt(stats.medPsm)}
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
              {k.delta > 0 ? <span style={{ color: "#1a7a38", fontWeight: 700, fontSize: 10 }}>↑ {k.delta}%</span>
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
        {BUILDINGS.map(b => {
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
          {listings.map(l => <ListingCard key={l.id} l={l} onClick={() => onSelect(l)} />)}
        </div>
      )}
    </div>
  );
}

// ─── OperatorView ─────────────────────────────────────────────────────────────

function OperatorView({ listings, onSelect }: { listings: Listing[]; onSelect: (l: Listing) => void }) {
  const [opFilter, setOpFilter] = useState<string>("all");
  const actionListings = useMemo(() =>
    listings.filter(l => opFilter === "all" || l.status === opFilter).sort((a, b) => b.compositeScore - a.compositeScore),
    [listings, opFilter]
  );

  return (
    <div>
      <div className="negotiation-decision-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a7a38" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <div className="decision-banner-text">
          <div className="decision-banner-label" style={{ color: "#1a7a38" }}>Negotiation Workbench — Lista de acción</div>
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
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>{fmt(l.price)}</span>
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

function CompareView({ listings }: { listings: Listing[] }) {
  const [metric, setMetric] = useState<"psm" | "dom" | "score" | "price">("score");

  const byBuilding = useMemo(() => BUILDINGS.map(b => {
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
                <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(b.avgPsm)}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{fmt(b.avgPrice)}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{b.avgDom}d</td>
                <td><span style={{ fontWeight: 700, color: scoreColor(b.avgScore) }}>{b.avgScore}</span></td>
                <td><span style={{ background: "rgba(26,122,56,0.1)", color: "#1a7a38", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{b.neg}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AgentsView ───────────────────────────────────────────────────────────────

function AgentsView() {
  return (
    <div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Directorio de Agentes</h1>
          <p className="subtitle">Credibilidad · ghost rate · tiempo de respuesta · historial de interacciones</p>
        </div>
      </div>
      <div className="scorecards-grid">
        {AGENTS.map(a => (
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

function DashboardView({ listings }: { listings: Listing[] }) {
  const domData = listings.map(l => ({ id: l.id, dom: l.dom, score: l.compositeScore }));
  const psmData = BUILDINGS.map(b => {
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
    { label: "Score promedio", value: Math.round(listings.reduce((s, l) => s + l.compositeScore, 0) / listings.length), suffix: "/100", color: "var(--color-primary)" },
    { label: "DOM máximo", value: Math.max(...listings.map(l => l.dom)), suffix: "días", color: "#d4183d" },
    { label: "Mejor anchor", value: fmt(Math.min(...listings.filter(l => l.anchor).map(l => l.anchor!))), suffix: "apertura", color: "#1a7a38" },
    { label: "Ghost alto", value: AGENTS.filter(a => a.ghostRate > 15).length, suffix: "agentes", color: "#b86a0a" },
  ];

  return (
    <div>
      <div className="view-header">
        <div className="view-title-block">
          <h1>Dashboard — Santa Fe AI</h1>
          <p className="subtitle">Métricas clave · tendencias · distribución de mercado</p>
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
              <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ fontSize: 11, fontFamily: "var(--font-body)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 6 }} />
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

function TrackingView() {
  const [tab, setTab] = useState("alerts");
  const ALERTS = [
    { severity: "#d4183d", id: "T3-1103", msg: "71 días en mercado sin actualización — verificar disponibilidad con agente", time: "hace 2h" },
    { severity: "#d4183d", id: "PAR-0602", msg: "67 días. Confianza baja — fuente primaria sin respuesta", time: "hace 4h" },
    { severity: "#b86a0a", id: "PEN-1502", msg: "Precio modificado -3.1% (José Morales, Coldwell Banker)", time: "hace 1d" },
    { severity: "#b86a0a", id: "T3-2004", msg: "Confianza baja detectada — listing potencialmente fantasma", time: "hace 1d" },
    { severity: "#1d4ed8", id: "T3-1801", msg: "Disponibilidad confirmada directamente con agente vía llamada", time: "hace 6h" },
    { severity: "#64748b", id: "Benchmark", msg: "5 nuevos comps Torre 300 indexados — $/m² actualizado", time: "hace 3h" },
  ];
  const SNAPSHOTS = [
    { url: "lamudi.com.mx/santa-fe", status: "ok", listings: 42, changed: 3, ts: "hace 2h" },
    { url: "vivanuncios.com.mx/peninsula", status: "ok", listings: 18, changed: 1, ts: "hace 3h" },
    { url: "propiedades.com/torre300", status: "warn", listings: 14, changed: 0, ts: "hace 6h" },
    { url: "mercadoinmobiliario.mx/paradox", status: "ok", listings: 11, changed: 2, ts: "hace 4h" },
    { url: "inmuebles24.com/santafe-df", status: "error", listings: 0, changed: 0, ts: "hace 12h" },
  ];
  const SC = { ok: "#1a7a38", warn: "#b86a0a", error: "#d4183d" };

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
        {[{ label: "Alertas activas", value: ALERTS.length, color: "#d4183d" }, { label: "Fuentes ok", value: SNAPSHOTS.filter(s => s.status === "ok").length, color: "#1a7a38" }, { label: "Cambios 24h", value: SNAPSHOTS.reduce((s, x) => s + x.changed, 0), color: "#b86a0a" }, { label: "Error/warn", value: SNAPSHOTS.filter(s => s.status !== "ok").length, color: "#d4183d" }].map(k => (
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
  return (
    <div>
      <div className="view-header">
        <div className="view-title-block"><h1>Mapa — Santa Fe CDMX</h1><p className="subtitle">Distribución geográfica de listados por torre</p></div>
      </div>
      <div className="map-canvas" style={{ minHeight: 480, flexDirection: "column", gap: 12 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-faint)" strokeWidth="1.5" opacity="0.35"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-faint)" }}>Vista de mapa — MapLibre GL requiere token externo</p>
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          {BUILDINGS.map(b => <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-muted)" }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, display: "inline-block" }} />{b.label} · {b.activeListing} activos</span>)}
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
    } else if (text.toLowerCase().includes("pen-1502") || text.toLowerCase().includes("anchor")) {
      const l = listings.find(x => x.id === "PEN-1502");
      reply = l ? `PEN-1502 — Anchor: **${fmt(l.anchor!)}**. Espacio: ${fmt(l.price - l.anchor!)}. Score ${l.compositeScore}/100. Script: "Revisamos 4 comparables activos — el mercado justifica una apertura de ${fmt(l.anchor!)}."` : "Listado no encontrado en el filtro actual.";
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

  const filteredListings = useMemo(() => {
    let list = LISTINGS.filter(l => {
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
  }, [filter, search, sortBy]);

  const TICKER = [
    "PEN-1502 · Score 91 · NEGOCIAR", "T3-1103 · DOM 71d · MAX LEVERAGE",
    "PAR-0602 · Score 88 · DOM 67d", "T3-1801 · Anchor $49,500",
    "PAR-1102 · Score 85 · Paradox LÍDER", "$/m² mediano: $451",
    "Mediana renta: $58,500", "15 activos · 9 negociables",
  ];

  return (
    <div className="sf-app" data-theme={theme}>
      <MarketPulseBar listings={filteredListings} />
      <Header activeView={activeView} onNav={setActiveView} theme={theme} onTheme={() => setTheme(t => t === "light" ? "dark" : "light")} onBot={() => setBotOpen(v => !v)} onGuide={() => setGuidedOpen(true)} search={search} onSearch={setSearch} />

      <main className="app-main" id="appMain">
        {activeView === "overview" && <OverviewView listings={filteredListings} allListings={LISTINGS} filter={filter} onFilter={setFilter} onSelect={setSelectedListing} sortBy={sortBy} onSort={setSortBy} />}
        {activeView === "operator" && <OperatorView listings={LISTINGS} onSelect={setSelectedListing} />}
        {activeView === "compare" && <CompareView listings={LISTINGS} />}
        {activeView === "agents" && <AgentsView />}
        {activeView === "dashboard" && <DashboardView listings={LISTINGS} />}
        {activeView === "tracking" && <TrackingView />}
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

      <BotPanel open={botOpen} onClose={() => setBotOpen(false)} listings={filteredListings} />
      {selectedListing && <ListingDetailPanel listing={selectedListing} onClose={() => setSelectedListing(null)} />}
      {guidedOpen && <GuidedDialog onClose={() => setGuidedOpen(false)} />}
    </div>
  );
}
