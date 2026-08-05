const BASE = import.meta.env.VITE_API_URL || "/api";

async function req(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (body)              => req("POST", "/auth/login", body),

  // Dashboard
  getDashboard: ()           => req("GET",  "/dashboard"),

  // Result Analysis
  getResultAnalysis: (params) => req("GET",  "/result-analysis?" + new URLSearchParams(params || {})),

  // Floors  ← THIS IS THE KEY FIX: full CRUD via real API
  getFloors:    ()           => req("GET",  "/floors"),
  addFloor:     (body)       => req("POST", "/floors", body),
  updateFloor:  (id, body)   => req("PUT",  `/floors/${id}`, body),
  deleteFloor:  (id)         => req("DELETE", `/floors/${id}`),

  // Students
  getStudents:  (params)     => req("GET",  "/students?" + new URLSearchParams(params || {})),
  addStudent:   (body)       => req("POST", "/students", body),
  updateStudent:(regNo, body)=> req("PUT",  `/students/${regNo}`, body),
  deleteStudent:(regNo)      => req("DELETE", `/students/${regNo}`),
  clearStudents:()           => req("DELETE", "/students"),
  bulkImport:  (rows)        => req("POST", "/students/bulk", { rows }),

  // Rooms
  getRooms:     (params)     => req("GET",  "/rooms?" + new URLSearchParams(params || {})),
  addRoom:      (body)       => req("POST", "/rooms", body),
  updateRoom:   (id, body)   => req("PUT",  `/rooms/${id}`, body),
  deleteRoom:   (id)         => req("DELETE", `/rooms/${id}`),

  // Users
  getUsers:     ()           => req("GET",  "/users"),
  addUser:      (body)       => req("POST", "/users", body),
  deleteUser:   (id)         => req("DELETE", `/users/${id}`),

  // Reports
  getReports:   ()           => req("GET",  "/reports"),
  addReport:    (body)       => req("POST", "/reports", body),
  deleteReport: (id)         => req("DELETE", `/reports/${id}`),

  // Attendance & Biometrics
  getAttendance:        (params) => req("GET",  "/attendance?" + new URLSearchParams(params || {})),
  getAttendanceSummary: (params) => req("GET",  "/attendance/summary?" + new URLSearchParams(params || {})),
  pushBiometricData:    (body)   => req("POST", "/attendance/biometric-push", body),
  simulateBiometricScan:(body)   => req("POST", "/attendance/simulate", body),

  // Logs
  getLogs:      ()           => req("GET",  "/logs"),

  // Settings
  getSettings:  ()           => req("GET",  "/settings"),
  saveSettings: (body)       => req("PUT",  "/settings", body),
};
