import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Modal, Input, Select, ErrorBanner, Spinner, Icon, icons } from "../components/ui.jsx";

const statusColor = { Occupied: "blue", Vacant: "green", Full: "amber" };

export default function RoomsPage() {
  const [rooms,   setRooms]   = useState([]);
  const [floors,  setFloors]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ id: "", floor: "", capacity: 3 });

  async function load() {
    try {
      setLoading(true);
      const [r, f] = await Promise.all([api.getRooms(), api.getFloors()]);
      setRooms(r);
      setFloors(f);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    setError("");
    try {
      const room = await api.addRoom(form);
      setRooms(prev => [...prev, room]);
      setModal(null);
    } catch (e) { setError(e.message); }
  }

  async function handleDelete(id) {
    try {
      await api.deleteRoom(id);
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (e) { setError(e.message); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <PageHeader title="Room Allocations" subtitle="Monitor room capacities, bed assignments, and vacancy status">
        <Btn icon="plus" onClick={() => { setForm({ id: "", floor: floors[0]?.name || "Floor 1", capacity: 3 }); setModal("add"); }}>
          Add Room
        </Btn>
      </PageHeader>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map(r => {
          const occ = r.occupied || 0;
          const cap = r.capacity || 3;
          const status = occ === 0 ? "Vacant" : occ >= cap ? "Full" : "Occupied";

          return (
            <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E5EA] flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-[#1D1D1F] text-base">Room {r.id}</span>
                  <Badge color={statusColor[status]}>{status}</Badge>
                </div>
                <p className="text-xs text-[#86868B] mb-4">{r.floor}</p>

                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-medium text-[#424245]">
                    <span>Occupants</span>
                    <span className="tabular-nums font-bold text-[#1D1D1F]">{occ} / {cap}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: cap }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                          i < occ ? "bg-[#0071E3]" : "bg-[#F5F5F7] border border-[#E5E5EA]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#E5E5EA]">
                <Btn variant="ghost" size="sm" icon="trash" onClick={() => handleDelete(r.id)} />
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="Add New Room" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Input label="Room Number / ID" placeholder="e.g. 101" value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} />
            <Select label="Assign Floor" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
              options={floors.map(f => ({ value: f.name, label: f.name }))} />
            <Input label="Max Bed Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value, 10) })} />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#E5E5EA]">
            <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleAdd}>Save Room</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
