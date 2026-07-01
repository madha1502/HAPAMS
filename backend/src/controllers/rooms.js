const { prisma, addLog, getFloorByNumOrId } = require("../db.js");

// GET /api/rooms
async function listRooms(req, res) {
  try {
    const { floor } = req.query;
    const filter = {};

    if (floor) {
      const floorRec = await getFloorByNumOrId(floor);
      if (floorRec) {
        filter.floorId = floorRec.id;
      } else {
        // Floor filter was specified but not found: return empty list
        return res.json([]);
      }
    }

    const rooms = await prisma.rooms.findMany({
      where: filter,
      include: {
        floor: true
      },
      orderBy: { id: "asc" }
    });

    // Bulk query active student room allocations to count occupants efficiently
    const activeOccupants = await prisma.students.groupBy({
      by: ["room"],
      _count: {
        _all: true
      },
      where: {
        status: "Active"
      }
    });

    const occupantMap = {};
    activeOccupants.forEach(item => {
      if (item.room) {
        occupantMap[item.room] = item._count._all;
      }
    });

    const mapped = rooms.map(r => {
      const occupantsCount = occupantMap[r.roomNumber] || 0;
      // Resolve status: Full if occupants >= capacity, Occupied if occupants > 0, else Vacant
      const calculatedStatus = occupantsCount >= r.capacity ? "Full" : occupantsCount > 0 ? "Occupied" : "Vacant";

      return {
        id:        r.id, // e.g. "101" (roomNumber)
        floor:     parseInt(r.floor.name.replace(/\D/g, ""), 10) || r.floor.id,
        capacity:  r.capacity,
        occupants: occupantsCount,
        status:    calculatedStatus,
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error("Error listing rooms:", error);
    res.status(500).json({ error: "Failed to fetch rooms." });
  }
}

// POST /api/rooms
async function createRoom(req, res) {
  try {
    const { id, floor, capacity } = req.body; // frontend sends id (room number), floor (number/id), capacity
    if (!id || !floor || !capacity) {
      return res.status(400).json({ error: "id, floor, and capacity are required." });
    }

    const floorRec = await getFloorByNumOrId(floor);
    if (!floorRec) {
      return res.status(404).json({ error: "Associated floor not found." });
    }

    const duplicate = await prisma.rooms.findUnique({
      where: { id: String(id) }
    });
    if (duplicate) {
      return res.status(409).json({ error: `Room ${id} already exists.` });
    }

    const newRoom = await prisma.rooms.create({
      data: {
        id:         String(id),
        roomNumber: String(id),
        floorId:    floorRec.id,
        capacity:   Number(capacity),
        status:     "Vacant"
      },
      include: {
        floor: true
      }
    });

    const roomResponse = {
      id:        newRoom.id,
      floor:     parseInt(newRoom.floor.name.replace(/\D/g, ""), 10) || newRoom.floor.id,
      capacity:  newRoom.capacity,
      occupants: 0,
      status:    "Vacant"
    };

    addLog("admin@hostel.edu", `Added room ${id} on Floor ${floor}`);
    res.status(201).json(roomResponse);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room." });
  }
}

// PUT /api/rooms/:id
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.rooms.findUnique({
      where: { id },
      include: { floor: true }
    });
    if (!room) return res.status(404).json({ error: "Room not found." });

    const updateData = {};
    if (req.body.capacity !== undefined) {
      updateData.capacity = Number(req.body.capacity);
    }
    if (req.body.floor !== undefined) {
      const floorRec = await getFloorByNumOrId(req.body.floor);
      if (!floorRec) return res.status(404).json({ error: "Floor not found." });
      updateData.floorId = floorRec.id;
    }

    const updatedRoom = await prisma.rooms.update({
      where: { id },
      data: updateData,
      include: { floor: true }
    });

    const occupantsCount = await prisma.students.count({
      where: { room: updatedRoom.roomNumber, status: "Active" }
    });
    const calculatedStatus = occupantsCount >= updatedRoom.capacity ? "Full" : occupantsCount > 0 ? "Occupied" : "Vacant";

    // Update status in the database
    const finalRoom = await prisma.rooms.update({
      where: { id },
      data: { status: calculatedStatus },
      include: { floor: true }
    });

    addLog("admin@hostel.edu", `Updated room ${finalRoom.id}`);

    res.json({
      id:        finalRoom.id,
      floor:     parseInt(finalRoom.floor.name.replace(/\D/g, ""), 10) || finalRoom.floor.id,
      capacity:  finalRoom.capacity,
      occupants: occupantsCount,
      status:    calculatedStatus,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ error: "Failed to update room." });
  }
}

// DELETE /api/rooms/:id
async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.rooms.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: "Room not found." });

    await prisma.rooms.delete({ where: { id } });

    addLog("admin@hostel.edu", `Removed room ${room.id}`);
    res.json({ message: `Room ${room.id} removed.` });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Failed to delete room." });
  }
}

module.exports = {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
};
