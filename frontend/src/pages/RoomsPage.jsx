import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Badge, Btn, PageHeader, Modal, Input, Select, ErrorBanner, Spinner } from "../components/ui.jsx";
import { icons, Icon } from "../components/ui.jsx";

const statusColor = { Occupied: "blue", Vacant: "green", Full: "amber" };

export default function RoomsPage() {
  const [rooms,   setRooms]   = useState([]);
  const [floors,  setFloors]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ id: "", floor: "", capacity: "3" });

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

  const floorOptions = [{ value: "", label: "Select floor" }, ...floors.map(f => {
    const num = parseInt(f.name.replace(/\D/g,""), 10) || f.id;
    return { value: String(num), label: f.name };
  })];

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Room Management"
        sub={`${rooms.length} rooms · ${rooms.filter(r => r.status === "Vacant").length} vacant`}
        actions={<Btn icon="plus" onClick={() => { setForm({ id: "", floor: "", capacity: "3" }); setModal("add"); }}>Add Room</Btn>}
      />
      <ErrorBanner msg={error} onDismiss={() => setError("")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {rooms.map(r => (
          <div key={r.id}
            style={{ background: r.status === "Vacant" ? "#0D2218" : "#162033", border: `1px solid ${r.status === "Vacant" ? "#16532B" : "#263548"}` }}
            className="rounded-xl p-4 group relative">
            <div className="text-xl font-bold text-white mb-1">{r.id}</div>
            <div className="text-xs text-slate-500 mb-2">Floor {r.floor}</div>
            <Badge color={statusColor[r.status]}>{r.status}</Badge>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: r.capacity }).map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full"
                  style={{ background: i < r.occupants ? "#3B82F6" : "#1E2E45" }} />
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">{r.occupants}/{r.capacity}</div>
            <button onClick={() => handleDelete(r.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400">
              <Icon d={icons.trash} size={13} />
            </button>
          </div>
        ))}
      </div>

      {modal === "add" && (
        <Modal title="Add Room" onClose={() => setModal(null)}>
          <ErrorBanner msg={error} onDismiss={() => setError("")} />
          <div className="flex flex-col gap-3">
            <Input label="Room Number *" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="e.g. 501" />
            <Select label="Floor *" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} options={floorOptions} />
            <Input label="Capacity *" type="number" min="1" max="10" value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!form.id || !form.floor || !form.capacity}>Add Room</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
