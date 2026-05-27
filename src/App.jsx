import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = 'http://100.89.123.21:5000';

// ── Gaya Global ──────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg:        #0a0c10;
    --surface:   #111318;
    --surface2:  #181c24;
    --border:    rgba(255,255,255,0.07);
    --accent:    #e74c3c;
    --warn:      #f39c12;
    --safe:      #2ecc71;
    --text:      #e8eaf0;
    --muted:     #6b7280;
  }

  body { font-family: 'Space Grotesk', sans-serif; background: var(--bg); color: var(--text); overflow: hidden; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  .shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    grid-template-rows: 56px 1fr;
    height: 100vh; width: 100vw;
    overflow: hidden;
  }

  /* ── topbar ── */
  .topbar {
    grid-column: 1 / -1;
    display: flex; align-items: center; gap: 12px;
    padding: 0 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    z-index: 1000;
  }
  .topbar-logo {
    display: flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; letter-spacing: 0.02em;
  }
  .topbar-logo .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    animation: pulse-dot 2s ease-in-out infinite;
  }
  .topbar-badge {
    margin-left: auto;
    display: flex; align-items: center; gap: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: var(--muted);
  }
  .live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--safe);
    animation: pulse-dot 1.5s ease-in-out infinite;
  }

  /* ── sidebar ── */
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow: hidden;
    z-index: 100;
  }
  .sidebar-section { padding: 16px; border-bottom: 1px solid var(--border); }
  .section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 12px;
  }

  /* ── stat cards ── */
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px; padding: 12px;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: rgba(255,255,255,0.15); }
  .stat-card.high   { border-left: 3px solid var(--accent); }
  .stat-card.medium { border-left: 3px solid var(--warn); }
  .stat-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px; font-weight: 500; line-height: 1; margin-bottom: 4px;
  }
  .stat-card.high .stat-num   { color: var(--accent); }
  .stat-card.medium .stat-num { color: var(--warn); }
  .stat-label { font-size: 11px; color: var(--muted); }

  /* ── severity bar ── */
  .sev-bar-wrap { margin-top: 4px; }
  .sev-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .sev-bar-label { font-size: 11px; width: 52px; color: var(--muted); }
  .sev-bar-track { flex: 1; height: 6px; background: var(--surface2); border-radius: 99px; overflow: hidden; }
  .sev-bar-fill { height: 100%; border-radius: 99px; transition: width 0.8s cubic-bezier(.4,0,.2,1); }
  .sev-bar-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; width: 24px; text-align: right; color: var(--muted); }

  /* ── pothole list ── */
  .pothole-list { flex: 1; overflow-y: auto; padding: 8px; }
  .list-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px; border-radius: 8px;
    cursor: pointer; transition: background 0.15s; margin-bottom: 2px;
  }
  .list-item:hover  { background: var(--surface2); }
  .list-item.active { background: var(--surface2); outline: 1px solid var(--border); }
  .list-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .list-dot.high   { background: var(--accent); box-shadow: 0 0 6px var(--accent); }
  .list-dot.medium { background: var(--warn);   box-shadow: 0 0 6px var(--warn); }
  .list-title { font-size: 12px; font-weight: 500; line-height: 1.4; }
  .list-sub   { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

  /* ── map area ── */
  .map-wrap { position: relative; overflow: hidden; }
  .leaflet-container { background: #0d1117 !important; height: 100%; width: 100%; }

  /* ── coords hud ── */
  .coords-hud {
    position: absolute; bottom: 14px; right: 14px; z-index: 999;
    background: rgba(10,12,16,0.85); backdrop-filter: blur(8px);
    border: 1px solid var(--border); border-radius: 8px;
    padding: 8px 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: var(--muted);
    pointer-events: none; line-height: 1.6;
  }
  .coords-hud span { color: var(--text); }

  /* ── legend hud ── */
  .legend-hud {
    position: absolute; top: 14px; right: 14px; z-index: 999;
    background: rgba(10,12,16,0.85); backdrop-filter: blur(8px);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 14px; font-size: 11px; line-height: 1.8;
  }
  .legend-hud .legend-title { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .legend-row { display: flex; align-items: center; gap: 8px; }
  .legend-circle { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  /* ── popup custom ── */
  .leaflet-popup-content-wrapper {
    background: #111318 !important;
    border: 1px solid rgba(255,255,255,0.09) !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.7) !important;
    color: #e8eaf0 !important;
    font-family: 'Space Grotesk', sans-serif !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .leaflet-popup-tip-container { display: none; }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-popup-close-button {
    color: #6b7280 !important;
    font-size: 16px !important;
    padding: 8px 10px !important;
    top: 4px !important; right: 4px !important;
  }
  .leaflet-popup-close-button:hover { color: #e8eaf0 !important; }

  /* ── popup inner ── */
  .popup-inner {
    width: 240px;
    padding: 16px;
  }
  .popup-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px;
  }
  .popup-sev-dot {
    width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
  }
  .popup-title {
    font-size: 14px; font-weight: 700;
  }
  .popup-time {
    font-size: 11px; color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 10px;
  }
  .popup-thumb {
    width: 100%; aspect-ratio: 4/3;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--border);
    display: block;
    margin-bottom: 12px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .popup-thumb:hover { opacity: 0.85; }
  .popup-no-img {
    width: 100%; aspect-ratio: 4/3;
    background: var(--surface2);
    border-radius: 8px; border: 1px dashed var(--border);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
    font-size: 11px; color: var(--muted);
  }
  .popup-coords {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; color: var(--muted);
    margin-bottom: 12px;
    line-height: 1.8;
  }
  .popup-coords span { color: var(--text); }
  .popup-cta {
    width: 100%;
    padding: 9px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 12px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: opacity 0.2s, transform 0.15s;
  }
  .popup-cta:hover { opacity: 0.88; transform: translateY(-1px); }
  .popup-cta:active { transform: translateY(0); }
  .popup-cta.high   { background: rgba(231,76,60,0.18); color: var(--accent); border: 1px solid rgba(231,76,60,0.35); }
  .popup-cta.medium { background: rgba(243,156,18,0.15); color: var(--warn);   border: 1px solid rgba(243,156,18,0.3); }

  /* ── drawer overlay ── */
  .drawer-overlay {
    position: fixed; inset: 0; z-index: 1100;
    background: rgba(0,0,0,0);
    pointer-events: none;
    transition: background 0.35s;
  }
  .drawer-overlay.open {
    background: rgba(0,0,0,0.5);
    pointer-events: all;
  }

  /* ── drawer panel ── */
  .drawer {
    position: absolute; top: 0; right: 0;
    width: 380px; height: 100%;
    background: var(--surface);
    border-left: 1px solid var(--border);
    transform: translateX(100%);
    transition: transform 0.38s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column;
    overflow: hidden;
    pointer-events: all;
  }
  .drawer.open { transform: translateX(0); }

  .drawer-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .drawer-topbar-title {
    font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
  }
  .drawer-close {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--muted); font-size: 13px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: color 0.15s, border-color 0.15s;
  }
  .drawer-close:hover { color: var(--text); border-color: rgba(255,255,255,0.18); }

  .drawer-body { flex: 1; overflow-y: auto; padding: 20px; }

  /* ── drawer photo ── */
  .drawer-photo-wrap {
    position: relative;
    border-radius: 12px; overflow: hidden;
    border: 1px solid var(--border);
    margin-bottom: 20px;
    background: var(--surface2);
  }
  .drawer-photo-wrap img {
    width: 100%; display: block;
    aspect-ratio: 16/10; object-fit: cover;
  }
  .drawer-photo-badge {
    position: absolute; bottom: 10px; left: 10px;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    backdrop-filter: blur(8px);
  }
  .drawer-photo-badge.high   { background: rgba(231,76,60,0.75); color: #fff; }
  .drawer-photo-badge.medium { background: rgba(243,156,18,0.75); color: #fff; }
  .drawer-no-photo {
    aspect-ratio: 16/10;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    color: var(--muted); font-size: 12px;
  }
  .drawer-no-photo-icon { font-size: 32px; opacity: 0.25; }

  /* ── drawer info blocks ── */
  .drawer-section { margin-bottom: 20px; }
  .drawer-section-title {
    font-size: 10px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 10px;
  }
  .drawer-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }
  .drawer-info-cell {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px; padding: 12px;
  }
  .drawer-info-label { font-size: 10px; color: var(--muted); margin-bottom: 4px; }
  .drawer-info-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; font-weight: 500;
  }
  .drawer-info-cell.full { grid-column: 1 / -1; }

  /* ── drawer map mini ── */
  .drawer-map-link {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 11px;
    border-radius: 10px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--muted); font-size: 12px;
    text-decoration: none; cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    margin-top: 4px;
  }
  .drawer-map-link:hover { border-color: rgba(255,255,255,0.18); color: var(--text); }

  /* ── sev chip ── */
  .sev-chip {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 99px;
  }
  .sev-chip.high   { background: rgba(231,76,60,0.15);  color: var(--accent); border: 1px solid rgba(231,76,60,0.3); }
  .sev-chip.medium { background: rgba(243,156,18,0.12); color: var(--warn);   border: 1px solid rgba(243,156,18,0.25); }

  /* ── empty ── */
  .empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; flex: 1; gap: 8px;
    color: var(--muted); text-align: center; padding: 20px;
  }
  .empty-icon { font-size: 28px; opacity: 0.3; }
  .empty-text { font-size: 12px; line-height: 1.6; }

  /* ── animations ── */
  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.5; transform:scale(1.4); }
  }
  @keyframes fadein {
    from { opacity:0; transform:translateY(6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fadein { animation: fadein 0.4s ease both; }
`;

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 1.2 });
  }, [target, map]);
  return null;
}

function MouseCoords({ setCoords }) {
  const map = useMap();
  useEffect(() => {
    const h = (e) => setCoords({ lat: e.latlng.lat.toFixed(5), lng: e.latlng.lng.toFixed(5) });
    map.on('mousemove', h);
    return () => map.off('mousemove', h);
  }, [map, setCoords]);
  return null;
}

// ── Popup content rendered as plain React (not inside Leaflet DOM) ─────────
function PopupContent({ pothole, onViewDetail }) {
  const isHigh = pothole.severity === 'High';
  const color  = isHigh ? '#e74c3c' : '#f39c12';
  const cls    = isHigh ? 'high' : 'medium';

  return (
    <div className="popup-inner">
      <div className="popup-header">
        <div className="popup-sev-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <div className="popup-title" style={{ color }}>
          Keparahan {isHigh ? 'Tinggi' : 'Sedang'}
        </div>
      </div>

      <div className="popup-time">
        {new Date(pothole.created_at).toLocaleString('id-ID')}
      </div>

      {pothole.image_name ? (
        <img
          className="popup-thumb"
          src={`${API_BASE}/uploads/${pothole.image_name}`}
          alt="Bukti jalan rusak"
          onClick={onViewDetail}
          title="Klik untuk lihat detail"
        />
      ) : (
        <div className="popup-no-img">Tidak ada foto</div>
      )}

      <div className="popup-coords">
        LAT &nbsp;<span>{Number(pothole.lat).toFixed(6)}</span><br />
        LNG &nbsp;<span>{Number(pothole.lng).toFixed(6)}</span>
      </div>

      <button className={`popup-cta ${cls}`} onClick={onViewDetail}>
        <span>↗</span> Lihat Detail Lengkap
      </button>
    </div>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────
function DetailDrawer({ pothole, onClose }) {
  const open  = !!pothole;
  const isHigh = pothole?.severity === 'High';
  const cls    = isHigh ? 'high' : 'medium';
  const color  = isHigh ? '#e74c3c' : '#f39c12';

  const googleMapsUrl = pothole
    ? `https://www.google.com/maps?q=${pothole.lat},${pothole.lng}`
    : '#';

  const formatFull = (iso) =>
    new Date(iso).toLocaleString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

  return (
    <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`drawer ${open ? 'open' : ''}`}>
        {pothole && (
          <>
            <div className="drawer-topbar">
              <div>
                <div className="drawer-topbar-title">Detail Titik Rusak</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                  ID #{String(pothole.id).padStart(4, '0')}
                </div>
              </div>
              <button className="drawer-close" onClick={onClose}>✕</button>
            </div>

            <div className="drawer-body">

              {/* Photo */}
              <div className="drawer-section">
                <div className="drawer-photo-wrap">
                  {pothole.image_name ? (
                    <>
                      <img
                        src={`${API_BASE}/uploads/${pothole.image_name}`}
                        alt="Bukti jalan rusak"
                      />
                      <div className={`drawer-photo-badge ${cls}`}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                        {isHigh ? 'Keparahan Tinggi' : 'Keparahan Sedang'}
                      </div>
                    </>
                  ) : (
                    <div className="drawer-no-photo">
                      <div className="drawer-no-photo-icon">📷</div>
                      <div>Tidak ada foto tersedia</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="drawer-section">
                <div className="drawer-section-title">Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div className={`sev-chip ${cls}`}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                    {isHigh ? 'Tinggi' : 'Sedang'}
                  </div>
                  <div className="sev-chip" style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                    Aktif
                  </div>
                </div>
              </div>

              {/* Waktu */}
              <div className="drawer-section">
                <div className="drawer-section-title">Waktu Deteksi</div>
                <div className="drawer-info-grid">
                  <div className="drawer-info-cell full">
                    <div className="drawer-info-label">Tanggal & Waktu Lengkap</div>
                    <div className="drawer-info-val" style={{ fontSize: 11, lineHeight: 1.6 }}>
                      {formatFull(pothole.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Koordinat */}
              <div className="drawer-section">
                <div className="drawer-section-title">Koordinat</div>
                <div className="drawer-info-grid">
                  <div className="drawer-info-cell">
                    <div className="drawer-info-label">Latitude</div>
                    <div className="drawer-info-val">{Number(pothole.lat).toFixed(7)}</div>
                  </div>
                  <div className="drawer-info-cell">
                    <div className="drawer-info-label">Longitude</div>
                    <div className="drawer-info-val">{Number(pothole.lng).toFixed(7)}</div>
                  </div>
                  <div className="drawer-info-cell full">
                    <div className="drawer-info-label">Koordinat Desimal</div>
                    <div className="drawer-info-val" style={{ fontSize: 11 }}>
                      {Number(pothole.lat).toFixed(6)}, {Number(pothole.lng).toFixed(6)}
                    </div>
                  </div>
                </div>

                <a
                  className="drawer-map-link"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>🗺</span> Buka di Google Maps
                </a>
              </div>

              {/* Info tambahan */}
              <div className="drawer-section">
                <div className="drawer-section-title">Info Laporan</div>
                <div className="drawer-info-grid">
                  <div className="drawer-info-cell">
                    <div className="drawer-info-label">ID Laporan</div>
                    <div className="drawer-info-val">#{String(pothole.id).padStart(4, '0')}</div>
                  </div>
                  <div className="drawer-info-cell">
                    <div className="drawer-info-label">Foto</div>
                    <div className="drawer-info-val" style={{ color: pothole.image_name ? 'var(--safe)' : 'var(--muted)' }}>
                      {pothole.image_name ? 'Tersedia' : 'Tidak ada'}
                    </div>
                  </div>
                  {pothole.image_name && (
                    <div className="drawer-info-cell full">
                      <div className="drawer-info-label">Nama File</div>
                      <div className="drawer-info-val" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                        {pothole.image_name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [potholes, setPotholes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);   // for sidebar highlight
  const [drawerItem, setDrawerItem] = useState(null);   // for right drawer
  const [flyTarget, setFlyTarget]   = useState(null);
  const [coords, setCoords]         = useState({ lat: '-', lng: '-' });
  const [now, setNow]               = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/potholes`)
      .then(r => r.json())
      .then(d => { setPotholes(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  const highCount = potholes.filter(p => p.severity === 'High').length;
  const medCount  = potholes.filter(p => p.severity !== 'High').length;
  const total     = potholes.length;

  const handleSelect = (p) => {
    setSelected(p);
    setFlyTarget([p.lat, p.lng]);
  };

  const handleViewDetail = (p) => {
    setDrawerItem(p);
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-logo">
            <div className="dot" />
            POTHOLE MONITOR
          </div>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>Denpasar, Bali</span>
          <div className="topbar-badge">
            <div className="live-dot" />
            LIVE &nbsp;·&nbsp;
            {now.toLocaleTimeString('id-ID')}
          </div>
        </header>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="section-label">Statistik</div>
            <div className="stat-grid">
              <div className="stat-card" style={{ gridColumn: '1/-1', borderLeft: '3px solid var(--muted)' }}>
                <div className="stat-num" style={{ color: 'var(--text)' }}>{total}</div>
                <div className="stat-label">Total Titik Rusak</div>
              </div>
              <div className="stat-card high">
                <div className="stat-num">{highCount}</div>
                <div className="stat-label">Keparahan Tinggi</div>
              </div>
              <div className="stat-card medium">
                <div className="stat-num">{medCount}</div>
                <div className="stat-label">Keparahan Sedang</div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-label">Distribusi</div>
            <div className="sev-bar-wrap">
              <div className="sev-bar-row">
                <span className="sev-bar-label">Tinggi</span>
                <div className="sev-bar-track">
                  <div className="sev-bar-fill" style={{ width: total ? `${(highCount/total)*100}%` : '0%', background: 'var(--accent)' }} />
                </div>
                <span className="sev-bar-count">{highCount}</span>
              </div>
              <div className="sev-bar-row">
                <span className="sev-bar-label">Sedang</span>
                <div className="sev-bar-track">
                  <div className="sev-bar-fill" style={{ width: total ? `${(medCount/total)*100}%` : '0%', background: 'var(--warn)' }} />
                </div>
                <span className="sev-bar-count">{medCount}</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section" style={{ paddingBottom: 8 }}>
            <div className="section-label">Daftar Kejadian</div>
          </div>

          <div className="pothole-list">
            {loading && (
              <div className="empty">
                <div className="empty-icon">⟳</div>
                <div className="empty-text">Memuat data...</div>
              </div>
            )}
            {!loading && potholes.length === 0 && (
              <div className="empty">
                <div className="empty-icon">✓</div>
                <div className="empty-text">Tidak ada data.<br/>Coba periksa koneksi backend.</div>
              </div>
            )}
            {potholes.map((p, i) => (
              <div
                key={p.id}
                className={`list-item fadein ${selected?.id === p.id ? 'active' : ''}`}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => handleSelect(p)}
              >
                <div className={`list-dot ${p.severity === 'High' ? 'high' : 'medium'}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-title">{p.severity === 'High' ? '🔴' : '🟡'} &nbsp;{p.severity}</div>
                  <div className="list-sub">{formatTime(p.created_at)}</div>
                  <div className="list-sub" style={{ opacity: 0.6 }}>
                    {Number(p.lat).toFixed(4)}, {Number(p.lng).toFixed(4)}
                  </div>
                </div>
                <button
                  style={{
                    flexShrink: 0, alignSelf: 'center',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--muted)', borderRadius: 6, padding: '4px 7px',
                    fontSize: 10, cursor: 'pointer', transition: 'color 0.15s',
                  }}
                  onClick={(e) => { e.stopPropagation(); handleSelect(p); handleViewDetail(p); }}
                  title="Lihat detail"
                >
                  ↗
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="map-wrap">
          <MapContainer
            center={[-8.6705, 115.2128]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer attribution={TILE_ATTR} url={DARK_TILE} />
            <FlyTo target={flyTarget} />
            <MouseCoords setCoords={setCoords} />

            {potholes.map(p => {
              const isHigh = p.severity === 'High';
              const color  = isHigh ? '#e74c3c' : '#f39c12';
              return (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={isHigh ? 11 : 8}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
                  eventHandlers={{ click: () => handleSelect(p) }}
                >
                  <Popup maxWidth={260} minWidth={240}>
                    <PopupContent
                      pothole={p}
                      onViewDetail={() => handleViewDetail(p)}
                    />
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="legend-hud">
            <div className="legend-title">Legenda</div>
            <div className="legend-row">
              <div className="legend-circle" style={{ background: '#e74c3c', boxShadow: '0 0 6px #e74c3c' }} />
              <span style={{ fontSize: 11 }}>Keparahan Tinggi</span>
            </div>
            <div className="legend-row">
              <div className="legend-circle" style={{ background: '#f39c12', boxShadow: '0 0 6px #f39c12' }} />
              <span style={{ fontSize: 11 }}>Keparahan Sedang</span>
            </div>
          </div>

          {/* Coords HUD */}
          <div className="coords-hud">
            LAT <span>{coords.lat}</span> &nbsp; LNG <span>{coords.lng}</span>
          </div>
        </div>

      </div>

      {/* Right Drawer (portal-like, outside grid) */}
      <DetailDrawer pothole={drawerItem} onClose={() => setDrawerItem(null)} />
    </>
  );
}