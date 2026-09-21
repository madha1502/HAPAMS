import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Modal, Input, Select, ErrorBanner, Spinner, Icon, icons } from "../components/ui.jsx";

export default function FloorsPage() {
  const [floors,   setFloors]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({ name: "", capacity: 40, hostel: "Men's Hostel", description: "", status: "Active" });
  const [editId,   setEditId]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving,   setSaving]   = useState(false);

  async function loadFloors() {
    try {
      setLoading(true);
      const data = await api.getFloors();
      setFloors(data);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }

  useEffect(() => { loadFloors(); }, []);

  function openAdd() {
    setError("");
    const nums = floors.map(f => parseInt(f.name.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
    const nextNum = nums.length ? Math.max(...nums) + 1 : floors.length + 1;
    setForm({ name: `Floor ${nextNum}`, capacity: 40, hostel: "Men's Hostel", description: "", status: "Active" });
    setEditId(null);
    setModal("add");
  }

  function openEdit(f) {
    setError("");
    setForm({ name: f.name, capacity: f.capacity, hostel: f.hostel || "Men's Hostel", description: f.description || "", status: f.status || "Active" });
    setEditId(f.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!form.name || !form.capacity) return setError("Name and Capacity are required");
    try {
      setSaving(true);
      if (modal === "add") {
        await api.addFloor(form);
      } else {
        await api.updateFloor(editId, form);
      }
      setModal(null);
      loadFloors();
    } catch (e) { setError(e.message); }
    finally     { setSaving(false); }
  }

  async function handleDelete() {
    try {
      setSaving(true);
      await api.deleteFloor(deleteId);
      setDeleteId(null);
      loadFloors();
    } catch (e) { setError(e.message); }
    finally     { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <PageHeader title="Hostel Floors & Blocks" subtitle="Manage capacity, warden assignments, and floor layouts">
        <Btn icon="plus" onClick={openAdd}>Add New Floor</Btn>
      </PageHeader>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {floors.map(f => {
          const occ = f.occupied || f._count?.students || 0;
          const cap = f.capacity || 40;
          const pct = Math.min(100, Math.round((occ / cap) * 100));

          return (
            <div key={f.id} className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E5EA] flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold">
                      <Icon d={icons.building} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1D1D1F] text-base">{f.name}</h3>
                      <p className="text-xs text-[#86868B]">{f.hostel || "Main Hostel"}</p>
                    </div>
                  </div>
                  <Badge color={f.status === "Inactive" ? "gray" : pct >= 90 ? "amber" : "green"}>
                    {f.status || "Active"}
                  </Badge>
                </div>

                <p className="text-xs text-[#424245] mb-5 min-h-[36px]">{f.description || "Hostel residential level."}</p>

                {/* Occupancy bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#86868B]">Occupancy</span>
                    <span className="text-[#1D1D1F] tabular-nums">{occ} / {cap} Beds ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#F5F5F7] h-2.5 rounded-full overflow-hidden border border-[#E5E5EA]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 90 ? "bg-[#FF9500]" : "bg-[#0071E3]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#E5E5EA]">
                <Btn variant="ghost" size="sm" icon="edit" onClick={() => openEdit(f)}>Edit</Btn>
                <Btn variant="ghost" size="sm" icon="trash" onClick={() => setDeleteId(f.id)}>Delete</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Add Floor" : "Edit Floor"} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Floor Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Capacity (Beds)" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value, 10) })} />
            <Select label="Hostel Block" value={form.hostel} onChange={e => setForm({ ...form, hostel: e.target.value })}
              options={[{ value: "Men's Hostel", label: "Men's Hostel" }, { value: "Ladies Hostel", label: "Ladies Hostel" }]} />
            <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E5E5EA]">
            <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Floor"}</Btn>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Floor" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-[#1D1D1F] mb-6">Are you sure you want to delete this floor? All room allocations must be cleared first.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="outline" onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} disabled={saving}>Delete</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
