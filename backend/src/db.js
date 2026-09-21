const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Fallback in-memory store used when DB credentials are unset or connection fails
const fallbackStore = {
  floors: [
    { id: "f1", name: "Floor 1", capacity: 40, hostel: "Men's Hostel Block A", description: "First Floor - CSE/ECE", status: "Active", students: 18 },
    { id: "f2", name: "Floor 2", capacity: 35, hostel: "Men's Hostel Block A", description: "Second Floor - MECH", status: "Active", students: 14 },
    { id: "f3", name: "Floor 3", capacity: 35, hostel: "Men's Hostel Block A", description: "Third Floor - ECE", status: "Active", students: 15 },
    { id: "f4", name: "Floor 4", capacity: 30, hostel: "Men's Hostel Block A", description: "Fourth Floor - CIVIL", status: "Active", students: 10 }
  ],
  students: [
    { id: "s1", regNo: "22CS001", name: "Arjun Kumar", dept: "CSE", year: 2, semester: 3, section: "A", hostel: "Men's Hostel Block A", floor: 1, floorId: "f1", room: "101", status: "Active" },
    { id: "s2", regNo: "22CS002", name: "Priya Sharma", dept: "CSE", year: 2, semester: 3, section: "A", hostel: "Men's Hostel Block A", floor: 1, floorId: "f1", room: "101", status: "Active" },
    { id: "s3", regNo: "22ME001", name: "Vikram Reddy", dept: "MECH", year: 2, semester: 3, section: "B", hostel: "Men's Hostel Block A", floor: 2, floorId: "f2", room: "201", status: "Active" },
    { id: "s4", regNo: "22EC001", name: "Anitha Devi", dept: "ECE", year: 2, semester: 3, section: "A", hostel: "Men's Hostel Block A", floor: 3, floorId: "f3", room: "301", status: "Active" },
    { id: "s5", regNo: "22CE001", name: "Suresh Babu", dept: "CIVIL", year: 2, semester: 3, section: "A", hostel: "Men's Hostel Block A", floor: 4, floorId: "f4", room: "401", status: "Active" }
  ],
  rooms: [
    { id: "101", floor: 1, capacity: 3, occupants: 2, status: "Occupied" },
    { id: "102", floor: 1, capacity: 3, occupants: 0, status: "Vacant" },
    { id: "201", floor: 2, capacity: 3, occupants: 1, status: "Occupied" },
    { id: "301", floor: 3, capacity: 3, occupants: 1, status: "Occupied" },
    { id: "401", floor: 4, capacity: 3, occupants: 1, status: "Occupied" }
  ]
};

/**
 * Audit log helper that persists actions in the database.
 * Runs asynchronously (fire-and-forget) to match the synchronous caller signature.
 */
async function addLog(userEmail, action) {
  try {
    const user = await prisma.users.findUnique({ where: { email: userEmail } });
    await prisma.activityLog.create({
      data: {
        userEmail: userEmail || "system",
        action,
        userId: user ? user.id : null,
      },
    });
  } catch (err) {
    console.error("❌ DB Activity Log (Fallback Mode active):", err.message);
  }
}

/**
 * Resolves a floor number (e.g. 1) or floor ID (UUID) to the corresponding Floor record.
 */
async function getFloorByNumOrId(numOrId) {
  if (!numOrId) return null;
  try {
    let floor = await prisma.floors.findUnique({ where: { id: String(numOrId) } });
    if (floor) return floor;

    const floors = await prisma.floors.findMany();
    floor = floors.find(f => {
      const num = parseInt(f.name.replace(/\D/g, ""), 10);
      return String(num) === String(numOrId);
    });
    return floor || null;
  } catch (err) {
    // Fallback lookup
    return fallbackStore.floors.find(f => f.id === String(numOrId) || f.name.includes(String(numOrId))) || fallbackStore.floors[0];
  }
}

module.exports = {
  prisma,
  addLog,
  getFloorByNumOrId,
  fallbackStore,
};
