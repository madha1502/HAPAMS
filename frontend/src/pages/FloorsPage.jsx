import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Icon, icons, Badge, Btn, PageHeader, Modal, Input, Select, ErrorBanner, Spinner } from "../components/ui.jsx";

export default function FloorsPage() {
  const [floors,   setFloors]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null); // "add" | "edit" | "delete"
  const [editId,   setEditId]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form,     setForm]     = useState({ name: "", capacity: "", hostel: "Men's Hostel", description: "", status: "Active" });

  // ── Fetch floors from backend ──────────────────────────────────────────────
  async function load() {
    try {
      setLoading(true);
      const data = await api.getFloors();
      setFloors(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Open Add modal ─────────────────────────────────────────────────────────
  function openAdd() {
    const nextNum = floors.length + 1;
    setForm({ name: `Floor ${nextNum}`, capacity: "", hostel: "Men's Hostel", description: "", status: "Active" });
    setModal("add");
    setError("");
  }

  // ── Open Edit modal ────────────────────────────────────────────────────────
  function openEdit(f) {
    setForm({
      name:        f.name,
      capacity:    String(f.capacity),
      hostel:      f.hostel,
      description: f.description || "",
      status:      f.status || "Active",
    });
    setEditId(f.id);
    setModal("edit");
    setError("");
  }

  // ── Save (Add or Edit) ─────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || !form.capacity) return;
    setSaving(true);
    setError("");
    try {
      if (modal === "add") {
        const created = await api.addFloor(form);
        setFloors(prev => [...prev, created]);   // ← state updated from server response
      } else {
        const updated = await api.updateFloor(editId, form);
        setFloors(prev => prev.map(f => f.id === editId ? updated : f));
      }
      setModal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    setSaving(true);
    try {
      await api.deleteFloor(deleteId);
      setFloors(prev => prev.filter(f => f.id !== deleteId));
      setModal(null);
      setDeleteId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const totalCapacity = floors.reduce((s, f) => s + (f.capacity || 0), 0);
  const totalStudents = floors.reduce((s, f) => s + (f.students || 0), 0);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Floor Management"
        sub={`${floors.length} floors · ${totalCapacity} total capacity`}
        actions={<Btn icon="plus" onClick={openAdd}>Add New Floor</Btn>}
      />

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Floors",    value: floors.length,  color: "#3B82F6" },
          { label: "Total Capacity",  value: totalCapacity,  color: "#10B981" },
          { label: "Occupied",        value: totalStudents,  color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#162033", border: "1px solid #263548" }} className="rounded-xl p-4 text-center">
            <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Floor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
        {floors.map(f => {
          const pct      = f.capacity > 0 ? Math.round(((f.students || 0) / f.capacity) * 100) : 0;
          const barColor = pct >= 90 ? "#EF4444" : pct >= 60 ? "#F59E0B" : "#3B82F6";
          return (
            <div key={f.id}
              style={{
                background:  "#162033",
                border:      `1px solid ${f.status === "Inactive" ? "#374151" : "#263548"}`,
                opacity:     f.status === "Inactive" ? 0.65 : 1,
              }}
              className="rounded-xl p-5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{f.name}</span>
                    {f.status === "Inactive" && <Badge color="gray">Inactive</Badge>}
                  </div>
                  {f.description && <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>}
                  <p className="text-xs text-slate-600 mt-0.5">{f.hostel}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Btn variant="ghost" size="sm" icon="edit"  onClick={() => openEdit(f)} />
                  <Btn variant="ghost" size="sm" icon="trash" onClick={() => { setDeleteId(f.id); setModal("delete"); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div style={{ background: "#0F1B2D" }} className="rounded-lg p-2.5 text-center">
                  <div className="text-xl font-bold text-blue-400 tabular-nums">{f.capacity}</div>
                  <div className="text-xs text-slate-500">Capacity</div>
                </div>
                <div style={{ background: "#0F1B2D" }} className="rounded-lg p-2.5 text-center">
                  <div className="text-xl font-bold text-emerald-400 tabular-nums">{f.students ?? 0}</div>
                  <div className="text-xs text-slate-500">Students</div>
                </div>
              </div>
              <div className="h-2 rounded-full bg-slate-700/50 mb-1">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{f.capacity - (f.students ?? 0)} seats vacant</span>
                <span>{pct}% occupied</span>
              </div>
            </div>
          );
        })}

        {/* Add floor shortcut card */}
        <div onClick={openAdd}
          style={{ background: "#0F1B2D", border: "2px dashed #263548" }}
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all min-h-[180px]">
          <div style={{ background: "#1E2E45" }} className="w-10 h-10 rounded-full flex items-center justify-center">
            <Icon d={icons.plus} size={20} color="#3B82F6" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 text-sm font-medium">Add New Floor</p>
            <p className="text-slate-600 text-xs mt-0.5">New construction, extension, etc.</p>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Add New Floor" : `Edit ${form.name}`} onClose={() => { setModal(null); setError(""); }}>
          <div className="flex flex-col gap-3">
            <ErrorBanner msg={error} onDismiss={() => setError("")} />
            <Input
              label="Floor Name *"
              placeholder="e.g. Floor 5, Ground Floor, Terrace Block"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Capacity (max students) *"
              type="number"
              min="1"
              placeholder="e.g. 40"
              value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
            />
            <Input
              label="Hostel Block"
              placeholder="e.g. Boys Hostel 1, Girls Hostel 2"
              value={form.hostel}
              onChange={e => setForm(f => ({ ...f, hostel: e.target.value }))}
            />
            <Input
              label="Description (optional)"
              placeholder="e.g. New construction block, Under renovation…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[
                { value: "Active",   label: "Active — accepting students"              },
                { value: "Inactive", label: "Inactive — under construction / maintenance" },
              ]}
            />
            {(!form.name.trim() || !form.capacity) && (
              <p className="text-xs text-amber-400">* Floor Name and Capacity are required</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn variant="outline" onClick={() => { setModal(null); setError(""); }}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!form.name.trim() || !form.capacity || saving}>
              {saving ? "Saving…" : modal === "add" ? "Add Floor" : "Save Changes"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      {modal === "delete" && (
        <Modal title="Remove Floor" onClose={() => { setModal(null); setDeleteId(null); }}>
          <div className="text-center py-2">
            <div style={{ background: "#EF444415" }} className="rounded-full p-4 inline-flex mb-4">
              <Icon d={icons.trash} size={28} color="#EF4444" />
            </div>
            <p className="text-slate-300 text-sm mb-2">
              Remove <span className="text-white font-semibold">{floors.find(f => f.id === deleteId)?.name}</span>?
            </p>
            <p className="text-slate-500 text-xs mb-6">
              Students assigned to this floor will not be deleted, but their floor assignment will need to be updated.
            </p>
            <div className="flex justify-center gap-3">
              <Btn variant="outline" onClick={() => { setModal(null); setDeleteId(null); }}>Cancel</Btn>
              <Btn variant="danger" icon="trash" onClick={handleDelete} disabled={saving}>
                {saving ? "Removing…" : "Remove Floor"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
