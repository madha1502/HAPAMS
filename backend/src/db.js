const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    console.error("❌ Failed to write activity log:", err.message);
  }
}

/**
 * Resolves a floor number (e.g. 1) or floor ID (UUID) to the corresponding Floor record.
 */
async function getFloorByNumOrId(numOrId) {
  if (!numOrId) return null;
  // 1. Try fetching by ID
  let floor = await prisma.floors.findUnique({ where: { id: String(numOrId) } });
  if (floor) return floor;

  // 2. Try matching by parsed number from the name (e.g. "Floor 1" contains "1")
  const floors = await prisma.floors.findMany();
  floor = floors.find(f => {
    const num = parseInt(f.name.replace(/\D/g, ""), 10);
    return String(num) === String(numOrId);
  });
  return floor || null;
}

module.exports = {
  prisma,
  addLog,
  getFloorByNumOrId,
};
