import { useState } from "react";

export const icons = {
  hostel: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1",
  students: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-5.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  floor: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  room: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  award: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  x: "M6 18L18 6M6 6l12 12",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  check: "M5 13l4 4L19 7",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1",
  door: "M3 21h18M3 7v14M21 7v14M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 12h.01",
  users: "M12 43a8 8 0 100-16 8 8 0 000 16zM12 11a4 4 0 100-8 4 4 0 000 8z",
  file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  history: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  gear: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  zap: "M13 10V3L4 14h7v7l9-11h-7z",
  alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
};

export const Icon = ({ d, size = 18, color = "currentColor", className = "" }) => (
  <svg className={`inline-block shrink-0 ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const Badge = ({ color = "blue", children }) => {
  const colorMap = {
    blue: "bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20",
    green: "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20",
    amber: "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20",
    red: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    purple: "bg-[#5E5CE6]/10 text-[#5E5CE6] border-[#5E5CE6]/20",
    gray: "bg-[#86868B]/10 text-[#86868B] border-[#86868B]/20"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  );
};

export const Btn = ({ variant = "primary", size = "md", icon, children, onClick, className = "", disabled }) => {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs gap-2",
    lg: "px-5 py-2.5 text-sm gap-2"
  };
  const variants = {
    primary: "bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm hover:shadow-md shadow-[#0071E3]/20",
    secondary: "bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] border border-[#E5E5EA]",
    outline: "bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA] shadow-xs",
    ghost: "text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]",
    danger: "bg-[#FF3B30] hover:bg-[#E03126] text-white shadow-sm shadow-[#FF3B30]/20"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon && icons[icon] && <Icon d={icons[icon]} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">{title}</h1>
      {subtitle && <p className="text-xs text-[#86868B] font-medium mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </div>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-fade-in">
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E5E5EA] overflow-hidden animate-pop-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5EA] bg-[#F5F5F7]/50">
        <h3 className="font-bold text-[#1D1D1F] text-base">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-full text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] transition-colors">
          <Icon d={icons.x} size={18} />
        </button>
      </div>
      <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

export const Input = ({ label, type = "text", value, onChange, placeholder, disabled, className = "" }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white text-[#1D1D1F] placeholder-[#A1A1A6] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all duration-200 disabled:opacity-50 ${className}`}
    />
  </div>
);

export const Select = ({ label, value, onChange, options = [], className = "" }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className={`w-full bg-[#F5F5F7] border border-[#E5E5EA] focus:border-[#0071E3] focus:bg-white text-[#1D1D1F] rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-all duration-200 ${className}`}
    >
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export const StatCard = ({ title, value, sub, icon, accent = "#0071E3" }) => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E5EA] flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">{title}</span>
      {icon && icons[icon] && (
        <div className="p-2.5 rounded-2xl" style={{ backgroundColor: `${accent}15` }}>
          <Icon d={icons[icon]} size={20} color={accent} />
        </div>
      )}
    </div>
    <div>
      <div className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[#86868B] mt-1 font-medium">{sub}</div>}
    </div>
  </div>
);

export const Table = ({ headers = [], rows = [], emptyMsg = "No data available." }) => (
  <div className="w-full overflow-x-auto custom-scrollbar">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5E5EA] text-xs">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-4 py-8 text-center text-[#86868B]">
              {emptyMsg}
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="hover:bg-[#F5F5F7]/60 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-[#1D1D1F] align-middle">{cell}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export const ErrorBanner = ({ msg, onDismiss }) => {
  if (!msg) return null;
  return (
    <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in my-2">
      <div className="flex items-center gap-2 font-medium">
        <Icon d={icons.warning} size={16} color="#FF3B30" />
        <span>{msg}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[#FF3B30] hover:opacity-70">
          <Icon d={icons.x} size={16} />
        </button>
      )}
    </div>
  );
};

export const Spinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="w-8 h-8 rounded-full border-2 border-[#0071E3]/20 border-t-[#0071E3] animate-spin" />
  </div>
);
