import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { api } from "../api/client.js";
import { Badge, Btn, Table, Select } from "../components/ui.jsx";
import { icons, Icon } from "../components/ui.jsx";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const KNOWN_DEPTS = [
  "CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML","CSD","CSBS","IOT","MBA","MCA"
];

const STEPS = [
  "Enter Depts",
  "Upload Files",
  "Validating",
  "Cleansing",
  "Summary",
  "Merging",
  "Analysis",
  "Export",
];

const DEPT_COLORS = [
  "#3B82F6","#10B981","#F59E0B","#EF4444",
  "#8B5CF6","#EC4899","#06B6D4","#84CC16",
  "#F97316","#A78BFA","#34D399","#FB923C",
];

// Column aliases for register number and grade detection
const REG_ALIASES = [
  "register number","reg no","regno","registration number",
  "reg. no.","reg.no","reg no.","register no","register no.",
  "regisiter number","rno","reg.no.","roll no","roll number","roll no."
];
const GR_ALIASES = ["gr.","gr","grade","grd","grade/class"];

// ─── AUTO-CLEANSING LOGIC ─────────────────────────────────────────────────────
/**
 * Reads an XLSX worksheet and applies all 8 automated cleansing steps.
 * Returns { header, rows, stats } where rows is the cleaned 2-D array.
 */
