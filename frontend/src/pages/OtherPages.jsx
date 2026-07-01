import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Table, Modal, Input, Select, ErrorBanner, Spinner } from "../components/ui.jsx";
import { icons, Icon } from "../components/ui.jsx";
import MultiDeptResultPage from "./MultiDeptResultPage.jsx";

// A helper function to map semester numbers to YEAR/SEM - [Year Roman] / [Sem Roman]
function getYearSemRoman(semStr) {
  const sem = parseInt(semStr, 10);
  if (isNaN(sem)) return "";
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const yearRoman = ["I", "II", "III", "IV"];
  const yrIdx = Math.floor((sem - 1) / 2);
  const semIdx = sem - 1;
  return `YEAR/SEM – ${yearRoman[yrIdx] || ""} / ${roman[semIdx] || ""}`;
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingReport, setViewingReport] = useState(null);

  async function load() {
    try {
      const [reps, studs] = await Promise.all([api.getReports(), api.getStudents()]);
      setReports(reps);
      setStudents(studs);
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    try { await api.deleteReport(id); setReports(prev => prev.filter(r => r.id !== id)); }
    catch (e) { setError(e.message); }
  }

  function handlePrint(report) {
    if (!report.summary || report.summary.length === 0) {
      alert("No data available to print for this report.");
      return;
    }

    const cond = computeConsolidationData(report.summary, "Overall", students);
    const { overall, arrearCounts, departments } = cond;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: 'Outfit', 'Inter', sans-serif; color: #000; padding: 20px; margin: 0; background: #fff; }
            .header-container { text-align: center; margin-bottom: 25px; line-height: 1.3; }
            .college-name { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 14px; font-weight: 600; margin: 3px 0; }
            .acad-year { font-size: 13px; font-weight: 700; margin: 3px 0; text-transform: uppercase; }
            .hostel-name { font-size: 13px; font-weight: 700; margin: 3px 0; text-transform: uppercase; }
            .test-name { font-size: 13px; font-weight: 700; text-decoration: underline; margin: 5px 0; text-transform: uppercase; }
            .report-title { font-size: 14px; font-weight: 800; margin: 5px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .year-sem { font-size: 13px; font-weight: 700; margin: 3px 0; }

            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            th, td { border: 1.5px solid #000; padding: 6px 4px; text-align: center; font-size: 11px; font-weight: 600; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .align-left { text-align: left; padding-left: 10px; }
            
            .arrear-table { width: 50%; margin: 15px auto; }
            .arrear-table td { padding: 6px; font-size: 11px; }

            .footer-sign { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; font-size: 13px; padding: 0 40px; }
            @media print {
              body { padding: 10px; }
              @page { size: portrait; margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="college-name">${report.college || "V.S.B. ENGINEERING COLLEGE, KARUR"}</div>
            <div class="subtitle">An Autonomous Institution</div>
            <div class="acad-year">ACADEMIC YEAR ${report.year} (${Number(report.sem) % 2 === 0 ? "EVEN SEMESTER" : "ODD SEMESTER"})</div>
            <div class="hostel-name">${report.hostel || "BOYS HOSTEL-I&II"}</div>
            
            <div class="report-title">RESULT ANALYSIS - CONSOLIDATION</div>
            <div class="year-sem">${getYearSemRoman(report.sem)}</div>
          </div>

          <!-- Table 1: Overall Summary -->
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">S.No</th>
                <th>Total No of students</th>
                <th>No of appeared</th>
                <th>No of Absent</th>
                <th>No of Pass</th>
                <th>No of Fail</th>
                <th>Pass Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${overall.totalStudents}</td>
                <td>${overall.appeared}</td>
                <td>${overall.absent}</td>
                <td>${overall.passed}</td>
                <td>${overall.failed}</td>
                <td><strong>${overall.passPercent.toFixed(1)}</strong></td>
              </tr>
            </tbody>
          </table>

          <!-- Table 2: Arrear Counts -->
          <table class="arrear-table">
            <tbody>
              <tr>
                <td class="align-left" style="width: 70%;">No of all pass</td>
                <td><strong>${arrearCounts[0]}</strong></td>
              </tr>
              <tr>
                <td class="align-left">No of one subject arrear</td>
                <td>${arrearCounts[1]}</td>
              </tr>
              <tr>
                <td class="align-left">No of two subject arrears</td>
                <td>${arrearCounts[2]}</td>
              </tr>
              <tr>
                <td class="align-left">No of three subject arrears</td>
                <td>${arrearCounts[3]}</td>
              </tr>
              <tr>
                <td class="align-left">No of four subject arrears</td>
                <td>${arrearCounts[4]}</td>
              </tr>
              <tr>
                <td class="align-left">No of five subject arrears</td>
                <td>${arrearCounts[5]}</td>
              </tr>
              <tr>
                <td class="align-left">No of six subject arrears</td>
                <td>${arrearCounts[6]}</td>
              </tr>
              <tr>
                <td class="align-left">No of seven subject arrears</td>
                <td>${arrearCounts[7]}</td>
              </tr>
            </tbody>
          </table>

          <!-- Table 3: Department-wise -->
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 10%;">Dept.</th>
                <th>Strength</th>
                <th>No of appeared</th>
                <th>No of Absent</th>
                <th>No of All Pass</th>
                <th>No of one subject arrear</th>
                <th>No of two subject arrears</th>
                <th>No of three subject arrears</th>
                <th>No of four subject arrears</th>
                <th>No of five subject arrears</th>
                <th>No of six subject arrears</th>
                <th>No of seven subject arrears</th>
                <th>Dept. wise pass percentage</th>
              </tr>
            </thead>
            <tbody>
              ${departments.map((d, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="align-left"><strong>${d.name}</strong></td>
                  <td>${d.strength}</td>
                  <td>${d.appeared}</td>
                  <td>${d.absent}</td>
                  <td><strong>${d.allPass}</strong></td>
                  <td>${d.arrears[0] || 0}</td>
                  <td>${d.arrears[1] || 0}</td>
                  <td>${d.arrears[2] || 0}</td>
                  <td>${d.arrears[3] || 0}</td>
                  <td>${d.arrears[4] || 0}</td>
                  <td>${d.arrears[5] || 0}</td>
                  <td>${d.arrears[6] || 0}</td>
                  <td><strong>${d.passPercent.toFixed(1)}</strong></td>
                </tr>
              `).join("")}
              <!-- Total row -->
              <tr style="background-color: #f2f2f2;">
                <td></td>
                <td class="align-left"><strong>Total</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + d.strength, 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + d.appeared, 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + d.absent, 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + d.allPass, 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[0] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[1] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[2] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[3] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[4] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[5] || 0), 0)}</strong></td>
                <td><strong>${departments.reduce((acc, d) => acc + (d.arrears[6] || 0), 0)}</strong></td>
                <td><strong>${(departments.reduce((acc, d) => acc + d.appeared, 0) > 0 ? (departments.reduce((acc, d) => acc + d.allPass, 0) / departments.reduce((acc, d) => acc + d.appeared, 0) * 100) : 0).toFixed(1)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="footer-sign">
            <span>DEPUTY WARDEN</span>
            <span>PRINCIPAL</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Report History" sub="All generated floor-wise academic reports" />
      <ErrorBanner msg={error} onDismiss={() => setError("")} />
      <Table
        headers={["Title", "Year", "Sem", "Generated By", "Date", "Floors", "Actions"]}
        rows={reports.map(r => [
          r.title,
          <Badge color="blue">{r.year}</Badge>,
          `Sem ${r.sem}`,
          r.by,
          r.date,
          r.floors,
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" icon="eye" onClick={() => setViewingReport(r)}>View</Btn>
            <Btn variant="ghost" size="sm" icon="download" onClick={() => handlePrint(r)}>PDF</Btn>
            <Btn variant="ghost" size="sm" icon="trash" onClick={() => handleDelete(r.id)} />
          </div>,
        ])}
      />

      {viewingReport && (
        <Modal title={viewingReport.title} onClose={() => setViewingReport(null)}>
          <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <div style={{ background: "#0F1B2D", border: "1px solid #263548" }} className="rounded-lg p-3 grid grid-cols-2 gap-3 text-xs">
              <div className="text-slate-400">Academic Year: <span className="text-white font-medium">{viewingReport.year}</span></div>
              <div className="text-slate-400">Semester: <span className="text-white font-medium">Sem {viewingReport.sem}</span></div>
              <div className="text-slate-400">Date Generated: <span className="text-white font-medium">{viewingReport.date}</span></div>
              <div className="text-slate-400">Generated By: <span className="text-white font-medium">{viewingReport.by}</span></div>
            </div>

            {!viewingReport.summary || viewingReport.summary.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No floor data details saved for this report.
              </div>
            ) : (
              renderConsolidationTables(computeConsolidationData(viewingReport.summary, "Overall", students))
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Btn variant="outline" onClick={() => handlePrint(viewingReport)} icon="download">Print / PDF</Btn>
              <Btn onClick={() => setViewingReport(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── USERS PAGE ───────────────────────────────────────────────────────────────
export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Warden" });
  const [error, setError] = useState("");
  const roleColor = { "Super Admin": "blue", Warden: "amber" };

  async function load() {
    try { setUsers(await api.getUsers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setError("");
    try {
      const u = await api.addUser(form);
      setUsers(prev => [...prev, u]);
      setModal(false);
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    try { await api.deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    catch (e) { setError(e.message); }
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="User Management" sub="Manage warden and admin accounts" actions={
        <Btn icon="plus" onClick={() => { setForm({ name: "", email: "", role: "Warden" }); setModal(true); }}>Create User</Btn>
      } />
      <ErrorBanner msg={error} onDismiss={() => setError("")} />
      <Table
        headers={["Name", "Email", "Role", "Status", "Last Login", "Actions"]}
        rows={users.map(u => [
          u.name, u.email,
          <Badge color={roleColor[u.role] || "gray"}>{u.role}</Badge>,
          <Badge color={u.status === "Active" ? "green" : "gray"}>{u.status}</Badge>,
          u.lastLogin,
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" icon="key">Reset PWD</Btn>
            <Btn variant="ghost" size="sm" icon="trash" onClick={() => handleDelete(u.id)} />
          </div>,
        ])}
      />
      {modal && (
        <Modal title="Create User" onClose={() => setModal(false)}>
          <ErrorBanner msg={error} onDismiss={() => setError("")} />
          <div className="flex flex-col gap-3">
            <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Select label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              options={[{ value: "Warden", label: "Warden" }, { value: "Super Admin", label: "Super Admin" }]} />
            <div style={{ background: "#1A2A3E", border: "1px solid #263548" }} className="rounded-lg p-3 text-xs text-slate-400">
              A temporary password will be generated. The user must change it on first login.
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create User</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────────
export function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setResults(await api.getStudents({ q })); }
      catch { }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <PageHeader title="Search" sub="Find students by name, reg. no., department, or room" />
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"><Icon d={icons.search} size={18} /></span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students…"
          style={{ background: "#162033", border: "1px solid #263548", color: "#E2E8F0", fontSize: 16 }}
          className="w-full pl-12 pr-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-600" />
      </div>
      {q.length > 1 && (
        loading ? <Spinner /> : (
          <Table
            headers={["Reg. No.", "Name", "Dept", "Year", "Floor", "Room", "Status"]}
            rows={results.map(s => [
              <span className="font-mono text-blue-400 text-xs">{s.regNo}</span>,
              s.name, s.dept, s.year, `Floor ${s.floor}`, s.room,
              <Badge color={s.status === "Active" ? "green" : "gray"}>{s.status}</Badge>,
            ])}
            emptyMsg="No students found"
          />
        )
      )}
      {q.length <= 1 && (
        <div className="text-center py-20 text-slate-600">
          <Icon d={icons.search} size={48} color="#263548" />
          <p className="mt-4 text-slate-500">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY PAGE ────────────────────────────────────────────────────────────
export function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLogs().then(setLogs).catch(() => { }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Activity Log" sub="Audit trail of all system actions" />
      <Table
        headers={["User", "Action", "Date", "Time"]}
        rows={logs.map(l => [
          <span className="text-blue-400">{l.user}</span>,
          l.action,
          l.date,
          <span className="font-mono text-xs text-slate-500">{l.time}</span>,
        ])}
      />
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [settings, setSettings] = useState({ college: "", hostel: "", year: "2024-25", sem: "1" });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSettings().then(setSettings).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function save() {
    setError("");
    try { await api.saveSettings(settings); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { setError(e.message); }
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Settings" sub="System configuration and preferences" />
      <ErrorBanner msg={error} onDismiss={() => setError("")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">General Settings</h3>
          <div className="flex flex-col gap-3">
            <Input label="College Name" value={settings.college} onChange={e => setSettings(s => ({ ...s, college: e.target.value }))} />
            <Input label="Hostel Name" value={settings.hostel} onChange={e => setSettings(s => ({ ...s, hostel: e.target.value }))} />
            <Input
              label="Academic Year"
              placeholder="e.g. 2025-26"
              value={settings.year}
              onChange={(e) => {
                const value = e.target.value;

                // Allow only numbers and hyphen
                if (/^[0-9-]*$/.test(value)) {
                  setSettings(s => ({ ...s, year: value }));
                }
              }}
            />
            <Select label="Semester" value={settings.sem} onChange={e => setSettings(s => ({ ...s, sem: e.target.value }))}
              options={[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: String(n), label: `Semester ${n}` }))} />
            <Btn onClick={save} variant={saved ? "success" : "primary"} icon={saved ? "check" : undefined}>
              {saved ? "Saved!" : "Save Settings"}
            </Btn>
          </div>
        </div>
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Change Password</h3>
          <div className="flex flex-col gap-3">
            <Input label="Current Password" type="password" placeholder="••••••••" />
            <Input label="New Password" type="password" placeholder="••••••••" />
            <Input label="Confirm Password" type="password" placeholder="••••••••" />
            <Btn icon="key">Update Password</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULT PAGE ─────────────────────────────────────────────────────────────
/*
  Excel format (from screenshot):
  Cols: S.No | Register Number | Sem No | Subject#1 Code | GR | GP | Subject#2 Code | GR | GP | ... | RESULT | No. OF SUBJECTS REAPPEAR | GPA | CGPA
  Hosteller matching: cross-reference Register Number with student master
  Floor grouping: look up each matched student's floor
*/

function normalizeRegNo(val) {
  if (val === undefined || val === null) return "";
  let str = String(val).trim().toUpperCase();
  if (str.endsWith(".0")) {
    str = str.slice(0, -2);
  }
  return str;
}

function parseResultExcel(ws) {
  const regAliases = ["register number", "reg no", "regno", "registration number", "reg. no.", "reg.no", "reg no.", "register no", "register no.", "regisiter number", "rno", "reg.no.", "roll no", "roll number", "roll no."];
  const grAliases = ["gr.", "gr", "grade", "grd", "grade/class"];
  const gpAliases = ["gp.", "gp", "grade point", "gp.s", "gps"];
  const resultAliases = ["result", "res", "remarks", "remark"];
  const reappearAliases = ["reappear", "re-appear", "no.of subjects reappear", "no of subjects reappear", "no. of subjects reappear", "subjects reappear", "reappear count", "arrear count", "arrears"];
  const gpaAliases = ["gpa", "g.p.a", "g.p.a."];
  const cgpaAliases = ["cgpa", "c.g.p.a", "c.g.p.a."];

  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (aoa.length < 2) throw new Error("Excel file appears empty.");

  // Find header row containing register number
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(aoa.length, 15); i++) {
    const row = aoa[i].map(c => String(c ?? "").toLowerCase().trim());
    if (row.some(c => regAliases.includes(c) || regAliases.some(alias => c.includes(alias)))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) {
    headerRowIdx = 0;
  }

  const headers = aoa[headerRowIdx].map(c => String(c ?? "").trim().toLowerCase());

  // Column indices (0-based)
  const regCol = headers.findIndex(h => regAliases.includes(h) || regAliases.some(alias => h.includes(alias)));
  const snoCol = 0; // always col A
  const resultCol = headers.findIndex(h => resultAliases.includes(h) || resultAliases.some(alias => h.includes(alias)));
  const reapCol = headers.findIndex(h => reappearAliases.includes(h) || reappearAliases.some(alias => h.includes(alias)));
  const gpaCol = headers.findIndex(h => gpaAliases.includes(h) || gpaAliases.some(alias => h.includes(alias)));
  const cgpaCol = headers.findIndex(h => cgpaAliases.includes(h) || cgpaAliases.some(alias => h.includes(alias)));
  const gpCols = headers.reduce((acc, h, i) => { if (gpAliases.includes(h) || gpAliases.some(alias => h.includes(alias))) acc.push(i); return acc; }, []);
  const grCols = headers.reduce((acc, h, i) => { if (grAliases.includes(h) || grAliases.some(alias => h.includes(alias))) acc.push(i); return acc; }, []);

  if (regCol === -1) {
    throw new Error(`Cannot find "Register Number" column. Header row (row ${headerRowIdx + 1}) columns: ${headers.slice(0, 8).join(" | ")}`);
  }

  const parsed = [];
  for (let i = headerRowIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    // Skip re-appear detail rows: S.No (col A) is blank/empty AND Register Number is blank
    const sno = row[snoCol];
    const regRaw = row[regCol];
    if ((sno === "" || sno === null || sno === undefined) && (regRaw === "" || regRaw === null || regRaw === undefined)) continue; // re-appear row
    if (regRaw === "" || regRaw === null || regRaw === undefined) continue; // safety

    // Normalize regNo to string and uppercase
    const regNo = normalizeRegNo(regRaw);
    if (!regNo || !/[A-Za-z0-9]{2,}/.test(regNo)) continue;

    const gpa = gpaCol >= 0 ? parseFloat(row[gpaCol]) || 0 : 0;
    const cgpa = cgpaCol >= 0 ? parseFloat(row[cgpaCol]) || 0 : 0;
    const reappear = reapCol >= 0 ? (parseInt(row[reapCol]) || 0) : 0;

    // Determine pass/fail: any U/F/RA/AB grade in GR columns = FAIL (arrear)
    const grVals = grCols.map(ci => String(row[ci] ?? "").trim().toUpperCase());
    const uCount = grVals.filter(v => ["U", "F", "RA", "AB"].includes(v)).length;
    const abCount = grVals.filter(v => ["AB", "AAA", "ABS", "ABSENT"].includes(v)).length;

    const resultVal = resultCol >= 0 ? String(row[resultCol] ?? "").trim().toLowerCase() : "";
    const isResultAbsent = resultVal.includes("absent") || resultVal === "ab" || resultVal === "aaa";
    const isAbsent = isResultAbsent || (grVals.length > 0 && abCount === grVals.length);

    const isResultFail = resultVal.includes("fail") || resultVal.includes("ra") || resultVal.includes("u") || resultVal.includes("f") || resultVal === "u" || resultVal === "f";

    const hasFail = isAbsent || uCount > 0 || reappear > 0 || isResultFail;

    // Extract subject-wise grades
    const subjects = grCols.map(ci => {
      const code = String(headers[ci - 1] || `SUB-${ci}`).trim().toUpperCase();
      const grade = String(row[ci] ?? "").trim().toUpperCase();
      const passed = !["U", "F", "RA", "AB", ""].includes(grade);
      return { code, grade, passed };
    }).filter(sub => sub.code && !sub.code.includes("REGISTER") && !sub.code.includes("SEM"));

    parsed.push({
      regNo,
      gpa: isAbsent ? 0 : gpa,
      cgpa: isAbsent ? 0 : cgpa,
      reappear: isAbsent ? (grCols.length || reappear || 1) : (reappear || uCount),
      uCount,
      isAbsent,
      hasFail,
      subjectCount: gpCols.length,
      subjects
    });
  }

  if (parsed.length === 0) {
    throw new Error("No student records found. Verify the Excel has data rows after the header.");
  }
  return parsed;
}

function buildFloorReport(parsedRows, students) {
  // Cross-reference: match by regNo (case-insensitive, trimmed)
  const studentMap = {};
  for (const s of students) {
    const byRegNo = normalizeRegNo(s.regNo);
    const byName = String(s.name ?? "").trim().toUpperCase();
    if (byRegNo) studentMap[byRegNo] = s;
    if (byName && /\d{5,}/.test(byName)) studentMap[byName] = s;
  }

  // Group by floor
  const floorMap = {};
  let unmatched = 0;

  for (const row of parsedRows) {
    const student = studentMap[row.regNo];
    if (!student) { unmatched++; continue; }
    const floor = student.floor || 1;
    if (!floorMap[floor]) floorMap[floor] = { floor, rows: [] };
    floorMap[floor].rows.push({ ...row, name: student.name, dept: student.dept });
  }

  const summary = Object.values(floorMap).map(({ floor, rows }) => {
    const total = rows.length;
    const failed = rows.filter(r => r.hasFail).length;   // any failure grade/indicator = fail
    const passed = total - failed;                        // no failures = pass
    const gpas = rows.map(r => r.gpa).filter(g => g > 0);
    const avgGpa = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "-";
    const topRow = [...rows].sort((a, b) => b.cgpa - a.cgpa)[0];
    const topper = topRow ? `${topRow.name} (${topRow.cgpa})` : "-";
    const passPerc = total > 0 ? Math.round((passed / total) * 100) : 0;

    // Aggregate department performance
    const deptMap = {};
    // Aggregate subject performance
    const subjectMap = {};

    rows.forEach(r => {
      if (r.dept) {
        if (!deptMap[r.dept]) deptMap[r.dept] = { name: r.dept, total: 0, passed: 0, failed: 0 };
        deptMap[r.dept].total++;
        if (r.hasFail) deptMap[r.dept].failed++;
        else deptMap[r.dept].passed++;
      }

      if (r.subjects) {
        r.subjects.forEach(sub => {
          if (!subjectMap[sub.code]) {
            subjectMap[sub.code] = { code: sub.code, name: sub.code, total: 0, passed: 0, failed: 0 };
          }
          subjectMap[sub.code].total++;
          if (sub.passed) subjectMap[sub.code].passed++;
          else subjectMap[sub.code].failed++;
        });
      }
    });

    const departments = Object.values(deptMap).map(d => ({
      ...d,
      passPercent: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 0
    }));

    const subjects = Object.values(subjectMap).map(s => ({
      ...s,
      passPercent: s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0
    }));

    const studentsList = rows.map(r => ({
      regNo: r.regNo,
      name: r.name,
      dept: r.dept,
      gpa: r.gpa,
      cgpa: r.cgpa,
      hasFail: r.hasFail,
      reappear: r.reappear,
      isAbsent: r.isAbsent || false,
      hostel: r.hostel || ""
    }));

    return {
      floor,
      total,
      appeared: total - rows.filter(r => r.isAbsent).length,
      passed,
      failed,
      passPercent: passPerc,
      topper,
      avg: avgGpa,
      subjects,
      departments,
      studentsList
    };
  }).sort((a, b) => a.floor - b.floor);

  return { summary, unmatched, total: parsedRows.length };
}

export function computeConsolidationData(summary, selectedHostel = "Overall", studentMaster = []) {
  // Build student master map for fast lookup of hostel if missing
  const studentMap = {};
  if (Array.isArray(studentMaster)) {
    studentMaster.forEach(s => {
      const reg = normalizeRegNo(s.regNo);
      if (reg) studentMap[reg] = s;
    });
  }

  let allStudents = [];
  if (Array.isArray(summary)) {
    summary.forEach(fs => {
      if (Array.isArray(fs.studentsList)) {
        allStudents = allStudents.concat(fs.studentsList);
      }
    });
  }

  // Filter students by hostel
  let filteredStudents = allStudents.map(s => {
    const reg = normalizeRegNo(s.regNo);
    const hostel = s.hostel || studentMap[reg]?.hostel || "Boys Hostel 1";
    return { ...s, hostel };
  });

  if (selectedHostel !== "Overall") {
    filteredStudents = filteredStudents.filter(s => s.hostel === selectedHostel);
  }

  const deptMap = {};
  filteredStudents.forEach(s => {
    const dept = String(s.dept || "Unknown").trim().toUpperCase();
    if (!deptMap[dept]) {
      deptMap[dept] = {
        name: dept,
        strength: 0,
        appeared: 0,
        absent: 0,
        allPass: 0,
        arrears: [0, 0, 0, 0, 0, 0, 0], // bins for 1..7 arrears
      };
    }

    const d = deptMap[dept];
    d.strength++;

    const isAb = s.isAbsent || false;
    if (isAb) {
      d.absent++;
      const arrCount = s.reappear || 0;
      if (arrCount > 0) {
        const binIndex = Math.min(arrCount, 7) - 1;
        if (binIndex >= 0) {
          d.arrears[binIndex]++;
        }
      }
    } else {
      d.appeared++;
      const arrCount = s.reappear || 0;
      if (arrCount === 0) {
        d.allPass++;
      } else {
        const binIndex = Math.min(arrCount, 7) - 1;
        if (binIndex >= 0) {
          d.arrears[binIndex]++;
        }
      }
    }
  });

  const departments = Object.values(deptMap).map(d => {
    const passPercent = d.appeared > 0 ? (d.allPass / d.appeared * 100) : 0;
    return {
      ...d,
      passPercent
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  let totalStudents = 0;
  let appeared = 0;
  let absent = 0;
  let passed = 0;
  let failed = 0;
  const arrearCounts = [0, 0, 0, 0, 0, 0, 0, 0]; // bins for 0..7 arrears

  departments.forEach(d => {
    totalStudents += d.strength;
    appeared += d.appeared;
    absent += d.absent;
    passed += d.allPass;
    for (let i = 0; i < 7; i++) {
      arrearCounts[i + 1] += d.arrears[i];
    }
  });
  arrearCounts[0] = passed;
  failed = appeared - passed;
  const passPercent = appeared > 0 ? (passed / appeared * 100) : 0;

  // Compute GPA stats
  const gpas = filteredStudents.map(s => s.gpa).filter(g => g > 0);
  const avg = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2) : "-";
  const sortedByCgpa = [...filteredStudents].sort((a, b) => b.cgpa - a.cgpa);
  const topper = sortedByCgpa.length && sortedByCgpa[0].cgpa > 0
    ? `${sortedByCgpa[0].name} (${sortedByCgpa[0].cgpa})`
    : "-";

  return {
    overall: {
      totalStudents,
      appeared,
      absent,
      passed,
      failed,
      passPercent,
      avg,
      topper
    },
    arrearCounts,
    departments,
    studentsList: filteredStudents
  };
}

export function renderConsolidationTables(condData) {
  if (!condData || !condData.overall) return null;

  const { overall, arrearCounts, departments } = condData;

  const overallRows = [
    [
      "1",
      overall.totalStudents,
      overall.appeared,
      overall.absent,
      <span className="text-emerald-400 font-bold">{overall.passed}</span>,
      <span className="text-red-400 font-bold">{overall.failed}</span>,
      <span className="text-blue-400 font-bold">{overall.passPercent.toFixed(1)}%</span>
    ]
  ];

  const arrearNames = [
    "No of all pass",
    "No of one subject arrear",
    "No of two subject arrears",
    "No of three subject arrears",
    "No of four subject arrears",
    "No of five subject arrears",
    "No of six subject arrears",
    "No of seven subject arrears"
  ];

  const arrearRows = arrearNames.map((name, i) => [
    name,
    <span className="font-bold text-slate-200">{arrearCounts[i] || 0}</span>
  ]);

  const deptHeaders = [
    "S.No",
    "Dept.",
    "Strength",
    "No of appeared",
    "No of Absent",
    "No of All Pass",
    "No of 1 subject arrear",
    "No of 2 subject arrears",
    "No of 3 subject arrears",
    "No of 4 subject arrears",
    "No of 5 subject arrears",
    "No of 6 subject arrears",
    "No of seven subject arrears",
    "Dept. wise pass percentage"
  ];

  const deptRows = departments.map((d, idx) => [
    idx + 1,
    <span className="font-bold text-slate-300">{d.name}</span>,
    d.strength,
    d.appeared,
    d.absent,
    <span className="text-emerald-400 font-medium">{d.allPass}</span>,
    d.arrears[0] || 0,
    d.arrears[1] || 0,
    d.arrears[2] || 0,
    d.arrears[3] || 0,
    d.arrears[4] || 0,
    d.arrears[5] || 0,
    d.arrears[6] || 0,
    <span className="font-bold text-blue-400">{d.passPercent.toFixed(1)}%</span>
  ]);

  // Compute total row for dept table
  const totalStrength = departments.reduce((acc, d) => acc + d.strength, 0);
  const totalAppeared = departments.reduce((acc, d) => acc + d.appeared, 0);
  const totalAbsent = departments.reduce((acc, d) => acc + d.absent, 0);
  const totalAllPass = departments.reduce((acc, d) => acc + d.allPass, 0);
  const totalArrears = [0, 0, 0, 0, 0, 0, 0];
  departments.forEach(d => {
    for (let i = 0; i < 7; i++) {
      totalArrears[i] += d.arrears[i] || 0;
    }
  });
  const overallPassPercent = totalAppeared > 0 ? (totalAllPass / totalAppeared * 100) : 0;

  const totalRow = [
    <span className="font-bold text-blue-400">Total</span>,
    "",
    <span className="font-bold text-blue-400">{totalStrength}</span>,
    <span className="font-bold text-blue-400">{totalAppeared}</span>,
    <span className="font-bold text-blue-400">{totalAbsent}</span>,
    <span className="font-bold text-emerald-400">{totalAllPass}</span>,
    <span className="font-bold text-slate-400">{totalArrears[0]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[1]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[2]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[3]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[4]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[5]}</span>,
    <span className="font-bold text-slate-400">{totalArrears[6]}</span>,
    <span className="font-bold text-blue-400">{overallPassPercent.toFixed(1)}%</span>
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Table 1: Overall Summary */}
      <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5 overflow-x-auto">
        <h3 className="text-white font-semibold mb-3 text-sm">Overall Result Summary</h3>
        <Table
          headers={["S.No", "Total No of students", "No of appeared", "No of Absent", "No of Pass", "No of Fail", "Pass Percentage"]}
          rows={overallRows}
        />
      </div>

      {/* Table 2: Arrear Count Distribution */}
      <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5 max-w-md overflow-x-auto">
        <h3 className="text-white font-semibold mb-3 text-sm">Arrear Count Distribution</h3>
        <Table
          headers={["Category", "No of Students"]}
          rows={arrearRows}
        />
      </div>

      {/* Table 3: Department-wise Analysis */}
      <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5 overflow-x-auto">
        <h3 className="text-white font-semibold mb-3 text-sm">Department-wise Academic Analysis</h3>
        <Table
          headers={deptHeaders}
          rows={[...deptRows, totalRow]}
        />
      </div>
    </div>
  );
}

// A simple helper function to convert floor numbers to names
function getFloorName(floorNumOrName) {
  const num = typeof floorNumOrName === 'number'
    ? floorNumOrName
    : parseInt(String(floorNumOrName).replace(/\D/g, ""), 10);

  if (isNaN(num)) return floorNumOrName;

  const ordinals = ["Ground", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];
  if (num >= 1 && num - 1 < ordinals.length) {
    return `${ordinals[num - 1]} Floor`;
  }
  return `Floor ${num}`;
}

const ProgressBar = ({ label, value, max = 100, color = "#3B82F6", subLabel }) => {
  const pct = Math.round((value / max) * 100) || 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400 font-semibold">{value} {subLabel || `(${pct}%)`}</span>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, icon, accent = "#3B82F6" }) => (
  <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-4 flex flex-col gap-1">
    <div className="flex items-center justify-between mb-1">
      <span className="text-slate-400 text-xs font-medium">{label}</span>
      <div style={{ background: accent + "22" }} className="w-7 h-7 rounded-lg flex items-center justify-center">
        <Icon d={icons[icon] || icons.chart} size={14} color={accent} />
      </div>
    </div>
    <div className="text-white text-2xl font-bold leading-tight truncate" title={String(value)}>{value ?? "—"}</div>
    {sub && <div className="text-slate-500 text-xs">{sub}</div>}
  </div>
);

export function ResultPage() {
  const [step, setStep] = useState(0);
  const [report, setReport] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [parseInfo, setParseInfo] = useState(null);
  const fileRef = useRef();

  // Dropdown / Dynamic stats state
  const [selectedFloor, setSelectedFloor] = useState("Overall");
  const [selectedHostel, setSelectedHostel] = useState("Overall");
  const [previewHostel, setPreviewHostel] = useState("Overall");
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [floorsList, setFloorsList] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [uploadMode,  setUploadMode]  = useState("single"); // "single" | "multi"

  // Use a ref so the FileReader async callback always sees the latest students list
  const studentsRef = useRef([]);

  async function loadInitial() {
    try {
      const s = await api.getStudents();
      studentsRef.current = s;
      setStudents(s);
    } catch (_) { }

    try {
      const floors = await api.getFloors();
      setFloorsList(floors);
    } catch (_) { }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function fetchAnalysis() {
    setLoadingAnalysis(true);
    try {
      const res = await api.getResultAnalysis({ floor: selectedFloor });
      if (res && !res.error) {
        setAnalysisData(res);
      } else {
        setAnalysisData(null);
      }
    } catch (err) {
      setAnalysisData(null);
    } finally {
      setLoadingAnalysis(false);
    }
  }

  useEffect(() => {
    fetchAnalysis();
  }, [selectedFloor]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    setStep(1);

    let freshStudents = studentsRef.current;
    try {
      freshStudents = await api.getStudents();
      studentsRef.current = freshStudents;
      setStudents(freshStudents);
    } catch (_) { }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsed = parseResultExcel(ws);
        const result = buildFloorReport(parsed, freshStudents);
        setRawData(parsed);
        setReport(result.summary);
        setParseInfo({
          total: result.total,
          unmatched: result.unmatched,
          matched: result.total - result.unmatched,
          sampleParsed: parsed.slice(0, 3).map(r => r.regNo),
          sampleStudents: freshStudents.slice(0, 3).map(s => s.regNo),
        });
        setStep(2);
      } catch (err) {
        setError("Failed to parse Excel: " + err.message);
        setStep(0);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleGenerate() {
    setSaving(true);
    try {
      const settings = await api.getSettings();
      await api.addReport({
        title: `Semester Result Analysis – ${fileName}`,
        by: "Admin",
        year: settings.year,
        sem: settings.sem,
        college: settings.college,
        hostel: settings.hostel,
        summary: report
      });
      setStep(3);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleTriggerNewUpload() {
    setAnalysisData(null);
    setReport(null);
    setFileName("");
    setParseInfo(null);
    setStep(0);
  }

  async function handleSaveComplete() {
    setSelectedFloor("Overall");
    setSelectedHostel("Overall");
    await fetchAnalysis();
    setStep(0);
  }

  // Extract unique hostels dynamically from students and floors
  const uniqueHostels = Array.from(
    new Set([
      ...students.map(s => s.hostel),
      ...floorsList.map(f => f.hostel)
    ].map(h => String(h || "").trim()).filter(Boolean))
  );
  if (uniqueHostels.length === 0) {
    uniqueHostels.push("Boys Hostel 1", "Boys Hostel 2", "Girls Hostel 1", "Girls Hostel 2");
  }

  // ── Mode toggle tab bar (reused in both single-mode renders) ────────────────
  const ModeToggle = () => (
    <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "#1E2E45", display: "inline-flex" }}>
      {[
        { id: "single", label: "Single File Upload" },
        { id: "multi",  label: "Multi-Department" },
      ].map(m => (
        <button
          key={m.id}
          onClick={() => setUploadMode(m.id)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: uploadMode === m.id ? "#3B82F6" : "transparent",
            color:      uploadMode === m.id ? "white"   : "#64748B",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  // ── Multi-department mode: delegate entirely to MultiDeptResultPage ───────────
  if (uploadMode === "multi") {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Result Analysis</h1>
            <p className="text-slate-400 text-sm mt-1">Upload and analyse semester results by department</p>
          </div>
          <ModeToggle />
        </div>
        <MultiDeptResultPage
          students={students}
          floors={floorsList}
          parseResultExcel={parseResultExcel}
          buildFloorReport={buildFloorReport}
          computeConsolidationData={computeConsolidationData}
          renderConsolidationTables={renderConsolidationTables}
        />
      </div>
    );
  }

  if (analysisData && step !== 1 && step !== 2) {
    const floorOptions = [
      { value: "Overall", label: "All Floors" },
      ...floorsList.map(f => {
        const name = getFloorName(f.name);
        return { value: name, label: name };
      })
    ];

    const condData = computeConsolidationData([{ studentsList: analysisData.studentsList }], selectedHostel, students);

    return (
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Result Analysis</h1>
            <p className="text-slate-400 text-sm mt-1">{analysisData.title} · {analysisData.year} (Sem {analysisData.sem})</p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedHostel}
              onChange={e => setSelectedHostel(e.target.value)}
              options={[
                { value: "Overall", label: "All Hostels" },
                ...uniqueHostels.map(h => ({ value: h, label: h }))
              ]}
            />
            <Select
              value={selectedFloor}
              onChange={e => setSelectedFloor(e.target.value)}
              options={floorOptions}
            />
            <Btn icon="upload" variant="outline" onClick={handleTriggerNewUpload}>
              Upload New Excel
            </Btn>
            <Btn variant="outline" onClick={() => setUploadMode("multi")}>
              Multi-Dept Upload
            </Btn>
          </div>
        </div>

        {/* KPIs row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Students" value={condData.overall.totalStudents} sub="Overall Strength" icon="students" accent="#3B82F6" />
          <StatCard label="Present Students" value={condData.overall.appeared} sub="Attended Exams" icon="check" accent="#10B981" />
          <StatCard label="Absent Students" value={condData.overall.absent} sub="Absent from Exams" icon="close" accent="#EF4444" />
          <StatCard label="Pass Rate" value={`${condData.overall.passPercent.toFixed(1)}%`} sub={`${condData.overall.passed} passed`} icon="check" accent="#10B981" />
          <StatCard label="Fail Rate" value={`${(100 - condData.overall.passPercent).toFixed(1)}%`} sub={`${condData.overall.failed} failed`} icon="close" accent="#EF4444" />
          <StatCard label="Average GPA" value={condData.overall.avg} sub="GPA Average" icon="chart" accent="#8B5CF6" />
          <StatCard label="Topper" value={condData.overall.topper} sub="Top Performer" icon="students" accent="#F59E0B" />
        </div>

        {/* Consolidated Analysis Tables */}
        <div className="mb-6">
          {renderConsolidationTables(condData)}
        </div>

        {/* Detailed Student List */}
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Student Result Details</h3>
          <Table
            headers={["Reg. No.", "Name", "Department", "GPA", "CGPA", "Result"]}
            rows={condData.studentsList.map(st => [
              <span className="font-mono text-xs text-blue-400">{st.regNo}</span>,
              st.name,
              st.dept,
              st.gpa || "-",
              st.cgpa || "-",
              st.hasFail ? (
                <Badge color="red">Fail ({st.reappear} reappear)</Badge>
              ) : (
                <Badge color="green">Pass</Badge>
              )
            ])}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Result Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">Upload semester result Excel and generate floor-wise reports</p>
        </div>
        <ModeToggle />
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-0">
        {["Upload Excel", "Processing", "Preview", "Done"].map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: step >= i ? "#3B82F6" : "#1E2E45", color: step >= i ? "white" : "#475569", border: step >= i ? "none" : "1px solid #263548" }}>
                {step > i ? <Icon d={icons.check} size={12} /> : i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: step >= i ? "#93C5FD" : "#475569" }}>{s}</span>
            </div>
            {i < 3 && <div className="w-8 sm:w-16 h-px mx-2" style={{ background: step > i ? "#3B82F6" : "#1E2E45" }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ background: "#EF444415", border: "1px solid #EF444430", color: "#FCA5A5" }} className="rounded-lg p-3 text-sm mb-4">{error}</div>}

      {step === 0 && (
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-8 text-center">
          <Icon d={icons.upload} size={48} color="#3B82F6" />
          <h3 className="text-white font-semibold mt-4 mb-2">Upload Semester Result Excel</h3>
          <p className="text-slate-400 text-sm mb-2 max-w-md mx-auto">
            Supports the standard result format with Subject Code / GR / GP columns.
            Hostellers are automatically matched by Register Number and grouped by floor.
          </p>
          <p className="text-slate-500 text-xs mb-6">Expected columns: Register Number · Sem No · Subject Code · GR · GP · RESULT · GPA · CGPA</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          <Btn icon="upload" onClick={() => fileRef.current.click()}>Browse & Upload Excel</Btn>
        </div>
      )}

      {step === 1 && (
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-6" />
          <h3 className="text-white font-semibold mb-2">Processing Result Excel…</h3>
          <p className="text-slate-400 text-sm">Detecting subjects · Matching register numbers · Grouping by floor</p>
        </div>
      )}

      {step === 2 && report && (
        <div>
          {/* Parse summary cards */}
          {parseInfo && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-3 mb-2">
                {[
                  { label: "Total Records", value: parseInfo.total, color: "#3B82F6" },
                  { label: "Hostellers Matched", value: parseInfo.matched, color: "#10B981" },
                  { label: "Unmatched (skipped)", value: parseInfo.unmatched, color: parseInfo.unmatched > 0 ? "#F59E0B" : "#64748B" },
                ].map((it, i) => (
                  <div key={i} style={{ background: "#0F1B2D", border: "1px solid #263548" }} className="rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold tabular-nums" style={{ color: it.color }}>{it.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{it.label}</div>
                  </div>
                ))}
              </div>
              {parseInfo.unmatched > 0 && parseInfo.sampleParsed && (
                <div style={{ background: "#1A1A0D", border: "1px solid #3D3010" }} className="rounded-lg p-3 text-xs">
                  <div className="text-amber-400 font-medium mb-1">Debug — Reg No mismatch check:</div>
                  <div className="text-slate-400">From Excel: <span className="font-mono text-amber-300">{parseInfo.sampleParsed.join("  |  ")}</span></div>
                  <div className="text-slate-400 mt-1">From Student Master: <span className="font-mono text-blue-300">{parseInfo.sampleStudents.join("  |  ")}</span></div>
                  <div className="text-slate-500 mt-1">These must match exactly for hostellers to be found.</div>
                </div>
              )}
            </div>
          )}

          <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">Consolidated Result Analysis Preview</h3>
                <p className="text-slate-500 text-xs mt-0.5">{fileName}</p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={previewHostel}
                  onChange={e => setPreviewHostel(e.target.value)}
                  options={[
                    { value: "Overall", label: "All Hostels" },
                    ...uniqueHostels.map(h => ({ value: h, label: h }))
                  ]}
                />
                <Btn icon="check" size="sm" onClick={handleGenerate} disabled={saving}>
                  {saving ? "Saving…" : "Save Report"}
                </Btn>
                <Btn variant="outline" size="sm" onClick={() => { setStep(0); setReport(null); setParseInfo(null); setFileName(""); }}>
                  New Upload
                </Btn>
              </div>
            </div>
            {report.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <div className="text-slate-400 text-sm mb-2">No hostellers matched from the result file.</div>
                <div className="text-slate-500 text-xs">Make sure you have first imported students via <strong className="text-slate-300">Student Master → Import Excel</strong>, and that the Register Numbers in the result Excel (e.g. 922525243001) exactly match those in the student master.</div>
              </div>
            ) : (
              renderConsolidationTables(computeConsolidationData(report, previewHostel, students))
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-12 text-center">
          <div style={{ background: "#10B98115" }} className="rounded-full p-5 inline-flex mb-5">
            <Icon d={icons.check} size={40} color="#10B981" />
          </div>
          <h3 className="text-white font-semibold text-xl mb-2">Report Saved Successfully</h3>
          <p className="text-slate-400 text-sm mb-6">Available in Report History</p>
          <div className="flex gap-3 justify-center">
            <Btn variant="outline" onClick={handleSaveComplete}>Go to Dashboard</Btn>
            <Btn onClick={() => { setStep(0); setReport(null); setParseInfo(null); setFileName(""); }}>New Analysis</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
