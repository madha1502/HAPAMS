import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Table, Modal, Input, Select, ErrorBanner, Spinner } from "../components/ui.jsx";
import { icons, Icon } from "../components/ui.jsx";

export default function AttendancePage() {
  const [summary,      setSummary]      = useState(null);
  const [logs,         setLogs]         = useState([]);
  const [students,     setStudents]     = useState([]);
  const [floors,       setFloors]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("dashboard"); // "dashboard" | "logs" | "absentees"
  const [error,        setError]        = useState("");

  // Filters
  const [filterDate,   setFilterDate]   = useState(new Date().toISOString().split("T")[0]);
  const [filterFloor,  setFilterFloor]  = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search,       setSearch]       = useState("");

  // Modals & Simulator
  const [simModal,     setSimModal]     = useState(false);
  const [simRegNo,     setSimRegNo]     = useState("");
  const [simType,      setSimType]      = useState("IN");
  const [simDevice,    setSimDevice]    = useState("BIO-FL1-MAIN");
  const [simLoading,   setSimLoading]   = useState(false);
  const [simSuccess,   setSimSuccess]   = useState(null);

  const [apiDocModal,  setApiDocModal]  = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [sumData, logsData, studs, flrs] = await Promise.all([
        api.getAttendanceSummary({ date: filterDate }),
        api.getAttendance({ date: filterDate, floor: filterFloor, status: filterStatus, q: search }),
        api.getStudents(),
        api.getFloors()
      ]);
      setSummary(sumData);
      setLogs(logsData);
      setStudents(studs);
      setFloors(flrs);
    } catch (e) {
      setError(e.message || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterDate, filterFloor, filterStatus, search]);

  async function handleSimulateScan() {
    if (!simRegNo) {
      setError("Please select or enter a Student Registration Number.");
      return;
    }
    setSimLoading(true);
    setError("");
    setSimSuccess(null);
    try {
      const res = await api.simulateBiometricScan({
        regNo: simRegNo,
        type: simType,
        deviceId: simDevice
      });
      setSimSuccess(`Biometric scan logged successfully for ${res.studentName} (${res.regNo}) at ${res.time}`);
      await loadData();
    } catch (e) {
      setError(e.message || "Failed to simulate scan.");
    } finally {
      setSimLoading(false);
    }
  }

  if (loading && !summary) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Biometric Attendance Management"
        sub="Real-time attendance logs, floor-wise analysis, and biometric hardware API integration"
        actions={
          <div className="flex gap-2">
            <Btn variant="outline" icon="settings" onClick={() => setApiDocModal(true)}>
              Hardware API Spec
            </Btn>
            <Btn icon="plus" onClick={() => { setSimModal(true); setSimSuccess(null); setError(""); }}>
              Simulate Biometric Scan
            </Btn>
          </div>
        }
      />

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        {[
          { id: "dashboard", label: "Attendance Overview", icon: "dashboard" },
          { id: "logs",      label: "Scan Logs History",    icon: "log" },
          { id: "absentees", label: `Absentees (${summary?.totalAbsent || 0})`, icon: "warning" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon d={icons[t.icon]} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "dashboard" && summary && (
        <div className="flex flex-col gap-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Overall Attendance Rate</div>
              <div className="text-3xl font-bold text-blue-400 mt-2">{summary.attendanceRate}%</div>
              <div className="text-slate-500 text-xs mt-1">{summary.totalPresent} of {summary.totalStudents} Students Present</div>
            </div>

            <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Present Today</div>
              <div className="text-3xl font-bold text-emerald-400 mt-2">{summary.totalPresent}</div>
              <div className="text-slate-500 text-xs mt-1">Verified on Biometric Hardware</div>
            </div>

            <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Absentees</div>
              <div className="text-3xl font-bold text-red-400 mt-2">{summary.totalAbsent}</div>
              <div className="text-slate-500 text-xs mt-1">Pending Check-in / Out of Hostel</div>
            </div>

            <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Late Entries</div>
              <div className="text-3xl font-bold text-amber-400 mt-2">{summary.totalLate}</div>
              <div className="text-slate-500 text-xs mt-1">Check-in after 08:00 AM</div>
            </div>
          </div>

          {/* Floor-wise Attendance Breakdown */}
          <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
              <span>Floor-wise Biometric Attendance Rate</span>
              <span className="text-xs text-slate-400 font-normal">Date: {summary.date}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.floorSummary.map(f => (
                <div key={f.floorId} style={{ background: "#0F1B2D", border: "1px solid #1E2E45" }} className="rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium text-sm">{f.floorName}</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{f.attendanceRate}% ({f.present}/{f.total})</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${f.attendanceRate}%` }}
                      className={`h-full transition-all duration-500 ${
                        f.attendanceRate >= 85 ? "bg-emerald-500" : f.attendanceRate >= 70 ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Present: <strong className="text-emerald-400">{f.present}</strong></span>
                    <span>Absent: <strong className="text-red-400">{f.absent}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === "logs" && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-2">
            <Input
              type="date"
              label="Date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            <Select
              label="Floor"
              value={filterFloor}
              onChange={e => setFilterFloor(e.target.value)}
              options={[{ value: "", label: "All Floors" }, ...floors.map(f => ({ value: String(parseInt(f.name.replace(/\D/g,""),10) || f.id), label: f.name }))]}
            />
            <Select
              label="Status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              options={[
                { value: "", label: "All Statuses" },
                { value: "PRESENT", label: "Present" },
                { value: "LATE", label: "Late" },
                { value: "ABSENT", label: "Absent" }
              ]}
            />
            <Input
              label="Search Student"
              placeholder="Reg. No, Name, Device ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Table
            headers={["Student Name", "Reg. No.", "Dept", "Sem", "Floor / Room", "Time", "Scan Type", "Device ID", "Status"]}
            rows={logs.map(l => [
              l.studentName,
              <span className="font-mono text-blue-400 text-xs">{l.regNo}</span>,
              l.dept,
              `Sem ${l.semester}`,
              `Floor ${l.floor} (Rm ${l.room})`,
              <span className="font-mono text-xs text-slate-300">{l.time}</span>,
              <Badge color={l.type === "IN" ? "blue" : "purple"}>{l.type}</Badge>,
              <span className="font-mono text-xs text-slate-400">{l.deviceId}</span>,
              <Badge color={l.status === "PRESENT" ? "green" : l.status === "LATE" ? "amber" : "red"}>{l.status}</Badge>
            ])}
            emptyMsg="No attendance logs found for selected filters."
          />
        </div>
      )}

      {/* ── ABSENTEES TAB ── */}
      {tab === "absentees" && summary && (
        <div className="flex flex-col gap-4">
          <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-4 flex justify-between items-center">
            <div>
              <h4 className="text-white font-semibold">Absentees List for {summary.date}</h4>
              <p className="text-slate-400 text-xs mt-0.5">Students who have not logged biometric check-in today</p>
            </div>
            <Badge color="red">{summary.totalAbsent} Absentees</Badge>
          </div>

          <Table
            headers={["Student Name", "Reg. No.", "Department", "Year", "Sem", "Floor", "Room No."]}
            rows={summary.absentees.map(s => [
              s.name,
              <span className="font-mono text-blue-400 text-xs">{s.regNo}</span>,
              s.dept,
              `Year ${s.year}`,
              `Sem ${s.semester || 1}`,
              `Floor ${s.floor}`,
              s.room
            ])}
            emptyMsg="All students are present today!"
          />
        </div>
      )}

      {/* ── SIMULATOR MODAL ── */}
      {simModal && (
        <Modal title="Simulate Biometric Machine Punch" onClose={() => setSimModal(false)}>
          <p className="text-slate-400 text-xs mb-4">
            Simulate a real-time punch-in or punch-out from a physical biometric hardware terminal (Thumbprint / Smartcard / Facial Recognition).
          </p>

          {simSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs mb-4">
              {simSuccess}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Select
              label="Select Student"
              value={simRegNo}
              onChange={e => setSimRegNo(e.target.value)}
              options={[
                { value: "", label: "Choose a student..." },
                ...students.map(s => ({
                  value: s.regNo,
                  label: `${s.name} (${s.regNo}) - Floor ${s.floor}, Sem ${s.semester || 1}`
                }))
              ]}
            />

            <Input
              label="Or Type Register Number"
              placeholder="e.g. 22CS001"
              value={simRegNo}
              onChange={e => setSimRegNo(e.target.value.toUpperCase())}
            />

            <Select
              label="Punch Type"
              value={simType}
              onChange={e => setSimType(e.target.value)}
              options={[
                { value: "IN", label: "Check-IN (Morning / Entry)" },
                { value: "OUT", label: "Check-OUT (Permission / Night Out)" }
              ]}
            />

            <Select
              label="Biometric Hardware Terminal"
              value={simDevice}
              onChange={e => setSimDevice(e.target.value)}
              options={[
                { value: "BIO-FL1-MAIN", label: "Floor 1 Terminal (BIO-FL1-MAIN)" },
                { value: "BIO-FL2-MAIN", label: "Floor 2 Terminal (BIO-FL2-MAIN)" },
                { value: "BIO-FL3-MAIN", label: "Floor 3 Terminal (BIO-FL3-MAIN)" },
                { value: "BIO-FL4-MAIN", label: "Floor 4 Terminal (BIO-FL4-MAIN)" },
                { value: "BIO-GATE-MAIN", label: "Main Hostel Gate Terminal (BIO-GATE-MAIN)" }
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Btn variant="outline" onClick={() => setSimModal(false)}>Close</Btn>
            <Btn onClick={handleSimulateScan} disabled={simLoading}>
              {simLoading ? "Processing Scan..." : "Trigger Biometric Punch"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── HARDWARE API INTEGRATION MODAL ── */}
      {apiDocModal && (
        <Modal title="Biometric Machine API Specifications" onClose={() => setApiDocModal(false)}>
          <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
            <p className="text-slate-300 text-xs leading-relaxed">
              Connect physical biometric machines (ZKTeco, Essl, Matrix, Hikvision, etc.) by configuring their HTTP Push / Webhook settings to send JSON payloads to HAPAMS backend endpoint.
            </p>

            <div style={{ background: "#0F1B2D", border: "1px solid #263548" }} className="rounded-lg p-3">
              <div className="text-xs text-blue-400 font-mono font-bold mb-1">POST /api/attendance/biometric-push</div>
              <div className="text-slate-400 text-xs">Content-Type: application/json</div>
            </div>

            <div className="text-xs text-slate-300 font-semibold">Sample HTTP Payload (Single Scan):</div>
            <pre style={{ background: "#09111E", border: "1px solid #1E2E45" }} className="p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "regNo": "22CS001",
  "date": "${new Date().toISOString().split("T")[0]}",
  "time": "07:35:00",
  "type": "IN",
  "deviceId": "BIO-FL1-01",
  "biometricId": "CARD-99210",
  "remarks": "ZKTeco Thumbprint Scanner"
}`}
            </pre>

            <div className="text-xs text-slate-300 font-semibold">Sample cURL Command for Hardware Sync Script:</div>
            <pre style={{ background: "#09111E", border: "1px solid #1E2E45" }} className="p-3 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto">
{`curl -X POST http://YOUR_SERVER_IP:5000/api/attendance/biometric-push \\
  -H "Content-Type: application/json" \\
  -d '[
    { "regNo": "22CS001", "type": "IN", "deviceId": "BIO-FL1-01" },
    { "regNo": "22ME001", "type": "IN", "deviceId": "BIO-FL2-01" }
  ]'`}
            </pre>

            <div className="flex justify-end mt-2">
              <Btn onClick={() => setApiDocModal(false)}>Got it</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