function cleanDeptExcel(ws) {
  // 1. Read as raw 2-D array
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (raw.length < 2) throw new Error("File appears to be empty.");

  // Detect hidden rows from worksheet metadata
  const hiddenRowSet = new Set();
  if (ws["!rows"]) {
    ws["!rows"].forEach((row, idx) => { if (row && row.hidden) hiddenRowSet.add(idx); });
  }

  // Find header row – first row containing a register-number alias
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 15); i++) {
    if (hiddenRowSet.has(i)) continue;
    const lower = raw[i].map(c => String(c ?? "").toLowerCase().trim());
    if (lower.some(c => REG_ALIASES.some(a => c === a || c.includes(a)))) {
      headerRowIdx = i;
      break;
    }
  }

  const header    = raw[headerRowIdx];
  const headerLow = header.map(c => String(c ?? "").toLowerCase().trim());

  // Identify key columns
  const regCol = headerLow.findIndex(h => REG_ALIASES.some(a => h === a || h.includes(a)));
  const grCols = headerLow.reduce((acc, h, i) => {
    if (GR_ALIASES.some(a => h === a || h.includes(a))) acc.push(i);
    return acc;
  }, []);

  if (regCol === -1) {
    throw new Error(
      `Cannot find "Register Number" column. ` +
      `Detected headers: ${headerLow.slice(0, 8).join(" | ")}`
    );
  }

  let rows = raw.slice(headerRowIdx + 1);
  const origCount = rows.length;
  let emptyRemoved = 0, arrearRemoved = 0, hiddenRemoved = 0,
      dupRemoved   = 0, invalidRemoved = 0;

  // Step A – Remove hidden rows
  rows = rows.filter((_, relIdx) => {
    const absIdx = headerRowIdx + 1 + relIdx;
    if (hiddenRowSet.has(absIdx)) { hiddenRemoved++; return false; }
    return true;
  });

  // Step B – Remove completely empty rows
  rows = rows.filter(r => {
    const empty = r.every(c => !String(c ?? "").trim());
    if (empty) { emptyRemoved++; return false; }
    return true;
  });

  // Step C – Remove arrear / separator rows (S.No col 0 AND Register No both blank)
  rows = rows.filter(r => {
    const sno = String(r[0] ?? "").trim();
    const reg = String(r[regCol] ?? "").trim();
    if (!sno && !reg) { arrearRemoved++; return false; }
    return true;
  });

  // Step D – Trim all string values
  rows = rows.map(r => r.map(c => (typeof c === "string" ? c.trim() : c)));

  // Step E – Standardize grade values: ab/Ab → AB, u → U, ra → RA
  rows = rows.map(r => {
    const out = [...r];
    grCols.forEach(ci => { out[ci] = String(out[ci] ?? "").trim().toUpperCase(); });
    return out;
  });

  // Step F – Validate Register Numbers (must be ≥4 alphanumeric chars)
  rows = rows.filter(r => {
    const reg = String(r[regCol] ?? "").trim();
    const valid = /[A-Za-z0-9]{4,}/.test(reg);
    if (!valid) { invalidRemoved++; return false; }
    return true;
  });

  // Step G – Remove duplicate Register Numbers (keep first occurrence)
  const seen = new Set();
  rows = rows.filter(r => {
    const reg = String(r[regCol] ?? "").trim().toUpperCase();
    if (seen.has(reg)) { dupRemoved++; return false; }
    seen.add(reg);
    return true;
  });

  return {
    header,
    rows,
    stats: {
      original: origCount,
      cleaned:  rows.length,
      emptyRemoved,
      arrearRemoved,
      hiddenRemoved,
      dupRemoved,
      invalidRemoved,
    },
  };
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ current, steps }) {
  return (
    <div className="mb-8 overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                style={{
                  background: current > i ? "#10B981" : current === i ? "#3B82F6" : "#1E2E45",
                  color:      current >= i ? "white" : "#475569",
                  border:     current >= i ? "none" : "1px solid #263548",
                  boxShadow:  current === i ? "0 0 0 3px #3B82F625" : "none",
                }}
              >
                {current > i ? <Icon d={icons.check} size={12} /> : i + 1}
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: current >= i ? "#93C5FD" : "#475569" }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-6 sm:w-10 h-px mx-1 mb-4 transition-all duration-500"
                style={{ background: current > i ? "#10B981" : "#1E2E45" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANIMATED PROGRESS SCREEN ─────────────────────────────────────────────────
function ProgressScreen({ icon, color, title, subtitle }) {
  return (
    <div
      className="rounded-xl p-14 text-center"
      style={{ background: "#162033", border: "1px solid #263548" }}
    >
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div
          className="w-20 h-20 rounded-full border-4 animate-spin"
          style={{ borderColor: `${color}25`, borderTopColor: color }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon d={icon} size={24} color={color} />
        </div>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{subtitle}</p>
    </div>
  );
}

// ─── DEPARTMENT UPLOAD CARD ───────────────────────────────────────────────────
function DeptUploadCard({ index, dept, color, onNameChange, onFileChange }) {
  const fileRef = useRef();

  const borderColor =
    dept.status === "ready" ? "#10B981" :
    dept.status === "error" ? "#EF4444" : "#263548";

  return (
    <div
      className="rounded-xl p-5 transition-all duration-300"
      style={{
        background:  "#162033",
        border:      `1px solid ${borderColor}`,
        boxShadow:   dept.status === "ready" ? `0 0 14px ${borderColor}18` : "none",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: dept.status === "ready" ? "#10B981" : color + "33",
            color:      dept.status === "ready" ? "white"   : color,
          }}
        >
          {dept.status === "ready" ? <Icon d={icons.check} size={10} /> : index + 1}
        </div>
        <span className="text-slate-300 text-sm font-semibold">Department {index + 1}</span>
        {dept.status === "ready" && <Badge color="green">Ready</Badge>}
        {dept.status === "error" && <Badge color="red">Error</Badge>}
      </div>

      {/* Department name input with autocomplete suggestions */}
      <div className="flex flex-col gap-1.5 mb-3">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Department Name
        </label>
        <input
          list={`dept-suggestions-${index}`}
          value={dept.name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="e.g. CSE, ECE, MECH…"
          style={{ background: "#0F1B2D", border: "1px solid #263548", color: "#E2E8F0" }}
          className="rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600"
        />
        <datalist id={`dept-suggestions-${index}`}>
          {KNOWN_DEPTS.map(d => <option key={d} value={d} />)}
        </datalist>
      </div>

      {/* File drop zone */}
      <div
        className="rounded-xl p-5 text-center cursor-pointer transition-all duration-200 select-none"
        style={{
          background: "#0F1B2D",
          border:     `2px dashed ${dept.file ? "#10B981" : "#263548"}`,
        }}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onFileChange(f);
        }}
      >
        {dept.file ? (
          <div className="flex flex-col items-center gap-1">
            <Icon d={icons.check} size={20} color="#10B981" />
            <span className="text-emerald-400 text-sm font-medium truncate max-w-full px-2">
              {dept.file.name}
            </span>
            <span className="text-slate-500 text-xs">
              {(dept.file.size / 1024).toFixed(1)} KB · Click to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Icon d={icons.upload} size={22} color="#475569" />
            <span className="text-slate-400 text-sm font-medium">Click or drag &amp; drop</span>
            <span className="text-slate-600 text-xs">.xlsx / .xls only</span>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileChange(f); }}
        />
      </div>

      {dept.error && <p className="text-red-400 text-xs mt-2">{dept.error}</p>}
    </div>
  );
}

// ─── CLEANSING SUMMARY CARD ───────────────────────────────────────────────────
function CleaningSummaryCard({ deptName, stats, color }) {
  const retained = stats.original > 0
    ? Math.round((stats.cleaned / stats.original) * 100)
    : 100;

  const items = [
    { label: "Original",    value: stats.original,      color: "#64748B" },
    { label: "Cleaned",     value: stats.cleaned,       color: "#10B981" },
    { label: "Empty Rows",  value: stats.emptyRemoved,  color: "#475569" },
    { label: "Arrear Rows", value: stats.arrearRemoved, color: "#F59E0B" },
    { label: "Duplicates",  value: stats.dupRemoved,    color: "#8B5CF6" },
    { label: "Invalid",     value: stats.invalidRemoved,color: "#EF4444" },
  ];

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#162033", border: "1px solid #263548" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
        <h4 className="text-white font-semibold flex-1">{deptName}</h4>
        <Badge color={retained >= 90 ? "green" : retained >= 70 ? "amber" : "red"}>
          {retained}% retained
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: "#0F1B2D" }}>
            <div className="text-xl font-bold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Quality bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Data Quality</span>
          <span>{retained}%</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "#1E2E45" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${retained}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
/**
 * MultiDeptResultPage
 *
 * Props:
 *   students              – student master array (from backend)
 *   floors                – floors array (from backend)
 *   parseResultExcel      – function(ws) → parsedRows[]
 *   buildFloorReport      – function(parsedRows, students) → { summary, unmatched, total }
 *   computeConsolidationData – function(summary, hostel, students) → condData
 *   renderConsolidationTables – function(condData) → JSX
 */
export default function MultiDeptResultPage({
  students = [],
  floors   = [],
  parseResultExcel,
  buildFloorReport,
  computeConsolidationData,
  renderConsolidationTables,
}) {
  // Step: 0=count · 1=upload · 2=validating · 3=cleansing · 4=summary · 5=merging · 6=analysis · 7=done
  const [step,         setStep]         = useState(0);
  const [error,        setError]        = useState("");
  const [progressMsg,  setProgressMsg]  = useState("");

  // Step 0
  const [deptCountInput, setDeptCountInput] = useState("");
  const [deptCountError, setDeptCountError] = useState("");

  // Step 1 – array of { name, file, status:"idle"|"ready"|"error", error }
  const [depts, setDepts] = useState([]);

  // Step 4 – cleansing results per dept
  const [cleaningResults, setCleaningResults] = useState([]);

  // Step 6 – analysis
  const [floorReport,     setFloorReport]     = useState(null);
  const [selectedHostel,  setSelectedHostel]  = useState("Overall");
  const [saving,          setSaving]          = useState(false);

  // ─── helpers ────────────────────────────────────────────────────────────────
  const updateDept = (idx, patch) =>
    setDepts(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));

  // ─── STEP 0 ─────────────────────────────────────────────────────────────────
  function handleCountNext() {
    const raw = deptCountInput.trim();
    const n   = parseInt(raw, 10);
    if (!raw || isNaN(n) || n < 1 || n > 20 || String(n) !== raw) {
      setDeptCountError("Please enter a whole number between 1 and 20.");
      return;
    }
    setDeptCountError("");
    setDepts(Array.from({ length: n }, () => ({ name: "", file: null, status: "idle", error: "" })));
    setStep(1);
  }

  // ─── STEP 1 ─────────────────────────────────────────────────────────────────
  function handleFileSelect(idx, file) {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      updateDept(idx, { error: "Must be an .xlsx or .xls file.", status: "error", file: null });
      return;
    }
    updateDept(idx, { file, status: "ready", error: "" });
  }

  /** Validate all depts before proceeding. Returns true if all ok. */
  function validateAll() {
    const updated = depts.map(d => {
      if (!d.name.trim()) return { ...d, error: "Department name required.", status: "error" };
      if (!d.file)        return { ...d, error: "Please upload an Excel file.", status: "error" };
      return d;
    });

    // Duplicate department names
    const names = updated.map(d => d.name.trim().toUpperCase());
    names.forEach((name, i) => {
      if (names.indexOf(name) !== i)
        updated[i] = { ...updated[i], error: "Duplicate department name.", status: "error" };
    });

    // Duplicate file names
    const fnames = updated.map(d => d.file?.name || "");
    fnames.forEach((fn, i) => {
      if (fn && fnames.indexOf(fn) !== i)
        updated[i] = { ...updated[i], error: "Duplicate file uploaded.", status: "error" };
    });

    const hasError = updated.some(d => d.status === "error");
    setDepts(updated);
    return !hasError;
  }

  // ─── STEP 2 → 3 → 4 ─────────────────────────────────────────────────────────
  async function handleProceed() {
    if (!validateAll()) return;

    setStep(2); // Validating spinner
    await new Promise(r => setTimeout(r, 600));

    setStep(3); // Cleansing spinner
    const results = [];

    for (let i = 0; i < depts.length; i++) {
      const dept = depts[i];
      setProgressMsg(`Cleansing ${dept.name} (${i + 1} / ${depts.length})…`);
      await new Promise(r => setTimeout(r, 30)); // yield to browser

      await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => {
          try {
            const wb = XLSX.read(ev.target.result, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];

            // Apply auto-cleansing
            const { header, rows, stats } = cleanDeptExcel(ws);

            // Build cleaned worksheet + workbook for download
            const cleanedWs = XLSX.utils.aoa_to_sheet([header, ...rows]);
            const cleanedWb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(cleanedWb, cleanedWs, "Cleaned");

            // Parse student records for analysis (non-fatal if it fails)
            let parsed = [];
            try { parsed = parseResultExcel(cleanedWs); }
            catch (pErr) { console.warn(`Parse warning [${dept.name}]:`, pErr.message); }

            results.push({
              name: dept.name, fileName: dept.file.name,
              stats, header, cleanedRows: rows, cleanedWb, parsed,
            });
          } catch (err) {
            results.push({ name: dept.name, fileName: dept.file.name, error: err.message });
          }
          resolve();
        };
        reader.onerror = () => {
          results.push({ name: dept.name, error: "Failed to read file." });
          resolve();
        };
        reader.readAsArrayBuffer(dept.file);
      });
    }

    setCleaningResults(results);
    setProgressMsg("");
    setStep(4); // Cleansing summary
  }

  // ─── STEP 5 → 6 ─────────────────────────────────────────────────────────────
  async function handleMerge() {
    setStep(5);
    setProgressMsg("Merging department datasets…");
    await new Promise(r => setTimeout(r, 300));

    const allParsed = cleaningResults.flatMap(r => r.parsed || []);

    setProgressMsg("Cross-referencing with student master…");
    await new Promise(r => setTimeout(r, 300));

    const result = buildFloorReport(allParsed, students);
    setFloorReport(result);
    setProgressMsg("");
    setStep(6);
  }

  // ─── Save report ─────────────────────────────────────────────────────────────
  async function handleSaveReport() {
    setSaving(true);
    setError("");
    try {
      const settings = await api.getSettings();
      const deptNames = cleaningResults.filter(r => !r.error).map(r => r.name).join(", ");
      await api.addReport({
        title:   `Multi-Dept Result – ${deptNames}`,
        by:      "Admin",
        year:    settings.year,
        sem:     settings.sem,
        college: settings.college,
        hostel:  settings.hostel,
        summary: floorReport.summary,
      });
      setStep(7);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── Downloads ───────────────────────────────────────────────────────────────
  function downloadDeptExcel(result) {
    XLSX.writeFile(result.cleanedWb, `Cleaned_${result.name}_${result.fileName}`);
  }

  function downloadMasterExcel() {
    const wb = XLSX.utils.book_new();
    cleaningResults
      .filter(r => !r.error)
      .forEach(r => {
        if (r.header && r.cleanedRows) {
          const ws = XLSX.utils.aoa_to_sheet([r.header, ...r.cleanedRows]);
          XLSX.utils.book_append_sheet(wb, ws, r.name.slice(0, 31));
        }
      });
    XLSX.writeFile(wb, "Master_Cleaned_Result.xlsx");
  }

  // ─── Reset ────────────────────────────────────────────────────────────────────
  function handleReset() {
    setStep(0);
    setDeptCountInput("");
    setDeptCountError("");
    setDepts([]);
    setCleaningResults([]);
    setFloorReport(null);
    setError("");
    setSelectedHostel("Overall");
    setProgressMsg("");
  }

  // ─── Derived values ───────────────────────────────────────────────────────────
  const readyCount = depts.filter(d => d.status === "ready" && d.name.trim()).length;

  const uniqueHostels = Array.from(
    new Set(students.map(s => String(s.hostel || "").trim()).filter(Boolean))
  );
  if (uniqueHostels.length === 0) {
    uniqueHostels.push("Boys Hostel 1", "Boys Hostel 2", "Girls Hostel 1", "Girls Hostel 2");
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Step progress bar */}
      <StepBar current={step} steps={STEPS} />

      {/* Global error banner */}
      {error && (
        <div
          style={{ background: "#EF444415", border: "1px solid #EF444430", color: "#FCA5A5" }}
          className="rounded-lg p-3 text-sm mb-4 flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError("")}><Icon d={icons.close} size={14} /></button>
        </div>
      )}

      {/* ── STEP 0: Enter department count ────────────────────────────────── */}
      {step === 0 && (
        <div className="max-w-sm mx-auto">
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "#162033", border: "1px solid #263548" }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                boxShadow:  "0 8px 24px #2563EB30",
              }}
            >
              <Icon d={icons.students} size={28} color="white" />
            </div>
            <h2 className="text-white text-xl font-bold mb-1">Multi-Department Upload</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter the number of departments. You'll upload one result Excel file per department.
              The system will automatically validate, cleanse, and analyse the data.
            </p>

            <div className="flex flex-col gap-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Number of Departments
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={deptCountInput}
                  onChange={e => { setDeptCountInput(e.target.value); setDeptCountError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleCountNext()}
                  placeholder="e.g. 3"
                  style={{ background: "#0F1B2D", border: "1px solid #263548", color: "#E2E8F0" }}
                  className="rounded-lg px-4 py-3 text-center text-2xl font-bold outline-none
                             focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600"
                />
                {deptCountError && (
                  <p className="text-red-400 text-xs">{deptCountError}</p>
                )}
              </div>
              <Btn onClick={handleCountNext} icon="check">
                Next — Set Up Upload Sections
              </Btn>
            </div>

            <p className="mt-5 text-xs text-slate-600">Maximum 20 departments per session</p>
          </div>
        </div>
      )}

      {/* ── STEP 1: Upload cards ───────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-white font-bold text-lg">Upload Department Excel Files</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {readyCount} of {depts.length} departments ready
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm" onClick={handleReset}>← Back</Btn>
              <Btn
                onClick={handleProceed}
                disabled={readyCount < depts.length}
                icon="filter"
              >
                Validate &amp; Auto-Cleanse
              </Btn>
            </div>
          </div>

          {/* Mini progress strip */}
          <div className="flex gap-1.5 mb-5">
            {depts.map((d, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background:
                    d.status === "ready" ? "#10B981" :
                    d.status === "error" ? "#EF4444" : "#263548",
                }}
              />
            ))}
          </div>

          {/* Upload cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {depts.map((dept, i) => (
              <DeptUploadCard
                key={i}
                index={i}
                dept={dept}
                color={DEPT_COLORS[i % DEPT_COLORS.length]}
                onNameChange={name => updateDept(i, { name, error: "", status: dept.file ? "ready" : "idle" })}
                onFileChange={file => handleFileSelect(i, file)}
              />
            ))}
          </div>

          {/* Required columns hint */}
          <div
            className="mt-4 rounded-lg p-3 text-xs text-slate-400"
            style={{ background: "#1A2A3E", border: "1px solid #263548" }}
          >
            <span className="font-medium text-slate-300">Required Columns:</span>{" "}
            Register Number · S.No · Subject Code · GR (Grade) · GP (Grade Point) · RESULT · GPA · CGPA
          </div>
        </div>
      )}

      {/* ── STEP 2: Validating ────────────────────────────────────────────── */}
      {step === 2 && (
        <ProgressScreen
          icon={icons.check}
          color="#3B82F6"
          title="Validating Files…"
          subtitle="Checking Excel format, required columns, and duplicate entries"
        />
      )}

      {/* ── STEP 3: Cleansing ─────────────────────────────────────────────── */}
      {step === 3 && (
        <ProgressScreen
          icon={icons.filter}
          color="#10B981"
          title="Auto-Cleansing Data…"
          subtitle={
            progressMsg ||
            "Removing empty rows · Stripping arrear rows · Deduplicating · Standardizing grades"
          }
        />
      )}

      {/* ── STEP 4: Cleansing Summary ─────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-white font-bold text-lg">Cleansing Summary</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Review what was automatically cleaned from each department.
              </p>
            </div>
            <Btn onClick={handleMerge} icon="chart">
              Merge &amp; Generate Analysis
            </Btn>
          </div>

          {/* Overall college summary */}
          {(() => {
            const totalOrig    = cleaningResults.reduce((a, r) => a + (r.stats?.original || 0), 0);
            const totalCleaned = cleaningResults.reduce((a, r) => a + (r.stats?.cleaned  || 0), 0);
            const totalRemoved = totalOrig - totalCleaned;
            const pct          = totalOrig > 0 ? Math.round((totalCleaned / totalOrig) * 100) : 100;
            return (
              <div
                className="rounded-xl p-5 mb-5"
                style={{
                  background: "linear-gradient(135deg,#1E2E45,#162033)",
                  border: "1px solid #263548",
                }}
              >
                <h3 className="text-white font-semibold mb-3 text-sm">📊 Overall College Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Departments",    value: cleaningResults.length, color: "#3B82F6" },
                    { label: "Original Rows",  value: totalOrig,              color: "#64748B" },
                    { label: "After Cleaning", value: totalCleaned,           color: "#10B981" },
                    { label: "Rows Removed",   value: totalRemoved,           color: "#F59E0B" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg p-3 text-center" style={{ background: "#0F1B2D" }}>
                      <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
                        {item.value}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Overall Data Retention</span>
                    <span className="font-semibold" style={{ color: pct >= 90 ? "#10B981" : "#F59E0B" }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full" style={{ background: "#1E2E45" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: pct >= 90 ? "#10B981" : "#F59E0B" }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Per-department cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cleaningResults.map((result, i) =>
              result.error ? (
                <div
                  key={i}
                  className="rounded-xl p-5"
                  style={{ background: "#162033", border: "1px solid #EF4444" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon d={icons.warning} size={18} color="#EF4444" />
                    <h4 className="text-white font-semibold">{result.name}</h4>
                  </div>
                  <p className="text-red-400 text-sm">{result.error}</p>
                </div>
              ) : (
                <CleaningSummaryCard
                  key={i}
                  deptName={result.name}
                  stats={result.stats}
                  color={DEPT_COLORS[i % DEPT_COLORS.length]}
                />
              )
            )}
          </div>
        </div>
      )}

      {/* ── STEP 5: Merging ───────────────────────────────────────────────── */}
      {step === 5 && (
        <ProgressScreen
          icon={icons.chart}
          color="#8B5CF6"
          title="Merging Datasets…"
          subtitle={
            progressMsg ||
            "Combining all department data and cross-referencing with student master"
          }
        />
      )}

      {/* ── STEP 6: Analysis Dashboard ────────────────────────────────────── */}
      {step === 6 && floorReport && (() => {
        const condData = computeConsolidationData(
          floorReport.summary, selectedHostel, students
        );
        const { overall, departments } = condData;

        // Flatten students list for top performers / failure analysis
        const allStudents    = floorReport.summary.flatMap(fs => fs.studentsList || []);
        const topPerformers  = [...allStudents]
          .filter(s => (s.cgpa || 0) > 0)
          .sort((a, b) => b.cgpa - a.cgpa)
          .slice(0, 10);
        const failStudents   = allStudents
          .filter(s => (s.reappear || 0) >= 3)
          .sort((a, b) => b.reappear - a.reappear)
          .slice(0, 50);

        const successDepts = cleaningResults.filter(r => !r.error);

        return (
          <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">Multi-Department Result Analysis</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {successDepts.map(r => r.name).join(" · ")} ·{" "}
                  {successDepts.reduce((a, r) => a + (r.stats?.cleaned || 0), 0)} records analysed
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={selectedHostel}
                  onChange={e => setSelectedHostel(e.target.value)}
                  options={[
                    { value: "Overall", label: "All Hostels" },
                    ...uniqueHostels.map(h => ({ value: h, label: h })),
                  ]}
                />
                <Btn variant="outline" size="sm" icon="download" onClick={downloadMasterExcel}>
                  Master Excel
                </Btn>
                <Btn icon="check" onClick={handleSaveReport} disabled={saving}>
                  {saving ? "Saving…" : "Save Report"}
                </Btn>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* KPI cards – 8 stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Students",  value: overall.totalStudents,
                    sub: "All Departments",   accent: "#3B82F6", icon: "students",
                  },
                  {
                    label: "Pass Rate",
                    value: `${overall.passPercent.toFixed(1)}%`,
                    sub: `${overall.passed} passed`,
                    accent: "#10B981", icon: "check",
                  },
                  {
                    label: "Fail Rate",
                    value: `${(100 - overall.passPercent).toFixed(1)}%`,
                    sub: `${overall.failed} failed`,
                    accent: "#EF4444", icon: "close",
                  },
                  {
                    label: "Average GPA",  value: overall.avg,
                    sub: "College Average", accent: "#8B5CF6", icon: "chart",
                  },
                  {
                    label: "Present",       value: overall.appeared,
                    sub: "Appeared",        accent: "#06B6D4", icon: "students",
                  },
                  {
                    label: "Absent",        value: overall.absent,
                    sub: "Absent",          accent: "#F59E0B", icon: "warning",
                  },
                  {
                    label: "Top Performer",
                    value: overall.topper?.split(" (")[0] || "—",
                    sub:   overall.topper?.match(/\(([^)]+)\)/)?.[1]
                           ? `CGPA: ${overall.topper.match(/\(([^)]+)\)/)[1]}`
                           : "",
                    accent: "#F59E0B", icon: "students",
                  },
                  {
                    label: "Departments",   value: departments.length,
                    sub: "Analysed",        accent: "#EC4899", icon: "report",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4 flex flex-col gap-2"
                    style={{ background: "#162033", border: "1px solid #263548" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: stat.accent + "22" }}
                      >
                        <Icon d={icons[stat.icon] || icons.chart} size={14} color={stat.accent} />
                      </div>
                    </div>
                    <div
                      className="text-white text-xl font-bold truncate"
                      title={String(stat.value)}
                    >
                      {stat.value ?? "—"}
                    </div>
                    {stat.sub && <div className="text-slate-500 text-xs">{stat.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Department-wise pass % bars */}
              <div
                className="rounded-xl p-5"
                style={{ background: "#162033", border: "1px solid #263548" }}
              >
                <h3 className="text-white font-semibold mb-4 text-sm">
                  Department-wise Pass Percentage
                </h3>
                <div className="flex flex-col gap-4">
                  {departments.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-slate-300 font-semibold">{d.name}</span>
                        <span className="text-slate-400">
                          {d.appeared} appeared · {d.allPass} all-pass ·{" "}
                          <span
                            className="font-bold"
                            style={{ color: DEPT_COLORS[i % DEPT_COLORS.length] }}
                          >
                            {d.passPercent.toFixed(1)}%
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: "#1E2E45" }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width:      `${d.passPercent}%`,
                            background: DEPT_COLORS[i % DEPT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consolidated Analysis Tables (reusing existing component) */}
              {renderConsolidationTables(condData)}

              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#162033", border: "1px solid #263548" }}
                >
                  <h3 className="text-white font-semibold mb-3 text-sm">🏆 Top Performers</h3>
                  <Table
                    headers={["Rank", "Reg. No.", "Name", "Department", "CGPA", "GPA"]}
                    rows={topPerformers.map((s, i) => [
                      <span
                        key={i}
                        className="font-bold text-sm"
                        style={{
                          color:
                            i === 0 ? "#F59E0B" :
                            i === 1 ? "#94A3B8" :
                            i === 2 ? "#CD7C2F" : "#64748B",
                        }}
                      >
                        #{i + 1}
                      </span>,
                      <span className="font-mono text-xs text-blue-400">{s.regNo}</span>,
                      s.name  || "—",
                      s.dept  || "—",
                      <span className="font-bold text-emerald-400">{s.cgpa || "—"}</span>,
                      s.gpa   || "—",
                    ])}
                  />
                </div>
              )}

              {/* Failure Analysis */}
              {failStudents.length > 0 && (
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#162033", border: "1px solid #263548" }}
                >
                  <h3 className="text-white font-semibold mb-3 text-sm">
                    ⚠️ Failure Analysis (3+ Arrears)
                  </h3>
                  <Table
                    headers={["Reg. No.", "Name", "Department", "Arrear Count", "GPA"]}
                    rows={failStudents.map(s => [
                      <span className="font-mono text-xs text-blue-400">{s.regNo}</span>,
                      s.name || "—",
                      s.dept || "—",
                      <Badge color="red">{s.reappear} subjects</Badge>,
                      s.gpa  || "—",
                    ])}
                  />
                </div>
              )}

              {/* Download cleaned files per department */}
              <div
                className="rounded-xl p-5"
                style={{ background: "#162033", border: "1px solid #263548" }}
              >
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Download Cleaned Data
                </h3>
                <div className="flex flex-wrap gap-2">
                  {successDepts.map((r, i) => (
                    <Btn
                      key={i}
                      variant="outline"
                      size="sm"
                      icon="download"
                      onClick={() => downloadDeptExcel(r)}
                    >
                      {r.name} ({r.stats?.cleaned || 0} rows)
                    </Btn>
                  ))}
                  <Btn variant="outline" size="sm" icon="download" onClick={downloadMasterExcel}>
                    Master — All Departments
                  </Btn>
                </div>
              </div>
            </div>

            {/* Unmatched warning */}
            {floorReport.unmatched > 0 && (
              <div
                className="mt-4 rounded-lg p-3 text-xs"
                style={{ background: "#1A1A0D", border: "1px solid #3D3010", color: "#FCD34D" }}
              >
                ⚠️ {floorReport.unmatched} student(s) in the Excel files were not found in the
                Student Master. Import students via{" "}
                <strong>Student Master → Import Excel</strong> first for complete floor-wise grouping.
              </div>
            )}
          </div>
        );
      })()}

      {/* ── STEP 7: Done ──────────────────────────────────────────────────── */}
      {step === 7 && (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "#162033", border: "1px solid #263548" }}
        >
          <div
            className="rounded-full p-5 inline-flex mb-5"
            style={{ background: "#10B98115" }}
          >
            <Icon d={icons.check} size={40} color="#10B981" />
          </div>
          <h3 className="text-white font-semibold text-xl mb-2">Report Saved Successfully!</h3>
          <p className="text-slate-400 text-sm mb-1">
            Multi-department analysis saved to Report History.
          </p>
          <p className="text-slate-500 text-xs mb-6">
            Departments: {cleaningResults.filter(r => !r.error).map(r => r.name).join(", ")}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Btn variant="outline" icon="download" onClick={downloadMasterExcel}>
              Download Master Excel
            </Btn>
            <Btn onClick={handleReset}>New Upload</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
