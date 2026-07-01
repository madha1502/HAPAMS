// ─── ICON ────────────────────────────────────────────────────────────────────
export const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d.split("|").map((p, i) =>
      p.startsWith("circle:") ? null : <path key={i} d={p} />
    )}
    {d.split("|").map((p, i) =>
      p.startsWith("circle:")
        ? <circle key={`c${i}`} cx={p.split(":")[1]} cy={p.split(":")[2]} r={p.split(":")[3]} />
        : null
    )}
  </svg>
);

export const icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z|M9 22V12h6v10",
  students:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|circle:9:7:4|M23 21v-2a4 4 0 00-3-3.87|M16 3.13a4 4 0 010 7.75",
  hostel:    "M3 21h18|M5 21V7l8-4 8 4v14|M9 21v-6h6v6",
  floor:     "M2 20h20|M4 20V10l8-6 8 6v10|M4 10h16",
  room:      "M3 9l9-7 9 7v11H3z|M9 22V12h6v10",
  report:    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8",
  upload:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M17 8l-5-5-5 5|M12 3v12",
  users:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2|circle:12:7:4",
  settings:  "M12 2a10 10 0 110 20 10 10 0 010-20zm0 6v4l3 3|circle:12:12:3",
  log:       "M12 20h9|M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  search:    "circle:11:11:8|M21 21l-4.35-4.35",
  logout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
  plus:      "M12 5v14|M5 12h14",
  edit:      "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7|M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:     "M3 6h18|M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6|M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M7 10l5 5 5-5|M12 15V3",
  check:     "M20 6L9 17l-5-5",
  warning:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z|M12 9v4|circle:12:17:.5",
  chart:     "M18 20V10|M12 20V4|M6 20v-6",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|circle:12:12:3",
  key:       "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  close:     "M18 6L6 18|M6 6l12 12",
  filter:    "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  bell:      "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9|M13.73 21a2 2 0 01-3.46 0",
};

// ─── BADGE ───────────────────────────────────────────────────────────────────
export const Badge = ({ children, color = "blue" }) => {
  const c = {
    blue:  "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    red:   "bg-red-500/15 text-red-400 border border-red-500/30",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    gray:  "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c[color]}`}>
      {children}
    </span>
  );
};

// ─── STAT CARD ───────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, accent = "#3B82F6", icon }) => (
  <div style={{ background: "linear-gradient(135deg,#1E2E45 0%,#162033 100%)", borderColor: "#263548" }}
    className="rounded-xl border p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <span className="text-slate-400 text-xs font-medium tracking-wider uppercase">{label}</span>
      <span style={{ background: accent + "22", color: accent }} className="rounded-lg p-2">
        <Icon d={icons[icon] || icons.chart} size={16} color={accent} />
      </span>
    </div>
    <div>
      <div className="text-3xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  </div>
);

// ─── TABLE ───────────────────────────────────────────────────────────────────
export const Table = ({ headers, rows, emptyMsg = "No records found" }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-700/50">
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: "#1A2A3E" }}>
          {headers.map((h, i) => (
            <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={headers.length} className="text-center py-12 text-slate-500">{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid #1E2E45" }} className="hover:bg-slate-800/30 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-300 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

// ─── MODAL ───────────────────────────────────────────────────────────────────
export const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
    <div style={{ background: "#1E2E45", border: "1px solid #263548", maxWidth: 520, width: "100%" }}
      className="rounded-2xl shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <h3 className="text-white font-semibold">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <Icon d={icons.close} size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── INPUT / SELECT / BUTTON ──────────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <input {...props}
      style={{ background: "#0F1B2D", border: "1px solid #263548", color: "#E2E8F0" }}
      className="rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600" />
  </div>
);

export const Select = ({ label, options, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>}
    <select {...props}
      style={{ background: "#0F1B2D", border: "1px solid #263548", color: "#E2E8F0" }}
      className="rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Btn = ({ children, onClick, variant = "primary", size = "md", icon, disabled = false }) => {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50";
  const sizes   = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-sm" };
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    danger:  "bg-red-600/80 hover:bg-red-600 text-white",
    ghost:   "text-slate-400 hover:text-white hover:bg-slate-700/50",
    outline: "border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {icon && <Icon d={icons[icon] || icon} size={14} />}
      {children}
    </button>
  );
};

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────
export const PageHeader = ({ title, sub, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      {sub && <p className="text-slate-400 text-sm mt-1">{sub}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

// ─── ERROR BANNER ─────────────────────────────────────────────────────────────
export const ErrorBanner = ({ msg, onDismiss }) =>
  msg ? (
    <div style={{ background: "#3B0000", border: "1px solid #7F1D1D" }}
      className="rounded-lg px-4 py-3 text-red-300 text-sm flex items-center justify-between mb-4">
      <span>{msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-4 text-red-400 hover:text-white">
          <Icon d={icons.close} size={14} />
        </button>
      )}
    </div>
  ) : null;

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
  </div>
);
