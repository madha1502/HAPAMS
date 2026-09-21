import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Table, Modal, Input, Select, ErrorBanner, Spinner } from "../components/ui.jsx";
import { icons, Icon } from "../components/ui.jsx";

const HOSTEL_OPTIONS = ["BH-1", "BH-2", "NC-BH1", "NC-BH2", "Men's Hostel", "Ladies Hostel"];
const BLANK = { regNo: "", name: "", dept: "", year: 1, semester: 1, section: "", hostel: "", floor: 1, room: "", status: "Active" };

export default function StudentsPage() {
  const [students,     setStudents]     = useState([]);
  const [floors,       setFloors]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clearModal,   setClearModal]   = useState(false);
  const [importModal,  setImportModal]  = useState(false);
  const [importLoading,setImportLoading]= useState(false);
  const [importDone,   setImportDone]   = useState(null);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [hostelFilter, setHostelFilter] = useState("");
  const fileRef = useRef();

  async function load() {
    try {
      setLoading(true);
      const [s, f] = await Promise.all([api.getStudents(), api.getFloors()]);
      setStudents(s);
      setFloors(f);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd()      { setForm(BLANK); setModal("add"); setError(""); }
  function openEdit(s)    { setForm({ ...s, year: String(s.year), semester: String(s.semester || 1), floor: String(s.floor) }); setModal("edit"); setError(""); }

  async function handleSave() {
    setError("");
    try {
      if (modal === "add") {
        const s = await api.addStudent(form);
        setStudents(prev => [...prev, s]);
      } else {
        const s = await api.updateStudent(form.regNo, form);
        setStudents(prev => prev.map(x => x.regNo === s.regNo ? s : x));
      }
      setModal(null);
    } catch (e) { setError(e.message); }
  }

  async function confirmDelete() {
    try {
      await api.deleteStudent(deleteTarget);
      setStudents(prev => prev.filter(s => s.regNo !== deleteTarget));
      setDeleteTarget(null);
    } catch (e) { setError(e.message); }
  }

  async function confirmClear() {
    try {
      await api.clearStudents();
      setStudents([]);
      setClearModal(false);
    } catch (e) { setError(e.message); }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // ── Auto-clean: remove blank separator rows ──────────────────────────
        // Read as 2D array so we can check raw column positions
        const rawArray = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const totalBeforeClean = rawArray.length > 0 ? rawArray.length - 1 : 0;

        // Remove rows where BOTH col[0] (S.No) AND col[1] (Register No) are empty
        const cleanedArray = rawArray.filter((row, idx) => {
          if (idx === 0) return true; // always keep header row
          const sno   = String(row[0] ?? "").trim();
          const regNo = String(row[1] ?? "").trim();
          return !(sno === "" && regNo === "");
        });
        const cleanedCount = totalBeforeClean - (cleanedArray.length - 1);

        // Convert cleaned 2D array back to JSON objects for the existing mapping
        const cleanedSheet = XLSX.utils.aoa_to_sheet(cleanedArray);
        const raw = XLSX.utils.sheet_to_json(cleanedSheet, { defval: "" });
        // ────────────────────────────────────────────────────────────────────

        const detectedCols = raw.length > 0 ? Object.keys(raw[0]) : [];
        const MAP = {
          regNo:    ["register number","reg no","regno","registration number","reg. no.","reg.no","reg no.","register no","register no.","regisiter number","rno","reg.no.","roll no","roll number","roll no."],
          name:     ["student name","name","full name","student_name","sname","s.name"],
          dept:     ["department","dept","branch"],
          year:     ["year","year of study"],
          semester: ["semester","sem","sem no","sem.no.","semester no","sem no."],
          section:  ["section"],
          hostel:   ["hostel","hostel name","hostel block","block","block name","bh"],
          floor:    ["floor","floor number","floor no"],
          room:     ["room number","room no","room","roomno"],
        };
        function findCol(row, aliases) {
          return Object.keys(row).find(k => aliases.includes(k.toLowerCase().trim())) || null;
        }
        function cleanExcelVal(val) {
          if (val === undefined || val === null) return "";
          let str = String(val).trim();
          if (str.endsWith(".0")) {
            str = str.slice(0, -2);
          }
          return str;
        }
        const rows = raw.map(r => {
          const out = {};
          for (const [field, aliases] of Object.entries(MAP)) {
            const col = findCol(r, aliases);
            let val = col ? cleanExcelVal(r[col]) : "";
            if (field === "regNo") {
              val = val.toUpperCase();
            }
            out[field] = val;
          }
          // Fallback: if regNo is empty but name looks like a register number (all digits, 10+ chars),
          // they got swapped — fix it by scanning all column values for a long numeric string
          if (!out.regNo || out.regNo === "") {
            for (const [k, v] of Object.entries(r)) {
              const s = cleanExcelVal(v);
              if (/^\d{10,}$/.test(s)) { out.regNo = s.toUpperCase(); break; }
            }
          }
          return out;
        });
        const result = await api.bulkImport(rows);
        setImportDone({ ...result, detectedCols, cleanedCount });
        await load(); // refresh list
      } catch (err) {
        setImportDone({ parseError: err.message });
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadSampleExcel() {
    const sampleData = [
      {
        "Register Number": "23CS001",
        "Student Name": "Ramesh Kumar",
        "Department": "CSE",
        "Year": 2,
        "Semester": 3,
        "Section": "A",
        "Hostel": "BH-1",
        "Floor": "1",
        "Room Number": "101"
      },
      {
        "Register Number": "23ME002",
        "Student Name": "Karthik Raja",
        "Department": "MECH",
        "Year": 2,
        "Semester": 3,
        "Section": "B",
        "Hostel": "BH-2",
        "Floor": "2",
        "Room Number": "204"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Hostel_Students_Import_Template.xlsx");
  }

  // Derive unique hostels seen in current student list for the filter dropdown
  const hostelList = [...new Set(students.map(s => s.hostel).filter(Boolean))].sort();

  const filtered = students.filter(s => {
    if (hostelFilter && s.hostel !== hostelFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.regNo.toLowerCase().includes(q) ||
           s.dept.toLowerCase().includes(q)  || String(s.room).includes(q) ||
           (s.hostel || "").toLowerCase().includes(q);
  });

  const floorOptions = [{ value: "", label: "Select" }, ...floors.map(f => ({ value: String(parseInt(f.name.replace(/\D/g,""),10) || f.id), label: f.name }))];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Student Master" sub={`${students.length} students registered`} actions={
        <>
          <Btn variant="outline" icon="upload" onClick={() => { setImportModal(true); setImportDone(null); }}>Import Excel</Btn>
          <Btn variant="danger"  icon="trash"  onClick={() => setClearModal(true)}>Clear All</Btn>
          <Btn icon="plus" onClick={openAdd}>Add Student</Btn>
        </>
      } />

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Search + Hostel Filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon d={icons.search} size={16} />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, reg. no., department or room…"
            style={{ background: "#162033", border: "1px solid #263548", color: "#E2E8F0" }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600" />
        </div>
        <select
          value={hostelFilter}
          onChange={e => setHostelFilter(e.target.value)}
          style={{ background: "#162033", border: "1px solid #263548", color: hostelFilter ? "#E2E8F0" : "#64748B" }}
          className="px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[160px] cursor-pointer"
        >
          <option value="">All Hostels</option>
          {/* Show hostels from existing students first, then HOSTEL_OPTIONS that aren't yet in list */}
          {[...new Set([...hostelList, ...HOSTEL_OPTIONS])].map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        {hostelFilter && (
          <button
            onClick={() => setHostelFilter("")}
            title="Clear hostel filter"
            style={{ background: "#162033", border: "1px solid #263548", color: "#94A3B8" }}
            className="px-3 rounded-xl text-xs hover:text-white hover:border-blue-500 transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <Table
        headers={["Name", "Reg. No.", "Dept", "Year", "Sem", "Sec", "Hostel", "Floor", "Room", "Status", "Actions"]}
        rows={filtered.map(s => [
          s.name,
          <span className="font-mono text-blue-400 text-xs">{s.regNo}</span>,
          s.dept, s.year, `Sem ${s.semester || 1}`, s.section,
          <span className="text-amber-400 text-xs font-medium">{s.hostel || "—"}</span>,
          `Floor ${s.floor}`, s.room,
          <Badge color={s.status === "Active" ? "green" : "gray"}>{s.status}</Badge>,
          <div className="flex gap-1">
            <Btn variant="ghost" size="sm" icon="edit"  onClick={() => openEdit(s)} />
            <Btn variant="ghost" size="sm" icon="trash" onClick={() => setDeleteTarget(s.regNo)} />
          </div>
        ])}
      />

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal === "add" ? "Add Student" : "Edit Student"} onClose={() => setModal(null)}>
          <ErrorBanner msg={error} onDismiss={() => setError("")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Reg. No." value={form.regNo} onChange={e => setForm(f => ({ ...f, regNo: e.target.value }))} disabled={modal === "edit"} />
            <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Select label="Department" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
              options={[{ value: "", label: "Select" }, ...["CSE","MECH","ECE","CIVIL","EEE","IT","AIDS","CSBS","CSD"].map(d => ({ value: d, label: d }))]} />
            <Select label="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              options={[{ value: "", label: "Select" }, ...[1,2,3,4].map(y => ({ value: y, label: `Year ${y}` }))]} />
            <Select label="Semester" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
              options={[{ value: "", label: "Select" }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: s, label: `Semester ${s}` }))]} />
            <Input label="Section" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
            <Select label="Hostel" value={form.hostel} onChange={e => setForm(f => ({ ...f, hostel: e.target.value }))}
              options={[
                { value: "", label: "Select Hostel" },
                ...HOSTEL_OPTIONS.map(h => ({ value: h, label: h })),
                ...hostelList.filter(h => !HOSTEL_OPTIONS.includes(h)).map(h => ({ value: h, label: h }))
              ]} />
            <Select label="Floor" value={String(form.floor)} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
              options={floorOptions} />
            <Input label="Room No." value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleSave}>Save Student</Btn>
          </div>
        </Modal>
      )}

      {/* Clear All Modal */}
      {clearModal && (
        <Modal title="Clear All Students" onClose={() => setClearModal(false)}>
          <div className="text-center py-2">
            <div style={{ background: "#EF444415" }} className="rounded-full p-4 inline-flex mb-4">
              <Icon d={icons.trash} size={32} color="#EF4444" />
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">Delete All {students.length} Students?</h4>
            <p className="text-slate-400 text-sm mb-6">This will permanently remove every student record. This action cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <Btn variant="outline" onClick={() => setClearModal(false)}>Cancel</Btn>
              <Btn variant="danger" icon="trash" onClick={confirmClear}>Yes, Clear All</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete single */}
      {deleteTarget && (
        <Modal title="Delete Student" onClose={() => setDeleteTarget(null)}>
          <p className="text-slate-300 text-sm mb-1">Delete this student?</p>
          <p className="text-slate-500 text-xs mb-5">Reg. No.: <span className="text-blue-400 font-mono">{deleteTarget}</span></p>
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Btn>
            <Btn variant="danger" icon="trash" onClick={confirmDelete}>Delete</Btn>
          </div>
        </Modal>
      )}

      {/* Import Excel Modal */}
      {importModal && (
        <Modal title="Import Students from Excel" onClose={() => { setImportModal(false); setImportDone(null); }}>
          {importLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-10 h-10 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
              <p className="text-slate-400 text-sm">Reading Excel file…</p>
            </div>
          ) : !importDone ? (
            <>
              <div style={{ background: "#0F1B2D", border: "2px dashed #263548" }}
                className="rounded-xl p-8 text-center mb-4 cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => fileRef.current.click()}>
                <Icon d={icons.upload} size={32} color="#3B82F6" />
                <p className="text-slate-300 text-sm font-medium mt-3 mb-1">Click to choose an Excel file</p>
                <p className="text-slate-500 text-xs">Supports .xlsx and .xls files</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </div>
              <div style={{ background: "#1A2A3E", border: "1px solid #263548" }} className="rounded-lg p-3 text-xs text-slate-400 mb-4">
                <p className="font-medium text-slate-300 mb-1">Required Excel Columns:</p>
                <p>Register Number · Student Name · Department · Year · Section · Hostel · Floor · Room Number</p>
                <p className="mt-1 text-slate-500">Hostels & Floors are automatically categorized and created if missing.</p>
              </div>
              <div className="flex justify-end">
                <Btn variant="outline" size="sm" icon="download" onClick={downloadSampleExcel}>Download Sample Template (.xlsx)</Btn>
              </div>
            </>
          ) : importDone.parseError ? (
            <div className="text-center py-6">
              <Icon d={icons.warning} size={32} color="#EF4444" />
              <h4 className="text-white font-semibold mb-2 mt-3">Failed to Read File</h4>
              <p className="text-slate-400 text-xs mb-5">{importDone.parseError}</p>
              <Btn variant="outline" onClick={() => setImportDone(null)}>Try Again</Btn>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Total Rows", value: importDone.total,        color: "#3B82F6" },
                  { label: "Added",      value: importDone.added,        color: "#10B981" },
                  { label: "Updated",    value: importDone.updated,      color: "#F59E0B" },
                  { label: "Errors",     value: importDone.errors,       color: "#EF4444" },
                  { label: "Auto-Cleaned", value: importDone.cleanedCount ?? 0, color: "#A78BFA" },
                ].map((it, i) => (
                  <div key={i} style={{ background: "#0F1B2D", border: "1px solid #263548" }} className="rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold tabular-nums" style={{ color: it.color }}>{it.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{it.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2">
                <Btn variant="outline" onClick={() => setImportDone(null)}>Import Another</Btn>
                <Btn onClick={() => { setImportModal(false); setImportDone(null); }}>Done</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
