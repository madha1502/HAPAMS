import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { StatCard, ErrorBanner, Spinner, Badge } from "../components/ui.jsx";

const MiniBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-28 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
          <div
            className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80 shadow-xs"
            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color || "#0071E3", minHeight: 6 }}
          />
          <span className="text-xs font-semibold text-[#86868B] truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const DEPT_COLORS = ["#0071E3", "#34C759", "#FF9500", "#5E5CE6", "#FF3B30", "#30B0C7"];

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
  if (!stats) return <ErrorBanner msg={error} />;

  const deptChartData = Object.entries(stats.departmentBreakdown || {}).map(([dept, count], i) => ({
    label: dept,
    value: count,
    color: DEPT_COLORS[i % DEPT_COLORS.length]
  }));

  const floorChartData = (stats.floorBreakdown || []).map(f => ({
    label: f.floor,
    value: f.studentCount,
    color: "#0071E3"
  }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Dashboard Overview</h1>
        <p className="text-xs text-[#86868B] font-medium mt-1">Hostel performance metrics, room occupancy, and student distributions</p>
      </div>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} sub="Enrolled Residents" icon="users" accent="#0071E3" />
        <StatCard title="Total Capacity" value={stats.totalCapacity} sub="Available Beds" icon="building" accent="#34C759" />
        <StatCard title="Occupancy Rate" value={`${stats.occupancyRate}%`} sub={`${stats.occupiedCapacity} Filled`} icon="check" accent="#FF9500" />
        <StatCard title="Active Hostels" value={stats.activeFloors || stats.totalFloors} sub="Managed Blocks" icon="home" accent="#5E5CE6" />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[#1D1D1F] text-sm">Department Enrollment</h3>
            <Badge color="blue">{Object.keys(stats.departmentBreakdown || {}).length} Departments</Badge>
          </div>
          <p className="text-xs text-[#86868B] mb-4">Student distribution across academic branches</p>
          <MiniBarChart data={deptChartData} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[#1D1D1F] text-sm">Floor Occupancy</h3>
            <Badge color="green">{stats.totalFloors} Floors</Badge>
          </div>
          <p className="text-xs text-[#86868B] mb-4">Resident count per hostel level</p>
          <MiniBarChart data={floorChartData} />
        </div>
      </div>
    </div>
  );
}
