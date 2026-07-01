import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { StatCard, ErrorBanner, Spinner, Badge } from "../components/ui.jsx";

const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(d.value / max) * 64}px`, background: d.color || "#3B82F6", minHeight: 4 }} />
          <span className="text-xs text-slate-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const DEPT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats)  return <ErrorBanner msg={error} />;

  const deptData  = Object.entries(stats.deptCounts  || {}).map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));
  const floorData = Object.entries(stats.floorCounts || {}).map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Academic Year 2024–25 · Semester 1</p>
        </div>
        <Badge color="green">Live</Badge>
      </div>

      <ErrorBanner msg={error} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Hostellers" value={stats.totalStudents} sub={`${stats.activeStudents} active`} icon="students" accent="#3B82F6" />
        <StatCard label="Total Floors"     value={stats.totalFloors}   sub="All active"                        icon="floor"    accent="#10B981" />
        <StatCard label="Total Rooms"      value={stats.totalRooms}    sub={`${stats.vacantRooms} vacant`}     icon="room"     accent="#F59E0B" />
        <StatCard label="Departments"      value={deptData.length}     sub="Across all floors"                 icon="students" accent="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Students by Department</h3>
          <MiniBarChart data={deptData} />
        </div>
        <div style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Students by Floor</h3>
          <MiniBarChart data={floorData} />
        </div>
      </div>
    </div>
  );
}
