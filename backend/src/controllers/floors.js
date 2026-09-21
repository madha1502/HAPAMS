const { prisma, addLog, fallbackStore } = require("../db.js");

// GET /api/floors
async function listFloors(req, res) {
  try {
    const floors = await prisma.floors.findMany({
      include: {
        _count: {
          select: {
            students: {
              where: { status: "Active" }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    const mapped = floors.map(f => ({
      id:          f.id,
      name:        f.name,
      capacity:    f.capacity,
      students:    f._count.students,
      hostel:      f.hostel,
      description: f.description || "",
      status:      f.status,
    }));

    res.json(mapped);
  } catch (error) {
    console.warn("⚠️ Database error on listFloors, returning fallback data:", error.message);
    res.json(fallbackStore.floors);
  }
}

// POST /api/floors
async function createFloor(req, res) {
  try {
    const { name, capacity, hostel, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Floor name is required." });
    }
    if (!capacity || isNaN(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({ error: "Capacity must be a positive number." });
    }

    const duplicate = await prisma.floors.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive"
        }
      }
    });

    if (duplicate) {
      return res.status(409).json({ error: `A floor named "${name.trim()}" already exists.` });
    }

    const newFloor = await prisma.floors.create({
      data: {
        name:        name.trim(),
        capacity:    Number(capacity),
        hostel:      hostel || "Men's Hostel",
        description: description || "",
        status:      status || "Active",
      }
    });

    addLog("admin@hostel.edu", `Added new floor: ${newFloor.name}`);
    res.status(201).json({ ...newFloor, students: 0 });
  } catch (error) {
    console.warn("⚠️ Database error on createFloor, adding to fallback store:", error.message);
    const newFloor = {
      id: "f_" + Date.now(),
      name: (req.body.name || "Floor").trim(),
      capacity: Number(req.body.capacity) || 30,
      hostel: req.body.hostel || "Men's Hostel Block A",
      description: req.body.description || "",
      status: req.body.status || "Active",
      students: 0
    };
    fallbackStore.floors.push(newFloor);
    res.status(201).json(newFloor);
  }
}

// PUT /api/floors/:id
async function updateFloor(req, res) {
  try {
    const { id } = req.params;
    const { name, capacity, hostel, description, status } = req.body;

    const floor = await prisma.floors.findUnique({ where: { id } });
    if (!floor) return res.status(404).json({ error: "Floor not found." });

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "Floor name cannot be empty." });

      if (name.trim().toLowerCase() !== floor.name.toLowerCase()) {
        const duplicate = await prisma.floors.findFirst({
          where: {
            id: { not: id },
            name: {
              equals: name.trim(),
              mode: "insensitive"
            }
          }
        });
        if (duplicate) {
          return res.status(409).json({ error: `A floor named "${name.trim()}" already exists.` });
        }
      }
      updateData.name = name.trim();
    }

    if (capacity !== undefined) {
      if (isNaN(Number(capacity)) || Number(capacity) < 1) {
        return res.status(400).json({ error: "Capacity must be a positive number." });
      }
      updateData.capacity = Number(capacity);
    }

    if (hostel !== undefined) updateData.hostel = hostel;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const updatedFloor = await prisma.floors.update({
      where: { id },
      data: updateData
    });

    const activeCount = await prisma.students.count({
      where: {
        floorId: id,
        status: "Active"
      }
    });

    addLog("admin@hostel.edu", `Updated floor: ${updatedFloor.name}`);
    res.json({ ...updatedFloor, students: activeCount });
  } catch (error) {
    console.warn("⚠️ Database error on updateFloor, updating fallback store:", error.message);
    const idx = fallbackStore.floors.findIndex(f => f.id === req.params.id);
    if (idx !== -1) {
      fallbackStore.floors[idx] = { ...fallbackStore.floors[idx], ...req.body };
      return res.json(fallbackStore.floors[idx]);
    }
    res.status(500).json({ error: "Failed to update floor." });
  }
}

// DELETE /api/floors/:id
async function deleteFloor(req, res) {
  try {
    const { id } = req.params;
    const floor = await prisma.floors.findUnique({ where: { id } });
    if (!floor) return res.status(404).json({ error: "Floor not found." });

    await prisma.floors.delete({ where: { id } });

    addLog("admin@hostel.edu", `Removed floor: ${floor.name}`);
    res.json({ message: `Floor "${floor.name}" removed.` });
  } catch (error) {
    console.warn("⚠️ Database error on deleteFloor, removing from fallback store:", error.message);
    fallbackStore.floors = fallbackStore.floors.filter(f => f.id !== req.params.id);
    res.json({ message: "Floor removed." });
  }
}

module.exports = {
  listFloors,
  createFloor,
  updateFloor,
  deleteFloor,
};
